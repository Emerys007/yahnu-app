export type JobStatus = 'draft' | 'open' | 'closed';
export type ApplicationStatus =
  | 'submitted'
  | 'reviewing'
  | 'shortlisted'
  | 'interviewing'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';
export type PartnershipStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export type Job = {
  id: string;
  title: string;
  companyName: string;
  location: string | null;
  employmentType: string | null;
  description: string;
  status: string;
  applicationUrl: string | null;
  closesAt: string | null;
  createdAt: string;
  updatedAt: string;
  applicationCount?: number;
};

export type JobApplication = {
  id: string;
  job: Pick<Job, 'id' | 'title' | 'companyName' | 'status' | 'closesAt'> | null;
  applicant: { id: string; name: string; email: string } | null;
  status: string;
  coverLetter: string | null;
  resumeUrl: string | null;
  submittedAt: string;
  updatedAt: string;
};

export type Partnership = {
  id: string;
  status: string;
  direction: 'incoming' | 'outgoing';
  requester: { id: string; name: string; role: 'company' | 'school'; organizationName: string } | null;
  partner: { id: string; name: string; role: 'company' | 'school'; organizationName: string } | null;
  organizationName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PartnershipDirectoryEntry = {
  id: string;
  name: string;
  role: 'company' | 'school';
  organizationName: string;
  industry: string | null;
};

export const employmentTypes = [
  'full_time',
  'part_time',
  'contract',
  'internship',
  'temporary',
  'volunteer',
  'other',
] as const;

export function humanizeStatus(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

