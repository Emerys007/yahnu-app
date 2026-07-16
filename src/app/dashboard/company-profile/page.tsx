import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function CompanyProfilePage() {
  return (
    <FeatureUnavailable
      title="La modification du profil entreprise arrive bientôt"
      description="Les coordonnées, le logo et la présentation de votre entreprise ne sont pas encore reliés à un service d’enregistrement fiable. Yahnu préfère vous le dire clairement plutôt que d’afficher un faux succès."
      actions={[
        { href: "/dashboard/job-postings", label: "Gérer les offres" },
        { href: "/dashboard/partnerships", label: "Gérer les partenariats" },
      ]}
    />
  )
}
