"use client"

import type { ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { usePathname } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/context/auth-context"

export function DashboardContent({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const { loading, user } = useAuth()

  if (loading || !user) {
    return (
      <div className="space-y-5" role="status" aria-live="polite" aria-label="Chargement de votre espace Yahnu">
        <span className="sr-only">Chargement de votre espace Yahnu…</span>
        <Skeleton className="h-28 rounded-[1.5rem]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-[1.25rem]" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-[1.5rem]" />
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        className="min-w-0"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
        transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
