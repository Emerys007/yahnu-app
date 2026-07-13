"use client"

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle, Clock, Loader2, MessageSquare, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalization } from "@/context/localization-context";
import { useToast } from "@/hooks/use-toast";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';

type Ticket = {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    type: string;
    subject: string;
    description: string;
    status: TicketStatus;
    priority: TicketPriority;
    submittedAt: string;
    updatedAt: string;
};

type TicketSummary = {
    open: number;
    inProgress: number;
    resolvedToday: number;
};

type TicketsResponse = {
    data: {
        tickets: Ticket[];
        summary: TicketSummary;
    };
};

type TicketUpdateResponse = {
    data: {
        ticket: Pick<Ticket, 'id' | 'status' | 'updatedAt'>;
    };
};

const emptySummary: TicketSummary = { open: 0, inProgress: 0, resolvedToday: 0 };

function formatTicketDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

const TicketStatusBadge = ({ status }: { status: TicketStatus }) => {
    const { t } = useLocalization();
    const statusMap: Record<TicketStatus, { label: string; className: string }> = {
        open: { label: t('common.open'), className: "bg-blue-600 text-white hover:bg-blue-600" },
        in_progress: { label: t('In progress'), className: "bg-amber-500 text-white hover:bg-amber-500" },
        resolved: { label: t('common.resolved'), className: "bg-green-600 text-white hover:bg-green-600" },
        closed: { label: t('Closed'), className: "bg-slate-600 text-white hover:bg-slate-600" },
    };
    const detail = statusMap[status];
    return <Badge className={cn("capitalize", detail.className)}>{detail.label}</Badge>;
};

const PriorityBadge = ({ priority }: { priority: TicketPriority }) => {
    if (priority === 'normal') return null;
    const className = priority === 'urgent'
        ? 'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'
        : priority === 'high'
            ? 'border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300'
            : 'text-muted-foreground';
    return <Badge variant="outline" className={className}>{priority}</Badge>;
};

