import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { serializeApplication, type ApplicationRow } from '@/lib/careers-server';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';
import { sourceHash } from '@/lib/server/source-hash';

const applicationRoles = new Set<'graduate' | 'company'>(['graduate', 'company']);
const idSchema = z.string().trim().min(1).max(1_500);
const updateSchema = z.object({
  status: z.enum(['submitted', 'reviewing', 'shortlisted', 'interviewing', 'accepted', 'rejected', 'withdrawn']),
}).strict();
const companyStatuses = new Set(['submitted', 'reviewing', 'shortlisted', 'interviewing', 'accepted', 'rejected']);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(applicationRoles);
    await enforceRateLimit(request, 'job-application-update', 80, 60 * 60, actor.uid);
    const id = idSchema.parse((await context.params).id);
    const input = updateSchema.parse(await readJson(request, 4 * 1024));

    const updated = await transaction(async (client) => {
      const currentResult = await client.query<{
        id: string;
        status: string;
        applicant_id: string | null;
        company_id: string | null;
        job_id: string | null;
        job_title: string | null;
      }>(`
        SELECT application.id, application.status, application.applicant_id,
          job.company_id, application.job_id, job.title AS job_title
        FROM applications application
        LEFT JOIN jobs job ON job.id = application.job_id
        WHERE application.id = $1
        FOR UPDATE OF application
      `, [id]);
      const current = currentResult.rows[0];
      if (!current) throw new ApiError(404, 'application_not_found', 'This application was not found.');

      if (actor.role === 'graduate') {
        if (current.applicant_id !== actor.uid) throw new ApiError(404, 'application_not_found', 'This application was not found.');
        if (input.status !== 'withdrawn') throw new ApiError(403, 'invalid_application_action', 'Graduates may only withdraw their own application.');
        if (['accepted', 'rejected', 'withdrawn'].includes(current.status)) {
          throw new ApiError(409, 'application_finalized', 'This application can no longer be withdrawn.');
        }
      } else {
        if (current.company_id !== actor.uid) throw new ApiError(404, 'application_not_found', 'This application was not found.');
        if (!companyStatuses.has(input.status)) throw new ApiError(422, 'invalid_application_status', 'Select a valid applicant status.');
        if (current.status === 'withdrawn') throw new ApiError(409, 'application_withdrawn', 'A withdrawn application cannot be updated.');
      }

      await client.query('UPDATE applications SET status = $1, updated_at = now() WHERE id = $2', [input.status, id]);
      if (current.applicant_id && actor.role === 'company') {
        const notificationId = randomUUID();
        const notificationSource = { origin: 'render', applicationId: id, status: input.status, recipientId: current.applicant_id };
        await client.query(`
          INSERT INTO notifications (
            id, user_id, recipient_ref, created_by, actor_ref, type,
            title, body, link, payload, source_payload, source_hash
          ) VALUES ($1, $2, $2, $3, $3, 'application',
            'Application updated', $4, '/dashboard/applications', $5::jsonb, $5::jsonb, $6)
        `, [
          notificationId,
          current.applicant_id,
          actor.uid,
          `Your application for ${current.job_title || 'a job'} is now ${input.status.replaceAll('_', ' ')}.`,
          JSON.stringify(notificationSource),
          sourceHash(notificationSource),
        ]);
      }
      await writeAuditLog(client, request, actor.uid, 'application.status.update', 'application', id, {
        from: current.status,
        to: input.status,
        jobId: current.job_id,
      });

      const result = await client.query<ApplicationRow>(`
        SELECT application.id, application.job_id, job.title AS job_title,
          job.company_name AS job_company_name, company.name AS job_owner_name,
          job.status AS job_status, job.closes_at AS job_closes_at,
          application.applicant_id, applicant.name AS applicant_name,
          applicant.email AS applicant_email, application.status,
          application.cover_letter, application.resume_asset_id,
          application.submitted_at, application.updated_at
        FROM applications application
        LEFT JOIN jobs job ON job.id = application.job_id
        LEFT JOIN users company ON company.id = job.company_id
        LEFT JOIN users applicant ON applicant.id = application.applicant_id
        WHERE application.id = $1
      `, [id]);
      return result.rows[0];
    });

    return jsonOk({ application: serializeApplication(updated) });
  } catch (error) {
    return handleApiError(error);
  }
}
