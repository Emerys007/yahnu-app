
"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Building, ArrowRight, Loader2 } from "lucide-react";
import { useLocalization } from "@/context/localization-context";
import { Logo } from "@/components/logo";
import { getFirestore, collection, getDocs, DocumentData } from "firebase/firestore";
import { app } from "@/lib/firebase";
import React, { useState, useEffect } from "react";
import { useCountry } from "@/context/country-context";

const db = getFirestore(app);

interface Company {
    id: string;
    name: string;
    tagline: string;
    location: string;
    industry: string;
    featuredJobs: string[];
    slug: string;
}

async function getCompanies(): Promise<Company[]> {
    const companiesCol = collection(db, 'companies');
    const companySnapshot = await getDocs(companiesCol);
    const companyList = companySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
    return companyList;
}


export default function CompaniesPage() {
  const { t, countryName } = useLocalization();
  const { country } = useCountry();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
      if (country.code === 'CI') {
        async function loadCompanies() {
            try {
              const fetchedCompanies = await getCompanies();
              setCompanies(fetchedCompanies);
            } catch(error) {
              console.error("Failed to fetch companies:", error)
            } finally {
              setIsLoading(false);
            }
        }
        loadCompanies();
      } else {
        setIsLoading(false);
      }
  }, [country.code])

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

        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        ) : isLaunchCountry ? (
            <div className="space-y-8">
                {companies.map((company) => (
                    <Link href={`/companies/${company.slug}`} key={company.id} className="group block">
                        <Card className="flex flex-col md:flex-row items-center p-6 gap-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <Logo className="h-24 w-24 shrink-0" />
                            <div className="flex-grow text-center md:text-left">
                                <h2 className="text-2xl font-bold">{company.name}</h2>
                                <p className="text-muted-foreground italic">"{company.tagline}"</p>
                                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 mt-2 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1"><Building className="h-4 w-4"/> {company.industry}</span>
                                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4"/> {company.location}</span>
                                </div>
                            </div>
                            <div className="w-full md:w-1/3 text-center md:text-left">
                                <h3 className="font-semibold mb-2 text-primary">{t('Featured Positions')}:</h3>
                                <ul className="space-y-1 text-sm">
                                    {company.featuredJobs.map((job) => (
                                        <li key={job} className="flex items-center gap-2 justify-center md:justify-start">
                                            <Briefcase className="h-4 w-4 text-muted-foreground"/> 
                                            <span>{job}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="self-center mt-4 md:mt-0">
                                <Button>
                                    {t('View Profile')} <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"/>
                                </Button>
                            </div>
                        </Card>
                    </Link>
                ))}
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
