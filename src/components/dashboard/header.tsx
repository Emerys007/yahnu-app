
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
  Building,
  Calendar
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
import { useAuth, type Role } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { collection, query, where, getDocs, onSnapshot, orderBy, limit, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";


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

export function DashboardHeader() {
  const { toggleSidebar } = useSidebar();
  const { t, setLanguage } = useLocalization();
  const { user, role } = useAuth();
  
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);
  
  React.useEffect(() => {
    if (!user) return;

    let q;
    if (role === 'admin') {
      // Admin gets notifications for pending company/school registrations
      q = query(
        collection(db, "users"), 
        where('status', '==', 'pending'),
        where('role', 'in', ['company', 'school']),
        limit(5)
      );
    } else if (role === 'school') {
        // School gets notifications for pending graduate registrations
        q = query(
            collection(db, "users"),
            where('status', '==', 'pending'),
            where('role', '==', 'graduate'),
            where('schoolId', '==', user.schoolId), // Assuming school user has schoolId
            limit(5)
        );
    }
    // Add more else if blocks for other roles (graduate, company) if needed

    if (!q) return;

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
                icon = UserCheck;
            }
            
            fetchedNotifications.push({
                id: doc.id,
                text: notificationText,
                time: formatDistanceToNow(createdAt, t),
                icon: icon,
                read: false, // In a real app, you'd store and check read status
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
            className="shrink-0"
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
                         <DropdownMenuItem key={item.id} className="flex items-start gap-3" onSelect={() => handleRead(item.id)}>
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
