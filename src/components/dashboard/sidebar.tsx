
"use client"

import Link from "next/link"
import React from 'react';
import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  User,
  Briefcase,
  Building,
  ClipboardCheck,
  BarChart3,
  LifeBuoy,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "../ui/sheet";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { useLocalization } from "@/context/localization-context";

const getNavItems = (t: (key: string) => string) => [
  { href: "/dashboard", icon: LayoutDashboard, label: t('Dashboard') },
  { href: "/dashboard/profile", icon: User, label: t('Profile') },
  { href: "/dashboard/jobs", icon: Briefcase, label: t('Job Search') },
  { href: "/dashboard/company-profile", icon: Building, label: t('Company Profile') },
  { type: "divider", label: t('AI Tools') },
  { href: "/dashboard/assessments", icon: ClipboardCheck, label: t('Assessments') },
  { href: "/dashboard/reports", icon: BarChart3, label: t('Reports') },
];

const getHelpAndSettingsItems = (t: (key: string) => string) => [
    { href: "/dashboard/support", icon: LifeBuoy, label: t('Support') },
    { href: "/dashboard/settings", icon: Settings, label: t('Settings') },
]

type SidebarContextType = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const isMobile = useIsMobile();
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  const value = React.useMemo(() => ({
    isCollapsed: isMobile ? false : isCollapsed, // always expanded on mobile sheet
    toggleSidebar,
  }), [isCollapsed, toggleSidebar, isMobile]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const { isCollapsed } = useSidebar();
  const isMobile = useIsMobile();
  const { t } = useLocalization();

  const navItems = getNavItems(t);
  const helpAndSettingsItems = getHelpAndSettingsItems(t);

  const renderNavItem = (item: any, index: number) => {
    if (item.type === 'divider') {
        return (
             <div key={`divider-${index}`} className={cn("px-3 py-2", isCollapsed && "px-1")}>
                {isCollapsed ? <hr className="my-2 border-t border-muted-foreground/20" /> : <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">{item.label}</h2>}
            </div>
        )
    }

    const isActive = pathname === item.href

    const buttonContent = (
      <>
        <item.icon className={cn("h-5 w-5", isCollapsed && "mx-auto")} />
        <span className={cn("ml-3", isCollapsed && "hidden")}>{item.label}</span>
      </>
    );

    return (
        <TooltipProvider key={item.label} delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn("w-full h-10", isCollapsed ? 'justify-center' : 'justify-start')}
                  asChild
                >
                  <Link href={item.href}>
                    {buttonContent}
                  </Link>
                </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right">
                {item.label}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
    )
  }

  const sidebarContent = (
    <>
      <div className="flex items-center h-16 px-6 border-b gap-3 shrink-0">
          <Logo className={cn("h-8 w-8 text-primary transition-all", isCollapsed && "h-8 w-8")} />
          <h1 className={cn("text-xl font-bold transition-opacity duration-200", isCollapsed && "opacity-0 hidden")}>Yahnu</h1>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map(renderNavItem)}
      </nav>
      <div className="mt-auto p-4 space-y-1 border-t">
            {helpAndSettingsItems.map(renderNavItem)}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={!isCollapsed} onOpenChange={useSidebar().toggleSidebar}>
        <SheetContent side="left" className="p-0 w-64">
           <div className="flex flex-col h-full">
            {sidebarContent}
           </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className={cn("hidden lg:flex lg:flex-col border-r bg-card transition-all duration-300", isCollapsed ? "w-20" : "w-64")}>
        <div className="flex flex-col flex-grow">
           {sidebarContent}
        </div>
    </div>
  )
}
