"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, GraduationCap, Handshake, Heart, MapPin, School } from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { MainNav } from "@/components/landing/main-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SafeRichText } from "@/components/ui/safe-rich-text";
import { useLocalization } from "@/context/localization-context";
import { apiFetch } from "@/lib/api-client";

interface TeamMember {
  name: string;
  role: string;
  imageUrl: string;
}

const copy = {
  fr: {
    eyebrow: "Notre raison d’être",
    title: "Faire du diplôme un vrai point de départ.",
    subtitle: "Yahnu rapproche les jeunes diplômés, les établissements et les employeurs pour que le talent ivoirien circule, se révèle et trouve sa place.",
    storyLabel: "Né d’une réalité ivoirienne",
    storyTitle: "Entre la fin des études et le premier emploi, le chemin ne devrait pas être invisible.",
    story1: "À Abidjan comme à Bouaké, Korhogo, Yamoussoukro ou San-Pédro, de jeunes diplômés ont les compétences et l’envie d’avancer. Ce qui manque souvent, c’est un accès clair aux opportunités et aux personnes qui peuvent ouvrir une porte.",
    story2: "Yahnu construit ce pont numérique : un espace où chacun comprend sa prochaine action, où les candidatures restent humaines et où les écoles gardent un rôle actif dans l’insertion.",
    principlesLabel: "Ce que nous construisons",
    missionTitle: "Une orientation utile",
    missionBody: "Aider chaque jeune diplômé à présenter son potentiel avec confiance et à trouver une prochaine étape réaliste.",
    visionTitle: "Un réseau ancré ici",
    visionBody: "Créer des connexions professionnelles qui reflètent les villes, les secteurs et l’énergie de la Côte d’Ivoire.",
    valuesTitle: "La dignité d’abord",
    valuesBody: "Concevoir une expérience simple, transparente et respectueuse pour chaque candidat, recruteur et établissement.",
    bridgeTitle: "Trois acteurs. Un même passage vers l’emploi.",
    bridgeBody: "Le progrès est plus rapide quand chacun voit la même information et peut agir au bon moment.",
    graduate: "Les diplômés rendent leurs compétences visibles.",
    company: "Les employeurs rencontrent des profils prêts à apprendre.",
    school: "Les établissements prolongent leur accompagnement.",
    teamLabel: "L’équipe Yahnu",
    teamTitle: "Des personnes qui connaissent le terrain.",
    teamBody: "Une équipe produit attachée à une idée simple : la technologie doit rendre une carrière plus humaine, pas plus froide.",
    ctaTitle: "Construisons la prochaine connexion utile.",
    ctaBody: "Que vous soyez diplômé, employeur ou établissement, votre place existe déjà dans le réseau.",
    ctaAction: "Rejoindre Yahnu",
  },
  en: {
    eyebrow: "Why we exist",
    title: "Make every degree a genuine starting point.",
    subtitle: "Yahnu brings graduates, institutions and employers together so Ivorian talent can move, be seen and find its place.",
    storyLabel: "Born from an Ivorian reality",
    storyTitle: "The road between graduation and a first job should not be invisible.",
    story1: "In Abidjan, Bouaké, Korhogo, Yamoussoukro and San-Pédro, young graduates have the skills and ambition to move forward. What is often missing is clear access to opportunities and the people who can open a door.",
    story2: "Yahnu builds that digital bridge: a space where everyone understands the next action, applications stay human, and institutions remain active in graduate employability.",
    principlesLabel: "What we are building",
    missionTitle: "Useful direction",
    missionBody: "Help every young graduate present their potential with confidence and find a realistic next step.",
    visionTitle: "A network rooted here",
    visionBody: "Create professional connections that reflect the cities, sectors and energy of Côte d’Ivoire.",
    valuesTitle: "Dignity first",
    valuesBody: "Design a simple, transparent and respectful experience for every candidate, recruiter and institution.",
    bridgeTitle: "Three actors. One shared path into work.",
    bridgeBody: "Progress happens faster when everyone sees the same information and can act at the right time.",
    graduate: "Graduates make their skills visible.",
    company: "Employers meet people ready to learn.",
    school: "Institutions keep supporting their alumni.",
    teamLabel: "The Yahnu team",
    teamTitle: "People who understand the local journey.",
    teamBody: "A product team committed to one simple idea: technology should make a career feel more human, not less.",
    ctaTitle: "Let’s build the next useful connection.",
    ctaBody: "Whether you are a graduate, employer or institution, your place already exists in the network.",
    ctaAction: "Join Yahnu",
  },
} as const;

const defaultTeamMembers: TeamMember[] = [
  { name: "Colombe Koffi", role: "about.team.roles.founder_ceo", imageUrl: "/images/Colombe Koffi.jpeg" },
  { name: "Joël K", role: "about.team.roles.head_of_product", imageUrl: "/images/Joel K.jpeg" },
  { name: "Bethel Touman", role: "about.team.roles.data_engineer", imageUrl: "/images/Bethel_Touman.jpeg" },
];

