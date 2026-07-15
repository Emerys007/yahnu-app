import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function SchoolEventsPage() {
  return (
    <FeatureUnavailable
      title="Event management is being prepared for production"
      description="School events, invite audiences, and RSVP totals are not backed by a production data service yet. This screen has been intentionally disabled instead of showing example events or treating local changes as saved."
      actions={[
        { href: "/dashboard/partnerships", label: "Manage partnerships" },
        { href: "/dashboard/messages", label: "Open messages" },
      ]}
    />
  )
}
