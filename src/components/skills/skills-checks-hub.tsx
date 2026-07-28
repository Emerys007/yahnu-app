"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Clock3,
  Copy,
  Headphones,
  Loader2,
  LockKeyhole,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-client";
import type { SkillsAttestationSummary, SkillsCheckSummary } from "@/lib/skills-checks";

type ChecksResponse = { data: { checks: SkillsCheckSummary[] } };
type AttestationResponse = { data: { attestation: SkillsAttestationSummary } };

const areaPresentation = {
  customer_experience: {
    label: "Expérience client",
    Icon: Headphones,
    className: "bg-terra/15 text-terra",
  },
  data: {
    label: "Données",
    Icon: BarChart3,
    className: "bg-lagoon/15 text-lagoon",
  },
  operations: {
    label: "Opérations",
    Icon: PackageCheck,
    className: "bg-primary/12 text-primary",
  },
} as const;

function areaFor(skillArea: string) {
  return areaPresentation[skillArea as keyof typeof areaPresentation] ?? {
    label: "Compétence",
    Icon: BadgeCheck,
    className: "bg-primary/12 text-primary",
  };
}

function AttestationControls({
  attestation,
  onUpdated,
}: {
  attestation: SkillsAttestationSummary;
  onUpdated: (attestation: SkillsAttestationSummary) => void;
}) {
  const { toast } = useToast();
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  const update = async (action: "publish" | "hide" | "revoke") => {
    setSaving(true);
    try {
      const response = await apiFetch<AttestationResponse>(
        `/api/skills/attestations/${attestation.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            action,
            ...(action === "publish" ? { consent } : {}),
          }),
        },
      );
      onUpdated(response.data.attestation);
      toast({
        title: action === "publish"
          ? "Lien de vérification activé"
          : action === "hide"
            ? "Lien masqué"
            : "Attestation révoquée",
        description: action === "revoke"
          ? "Cette action est définitive. Le lien public indique désormais que l’attestation est révoquée."
          : "Votre préférence de visibilité a été enregistrée.",
      });
    } catch (error) {
      toast({
        title: "Modification impossible",
        description: error instanceof Error ? error.message : "Réessayez dans un instant.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/verify/skills/${attestation.verificationCode}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Lien copié", description: "Vous pouvez le partager avec un recruteur." });
    } catch {
      toast({
        title: "Copie non autorisée",
        description: "Ouvrez le lien puis copiez son adresse depuis votre navigateur.",
        variant: "destructive",
      });
    }
  };

  if (attestation.revokedAt) {
    return (
      <Badge variant="outline" className="border-destructive/30 text-destructive">
        Révoquée
      </Badge>
    );
  }

  const publishBlocked = !["clear", "reviewed_clear"].includes(attestation.reviewStatus);

  return (
    <div className="flex flex-wrap gap-2">
      {attestation.isPublic ? (
        <>
          <Button type="button" size="sm" variant="outline" onClick={() => void copyLink()}>
            <Copy className="size-3.5" aria-hidden="true" />
            Copier le lien
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={saving}
            onClick={() => void update("hide")}
          >
            Masquer
          </Button>
        </>
      ) : publishBlocked ? (
        <Badge variant="outline" className="border-terra/30 text-terra">
          {attestation.reviewStatus === "review_expired"
            ? "Revue expirée · nouvelle tentative requise"
            : "Lien public suspendu pendant la revue"}
        </Badge>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" size="sm" disabled={saving}>
              Rendre vérifiable
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Activer un lien public de vérification ?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 leading-6">
                <span className="block">
                  Le lien affichera votre nom, le nom du Skills Check, votre score, sa date
                  et ses conditions techniques (version, durée, nombre de questions), ainsi
                  que son code opaque. Vous pourrez le masquer à tout moment.
                </span>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border bg-muted/30 p-4 text-left text-foreground">
                  <Checkbox
                    className="mt-0.5"
                    checked={consent}
                    onCheckedChange={(checked) => setConsent(checked === true)}
                  />
                  <span className="text-sm leading-5">
                    J’accepte que ces informations soient accessibles aux personnes qui possèdent ce lien.
                  </span>
                </label>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                disabled={!consent || saving}
                onClick={() => void update("publish")}
              >
                {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                Confirmer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" size="sm" variant="ghost" className="text-destructive" disabled={saving}>
            Révoquer
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer cette Yahnu skills attestation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. Un lien déjà publié restera consultable uniquement
              pour signaler que l’attestation n’est plus active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Conserver</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void update("revoke")}
            >
              Révoquer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function SkillsChecksHub() {
  const reduceMotion = useReducedMotion();
  const [checks, setChecks] = useState<SkillsCheckSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch<ChecksResponse>("/api/skills/checks?locale=fr");
      setChecks(response.data.checks);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Les Skills Checks ne sont pas disponibles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activeAttestations = useMemo(
    () => checks.filter((check) => check.attestation && !check.attestation.revokedAt).length,
    [checks],
  );

  const updateAttestation = (checkId: string, attestation: SkillsAttestationSummary) => {
    setChecks((current) => current.map((check) =>
      check.id === checkId ? { ...check, attestation } : check,
    ));
  };

  if (loading) {
    return (
      <div className="grid min-h-[22rem] place-items-center" role="status">
        <div className="text-center">
          <Loader2 className="mx-auto size-8 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">Préparation de votre espace de compétences…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-xl border-destructive/25">
        <CardHeader>
          <CardTitle>Impossible de charger les Skills Checks</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => void load()}>
            <RotateCcw className="size-4" aria-hidden="true" />
            Réessayer
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="ci-pattern relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-cocoa via-cocoa to-primary/90 px-5 py-8 text-ivory shadow-lift sm:px-8 lg:px-10"
      >
        <div className="absolute -right-20 -top-24 size-72 rounded-full bg-terra/25 blur-3xl" aria-hidden="true" />
        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div className="max-w-3xl">
            <Badge className="mb-4 border-white/15 bg-white/10 text-ivory hover:bg-white/10">
              <Sparkles className="mr-1.5 size-3.5" aria-hidden="true" />
              Yahnu Skills Check — verified conditions
            </Badge>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Faites parler vos compétences, au-delà du diplôme.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ivory/75">
              Des mises en situation ancrées en Côte d’Ivoire, chronométrées par le serveur,
              randomisées et notées sans exposer les réponses au navigateur.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <strong className="block font-display text-2xl">{checks.length}</strong>
              <span className="text-xs text-ivory/65">Skills Checks disponibles</span>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
              <strong className="block font-display text-2xl">{activeAttestations}</strong>
              <span className="text-xs text-ivory/65">attestations actives</span>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Conditions de vérification">
        {[
          [LockKeyhole, "Clés protégées", "Les réponses correctes restent exclusivement côté serveur."],
          [Clock3, "Temps serveur", "La limite est appliquée par Yahnu, même si l’onglet est fermé."],
          [ShieldCheck, "Vie privée respectée", "Ni caméra, ni micro, ni enregistrement d’écran."],
        ].map(([Icon, title, body]) => {
          const ItemIcon = Icon as typeof LockKeyhole;
          return (
            <div key={String(title)} className="rounded-2xl border bg-card/80 p-4 shadow-soft">
              <ItemIcon className="size-5 text-primary" aria-hidden="true" />
              <p className="mt-3 font-display font-semibold">{String(title)}</p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{String(body)}</p>
            </div>
          );
        })}
      </section>

      <section aria-labelledby="skills-check-list">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Choisissez une compétence</p>
            <h2 id="skills-check-list" className="font-display text-2xl font-semibold sm:text-3xl">
              Checks disponibles
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            3 tentatives sur 30 jours · 24 h entre deux tentatives
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {checks.map((check, index) => {
            const area = areaFor(check.skillArea);
            const AreaIcon = area.Icon;
            const availableAt = check.nextAvailableAt ? new Date(check.nextAvailableAt) : null;
            const coolingDown = availableAt && availableAt.getTime() > Date.now();
            return (
              <motion.div
                key={check.id}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : index * 0.05 }}
                className="h-full"
              >
                <Card className="group flex h-full flex-col overflow-hidden border-border/80 transition duration-300 hover:-translate-y-1 hover:shadow-lift motion-reduce:hover:translate-y-0">
                  <CardHeader>
                    <div className="mb-4 flex items-center justify-between">
                      <span className={`grid size-12 place-items-center rounded-2xl ${area.className}`}>
                        <AreaIcon className="size-5" aria-hidden="true" />
                      </span>
                      <Badge variant="outline">{area.label}</Badge>
                    </div>
                    <CardTitle className="text-xl leading-tight">{check.title}</CardTitle>
                    <CardDescription className="leading-6">{check.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-4">
                    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-muted/45 p-3 text-center text-xs">
                      <div>
                        <strong className="block text-sm text-foreground">{Math.ceil(check.durationSeconds / 60)} min</strong>
                        temps
                      </div>
                      <div>
                        <strong className="block text-sm text-foreground">{check.questionsPerAttempt}</strong>
                        questions
                      </div>
                      <div>
                        <strong className="block text-sm text-foreground">{check.passingScore} %</strong>
                        seuil
                      </div>
                    </div>
                    {check.latestScore !== undefined ? (
                      <p className="text-sm">
                        Dernier résultat : <strong>{check.latestScore} %</strong>
                        {check.latestPassed ? " · seuil atteint" : " · à retravailler"}
                      </p>
                    ) : null}
                    {check.attestation ? (
                      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                        <p className="mb-3 flex items-center gap-2 font-display text-sm font-semibold">
                          <BadgeCheck className="size-4 text-primary" aria-hidden="true" />
                          Yahnu skills attestation · {check.attestation.score} %
                        </p>
                        <AttestationControls
                          attestation={check.attestation}
                          onUpdated={(attestation) => updateAttestation(check.id, attestation)}
                        />
                      </div>
                    ) : null}
                  </CardContent>
                  <CardFooter className="mt-1">
                    {check.activeAttemptId ? (
                      <Button asChild className="w-full justify-between">
                        <Link href={`/dashboard/skills-checks/attempt/${check.activeAttemptId}`}>
                          Reprendre la tentative
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        asChild={!coolingDown && check.attemptsUsed30Days < check.maxAttempts30Days}
                        disabled={Boolean(coolingDown) || check.attemptsUsed30Days >= check.maxAttempts30Days}
                        className="w-full justify-between"
                      >
                        {!coolingDown && check.attemptsUsed30Days < check.maxAttempts30Days ? (
                          <Link href={`/dashboard/skills-checks/${check.id}`}>
                            Voir les conditions
                            <ArrowRight className="size-4" aria-hidden="true" />
                          </Link>
                        ) : (
                          <span>
                            {coolingDown
                              ? `Disponible ${new Intl.DateTimeFormat("fr-CI", {
                                dateStyle: "short",
                                timeStyle: "short",
                              }).format(availableAt)}`
                              : "Limite de 30 jours atteinte"}
                          </span>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </section>

      <div className="rounded-2xl border border-lagoon/20 bg-lagoon/5 p-5 text-sm leading-6">
        <p className="font-display font-semibold">Une attestation Yahnu, pas un diplôme</p>
        <p className="mt-1 text-muted-foreground">
          Une “Yahnu skills attestation” décrit un résultat obtenu dans les conditions techniques
          indiquées. Ce n’est ni une certification accréditée, ni une garantie d’embauche.
          Les changements de visibilité sont sous votre contrôle.
        </p>
      </div>
    </div>
  );
}
