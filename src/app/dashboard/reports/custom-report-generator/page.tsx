
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Download, Eye, Calendar, BarChart3, PieChart, TrendingUp } from "lucide-react"
import { useState } from "react"

export default function CustomReportGeneratorPage() {
    const [reportName, setReportName] = useState("");
    const [reportType, setReportType] = useState("");
    const [dateRange, setDateRange] = useState("");
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

    const availableMetrics = [
        { id: "user_registrations", label: "Inscriptions d'utilisateurs", category: "Utilisateurs" },
        { id: "job_applications", label: "Candidatures d'emploi", category: "Emplois" },
        { id: "company_signups", label: "Inscriptions d'entreprises", category: "Entreprises" },
        { id: "profile_completions", label: "Complétions de profil", category: "Utilisateurs" },
        { id: "job_postings", label: "Publications d'emploi", category: "Emplois" },
        { id: "interview_schedules", label: "Horaires d'entretien", category: "Recrutement" },
        { id: "partnership_requests", label: "Demandes de partenariat", category: "Partenariats" },
        { id: "platform_engagement", label: "Engagement de la plateforme", category: "Engagement" }
    ];

    const savedReports = [
        {
            id: 1,
            name: "Analyses mensuelles des utilisateurs",
            type: "Analyses d'utilisateurs",
            dateGenerated: "2024-01-15",
            status: "ready",
            format: "PDF"
        },
        {
            id: 2,
            name: "Rapport du marché de l'emploi Q4 2023",
            type: "Analyses d'emploi",
            dateGenerated: "2024-01-01",
            status: "ready",
            format: "Excel"
        },
        {
            id: 3,
            name: "Rapport d'engagement d'entreprise",
            type: "Analyses d'entreprise",
            dateGenerated: "2024-01-12",
            status: "generating",
            format: "PDF"
        }
    ];

    const handleMetricToggle = (metricId: string) => {
        setSelectedMetrics(prev =>
            prev.includes(metricId)
                ? prev.filter(id => id !== metricId)
                : [...prev, metricId]
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                    <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Générateur de Rapports Personnalisés</h1>
                    <p className="text-muted-foreground mt-1">Créez, visualisez et téléchargez des rapports sur mesure basés sur les données de la plateforme.</p>
                </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Report Builder */}
                <Card>
                    <CardHeader>
                        <CardTitle>Créer un rapport personnalisé</CardTitle>
                        <CardDescription>
                            Sélectionnez les métriques et les plages de dates pour générer votre rapport.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nom du rapport</label>
                            <Input
                                placeholder="Entrer le nom du rapport..."
                                value={reportName}
                                onChange={(e) => setReportName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Type de rapport</label>
                            <Select value={reportType} onValueChange={setReportType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner le type de rapport" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user_analytics">Analyses d'utilisateurs</SelectItem>
                                    <SelectItem value="job_analytics">Analyses d'emploi</SelectItem>
                                    <SelectItem value="company_analytics">Analyses d'entreprise</SelectItem>
                                    <SelectItem value="engagement_analytics">Analyses d'engagement</SelectItem>
                                    <SelectItem value="financial_analytics">Analyses financières</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Plage de dates</label>
                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner la plage de dates" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="last_7_days">Les 7 derniers jours</SelectItem>
                                    <SelectItem value="last_30_days">Les 30 derniers jours</SelectItem>
                                    <SelectItem value="last_3_months">Les 3 derniers mois</SelectItem>
                                    <SelectItem value="last_6_months">Les 6 derniers mois</SelectItem>
                                    <SelectItem value="last_year">L'année dernière</SelectItem>
                                    <SelectItem value="custom">Plage personnalisée</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium">Sélectionner les métriques</label>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {availableMetrics.map((metric) => (
                                    <div key={metric.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={metric.id}
                                            checked={selectedMetrics.includes(metric.id)}
                                            onCheckedChange={() => handleMetricToggle(metric.id)}
                                        />
                                        <label htmlFor={metric.id} className="text-sm font-normal">
                                            {metric.label}
                                            <span className="text-muted-foreground ml-2">({metric.category})</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button className="flex-1">
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Générer le rapport
                            </Button>
                            <Button variant="outline">
                                <Eye className="h-4 w-4 mr-1" />
                                Aperçu
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                {/* Saved Reports */}
                <Card>
                    <CardHeader>
                        <CardTitle>Rapports sauvegardés</CardTitle>
                        <CardDescription>
                            Accédez aux rapports générés précédemment et téléchargez-les dans divers formats.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {savedReports.map((report) => (
                                <div key={report.id} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium">{report.name}</h4>
                                            <p className="text-sm text-muted-foreground">{report.type}</p>
                                        </div>
                                        <Badge
                                            variant={report.status === 'ready' ? 'default' : 'secondary'}
                                            className={report.status === 'ready' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                                        >
                                            {report.status === 'ready' ? 
                                                'Prêt' : 
                                                'En génération'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>Généré: {report.dateGenerated}</span>
                                        </div>
                                        <span>Format: {report.format}</span>
                                    </div>
                                    {report.status === 'ready' && (
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1">
                                                <Eye className="h-4 w-4 mr-1" />
                                                Voir
                                            </Button>
                                            <Button variant="outline" size="sm" className="flex-1">
                                                <Download className="h-4 w-4 mr-1" />
                                                Télécharger
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
