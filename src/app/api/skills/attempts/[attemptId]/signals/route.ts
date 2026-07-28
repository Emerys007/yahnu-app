import { z } from 'zod';

import { requireUser } from '@/lib/server/auth';
import {
  assertSameOrigin,
  handleApiError,
  jsonOk,
  readJson,
} from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';
import { integritySignalSchema } from '@/lib/skills-checks';
import { recordSkillsIntegritySignal } from '@/lib/skills-checks-server';

const graduateRoles = new Set<'graduate'>(['graduate']);
const idSchema = z.string().uuid();
const signalSchema = z.object({
  kind: integritySignalSchema,
  clientElapsedMs: z.number().int().min(0).max(7_200_000).optional(),
}).strict();

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(graduateRoles);
    await enforceRateLimit(request, 'skills-integrity-signal', 120, 60 * 60, actor.uid);
    const attemptId = idSchema.parse((await context.params).attemptId);
    const input = signalSchema.parse(await readJson(request, 4 * 1024));
    return jsonOk(await recordSkillsIntegritySignal({
      request,
      attemptId,
      userId: actor.uid,
      kind: input.kind,
      clientElapsedMs: input.clientElapsedMs,
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
