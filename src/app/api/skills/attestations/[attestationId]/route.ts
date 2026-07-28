import { z } from 'zod';

import { requireUser } from '@/lib/server/auth';
import {
  assertSameOrigin,
  handleApiError,
  jsonOk,
  readJson,
} from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';
import { updateSkillsAttestation } from '@/lib/skills-checks-server';

const graduateRoles = new Set<'graduate'>(['graduate']);
const idSchema = z.string().uuid();
const updateSchema = z.object({
  action: z.enum(['publish', 'hide', 'revoke']),
  consent: z.boolean().optional(),
}).strict();

export async function PATCH(
  request: Request,
  context: { params: Promise<{ attestationId: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(graduateRoles);
    await enforceRateLimit(request, 'skills-attestation-update', 30, 60 * 60, actor.uid);
    const attestationId = idSchema.parse((await context.params).attestationId);
    const input = updateSchema.parse(await readJson(request, 4 * 1024));
    return jsonOk({
      attestation: await updateSkillsAttestation({
        request,
        attestationId,
        userId: actor.uid,
        action: input.action,
        consent: input.consent,
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
