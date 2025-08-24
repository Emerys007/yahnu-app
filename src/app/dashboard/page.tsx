
"use client"

import { useAuth, type Role } from "@/context/auth-context"
import { GraduateDashboard } from "@/components/dashboard/graduate-dashboard"
import { CompanyDashboard } from "@/components/dashboard/company-dashboard"
import { SchoolDashboard } from "@/components/dashboard/school-dashboard"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { ContentManagerDashboard } from "@/components/dashboard/content-manager-dashboard"

const dashboardComponents: Record<string, React.ComponentType> = {
  graduate: GraduateDashboard,
  company: CompanyDashboard,
  school: SchoolDashboard,
  admin: AdminDashboard,
  super_admin: AdminDashboard,
  content_manager: ContentManagerDashboard,
  support_staff: AdminDashboard, // Assuming support staff uses a generic admin dashboard for now
};

export default function DashboardPage() {
  const { role } = useAuth()
  
  const ActiveDashboard = dashboardComponents[role] || GraduateDashboard;

  return <ActiveDashboard />;
}
