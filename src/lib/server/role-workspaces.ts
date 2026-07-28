import 'server-only';

import type {
  CareerEvent,
  OrganizationProfile,
  PortfolioEvidence,
  PublicTalentAttestation,
  TalentCard,
  TalentPreferences,
  WorkspaceReport,
} from '@/lib/role-workspaces';
import { safeHttpsUrl } from '@/lib/role-workspaces';

type JsonArray = unknown[] | string | null | undefined;

function arrayValue<T = string>(value: JsonArray): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return value
      .split(/[\n,;]/)
      .map((item) => item.trim())
      .filter(Boolean) as T[];
  }
}

function iso(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : null;
}

function evidenceValue(value: JsonArray): PortfolioEvidence[] {
  return arrayValue<PortfolioEvidence>(value).flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const label = typeof entry.label === 'string' ? entry.label.trim().slice(0, 100) : '';
    const url = typeof entry.url === 'string' ? safeHttpsUrl(entry.url) : null;
    return label && url ? [{ label, url }] : [];
  });
}

function publicAttestationValue(value: JsonArray): PublicTalentAttestation[] {
  return arrayValue<Record<string, unknown>>(value).flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const title = typeof entry.title === 'string' ? entry.title.trim().slice(0, 160) : '';
    const score = typeof entry.score === 'number' && Number.isInteger(entry.score)
      ? entry.score
      : Number.NaN;
    const verificationCode = typeof entry.verificationCode === 'string'
      && /^[A-Za-z0-9_-]{32,64}$/.test(entry.verificationCode)
      ? entry.verificationCode
      : '';
    const issuedAt = typeof entry.issuedAt === 'string'
      && !Number.isNaN(new Date(entry.issuedAt).getTime())
      ? new Date(entry.issuedAt).toISOString()
      : '';
    return title && score >= 50 && score <= 100 && verificationCode && issuedAt
      ? [{ title, score, verificationCode, issuedAt }]
      : [];
  }).slice(0, 8);
}

export type OrganizationProfileRow = {
  slug: string;
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
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  public_publish_consent: boolean;
  published_at: Date | string | null;
  verification_status: OrganizationProfile['verificationStatus'];
  verification_requested_at: Date | string | null;
  verification_note: string | null;
  verified_at: Date | string | null;
  updated_at: Date | string;
};

