"use client";

import * as React from "react";
import { Check, GraduationCap, Loader2, RefreshCw, Search, Send, UserCheck, X } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelectCombobox, type MultiSelectOption } from "@/components/ui/multi-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type GraduateStatus = "pending" | "active";
type EducationEntry = { degree: string; field: string; gradYear: string; verified: boolean };
type Graduate = { id: string; name: string; email: string; status: GraduateStatus; education?: EducationEntry[] };
type GraduatesResponse = { data: { graduates: Graduate[] } };
type GraduateResponse = { data: { graduate: Graduate } };
type EducationResponse = { data: { education: EducationEntry[] } };
type BroadcastResponse = { data: { sent: number } };

function resolveRecipientIds(selected: MultiSelectOption[], graduates: Graduate[]) {
  const ids = new Set<string>();
  for (const option of selected) {
    if (option.value === "group:all") graduates.forEach((graduate) => ids.add(graduate.id));
    else if (option.value === "group:pending") graduates.filter((graduate) => graduate.status === "pending").forEach((graduate) => ids.add(graduate.id));
    else if (option.value === "group:active") graduates.filter((graduate) => graduate.status === "active").forEach((graduate) => ids.add(graduate.id));
    else ids.add(option.value);
  }
  return [...ids];
}

function BroadcastDialog({ graduates }: { graduates: Graduate[] }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<MultiSelectOption[]>([]);
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const graduateOptions = React.useMemo(() => graduates.map((graduate) => ({ value: graduate.id, label: graduate.name })), [graduates]);
  const groupOptions = React.useMemo<MultiSelectOption[]>(() => [
    { value: "group:all", label: "Tous les diplômés" },
    { value: "group:pending", label: "Comptes en attente" },
    { value: "group:active", label: "Comptes actifs" },
  ], []);
  const recipientIds = React.useMemo(() => resolveRecipientIds(selected, graduates), [graduates, selected]);

  const send = async () => {
    if (recipientIds.length === 0 || subject.trim().length < 3 || !body.trim()) return;
    setSending(true);
    try {
      const response = await apiFetch<BroadcastResponse>("/api/conversations/broadcast", {
        method: "POST",
        body: JSON.stringify({ recipientIds, subject: subject.trim(), body: body.trim() }),
      });
      toast({ title: "Message envoyé", description: `${response.data.sent} destinataire${response.data.sent > 1 ? "s" : ""} a reçu le message dans sa messagerie Yahnu.` });
      setOpen(false);
      setSelected([]);
      setSubject("");
      setBody("");
    } catch {
      toast({ title: "Envoi impossible", description: "Le message n’a pas été envoyé. Vérifiez les destinataires puis réessayez.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="terra"><Send className="h-4 w-4" aria-hidden="true" />Écrire aux diplômés</Button></DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Envoyer un message collectif</DialogTitle>
          <DialogDescription>Chaque diplômé recevra un message individuel dans Yahnu. Vérifiez le contenu avant l’envoi.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-3">
          <div className="space-y-2">
            <Label>Destinataires</Label>
            <MultiSelectCombobox
              groups={[{ label: "Groupes", options: groupOptions }, { label: "Diplômés", options: graduateOptions }]}
              selected={selected}
              onChange={setSelected}
              placeholder="Sélectionner des destinataires…"
              searchPlaceholder="Rechercher un diplômé…"
              emptyPlaceholder="Aucun diplômé trouvé."
            />
            <p className="text-xs text-muted-foreground">{recipientIds.length} destinataire{recipientIds.length > 1 ? "s" : ""} sélectionné{recipientIds.length > 1 ? "s" : ""}</p>
          </div>
          <div className="space-y-2"><Label htmlFor="broadcast-subject">Objet</Label><Input id="broadcast-subject" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={160} placeholder="Ex. Rencontre carrières au campus" /></div>
          <div className="space-y-2"><Label htmlFor="broadcast-body">Message</Label><Textarea id="broadcast-body" value={body} onChange={(event) => setBody(event.target.value)} maxLength={10_000} rows={7} placeholder="Présentez l’information, la date et la prochaine action attendue…" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>Annuler</Button>
          <Button onClick={send} disabled={sending || recipientIds.length === 0 || subject.trim().length < 3 || !body.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            {sending ? "Envoi…" : "Envoyer maintenant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function GraduateManagement() {
  const { toast } = useToast();
  const [graduates, setGraduates] = React.useState<Graduate[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [updating, setUpdating] = React.useState<string | null>(null);

  const load = React.useCallback(async (initial = false, signal?: AbortSignal) => {
    if (initial) setLoading(true); else setRefreshing(true);
    try {
      const response = await apiFetch<GraduatesResponse>("/api/schools/graduates", { signal });
      setGraduates(response.data.graduates);
      setError(false);
    } catch {
      if (!signal?.aborted) setError(true);
    } finally {
      if (!signal?.aborted) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    void load(true, controller.signal);
    const refreshVisible = () => { if (document.visibilityState === "visible") void load(false); };
    const interval = window.setInterval(refreshVisible, 45_000);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => { controller.abort(); window.clearInterval(interval); document.removeEventListener("visibilitychange", refreshVisible); };
  }, [load]);

  const setStatus = async (graduate: Graduate, status: GraduateStatus) => {
    setUpdating(graduate.id);
    try {
      const response = await apiFetch<GraduateResponse>(`/api/schools/graduates/${encodeURIComponent(graduate.id)}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setGraduates((current) => current.map((item) => item.id === graduate.id ? response.data.graduate : item));
      toast({ title: status === "active" ? "Compte activé" : "Compte remis en attente", description: `Le statut de ${graduate.name} a bien été enregistré.` });
    } catch {
      toast({ title: "Modification impossible", description: "Le statut n’a pas été modifié. Réessayez dans un instant.", variant: "destructive" });
    } finally { setUpdating(null); }
  };

  const verifyEducation = async (graduate: Graduate, index: number) => {
    setUpdating(`${graduate.id}:${index}`);
    try {
      const response = await apiFetch<EducationResponse>(`/api/schools/graduates/${encodeURIComponent(graduate.id)}/education/${index}/verify`, { method: "POST" });
      setGraduates((current) => current.map((item) => item.id === graduate.id ? { ...item, education: response.data.education } : item));
      toast({ title: "Diplôme vérifié", description: "La vérification a été enregistrée sur le profil du diplômé." });
    } catch {
      toast({ title: "Vérification impossible", description: "Le diplôme n’a pas été modifié. Réessayez dans un instant.", variant: "destructive" });
    } finally { setUpdating(null); }
  };

  const filtered = React.useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr-CI");
    return graduates.filter((graduate) => !query || `${graduate.name} ${graduate.email}`.toLocaleLowerCase("fr-CI").includes(query));
  }, [graduates, search]);
  const pending = filtered.filter((graduate) => graduate.status === "pending");
  const active = filtered.filter((graduate) => graduate.status === "active");

  const Education = ({ graduate }: { graduate: Graduate }) => graduate.education?.length ? (
    <ul className="space-y-2">
      {graduate.education.map((education, index) => (
        <li key={`${education.degree}-${index}`} className="rounded-xl border bg-muted/25 p-3 text-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><p className="font-semibold">{education.degree} · {education.field}</p><p className="mt-1 text-muted-foreground">Promotion {education.gradYear}</p></div>
            {education.verified ? <Badge variant="secondary"><Check className="mr-1 h-3 w-3" aria-hidden="true" />Vérifié</Badge> : <Button size="xs" variant="outline" onClick={() => verifyEducation(graduate, index)} disabled={updating === `${graduate.id}:${index}`}>Vérifier</Button>}
          </div>
        </li>
      ))}
    </ul>
  ) : <p className="text-sm text-muted-foreground">Aucune formation renseignée.</p>;

  const GraduateList = ({ data }: { data: Graduate[] }) => (
    <>
      <div className="space-y-3 md:hidden">
        {data.map((graduate) => (
          <Card key={graduate.id}><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-display text-lg font-semibold">{graduate.name}</p><p className="break-all text-sm text-muted-foreground">{graduate.email}</p></div><Badge variant="outline">{graduate.status === "active" ? "Actif" : "En attente"}</Badge></div><div className="mt-5"><Education graduate={graduate} /></div><Button className="mt-5 w-full" variant={graduate.status === "active" ? "outline" : "default"} onClick={() => setStatus(graduate, graduate.status === "active" ? "pending" : "active")} disabled={updating === graduate.id}>{graduate.status === "active" ? <X className="h-4 w-4" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}{graduate.status === "active" ? "Remettre en attente" : "Activer le compte"}</Button></CardContent></Card>
        ))}
      </div>
      <div className="hidden md:block">
        <Table><TableHeader><TableRow><TableHead>Diplômé</TableHead><TableHead>Formation</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>
          {data.map((graduate) => <TableRow key={graduate.id}><TableCell className="align-top"><p className="font-semibold">{graduate.name}</p><p className="text-sm text-muted-foreground">{graduate.email}</p></TableCell><TableCell><Education graduate={graduate} /></TableCell><TableCell className="text-right align-top"><Button size="sm" variant={graduate.status === "active" ? "outline" : "default"} onClick={() => setStatus(graduate, graduate.status === "active" ? "pending" : "active")} disabled={updating === graduate.id}>{graduate.status === "active" ? "Remettre en attente" : "Activer"}</Button></TableCell></TableRow>)}
        </TableBody></Table>
      </div>
      {data.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground">Aucun diplômé ne correspond à cette vue.</div> : null}
    </>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-10">
      <section className="ci-pattern overflow-hidden rounded-[1.75rem] bg-cocoa p-6 text-white shadow-lift sm:p-8">
        <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ffd4b0]">Insertion · Côte d’Ivoire</p><h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">Gardez le lien avec vos diplômés.</h1><p className="mt-3 max-w-2xl leading-7 text-white/70">Activez les comptes, vérifiez les formations et envoyez de vraies informations depuis un seul espace.</p></div>
          <BroadcastDialog graduates={graduates} />
        </div>
      </section>

      {error ? <div role="alert" className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 sm:flex-row sm:items-center"><div><p className="font-semibold">Les diplômés ne peuvent pas être chargés.</p><p className="text-sm text-muted-foreground">La dernière liste disponible reste affichée si elle existe.</p></div><Button variant="outline" onClick={() => load(false)}><RefreshCw className="h-4 w-4" aria-hidden="true" />Réessayer</Button></div> : null}

      <Card>
        <CardHeader className="border-b bg-muted/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><CardTitle className="text-2xl">Communauté diplômée</CardTitle><CardDescription className="mt-1">Données réelles associées à votre établissement.</CardDescription></div>
            <Button variant="outline" onClick={() => load(false)} disabled={loading || refreshing}><RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} aria-hidden="true" />Actualiser</Button>
          </div>
          <label className="relative mt-2 block"><span className="sr-only">Rechercher par nom ou e-mail</span><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-10" placeholder="Rechercher un nom ou un e-mail…" /></label>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loading ? <div className="grid min-h-64 place-items-center" role="status"><div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" aria-hidden="true" /><p className="mt-3 text-sm text-muted-foreground">Chargement des diplômés…</p></div></div> : (
            <Tabs defaultValue="pending"><TabsList className="grid h-auto w-full grid-cols-2"><TabsTrigger value="pending" className="min-h-11">À valider ({pending.length})</TabsTrigger><TabsTrigger value="active" className="min-h-11">Actifs ({active.length})</TabsTrigger></TabsList><TabsContent value="pending" className="mt-5"><GraduateList data={pending} /></TabsContent><TabsContent value="active" className="mt-5"><GraduateList data={active} /></TabsContent></Tabs>
          )}
        </CardContent>
      </Card>
      <p className="flex items-center gap-2 text-xs text-muted-foreground"><GraduationCap className="h-4 w-4 text-primary" aria-hidden="true" />Les vérifications et changements de statut sont enregistrés dans la base Yahnu.</p>
    </div>
  );
}
