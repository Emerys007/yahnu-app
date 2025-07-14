
"use client"
import Link from "next/link"
import React from "react"
import {
  Menu,
  Search,
  Languages,
  PanelLeft,
  Users,
  Bell,
  Briefcase,
  UserCheck,
  Handshake,
  Check,
  X,
  Shield,
  School,
  Building
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
  DropdownMenuFooter
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "./sidebar"
import { useLocalization } from "@/context/localization-context"
import { useAuth, type AccountType } from "@/context/auth-context"
import { cn } from "@/lib/utils"


const getNotificationsByRole = (t: (key: string) => string, accountType: AccountType) => {
    const baseNotifications = {
        graduate: [
            { id: 1, icon: Briefcase, text: t('New job matching your profile: Software Engineer at TechCorp'), time: "5m ago", read: false },
            { id: 2, icon: UserCheck, text: t('Your application for Product Manager was viewed'), time: "1h ago", read: false },
        ],
        company: [
            { id: 1, icon: UserCheck, text: t('New applicant for Senior Developer: John Doe'), time: "2m ago", read: false },
            { id: 2, icon: Briefcase, text: t("Your job post 'UI/UX Designer' has received 5 new views"), time: "30m ago", read: true },
        ],
        school: [
            { id: 1, icon: Handshake, text: t('Tech Solutions Abidjan has requested a partnership'), time: "1d ago", read: false },
            { id: 2, icon: Briefcase, text: t('5 graduates from your institution were hired this month'), time: "2d ago", read: true },
        ],
        admin: [
            { id: 1, icon: Building, text: t('New company "Innovate Inc." requires approval'), time: "10m ago", read: false },
            { id: 2, icon: School, text: t('New school "Prestige University" requires approval'), time: "1h ago", read: false },
        ]
    };

    return baseNotifications[accountType] || [];
};

export function DashboardHeader() {
  const { toggleSidebar } = useSidebar();
  const { t, setLanguage } = useLocalization();
  const { accountType } = useAuth();
  
  const [notifications, setNotifications] = React.useState(getNotificationsByRole(t, accountType));
  const unreadCount = notifications.filter(n => !n.read).length;
  
  React.useEffect(() => {
    setNotifications(getNotificationsByRole(t, accountType));
  }, [accountType, t]);
  
  const handleRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };
  
  const handleReadAll = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

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
                <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">{t('Notifications')}</span>
                    {unreadCount > 0 && (
                        <div className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {unreadCount}
                        </div>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>{t('Notifications')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                    notifications.map((item) => (
                         <DropdownMenuItem key={item.id} className="flex items-start gap-3" onClick={() => handleRead(item.id)}>
                            {!item.read && <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />}
                            <item.icon className={cn("h-4 w-4 mt-1 text-muted-foreground", item.read && "ml-[14px]")} />
                            <div className="flex-1">
                                <p className="text-sm font-medium whitespace-normal">{item.text}</p>
                                <p className="text-xs text-muted-foreground">{item.time}</p>
                            </div>
                        </DropdownMenuItem>
                    ))
                ) : (
                     <DropdownMenuItem disabled>{t('No new notifications')}</DropdownMenuItem>
                )}
                 <DropdownMenuSeparator />
                 <DropdownMenuFooter>
                    <Button variant="ghost" className="w-full" onClick={handleReadAll} disabled={unreadCount === 0}>
                        <Check className="mr-2 h-4 w-4" /> {t('Mark all as read')}
                    </Button>
                 </DropdownMenuFooter>
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
