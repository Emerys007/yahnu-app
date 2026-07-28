"use client";

import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Factory, Landmark, Leaf, MapPinned, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeaturesSection } from "@/components/landing/features-section";
import { Footer } from "@/components/landing/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { MainNav } from "@/components/landing/main-nav";
import { PilotStorySection } from "@/components/landing/pilot-story-section";
import { HomeFaq } from "@/components/landing/home-faq";
import { VerifiedOpportunities } from "@/components/market/verified-opportunities";
import { useLocalization } from "@/context/localization-context";

const copy = {
  fr: {
    sectorsEyebrow: "Des ambitions ancrées dans le réel",
    sectorsTitle: "Les secteurs qui font bouger la Côte d’Ivoire.",
    sectorsBody: "Explore des pistes qui parlent à notre économie, à nos villes et aux défis que ta génération veut relever.",
    sectors: [
      ["Numérique & fintech", "Abidjan · Cocody · Plateau", "produit digital", Landmark],
      ["Agro-industrie", "Bouaké · Korhogo · Daloa", "agro-industrie", Leaf],
      ["Logistique & industrie", "San-Pédro · Vridi · Anyama", "logistique", Factory],
      ["Services & impact", "Yamoussoukro · National", "impact", BriefcaseBusiness],
    ],
    routeEyebrow: "Ton parcours, sans détour",
    routeTitle: "Du “je ne sais pas par où commencer” au premier vrai échange.",
    steps: [
      ["01", "Raconte ton parcours", "Formation, projets, stages, bénévolat : valorise ce que tu sais déjà faire."],
      ["02", "Trouve ton cap", "Filtre les opportunités par compétence, ville et type de contrat."],
      ["03", "Crée la connexion", "Candidate, suis la réponse et garde tout ton parcours au même endroit."],
    ],
    ctaEyebrow: "Prêt·e à prendre ton élan ?",
    ctaTitle: "La prochaine étape de ta carrière peut commencer aujourd’hui.",
    ctaBody: "Crée un profil qui parle de toi, puis découvre les opportunités ouvertes en Côte d’Ivoire.",
    ctaPrimary: "Créer mon profil",
    ctaSecondary: "Explorer les offres",
  },
  en: {
    sectorsEyebrow: "Ambition grounded in real life",
    sectorsTitle: "The sectors moving Côte d’Ivoire forward.",
    sectorsBody: "Explore paths connected to our economy, our cities and the challenges your generation wants to solve.",
    sectors: [
      ["Digital & fintech", "Abidjan · Cocody · Plateau", "digital product", Landmark],
      ["Agro-industry", "Bouaké · Korhogo · Daloa", "agro-industry", Leaf],
      ["Logistics & industry", "San-Pédro · Vridi · Anyama", "logistics", Factory],
      ["Services & impact", "Yamoussoukro · Nationwide", "social impact", BriefcaseBusiness],
    ],
    routeEyebrow: "Your path, made clearer",
    routeTitle: "From “where do I begin?” to the first meaningful conversation.",
    steps: [
      ["01", "Tell your story", "Education, projects, internships and volunteering all show what you can already do."],
      ["02", "Find your direction", "Filter opportunities by skill, city and contract type."],
      ["03", "Make the connection", "Apply, follow the response and keep your journey in one place."],
    ],
    ctaEyebrow: "Ready to build momentum?",
    ctaTitle: "The next step in your career can start today.",
    ctaBody: "Build a profile that sounds like you, then explore open opportunities across Côte d’Ivoire.",
    ctaPrimary: "Create my profile",
    ctaSecondary: "Explore opportunities",
  },
} as const;

export default function HomePage() {
  const { language } = useLocalization();
  const content = copy[language === "fr" ? "fr" : "en"];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1">
        <HeroSection />
        <PilotStorySection />

        <section className="relative overflow-hidden border-y bg-background py-20 sm:py-28">
          <div className="container mx-auto">
            <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div>
                <p className="section-kicker"><MapPinned className="h-4 w-4" aria-hidden="true" />{content.sectorsEyebrow}</p>
                <h2 className="display-title mt-4 text-4xl sm:text-5xl">{content.sectorsTitle}</h2>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground lg:justify-self-end">{content.sectorsBody}</p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {content.sectors.map(([title, place, query, Icon], index) => {
                const SectorIcon = Icon as typeof Landmark;
                return (
                  <Link
                    key={title as string}
                    href={`/jobs?q=${encodeURIComponent(query as string)}`}
                    className="group relative min-h-64 overflow-hidden rounded-[1.5rem] border bg-card p-5 shadow-soft transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className={`absolute right-[-2rem] top-[-2rem] h-28 w-28 rounded-full ${index % 2 ? "bg-lagoon/10" : "bg-terra/10"}`} />
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><SectorIcon className="h-5 w-5" aria-hidden="true" /></span>
                    <p className="mt-14 font-display text-2xl font-semibold leading-tight">{title as string}</p>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{place as string}</p>
                    <ArrowRight className="absolute bottom-5 right-5 h-5 w-5 text-primary transition group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <FeaturesSection />

        <section className="relative overflow-hidden bg-ivory py-20 dark:bg-card sm:py-28">
          <div className="ci-pattern absolute inset-0 opacity-25" />
          <div className="container relative mx-auto grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="section-kicker"><Route className="h-4 w-4" aria-hidden="true" />{content.routeEyebrow}</p>
              <h2 className="display-title mt-4 max-w-xl text-4xl sm:text-5xl">{content.routeTitle}</h2>
            </div>
            <ol className="relative space-y-4 before:absolute before:bottom-10 before:left-[1.35rem] before:top-10 before:w-px before:bg-primary/25 sm:space-y-5">
              {content.steps.map(([number, title, body]) => (
                <li key={number} className="surface-glass relative flex gap-5 rounded-[1.4rem] p-5 sm:p-6">
                  <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">{number}</span>
                  <div>
                    <h3 className="font-display text-xl font-semibold">{title}</h3>
                    <p className="mt-1.5 leading-7 text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <VerifiedOpportunities compact />

        <HomeFaq />

        <section className="px-4 pb-20 sm:pb-28">
          <div className="container ci-pattern mx-auto overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-primary-foreground shadow-lift sm:px-10 lg:flex lg:items-end lg:justify-between lg:gap-12 lg:px-14 lg:py-14">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground/70">{content.ctaEyebrow}</p>
              <h2 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl">{content.ctaTitle}</h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-primary-foreground/75">{content.ctaBody}</p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
              <Button variant="terra" size="lg" asChild><Link href="/signup?role=graduate">{content.ctaPrimary}</Link></Button>
              <Button variant="outline" size="lg" className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white" asChild><Link href="/jobs">{content.ctaSecondary}</Link></Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
