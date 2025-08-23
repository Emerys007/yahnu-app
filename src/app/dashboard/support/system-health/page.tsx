
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Activity, Database, Globe, Shield, Server, Zap, AlertTriangle, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"

export default function SystemHealthPage() {
    const systemMetrics = [
        { name: "Temps de réponse API", value: 145, unit: "ms", status: "healthy", icon: Zap, description: "Temps de réponse API moyen au cours des dernières 24 heures" },
        { name: "Performance de la base de données", value: 98.5, unit: "%", status: "healthy", icon: Database, description: "Performance des requêtes de base de données et santé du pool de connexions" },
        { name: "Statut CDN", value: 100, unit: "%", status: "healthy", icon: Globe, description: "Disponibilité du réseau de diffusion de contenu" },
        { name: "Score de sécurité", value: 95, unit: "%", status: "warning", icon: Shield, description: "Évaluation globale de la sécurité du système" },
        { name: "Charge du serveur", value: 65, unit: "%", status: "healthy", icon: Server, description: "Utilisation actuelle du CPU et de la mémoire du serveur" },
        { name: "Temps de fonctionnement", value: 99.8, unit: "%", status: "healthy", icon: Activity, description: "Temps de fonctionnement du système au cours des 30 derniers jours" }
    ];

    const recentAlerts = [
        { id: 1, message: "Utilisation mémoire élevée détectée sur serveur-03", severity: "warning", timestamp: "2024-01-18 14:32:00", resolved: false },
        { id: 2, message: "Renouvellement du certificat SSL requis", severity: "info", timestamp: "2024-01-18 10:15:00", resolved: true },
        { id: 3, message: "Sauvegarde de la base de données terminée avec succès", severity: "success", timestamp: "2024-01-18 02:00:00", resolved: true }
    ];
    
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
    };

    return (
        <motion.div 
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
        >
            <motion.div 
                className="flex items-start gap-4"
                variants={itemVariants}
            >
                <div className="bg-primary/10 p-3 rounded-lg">
                    <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Santé du Système</h1>
                    <p className="text-muted-foreground mt-1">Surveillez les métriques de performance et les alertes de la plateforme.</p>
                </div>
            </motion.div>
            
            <motion.div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" variants={containerVariants}>
                {systemMetrics.map((metric, index) => (
                    <motion.div key={index} variants={itemVariants}>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                                <metric.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-2xl font-bold">
                                        {metric.value}
                                        <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>
                                    </div>
                                    <Badge variant={metric.status === 'healthy' ? 'default' : metric.status === 'warning' ? 'secondary' : 'destructive'} className={metric.status === 'healthy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : metric.status === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : ''}>
                                        {metric.status === 'healthy' ? 'Sain' : metric.status === 'warning' ? 'Avertissement' : 'Critique'}
                                    </Badge>
                                </div>
                                {metric.status === 'healthy' && <Progress value={metric.value} className="h-2 mb-2" />}
                                <p className="text-xs text-muted-foreground">{metric.description}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card>
                    <CardHeader>
                        <CardTitle>Alertes récentes</CardTitle>
                        <CardDescription>Alertes système et notifications des dernières 24 heures</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentAlerts.map((alert) => (
                                <div key={alert.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                    <div className="flex-shrink-0">
                                        {alert.severity === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                                        {alert.severity === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                                        {alert.severity === 'info' && <Activity className="h-5 w-5 text-blue-500" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{alert.message}</p>
                                        <p className="text-xs text-muted-foreground">{alert.timestamp}</p>
                                    </div>
                                    <Badge variant={alert.resolved ? 'secondary' : 'destructive'} className={alert.resolved ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}>
                                        {alert.resolved ? 'Résolu' : 'Actif'}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    );
}
