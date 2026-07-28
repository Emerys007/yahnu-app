import { z } from 'zod';

import { adminRoles } from '@/lib/auth-types';
import { requireUser } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { handleApiError, jsonOk } from '@/lib/server/http';
import { enforceRateLimit, enforceRateLimitSubject } from '@/lib/server/rate-limit';

const querySchema = z.object({
  status: z.enum(['pending', 'verified', 'rejected', 'unverified']).default('pending'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});

type VerificationRow = {
  user_id: string;
  role: 'company' | 'school';
  organization_name: string;
  account_email: string;
  slug: string;
  description: string;
  website_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  verification_status: 'pending' | 'verified' | 'rejected' | 'unverified';
  verification_requested_at: Date | string | null;
  verification_reviewed_at: Date | string | null;
  verification_note: string | null;
  updated_at: Date | string;
};

function serialize(row: VerificationRow) {
  return {
    id: row.user_id,
    role: row.role,
    organizationName: row.organization_name,
    accountEmail: row.account_email,
    slug: row.slug,
    description: row.description,
    websiteUrl: row.website_url,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    status: row.verification_status,
    requestedAt: row.verification_requested_at
      ? new Date(row.verification_requested_at).toISOString()
      : null,
    reviewedAt: row.verification_reviewed_at
      ? new Date(row.verification_reviewed_at).toISOString()
      : null,
    note: row.verification_note,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const actor = await requireUser(adminRoles);
    await enforceRateLimit(request, 'organization-verification-read', 120, 5 * 60, actor.uid);
    await enforceRateLimitSubject('organization-verification-read-account', 120, 5 * 60, actor.uid);
    const url = new URL(request.url);
    const input = querySchema.parse({
      status: url.searchParams.get('status') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    });
    const result = await query<VerificationRow>(`
      SELECT profile.user_id, organization.role,
        COALESCE(
          NULLIF(btrim(CASE
            WHEN organization.role = 'company' THEN organization.company_name
            ELSE organization.school_name
          END), ''),
          NULLIF(btrim(organization.name), ''),
          organization.email
        ) AS organization_name,
        organization.email AS account_email,
        profile.slug, profile.description, profile.website_url,
        profile.contact_name, profile.contact_email, profile.contact_phone,
        profile.verification_status, profile.verification_requested_at,
        profile.verification_reviewed_at, profile.verification_note, profile.updated_at
      FROM organization_profiles profile
      JOIN users organization
        ON organization.id = profile.user_id
        AND organization.role IN ('company', 'school')
        AND organization.status = 'active'
        AND organization.deleted_at IS NULL
      WHERE profile.verification_status = $1
      ORDER BY
        profile.verification_requested_at ASC NULLS LAST,
        profile.updated_at ASC,
        profile.user_id
      LIMIT $2 OFFSET $3
    `, [input.status, input.limit + 1, input.offset]);
    return jsonOk({
      requests: result.rows.slice(0, input.limit).map(serialize),
      hasMore: result.rows.length > input.limit,
      offset: input.offset,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
