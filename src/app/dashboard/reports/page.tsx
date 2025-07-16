

"use client"

import { useLocalization } from "@/context/localization-context"
import { useAuth } from "@/context/auth-context"
import CompanyAnalyticsPage from "./company-analytics/page"
import SchoolAnalyticsPage from "./school-analytics/page"
import AdminAnalyticsPage from "../admin/analytics/page"


const roleToAnalytics: Record<string, React.ComponentType> = {
    company: CompanyAnalyticsPage,
    school: SchoolAnalyticsPage,
    admin: AdminAnalyticsPage,
}

export default function AnalyticsPage() {
  const { role } = useAuth();
  const AnalyticsComponent = roleToAnalytics[role];
  
  if (!AnalyticsComponent) {
    return null; 
  }

  return <AnalyticsComponent />;
}
