export const roles = [
  'graduate',
  'company',
  'school',
  'admin',
  'super_admin',
  'content_manager',
  'content_moderator',
  'support_staff',
] as const;

export type Role = (typeof roles)[number];

export const userStatuses = ['pending', 'active', 'suspended', 'declined'] as const;
export type UserStatus = (typeof userStatuses)[number];

export type EducationEntry = {
  degree: string;
  field: string;
  gradYear: string;
  verified: boolean;
};

export interface UserProfile {
  uid: string;
  email: string | null;
  name?: string;
  role: Role;
  status: UserStatus;
  firstName?: string;
  lastName?: string;
  schoolId?: string;
  schoolName?: string;
  companyName?: string;
  contactName?: string;
  industry?: string;
  experience?: string;
  education?: EducationEntry[];
  skills?: string[] | string;
  phone?: string;
  inviteId?: string;
  authProvider?: 'password' | 'google' | 'migrated';
  hasPassword?: boolean;
  emailVerified?: boolean;
  createdAt?: string;
}

export const staffRoles: ReadonlySet<Role> = new Set([
  'admin',
  'super_admin',
  'content_manager',
  'content_moderator',
  'support_staff',
]);

export const adminRoles: ReadonlySet<Role> = new Set(['admin', 'super_admin']);
