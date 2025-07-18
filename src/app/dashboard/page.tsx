
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
  admin: AdminDashboard,
  super_admin: AdminDashboard,
  content_moderator: AdminDashboard,
  support_staff: AdminDashboard,
};

// This component is no longer the primary renderer for dashboards,
// but is kept for routing and to avoid breaking client-side navigation expectations.
// The actual dashboard content is rendered by the layout.
export default function DashboardPage() {
  const { role } = useAuth()
  const ActiveDashboard = dashboardComponents[role] || GraduateDashboard;

  // Render a placeholder or the client-side component, 
  // as the main content is now controlled by the layout.
  if (role === 'admin' || role === 'super_admin' || role === 'content_moderator' || role === 'support_staff') {
    // We render a non-async version here for client-side compatibility
    // The actual async data is handled in the layout.
    return <ActiveDashboard />;
  }

  return <ActiveDashboard />;
}
