import { FeatureUnavailable } from "@/components/dashboard/feature-unavailable"

export default function CompanyEventsPage() {
  return (
    <FeatureUnavailable
      title="Event management is being prepared for production"
      description="Event creation, invitations, RSVP totals, and audience targeting are not connected to a production data service yet. This screen has been intentionally disabled instead of displaying sample events or simulating saved changes."
      actions={[
        { href: "/dashboard/job-postings", label: "Manage job postings" },
        { href: "/dashboard/partnerships", label: "Manage partnerships" },
      ]}
    />
  )
}
