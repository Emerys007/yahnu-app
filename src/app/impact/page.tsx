"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  DatabaseZap,
  LineChart,
  ShieldCheck,
  Target,
} from "lucide-react";

import { Footer } from "@/components/landing/footer";
import { MainNav } from "@/components/landing/main-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalization } from "@/context/localization-context";
import { apiFetch } from "@/lib/api-client";
import {
  defaultImpactPageContent,
  impactTargetDisclaimer,
  type ImpactPageContent,
} from "@/lib/impact-content";

type PageResponse = {
  data: {
    page: {
      data: ImpactPageContent;
    } | null;
  };
};

export default function ImpactPage() {
  const { language } = useLocalization();
  const locale = language === "en" ? "en" : "fr";
  const [managedContent, setManagedContent] = useState<ImpactPageContent | null>(null);
  const content = (managedContent ?? defaultImpactPageContent)[locale];

  useEffect(() => {
    const controller = new AbortController();
    apiFetch<PageResponse>("/api/pages/impact", { signal: controller.signal })
      .then((response) => {
        if (response.data.page?.data) setManagedContent(response.data.page.data);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error("Unable to load managed impact content.", error);
        }
      });
    return () => controller.abort();
  }, []);

  const labels = locale === "fr"
    ? {
        eyebrow: "Impact & redevabilité",
        targets: "Cibles du pilote",
        method: "Méthode de mesure",
        signals: ["Suivre les étapes utiles", "Croiser les retours", "Publier les apprentissages"],
        signalsBody: [
          "Du profil activé au résultat déclaré, sans confondre activité et impact.",
          "Jeunes, écoles et employeurs contribuent à une lecture plus juste du parcours.",
          "Les résultats, limites et décisions du pilote sont partagés à fréquence définie.",
        ],
        cadence: "Rythme de publication",
        status: "Où en sommes-nous ?",
        ctaTitle: "Un indicateur n’a de valeur que s’il conduit à une décision.",
        ctaBody: "Rejoignez la phase pilote pour co-définir les résultats attendus et la manière de les mesurer.",
        cta: "Construire le pilote avec Yahnu",
      }
    : {
        eyebrow: "Impact & accountability",
        targets: "Pilot targets",
        method: "Measurement approach",
        signals: ["Follow useful stages", "Combine perspectives", "Publish learning"],
        signalsBody: [
          "From profile activation to declared outcome, without confusing activity with impact.",
          "Graduates, institutions and employers contribute to a fairer view of each journey.",
          "Pilot results, limits and decisions are shared on a defined cadence.",
        ],
        cadence: "Reporting cadence",
        status: "Where are we now?",
        ctaTitle: "An indicator matters only when it informs a decision.",
        ctaBody: "Join the pilot to co-define expected outcomes and how they should be measured.",
        cta: "Build the pilot with Yahnu",
      };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-ivory py-16 dark:bg-background sm:py-24">
          <div className="lagoon-grid absolute inset-0 opacity-35" aria-hidden="true" />
          <div className="page-shell relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <p className="section-kicker"><BarChart3 className="h-4 w-4" aria-hidden="true" />{labels.eyebrow}</p>
              <h1 className="display-title mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">{content.heroTitle}</h1>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">{content.heroSubtitle}</p>
          </div>
        </section>

        <section className="page-shell py-14 sm:py-20" aria-labelledby="pilot-targets-title">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker"><Target className="h-4 w-4" aria-hidden="true" />{labels.targets}</p>
              <h2 id="pilot-targets-title" className="mt-4 font-headline text-3xl font-semibold sm:text-4xl">
                {impactTargetDisclaimer[locale]}
              </h2>
            </div>
            <Badge variant="outline" className="w-fit border-terra/25 bg-terra/[0.07] text-terra">
              Pilote 2026
            </Badge>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {content.metrics.map((metric, index) => (
              <Card key={`${metric.label}-${index}`} className="relative overflow-hidden border-border/70">
                <span className={`absolute inset-x-0 top-0 h-1 ${index % 2 ? "bg-terra" : "bg-primary"}`} aria-hidden="true" />
                <CardContent className="p-5 sm:p-6">
                  <p className="font-headline text-4xl font-semibold tracking-[-0.04em]">{metric.value}</p>
                  <h3 className="mt-3 font-semibold">{metric.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{metric.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-y bg-muted/25 py-16 sm:py-24">
          <div className="page-shell grid gap-12 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <p className="section-kicker"><DatabaseZap className="h-4 w-4" aria-hidden="true" />{labels.method}</p>
              <h2 className="display-title mt-5 text-4xl sm:text-5xl">{content.methodologyTitle}</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">{content.methodologyBody}</p>
            </div>
            <ol className="space-y-3">
              {labels.signals.map((signal, index) => (
                <li key={signal} className="rounded-2xl border bg-card p-5 shadow-soft sm:p-6">
                  <div className="flex items-start gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">0{index + 1}</span>
                    <div>
                      <h3 className="font-headline text-xl font-semibold">{signal}</h3>
                      <p className="mt-2 leading-7 text-muted-foreground">{labels.signalsBody[index]}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="page-shell grid gap-5 py-16 sm:py-20 lg:grid-cols-2">
          <Card className="border-primary/20 bg-primary/[0.045]">
            <CardContent className="p-6 sm:p-8">
              <CalendarRange className="h-7 w-7 text-primary" aria-hidden="true" />
              <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-primary">{labels.cadence}</p>
              <p className="mt-3 text-lg leading-8 text-muted-foreground">{content.reportingCadence}</p>
            </CardContent>
          </Card>
          <Card className="border-terra/20 bg-terra/[0.045]">
            <CardContent className="p-6 sm:p-8">
              <LineChart className="h-7 w-7 text-terra" aria-hidden="true" />
              <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-terra">{labels.status}</p>
              <p className="mt-3 text-lg leading-8 text-muted-foreground">{content.currentStatus}</p>
            </CardContent>
          </Card>
        </section>

        <section className="px-4 pb-20 sm:pb-28">
          <div className="page-shell ci-pattern rounded-[2rem] bg-primary p-7 text-primary-foreground shadow-lift sm:p-12 lg:flex lg:items-end lg:justify-between lg:gap-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary-foreground/75">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                BE THE CHANGE
              </div>
              <h2 className="mt-4 font-headline text-4xl font-semibold leading-tight sm:text-5xl">{labels.ctaTitle}</h2>
              <p className="mt-4 text-lg leading-8 text-primary-foreground/75">{labels.ctaBody}</p>
            </div>
            <Button asChild variant="terra" size="lg" className="mt-8 h-auto min-h-12 whitespace-normal py-3 lg:mt-0">
              <Link href="/contact?intent=pilot&source=impact">{labels.cta}<ArrowRight className="ml-2 h-4 w-4 shrink-0" aria-hidden="true" /></Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
