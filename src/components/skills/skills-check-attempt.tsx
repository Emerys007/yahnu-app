"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  EyeOff,
  Loader2,
  LockKeyhole,
  Send,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-client";
import {
  remainingAttemptSeconds,
  type SkillsAttestationSummary,
  type SkillsAttemptView,
} from "@/lib/skills-checks";

type AttemptResponse = { data: { attempt: SkillsAttemptView } };
type SubmitResponse = {
  data: {
    attempt: SkillsAttemptView;
    attestation?: SkillsAttestationSummary;
  };
};

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function SkillsCheckAttempt({ attemptId }: { attemptId: string }) {
  const { toast } = useToast();
  const [attempt, setAttempt] = useState<SkillsAttemptView | null>(null);
  const [attestation, setAttestation] = useState<SkillsAttestationSummary | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [remaining, setRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const lastSignalAt = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch<AttemptResponse>(
        `/api/skills/attempts/${attemptId}?locale=fr`,
      );
      setAttempt(response.data.attempt);
      setRemaining(
        remainingAttemptSeconds(
          response.data.attempt.serverNow,
          response.data.attempt.expiresAt,
        ),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Cette tentative ne peut pas être chargée.");
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!attempt || attempt.status !== "in_progress") return;
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setAttempt((current) => current ? { ...current, status: "expired", questions: [] } : current);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [attempt]);

  useEffect(() => {
    if (!attempt || attempt.status !== "in_progress") return;

    const record = (kind: "visibility_hidden" | "focus_lost") => {
      const now = Date.now();
      if (now - lastSignalAt.current < 1200) return;
      lastSignalAt.current = now;
      const elapsed = Math.max(0, now - new Date(attempt.startedAt).getTime());
      void fetch(`/api/skills/attempts/${attempt.id}/signals`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        cache: "no-store",
        keepalive: true,
        body: JSON.stringify({ kind, clientElapsedMs: Math.min(elapsed, 7_200_000) }),
      });
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") record("visibility_hidden");
    };
    const onBlur = () => record("focus_lost");
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [attempt]);

  const answeredCount = Object.keys(answers).length;
  const completion = attempt?.questions.length
    ? Math.round((answeredCount / attempt.questions.length) * 100)
    : 0;
  const allAnswered = Boolean(attempt?.questions.length && answeredCount === attempt.questions.length);

  const submit = async () => {
    if (!attempt || !allAnswered || remaining <= 0) return;
    setSubmitting(true);
    try {
      const response = await apiFetch<SubmitResponse>(
        `/api/skills/attempts/${attempt.id}/submit`,
        {
          method: "POST",
          body: JSON.stringify({
            locale: "fr",
            answers: attempt.questions.map((question) => ({
              questionId: question.id,
              optionIndex: answers[question.id],
            })),
          }),
        },
      );
      setAttempt(response.data.attempt);
      setAttestation(response.data.attestation ?? null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submitError) {
      toast({
        title: "Envoi impossible",
        description: submitError instanceof Error ? submitError.message : "Réessayez dans un instant.",
        variant: "destructive",
      });
      if (submitError instanceof Error && /time|temps|ended|expired/i.test(submitError.message)) {
        void load();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resultHeading = useMemo(() => {
    if (!attempt || attempt.status !== "submitted") return "";
    return attempt.passed ? "Seuil atteint — bravo." : "Une nouvelle étape de travail est claire.";
  }, [attempt]);

  if (loading) {
    return (
      <div className="grid min-h-[26rem] place-items-center" role="status">
        <Loader2 className="size-8 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
      </div>
    );
  }

  if (!attempt || error) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Tentative introuvable</CardTitle>
          <CardDescription>{error || "Cette tentative n’est plus accessible."}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="outline">
            <Link href="/dashboard/skills-checks">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Retour aux Skills Checks
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (attempt.status === "expired") {
    return (
      <Card className="mx-auto max-w-2xl overflow-hidden border-terra/30">
        <div className="h-2 bg-terra" aria-hidden="true" />
        <CardHeader className="text-center">
          <Clock3 className="mx-auto size-10 text-terra" aria-hidden="true" />
          <CardTitle className="mt-3 text-2xl">Le temps serveur est écoulé</CardTitle>
          <CardDescription className="mx-auto max-w-lg leading-6">
            La tentative est close sans score. Une période de préparation de 24 heures
            s’applique avant la prochaine tentative.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href="/dashboard/skills-checks">Revenir à mon espace compétences</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (attempt.status === "submitted") {
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-10">
        <Card className={`overflow-hidden ${attempt.passed ? "border-primary/25" : "border-terra/25"}`}>
          <div className={`h-2 ${attempt.passed ? "bg-primary" : "bg-terra"}`} aria-hidden="true" />
          <CardHeader className="items-center px-5 py-8 text-center sm:px-8">
            <div className={`grid size-16 place-items-center rounded-3xl ${attempt.passed ? "bg-primary/10 text-primary" : "bg-terra/10 text-terra"}`}>
              {attempt.passed
                ? <CheckCircle2 className="size-8" aria-hidden="true" />
                : <XCircle className="size-8" aria-hidden="true" />}
            </div>
            <Badge className="mt-4" variant="outline">Résultat noté par le serveur</Badge>
            <CardTitle className="mt-2 text-3xl sm:text-4xl">{resultHeading}</CardTitle>
            <CardDescription className="max-w-xl text-base leading-7">
              {attempt.checkTitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-8 sm:px-8">
            <div className="mx-auto grid max-w-2xl gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-muted/50 p-5 text-center">
                <strong className="font-display text-3xl">{attempt.score} %</strong>
                <p className="mt-1 text-xs text-muted-foreground">votre score</p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-5 text-center">
                <strong className="font-display text-3xl">{attempt.passingScore} %</strong>
                <p className="mt-1 text-xs text-muted-foreground">seuil annoncé</p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-5 text-center">
                <strong className="font-display text-3xl">{attempt.integritySignalCount}</strong>
                <p className="mt-1 text-xs text-muted-foreground">signaux de contexte</p>
              </div>
            </div>

            {attempt.integrityReviewStatus === "review_suggested" ? (
              <Alert className="mx-auto mt-5 max-w-2xl rounded-2xl border-lagoon/25 bg-lagoon/5">
                <ShieldAlert className="size-4 text-lagoon" aria-hidden="true" />
                <AlertTitle>Contexte disponible pour une revue humaine</AlertTitle>
                <AlertDescription>
                  Des changements de focus ont été enregistrés. Ils n’ont pas modifié votre score
                  et ne constituent pas, seuls, une preuve d’irrégularité.
                </AlertDescription>
              </Alert>
            ) : null}
            {attempt.integrityReviewStatus === "review_expired" ? (
              <Alert className="mx-auto mt-5 max-w-2xl rounded-2xl border-terra/25 bg-terra/5">
                <ShieldAlert className="size-4 text-terra" aria-hidden="true" />
                <AlertTitle>Fenêtre de revue terminée sans décision</AlertTitle>
                <AlertDescription>
                  Les signaux techniques ont été supprimés après 90 jours conformément à la
                  politique de conservation. Cette attestation reste privée ; vous pouvez
                  effectuer une nouvelle tentative.
                </AlertDescription>
              </Alert>
            ) : null}

            {attempt.passed && attestation ? (
              <div className="mx-auto mt-6 max-w-2xl rounded-3xl border border-primary/25 bg-primary/5 p-5">
                <p className="flex items-center gap-2 font-display text-lg font-semibold">
                  <BadgeCheck className="size-5 text-primary" aria-hidden="true" />
                  Yahnu skills attestation créée
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Elle est privée par défaut. Depuis votre espace compétences ou votre profil,
                  vous pouvez consentir à un lien public, le masquer ou la révoquer.
                </p>
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="flex-col gap-3 border-t bg-muted/25 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/dashboard/skills-checks">Voir mes compétences</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/profile">Ouvrir mon profil</Link>
            </Button>
          </CardFooter>
        </Card>

        <p className="text-center text-xs leading-5 text-muted-foreground">
          Une Yahnu skills attestation n’est ni un diplôme, ni une certification accréditée,
          ni une garantie d’embauche.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="sticky top-3 z-30 rounded-2xl border bg-background/95 p-4 shadow-soft backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Badge variant="outline" className="mb-1 hidden sm:inline-flex">
              Yahnu Skills Check — verified conditions
            </Badge>
            <p className="truncate font-display font-semibold">{attempt.checkTitle}</p>
          </div>
          <div
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 font-mono text-lg font-semibold ${
              remaining <= 60 ? "bg-destructive/10 text-destructive" : "bg-cocoa text-ivory"
            }`}
            aria-live="polite"
            aria-label={`${remaining} secondes restantes`}
          >
            <Clock3 className="size-4" aria-hidden="true" />
            {formatTimer(remaining)}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Progress value={completion} className="h-2" />
          <span className="shrink-0 text-xs text-muted-foreground">
            {answeredCount}/{attempt.questions.length}
          </span>
        </div>
      </div>

      <Alert className="rounded-2xl border-lagoon/20 bg-lagoon/5">
        <EyeOff className="size-4 text-lagoon" aria-hidden="true" />
        <AlertTitle>Rappel vie privée</AlertTitle>
        <AlertDescription>
          Aucun accès caméra, micro ou écran. Les pertes de focus sont enregistrées uniquement
          comme signaux pour une éventuelle revue humaine, jamais comme échec automatique.
        </AlertDescription>
      </Alert>

      <div className="space-y-5">
        {attempt.questions.map((question, questionIndex) => (
          <Card key={question.id} className="overflow-hidden border-border/80">
            <CardHeader className="border-b bg-muted/25">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {questionIndex + 1}
                </span>
                <CardTitle className="pt-1 text-lg leading-7">{question.prompt}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <RadioGroup
                value={answers[question.id] === undefined ? "" : String(answers[question.id])}
                onValueChange={(value) => {
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: Number(value),
                  }));
                }}
                className="grid gap-3"
              >
                {question.options.map((option, optionIndex) => (
                  <Label
                    key={`${question.id}-${optionIndex}`}
                    htmlFor={`${question.id}-${optionIndex}`}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm leading-6 transition hover:border-primary/40 hover:bg-primary/[0.025] has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5 has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-primary/10"
                  >
                    <RadioGroupItem
                      id={`${question.id}-${optionIndex}`}
                      value={String(optionIndex)}
                      className="mt-1"
                    />
                    <span>{option}</span>
                  </Label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/20 bg-primary/[0.035]">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <LockKeyhole className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-display font-semibold">
                {allAnswered ? "Toutes les réponses sont prêtes." : `${attempt.questions.length - answeredCount} réponse(s) restante(s).`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Le score est calculé une seule fois, côté serveur.
              </p>
            </div>
          </div>
          <Button
            size="lg"
            className="shrink-0"
            disabled={!allAnswered || submitting || remaining <= 0}
            onClick={() => void submit()}
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                Notation…
              </>
            ) : (
              <>
                Envoyer mes réponses
                <Send className="size-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
