"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  Clock3,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/auth-context";
import { useLocalization } from "@/context/localization-context";
import { apiFetch } from "@/lib/api-client";
import type { PublicMarketOpportunity } from "@/lib/ivory-coast-market";
import { marketOpportunityIsCurrent } from "@/lib/market-opportunity-public";

type Locale = "fr" | "en";

const copy = {
  fr: {
    eyebrow: "Veille emploi · sources employeurs",
    title: "Des opportunités réelles, repérées en Côte d’Ivoire.",
    body: "Cette sélection complète les offres publiées directement sur Yahnu. Chaque annonce renvoie vers la source officielle après connexion.",
    verified: "Vérifiée le",
    deadline: "Clôture le",
    noDeadline: "Échéance non communiquée",
    learnMore: "En savoir plus",
    signUp: "Créer mon profil",
    disclaimer:
      "Yahnu relaie des opportunités vérifiées auprès de leurs sources officielles. Les conditions et disponibilités peuvent évoluer. Yahnu ne demande jamais de paiement pour candidater.",
    emptyTitle: "La prochaine veille est en préparation.",
    emptyBody:
      "Les annonces sans échéance disparaissent automatiquement après quatorze jours si elles ne sont pas vérifiées à nouveau.",
  },
  en: {
    eyebrow: "Job watch · employer sources",
    title: "Real opportunities sourced in Côte d’Ivoire.",
    body: "This selection complements roles posted directly on Yahnu. Each listing opens its official source after sign-in.",
    verified: "Verified",
    deadline: "Closes",
    noDeadline: "Deadline not provided",
    learnMore: "Learn more",
    signUp: "Create my profile",
    disclaimer:
      "Yahnu shares opportunities checked against official sources. Conditions and availability can change. Yahnu never asks candidates to pay to apply.",
    emptyTitle: "The next market watch is being prepared.",
    emptyBody:
      "Listings without a deadline disappear automatically after fourteen days unless they are verified again.",
  },
} as const;

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CI" : "en-CI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`));
}

function OpportunityCard({
  opportunity,
  locale,
}: {
  opportunity: PublicMarketOpportunity;
  locale: Locale;
}) {
  const { user, loading } = useAuth();
  const text = copy[locale];
  const detailPath = `/opportunities/${opportunity.slug}`;
  const detailHref =
    !loading && user
      ? detailPath
      : `/login?next=${encodeURIComponent(detailPath)}`;

  return (
    <Card className="group flex h-full flex-col overflow-hidden border-border/70 shadow-soft transition hover:-translate-y-1 hover:border-primary/35 hover:shadow-lift motion-reduce:transform-none">
      <div className="h-1.5 bg-gradient-to-r from-terra via-soleil to-primary" aria-hidden="true" />
      <CardHeader className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
          </span>
          <Badge variant="outline" className="border-primary/20 bg-primary/[0.06] text-primary">
            {opportunity.contract[locale]}
          </Badge>
        </div>
        <div>
          <p className="text-sm font-bold text-terra">{opportunity.company}</p>
          <CardTitle className="mt-2 text-xl leading-snug">{opportunity.title[locale]}</CardTitle>
          <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
            <MapPin className="mt-1 h-4 w-4 shrink-0 text-lagoon" aria-hidden="true" />
            {opportunity.location[locale]}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-5 pb-5 sm:px-6">
        <p className="text-sm leading-6 text-muted-foreground">{opportunity.summary[locale]}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {opportunity.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
        <div className="mt-5 space-y-2 border-t pt-4 text-xs leading-5 text-muted-foreground">
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {text.verified} {formatDate(opportunity.verifiedAt, locale)}
          </p>
          <p className="flex items-center gap-2">
            {opportunity.deadlineAt ? (
              <CalendarClock className="h-3.5 w-3.5 text-terra" aria-hidden="true" />
            ) : (
              <Clock3 className="h-3.5 w-3.5 text-terra" aria-hidden="true" />
            )}
            {opportunity.deadlineAt
              ? `${text.deadline} ${formatDate(opportunity.deadlineAt, locale)}`
              : text.noDeadline}
          </p>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/15 p-5 sm:px-6">
        <Button asChild className="w-full">
          <Link href={detailHref}>
            {text.learnMore}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function VerifiedOpportunities({ compact = false }: { compact?: boolean }) {
  const { language } = useLocalization();
  const locale: Locale = language === "en" ? "en" : "fr";
  const text = copy[locale];
  const [catalog, setCatalog] = useState<PublicMarketOpportunity[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const current = catalog.filter((opportunity) => marketOpportunityIsCurrent(opportunity));
  const opportunities = compact ? current.slice(0, 3) : current;

  useEffect(() => {
    const controller = new AbortController();
    apiFetch<{
      data: {
        opportunities: PublicMarketOpportunity[];
      };
    }>("/api/market-opportunities", { signal: controller.signal })
      .then((response) => setCatalog(response.data.opportunities))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error("Unable to load the verified opportunity catalog.", error);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingCatalog(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <section
      className={compact ? "bg-muted/25 py-20 sm:py-24" : "border-b bg-ivory/60 py-12 dark:bg-card/35 sm:py-16"}
      aria-labelledby={compact ? "market-opportunities-home-title" : "market-opportunities-title"}
    >
      <div className="page-shell">
        <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
          <div>
            <p className="section-kicker">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              {text.eyebrow}
            </p>
            <h2
              id={compact ? "market-opportunities-home-title" : "market-opportunities-title"}
              className="display-title mt-4 max-w-3xl text-4xl sm:text-5xl"
            >
              {text.title}
            </h2>
          </div>
          <div className="lg:justify-self-end">
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">{text.body}</p>
            <p className="mt-4 max-w-2xl rounded-2xl border border-primary/15 bg-primary/[0.055] p-4 text-sm leading-6 text-muted-foreground">
              {text.disclaimer}
            </p>
          </div>
        </div>

        {loadingCatalog ? (
          <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label={locale === "fr" ? "Chargement des opportunités" : "Loading opportunities"}>
            {Array.from({ length: compact ? 3 : 6 }, (_, index) => (
              <Card key={index} className="overflow-hidden border-border/70">
                <div className="h-1.5 bg-muted" />
                <CardContent className="space-y-4 p-5 sm:p-6">
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-11 w-11 rounded-2xl" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-4/5" />
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : opportunities.length ? (
          <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.slug} opportunity={opportunity} locale={locale} />
            ))}
          </div>
        ) : (
          <Card className="mt-9 border-primary/15">
            <CardContent className="px-5 py-12 text-center sm:p-14">
              <Clock3 className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
              <h3 className="mt-4 font-headline text-2xl font-semibold">{text.emptyTitle}</h3>
              <p className="mx-auto mt-2 max-w-2xl leading-7 text-muted-foreground">{text.emptyBody}</p>
              <Button asChild className="mt-6">
                <Link href="/signup?role=graduate">{text.signUp}</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
