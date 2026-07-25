"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, MapPin, RefreshCw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Job } from "@/lib/careers";
import { useLocalization } from "@/context/localization-context";

type JobsResponse = { data?: { jobs?: Job[] } };

const employmentLabels: Record<string, { fr: string; en: string }> = {
  full_time: { fr: "Temps plein", en: "Full time" },
  part_time: { fr: "Temps partiel", en: "Part time" },
  contract: { fr: "Contrat", en: "Contract" },
  internship: { fr: "Stage", en: "Internship" },
  temporary: { fr: "Mission temporaire", en: "Temporary" },
  volunteer: { fr: "Bénévolat", en: "Volunteer" },
  other: { fr: "Autre", en: "Other" },
};

const copy = {
  fr: {
    eyebrow: "Opportunités publiées sur Yahnu",
    title: "Des prochaines étapes bien réelles.",
    body: "Retrouve les offres actuellement ouvertes par les employeurs de la communauté. Les nouvelles publications apparaissent ici automatiquement.",
    action: "Voir toutes les offres",
    emptyTitle: "Les prochaines offres arrivent bientôt.",
    emptyBody: "Crée ton profil pendant que les employeurs préparent leurs premières publications.",
    emptyAction: "Préparer mon profil",
    errorTitle: "Impossible de charger les offres pour le moment.",
    retry: "Réessayer",
    location: "Côte d’Ivoire",
    view: "Voir l’offre",
  },
  en: {
    eyebrow: "Opportunities published on Yahnu",
    title: "Real next steps, ready when you are.",
    body: "Explore roles currently open across the community. New employer listings appear here automatically.",
    action: "View every opportunity",
    emptyTitle: "New opportunities are on their way.",
    emptyBody: "Build your profile while Ivorian employers prepare their first listings.",
    emptyAction: "Build my profile",
    errorTitle: "Opportunities cannot be loaded right now.",
    retry: "Try again",
    location: "Côte d’Ivoire",
    view: "View opportunity",
  },
} as const;

export function FeaturedOpportunities() {
  const { language } = useLocalization();
  const locale = language === "fr" ? "fr" : "en";
  const content = copy[locale];
  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [reload, setReload] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    fetch("/api/jobs?scope=public&limit=3", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("jobs_request_failed");
        return response.json() as Promise<JobsResponse>;
      })
      .then((payload) => {
        setJobs(payload.data?.jobs ?? []);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, [reload]);

  return (
    <section className="bg-background py-20 sm:py-28" aria-labelledby="opportunities-title">
      <div className="container mx-auto">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <div>
            <p className="section-kicker">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {content.eyebrow}
            </p>
            <h2 id="opportunities-title" className="display-title mt-4 max-w-xl text-4xl sm:text-5xl">{content.title}</h2>
            <p className="mt-4 max-w-lg text-lg leading-8 text-muted-foreground">{content.body}</p>
            <Button variant="outline" className="mt-7" asChild>
              <Link href="/jobs">
                {content.action}
                <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {status === "loading" ? (
            <div className="grid gap-3 sm:grid-cols-3" aria-busy="true" aria-label={content.eyebrow}>
              {[0, 1, 2].map((item) => (
                <div key={item} className="min-h-64 animate-pulse rounded-[1.5rem] border bg-muted/50" />
              ))}
            </div>
          ) : status === "error" ? (
            <div className="rounded-[1.5rem] border border-destructive/20 bg-destructive/5 p-8">
              <p className="font-display text-2xl font-semibold">{content.errorTitle}</p>
              <Button variant="outline" className="mt-5" onClick={() => setReload((value) => value + 1)}>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                {content.retry}
              </Button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="ci-pattern rounded-[1.5rem] border border-primary/15 bg-primary/5 p-8 sm:p-10">
              <BriefcaseBusiness className="h-9 w-9 text-primary" aria-hidden="true" />
              <p className="mt-5 font-display text-2xl font-semibold">{content.emptyTitle}</p>
              <p className="mt-2 max-w-xl text-muted-foreground">{content.emptyBody}</p>
              <Button className="mt-6" asChild><Link href="/signup?role=graduate">{content.emptyAction}</Link></Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {jobs.map((job, index) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="group flex min-h-64 flex-col rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 font-display text-sm font-bold text-primary">0{index + 1}</span>
                    {job.employmentType ? (
                      <Badge variant="secondary">{employmentLabels[job.employmentType]?.[locale] ?? job.employmentType}</Badge>
                    ) : null}
                  </div>
                  <h3 className="mt-6 font-display text-xl font-semibold leading-6 transition group-hover:text-primary">{job.title}</h3>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">{job.companyName}</p>
                  <div className="mt-auto flex items-end justify-between gap-3 pt-8 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {job.location || content.location}
                    </span>
                    <span className="sr-only">{content.view}</span>
                    <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
