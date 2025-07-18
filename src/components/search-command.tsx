
"use client"

import * as React from "react"
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
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
  HeartHandshake,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { useLocalization } from "@/context/localization-context"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { useAuth, type Role } from "@/context/auth-context"

const getNavItems = (t: (key: string) => string, role: Role) => {
    const baseNav = [
        { href: "/dashboard", icon: LayoutDashboard, label: t('Dashboard') },
    ];
    
    const loggedOutNav = [
        { href: "/jobs", icon: Briefcase, label: t('Jobs') },
        { href: "/companies", icon: Building, label: t('Companies') },
        { href: "/schools", icon: School, label: t('Schools') },
        { href: "/about", icon: Users2, label: t('About') },
    ];

    const graduateNav = [
        ...baseNav,
        { href: "/dashboard/messages", icon: MessageSquare, label: t('Messages') },
        { href: "/dashboard/profile", icon: User, label: t('Profile') },
        { href: "/dashboard/jobs", icon: Briefcase, label: t('Job Search') },
        { href: "/dashboard/applications", icon: FileText, label: t('Applications') },
        { href: "/dashboard/events", icon: Calendar, label: t('Events') },
        { href: "/dashboard/assessments", icon: Award, label: t('Skill Certifications') },
        { href: "/dashboard/interview-prep", icon: BrainCircuit, label: t('Interview Prep') },
    ];

    const companyNav = [
        ...baseNav,
        { href: "/dashboard/messages", icon: MessageSquare, label: t('Messages') },
        { href: "/dashboard/company-profile", icon: Building, label: t('Company Profile') },
        { href: "/dashboard/applications", icon: FileText, label: t('Applications') },
        { href: "/dashboard/company-events", icon: Calendar, label: t('Event Management') },
        { href: "/dashboard/partnerships", icon: Handshake, label: t('Partnerships') },
        { href: "/dashboard/talent-pool", icon: Users2, label: t('Talent Pool') },
        { href: "/dashboard/reports", icon: BarChart3, label: t('Analytics') },
    ];
    
    const schoolNav = [
        ...baseNav,
        { href: "/dashboard/messages", icon: MessageSquare, label: t('Messages') },
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
        { href: "/dashboard/settings", icon: Settings, label: t('Settings') },
        { href: "/dashboard/support", icon: LifeBuoy, label: t('Support') },
    ]

    switch (role) {
      case 'graduate':
        return graduateNav.concat(bottomNav);
      case 'company':
        return companyNav.concat(bottomNav);
      case 'school':
        return schoolNav.concat(bottomNav);
      case 'admin':
        return adminNav.concat(bottomNav);
      default:
        return loggedOutNav;
    }
}


export function SearchCommand() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { user, role } = useAuth();
  const { t } = useLocalization();

  const navItems = React.useMemo(() => getNavItems(t, user ? role : 'graduate'), [t, role, user]);

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
        className="h-10 w-10 p-0 md:w-auto md:px-3 md:justify-start"
        onClick={() => setOpen(true)}
      >
        <SearchIcon className="h-4 w-4" />
        <span className="hidden md:inline-block md:ml-2 text-muted-foreground">{t("Search...")}</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:flex md:ml-4">
            <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t("Type a command or search...")} />
        <CommandList>
          <CommandEmpty>{t("No results found.")}</CommandEmpty>
          <CommandGroup heading={t("Links")}>
            {navItems.map(item => (
                <CommandItem
                    key={item.href}
                    value={item.label}
                    onSelect={() => {
                      runCommand(() => router.push(item.href))
                    }}
                >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.label}</span>
                </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
