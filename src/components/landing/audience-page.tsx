"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  Compass,
  FileBadge2,
  GraduationCap,
  Handshake,
  Landmark,
  LineChart,
  MapPinned,
  Network,
  School,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";

import { Footer } from "@/components/landing/footer";
import { MainNav } from "@/components/landing/main-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalization } from "@/context/localization-context";

type Audience = "students" | "institutions";
type Locale = "fr" | "en";

const copy = {
  fr: {
    students: {
      eyebrow: "Étudiants & jeunes diplômés",
      title: "Votre diplôme mérite une trajectoire, pas une salle d’attente.",
      subtitle:
        "Yahnu vous aide à comprendre votre valeur, choisir une direction et transformer chaque candidature en prochaine action utile.",
      problemLabel: "Le point de friction",
      problemTitle: "Avoir des compétences sans savoir comment les rendre visibles.",
      problemBody:
        "Entre les annonces dispersées, le manque de réseau et les exigences parfois floues, les premiers pas peuvent sembler plus difficiles que les études elles-mêmes.",
      solutionLabel: "La réponse Yahnu",
      solutionTitle: "Un même espace pour construire, chercher et progresser.",
      solutionBody:
        "Votre profil raconte vos projets, vos expériences et vos compétences. Les opportunités sont replacées dans leur contexte, et votre tableau de bord garde le fil de vos candidatures.",
      valueLabel: "Ce que vous gagnez",
      values: [
        ["Un profil qui vous ressemble", "Valorisez aussi vos projets, engagements associatifs, stages et compétences transférables.", FileBadge2],
        ["Des repères du marché local", "Explorez les métiers, employeurs, établissements et villes qui font avancer la Côte d’Ivoire.", Compass],
        ["Une progression visible", "Gardez vos candidatures, messages et prochaines étapes au même endroit.", LineChart],
      ],
      commitmentLabel: "Votre engagement",
      commitmentTitle: "Présenter un parcours sincère et rester acteur de la suite.",
      commitmentBody:
        "Yahnu vous ouvre des portes, mais votre voix, votre fiabilité et votre curiosité font la différence. Complétez votre profil avec honnêteté et répondez aux échanges dans des délais raisonnables.",
      pathways: [
        ["Voir les opportunités", "/jobs", BriefcaseBusiness],
        ["Découvrir les établissements", "/schools", School],
        ["Comprendre les employeurs", "/companies", Building2],
      ],
      ctaTitle: "Commencez par raconter ce que vous savez déjà faire.",
      ctaBody: "Créez votre profil gratuitement et retrouvez les opportunités vérifiées après connexion.",
      ctaAction: "Créer mon profil",
      ctaHref: "/signup?role=graduate",
    },
    institutions: {
      eyebrow: "Institutions, collectivités & partenaires",
      title: "Faire de l’insertion une responsabilité publique, visible et mesurée.",
      subtitle:
        "Yahnu aide les acteurs institutionnels à réunir établissements, employeurs et jeunes autour d’objectifs communs pour les territoires ivoiriens et africains.",
      problemLabel: "Le défi collectif",
      problemTitle: "Des initiatives nombreuses, mais trop peu de preuves partagées.",
      problemBody:
        "Les programmes d’employabilité perdent en impact lorsque les données restent fragmentées, que les rôles ne sont pas clairs et que le suivi s’arrête à la fin d’un financement.",
      solutionLabel: "Le dispositif Yahnu",
      solutionTitle: "Un pilote opérationnel qui relie accompagnement et mesure.",
      solutionBody:
        "Yahnu structure les engagements, suit les passages du campus à l’emploi et prépare des indicateurs compréhensibles par les équipes terrain comme par les décideurs.",
      valueLabel: "Ce que le partenariat rend possible",
      values: [
        ["Une lecture territoriale", "Suivez les besoins, les parcours et les points de friction par ville, filière et public.", MapPinned],
        ["Des coalitions utiles", "Reliez écoles, entreprises, structures d’accompagnement et programmes publics.", Network],
        ["Une redevabilité claire", "Distinguez objectifs, activités, résultats observés et apprentissages du pilote.", BarChart3],
      ],
      commitmentLabel: "L’engagement attendu",
      commitmentTitle: "Co-définir les indicateurs et protéger la confiance des participants.",
      commitmentBody:
        "Chaque partenariat doit préciser les responsabilités, la gouvernance des données, la fréquence des rapports et la manière dont les enseignements conduisent à des décisions concrètes.",
      pathways: [
        ["Comprendre le pilote", "/impact", Target],
        ["Lire BE THE CHANGE", "/be-the-change", Sparkles],
        ["Rencontrer l’écosystème", "/schools", Handshake],
      ],
      ctaTitle: "Construisons un pilote 2026 qui peut être évalué.",
      ctaBody: "Parlez-nous de votre territoire, de votre programme et des résultats que vous cherchez à produire.",
      ctaAction: "Rejoindre le pilote",
      ctaHref: "/contact?intent=pilot&source=institutions",
    },
  },
  en: {
    students: {
      eyebrow: "Students & young graduates",
      title: "Your degree deserves a trajectory, not a waiting room.",
      subtitle:
        "Yahnu helps you understand your value, choose a direction and turn each application into a useful next action.",
      problemLabel: "The friction",
      problemTitle: "Having skills without knowing how to make them visible.",
      problemBody:
        "Between scattered listings, limited networks and unclear requirements, a first professional step can feel harder than completing the degree itself.",
      solutionLabel: "The Yahnu response",
      solutionTitle: "One space to build, search and move forward.",
      solutionBody:
        "Your profile brings projects, experience and skills together. Opportunities include useful context, while your dashboard keeps applications and conversations connected.",
      valueLabel: "What you gain",
      values: [
        ["A profile that sounds like you", "Show projects, community work, internships and transferable skills—not only job titles.", FileBadge2],
        ["Signals from the local market", "Explore roles, employers, institutions and cities moving Côte d’Ivoire forward.", Compass],
        ["Progress you can see", "Keep applications, conversations and next steps in one place.", LineChart],
      ],
      commitmentLabel: "Your commitment",
      commitmentTitle: "Present an honest journey and stay active in what follows.",
      commitmentBody:
        "Yahnu can open a door, but your voice, reliability and curiosity make the difference. Keep your profile truthful and reply to conversations within a reasonable time.",
      pathways: [
        ["View opportunities", "/jobs", BriefcaseBusiness],
        ["Discover institutions", "/schools", School],
        ["Understand employers", "/companies", Building2],
      ],
      ctaTitle: "Start by telling the story of what you can already do.",
      ctaBody: "Create your profile for free and access verified opportunities after sign-in.",
      ctaAction: "Create my profile",
      ctaHref: "/signup?role=graduate",
    },
    institutions: {
      eyebrow: "Institutions, local authorities & partners",
      title: "Make employability a public responsibility that is visible and measurable.",
      subtitle:
        "Yahnu helps institutions bring schools, employers and young people around shared objectives for Ivorian and African regions.",
      problemLabel: "The collective challenge",
      problemTitle: "Many initiatives, but too little shared evidence.",
      problemBody:
        "Employability programmes lose impact when data is fragmented, responsibilities are unclear and follow-up ends with the funding cycle.",
      solutionLabel: "The Yahnu model",
      solutionTitle: "An operational pilot connecting support with measurement.",
      solutionBody:
        "Yahnu structures commitments, follows the path from campus to work and prepares indicators understood by field teams and decision-makers alike.",
      valueLabel: "What partnership enables",
      values: [
        ["A territorial view", "Track needs, journeys and friction by city, field of study and audience.", MapPinned],
        ["Useful coalitions", "Connect schools, employers, support organisations and public programmes.", Network],
        ["Clear accountability", "Separate objectives, activities, observed results and pilot learnings.", BarChart3],
      ],
      commitmentLabel: "The expected commitment",
      commitmentTitle: "Co-define indicators and protect participant trust.",
      commitmentBody:
        "Each partnership should clarify responsibilities, data governance, reporting frequency and how evidence will inform concrete decisions.",
      pathways: [
        ["Understand the pilot", "/impact", Target],
        ["Read BE THE CHANGE", "/be-the-change", Sparkles],
        ["Meet the ecosystem", "/schools", Handshake],
      ],
      ctaTitle: "Let’s build a 2026 pilot that can be evaluated.",
      ctaBody: "Tell us about your region, programme and the outcomes you need to produce.",
      ctaAction: "Join the pilot",
      ctaHref: "/contact?intent=pilot&source=institutions",
    },
  },
} as const;

