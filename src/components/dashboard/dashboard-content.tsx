
"use client"

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

export function DashboardContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
        <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
        >
            {children}
        </motion.div>
    </AnimatePresence>
  )
}
