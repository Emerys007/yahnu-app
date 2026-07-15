'use client';

import { CompanyApplicants, GraduateApplications } from '@/components/careers/application-workspaces';
import { useAuth } from '@/context/auth-context';

export default function ApplicationsPage() {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-sm text-muted-foreground">Loading your account…</p>;
  if (user?.role === 'graduate') return <GraduateApplications />;
  if (user?.role === 'company') return <CompanyApplicants />;
  return <p className="text-sm text-muted-foreground">This application workspace is available to graduate and company accounts.</p>;
}
