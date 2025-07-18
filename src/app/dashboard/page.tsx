
"use client"

import { useAuth, type Role } from "@/context/auth-context"
import { GraduateDashboard } from "@/components/dashboard/graduate-dashboard"
import { CompanyDashboard } from "@/components/dashboard/company-dashboard"
import { SchoolDashboard } from "@/components/dashboard/school-dashboard"
import AdminOverviewPage from "./admin/overview/page"

const dashboardComponents: Record<string, React.ComponentType> = {
  graduate: GraduateDashboard,
  company: CompanyDashboard,
  school: SchoolDashboard,
  admin: AdminOverviewPage,
  super_admin: AdminOverviewPage,
  content_moderator: AdminOverviewPage,
  support_staff: AdminOverviewPage,
};

export default function DashboardPage() {
  const { role } = useAuth()
  const ActiveDashboard = dashboardComponents[role] || GraduateDashboard;

  return <ActiveDashboard />;
}
