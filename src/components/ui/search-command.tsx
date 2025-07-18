
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
import { Button } from "./button"
import { useAuth, type Role } from "@/context/auth-context"

const getNavItems = (t: (key: string) => string, role: Role) => {
    const main = [
        {
            group: t('Dashboard'),
            items: [
                { icon: LayoutDashboard, text: t('Home'), onSelect: (router) => router.push('/dashboard') },
                { icon: User, text: t('Profile'), onSelect: (router) => router.push('/dashboard/profile') },
            ],
            roles: ['admin', 'graduate', 'company', 'school'],
        },
        {
            group: t('Job Postings'),
            items: [
                { icon: Briefcase, text: t('My Applications'), onSelect: (router) => router.push('/dashboard/my-applications') },
                { icon: Building, text: t('Company Profiles'), onSelect: (router) => router.push('/dashboard/company-profiles') },
                { icon: School, text: t('School Profiles'), onSelect: (router) => router.push('/dashboard/school-profiles') },
            ],
            roles: ['admin', 'graduate'],
        },
        {
            group: t('Recruitment'),
            items: [
                { icon: FileText, text: t('Post a Job'), onSelect: (router) => router.push('/dashboard/job-postings/new') },
                { icon: Users2, text: t('Candidates'), onSelect: (router) => router.push('/dashboard/candidates') },
                { icon: Handshake, text: t('Partnerships'), onSelect: (router) => router.push('/dashboard/partnerships') },
            ],
            roles: ['admin', 'company', 'school'],
        },
    ];

    const footer = [
        {
            group: t('General'),
            items: [
                { icon: Settings, text: t('Settings'), onSelect: (router) => router.push('/dashboard/settings') },
                { icon: LifeBuoy, text: t('Support'), onSelect: (router) => router.push('/dashboard/support') },
            ],
            roles: ['admin', 'graduate', 'company', 'school'],
        },
        {
            group: t('Admin'),
            items: [
                { icon: Shield, text: t('Security'), onSelect: (router) => router.push('/dashboard/admin/security') },
                { icon: UserCheck, text: t('Approvals'), onSelect: (router) => router.push('/dashboard/admin/approvals') },
                { icon: UserCog, text: t('User Management'), onSelect: (router) => router.push('/dashboard/admin/user-management') },
            ],
            roles: ['admin'],
        },
        {
            group: t('AI Tools'),
            items: [
                { icon: BrainCircuit, text: t('AI Insights'), onSelect: (router) => router.push('/dashboard/ai/insights') },
                { icon: MessageSquare, text: t('Chatbot Builder'), onSelect: (router) => router.push('/dashboard/ai/chatbot-builder') },
                { icon: Award, text: t('Assessment Generator'), onSelect: (router) => router.push('/dashboard/ai/assessment-generator') },
            ],
            roles: ['admin', 'company', 'school'],
        },
        {
            group: t('Reporting'),
            items: [
                 { icon: BarChart3, text: t('Analytics'), onSelect: (router) => router.push('/dashboard/reports') },
                 { icon: Wrench, text: t('Report Generator'), onSelect: (router) => router.push('/dashboard/reports/custom-report-generator') },
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
        <span className="hidden lg:inline-flex">{t('Search...')}</span>
        <span className="ml-auto hidden lg:inline-flex">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </span>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t('Type a command or search...')} />
        <CommandList>
          <CommandEmpty>{t('No results found.')}</CommandEmpty>
          
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
