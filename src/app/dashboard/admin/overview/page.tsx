"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  GraduationCap,
  LoaderCircle,
  MapPin,
  RefreshCw,
  School,
  ShieldCheck,
  UserPlus,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react"

import type { AdminRequest } from "../admin-client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth, type Role } from "@/context/auth-context"
import { useLocalization } from "@/context/localization-context"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api-client"
import { cn } from "@/lib/utils"

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

function relativeTime(value: string, language: "en" | "fr") {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return language === "en" ? "Recently" : "Récemment"

  const seconds = Math.round((date.getTime() - Date.now()) / 1_000)
  const formatter = new Intl.RelativeTimeFormat(language === "en" ? "en" : "fr-CI", { numeric: "auto" })
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second")

  const minutes = Math.round(seconds / 60)
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute")

  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour")

  return formatter.format(Math.round(hours / 24), "day")
}

function roleLabel(role: Role, language: "en" | "fr") {
  const labels: Record<Role, { en: string; fr: string }> = {
    graduate: { en: "Graduate", fr: "Jeune diplômé" },
    company: { en: "Employer", fr: "Entreprise" },
    school: { en: "Institution", fr: "Établissement" },
    admin: { en: "Administrator", fr: "Administrateur" },
    super_admin: { en: "Super administrator", fr: "Super administrateur" },
    content_manager: { en: "Content manager", fr: "Gestionnaire de contenu" },
    content_moderator: { en: "Content moderator", fr: "Modérateur de contenu" },
    support_staff: { en: "Support team", fr: "Équipe support" },
  }
  return labels[role][language]
}

type Metric = {
  label: string
  description: string
  value: number
  icon: LucideIcon
  iconClassName: string
  iconSurfaceClassName: string
  barClassName: string
}

