
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, Megaphone, BookOpen, Newspaper } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export function ContentManagerDashboard() {
  const stats = [
    { title: "Profils en attente", value: "12", icon: Eye, color: "text-blue-500" },
    { title: "Articles de blog", value: "34", icon: Newspaper, color: "text-green-500" },
    { title: "Annonces actives", value: "3", icon: Megaphone, color: "text-orange-500" },
    { title: "Articles de la base de connaissances", value: "58", icon: BookOpen, color: "text-purple-500" },
  ];

  const quickLinks = [
    { href: "/dashboard/admin/content-moderation", label: "Modérer le contenu", icon: Eye },
    { href: "/dashboard/admin/announcements", label: "Gérer les annonces", icon: Megaphone },
    { href: "/dashboard/admin/knowledge-base-editor", label: "Éditer la base de connaissances", icon: BookOpen },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tableau de bord du Gestionnaire de Contenu</h1>
        <p className="text-muted-foreground mt-1">Vue d'ensemble du contenu et des tâches de modération de la plateforme.</p>
      </div>

      <motion.div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {stats.map((stat, index) => (
          <motion.div key={index} variants={cardVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Accès Rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickLinks.map((link) => (
              <Button key={link.href} asChild variant="outline" className="w-full justify-start text-base py-6">
                <Link href={link.href}>
                  <link.icon className="mr-3 h-5 w-5" />
                  {link.label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Activité Récente du Contenu</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">{"L'entreprise 'Tech Innovators' a soumis son profil pour examen."}</p>
                    <p className="text-sm text-muted-foreground">{"Nouvel article de blog '5 Astuces pour une Recherche d'Emploi Efficace' a été publié."}</p>
                    <p className="text-sm text-muted-foreground">{"L'annonce 'Maintenance Programmée' a été mise à jour."}</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
