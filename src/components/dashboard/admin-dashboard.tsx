"use client"

import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import { useAuth } from "@/context/auth-context"

export function AdminDashboard() {
  const { role } = useAuth();
  
  useEffect(() => {
    if (!role) return;

    if (role === 'support_staff') {
      redirect('/dashboard/support/center');
    } else if (role === 'content_manager') {
      redirect('/dashboard/content');
    } else {
      // Default for 'admin' and 'super_admin'
      redirect('/dashboard/admin/overview');
    }
  }, [role]);

  return null;
}
