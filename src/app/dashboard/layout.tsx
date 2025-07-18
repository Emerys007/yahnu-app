
import * as React from 'react';
import { cookies } from 'next/headers';
import { DashboardSidebar, SidebarProvider } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { GraduateDashboard } from '@/components/dashboard/graduate-dashboard';
import { CompanyDashboard } from '@/components/dashboard/company-dashboard';
import { SchoolDashboard } from '@/components/dashboard/school-dashboard';
import { type Role } from '@/context/auth-context';

// The layout no longer needs to decide which dashboard to show.
// It will simply render the child page, which will be determined by the URL.
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <SidebarProvider>
        <div className="relative min-h-screen lg:grid lg:grid-cols-[auto_1fr]">
            <DashboardSidebar />
            <div className="flex flex-col">
              <DashboardHeader />
              <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                  <DashboardContent>
                    {children}
                  </DashboardContent>
              </main>
            </div>
        </div>
        <ScrollToTop />
      </SidebarProvider>
  )
}
