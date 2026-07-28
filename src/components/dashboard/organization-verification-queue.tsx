"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  BadgeCheck,
  Building2,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  School,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { WorkspaceFrame } from "@/components/dashboard/workspace-frame";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-client";

type VerificationRequest = {
  id: string;
  role: "company" | "school";
  organizationName: string;
  accountEmail: string;
  slug: string;
  description: string;
  websiteUrl: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: "pending" | "verified" | "rejected" | "unverified";
  requestedAt: string | null;
  reviewedAt: string | null;
  note: string | null;
  updatedAt: string;
};

type QueueResponse = {
  data: {
    requests: VerificationRequest[];
    hasMore: boolean;
    offset: number;
  };
};

export function OrganizationVerificationQueue() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<QueueResponse>(
        `/api/admin/organization-verifications?status=pending&limit=50&offset=${offset}`,
      );
      setRequests((current) => offset > 0
        ? [...current, ...response.data.requests]
        : response.data.requests);
      setHasMore(response.data.hasMore);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "La file de vérification est indisponible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(0);
  }, [load]);

  const review = async (request: VerificationRequest, decision: "approve" | "reject") => {
    const note = (notes[request.id] || "").trim();
    if (decision === "reject" && note.length < 10) {
      toast({
        title: "Précisez la correction attendue",
        description: "Ajoutez une note d’au moins 10 caractères pour guider l’organisation.",
        variant: "destructive",
      });
      return;
    }
    setActingId(request.id);
    try {
      await apiFetch(`/api/admin/organization-verifications/${encodeURIComponent(request.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ decision, note }),
      });
      setRequests((current) => current.filter((item) => item.id !== request.id));
      setNotes((current) => {
        const next = { ...current };
        delete next[request.id];
        return next;
      });
      toast({
        title: decision === "approve" ? "Organisation vérifiée" : "Demande retournée",
        description: decision === "approve"
          ? `${request.organizationName} affiche désormais le badge Yahnu.`
          : `${request.organizationName} a reçu les corrections demandées.`,
      });
    } catch (reviewError) {
      toast({
        title: "Décision non enregistrée",
        description: reviewError instanceof Error ? reviewError.message : "Réessayez dans un instant.",
        variant: "destructive",
      });
    } finally {
      setActingId(null);
    }
  };

  return (
    <WorkspaceFrame
      eyebrow="Confiance Yahnu"
      title="Vérifier les organisations avec discernement."
      description="Examinez l’identité, le site et le contact déclarés avant d’accorder le badge visible par les jeunes talents ivoiriens."
      icon={BadgeCheck}
      accent="primary"
      actions={(
        <Button
          type="button"
          variant="outline"
          onClick={() => void load(0)}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      )}
    >
      <Alert className="border-primary/20 bg-primary/[0.04]">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Contrôle humain et traçable</AlertTitle>
        <AlertDescription>
          Chaque décision est horodatée, attribuée à l’administrateur connecté et communiquée à l’organisation.
          Une modification ultérieure du nom, de l’adresse e-mail ou des preuves d’identité retire automatiquement le badge.
        </AlertDescription>
      </Alert>

      {loading && requests.length === 0 ? (
        <div className="grid min-h-72 place-items-center" role="status" aria-live="polite">
          <Loader2 className="h-9 w-9 animate-spin text-primary" aria-hidden="true" />
          <span className="sr-only">Chargement des demandes de vérification</span>
        </div>
      ) : error ? (
        <Card className="border-destructive/30">
          <CardContent className="p-8 text-center">
            <XCircle className="mx-auto h-9 w-9 text-destructive" />
            <h2 className="mt-4 text-xl font-semibold">File indisponible</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            <Button className="mt-5" variant="outline" onClick={() => void load(0)}>Réessayer</Button>
          </CardContent>
        </Card>
      ) : requests.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-10 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
            <h2 className="mt-4 font-display text-2xl font-bold">La file est à jour</h2>
            <p className="mt-2 text-sm text-muted-foreground">Aucune organisation n’attend une décision.</p>
          </CardContent>
        </Card>
      ) : (
        <section className="space-y-5" aria-label="Demandes de vérification en attente">
          {requests.map((request) => {
            const Icon = request.role === "company" ? Building2 : School;
            const busy = actingId === request.id;
            return (
              <Card key={request.id} className="overflow-hidden border-border/70">
                <CardHeader className="border-b bg-muted/25">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <CardTitle className="break-words">{request.organizationName}</CardTitle>
                        <CardDescription className="mt-1">
                          {request.role === "company" ? "Entreprise" : "Établissement"} · demande du{" "}
                          {new Intl.DateTimeFormat("fr-CI", { dateStyle: "medium" }).format(
                            new Date(request.requestedAt || request.updatedAt),
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="w-fit">En attente</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:p-6">
                  <div className="space-y-5">
                    <p className="line-clamp-5 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                      {request.description}
                    </p>
                    <dl className="grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-2xl border p-3">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Compte</dt>
                        <dd className="mt-1 break-all">{request.accountEmail}</dd>
                      </div>
                      <div className="rounded-2xl border p-3">
                        <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact déclaré</dt>
                        <dd className="mt-1">{request.contactName || "Non renseigné"}</dd>
                      </div>
                    </dl>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                      {request.websiteUrl ? (
                        <Link
                          href={request.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-primary hover:underline"
                        >
                          Examiner le site <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      ) : null}
                      {request.contactEmail ? (
                        <span className="inline-flex items-center"><Mail className="mr-1.5 h-3.5 w-3.5" />{request.contactEmail}</span>
                      ) : null}
                      {request.contactPhone ? (
                        <span className="inline-flex items-center"><Phone className="mr-1.5 h-3.5 w-3.5" />{request.contactPhone}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-4 rounded-3xl border bg-card p-4">
                    <div className="space-y-2">
                      <Label htmlFor={`verification-note-${request.id}`}>Note de revue</Label>
                      <Textarea
                        id={`verification-note-${request.id}`}
                        value={notes[request.id] || ""}
                        onChange={(event) => setNotes((current) => ({
                          ...current,
                          [request.id]: event.target.value,
                        }))}
                        maxLength={1000}
                        rows={5}
                        placeholder="Éléments vérifiés ou corrections précises à apporter…"
                        disabled={busy}
                      />
                      <p className="text-xs text-muted-foreground">
                        Obligatoire pour un rejet, facultative pour une approbation.
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                      <Button type="button" onClick={() => void review(request, "approve")} disabled={busy}>
                        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Approuver
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                        onClick={() => void review(request, "reject")}
                        disabled={busy}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Demander des corrections
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {hasMore ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => void load(requests.length)} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Charger la suite
              </Button>
            </div>
          ) : null}
        </section>
      )}
    </WorkspaceFrame>
  );
}
