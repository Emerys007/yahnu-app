
"use client"

import { useLocalization } from "@/context/localization-context";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, GraduationCap, University, Briefcase, Award, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  ]
};

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
        <CardContent className="p-6">
            <Button onClick={handleContact} className="w-full md:w-auto">
                <MessageSquare className="mr-2 h-4 w-4" />
                {t('Contact Graduate')}
            </Button>
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
