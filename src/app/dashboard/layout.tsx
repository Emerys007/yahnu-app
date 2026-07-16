import type { ReactNode } from "react"

import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { DashboardGuard } from "@/components/dashboard/dashboard-guard"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardSidebar, SidebarProvider } from "@/components/dashboard/sidebar"
import { ScrollToTop } from "@/components/ui/scroll-to-top"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardGuard>
      <SidebarProvider>
        <a
          href="#dashboard-main"
          className="fixed left-4 top-3 z-[100] -translate-y-24 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background shadow-lg transition-transform focus:translate-y-0"
        >
          Aller au contenu principal
        </a>

        <div className="relative isolate min-h-dvh overflow-x-clip bg-background lg:grid lg:grid-cols-[auto_minmax(0,1fr)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_8%,hsl(var(--lagoon)/0.08),transparent_24rem),radial-gradient(circle_at_22%_95%,hsl(var(--terra)/0.07),transparent_22rem)]"
          />
          <DashboardSidebar />

          <div className="relative z-10 flex min-h-dvh min-w-0 flex-col">
            <DashboardHeader />
            <main
              id="dashboard-main"
              className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-7 lg:py-8"
              tabIndex={-1}
            >
              <DashboardContent>{children}</DashboardContent>
            </main>
          </div>
        </div>

        <ScrollToTop />
      </SidebarProvider>
    </DashboardGuard>
  )
}
