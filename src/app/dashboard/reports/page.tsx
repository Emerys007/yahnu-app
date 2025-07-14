
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

const analyticsData = {
    totalHires: 132,
    avgTimeToHire: 28, // days
    topCompanies: [
        { company: "Tech Solutions Abidjan", hires: 45 },
        { company: "AgriBiz Côte d'Ivoire", hires: 32 },
        { company: "Finance & Forte", hires: 25 },
        { company: "Innovate Inc.", hires: 20 },
        { company: "Creative Solutions", hires: 10 },
    ],
    hiresByIndustry: [
        { name: "IT", value: 60, fill: "var(--color-it)" },
        { name: "Finance", value: 35, fill: "var(--color-finance)" },
        { name: "Agriculture", value: 32, fill: "var(--color-agriculture)" },
        { name: "Other", value: 5, fill: "var(--color-other)" },
    ]
}

const chartConfig = {
    it: { label: "IT", color: "hsl(var(--chart-1))" },
    finance: { label: "Finance", color: "hsl(var(--chart-2))" },
    agriculture: { label: "Agriculture", color: "hsl(var(--chart-3))" },
    other: { label: "Other", color: "hsl(var(--chart-4))" },
    hires: { label: "Hires", color: "hsl(var(--primary))" }
}

export default function AnalyticsPage() {
  const { t } = useLocalization();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('Graduate Placement Analytics')}</h1>
        <p className="text-muted-foreground mt-1">{t('Insights into the success of your graduates in the job market.')}</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('Total Graduates Hired')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold"><CountUp end={analyticsData.totalHires} /></div>
                <p className="text-xs text-muted-foreground">{t('+10% from last quarter')}</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('Avg. Time to Hire')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold"><CountUp end={analyticsData.avgTimeToHire} suffix={t(" days")} /></div>
                <p className="text-xs text-muted-foreground">{t('Down from 32 days last quarter')}</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('Top Partner Company')}</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{analyticsData.topCompanies[0].company}</div>
                <p className="text-xs text-muted-foreground">{t('{count} hires this year', { count: analyticsData.topCompanies[0].hires })}</p>
            </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>{t('Top Hiring Companies')}</CardTitle>
                <CardDescription>{t('Companies that have hired the most graduates from your institution.')}</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={{ hires: { label: t('Hires'), color: 'hsl(var(--primary))' } }} className="min-h-[300px] w-full">
                    <BarChart layout="vertical" accessibilityLayer data={analyticsData.topCompanies}>
                        <CartesianGrid horizontal={false} />
                        <YAxis dataKey="company" type="category" tickLine={false} tickMargin={10} axisLine={false} width={150} />
                        <XAxis dataKey="hires" type="number" hide />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="hires" fill="var(--color-hires)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>{t('Hires by Industry')}</CardTitle>
                <CardDescription>{t('Distribution of graduate placements across different industries.')}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                 <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={analyticsData.hiresByIndustry} dataKey="value" nameKey="name" innerRadius={50} />
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>

    </div>
  )
}
