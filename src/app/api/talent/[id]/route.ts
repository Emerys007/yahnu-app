import { serializeTalentCard, type TalentProfileRow } from '@/lib/server/role-workspaces';
import { requireUser } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { ApiError, handleApiError, jsonOk } from '@/lib/server/http';

const companyRoles = new Set<'company'>(['company']);

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireUser(companyRoles);
    const { id } = await context.params;
    const result = await query<TalentProfileRow>(`
      SELECT graduate.id AS user_id, graduate.name, graduate.school_name,
        graduate.skills, graduate.education, talent.visibility_consent,
        talent.headline, talent.summary, talent.preferred_roles,
        talent.preferred_locations, talent.work_modes, talent.employment_types,
        talent.availability, talent.portfolio_evidence,
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
        talent.consented_at,
        talent.withdrawn_at, shortlist.status AS shortlist_status,
        shortlist.note AS shortlist_note, talent.updated_at
      FROM talent_profiles talent
      JOIN users graduate ON graduate.id = talent.user_id
        AND graduate.role = 'graduate'
        AND graduate.status = 'active'
        AND graduate.deleted_at IS NULL
        AND graduate.email_verified_at IS NOT NULL
      LEFT JOIN talent_shortlists shortlist
        ON shortlist.organization_id = $1 AND shortlist.graduate_id = graduate.id
      WHERE graduate.id = $2
        AND talent.visibility_consent = true
        AND talent.consented_at IS NOT NULL
        AND talent.withdrawn_at IS NULL
    `, [actor.uid, id]);
    if (!result.rows[0]) throw new ApiError(404, 'talent_not_found', 'Ce profil n’est plus visible.');
    return jsonOk({ talent: serializeTalentCard(result.rows[0]) });
  } catch (error) {
    return handleApiError(error);
  }
}
