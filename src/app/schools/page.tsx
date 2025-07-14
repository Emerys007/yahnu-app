"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight } from "lucide-react";
import { useLocalization } from "@/context/localization-context";

const schoolsData = {
  en: [
    {
      name: "Institut National Polytechnique Félix Houphouët-Boigny",
      acronym: "INP-HB",
      logoUrl: "/images/University.png",
      location: "Yamoussoukro",
      description: "A leading polytechnic institution in West Africa, known for its rigorous engineering and technology programs.",
      slug: "inp-hb",
    },
    {
      name: "Université Félix Houphouët-Boigny",
      acronym: "UFHB",
      logoUrl: "/images/LogoYahnu.png",
      location: "Abidjan",
      description: "The largest university in Côte d'Ivoire, offering a wide range of programs in sciences, arts, and humanities.",
      slug: "ufhb",
    },
    {
      name: "Groupe CSI Pôle Polytechnique",
      acronym: "CSI",
      logoUrl: "/images/Logo.png",
      location: "Abidjan",
      description: "A private university renowned for its focus on technology, engineering, and business management.",
      slug: "csi",
    },
  ],
  fr: [
    {
      name: "Institut National Polytechnique Félix Houphouët-Boigny",
      acronym: "INP-HB",
      logoUrl: "/images/University.png",
      location: "Yamoussoukro",
      description: "Une institution polytechnique de premier plan en Afrique de l'Ouest, connue pour ses programmes rigoureux en ingénierie et technologie.",
      slug: "inp-hb",
    },
    {
      name: "Université Félix Houphouët-Boigny",
      acronym: "UFHB",
      logoUrl: "/images/LogoYahnu.png",
      location: "Abidjan",
      description: "La plus grande université de Côte d'Ivoire, offrant une large gamme de programmes en sciences, arts et sciences humaines.",
      slug: "ufhb",
    },
    {
      name: "Groupe CSI Pôle Polytechnique",
      acronym: "CSI",
      logoUrl: "/images/Logo.png",
      location: "Abidjan",
      description: "Une université privée réputée pour son accent sur la technologie, l'ingénierie et la gestion des affaires.",
      slug: "csi",
    },
  ],
};


export default function SchoolsPage() {
  const { language, t } = useLocalization();
  const schools = schoolsData[language as keyof typeof schoolsData] || schoolsData.en;
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-bold tracking-tight">{t('Partner Schools')}</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('Collaborating with the finest institutions to nurture the next generation of Ivorian leaders.')}
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {schools.map((school) => (
                 <Card key={school.slug} className="group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <CardHeader className="p-0">
                        <div className="relative w-full h-48 bg-muted">
                             <Image
                                src={school.logoUrl}
                                alt={`${school.name} logo`}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-contain p-4"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 flex flex-col flex-grow">
                        <h2 className="text-xl font-bold">{school.acronym}</h2>
                        <p className="text-sm text-muted-foreground flex-grow">{school.name}</p>
                        <p className="mt-4 text-muted-foreground flex-grow">{school.description}</p>
                        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4"/> {school.location}
                        </div>
                         <Button asChild className="mt-6 w-full">
                            <Link href={`/schools/${school.slug}`}>
                                {t('Explore Programs')} <ArrowRight className="ml-2 h-4 w-4"/>
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
