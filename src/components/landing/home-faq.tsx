"use client";

import { ChevronDown, MessageCircleQuestion } from "lucide-react";

import { useLocalization } from "@/context/localization-context";

const copy = {
  fr: {
    eyebrow: "Réponses directes",
    title: "Ce qu’il faut savoir avant de commencer.",
    description:
      "Des réponses claires sur la plateforme, les offres et la preuve de compétences.",
    items: [
      [
        "Qu’est-ce que Yahnu ?",
        "Yahnu est une plateforme d’insertion professionnelle pensée en Côte d’Ivoire. Elle relie les jeunes diplômés, les établissements et les employeurs autour de profils, d’opportunités, de compétences et de résultats mesurables.",
      ],
      [
        "Qui peut créer un compte Yahnu ?",
        "Les jeunes diplômés, les entreprises et les établissements peuvent créer un espace. Chaque rôle dispose d’outils adaptés : recherche d’emploi et compétences, recrutement, suivi de cohortes et partenariats.",
      ],
      [
        "Comment Yahnu vérifie-t-il les offres externes ?",
        "Yahnu utilise des sources officielles approuvées, conserve la provenance et la date de vérification, retire les offres périmées et indique clairement quand la candidature se poursuit sur le site de l’employeur.",
      ],
      [
        "Un Yahnu Skills Check est-il un diplôme ?",
        "Non. Il produit une attestation Yahnu sous conditions vérifiées : test chronométré, questions randomisées et notation côté serveur. Il ne remplace ni un diplôme, ni une certification accréditée, ni une surveillance humaine.",
      ],
    ],
  },
  en: {
    eyebrow: "Straight answers",
    title: "What to know before you begin.",
    description:
      "Clear answers about the platform, opportunities and skills evidence.",
    items: [
      [
        "What is Yahnu?",
        "Yahnu is a career transition platform designed in Côte d’Ivoire. It connects graduates, education providers and employers around profiles, opportunities, skills and measurable outcomes.",
      ],
      [
        "Who can create a Yahnu account?",
        "Graduates, employers and education providers can create a workspace. Each role gets practical tools for job discovery and skills, recruiting, cohort support and partnerships.",
      ],
      [
        "How does Yahnu verify external opportunities?",
        "Yahnu uses approved official sources, records provenance and verification dates, removes expired listings and clearly states when an application continues on the employer’s website.",
      ],
      [
        "Is a Yahnu Skills Check a degree?",
        "No. It produces a Yahnu skills attestation under verified conditions: a timed check, randomized questions and server-side grading. It is not a degree, an accredited certification or human invigilation.",
      ],
    ],
  },
} as const;

export function HomeFaq() {
  const { language } = useLocalization();
  const content = copy[language];

  return (
    <section className="relative overflow-hidden border-y border-border/70 bg-card/55 py-20 sm:py-28" id="faq">
      <div className="lagoon-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="page-shell relative grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="section-kicker">
            <MessageCircleQuestion className="h-4 w-4" aria-hidden="true" />
            {content.eyebrow}
          </p>
          <h2 className="display-title mt-5 max-w-xl text-4xl sm:text-5xl">
            {content.title}
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-8 text-muted-foreground">
            {content.description}
          </p>
        </div>

        <div className="space-y-3">
          {content.items.map(([question, answer], index) => (
            <details
              key={question}
              className="group dashboard-surface overflow-hidden transition hover:border-primary/30"
              open={index === 0}
            >
              <summary className="flex min-h-16 cursor-pointer list-none items-center gap-4 px-5 py-4 font-display text-lg font-semibold marker:hidden sm:px-6">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex-1">{question}</span>
                <ChevronDown
                  className="h-5 w-5 shrink-0 text-primary transition-transform duration-300 group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <p className="border-t border-border/60 px-5 py-5 pl-[4.25rem] leading-7 text-muted-foreground sm:px-6 sm:pl-[4.75rem]">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
