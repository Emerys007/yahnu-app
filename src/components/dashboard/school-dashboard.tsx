"use client"

import {
  GraduationCap,
  Handshake,
  MapPinned,
  MessageCircleMore,
  UserRoundCheck,
  UsersRound,
} from "lucide-react"

import { RoleDashboard } from "@/components/dashboard/role-dashboard-ui"

export function SchoolDashboard() {
  return (
    <RoleDashboard
      closingDescription="Un profil diplômé bien accompagné et un partenariat bien ciblé peuvent ouvrir une vraie prochaine étape. Bientôt : profil établissement, événements et rapports."
      closingTitle="Prolongez l’impact de l’école au-delà du diplôme."
      description="Reliez vos diplômés au monde professionnel ivoirien et animez une communauté qui continue d’avancer après le campus."
      localNotes={[
        {
          title: "Relier campus et bassins d’emploi",
          description:
            "Pensez les actions entre Abidjan, Bouaké, Yamoussoukro, Korhogo et San-Pédro selon vos filières.",
          href: "/dashboard/partnerships",
          icon: MapPinned,
          tag: "Territoires",
        },
        {
          title: "Faire vivre le réseau des anciens",
          description:
            "Invitez des diplômés à partager leurs premiers pas, leurs métiers et leurs conseils.",
          href: "/dashboard/graduates",
          icon: UsersRound,
          tag: "Communauté",
        },
        {
          title: "Donner la parole aux employeurs",
          description:
            "Échangez directement avec vos partenaires sur les compétences recherchées en Côte d’Ivoire.",
          href: "/dashboard/messages",
          icon: MessageCircleMore,
          tag: "Employabilité",
        },
      ]}
      locationLine="Du campus au premier emploi, créez des passerelles dans toute la Côte d’Ivoire."
      primaryAction={{
        title: "Accompagner les diplômés",
        description: "Retrouvez les diplômés rattachés à votre établissement.",
        href: "/dashboard/graduates",
        icon: UserRoundCheck,
      }}
      quickActions={[
        {
          title: "Diplômés",
          description: "Accompagnez les profils réellement associés à votre établissement.",
          href: "/dashboard/graduates",
          icon: GraduationCap,
        },
        {
          title: "Partenariats",
          description: "Développez des liens durables avec des entreprises et institutions.",
          href: "/dashboard/partnerships",
          icon: Handshake,
          label: "Écosystème",
        },
        {
          title: "Messages",
          description: "Échangez avec votre communauté depuis votre espace sécurisé.",
          href: "/dashboard/messages",
          icon: MessageCircleMore,
        },
      ]}
      roadmap={[
        {
          step: "Étape 1",
          title: "Valider et accompagner vos diplômés",
          description: "Retrouvez les profils rattachés à votre établissement et vérifiez leur parcours.",
          href: "/dashboard/graduates",
          icon: UserRoundCheck,
        },
        {
          step: "Étape 2",
          title: "Mobiliser votre communauté",
          description: "Partagez des informations utiles et gardez le lien avec vos diplômés.",
          href: "/dashboard/messages",
          icon: MessageCircleMore,
        },
        {
          step: "Étape 3",
          title: "Créer des passerelles avec les employeurs",
          description: "Structurez partenariats et événements autour de besoins concrets.",
          href: "/dashboard/partnerships",
          icon: Handshake,
        },
      ]}
      roleLabel="Espace établissement · Côte d’Ivoire"
      secondaryAction={{
        title: "Créer des partenariats",
        description: "Développez votre réseau d’entreprises partenaires.",
        href: "/dashboard/partnerships",
        icon: Handshake,
      }}
      title="Un diplôme ouvre une porte. Votre réseau ouvre l’horizon."
    />
  )
}