export default function AboutPage() {
  const { language, t } = useLocalization();
  const text = copy[language === "fr" ? "fr" : "en"];
  const [managedContent, setManagedContent] = React.useState<Record<string, unknown> | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    apiFetch<{ data: { page: { data: Record<string, unknown> } | null } }>("/api/pages/about-us", { signal: controller.signal })
      .then((response) => setManagedContent(response.data.page?.data ?? null))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) console.error("Unable to load managed About page content.", error);
      });
    return () => controller.abort();
  }, []);

  const managedText = (key: string, fallback: string) =>
    language === "fr" && typeof managedContent?.[key] === "string"
      ? (managedContent[key] as string).replaceAll("{country}", "Côte d’Ivoire")
      : fallback;
  const teamMembers = Array.isArray(managedContent?.teamMembers)
    ? (managedContent.teamMembers as TeamMember[]).filter((member) => member && typeof member.name === "string" && typeof member.role === "string")
    : defaultTeamMembers;

  const principles = [
    [managedText("missionTitle", text.missionTitle), managedText("missionContent", text.missionBody), MapPin],
    [managedText("visionTitle", text.visionTitle), managedText("visionContent", text.visionBody), Handshake],
    [managedText("valuesTitle", text.valuesTitle), managedText("valuesContent", text.valuesBody), Heart],
  ] as const;
  const bridge = [[text.graduate, GraduationCap], [text.company, Building2], [text.school, School]] as const;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-ivory py-16 dark:bg-background sm:py-24">
          <div className="lagoon-grid absolute inset-0 opacity-30" />
          <div className="container relative mx-auto grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="section-kicker">{text.eyebrow}</p>
              <h1 className="display-title mt-5 max-w-3xl text-5xl sm:text-6xl lg:text-7xl">{managedText("aboutTitle", text.title)}</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">{managedText("aboutSubtitle", text.subtitle)}</p>
            </div>
            <div className="relative min-h-[25rem] overflow-hidden rounded-[2rem] shadow-lift sm:min-h-[34rem]">
              <Image src="/images/yahnu-career-workshop-v2.webp" alt="Atelier Yahnu à Abidjan" fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-cocoa/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-center gap-2 text-sm font-semibold text-white"><MapPin className="h-4 w-4" aria-hidden="true" />Abidjan · Côte d’Ivoire</div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="container mx-auto grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="section-kicker">{text.storyLabel}</p>
              <h2 className="display-title mt-4 text-4xl sm:text-5xl">{managedText("storyTitle", text.storyTitle)}</h2>
            </div>
            <div className="space-y-6 text-lg leading-8 text-muted-foreground">
              <SafeRichText html={managedText("storyContent1", text.story1)} />
              <SafeRichText html={managedText("storyContent2", text.story2)} />
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/30 py-20 sm:py-24">
          <div className="container mx-auto">
            <p className="section-kicker">{text.principlesLabel}</p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {principles.map(([title, body, Icon], index) => (
                <Card key={title} className={index === 1 ? "border-lagoon/25 bg-lagoon/5" : index === 2 ? "border-terra/25 bg-terra/5" : "border-primary/25 bg-primary/5"}>
                  <CardContent className="p-6 sm:p-7">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-background text-primary shadow-soft"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                    <h3 className="mt-8 font-display text-2xl font-semibold">{title}</h3>
                    <SafeRichText html={body} className="mt-3 leading-7 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-cocoa py-20 text-white sm:py-24">
          <div className="container mx-auto grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
            <div>
              <h2 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">{text.bridgeTitle}</h2>
              <p className="mt-4 text-lg leading-8 text-white/65">{text.bridgeBody}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {bridge.map(([label, Icon], index) => (
                <div key={label} className="rounded-[1.4rem] border border-white/10 bg-white/[0.06] p-5">
                  <span className={index === 1 ? "text-terra" : "text-primary"}><Icon className="h-6 w-6" aria-hidden="true" /></span>
                  <p className="mt-8 font-display text-xl font-semibold leading-snug">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28">
          <div className="container mx-auto">
            <div className="max-w-2xl">
              <p className="section-kicker">{text.teamLabel}</p>
              <h2 className="display-title mt-4 text-4xl sm:text-5xl">{text.teamTitle}</h2>
              <p className="mt-4 text-lg leading-8 text-muted-foreground">{text.teamBody}</p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((member) => (
                <article key={member.name} className="group overflow-hidden rounded-[1.5rem] border bg-card shadow-soft">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <Image src={member.imageUrl?.startsWith("/") ? member.imageUrl : "/images/yahnu-career-workshop-v2.webp"} alt={member.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                  </div>
                  <div className="p-5"><h3 className="font-display text-xl font-semibold">{member.name}</h3><p className="mt-1 text-sm font-semibold text-primary">{t(member.role)}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:pb-28">
          <div className="container ci-pattern mx-auto rounded-[2rem] bg-primary p-8 text-primary-foreground shadow-lift sm:p-12 lg:flex lg:items-end lg:justify-between lg:gap-10">
            <div className="max-w-3xl"><h2 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">{text.ctaTitle}</h2><p className="mt-4 text-lg leading-8 text-primary-foreground/70">{text.ctaBody}</p></div>
            <Button variant="terra" size="lg" className="mt-8 lg:mt-0" asChild><Link href="/signup">{text.ctaAction}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
