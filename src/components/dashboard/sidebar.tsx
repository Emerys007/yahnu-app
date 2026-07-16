"use client"

import Link from "next/link"
import * as React from "react"
import { LogOut } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DashboardLogo } from "@/components/ui/dashboard-logo"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/context/auth-context"
import { useLocalization } from "@/context/localization-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { useToast } from "@/hooks/use-toast"
import {
  getDashboardNavigationGroups,
  resolveDashboardLabel,
  type DashboardNavigationGroup,
  type DashboardNavigationRoute,
} from "@/lib/dashboard-navigation"
import { cn } from "@/lib/utils"

type SidebarContextType = {
  isCollapsed: boolean
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider")
  return context
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const [isCollapsed, setIsCollapsed] = React.useState(isMobile)

  React.useEffect(() => {
    setIsCollapsed(isMobile)
  }, [isMobile])

  const toggleSidebar = React.useCallback(() => {
    setIsCollapsed((current) => !current)
  }, [])

  const value = React.useMemo(() => ({
    isCollapsed,
    isMobile,
    toggleSidebar,
  }), [isCollapsed, isMobile, toggleSidebar])

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { isCollapsed, isMobile, toggleSidebar } = useSidebar()
  const { role, signOut } = useAuth()
  const { language, t } = useLocalization()
  const { toast } = useToast()

  const mainGroups = React.useMemo(() => getDashboardNavigationGroups(role, "main"), [role])
  const footerGroups = React.useMemo(() => getDashboardNavigationGroups(role, "footer"), [role])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
      toast({
        title: "Déconnecté",
        description: "Vous avez été déconnecté avec succès.",
      })
    } catch {
      toast({
        title: "Déconnexion impossible",
        description: "Un problème est survenu. Veuillez réessayer.",
        variant: "destructive",
      })
    }
  }

  const closeMobileSidebar = () => {
    if (isMobile && !isCollapsed) toggleSidebar()
  }

  const renderDivider = (group: DashboardNavigationGroup) => (
    <div
      key={`divider-${group.id}`}
      className={cn("px-3 py-2", isCollapsed && "my-2 px-1")}
    >
      {isCollapsed ? (
        <hr className="border-t border-sidebar-border" />
      ) : (
        <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-sidebar-foreground/45">
          {resolveDashboardLabel(group.label, t, language)}
        </h2>
      )}
    </div>
  )

  const renderRoute = (item: DashboardNavigationRoute) => {
    const label = resolveDashboardLabel(item.label, t, language)
    const isActive = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(`${item.path}/`))

    return (
      <TooltipProvider key={item.id} delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <Button
                variant="ghost"
                className={cn(
                  "h-auto min-h-11 w-full px-3 py-2 text-base font-normal",
                  isCollapsed ? "justify-center" : "justify-start",
                  isActive
                    ? "bg-terra text-terra-foreground hover:bg-terra/90 hover:text-terra-foreground"
                    : "text-sidebar-foreground/68 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
                asChild
              >
                <Link href={item.path} onClick={closeMobileSidebar} aria-current={isActive ? "page" : undefined}>
                  <span className="relative z-10 flex items-center">
                    <item.icon className={cn("h-5 w-5 shrink-0", isCollapsed && "mx-auto")} aria-hidden="true" />
                    <span className={cn("ml-3 text-left", isCollapsed && "hidden")}>{label}</span>
                  </span>
                </Link>
              </Button>
            </div>
          </TooltipTrigger>
          {isCollapsed ? <TooltipContent side="right">{label}</TooltipContent> : null}
        </Tooltip>
      </TooltipProvider>
    )
  }

  const renderGroups = (groups: DashboardNavigationGroup[]) => {
    return groups.flatMap((group, groupIndex) => {
      const entries: React.ReactNode[] = []
      if (groupIndex > 0) entries.push(renderDivider(group))
      group.items.forEach((item) => entries.push(renderRoute(item)))
      return entries
    })
  }

  const logoutLabel = t("common.logout") === "common.logout"
    ? (language === "en" ? "Sign out" : "Déconnexion")
    : t("common.logout")

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn("flex h-[4.75rem] shrink-0 items-center border-b border-sidebar-border px-4", isCollapsed && "justify-center px-0")}>
        <Link href="/dashboard" className={cn("flex items-center gap-3", isCollapsed && "justify-center")} onClick={closeMobileSidebar}>
          <DashboardLogo className={cn("h-11 w-11 text-sidebar-foreground transition-all", isCollapsed && "h-8 w-8")} />
          <div className={cn("flex flex-col transition-opacity duration-200", isCollapsed && "hidden opacity-0")}>
            <h1 className="font-display text-xl font-bold tracking-tight text-white">Yahnu</h1>
            <p className="text-xs text-sidebar-foreground/55">Le talent ivoirien en mouvement</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <nav className="flex-1 space-y-1 px-2 py-4" aria-label={language === "en" ? "Dashboard navigation" : "Navigation du tableau de bord"}>
          {renderGroups(mainGroups)}
        </nav>
      </div>

      <div className="mt-auto p-2">
        <nav className="space-y-1" aria-label={language === "en" ? "Account navigation" : "Navigation du compte"}>
          {renderGroups(footerGroups)}
          <Separator className="my-2 bg-sidebar-border" />
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "h-auto min-h-11 w-full px-3 py-2 text-base font-normal text-sidebar-foreground/68 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    isCollapsed ? "justify-center" : "justify-start",
                  )}
                  onClick={handleSignOut}
                >
                  <LogOut className={cn("h-5 w-5 shrink-0", isCollapsed && "mx-auto")} aria-hidden="true" />
                  <span className={cn("ml-3 text-left", isCollapsed && "hidden")}>{logoutLabel}</span>
                </Button>
              </TooltipTrigger>
              {isCollapsed ? <TooltipContent side="right">{logoutLabel}</TooltipContent> : null}
            </Tooltip>
          </TooltipProvider>
        </nav>
        <div className={cn("px-4 py-2 text-center text-xs text-sidebar-foreground/40", isCollapsed && "hidden")}>
          <p>&copy; {new Date().getFullYear()} Yahnu.</p>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={!isCollapsed} onOpenChange={toggleSidebar}>
        <SheetContent side="left" className="flex w-72 flex-col border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
          <SheetHeader>
            <SheetTitle className="sr-only">{language === "en" ? "Dashboard navigation" : "Navigation du tableau de bord"}</SheetTitle>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside className={cn(
      "sticky top-0 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out lg:flex",
      isCollapsed ? "w-20" : "w-72",
    )}>
      {sidebarContent}
    </aside>
  )
}
