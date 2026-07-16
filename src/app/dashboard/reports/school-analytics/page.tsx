import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function SchoolAnalyticsPage() {
  return (
    <FeatureUnavailable
      title="Les analyses d’insertion arrivent bientôt"
      description="Les tendances d’insertion et les exports seront disponibles lorsqu’ils seront calculés depuis les données réelles de votre établissement. Les classements et graphiques fictifs ont été retirés."
      actions={[
        { href: "/dashboard/partnerships", label: "Gérer les partenariats" },
        { href: "/dashboard/reports", label: "Voir l’état des rapports" },
      ]}
    />
  )
}
