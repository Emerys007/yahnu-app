"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/context/auth-context"

export default function AnalyticsRedirectPage() {
  const router = useRouter()
  const { role } = useAuth()

  useEffect(() => {
    if (role === "school") router.replace("/dashboard/reports/school-analytics")
    else if (role === "company") router.replace("/dashboard/reports/company-analytics")
    else router.replace("/dashboard/reports/custom-report-generator")
  }, [role, router])

  return <div className="h-24 animate-pulse rounded-xl bg-muted" aria-label="Loading reports" />
}
