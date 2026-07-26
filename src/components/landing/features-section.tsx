"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Building2, Check, GraduationCap, School, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocalization } from "@/context/localization-context";

type Audience = "graduates" | "companies" | "schools";

const content = {
  fr: {
    eyebrow: "Un réseau, trois façons d’avancer",
    title: "Le pont entre le campus et la vie professionnelle.",
    body: "Yahnu réunit les personnes qui font vivre l’emploi des jeunes en Côte d’Ivoire, avec des parcours clairs pour chacun.",
    imageAlt: "Atelier de carrière réunissant de jeunes diplômés ivoiriens à Abidjan",
    imageDisclaimer: "Illustration non contractuelle · phase de démonstration",
    tabs: {
      graduates: {
        label: "Diplômés",
        title: "Construis un profil qui te ressemble vraiment.",
        body: "Présente tes compétences, tes projets et tes ambitions avec des mots simples. Puis explore les rôles qui correspondent à ton niveau et à ta ville.",
        points: ["Un profil lisible, même sans longue expérience", "Des recherches par métier, compétence et ville", "Un suivi clair de chaque candidature"],
        action: "Commencer mon profil",
        href: "/signup?role=graduate",
      },
      companies: {
        label: "Entreprises",
        title: "Rencontre les jeunes talents qui feront grandir ton équipe.",
        body: "Publie une opportunité, centralise les candidatures et garde une relation humaine avec les profils prometteurs, partout en Côte d’Ivoire.",
        points: ["Des offres structurées et faciles à comprendre", "Un vivier de profils ivoiriens émergents", "Un suivi d’équipe sans tableurs dispersés"],
        action: "Découvrir l’espace recruteur",
        href: "/signup?role=company",
      },
      schools: {
        label: "Établissements",
        title: "Prolonge l’accompagnement bien après la remise du diplôme.",
        body: "Crée des passerelles avec les employeurs, partage les événements utiles et garde un lien concret avec l’insertion de tes diplômés.",
        points: ["Des partenariats école–entreprise centralisés", "Un espace pour orienter les diplômés", "Des actions d’insertion visibles et suivies"],
        action: "Découvrir l’espace établissement",
        href: "/signup?role=school",
      },
    },
  },
  en: {
    eyebrow: "One network, three ways forward",
    title: "The bridge between campus and professional life.",
    body: "Yahnu connects the people shaping youth employment in Côte d’Ivoire, with a clear path for every role.",
    imageAlt: "Career workshop with young Ivorian graduates in Abidjan",
    imageDisclaimer: "Illustrative image · demonstration phase",
    tabs: {
      graduates: {
        label: "Graduates",
        title: "Build a profile that genuinely sounds like you.",
        body: "Present your skills, projects and ambitions in plain language, then explore roles that fit your level and your city.",
        points: ["A clear profile, even without years of experience", "Search by role, skill and Ivorian city", "A simple view of every application"],
        action: "Start my profile",
        href: "/signup?role=graduate",
      },
      companies: {
        label: "Companies",
        title: "Meet the young talent that will help your team grow.",
        body: "Publish an opportunity, centralize applications and keep a human connection with promising candidates across Côte d’Ivoire.",
        points: ["Structured, easy-to-understand listings", "A pipeline of emerging Ivorian talent", "Team follow-up without scattered spreadsheets"],
        action: "Explore the recruiter space",
        href: "/signup?role=company",
      },
      schools: {
        label: "Institutions",
        title: "Keep supporting graduates long after graduation day.",
        body: "Create bridges with employers, share useful events and maintain a practical connection with graduate employment outcomes.",
        points: ["School–company partnerships in one place", "A dedicated graduate guidance space", "Visible, trackable employability actions"],
        action: "Explore the institution space",
        href: "/signup?role=school",
      },
    },
  },
} as const;

const tabIcons = { graduates: GraduationCap, companies: Building2, schools: School } as const;

export function FeaturesSection() {
  const { language } = useLocalization();
  const reducedMotion = useReducedMotion();
  const page = content[language === "fr" ? "fr" : "en"];
  const [active, setActive] = React.useState<Audience>("graduates");
  const selected = page.tabs[active];
  const tabs = Object.keys(page.tabs) as Audience[];

  return (
    <section id="features" className="relative overflow-hidden bg-cocoa py-20 text-white sm:py-28">
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,.25)_1px,transparent_0)] [background-size:24px_24px]" />
      <div className="container relative mx-auto">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <p className="section-kicker border-white/15 bg-white/10 text-[#ffd5b3]">
              <Users className="h-4 w-4" aria-hidden="true" />
              {page.eyebrow}
            </p>
            <h2 className="mt-5 max-w-xl font-display text-4xl font-semibold leading-[1.04] tracking-[-0.04em] sm:text-5xl">
              {page.title}
            </h2>
          </div>
          <p className="max-w-2xl text-lg leading-8 text-white/70 lg:justify-self-end">{page.body}</p>
        </div>

        <div className="mt-12 grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/20 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative min-h-[22rem] lg:min-h-[38rem]">
            <Image
              src="/images/yahnu-career-workshop-v2.webp"
              alt={page.imageAlt}
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cocoa/75 via-transparent to-transparent" />
            <p className="absolute left-4 right-4 top-4 rounded-xl border border-white/20 bg-cocoa/65 px-3 py-1.5 text-center text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-white/75 backdrop-blur sm:left-auto sm:rounded-full">
              {page.imageDisclaimer}
            </p>
            <div className="absolute bottom-5 left-5 right-5 flex flex-wrap gap-2">
              {["Abidjan", "Bouaké", "Yamoussoukro", "Korhogo", "San-Pédro"].map((city) => (
                <span key={city} className="rounded-full border border-white/25 bg-cocoa/65 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                  {city}
                </span>
              ))}
            </div>
          </div>

          <div className="p-5 sm:p-8 lg:p-10">
            <div className="flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label={page.eyebrow}>
              {tabs.map((tab) => {
                const Icon = tabIcons[tab];
                const isActive = active === tab;
                return (
                  <button
                    key={tab}
                    id={`feature-tab-${tab}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`feature-panel-${tab}`}
                    onClick={() => setActive(tab)}
                    className={cn(
                      "flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-terra focus-visible:ring-offset-2 focus-visible:ring-offset-cocoa",
                      isActive ? "border-terra bg-terra text-cocoa" : "border-white/15 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {page.tabs[tab].label}
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                id={`feature-panel-${active}`}
                role="tabpanel"
                aria-labelledby={`feature-tab-${active}`}
                initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: reducedMotion ? 0 : 0.22 }}
                className="pt-10"
              >
                <h3 className="max-w-xl font-display text-3xl font-semibold leading-tight sm:text-4xl">{selected.title}</h3>
                <p className="mt-5 max-w-xl text-base leading-7 text-white/70">{selected.body}</p>
                <ul className="mt-7 space-y-4">
                  {selected.points.map((point) => (
                    <li key={point} className="flex gap-3 text-sm leading-6 text-white/90 sm:text-base">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
                <Button variant="terra" size="lg" className="mt-9" asChild>
                  <Link href={selected.href}>
                    {selected.action}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
