
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, Download, Eye, Calendar, BarChart3, PieChart as PieChartIcon, TrendingUp, Loader2 } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { exportToCsv } from "@/lib/utils"
import { BarChart, PieChart, ResponsiveContainer, Bar, Pie, XAxis, YAxis, Tooltip, Legend, Cell } from "recharts"

type ReportStatus = 'ready' | 'generating';
type ReportFormat = 'PDF' | 'Excel' | 'CSV';
type ReportType = "Analyses d'utilisateurs" | "Analyses d'emploi" | "Analyses d'entreprise" | "Analyses d'engagement" | "Analyses financières" | "";
type VisualizationType = 'bar' | 'pie' | 'count';

interface SavedReport {
    id: number;
    name: string;
    type: ReportType;
    dateGenerated: string;
    status: ReportStatus;
    format: ReportFormat;
    visualization: VisualizationType;
    dataSource: string;
}

const MOCK_DATA_SOURCE: { [key: string]: any[] } = {
    user_registrations: [
        { name: "Jan", value: 120 }, { name: "Fév", value: 150 }, { name: "Mar", value: 210 }
    ],
    job_applications: [
        { name: "Tech", value: 500 }, { name: "Finance", value: 320 }, { name: "Agro", value: 150 }
    ],
    company_signups: [
        { name: "Q1", value: 15 }, { name: "Q2", value: 25 }, { name: "Q3", value: 22 }
    ],
    profile_completions: [
        { name: 'Complété', value: 980 }, { name: 'Incomplet', value: 270 }
    ],
};
const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const ReportVisualizer = ({ report }: { report: SavedReport | null }) => {
    if (!report) return null;
    const data = MOCK_DATA_SOURCE[report.dataSource] || [];

    switch(report.visualization) {
        case 'bar':
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            );
        case 'pie':
            return (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={data} cx="50%" cy="50%" labelLine={false} outerRadius={80} dataKey="value" nameKey="name">
                            {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            );
        case 'count':
             const total = data.reduce((sum, item) => sum + item.value, 0);
             return <div className="flex h-[300px] items-center justify-center text-6xl font-bold">{total}</div>;
        default:
            return <div>Type de visualisation non pris en charge.</div>
    }
}


