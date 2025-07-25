
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
        name: "school_1_name",
        acronym: "INP-HB",
        logoUrl: "https://www.inphb.ci/templates/inphb/images/logo.png",
        location: "Yamoussoukro",
        description: "school_desc_1",
        slug: "inp-hb",
    },
    {
        id: "2",
        name: "school_2_name",
        acronym: "UFHB",
        logoUrl: "https://ufhb.edu.ci/wp-content/uploads/2022/07/LOGO-UFHB-1.png",
        location: "Abidjan",
        description: "school_desc_2",
        slug: "ufhb",
    },
    {
        id: "3",
        name: "school_3_name",
        acronym: "CSI",
        logoUrl: "https://csipolytechnique.ci/wp-content/uploads/2023/03/logo-csi.png",
        location: "Abidjan",
        description: "school_desc_3",
        slug: "csi",
    }
];

export default function SchoolsPage() {
  const { t, countryName } = useLocalization();
  const { country } = useCountry();

  const isLaunchCountry = country.code === 'CI';
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-bold tracking-tight">{t('Partner Schools')}</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {isLaunchCountry
                    ? t('Collaborating with the finest institutions to nurture the next generation of {country} leaders.', { country: 'Ivorian' })
                    : t('Coming Soon to {country}', { country: countryName })
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
                                                alt={`${t(school.name)} logo`}
                                                width={160}
                                                height={160}
                                                className="object-contain p-8 h-full w-auto"
                                            />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6 flex flex-col flex-grow">
                                        <h2 className="text-xl font-bold">{school.acronym}</h2>
                                        <p className="text-sm text-muted-foreground mb-4">{t(school.name)}</p>
                                        <p className="text-muted-foreground flex-grow">{t(school.description)}</p>
                                        <div className="flex items-center justify-center md:justify-start gap-2 mt-4 text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4"/> {school.location}
                                        </div>
                                        <div className="mt-6 flex-grow flex items-end">
                                            <Button asChild className="w-full">
                                                <div className="flex items-center justify-center">
                                                    {t('Explore Programs')} <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"/>
                                                </div>
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
                        <h2 className="text-2xl font-bold mb-2">{t('Want to Partner With Us?')}</h2>
                        <p className="text-muted-foreground max-w-md mx-auto mb-6">{t('Join our network to connect your graduates with leading companies and track their success.')}</p>
                        <Button asChild size="lg">
                            <Link href="/signup?type=school">{t('Partner With Us')}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        ) : (
             <Card className="py-24">
                <CardContent className="text-center">
                    <p className="text-4xl mb-4">🎓</p>
                    <h2 className="text-3xl font-bold mb-2">{t('Coming Soon!')}</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">{t('We are working hard to bring Yahnu schools to {country}. Stay tuned!', { country: countryName })}</p>
                </CardContent>
            </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
