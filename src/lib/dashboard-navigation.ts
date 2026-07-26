import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Briefcase,
  Building,
  Calendar,
  ClipboardList,
  FileText,
  Handshake,
  HeartPulse,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  MessageSquare,
  Newspaper,
  School,
  Search,
  Settings,
  Shield,
  Ticket,
  User,
  UserCheck,
  UserCog,
  Users2,
} from "lucide-react";

import type { Role } from "@/lib/auth-types";
import {
  getRoleDashboardHome,
  resolveRolePostLoginDestination,
  resolveRoleDashboardDestination,
} from "@/lib/auth-navigation";

export type DashboardLocale = "fr" | "en";
export type DashboardNavPlacement = "main" | "footer";
export type DashboardNavGroupId =
  | "overview"
  | "communication"
  | "career"
  | "recruitment"
  | "organization"
  | "administration"
  | "content"
  | "support"
  | "analytics"
  | "account";

export type DashboardLabel = {
  key: `dashboard.nav.${string}`;
  fr: string;
  en: string;
};

type DashboardNavigationConfig = {
  group: DashboardNavGroupId;
  order: number;
  placement?: DashboardNavPlacement;
  roles?: readonly Role[];
  searchable?: boolean;
};

export type DashboardRouteDefinition = {
  id: string;
  path: `/dashboard${string}`;
  roles: readonly Role[];
  icon?: LucideIcon;
  label?: DashboardLabel;
  navigation?: DashboardNavigationConfig;
};

export type DashboardNavigationRoute = DashboardRouteDefinition & {
  icon: LucideIcon;
  label: DashboardLabel;
  navigation: DashboardNavigationConfig;
};

export type DashboardNavigationGroup = {
  id: DashboardNavGroupId;
  label: DashboardLabel;
  items: DashboardNavigationRoute[];
};

type Translate = (key: string) => string;

const ALL_ROLES = [
  "graduate",
  "company",
  "school",
  "admin",
  "super_admin",
  "content_manager",
  "content_moderator",
  "support_staff",
] as const satisfies readonly Role[];
const CORE_ROLES = ["graduate", "company", "school"] as const satisfies readonly Role[];
const ADMIN_ROLES = ["admin", "super_admin"] as const satisfies readonly Role[];
const CONTENT_ROLES = ["admin", "super_admin", "content_manager", "content_moderator"] as const satisfies readonly Role[];
const SUPPORT_ROLES = ["admin", "super_admin", "support_staff"] as const satisfies readonly Role[];
const MESSAGING_ROLES = ["graduate", "company", "school", "admin", "super_admin", "support_staff"] as const satisfies readonly Role[];
const ORGANIZATION_ROLES = ["company", "school"] as const satisfies readonly Role[];
const REPORTING_ROLES = ["company", "school", "admin", "super_admin"] as const satisfies readonly Role[];
const CONTENT_STAFF_ROLES = ["content_manager", "content_moderator"] as const satisfies readonly Role[];

const groupLabels: Record<DashboardNavGroupId, DashboardLabel> = {
  overview: { key: "dashboard.nav.dashboard", fr: "Tableau de bord", en: "Dashboard" },
  communication: { key: "dashboard.nav.communication", fr: "Échanges", en: "Communication" },
  career: { key: "dashboard.nav.career", fr: "Mon parcours", en: "My career" },
  recruitment: { key: "dashboard.nav.recruitment", fr: "Recrutement", en: "Recruitment" },
  organization: { key: "dashboard.nav.organization", fr: "Organisation", en: "Organization" },
  administration: { key: "dashboard.nav.admin", fr: "Administration", en: "Administration" },
  content: { key: "dashboard.nav.content", fr: "Contenu", en: "Content" },
  support: { key: "dashboard.nav.support_tools", fr: "Support", en: "Support" },
  analytics: { key: "dashboard.nav.reporting", fr: "Analyses", en: "Analytics" },
  account: { key: "dashboard.nav.general", fr: "Compte", en: "Account" },
};

