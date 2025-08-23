
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Megaphone, Plus, Edit, Trash2, Users, Clock } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState([
        {
            id: 1,
            title: "Maintenance programmée de la plateforme",
            content: "Nous effectuerons une maintenance programmée sur la plateforme de 2h00 à 4h00 EST le 20 janvier. Pendant ce temps, certaines fonctionnalités peuvent être temporairement indisponibles.",
            audience: "Tous les utilisateurs",
            status: "active",
            expiryDate: "2024-01-25",
            createdAt: "2024-01-18"
        },
        {
            id: 2,
            title: "Nouvel algorithme de correspondance d'emploi",
            content: "Nous avons amélioré notre algorithme de correspondance d'emploi pour fournir de meilleures recommandations aux diplômés. Mettez à jour votre profil pour obtenir les suggestions d'emploi les plus pertinentes.",
            audience: "Diplômés",
            status: "active",
            expiryDate: "2024-02-15",
            createdAt: "2024-01-15"
        },
        {
            id: 3,
            title: "Amélioration du profil d'entreprise",
            content: "Les entreprises peuvent maintenant ajouter des présentations vidéo à leurs profils. Cette fonctionnalité aide à attirer les meilleurs talents en présentant la culture et les valeurs de l'entreprise.",
            audience: "Entreprises",
            status: "draft",
            expiryDate: "2024-02-01",
            createdAt: "2024-01-16"
        }
    ]);

    return (
        <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        <Megaphone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Annonces</h1>
                        <p className="text-muted-foreground mt-1">Créez et gérez les annonces à l'échelle de la plateforme.</p>
                    </div>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle Annonce
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Annonces</CardTitle>
                    <CardDescription>Gérez les annonces de la plateforme.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {announcements.map((announcement) => (
                            <motion.div 
                                key={announcement.id} 
                                className="border rounded-lg p-6 space-y-4"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold">{announcement.title}</h3>
                                            <Badge variant={announcement.status === 'active' ? 'default' : 'secondary'}>
                                                {announcement.status === 'active' ? 'Actif' : 'Brouillon'}
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground mb-4">{announcement.content}</p>

                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                <span>{announcement.audience}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                <span>Expire le: {new Date(announcement.expiryDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <Edit className="h-4 w-4 mr-1" />
                                            Modifier
                                        </Button>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Supprimer
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
