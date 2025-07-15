
"use client"

import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CountUp } from "@/components/ui/count-up"
import { BarChart3, TrendingUp, Users, Building } from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart } from "recharts"
import { useAuth } from "@/context/auth-context"
import CompanyAnalyticsPage from "./company-analytics/page"
import SchoolAnalyticsPage from "./school-analytics/page"


const roleToAnalytics: Record<string, React.ComponentType> = {
    company: CompanyAnalyticsPage,
    school: SchoolAnalyticsPage,
}

export default function AnalyticsPage() {
  const { role } = useAuth();
  const AnalyticsComponent = roleToAnalytics[role];
  
  if (!AnalyticsComponent) {
    return null; 
  }

  return <AnalyticsComponent />;
}
