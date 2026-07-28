import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const graduateRoles = new Set<'graduate'>(['graduate']);
const inputSchema = z.object({
  jobKind: z.enum(['yahnu', 'external']),
  jobId: z.string().trim().min(1).max(300),
}).strict();

function savedId() {
  return `saved_${randomUUID().replaceAll('-', '')}`;
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(graduateRoles);
    await enforceRateLimit(request, 'job-save', 120, 60 * 60, user.uid);
    const input = inputSchema.parse(await readJson(request, 8 * 1024));

    await transaction(async (client) => {
      const available = input.jobKind === 'yahnu'
        ? await client.query(`
            SELECT id FROM jobs
            WHERE id = $1 AND status = 'open' AND (closes_at IS NULL OR closes_at > now())
          `, [input.jobId])
        : await client.query(`
            SELECT job.id FROM external_jobs job
            JOIN job_sources source ON source.id = job.source_id AND source.enabled = true
            WHERE job.id = $1 AND job.status = 'active' AND job.expires_at > now()
          `, [input.jobId]);
      if (!available.rows[0]) throw new ApiError(404, 'job_not_available', 'Cette opportunité n’est plus disponible.');

      await client.query(`
        INSERT INTO saved_jobs (id, graduate_id, job_kind, internal_job_id, external_job_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [
        savedId(),
        user.uid,
        input.jobKind,
        input.jobKind === 'yahnu' ? input.jobId : null,
        input.jobKind === 'external' ? input.jobId : null,
      ]);
      await writeAuditLog(client, request, user.uid, 'job.save', input.jobKind === 'yahnu' ? 'job' : 'external_job', input.jobId);
    });
    return jsonOk({ saved: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(graduateRoles);
    await enforceRateLimit(request, 'job-unsave', 120, 60 * 60, user.uid);
    const input = inputSchema.parse(await readJson(request, 8 * 1024));
    await query(`
      DELETE FROM saved_jobs
      WHERE graduate_id = $1
        AND job_kind = $2
        AND (
          ($2 = 'yahnu' AND internal_job_id = $3)
          OR ($2 = 'external' AND external_job_id = $3)
        )
    `, [user.uid, input.jobKind, input.jobId]);
    await writeAuditLog(null, request, user.uid, 'job.unsave', input.jobKind === 'yahnu' ? 'job' : 'external_job', input.jobId);
    return jsonOk({ saved: false });
  } catch (error) {
    return handleApiError(error);
  }
}
