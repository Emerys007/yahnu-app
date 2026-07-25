import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function CustomReportGeneratorPage() {
  return (
    <FeatureUnavailable
      title="La création de rapports personnalisés arrive bientôt"
      description="Les aperçus et fichiers CSV étaient auparavant produits à partir d’exemples stockés dans le navigateur. Ils restent désactivés jusqu’à la mise en place d’un service d’export fiable."
      actions={[{ href: "/dashboard/reports", label: "Voir l’état des rapports" }]}
    />
  )
}
