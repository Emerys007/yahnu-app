import 'server-only';

import { query } from '@/lib/server/db';

export const publicOrganizationRoles = ['company', 'school'] as const;
export type PublicOrganizationRole = (typeof publicOrganizationRoles)[number];

type PublicOrganizationRow = {
  id: string;
  organization_name: string | null;
  industry: string | null;
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
  name: string;
  industry: string | null;
  openJobCount: number;
};

export type PublicCompanyJob = {
  id: string;
  title: string;
  location: string | null;
  employmentType: string | null;
};

const publicOrganizationColumns = `
  u.id,
  COALESCE(
    NULLIF(BTRIM(CASE WHEN u.role = 'company' THEN u.company_name ELSE u.school_name END), ''),
    NULLIF(BTRIM(u.name), '')
  ) AS organization_name,
  NULLIF(BTRIM(u.industry), '') AS industry,
  COUNT(j.id)::integer AS open_job_count
`;

function serializeOrganization(row: PublicOrganizationRow): PublicOrganization {
  const parsedJobCount = Number(row.open_job_count);
  return {
    id: row.id,
    name: row.organization_name?.trim() || 'Organisation partenaire Yahnu',
    industry: row.industry?.trim() || null,
    openJobCount: Number.isFinite(parsedJobCount) && parsedJobCount > 0 ? parsedJobCount : 0,
  };
}

function validOrganizationId(value: string) {
  return value.length > 0 && value.length <= 200 && !/[\u0000-\u001f\u007f]/.test(value);
}

export async function listPublicOrganizations(role: PublicOrganizationRole, limit = 100) {
  const boundedLimit = Math.min(Math.max(limit, 1), 100);
  const result = await query<PublicOrganizationRow>(`
    SELECT ${publicOrganizationColumns}
    FROM users u
    LEFT JOIN jobs j
      ON j.company_id = u.id
      AND j.status = 'open'
      AND (j.closes_at IS NULL OR j.closes_at > now())
    WHERE u.role = $1
      AND u.status = 'active'
      AND u.deleted_at IS NULL
    GROUP BY u.id, u.role, u.company_name, u.school_name, u.name, u.industry
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

export async function getPublicOrganizationById(role: PublicOrganizationRole, id: string) {
  if (!validOrganizationId(id)) return null;

  const result = await query<PublicOrganizationRow>(`
    SELECT ${publicOrganizationColumns}
    FROM users u
    LEFT JOIN jobs j
      ON j.company_id = u.id
      AND j.status = 'open'
      AND (j.closes_at IS NULL OR j.closes_at > now())
    WHERE u.id = $1
      AND u.role = $2
      AND u.status = 'active'
      AND u.deleted_at IS NULL
    GROUP BY u.id, u.role, u.company_name, u.school_name, u.name, u.industry
  `, [id, role]);

  return result.rows[0] ? serializeOrganization(result.rows[0]) : null;
}

export async function listPublicCompanyJobs(companyId: string, limit = 20): Promise<PublicCompanyJob[]> {
  if (!validOrganizationId(companyId)) return [];
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
