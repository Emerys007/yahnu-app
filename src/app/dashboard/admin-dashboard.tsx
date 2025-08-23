
"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type Role } from "@/context/auth-context"

export function AdminDashboard() {
  const { role } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!role) return;

    if (role === 'support_staff') {
      router.push('/dashboard/support/center');
    } else if (role === 'content_manager') {
      router.push('/dashboard/content');
    } else {
      // Default for 'admin' and 'super_admin'
      router.push('/dashboard/admin/overview');
    }
  }, [role, router]);

  // Return null or a loading spinner while redirecting
  return null;
}
