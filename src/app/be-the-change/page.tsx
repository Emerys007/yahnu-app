"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  GraduationCap,
  Landmark,
  School,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Footer } from "@/components/landing/footer";
import { MainNav } from "@/components/landing/main-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalization } from "@/context/localization-context";

const copy = {
  fr: {
    eyebrow: "La colonne vertébrale de Yahnu",
    title: "BE THE CHANGE",
    subtitle: "Transformer la formation en insertion mesurée.",
    lead:
      "Le changement ne repose pas sur le jeune seul. Yahnu organise une responsabilité partagée entre diplômés, établissements, entreprises et institutions.",
    beforeLabel: "Avant",
    beforeTitle: "Des efforts isolés et une transition invisible.",
    before: [
      "Le jeune doit comprendre seul les codes du recrutement.",
      "L’établissement perd le contact après le diplôme.",
      "L’employeur reçoit des candidatures sans contexte suffisant.",
      "L’institution finance sans toujours suivre le passage vers l’emploi.",
    ],
    afterLabel: "Avec Yahnu",
    afterTitle: "Un parcours commun, des engagements visibles.",
    after: [
      "Le jeune présente ses compétences et suit ses prochaines étapes.",
      "L’établissement accompagne sa communauté au-delà du campus.",
      "L’employeur clarifie ses besoins et répond avec respect.",
      "L’institution suit les objectifs, les résultats et les apprentissages.",
    ],
    pactLabel: "Quatre responsabilités",
    pactTitle: "Chacun change une partie du système.",
    actors: [
      ["Jeune diplômé", "Je rends mon potentiel lisible, je reste actif et je réponds aux échanges.", GraduationCap],
      ["Établissement", "Je garde le lien avec mes diplômés et j’utilise les retours du marché pour progresser.", School],
      ["Entreprise", "Je publie des attentes claires, je recrute avec contexte et je respecte chaque candidature.", Building2],
      ["Institution", "Je relie les acteurs, protège la confiance et exige des résultats mesurables.", Landmark],
    ],
    commitmentsLabel: "Nos engagements publics",
    commitmentsTitle: "La confiance se construit avec des règles simples.",
    commitments: [
      "Toujours distinguer les objectifs projetés des résultats réellement observés.",
      "Ne jamais demander de paiement à un candidat pour accéder à une offre ou postuler.",
      "Identifier les sources officielles et retirer les opportunités devenues obsolètes.",
      "Limiter la collecte de données à ce qui rend le service utile et sûr.",
      "Publier les apprentissages de la phase pilote, y compris ce qui doit être amélioré.",
    ],
    ctaTitle: "Votre rôle dans le changement commence ici.",
    student: "Je suis étudiant ou diplômé",
    school: "Je représente un établissement",
    company: "Je représente une entreprise",
    institution: "Je représente une institution",
  },
  en: {
    eyebrow: "Yahnu’s strategic backbone",
    title: "BE THE CHANGE",
    subtitle: "Turn education into measurable employability.",
    lead:
      "Change cannot rest on the graduate alone. Yahnu organises shared responsibility across graduates, institutions, employers and public partners.",
    beforeLabel: "Before",
    beforeTitle: "Isolated efforts and an invisible transition.",
    before: [
      "The graduate must decode recruitment alone.",
      "The institution loses contact after graduation.",
      "The employer receives applications without enough context.",
      "The public partner funds activity without always seeing the path into work.",
    ],
    afterLabel: "With Yahnu",
    afterTitle: "One journey, with visible commitments.",
    after: [
      "The graduate presents skills and follows each next step.",
      "The institution supports its community beyond campus.",
      "The employer clarifies needs and responds respectfully.",
      "The public partner follows objectives, results and learning.",
    ],
    pactLabel: "Four responsibilities",
    pactTitle: "Each participant changes one part of the system.",
    actors: [
      ["Young graduate", "I make my potential understandable, stay active and respond to conversations.", GraduationCap],
      ["Education institution", "I stay connected with graduates and use market feedback to improve.", School],
      ["Employer", "I publish clear expectations, recruit with context and respect every application.", Building2],
      ["Public institution", "I connect participants, protect trust and require measurable outcomes.", Landmark],
    ],
    commitmentsLabel: "Our public commitments",
    commitmentsTitle: "Trust grows from simple rules.",
    commitments: [
      "Always separate projected objectives from results actually observed.",
      "Never ask a candidate to pay to access or apply for an opportunity.",
      "Identify official sources and remove stale opportunities.",
      "Collect only the data required to make the service useful and safe.",
      "Publish pilot learnings, including what still needs improvement.",
    ],
    ctaTitle: "Your role in the change starts here.",
    student: "I am a student or graduate",
    school: "I represent an institution",
    company: "I represent an employer",
    institution: "I represent a public partner",
  },
} as const;

