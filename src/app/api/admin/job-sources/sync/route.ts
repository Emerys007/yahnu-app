import { z } from 'zod';

import type { Role } from '@/lib/auth-types';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { approvedJobSource } from '@/lib/server/job-source-registry';
import { assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { listJobSources, refreshStaleJobSources, syncJobSource } from '@/lib/server/job-ingestion';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const jobOperationsRoles: ReadonlySet<Role> = new Set([
  'admin',
  'super_admin',
  'content_manager',
  'content_moderator',
]);
const inputSchema = z.object({
  sourceId: z.string().trim().min(1).max(100).nullable().optional(),
}).strict();

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(jobOperationsRoles);
    await enforceRateLimit(request, 'job-source-sync', 15, 60 * 60, actor.uid);
    const input = inputSchema.parse(await readJson(request, 8 * 1024));
    if (input.sourceId && !approvedJobSource(input.sourceId)) {
      return Response.json({
        error: { code: 'source_not_approved', message: 'Cette source ne fait pas partie du registre approuvé.' },
      }, { status: 404 });
    }

    const results = input.sourceId
      ? [await syncJobSource(input.sourceId, true)]
      : await refreshStaleJobSources({ force: true });
    await writeAuditLog(null, request, actor.uid, 'job_sources.sync', 'job_source', input.sourceId ?? 'all', {
      results: results.map((result) => ({
        sourceId: result.sourceId,
        status: result.status,
        itemCount: result.itemCount,
        errorCode: result.errorCode ?? null,
      })),
    });
    return jsonOk({ results, sources: await listJobSources() });
  } catch (error) {
    return handleApiError(error);
  }
}
