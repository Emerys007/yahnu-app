
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
  LogOut,
  Newspaper,
  Ticket,
  Search,
  Megaphone,
  HeartPulse,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { useAuth, type Role } from "@/context/auth-context";
import { Separator } from "../ui/separator";
import { useToast } from "@/hooks/use-toast";

const getNavItems = (role: Role) => {
  const baseNav = [
    { href: "/dashboard/admin/overview", icon: LayoutDashboard, label: 'Tableau de bord' },
  ];

  const graduateNav = [
    { href: "/dashboard", icon: LayoutDashboard, label: 'Tableau de bord' },
    { href: "/dashboard/messages", icon: MessageSquare, label: 'Messagerie' },
    { href: "/dashboard/profile", icon: User, label: 'Profil' },
    { href: "/dashboard/jobs", icon: Briefcase, label: "Recherche d'emploi" },
    { href: "/dashboard/applications", icon: FileText, label: 'Candidatures' },
    { href: "/dashboard/events", icon: Calendar, label: 'Événements' },
    { type: "divider", label: 'IA & Évaluations' },
    { href: "/dashboard/assessments", icon: Award, label: 'Certifications' },
    { href: "/dashboard/interview-prep", icon: BrainCircuit, label: 'Préparation aux entretiens' },
  ];

  const companyNav = [
    { href: "/dashboard", icon: LayoutDashboard, label: 'Tableau de bord' },
    { href: "/dashboard/messages", icon: MessageSquare, label: 'Messagerie' },
    { href: "/dashboard/company-profile", icon: Building, label: "Profil de l'entreprise" },
    { href: "/dashboard/job-postings", icon: Briefcase, label: "Offres d'emploi"},
    { href: "/dashboard/applications", icon: FileText, label: 'Candidats' },
    { href: "/dashboard/company-events", icon: Calendar, label: "Gestion d'événements" },
    { href: "/dashboard/partnerships", icon: Handshake, label: 'Partenariats' },
    { href: "/dashboard/talent-pool", icon: Users2, label: 'Vivier de talents' },
    { type: "divider", label: "Analytique" },
    { href: "/dashboard/reports", icon: BarChart3, label: 'Rapports et analyses' },
  ];
  
  const schoolNav = [
    { href: "/dashboard", icon: LayoutDashboard, label: 'Tableau de bord' },
    { href: "/dashboard/messages", icon: MessageSquare, label: 'Messagerie' },
    { href: "/dashboard/school-profile", icon: School, label: "Profil de l'école"},
    { href: "/dashboard/graduate-management", icon: UserCheck, label: 'Gestion des diplômés'},
    { href: "/dashboard/school-events", icon: Calendar, label: "Gestion d'événements"},
    { href: "/dashboard/partnerships", icon: Handshake, label: 'Partenariats' },
    { type: "divider", label: "Analytique" },
    { href: "/dashboard/reports", icon: BarChart3, label: 'Rapports et analyses' },
  ];

  const superAdminNav = [
    ...baseNav,
    { href: "/dashboard/admin/user-management", icon: UserCog, label: 'Gestion des utilisateurs' },
    { href: "/dashboard/admin/manage-team", icon: Users2, label: "Gérer l'équipe" },
    { href: "/dashboard/admin/analytics", icon: BarChart3, label: 'Analytique' },
    { type: "divider", label: "Contenu & Support" },
    { href: "/dashboard/admin/blog", icon: Newspaper, label: 'Gestion du blog' },
    { href: "/dashboard/support/center", icon: LifeBuoy, label: 'Support' },
    { type: "divider", label: 'Outils de support' },
    { href: "/dashboard/support/announcements", icon: Megaphone, label: 'Annonces' },
    { href: "/dashboard/support/system-health", icon: HeartPulse, label: 'Santé du système' },
    { href: "/dashboard/support/knowledge-base-editor", icon: BookOpen, label: 'Base de connaissances' },
    { href: "/dashboard/reports", icon: BarChart3, label: 'Rapports et analyses' },
  ];

  const adminNav = [
    ...baseNav,
    { href: "/dashboard/admin/user-management", icon: UserCog, label: 'Gestion des utilisateurs' },
    { href: "/dashboard/admin/analytics", icon: BarChart3, label: 'Analytique' },
    { type: "divider", label: "Contenu & Support" },
    { href: "/dashboard/admin/blog", icon: Newspaper, label: 'Gestion du blog' },
    { href: "/dashboard/support/center", icon: LifeBuoy, label: 'Support' },
    { type: "divider", label: 'Outils de support' },
    { href: "/dashboard/support/announcements", icon: Megaphone, label: 'Annonces' },
    { href: "/dashboard/support/system-health", icon: HeartPulse, label: 'Santé du système' },
    { href: "/dashboard/support/knowledge-base-editor", icon: BookOpen, label: 'Base de connaissances' },
    { href: "/dashboard/reports", icon: BarChart3, label: 'Rapports et analyses' },
  ];
  
  const contentManagerNav = [
    { href: "/dashboard", icon: LayoutDashboard, label: 'Tableau de bord' },
    { type: "divider", label: 'Gestion de Contenu' },
    { href: "/dashboard/content/blog", icon: Newspaper, label: 'Gestion du blog' },
    { href: "/dashboard/support/announcements", icon: Megaphone, label: 'Annonces' },
    { href: "/dashboard/support/knowledge-base-editor", icon: BookOpen, label: 'Base de connaissances' },
  ];
  
  const supportStaffNav = [
    { href: "/dashboard/support/center", icon: LifeBuoy, label: 'Centre de support' },
    { href: "/dashboard/messages", icon: MessageSquare, label: 'Messagerie' },
    { type: "divider", label: 'Outils' },
    { href: "/dashboard/support/user-lookup", icon: Search, label: "Recherche d'utilisateur" },
    { href: "/dashboard/support/announcements", icon: Megaphone, label: 'Annonces' },
    { href: "/dashboard/support/system-health", icon: HeartPulse, label: 'Santé du système' },
    { href: "/dashboard/support/knowledge-base-editor", icon: BookOpen, label: 'Base de connaissances' },
  ];
  
  const bottomNav = [
      { href: "/dashboard/settings", icon: Settings, label: 'Paramètres' },
      { href: "/dashboard/support", icon: LifeBuoy, label: 'Support' },
      { type: "divider" },
      { action: "logout", icon: LogOut, label: 'Déconnexion' },
  ]
  
  const adminFooterNav = [
       { href: "/dashboard/settings", icon: Settings, label: 'Paramètres' },
       { action: "logout", icon: LogOut, label: 'Déconnexion' },
  ]

  switch (role) {
    case 'graduate':
      return { main: graduateNav, footer: bottomNav };
    case 'company':
      return { main: companyNav, footer: bottomNav };
    case 'school':
      return { main: schoolNav, footer: adminFooterNav };
    case 'super_admin':
      return { main: superAdminNav, footer: adminFooterNav };
    case 'admin':
      return { main: adminNav, footer: adminFooterNav };
    case 'content_manager':
    case 'content_moderator':
      return { main: contentManagerNav, footer: adminFooterNav };
    case 'support_staff':
        return { main: supportStaffNav, footer: adminFooterNav };
    default:
      return { main: [], footer: bottomNav };
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
  const { role, signOut } = useAuth();
  const { toast } = useToast();

  const { main: navItems, footer: footerNavItems } = getNavItems(role);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
      toast({
        title: "Déconnecté",
        description: "Vous avez été déconnecté avec succès.",
      });
    } catch (error) {
      toast({
        title: "Oh non ! Une erreur s'est produite.",
        description: "Un problème est survenu lors de votre déconnexion.",
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

    const isActive = item.href && pathname.startsWith(item.href) && (item.href === '/dashboard' || item.href === '/dashboard/admin/overview' ? pathname === item.href : true);

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
            <p className="text-xs text-muted-foreground">{"Votre avenir commence ici"}</p>
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
