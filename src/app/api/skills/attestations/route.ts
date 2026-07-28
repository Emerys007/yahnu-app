import { z } from 'zod';

import { requireUser } from '@/lib/server/auth';
import { handleApiError, jsonOk } from '@/lib/server/http';
import { listSkillsAttestations } from '@/lib/skills-checks-server';

const graduateRoles = new Set<'graduate'>(['graduate']);
const querySchema = z.object({
  locale: z.enum(['fr', 'en']).default('fr'),
}).strict();

export async function GET(request: Request) {
  try {
    const actor = await requireUser(graduateRoles);
    const url = new URL(request.url);
    const input = querySchema.parse({
      locale: url.searchParams.get('locale') ?? undefined,
    });
    return jsonOk({
      attestations: await listSkillsAttestations(actor.uid, input.locale),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
