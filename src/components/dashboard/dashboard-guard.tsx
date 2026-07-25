"use client";

import * as React from "react";
import { ShieldAlert } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { canAccessDashboardRoute } from "@/lib/dashboard-navigation";

export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPathname = pathname ?? "/dashboard";
  const router = useRouter();
  const { user, loading, role } = useAuth();

  React.useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(currentPathname)}`);
  }, [currentPathname, loading, router, user]);

  if (loading || !user) {
    return <div className="min-h-screen bg-background p-6"><div className="mx-auto max-w-6xl animate-pulse space-y-5"><div className="h-12 w-64 rounded-xl bg-muted" /><div className="grid gap-5 md:grid-cols-3"><div className="h-48 rounded-2xl bg-muted" /><div className="h-48 rounded-2xl bg-muted md:col-span-2" /></div></div></div>;
  }

  if (!canAccessDashboardRoute(currentPathname, role)) {
    return <main className="grid min-h-screen place-items-center bg-background p-6"><div className="max-w-md text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"><ShieldAlert className="h-6 w-6" aria-hidden="true" /></span><h1 className="mt-5 text-2xl font-semibold tracking-tight">Accès réservé</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Votre compte n’a pas accès à cet espace. Si cela vous semble incorrect, contactez l’équipe Yahnu.</p><Button className="mt-6 rounded-xl" onClick={() => router.replace('/dashboard')}>Revenir au tableau de bord</Button></div></main>;
  }

  return <>{children}</>;
}
