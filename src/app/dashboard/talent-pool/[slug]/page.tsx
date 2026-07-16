import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function TalentProfilePage() {
  return (
    <FeatureUnavailable
      title="Les profils individuels ne sont pas encore disponibles"
      description="Les coordonnées et les invitations directes restent masquées tant que le service de talents ne garantit pas le consentement et les contrôles d’accès nécessaires."
      actions={[
        { href: "/dashboard/talent-pool", label: "Voir l’état du vivier" },
        { href: "/dashboard/job-postings", label: "Gérer les offres" },
      ]}
    />
  )
}
