import { z } from 'zod';

import type { Role } from '@/lib/auth-types';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { approvedJobSource } from '@/lib/server/job-source-registry';
import { query, transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { listJobSources } from '@/lib/server/job-ingestion';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const jobOperationsRoles: ReadonlySet<Role> = new Set([
  'admin',
  'super_admin',
  'content_manager',
  'content_moderator',
]);
const updateSchema = z.object({
  sourceId: z.string().trim().min(1).max(100),
  enabled: z.boolean(),
}).strict();

export async function GET() {
  try {
    await requireUser(jobOperationsRoles);
    return jsonOk({ sources: await listJobSources() });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(jobOperationsRoles);
    await enforceRateLimit(request, 'job-source-toggle', 40, 60 * 60, actor.uid);
    const input = updateSchema.parse(await readJson(request, 8 * 1024));
    if (!approvedJobSource(input.sourceId)) {
      throw new ApiError(404, 'source_not_approved', 'Cette source ne fait pas partie du registre approuvé.');
    }

    await transaction(async (client) => {
      const changed = await client.query(`
        UPDATE job_sources SET enabled = $2, updated_at = now()
        WHERE id = $1
        RETURNING id
      `, [input.sourceId, input.enabled]);
      if (!changed.rows[0]) throw new ApiError(404, 'source_not_found', 'Cette source est introuvable.');
      await writeAuditLog(client, request, actor.uid, 'job_source.toggle', 'job_source', input.sourceId, {
        enabled: input.enabled,
      });
    });
    return jsonOk({ sources: await listJobSources() });
  } catch (error) {
    return handleApiError(error);
  }
}
