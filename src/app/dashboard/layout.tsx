"use client"

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from 'next/navigation';
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar, SidebarProvider } from "@/components/dashboard/sidebar";
import { Chatbot } from "@/components/chatbot";
import { Footer } from "@/components/landing/footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex flex-col">
        <div className="flex flex-1">
          <DashboardSidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <DashboardHeader />
            <main className="flex-1 bg-background/95 dark:bg-muted/40 overflow-y-auto">
               <AnimatePresence mode="wait">
                 <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="p-4 md:p-8 lg:p-10"
                  >
                    {children}
                  </motion.div>
              </AnimatePresence>
            </main>
          </div>
          <Chatbot />
        </div>
        <Footer />
      </div>
    </SidebarProvider>
  )
}
