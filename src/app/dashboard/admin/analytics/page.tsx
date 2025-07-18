
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
import { AnalyticsClient } from "./analytics-client"
import { CreateReportDialog } from "@/features/analytics/CreateReportDialog";
import { Report, ReportMap } from "@/features/analytics/ReportWidget";

const analyticsData = {
    totalUsers: 1256,
    pendingRegistrations: 5,
    activeCompanies: 48,
    activeSchools: 12,
    activeGraduates: 1196,
    userGrowthData: [
        { month: "January", users: 150, details: { newGraduates: 140, newCompanies: 8, newSchools: 2 } },
        { month: "February", users: 280, details: { newGraduates: 250, newCompanies: 25, newSchools: 5 } },
        { month: "March", users: 450, details: { newGraduates: 420, newCompanies: 20, newSchools: 10 } },
        { month: "April", users: 680, details: { newGraduates: 650, newCompanies: 20, newSchools: 10 } },
        { month: "May", users: 950, details: { newGraduates: 900, newCompanies: 40, newSchools: 10 } },
        { month: "June", users: 1256, details: { newGraduates: 1196, newCompanies: 48, newSchools: 12 } },
    ],
    userDistribution: [
        { name: "Graduates", value: 1196, fill: "var(--color-graduates)" },
        { name: "Companies", value: 48, fill: "var(--color-companies)" },
        { name: "Schools", value: 12, fill: "var(--color-schools)" },
    ]
}

export default function AdminAnalyticsPage() {

    const addReport = (report: Report) => {
        // This function would typically update a shared state or context
        // For now, we can just log it to see it working.
        console.log("Adding report:", report);
    };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
                <p className="text-muted-foreground mt-1">High-level insights into platform usage and growth.</p>
            </div>
        </div>
        
      </div>
      
      <AnalyticsClient data={analyticsData} />
    </div>
  )
}
