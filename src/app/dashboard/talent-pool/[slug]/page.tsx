
"use client"

import { useLocalization } from "@/context/localization-context";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, GraduationCap, University, Briefcase, Award, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label";

const graduatesData = {
  en: [
    { 
      name: "Amina Diallo",
      slug: "amina-diallo", 
      school: "INP-HB", 
      field: "Computer Science",
      email: "amina.diallo@example.com",
      phone: "+225 01 02 03 04 05",
      skills: ["React", "TypeScript", "Node.js", "GraphQL", "Next.js", "Figma"], 
      available: true,
      experience: "2 years as a Frontend Developer at Tech Solutions Abidjan. Developed and maintained responsive web applications using React and TypeScript. Collaborated with UI/UX designers to implement pixel-perfect designs.",
      education: "Master's Degree in Computer Science, INP-HB (2022)\nBachelor's Degree in Software Engineering, INP-HB (2020)",
    },
    { 
      name: "Ben Traoré", 
      slug: "ben-traore",
      school: "UFHB", 
      field: "Business Administration", 
      email: "ben.traore@example.com",
      phone: "+225 02 03 04 05 06",
      skills: ["Marketing", "Project Management", "Salesforce", "Market Analysis"], 
      available: false,
      experience: "Marketing Intern at Finance & Forte. Assisted in market research and creating marketing campaigns. Managed social media accounts and analyzed engagement metrics.",
      education: "Bachelor's Degree in Business Administration, UFHB (2023)",
    },
    { 
      name: "Chloe Dubois", 
      slug: "chloe-dubois",
      school: "Groupe CSI", 
      field: "Electrical Engineering", 
      email: "chloe.dubois@example.com",
      phone: "+225 03 04 05 06 07",
      skills: ["AutoCAD", "PLC", "Matlab", "Circuit Design", "Power Systems"], 
      available: true,
      experience: "Intern at Ivoirienne d'Électricité. Assisted in the design and maintenance of electrical grids. Conducted simulations using Matlab.",
      education: "Bachelor's Degree in Electrical Engineering, Groupe CSI (2023)",
    },
    { 
      name: "David Kone", 
      slug: "david-kone",
      school: "INP-HB", 
      field: "Agronomy", 
      email: "david.kone@example.com",
      phone: "+225 04 05 06 07 08",
      skills: ["Crop Science", "Soil Analysis", "Pest Management", "GIS", "Sustainable Agriculture"], 
      available: true,
      experience: "Field Agronomist at AgriBiz Côte d'Ivoire. Conducted soil and crop analysis to improve yield. Implemented sustainable farming practices.",
      education: "Master's Degree in Agronomy, INP-HB (2021)",
    },
    { 
      name: "Elise Fofana", 
      slug: "elise-fofana",
      school: "UFHB", 
      field: "Finance", 
      email: "elise.fofana@example.com",
      phone: "+225 05 06 07 08 09",
      skills: ["Financial Modeling", "Excel", "Valuation", "Risk Analysis", "Bloomberg Terminal"], 
      available: true,
      experience: "Financial Analyst at Finance & Forte. Developed financial models for investment valuation. Conducted market research and risk analysis.",
      education: "Master's Degree in Finance, UFHB (2022)",
    },
  ],
  fr: [
    { 
      name: "Amina Diallo", 
      slug: "amina-diallo",
      school: "INP-HB", 
      field: "Génie Informatique", 
      email: "amina.diallo@example.com",
      phone: "+225 01 02 03 04 05",
      skills: ["React", "TypeScript", "Node.js", "GraphQL", "Next.js", "Figma"], 
      available: true,
      experience: "2 ans en tant que Développeuse Frontend chez Tech Solutions Abidjan. Développé et maintenu des applications web réactives en utilisant React et TypeScript. Collaboré avec les designers UI/UX pour implémenter des maquettes parfaites.",
      education: "Master en Génie Informatique, INP-HB (2022)\nLicence en Génie Logiciel, INP-HB (2020)",
    },
    { 
      name: "Ben Traoré", 
      slug: "ben-traore",
      school: "UFHB", 
      field: "Administration des affaires", 
      email: "ben.traore@example.com",
      phone: "+225 02 03 04 05 06",
      skills: ["Marketing", "Gestion de projet", "Salesforce", "Analyse de marché"], 
      available: false,
      experience: "Stagiaire en marketing chez Finance & Forte. A assisté à la recherche de marché et à la création de campagnes marketing. A géré les comptes de médias sociaux et analysé les métriques d'engagement.",
      education: "Licence en Administration des Affaires, UFHB (2023)",
    },
    { 
      name: "Chloe Dubois", 
      slug: "chloe-dubois",
      school: "Groupe CSI", 
      field: "Génie Électrique", 
      email: "chloe.dubois@example.com",
      phone: "+225 03 04 05 06 07",
      skills: ["AutoCAD", "API", "Matlab", "Conception de circuits", "Systèmes d'alimentation"], 
      available: true,
      experience: "Stagiaire à l'Ivoirienne d'Électricité. A participé à la conception et à la maintenance des réseaux électriques. A réalisé des simulations avec Matlab.",
      education: "Licence en Génie Électrique, Groupe CSI (2023)",
    },
    { 
      name: "David Kone", 
      slug: "david-kone",
      school: "INP-HB", 
      field: "Agronomie", 
      email: "david.kone@example.com",
      phone: "+225 04 05 06 07 08",
      skills: ["Phytotechnie", "Analyse de sol", "Lutte antiparasitaire", "SIG", "Agriculture durable"], 
      available: true,
      experience: "Agronome de terrain chez AgriBiz Côte d'Ivoire. A effectué des analyses de sol et de culture pour améliorer le rendement. A mis en œuvre des pratiques agricoles durables.",
      education: "Master en Agronomie, INP-HB (2021)",
    },
    { 
      name: "Elise Fofana", 
      slug: "elise-fofana",
      school: "UFHB", 
      field: "Finance", 
      email: "elise.fofana@example.com",
      phone: "+225 05 06 07 08 09",
      skills: ["Modélisation financière", "Excel", "Évaluation", "Analyse des risques", "Terminal Bloomberg"], 
      available: true,
      experience: "Analyste financier chez Finance & Forte. A développé des modèles financiers pour l'évaluation des investissements. A effectué des études de marché et des analyses de risques.",
      education: "Master en Finance, UFHB (2022)",
    },
  ]
};