const groupOrder: readonly DashboardNavGroupId[] = [
  "overview",
  "communication",
  "career",
  "recruitment",
  "organization",
  "administration",
  "content",
  "support",
  "analytics",
  "account",
];

// This is the single source of truth for dashboard access and discoverable navigation.
// Dynamic route templates mirror their actual Next.js route folders and are never linked directly.
export const dashboardRouteRegistry: readonly DashboardRouteDefinition[] = [
  {
    id: "dashboard-home",
    path: "/dashboard",
    roles: ALL_ROLES,
    icon: LayoutDashboard,
    label: { key: "dashboard.nav.home", fr: "Tableau de bord", en: "Dashboard" },
    navigation: { group: "overview", order: 10, roles: [...CORE_ROLES, ...CONTENT_STAFF_ROLES] },
  },

  { id: "admin-root", path: "/dashboard/admin", roles: ADMIN_ROLES },
  {
    id: "admin-overview",
    path: "/dashboard/admin/overview",
    roles: ADMIN_ROLES,
    icon: LayoutDashboard,
    label: { key: "dashboard.nav.admin_overview", fr: "Vue d’ensemble", en: "Overview" },
    navigation: { group: "overview", order: 10 },
  },
  { id: "admin-analytics", path: "/dashboard/admin/analytics", roles: ADMIN_ROLES },
  { id: "admin-announcements", path: "/dashboard/admin/announcements", roles: ADMIN_ROLES },
  {
    id: "admin-blog",
    path: "/dashboard/admin/blog",
    roles: ADMIN_ROLES,
    icon: Newspaper,
    label: { key: "dashboard.nav.blog", fr: "Journal Yahnu", en: "Yahnu journal" },
    navigation: { group: "content", order: 10 },
  },
  {
    id: "admin-content-moderation",
    path: "/dashboard/admin/content-moderation",
    roles: ADMIN_ROLES,
    icon: Shield,
    label: { key: "dashboard.nav.content_moderation", fr: "Modération", en: "Content moderation" },
    navigation: { group: "content", order: 20 },
  },
  {
    id: "admin-jobs",
    path: "/dashboard/admin/jobs",
    roles: CONTENT_ROLES,
    icon: Briefcase,
    label: { key: "dashboard.nav.market_watch", fr: "Veille emploi", en: "Job watch" },
    navigation: { group: "content", order: 40 },
  },
  { id: "admin-knowledge-base", path: "/dashboard/admin/knowledge-base-editor", roles: ADMIN_ROLES },
  {
    id: "admin-manage-team",
    path: "/dashboard/admin/manage-team",
    roles: ADMIN_ROLES,
    icon: Users2,
    label: { key: "dashboard.nav.manage_team", fr: "Équipe Yahnu", en: "Yahnu team" },
    navigation: { group: "administration", order: 20, roles: ["super_admin"] },
  },
  { id: "admin-system-health", path: "/dashboard/admin/system-health", roles: ADMIN_ROLES },
  { id: "admin-team", path: "/dashboard/admin/team", roles: ADMIN_ROLES },
  {
    id: "admin-user-management",
    path: "/dashboard/admin/user-management",
    roles: ADMIN_ROLES,
    icon: UserCog,
    label: { key: "dashboard.nav.user_management", fr: "Utilisateurs", en: "User management" },
    navigation: { group: "administration", order: 10 },
  },
  { id: "admin-users", path: "/dashboard/admin/users", roles: ADMIN_ROLES },

  {
    id: "messages",
    path: "/dashboard/messages",
    roles: MESSAGING_ROLES,
    icon: MessageSquare,
    label: { key: "dashboard.nav.messages", fr: "Messagerie", en: "Messages" },
    navigation: { group: "communication", order: 10, roles: [...CORE_ROLES, "support_staff"] },
  },
  {
    id: "graduate-profile",
    path: "/dashboard/profile",
    roles: ["graduate"],
    icon: User,
    label: { key: "dashboard.nav.profile", fr: "Mon profil", en: "My profile" },
    navigation: { group: "career", order: 10 },
  },
  {
    id: "graduate-jobs",
    path: "/dashboard/jobs",
    roles: ["graduate"],
    icon: Briefcase,
    label: { key: "dashboard.nav.jobs", fr: "Opportunités", en: "Opportunities" },
    navigation: { group: "career", order: 20 },
  },
  {
    id: "graduate-applications",
    path: "/dashboard/applications",
    roles: ["graduate"],
    icon: FileText,
    label: { key: "dashboard.nav.my_applications", fr: "Mes candidatures", en: "My applications" },
    navigation: { group: "career", order: 30 },
  },
  { id: "graduate-companies", path: "/dashboard/companies", roles: ["graduate"] },
  { id: "graduate-events", path: "/dashboard/events", roles: ["graduate"] },
  {
    id: "graduate-assessments",
    path: "/dashboard/assessments",
    roles: ["graduate"],
    icon: Award,
    label: { key: "dashboard.nav.assessments", fr: "Tests & certifications", en: "Tests & certifications" },
    navigation: { group: "career", order: 60 },
  },
  { id: "graduate-assessment", path: "/dashboard/assessment/[testId]", roles: ["graduate"] },
  { id: "graduate-assessment-result", path: "/dashboard/assessment/[testId]/result", roles: ["graduate"] },
  {
    id: "graduate-interview-prep",
    path: "/dashboard/interview-prep",
    roles: ["graduate"],
    icon: BrainCircuit,
    label: { key: "dashboard.nav.interview_prep", fr: "Préparer un entretien", en: "Interview preparation" },
    navigation: { group: "career", order: 70 },
  },

  {
    id: "company-profile",
    path: "/dashboard/company-profile",
    roles: ["company"],
    icon: Building,
    label: { key: "dashboard.nav.company_profile", fr: "Profil entreprise", en: "Company profile" },
    navigation: { group: "organization", order: 10 },
  },
  {
    id: "company-job-postings",
    path: "/dashboard/job-postings",
    roles: ["company"],
    icon: Briefcase,
    label: { key: "dashboard.nav.job_postings", fr: "Offres d’emploi", en: "Job postings" },
    navigation: { group: "recruitment", order: 10 },
  },
  {
    id: "company-applicants",
    path: "/dashboard/applicants",
    roles: ["company"],
    icon: UserCheck,
    label: { key: "dashboard.nav.candidates", fr: "Candidats", en: "Applicants" },
    navigation: { group: "recruitment", order: 20 },
  },
  {
    id: "company-talent-pool",
    path: "/dashboard/talent-pool",
    roles: ["company"],
    icon: Users2,
    label: { key: "dashboard.nav.talent_pool", fr: "Vivier de talents", en: "Talent pool" },
    navigation: { group: "recruitment", order: 30 },
  },
  { id: "company-talent-profile", path: "/dashboard/talent-pool/[slug]", roles: ["company"] },
  {
    id: "company-events",
    path: "/dashboard/company-events",
    roles: ["company"],
    icon: Calendar,
    label: { key: "dashboard.nav.company_events", fr: "Événements de recrutement", en: "Recruitment events" },
    navigation: { group: "recruitment", order: 40 },
  },

  {
    id: "school-profile",
    path: "/dashboard/school-profile",
    roles: ["school"],
    icon: School,
    label: { key: "dashboard.nav.school_profile", fr: "Profil établissement", en: "School profile" },
    navigation: { group: "organization", order: 10 },
  },
  {
    id: "school-graduate-management",
    path: "/dashboard/graduate-management",
    roles: ["school"],
    icon: UserCheck,
    label: { key: "dashboard.nav.graduates", fr: "Suivi des diplômés", en: "Graduate management" },
    navigation: { group: "organization", order: 20 },
  },
  { id: "school-graduates", path: "/dashboard/graduates", roles: ["school"] },
  {
    id: "school-events",
    path: "/dashboard/school-events",
    roles: ["school"],
    icon: Calendar,
    label: { key: "dashboard.nav.school_events", fr: "Événements campus", en: "Campus events" },
    navigation: { group: "organization", order: 30 },
  },

  { id: "organization-profile", path: "/dashboard/organization-profile", roles: ORGANIZATION_ROLES },
  { id: "organization-partners", path: "/dashboard/partners", roles: ORGANIZATION_ROLES },
  {
    id: "organization-partnerships",
    path: "/dashboard/partnerships",
    roles: ORGANIZATION_ROLES,
    icon: Handshake,
    label: { key: "dashboard.nav.partnerships", fr: "Partenariats", en: "Partnerships" },
    navigation: { group: "organization", order: 40 },
  },

  {
    id: "reports",
    path: "/dashboard/reports",
    roles: REPORTING_ROLES,
    icon: BarChart3,
    label: { key: "dashboard.nav.analytics", fr: "Rapports & analyses", en: "Reports & analytics" },
    navigation: { group: "analytics", order: 10 },
  },
  { id: "company-analytics", path: "/dashboard/reports/company-analytics", roles: ["company"] },
  { id: "school-analytics", path: "/dashboard/reports/school-analytics", roles: ["school"] },
  { id: "custom-report-builder", path: "/dashboard/reports/custom-report-builder", roles: REPORTING_ROLES },
  { id: "custom-report-generator", path: "/dashboard/reports/custom-report-generator", roles: REPORTING_ROLES },

  {
    id: "content-hub",
    path: "/dashboard/content",
    roles: CONTENT_ROLES,
    icon: Newspaper,
    label: { key: "dashboard.nav.content_hub", fr: "Espace éditorial", en: "Content workspace" },
    navigation: { group: "content", order: 10, roles: CONTENT_STAFF_ROLES },
  },
  {
    id: "content-blog",
    path: "/dashboard/content/blog",
    roles: CONTENT_ROLES,
    icon: Newspaper,
    label: { key: "dashboard.nav.blog", fr: "Journal Yahnu", en: "Yahnu journal" },
    navigation: { group: "content", order: 20, roles: CONTENT_STAFF_ROLES },
  },
  {
    id: "content-static-pages",
    path: "/dashboard/content/static-pages",
    roles: CONTENT_ROLES,
    icon: FileText,
    label: { key: "dashboard.nav.static_pages", fr: "Pages du site", en: "Website pages" },
    navigation: { group: "content", order: 30 },
  },

  {
    id: "support-home",
    path: "/dashboard/support",
    roles: [...CORE_ROLES, ...SUPPORT_ROLES],
    icon: LifeBuoy,
    label: { key: "dashboard.nav.support", fr: "Aide & support", en: "Help & support" },
    navigation: { group: "account", order: 20, placement: "footer", roles: CORE_ROLES },
  },
  {
    id: "support-center",
    path: "/dashboard/support/center",
    roles: SUPPORT_ROLES,
    icon: LifeBuoy,
    label: { key: "dashboard.nav.support_center", fr: "Centre de support", en: "Support center" },
    navigation: { group: "support", order: 10 },
  },
  {
    id: "support-pilot-inquiries",
    path: "/dashboard/support/pilot-inquiries",
    roles: SUPPORT_ROLES,
    icon: ClipboardList,
    label: { key: "dashboard.nav.pilot_inquiries", fr: "Demandes pilote", en: "Pilot inquiries" },
    navigation: { group: "support", order: 15 },
  },
  {
    id: "support-ticket-management",
    path: "/dashboard/support/ticket-management",
    roles: SUPPORT_ROLES,
    icon: Ticket,
    label: { key: "dashboard.nav.ticket_management", fr: "Tickets", en: "Ticket management" },
    navigation: { group: "support", order: 20, roles: ["support_staff"] },
  },
  {
    id: "support-user-lookup",
    path: "/dashboard/support/user-lookup",
    roles: SUPPORT_ROLES,
    icon: Search,
    label: { key: "dashboard.nav.user_lookup", fr: "Recherche utilisateur", en: "User lookup" },
    navigation: { group: "support", order: 30, roles: ["support_staff"] },
  },
  {
    id: "support-announcements",
    path: "/dashboard/support/announcements",
    roles: [...CONTENT_ROLES, "support_staff"],
    icon: Megaphone,
    label: { key: "dashboard.nav.announcements", fr: "Annonces", en: "Announcements" },
    navigation: { group: "support", order: 40 },
  },
  {
    id: "support-system-health",
    path: "/dashboard/support/system-health",
    roles: SUPPORT_ROLES,
    icon: HeartPulse,
    label: { key: "dashboard.nav.system_health", fr: "Santé du service", en: "System health" },
    navigation: { group: "support", order: 50 },
  },
  {
    id: "support-knowledge-base",
    path: "/dashboard/support/knowledge-base-editor",
    roles: [...CONTENT_ROLES, "support_staff"],
    icon: BookOpen,
    label: { key: "dashboard.nav.knowledge_base", fr: "Base de connaissances", en: "Knowledge base" },
    navigation: { group: "support", order: 60 },
  },

  {
    id: "settings",
    path: "/dashboard/settings",
    roles: ALL_ROLES,
    icon: Settings,
    label: { key: "dashboard.nav.settings", fr: "Paramètres", en: "Settings" },
    navigation: { group: "account", order: 10, placement: "footer" },
  },
] satisfies readonly DashboardRouteDefinition[];

