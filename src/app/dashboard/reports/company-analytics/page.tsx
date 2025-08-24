

"use client"

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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Line, LineChart, Funnel, FunnelChart, LabelList, Tooltip, TooltipProps } from "recharts"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { exportToCsv } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import React from "react"
import { motion } from "framer-motion"

type AppVolumeDetail = {
    jobTitle: string;
    count: number;
}
type ApplicationVolumePoint = {
    date: string;
    count: number;
    details: AppVolumeDetail[];
};
const analyticsData = {
    totalApplicants: 124,
    avgTimeToHire: 42,
    interviewRate: 35,
    applicantFunnel: [
        { name: "Nouveaux candidats", value: 124, fill: "hsl(var(--chart-1))" },
        { name: "Présélectionnés", value: 80, fill: "hsl(var(--chart-2))" },
        { name: "Entretien", value: 43, fill: "hsl(var(--chart-3))" },
        { name: "Offre", value: 12, fill: "hsl(var(--chart-4))" },
        { name: "Embauché", value: 8, fill: "hsl(var(--chart-5))" },
    ],
    applicationVolume: [
        { date: "2023-01-01", count: 15, details: [{ jobTitle: "Ingénieur Logiciel", count: 10 }, { jobTitle: "Chef de Produit", count: 5 }] },
        { date: "2023-02-01", count: 28, details: [{ jobTitle: "Ingénieur Logiciel", count: 18 }, { jobTitle: "Chef de Produit", count: 10 }] },
        { date: "2023-03-01", count: 22, details: [{ jobTitle: "Designer UX/UI", count: 12 }, { jobTitle: "Ingénieur Logiciel", count: 10 }] },
        { date: "2023-04-01", count: 45, details: [{ jobTitle: "Data Scientist", count: 20 }, { jobTitle: "Ingénieur Logiciel", count: 15 }, { jobTitle: "Chef de Produit", count: 10 }] },
        { date: "2023-05-01", count: 38, details: [{ jobTitle: "Data Scientist", count: 18 }, { jobTitle: "Ingénieur DevOps", count: 20 }] },
        { date: "2023-06-01", count: 53, details: [{ jobTitle: "Ingénieur Logiciel", count: 30 }, { jobTitle: "Ingénieur DevOps", count: 23 }] },
    ],
    applicantsBySchool: [
        { name: "INP-HB", value: 58, fill: "hsl(var(--chart-1))" },
        { name: "UFHB", value: 42, fill: "hsl(var(--chart-2))" },
        { name: "CSI", value: 24, fill: "hsl(var(--chart-3))" },
    ],
}

const funnelChartConfig = {
    newApplicants: { label: "Nouveaux candidats", color: "hsl(var(--chart-1))" },
    screened: { label: "Présélectionnés", color: "hsl(var(--chart-2))" },
    interviewed: { label: "Entretien", color: "hsl(var(--chart-3))" },
    offered: { label: "Offre", color: "hsl(var(--chart-4))" },
    hired: { label: "Embauché", color: "hsl(var(--chart-5))" },
}

const lineChartConfig = {
    count: { label: "Candidats", color: "hsl(var(--primary))" },
}

const pieChartConfig = {
    "INP-HB": { label: "INP-HB", color: "hsl(var(--chart-1))" },
    "UFHB": { label: "UFHB", color: "hsl(var(--chart-2))" },
    "CSI": { label: "CSI", color: "hsl(var(--chart-3))" },
}

const CustomVolumeTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data: ApplicationVolumePoint = payload[0].payload;
      return (
        <Card className="w-64 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{new Date(label).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</CardTitle>
            <CardDescription>{`${data.count} candidatures totales`}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {data.details.map((detail, i) => (
                <li key={i} className="flex justify-between">
                  <span>{detail.jobTitle}:</span>
                  <strong>{detail.count}</strong>
                </li>
              ))}
            </ul>
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


export default function CompanyAnalyticsPage() {
  const [funnelData, setFunnelData] = React.useState(analyticsData.applicantFunnel);

  return (
    <motion.div 
        className="space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">Analyses de recrutement</h1>
        <p className="text-muted-foreground mt-1">Aperçu de votre entonnoir de recrutement et des données sur les candidats.</p>
      </motion.div>
      
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total des candidats</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold"><CountUp end={analyticsData.totalApplicants} /></div>
                    <p className="text-xs text-muted-foreground">+20% par rapport au mois dernier</p>
                </CardContent>
            </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Délai moyen d'embauche</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold"><CountUp end={analyticsData.avgTimeToHire} suffix=" jours" /></div>
                    <p className="text-xs text-muted-foreground">-5 jours par rapport au dernier trimestre</p>
                </CardContent>
            </Card>
        </motion.div>
        <motion.div variants={itemVariants}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taux d'entretien</CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold"><CountUp end={analyticsData.interviewRate} suffix="%" /></div>
                    <p className="text-xs text-muted-foreground">Ratio présélectionnés/entretien</p>
                </CardContent>
            </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
            <CardHeader className="flex flex-row items-center">
                <div className="grid gap-2">
                    <CardTitle>Entonnoir de candidats</CardTitle>
                    <CardDescription>Progression des candidats à travers les étapes de recrutement.</CardDescription>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="ml-auto shrink-0">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => exportToCsv(funnelData.map(({fill, ...rest}) => rest), "applicant_funnel.csv")}>
                            <Download className="mr-2 h-4 w-4" />
                            Exporter en CSV
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent>
                <ChartContainer config={funnelChartConfig} className="mx-auto aspect-video max-h-[300px]">
                    <FunnelChart layout="horizontal" data={funnelData}>
                        <Tooltip content={<ChartTooltipContent indicator="line" />} />
                        <Funnel dataKey="value" nameKey="name" isAnimationActive>
                            <LabelList position="center" fill="#fff" stroke="none" dataKey="name" />
                        </Funnel>
                    </FunnelChart>
                </ChartContainer>
            </CardContent>
        </Card>
      </motion.div>
      
      <motion.div className="grid grid-cols-1 lg:grid-cols-5 gap-6" variants={containerVariants}>
        <motion.div className="lg:col-span-3" variants={itemVariants}>
            <Card>
                <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                        <CardTitle>Volume de candidatures</CardTitle>
                        <CardDescription>Nombre de candidatures reçues au fil du temps.</CardDescription>
                    </div>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="ml-auto shrink-0">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => exportToCsv(analyticsData.applicationVolume.map(d => ({ date: d.date, count: d.count })), "application_volume.csv")}>
                                <Download className="mr-2 h-4 w-4" />
                                Exporter en CSV
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={lineChartConfig} className="min-h-[300px] w-full">
                        <LineChart accessibilityLayer data={analyticsData.applicationVolume}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="date" tickFormatter={(val) => new Date(val).toLocaleDateString('fr-FR', { month: 'short' })} />
                            <YAxis />
                            <ChartTooltip cursor={false} content={<CustomVolumeTooltip />} />
                            <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{r: 4, fill: "hsl(var(--primary))" }} />
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </motion.div>
        <motion.div className="lg:col-span-2" variants={itemVariants}>
            <Card>
                <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                        <CardTitle>Candidats par école</CardTitle>
                        <CardDescription>Source des candidats par établissement académique.</CardDescription>
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
                                Exporter en CSV
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="flex justify-center h-[300px]">
                     <ChartContainer config={pieChartConfig} className="w-full">
                        <PieChart>
                            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                            <Pie data={analyticsData.applicantsBySchool} dataKey="value" nameKey="name" innerRadius={50} paddingAngle={2}/>
                            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </motion.div>
      </motion.div>

    </motion.div>
  )
}
