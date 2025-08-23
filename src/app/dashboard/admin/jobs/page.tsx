
import { redirect } from 'next/navigation'

// This route is not in the spec, redirecting to a more appropriate admin page.
export default function AdminJobs() {
  redirect('/dashboard/admin/overview')
}
