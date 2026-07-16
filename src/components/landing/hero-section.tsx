"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  MapPin,
  School,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalization } from "@/context/localization-context";

const copy = {
  fr: {
    eyebrow: "Pensé en Côte d’Ivoire, pour les talents d’ici",
    title: "Ton diplôme ouvre une porte. Yahnu t’aide à choisir laquelle.",
    body: "Découvre des opportunités, rends ton parcours lisible et crée les bonnes connexions — d’Abidjan à Korhogo, de Bouaké à San-Pédro.",
    searchLabel: "Rechercher une opportunité",
    searchPlaceholder: "Métier, compétence ou secteur",
    locationLabel: "Choisir une ville",
    locationPlaceholder: "Abidjan, Bouaké…",
    searchAction: "Lancer la recherche",
    profileAction: "Créer mon profil",
    routesTitle: "Choisis ton point de départ",
    graduate: "Je démarre ma carrière",
    company: "Je recrute en Côte d’Ivoire",
    school: "J’accompagne mes diplômés",
    photoAlt: "Jeunes diplômés ivoiriens avançant ensemble à Abidjan",
    imageNote: "Le talent ivoirien, en mouvement",
    imageBody: "Un même espace pour passer du campus au monde professionnel.",
  },
  en: {
    eyebrow: "Designed in Côte d’Ivoire, for local talent",
    title: "Your degree opens a door. Yahnu helps you choose the right one.",
    body: "Find opportunities, make your journey visible and build the right connections — from Abidjan and Bouaké to Korhogo and San-Pédro.",
    searchLabel: "Search for an opportunity",
    searchPlaceholder: "Role, skill or sector",
    locationLabel: "Choose a city",
    locationPlaceholder: "Abidjan, Bouaké…",
    searchAction: "Search",
    profileAction: "Create my profile",
    routesTitle: "Choose your starting point",
    graduate: "I am starting my career",
    company: "I recruit in Côte d’Ivoire",
    school: "I support our graduates",
    photoAlt: "Young Ivorian graduates walking together in Abidjan",
    imageNote: "Ivorian talent in motion",
    imageBody: "One space to move from campus into professional life.",
  },
} as const;

const cities = ["Abidjan", "Bouaké", "Yamoussoukro", "San-Pédro"];

export function HeroSection() {
  const { language } = useLocalization();
  const content = copy[language === "fr" ? "fr" : "en"];
  const routes = [
    { label: content.graduate, icon: GraduationCap, href: "/signup?role=graduate" },
    { label: content.company, icon: Building2, href: "/signup?role=company" },
    { label: content.school, icon: School, href: "/signup?role=school" },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-ivory py-10 text-cocoa dark:bg-background dark:text-foreground sm:py-16 lg:py-20">
      <div className="lagoon-grid absolute inset-0 -z-20 opacity-35" />
      <div className="absolute -left-28 top-20 -z-10 h-72 w-72 rounded-full bg-terra/15 blur-3xl" />
      <div className="absolute -right-24 bottom-0 -z-10 h-80 w-80 rounded-full bg-lagoon/15 blur-3xl" />

      <div className="container mx-auto grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
        <div className="animate-soft-rise">
          <p className="section-kicker">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {content.eyebrow}
          </p>
          <h1 className="display-title mt-5 max-w-3xl text-4xl leading-[0.98] sm:text-6xl lg:text-[4.5rem]">
            {content.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-cocoa/75 dark:text-muted-foreground sm:text-xl">
            {content.body}
          </p>

          <form action="/jobs" method="get" className="surface-glass mt-8 grid gap-3 rounded-[1.5rem] p-3 shadow-soft sm:grid-cols-[1fr_0.78fr_auto]" role="search">
            <label className="relative block">
              <span className="sr-only">{content.searchLabel}</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                name="q"
                type="search"
                placeholder={content.searchPlaceholder}
                className="h-12 w-full rounded-xl border border-border/70 bg-background/90 pl-10 pr-3 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </label>
            <label className="relative block">
              <span className="sr-only">{content.locationLabel}</span>
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                name="location"
                placeholder={content.locationPlaceholder}
                className="h-12 w-full rounded-xl border border-border/70 bg-background/90 pl-10 pr-3 text-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
              />
            </label>
            <Button type="submit" className="h-12 rounded-xl px-5" aria-label={content.searchAction}>
              <span className="sm:hidden xl:inline">{content.searchAction}</span>
              <Search className="h-4 w-4 sm:ml-0 xl:ml-2" aria-hidden="true" />
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2" aria-label={content.locationLabel}>
            {cities.map((city) => (
              <Link
                key={city}
                href={`/jobs?location=${encodeURIComponent(city)}`}
                className="rounded-full border border-cocoa/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-cocoa/70 transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:border-border dark:bg-card dark:text-muted-foreground"
              >
                {city}
              </Link>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button variant="terra" size="lg" asChild>
              <Link href="/signup?role=graduate">
                {content.profileAction}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <div className="flex -space-x-2" aria-hidden="true">
              {["bg-terra", "bg-primary", "bg-lagoon"].map((color) => (
                <span key={color} className={`grid h-9 w-9 place-items-center rounded-full border-2 border-ivory ${color} text-xs font-bold text-white dark:border-background`}>
                  Y
                </span>
              ))}
            </div>
            <p className="max-w-xs text-sm leading-5 text-cocoa/65 dark:text-muted-foreground">
              {content.routesTitle}
            </p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:mx-0">
          <div className="ci-pattern absolute -inset-5 -z-10 rounded-[2.25rem] opacity-45" />
          <div className="relative min-h-[31rem] overflow-hidden rounded-[2rem] border border-white/60 bg-cocoa shadow-lift sm:min-h-[38rem]">
            <Image
              src="/images/yahnu-abidjan-hero-v2.webp"
              alt={content.photoAlt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 48vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cocoa/90 via-cocoa/5 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
              <span className="inline-flex rounded-full bg-terra px-3 py-1 text-xs font-bold text-cocoa">
                {content.imageNote}
              </span>
              <p className="mt-3 max-w-sm font-display text-2xl font-semibold leading-tight">{content.imageBody}</p>
            </div>
          </div>

          <div className="surface-glass relative -mt-5 ml-4 mr-4 grid gap-2 rounded-2xl p-2 shadow-soft sm:-mt-8 sm:ml-8 sm:mr-[-1rem] sm:grid-cols-3">
            {routes.map(({ label, icon: Icon, href }) => (
              <Link
                key={href}
                href={href}
                className="group flex min-h-16 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
