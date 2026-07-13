"use client"
import Link from "next/link"
import React from "react"
import {
  Menu,
  Languages,
  PanelLeft,
  Bell,
  Check,
  School,
  Building,
  GraduationCap,
  MoreVertical,
  Sun,
  Moon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/dashboard/user-nav"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuFooter,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "./sidebar"
import { useLocalization } from "@/context/localization-context"
import { useAuth, type Role } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { apiFetch } from "@/lib/api-client"
import { SearchCommand } from "../search-command"
import { useTheme } from "next-themes"


type NotificationItem = {
    id: string;
    icon: React.ElementType;
    text: string;
    time: string;
    read: boolean;
};

const formatDistanceToNow = (date: Date, t: (key: string) => string): string => {
    const seconds = Math.max(0, Math.floor((new Date().getTime() - date.getTime()) / 1000));
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} ${t('common.time.years_ago')}`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} ${t('common.time.months_ago')}`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} ${t('common.time.days_ago')}`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} ${t('common.time.hours_ago')}`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} ${t('common.time.minutes_ago')}`;
    return `${Math.floor(seconds)} ${t('common.time.seconds_ago')}`;
};

const notificationStorageKey = (userId: string) => `readNotificationIds:${userId}`;

const getReadNotificationIds = (userId: string): string[] => {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(notificationStorageKey(userId));
        const parsed = stored ? JSON.parse(stored) : [];
        return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
    } catch {
        return [];
    }
};

const setReadNotificationIds = (userId: string, ids: string[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(notificationStorageKey(userId), JSON.stringify([...new Set(ids)].slice(-100)));
};

type NotificationResponse = {
    data: {
        notifications: Array<{ id: string; name: string; role: Role; createdAt: string }>;
    };
};


export function DashboardHeader() {
  const { toggleSidebar } = useSidebar();
  const { t, setLanguage } = useLocalization();
  const { setTheme } = useTheme()
  const { user, role } = useAuth();

  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);

  React.useEffect(() => {
    const receivesNotifications = role === "admin" || role === "super_admin" || role === "school";
    if (!user || !receivesNotifications) {
      setNotifications([]);
      return;
    }

    let active = true;
    const loadNotifications = async () => {
      try {
        const response = await apiFetch<NotificationResponse>("/api/notifications");
        if (!active) return;
        const readIds = getReadNotificationIds(user.uid);
        setNotifications(response.data.notifications.map((notification) => {
          let text = "";
          let icon: React.ElementType = Building;
          if (notification.role === "company") {
            text = t("common.notifications.new_company_approval", { name: notification.name });
          } else if (notification.role === "school") {
            text = t("common.notifications.new_school_approval", { name: notification.name });
            icon = School;
          } else {
            text = t("common.notifications.new_graduate_activation", { name: notification.name });
            icon = GraduationCap;
          }
          const createdAt = new Date(notification.createdAt);
          return {
            id: notification.id,
            text,
            time: formatDistanceToNow(Number.isNaN(createdAt.getTime()) ? new Date() : createdAt, t),
            icon,
            read: readIds.includes(notification.id),
          };
        }));
      } catch (error) {
        if (active) console.error("Unable to load notifications:", error);
      }
    };

    void loadNotifications();
    const interval = window.setInterval(() => void loadNotifications(), 45_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [user, role, t]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRead = (id: string) => {
    if (!user) return;
    const updatedNotifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updatedNotifications);

    const readIds = getReadNotificationIds(user.uid);
    if (!readIds.includes(id)) {
        setReadNotificationIds(user.uid, [...readIds, id]);
    }
  };

  const handleReadAll = () => {
    if (!user) return;
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);

    const allIds = notifications.map(n => n.id);
    setReadNotificationIds(user.uid, [...getReadNotificationIds(user.uid), ...allIds]);
  };

  const languageSelectorMenu = (
     <DropdownMenuSub>
        <DropdownMenuSubTrigger>
           <Languages className="mr-2 h-4 w-4" />
           <span>{t('common.language')}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
           <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setLanguage('en')}>{t('common.english')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('fr')}>{t('common.french')}</DropdownMenuItem>
            </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
  )

  const themeSelectorMenu = (
     <DropdownMenuSub>
        <DropdownMenuSubTrigger>
           <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
           <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
           <span>{t('common.theme')}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
           <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("light")}>{t('common.light')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>{t('common.dark')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>{t('common.system')}</DropdownMenuItem>
            </DropdownMenuSubContent>
        </DropdownMenuPortal>
     </DropdownMenuSub>
  )

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 sticky top-0 z-30 shrink-0">
        <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={toggleSidebar}
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">{t('common.toggle_nav')}</span>
        </Button>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 md:grow-0">
          <SearchCommand />
        </div>

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative shrink-0">
                    <Bell className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">{t('common.notifications.title')}</span>
                    {unreadCount > 0 && (
                        <div className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {unreadCount}
                        </div>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>{t('common.notifications.title')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                    notifications.map((item) => (
                         <DropdownMenuItem key={item.id} className="flex items-start gap-3" onSelect={(e) => {e.preventDefault(); handleRead(item.id)}}>
                            {!item.read && <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />}
                            <item.icon className={cn("h-4 w-4 mt-1 text-muted-foreground", item.read && "ml-[14px]")} />
                            <div className="flex-1">
                                <p className="text-sm font-medium whitespace-normal">{item.text}</p>
                                <p className="text-xs text-muted-foreground">{item.time}</p>
                            </div>
                        </DropdownMenuItem>
                    ))
                ) : (
                     <DropdownMenuItem disabled>{t('common.notifications.no_new')}</DropdownMenuItem>
                )}
                 <DropdownMenuSeparator />
                 <DropdownMenuFooter>
                    <Button variant="ghost" className="w-full" onClick={handleReadAll} disabled={unreadCount === 0}>
                        <Check className="mr-2 h-4 w-4" /> {t('common.notifications.mark_all_read')}
                    </Button>
                 </DropdownMenuFooter>
            </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0">
                <MoreVertical className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">{t('common.more_options')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languageSelectorMenu}
                {themeSelectorMenu}
            </DropdownMenuContent>
          </DropdownMenu>
        <UserNav />
      </div>
    </header>
  )
}
