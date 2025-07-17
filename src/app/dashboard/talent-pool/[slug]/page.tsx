
"use client"

import { useLocalization } from "@/context/localization-context";
import { notFound, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, GraduationCap, University, Briefcase, Award, MessageSquare, Send, CheckCircle2 } from "lucide-react";
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
      email: "amina.diallo@example.com",
      phone: "+225 01 02 03 04 05",
      skills: ["React", "TypeScript", "Node.js", "GraphQL", "Next.js", "Figma"], 
      badges: ["Frontend Development (React)"],
      available: true,
      experience: "2 years as a Frontend Developer at Tech Solutions Abidjan. Developed and maintained responsive web applications using React and TypeScript. Collaborated with UI/UX designers to implement pixel-perfect designs.",
      education: [
        { degree: "Master's Degree", field: "Computer Science", gradYear: "2022", verified: true },
        { degree: "Bachelor's Degree", field: "Software Engineering", gradYear: "2020", verified: false }
      ],
    },
    { 
      name: "Ben Traoré", 
      slug: "ben-traore",
      school: "UFHB", 
      email: "ben.traore@example.com",
      phone: "+225 02 03 04 05 06",
      skills: ["Marketing", "Project Management", "Salesforce", "Market Analysis"],
      badges: [],
      available: false,
      experience: "Marketing Intern at Finance & Forte. Assisted in market research and creating marketing campaigns. Managed social media accounts and analyzed engagement metrics.",
      education: [
        { degree: "Bachelor's Degree", field: "Business Administration", gradYear: "2023", verified: true }
      ],
    },
    { 
      name: "Chloe Dubois", 
      slug: "chloe-dubois",
      school: "Groupe CSI", 
      email: "chloe.dubois@example.com",
      phone: "+225 03 04 05 06 07",
      skills: ["AutoCAD", "PLC", "Matlab", "Circuit Design", "Power Systems"], 
      badges: [],
      available: true,
      experience: "Intern at Ivoirienne d'Électricité. Assisted in the design and maintenance of electrical grids. Conducted simulations using Matlab.",
      education: [
         { degree: "Bachelor's Degree", field: "Electrical Engineering", gradYear: "2023", verified: false }
      ],
    },
    { 
      name: "David Kone", 
      slug: "david-kone",
      school: "INP-HB", 
      email: "david.kone@example.com",
      phone: "+225 04 05 06 07 08",
      skills: ["Crop Science", "Soil Analysis", "Pest Management", "GIS", "Sustainable Agriculture"],
      badges: ["Modern Agronomy Principles"],
      available: true,
      experience: "Field Agronomist at AgriBiz Côte d'Ivoire. Conducted soil and crop analysis to improve yield. Implemented sustainable farming practices.",
      education: [
        { degree: "Master's Degree", field: "Agronomy", gradYear: "2021", verified: true }
      ],
    },
    { 
      name: "Elise Fofana", 
      slug: "elise-fofana",
      school: "UFHB", 
      email: "elise.fofana@example.com",
      phone: "+225 05 06 07 08 09",
      skills: ["Financial Modeling", "Excel", "Valuation", "Risk Analysis", "Bloomberg Terminal"], 
      badges: ["Financial Analysis Fundamentals"],
      available: true,
      experience: "Financial Analyst at Finance & Forte. Developed financial models for investment valuation. Conducted market research and risk analysis.",
      education: [
        { degree: "Master's Degree", field: "Finance", gradYear: "2022", verified: true }
      ],
    },
  ],
  fr: [
    { 
      name: "Amina Diallo", 
      slug: "amina-diallo",
      school: "INP-HB", 
      email: "amina.diallo@example.com",
      phone: "+225 01 02 03 04 05",
      skills: ["React", "TypeScript", "Node.js", "GraphQL", "Next.js", "Figma"],
      badges: ["Développement Frontend (React)"],
      available: true,
      experience: "2 ans en tant que Développeuse Frontend chez Tech Solutions Abidjan. Développé et maintenu des applications web réactives en utilisant React et TypeScript. Collaboré avec les designers UI/UX pour implémenter des maquettes parfaites.",
      education: [
        { degree: "Master", field: "Génie Informatique", gradYear: "2022", verified: true },
        { degree: "Licence", field: "Génie Logiciel", gradYear: "2020", verified: false }
      ],
    },
    { 
      name: "Ben Traoré", 
      slug: "ben-traore",
      school: "UFHB", 
      email: "ben.traore@example.com",
      phone: "+225 02 03 04 05 06",
      skills: ["Marketing", "Gestion de projet", "Salesforce", "Analyse de marché"],
      badges: [],
      available: false,
      experience: "Stagiaire en marketing chez Finance & Forte. A assisté à la recherche de marché et à la création de campagnes marketing. A géré les comptes de médias sociaux et analysé les métriques d'engagement.",
      education: [
        { degree: "Licence", field: "Administration des Affaires", gradYear: "2023", verified: true }
      ],
    },
    { 
      name: "Chloe Dubois", 
      slug: "chloe-dubois",
      school: "Groupe CSI", 
      email: "chloe.dubois@example.com",
      phone: "+225 03 04 05 06 07",
      skills: ["AutoCAD", "API", "Matlab", "Conception de circuits", "Systèmes d'alimentation"],
      badges: [], 
      available: true,
      experience: "Stagiaire à l'Ivoirienne d'Électricité. A participé à la conception et à la maintenance des réseaux électriques. A réalisé des simulations avec Matlab.",
      education: [
         { degree: "Licence", field: "Génie Électrique", gradYear: "2023", verified: false }
      ],
    },
    { 
      name: "David Kone", 
      slug: "david-kone",
      school: "INP-HB", 
      email: "david.kone@example.com",
      phone: "+225 04 05 06 07 08",
      skills: ["Phytotechnie", "Analyse de sol", "Lutte antiparasitaire", "SIG", "Agriculture durable"],
      badges: ["Principes d'Agronomie Moderne"],
      available: true,
      experience: "Agronome de terrain chez AgriBiz Côte d'Ivoire. A effectué des analyses de sol et de culture pour améliorer le rendement. A mis en œuvre des pratiques agricoles durables.",
      education: [
        { degree: "Master", field: "Agronomie", gradYear: "2021", verified: true }
      ],
    },
    { 
      name: "Elise Fofana", 
      slug: "elise-fofana",
      school: "UFHB", 
      email: "elise.fofana@example.com",
      phone: "+225 05 06 07 08 09",
      skills: ["Modélisation financière", "Excel", "Évaluation", "Analyse des risques", "Terminal Bloomberg"], 
      badges: ["Principes de l'Analyse Financière"],
      available: true,
      experience: "Analyste financier chez Finance & Forte. A développé des modèles financiers pour l'évaluation des investissements. A effectué des études de marché et des analyses de risques.",
      education: [
        { degree: "Master", field: "Finance", gradYear: "2022", verified: true }
      ],
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
  const router = useRouter();
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
      description: `${t('Redirecting to messages...')}`
    });
    router.push(`/dashboard/messages?new=${graduate.slug}`);
  }

  const mainFieldOfStudy = graduate.education.length > 0 ? graduate.education[0].field : "Graduate";

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
                    <CardDescription className="text-lg">{t(mainFieldOfStudy)}</CardDescription>
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
          <CardContent className="space-y-4">
            {localizedGraduate.education.map((edu, index) => (
                <div key={index} className="p-3 border rounded-lg">
                    <p className="font-semibold">{t(edu.degree)} {t('in')} {t(edu.field)}</p>
                    <p className="text-sm text-muted-foreground">{t('Graduated')}: {edu.gradYear}</p>
                    {edu.verified && (
                        <Badge variant="secondary" className="mt-2 gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {t('Verified by School')}
                        </Badge>
                    )}
                </div>
            ))}
          </CardContent>
        </Card>
      </div>

       <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Award /> {t('Skills & Certifications')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
                <h4 className="font-semibold text-sm mb-2">{t('Self-Reported Skills')}</h4>
                <div className="flex flex-wrap gap-2">
                {localizedGraduate.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-sm py-1 px-3">
                        {skill}
                    </Badge>
                ))}
                </div>
            </div>
            {localizedGraduate.badges && localizedGraduate.badges.length > 0 && (
                 <div>
                    <h4 className="font-semibold text-sm mb-2">{t('Verified Skills')}</h4>
                    <div className="flex flex-wrap gap-2">
                    {localizedGraduate.badges.map((badge) => (
                        <Badge key={badge} variant="secondary" className="text-sm py-1 px-3 gap-1.5">
                             <CheckCircle2 className="h-3.5 w-3.5" />
                            {t(badge)}
                        </Badge>
                    ))}
                    </div>
                </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}