export default function AdminOverviewPage() {
  const { language } = useLocalization()
  const { user } = useAuth()
  const { toast } = useToast()
  const [dashboard, setDashboard] = useState(emptyDashboard)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null)
  const loadInFlight = useRef(false)
  const mutationInFlight = useRef(false)

  const copy = language === "en"
    ? {
        kicker: "Yahnu operations",
        title: (name?: string) => name ? `Hello ${name}, keep the network moving.` : "Keep the Yahnu network moving.",
        description: "Monitor active accounts, welcome trusted partners and follow new registrations across Côte d’Ivoire.",
        location: "Abidjan, Côte d’Ivoire",
        refresh: "Refresh data",
        refreshing: "Refreshing",
        updated: "Updated",
        totalUsers: "Active network",
        totalUsersDescription: "Graduates, employers and institutions",
        companies: "Active employers",
        companiesDescription: "Approved employer accounts",
        schools: "Partner institutions",
        schoolsDescription: "Approved institution accounts",
        api: "Administration API",
        operational: "Operational",
        checkRequired: "Needs attention",
        apiHealthy: "The administration API is responding normally.",
        apiUnavailable: "The latest check did not complete.",
        apiChecking: "Checking the administration API…",
        loadErrorTitle: "The live overview is temporarily unavailable.",
        loadErrorDescription: "No data was replaced. Check the connection, then try again.",
        retry: "Try again",
        pending: "Organisations awaiting review",
        pendingDescription: "Approve employers and institutions before they join the Yahnu network.",
        pendingEmptyTitle: "The review queue is clear",
        pendingEmptyDescription: "New organisation requests will appear here.",
        dataUnavailable: "Live data is unavailable for this section.",
        company: "Employer",
        school: "Institution",
        registered: "Submitted",
        approve: "Approve",
        reject: "Reject",
        recent: "Latest registrations",
        recentDescription: "Most recently created accounts on Yahnu.",
        recentEmptyTitle: "No recent registrations",
        recentEmptyDescription: "New accounts will appear here as they are created.",
        approvedTitle: "Organisation approved",
        approvedDescription: (name: string) => `${name} can now access Yahnu.`,
        rejectedTitle: "Request declined",
        rejectedDescription: (name: string) => `${name}'s request has been declined.`,
        updateErrorTitle: "The request could not be updated",
        updateErrorDescription: "Nothing changed. Please try again.",
      }
    : {
        kicker: "Pilotage Yahnu",
        title: (name?: string) => name ? `Bonjour ${name}, gardons le réseau en mouvement.` : "Gardons le réseau Yahnu en mouvement.",
        description: "Suivez les comptes actifs, accueillez des partenaires de confiance et accompagnez les nouvelles inscriptions partout en Côte d’Ivoire.",
        location: "Abidjan, Côte d’Ivoire",
        refresh: "Actualiser les données",
        refreshing: "Actualisation",
        updated: "Mis à jour",
        totalUsers: "Réseau actif",
        totalUsersDescription: "Diplômés, entreprises et établissements",
        companies: "Entreprises actives",
        companiesDescription: "Comptes employeurs approuvés",
        schools: "Établissements partenaires",
        schoolsDescription: "Comptes établissements approuvés",
        api: "API d’administration",
        operational: "Opérationnelle",
        checkRequired: "À vérifier",
        apiHealthy: "L’API d’administration répond normalement.",
        apiUnavailable: "La dernière vérification n’a pas abouti.",
        apiChecking: "Vérification de l’API d’administration…",
        loadErrorTitle: "La vue d’ensemble est momentanément indisponible.",
        loadErrorDescription: "Aucune donnée n’a été remplacée. Vérifiez la connexion, puis réessayez.",
        retry: "Réessayer",
        pending: "Organisations à valider",
        pendingDescription: "Validez les entreprises et établissements avant leur entrée dans le réseau Yahnu.",
        pendingEmptyTitle: "La file de validation est à jour",
        pendingEmptyDescription: "Les nouvelles demandes d’organisation apparaîtront ici.",
        dataUnavailable: "Les données en direct sont indisponibles pour cette section.",
        company: "Entreprise",
        school: "Établissement",
        registered: "Demande reçue",
        approve: "Approuver",
        reject: "Refuser",
        recent: "Dernières inscriptions",
        recentDescription: "Les comptes créés le plus récemment sur Yahnu.",
        recentEmptyTitle: "Aucune inscription récente",
        recentEmptyDescription: "Les nouveaux comptes apparaîtront ici dès leur création.",
        approvedTitle: "Organisation approuvée",
        approvedDescription: (name: string) => `${name} peut maintenant accéder à Yahnu.`,
        rejectedTitle: "Demande refusée",
        rejectedDescription: (name: string) => `La demande de ${name} a été refusée.`,
        updateErrorTitle: "La demande n’a pas pu être mise à jour",
        updateErrorDescription: "Aucune modification n’a été enregistrée. Réessayez.",
      }

  const loadDashboard = useCallback(async () => {
    if (loadInFlight.current || mutationInFlight.current) return
    loadInFlight.current = true
    setRefreshing(true)
    try {
      const response = await apiFetch<DashboardResponse>("/api/admin/overview")
      setDashboard(response.data)
      setLastUpdated(new Date())
      setError(false)
    } catch (loadError) {
      console.error("Unable to load the admin overview.", loadError)
      setError(true)
    } finally {
      loadInFlight.current = false
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadDashboard()
    }, 45_000)
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void loadDashboard()
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [loadDashboard])

  const firstName = user?.firstName || user?.name?.trim().split(/\s+/)[0]
  const hasLiveData = lastUpdated !== null
  const apiOperational = hasLiveData && !error && dashboard.serviceStatus === "operational"
  const dateLabel = useMemo(() => new Intl.DateTimeFormat(language === "en" ? "en" : "fr-CI", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date()), [language])
  const numberFormatter = useMemo(() => new Intl.NumberFormat(language === "en" ? "en" : "fr-CI"), [language])

  const metrics: Metric[] = [
    {
      label: copy.totalUsers,
      description: copy.totalUsersDescription,
      value: dashboard.stats.totalUsers,
      icon: UsersRound,
      iconClassName: "text-primary",
      iconSurfaceClassName: "bg-primary/10",
      barClassName: "bg-primary",
    },
    {
      label: copy.companies,
      description: copy.companiesDescription,
      value: dashboard.stats.activeCompanies,
      icon: Building2,
      iconClassName: "text-terra",
      iconSurfaceClassName: "bg-terra/[0.12]",
      barClassName: "bg-terra",
    },
    {
      label: copy.schools,
      description: copy.schoolsDescription,
      value: dashboard.stats.activeSchools,
      icon: GraduationCap,
      iconClassName: "text-lagoon",
      iconSurfaceClassName: "bg-lagoon/10",
      barClassName: "bg-lagoon",
    },
  ]

  const handleRequest = async (request: AdminRequest, action: "approve" | "reject") => {
    if (pendingRequestId || refreshing || loadInFlight.current) return
    mutationInFlight.current = true
    setPendingRequestId(request.id)

    try {
      await apiFetch(`/api/admin/users/${encodeURIComponent(request.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: action === "approve" ? "active" : "declined" }),
      })
      setDashboard((current) => ({
        ...current,
        pendingRequests: current.pendingRequests.filter((item) => item.id !== request.id),
      }))
      toast({
        title: action === "approve" ? copy.approvedTitle : copy.rejectedTitle,
        description: action === "approve" ? copy.approvedDescription(request.name) : copy.rejectedDescription(request.name),
      })
      mutationInFlight.current = false
      await loadDashboard()
    } catch (updateError) {
      console.error("Unable to update the organisation request.", updateError)
      toast({
        title: copy.updateErrorTitle,
        description: copy.updateErrorDescription,
        variant: "destructive",
      })
    } finally {
      mutationInFlight.current = false
      setPendingRequestId(null)
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6" aria-busy={refreshing}>
      <section className="relative isolate overflow-hidden rounded-[1.5rem] bg-[hsl(var(--sidebar-background))] px-5 py-6 text-[hsl(var(--sidebar-foreground))] shadow-soft sm:px-7 sm:py-8 lg:px-9">
        <div className="ci-pattern absolute inset-0 -z-20 opacity-30" aria-hidden="true" />
        <div className="absolute -right-16 -top-24 -z-10 h-72 w-72 rounded-full bg-lagoon/20 blur-3xl" aria-hidden="true" />
        <svg
          aria-hidden="true"
          className="absolute bottom-0 right-0 -z-10 hidden h-full w-[42%] opacity-60 lg:block"
          viewBox="0 0 480 240"
          fill="none"
        >
          <path d="M32 207C116 151 130 62 222 91C291 113 304 180 451 41" stroke="hsl(var(--lagoon))" strokeWidth="3" strokeDasharray="8 10" />
          <circle cx="32" cy="207" r="9" fill="hsl(var(--terra))" />
          <circle cx="222" cy="91" r="9" fill="hsl(var(--soleil))" />
          <circle cx="451" cy="41" r="9" fill="hsl(var(--primary))" stroke="white" strokeWidth="3" />
        </svg>

        <div className="relative max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
            <span className="rounded-full border border-white/[0.15] bg-white/10 px-3 py-1.5">{copy.kicker}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.15] px-3 py-1.5 normal-case tracking-normal">
              <MapPin className="h-3.5 w-3.5 text-[hsl(var(--terra))]" aria-hidden="true" />
              {copy.location}
            </span>
          </div>
          <h1 className="mt-5 max-w-2xl font-headline text-3xl font-semibold leading-[1.04] tracking-[-0.035em] text-white sm:text-4xl lg:text-5xl">
            {copy.title(firstName)}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/[0.72] sm:text-base sm:leading-7">{copy.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              variant="terra"
              onClick={() => void loadDashboard()}
              disabled={refreshing}
              aria-label={copy.refresh}
            >
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} aria-hidden="true" />
              {refreshing ? copy.refreshing : copy.refresh}
            </Button>
            <span className="inline-flex items-center gap-2 text-xs font-medium text-white/[0.65]">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              {lastUpdated
                ? `${copy.updated} ${new Intl.DateTimeFormat(language === "en" ? "en" : "fr-CI", { hour: "2-digit", minute: "2-digit" }).format(lastUpdated)}`
                : dateLabel}
            </span>
          </div>
        </div>
      </section>

      {error ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 sm:flex-row sm:items-center" role="alert">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{copy.loadErrorTitle}</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{copy.loadErrorDescription}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadDashboard()} disabled={refreshing}>
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} aria-hidden="true" />
            {copy.retry}
          </Button>
        </div>
      ) : null}

      <section aria-label={language === "en" ? "Live network indicators" : "Indicateurs du réseau en direct"}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <Card key={metric.label} className="relative overflow-hidden">
                <span className={cn("absolute inset-x-0 top-0 h-1", metric.barClassName)} aria-hidden="true" />
                <CardContent className="flex h-full items-start justify-between gap-4 p-5 sm:p-5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                    <div className="mt-3 min-h-10 font-headline text-3xl font-semibold tracking-[-0.03em] text-foreground" aria-live="polite">
                      {loading ? <Skeleton className="h-9 w-20" /> : !hasLiveData ? "—" : numberFormatter.format(metric.value)}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">{metric.description}</p>
                  </div>
                  <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", metric.iconSurfaceClassName, metric.iconClassName)}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </CardContent>
              </Card>
            )
          })}

          <Card className="relative overflow-hidden">
            <span className={cn("absolute inset-x-0 top-0 h-1", apiOperational ? "bg-primary" : error ? "bg-destructive" : "bg-muted")} aria-hidden="true" />
            <CardContent className="flex h-full items-start justify-between gap-4 p-5 sm:p-5">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">{copy.api}</p>
                <div className="mt-3 min-h-10">
                  {loading ? (
                    <Skeleton className="h-8 w-28" />
                  ) : (
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full px-2.5 py-1 font-semibold",
                        apiOperational
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-destructive/20 bg-destructive/10 text-destructive",
                      )}
                    >
                      <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", apiOperational ? "bg-primary" : "bg-destructive")} aria-hidden="true" />
                      {apiOperational ? copy.operational : copy.checkRequired}
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {loading ? copy.apiChecking : apiOperational ? copy.apiHealthy : copy.apiUnavailable}
                </p>
              </div>
              <span className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                apiOperational ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive",
              )}>
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </span>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.85fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70 bg-secondary/25">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl">{copy.pending}</CardTitle>
                <CardDescription className="mt-1 max-w-2xl leading-5">{copy.pendingDescription}</CardDescription>
              </div>
              {!loading && hasLiveData ? (
                <Badge variant="outline" className="shrink-0 rounded-full bg-card">
                  {numberFormatter.format(dashboard.pendingRequests.length)}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            {loading ? (
              <div className="space-y-0" role="status" aria-label={language === "en" ? "Loading review requests" : "Chargement des demandes à valider"}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 border-b border-border/60 p-5 last:border-0">
                    <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-44" />
                      <Skeleton className="h-3 w-56 max-w-full" />
                    </div>
                    <Skeleton className="hidden h-10 w-28 sm:block" />
                  </div>
                ))}
              </div>
            ) : !hasLiveData ? (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">{copy.dataUnavailable}</div>
            ) : dashboard.pendingRequests.length > 0 ? (
              <ul className="divide-y divide-border/70">
                {dashboard.pendingRequests.map((request) => {
                  const isPending = pendingRequestId === request.id
                  const isCompany = request.accountType === "Company"
                  const submittedAt = new Date(request.date)
                  const submittedLabel = Number.isNaN(submittedAt.getTime())
                    ? null
                    : new Intl.DateTimeFormat(language === "en" ? "en" : "fr-CI", { day: "numeric", month: "short", year: "numeric" }).format(submittedAt)

                  return (
                    <li key={request.id} className="group flex flex-col gap-4 p-4 transition-colors hover:bg-secondary/20 sm:p-5 lg:flex-row lg:items-center">
                      <div className="flex min-w-0 flex-1 items-start gap-3.5">
                        <Avatar className="h-11 w-11 shrink-0 rounded-2xl">
                          <AvatarFallback className={cn("rounded-2xl", isCompany ? "bg-terra/10 text-terra" : "bg-lagoon/10 text-lagoon")}>
                            {isCompany ? <Building2 className="h-5 w-5" aria-hidden="true" /> : <School className="h-5 w-5" aria-hidden="true" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="break-words text-sm font-semibold text-foreground">{request.name}</p>
                            <Badge variant="outline" className="rounded-full bg-background text-[11px]">
                              {isCompany ? copy.company : copy.school}
                            </Badge>
                          </div>
                          <p className="mt-1 break-all text-xs text-muted-foreground">{request.email}</p>
                          {submittedLabel ? <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">{copy.registered} · {submittedLabel}</p> : null}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-destructive/20 text-destructive hover:bg-destructive/5 hover:text-destructive"
                          aria-label={`${copy.reject} ${request.name}`}
                          disabled={pendingRequestId !== null || refreshing}
                          onClick={() => void handleRequest(request, "reject")}
                        >
                          {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <X className="h-4 w-4" aria-hidden="true" />}
                          {copy.reject}
                        </Button>
                        <Button
                          size="sm"
                          aria-label={`${copy.approve} ${request.name}`}
                          disabled={pendingRequestId !== null || refreshing}
                          onClick={() => void handleRequest(request, "approve")}
                        >
                          {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
                          {copy.approve}
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="px-5 py-12 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="mt-4 text-sm font-semibold text-foreground">{copy.pendingEmptyTitle}</p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{copy.pendingEmptyDescription}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/70 bg-secondary/25">
            <CardTitle className="text-xl sm:text-2xl">{copy.recent}</CardTitle>
            <CardDescription className="leading-5">{copy.recentDescription}</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-0">
            {loading ? (
              <div className="space-y-0" role="status" aria-label={language === "en" ? "Loading recent registrations" : "Chargement des inscriptions récentes"}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3 border-b border-border/60 p-4 last:border-0">
                    <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !hasLiveData ? (
              <div className="px-5 py-12 text-center text-sm text-muted-foreground">{copy.dataUnavailable}</div>
            ) : dashboard.recentActivity.length > 0 ? (
              <ul className="divide-y divide-border/70">
                {dashboard.recentActivity.map((activity) => (
                  <li key={activity.id} className="flex items-center gap-3 p-4">
                    <Avatar className="h-10 w-10 shrink-0 rounded-2xl">
                      <AvatarFallback className="rounded-2xl bg-lagoon/10 text-lagoon">
                        <UserPlus className="h-4 w-4" aria-hidden="true" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{activity.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span>{roleLabel(activity.role, language)}</span>
                        <span aria-hidden="true">·</span>
                        <time dateTime={activity.occurredAt}>{relativeTime(activity.occurredAt, language)}</time>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-12 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-lagoon/10 text-lagoon">
                  <UsersRound className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="mt-4 text-sm font-semibold text-foreground">{copy.recentEmptyTitle}</p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{copy.recentEmptyDescription}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
