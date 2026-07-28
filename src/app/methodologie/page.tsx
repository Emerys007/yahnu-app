import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  DatabaseZap,
  ExternalLink,
  EyeOff,
  FileCheck2,
  Fingerprint,
  HeartHandshake,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { Footer } from "@/components/landing/footer";
import { MainNav } from "@/components/landing/main-nav";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { absoluteUrl, publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  title: "Méthodologie, vérification et confiance",
  description:
    "Comment Yahnu vérifie les opportunités, encadre ses Skills Checks et protège le consentement des jeunes diplômés en Côte d’Ivoire.",
  path: "/methodologie",
  keywords: [
    "vérification offres emploi Côte d’Ivoire",
    "attestation compétences Yahnu",
    "méthodologie recrutement responsable",
  ],
});

const methodologyJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": absoluteUrl("/methodologie#webpage"),
  url: absoluteUrl("/methodologie"),
  name: "Méthodologie, vérification et confiance",
  description:
    "Les règles appliquées par Yahnu aux opportunités, Skills Checks, profils et indicateurs.",
  inLanguage: "fr-CI",
  dateModified: "2026-07-25",
  isPartOf: { "@id": absoluteUrl("/#website") },
  about: { "@id": absoluteUrl("/#organization") },
};

const jobSteps = [
  {
    icon: Fingerprint,
    title: "Source identifiable",
    body: "Une offre externe doit provenir d’un domaine officiel approuvé ou d’un flux ATS public de l’employeur. La provenance reste visible.",
  },
  {
    icon: RefreshCw,
    title: "Fraîcheur enregistrée",
    body: "Yahnu conserve la dernière vérification, déduplique les annonces et retire celles qui expirent ou disparaissent de la source.",
  },
  {
    icon: ExternalLink,
    title: "Redirection transparente",
    body: "Quand la candidature continue ailleurs, le bouton l’indique. Yahnu ne prétend pas recevoir ou confirmer une candidature externe.",
  },
];

const skillsConditions = [
  "Compte Yahnu actif et adresse e-mail vérifiée",
  "Questions et ordre de réponses randomisés côté serveur",
  "Temps, nombre de tentatives et notation contrôlés côté serveur",
  "Signaux de perte de focus utilisés pour revue, jamais comme verdict automatique",
  "Aménagements possibles sans pénaliser les technologies d’assistance",
];

