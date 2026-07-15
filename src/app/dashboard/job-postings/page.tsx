'use client';

import { CompanyJobManager } from '@/components/careers/company-job-manager';
import { useAuth } from '@/context/auth-context';

export default function JobPostingsPage() {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-sm text-muted-foreground">Loading your account…</p>;
  if (user?.role !== 'company') return <p className="text-sm text-muted-foreground">Job posting management is available to company accounts.</p>;
  return <CompanyJobManager />;
}
