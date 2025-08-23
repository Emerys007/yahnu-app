
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Briefcase, BarChart3, ArrowUpRight, PlusCircle, Handshake, FileText, Building, MessageSquare, Calendar } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { CountUp } from "@/components/ui/count-up"

export function CompanyDashboard() {
  const stats = [
    { title: 'Offres d\'emploi actives', value: 5, icon: Briefcase, description: '+1 cette semaine' },
    { title: 'Nouveaux candidats', value: 83, icon: Users, description: '+15% par rapport au mois dernier' },
    { title: 'Évaluations envoyées', value: 25, icon: BarChart3, description: 'Taux de complétion de 75%' },
  ];

  const quickActions = [
      { title: 'Profil de l\'entreprise', href: '/dashboard/organization-profile', icon: Building },
      { title: 'Publier une offre', href: '/dashboard/job-postings', icon: PlusCircle },
      { title: 'Voir le vivier de talents', href: '/dashboard/talent-pool', icon: Users },
      { title: 'Suivre les candidatures', href: '/dashboard/applications', icon: FileText },
      { title: 'Gérer les événements', href: '/dashboard/company-events', icon: Calendar },
      { title: 'Gérer les partenariats', href: '/dashboard/partnerships', icon: Handshake },
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
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord Entreprise</h1>
        <p className="text-muted-foreground mt-1">Gérez votre pipeline de recrutement et trouvez les meilleurs talents.</p>
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
                            <CountUp end={stat.value} />
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
            <CardDescription>Démarrez rapidement avec les tâches courantes.</CardDescription>
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
