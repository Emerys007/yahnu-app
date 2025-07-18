
import * as React from 'react';
import { cookies } from 'next/headers';
import { DashboardSidebar, SidebarProvider } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { GraduateDashboard } from '@/components/dashboard/graduate-dashboard';
import { CompanyDashboard } from '@/components/dashboard/company-dashboard';
import { SchoolDashboard } from '@/components/dashboard/school-dashboard';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';
import { type Role } from '@/context/auth-context';

const getDashboardForRole = (role: Role) => {
  switch (role) {
    case 'graduate':
      return <GraduateDashboard />;
    case 'company':
      return <CompanyDashboard />;
    case 'school':
      return <SchoolDashboard />;
    case 'admin':
    case 'super_admin':
    case 'content_moderator':
    case 'support_staff':
      return <AdminDashboard />;
    default:
      return null;
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies();
  const role = (cookieStore.get('userRole')?.value as Role) || 'graduate';
  
  const DashboardComponent = getDashboardForRole(role);

  return (
      <SidebarProvider>
        <div className="relative min-h-screen lg:grid lg:grid-cols-[auto_1fr]">
            <DashboardSidebar />
            <div className="flex flex-col">
              <DashboardHeader />
              <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                  <DashboardContent>
                    {DashboardComponent ? DashboardComponent : children}
                  </DashboardContent>
              </main>
            </div>
        </div>
        <ScrollToTop />
      </SidebarProvider>
  )
}
