'use client';

import { PartnershipManager } from '@/components/careers/partnership-manager';
import { useAuth } from '@/context/auth-context';

export default function PartnershipsPage() {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-sm text-muted-foreground">Loading your account…</p>;
  if (user?.role !== 'company' && user?.role !== 'school') return <p className="text-sm text-muted-foreground">Partnerships are available to company and school accounts.</p>;
  return <PartnershipManager />;
}
