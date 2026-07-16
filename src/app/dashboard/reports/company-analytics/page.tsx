import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function CompanyAnalyticsPage() {
  return (
    <FeatureUnavailable
      title="Les analyses de recrutement arrivent bientôt"
      description="Les parcours de candidature, les délais de recrutement et les exports seront disponibles une fois calculés depuis les données de production. Les graphiques d’exemple et faux CSV ont été retirés."
      actions={[
        { href: "/dashboard/job-postings", label: "Gérer les offres" },
        { href: "/dashboard/reports", label: "Voir l’état des rapports" },
      ]}
    />
  )
}
