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
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, TooltipProps } from "recharts"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { exportToCsv } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLocalization } from "@/context/localization-context"
import React from "react"
import { motion } from "framer-motion"

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

type UserDistributionDataPoint = {
    name: string;
    value: number;
    fill: string;
}

type AnalyticsData = {
    totalUsers: number;
    pendingRegistrations: number;
    activeCompanies: number;
    activeSchools: number;
    activeGraduates: number;
    userGrowthData: UserGrowthDataPoint[];
    userDistribution: UserDistributionDataPoint[];
}

const CustomGrowthTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    const { t } = useLocalization();
    if (active && payload && payload.length) {
        const data: UserGrowthDataPoint = payload[0].payload;
        return (
        <Card className="w-64 shadow-lg">
            <CardHeader className="pb-2">
                <CardTitle className="text-base">{label}</CardTitle>
                <CardDescription>{t('dashboard.analytics.new_users_this_month')}</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-1 text-sm">
                    <li className="flex justify-between"><span>{t('dashboard.analytics.graduates')}:</span> <strong>{data.details.newGraduates}</strong></li>
                    <li className="flex justify-between"><span>{t('dashboard.analytics.companies')}:</span> <strong>{data.details.newCompanies}</strong></li>
                    <li className="flex justify-between"><span>{t('dashboard.analytics.schools')}:</span> <strong>{data.details.newSchools}</strong></li>
                    <li className="flex justify-between font-bold border-t pt-1 mt-1"><span>{t('dashboard.analytics.total')}:</span> <strong>{data.users}</strong></li>
                </ul>
            </CardContent>
        </Card>
        );
    }
    return null;
};

const CustomDistributionTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    const { t } = useLocalization();
    if (active && payload && payload.length) {
        const data: any = payload[0].payload;
        const total = data.total;
        const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;

        return (
        <Card className="w-56 shadow-lg">
            <CardHeader className="pb-2">
                 <CardTitle className="text-base">{data.name}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm">{t('dashboard.analytics.user_count')}: <strong>{data.value}</strong> ({percentage}%)</p>
            </CardContent>
        </Card>
        );
    }
    return null;
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

export function AnalyticsClient({ data }: { data: AnalyticsData }) {
    const { t } = useLocalization();

    const translateMonth = (month: string) => {
      const monthMap: { [key: string]: string } = {
        'January': t('dashboard.analytics.january'),
        'February': t('dashboard.analytics.february'),
        'March': t('dashboard.analytics.march'),
        'April': t('dashboard.analytics.april'),
        'May': t('dashboard.analytics.may'),
        'June': t('dashboard.analytics.june'),
      };
      return monthMap[month] || month;
    };

    const translatedUserGrowthData = React.useMemo(() => {
      return data.userGrowthData.map(item => ({
        ...item,
        month: translateMonth(item.month)
      }))
    }, [data.userGrowthData, t]);

    const translatedUserDistribution = React.useMemo(() => {
        const total = data.userDistribution.reduce((acc, curr) => acc + curr.value, 0);
        return data.userDistribution.map(d => ({
            ...d,
            name: t(`dashboard.analytics.${d.name.toLowerCase()}`),
            total,
        }))
    }, [data.userDistribution, t])


    return (
        <>
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.analytics.total_users')}</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold"><CountUp end={data.totalUsers} /></div>
                            <p className="text-xs text-muted-foreground">{t('dashboard.analytics.+180_this_month')}</p>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.analytics.active_graduates')}</CardTitle>
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold"><CountUp end={data.activeGraduates} /></div>
                            <p className="text-xs text-muted-foreground">{t('dashboard.analytics.on_the_platform')}</p>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.analytics.active_companies')}</CardTitle>
                            <Building className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold"><CountUp end={data.activeCompanies} /></div>
                            <p className="text-xs text-muted-foreground">{t('dashboard.analytics.+5_this_month')}</p>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={itemVariants}>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.analytics.active_schools')}</CardTitle>
                            <School className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold"><CountUp end={data.activeSchools} /></div>
                            <p className="text-xs text-muted-foreground">{t('dashboard.analytics.+1_this_month')}</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            <motion.div
                className="grid grid-cols-1 lg:grid-cols-5 gap-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Card className="lg:col-span-3">
                    <CardHeader className="flex flex-row items-center">
                        <div className="grid gap-2">
                            <CardTitle>{t('dashboard.analytics.user_growth')}</CardTitle>
                            <CardDescription>{t('dashboard.analytics.total_users_platform')}</CardDescription>
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
                                    {t('dashboard.analytics.export_as_csv')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                             <LineChart accessibilityLayer data={translatedUserGrowthData} margin={{ left: -20, right: 10 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} />
                                <ChartTooltip
                                    cursor={false}
                                    content={<CustomGrowthTooltip />}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="users"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={3}
                                    dot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                                    activeDot={{ r: 8, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                                    name="Users"
                                />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center">
                        <div className="grid gap-2">
                            <CardTitle>{t('dashboard.analytics.user_distribution')}</CardTitle>
                            <CardDescription>{t('dashboard.analytics.breakdown_user_types')}</CardDescription>
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
                                    {t('dashboard.analytics.export_as_csv')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </CardHeader>
                    <CardContent className="flex justify-center h-[300px]">
                        <ChartContainer config={chartConfig} className="w-full">
                            <PieChart>
                                <ChartTooltip content={<CustomDistributionTooltip />} />
                                <Pie
                                  data={translatedUserDistribution}
                                  dataKey="value"
                                  nameKey="name"
                                  innerRadius={50}
                                  paddingAngle={2}
                                />
                                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </motion.div>
        </>
    )
}