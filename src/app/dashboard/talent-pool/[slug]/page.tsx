import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function TalentProfilePage() {
  return (
    <FeatureUnavailable
      title="Talent profiles are not available yet"
      description="Individual candidate profiles, direct contact details, and invite actions have been removed until the talent service is production-backed and enforces the required consent and access controls."
      actions={[
        { href: "/dashboard/talent-pool", label: "View talent pool status" },
        { href: "/dashboard/job-postings", label: "Manage job postings" },
      ]}
    />
  )
}
