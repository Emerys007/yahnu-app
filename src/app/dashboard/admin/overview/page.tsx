"use client"

import { useCallback, useEffect, useState } from "react"
import { Building, CheckCircle, GraduationCap, Loader2, Shield, UserPlus, Users } from "lucide-react"

import { AdminClient, type AdminRequest } from "../admin-client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CountUp } from "@/components/ui/count-up"
import { useLocalization } from "@/context/localization-context"
import { apiFetch } from "@/lib/api-client"
import type { Role } from "@/context/auth-context"

type DashboardData = {
  stats: { totalUsers: number; activeCompanies: number; activeSchools: number }
  pendingRequests: AdminRequest[]
  recentActivity: Array<{
    id: string
    type: "new_user"
    name: string
    role: Role
    occurredAt: string
  }>
  serviceStatus: "operational"
}

type DashboardResponse = { data: DashboardData }

const emptyDashboard: DashboardData = {
  stats: { totalUsers: 0, activeCompanies: 0, activeSchools: 0 },
  pendingRequests: [],
  recentActivity: [],
  serviceStatus: "operational",
}

function relativeTime(value: string, language: string) {
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat(language, { numeric: "auto" })
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second")
  const minutes = Math.round(seconds / 60)
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute")
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour")
  return formatter.format(Math.round(hours / 24), "day")
}

export default function AdminOverviewPage() {
  const { t, language } = useLocalization()
  const [dashboard, setDashboard] = useState(emptyDashboard)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    try {
      const response = await apiFetch<DashboardResponse>("/api/admin/overview")
      setDashboard(response.data)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load the dashboard.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
    const interval = window.setInterval(() => void loadDashboard(), 45_000)
    return () => window.clearInterval(interval)
  }, [loadDashboard])

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-primary/10 p-3">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("dashboard.admin.overview.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("dashboard.admin.overview.description")}</p>
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.admin.overview.totalUsers")}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CountUp end={dashboard.stats.totalUsers} />}</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.admin.overview.totalUsersDescription")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.admin.overview.activeCompanies")}</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CountUp end={dashboard.stats.activeCompanies} />}</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.admin.overview.activeCompaniesDescription")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.admin.overview.partnerSchools")}</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CountUp end={dashboard.stats.activeSchools} />}</div>
            <p className="text-xs text-muted-foreground">{t("dashboard.admin.overview.partnerSchoolsDescription")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.admin.system_health")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <Badge className="bg-emerald-600 hover:bg-emerald-600">{t("Operational")}</Badge>
            <p className="mt-2 text-xs text-muted-foreground">{t("Database and admin services are responding")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("dashboard.overview.pendingRequests")}</CardTitle>
            <CardDescription>{t("dashboard.overview.pendingRequestsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-24 items-center justify-center text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("Loading")}
              </div>
            ) : (
              <AdminClient initialRequests={dashboard.pendingRequests} onChanged={loadDashboard} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.overview.recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboard.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10">
                    <UserPlus className="h-4 w-4 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">
                    {activity.name} {t("dashboard.admin.overview.signedUpAs")} {t(`common.${activity.role}`)}.
                  </p>
                  <p className="text-xs text-muted-foreground">{relativeTime(activity.occurredAt, language)}</p>
                </div>
              </div>
            ))}
            {!loading && dashboard.recentActivity.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">{t("No recent activity")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
