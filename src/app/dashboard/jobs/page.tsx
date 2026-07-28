'use client';

import { JobDiscoveryBrowser } from '@/components/careers/job-discovery-browser';
import { useAuth } from '@/context/auth-context';

export default function DashboardJobsPage() {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-sm text-muted-foreground">Loading your account…</p>;
  if (user?.role !== 'graduate') return <p className="text-sm text-muted-foreground">The job application workspace is available to graduate accounts.</p>;
  return <JobDiscoveryBrowser />;
}
