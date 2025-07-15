
"use client"

import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CountUp } from "@/components/ui/count-up"
import { BarChart3, TrendingUp, Users, Building, School, UserCheck, MoreVertical, Download } from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart } from "recharts"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { exportToCsv } from "@/lib/utils"

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

const chartConfig = {
    graduates: { label: "Graduates", color: "hsl(var(--chart-1))" },
    companies: { label: "Companies", color: "hsl(var(--chart-2))" },
    schools: { label: "Schools", color: "hsl(var(--chart-3))" },
    users: { label: "Users", color: "hsl(var(--primary))" }
}

export default function AdminAnalyticsPage() {
  const { t } = useLocalization();

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
            <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('Platform Analytics')}</h1>
            <p className="text-muted-foreground mt-1">{t('High-level insights into platform usage and growth.')}</p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('Total Users')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold"><CountUp end={analyticsData.totalUsers} /></div>
                <p className="text-xs text-muted-foreground">{t('+180 this month')}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('Active Graduates')}</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold"><CountUp end={analyticsData.activeGraduates} /></div>
                <p className="text-xs text-muted-foreground">{t('On the platform')}</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('Active Companies')}</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold"><CountUp end={analyticsData.activeCompanies} /></div>
                <p className="text-xs text-muted-foreground">{t('+5 this month')}</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('Active Schools')}</CardTitle>
                <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold"><CountUp end={analyticsData.activeSchools} /></div>
                <p className="text-xs text-muted-foreground">{t('+1 this month')}</p>
            </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>{t('User Growth')}</CardTitle>
                    <CardDescription>{t('Total users on the platform over the last 6 months.')}</CardDescription>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-auto shrink-0">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => exportToCsv(analyticsData.userGrowthData, "user_growth.csv")}>
                            <Download className="mr-2 h-4 w-4" />
                            {t('Export as CSV')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                    <BarChart accessibilityLayer data={analyticsData.userGrowthData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="users" fill="var(--color-users)" radius={8} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>{t('User Distribution')}</CardTitle>
                    <CardDescription>{t('Breakdown of user types on the platform.')}</CardDescription>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-auto shrink-0">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => exportToCsv(analyticsData.userDistribution.map(({fill, ...rest}) => rest), "user_distribution.csv")}>
                             <Download className="mr-2 h-4 w-4" />
                            {t('Export as CSV')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="flex justify-center">
                 <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={analyticsData.userDistribution} dataKey="value" nameKey="name" innerRadius={50} />
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
