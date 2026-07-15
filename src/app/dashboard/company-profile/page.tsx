import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function CompanyProfilePage() {
  return (
    <FeatureUnavailable
      title="Company profile editing is not ready for production"
      description="Company details, logos, and profile updates are not connected to a production service yet. The former form used example values and could show a successful save without persisting anything."
      actions={[
        { href: "/dashboard/job-postings", label: "Manage job postings" },
        { href: "/dashboard/partnerships", label: "Manage partnerships" },
      ]}
    />
  )
}
