import 'server-only';

import { safeHttpsUrl } from '@/lib/role-workspaces';
import { query } from '@/lib/server/db';

export const publicOrganizationRoles = ['company', 'school'] as const;
export type PublicOrganizationRole = (typeof publicOrganizationRoles)[number];

type JsonArray = unknown[] | string | null;

type PublicOrganizationRow = {
  id: string;
  slug: string;
  organization_name: string | null;
  industry: string | null;
  description: string;
  website_url: string | null;
  locations: JsonArray;
  organization_size: string | null;
  organization_type: string | null;
  programs: JsonArray;
  benefits: JsonArray;
  culture: JsonArray;
  logo_asset_id: string | null;
  cover_asset_id: string | null;
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  published_at: Date | string;
  updated_at: Date | string;
  open_job_count: number | string;
};

type PublicCompanyJobRow = {
  id: string;
  title: string;
  location: string | null;
  employment_type: string | null;
};

export type PublicOrganization = {
  id: string;
  slug: string;
  name: string;
  industry: string | null;
  description: string;
  websiteUrl: string | null;
  locations: string[];
  organizationSize: string | null;
  organizationType: string | null;
  programs: string[];
  benefits: string[];
  culture: string[];
  logoUrl: string | null;
  coverUrl: string | null;
  verificationStatus: PublicOrganizationRow['verification_status'];
  publishedAt: string;
  updatedAt: string;
  openJobCount: number;
};

export type PublicOrganizationResolution = {
  organization: PublicOrganization;
  matchedLegacyId: boolean;
};

export type PublicCompanyJob = {
  id: string;
  title: string;
  location: string | null;
  employmentType: string | null;
};

const publicOrganizationColumns = `
  u.id,
  profile.slug,
  COALESCE(
    NULLIF(BTRIM(CASE WHEN u.role = 'company' THEN u.company_name ELSE u.school_name END), ''),
    NULLIF(BTRIM(u.name), '')
  ) AS organization_name,
  NULLIF(BTRIM(u.industry), '') AS industry,
  profile.description,
  profile.website_url,
  profile.locations,
  profile.organization_size,
  profile.organization_type,
  profile.programs,
  profile.benefits,
  profile.culture,
  profile.logo_asset_id,
  profile.cover_asset_id,
  profile.verification_status,
  profile.published_at,
  profile.updated_at,
  COUNT(j.id)::integer AS open_job_count
`;

function parseArray(value: JsonArray) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String).map((item) => item.trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function serializeOrganization(row: PublicOrganizationRow): PublicOrganization {
  const parsedJobCount = Number(row.open_job_count);
  return {
    id: row.id,
    slug: row.slug,
    name: row.organization_name?.trim() || 'Organisation Yahnu',
    industry: row.industry?.trim() || null,
    description: row.description.trim(),
    websiteUrl: safeHttpsUrl(row.website_url),
    locations: parseArray(row.locations),
    organizationSize: row.organization_size,
    organizationType: row.organization_type,
    programs: parseArray(row.programs),
    benefits: parseArray(row.benefits),
    culture: parseArray(row.culture),
    logoUrl: row.logo_asset_id ? `/api/media/${encodeURIComponent(row.logo_asset_id)}` : null,
    coverUrl: row.cover_asset_id ? `/api/media/${encodeURIComponent(row.cover_asset_id)}` : null,
    verificationStatus: row.verification_status,
    publishedAt: new Date(row.published_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    openJobCount: Number.isFinite(parsedJobCount) && parsedJobCount > 0 ? parsedJobCount : 0,
  };
}

function validOrganizationLookup(value: string) {
  return value.length > 0 && value.length <= 200 && !/[\u0000-\u001f\u007f]/.test(value);
}

const publicationPredicate = `
  profile.public_publish_consent = true
  AND profile.published_at IS NOT NULL
  AND char_length(btrim(profile.description)) >= 80
  AND jsonb_array_length(profile.locations) > 0
`;

export async function listPublicOrganizations(role: PublicOrganizationRole, limit = 100) {
  const boundedLimit = Math.min(Math.max(limit, 1), 100);
  const result = await query<PublicOrganizationRow>(`
    SELECT ${publicOrganizationColumns}
    FROM organization_profiles profile
    JOIN users u
      ON u.id = profile.user_id
      AND u.role = $1
      AND u.status = 'active'
      AND u.deleted_at IS NULL
    LEFT JOIN jobs j
      ON j.company_id = u.id
      AND j.status = 'open'
      AND (j.closes_at IS NULL OR j.closes_at > now())
    WHERE ${publicationPredicate}
    GROUP BY u.id, profile.user_id
    ORDER BY lower(
      COALESCE(
        NULLIF(BTRIM(CASE WHEN u.role = 'company' THEN u.company_name ELSE u.school_name END), ''),
        NULLIF(BTRIM(u.name), '')
      )
    ), u.id
    LIMIT $2
  `, [role, boundedLimit]);

  return result.rows.map(serializeOrganization);
}

export async function resolvePublicOrganization(
  role: PublicOrganizationRole,
  slugOrLegacyId: string,
): Promise<PublicOrganizationResolution | null> {
  if (!validOrganizationLookup(slugOrLegacyId)) return null;
  const result = await query<PublicOrganizationRow & { matched_legacy_id: boolean }>(`
    SELECT ${publicOrganizationColumns},
      (u.id = $1 AND profile.slug <> $1) AS matched_legacy_id
    FROM organization_profiles profile
    JOIN users u
      ON u.id = profile.user_id
      AND u.role = $2
      AND u.status = 'active'
      AND u.deleted_at IS NULL
    LEFT JOIN jobs j
      ON j.company_id = u.id
      AND j.status = 'open'
      AND (j.closes_at IS NULL OR j.closes_at > now())
    WHERE (profile.slug = $1 OR u.id = $1)
      AND ${publicationPredicate}
    GROUP BY u.id, profile.user_id
  `, [slugOrLegacyId, role]);
  const row = result.rows[0];
  return row ? { organization: serializeOrganization(row), matchedLegacyId: row.matched_legacy_id } : null;
}

// Kept as a compatibility helper for existing route imports. It resolves the
// canonical public slug first and only then accepts a legacy user ID.
export async function getPublicOrganizationById(role: PublicOrganizationRole, lookup: string) {
  return (await resolvePublicOrganization(role, lookup))?.organization ?? null;
}

export async function listPublicCompanyJobs(companyId: string, limit = 20): Promise<PublicCompanyJob[]> {
  if (!validOrganizationLookup(companyId)) return [];
  const boundedLimit = Math.min(Math.max(limit, 1), 20);
  const result = await query<PublicCompanyJobRow>(`
    SELECT id, title, location, employment_type
    FROM jobs
    WHERE company_id = $1
      AND status = 'open'
      AND (closes_at IS NULL OR closes_at > now())
    ORDER BY created_at DESC, id
    LIMIT $2
  `, [companyId, boundedLimit]);

  return result.rows.map((job) => ({
    id: job.id,
    title: job.title,
    location: job.location,
    employmentType: job.employment_type,
  }));
}