export default function CustomReportGeneratorPage() {
    const { toast } = useToast();
    const [reportName, setReportName] = useState("");
    const [reportType, setReportType] = useState<ReportType>("");
    const [dateRange, setDateRange] = useState("");
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [savedReports, setSavedReports] = useState<SavedReport[]>([
        { id: 1, name: "Analyses mensuelles des utilisateurs", type: "Analyses d'utilisateurs", dateGenerated: "2024-01-15", status: "ready", format: "CSV", visualization: 'bar', dataSource: 'user_registrations' },
        { id: 2, name: "Rapport du marché de l'emploi Q4 2023", type: "Analyses d'emploi", dateGenerated: "2024-01-01", status: "ready", format: "CSV", visualization: 'pie', dataSource: 'job_applications' },
    ]);
    const [viewingReport, setViewingReport] = useState<SavedReport | null>(null);

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

    const handleMetricToggle = (metricId: string) => {
        setSelectedMetrics(prev =>
            prev.includes(metricId)
                ? prev.filter(id => id !== metricId)
                : [...prev, metricId]
        );
    };
    
    const handleGenerateReport = () => {
        if (!reportName || !reportType || !dateRange || selectedMetrics.length === 0) {
            toast({
                title: "Champs requis manquants",
                description: "Veuillez remplir tous les champs avant de générer un rapport.",
                variant: "destructive"
            });
            return;
        }

        setIsGenerating(true);
        // Determine visualization based on the first selected metric (simple logic for demo)
        const firstMetric = selectedMetrics[0];
        const visualization: VisualizationType = firstMetric.includes('registrations') ? 'bar' : firstMetric.includes('applications') ? 'pie' : 'count';
        
        const newReport: SavedReport = {
            id: Date.now(),
            name: reportName,
            type: reportType,
            dateGenerated: new Date().toISOString().split('T')[0],
            status: 'generating',
            format: "CSV",
            visualization: visualization,
            dataSource: firstMetric,
        };
        setSavedReports(prev => [newReport, ...prev]);

        setTimeout(() => {
            setSavedReports(prev => prev.map(r => r.id === newReport.id ? { ...r, status: 'ready' } : r));
            setIsGenerating(false);
            toast({
                title: "Rapport généré !",
                description: `Votre rapport "${reportName}" est prêt à être téléchargé.`
            });
            // Reset form
            setReportName("");
            setReportType("");
            setDateRange("");
            setSelectedMetrics([]);
        }, 3000);
    }
    
    const handlePreview = (report: SavedReport) => {
        setViewingReport(report);
    }
    
    const handleDownload = (report: SavedReport) => {
        const data = MOCK_DATA_SOURCE[report.dataSource] || [];
        exportToCsv(data, `${report.name.replace(/\s+/g, '_').toLowerCase()}.csv`);
        toast({
            title: "Téléchargement lancé",
            description: `Le rapport "${report.name}" est en cours de téléchargement.`
        })
    }

    return (
        <>
            <motion.div 
                className="space-y-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg"><FileText className="h-6 w-6 text-primary" /></div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Générateur de Rapports Personnalisés</h1>
                        <p className="text-muted-foreground mt-1">Créez, visualisez et téléchargez des rapports sur mesure basés sur les données de la plateforme.</p>
                    </div>
                </div>
                <div className="grid gap-8 lg:grid-cols-2 items-start">
                    <Card>
                        <CardHeader><CardTitle>Créer un rapport personnalisé</CardTitle><CardDescription>Sélectionnez les métriques et les plages de dates pour générer votre rapport.</CardDescription></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2"><label className="text-sm font-medium">Nom du rapport</label><Input placeholder="Entrer le nom du rapport..." value={reportName} onChange={(e) => setReportName(e.target.value)}/></div>
                            <div className="space-y-2"><label className="text-sm font-medium">Type de rapport</label><Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}><SelectTrigger><SelectValue placeholder="Sélectionner le type de rapport" /></SelectTrigger><SelectContent><SelectItem value="Analyses d'utilisateurs">Analyses d'utilisateurs</SelectItem><SelectItem value="Analyses d'emploi">Analyses d'emploi</SelectItem><SelectItem value="Analyses d'entreprise">Analyses d'entreprise</SelectItem><SelectItem value="Analyses d'engagement">Analyses d'engagement</SelectItem><SelectItem value="Analyses financières">Analyses financières</SelectItem></SelectContent></Select></div>
                            <div className="space-y-2"><label className="text-sm font-medium">Plage de dates</label><Select value={dateRange} onValueChange={setDateRange}><SelectTrigger><SelectValue placeholder="Sélectionner la plage de dates" /></SelectTrigger><SelectContent><SelectItem value="last_7_days">Les 7 derniers jours</SelectItem><SelectItem value="last_30_days">Les 30 derniers jours</SelectItem><SelectItem value="last_3_months">Les 3 derniers mois</SelectItem><SelectItem value="last_6_months">Les 6 derniers mois</SelectItem><SelectItem value="last_year">L'année dernière</SelectItem><SelectItem value="custom">Plage personnalisée</SelectItem></SelectContent></Select></div>
                            <div className="space-y-3"><label className="text-sm font-medium">Sélectionner les métriques</label><div className="space-y-3 max-h-64 overflow-y-auto pr-2 border rounded-md p-4">{availableMetrics.map((metric) => (<div key={metric.id} className="flex items-center space-x-2"><Checkbox id={metric.id} checked={selectedMetrics.includes(metric.id)} onCheckedChange={() => handleMetricToggle(metric.id)} /><label htmlFor={metric.id} className="text-sm font-normal">{metric.label}<span className="text-muted-foreground ml-2">({metric.category})</span></label></div>))}</div></div>
                            <div className="flex gap-3">
                                <Button className="flex-1" onClick={handleGenerateReport} disabled={isGenerating}>
                                    {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                                    {isGenerating ? 'Génération...' : 'Générer le rapport'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Rapports sauvegardés</CardTitle><CardDescription>Accédez aux rapports générés précédemment et téléchargez-les dans divers formats.</CardDescription></CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {savedReports.map((report) => (<div key={report.id} className="border rounded-lg p-4"><div className="flex items-start justify-between mb-3"><div><h4 className="font-medium">{report.name}</h4><p className="text-sm text-muted-foreground">{report.type}</p></div><Badge variant={report.status === 'ready' ? 'default' : 'secondary'} className={report.status === 'ready' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}>{report.status === 'ready' ? 'Prêt' : 'En génération'}</Badge></div><div className="flex items-center justify-between text-sm text-muted-foreground mb-3"><div className="flex items-center gap-2"><Calendar className="h-4 w-4" /><span>Généré: {report.dateGenerated}</span></div><span>Format: {report.format}</span></div>{report.status === 'ready' && (<div className="flex gap-2"><Button variant="outline" size="sm" className="flex-1" onClick={() => handlePreview(report)}><Eye className="h-4 w-4 mr-1" />Voir</Button><Button variant="outline" size="sm" className="flex-1" onClick={() => handleDownload(report)}><Download className="h-4 w-4 mr-1" />Télécharger en {report.format}</Button></div>)}</div>))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
            
            <Dialog open={!!viewingReport} onOpenChange={(isOpen) => !isOpen && setViewingReport(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{viewingReport?.name}</DialogTitle>
                        <DialogDescription>
                            Aperçu du rapport généré le {viewingReport && new Date(viewingReport.dateGenerated).toLocaleDateString('fr-FR')}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                       <ReportVisualizer report={viewingReport} />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
