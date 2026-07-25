import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function ReportsPage() {
  return (
    <FeatureUnavailable
      title="Les rapports seront bientôt reliés aux données réelles"
      description="Les analyses et les exports reviendront lorsqu’ils seront calculés depuis PostgreSQL avec les bons contrôles d’accès. Yahnu n’affiche ici aucun graphique ou téléchargement fabriqué."
      actions={[{ href: "/dashboard", label: "Retour au tableau de bord" }]}
    />
  )
}
