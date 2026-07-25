import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function GraduateEventsPage() {
  return (
    <FeatureUnavailable
      title="Les rendez-vous carrière arrivent bientôt"
      description="Le calendrier et les inscriptions ne sont pas encore reliés au service de production. Yahnu n’affiche donc aucun faux événement et n’enregistre aucune réponse uniquement dans votre navigateur."
      actions={[
        { href: "/jobs", label: "Explorer les offres ouvertes" },
        { href: "/dashboard/interview-prep", label: "Préparer un entretien" },
      ]}
    />
  )
}
