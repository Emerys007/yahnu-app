import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { publicSkillsAttestation } from "@/lib/skills-checks-server";

export const metadata: Metadata = {
  title: "Vérifier une Yahnu skills attestation",
  description: "Vérification d’une attestation de compétences Yahnu partagée par son titulaire.",
  robots: { index: false, follow: false },
};

export default async function VerifySkillsAttestationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const attestation = await publicSkillsAttestation(code, "fr");
  if (!attestation) notFound();

  const active = attestation.status === "active";
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-ivory px-4 py-10 dark:bg-background sm:px-6">
      <div className="lagoon-grid absolute inset-0 opacity-35" aria-hidden="true" />
      <div className="absolute -right-24 top-0 size-80 rounded-full bg-terra/12 blur-3xl" aria-hidden="true" />
      <div className="absolute -left-24 bottom-0 size-80 rounded-full bg-primary/12 blur-3xl" aria-hidden="true" />

      <section className="surface-glass relative w-full max-w-3xl overflow-hidden rounded-[2rem] border shadow-lift" aria-labelledby="credential-title">
        <div className={`h-2 ${active ? "bg-gradient-to-r from-primary via-lagoon to-terra" : "bg-destructive"}`} aria-hidden="true" />
        <header className="border-b bg-background/70 px-5 py-5 sm:px-8">
          <Link href="/" className="inline-flex items-center gap-3 font-display font-semibold">
            <Logo className="size-9" />
            Yahnu
          </Link>
        </header>

        <div className="px-5 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge
                variant="outline"
                className={active
                  ? "border-primary/25 bg-primary/5 text-primary"
                  : "border-destructive/30 bg-destructive/5 text-destructive"}
              >
                {active
                  ? <CheckCircle2 className="mr-1.5 size-3.5" aria-hidden="true" />
                  : <XCircle className="mr-1.5 size-3.5" aria-hidden="true" />}
                {active ? "Vérification active" : "Attestation révoquée"}
              </Badge>
              <p className="section-kicker mt-5">Yahnu skills attestation</p>
              <h1 id="credential-title" className="mt-2 max-w-2xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
                {attestation.status === "active"
                  ? attestation.checkTitle
                  : "Attestation révoquée"}
              </h1>
            </div>
            <div className={`grid size-16 shrink-0 place-items-center rounded-3xl ${active ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
              {active
                ? <BadgeCheck className="size-8" aria-hidden="true" />
                : <XCircle className="size-8" aria-hidden="true" />}
            </div>
          </div>

          {attestation.status === "active" ? (
            <><div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border bg-background/80 p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Titulaire</p>
              <p className="mt-2 font-display text-xl font-semibold">{attestation.holderName}</p>
            </div>
            <div className="rounded-2xl border bg-background/80 p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Résultat</p>
              <p className="mt-2 font-display text-xl font-semibold">{attestation.score} %</p>
            </div>
            <div className="rounded-2xl border bg-background/80 p-5">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                Délivrée le
              </p>
              <p className="mt-2 font-display font-semibold">
                {new Intl.DateTimeFormat("fr-CI", { dateStyle: "long" }).format(new Date(attestation.issuedAt))}
              </p>
            </div>
            <div className="rounded-2xl border bg-background/80 p-5">
              <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                <LockKeyhole className="size-3.5" aria-hidden="true" />
                Code opaque
              </p>
              <p className="mt-2 break-all font-mono text-xs font-semibold">{attestation.verificationCode}</p>
            </div>
            </div>

            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
              <p className="flex items-center gap-2 font-display font-semibold">
                <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
                Conditions techniques vérifiées par Yahnu
              </p>
              <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground sm:grid-cols-2">
                <li className="flex gap-2"><Clock3 className="mt-1 size-3.5 shrink-0" aria-hidden="true" />{Math.ceil(attestation.durationSeconds / 60)} min, limite appliquée par le serveur</li>
                <li className="flex gap-2"><LockKeyhole className="mt-1 size-3.5 shrink-0" aria-hidden="true" />{attestation.questionCount} questions randomisées, version {attestation.checkVersion}</li>
              </ul>
            </div>
            </>
          ) : (
            <>
              <div className="mt-8 rounded-2xl border bg-background/80 p-5">
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  <LockKeyhole className="size-3.5" aria-hidden="true" />
                  Code opaque
                </p>
                <p className="mt-2 break-all font-mono text-xs font-semibold">
                  {attestation.verificationCode}
                </p>
              </div>
              <div className="mt-6 rounded-2xl border border-destructive/25 bg-destructive/5 p-5 text-sm leading-6">
                Cette attestation a été révoquée et ne doit plus être considérée comme active.
                {` Révocation enregistrée le ${new Intl.DateTimeFormat("fr-CI", {
                  dateStyle: "long",
                }).format(new Date(attestation.revokedAt))}.`}
                {" "}Les données personnelles et le résultat ne sont plus affichés.
              </div>
            </>
          )}

          <p className="mt-6 text-sm leading-6 text-muted-foreground">
            Cette page confirme un résultat à un Yahnu Skills Check dans les conditions indiquées.
            Il s’agit d’une attestation Yahnu, pas d’une certification accréditée, d’un diplôme
            ou d’une garantie d’embauche. Aucune caméra, aucun micro et aucun enregistrement d’écran
            ne sont utilisés.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/students">Découvrir Yahnu pour les diplômés</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Retour à l’accueil</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
