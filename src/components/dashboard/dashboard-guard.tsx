"use client";

import * as React from "react";
import { ShieldAlert } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth, type Role } from "@/context/auth-context";

const allRoles: Role[] = ['graduate', 'company', 'school', 'admin', 'super_admin', 'content_manager', 'content_moderator', 'support_staff'];
const coreRoles: Role[] = ['graduate', 'company', 'school'];
const administratorRoles: Role[] = ['admin', 'super_admin'];
const contentRoles: Role[] = ['admin', 'super_admin', 'content_manager', 'content_moderator'];
const supportRoles: Role[] = ['admin', 'super_admin', 'support_staff'];
const messagingRoles: Role[] = [...coreRoles, ...supportRoles];
const organizationRoles: Role[] = ['company', 'school'];
const reportingRoles: Role[] = ['company', 'school', 'admin', 'super_admin'];

type AccessRule = {
  path: string;
  roles: Role[];
  nested?: boolean;
};

const accessRules: AccessRule[] = [
  { path: '/dashboard', roles: allRoles },
  { path: '/dashboard/settings', roles: allRoles },
  { path: '/dashboard/support', roles: coreRoles },
  { path: '/dashboard/messages', roles: messagingRoles },

  { path: '/dashboard/admin', roles: administratorRoles, nested: true },
  { path: '/dashboard/content', roles: contentRoles },
  { path: '/dashboard/support', roles: supportRoles, nested: true },

  { path: '/dashboard/profile', roles: ['graduate'] },
  { path: '/dashboard/jobs', roles: ['graduate'] },
  { path: '/dashboard/applications', roles: ['graduate'] },
  { path: '/dashboard/events', roles: ['graduate'] },
  { path: '/dashboard/companies', roles: ['graduate'] },
  { path: '/dashboard/assessments', roles: ['graduate'] },
  { path: '/dashboard/assessment', roles: ['graduate'], nested: true },
  { path: '/dashboard/interview-prep', roles: ['graduate'] },

  { path: '/dashboard/applicants', roles: ['company'] },
  { path: '/dashboard/company-events', roles: ['company'] },
  { path: '/dashboard/company-profile', roles: ['company'] },
  { path: '/dashboard/job-postings', roles: ['company'] },
  { path: '/dashboard/talent-pool', roles: ['company'], nested: true },

  { path: '/dashboard/graduates', roles: ['school'] },
  { path: '/dashboard/graduate-management', roles: ['school'] },
  { path: '/dashboard/school-events', roles: ['school'] },
  { path: '/dashboard/school-profile', roles: ['school'] },

  { path: '/dashboard/organization-profile', roles: organizationRoles },
  { path: '/dashboard/partners', roles: organizationRoles },
  { path: '/dashboard/partnerships', roles: organizationRoles },

  { path: '/dashboard/reports', roles: reportingRoles },
  { path: '/dashboard/reports/company-analytics', roles: ['company'] },
  { path: '/dashboard/reports/school-analytics', roles: ['school'] },
  { path: '/dashboard/reports/custom-report-builder', roles: reportingRoles },
  { path: '/dashboard/reports/custom-report-generator', roles: reportingRoles },
];

function hasAccess(pathname: string, role: Role) {
  const rule = accessRules.find(({ path, nested }) => pathname === path || (nested && pathname.startsWith(`${path}/`)));
  return rule?.roles.includes(role) ?? false;
}

export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, role } = useAuth();

  React.useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [loading, pathname, router, user]);

  if (loading || !user) {
    return <div className="min-h-screen bg-background p-6"><div className="mx-auto max-w-6xl animate-pulse space-y-5"><div className="h-12 w-64 rounded-xl bg-muted" /><div className="grid gap-5 md:grid-cols-3"><div className="h-48 rounded-2xl bg-muted" /><div className="h-48 rounded-2xl bg-muted md:col-span-2" /></div></div></div>;
  }

  if (!hasAccess(pathname, role)) {
    return <main className="grid min-h-screen place-items-center bg-background p-6"><div className="max-w-md text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"><ShieldAlert className="h-6 w-6" /></span><h1 className="mt-5 text-2xl font-semibold tracking-tight">This area is restricted</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Your account does not have access to this workspace. If this looks wrong, contact a Yahnu administrator.</p><Button className="mt-6 rounded-xl" onClick={() => router.replace('/dashboard')}>Return to dashboard</Button></div></main>;
  }

  return <>{children}</>;
}
