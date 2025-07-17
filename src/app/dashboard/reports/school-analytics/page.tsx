
"use client"

import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CountUp } from "@/components/ui/count-up"
import { TrendingUp, Users, Building, MoreVertical, Download } from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, TooltipProps } from "recharts"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { exportToCsv } from "@/lib/utils"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type GraduateHire = {
    name: string;
    company: string;
    field: string;
}

type MonthlyHires = {
    month: string;
    graduates: number;
    details: GraduateHire[];
}

const analyticsData = {
    totalHires: 132,
    avgTimeToHire: 28, // days
    topCompanies: [
        { company: "Tech Solutions Abidjan", hires: 45, fill: "var(--color-hires)" },
        { company: "AgriBiz Côte d'Ivoire", hires: 32, fill: "var(--color-hires)" },
        { company: "Finance & Forte", hires: 25, fill: "var(--color-hires)" },
        { company: "Innovate Inc.", hires: 20, fill: "var(--color-hires)" },
        { company: "Creative Solutions", hires: 10, fill: "var(--color-hires)" },
    ],
    hiresByIndustry: [
        { name: "IT", value: 60, fill: "hsl(var(--chart-1))" },
        { name: "Finance", value: 35, fill: "hsl(var(--chart-2))" },
        { name: "Agriculture", value: 32, fill: "hsl(var(--chart-3))" },
        { name: "Other", value: 5, fill: "hsl(var(--chart-4))" },
    ],
    placementTrends: [
        { 
            month: "January", 
            graduates: 15,
            details: [
                { name: "Kouassi Jean", company: "Orange", field: "Telecoms" },
                { name: "Bamba Mariam", company: "MTN", field: "Marketing" },
            ]
        },
        { 
            month: "February", 
            graduates: 28,
            details: [
                { name: "Diallo Fatima", company: "Bridge Bank", field: "Finance" },
                { name: "Traoré Seydou", company: "Ecobank", field: "Finance" },
                { name: "Koné Awa", company: "Bolloré", field: "Logistics" },
            ]
        },
        { 
            month: "March", 
            graduates: 22,
            details: [
                 { name: "Ouattara Adama", company: "SIFCA", field: "Agronomy" },
                 { name: "Diaby Aminata", company: "CFAO", field: "Retail" },
            ]
        },
        { 
            month: "April", 
            graduates: 35,
            details: [
                { name: "N'Guessan Yann", company: "Jumia", field: "E-commerce" },
                { name: "Gueye Omar", company: "Orange", field: "IT" },
            ]
        },
        { 
            month: "May", 
            graduates: 18,
            details: [
                { name: "Fofana Isabelle", company: "Unilever", field: "Marketing" },
                { name: "Koulibaly David", company: "TotalEnergies", field: "Energy" },
            ]
        },
        { 
            month: "June", 
            graduates: 41,
            details: [
                { name: "Sangaré Aïcha", company: "KPMG", field: "Audit" },
                { name: "Cissé Ibrahim", company: "Deloitte", field: "Consulting" },
                { name: "Touré Fatou", company: "Société Générale", field: "Finance" },
            ]
        },
    ]
}

const chartConfig = {
    it: { label: "IT", color: "hsl(var(--chart-1))" },
    finance: { label: "Finance", color: "hsl(var(--chart-2))" },
    agriculture: { label: "Agriculture", color: "hsl(var(--chart-3))" },
    other: { label: "Other", color: "hsl(var(--chart-4))" },
    hires: { label: "Hires", color: "hsl(var(--primary))" }
}

const CustomPlacementTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    const { t } = useLocalization();
    if (active && payload && payload.length) {
        const data: MonthlyHires = payload[0].payload;
        return (
        <Card className="w-80 shadow-2xl" style={{ transform: 'translateX(-50%)' }}>
            <CardHeader>
                <CardTitle className="text-base">{t(label)}</CardTitle>
                <CardDescription>{t('{count} graduates hired', { count: data.graduates })}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('Name')}</TableHead>
                            <TableHead>{t('Company')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.details.slice(0, 5).map((hire, index) => (
                            <TableRow key={index}>
                                <TableCell>{hire.name}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{hire.company}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {data.details.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                        {t('+{count} more', { count: data.details.length - 5 })}
                    </p>
                )}
            </CardContent>
        </Card>
        );
    }

    return null;
};

export default function SchoolAnalyticsPage() {
  const { t } = useLocalization();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('Graduate Placement Analytics')}</h1>
        <p className="text-muted-foreground mt-1">{t('Insights into the success of your graduates in the job market.')}</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
      
       <Card>
        <CardHeader>
            <CardTitle>{t('Graduate Placement Trends')}</CardTitle>
            <CardDescription>{t('Number of graduates placed in jobs over the last 6 months.')}</CardDescription>
        </CardHeader>
        <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart accessibilityLayer data={analyticsData.placementTrends}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => t(value).slice(0, 3)}
                />
                <YAxis tickCount={5} />
                <ChartTooltip
                    cursor={false}
                    content={<CustomPlacementTooltip />}
                    position={{ y: -130 }}
                />
                <Bar dataKey="graduates" fill="var(--color-hires)" radius={4} />
                </BarChart>
            </ChartContainer>
        </CardContent>
      </Card>


      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>{t('Top Hiring Companies')}</CardTitle>
                    <CardDescription>{t('Companies that have hired the most graduates from your institution.')}</CardDescription>
                </div>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-auto shrink-0">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => exportToCsv(analyticsData.topCompanies.map(({fill, ...rest}) => rest), "top_hiring_companies.csv")}>
                            <Download className="mr-2 h-4 w-4" />
                            {t('Export as CSV')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                    <BarChart layout="vertical" accessibilityLayer data={analyticsData.topCompanies} margin={{ left: 50 }}>
                        <CartesianGrid horizontal={false} />
                        <YAxis dataKey="company" type="category" tickLine={false} tickMargin={5} axisLine={false} width={150} />
                        <XAxis dataKey="hires" type="number" hide />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                        <Bar dataKey="hires" fill="var(--color-hires)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>{t('Hires by Industry')}</CardTitle>
                    <CardDescription>{t('Distribution of graduate placements across different industries.')}</CardDescription>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-auto shrink-0">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => exportToCsv(analyticsData.hiresByIndustry.map(({fill, ...rest}) => rest), "hires_by_industry.csv")}>
                            <Download className="mr-2 h-4 w-4" />
                            {t('Export as CSV')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="flex justify-center h-[300px]">
                 <ChartContainer config={chartConfig} className="w-full">
                    <PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={analyticsData.hiresByIndustry} dataKey="value" nameKey="name" innerRadius={50} paddingAngle={2} />
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>

    </div>
  )
}
