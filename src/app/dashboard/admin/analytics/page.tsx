
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
import { AnalyticsClient } from "./analytics-client"

const analyticsData = {
    totalUsers: 1256,
    pendingRegistrations: 5,
    activeCompanies: 48,
    activeSchools: 12,
    activeGraduates: 1196,
    userGrowthData: [
        { month: "Jan", users: 150 },
        { month: "Feb", users: 280 },
        { month: "Mar", users: 450 },
        { month: "Apr", users: 680 },
        { month: "May", users: 950 },
        { month: "Jun", users: 1256 },
    ],
    userDistribution: [
        { name: "Graduates", value: 1196, fill: "var(--color-graduates)" },
        { name: "Companies", value: 48, fill: "var(--color-companies)" },
        { name: "Schools", value: 12, fill: "var(--color-schools)" },
    ]
}

export default async function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
            <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Analytics</h1>
            <p className="text-muted-foreground mt-1">High-level insights into platform usage and growth.</p>
        </div>
      </div>
      
      <AnalyticsClient data={analyticsData} />
    </div>
  )
}
