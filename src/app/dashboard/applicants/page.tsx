'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { CompanyApplicants } from '@/components/careers/application-workspaces';
import { useAuth } from '@/context/auth-context';

function ApplicantsContent() {
  const search = useSearchParams();
  const { user, loading } = useAuth();
  if (loading) return <p className="text-sm text-muted-foreground">Loading your account…</p>;
  if (user?.role !== 'company') return <p className="text-sm text-muted-foreground">Applicant management is available to company accounts.</p>;
  return <CompanyApplicants initialJobId={search.get('jobId')?.slice(0, 1_500) || ''} />;
}

export default function ApplicantsPage() {
  return <Suspense fallback={<p className="text-sm text-muted-foreground">Loading applicants…</p>}><ApplicantsContent /></Suspense>;
}
