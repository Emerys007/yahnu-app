import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function TalentPoolPage() {
  return (
    <FeatureUnavailable
      title="La découverte de talents arrive bientôt"
      description="La recherche de candidats et la prise de contact exigent un service de production qui respecte le consentement de chaque diplômé. Les faux profils et filtres stockés dans le navigateur ont été retirés."
      actions={[
        { href: "/dashboard/job-postings", label: "Gérer les offres" },
        { href: "/dashboard/partnerships", label: "Gérer les partenariats" },
      ]}
    />
  )
}
