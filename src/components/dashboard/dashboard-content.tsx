"use client"

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/context/auth-context'
import { AdminDashboard } from './admin-dashboard'
import { GraduateDashboard } from './graduate-dashboard'
import { CompanyDashboard } from './company-dashboard'
import { SchoolDashboard } from './school-dashboard'
import { useTranslations } from '@/context/localization-context';

export function DashboardContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const { user } = useAuth()
  const t = useTranslations()

  if (!user) {
    return <div>{t('common.loading')}</div>
  }

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