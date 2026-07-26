"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Landmark,
  School,
  Target,
  Waypoints,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLocalization } from "@/context/localization-context";

const copy = {
  fr: {
    eyebrow: "Le constat et la réponse",
    title: "Le diplôme existe. La transition vers l’emploi reste trop souvent invisible.",
    beforeLabel: "Avant",
    withLabel: "Avec Yahnu",
    problem:
      "Le jeune cherche seul, l’établissement perd le fil après la diplomation, l’entreprise manque de contexte et les programmes d’insertion mesurent davantage l’activité que le résultat.",
    response:
      "Yahnu crée un parcours commun : rendre les compétences lisibles, connecter les bons acteurs, suivre les prochaines étapes et publier ce qui change réellement.",
    actorsTitle: "Quatre acteurs. Une responsabilité partagée.",
    actors: [
      ["Jeunes", "Rendre leur potentiel visible et rester acteurs du parcours.", "/students", GraduationCap],
      ["Établissements", "Accompagner leurs diplômés et apprendre des retours du marché.", "/schools", School],
      ["Entreprises", "Exprimer des besoins clairs et respecter chaque candidature.", "/companies", Building2],
      ["Institutions", "Relier les acteurs et exiger un impact mesurable.", "/institutions", Landmark],
    ],
    pilot: "Cibles du pilote, méthode et rythme de publication",
    manifesto: "Lire le manifeste",
  },
  en: {
    eyebrow: "The problem and the response",
    title: "The degree exists. The transition into work is still too often invisible.",
    beforeLabel: "Before",
    withLabel: "With Yahnu",
    problem:
      "Graduates search alone, institutions lose sight after graduation, employers lack context and employability programmes measure activity more often than outcomes.",
    response:
      "Yahnu creates one shared journey: make skills visible, connect the right actors, follow useful next steps and publish what genuinely changes.",
    actorsTitle: "Four actors. One shared responsibility.",
    actors: [
      ["Graduates", "Make potential visible and remain active throughout the journey.", "/students", GraduationCap],
      ["Education providers", "Support alumni and learn from market feedback.", "/schools", School],
      ["Employers", "Set clear expectations and respect every application.", "/companies", Building2],
      ["Institutions", "Connect actors and require measurable impact.", "/institutions", Landmark],
    ],
    pilot: "Pilot targets, method and reporting cadence",
    manifesto: "Read the manifesto",
  },
} as const;

export function PilotStorySection() {
  const { language } = useLocalization();
  const text = copy[language === "en" ? "en" : "fr"];

  return (
    <section className="relative overflow-hidden border-y bg-background py-16 sm:py-24" aria-labelledby="pilot-story-title">
      <div className="absolute -right-24 top-8 h-72 w-72 rounded-full bg-lagoon/10 blur-3xl" aria-hidden="true" />
      <div className="page-shell relative">
        <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
          <div>
            <p className="section-kicker">
              <Waypoints className="h-4 w-4" aria-hidden="true" />
              {text.eyebrow}
            </p>
            <h2 id="pilot-story-title" className="display-title mt-5 max-w-3xl text-4xl sm:text-6xl">
              {text.title}
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-terra/20 bg-terra/[0.045] p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-terra">{text.beforeLabel}</p>
              <p className="mt-3 leading-7 text-muted-foreground">{text.problem}</p>
            </div>
            <div className="rounded-[1.5rem] border border-primary/20 bg-primary/[0.045] p-5 sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{text.withLabel}</p>
              <p className="mt-3 leading-7 text-muted-foreground">{text.response}</p>
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-[2rem] bg-[hsl(165_48%_10%)] p-5 text-white shadow-lift sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <h3 className="max-w-3xl font-headline text-3xl font-semibold leading-tight sm:text-4xl">{text.actorsTitle}</h3>
            <Button asChild variant="terra">
              <Link href="/be-the-change">
                {text.manifesto}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid overflow-hidden rounded-[1.5rem] border border-white/10 sm:grid-cols-2 xl:grid-cols-4">
            {text.actors.map(([title, body, href, Icon], index) => {
              const ActorIcon = Icon as typeof GraduationCap;
              return (
                <Link
                  key={href as string}
                  href={href as string}
                  className={`group min-h-56 p-5 transition hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-terra sm:p-6 ${
                    index > 0 ? "border-t border-white/10 sm:border-l sm:border-t-0 sm:[&:nth-child(3)]:border-l-0 sm:[&:nth-child(3)]:border-t xl:[&:nth-child(3)]:border-l xl:[&:nth-child(3)]:border-t-0" : ""
                  }`}
                >
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-terra">
                    <ActorIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h4 className="mt-10 font-headline text-2xl font-semibold">{title as string}</h4>
                  <p className="mt-3 text-sm leading-6 text-white/65">{body as string}</p>
                  <ArrowRight className="mt-6 h-4 w-4 text-terra transition group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
          <Link
            href="/impact"
            className="mt-5 flex min-h-12 items-center justify-between rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra"
          >
            <span className="flex items-center gap-3">
              <Target className="h-4 w-4 text-terra" aria-hidden="true" />
              {text.pilot}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
