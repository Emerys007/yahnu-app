"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Building, ArrowRight } from "lucide-react";
import { useLocalization } from "@/context/localization-context";

const companiesData = {
  en: [
    {
      name: "Tech Solutions Abidjan",
      tagline: "Innovating for a digital Africa.",
      logoUrl: "/images/Logo.png",
      location: "Abidjan, Côte d'Ivoire",
      industry: "Information Technology",
      featuredJobs: [
        "Senior Frontend Developer",
        "Cloud Infrastructure Engineer",
        "Lead Product Manager",
      ],
      slug: "tech-solutions-abidjan",
    },
      {
      name: "AgriBiz Côte d'Ivoire",
      tagline: "Sowing the seeds of progress.",
      logoUrl: "/images/job-agronomist.jpg",
      location: "Yamoussoukro, Côte d'Ivoire",
      industry: "Agriculture",
      featuredJobs: [
        "Agronomist",
        "Supply Chain Manager",
        "Data Analyst (Agriculture)",
      ],
      slug: "agribiz-cote-divoire",
    },
    {
      name: "Finance & Forte",
      tagline: "Your trusted financial partner.",
      logoUrl: "/images/LogoYahnu.png",
      location: "Abidjan, Côte d'Ivoire",
      industry: "Finance",
      featuredJobs: [
        "Financial Analyst",
        "Investment Banker",
        "Compliance Officer",
      ],
      slug: "finance-forte",
    },
  ],
  fr: [
    {
      name: "Tech Solutions Abidjan",
      tagline: "Innover pour une Afrique numérique.",
      logoUrl: "/images/Logo.png",
      location: "Abidjan, Côte d'Ivoire",
      industry: "Technologies de l'information",
      featuredJobs: [
        "Développeur Frontend Senior",
        "Ingénieur en infrastructure Cloud",
        "Chef de produit principal",
      ],
      slug: "tech-solutions-abidjan",
    },
      {
      name: "AgriBiz Côte d'Ivoire",
      tagline: "Semer les graines du progrès.",
      logoUrl: "/images/job-agronomist.jpg",
      location: "Yamoussoukro, Côte d'Ivoire",
      industry: "Agriculture",
      featuredJobs: [
        "Agronome",
        "Responsable de la chaîne d'approvisionnement",
        "Analyste de données (Agriculture)",
      ],
      slug: "agribiz-cote-divoire",
    },
    {
      name: "Finance & Forte",
      tagline: "Votre partenaire financier de confiance.",
      logoUrl: "/images/LogoYahnu.png",
      location: "Abidjan, Côte d'Ivoire",
      industry: "Finance",
      featuredJobs: [
        "Analyste Financier",
        "Banquier d'affaires",
        "Agent de conformité",
      ],
      slug: "finance-forte",
    },
  ]
};

export default function CompaniesPage() {
  const { language, t } = useLocalization();
  const companies = companiesData[language as keyof typeof companiesData] || companiesData.en;
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-bold tracking-tight">{t('Featured Companies')}</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {t("Discover leading companies in Côte d'Ivoire that are hiring top talent. Your next career opportunity awaits.")}
            </p>
        </div>

        <div className="space-y-8">
            {companies.map((company) => (
                <Card key={company.name} className="flex flex-col md:flex-row items-center p-6 gap-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-muted shrink-0">
                         <Image
                            src={company.logoUrl}
                            alt={`${company.name} logo`}
                            fill
                            sizes="96px"
                            className="object-cover"
                        />
                    </div>
                    <div className="flex-grow text-center md:text-left">
                        <h2 className="text-2xl font-bold">{company.name}</h2>
                        <p className="text-muted-foreground italic">"{company.tagline}"</p>
                        <div className="flex items-center justify-center md:justify-start gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Building className="h-4 w-4"/> {company.industry}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-4 w-4"/> {company.location}</span>
                        </div>
                    </div>
                    <div className="w-full md:w-1/3 text-center md:text-left">
                        <h3 className="font-semibold mb-2 text-primary">{t('Featured Positions')}:</h3>
                        <ul className="space-y-1 text-sm">
                            {company.featuredJobs.map((job) => (
                                <li key={job} className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-muted-foreground"/> 
                                    <span>{job}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="self-center">
                        <Button asChild>
                            <Link href={`/companies/${company.slug}`}>
                                {t('View Profile')} <ArrowRight className="ml-2 h-4 w-4"/>
                            </Link>
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