const TicketQueue = ({
    tickets,
    title,
    onTicketSelect,
}: {
    tickets: Ticket[];
    title: string;
    onTicketSelect: (ticket: Ticket) => void;
}) => {
    const { t } = useLocalization();
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('common.User')}</TableHead>
                                <TableHead>{t('common.Subject')}</TableHead>
                                <TableHead>{t('common.Status')}</TableHead>
                                <TableHead>{t('common.Submitted')}</TableHead>
                                <TableHead><span className="sr-only">{t('Actions')}</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tickets.length > 0 ? tickets.map((ticket) => (
                                <TableRow key={ticket.id}>
                                    <TableCell>
                                        <div className="font-medium">{ticket.userName}</div>
                                        <div className="text-sm text-muted-foreground">{ticket.userEmail}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex max-w-md items-center gap-2">
                                            <span className="line-clamp-2">{ticket.subject}</span>
                                            <PriorityBadge priority={ticket.priority} />
                                        </div>
                                    </TableCell>
                                    <TableCell><TicketStatusBadge status={ticket.status} /></TableCell>
                                    <TableCell className="whitespace-nowrap">{formatTicketDate(ticket.submittedAt)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => onTicketSelect(ticket)}>
                                            {t('common.View Ticket')}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-28 text-center text-muted-foreground">
                                        {t('dashboard.support.center.no_tickets')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

export default function SupportCenterPage() {
    const { t } = useLocalization();
    const { toast } = useToast();
    const router = useRouter();
    const [activeTab, setActiveTab] = React.useState("open");
    const [tickets, setTickets] = React.useState<Ticket[]>([]);
    const [summary, setSummary] = React.useState<TicketSummary>(emptySummary);
    const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [updatingTicketId, setUpdatingTicketId] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const loadTickets = React.useCallback(async (options: { initial?: boolean; signal?: AbortSignal } = {}) => {
        const { initial = false, signal } = options;
        if (initial) setIsLoading(true);
        else setIsRefreshing(true);
        setError(null);
        try {
            const response = await apiFetch<TicketsResponse>('/api/tickets?limit=250', { signal });
            setTickets(response.data.tickets);
            setSummary(response.data.summary);
            setSelectedTicket((current) => current
                ? response.data.tickets.find((ticket) => ticket.id === current.id) ?? null
                : null);
        } catch (requestError) {
            if (signal?.aborted) return;
            setError(requestError instanceof ApiClientError
                ? requestError.message
                : 'The support queue could not be loaded.');
        } finally {
            if (!signal?.aborted) {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        }
    }, []);

    React.useEffect(() => {
        const controller = new AbortController();
        void loadTickets({ initial: true, signal: controller.signal });
        return () => controller.abort();
    }, [loadTickets]);

    const updateTicketStatus = async (ticket: Ticket, status: TicketStatus) => {
        if (ticket.status === status) return;
        setUpdatingTicketId(ticket.id);
        try {
            const response = await apiFetch<TicketUpdateResponse>(`/api/tickets/${encodeURIComponent(ticket.id)}`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            const nextTicket = { ...ticket, ...response.data.ticket };
            setTickets((current) => current.map((item) => item.id === ticket.id ? nextTicket : item));
            setSelectedTicket(nextTicket);
            toast({
                title: t('Ticket updated'),
                description: t('The support ticket status has been saved.'),
            });
            await loadTickets();
        } catch (requestError) {
            toast({
                title: t('Ticket update failed'),
                description: requestError instanceof Error ? requestError.message : t('Please try again.'),
                variant: 'destructive',
            });
        } finally {
            setUpdatingTicketId(null);
        }
    };

    const openConversation = (ticket: Ticket) => {
        const conversationId = ticket.userId || ticket.userEmail.split('@')[0].replaceAll('.', '-');
        router.push(`/dashboard/messages?new=${encodeURIComponent(conversationId)}&name=${encodeURIComponent(ticket.userName)}`);
    };

    const openTickets = tickets.filter((ticket) => ticket.status === 'open');
    const inProgressTickets = tickets.filter((ticket) => ticket.status === 'in_progress');
    const resolvedTickets = tickets.filter((ticket) => ticket.status === 'resolved' || ticket.status === 'closed');

    return (
        <div className="space-y-8">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
                <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-3">
                        <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('common.Support Center')}</h1>
                        <p className="mt-1 text-muted-foreground">{t('dashboard.admin.support_center.description')}</p>
                    </div>
                </div>
                <Button variant="outline" onClick={() => void loadTickets()} disabled={isLoading || isRefreshing}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                    {t('Refresh queue')}
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t('Unable to load support tickets')}</AlertTitle>
                    <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span>{error}</span>
                        <Button variant="outline" size="sm" onClick={() => void loadTickets()}>{t('Try again')}</Button>
                    </AlertDescription>
                </Alert>
            )}

            {isLoading ? (
                <Card>
                    <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p>{t('Loading support queue...')}</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t('common.Open Tickets')}</CardTitle>
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent><div className="text-2xl font-bold">{summary.open}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t('Tickets in progress')}</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent><div className="text-2xl font-bold">{summary.inProgress}</div></CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{t('common.Resolved Today')}</CardTitle>
                                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent><div className="text-2xl font-bold">{summary.resolvedToday}</div></CardContent>
                        </Card>
                    </div>

                    <div>
                        <h2 className="mb-4 text-2xl font-bold tracking-tight">{t('common.Ticket Queue')}</h2>
                        <p className="mb-4 text-muted-foreground">{t('dashboard.admin.support_center.queue_description')}</p>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="h-auto flex-wrap">
                                <TabsTrigger value="open">{t('common.Open')} ({openTickets.length})</TabsTrigger>
                                <TabsTrigger value="in_progress">{t('In progress')} ({inProgressTickets.length})</TabsTrigger>
                                <TabsTrigger value="resolved">{t('common.Resolved')} ({resolvedTickets.length})</TabsTrigger>
                            </TabsList>
                            <TabsContent value="open">
                                <TicketQueue tickets={openTickets} title={t("common.Open Tickets")} onTicketSelect={setSelectedTicket} />
                            </TabsContent>
                            <TabsContent value="in_progress">
                                <TicketQueue tickets={inProgressTickets} title={t("Tickets in progress")} onTicketSelect={setSelectedTicket} />
                            </TabsContent>
                            <TabsContent value="resolved">
                                <TicketQueue tickets={resolvedTickets} title={t("common.Resolved Tickets")} onTicketSelect={setSelectedTicket} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </>
            )}

            <Dialog open={Boolean(selectedTicket)} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                    {selectedTicket && (
                        <>
                            <DialogHeader>
                                <div className="flex flex-wrap items-center gap-2 pr-8">
                                    <DialogTitle>{selectedTicket.subject}</DialogTitle>
                                    <PriorityBadge priority={selectedTicket.priority} />
                                </div>
                                <DialogDescription>
                                    {selectedTicket.userName} · {selectedTicket.userEmail}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4">
                                <div className="grid grid-cols-1 gap-3 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-3">
                                    <div><p className="text-muted-foreground">{t('Ticket ID')}</p><p className="break-all font-medium">{selectedTicket.id}</p></div>
                                    <div><p className="text-muted-foreground">{t('Submitted')}</p><p className="font-medium">{formatTicketDate(selectedTicket.submittedAt)}</p></div>
                                    <div><p className="text-muted-foreground">{t('Last updated')}</p><p className="font-medium">{formatTicketDate(selectedTicket.updatedAt)}</p></div>
                                </div>
                                <div>
                                    <h3 className="mb-2 text-sm font-semibold">{t('Message')}</h3>
                                    <div className="whitespace-pre-wrap rounded-lg border p-4 text-sm leading-6">{selectedTicket.description}</div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold" htmlFor="ticket-status">{t('Status')}</label>
                                    <Select
                                        value={selectedTicket.status}
                                        onValueChange={(status: TicketStatus) => void updateTicketStatus(selectedTicket, status)}
                                        disabled={updatingTicketId === selectedTicket.id}
                                    >
                                        <SelectTrigger id="ticket-status">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="open">{t('common.Open')}</SelectItem>
                                            <SelectItem value="in_progress">{t('In progress')}</SelectItem>
                                            <SelectItem value="resolved">{t('common.Resolved')}</SelectItem>
                                            <SelectItem value="closed">{t('Closed')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {updatingTicketId === selectedTicket.id && (
                                        <p className="flex items-center text-xs text-muted-foreground"><Loader2 className="mr-2 h-3 w-3 animate-spin" />{t('Saving status...')}</p>
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button onClick={() => openConversation(selectedTicket)}>
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    {t('Open conversation')}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
