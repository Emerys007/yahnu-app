"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BrainCircuit,
  BriefcaseBusiness,
  Code2,
  GraduationCap,
  HandHeart,
  Leaf,
  Route,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const practices = [
  {
    id: "frontend-basics",
    title: "Bases du développement frontend",
    description:
      "Révise React, JavaScript et CSS à travers des situations proches d’un premier poste à Abidjan.",
    questions: 8,
    time: "10–12 min",
    icon: Code2,
    category: "Numérique",
    accent: "bg-lagoon/10 text-lagoon",
  },
  {
    id: "financial-analysis",
    title: "Analyse financière en FCFA",
    description:
      "Entraîne-toi sur les bilans, la trésorerie et les ratios d’une jeune PME ivoirienne.",
    questions: 8,
    time: "10–12 min",
    icon: Banknote,
    category: "Finance",
    accent: "bg-primary/10 text-primary",
  },
  {
    id: "agronomy-principles",
    title: "Agronomie et filières locales",
    description:
      "Teste tes repères sur les sols, le cacao, l’anacarde et les pratiques agricoles durables.",
    questions: 8,
    time: "10–12 min",
    icon: Leaf,
    category: "Agriculture",
    accent: "bg-primary/10 text-primary",
  },
  {
    id: "supply-chain",
    title: "Logistique et chaîne d’approvisionnement",
    description:
      "Travaille des cas inspirés du port d’Abidjan, des stocks et du transport interurbain.",
    questions: 8,
    time: "10–12 min",
    icon: Route,
    category: "Opérations",
    accent: "bg-terra/10 text-terra",
  },
  {
    id: "customer-service",
    title: "Relation client professionnelle",
    description:
      "Adopte les bons réflexes face aux demandes d’un client, en agence comme sur WhatsApp.",
    questions: 8,
    time: "8–10 min",
    icon: HandHeart,
    category: "Compétences humaines",
    accent: "bg-soleil/20 text-cocoa",
  },
  {
    id: "cognitive-aptitude",
    title: "Raisonnement et résolution de problèmes",
    description:
      "Échauffe ta logique avec des situations de budget, de trajet et d’organisation du quotidien.",
    questions: 8,
    time: "8–10 min",
    icon: BrainCircuit,
    category: "Compétences humaines",
    accent: "bg-lagoon/10 text-lagoon",
  },
] as const;

export default function AssessmentsPage() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="space-y-8 pb-10">
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[1.75rem] border bg-cocoa px-5 py-7 text-ivory shadow-soft sm:px-8 sm:py-9"
      >
        <div className="ci-pattern absolute inset-0 opacity-10" aria-hidden="true" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <Badge className="mb-4 border-white/20 bg-white/10 text-ivory hover:bg-white/10">
              <GraduationCap className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Studio d’entraînement Yahnu
            </Badge>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Entraîne-toi avant le vrai entretien
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ivory/75 sm:text-base">
              Des exercices courts, pensés pour le marché ivoirien, afin de repérer tes acquis et les sujets à revoir à ton rythme.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <BriefcaseBusiness className="h-8 w-8 shrink-0 text-terra" aria-hidden="true" />
            <p className="max-w-xs text-sm leading-5 text-ivory/80">
              <strong className="block text-ivory">Exercices libres et privés</strong>
              Aucun résultat n’est envoyé aux recruteurs.
            </p>
          </div>
        </div>
      </motion.section>

      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/[0.09] via-background to-lagoon/[0.09] p-5 sm:p-6">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex max-w-2xl gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
              <BadgeCheck className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="section-kicker">Deuxième parcours</p>
              <h2 className="mt-1 font-display text-xl font-semibold">
                Yahnu Skills Check — verified conditions
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Pour créer une Yahnu skills attestation privée : questions randomisées,
                temps serveur et notation sans exposer les réponses correctes au navigateur.
              </p>
            </div>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/dashboard/skills-checks">
              Découvrir les Skills Checks
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>

      <section aria-labelledby="practice-notice" className="rounded-2xl border border-lagoon/20 bg-lagoon/5 p-5">
        <div className="flex gap-3">
          <BrainCircuit className="mt-0.5 h-5 w-5 shrink-0 text-lagoon" aria-hidden="true" />
          <div>
            <h2 id="practice-notice" className="font-display font-semibold text-foreground">
              Ici, tu t’exerces — tu ne passes pas une certification
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Il n’y a ni surveillance, ni caméra, ni enregistrement. Le score reste dans cet onglet pour ton retour immédiat ; il n’est pas vérifié, ne crée aucun badge et n’apparaît pas sur ton profil.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="practice-list-title">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Choisis ton terrain</p>
            <h2 id="practice-list-title" className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Exercices disponibles
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">6 thèmes · sans limite de tentative</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {practices.map((practice, index) => (
            <motion.div
              key={practice.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : index * 0.04 }}
              className="h-full"
            >
              <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lift">
                <CardHeader>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className={`grid h-11 w-11 place-items-center rounded-2xl ${practice.accent}`}>
                      <practice.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <Badge variant="outline">{practice.category}</Badge>
                  </div>
                  <CardTitle className="text-xl">{practice.title}</CardTitle>
                  <CardDescription className="leading-6">{practice.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{practice.questions} questions</span>
                    <span aria-hidden="true">•</span>
                    <span>{practice.time}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full justify-between" data-hs-event-name="practice_started">
                    <Link href={`/dashboard/assessment/${practice.id}`}>
                      Commencer l’exercice
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
