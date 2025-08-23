
"use client"

import * as React from "react"
import {
  Calendar,
  Settings,
  User,
  Search as SearchIcon,
  LayoutDashboard,
  Briefcase,
  Building,
  School,
  FileText,
  Users2,
  Handshake,
  BarChart3,
  LifeBuoy,
  Shield,
  UserCheck,
  UserCog,
  BrainCircuit,
  MessageSquare,
  Award,
  Wrench,
  Newspaper,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { useAuth, type Role } from "@/context/auth-context"

const getNavItems = (role: Role) => {
    const allItems = [
        // Graduate
        { group: 'Navigation', text: 'Tableau de bord', icon: LayoutDashboard, href: '/dashboard', roles: ['graduate'] },
        { group: 'Navigation', text: 'Mon Profil', icon: User, href: '/dashboard/profile', roles: ['graduate'] },
        { group: 'Navigation', text: 'Recherche d\'emploi', icon: Briefcase, href: '/dashboard/jobs', roles: ['graduate'] },
        { group: 'Navigation', text: 'Mes Candidatures', icon: FileText, href: '/dashboard/applications', roles: ['graduate'] },
        { group: 'Navigation', text: 'Événements', icon: Calendar, href: '/dashboard/events', roles: ['graduate'] },
        { group: 'Outils IA', text: 'Certifications', icon: Award, href: '/dashboard/assessments', roles: ['graduate'] },
        { group: 'Outils IA', text: 'Préparation aux entretiens', icon: BrainCircuit, href: '/dashboard/interview-prep', roles: ['graduate'] },

        // Company
        { group: 'Navigation', text: 'Tableau de bord', icon: LayoutDashboard, href: '/dashboard', roles: ['company'] },
        { group: 'Navigation', text: 'Profil de l\'entreprise', icon: Building, href: '/dashboard/organization-profile', roles: ['company'] },
        { group: 'Navigation', text: 'Offres d\'emploi', icon: Briefcase, href: '/dashboard/job-postings', roles: ['company'] },
        { group: 'Navigation', text: 'Candidats', icon: FileText, href: '/dashboard/applicants', roles: ['company'] },
        { group: 'Navigation', text: 'Vivier de talents', icon: Users2, href: '/dashboard/talent-pool', roles: ['company'] },
        { group: 'Navigation', text: 'Gestion d\'événements', icon: Calendar, href: '/dashboard/company-events', roles: ['company'] },
        { group: 'Navigation', text: 'Partenariats', icon: Handshake, href: '/dashboard/partnerships', roles: ['company'] },

        // School
        { group: 'Navigation', text: 'Tableau de bord', icon: LayoutDashboard, href: '/dashboard', roles: ['school'] },
        { group: 'Navigation', text: 'Profil de l\'école', icon: School, href: '/dashboard/organization-profile', roles: ['school'] },
        { group: 'Navigation', text: 'Gestion des diplômés', icon: UserCheck, href: '/dashboard/graduates', roles: ['school'] },
        { group: 'Navigation', text: 'Gestion d\'événements', icon: Calendar, href: '/dashboard/school-events', roles: ['school'] },
        { group: 'Navigation', text: 'Partenariats', icon: Handshake, href: '/dashboard/partnerships', roles: ['school'] },

        // Admin, Super Admin
        { group: 'Admin', text: 'Aperçu', icon: Shield, href: '/dashboard/admin/overview', roles: ['admin', 'super_admin'] },
        { group: 'Admin', text: 'Gestion des utilisateurs', icon: UserCog, href: '/dashboard/admin/user-management', roles: ['admin', 'super_admin'] },
        { group: 'Admin', text: 'Analytique', icon: BarChart3, href: '/dashboard/admin/analytics', roles: ['admin', 'super_admin'] },
        { group: 'Admin', text: 'Gestion de contenu', icon: Newspaper, href: '/dashboard/content', roles: ['admin', 'super_admin'] },
        { group: 'Admin', text: 'Centre de Support', icon: LifeBuoy, href: '/dashboard/support/center', roles: ['admin', 'super_admin'] },
        { group: 'Admin', text: 'Gérer l\'équipe', icon: Users2, href: '/dashboard/admin/manage-team', roles: ['super_admin'] },

        // Content Manager
        { group: 'Navigation', text: 'Gestion de contenu', icon: Newspaper, href: '/dashboard/content', roles: ['content_manager'] },

        // Support Staff
        { group: 'Navigation', text: 'Centre de Support', icon: LifeBuoy, href: '/dashboard/support/center', roles: ['support_staff'] },
        { group: 'Navigation', text: 'Recherche d\'utilisateur', icon: SearchIcon, href: '/dashboard/support/user-lookup', roles: ['support_staff'] },
        
        // Common
        { group: 'Commun', text: 'Messagerie', icon: MessageSquare, href: '/dashboard/messages', roles: ['graduate', 'company', 'school', 'support_staff'] },
        { group: 'Commun', text: 'Paramètres', icon: Settings, href: '/dashboard/settings', roles: ['graduate', 'company', 'school', 'admin', 'super_admin', 'content_manager', 'support_staff'] },
        { group: 'Commun', text: 'Support', icon: LifeBuoy, href: '/dashboard/support', roles: ['graduate', 'company', 'school'] },

        // Reports
        { group: 'Rapports', text: 'Analytique de recrutement', icon: BarChart3, href: '/dashboard/reports/company-analytics', roles: ['company'] },
        { group: 'Rapports', text: 'Analytique de placement', icon: BarChart3, href: '/dashboard/reports/school-analytics', roles: ['school'] },
        { group: 'Rapports', text: 'Générateur de rapports', icon: Wrench, href: '/dashboard/reports/custom-report-generator', roles: ['company', 'school', 'admin', 'super_admin'] },

    ];

    const userNavItems = allItems.filter(item => item.roles.includes(role));

    const groupedItems = userNavItems.reduce((acc, item) => {
        const group = item.group;
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(item);
        return acc;
    }, {} as Record<string, typeof userNavItems>);
    
    return groupedItems;
}


export function SearchCommand() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { role } = useAuth();

  const groupedNavItems = React.useMemo(() => getNavItems(role), [role]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start text-muted-foreground sm:w-64"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">Rechercher...</span>
        <span className="ml-auto hidden lg:inline-flex">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </span>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={'Saisissez une commande ou effectuez une recherche...'} />
        <CommandList>
            <CommandEmpty>{'Aucun résultat trouvé.'}</CommandEmpty>
            {Object.entries(groupedNavItems).map(([groupName, items]) => (
                <CommandGroup key={groupName} heading={groupName}>
                    {items.map((item) => (
                        <CommandItem
                        key={item.href}
                        value={`${groupName} ${item.text}`}
                        onSelect={() => runCommand(() => router.push(item.href))}
                        >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.text}
                        </CommandItem>
                    ))}
                </CommandGroup>
            ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
