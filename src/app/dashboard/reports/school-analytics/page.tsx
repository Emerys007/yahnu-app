import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function SchoolAnalyticsPage() {
  return (
    <FeatureUnavailable
      title="School analytics are not connected to production data yet"
      description="Placement trends, employer rankings, and exports are unavailable until they are calculated from the production database. Sample charts and fictional CSV exports have been removed."
      actions={[
        { href: "/dashboard/partnerships", label: "Manage partnerships" },
        { href: "/dashboard/reports", label: "View reporting status" },
      ]}
    />
  )
}
