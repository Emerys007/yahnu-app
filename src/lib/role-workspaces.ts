export type OrganizationProfile = {
  slug: string;
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
  logoAssetId: string | null;
  coverAssetId: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  publicPublishConsent: boolean;
  publishedAt: string | null;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  verificationRequestedAt: string | null;
  verificationNote: string | null;
  verifiedAt: string | null;
  updatedAt: string;
};

export type CareerEvent = {
  id: string;
  organizerId: string;
  organizerName: string;
  organizerRole: 'company' | 'school';
  title: string;
  description: string;
  eventFormat: 'onsite' | 'online' | 'hybrid';
  location: string | null;
  onlineUrl: string | null;
  startsAt: string;
  endsAt: string;
  registrationDeadline: string | null;
  capacity: number | null;
  audience: 'all_graduates' | 'school_graduates';
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  reminderState: 'not_scheduled' | 'scheduled' | 'processing' | 'completed' | 'failed';
  registrationCount: number;
  registered: boolean;
  registrationStatus: 'registered' | 'cancelled' | 'attended' | null;
  registrationOpen: boolean;
  seatsRemaining: number | null;
  createdAt: string;
  updatedAt: string;
};

export type PortfolioEvidence = {
  label: string;
  url: string;
};

export type PublicTalentAttestation = {
  title: string;
  score: number;
  issuedAt: string;
  verificationCode: string;
};

export type TalentPreferences = {
  visibilityConsent: boolean;
  headline: string;
  summary: string;
  preferredRoles: string[];
  preferredLocations: string[];
  workModes: string[];
  employmentTypes: string[];
  availability: string | null;
  portfolioEvidence: PortfolioEvidence[];
  consentedAt: string | null;
  withdrawnAt: string | null;
  updatedAt: string | null;
};

export type TalentCard = {
  id: string;
  name: string;
  headline: string;
  summary: string;
  schoolName: string | null;
  skills: string[];
  preferredRoles: string[];
  preferredLocations: string[];
  workModes: string[];
  employmentTypes: string[];
  availability: string | null;
  portfolioEvidence: PortfolioEvidence[];
  publicAttestations: PublicTalentAttestation[];
  education: Array<{ degree: string; field: string; gradYear: string; verified?: boolean }>;
  shortlisted: boolean;
  shortlistStatus: 'saved' | 'contacted' | 'archived' | null;
  shortlistNote: string;
  updatedAt: string;
};

export type ReportMetric = {
  id: string;
  label: string;
  value: number;
  detail: string;
};

export type ReportSeriesPoint = {
  label: string;
  value: number;
};

export type WorkspaceReport = {
  role: 'company' | 'school';
  generatedAt: string;
  metrics: ReportMetric[];
  statusBreakdown: ReportSeriesPoint[];
  rows: Array<Record<string, string | number>>;
  context: string;
};

export const organizationSizes = ['1_10', '11_50', '51_200', '201_500', '501_1000', '1000_plus'] as const;
export const availabilityOptions = ['immediate', 'one_month', 'three_months', 'exploring'] as const;
export const workModeOptions = ['onsite', 'hybrid', 'remote'] as const;

export function splitList(value: string) {
  return [...new Set(value
    .split(/[\n,;]/)
    .map((item) => item.trim())
    .filter(Boolean))]
    .slice(0, 40);
}

export function joinList(value: readonly string[]) {
  return value.join(', ');
}

export function safeHttpsUrl(value: string | null | undefined) {
  if (!value || value.length > 2_048 || /[\u0000-\u001f\u007f]/.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function escapedLikeContains(value: string) {
  return `%${value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;
}
