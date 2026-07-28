import { z } from 'zod';

import type { Role } from '@/lib/auth-types';
import { escapeLikePattern } from '@/lib/job-discovery';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const jobOperationsRoles: ReadonlySet<Role> = new Set([
  'admin',
  'super_admin',
  'content_manager',
  'content_moderator',
]);
const querySchema = z.object({
  q: z.string().trim().max(120).default(''),
  status: z.enum(['all', 'active', 'expired', 'hidden']).default('all'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
}).strict();
const moderateSchema = z.object({
  jobId: z.string().trim().min(1).max(100),
  status: z.enum(['active', 'hidden']),
  note: z.string().trim().max(1_000).nullable().optional(),
}).strict();

type ExternalJobRow = {
  id: string;
  title: string;
  company_name: string;
  location: string | null;
  employment_type: string | null;
  workplace_type: string | null;
  status: 'active' | 'expired' | 'hidden';
  canonical_url: string;
  source_id: string;
  source_name: string;
  official_domain: string;
  source_updated_at: Date | string | null;
  last_seen_at: Date | string;
  expires_at: Date | string;
  moderation_note: string | null;
};

function serialize(row: ExternalJobRow) {
  return {
    id: row.id,
    title: row.title,
    companyName: row.company_name,
    location: row.location,
    employmentType: row.employment_type,
    workplaceType: row.workplace_type,
    status: row.status,
    canonicalUrl: row.canonical_url,
    sourceId: row.source_id,
    sourceName: row.source_name,
    officialDomain: row.official_domain,
    sourceUpdatedAt: row.source_updated_at ? new Date(row.source_updated_at).toISOString() : null,
    lastSeenAt: new Date(row.last_seen_at).toISOString(),
    expiresAt: new Date(row.expires_at).toISOString(),
    moderationNote: row.moderation_note,
  };
}

export async function GET(request: Request) {
  try {
    await requireUser(jobOperationsRoles);
    const url = new URL(request.url);
    const input = querySchema.parse({
      q: url.searchParams.get('q') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    });
    const result = await query<ExternalJobRow>(`
      SELECT job.id, job.title, job.company_name, job.location,
        job.employment_type, job.workplace_type, job.status, job.canonical_url,
        job.source_id, source.organization_name AS source_name, source.official_domain,
        job.source_updated_at, job.last_seen_at, job.expires_at, job.moderation_note
      FROM external_jobs job
      JOIN job_sources source ON source.id = job.source_id
      WHERE ($1 = 'all' OR job.status = $1)
        AND (
          $2 = ''
          OR job.title ILIKE $2 ESCAPE '\'
          OR job.company_name ILIKE $2 ESCAPE '\'
          OR job.location ILIKE $2 ESCAPE '\'
        )
      ORDER BY
        CASE job.status WHEN 'hidden' THEN 0 WHEN 'active' THEN 1 ELSE 2 END,
        job.last_seen_at DESC,
        job.id
      LIMIT $3 OFFSET $4
    `, [
      input.status,
      input.q ? `%${escapeLikePattern(input.q)}%` : '',
      input.limit + 1,
      input.offset,
    ]);
    return jsonOk({
      jobs: result.rows.slice(0, input.limit).map(serialize),
      hasMore: result.rows.length > input.limit,
      nextOffset: input.offset + Math.min(input.limit, result.rows.length),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(jobOperationsRoles);
    await enforceRateLimit(request, 'external-job-moderate', 100, 60 * 60, actor.uid);
    const input = moderateSchema.parse(await readJson(request, 8 * 1024));
    const updated = await transaction(async (client) => {
      const result = await client.query<ExternalJobRow>(`
        WITH changed AS (
          UPDATE external_jobs SET
            status = CASE
              WHEN $2 = 'hidden' THEN 'hidden'
              WHEN expires_at > now() THEN 'active'
              ELSE 'expired'
            END,
            moderated_by = $3,
            moderated_at = now(),
            moderation_note = $4,
            updated_at = now()
          WHERE id = $1
          RETURNING *
        )
        SELECT changed.id, changed.title, changed.company_name, changed.location,
          changed.employment_type, changed.workplace_type, changed.status,
          changed.canonical_url, changed.source_id,
          source.organization_name AS source_name, source.official_domain,
          changed.source_updated_at, changed.last_seen_at, changed.expires_at,
          changed.moderation_note
        FROM changed
        JOIN job_sources source ON source.id = changed.source_id
      `, [input.jobId, input.status, actor.uid, input.note || null]);
      if (!result.rows[0]) throw new ApiError(404, 'external_job_not_found', 'Cette offre est introuvable.');
      await writeAuditLog(client, request, actor.uid, 'external_job.moderate', 'external_job', input.jobId, {
        requestedStatus: input.status,
        resultingStatus: result.rows[0].status,
      });
      return serialize(result.rows[0]);
    });
    return jsonOk({ job: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
