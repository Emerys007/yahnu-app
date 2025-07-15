
"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Loader2 } from "lucide-react";
import { useLocalization } from "@/context/localization-context";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { app } from "@/lib/firebase";
import React, { useState, useEffect } from "react";
import { useCountry } from "@/context/country-context";

const db = getFirestore(app);

interface School {
    id: string;
    name: string;
    acronym: string;
    logoUrl: string;
    location: string;
    description: string;
    slug: string;
}

async function getSchools(): Promise<School[]> {
    const schoolsCol = collection(db, 'schools');
    const schoolSnapshot = await getDocs(schoolsCol);
    const schoolList = schoolSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as School));
    return schoolList;
}

export default function SchoolsPage() {
  const { t, countryName } = useLocalization();
  const { country } = useCountry();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (country.code === 'CI') {
        async function loadSchools() {
            try {
                const fetchedSchools = await getSchools();
                setSchools(fetchedSchools);
            } catch(error) {
                console.error("Failed to fetch schools:", error)
            } finally {
                setIsLoading(false);
            }
        }
        loadSchools();
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
            <h1 className="text-5xl font-bold tracking-tight">{t('Partner Schools')}</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {isLaunchCountry
                    ? t('Collaborating with the finest institutions to nurture the next generation of Ivorian leaders.')
                    : t('Coming Soon to {country}', { country: countryName })
                }
            </p>
        </div>

        {isLoading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        ) : isLaunchCountry ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {schools.map((school) => (
                    <Link href={`/schools/${school.slug}`} key={school.id} className="group block">
                        <Card className="group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full">
                            <CardHeader className="p-0">
                                <div className="relative w-full h-48 bg-muted">
                                    <Image
                                        src={school.logoUrl}
                                        alt={`${school.name} logo`}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        className="object-contain p-8"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 flex flex-col flex-grow">
                                <h2 className="text-xl font-bold">{school.acronym}</h2>
                                <p className="text-sm text-muted-foreground flex-grow">{school.name}</p>
                                <p className="mt-4 text-muted-foreground flex-grow">{t(school.description)}</p>
                                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
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
                ))}
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
