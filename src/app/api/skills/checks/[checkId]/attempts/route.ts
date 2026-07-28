import { z } from 'zod';

import { requireUser } from '@/lib/server/auth';
import {
  assertSameOrigin,
  handleApiError,
  jsonOk,
  readJson,
} from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';
import { skillsAccommodationSchema } from '@/lib/skills-checks';
import { startSkillsAttempt } from '@/lib/skills-checks-server';

const graduateRoles = new Set<'graduate'>(['graduate']);
const idSchema = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120);
const startSchema = z.object({
  accommodationCode: skillsAccommodationSchema.default('none'),
  locale: z.enum(['fr', 'en']).default('fr'),
  verifiedConditionsAccepted: z.literal(true),
}).strict();

export async function POST(
  request: Request,
  context: { params: Promise<{ checkId: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(graduateRoles);
    await enforceRateLimit(request, 'skills-attempt-start', 12, 24 * 60 * 60, actor.uid);
    const checkId = idSchema.parse((await context.params).checkId);
    const input = startSchema.parse(await readJson(request, 8 * 1024));
    const attempt = await startSkillsAttempt({
      request,
      userId: actor.uid,
      checkId,
      accommodationCode: input.accommodationCode,
      locale: input.locale,
    });
    return jsonOk({ attempt }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
