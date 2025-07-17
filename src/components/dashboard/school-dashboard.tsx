
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, GraduationCap, Handshake, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { useLocalization } from "@/context/localization-context"
import { motion } from "framer-motion"
import { CountUp } from "@/components/ui/count-up"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

export function SchoolDashboard() {
  const { t } = useLocalization();

  const stats = [
    { title: t('Enrolled Graduates'), value: 452, icon: GraduationCap, description: t('+25 this semester') },
    { title: t('Partner Companies'), value: 28, icon: Handshake, description: t('3 new partnerships') },
    { title: t('Placement Rate'), value: 89, suffix: '%', icon: BarChart3, description: t('Up 5% from last year') },
  ];

  const chartData = [
    { month: t("January"), graduates: 186 },
    { month: t("February"), graduates: 305 },
    { month: t("March"), graduates: 237 },
    { month: t("April"), graduates: 273 },
    { month: t("May"), graduates: 209 },
    { month: t("June"), graduates: 214 },
  ];
  const chartConfig = {
    graduates: {
      label: t('Graduates'),
      color: "hsl(var(--primary))",
    },
  }


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

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">{t('School Dashboard')}</h1>
        <p className="text-muted-foreground mt-1">{t("Track graduate success and industry partnerships.")}</p>
      </motion.div>
      <motion.div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat, index) => (
            <motion.div key={index} variants={itemVariants}>
                 <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                        {stat.title}
                        </CardTitle>
                        <stat.icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            <CountUp end={stat.value} suffix={stat.suffix}/>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stat.description}
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        ))}
      </motion.div>
      <motion.div
         variants={itemVariants}
         initial="hidden"
         animate="visible"
         transition={{ delay: 0.3 }}
      >
        <Card>
            <CardHeader>
                <CardTitle>{t('Graduate Placement Trends')}</CardTitle>
                <CardDescription>{t('Number of graduates placed in jobs over the last 6 months.')}</CardDescription>
            </CardHeader>
            <CardContent>
               <ChartContainer config={chartConfig} className="h-[250px] w-full">
                  <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <YAxis tickCount={5} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="graduates" fill="var(--color-graduates)" radius={4} />
                  </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
