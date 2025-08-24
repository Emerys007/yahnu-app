
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
import { motion } from "framer-motion"
import { CountUp } from "@/components/ui/count-up"

export function GraduateDashboard() {
  const stats = [
    { title: "Complétion du Profil", value: 75, suffix: '%', icon: User, description: "Complétez votre profil pour vous démarquer" },
    { title: "Candidatures", value: 12, icon: Briefcase, description: "+2 ces 7 derniers jours" },
    { title: "Vues du Profil", value: 34, icon: Building, description: "par des entreprises cette semaine" },
  ];

  const quickActions = [
    { title: "Mettre à jour mon profil", href: '/dashboard/profile', icon: User },
    { title: "Chercher un emploi", href: '/dashboard/jobs', icon: Briefcase },
    { title: "Suivre mes candidatures", href: '/dashboard/applications', icon: FileText },
    { title: "Passer une évaluation", href: '/dashboard/assessments', icon: Award },
    { title: "Préparer un entretien", href: '/dashboard/interview-prep', icon: BrainCircuit },
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
        <h1 className="text-3xl font-bold tracking-tight">Bienvenue sur votre tableau de bord</h1>
        <p className="text-muted-foreground mt-1">Voici un aperçu rapide de votre univers Yahnu.</p>
      </motion.div>
      <motion.div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat, index) => (
            <motion.div 
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5, boxShadow: "0 8px 15px rgba(0, 0, 0, 0.1)" }}
                transition={{ type: "spring", stiffness: 300 }}
            >
                 <Card className="h-full">
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
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Accédez rapidement aux tâches courantes.</CardDescription>
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
                                <span>{action.title}</span>
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
