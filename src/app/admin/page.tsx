import { redirect } from "next/navigation";

import { adminRoles } from "@/lib/auth-types";
import { resolveDashboardDestination } from "@/lib/dashboard-navigation";
import { getCurrentUser } from "@/lib/server/auth";
import { privatePageMetadata } from "@/lib/seo";

export const metadata = privatePageMetadata(
  "Administration Yahnu",
  "Point d’entrée sécurisé pour l’équipe d’administration Yahnu.",
);

export default async function AdminEntryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?entry=admin&next=%2Fdashboard%2Fadmin%2Foverview");
  }

  if (adminRoles.has(user.role)) {
    redirect("/dashboard/admin/overview");
  }

  redirect(resolveDashboardDestination(user.role));
}
