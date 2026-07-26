"use client";

import { useState } from "react";
import { ArrowUpRight, GraduationCap, MapPin, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalization } from "@/context/localization-context";
import { ivorianInstitutionReferences } from "@/lib/ivory-coast-market";

const copy = {
  fr: {
    eyebrow: "Repères de l’enseignement supérieur",
    title: "Des établissements ivoiriens à découvrir.",
    body: "Une sélection éditoriale non exhaustive pour aider les jeunes à explorer différents parcours, différentes villes et différents secteurs.",
    disclaimer:
      "Aucun classement ni partenariat implicite : chaque établissement est présenté à titre informatif, sans logo, à partir de son site officiel. Informations vérifiées le 25 juillet 2026.",
    public: "Établissement public",
    privateNonprofit: "Privé à but non lucratif",
    official: "Consulter le site officiel",
    showAll: "Voir les 11 établissements",
    showLess: "Réduire la sélection",
  },
  en: {
    eyebrow: "Higher-education landmarks",
    title: "Ivorian institutions to discover.",
    body: "A non-exhaustive editorial selection helping young people explore different paths, cities and sectors.",
    disclaimer:
      "No ranking or implied partnership: each institution is presented for information only, without a logo, using its official website. Information checked on 25 July 2026.",
    public: "Public institution",
    privateNonprofit: "Private nonprofit",
    official: "Visit official website",
    showAll: "View all 11 institutions",
    showLess: "Show fewer institutions",
  },
} as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function InstitutionReferences() {
  const { language } = useLocalization();
  const locale = language === "en" ? "en" : "fr";
  const text = copy[locale];
  const [expanded, setExpanded] = useState(false);
  const institutions = expanded
    ? ivorianInstitutionReferences
    : ivorianInstitutionReferences.slice(0, 6);

  return (
    <section className="border-b bg-muted/20 py-12 sm:py-16" aria-labelledby="institution-reference-title">
      <div className="page-shell">
        <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <div>
            <p className="section-kicker">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              {text.eyebrow}
            </p>
            <h2 id="institution-reference-title" className="display-title mt-4 max-w-3xl text-4xl sm:text-5xl">
              {text.title}
            </h2>
          </div>
          <div className="lg:justify-self-end">
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">{text.body}</p>
            <p className="mt-4 flex max-w-2xl items-start gap-2 rounded-2xl border border-primary/15 bg-card p-4 text-sm leading-6 text-muted-foreground">
              <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {text.disclaimer}
            </p>
          </div>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {institutions.map((institution) => (
            <Card key={institution.slug} className="group flex h-full flex-col border-border/70 shadow-soft transition hover:-translate-y-1 hover:border-primary/35 hover:shadow-lift motion-reduce:transform-none">
              <CardHeader className="space-y-5 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-sm font-extrabold text-primary" aria-hidden="true">
                    {initials(institution.name)}
                  </span>
                  <Badge variant="outline">
                    {institution.type === "public" ? text.public : text.privateNonprofit}
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-xl leading-snug">{institution.name}</CardTitle>
                  <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-terra" aria-hidden="true" />
                    {institution.city}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="mt-auto px-5 pb-5 sm:px-6 sm:pb-6">
                <p className="text-sm leading-6 text-muted-foreground">{institution.focus[locale]}</p>
                <Button asChild variant="outline" className="mt-5 h-auto min-h-11 w-full whitespace-normal py-2.5 text-center">
                  <a href={institution.officialUrl} target="_blank" rel="noopener noreferrer">
                    {text.official}
                    <ArrowUpRight className="ml-2 h-4 w-4 shrink-0 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-7 flex justify-center">
          <Button type="button" variant="outline" onClick={() => setExpanded((value) => !value)}>
            {expanded ? text.showLess : text.showAll}
          </Button>
        </div>
      </div>
    </section>
  );
}
