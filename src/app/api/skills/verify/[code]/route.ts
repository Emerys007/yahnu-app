import { z } from 'zod';

import { handleApiError, jsonOk } from '@/lib/server/http';
import { publicSkillsAttestation } from '@/lib/skills-checks-server';

const codeSchema = z.string().regex(/^[A-Za-z0-9_-]{32,64}$/);
const querySchema = z.object({
  locale: z.enum(['fr', 'en']).default('fr'),
}).strict();

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  try {
    const code = codeSchema.parse((await context.params).code);
    const url = new URL(request.url);
    const input = querySchema.parse({
      locale: url.searchParams.get('locale') ?? undefined,
    });
    const attestation = await publicSkillsAttestation(code, input.locale);
    return jsonOk({ attestation });
  } catch (error) {
    return handleApiError(error);
  }
}
