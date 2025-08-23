
import { redirect } from 'next/navigation'

// This route is obsolete. Content creation is now handled by the Content Manager role
// at /dashboard/content
export default function ContentModerationPage() {
  redirect('/dashboard/content')
}
