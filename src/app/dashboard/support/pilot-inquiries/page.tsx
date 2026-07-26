"use client";

import * as React from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock3,
  Inbox,
  Loader2,
  Mail,
  MapPin,
  RefreshCw,
  Sparkles,
  Target,
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLocalization } from "@/context/localization-context";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-client";
import {
  pilotInquiryCountries,
  type PilotInquiryStatus,
  type PilotInquirySubmission,
} from "@/lib/pilot-inquiries";
import { cn } from "@/lib/utils";

type Inquiry = {
  id: string;
  kind: PilotInquirySubmission["kind"];
  fullName: string;
  email: string;
  phone?: string;
  organizationName: string;
  organizationType: PilotInquirySubmission["organizationType"];
  roleTitle?: string;
  city?: string;
  countryCode: PilotInquirySubmission["countryCode"];
  participantEstimate?: number;
  timeline: PilotInquirySubmission["timeline"];
  message: string;
  locale: "fr" | "en";
  source: PilotInquirySubmission["source"];
  campaign?: string;
  status: PilotInquiryStatus;
  internalNotes?: string;
  retentionExpiresAt: string;
  createdAt: string;
  updatedAt: string;
};

type InquirySummary = Record<PilotInquiryStatus, number>;
type ListResponse = {
  data: {
    inquiries: Inquiry[];
    summary: InquirySummary;
    hasMore: boolean;
    nextOffset: number;
  };
};
type UpdateResponse = {
  data: {
    inquiry: {
      id: string;
      status: PilotInquiryStatus;
      internalNotes?: string;
      updatedAt: string;
    };
  };
};

const statusOrder: PilotInquiryStatus[] = ["new", "reviewing", "contacted", "qualified", "closed"];

const labels = {
  fr: {
    status: {
      new: "Nouveau",
      reviewing: "À qualifier",
      contacted: "Contacté",
      qualified: "Qualifié",
      closed: "Clôturé",
    },
    kind: {
      pilot: "Pilote",
      partnership: "Partenariat",
      employer: "Employeur",
      school: "Établissement",
      product: "Découverte",
      other: "Autre",
    },
    organizationType: {
      public_institution: "Institution publique / collectivité",
      university: "Université / école",
      company: "Entreprise",
      ngo: "ONG / association",
      funder: "Bailleur / fondation",
      community: "Structure d’accompagnement",
      other: "Autre",
    },
    timelineValue: {
      now: "Dès que possible",
      three_months: "Dans les 3 prochains mois",
      six_months: "Dans les 6 prochains mois",
      exploring: "En exploration",
    },
    sourceValue: {
      contact: "Page Contact",
      institutions: "Page Institutions",
      impact: "Page Impact",
      footer: "Pied de page",
      other: "Autre origine",
    },
    title: "Demandes de pilote & partenariats",
    subtitle: "Une file mesurable pour passer du premier contact à une prochaine action claire.",
    refresh: "Actualiser",
    loadMore: "Afficher la suite",
    loadingMore: "Chargement…",
    loadError: "La file des demandes ne répond pas.",
    retry: "Réessayer",
    empty: "Aucune demande dans cette vue.",
    all: "Toutes",
    requester: "Contact",
    organization: "Organisation",
    request: "Demande",
    received: "Reçue",
    open: "Ouvrir",
    message: "Besoin exprimé",
    details: "Contexte",
    people: "Public estimé",
    timeline: "Horizon",
    source: "Origine",
    statusLabel: "Statut",
    retention: "Suppression prévue",
    internalNotes: "Notes internes",
    notesHint: "Décisions, prochaine étape ou personne responsable. Ne copiez pas de données sensibles inutiles.",
    save: "Enregistrer",
    saving: "Enregistrement…",
    email: "Répondre par e-mail",
    saved: "Demande mise à jour",
    saveError: "La mise à jour n’a pas pu être enregistrée.",
    queue: "File de qualification",
    queueBody: "Commencez par les nouvelles demandes les plus anciennes.",
  },
  en: {
    status: {
      new: "New",
      reviewing: "Reviewing",
      contacted: "Contacted",
      qualified: "Qualified",
      closed: "Closed",
    },
    kind: {
      pilot: "Pilot",
      partnership: "Partnership",
      employer: "Employer",
      school: "School",
      product: "Product tour",
      other: "Other",
    },
    organizationType: {
      public_institution: "Public institution / local authority",
      university: "University / school",
      company: "Company",
      ngo: "NGO / association",
      funder: "Funder / foundation",
      community: "Support organisation",
      other: "Other",
    },
    timelineValue: {
      now: "As soon as possible",
      three_months: "Within 3 months",
      six_months: "Within 6 months",
      exploring: "Exploring",
    },
    sourceValue: {
      contact: "Contact page",
      institutions: "Institutions page",
      impact: "Impact page",
      footer: "Footer",
      other: "Other source",
    },
    title: "Pilot & partnership requests",
    subtitle: "A measurable queue that turns first contact into a clear next action.",
    refresh: "Refresh",
    loadMore: "Load more",
    loadingMore: "Loading…",
    loadError: "The request queue is unavailable.",
    retry: "Try again",
    empty: "No requests in this view.",
    all: "All",
    requester: "Contact",
    organization: "Organisation",
    request: "Request",
    received: "Received",
    open: "Open",
    message: "Expressed need",
    details: "Context",
    people: "Estimated audience",
    timeline: "Timeline",
    source: "Source",
    statusLabel: "Status",
    retention: "Scheduled deletion",
    internalNotes: "Internal notes",
    notesHint: "Decision, next step or owner. Do not copy unnecessary sensitive data.",
    save: "Save",
    saving: "Saving…",
    email: "Reply by email",
    saved: "Request updated",
    saveError: "The update could not be saved.",
    queue: "Qualification queue",
    queueBody: "Start with the oldest new requests.",
  },
} as const;

