"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/auth-context"
import { useLocalization } from "@/context/localization-context"
import { getRoleDashboardHome } from "@/lib/dashboard-navigation"

export function AdminDashboard() {
  const { role } = useAuth();
  const { language } = useLocalization();
  const router = useRouter();
  
  useEffect(() => {
    if (!role) return;
    router.replace(getRoleDashboardHome(role));
  }, [role, router]);

  return (
    <div className="mx-auto max-w-6xl animate-pulse space-y-5" role="status" aria-live="polite">
      <div className="h-12 w-64 max-w-full rounded-xl bg-muted" />
      <div className="grid gap-5 md:grid-cols-3">
        <div className="h-48 rounded-2xl bg-muted" />
        <div className="h-48 rounded-2xl bg-muted md:col-span-2" />
      </div>
      <span className="sr-only">
        {language === "en" ? "Opening your dashboard" : "Ouverture de votre tableau de bord"}
      </span>
    </div>
  );
}
