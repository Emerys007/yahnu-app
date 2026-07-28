import { z } from 'zod';

import { availabilityOptions, escapedLikeContains } from '@/lib/role-workspaces';
import { serializeTalentCard, type TalentProfileRow } from '@/lib/server/role-workspaces';
import { requireUser } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { handleApiError, jsonOk } from '@/lib/server/http';

const companyRoles = new Set<'company'>(['company']);
const searchSchema = z.object({
  q: z.string().trim().max(120).default(''),
  location: z.string().trim().max(120).default(''),
  availability: z.enum(availabilityOptions).optional(),
  shortlisted: z.enum(['all', 'yes', 'no']).default('all'),
  limit: z.coerce.number().int().min(1).max(50).default(24),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});

const selectColumns = `
  graduate.id AS user_id, graduate.name, graduate.school_name, graduate.skills,
  graduate.education, talent.visibility_consent, talent.headline, talent.summary,
  talent.preferred_roles, talent.preferred_locations, talent.work_modes,
  talent.employment_types, talent.availability, talent.portfolio_evidence,
  COALESCE((
    SELECT jsonb_agg(attestation.item ORDER BY attestation.issued_at DESC)
    FROM (
      SELECT jsonb_build_object(
        'title', skill.title_fr,
        'score', credential.score,
        'issuedAt', credential.issued_at,
        'verificationCode', credential.verification_code
      ) AS item, credential.issued_at
      FROM skills_attestations credential
      JOIN skills_checks skill ON skill.id = credential.check_id
      WHERE credential.user_id = graduate.id
        AND credential.is_public = true
        AND credential.public_consent_at IS NOT NULL
        AND credential.revoked_at IS NULL
      ORDER BY credential.issued_at DESC
      LIMIT 8
    ) attestation
  ), '[]'::jsonb) AS public_attestations,
  talent.consented_at, talent.withdrawn_at, shortlist.status AS shortlist_status,
  shortlist.note AS shortlist_note, talent.updated_at
`;

export async function GET(request: Request) {
  try {
    const actor = await requireUser(companyRoles);
    const url = new URL(request.url);
    const input = searchSchema.parse({
      q: url.searchParams.get('q') ?? undefined,
      location: url.searchParams.get('location') ?? undefined,
      availability: url.searchParams.get('availability') ?? undefined,
      shortlisted: url.searchParams.get('shortlisted') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    });
    const result = await query<TalentProfileRow>(`
      SELECT ${selectColumns}
      FROM talent_profiles talent
      JOIN users graduate ON graduate.id = talent.user_id
        AND graduate.role = 'graduate'
        AND graduate.status = 'active'
        AND graduate.deleted_at IS NULL
        AND graduate.email_verified_at IS NOT NULL
      LEFT JOIN talent_shortlists shortlist
        ON shortlist.organization_id = $1 AND shortlist.graduate_id = graduate.id
      WHERE talent.visibility_consent = true
        AND talent.consented_at IS NOT NULL
        AND talent.withdrawn_at IS NULL
        AND (
          $2 = ''
          OR graduate.name ILIKE $2 ESCAPE E'\\\\'
          OR talent.headline ILIKE $2 ESCAPE E'\\\\'
          OR talent.summary ILIKE $2 ESCAPE E'\\\\'
          OR graduate.skills::text ILIKE $2 ESCAPE E'\\\\'
          OR talent.preferred_roles::text ILIKE $2 ESCAPE E'\\\\'
        )
        AND ($3 = '' OR talent.preferred_locations::text ILIKE $3 ESCAPE E'\\\\')
        AND ($4::text IS NULL OR talent.availability = $4)
        AND (
          $5 = 'all'
          OR ($5 = 'yes' AND shortlist.status IN ('saved', 'contacted'))
          OR ($5 = 'no' AND (shortlist.status IS NULL OR shortlist.status = 'archived'))
        )
      ORDER BY
        CASE WHEN shortlist.status IN ('saved', 'contacted') THEN 0 ELSE 1 END,
        talent.updated_at DESC, graduate.id
      LIMIT $6 OFFSET $7
    `, [
      actor.uid,
      input.q ? escapedLikeContains(input.q) : '',
      input.location ? escapedLikeContains(input.location) : '',
      input.availability || null,
      input.shortlisted,
      input.limit + 1,
      input.offset,
    ]);
    return jsonOk({
      talents: result.rows.slice(0, input.limit).map(serializeTalentCard),
      hasMore: result.rows.length > input.limit,
      nextOffset: input.offset + Math.min(input.limit, result.rows.length),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
