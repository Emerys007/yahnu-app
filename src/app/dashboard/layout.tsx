
import * as React from 'react';
import { DashboardSidebar, SidebarProvider } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { Footer } from '@/components/landing/footer';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
      <SidebarProvider>
        <div className="relative flex min-h-screen flex-col bg-background">
            <DashboardHeader />
            <div className="flex">
                <DashboardSidebar />
                <main className="flex-1 p-4 sm:p-6">
                    <DashboardContent>
                      {children}
                    </DashboardContent>
                </main>
            </div>
        </div>
        <Footer />
      </SidebarProvider>
  )
}
