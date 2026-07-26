"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CalendarClock,
  Clock3,
  Loader2,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { useLocalization } from "@/context/localization-context";
import type { VerifiedMarketOpportunity } from "@/lib/ivory-coast-market";
import { marketOpportunityIsCurrent } from "@/lib/market-opportunity-public";

function formatDate(value: string, locale: "fr" | "en") {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CI" : "en-CI", {
    dateStyle: "long",
  }).format(new Date(`${value}T12:00:00Z`));
}

export function OpportunityDetail({
  opportunity,
}: {
  opportunity: VerifiedMarketOpportunity;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { language } = useLocalization();
  const locale = language === "en" ? "en" : "fr";
  const returnPath = `/opportunities/${opportunity.slug}`;
  const isCurrent = marketOpportunityIsCurrent(opportunity);

  useEffect(() => {
    if (isCurrent && !loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(returnPath)}`);
    }
  }, [isCurrent, loading, returnPath, router, user]);

  if (!isCurrent) {
    return (
      <section className="page-shell grid min-h-[58vh] place-items-center py-16">
        <Card className="w-full max-w-2xl border-terra/20 bg-terra/[0.04] text-center">
          <CardContent className="p-7 sm:p-10">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-terra/10 text-terra">
              <Clock3 className="h-7 w-7" aria-hidden="true" />
            </span>
            <h1 className="mt-6 font-headline text-3xl font-semibold">
              {locale === "fr" ? "Cette opportunité n’est plus affichée." : "This opportunity is no longer listed."}
            </h1>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
              {locale === "fr"
                ? "Sa période de vérification est terminée. Explorez les annonces encore actives dans la veille Yahnu."
                : "Its verification window has ended. Explore opportunities that are still active in Yahnu’s market watch."}
            </p>
            <Button asChild className="mt-6">
              <Link href="/jobs">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                {locale === "fr" ? "Voir les opportunités actives" : "View active opportunities"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (loading || !user) {
    return (
      <div className="grid min-h-[55vh] place-items-center" role="status" aria-live="polite">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">
            {locale === "fr" ? "Ouverture de votre accès sécurisé…" : "Opening secure access…"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="relative overflow-hidden border-b bg-ivory py-12 dark:bg-card sm:py-16">
        <div className="lagoon-grid absolute inset-0 opacity-35" aria-hidden="true" />
        <div className="page-shell relative">
          <Button asChild variant="ghost" className="-ml-3 mb-7">
            <Link href="/jobs">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
              {locale === "fr" ? "Retour aux opportunités" : "Back to opportunities"}
            </Link>
          </Button>
          <div className="max-w-4xl">
            <div className="flex flex-wrap gap-2">
              <Badge>{opportunity.contract[locale]}</Badge>
              <Badge variant="outline">
                {locale === "fr" ? "Source employeur vérifiée" : "Verified employer source"}
              </Badge>
            </div>
            <h1 className="display-title mt-5 text-4xl text-cocoa dark:text-foreground sm:text-6xl">
              {opportunity.title[locale]}
            </h1>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-base text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Building2 className="h-5 w-5 text-terra" aria-hidden="true" />
                {opportunity.company}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-5 w-5 text-lagoon" aria-hidden="true" />
                {opportunity.location[locale]}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell grid gap-8 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <article className="rounded-[1.75rem] border bg-card p-5 shadow-soft sm:p-8">
          <p className="section-kicker">{locale === "fr" ? "Aperçu Yahnu" : "Yahnu overview"}</p>
          <h2 className="mt-4 font-headline text-2xl font-semibold">
            {locale === "fr" ? "Ce qu’il faut retenir" : "What to know"}
          </h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            {opportunity.summary[locale]}
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {opportunity.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
          </div>
          <Card className="mt-8 border-primary/15 bg-primary/[0.045]">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold">
                    {locale === "fr" ? "Une source officielle, pas une promesse Yahnu" : "An official source, not a Yahnu guarantee"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {locale === "fr"
                      ? "Les critères complets, les conditions contractuelles et le formulaire de candidature restent ceux de l’employeur. Ne payez jamais pour candidater."
                      : "The employer’s page remains authoritative for full criteria, contract terms and the application form. Never pay to submit an application."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </article>

        <aside className="h-fit rounded-[1.75rem] border border-primary/15 bg-card p-5 shadow-soft sm:p-6 lg:sticky lg:top-24">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {locale === "fr" ? "Prochaine étape" : "Next step"}
          </p>
          <h2 className="mt-3 font-headline text-2xl font-semibold">
            {locale === "fr" ? "Lire l’annonce complète" : "Read the full listing"}
          </h2>
          <div className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
            <p className="flex items-start gap-2">
              <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {locale === "fr" ? "Vérifiée le" : "Verified"} {formatDate(opportunity.verifiedAt, locale)}
            </p>
            <p className="flex items-start gap-2">
              <CalendarClock className="mt-1 h-4 w-4 shrink-0 text-terra" aria-hidden="true" />
              {opportunity.deadlineAt
                ? `${locale === "fr" ? "Clôture annoncée le" : "Stated deadline"} ${formatDate(opportunity.deadlineAt, locale)}`
                : locale === "fr" ? "Échéance non communiquée" : "Deadline not provided"}
            </p>
          </div>
          <Button asChild size="lg" className="mt-6 h-auto min-h-12 w-full whitespace-normal py-3 text-center">
            <a href={opportunity.sourceUrl} target="_blank" rel="noopener noreferrer">
              {locale === "fr" ? "Voir et postuler sur le site officiel" : "View and apply on the official site"}
              <ArrowUpRight className="ml-2 h-4 w-4 shrink-0" aria-hidden="true" />
            </a>
          </Button>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            {locale === "fr"
              ? "La disponibilité peut évoluer après notre dernière vérification."
              : "Availability may change after our latest verification."}
          </p>
        </aside>
      </section>
    </div>
  );
}
