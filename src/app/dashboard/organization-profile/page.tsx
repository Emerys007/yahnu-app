
"use client"

import { useAuth, type Role } from "@/context/auth-context"
import CompanyProfilePage from "@/app/dashboard/company-profile/page"
import SchoolProfilePage from "@/app/dashboard/school-profile/page"

const profileComponents: Partial<Record<Role, React.ComponentType>> = {
  company: CompanyProfilePage,
  school: SchoolProfilePage,
};

export default function OrganizationProfilePage() {
  const { role } = useAuth()
  const ActiveProfileComponent = profileComponents[role];

  if (!ActiveProfileComponent) {
    // Optionally handle cases where this page is accessed by other roles (e.g., redirect or show an error)
    return null; 
  }

  return <ActiveProfileComponent />;
}
