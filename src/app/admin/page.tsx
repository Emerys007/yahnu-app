import { redirect } from "next/navigation";

import { adminRoles } from "@/lib/auth-types";
import { getRoleDashboardHome } from "@/lib/auth-navigation";
import { getCurrentUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

const ADMIN_OVERVIEW = "/dashboard/admin/overview";

export default async function AdminEntryPage() {
  const user = await getCurrentUser();

  if (!user) {
    const parameters = new URLSearchParams({
      entry: "admin",
      next: ADMIN_OVERVIEW,
    });
    redirect(`/login?${parameters}`);
  }

  if (adminRoles.has(user.role)) {
    redirect(ADMIN_OVERVIEW);
  }

  redirect(getRoleDashboardHome(user.role));
}
