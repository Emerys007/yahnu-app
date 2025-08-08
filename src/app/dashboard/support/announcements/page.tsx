"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Megaphone, Plus, Edit, Trash2, Users, Clock } from "lucide-react"
import { useState } from "react"
import { useLocalization } from "@/context/localization-context"

export default function AnnouncementsPage() {
    const { t } = useLocalization();
    const [announcements, setAnnouncements] = useState([
        {
            id: 1,
            title: t('language') === 'fr' ? "Maintenance programmée de la plateforme" : "Platform Maintenance Scheduled",
            content: t('language') === 'fr' ? "Nous effectuerons une maintenance programmée sur la plateforme de 2h00 à 4h00 EST le 20 janvier. Pendant ce temps, certaines fonctionnalités peuvent être temporairement indisponibles." : "We will be performing scheduled maintenance on the platform from 2:00 AM to 4:00 AM EST on January 20th. During this time, some features may be temporarily unavailable.",
            audience: t('dashboard.content.all_users'),
            status: "active",
            expiryDate: "2024-01-25",
            createdAt: "2024-01-18"
        },
        {
            id: 2,
            title: t('language') === 'fr' ? "Nouvel algorithme de correspondance d'emploi" : "New Job Matching Algorithm",
            content: t('language') === 'fr' ? "Nous avons amélioré notre algorithme de correspondance d'emploi pour fournir de meilleures recommandations aux diplômés. Mettez à jour votre profil pour obtenir les suggestions d'emploi les plus pertinentes." : "We've improved our job matching algorithm to provide better recommendations for graduates. Update your profile to get the most relevant job suggestions.",
            audience: t('dashboard.nav.graduates'),
            status: "active",
            expiryDate: "2024-02-15",
            createdAt: "2024-01-15"
        },
        {
            id: 3,
            title: t('language') === 'fr' ? "Amélioration du profil d'entreprise" : "Company Profile Enhancement",
            content: t('language') === 'fr' ? "Les entreprises peuvent maintenant ajouter des présentations vidéo à leurs profils. Cette fonctionnalité aide à attirer les meilleurs talents en présentant la culture et les valeurs de l'entreprise." : "Companies can now add video introductions to their profiles. This feature helps attract top talent by showcasing company culture and values.",
            audience: t('common.companies'),
            status: "draft",
            expiryDate: "2024-02-01",
            createdAt: "2024-01-16"
        }
    ]);

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        <Megaphone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.support.announcements.title')}</h1>
                        <p className="text-muted-foreground mt-1">{t('dashboard.support.announcements.description')}</p>
                    </div>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('dashboard.content.new_announcement')}
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{t('common.announcements')}</CardTitle>
                    <CardDescription>{t('dashboard.support.announcements.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {announcements.map((announcement) => (
                            <div key={announcement.id} className="border rounded-lg p-6 space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold">{announcement.title}</h3>
                                            <Badge variant={announcement.status === 'active' ? 'default' : 'secondary'}>
                                                {t(`dashboard.content.${announcement.status}`)}
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
                                                <span>{t('dashboard.content.expires_in')}: {announcement.expiryDate}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                            <Edit className="h-4 w-4 mr-1" />
                                            {t('common.knowledge_base.edit')}
                                        </Button>
                                        <Button variant="destructive" size="sm">
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            {t('common.knowledge_base.delete')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}