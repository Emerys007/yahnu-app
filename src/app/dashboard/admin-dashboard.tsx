
"use client"

import { redirect } from 'next/navigation';
import { useAuth, type Role } from "@/context/auth-context"

export function AdminDashboard() {
  const { role } = useAuth();
  
  if (role === 'support_staff') {
    redirect('/dashboard/support/center');
  }
  
  if (role === 'content_manager') {
    redirect('/dashboard/content');
  }

  // Default for 'admin' and 'super_admin'
  redirect('/dashboard/admin/overview');
}
