"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Bell,
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  Check,
  FileText,
  MessageSquare,
  Moon,
  MoreVertical,
  Newspaper,
  PanelLeft,
  School,
  Sun,
  Ticket,
  UserRoundCheck,
  type LucideIcon,
} from 'lucide-react';

import { SearchCommand } from '@/components/search-command';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuFooter,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserNav } from '@/components/dashboard/user-nav';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';

import { useSidebar } from './sidebar';

type NotificationRecord = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  createdAt: string;
  read: boolean;
};

const iconByType: Record<string, LucideIcon> = {
  announcement: MessageSquare,
  blog: Newspaper,
  event_invite: Calendar,
  job_application: Briefcase,
  knowledge_base: BookOpen,
  message: MessageSquare,
  pending_graduate: UserRoundCheck,
  pending_user: Building,
  support_ticket: Ticket,
  content: FileText,
};

function notificationIcon(notification: NotificationRecord): LucideIcon {
  if (notification.type === 'pending_user' && notification.title.toLocaleLowerCase('fr-FR').includes('école')) {
    return School;
  }
  return iconByType[notification.type] || Bell;
}

function formatDistanceToNow(value: string) {
  const date = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1_000));
  if (seconds < 60) return 'Il y a quelques secondes';
  if (seconds < 3_600) return `Il y a ${Math.floor(seconds / 60)} min`;
  if (seconds < 86_400) return `Il y a ${Math.floor(seconds / 3_600)} h`;
  if (seconds < 2_592_000) return `Il y a ${Math.floor(seconds / 86_400)} j`;
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export function DashboardHeader() {
  const { toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const router = useRouter();
  const [notifications, setNotifications] = React.useState<NotificationRecord[]>([]);

  const refreshNotifications = React.useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    try {
      const response = await apiFetch<{ data: { notifications: NotificationRecord[] } }>('/api/notifications?limit=20');
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Unable to refresh notifications.', error);
    }
  }, [user]);

  React.useEffect(() => {
    if (!user) return;
    void refreshNotifications();
    const timer = window.setInterval(() => void refreshNotifications(), 30_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refreshNotifications();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refreshNotifications, user]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const markRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    setNotifications((current) => current.map((notification) => (
      idSet.has(notification.id) ? { ...notification, read: true } : notification
    )));
    try {
      await apiFetch('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ ids }),
      });
    } catch (error) {
      console.error('Unable to mark notifications as read.', error);
      setNotifications((current) => current.map((notification) => (
        idSet.has(notification.id) ? { ...notification, read: false } : notification
      )));
    }
  };

  const openNotification = async (notification: NotificationRecord) => {
    if (!notification.read) await markRead([notification.id]);
    if (notification.link) router.push(notification.link);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-card px-4 md:px-6">
      <Button variant="ghost" size="icon" className="shrink-0" onClick={toggleSidebar}>
        <PanelLeft className="h-5 w-5" />
        <span className="sr-only">Basculer la navigation</span>
      </Button>

      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 md:grow-0">
          <SearchCommand />
        </div>

        <DropdownMenu onOpenChange={(open) => {
          if (open) void refreshNotifications();
        }}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative shrink-0">
              <Bell className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
                  {Math.min(unreadCount, 99)}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && <span className="text-xs font-normal text-muted-foreground">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span>}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? notifications.map((notification) => {
              const Icon = notificationIcon(notification);
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex cursor-pointer items-start gap-3 py-3"
                  onSelect={(event) => {
                    event.preventDefault();
                    void openNotification(notification);
                  }}
                >
                  <span className={cn(
                    'mt-1 flex h-2 w-2 shrink-0 rounded-full',
                    notification.read ? 'bg-transparent' : 'bg-sky-500',
                  )} />
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm', notification.read ? 'font-medium' : 'font-semibold')}>
                      {notification.title}
                    </p>
                    <p className="whitespace-normal text-sm text-muted-foreground">{notification.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDistanceToNow(notification.createdAt)}</p>
                  </div>
                </DropdownMenuItem>
              );
            }) : (
              <DropdownMenuItem disabled>Aucune notification</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuFooter>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => void markRead(notifications.filter((notification) => !notification.read).map((notification) => notification.id))}
                disabled={unreadCount === 0}
              >
                <Check className="mr-2 h-4 w-4" />
                Marquer tout comme lu
              </Button>
            </DropdownMenuFooter>
          </DropdownMenuContent>
        </DropdownMenu>

        <UserNav />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
              <span className="sr-only">Plus d’options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Clair</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Sombre</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

