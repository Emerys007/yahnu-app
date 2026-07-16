import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function CompanyEventsPage() {
  return (
    <FeatureUnavailable
      title="Les événements recruteur sont en préparation"
      description="La création d’événements, les invitations et les réponses ne sont pas encore reliées à la base de production. Cet écran reste volontairement transparent au lieu d’afficher de faux événements."
      actions={[
        { href: "/dashboard/job-postings", label: "Gérer les offres" },
        { href: "/dashboard/partnerships", label: "Gérer les partenariats" },
      ]}
    />
  )
}
