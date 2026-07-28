import { z } from 'zod';

import { requireUser } from '@/lib/server/auth';
import {
  assertSameOrigin,
  handleApiError,
  jsonOk,
  readJson,
} from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';
import { reviewSkillsAttempt } from '@/lib/skills-checks-server';

const adminRoles = new Set<'admin' | 'super_admin'>(['admin', 'super_admin']);
const idSchema = z.string().uuid();
const reviewCategorySchema = z.enum([
  'focus_pattern',
  'external_evidence',
  'identity_mismatch',
  'other',
]);
const reviewSchema = z.object({
  decision: z.enum(['reviewed_clear', 'confirmed_concern']),
  category: reviewCategorySchema.optional(),
  note: z.string().trim().min(3).max(500).optional(),
}).strict().superRefine((input, context) => {
  if (input.decision === 'confirmed_concern' && (!input.category || !input.note)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: [!input.category ? 'category' : 'note'],
      message: 'Document the category and evidence before confirming a concern.',
    });
  }
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(adminRoles);
    await enforceRateLimit(request, 'skills-integrity-review', 100, 60 * 60, actor.uid);
    const attemptId = idSchema.parse((await context.params).attemptId);
    const input = reviewSchema.parse(await readJson(request, 4 * 1024));
    return jsonOk(await reviewSkillsAttempt({
      request,
      actorUserId: actor.uid,
      attemptId,
      decision: input.decision,
      category: input.category,
      note: input.note,
    }));
  } catch (error) {
    return handleApiError(error);
  }
}
