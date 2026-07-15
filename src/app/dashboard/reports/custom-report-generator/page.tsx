import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function CustomReportGeneratorPage() {
  return (
    <FeatureUnavailable
      title="Custom report generation is not available yet"
      description="Saved report lists, previews, and CSV downloads were previously generated from browser-only example data. They are disabled until a production reporting service and export pipeline are available."
      actions={[{ href: "/dashboard/reports", label: "View reporting status" }]}
    />
  )
}
