
"use client"
import Link from "next/link"
import React from "react"
import {
  Menu,
  PanelLeft,
  Bell,
  Check,
  School,
  Building,
  Sun,
  Moon,
  MoreVertical,
  Ticket,
  MessageSquare,
  Briefcase,
  Calendar,
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
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "./sidebar"
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

const formatDistanceToNow = (date: Date): string => {
    if (!date) return "";
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `Il y a quelques secondes`;
    let interval = seconds / 31536000;
    if (interval > 1) return `Il y a ${Math.floor(interval)} ans`;
    interval = seconds / 2592000;
    if (interval > 1) return `Il y a ${Math.floor(interval)} mois`;
    interval = seconds / 86400;
    if (interval > 1) return `Il y a ${Math.floor(interval)} jours`;
    interval = seconds / 3600;
    if (interval > 1) return `Il y a ${Math.floor(interval)} heures`;
    interval = seconds / 60;
    if (interval > 1) return `Il y a ${Math.floor(interval)} minutes`;
    return `Il y a ${Math.floor(seconds)} secondes`;
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
  const { user, role } = useAuth();
  const { setTheme } = useTheme();

  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);

  React.useEffect(() => {
    if (!user) return;

    let q;
    let notificationParser: (doc: DocumentData) => NotificationItem | null;

    const adminRoles: Role[] = ['admin', 'super_admin'];
    if (adminRoles.includes(role)) {
      q = query(
        collection(db, "users"), 
        where('status', '==', 'pending'),
        where('role', 'in', ['company', 'school']),
        limit(5)
      );
      notificationParser = (doc: DocumentData): NotificationItem | null => {
        const data = doc.data() as DocumentData;
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();

        let notificationText = '';
        let icon = Building;
        if (data.role === 'company') {
            notificationText = `Nouvelle entreprise "${data.name}" en attente d'approbation.`;
            icon = Building;
        } else if (data.role === 'school') {
            notificationText = `Nouvelle école "${data.name}" en attente d'approbation.`;
            icon = School;
        }
        
        return {
            id: doc.id,
            text: notificationText,
            time: formatDistanceToNow(createdAt),
            icon: icon,
            read: getReadNotificationIds().includes(doc.id),
        };
      };
    } else if (role === 'school') {
        q = query(
            collection(db, "users"),
            where('status', '==', 'pending'),
            where('role', '==', 'graduate'),
            where('schoolId', '==', user.uid),
            limit(5)
        );
         notificationParser = (doc: DocumentData): NotificationItem | null => {
            const data = doc.data() as DocumentData;
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
             return {
                id: doc.id,
                text: `Nouveau diplômé "${data.name}" en attente d'activation.`,
                time: formatDistanceToNow(createdAt),
                icon: Building, // TODO: Change to a more appropriate icon for a graduate
                read: getReadNotificationIds().includes(doc.id),
            };
        };
    } else if (role === 'support_staff') {
        q = query(
            collection(db, "tickets"),
            where('status', '==', 'new'),
            limit(5)
        );
        notificationParser = (doc: DocumentData): NotificationItem => {
            const data = doc.data() as DocumentData;
            const createdAt = data.submittedAt?.toDate ? data.submittedAt.toDate() : new Date();
            return {
                id: doc.id,
                text: `Nouveau ticket de ${data.userName}: "${data.subject}"`,
                time: formatDistanceToNow(createdAt),
                icon: Ticket,
                read: getReadNotificationIds().includes(doc.id),
            }
        }
    } else {
        // General notifications for graduates, companies
        q = query(
            collection(db, "notifications"),
            where('userId', '==', user.uid),
            limit(5)
        );
        notificationParser = (doc: DocumentData): NotificationItem => {
             const data = doc.data() as DocumentData;
             const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
             let icon = MessageSquare;
             if(data.type === 'job_application') icon = Briefcase;
             if(data.type === 'event_invite') icon = Calendar;

             return {
                id: doc.id,
                text: data.text,
                time: formatDistanceToNow(createdAt),
                icon: icon,
                read: getReadNotificationIds().includes(doc.id),
             }
        }
    }


    if (!q) return;

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedNotifications: NotificationItem[] = [];
        querySnapshot.forEach((doc) => {
            const notification = notificationParser(doc);
            if (notification) {
                fetchedNotifications.push(notification);
            }
        });
        setNotifications(fetchedNotifications);
    }, (error) => {
        console.error("Firestore snapshot error:", error);
    });

    return () => unsubscribe();
  }, [user, role]);

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

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 sticky top-0 z-30 shrink-0">
        <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={toggleSidebar}
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">{"Basculer la navigation"}</span>
        </Button>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 md:grow-0">
          <SearchCommand />
        </div>

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative shrink-0">
                    <Bell className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">{"Notifications"}</span>
                    {unreadCount > 0 && (
                        <div className="absolute top-0 right-0 -mt-1 -mr-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {unreadCount}
                        </div>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>{"Notifications"}</DropdownMenuLabel>
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
                     <DropdownMenuItem disabled>{"Aucune nouvelle notification"}</DropdownMenuItem>
                )}
                 <DropdownMenuSeparator />
                 <DropdownMenuFooter>
                    <Button variant="ghost" className="w-full" onClick={handleReadAll} disabled={unreadCount === 0}>
                        <Check className="mr-2 h-4 w-4" /> {"Marquer tout comme lu"}
                    </Button>
                 </DropdownMenuFooter>
            </DropdownMenuContent>
        </DropdownMenu>

        <UserNav />

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                    <span className="sr-only">More options</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Clair</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Sombre</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
