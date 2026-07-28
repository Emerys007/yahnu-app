import { z } from 'zod';

import { requireUser } from '@/lib/server/auth';
import { handleApiError, jsonOk } from '@/lib/server/http';
import { listSkillsReviewQueue } from '@/lib/skills-checks-server';

const adminRoles = new Set<'admin' | 'super_admin'>(['admin', 'super_admin']);
const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
}).strict();

export async function GET(request: Request) {
  try {
    await requireUser(adminRoles);
    const url = new URL(request.url);
    const input = querySchema.parse({
      limit: url.searchParams.get('limit') ?? undefined,
    });
    return jsonOk({ attempts: await listSkillsReviewQueue(input.limit) });
  } catch (error) {
    return handleApiError(error);
  }
}