export default function MethodologyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <JsonLd data={methodologyJsonLd} />
      <MainNav />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b py-16 sm:py-24">
          <div className="lagoon-grid pointer-events-none absolute inset-0 opacity-55" aria-hidden="true" />
          <div className="page-shell relative">
            <Badge variant="outline" className="border-primary/25 bg-card/90 text-primary">
              <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />
              Confiance par la preuve
            </Badge>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div>
                <h1 className="display-title max-w-4xl text-5xl sm:text-6xl lg:text-7xl">
                  Ce que Yahnu vérifie. Ce que Yahnu ne prétend pas vérifier.
                </h1>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">
                  Une méthode lisible pour les jeunes diplômés, les recruteurs et les
                  établissements de Côte d’Ivoire. Chaque badge, offre et indicateur doit
                  pouvoir être expliqué sans jargon.
                </p>
              </div>
              <aside className="dashboard-surface border-primary/20 bg-primary p-6 text-primary-foreground">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/65">
                  Dernière revue
                </p>
                <p className="mt-2 font-display text-2xl font-semibold">25 juillet 2026</p>
                <p className="mt-3 leading-7 text-primary-foreground/75">
                  Cette page évolue avec les contrôles réellement disponibles dans le produit.
                  Une fonction non déployée n’y est jamais présentée comme active.
                </p>
              </aside>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="page-shell">
            <div className="max-w-3xl">
              <p className="section-kicker">
                <DatabaseZap className="h-4 w-4" aria-hidden="true" />
                Opportunités officielles
              </p>
              <h2 className="mt-5 font-display text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                Une veille utile, jamais un copier-coller aveugle.
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Les offres publiées directement par une entreprise Yahnu et les opportunités
                externes conservent deux parcours distincts. Cette distinction protège le
                candidat et évite toute fausse promesse de suivi.
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {jobSteps.map(({ icon: Icon, title, body }) => (
                <article key={title} className="dashboard-surface p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-8 font-display text-2xl font-semibold">{title}</h3>
                  <p className="mt-3 leading-7 text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y bg-card/55 py-16 sm:py-24">
          <div className="page-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="section-kicker">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                Yahnu Skills Check
              </p>
              <h2 className="mt-5 font-display text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                Une attestation sous conditions vérifiées, pas un diplôme.
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                Le Skills Check mesure une performance à un moment donné. L’attestation
                indique ses conditions exactes, sa version, son état de validité et les
                compétences évaluées.
              </p>
              <div className="mt-7 rounded-2xl border border-terra/30 bg-terra/10 p-5">
                <p className="font-semibold text-foreground">Ce que le MVP ne fait pas</p>
                <p className="mt-2 leading-7 text-muted-foreground">
                  Aucune caméra, aucun microphone, aucun enregistrement d’écran et aucun
                  surveillant humain. Yahnu ne garantit donc pas que toute aide extérieure
                  était impossible et ne revendique pas une surveillance humaine.
                </p>
              </div>
            </div>
            <div className="dashboard-surface overflow-hidden">
              <div className="border-b bg-[hsl(var(--sidebar-background))] p-6 text-[hsl(var(--sidebar-foreground))]">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-terra">
                  Conditions affichées sur chaque preuve
                </p>
                <p className="mt-2 font-display text-2xl font-semibold">
                  Une vérification que le candidat peut expliquer.
                </p>
              </div>
              <ul className="divide-y divide-border/70">
                {skillsConditions.map((condition) => (
                  <li key={condition} className="flex gap-4 p-5 sm:px-6">
                    <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <span className="leading-7">{condition}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="page-shell">
            <div className="grid gap-4 md:grid-cols-3">
              <article className="dashboard-surface p-6">
                <EyeOff className="h-6 w-6 text-primary" aria-hidden="true" />
                <h2 className="mt-8 font-display text-2xl font-semibold">Consentement d’abord</h2>
                <p className="mt-3 leading-7 text-muted-foreground">
                  Un profil n’entre dans le vivier employeur que si le diplômé l’active. Il
                  choisit aussi les attestations qu’il rend visibles et peut les masquer.
                </p>
              </article>
              <article className="dashboard-surface p-6">
                <HeartHandshake className="h-6 w-6 text-primary" aria-hidden="true" />
                <h2 className="mt-8 font-display text-2xl font-semibold">Décision humaine</h2>
                <p className="mt-3 leading-7 text-muted-foreground">
                  Les recommandations expliquent leurs critères. Elles aident à découvrir une
                  piste mais ne décident jamais qui mérite un entretien ou un emploi.
                </p>
              </article>
              <article className="dashboard-surface p-6">
                <Clock3 className="h-6 w-6 text-primary" aria-hidden="true" />
                <h2 className="mt-8 font-display text-2xl font-semibold">Données limitées</h2>
                <p className="mt-3 leading-7 text-muted-foreground">
                  Les signaux d’intégrité sont minimisés, réservés aux personnes autorisées et
                  soumis à une durée de conservation. Les réponses brutes ne sont pas publiques.
                </p>
              </article>
            </div>

            <div className="ci-pattern mt-12 overflow-hidden rounded-[2rem] bg-primary p-7 text-primary-foreground sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
              <div className="max-w-3xl">
                <h2 className="font-display text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                  Un contrôle vous semble flou ?
                </h2>
                <p className="mt-3 text-lg leading-8 text-primary-foreground/75">
                  Signalez-le. La confiance Yahnu dépend de règles compréhensibles par celles et
                  ceux qui les vivent.
                </p>
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
                <Button variant="terra" size="lg" asChild>
                  <Link href="/contact?intent=trust&source=other">
                    Nous écrire <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  asChild
                >
                  <Link href="/privacy-policy">Confidentialité</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
