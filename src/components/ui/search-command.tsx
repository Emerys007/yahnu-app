
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
import { Button } from "./button"
import { useAuth, type Role } from "@/context/auth-context"

const getNavItems = (role: Role) => {
    const main = [
        {
            group: 'Tableau de bord',
            items: [
                { icon: LayoutDashboard, text: 'Accueil', onSelect: (router) => router.push('/dashboard') },
                { icon: User, text: 'Profil', onSelect: (router) => router.push('/dashboard/profile') },
            ],
            roles: ['admin', 'graduate', 'company', 'school'],
        },
        {
            group: 'Offres d\'emploi',
            items: [
                { icon: Briefcase, text: 'Mes candidatures', onSelect: (router) => router.push('/dashboard/my-applications') },
                { icon: Building, text: 'Profils d\'entreprises', onSelect: (router) => router.push('/dashboard/company-profiles') },
                { icon: School, text: 'Profils d\'écoles', onSelect: (router) => router.push('/dashboard/school-profiles') },
            ],
            roles: ['admin', 'graduate'],
        },
        {
            group: 'Recrutement',
            items: [
                { icon: FileText, text: 'Publier une offre', onSelect: (router) => router.push('/dashboard/job-postings/new') },
                { icon: Users2, text: 'Candidats', onSelect: (router) => router.push('/dashboard/candidates') },
                { icon: Handshake, text: 'Partenariats', onSelect: (router) => router.push('/dashboard/partnerships') },
            ],
            roles: ['admin', 'company', 'school'],
        },
    ];

    const footer = [
        {
            group: 'Général',
            items: [
                { icon: Settings, text: 'Paramètres', onSelect: (router) => router.push('/dashboard/settings') },
                { icon: LifeBuoy, text: 'Support', onSelect: (router) => router.push('/dashboard/support') },
            ],
            roles: ['admin', 'graduate', 'company', 'school'],
        },
        {
            group: 'Admin',
            items: [
                { icon: Shield, text: 'Sécurité', onSelect: (router) => router.push('/dashboard/admin/security') },
                { icon: UserCheck, text: 'Approbations', onSelect: (router) => router.push('/dashboard/admin/approvals') },
                { icon: UserCog, text: 'Gestion des utilisateurs', onSelect: (router) => router.push('/dashboard/admin/user-management') },
            ],
            roles: ['admin'],
        },
        {
            group: 'Outils IA',
            items: [
                { icon: BrainCircuit, text: 'Aperçus IA', onSelect: (router) => router.push('/dashboard/ai/insights') },
                { icon: MessageSquare, text: 'Constructeur de chatbot', onSelect: (router) => router.push('/dashboard/ai/chatbot-builder') },
                { icon: Award, text: 'Générateur d\'évaluations', onSelect: (router) => router.push('/dashboard/ai/assessment-generator') },
            ],
            roles: ['admin', 'company', 'school'],
        },
        {
            group: 'Rapports',
            items: [
                 { icon: BarChart3, text: 'Analytique', onSelect: (router) => router.push('/dashboard/reports') },
                 { icon: Wrench, text: 'Générateur de rapports', onSelect: (router) => router.push('/dashboard/reports/custom-report-generator') },
            ],
             roles: ['admin', 'company', 'school'],
        }
    ];

    const filterByRole = (items: any[]) => items.filter(group => group.roles.includes(role));

    return { main: filterByRole(main), footer: filterByRole(footer) };
}


export function SearchCommand() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { role } = useAuth();

  const {main: mainItems, footer: footerItems} = React.useMemo(() => getNavItems(role), [role]);

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

            {mainItems.map((group) => (
                <CommandGroup key={group.group} heading={group.group}>
                {group.items.map((item) => (
                    <CommandItem
                    key={item.text}
                    value={item.text}
                    onSelect={() => runCommand(() => item.onSelect(router))}
                    >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.text}
                    </CommandItem>
                ))}
                </CommandGroup>
            ))}

            <CommandSeparator />

            {footerItems.map((group) => (
                <CommandGroup key={group.group} heading={group.group}>
                {group.items.map((item) => (
                    <CommandItem
                    key={item.text}
                    value={item.text}
                    onSelect={() => runCommand(() => item.onSelect(router))}
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
