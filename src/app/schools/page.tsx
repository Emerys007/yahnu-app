"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Loader2, PlusCircle } from "lucide-react";
import { useLocalization } from "@/context/localization-context";
import React from "react";
import { useCountry } from "@/context/country-context";
import { cn } from "@/lib/utils";

interface School {
    id: string;
    name: string;
    acronym: string;
    logoUrl: string;
    location: string;
    description: string;
    slug: string;
}

const schoolsData: School[] = [
    {
        id: "1",
        name: "pages.schools.school_1_name",
        acronym: "INP-HB",
        logoUrl: "https://www.adminsite.inphb.app/Imagessiteprincipal/Icon.png",
        location: "Yamoussoukro",
        description: "pages.schools.school_1_description",
        slug: "inp-hb",
    },
    {
        id: "2",
        name: "pages.schools.school_2_name",
        acronym: "UFHB",
        logoUrl: "https://w.univ-fhb.edu.ci/wp-content/uploads/2023/11/logo-UFHB-e1699536639348-1024x747.png",
        location: "Abidjan",
        description: "pages.schools.school_2_description",
        slug: "ufhb",
    },
    {
        id: "3",
        name: "pages.schools.school_3_name",
        acronym: "CSI",
        logoUrl: "https://groupecsi-pp.com/wp-content/uploads/2023/05/nouveau-logo.jpeg",
        location: "Abidjan",
        description: "pages.schools.school_3_description",
        slug: "csi",
    },
    {
        id: "4",
        name: "École Supérieure Africaine des TIC",
        acronym: "ESATIC",
        logoUrl: "https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg",
        location: "Abidjan",
        description: "pages.schools.school_4_description",
        slug: "esatic",
    },
    {
        id: "5",
        name: "École Nationale Supérieure de Statistique et d'Économie Appliquée",
        acronym: "ENSEA",
        logoUrl: "https://ensea.ed.ci/wp-content/uploads/2021/07/logo_ensea.png",
        location: "Abidjan",
        description: "pages.schools.school_5_description",
        slug: "ensea",
    }
];

export default function SchoolsPage() {
  const { t, countryName, language } = useLocalization();
  const { country } = useCountry();

  const isLaunchCountry = country.code === 'CI';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-bold tracking-tight">{t('pages.schools.partner_schools')}</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {isLaunchCountry
                    ? t('pages.schools.collaborating_description', { country: language === 'fr' ? 'ivoiriens' : 'Ivorian' })
                    : t('pages.schools.coming_soon_to_country', { country: countryName })
                }
            </p>
        </div>

        {isLaunchCountry ? (
            <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
                    {schoolsData.map((school, index) => {
                        const total = schoolsData.length;
                        const classNames = ['md:col-span-2'];

                        // Mobile: Center last item if uneven
                        if (total % 2 !== 0 && index === total - 1) {
                            classNames.push('col-span-2 flex justify-center');
                        }

                        // Desktop: Center last 1 or 2 items
                        if (total % 3 === 1 && index === total - 1) {
                            classNames.push('md:col-start-3');
                        } else if (total % 3 === 2 && index === total - 2) {
                            classNames.push('md:col-start-2');
                        }

                        return (
                            <Link href={`/schools/${school.slug}`} key={school.id} className={cn(classNames)}>
                                <Card className="group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full w-full max-w-sm text-center md:text-left">
                                    <CardHeader className="p-0">
                                        <div className="relative w-full h-48 bg-muted flex items-center justify-center">
                                            <Image
                                                src={school.logoUrl}
                                                alt={`${school.name} logo`}
                                                width={160}
                                                height={160}
                                                className="object-contain p-8 h-full w-auto"
                                            />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 flex flex-col flex-grow">
                                        <h2 className="text-xl font-bold">{school.acronym}</h2>
                                        <p className="text-sm text-muted-foreground mb-4">{school.name}</p>
                                        <p className="text-muted-foreground flex-grow">{t(school.description)}</p>
                                        <div className="flex items-center justify-center md:justify-start gap-2 mt-4 text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4"/> {school.location}
                                        </div>
                                        <div className="mt-6 flex-grow flex items-end">
                                            <Button asChild className="w-full">
                                                <Link href={`/schools/${school.slug}/programs`} className="flex items-center justify-center">
                                                    {t('pages.schools.explore_programs')} <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"/>
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
                 <Card className="bg-primary/5 border-2 border-dashed border-primary/20">
                    <CardContent className="p-8 text-center flex flex-col items-center justify-center">
                        <PlusCircle className="h-12 w-12 text-primary mb-4" />
                        <h2 className="text-2xl font-bold mb-2">{t('pages.schools.want_to_partner')}</h2>
                        <p className="text-muted-foreground max-w-md mx-auto mb-6">{t('pages.schools.join_network_description')}</p>
                        <Button asChild size="lg">
                            <Link href="/signup?type=school">{t('pages.schools.partner_with_us')}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        ) : (
             <Card className="py-24">
                <CardContent className="text-center">
                    <p className="text-4xl mb-4">🎓</p>
                    <h2 className="text-3xl font-bold mb-2">{t('common.coming_soon')}</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">{t('pages.schools.working_hard_schools', { country: countryName })}</p>
                </CardContent>
            </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}