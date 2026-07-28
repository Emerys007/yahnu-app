"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-client";

type ReviewAttempt = {
  id: string;
  graduateId: string;
  graduateName: string;
  checkId: string;
  checkTitle: string;
  score: number;
  signalCount: number;
  reviewStatus: "review_suggested";
  submittedAt: string;
  signals: Array<{
    kind: "visibility_hidden" | "focus_lost";
    clientElapsedMs: number | null;
    receivedAt: string;
  }>;
};

type ReviewQueueResponse = { data: { attempts: ReviewAttempt[] } };
type ReviewCategory = "focus_pattern" | "external_evidence" | "identity_mismatch" | "other";

const categoryLabels: Record<ReviewCategory, string> = {
  focus_pattern: "Schéma de changements de focus",
  external_evidence: "Élément externe documenté",
  identity_mismatch: "Incohérence d’identité documentée",
  other: "Autre élément documenté",
};

function ReviewCard({
  attempt,
  onReviewed,
}: {
  attempt: ReviewAttempt;
  onReviewed: (id: string, decision: "reviewed_clear" | "confirmed_concern") => void;
}) {
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<ReviewCategory | "">("");
  const [saving, setSaving] = useState(false);

  const review = async (decision: "reviewed_clear" | "confirmed_concern") => {
    setSaving(true);
    try {
      await apiFetch(`/api/admin/skills/attempts/${attempt.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          decision,
          ...(decision === "confirmed_concern" && category ? { category } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      });
      onReviewed(attempt.id, decision);
      toast({
        title: decision === "reviewed_clear" ? "Revue clôturée" : "Irrégularité confirmée",
        description: decision === "reviewed_clear"
          ? "Les signaux ont été examinés sans mesure défavorable."
          : "La décision humaine est auditée et l’attestation associée a été révoquée.",
      });
    } catch (error) {
      toast({
        title: "Revue impossible",
        description: error instanceof Error ? error.message : "Réessayez dans un instant.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border/80">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{attempt.signalCount} signal{attempt.signalCount > 1 ? "s" : ""}</Badge>
              <Badge variant="secondary">Revue suggérée</Badge>
            </div>
            <CardTitle className="mt-3 text-xl">{attempt.graduateName}</CardTitle>
            <CardDescription className="mt-1">
              {attempt.checkTitle} · {attempt.score} %
            </CardDescription>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("fr-CI", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(new Date(attempt.submittedAt))}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-2xl border bg-muted/25 p-4">
            <p className="text-sm font-semibold">Signaux techniques disponibles</p>
            <ul className="mt-2 space-y-2 text-xs text-muted-foreground">
              {attempt.signals.map((signal, index) => (
                <li key={`${signal.receivedAt}-${index}`} className="flex flex-wrap justify-between gap-2">
                  <span>
                    {signal.kind === "focus_lost" ? "Fenêtre désactivée" : "Page masquée"}
                    {signal.clientElapsedMs !== null
                      ? ` · ${Math.round(signal.clientElapsedMs / 1000)} s après le début`
                      : ""}
                  </span>
                  <time dateTime={signal.receivedAt}>
                    {new Intl.DateTimeFormat("fr-CI", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(signal.receivedAt))}
                  </time>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => void review("reviewed_clear")}
            >
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
              Clôturer sans mesure
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={saving}>
                  <ShieldAlert className="size-4" aria-hidden="true" />
                  Confirmer une irrégularité
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Décision humaine requise</AlertDialogTitle>
                  <AlertDialogDescription className="leading-6">
                    Une perte de focus n’est pas une preuve. Confirmez uniquement si votre revue
                    dispose d’éléments suffisants. Cette action révoque l’attestation et est auditée.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold">
                      Catégorie de l’élément examiné
                    </label>
                    <Select
                      value={category}
                      onValueChange={(value) => setCategory(value as ReviewCategory)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                  <label htmlFor={`review-note-${attempt.id}`} className="text-sm font-semibold">
                    Motif de la décision
                  </label>
                  <Textarea
                    id={`review-note-${attempt.id}`}
                    className="mt-2 min-h-28"
                    maxLength={500}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Décrivez brièvement les éléments examinés, sans donnée sensible."
                  />
                  <p className="mt-1 text-xs text-muted-foreground">{note.length}/500</p>
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={!category || note.trim().length < 3 || saving}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => void review("confirmed_concern")}
                  >
                    Confirmer et révoquer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SkillsReviewQueue() {
  const [attempts, setAttempts] = useState<ReviewAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch<ReviewQueueResponse>("/api/admin/skills/attempts?limit=100");
      setAttempts(response.data.attempts);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "La file de revue est indisponible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6 pb-10">
      <section className="ci-pattern relative overflow-hidden rounded-[1.75rem] border border-lagoon/20 bg-gradient-to-br from-lagoon/10 via-background to-primary/10 p-5 sm:p-8">
        <Badge variant="outline" className="border-lagoon/25 bg-background/70">
          <ShieldCheck className="mr-1.5 size-3.5 text-lagoon" aria-hidden="true" />
          Revue humaine · journalisée
        </Badge>
        <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
          Intégrité des Skills Checks
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
          Examinez les signaux de focus et de visibilité sans décision automatique.
          Aucun flux caméra, micro ou écran n’existe dans ce produit.
        </p>
      </section>

      <Alert className="rounded-2xl border-terra/25 bg-terra/5">
        <ShieldAlert className="size-4 text-terra" aria-hidden="true" />
        <AlertTitle>Les signaux ne prouvent pas une irrégularité</AlertTitle>
        <AlertDescription>
          Une notification, un appel ou une aide d’accessibilité peut faire perdre le focus.
          Clôturez sans mesure si aucun autre élément fiable ne justifie une décision défavorable.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="section-kicker">File opérationnelle</p>
          <h2 className="font-display text-2xl font-semibold">{attempts.length} dossier{attempts.length > 1 ? "s" : ""}</h2>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
          Actualiser
        </Button>
      </div>

      {loading ? (
        <div className="grid min-h-52 place-items-center" role="status">
          <Loader2 className="size-8 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
        </div>
      ) : error ? (
        <Card className="border-destructive/25">
          <CardHeader>
            <CardTitle>Chargement impossible</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : attempts.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {attempts.map((attempt) => (
            <ReviewCard
              key={attempt.id}
              attempt={attempt}
              onReviewed={(id) => {
                setAttempts((current) => current.filter((item) => item.id !== id));
              }}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="px-5 py-12 text-center">
            <CheckCircle2 className="mx-auto size-10 text-primary" aria-hidden="true" />
            <p className="mt-4 font-display text-xl font-semibold">Aucune revue en attente</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Les nouvelles tentatives signalées apparaîtront ici.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
