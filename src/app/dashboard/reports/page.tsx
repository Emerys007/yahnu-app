

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { type Role } from '@/context/auth-context'

// This page redirects to the correct analytics page based on the user's role.
export default function AnalyticsRedirectPage() {
  const role = cookies().get('userRole')?.value as Role | undefined;

  if (role === 'school') {
    redirect('/dashboard/reports/school-analytics');
  }
  
  // Default for company and any other roles.
  redirect('/dashboard/reports/company-analytics')
}
