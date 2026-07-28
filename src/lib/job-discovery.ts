export type JobKind = 'yahnu' | 'external';
export type JobApplyMode = 'yahnu' | 'official_site';
export type ExternalJobStatus =
  | 'opened'
  | 'considering'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export type JobProvenance = {
  sourceName: string;
  sourceCareerUrl: string | null;
  officialDomain: string | null;
  applicationHost: string | null;
  atsProvider: 'Lever' | 'Greenhouse' | null;
  fetchedAt: string;
  freshnessLabel: string;
  isOfficialSource: boolean;
};

export type DiscoveryJob = {
  id: string;
  kind: JobKind;
  title: string;
  companyName: string;
  location: string | null;
  employmentType: string | null;
  workplaceType: string | null;
  description: string;
  applyMode: JobApplyMode;
  applyUrl: string | null;
  detailUrl: string | null;
  closesAt: string | null;
  publishedAt: string;
  updatedAt: string;
  saved: boolean;
  externalStatus: ExternalJobStatus | null;
  recommendedBecause: string[];
  provenance: JobProvenance;
};

export type JobSourceSummary = {
  id: string;
  organizationName: string;
  adapter: 'lever' | 'greenhouse';
  careerUrl: string;
  officialDomain: string;
  marketScope: 'ivory_coast' | 'africa';
  enabled: boolean;
  lastSyncStartedAt: string | null;
  lastSyncCompletedAt: string | null;
  lastSuccessAt: string | null;
  nextSyncAfter: string | null;
  lastErrorCode: string | null;
  consecutiveFailures: number;
  lastItemCount: number;
  activeItemCount: number;
  hiddenItemCount: number;
  stale: boolean;
};

export const externalJobStatuses = [
  'opened',
  'considering',
  'applied',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
] as const satisfies readonly ExternalJobStatus[];

export function parseDiscoveryBoolean(value: 'true' | 'false') {
  return value === 'true';
}

export function escapeLikePattern(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}
