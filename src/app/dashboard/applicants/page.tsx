
"use client"

import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText } from "lucide-react"
import { motion } from "framer-motion"

// Mock Data
const graduateApplications = [
  { jobTitle: "Développeur Frontend", company: "Innovate Inc.", status: "En cours d'examen" },
  { jobTitle: "Chef de Produit", company: "DataDriven Co.", status: "Candidature envoyée" },
  { jobTitle: "Designer UX/UI", company: "Solutions Créatives", status: "Entretien prévu" },
  { jobTitle: "Data Scientist", company: "QuantumLeap", status: "Offre faite" },
  { jobTitle: "Ingénieur DevOps", company: "CloudNine", status: "Rejetée" },
];

const companyApplicants = [
    { applicantName: "Amina Diallo", jobTitle: "Développeur Frontend", status: "Nouveau candidat" },
    { applicantName: "Ben Traoré", jobTitle: "Développeur Frontend", status: "En cours d'examen" },
    { applicantName: "Chloe Dubois", jobTitle: "Chef de Produit", status: "Entretien prévu" },
    { applicantName: "David Garcia", jobTitle: "Chef de Produit", status: "Rejeté" },
];

const statusOptions = [
    "Nouveau candidat", 
    "Candidature envoyée", 
    "En cours d'examen", 
    "Entretien prévu", 
    "Offre faite", 
    "Rejeté"
];

const statusColors: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    "Nouveau candidat": "default",
    "Candidature envoyée": "default",
    "En cours d'examen": "secondary",
    "Entretien prévu": "outline",
    "Offre faite": "default",
    "Rejeté": "destructive",
    "Rejetée": "destructive"
};


const GraduateApplications = () => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Titre du poste</TableHead>
                    <TableHead>Entreprise</TableHead>
                    <TableHead>Statut</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {graduateApplications.map((app, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium">{app.jobTitle}</TableCell>
                        <TableCell>{app.company}</TableCell>
                        <TableCell>
                             <Badge variant={statusColors[app.status] || "default"}>{app.status}</Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const CompanyApplications = () => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nom du candidat</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead className="text-right">Statut</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {companyApplicants.map((app, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium">{app.applicantName}</TableCell>
                        <TableCell>{app.jobTitle}</TableCell>
                        <TableCell className="text-right w-48">
                            <Select defaultValue={app.status}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map(opt => (
                                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

export default function ApplicantsPage() {
  const { role } = useAuth();
  const isCompany = role === 'company';

  return (
    <motion.div 
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
       <div className="flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suivi des candidatures</h1>
          <p className="text-muted-foreground mt-1">
              {isCompany ? 'Gérez les candidats pour vos offres d\'emploi.' : 'Suivez le statut de vos candidatures.'}
          </p>
        </div>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>
            {isCompany ? 'Pipeline de candidats' : 'Mes candidatures'}
          </CardTitle>
          <CardDescription>
            {isCompany ? 'Examinez et mettez à jour le statut des candidats qui ont postulé à vos offres.' : 'Un aperçu de toutes les offres auxquelles vous avez postulé.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isCompany ? <CompanyApplications /> : <GraduateApplications />}
        </CardContent>
      </Card>
    </motion.div>
  )
}