const companyJobs = [
    { id: "swe1", title: "Software Engineer, Frontend" },
    { id: "pm1", title: "Product Manager" },
]

const InviteDialog = ({ graduateName }: { graduateName: string }) => {
    const { t } = useLocalization();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const handleSendInvite = () => {
        toast({
            title: t('Invitation Sent'),
            description: `${t('An invitation to apply has been sent to')} ${graduateName}.`
        })
        setIsOpen(false);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Send className="mr-2 h-4 w-4" />
                    {t('Invite to Apply')}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('Invite {name} to a Job', { name: graduateName })}</DialogTitle>
                    <DialogDescription>
                        {t('Select one of your open positions to invite this candidate to apply.')}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="job-select">{t('Select a Job Posting')}</Label>
                    <Select>
                        <SelectTrigger id="job-select">
                            <SelectValue placeholder={t('Choose a job...')} />
                        </SelectTrigger>
                        <SelectContent>
                            {companyJobs.map(job => (
                                <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button onClick={handleSendInvite}>{t('Send Invitation')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function GraduateProfilePage({ params }: { params: { slug: string } }) {
  const { language, t } = useLocalization();
  const { toast } = useToast();
  const allGraduates = [...graduatesData.en, ...graduatesData.fr];
  const graduate = allGraduates.find((g) => g.slug === params.slug);
  
  // Get the localized version of the found graduate
  const localizedGraduates = graduatesData[language as keyof typeof graduatesData] || graduatesData.en;
  const localizedGraduate = localizedGraduates.find((g) => g.slug === params.slug);


  if (!graduate || !localizedGraduate) {
    notFound();
  }

  const handleContact = () => {
    toast({
      title: t('Contact Initiated'),
      description: `${t('A message has been sent to')} ${graduate.name}. ${t('They will be notified of your interest.')}`
    })
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="bg-muted/30">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Image
              src="https://placehold.co/200x200.png"
              alt={graduate.name}
              width={128}
              height={128}
              className="rounded-full border-4 border-background"
            />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-3xl">{graduate.name}</CardTitle>
                    <CardDescription className="text-lg">{t(graduate.field)}</CardDescription>
                  </div>
                  <Badge variant={graduate.available ? "secondary" : "outline"}>
                    <span className={cn("mr-2 h-2 w-2 rounded-full", graduate.available ? "bg-green-500" : "bg-gray-400")}></span>
                    {graduate.available ? t('Available') : t('Unavailable')}
                  </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2"><University className="h-4 w-4" /> {graduate.school}</span>
                <span className="flex items-center gap-2"><Mail className="h-4 w-4" /> {graduate.email}</span>
                <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> {graduate.phone}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 flex gap-2">
            <Button onClick={handleContact} variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                {t('Contact Graduate')}
            </Button>
            <InviteDialog graduateName={graduate.name} />
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Briefcase /> {t('Work Experience')}</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm text-muted-foreground whitespace-pre-line">
            {t(localizedGraduate.experience)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GraduationCap /> {t('Education')}</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm text-muted-foreground whitespace-pre-line">
            {t(localizedGraduate.education)}
          </CardContent>
        </Card>
      </div>

       <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Award /> {t('Skills')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {localizedGraduate.skills.map((skill) => (
              <Badge key={skill} variant="secondary" className="text-sm py-1 px-3">
                {skill}
              </Badge>
            ))}
          </CardContent>
        </Card>
    </div>
  );
}
