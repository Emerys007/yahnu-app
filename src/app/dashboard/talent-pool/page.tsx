import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function TalentPoolPage() {
  return (
    <FeatureUnavailable
      title="Talent discovery is not ready for production"
      description="Candidate search, availability signals, and outreach need a consent-aware production data service before they can be offered. Example graduate profiles and client-side filters have been removed."
      actions={[
        { href: "/dashboard/job-postings", label: "Manage job postings" },
        { href: "/dashboard/partnerships", label: "Manage partnerships" },
      ]}
    />
  )
}
