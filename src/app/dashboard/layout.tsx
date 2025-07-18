
import * as React from 'react';
import { DashboardSidebar, SidebarProvider } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { ScrollToTop } from '@/components/ui/scroll-to-top';

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