export function AudiencePage({ audience }: { audience: Audience }) {
  const { language } = useLocalization();
  const locale: Locale = language === "en" ? "en" : "fr";
  const text = copy[locale][audience];
  const AudienceIcon = audience === "students" ? GraduationCap : Landmark;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-ivory py-16 dark:bg-background sm:py-24">
          <div className="lagoon-grid absolute inset-0 opacity-35" aria-hidden="true" />
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-terra/12 blur-3xl" aria-hidden="true" />
          <div className="page-shell relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <p className="section-kicker"><AudienceIcon className="h-4 w-4" aria-hidden="true" />{text.eyebrow}</p>
              <h1 className="display-title mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">{text.title}</h1>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">{text.subtitle}</p>
          </div>
        </section>

        <section className="page-shell grid gap-5 py-14 sm:py-20 lg:grid-cols-2">
          {[
            [text.problemLabel, text.problemTitle, text.problemBody, ShieldCheck, "border-terra/25 bg-terra/[0.045]"],
            [text.solutionLabel, text.solutionTitle, text.solutionBody, BookOpenCheck, "border-primary/25 bg-primary/[0.045]"],
          ].map(([label, title, body, Icon, className]) => {
            const CardIcon = Icon as typeof ShieldCheck;
            return (
              <Card key={label as string} className={className as string}>
                <CardContent className="p-6 sm:p-8">
                  <CardIcon className="h-7 w-7 text-primary" aria-hidden="true" />
                  <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-primary">{label as string}</p>
                  <h2 className="mt-3 font-headline text-3xl font-semibold leading-tight">{title as string}</h2>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">{body as string}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="border-y bg-muted/25 py-16 sm:py-20">
          <div className="page-shell">
            <p className="section-kicker">{text.valueLabel}</p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {text.values.map(([title, body, Icon], index) => {
                const ValueIcon = Icon as typeof Compass;
                return (
                  <article key={title as string} className="rounded-[1.5rem] border bg-card p-6 shadow-soft">
                    <span className={`grid h-11 w-11 place-items-center rounded-2xl ${index === 1 ? "bg-lagoon/10 text-lagoon" : index === 2 ? "bg-terra/10 text-terra" : "bg-primary/10 text-primary"}`}>
                      <ValueIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h2 className="mt-8 font-headline text-2xl font-semibold">{title as string}</h2>
                    <p className="mt-3 leading-7 text-muted-foreground">{body as string}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="page-shell grid gap-10 py-16 sm:py-24 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="section-kicker">{text.commitmentLabel}</p>
            <h2 className="display-title mt-4 text-4xl sm:text-5xl">{text.commitmentTitle}</h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">{text.commitmentBody}</p>
          </div>
          <div className="grid gap-3">
            {text.pathways.map(([label, href, Icon]) => {
              const PathIcon = Icon as typeof BriefcaseBusiness;
              return (
                <Link key={href as string} href={href as string} className="group flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-soft transition hover:border-primary/35 hover:shadow-lift">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><PathIcon className="h-5 w-5" aria-hidden="true" /></span>
                  <span className="font-semibold">{label as string}</span>
                  <ArrowRight className="ml-auto h-5 w-5 text-primary transition group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="px-4 pb-20 sm:pb-28">
          <div className="page-shell ci-pattern rounded-[2rem] bg-primary p-7 text-primary-foreground shadow-lift sm:p-12 lg:flex lg:items-end lg:justify-between lg:gap-10">
            <div className="max-w-3xl">
              <Badge className="border-white/15 bg-white/10 text-white">{audience === "students" ? "BE THE CHANGE" : "Pilote 2026"}</Badge>
              <h2 className="mt-5 font-headline text-4xl font-semibold leading-tight sm:text-5xl">{text.ctaTitle}</h2>
              <p className="mt-4 text-lg leading-8 text-primary-foreground/75">{text.ctaBody}</p>
            </div>
            <Button asChild variant="terra" size="lg" className="mt-8 h-auto min-h-12 whitespace-normal py-3 lg:mt-0">
              {text.ctaHref.startsWith("mailto:") ? (
                <a href={text.ctaHref}>{text.ctaAction}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></a>
              ) : (
                <Link href={text.ctaHref}>{text.ctaAction}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link>
              )}
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