function isNavigationRoute(route: DashboardRouteDefinition): route is DashboardNavigationRoute {
  return Boolean(route.icon && route.label && route.navigation);
}

function roleIsIncluded(roles: readonly Role[], role: Role) {
  return roles.some((allowedRole) => allowedRole === role);
}

function routeMatches(pathname: string, routePath: string) {
  const normalizedPathname = pathname !== "/dashboard" ? pathname.replace(/\/$/, "") : pathname;
  const normalizedRoute = routePath !== "/dashboard" ? routePath.replace(/\/$/, "") : routePath;

  if (!normalizedRoute.includes("[")) return normalizedPathname === normalizedRoute;

  const pattern = normalizedRoute
    .split("/")
    .map((segment) => (segment.startsWith("[") && segment.endsWith("]") ? "[^/]+" : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
    .join("/");

  return new RegExp(`^${pattern}$`).test(normalizedPathname);
}

export function canAccessDashboardRoute(pathname: string, role: Role) {
  return dashboardRouteRegistry.some(
    (route) => routeMatches(pathname, route.path) && roleIsIncluded(route.roles, role),
  );
}

export { getRoleDashboardHome };

export function resolveDashboardDestination(
  role: Role,
  requestedPath?: string | null,
) {
  return resolveRoleDashboardDestination(role, requestedPath, canAccessDashboardRoute);
}

export function resolvePostLoginDestination(
  role: Role,
  requestedPath?: string | null,
) {
  return resolveRolePostLoginDestination(role, requestedPath, canAccessDashboardRoute);
}

export function getDashboardNavigationGroups(
  role: Role,
  placement: DashboardNavPlacement = "main",
): DashboardNavigationGroup[] {
  const routes = dashboardRouteRegistry
    .filter(isNavigationRoute)
    .filter((route) => (route.navigation.placement ?? "main") === placement)
    .filter((route) => roleIsIncluded(route.roles, role))
    .filter((route) => !route.navigation.roles || roleIsIncluded(route.navigation.roles, role))
    .sort((left, right) => left.navigation.order - right.navigation.order);

  return groupOrder.flatMap((groupId) => {
    const items = routes.filter((route) => route.navigation.group === groupId);
    return items.length ? [{ id: groupId, label: groupLabels[groupId], items }] : [];
  });
}

export function getSearchableDashboardNavigation(role: Role) {
  return (["main", "footer"] as const).flatMap((placement) =>
    getDashboardNavigationGroups(role, placement)
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.navigation.searchable !== false),
      }))
      .filter((group) => group.items.length > 0),
  );
}

export function resolveDashboardLabel(
  label: DashboardLabel,
  t: Translate,
  locale: DashboardLocale = "fr",
) {
  const translated = t(label.key);
  if (translated && translated !== label.key) return translated;
  return locale === "en" ? label.en : label.fr;
}
