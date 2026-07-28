import { z } from 'zod';

import { requireUser } from '@/lib/server/auth';
import {
  assertSameOrigin,
  handleApiError,
  jsonOk,
  readJson,
} from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';
import { submitSkillsAttempt } from '@/lib/skills-checks-server';

const graduateRoles = new Set<'graduate'>(['graduate']);
const idSchema = z.string().uuid();
const submitSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string().trim().min(1).max(200),
    optionIndex: z.number().int().min(0).max(5),
  }).strict()).min(5).max(30),
  locale: z.enum(['fr', 'en']).default('fr'),
}).strict();

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(graduateRoles);
    await enforceRateLimit(request, 'skills-attempt-submit', 20, 24 * 60 * 60, actor.uid);
    const attemptId = idSchema.parse((await context.params).attemptId);
    const input = submitSchema.parse(await readJson(request, 32 * 1024));
    return jsonOk(await submitSkillsAttempt({
      request,
      attemptId,
      userId: actor.uid,
      answers: input.answers,
      locale: input.locale,
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
