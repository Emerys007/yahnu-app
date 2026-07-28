import { z } from 'zod';

import { externalJobStatuses } from '@/lib/job-discovery';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const graduateRoles = new Set<'graduate'>(['graduate']);
const inputSchema = z.object({
  jobId: z.string().trim().min(1).max(300),
  status: z.enum(externalJobStatuses),
  candidateNote: z.string().trim().max(1_000).nullable().optional(),
  onlyIfUntracked: z.boolean().default(false),
}).strict();
const deleteSchema = z.object({ jobId: z.string().trim().min(1).max(300) }).strict();

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(graduateRoles);
    await enforceRateLimit(request, 'external-job-status', 120, 60 * 60, user.uid);
    const input = inputSchema.parse(await readJson(request, 8 * 1024));

    const status = await transaction(async (client) => {
      const available = await client.query(`
        SELECT id FROM external_jobs
        WHERE id = $1 AND status <> 'hidden'
      `, [input.jobId]);
      if (!available.rows[0]) throw new ApiError(404, 'job_not_available', 'Cette opportunité n’est plus disponible.');

      const result = await client.query<{ status: string }>(`
        INSERT INTO external_job_statuses (
          graduate_id, external_job_id, status, candidate_note, applied_at
        ) VALUES (
          $1, $2, $3, $4,
          CASE WHEN $3 = 'applied' THEN now() ELSE NULL END
        )
        ON CONFLICT (graduate_id, external_job_id) DO UPDATE SET
          status = CASE
            WHEN $5::boolean THEN external_job_statuses.status
            ELSE EXCLUDED.status
          END,
          candidate_note = CASE
            WHEN $5::boolean THEN external_job_statuses.candidate_note
            ELSE EXCLUDED.candidate_note
          END,
          candidate_declared_at = CASE
            WHEN $5::boolean THEN external_job_statuses.candidate_declared_at
            ELSE now()
          END,
          applied_at = CASE
            WHEN $5::boolean THEN external_job_statuses.applied_at
            WHEN EXCLUDED.status = 'applied' THEN coalesce(external_job_statuses.applied_at, now())
            ELSE external_job_statuses.applied_at
          END,
          employer_confirmed = false,
          updated_at = now()
        RETURNING status
      `, [user.uid, input.jobId, input.status, input.candidateNote || null, input.onlyIfUntracked]);
      await writeAuditLog(client, request, user.uid, 'external_job.status.declare', 'external_job', input.jobId, {
        status: result.rows[0]?.status,
        candidateDeclared: true,
      });
      return result.rows[0]?.status;
    });
    return jsonOk({ status, employerConfirmed: false });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(graduateRoles);
    await enforceRateLimit(request, 'external-job-status-clear', 120, 60 * 60, user.uid);
    const input = deleteSchema.parse(await readJson(request, 8 * 1024));
    const cleared = await transaction(async (client) => {
      const result = await client.query<{ external_job_id: string }>(`
        DELETE FROM external_job_statuses
        WHERE graduate_id = $1 AND external_job_id = $2
        RETURNING external_job_id
      `, [user.uid, input.jobId]);
      if (!result.rows[0]) return false;
      await writeAuditLog(client, request, user.uid, 'external_job.status.clear', 'external_job', input.jobId);
      return true;
    });
    return jsonOk({ status: null, employerConfirmed: false, cleared });
  } catch (error) {
    return handleApiError(error);
  }
}
