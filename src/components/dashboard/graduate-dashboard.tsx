"use client"

import {
  BadgeCheck,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  FileCheck2,
  FileText,
  MapPinned,
  MessagesSquare,
  Search,
  UserRound,
} from "lucide-react"

import { RoleDashboard } from "@/components/dashboard/role-dashboard-ui"

export function GraduateDashboard() {
  return (
    <RoleDashboard
      closingDescription="Commencez par une action simple aujourd’hui : ajuster votre profil, repérer une opportunité ou préparer votre prochain échange."
      closingTitle="Votre parcours mérite un premier pas concret."
      description="Transformez votre diplôme en trajectoire professionnelle, avec des outils pensés pour les réalités du marché ivoirien et votre rythme."
      localNotes={[
        {
          title: "Explorer au-delà d’Abidjan",
          description:
            "Élargissez vos critères vers Bouaké, Yamoussoukro et San-Pédro selon votre mobilité.",
          href: "/dashboard/jobs",
          icon: MapPinned,
          tag: "Mobilité",
        },
        {
          title: "Parler de vos projets d’école",
          description:
            "Présentez vos projets concrets, stages et engagements comme des preuves de savoir-faire.",
          href: "/dashboard/profile",
          icon: BookOpenCheck,
          tag: "Profil",
        },
        {
          title: "Préparer un entretien local",
          description:
            "Travaillez une présentation claire en français et des exemples liés au contexte ivoirien.",
          href: "/dashboard/interview-prep",
          icon: MessagesSquare,
          tag: "Entretien",
        },
      ]}
      locationLine="D’Abidjan à Bouaké, votre projet peut prendre plusieurs chemins."
      primaryAction={{
        title: "Explorer les opportunités",
        description: "Recherchez les postes qui correspondent à votre profil.",
        href: "/dashboard/jobs",
        icon: Search,
      }}
      quickActions={[
        {
          title: "Mon profil",
          description: "Racontez votre formation, vos projets et vos ambitions avec précision.",
          href: "/dashboard/profile",
          icon: UserRound,
          label: "À soigner",
        },
        {
          title: "Offres d’emploi",
          description: "Filtrez les opportunités selon votre domaine et votre mobilité.",
          href: "/dashboard/jobs",
          icon: BriefcaseBusiness,
        },
        {
          title: "Mes candidatures",
          description: "Retrouvez les candidatures réellement envoyées depuis votre espace.",
          href: "/dashboard/applications",
          icon: FileText,
        },
        {
          title: "Compétences vérifiées",
          description: "Passez un Skills Check et créez une attestation Yahnu privée.",
          href: "/dashboard/skills-checks",
          icon: BadgeCheck,
        },
        {
          title: "Préparation entretien",
          description: "Structurez vos réponses et gagnez en assurance avant le jour J.",
          href: "/dashboard/interview-prep",
          icon: MessagesSquare,
        },
        {
          title: "Entreprises",
          description: "Découvrez les organisations et secteurs présents sur Yahnu.",
          href: "/dashboard/companies",
          icon: Building2,
          label: "À explorer",
        },
      ]}
      roadmap={[
        {
          step: "Étape 1",
          title: "Construire un profil qui vous ressemble",
          description: "Valorisez votre diplôme, vos projets, vos stages et les compétences acquises.",
          href: "/dashboard/profile",
          icon: UserRound,
        },
        {
          step: "Étape 2",
          title: "Cibler les bonnes opportunités",
          description: "Cherchez par métier, secteur et ville sans vous disperser.",
          href: "/dashboard/jobs",
          icon: BriefcaseBusiness,
        },
        {
          step: "Étape 3",
          title: "Suivre chaque candidature",
          description: "Gardez vos démarches au même endroit et préparez la suite sereinement.",
          href: "/dashboard/applications",
          icon: FileCheck2,
        },
      ]}
      roleLabel="Espace diplômé · Côte d’Ivoire"
      secondaryAction={{
        title: "Affiner mon profil",
        description: "Mettez en avant vos compétences et votre parcours.",
        href: "/dashboard/profile",
        icon: UserRound,
      }}
      title="Votre talent a sa place ici. Donnez-lui de l’élan."
    />
  )
}
