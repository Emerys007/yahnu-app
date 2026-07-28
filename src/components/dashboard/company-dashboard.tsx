"use client"

import {
  BriefcaseBusiness,
  FilePlus2,
  Handshake,
  MapPinned,
  MessagesSquare,
  SearchCheck,
  UsersRound,
} from "lucide-react"

import { RoleDashboard } from "@/components/dashboard/role-dashboard-ui"

export function CompanyDashboard() {
  return (
    <RoleDashboard
      closingDescription="Une offre claire, un processus respectueux et un retour utile font déjà la différence. Votre profil public, le vivier consenti, les événements et les rapports en direct sont prêts à soutenir ce travail."
      closingTitle="Faites de chaque recrutement une rencontre qui compte."
      description="Attirez de jeunes talents ivoiriens avec un recrutement clair, humain et adapté aux réalités de votre équipe."
      localNotes={[
        {
          title: "Préciser le lieu et la mobilité",
          description:
            "Indiquez clairement Abidjan, l’intérieur du pays, le télétravail possible et les déplacements attendus.",
          href: "/dashboard/job-postings",
          icon: MapPinned,
          tag: "Transparence",
        },
        {
          title: "Ouvrir la porte aux premiers emplois",
          description:
            "Distinguez les compétences indispensables de celles qui peuvent être apprises en poste.",
          href: "/dashboard/job-postings",
          icon: UsersRound,
          tag: "Jeunes talents",
        },
        {
          title: "Créer un lien avec les campus",
          description:
            "Explorez les partenariats avec universités et grandes écoles en Côte d’Ivoire.",
          href: "/dashboard/partnerships",
          icon: Handshake,
          tag: "Campus",
        },
      ]}
      locationLine="Recrutez à Abidjan et ouvrez vos opportunités aux talents de toutes les régions."
      primaryAction={{
        title: "Publier une offre",
        description: "Créez une offre claire et adaptée aux jeunes diplômés.",
        href: "/dashboard/job-postings",
        icon: FilePlus2,
      }}
      quickActions={[
        {
          title: "Offres d’emploi",
          description: "Créez, relisez et gérez vos opportunités depuis un seul espace.",
          href: "/dashboard/job-postings",
          icon: BriefcaseBusiness,
        },
        {
          title: "Candidatures",
          description: "Consultez les candidatures reçues et organisez les prochaines étapes.",
          href: "/dashboard/applicants",
          icon: SearchCheck,
        },
        {
          title: "Partenariats",
          description: "Développez des liens durables avec les établissements et organisations du pays.",
          href: "/dashboard/partnerships",
          icon: Handshake,
          label: "Écosystème",
        },
        {
          title: "Messages",
          description: "Échangez avec les candidats et partenaires depuis votre espace sécurisé.",
          href: "/dashboard/messages",
          icon: MessagesSquare,
        },
      ]}
      roadmap={[
        {
          step: "Étape 1",
          title: "Publier une offre qui va à l’essentiel",
          description: "Missions, attentes, lieu et processus : rendez chaque point facile à comprendre.",
          href: "/dashboard/job-postings",
          icon: FilePlus2,
        },
        {
          step: "Étape 2",
          title: "Répondre aux candidatures avec humanité",
          description: "Suivez les profils reçus et gardez un dialogue clair à chaque étape.",
          href: "/dashboard/applicants",
          icon: SearchCheck,
        },
        {
          step: "Étape 3",
          title: "Créer des passerelles avec les campus",
          description: "Structurez des partenariats autour de besoins concrets et de premiers emplois.",
          href: "/dashboard/partnerships",
          icon: Handshake,
        },
      ]}
      roleLabel="Espace recruteur · Côte d’Ivoire"
      secondaryAction={{
        title: "Créer des partenariats",
        description: "Développez votre réseau d’établissements et d’organisations partenaires.",
        href: "/dashboard/partnerships",
        icon: Handshake,
      }}
      title="Les talents ivoiriens avancent. Votre entreprise aussi."
    />
  )
}
