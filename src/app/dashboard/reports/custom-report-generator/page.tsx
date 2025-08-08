"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Download, Eye, Calendar, BarChart3, PieChart, TrendingUp } from "lucide-react"
import { useState } from "react"
import { useLocalization } from "@/context/localization-context"

export default function CustomReportGeneratorPage() {
    const { t } = useLocalization();
    const [reportName, setReportName] = useState("");
    const [reportType, setReportType] = useState("");
    const [dateRange, setDateRange] = useState("");
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

    const availableMetrics = [
        { id: "user_registrations", label: t('language') === 'fr' ? "Inscriptions d'utilisateurs" : "User Registrations", category: t('language') === 'fr' ? "Utilisateurs" : "Users" },
        { id: "job_applications", label: t('language') === 'fr' ? "Candidatures d'emploi" : "Job Applications", category: t('language') === 'fr' ? "Emplois" : "Jobs" },
        { id: "company_signups", label: t('language') === 'fr' ? "Inscriptions d'entreprises" : "Company Sign-ups", category: t('language') === 'fr' ? "Entreprises" : "Companies" },
        { id: "profile_completions", label: t('language') === 'fr' ? "Complétions de profil" : "Profile Completions", category: t('language') === 'fr' ? "Utilisateurs" : "Users" },
        { id: "job_postings", label: t('language') === 'fr' ? "Publications d'emploi" : "Job Postings", category: t('language') === 'fr' ? "Emplois" : "Jobs" },
        { id: "interview_schedules", label: t('language') === 'fr' ? "Horaires d'entretien" : "Interview Schedules", category: t('language') === 'fr' ? "Recrutement" : "Recruitment" },
        { id: "partnership_requests", label: t('language') === 'fr' ? "Demandes de partenariat" : "Partnership Requests", category: t('language') === 'fr' ? "Partenariats" : "Partnerships" },
        { id: "platform_engagement", label: t('language') === 'fr' ? "Engagement de la plateforme" : "Platform Engagement", category: t('language') === 'fr' ? "Engagement" : "Engagement" }
    ];

    const savedReports = [
        {
            id: 1,
            name: t('language') === 'fr' ? "Analyses mensuelles des utilisateurs" : "Monthly User Analytics",
            type: t('language') === 'fr' ? "Analyses d'utilisateurs" : "User Analytics",
            dateGenerated: "2024-01-15",
            status: "ready",
            format: "PDF"
        },
        {
            id: 2,
            name: t('language') === 'fr' ? "Rapport du marché de l'emploi Q4 2023" : "Q4 2023 Job Market Report",
            type: t('language') === 'fr' ? "Analyses d'emploi" : "Job Analytics",
            dateGenerated: "2024-01-01",
            status: "ready",
            format: "Excel"
        },
        {
            id: 3,
            name: t('language') === 'fr' ? "Rapport d'engagement d'entreprise" : "Company Engagement Report",
            type: t('language') === 'fr' ? "Analyses d'entreprise" : "Company Analytics",
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
                    <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.reports.custom_generator.title')}</h1>
                    <p className="text-muted-foreground mt-1">{t('dashboard.reports.custom_generator.description')}</p>
                </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Report Builder */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('language') === 'fr' ? 'Créer un rapport personnalisé' : 'Create Custom Report'}</CardTitle>
                        <CardDescription>
                            {t('dashboard.reports.custom_generator.description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('language') === 'fr' ? 'Nom du rapport' : 'Report Name'}</label>
                            <Input
                                placeholder={t('language') === 'fr' ? 'Entrer le nom du rapport...' : 'Enter report name...'}
                                value={reportName}
                                onChange={(e) => setReportName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('language') === 'fr' ? 'Type de rapport' : 'Report Type'}</label>
                            <Select value={reportType} onValueChange={setReportType}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('language') === 'fr' ? 'Sélectionner le type de rapport' : 'Select report type'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user_analytics">{t('language') === 'fr' ? 'Analyses d\'utilisateurs' : 'User Analytics'}</SelectItem>
                                    <SelectItem value="job_analytics">{t('language') === 'fr' ? 'Analyses d\'emploi' : 'Job Analytics'}</SelectItem>
                                    <SelectItem value="company_analytics">{t('language') === 'fr' ? 'Analyses d\'entreprise' : 'Company Analytics'}</SelectItem>
                                    <SelectItem value="engagement_analytics">{t('language') === 'fr' ? 'Analyses d\'engagement' : 'Engagement Analytics'}</SelectItem>
                                    <SelectItem value="financial_analytics">{t('language') === 'fr' ? 'Analyses financières' : 'Financial Analytics'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('language') === 'fr' ? 'Plage de dates' : 'Date Range'}</label>
                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('language') === 'fr' ? 'Sélectionner la plage de dates' : 'Select date range'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="last_7_days">{t('language') === 'fr' ? 'Les 7 derniers jours' : 'Last 7 Days'}</SelectItem>
                                    <SelectItem value="last_30_days">{t('language') === 'fr' ? 'Les 30 derniers jours' : 'Last 30 Days'}</SelectItem>
                                    <SelectItem value="last_3_months">{t('language') === 'fr' ? 'Les 3 derniers mois' : 'Last 3 Months'}</SelectItem>
                                    <SelectItem value="last_6_months">{t('language') === 'fr' ? 'Les 6 derniers mois' : 'Last 6 Months'}</SelectItem>
                                    <SelectItem value="last_year">{t('language') === 'fr' ? 'L\'année dernière' : 'Last Year'}</SelectItem>
                                    <SelectItem value="custom">{t('language') === 'fr' ? 'Plage personnalisée' : 'Custom Range'}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium">{t('language') === 'fr' ? 'Sélectionner les métriques' : 'Select Metrics'}</label>
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
                                {t('language') === 'fr' ? 'Générer le rapport' : 'Generate Report'}
                            </Button>
                            <Button variant="outline">
                                <Eye className="h-4 w-4 mr-1" />
                                {t('language') === 'fr' ? 'Aperçu' : 'Preview'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                {/* Saved Reports */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('language') === 'fr' ? 'Rapports sauvegardés' : 'Saved Reports'}</CardTitle>
                        <CardDescription>
                            {t('language') === 'fr' ? 'Accédez aux rapports générés précédemment et téléchargez-les dans divers formats.' : 'Access previously generated reports and download them in various formats.'}
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
                                                (t('language') === 'fr' ? 'Prêt' : 'Ready') : 
                                                (t('language') === 'fr' ? 'En génération' : 'Generating')}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>{t('language') === 'fr' ? 'Généré' : 'Generated'}: {report.dateGenerated}</span>
                                        </div>
                                        <span>{t('language') === 'fr' ? 'Format' : 'Format'}: {report.format}</span>
                                    </div>
                                    {report.status === 'ready' && (
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="flex-1">
                                                <Eye className="h-4 w-4 mr-1" />
                                                {t('common.view_profile')}
                                            </Button>
                                            <Button variant="outline" size="sm" className="flex-1">
                                                <Download className="h-4 w-4 mr-1" />
                                                {t('language') === 'fr' ? 'Télécharger' : 'Download'}
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