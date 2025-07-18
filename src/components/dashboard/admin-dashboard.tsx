
"use client"
// This component now simply redirects to the correct overview page.
// The actual content is handled by the page itself.
import { redirect } from 'next/navigation';

export function AdminDashboard() {
  redirect('/dashboard/admin/overview');
}
