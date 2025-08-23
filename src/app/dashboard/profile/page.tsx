
"use client"

import { useAuth, type Role } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { GraduateProfile } from "@/features/profile/graduate-profile"
import CompanyProfilePage from "@/app/dashboard/company-profile/page"
import SchoolProfilePage from "@/app/dashboard/school-profile/page"
import { Loader2 } from "lucide-react"

const profileComponents: Partial<Record<Role, React.ComponentType>> = {
  graduate: GraduateProfile,
  company: CompanyProfilePage,
  school: SchoolProfilePage,
};

export default function ProfilePage() {
  const { role, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !profileComponents[role]) {
      // For roles like admin, support, etc., that don't have a specific profile page,
      // redirect them to a more appropriate page like settings.
      router.replace('/dashboard/settings');
    }
  }, [role, loading, router]);


  if (loading || !profileComponents[role]) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const ActiveProfileComponent = profileComponents[role];

  return <ActiveProfileComponent />;
}
