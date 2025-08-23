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
    const main = [
        {
            group: t('dashboard.nav.dashboard'),
            items: [
                { icon: LayoutDashboard, text: t('dashboard.nav.home'), onSelect: (router) => router.push('/dashboard') },
                { icon: User, text: t('dashboard.nav.profile'), onSelect: (router) => router.push('/dashboard/profile') },
            ],
            roles: ['admin', 'graduate', 'company', 'school'],
        },
        {
            group: t('dashboard.nav.job_postings'),
            items: [
                { icon: Briefcase, text: t('dashboard.nav.my_applications'), onSelect: (router) => router.push('/dashboard/my-applications') },
                { icon: Building, text: t('dashboard.nav.company_profiles'), onSelect: (router) => router.push('/dashboard/company-profiles') },
                { icon: School, text: t('dashboard.nav.school_profiles'), onSelect: (router) => router.push('/dashboard/school-profiles') },
            ],
            roles: ['admin', 'graduate'],
        },
        {
            group: t('dashboard.nav.recruitment'),
            items: [
                { icon: FileText, text: t('dashboard.nav.post_job'), onSelect: (router) => router.push('/dashboard/job-postings/new') },
                { icon: Users2, text: t('dashboard.nav.candidates'), onSelect: (router) => router.push('/dashboard/candidates') },
                { icon: Handshake, text: t('dashboard.nav.partnerships'), onSelect: (router) => router.push('/dashboard/partnerships') },
            ],
            roles: ['admin', 'company', 'school'],
        },
    ];

    const footer = [
        {
            group: t('dashboard.nav.general'),
            items: [
                { icon: Settings, text: t('dashboard.nav.settings'), onSelect: (router) => router.push('/dashboard/settings') },
                { icon: LifeBuoy, text: t('dashboard.nav.support'), onSelect: (router) => router.push('/dashboard/support') },
            ],
            roles: ['admin', 'graduate', 'company', 'school'],
        },
        {
            group: t('dashboard.nav.admin'),
            items: [
                { icon: Shield, text: t('dashboard.nav.security'), onSelect: (router) => router.push('/dashboard/admin/security') },
                { icon: UserCheck, text: t('dashboard.nav.approvals'), onSelect: (router) => router.push('/dashboard/admin/approvals') },
                { icon: UserCog, text: t('dashboard.nav.user_management'), onSelect: (router) => router.push('/dashboard/admin/user-management') },
            ],
            roles: ['admin'],
        },
        {
            group: t('dashboard.nav.ai_tools'),
            items: [
                { icon: BrainCircuit, text: t('dashboard.nav.ai_insights'), onSelect: (router) => router.push('/dashboard/ai/insights') },
                { icon: MessageSquare, text: t('dashboard.nav.chatbot_builder'), onSelect: (router) => router.push('/dashboard/ai/chatbot-builder') },
                { icon: Award, text: t('dashboard.nav.assessment_generator'), onSelect: (router) => router.push('/dashboard/ai/assessment-generator') },
            ],
            roles: ['admin', 'company', 'school'],
        },
        {
            group: t('dashboard.nav.reporting'),
            items: [
                 { icon: BarChart3, text: t('dashboard.nav.analytics'), onSelect: (router) => router.push('/dashboard/reports') },
                 { icon: Wrench, text: t('dashboard.nav.report_generator'), onSelect: (router) => router.push('/dashboard/reports/custom-report-generator') },
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
  const { t } = useLocalization();

  const {main: mainItems, footer: footerItems} = React.useMemo(() => getNavItems(t, role), [t, role]);

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
        <span className="hidden lg:inline-flex">{t('common.search')}</span>
        <span className="ml-auto hidden lg:inline-flex">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </span>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t('common.search_placeholder')} />
        <CommandList>
          <CommandEmpty>{t('common.no_results_found')}</CommandEmpty>

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