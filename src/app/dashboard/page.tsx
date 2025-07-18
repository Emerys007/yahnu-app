
"use client"

import { useAuth, type Role } from "@/context/auth-context"
import { GraduateDashboard } from "@/components/dashboard/graduate-dashboard"
import { CompanyDashboard } from "@/components/dashboard/company-dashboard"
import { SchoolDashboard } from "@/components/dashboard/school-dashboard"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"

const dashboardComponents: Record<string, React.ComponentType> = {
  graduate: GraduateDashboard,
  company: CompanyDashboard,
  school: SchoolDashboard,
  // AdminDashboard is a server component and should not be rendered here.
  // The layout will handle rendering the AdminDashboard.
};

// This component now only handles client-side dashboards.
// The main dashboard content is now controlled by the layout.
export default function DashboardPage() {
  const { role } = useAuth()
  
  // Admins will see the dashboard rendered by the layout, not this component.
  if (role === 'admin' || role === 'super_admin' || role === 'content_moderator' || role === 'support_staff') {
    return null;
  }

  const ActiveDashboard = dashboardComponents[role] || GraduateDashboard;

  return <ActiveDashboard />;
}
