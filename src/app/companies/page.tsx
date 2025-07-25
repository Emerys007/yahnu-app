
"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Building, ArrowRight, Loader2, PlusCircle } from "lucide-react";
import { useLocalization } from "@/context/localization-context";
import { useCountry } from "@/context/country-context";
import React, { useState, useEffect } from "react";

interface Company {
    id: string;
    name: string;
    tagline: string;
    location: string;
    industry: string;
    featuredJobs: string[];
    slug: string;
    logoUrl: string;
}

const companiesData: Company[] = [
    {
        id: "1",
        name: "Orange Côte d'Ivoire",
        slug: "orange-ci",
        tagline: "company_1_tagline",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Telecommunications",
        featuredJobs: ["company_1_job_1", "company_1_job_2", "company_1_job_3"],
        logoUrl: "/images/Orange.png"
    },
    {
        id: "2",
        name: "SIFCA",
        slug: "sifca",
        tagline: "company_2_tagline",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Agriculture",
        featuredJobs: ["company_2_job_1", "company_2_job_2", "company_2_job_3"],
        logoUrl: "/images/SIFCA.png"
    },
    {
        id: "3",
        name: "Bridge Bank Group",
        slug: "bridge-bank-group",
        tagline: "company_3_tagline",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Finance & Banking",
        featuredJobs: ["company_3_job_1", "company_3_job_2", "company_3_job_3"],
        logoUrl: "/images/BridgeBank.png"
    },
    {
        id: "4",
        name: "Bolloré Logistics",
        slug: "bollore-logistics",
        tagline: "company_4_tagline",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Transportation & Logistics",
        featuredJobs: ["company_4_job_1", "company_4_job_2", "company_4_job_3"],
        logoUrl: "/images/Bollore.png"
    },
];

export default function CompaniesPage() {
  const { t, countryName } = useLocalization();
  const { country } = useCountry();
  
  const isLaunchCountry = country.code === 'CI';
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-bold tracking-tight">{t('Featured Companies')}</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {isLaunchCountry 
                    ? t("Discover leading companies in Côte d'Ivoire that are hiring top talent. Your next career opportunity awaits.") 
                    : t('Coming Soon to {country}', { country: countryName })
                }
            </p>
        </div>

        {isLaunchCountry ? (
            <div className="space-y-8">
                {companiesData.map((company) => (
                    <Link href={`/companies/${company.slug}`} key={company.id} className="group block">
                        <Card className="flex flex-col md:flex-row items-center p-6 gap-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <Image src={company.logoUrl} alt={`${company.name} Logo`} width={96} height={96} className="h-24 w-24 shrink-0 object-contain" />
                            <div className="flex-grow text-center md:text-left">
                                <h2 className="text-2xl font-bold">{company.name}</h2>
                                <p className="text-muted-foreground italic">"{t(company.tagline)}"</p>
                                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 mt-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1"><Building className="h-4 w-4"/> {t(company.industry)}</span>
                                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4"/> {company.location}</span>
                                </div>
                            </div>
                            <div className="w-full md:w-1/3 text-center md:text-left">
                                <h3 className="font-semibold mb-2 text-primary">{t('Featured Positions')}:</h3>
                                <ul className="space-y-1 text-sm">
                                    {company.featuredJobs.map((job) => (
                                        <li key={job} className="flex items-center gap-2 justify-center md:justify-start">
                                            <Briefcase className="h-4 w-4 text-muted-foreground"/> 
                                            <span>{t(job)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="self-center mt-4 md:mt-0">
                                <Button asChild>
                                    <div className="flex items-center">
                                        {t('View Profile')} <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"/>
                                    </div>
                                </Button>
                            </div>
                        </Card>
                    </Link>
                ))}
                 <Card className="bg-primary/5 border-2 border-dashed border-primary/20">
                    <CardContent className="p-8 text-center flex flex-col items-center justify-center">
                        <PlusCircle className="h-12 w-12 text-primary mb-4" />
                        <h2 className="text-2xl font-bold mb-2">{t('Is Your Company Next?')}</h2>
                        <p className="text-muted-foreground max-w-md mx-auto mb-6">{t('Join Yahnu to access a pool of pre-vetted, top-tier talent from the best institutions in {country}.')}</p>
                        <Button asChild size="lg">
                            <Link href="/signup?type=company">{t('Become a Partner Company')}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        ) : (
            <Card className="py-24">
                <CardContent className="text-center">
                    <p className="text-4xl mb-4">🚀</p>
                    <h2 className="text-3xl font-bold mb-2">{t('Coming Soon!')}</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">{t('We are working hard to bring Yahnu companies to {country}. Stay tuned!', { country: countryName })}</p>
                </CardContent>
            </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
