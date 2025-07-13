import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Chatbot } from "@/components/chatbot";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full flex">
      <DashboardSidebar />
      <div className="flex flex-col flex-1">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-8 lg:p-10 bg-background/95 dark:bg-muted/40">
          {children}
        </main>
      </div>
      <Chatbot />
    </div>
  )
}