function formatDate(value: string, locale: "fr" | "en") {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CI" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Abidjan",
  }).format(date);
}

function countryName(code: Inquiry["countryCode"], locale: "fr" | "en") {
  return pilotInquiryCountries.find((country) => country.code === code)?.[locale] ?? code;
}

function StatusBadge({
  status,
  locale,
}: {
  status: PilotInquiryStatus;
  locale: "fr" | "en";
}) {
  const styles: Record<PilotInquiryStatus, string> = {
    new: "border-lagoon/30 bg-lagoon/10 text-lagoon",
    reviewing: "border-soleil/50 bg-soleil/15 text-cocoa",
    contacted: "border-primary/30 bg-primary/10 text-primary",
    qualified: "border-primary/40 bg-primary/15 text-primary",
    closed: "border-border bg-muted text-muted-foreground",
  };
  return <Badge variant="outline" className={styles[status]}>{labels[locale].status[status]}</Badge>;
}

export default function PilotInquiriesPage() {
  const { language } = useLocalization();
  const locale = language === "en" ? "en" : "fr";
  const text = labels[locale];
  const { toast } = useToast();
  const [inquiries, setInquiries] = React.useState<Inquiry[]>([]);
  const [summary, setSummary] = React.useState<InquirySummary>({
    new: 0,
    reviewing: 0,
    contacted: 0,
    qualified: 0,
    closed: 0,
  });
  const [activeStatus, setActiveStatus] = React.useState<"all" | PilotInquiryStatus>("all");
  const [selected, setSelected] = React.useState<Inquiry | null>(null);
  const [draftStatus, setDraftStatus] = React.useState<PilotInquiryStatus>("new");
  const [draftNotes, setDraftNotes] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(false);
  const [nextOffset, setNextOffset] = React.useState(0);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  const load = React.useCallback(async ({
    initial = false,
    append = false,
    offset = 0,
    signal,
  }: {
    initial?: boolean;
    append?: boolean;
    offset?: number;
    signal?: AbortSignal;
  } = {}) => {
    if (initial) setIsLoading(true);
    else if (append) setIsLoadingMore(true);
    else setIsRefreshing(true);
    setHasError(false);
    try {
      const parameters = new URLSearchParams({
        limit: "50",
        offset: String(offset),
      });
      if (activeStatus !== "all") parameters.set("status", activeStatus);
      const response = await apiFetch<ListResponse>(
        `/api/pilot-inquiries?${parameters.toString()}`,
        { signal },
      );
      setInquiries((current) => append
        ? [...current, ...response.data.inquiries]
        : response.data.inquiries);
      setSummary(response.data.summary);
      setHasMore(response.data.hasMore);
      setNextOffset(response.data.nextOffset);
      if (!append) {
        setSelected((current) => current
          ? response.data.inquiries.find((item) => item.id === current.id) ?? null
          : null);
      }
    } catch {
      if (!signal?.aborted) setHasError(true);
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    }
  }, [activeStatus]);

  React.useEffect(() => {
    const controller = new AbortController();
    void load({ initial: true, signal: controller.signal });
    return () => controller.abort();
  }, [load]);

  const openInquiry = (inquiry: Inquiry) => {
    setSelected(inquiry);
    setDraftStatus(inquiry.status);
    setDraftNotes(inquiry.internalNotes ?? "");
  };

  const save = async () => {
    if (!selected || isSaving) return;
    setIsSaving(true);
    try {
      const response = await apiFetch<UpdateResponse>(
        `/api/pilot-inquiries/${encodeURIComponent(selected.id)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: draftStatus, internalNotes: draftNotes }),
        },
      );
      const update = response.data.inquiry;
      setInquiries((current) => current.map((item) => item.id === selected.id
        ? { ...item, ...update }
        : item));
      setSelected((current) => current ? { ...current, ...update } : null);
      toast({ title: text.saved });
      setSelected(null);
      await load({ offset: 0 });
    } catch {
      toast({ title: text.saveError, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const visible = inquiries;
  const total = statusOrder.reduce((sum, status) => sum + summary[status], 0);
  const selectedTotal = activeStatus === "all" ? total : summary[activeStatus];
  const cards = [
    [text.status.new, summary.new, Inbox, "bg-lagoon/10 text-lagoon"],
    [text.status.reviewing, summary.reviewing, Clock3, "bg-soleil/20 text-cocoa"],
    [text.status.qualified, summary.qualified, Target, "bg-primary/10 text-primary"],
  ] as const;

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="dashboard-surface ci-pattern overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="section-kicker"><Sparkles className="h-4 w-4" />Pilote Yahnu · Côte d’Ivoire & Afrique</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{text.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{text.subtitle}</p>
          </div>
          <Button variant="outline" onClick={() => void load()} disabled={isLoading || isRefreshing}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin motion-reduce:animate-none")} />
            {text.refresh}
          </Button>
        </div>
      </section>

      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{text.loadError}</AlertTitle>
          <AlertDescription>
            <Button className="mt-3" variant="outline" size="sm" onClick={() => void load()}>{text.retry}</Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Card aria-live="polite">
          <CardContent className="flex min-h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary motion-reduce:animate-none" />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {cards.map(([label, value, Icon, accent]) => (
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

          <section aria-labelledby="inquiry-queue-title">
            <div className="mb-4">
              <h2 id="inquiry-queue-title" className="font-display text-2xl font-semibold">{text.queue}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{text.queueBody}</p>
            </div>
            <Tabs value={activeStatus} onValueChange={(value) => setActiveStatus(value as typeof activeStatus)}>
              <TabsList className="mb-4 flex h-auto w-full justify-start overflow-x-auto p-1 sm:w-auto">
                <TabsTrigger value="all" className="shrink-0">{text.all} ({total})</TabsTrigger>
                {statusOrder.map((status) => (
                  <TabsTrigger key={status} value={status} className="shrink-0">
                    {text.status[status]} ({summary[status]})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {visible.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
                  <span className="rounded-full bg-primary/10 p-3"><CheckCircle2 className="h-6 w-6 text-primary" /></span>
                  <p className="text-sm text-muted-foreground">{text.empty}</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>{text.queue}</CardTitle>
                  <CardDescription>{visible.length} / {selectedTotal}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:hidden">
                    {visible.map((inquiry) => (
                      <button
                        key={inquiry.id}
                        type="button"
                        onClick={() => openInquiry(inquiry)}
                        className="rounded-2xl border p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={inquiry.status} locale={locale} />
                          <Badge variant="outline">{text.kind[inquiry.kind]}</Badge>
                        </div>
                        <p className="mt-3 font-semibold">{inquiry.organizationName}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{inquiry.fullName} · {inquiry.email}</p>
                        <p className="mt-3 text-xs text-muted-foreground">{formatDate(inquiry.createdAt, locale)}</p>
                      </button>
                    ))}
                  </div>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{text.requester}</TableHead>
                          <TableHead>{text.organization}</TableHead>
                          <TableHead>{text.request}</TableHead>
                          <TableHead>{text.received}</TableHead>
                          <TableHead><span className="sr-only">{text.open}</span></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visible.map((inquiry) => (
                          <TableRow key={inquiry.id}>
                            <TableCell>
                              <p className="font-medium">{inquiry.fullName}</p>
                              <p className="text-sm text-muted-foreground">{inquiry.email}</p>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{inquiry.organizationName}</p>
                              <p className="text-sm text-muted-foreground">{inquiry.city || countryName(inquiry.countryCode, locale)}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                <StatusBadge status={inquiry.status} locale={locale} />
                                <Badge variant="outline">{text.kind[inquiry.kind]}</Badge>
                              </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">{formatDate(inquiry.createdAt, locale)}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => openInquiry(inquiry)}>{text.open}</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
                {hasMore && (
                  <div className="border-t p-4 text-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void load({ append: true, offset: nextOffset })}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
                      )}
                      {isLoadingMore ? text.loadingMore : text.loadMore}
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </section>
        </>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2 pr-8">
                  <DialogTitle>{selected.organizationName}</DialogTitle>
                  <StatusBadge status={selected.status} locale={locale} />
                </div>
                <DialogDescription>{selected.fullName} · {selected.email}</DialogDescription>
              </DialogHeader>

              <div className="grid gap-5">
                <div className="grid gap-3 rounded-2xl border bg-muted/30 p-4 text-sm sm:grid-cols-2">
                  <div className="flex gap-2"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{selected.roleTitle || "—"} · {text.organizationType[selected.organizationType]}</span></div>
                  <div className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{selected.city ? `${selected.city}, ` : ""}{countryName(selected.countryCode, locale)}</span></div>
                  <div><span className="text-muted-foreground">{text.people}:</span> {selected.participantEstimate?.toLocaleString() ?? "—"}</div>
                  <div><span className="text-muted-foreground">{text.timeline}:</span> {text.timelineValue[selected.timeline]}</div>
                  <div><span className="text-muted-foreground">{text.source}:</span> {text.sourceValue[selected.source]}{selected.campaign ? ` · ${selected.campaign}` : ""}</div>
                  <div><span className="text-muted-foreground">{text.retention}:</span> {formatDate(selected.retentionExpiresAt, locale)}</div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold">{text.message}</h3>
                  <div className="whitespace-pre-wrap rounded-2xl border p-4 text-sm leading-6">{selected.message}</div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="pilot-inquiry-status">{text.statusLabel}</Label>
                  <Select value={draftStatus} onValueChange={(value: PilotInquiryStatus) => setDraftStatus(value)}>
                    <SelectTrigger id="pilot-inquiry-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {statusOrder.map((status) => (
                        <SelectItem key={status} value={status}>{text.status[status]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="pilot-inquiry-notes">{text.internalNotes}</Label>
                  <Textarea
                    id="pilot-inquiry-notes"
                    value={draftNotes}
                    onChange={(event) => setDraftNotes(event.target.value)}
                    rows={4}
                    maxLength={4000}
                    placeholder={text.notesHint}
                  />
                  <p className="text-xs text-muted-foreground">{draftNotes.length}/4000</p>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" asChild>
                  <a href={`mailto:${encodeURIComponent(selected.email)}?subject=${encodeURIComponent(`Yahnu · ${selected.organizationName} · ${selected.id}`)}`}>
                    <Mail className="mr-2 h-4 w-4" />{text.email}
                  </a>
                </Button>
                <Button onClick={() => void save()} disabled={isSaving}>
                  {isSaving
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{text.saving}</>
                    : text.save}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
