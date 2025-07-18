
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
  MoreVertical,
  Sun,
  Moon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/dashboard/user-nav"
import { ThemeToggle } from "@/components/theme-toggle"
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
import { collection, query, where, onSnapshot, limit, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)} ${t('years ago')}`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)} ${t('months ago')}`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)} ${t('days ago')}`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)} ${t('hours ago')}`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)} ${t('minutes ago')}`;
    return `${Math.floor(seconds)} ${t('seconds ago')}`;
};

const getReadNotificationIds = (): string[] => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("readNotificationIds");
    return stored ? JSON.parse(stored) : [];
};

const setReadNotificationIds = (ids: string[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("readNotificationIds", JSON.stringify(ids));
};


export function DashboardHeader() {
  const { toggleSidebar } = useSidebar();
  const { t, setLanguage } = useLocalization();
  const { setTheme } = useTheme()
  const { user, role } = useAuth();
  
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  
  React.useEffect(() => {
    if (!user) return;

    let q;
    if (role === 'admin') {
      q = query(
        collection(db, "users"), 
        where('status', '==', 'pending'),
        where('role', 'in', ['company', 'school']),
        limit(5)
      );
    } else if (role === 'school') {
        q = query(
            collection(db, "users"),
            where('status', '==', 'pending'),
            where('role', '==', 'graduate'),
            where('schoolId', '==', user.uid), // Use user's UID as the schoolId
            limit(5)
        );
    }

    if (!q) return;

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const readIds = getReadNotificationIds();
        const fetchedNotifications: NotificationItem[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as DocumentData;
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();

            let notificationText = '';
            let icon = Building;
            if (data.role === 'company') {
                notificationText = t("New company \"{name}\" requires approval", { name: data.name });
                icon = Building;
            } else if (data.role === 'school') {
                notificationText = t("New school \"{name}\" requires approval", { name: data.name });
                icon = School;
            } else if (data.role === 'graduate') {
                notificationText = t("New graduate \"{name}\" requires activation", { name: data.name });
                icon = Building; // TODO: Change to a more appropriate icon for a graduate
            }
            
            fetchedNotifications.push({
                id: doc.id,
                text: notificationText,
                time: formatDistanceToNow(createdAt, t),
                icon: icon,
                read: readIds.includes(doc.id),
            });
        });
        setNotifications(fetchedNotifications);
    }, (error) => {
        console.error("Firestore snapshot error:", error);
    });

    return () => unsubscribe();
  }, [user, role, t]);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const handleRead = (id: string) => {
    const updatedNotifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updatedNotifications);
    
    const readIds = getReadNotificationIds();
    if (!readIds.includes(id)) {
        setReadNotificationIds([...readIds, id]);
    }
  };
  
  const handleReadAll = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);

    const allIds = notifications.map(n => n.id);
    setReadNotificationIds(allIds);
  };

  const languageSelectorMenu = (
     <DropdownMenuSub>
        <DropdownMenuSubTrigger>
           <Languages className="mr-2 h-4 w-4" />
           <span>{t('Language')}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
           <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('fr')}>Français</DropdownMenuItem>
            </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
  )

  const themeSelectorMenu = (
     <DropdownMenuSub>
        <DropdownMenuSubTrigger>
           <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
           <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
           <span>{t('Theme')}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
           <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("light")}>{t('Light')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>{t('Dark')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>{t('System')}</DropdownMenuItem>
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
            <span className="sr-only">{t('Toggle navigation menu')}</span>
        </Button>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 md:grow-0">
          <SearchCommand />
        </div>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative shrink-0">
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
              <Button variant="outline" size="icon" className="shrink-0">
                <MoreVertical className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">{t('More options')}</span>
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