export default function BeTheChangePage() {
  const { language } = useLocalization();
  const locale = language === "en" ? "en" : "fr";
  const text = copy[locale];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1">
        <section className="relative isolate overflow-hidden bg-[hsl(165_48%_10%)] py-20 text-white sm:py-28">
          <div className="ci-pattern absolute inset-0 -z-20 opacity-25" aria-hidden="true" />
          <div className="absolute -right-20 top-8 -z-10 h-80 w-80 rounded-full bg-terra/20 blur-3xl" aria-hidden="true" />
          <div className="page-shell">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.17em] text-soleil">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {text.eyebrow}
            </p>
            <h1 className="mt-8 font-headline text-[clamp(4rem,12vw,10rem)] font-semibold leading-[0.78] tracking-[-0.07em]">
              <span className="block">BE THE</span>
              <span className="block text-terra">CHANGE</span>
            </h1>
            <div className="mt-12 grid gap-6 border-t border-white/15 pt-8 lg:grid-cols-[0.8fr_1.2fr]">
              <h2 className="font-headline text-3xl font-semibold leading-tight sm:text-4xl">{text.subtitle}</h2>
              <p className="max-w-3xl text-lg leading-8 text-white/70">{text.lead}</p>
            </div>
          </div>
        </section>

        <section className="page-shell grid gap-5 py-16 sm:py-24 lg:grid-cols-2">
          {[
            [text.beforeLabel, text.beforeTitle, text.before, "border-terra/20 bg-terra/[0.045]"],
            [text.afterLabel, text.afterTitle, text.after, "border-primary/20 bg-primary/[0.045]"],
          ].map(([label, title, items, className]) => (
            <Card key={label as string} className={className as string}>
              <CardContent className="p-6 sm:p-8">
                <Badge variant="outline">{label as string}</Badge>
                <h2 className="mt-5 font-headline text-3xl font-semibold leading-tight">{title as string}</h2>
                <ul className="mt-7 space-y-4">
                  {(items as readonly string[]).map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-6 text-muted-foreground sm:text-base">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="border-y bg-muted/25 py-16 sm:py-24">
          <div className="page-shell">
            <p className="section-kicker">{text.pactLabel}</p>
            <h2 className="display-title mt-5 max-w-4xl text-4xl sm:text-6xl">{text.pactTitle}</h2>
            <div className="mt-10 grid overflow-hidden rounded-[1.75rem] border bg-card md:grid-cols-2 xl:grid-cols-4">
              {text.actors.map(([title, body, Icon], index) => {
                const ActorIcon = Icon as typeof GraduationCap;
                return (
                  <article key={title as string} className={`p-6 sm:p-7 ${index > 0 ? "border-t md:border-l md:border-t-0 md:[&:nth-child(3)]:border-l-0 xl:[&:nth-child(3)]:border-l" : ""}`}>
                    <span className={`grid h-11 w-11 place-items-center rounded-2xl ${index % 2 ? "bg-terra/10 text-terra" : "bg-primary/10 text-primary"}`}>
                      <ActorIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-9 font-headline text-2xl font-semibold">{title as string}</h3>
                    <p className="mt-3 leading-7 text-muted-foreground">{body as string}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="page-shell grid gap-10 py-16 sm:py-24 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="section-kicker"><ShieldCheck className="h-4 w-4" aria-hidden="true" />{text.commitmentsLabel}</p>
            <h2 className="display-title mt-5 text-4xl sm:text-5xl">{text.commitmentsTitle}</h2>
          </div>
          <ol className="space-y-3">
            {text.commitments.map((commitment, index) => (
              <li key={commitment} className="flex gap-4 rounded-2xl border bg-card p-4 shadow-soft sm:p-5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">0{index + 1}</span>
                <p className="pt-1 text-sm leading-7 text-muted-foreground sm:text-base">{commitment}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="px-4 pb-20 sm:pb-28">
          <div className="page-shell ci-pattern rounded-[2rem] bg-primary p-7 text-primary-foreground shadow-lift sm:p-12">
            <h2 className="max-w-4xl font-headline text-4xl font-semibold leading-tight sm:text-5xl">{text.ctaTitle}</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                [text.student, "/students"],
                [text.school, "/schools"],
                [text.company, "/companies"],
                [text.institution, "/institutions"],
              ].map(([label, href], index) => (
                <Button key={href} asChild variant={index === 0 ? "terra" : "outline"} className={index === 0 ? "h-auto min-h-12 whitespace-normal py-3" : "h-auto min-h-12 whitespace-normal border-white/20 bg-white/[0.08] py-3 text-white hover:bg-white/15 hover:text-white"}>
                  <Link href={href}>{label}<ArrowRight className="ml-2 h-4 w-4 shrink-0" aria-hidden="true" /></Link>
                </Button>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
