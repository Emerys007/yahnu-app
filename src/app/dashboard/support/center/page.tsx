"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Inbox,
  Loader2,
  MessageSquareText,
  RefreshCw,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "normal" | "high" | "urgent";

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

type TicketSummary = { open: number; inProgress: number; resolvedToday: number };
type TicketsResponse = { data: { tickets: Ticket[]; summary: TicketSummary } };
type TicketUpdateResponse = { data: { ticket: Pick<Ticket, "id" | "status" | "updatedAt"> } };

const EMPTY_SUMMARY: TicketSummary = { open: 0, inProgress: 0, resolvedToday: 0 };

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Ouvert",
  in_progress: "En traitement",
  resolved: "Résolu",
  closed: "Clôturé",
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Faible",
  normal: "Normale",
  high: "Haute",
  urgent: "Urgente",
};

function formatTicketDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date indisponible";
  return new Intl.DateTimeFormat("fr-CI", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Abidjan",
  }).format(date);
}

function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const className: Record<TicketStatus, string> = {
    open: "border-lagoon/30 bg-lagoon/10 text-lagoon",
    in_progress: "border-soleil/50 bg-soleil/15 text-cocoa",
    resolved: "border-primary/30 bg-primary/10 text-primary",
    closed: "border-border bg-muted text-muted-foreground",
  };
  return <Badge variant="outline" className={className[status]}>{STATUS_LABELS[status]}</Badge>;
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  if (priority === "normal") return null;
  const className = priority === "urgent"
    ? "border-destructive/30 bg-destructive/10 text-destructive"
    : priority === "high"
      ? "border-terra/40 bg-terra/10 text-cocoa"
      : "text-muted-foreground";
  return <Badge variant="outline" className={className}>Priorité {PRIORITY_LABELS[priority].toLowerCase()}</Badge>;
}

