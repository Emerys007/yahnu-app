
"use client"

import Link from "next/link"
import React from 'react';
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardLogo } from "@/components/ui/dashboard-logo"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  User,
  Briefcase,
  Building,
  FileText,
  Users2,
  Handshake,
  BarChart3,
  LifeBuoy,
  Settings,
  School,
  Shield,
  UserCheck,
  UserCog,
  BrainCircuit,
  MessageSquare,
  Award,
  Calendar,
  Wrench,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { useLocalization } from "@/context/localization-context";
import { useAuth, type Role } from "@/context/auth-context";
import { Separator } from "../ui/separator";
import { useToast } from "@/hooks/use-toast";

const getNavItems = (t: (key: string) => string, role: Role) => {
  const baseNav = [
    { href: "/dashboard", icon: LayoutDashboard, label: t('Dashboard') },
  ];

  const graduateNav = [
    ...baseNav,
    { href: "/dashboard/messages", icon: MessageSquare, label: t('Messages') },
    { href: "/dashboard/profile", icon: User, label: t('Profile') },
    { href: "/dashboard/jobs", icon: Briefcase, label: t('Job Search') },
    { href: "/dashboard/applications", icon: FileText, label: t('Applications') },
    { href: "/dashboard/events", icon: Calendar, label: t('Events') },
    { type: "divider", label: t('AI & Assessments') },
    { href: "/dashboard/assessments", icon: Award, label: t('Skill Certifications') },
    { href: "/dashboard/interview-prep", icon: BrainCircuit, label: t('Interview Prep') },
  ];

  const companyNav = [
    ...baseNav,
    { href: "/dashboard/messages", icon: MessageSquare, label: t('Messages') },
    { href: "/dashboard/organization-profile", icon: Building, label: t('Company Profile') },
    { href: "/dashboard/job-postings", icon: Briefcase, label: t('Job Postings')},
    { href: "/dashboard/applicants", icon: FileText, label: t('Applicants') },
    { href: "/dashboard/company-events", icon: Calendar, label: t('Event Management') },
    { href: "/dashboard/partnerships", icon: Handshake, label: t('Partnerships') },
    { href: "/dashboard/talent-pool", icon: Users2, label: t('Talent Pool') },
    { href: "/dashboard/reports", icon: BarChart3, label: t('Analytics') },
    { href: "/dashboard/reports/custom-report-generator", icon: Wrench, label: t('Report Generator') },
  ];
  
  const schoolNav = [
    ...baseNav,
    { href: "/dashboard/messages", icon: MessageSquare, label: t('Messages') },
    { href: "/dashboard/organization-profile", icon: School, label: t('School Profile')},
    { href: "/dashboard/graduates", icon: UserCheck, label: t('Manage Graduates')},
    { href: "/dashboard/school-events", icon: Calendar, label: t('Event Management')},
    { href: "/dashboard/partnerships", icon: Handshake, label: t('Partnerships') },
    { href: "/dashboard/reports", icon: BarChart3, label: t('Analytics') },
    { href: "/dashboard/reports/custom-report-generator", icon: Wrench, label: t('Report Generator') },
  ];

  const adminNav = [
    { href: "/dashboard/admin/overview", icon: Shield, label: t('Overview') },
    { href: "/dashboard/admin/users", icon: UserCog, label: t('Manage Users') },
    { href: "/dashboard/admin/team", icon: Users2, label: t('Manage Team') },
    { href: "/dashboard/admin/analytics", icon: BarChart3, label: t('Platform Analytics') },
    { href: "/dashboard/reports/custom-report-generator", icon: Wrench, label: t('Report Generator') },
  ];
  
  const bottomNav = [
      { href: "/dashboard/settings", icon: Settings, label: t('Settings') },
      { href: "/dashboard/support", icon: LifeBuoy, label: t('Support') },
      { type: "divider" },
      { action: "logout", icon: LogOut, label: t('Log out') },
  ]

  switch (role) {
    case 'graduate':
      return { main: graduateNav, footer: bottomNav };
    case 'company':
      return { main: companyNav, footer: bottomNav };
    case 'school':
      return { main: schoolNav, footer: bottomNav };
    case 'admin':
    case 'super_admin':
    case 'content_moderator':
    case 'support_staff':
      return { main: adminNav, footer: bottomNav };
    default:
      return { main: baseNav, footer: bottomNav };
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
  }), [isCollapsed, isMobile]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter();
  const { isCollapsed, isMobile, toggleSidebar } = useSidebar();
  const { t } = useLocalization();
  const { role, signOut } = useAuth();
  const { toast } = useToast();

  const { main: navItems, footer: footerNavItems } = getNavItems(t, role);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      toast({
        title: "Uh oh! Something went wrong.",
        description: "There was a problem logging you out.",
        variant: "destructive",
      });
    }
  };

  const renderNavItem = (item: any, index: number) => {
    if (item.type === 'divider') {
        return (
             <motion.div 
                key={`divider-${index}`} 
                className={cn("px-3 py-2", isCollapsed && "px-1 my-2")}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: index * 0.05 } }}
            >
                {isCollapsed ? <hr className="border-t border-muted-foreground/20" /> : item.label ? <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">{item.label}</h2> : <Separator />}
            </motion.div>
        )
    }

    const isActive = item.href && pathname === item.href;

    const buttonContent = (
      <>
        <item.icon className={cn("h-5 w-5 shrink-0", isCollapsed && "mx-auto")} />
        <span className={cn("ml-3 text-left", isCollapsed && "hidden")}>{item.label}</span>
      </>
    );

    const commonButtonProps = {
        variant: "ghost" as const,
        className: cn(
            "w-full h-auto min-h-11 text-base font-normal py-2 px-3", 
            isCollapsed ? 'justify-center' : 'justify-start',
            isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
        )
    };

    return (
        <TooltipProvider key={item.label || `action-${index}`} delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05 } }}
                    className="relative"
                >
                {item.href ? (
                    <Button {...commonButtonProps} asChild>
                      <Link href={item.href}>
                        <div className="relative z-10 flex items-center">{buttonContent}</div>
                      </Link>
                    </Button>
                ) : (
                    <Button {...commonButtonProps} onClick={item.action === 'logout' ? handleSignOut : undefined}>
                        <div className="relative z-10 flex items-center">{buttonContent}</div>
                    </Button>
                )}
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
    <div className="flex flex-col h-full">
      <div className={cn("flex h-16 items-center border-b px-4 shrink-0", isCollapsed && "h-16 justify-center px-0")}>
        <Link href="/dashboard" className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <DashboardLogo className={cn("h-12 w-12 text-primary transition-all", isCollapsed && "h-8 w-8")} />
          <div className={cn("flex flex-col transition-opacity duration-200", isCollapsed && "opacity-0 hidden")}>
            <h1 className="text-xl font-bold">Yahnu</h1>
            <p className="text-xs text-muted-foreground">{t('Your future starts here')}</p>
          </div>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item, index) => renderNavItem(item, index))}
        </nav>
      </div>
      <div className="mt-auto p-2">
        <nav className="space-y-1">
            {footerNavItems.map((item, index) => renderNavItem(item, index))}
        </nav>
        <div className={cn("text-center text-xs text-muted-foreground py-2 px-4", isCollapsed && "hidden")}>
              <p>&copy; {new Date().getFullYear()} Yahnu.</p>
          </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={!isCollapsed} onOpenChange={toggleSidebar}>
        <SheetContent side="left" className="p-0 w-72 flex flex-col">
           <SheetHeader>
                <SheetTitle className="sr-only">Dashboard Navigation</SheetTitle>
           </SheetHeader>
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
