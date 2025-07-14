
"use client"
import Link from "next/link"
import {
  Menu,
  Search,
  Languages,
  PanelLeft,
  Users,
  Bell,
  Briefcase,
  UserCheck
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserNav } from "@/components/dashboard/user-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "./sidebar"
import { useLocalization } from "@/context/localization-context"
import { useAuth, type Role } from "@/context/auth-context"


const getNotifications = (t: (key: string) => string, role: Role) => {
    const graduateNotifications = [
        { icon: Briefcase, text: t('New job matching your profile: Software Engineer at TechCorp'), time: "5m ago" },
        { icon: UserCheck, text: t('Your application for Product Manager was viewed'), time: "1h ago" },
    ];
    const companyNotifications = [
        { icon: UserCheck, text: t('New applicant for Senior Developer: John Doe'), time: "2m ago" },
        { icon: Briefcase, text: t("Your job post 'UI/UX Designer' has received 5 new views"), time: "30m ago" },
    ];
    const schoolNotifications = [
        { icon: UserCheck, text: t('Tech Solutions Abidjan has requested a partnership'), time: "1d ago" },
        { icon: Briefcase, text: t('5 graduates from your institution were hired this month'), time: "2d ago" },
    ];

    switch(role) {
        case 'graduate': return graduateNotifications;
        case 'company': return companyNotifications;
        case 'school': return schoolNotifications;
        default: return [];
    }
}


export function DashboardHeader() {
  const { toggleSidebar } = useSidebar();
  const { t, setLanguage } = useLocalization();
  const { role, setRole } = useAuth();
  const notifications = getNotifications(t, role);
  
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 sticky top-0 z-30 shrink-0">
        <Button
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">{t('Toggle navigation menu')}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={toggleSidebar}
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">{t('Toggle navigation menu')}</span>
          </Button>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4 justify-end">
        <form className="ml-auto hidden sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('Search...')}
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            />
          </div>
        </form>
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Users className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">{t('Switch Role')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('Switch Role')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setRole('graduate')}>{t('Graduate')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRole('company')}>{t('Company')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setRole('school')}>{t('School')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">{t('Notifications')}</span>
                    {notifications.length > 0 && (
                        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>{t('Notifications')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                    notifications.map((item, index) => (
                         <DropdownMenuItem key={index} className="flex items-start gap-3">
                            <item.icon className="h-4 w-4 mt-1 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="text-sm font-medium whitespace-normal">{item.text}</p>
                                <p className="text-xs text-muted-foreground">{item.time}</p>
                            </div>
                        </DropdownMenuItem>
                    ))
                ) : (
                     <DropdownMenuItem disabled>{t('No new notifications')}</DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Languages className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">{t('Switch language')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('fr')}>Français</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  )
}
