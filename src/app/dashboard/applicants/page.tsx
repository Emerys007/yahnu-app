
"use client"

import { useAuth } from "@/context/auth-context"
import { useLocalization } from "@/context/localization-context"
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
  { jobTitle: "Frontend Developer", company: "Innovate Inc.", status: "Under Review" },
  { jobTitle: "Product Manager", company: "DataDriven Co.", status: "Application Sent" },
  { jobTitle: "UX/UI Designer", company: "Creative Solutions", status: "Interview Scheduled" },
  { jobTitle: "Data Scientist", company: "QuantumLeap", status: "Offer Made" },
  { jobTitle: "DevOps Engineer", company: "CloudNine", status: "Rejected" },
];

const companyApplicants = [
    { applicantName: "Amina Diallo", jobTitle: "Frontend Developer", status: "New Applicant" },
    { applicantName: "Ben Traoré", jobTitle: "Frontend Developer", status: "Under Review" },
    { applicantName: "Chloe Dubois", jobTitle: "Product Manager", status: "Interview Scheduled" },
    { applicantName: "David Garcia", jobTitle: "Product Manager", status: "Rejected" },
];

const statusOptions = ["New Applicant", "Application Sent", "Under Review", "Interview Scheduled", "Offer Made", "Rejected"];

const statusColors: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    "New Applicant": "default",
    "Application Sent": "default",
    "Under Review": "secondary",
    "Interview Scheduled": "outline",
    "Offer Made": "default",
    "Rejected": "destructive"
};


const GraduateApplications = () => {
    const { t } = useLocalization();
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('Job Title')}</TableHead>
                    <TableHead>{t('Company')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {graduateApplications.map((app, index) => (
                    <TableRow key={index}>
                        <TableCell className="font-medium">{app.jobTitle}</TableCell>
                        <TableCell>{app.company}</TableCell>
                        <TableCell>
                             <Badge variant={statusColors[app.status] || "default"}>{t(app.status)}</Badge>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const CompanyApplications = () => {
    const { t } = useLocalization();
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('Applicant Name')}</TableHead>
                    <TableHead>{t('Position')}</TableHead>
                    <TableHead className="text-right">{t('Status')}</TableHead>
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
                                        <SelectItem key={opt} value={opt}>{t(opt)}</SelectItem>
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
  const { t } = useLocalization();

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
          <h1 className="text-3xl font-bold tracking-tight">{t('Application Tracking')}</h1>
          <p className="text-muted-foreground mt-1">
              {isCompany ? t('Manage applicants for your job postings.') : t('Track the status of your job applications.')}
          </p>
        </div>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>
            {isCompany ? t('Applicant Pipeline') : t('My Applications')}
          </CardTitle>
          <CardDescription>
            {isCompany ? t('Review and update the status of candidates who have applied to your roles.') : t('An overview of all the jobs you have applied for.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isCompany ? <CompanyApplications /> : <GraduateApplications />}
        </CardContent>
      </Card>
    </motion.div>
  )
}
