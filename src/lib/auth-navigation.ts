import type { Role } from "@/lib/auth-types";

export type DashboardDestination = `/dashboard${string}`;
export type AppDestination = `/${string}`;
export type DashboardAccessCheck = (pathname: string, role: Role) => boolean;

const DASHBOARD_ORIGIN = "https://yahnu.local";
const MAX_RETURN_TO_LENGTH = 2_048;

const roleDashboardHomes: Record<Role, DashboardDestination> = {
  graduate: "/dashboard",
  company: "/dashboard",
  school: "/dashboard",
  admin: "/dashboard/admin/overview",
  super_admin: "/dashboard/admin/overview",
  content_manager: "/dashboard/content",
  content_moderator: "/dashboard/content",
  support_staff: "/dashboard/support/center",
};

export function getRoleDashboardHome(role: Role): DashboardDestination {
  return roleDashboardHomes[role];
}

/**
 * Accept only same-origin application paths. The raw and encoded separator checks
 * intentionally reject ambiguous paths before either Next.js or a browser gets
 * a chance to normalize them differently.
 */
export function safeAppReturnTo(value: string | null | undefined): AppDestination | null {
  const rawPath = value?.split(/[?#]/, 1)[0];
  if (
    !value
    || value.length > MAX_RETURN_TO_LENGTH
    || !value.startsWith("/")
    || value.startsWith("//")
    || value.includes("\\")
    || /[\u0000-\u001f\u007f]/.test(value)
    || !rawPath
    || /%(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f)/i.test(rawPath)
  ) {
    return null;
  }

  try {
    const parsed = new URL(value, DASHBOARD_ORIGIN);
    if (
      parsed.origin !== DASHBOARD_ORIGIN
      || parsed.username
      || parsed.password
      || !parsed.pathname.startsWith("/")
      || parsed.pathname.startsWith("//")
    ) {
      return null;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}` as AppDestination;
  } catch {
    return null;
  }
}

export function safeDashboardReturnTo(value: string | null | undefined): DashboardDestination | null {
  const safePath = safeAppReturnTo(value);
  if (!safePath) return null;

  const parsed = new URL(safePath, DASHBOARD_ORIGIN);
  return parsed.pathname === "/dashboard" || parsed.pathname.startsWith("/dashboard/")
    ? safePath as DashboardDestination
    : null;
}

export function resolveRoleDashboardDestination(
  role: Role,
  requestedPath: string | null | undefined,
  canAccess: DashboardAccessCheck,
): DashboardDestination {
  const home = getRoleDashboardHome(role);
  const safePath = safeDashboardReturnTo(requestedPath);
  if (!safePath) return home;

  const parsed = new URL(safePath, DASHBOARD_ORIGIN);
  if (parsed.pathname === "/dashboard") return home;

  return canAccess(parsed.pathname, role) ? safePath : home;
}

export function resolveRolePostLoginDestination(
  role: Role,
  requestedPath: string | null | undefined,
  canAccess: DashboardAccessCheck,
): AppDestination {
  const safePath = safeAppReturnTo(requestedPath);
  if (!safePath) return getRoleDashboardHome(role);

  const parsed = new URL(safePath, DASHBOARD_ORIGIN);
  if (parsed.pathname === "/dashboard" || parsed.pathname.startsWith("/dashboard/")) {
    return resolveRoleDashboardDestination(role, safePath, canAccess);
  }

  return safePath;
}