export function serializeOrganizationProfile(row: OrganizationProfileRow): OrganizationProfile {
  return {
    slug: row.slug,
    description: row.description,
    websiteUrl: row.website_url,
    locations: arrayValue(row.locations),
    organizationSize: row.organization_size,
    organizationType: row.organization_type,
    programs: arrayValue(row.programs),
    benefits: arrayValue(row.benefits),
    culture: arrayValue(row.culture),
    logoUrl: row.logo_asset_id ? `/api/media/${encodeURIComponent(row.logo_asset_id)}` : null,
    coverUrl: row.cover_asset_id ? `/api/media/${encodeURIComponent(row.cover_asset_id)}` : null,
    logoAssetId: row.logo_asset_id,
    coverAssetId: row.cover_asset_id,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    publicPublishConsent: row.public_publish_consent,
    publishedAt: iso(row.published_at),
    verificationStatus: row.verification_status,
    verificationRequestedAt: iso(row.verification_requested_at),
    verificationNote: row.verification_note,
    verifiedAt: iso(row.verified_at),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export type CareerEventRow = {
  id: string;
  organizer_id: string;
  organizer_name: string;
  organizer_role: 'company' | 'school';
  title: string;
  description: string;
  event_format: CareerEvent['eventFormat'];
  location: string | null;
  online_url: string | null;
  starts_at: Date | string;
  ends_at: Date | string;
  registration_deadline: Date | string | null;
  capacity: number | string | null;
  audience: CareerEvent['audience'];
  status: CareerEvent['status'];
  reminder_state: CareerEvent['reminderState'];
  registration_count: number | string;
  registration_status: CareerEvent['registrationStatus'];
  created_at: Date | string;
  updated_at: Date | string;
};

export function serializeCareerEvent(row: CareerEventRow, viewerIsOrganizer = false): CareerEvent {
  const count = Number(row.registration_count || 0);
  const capacity = row.capacity === null ? null : Number(row.capacity);
  const deadlineOpen = !row.registration_deadline || new Date(row.registration_deadline).getTime() > Date.now();
  const seatsRemaining = capacity === null ? null : Math.max(0, capacity - count);
  const registrationOpen = row.status === 'published'
    && deadlineOpen
    && new Date(row.starts_at).getTime() > Date.now()
    && (seatsRemaining === null || seatsRemaining > 0);
  const onlineUrl = viewerIsOrganizer || row.registration_status === 'registered' || row.registration_status === 'attended'
    ? row.online_url
    : null;

  return {
    id: row.id,
    organizerId: row.organizer_id,
    organizerName: row.organizer_name,
    organizerRole: row.organizer_role,
    title: row.title,
    description: row.description,
    eventFormat: row.event_format,
    location: row.location,
    onlineUrl,
    startsAt: new Date(row.starts_at).toISOString(),
    endsAt: new Date(row.ends_at).toISOString(),
    registrationDeadline: iso(row.registration_deadline),
    capacity,
    audience: row.audience,
    status: row.status,
    reminderState: row.reminder_state,
    registrationCount: count,
    registered: row.registration_status === 'registered' || row.registration_status === 'attended',
    registrationStatus: row.registration_status,
    registrationOpen,
    seatsRemaining,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export type TalentProfileRow = {
  id?: string;
  user_id: string;
  name?: string;
  school_name?: string | null;
  skills?: JsonArray;
  education?: JsonArray;
  visibility_consent: boolean;
  headline: string;
  summary: string;
  preferred_roles: JsonArray;
  preferred_locations: JsonArray;
  work_modes: JsonArray;
  employment_types: JsonArray;
  availability: string | null;
  portfolio_evidence: JsonArray;
  public_attestations?: JsonArray;
  consented_at: Date | string | null;
  withdrawn_at: Date | string | null;
  shortlist_status?: TalentCard['shortlistStatus'];
  shortlist_note?: string | null;
  updated_at: Date | string;
};

export function serializeTalentPreferences(row: TalentProfileRow | null): TalentPreferences {
  if (!row) {
    return {
      visibilityConsent: false,
      headline: '',
      summary: '',
      preferredRoles: [],
      preferredLocations: [],
      workModes: [],
      employmentTypes: [],
      availability: null,
      portfolioEvidence: [],
      consentedAt: null,
      withdrawnAt: null,
      updatedAt: null,
    };
  }
  return {
    visibilityConsent: row.visibility_consent,
    headline: row.headline,
    summary: row.summary,
    preferredRoles: arrayValue(row.preferred_roles),
    preferredLocations: arrayValue(row.preferred_locations),
    workModes: arrayValue(row.work_modes),
    employmentTypes: arrayValue(row.employment_types),
    availability: row.availability,
    portfolioEvidence: evidenceValue(row.portfolio_evidence),
    consentedAt: iso(row.consented_at),
    withdrawnAt: iso(row.withdrawn_at),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export function serializeTalentCard(row: TalentProfileRow): TalentCard {
  return {
    id: row.user_id,
    name: row.name || 'Talent Yahnu',
    headline: row.headline,
    summary: row.summary,
    schoolName: row.school_name || null,
    skills: arrayValue(row.skills),
    education: arrayValue(row.education),
    preferredRoles: arrayValue(row.preferred_roles),
    preferredLocations: arrayValue(row.preferred_locations),
    workModes: arrayValue(row.work_modes),
    employmentTypes: arrayValue(row.employment_types),
    availability: row.availability,
    portfolioEvidence: evidenceValue(row.portfolio_evidence),
    publicAttestations: publicAttestationValue(row.public_attestations),
    shortlisted: row.shortlist_status === 'saved' || row.shortlist_status === 'contacted',
    shortlistStatus: row.shortlist_status || null,
    shortlistNote: row.shortlist_note || '',
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export function serializeReport(report: WorkspaceReport) {
  return report;
}
