
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, User, Building, FileText, BrainCircuit, Award } from "lucide-react"
import Link from "next/link"
import { useLocalization } from "@/context/localization-context"
import { motion } from "framer-motion"
import { CountUp } from "@/components/ui/count-up"

export function GraduateDashboard() {
  const { t } = useLocalization();

  const stats = [
    { title: t('Profile Completion'), value: 75, suffix: '%', icon: User, description: t('Complete your profile to stand out') },
    { title: t('Job Applications'), value: 12, icon: Briefcase, description: t('+2 in the last 7 days') },
    { title: t('Application Views'), value: 34, icon: Building, description: t('by companies this week') },
  ];

  const quickActions = [
    { title: t('Update My Profile'), href: '/dashboard/profile', icon: User },
    { title: t('Search for Jobs'), href: '/dashboard/jobs', icon: Briefcase },
    { title: t('Track My Applications'), href: '/dashboard/applications', icon: FileText },
    { title: t('Take an Assessment'), href: '/dashboard/assessments', icon: Award },
    { title: t('Practice for Interview'), href: '/dashboard/interview-prep', icon: BrainCircuit },
]

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
        <h1 className="text-3xl font-bold tracking-tight">{t('Welcome to your Dashboard')}</h1>
        <p className="text-muted-foreground mt-1">{t("Here's a quick overview of your Yahnu world.")}</p>
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
                            <CountUp end={stat.value} suffix={stat.suffix} />
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
            <CardTitle>{t('Quick Actions')}</CardTitle>
            <CardDescription>{t('Get started with common tasks quickly.')}</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickActions.map((action, index) => (
                    <motion.div 
                        key={index}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                    >
                         <Button asChild variant="outline" className="w-full h-24 flex-col justify-center gap-2 text-base">
                            <Link href={action.href}>
                                <action.icon className="h-6 w-6" />
                                <span>{t(action.title)}</span>
                            </Link>
                        </Button>
                    </motion.div>
                ))}
            </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
