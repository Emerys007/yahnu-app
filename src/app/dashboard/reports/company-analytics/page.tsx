import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function CompanyAnalyticsPage() {
  return (
    <FeatureUnavailable
      title="Company analytics are not connected to production data yet"
      description="Applicant funnels, hiring rates, and exports are unavailable until they are calculated from the production database. Sample charts and fictional CSV exports have been removed."
      actions={[
        { href: "/dashboard/job-postings", label: "Manage job postings" },
        { href: "/dashboard/reports", label: "View reporting status" },
      ]}
    />
  )
}
