import 'server-only';

import type { Job, JobApplication, Partnership, PartnershipDirectoryEntry } from '@/lib/careers';

export type JobRow = {
  id: string;
  company_id: string | null;
  title: string;
  company_name: string | null;
  owner_name?: string | null;
  owner_company_name?: string | null;
  location: string | null;
  employment_type: string | null;
  description: string;
  status: string;
  application_url: string | null;
  closes_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  application_count?: number | string;
};

export const jobSelectColumns = `
  j.id, j.company_id, j.title, j.company_name, owner.name AS owner_name,
  owner.company_name AS owner_company_name, j.location, j.employment_type,
  j.description, j.status, j.application_url, j.closes_at,
  j.created_at, j.updated_at
`;

export const publicJobListSelectColumns = `
  j.id, j.company_id, j.title, j.company_name, owner.name AS owner_name,
  owner.company_name AS owner_company_name, j.location, j.employment_type,
  CASE WHEN char_length(j.description) > 1800 THEN left(j.description, 1800) || '…' ELSE j.description END AS description,
  j.status, j.application_url, j.closes_at, j.created_at, j.updated_at
`;

export function safeHttpUrl(value: string | null | undefined) {
  if (!value || value.length > 2_048 || /[\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value);
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function serializeJob(row: JobRow): Job {
  return {
    id: row.id,
    title: row.title,
    companyName: row.company_name || row.owner_company_name || row.owner_name || 'Yahnu employer',
    location: row.location,
    employmentType: row.employment_type,
    description: row.description,
    status: row.status,
    applicationUrl: safeHttpUrl(row.application_url),
    closesAt: row.closes_at ? new Date(row.closes_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    ...(row.application_count === undefined ? {} : { applicationCount: Number(row.application_count) }),
  };
}

export type ApplicationRow = {
  id: string;
  job_id: string | null;
  job_title: string | null;
  job_company_name: string | null;
  job_owner_name: string | null;
  job_status: string | null;
  job_closes_at: Date | string | null;
  applicant_id: string | null;
  applicant_name: string | null;
  applicant_email: string | null;
  status: string;
  cover_letter: string | null;
  resume_asset_id: string | null;
  submitted_at: Date | string;
  updated_at: Date | string;
};

export function serializeApplication(row: ApplicationRow): JobApplication {
  return {
    id: row.id,
    job: row.job_id && row.job_title
      ? {
          id: row.job_id,
          title: row.job_title,
          companyName: row.job_company_name || row.job_owner_name || 'Yahnu employer',
          status: row.job_status || 'unknown',
          closesAt: row.job_closes_at ? new Date(row.job_closes_at).toISOString() : null,
        }
      : null,
    applicant: row.applicant_id && row.applicant_name && row.applicant_email
      ? { id: row.applicant_id, name: row.applicant_name, email: row.applicant_email }
      : null,
    status: row.status,
    coverLetter: row.cover_letter,
    resumeUrl: row.resume_asset_id ? `/api/private-media/${encodeURIComponent(row.resume_asset_id)}` : null,
    submittedAt: new Date(row.submitted_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

type PartyRole = 'company' | 'school';

export type PartnershipRow = {
  id: string;
  requester_id: string | null;
  requester_name: string | null;
  requester_role: PartyRole | null;
  requester_company_name: string | null;
  requester_school_name: string | null;
  partner_id: string | null;
  partner_name: string | null;
  partner_role: PartyRole | null;
  partner_company_name: string | null;
  partner_school_name: string | null;
  organization_name: string | null;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
};

function serializeParty(
  id: string | null,
  name: string | null,
  role: PartyRole | null,
  companyName: string | null,
  schoolName: string | null,
) {
  if (!id || !name || !role) return null;
  return { id, name, role, organizationName: companyName || schoolName || name };
}

export function serializePartnership(row: PartnershipRow, userId: string): Partnership {
  return {
    id: row.id,
    status: row.status,
    direction: row.requester_id === userId ? 'outgoing' : 'incoming',
    requester: serializeParty(
      row.requester_id,
      row.requester_name,
      row.requester_role,
      row.requester_company_name,
      row.requester_school_name,
    ),
    partner: serializeParty(
      row.partner_id,
      row.partner_name,
      row.partner_role,
      row.partner_company_name,
      row.partner_school_name,
    ),
    organizationName: row.organization_name,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export type DirectoryRow = {
  id: string;
  name: string;
  role: PartyRole;
  company_name: string | null;
  school_name: string | null;
  industry: string | null;
};

export function serializeDirectoryEntry(row: DirectoryRow): PartnershipDirectoryEntry {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    organizationName: row.company_name || row.school_name || row.name,
    industry: row.industry,
  };
}
