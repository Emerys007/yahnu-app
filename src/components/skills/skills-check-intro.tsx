"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  EyeOff,
  Loader2,
  LockKeyhole,
  Shuffle,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-client";
import type {
  SkillsAccommodationCode,
  SkillsAttemptView,
  SkillsCheckSummary,
} from "@/lib/skills-checks";

type ChecksResponse = { data: { checks: SkillsCheckSummary[] } };
type StartResponse = { data: { attempt: SkillsAttemptView } };

const accommodations: Array<{
  value: SkillsAccommodationCode;
  title: string;
  description: string;
}> = [
  {
    value: "none",
    title: "Temps standard",
    description: "La durée annoncée s’applique.",
  },
  {
    value: "extra_time_25",
    title: "+ 25 % de temps",
    description: "Soutien de lecture ou de concentration, sans justification médicale.",
  },
  {
    value: "extra_time_50",
    title: "+ 50 % de temps",
    description: "Soutien renforcé, sans collecte d’information de santé.",
  },
];

export function SkillsCheckIntro({ checkId }: { checkId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [check, setCheck] = useState<SkillsCheckSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [accommodationCode, setAccommodationCode] = useState<SkillsAccommodationCode>("none");
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<ChecksResponse>("/api/skills/checks?locale=fr")
      .then((response) => {
        if (cancelled) return;
        const selected = response.data.checks.find((item) => item.id === checkId);
        if (!selected) {
          setError("Ce Skills Check n’est pas disponible.");
          return;
        }
        if (selected.activeAttemptId) {
          router.replace(`/dashboard/skills-checks/attempt/${selected.activeAttemptId}`);
          return;
        }
        setCheck(selected);
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Chargement impossible.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [checkId, router]);

  const start = async () => {
    if (!accepted) return;
    setStarting(true);
    try {
      const response = await apiFetch<StartResponse>(
        `/api/skills/checks/${checkId}/attempts`,
        {
          method: "POST",
          body: JSON.stringify({
            accommodationCode,
            locale: "fr",
            verifiedConditionsAccepted: true,
          }),
        },
      );
      router.push(`/dashboard/skills-checks/attempt/${response.data.attempt.id}`);
    } catch (startError) {
      toast({
        title: "La tentative n’a pas démarré",
        description: startError instanceof Error ? startError.message : "Réessayez dans un instant.",
        variant: "destructive",
      });
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[26rem] place-items-center" role="status">
        <Loader2 className="size-8 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
      </div>
    );
  }

  if (!check || error) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>Skills Check indisponible</CardTitle>
          <CardDescription>{error || "Ce parcours ne peut pas être ouvert."}</CardDescription>
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

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <Button variant="ghost" asChild className="-ml-3">
        <Link href="/dashboard/skills-checks">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Tous les Skills Checks
        </Link>
      </Button>

      <Card className="overflow-hidden border-primary/20 shadow-soft">
        <div className="h-2 bg-gradient-to-r from-primary via-lagoon to-terra" aria-hidden="true" />
        <CardHeader className="space-y-4 p-5 sm:p-8">
          <Badge className="w-fit">
            Yahnu Skills Check — verified conditions
          </Badge>
          <div>
            <CardTitle className="max-w-3xl text-2xl leading-tight sm:text-4xl">
              {check.title}
            </CardTitle>
            <CardDescription className="mt-3 max-w-3xl text-base leading-7">
              {check.description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-7 px-5 pb-7 sm:px-8">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-muted/50 p-4">
              <Clock3 className="size-5 text-terra" aria-hidden="true" />
              <p className="mt-3 font-display font-semibold">{Math.ceil(check.durationSeconds / 60)} minutes</p>
              <p className="mt-1 text-xs text-muted-foreground">chronomètre appliqué par le serveur</p>
            </div>
            <div className="rounded-2xl bg-muted/50 p-4">
              <Shuffle className="size-5 text-lagoon" aria-hidden="true" />
              <p className="mt-3 font-display font-semibold">{check.questionsPerAttempt} questions</p>
              <p className="mt-1 text-xs text-muted-foreground">tirées et ordonnées aléatoirement</p>
            </div>
            <div className="rounded-2xl bg-muted/50 p-4">
              <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
              <p className="mt-3 font-display font-semibold">Seuil : {check.passingScore} %</p>
              <p className="mt-1 text-xs text-muted-foreground">notation serveur, sans réponse exposée</p>
            </div>
          </div>

          <section aria-labelledby="verified-conditions">
            <h2 id="verified-conditions" className="font-display text-xl font-semibold">
              Les conditions que Yahnu vérifie
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                [LockKeyhole, "Les clés de réponse ne quittent jamais le serveur."],
                [Clock3, "Le temps continue selon l’horloge du serveur, même en cas de fermeture de l’onglet."],
                [Shuffle, "Les questions et les options sont randomisées pour chaque tentative."],
                [EyeOff, "Aucune caméra, aucun micro, aucun enregistrement d’écran."],
              ].map(([Icon, text]) => {
                const ItemIcon = Icon as typeof Clock3;
                return (
                  <div key={String(text)} className="flex gap-3 rounded-2xl border bg-background p-4 text-sm leading-6">
                    <ItemIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <p>{String(text)}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="accommodation-heading" className="rounded-3xl border border-lagoon/20 bg-lagoon/5 p-5 sm:p-6">
            <div className="flex gap-3">
              <Accessibility className="mt-0.5 size-5 shrink-0 text-lagoon" aria-hidden="true" />
              <div>
                <h2 id="accommodation-heading" className="font-display text-lg font-semibold">
                  Choisissez votre soutien de temps
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Yahnu ne demande ni diagnostic, ni information médicale. Le choix est enregistré
                  avec la tentative pour expliquer sa durée.
                </p>
              </div>
            </div>
            <RadioGroup
              className="mt-5 grid gap-3 md:grid-cols-3"
              value={accommodationCode}
              onValueChange={(value) => setAccommodationCode(value as SkillsAccommodationCode)}
            >
              {accommodations.map((accommodation) => (
                <Label
                  key={accommodation.value}
                  htmlFor={accommodation.value}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border bg-background p-4 transition hover:border-primary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-primary/15"
                >
                  <RadioGroupItem id={accommodation.value} value={accommodation.value} className="mt-0.5" />
                  <span>
                    <span className="block font-display font-semibold">{accommodation.title}</span>
                    <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
                      {accommodation.description}
                    </span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
          </section>

          <Alert className="rounded-2xl border-terra/25 bg-terra/5">
            <EyeOff className="size-4 text-terra" aria-hidden="true" />
            <AlertTitle>Signaux d’intégrité, pas surveillance invasive</AlertTitle>
            <AlertDescription className="leading-6">
              Yahnu note uniquement si l’onglet devient masqué ou si la fenêtre perd le focus.
              Ces événements sont des signaux destinés à une éventuelle revue humaine ; ils
              ne font jamais échouer automatiquement une tentative.
            </AlertDescription>
          </Alert>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <Checkbox
              className="mt-1"
              checked={accepted}
              onCheckedChange={(value) => setAccepted(value === true)}
            />
            <span className="text-sm leading-6">
              J’ai lu ces conditions. Je comprends qu’un résultat réussi crée une
              <strong> Yahnu skills attestation</strong>, pas une certification accréditée,
              et que cette attestation reste privée tant que je n’active pas son lien public.
            </span>
          </label>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3 border-t bg-muted/25 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-sm text-muted-foreground">
            Tentative {Math.min(check.attemptsUsed30Days + 1, check.maxAttempts30Days)} sur {check.maxAttempts30Days} · fenêtre de 30 jours
          </p>
          <Button
            size="lg"
            disabled={!accepted || starting}
            onClick={() => void start()}
            className="sm:min-w-56"
          >
            {starting ? (
              <>
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                Démarrage…
              </>
            ) : (
              <>
                Démarrer maintenant
                <ArrowRight className="size-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
