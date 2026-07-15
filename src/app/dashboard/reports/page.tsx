import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function ReportsPage() {
  return (
    <FeatureUnavailable
      title="Reporting is not connected to production data yet"
      description="Analytics, generated reports, and file exports will return when they are backed by the production database and access controls. No fabricated metrics, report history, or downloads are shown here."
      actions={[{ href: "/dashboard", label: "Return to dashboard" }]}
    />
  )
}
