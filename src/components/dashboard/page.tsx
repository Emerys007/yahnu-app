
"use client"

import { useAuth, type AccountType } from "@/context/auth-context"
import { GraduateDashboard } from "@/components/dashboard/graduate-dashboard"
import { CompanyDashboard } from "@/components/dashboard/company-dashboard"
import { SchoolDashboard } from "@/components/dashboard/school-dashboard"
import AdminPage from "./admin/page"

const dashboardComponents: Record<AccountType, React.ComponentType> = {
  graduate: GraduateDashboard,
  company: CompanyDashboard,
  school: SchoolDashboard,
  admin: AdminPage
};

export default function DashboardPage() {
  const { accountType } = useAuth()
  const ActiveDashboard = dashboardComponents[accountType] || GraduateDashboard;

  return <ActiveDashboard />;
}
