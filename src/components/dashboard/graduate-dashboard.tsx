
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, User, Building, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { useLocalization } from "@/context/localization-context"
import { motion } from "framer-motion"
import { CountUp } from "@/components/ui/count-up"

export function GraduateDashboard() {
  const { t } = useLocalization();

  const stats = [
    { title: t('Profile Completion'), value: 75, suffix: '%', icon: User, description: t('Complete your profile to stand out') },
    { title: t('Job Applications'), value: 12, icon: Briefcase, description: t('+2 in the last 7 days') },
    { title: t('Companies Viewed'), value: 34, icon: Building, description: t('Explore more company profiles') },
  ];

  const recommendations = [
      { title: t('Software Engineer at TechCorp'), location: 'San Francisco, CA' },
      { title: t('Product Manager at Innovate Inc.'), location: 'Remote' }
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
            <CardTitle>{t('Recommended For You')}</CardTitle>
            <CardDescription>{t('Based on your profile and activity, here are some opportunities you might like.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {recommendations.map((rec, index) => (
                    <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                    >
                        <div className="flex items-center justify-between p-4 rounded-lg border transition-all duration-300 hover:bg-muted/50 hover:shadow-inner">
                            <div>
                                <h3 className="font-semibold">{rec.title}</h3>
                                <p className="text-sm text-muted-foreground">{rec.location}</p>
                            </div>
                            <Button asChild variant="secondary" size="sm">
                                <Link href="/dashboard/jobs">{t('View')} <ArrowUpRight className="h-4 w-4 ml-2" /></Link>
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
