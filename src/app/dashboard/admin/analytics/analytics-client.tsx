
"use client"

import { CountUp } from "@/components/ui/count-up"
import { Users, Building, School, UserCheck, MoreVertical, Download } from "lucide-react"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLocalization } from "@/context/localization-context"

const chartConfig = {
    graduates: { label: "Graduates", color: "hsl(var(--chart-1))" },
    companies: { label: "Companies", color: "hsl(var(--chart-2))" },
    schools: { label: "Schools", color: "hsl(var(--chart-3))" },
    users: { label: "Users", color: "hsl(var(--primary))" }
}

type UserGrowthDataPoint = {
    month: string;
    users: number;
    details: {
        newGraduates: number;
        newCompanies: number;
        newSchools: number;
    };
};

type AnalyticsData = {
    totalUsers: number;
    pendingRegistrations: number;
    activeCompanies: number;
    activeSchools: number;
    activeGraduates: number;
    userGrowthData: UserGrowthDataPoint[];
    userDistribution: { name: string; value: number; fill: string }[];
}

const CustomGrowthTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    const { t } = useLocalization();
    if (active && payload && payload.length) {
        const data: UserGrowthDataPoint = payload[0].payload;
        return (
        <Card className="w-64 shadow-lg">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">{label}</CardTitle>
                <CardDescription>{t('New users this month')}</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-1 text-sm">
                    <li className="flex justify-between"><span>{t('Graduates')}:</span> <strong>{data.details.newGraduates}</strong></li>
                    <li className="flex justify-between"><span>{t('Companies')}:</span> <strong>{data.details.newCompanies}</strong></li>
                    <li className="flex justify-between"><span>{t('Schools')}:</span> <strong>{data.details.newSchools}</strong></li>
                    <li className="flex justify-between font-bold border-t pt-1 mt-1"><span>{t('Total')}:</span> <strong>{data.users}</strong></li>
                </ul>
            </CardContent>
        </Card>
        );
    }
    return null;
};

export function AnalyticsClient({ data }: { data: AnalyticsData }) {
    const { t } = useLocalization();
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('Total Users')}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold"><CountUp end={data.totalUsers} /></div>
                        <p className="text-xs text-muted-foreground">{t('+180 this month')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('Active Graduates')}</CardTitle>
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold"><CountUp end={data.activeGraduates} /></div>
                        <p className="text-xs text-muted-foreground">{t('On the platform')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('Active Companies')}</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold"><CountUp end={data.activeCompanies} /></div>
                        <p className="text-xs text-muted-foreground">{t('+5 this month')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('Active Schools')}</CardTitle>
                        <School className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold"><CountUp end={data.activeSchools} /></div>
                        <p className="text-xs text-muted-foreground">{t('+1 this month')}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
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
                                <DropdownMenuItem onClick={() => exportToCsv(data.userGrowthData.map(d => ({ month: d.month, total: d.users, ...d.details})), "user_growth.csv")}>
                                    <Download className="mr-2 h-4 w-4" />
                                    {t('Export as CSV')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                            <BarChart accessibilityLayer data={data.userGrowthData}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} />
                                <ChartTooltip
                                    cursor={false}
                                    content={<CustomGrowthTooltip />}
                                    position={{ y: -130 }}
                                />
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
                                <DropdownMenuItem onClick={() => exportToCsv(data.userDistribution.map(({fill, ...rest}) => rest), "user_distribution.csv")}>
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
                                <Pie data={data.userDistribution} dataKey="value" nameKey="name" innerRadius={50} paddingAngle={2} />
                                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
