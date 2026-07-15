import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function SchoolProfilePage() {
  return (
    <FeatureUnavailable
      title="School profile editing is not ready for production"
      description="School details, campus information, and branding are not connected to a production service yet. The former editor used example data and could report a save without persisting changes."
      actions={[
        { href: "/dashboard/partnerships", label: "Manage partnerships" },
        { href: "/dashboard/messages", label: "Open messages" },
      ]}
    />
  )
}
