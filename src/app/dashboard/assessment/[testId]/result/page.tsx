"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  EyeOff,
  LockKeyhole,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type PracticeResult = {
  testId: string;
  title: string;
  correct: number;
  total: number;
  completedAt: string;
};

const knownPracticeIds = new Set([
  "frontend-basics",
  "financial-analysis",
  "agronomy-principles",
  "supply-chain",
  "customer-service",
  "cognitive-aptitude",
]);

function parseLocalResult(value: string | null, expectedTestId: string): PracticeResult | null {
  if (!value || !knownPracticeIds.has(expectedTestId)) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;

    const candidate = parsed as Record<string, unknown>;
    const total = candidate.total;
    const correct = candidate.correct;
    const completedAt = candidate.completedAt;

    if (
      candidate.version !== 1 ||
      candidate.testId !== expectedTestId ||
      typeof candidate.title !== "string" ||
      candidate.title.length === 0 ||
      candidate.title.length > 120 ||
      typeof total !== "number" ||
      !Number.isInteger(total) ||
      total < 1 ||
      total > 50 ||
      typeof correct !== "number" ||
      !Number.isInteger(correct) ||
      correct < 0 ||
      correct > total ||
      typeof completedAt !== "string" ||
      Number.isNaN(Date.parse(completedAt))
    ) {
      return null;
    }

    return {
      testId: expectedTestId,
      title: candidate.title,
      correct,
      total,
      completedAt,
    };
  } catch {
    return null;
  }
}

function scoreGuidance(score: number) {
  if (score >= 80) {
    return {
      label: "Des bases solides",
      message: "Tu maîtrises bien ce socle. Rejoue plus tard pour vérifier que les réflexes restent naturels, puis passe à un exercice voisin.",
      tone: "text-primary",
    };
  }
  if (score >= 60) {
    return {
      label: "Une bonne lancée",
      message: "Tu as déjà plusieurs bons réflexes. Revois les notions qui t’ont fait hésiter, puis retente l’exercice sans chercher à mémoriser les choix.",
      tone: "text-lagoon",
    };
  }
  return {
    label: "Un point de départ utile",
    message: "Ce résultat sert précisément à repérer ce qu’il faut travailler. Reprends les notions une par une et reviens quand tu te sens prêt·e.",
    tone: "text-terra",
  };
}

export default function AssessmentResultPage() {
  const params = useParams<{ testId: string }>();
  const rawTestId = Array.isArray(params.testId) ? params.testId[0] : params.testId;
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`yahnu:practice-result:${rawTestId}`);
      setResult(parseLocalResult(stored, rawTestId));
    } catch {
      setResult(null);
    } finally {
      setLoaded(true);
    }
  }, [rawTestId]);

  if (!loaded) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-10" aria-label="Chargement du bilan">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
        <div className="h-96 animate-pulse rounded-[1.75rem] bg-muted motion-reduce:animate-none" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-lagoon/10 text-lagoon">
          <BookOpen className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-semibold">Aucun bilan dans cet onglet</h1>
        <p className="mx-auto mt-3 max-w-md leading-6 text-muted-foreground">
          Termine d’abord l’exercice pour afficher ton retour. Les résultats d’entraînement sont temporaires et restent uniquement dans ton navigateur.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {knownPracticeIds.has(rawTestId) && (
            <Button asChild>
              <Link href={`/dashboard/assessment/${rawTestId}`}>Commencer cet exercice</Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/dashboard/assessments">Voir tous les exercices</Link>
          </Button>
        </div>
      </div>
    );
  }

  const score = Math.round((result.correct / result.total) * 100);
  const guidance = scoreGuidance(score);
  const completedLabel = new Intl.DateTimeFormat("fr-CI", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(result.completedAt));

  return (
    <main className="mx-auto max-w-3xl space-y-5 pb-10 pt-2 sm:pt-6">
      <div className="text-center">
        <Badge className="mb-4 border-primary/15 bg-primary/10 text-primary hover:bg-primary/10">
          <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Bilan d’entraînement
        </Badge>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Voilà où tu en es</h1>
        <p className="mt-2 text-muted-foreground">{result.title}</p>
      </div>

      <Card className="overflow-hidden border-lagoon/20">
        <div className="h-2 bg-gradient-to-r from-primary via-lagoon to-terra" aria-hidden="true" />
        <CardHeader className="text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </div>
          <CardTitle className={`mt-3 text-2xl ${guidance.tone}`}>{guidance.label}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-3xl bg-cocoa p-6 text-center text-ivory sm:p-8">
            <div className="font-display text-6xl font-semibold tracking-tight sm:text-7xl">{score}<span className="text-3xl text-ivory/65">%</span></div>
            <p className="mt-2 text-sm text-ivory/70">{result.correct} bonnes réponses sur {result.total}</p>
            <Progress value={score} className="mx-auto mt-5 max-w-md bg-white/15" aria-label={`Score d’entraînement : ${score} %`} />
          </div>

          <div className="flex gap-3 rounded-2xl border bg-muted/35 p-5">
            <Compass className="mt-0.5 h-5 w-5 shrink-0 text-lagoon" aria-hidden="true" />
            <div>
              <h2 className="font-display font-semibold">Ta prochaine étape</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{guidance.message}</p>
            </div>
          </div>

          <Alert className="border-lagoon/20 bg-lagoon/5">
            <LockKeyhole className="h-4 w-4 text-lagoon" aria-hidden="true" />
            <AlertTitle>Un repère personnel, rien de plus</AlertTitle>
            <AlertDescription className="leading-6">
              Ce score est calculé localement pour ton entraînement. Il n’est ni certifié ni vérifié, n’ajoute aucun badge au profil et n’est pas transmis aux recruteurs. Résultat affiché le {completedLabel}.
            </AlertDescription>
          </Alert>
        </CardContent>

        <CardFooter className="grid gap-3 border-t bg-muted/25 sm:grid-cols-2">
          <Button asChild size="lg">
            <Link href={`/dashboard/assessment/${result.testId}`}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Refaire l’exercice
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard/assessments">
              Choisir un autre thème
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </CardFooter>
      </Card>

      <p className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <EyeOff className="h-4 w-4" aria-hidden="true" />
        Aucun accès à la caméra ou au micro n’a été demandé.
      </p>
    </main>
  );
}
