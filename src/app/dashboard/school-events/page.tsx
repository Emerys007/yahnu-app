import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function SchoolEventsPage() {
  return (
    <FeatureUnavailable
      title="Les événements campus sont en préparation"
      description="Les événements, les publics invités et les réponses ne sont pas encore reliés à la base de production. Aucun exemple fictif ne remplace les vraies activités de votre établissement."
      actions={[
        { href: "/dashboard/partnerships", label: "Gérer les partenariats" },
        { href: "/dashboard/messages", label: "Ouvrir la messagerie" },
      ]}
    />
  )
}
