
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Newspaper, Megaphone, BookOpen } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { CountUp } from "@/components/ui/count-up"

export function ContentManagerDashboard() {
  const stats = [
    { title: 'Pages Statiques', value: 3, icon: FileText, description: 'À Propos, Confidentialité, Termes' },
    { title: 'Articles de Blog', value: 4, icon: Newspaper, description: '+1 cette semaine' },
    { title: 'Annonces Actives', value: 2, icon: Megaphone, description: 'Gérer les communications' },
  ];

  const quickActions = [
      { title: 'Gérer les Pages Statiques', href: '/dashboard/content/static-pages', icon: FileText },
      { title: 'Gérer le Blog', href: '/dashboard/content/blog', icon: Newspaper },
      { title: 'Gérer les Annonces', href: '/dashboard/support/announcements', icon: Megaphone },
      { title: 'Éditer la Base de Connaissances', href: '/dashboard/support/knowledge-base-editor', icon: BookOpen },
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
        <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord du Gestionnaire de Contenu</h1>
        <p className="text-muted-foreground mt-1">Gérez tout le contenu de la plateforme à partir d'ici.</p>
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
            <CardDescription>Accédez rapidement à vos outils de gestion de contenu.</CardDescription>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
