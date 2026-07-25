import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function SchoolProfilePage() {
  return (
    <FeatureUnavailable
      title="La modification du profil établissement arrive bientôt"
      description="Les informations du campus, les coordonnées et l’identité visuelle ne sont pas encore reliées à un service d’enregistrement fiable. Aucun exemple fictif ne remplace vos vraies données."
      actions={[
        { href: "/dashboard/partnerships", label: "Gérer les partenariats" },
        { href: "/dashboard/messages", label: "Ouvrir la messagerie" },
      ]}
    />
  )
}
