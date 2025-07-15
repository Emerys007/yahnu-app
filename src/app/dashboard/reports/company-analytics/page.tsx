
"use client"

import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CountUp } from "@/components/ui/count-up"
import { BarChart3, TrendingUp, Users, Percent, MoreVertical, Download } from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Line, LineChart, Funnel, FunnelChart, LabelList, Tooltip } from "recharts"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { exportToCsv } from "@/lib/utils"

const analyticsData = {
    totalApplicants: 124,
    avgTimeToHire: 42,
    interviewRate: 35,
    applicantFunnel: [
        { name: "New Applicants", value: 124, fill: "hsl(var(--chart-1))" },
        { name: "Screened", value: 80, fill: "hsl(var(--chart-2))" },
        { name: "Interviewed", value: 43, fill: "hsl(var(--chart-3))" },
        { name: "Offered", value: 12, fill: "hsl(var(--chart-4))" },
        { name: "Hired", value: 8, fill: "hsl(var(--chart-5))" },
    ],
    applicationVolume: [
        { date: "2023-01-01", count: 15 },
        { date: "2023-02-01", count: 28 },
        { date: "2023-03-01", count: 22 },
        { date: "2023-04-01", count: 45 },
        { date: "2023-05-01", count: 38 },
        { date: "2023-06-01", count: 53 },
    ],
    applicantsBySchool: [
        { name: "INP-HB", value: 58, fill: "hsl(var(--chart-1))" },
        { name: "UFHB", value: 42, fill: "hsl(var(--chart-2))" },
        { name: "CSI", value: 24, fill: "hsl(var(--chart-3))" },
    ],
}

const funnelChartConfig = {
    newApplicants: { label: "New Applicants", color: "hsl(var(--chart-1))" },
    screened: { label: "Screened", color: "hsl(var(--chart-2))" },
    interviewed: { label: "Interviewed", color: "hsl(var(--chart-3))" },
    offered: { label: "Offered", color: "hsl(var(--chart-4))" },
    hired: { label: "Hired", color: "hsl(var(--chart-5))" },
}

const lineChartConfig = {
    count: { label: "Applicants", color: "hsl(var(--primary))" },
}

const pieChartConfig = {
    "INP-HB": { label: "INP-HB", color: "hsl(var(--chart-1))" },
    "UFHB": { label: "UFHB", color: "hsl(var(--chart-2))" },
    "CSI": { label: "CSI", color: "hsl(var(--chart-3))" },
}


export default function CompanyAnalyticsPage() {
  const { t } = useLocalization();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('Recruitment Analytics')}</h1>
        <p className="text-muted-foreground mt-1">{t('Insights into your hiring funnel and applicant data.')}</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('Total Applicants')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold"><CountUp end={analyticsData.totalApplicants} /></div>
                <p className="text-xs text-muted-foreground">{t('+20% from last month')}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('Avg. Time to Hire')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold"><CountUp end={analyticsData.avgTimeToHire} suffix=" days" /></div>
                <p className="text-xs text-muted-foreground">{t('-5 days from last quarter')}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('Interview Rate')}</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold"><CountUp end={analyticsData.interviewRate} suffix="%" /></div>
                <p className="text-xs text-muted-foreground">{t('Screened to interview ratio')}</p>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
                <CardTitle>{t('Applicant Funnel')}</CardTitle>
                <CardDescription>{t('Progression of candidates through hiring stages.')}</CardDescription>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-auto shrink-0">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => exportToCsv(analyticsData.applicantFunnel.map(({fill, ...rest}) => rest), "applicant_funnel.csv")}>
                        <Download className="mr-2 h-4 w-4" />
                        {t('Export as CSV')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </CardHeader>
        <CardContent>
            <ChartContainer config={funnelChartConfig} className="mx-auto aspect-video max-h-[300px]">
                <FunnelChart layout="horizontal" data={analyticsData.applicantFunnel}>
                    <Tooltip />
                    <Funnel dataKey="value" nameKey="name" isAnimationActive>
                        <LabelList position="center" fill="#fff" stroke="none" dataKey="name" />
                    </Funnel>
                </FunnelChart>
            </ChartContainer>
        </CardContent>
      </Card>
      
      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>{t('Application Volume')}</CardTitle>
                    <CardDescription>{t('Number of applications received over time.')}</CardDescription>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-auto shrink-0">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => exportToCsv(analyticsData.applicationVolume, "application_volume.csv")}>
                            <Download className="mr-2 h-4 w-4" />
                            {t('Export as CSV')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={lineChartConfig} className="min-h-[300px] w-full">
                    <LineChart data={analyticsData.applicationVolume}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short' })} />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>{t('Applicants by School')}</CardTitle>
                    <CardDescription>{t('Source of applicants by academic institution.')}</CardDescription>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-auto shrink-0">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => exportToCsv(analyticsData.applicantsBySchool.map(({fill, ...rest}) => rest), "applicants_by_school.csv")}>
                            <Download className="mr-2 h-4 w-4" />
                            {t('Export as CSV')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="flex justify-center">
                 <ChartContainer config={pieChartConfig} className="min-h-[300px] w-full">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={analyticsData.applicantsBySchool} dataKey="value" nameKey="name" />
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>

    </div>
  )
}
