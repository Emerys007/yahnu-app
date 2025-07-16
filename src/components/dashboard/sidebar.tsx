
"use client"

import Link from "next/link"
import React from 'react';
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
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
  School,
  FileText,
  Users2,
  Handshake,
  Shield,
  UserCheck,
  Users,
  BrainCircuit,
  MessageSquare,
  UserCog,
  Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent } from "../ui/sheet";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { useLocalization } from "@/context/localization-context";
import { useAuth, type Role } from "@/context/auth-context";

const getNavItems = (t: (key: string) => string, role: Role) => {
  const baseNav = [
    { href: "/dashboard", icon: LayoutDashboard, label: t('Dashboard') },
    { href: "/dashboard/messages", icon: MessageSquare, label: t('Messages') },
  ];

  const graduateNav = [
    ...baseNav,
    { href: "/dashboard/profile", icon: User, label: t('Profile') },
    { href: "/dashboard/jobs", icon: Briefcase, label: t('Job Search') },
    { href: "/dashboard/applications", icon: FileText, label: t('Applications') },
    { href: "/dashboard/events", icon: Calendar, label: t('Events') },
  ];

  const companyNav = [
    ...baseNav,
    { href: "/dashboard/company-profile", icon: Building, label: t('Company Profile') },
    { href: "/dashboard/applications", icon: FileText, label: t('Applications') },
    { href: "/dashboard/company-events", icon: Calendar, label: t('Event Management') },
    { href: "/dashboard/partnerships", icon: Handshake, label: t('Partnerships') },
    { href: "/dashboard/talent-pool", icon: Users2, label: t('Talent Pool') },
    { href: "/dashboard/reports", icon: BarChart3, label: t('Analytics') },
    { type: "divider", label: t('AI Tools') },
    { href: "/dashboard/assessments", icon: ClipboardCheck, label: t('Assessments') },
  ];
  
  const schoolNav = [
    ...baseNav,
    { href: "/dashboard/school-profile", icon: School, label: t('School Profile')},
    { href: "/dashboard/graduate-management", icon: UserCheck, label: t('Graduate Management')},
    { href: "/dashboard/school-events", icon: Calendar, label: t('Event Management')},
    { href: "/dashboard/partnerships", icon: Handshake, label: t('Partnerships') },
    { href: "/dashboard/reports", icon: BarChart3, label: t('Analytics') },
  ];

  const adminNav = [
    { href: "/dashboard/admin/overview", icon: Shield, label: t('Overview') },
    { href: "/dashboard/admin/user-management", icon: UserCog, label: t('Manage Users') },
    { href: "/dashboard/admin/manage-team", icon: Users2, label: t('Manage Team') },
    { href: "/dashboard/admin/analytics", icon: BarChart3, label: t('Platform Analytics') },
  ];
  
  const bottomNav = [
      { type: "divider", label: t('Help & Settings')},
      { href: "/dashboard/settings", icon: Settings, label: t('Settings') },
      { href: "/dashboard/support", icon: LifeBuoy, label: t('Support') },
  ]

  switch (role) {
    case 'graduate':
      return [...graduateNav, ...bottomNav];
    case 'company':
      return [...companyNav, ...bottomNav];
    case 'school':
      return [...schoolNav, ...bottomNav];
    case 'admin':
      return [...adminNav, ...bottomNav];
    default:
      return [...baseNav, ...bottomNav];
  }
}

type SidebarContextType = {
  isCollapsed: boolean;
  isMobile: boolean;
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
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = React.useState(isMobile);
  
  React.useEffect(() => {
    setIsCollapsed(isMobile);
  }, [isMobile]);
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  const value = React.useMemo(() => ({
    isCollapsed,
    isMobile,
    toggleSidebar,
  }), [isCollapsed, isMobile, toggleSidebar]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const { isCollapsed, isMobile, toggleSidebar } = useSidebar();
  const { t } = useLocalization();
  const { role } = useAuth();

  const navItems = getNavItems(t, role);

  const renderNavItem = (item: any, index: number) => {
    if (item.type === 'divider') {
        return (
             <motion.div 
                key={`divider-${index}`} 
                className={cn("px-3 py-2", isCollapsed && "px-1 my-2")}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: index * 0.05 } }}
            >
                {isCollapsed ? <hr className="border-t border-muted-foreground/20" /> : <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">{item.label}</h2>}
            </motion.div>
        )
    }

    const isActive = pathname === item.href

    const buttonContent = (
      <>
        <item.icon className={cn("h-5 w-5 shrink-0", isCollapsed && "mx-auto")} />
        <span className={cn("ml-3 whitespace-nowrap", isCollapsed && "hidden")}>{item.label}</span>
      </>
    );

    return (
        <TooltipProvider key={item.href} delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05 } }}
                    className="relative"
                >
                <Button
                  variant="ghost"
                  className={cn(
                      "w-full h-10 text-base font-normal", 
                      isCollapsed ? 'justify-center' : 'justify-start',
                      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    )}
                  asChild
                >
                  <Link href={item.href}>
                    {isActive && !isCollapsed && (
                        <motion.div 
                            layoutId="sidebar-active-bg"
                            className="absolute inset-0 bg-primary/10 rounded-lg"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                         />
                    )}
                    <div className="relative z-10 flex items-center">
                        {buttonContent}
                    </div>
                  </Link>
                </Button>
                </motion.div>
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
      <div className={cn("flex h-16 items-center border-b px-4 shrink-0", isCollapsed && "h-16 justify-center px-0")}>
        <Link href="/dashboard" className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <Logo className={cn("h-10 w-10 text-primary transition-all", isCollapsed && "h-8 w-8")} />
          <div className={cn("flex flex-col transition-opacity duration-200", isCollapsed && "opacity-0 hidden")}>
            <h1 className="text-xl font-bold">Yahnu</h1>
            <p className="text-xs text-muted-foreground">{t('Your future starts here')}</p>
          </div>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map(renderNavItem)}
        </nav>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={!isCollapsed} onOpenChange={toggleSidebar}>
        <SheetContent side="left" className="p-0 w-72 flex flex-col">
           {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className={cn("hidden lg:flex flex-col border-r bg-card transition-all duration-300 ease-in-out sticky top-0 h-screen", isCollapsed ? "w-20" : "w-72")}>
        {sidebarContent}
    </aside>
  )
}
