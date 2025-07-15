
"use client"

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { DashboardSidebar, SidebarProvider } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { Footer } from '@/components/landing/footer';
import { Chatbot } from '@/components/chatbot';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  return (
      <SidebarProvider>
        <div className="relative flex min-h-screen flex-col bg-background">
          <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
            <DashboardHeader />
            <DashboardSidebar />
            <div className="flex-1">
              <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={pathname}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="col-span-3"
                    >
                      {children}
                    </motion.div>
                  </AnimatePresence>
              </main>
            </div>
          </div>
          <Chatbot />
        </div>
        <Footer />
      </SidebarProvider>
  )
}
