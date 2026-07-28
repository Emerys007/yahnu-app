import { z } from 'zod';

import { availabilityOptions, safeHttpsUrl, workModeOptions } from '@/lib/role-workspaces';
import { serializeTalentPreferences, type TalentProfileRow } from '@/lib/server/role-workspaces';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const graduateRoles = new Set<'graduate'>(['graduate']);
const listOf = (limit: number) => z.array(z.string().trim().min(1).max(120)).max(limit);
const portfolioSchema = z.object({
  label: z.string().trim().min(2).max(100),
  url: z.string().trim().max(2_048).refine((value) => Boolean(safeHttpsUrl(value)), 'Utilisez une URL HTTPS valide.'),
}).strict();
const preferencesSchema = z.object({
  visibilityConsent: z.boolean(),
  headline: z.string().trim().max(180),
  summary: z.string().trim().max(3_000),
  preferredRoles: listOf(20),
  preferredLocations: listOf(20),
  workModes: z.array(z.enum(workModeOptions)).max(workModeOptions.length),
  employmentTypes: listOf(10),
  availability: z.enum(availabilityOptions).nullable(),
  portfolioEvidence: z.array(portfolioSchema).max(12),
}).strict();

const columns = `
  user_id, visibility_consent, headline, summary, preferred_roles,
  preferred_locations, work_modes, employment_types, availability,
  portfolio_evidence, consented_at, withdrawn_at, updated_at
`;

export async function GET() {
  try {
    const actor = await requireUser(graduateRoles);
    const result = await query<TalentProfileRow>(`SELECT ${columns} FROM talent_profiles WHERE user_id = $1`, [actor.uid]);
    return jsonOk({ preferences: serializeTalentPreferences(result.rows[0] || null) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(graduateRoles);
    await enforceRateLimit(request, 'talent-preferences-update', 30, 60 * 60, actor.uid);
    const input = preferencesSchema.parse(await readJson(request, 128 * 1024));
    if (input.visibilityConsent && (input.headline.length < 20 || input.preferredRoles.length === 0)) {
      throw new ApiError(
        422,
        'talent_profile_incomplete',
        'Ajoutez un titre professionnel d’au moins 20 caractères et au moins un métier recherché avant d’être visible.',
      );
    }
    const saved = await transaction(async (client) => {
      const result = await client.query<TalentProfileRow>(`
        INSERT INTO talent_profiles (
          user_id, visibility_consent, headline, summary, preferred_roles,
          preferred_locations, work_modes, employment_types, availability,
          portfolio_evidence, consented_at, withdrawn_at
        ) VALUES (
          $1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb,
          $9, $10::jsonb, CASE WHEN $2 THEN now() ELSE NULL END,
          CASE WHEN $2 THEN NULL ELSE now() END
        )
        ON CONFLICT (user_id) DO UPDATE SET
          visibility_consent = EXCLUDED.visibility_consent,
          headline = EXCLUDED.headline,
          summary = EXCLUDED.summary,
          preferred_roles = EXCLUDED.preferred_roles,
          preferred_locations = EXCLUDED.preferred_locations,
          work_modes = EXCLUDED.work_modes,
          employment_types = EXCLUDED.employment_types,
          availability = EXCLUDED.availability,
          portfolio_evidence = EXCLUDED.portfolio_evidence,
          consented_at = CASE
            WHEN EXCLUDED.visibility_consent = true
              AND talent_profiles.visibility_consent = false THEN now()
            WHEN EXCLUDED.visibility_consent = true THEN talent_profiles.consented_at
            ELSE talent_profiles.consented_at
          END,
          withdrawn_at = CASE WHEN EXCLUDED.visibility_consent = false THEN now() ELSE NULL END
        RETURNING ${columns}
      `, [
        actor.uid,
        input.visibilityConsent,
        input.headline,
        input.summary,
        JSON.stringify(input.preferredRoles),
        JSON.stringify(input.preferredLocations),
        JSON.stringify(input.workModes),
        JSON.stringify(input.employmentTypes),
        input.availability,
        JSON.stringify(input.portfolioEvidence.map((entry) => ({
          label: entry.label,
          url: safeHttpsUrl(entry.url),
        }))),
      ]);
      await writeAuditLog(client, request, actor.uid, 'talent_profile.update', 'talent_profile', actor.uid, {
        visible: input.visibilityConsent,
        evidenceCount: input.portfolioEvidence.length,
      });
      return result.rows[0];
    });
    return jsonOk({ preferences: serializeTalentPreferences(saved) });
  } catch (error) {
    return handleApiError(error);
  }
}
