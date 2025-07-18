
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
                <CardTitle className="text-base">{t(label)}</CardTitle>
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

const CustomDistributionTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    const { t } = useLocalization();
    if (active && payload && payload.length) {
        const data: UserDistributionDataPoint = payload[0].payload;
        const total = payload.reduce((acc, curr) => acc + (curr.payload?.value || 0), 0)
        const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
        
        return (
        <Card className="w-56 shadow-lg">
            <CardHeader className="pb-2">
                 <CardTitle className="text-base">{t(data.name)}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm">{t('User Count')}: <strong>{data.value}</strong> ({percentage}%)</p>
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
    
    const translatedUserGrowthData = React.useMemo(() => {
        return data.userGrowthData.map(d => ({
            ...d,
            month: t(d.month.substring(0, 3))
        }))
    }, [data.userGrowthData, t]);
    
    const translatedUserDistribution = React.useMemo(() => {
        return data.userDistribution.map(d => ({
            ...d,
            name: t(d.name)
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
                            <CardTitle className="text-sm font-medium">{t('Total Users')}</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold"><CountUp end={data.totalUsers} /></div>
                            <p className="text-xs text-muted-foreground">{t('+180 this month')}</p>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div variants={itemVariants}>
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
                </motion.div>
                <motion.div variants={itemVariants}>
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
                </motion.div>
                <motion.div variants={itemVariants}>
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
                             <LineChart accessibilityLayer data={translatedUserGrowthData} margin={{ left: -20, right: 10 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} />
                                <ChartTooltip
                                    cursor={false}
                                    content={<CustomGrowthTooltip />}
                                    position={{ y: -130 }}
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
                                <ChartTooltip content={<CustomDistributionTooltip />} />
                                <Pie data={translatedUserDistribution} dataKey="value" nameKey="name" innerRadius={50} paddingAngle={2} />
                                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </motion.div>
        </>
    )
}
