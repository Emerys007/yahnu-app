
"use client"

import { useAuth, type Role } from "@/context/auth-context"
import { GraduateDashboard } from "@/components/dashboard/graduate-dashboard"
import { CompanyDashboard } from "@/components/dashboard/company-dashboard"
import { SchoolDashboard } from "@/components/dashboard/school-dashboard"

const dashboardComponents: Record<Role, React.ComponentType> = {
  graduate: GraduateDashboard,
  company: CompanyDashboard,
  school: SchoolDashboard,
};

export default function DashboardPage() {
  const { role } = useAuth()
  const ActiveDashboard = dashboardComponents[role] || GraduateDashboard;

  return <ActiveDashboard />;
}
