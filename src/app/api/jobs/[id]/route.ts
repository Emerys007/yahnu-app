import { z } from 'zod';

import { employmentTypes } from '@/lib/careers';
import { jobSelectColumns, safeHttpUrl, serializeJob, type JobRow } from '@/lib/careers-server';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const companyRoles = new Set<'company'>(['company']);
const idSchema = z.string().trim().min(1).max(1_500);
const optionalUrl = z.string().trim().max(2_048).nullable().optional().superRefine((value, context) => {
  if (value && !safeHttpUrl(value)) context.addIssue({ code: 'custom', message: 'Use a valid HTTP or HTTPS URL.' });
});
const updateSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  location: z.string().trim().max(200).nullable().optional(),
  employmentType: z.enum(employmentTypes).nullable().optional(),
  description: z.string().trim().min(20).max(100_000).optional(),
  status: z.enum(['draft', 'open', 'closed']).optional(),
  applicationUrl: optionalUrl,
  closesAt: z.string().trim().nullable().optional().refine(
    (value) => value === undefined || !value || !Number.isNaN(new Date(value).getTime()),
    'Enter a valid closing date.',
  ),
}).strict().refine((value) => Object.keys(value).length > 0, 'Provide at least one field to update.');

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const id = idSchema.parse((await context.params).id);
    const result = await query<JobRow>(`
      SELECT ${jobSelectColumns}
      FROM jobs j
      LEFT JOIN users owner ON owner.id = j.company_id AND owner.deleted_at IS NULL
      WHERE j.id = $1 AND j.status = 'open'
        AND (j.closes_at IS NULL OR j.closes_at > now())
    `, [id]);
    if (!result.rows[0]) throw new ApiError(404, 'job_not_found', 'This job is unavailable or has closed.');
    return jsonOk({ job: serializeJob(result.rows[0]) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(companyRoles);
    await enforceRateLimit(request, 'job-update', 60, 60 * 60, actor.uid);
    const id = idSchema.parse((await context.params).id);
    const input = updateSchema.parse(await readJson(request, 128 * 1024));

    const updated = await transaction(async (client) => {
      const currentResult = await client.query<JobRow>(`
        SELECT j.*, NULL::text AS owner_name, NULL::text AS owner_company_name
        FROM jobs j WHERE j.id = $1 AND j.company_id = $2 FOR UPDATE
      `, [id, actor.uid]);
      const current = currentResult.rows[0];
      if (!current) throw new ApiError(404, 'job_not_found', 'This job was not found.');

      const result = await client.query<JobRow>(`
        WITH changed AS (
          UPDATE jobs SET
            title = COALESCE($3, title),
            location = CASE WHEN $4 THEN $5 ELSE location END,
            employment_type = CASE WHEN $6 THEN $7 ELSE employment_type END,
            description = COALESCE($8, description),
            status = COALESCE($9, status),
            application_url = CASE WHEN $10 THEN $11 ELSE application_url END,
            closes_at = CASE WHEN $12 THEN $13::timestamptz ELSE closes_at END,
            updated_at = now()
          WHERE id = $1 AND company_id = $2
          RETURNING *
        )
        SELECT changed.id, changed.company_id, changed.title, changed.company_name,
          owner.name AS owner_name, owner.company_name AS owner_company_name,
          changed.location, changed.employment_type, changed.description,
          changed.status, changed.application_url, changed.closes_at,
          changed.created_at, changed.updated_at
        FROM changed JOIN users owner ON owner.id = changed.company_id
      `, [
        id,
        actor.uid,
        input.title ?? null,
        Object.hasOwn(input, 'location'),
        input.location || null,
        Object.hasOwn(input, 'employmentType'),
        input.employmentType || null,
        input.description ?? null,
        input.status ?? null,
        Object.hasOwn(input, 'applicationUrl'),
        input.applicationUrl ? safeHttpUrl(input.applicationUrl) : null,
        Object.hasOwn(input, 'closesAt'),
        input.closesAt ? new Date(input.closesAt).toISOString() : null,
      ]);
      await writeAuditLog(client, request, actor.uid, 'job.update', 'job', id, {
        fromStatus: current.status,
        toStatus: input.status ?? current.status,
        fields: Object.keys(input),
      });
      return result.rows[0];
    });

    if (!updated) throw new ApiError(500, 'job_update_failed', 'The job could not be updated.');
    return jsonOk({ job: serializeJob(updated) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(companyRoles);
    await enforceRateLimit(request, 'job-close', 30, 60 * 60, actor.uid);
    const id = idSchema.parse((await context.params).id);
    await transaction(async (client) => {
      const result = await client.query<{ status: string }>(`
        UPDATE jobs SET status = 'closed', updated_at = now()
        WHERE id = $1 AND company_id = $2
        RETURNING status
      `, [id, actor.uid]);
      if (!result.rows[0]) throw new ApiError(404, 'job_not_found', 'This job was not found.');
      await writeAuditLog(client, request, actor.uid, 'job.close', 'job', id);
    });
    return jsonOk({ closed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
