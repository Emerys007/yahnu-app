

import { redirect } from 'next/navigation'

// This page now redirects to the company analytics page by default.
// The custom report builder is a separate, more advanced feature.
export default function AnalyticsRedirectPage() {
  redirect('/dashboard/reports/company-analytics')
}
