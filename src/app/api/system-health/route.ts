import type { Role } from '@/lib/auth-types';
import { requireUser } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { handleApiError, jsonOk } from '@/lib/server/http';

const operationsRoles: ReadonlySet<Role> = new Set(['admin', 'super_admin', 'support_staff']);

export async function GET() {
  try {
    await requireUser(operationsRoles);
    const started = performance.now();
    await query('SELECT 1');
    const databaseLatencyMs = Math.max(0, Math.round(performance.now() - started));
    const memory = process.memoryUsage();
    const status = databaseLatencyMs > 1_500 ? 'degraded' : 'operational';

    return jsonOk({
      status,
      checkedAt: new Date().toISOString(),
      metrics: {
        databaseLatencyMs,
        processUptimeSeconds: Math.round(process.uptime()),
        residentMemoryBytes: memory.rss,
        heapUsedBytes: memory.heapUsed,
      },
      release: {
        commit: process.env.RENDER_GIT_COMMIT?.slice(0, 12) ?? null,
        region: process.env.RENDER_REGION ?? null,
        node: process.version,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
