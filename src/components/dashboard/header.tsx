"use client"

import * as React from "react"
import {
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  FileText,
  LoaderCircle,
  MapPin,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Newspaper,
  PanelLeft,
  RefreshCw,
  School,
  Sun,
  TicketCheck,
  UserRoundCheck,
  WifiOff,
  type LucideIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

import { UserNav } from "@/components/dashboard/user-nav"
import { SearchCommand } from "@/components/search-command"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuFooter,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/auth-context"
import { useLocalization } from "@/context/localization-context"
import { apiFetch } from "@/lib/api-client"
import { cn } from "@/lib/utils"

import { useSidebar } from "./sidebar"

type NotificationRecord = {
  id: string
  type: string
  title: string
  body: string
  link: string | null
  createdAt: string
  read: boolean
}

const iconByType: Record<string, LucideIcon> = {
  announcement: MessageSquare,
  blog: Newspaper,
  event_invite: CalendarDays,
  job_application: BriefcaseBusiness,
  knowledge_base: BookOpen,
  message: MessageSquare,
  pending_graduate: UserRoundCheck,
  pending_user: Building2,
  support_ticket: TicketCheck,
  content: FileText,
}

function notificationIcon(notification: NotificationRecord): LucideIcon {
  if (notification.type === "pending_user" && notification.title.toLocaleLowerCase("fr-CI").includes("école")) {
    return School
  }
  return iconByType[notification.type] ?? Bell
}

function formatRelativeTime(value: string, language: "en" | "fr") {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return language === "en" ? "Recently" : "Récemment"

  const seconds = Math.round((date.getTime() - Date.now()) / 1_000)
  const formatter = new Intl.RelativeTimeFormat(language === "en" ? "en" : "fr-CI", { numeric: "auto" })
  if (Math.abs(seconds) < 60) return formatter.format(seconds, "second")

  const minutes = Math.round(seconds / 60)
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute")

  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour")

  const days = Math.round(hours / 24)
  if (Math.abs(days) < 30) return formatter.format(days, "day")

  return new Intl.DateTimeFormat(language === "en" ? "en" : "fr-CI", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function DashboardHeader() {
  const { isCollapsed, isMobile, toggleSidebar } = useSidebar()
  const { user } = useAuth()
  const { language } = useLocalization()
  const { setTheme } = useTheme()
  const router = useRouter()
  const [notifications, setNotifications] = React.useState<NotificationRecord[]>([])
  const [notificationsLoading, setNotificationsLoading] = React.useState(false)
  const [notificationsLoaded, setNotificationsLoaded] = React.useState(false)
  const [notificationError, setNotificationError] = React.useState(false)
  const refreshInFlight = React.useRef(false)

  const copy = language === "en"
    ? {
        workspace: "Côte d'Ivoire workspace",
        ecosystem: "Talent · employers · campuses",
        notifications: "Notifications",
        noNotifications: "You're all caught up.",
        noNotificationsHint: "New activity will appear here.",
        unread: (count: number) => `${count} unread`,
        bellLabel: (count: number) => count > 0 ? `Notifications, ${count} unread` : "Notifications",
        loadError: "Notifications could not be refreshed.",
        retry: "Try again",
        markAllRead: "Mark all as read",
        moreOptions: "Display options",
        light: "Light theme",
        dark: "Dark theme",
        openNavigation: "Open dashboard navigation",
      }
    : {
        workspace: "Espace Côte d’Ivoire",
        ecosystem: "Talents · entreprises · campus",
        notifications: "Notifications",
        noNotifications: "Vous êtes à jour.",
        noNotificationsHint: "Les nouvelles activités apparaîtront ici.",
        unread: (count: number) => `${count} non lue${count > 1 ? "s" : ""}`,
        bellLabel: (count: number) => count > 0 ? `Notifications, ${count} non lues` : "Notifications",
        loadError: "Impossible d’actualiser les notifications.",
        retry: "Réessayer",
        markAllRead: "Tout marquer comme lu",
        moreOptions: "Options d’affichage",
        light: "Thème clair",
        dark: "Thème sombre",
        openNavigation: "Ouvrir la navigation du tableau de bord",
      }

  const refreshNotifications = React.useCallback(async () => {
    if (!user || refreshInFlight.current) {
      if (!user) {
        setNotifications([])
        setNotificationsLoaded(false)
      }
      return
    }

    refreshInFlight.current = true
    setNotificationsLoading(true)
    try {
      const response = await apiFetch<{ data: { notifications: NotificationRecord[] } }>("/api/notifications?limit=20")
      setNotifications(response.data.notifications)
      setNotificationsLoaded(true)
      setNotificationError(false)
    } catch (error) {
      console.error("Unable to refresh notifications.", error)
      setNotificationError(true)
    } finally {
      refreshInFlight.current = false
      setNotificationsLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    if (!user) return

    void refreshNotifications()
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshNotifications()
    }, 30_000)
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refreshNotifications()
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [refreshNotifications, user])

  const unreadCount = notifications.filter((notification) => !notification.read).length

  const markRead = async (ids: string[]) => {
    if (ids.length === 0) return
    const idSet = new Set(ids)
    setNotifications((current) => current.map((notification) => (
      idSet.has(notification.id) ? { ...notification, read: true } : notification
    )))

    try {
      await apiFetch("/api/notifications", {
        method: "PATCH",
        body: JSON.stringify({ ids }),
      })
      setNotificationError(false)
    } catch (error) {
      console.error("Unable to mark notifications as read.", error)
      setNotifications((current) => current.map((notification) => (
        idSet.has(notification.id) ? { ...notification, read: false } : notification
      )))
      setNotificationError(true)
    }
  }

  const openNotification = async (notification: NotificationRecord) => {
    if (!notification.read) await markRead([notification.id])
    if (notification.link?.startsWith("/") && !notification.link.startsWith("//")) {
      router.push(notification.link)
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-[4.5rem] shrink-0 items-center gap-2 border-b border-border/70 bg-background/90 px-3 pt-1 shadow-[0_8px_30px_-26px_hsl(var(--foreground)/0.45)] backdrop-blur-xl sm:gap-3 sm:px-5 lg:px-7">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 grid h-1 grid-cols-3">
        <span className="bg-terra" />
        <span className="bg-white dark:bg-ivory" />
        <span className="bg-primary" />
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 rounded-xl border border-transparent hover:border-border"
        onClick={toggleSidebar}
        aria-label={copy.openNavigation}
        aria-expanded={isMobile ? !isCollapsed : undefined}
      >
        <PanelLeft aria-hidden="true" />
      </Button>

      <div className="hidden min-w-0 items-center gap-3 lg:flex">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lagoon/10 text-lagoon">
          <MapPin className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate font-headline text-sm font-semibold text-foreground">{copy.workspace}</p>
          <p className="truncate text-xs text-muted-foreground">{copy.ecosystem}</p>
        </div>
      </div>

      <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
        <div className="w-11 overflow-hidden sm:w-auto">
          <SearchCommand />
        </div>

        <DropdownMenu onOpenChange={(open) => {
          if (open) void refreshNotifications()
        }}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative shrink-0 rounded-xl bg-card/80"
              aria-label={copy.bellLabel(unreadCount)}
            >
              <Bell aria-hidden="true" />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-terra px-1 text-[11px] font-extrabold text-terra-foreground ring-2 ring-background">
                  {Math.min(unreadCount, 99)}
                </span>
              ) : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="max-h-[min(36rem,calc(100dvh-6rem))] w-[calc(100vw-1.5rem)] overflow-y-auto rounded-2xl p-1.5 sm:w-96"
          >
            <DropdownMenuLabel className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="font-headline text-base font-semibold">{copy.notifications}</span>
              <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground" aria-live="polite">
                {notificationsLoading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
                {unreadCount > 0 ? copy.unread(unreadCount) : null}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {notificationError ? (
              <div className="mx-1.5 my-2 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive" role="alert">
                <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">{copy.loadError}</span>
                <Button variant="ghost" size="xs" onClick={() => void refreshNotifications()}>
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  {copy.retry}
                </Button>
              </div>
            ) : null}

            {!notificationsLoaded && notificationsLoading ? (
              <div className="flex min-h-32 items-center justify-center gap-2 px-4 text-sm text-muted-foreground" role="status">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                {language === "en" ? "Loading notifications…" : "Chargement des notifications…"}
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => {
                const Icon = notificationIcon(notification)
                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className="my-0.5 flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 focus:bg-primary/[0.08]"
                    onSelect={() => void openNotification(notification)}
                  >
                    <span className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      notification.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
                    )}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("block whitespace-normal text-sm leading-5", notification.read ? "font-medium" : "font-semibold")}>
                        {notification.title}
                      </span>
                      <span className="mt-0.5 block whitespace-normal text-xs leading-5 text-muted-foreground">
                        {notification.body}
                      </span>
                      <span className="mt-1 block text-[11px] font-medium text-muted-foreground">
                        {formatRelativeTime(notification.createdAt, language)}
                      </span>
                    </span>
                    {!notification.read ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-terra" aria-hidden="true" /> : null}
                  </DropdownMenuItem>
                )
              })
            ) : notificationsLoaded ? (
              <div className="px-5 py-8 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Check className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-semibold text-foreground">{copy.noNotifications}</p>
                <p className="mt-1 text-xs text-muted-foreground">{copy.noNotificationsHint}</p>
              </div>
            ) : null}

            {notifications.length > 0 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuFooter>
                  <Button
                    variant="ghost"
                    className="w-full rounded-xl"
                    onClick={() => void markRead(notifications.filter((notification) => !notification.read).map((notification) => notification.id))}
                    disabled={unreadCount === 0}
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    {copy.markAllRead}
                  </Button>
                </DropdownMenuFooter>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>

        <UserNav />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl" aria-label={copy.moreOptions}>
              <MoreHorizontal aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="mr-2 h-4 w-4" aria-hidden="true" />
              {copy.light}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="mr-2 h-4 w-4" aria-hidden="true" />
              {copy.dark}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
