"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Activity, Database, Globe, Shield, Server, Zap, AlertTriangle, CheckCircle } from "lucide-react"
import { useLocalization } from "@/context/localization-context"

export default function SystemHealthPage() {
    const { t } = useLocalization();

    const systemMetrics = [
        {
            name: t('language') === 'fr' ? "Temps de réponse API" : "API Response Time",
            value: 145,
            unit: "ms",
            status: "healthy",
            icon: Zap,
            description: t('language') === 'fr' ? "Temps de réponse API moyen au cours des dernières 24 heures" : "Average API response time over the last 24 hours"
        },
        {
            name: t('language') === 'fr' ? "Performance de la base de données" : "Database Performance",
            value: 98.5,
            unit: "%",
            status: "healthy",
            icon: Database,
            description: t('language') === 'fr' ? "Performance des requêtes de base de données et santé du pool de connexions" : "Database query performance and connection pool health"
        },
        {
            name: t('language') === 'fr' ? "Statut CDN" : "CDN Status",
            value: 100,
            unit: "%",
            status: "healthy",
            icon: Globe,
            description: t('language') === 'fr' ? "Disponibilité du réseau de diffusion de contenu" : "Content delivery network availability"
        },
        {
            name: t('language') === 'fr' ? "Score de sécurité" : "Security Score",
            value: 95,
            unit: "%",
            status: "warning",
            icon: Shield,
            description: t('language') === 'fr' ? "Évaluation globale de la sécurité du système" : "Overall system security assessment"
        },
        {
            name: t('language') === 'fr' ? "Charge du serveur" : "Server Load",
            value: 65,
            unit: "%",
            status: "healthy",
            icon: Server,
            description: t('language') === 'fr' ? "Utilisation actuelle du CPU et de la mémoire du serveur" : "Current server CPU and memory utilization"
        },
        {
            name: t('language') === 'fr' ? "Temps de fonctionnement" : "Uptime",
            value: 99.8,
            unit: "%",
            status: "healthy",
            icon: Activity,
            description: t('language') === 'fr' ? "Temps de fonctionnement du système au cours des 30 derniers jours" : "System uptime over the last 30 days"
        }
    ];

    const recentAlerts = [
        {
            id: 1,
            message: t('language') === 'fr' ? "Utilisation mémoire élevée détectée sur serveur-03" : "High memory usage detected on server-03",
            severity: "warning",
            timestamp: "2024-01-18 14:32:00",
            resolved: false
        },
        {
            id: 2,
            message: t('language') === 'fr' ? "Renouvellement du certificat SSL requis" : "SSL certificate renewal required",
            severity: "info",
            timestamp: "2024-01-18 10:15:00",
            resolved: true
        },
        {
            id: 3,
            message: t('language') === 'fr' ? "Sauvegarde de la base de données terminée avec succès" : "Database backup completed successfully",
            severity: "success",
            timestamp: "2024-01-18 02:00:00",
            resolved: true
        }
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                    <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.support.system_health.title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('dashboard.support.system_health.description')}</p>
                </div>
            </div>
            {/* System Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {systemMetrics.map((metric, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                            <metric.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-2xl font-bold">
                                    {metric.value}
                                    <span className="text-sm font-normal text-muted-foreground ml-1">
                                        {metric.unit}
                                    </span>
                                </div>
                                <Badge
                                    variant={
                                        metric.status === 'healthy' ? 'default' :
                                        metric.status === 'warning' ? 'secondary' : 'destructive'
                                    }
                                    className={
                                        metric.status === 'healthy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                        metric.status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''
                                    }
                                >
                                    {t('language') === 'fr' ? 
                                        (metric.status === 'healthy' ? 'Sain' : 
                                         metric.status === 'warning' ? 'Avertissement' : 'Critique') : 
                                        metric.status}
                                </Badge>
                            </div>
                            {metric.status === 'healthy' && (
                                <Progress value={metric.value} className="h-2 mb-2" />
                            )}
                            <p className="text-xs text-muted-foreground">{metric.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Alerts */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('language') === 'fr' ? 'Alertes récentes' : 'Recent Alerts'}</CardTitle>
                    <CardDescription>{t('language') === 'fr' ? 'Alertes système et notifications des dernières 24 heures' : 'System alerts and notifications from the last 24 hours'}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentAlerts.map((alert) => (
                            <div key={alert.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                <div className="flex-shrink-0">
                                    {alert.severity === 'warning' && (
                                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                    )}
                                    {alert.severity === 'success' && (
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                    )}
                                    {alert.severity === 'info' && (
                                        <Activity className="h-5 w-5 text-blue-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{alert.message}</p>
                                    <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                                </div>
                                <Badge
                                    variant={alert.resolved ? 'secondary' : 'destructive'}
                                    className={alert.resolved ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                                >
                                    {alert.resolved ? t('common.resolved') : t('dashboard.content.active')}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}