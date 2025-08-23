
"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, PlusCircle } from "lucide-react";
import React from "react";
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
        name: "Institut National Polytechnique Félix Houphouët-Boigny",
        acronym: "INP-HB",
        logoUrl: "https://www.adminsite.inphb.app/Imagessiteprincipal/Icon.png",
        location: "Yamoussoukro",
        description: "L'INP-HB est un établissement d'enseignement supérieur de premier plan en Afrique de l'Ouest, formant des ingénieurs et des techniciens hautement qualifiés dans divers domaines.",
        slug: "inp-hb",
    },
    {
        id: "2",
        name: "Université Félix Houphouët-Boigny",
        acronym: "UFHB",
        logoUrl: "https://w.univ-fhb.edu.ci/wp-content/uploads/2023/11/logo-UFHB-e1699536639348-1024x747.png",
        location: "Abidjan",
        description: "La plus grande université de Côte d'Ivoire, offrant une large gamme de programmes académiques en sciences, droit, économie, lettres et santé.",
        slug: "ufhb",
    },
    {
        id: "3",
        name: "Groupe CSI Pôle Polytechnique",
        acronym: "CSI",
        logoUrl: "https://groupecsi-pp.com/wp-content/uploads/2023/05/nouveau-logo.jpeg",
        location: "Abidjan",
        description: "Un groupe d'enseignement supérieur privé de premier plan, axé sur les technologies de l'information, le commerce et l'ingénierie.",
        slug: "csi",
    },
    {
        id: "4",
        name: "École Supérieure Africaine des TIC",
        acronym: "ESATIC",
        logoUrl: "https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg",
        location: "Abidjan",
        description: "Une institution de premier plan dédiée à la formation d'experts en technologies de l'information et de la communication pour le développement de l'Afrique.",
        slug: "esatic",
    },
    {
        id: "5",
        name: "École Nationale Supérieure de Statistique et d'Économie Appliquée",
        acronym: "ENSEA",
        logoUrl: "https://media.licdn.com/dms/image/C4D0BAQG3X2b1q7X0ZA/company-logo_200_200/0/163065company-logo_638_359/ensea_abidjan_logo?e=2147483647&v=beta&t=O_2X9Z8c_3b9b3e3j3e3j3e3j3e3j3e3j3e3j3e",
        location: "Abidjan",
        description: "ENSEA est un centre d'excellence régional pour la formation de statisticiens et d'économistes, jouant un rôle clé dans le développement de l'analyse des données en Afrique.",
        slug: "ensea",
    }
];

export default function SchoolsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-bold tracking-tight">Écoles Partenaires</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Nous collaborons avec les meilleures institutions ivoiriennes pour former la prochaine génération de leaders.
            </p>
        </div>

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
                                    <p className="text-muted-foreground flex-grow">{school.description}</p>
                                    <div className="flex items-center justify-center md:justify-start gap-2 mt-4 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4"/> {school.location}
                                    </div>
                                    <div className="mt-6 flex-grow flex items-end">
                                        <Button asChild className="w-full">
                                            <span className="flex items-center justify-center">
                                                Découvrir les programmes <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </span>
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
                    <h2 className="text-2xl font-bold mb-2">Votre école souhaite-t-elle devenir partenaire ?</h2>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">Rejoignez notre réseau pour offrir à vos diplômés des opportunités de carrière exclusives et renforcer vos liens avec le monde de l'entreprise.</p>
                    <Button asChild size="lg">
                        <Link href="/signup?type=school">Devenir un partenaire</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