function TicketQueue({
  tickets,
  title,
  onTicketSelect,
}: {
  tickets: Ticket[];
  title: string;
  onTicketSelect: (ticket: Ticket) => void;
}) {
  if (tickets.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
          <span className="rounded-full bg-primary/10 p-3"><Inbox className="h-6 w-6 text-primary" /></span>
          <div>
            <p className="font-display text-lg font-semibold">File à jour</p>
            <p className="mt-1 text-sm text-muted-foreground">Aucun ticket dans la catégorie « {title.toLowerCase()} ».</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{tickets.length} demande{tickets.length > 1 ? "s" : ""} dans cette file</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:hidden">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => onTicketSelect(ticket)}
              className="rounded-2xl border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
            >
              <div className="flex flex-wrap items-center gap-2">
                <TicketStatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
              <p className="mt-3 font-semibold text-foreground">{ticket.subject}</p>
              <p className="mt-1 text-sm text-muted-foreground">{ticket.userName}</p>
              <p className="mt-3 text-xs text-muted-foreground">Reçu le {formatTicketDate(ticket.submittedAt)}</p>
            </button>
          ))}
        </div>

        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Sujet</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Reçu le</TableHead>
                <TableHead><span className="sr-only">Action</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
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
                    <Button variant="outline" size="sm" onClick={() => onTicketSelect(ticket)}>Ouvrir</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SupportCenterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("open");
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [summary, setSummary] = React.useState<TicketSummary>(EMPTY_SUMMARY);
  const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [updatingTicketId, setUpdatingTicketId] = React.useState<string | null>(null);
  const [hasLoadError, setHasLoadError] = React.useState(false);

  const loadTickets = React.useCallback(async (options: { initial?: boolean; signal?: AbortSignal } = {}) => {
    const { initial = false, signal } = options;
    if (initial) setIsLoading(true);
    else setIsRefreshing(true);
    setHasLoadError(false);
    try {
      const response = await apiFetch<TicketsResponse>("/api/tickets?limit=250", { signal });
      setTickets(response.data.tickets);
      setSummary(response.data.summary);
      setSelectedTicket((current) => current
        ? response.data.tickets.find((ticket) => ticket.id === current.id) ?? null
        : null);
    } catch {
      if (!signal?.aborted) setHasLoadError(true);
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
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      const nextTicket = { ...ticket, ...response.data.ticket };
      setTickets((current) => current.map((item) => item.id === ticket.id ? nextTicket : item));
      setSelectedTicket(nextTicket);
      toast({ title: "Statut enregistré", description: `Le ticket est maintenant « ${STATUS_LABELS[status].toLowerCase()} ».` });
      await loadTickets();
    } catch {
      toast({
        title: "Mise à jour impossible",
        description: "Le statut n’a pas pu être enregistré. Réessayez dans un instant.",
        variant: "destructive",
      });
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const openConversation = (ticket: Ticket) => {
    router.push(`/dashboard/messages?ticketId=${encodeURIComponent(ticket.id)}`);
  };

  const openTickets = tickets.filter((ticket) => ticket.status === "open");
  const inProgressTickets = tickets.filter((ticket) => ticket.status === "in_progress");
  const resolvedTickets = tickets.filter((ticket) => ticket.status === "resolved" || ticket.status === "closed");

  const summaryCards = [
    { label: "À prendre en charge", value: summary.open, icon: MessageSquareText, accent: "text-lagoon bg-lagoon/10" },
    { label: "En traitement", value: summary.inProgress, icon: Clock3, accent: "text-cocoa bg-soleil/20" },
    { label: "Résolus aujourd’hui", value: summary.resolvedToday, icon: CheckCircle2, accent: "text-primary bg-primary/10" },
  ];

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="dashboard-surface ci-pattern overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="section-kicker">Équipe assistance · Côte d’Ivoire</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Le pouls du support Yahnu</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Suivez les demandes des diplômés, écoles et recruteurs, puis répondez avec clarté et chaleur.
            </p>
          </div>
          <Button variant="outline" onClick={() => void loadTickets()} disabled={isLoading || isRefreshing}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin motion-reduce:animate-none")} />
            Actualiser la file
          </Button>
        </div>
      </section>

      {hasLoadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>La file de support ne répond pas</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>Vérifiez votre connexion, puis relancez le chargement.</span>
            <Button variant="outline" size="sm" onClick={() => void loadTickets()}>Réessayer</Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Card aria-live="polite">
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary motion-reduce:animate-none" />
            <p>Chargement des demandes en cours…</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {summaryCards.map(({ label, value, icon: Icon, accent }) => (
              <Card key={label}>
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-1 font-display text-3xl font-semibold">{value}</p>
                  </div>
                  <span className={cn("rounded-2xl p-3", accent)}><Icon className="h-5 w-5" /></span>
                </CardContent>
              </Card>
            ))}
          </div>

          <section aria-labelledby="ticket-queue-title">
            <div className="mb-4">
              <h2 id="ticket-queue-title" className="font-display text-2xl font-semibold tracking-tight">File des demandes</h2>
              <p className="mt-1 text-sm text-muted-foreground">Commencez par les urgences, puis avancez vers les demandes les plus anciennes.</p>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid h-auto w-full grid-cols-3 sm:w-auto">
                <TabsTrigger value="open">Ouverts <span className="ml-1 hidden sm:inline">({openTickets.length})</span></TabsTrigger>
                <TabsTrigger value="in_progress">En cours <span className="ml-1 hidden sm:inline">({inProgressTickets.length})</span></TabsTrigger>
                <TabsTrigger value="resolved">Terminés <span className="ml-1 hidden sm:inline">({resolvedTickets.length})</span></TabsTrigger>
              </TabsList>
              <TabsContent value="open"><TicketQueue tickets={openTickets} title="Tickets ouverts" onTicketSelect={setSelectedTicket} /></TabsContent>
              <TabsContent value="in_progress"><TicketQueue tickets={inProgressTickets} title="Tickets en traitement" onTicketSelect={setSelectedTicket} /></TabsContent>
              <TabsContent value="resolved"><TicketQueue tickets={resolvedTickets} title="Tickets terminés" onTicketSelect={setSelectedTicket} /></TabsContent>
            </Tabs>
          </section>
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
                <DialogDescription>{selectedTicket.userName} · {selectedTicket.userEmail}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-5">
                <div className="grid gap-3 rounded-2xl border bg-muted/30 p-4 text-sm sm:grid-cols-3">
                  <div><p className="text-muted-foreground">Référence</p><p className="break-all font-medium">{selectedTicket.id}</p></div>
                  <div><p className="text-muted-foreground">Reçu le</p><p className="font-medium">{formatTicketDate(selectedTicket.submittedAt)}</p></div>
                  <div><p className="text-muted-foreground">Dernière activité</p><p className="font-medium">{formatTicketDate(selectedTicket.updatedAt)}</p></div>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Message de l’utilisateur</h3>
                  <div className="whitespace-pre-wrap rounded-2xl border p-4 text-sm leading-6">{selectedTicket.description}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="ticket-status">Statut du ticket</label>
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(status: TicketStatus) => void updateTicketStatus(selectedTicket, status)}
                    disabled={updatingTicketId === selectedTicket.id}
                  >
                    <SelectTrigger id="ticket-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Ouvert</SelectItem>
                      <SelectItem value="in_progress">En traitement</SelectItem>
                      <SelectItem value="resolved">Résolu</SelectItem>
                      <SelectItem value="closed">Clôturé</SelectItem>
                    </SelectContent>
                  </Select>
                  {updatingTicketId === selectedTicket.id && (
                    <p className="flex items-center text-xs text-muted-foreground" aria-live="polite">
                      <Loader2 className="mr-2 h-3 w-3 animate-spin motion-reduce:animate-none" />Enregistrement du statut…
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => openConversation(selectedTicket)}>
                  <MessageSquareText className="mr-2 h-4 w-4" />Ouvrir la conversation
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
