import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { employmentTypes } from '@/lib/careers';
import { jobSelectColumns, publicJobListSelectColumns, serializeJob, type JobRow, safeHttpUrl } from '@/lib/careers-server';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';
import { sourceHash } from '@/lib/server/source-hash';

const companyRoles = new Set<'company'>(['company']);
const listSchema = z.object({
  scope: z.enum(['public', 'mine']).default('public'),
  q: z.string().trim().max(120).default(''),
  location: z.string().trim().max(120).default(''),
  employmentType: z.string().trim().max(100).default(''),
  status: z.enum(['all', 'draft', 'open', 'closed']).default('all'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
}).strict();

const optionalUrl = z.string().trim().max(2_048).nullable().optional().superRefine((value, context) => {
  if (value && !safeHttpUrl(value)) context.addIssue({ code: 'custom', message: 'Use a valid HTTP or HTTPS URL.' });
});

const jobInputSchema = z.object({
  title: z.string().trim().min(3).max(160),
  location: z.string().trim().max(200).nullable().optional(),
  employmentType: z.enum(employmentTypes).nullable().optional(),
  description: z.string().trim().min(20).max(100_000),
  status: z.enum(['draft', 'open', 'closed']).default('draft'),
  applicationUrl: optionalUrl,
  closesAt: z.string().trim().nullable().optional().refine(
    (value) => !value || !Number.isNaN(new Date(value).getTime()),
    'Enter a valid closing date.',
  ),
}).strict();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const input = listSchema.parse({
      scope: url.searchParams.get('scope') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      location: url.searchParams.get('location') ?? undefined,
      employmentType: url.searchParams.get('employmentType') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    });

    if (input.scope === 'mine') {
      const actor = await requireUser(companyRoles);
      const result = await query<JobRow>(`
        SELECT ${jobSelectColumns}, count(application.id)::integer AS application_count
        FROM jobs j
        LEFT JOIN users owner ON owner.id = j.company_id AND owner.deleted_at IS NULL
        LEFT JOIN applications application ON application.job_id = j.id
        WHERE j.company_id = $1
          AND ($2 = '' OR j.title ILIKE $2 OR j.description ILIKE $2 OR j.location ILIKE $2)
          AND ($3 = 'all' OR j.status = $3)
        GROUP BY j.id, owner.id
        ORDER BY j.updated_at DESC, j.id
        LIMIT $4 OFFSET $5
      `, [actor.uid, input.q ? `%${input.q}%` : '', input.status, input.limit + 1, input.offset]);
      return jsonOk({
        jobs: result.rows.slice(0, input.limit).map(serializeJob),
        hasMore: result.rows.length > input.limit,
        nextOffset: input.offset + Math.min(input.limit, result.rows.length),
      });
    }

    const result = await query<JobRow>(`
      SELECT ${publicJobListSelectColumns}
      FROM jobs j
      LEFT JOIN users owner ON owner.id = j.company_id AND owner.deleted_at IS NULL
      WHERE j.status = 'open'
        AND (j.closes_at IS NULL OR j.closes_at > now())
        AND ($1 = '' OR j.title ILIKE $1 OR j.description ILIKE $1 OR j.company_name ILIKE $1 OR owner.company_name ILIKE $1)
        AND ($2 = '' OR j.location ILIKE $2)
        AND ($3 = '' OR j.employment_type = $3)
      ORDER BY j.created_at DESC, j.id
      LIMIT $4 OFFSET $5
    `, [
      input.q ? `%${input.q}%` : '',
      input.location ? `%${input.location}%` : '',
      input.employmentType,
      input.limit + 1,
      input.offset,
    ]);
    return jsonOk({
      jobs: result.rows.slice(0, input.limit).map(serializeJob),
      hasMore: result.rows.length > input.limit,
      nextOffset: input.offset + Math.min(input.limit, result.rows.length),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(companyRoles);
    await enforceRateLimit(request, 'job-create', 20, 60 * 60, actor.uid);
    const input = jobInputSchema.parse(await readJson(request, 128 * 1024));
    const id = randomUUID();
    const metadata = { origin: 'render', createdBy: actor.uid, entity: 'job' };

    const created = await transaction(async (client) => {
      const result = await client.query<JobRow>(`
        WITH inserted AS (
          INSERT INTO jobs (
            id, company_id, company_ref, title, company_name, location,
            employment_type, description, status, application_url, closes_at,
            source_payload, source_hash, source_updated_at
          ) VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11::jsonb, $12, now())
          RETURNING *
        )
        SELECT inserted.id, inserted.company_id, inserted.title, inserted.company_name,
          owner.name AS owner_name, owner.company_name AS owner_company_name,
          inserted.location, inserted.employment_type, inserted.description,
          inserted.status, inserted.application_url, inserted.closes_at,
          inserted.created_at, inserted.updated_at
        FROM inserted
        JOIN users owner ON owner.id = inserted.company_id
      `, [
        id,
        actor.uid,
        input.title,
        actor.companyName || actor.name || 'Yahnu employer',
        input.location || null,
        input.employmentType || null,
        input.description,
        input.status,
        input.applicationUrl ? safeHttpUrl(input.applicationUrl) : null,
        input.closesAt ? new Date(input.closesAt).toISOString() : null,
        JSON.stringify(metadata),
        sourceHash(metadata),
      ]);
      await writeAuditLog(client, request, actor.uid, 'job.create', 'job', id, { status: input.status });
      return result.rows[0];
    });

    if (!created) throw new ApiError(500, 'job_create_failed', 'The job could not be created.');
    return jsonOk({ job: serializeJob(created) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
