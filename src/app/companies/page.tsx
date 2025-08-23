
"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Building, ArrowRight, PlusCircle } from "lucide-react";

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
        tagline: "Vous rapprocher de l'essentiel",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Télécommunications",
        featuredJobs: ["Ingénieur Réseau Senior", "Chef de Produit Mobile Money", "Data Scientist"],
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c8/Orange_logo.svg"
    },
    {
        id: "2",
        name: "SIFCA",
        slug: "sifca",
        tagline: "Le leader de l'agro-industrie en Afrique de l'Ouest",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Agriculture",
        featuredJobs: ["Ingénieur Agronome", "Contrôleur de Gestion", "Responsable Logistique"],
        logoUrl: "https://groupesifca.com/wp-content/uploads/2021/04/Logotype_Sifca-1.png"
    },
    {
        id: "3",
        name: "Bridge Bank Group",
        slug: "bridge-bank-group",
        tagline: "Au-delà de la banque",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Finance & Banque",
        featuredJobs: ["Analyste Financier", "Chargé d'Affaires Entreprises", "Gestionnaire de Risque"],
        logoUrl: "https://www.bridgebankgroup.com/images/interface/logo-white.svg"
    },
    {
        id: "4",
        name: "Ceva Logistics",
        slug: "ceva-logistics",
        tagline: "Ce qui vous anime, nous anime.",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Transport & Logistique",
        featuredJobs: ["Déclarant en Douane", "Responsable d'Entrepôt", "Affréteur Routier"],
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/6/62/CEVA_Logistics_New_Logo.png"
    },
];

export default function CompaniesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-bold tracking-tight">Entreprises Partenaires</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Découvrez les entreprises leaders qui recrutent les meilleurs talents ivoiriens sur Yahnu.
            </p>
        </div>
        <div className="space-y-8">
            {companiesData.map((company) => (
                <Link href={`/companies/${company.slug}`} key={company.id} className="group block">
                    <Card className="flex flex-col md:flex-row items-center p-6 gap-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <Image src={company.logoUrl} alt={`${company.name} Logo`} width={96} height={96} className="h-24 w-24 shrink-0 object-contain" />
                        <div className="flex-grow text-center md:text-left">
                            <h2 className="text-2xl font-bold">{company.name}</h2>
                            <p className="text-muted-foreground italic">"{company.tagline}"</p>
                            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><Building className="h-4 w-4"/> {company.industry}</span>
                                <span className="flex items-center gap-1"><MapPin className="h-4 w-4"/> {company.location}</span>
                            </div>
                        </div>
                        <div className="w-full md:w-1/3 text-center md:text-left">
                            <h3 className="font-semibold mb-2 text-primary">Postes à la une :</h3>
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
                            <Button asChild>
                                <div className="flex items-center">
                                    Voir le profil <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"/>
                                </div>
                            </Button>
                        </div>
                    </Card>
                </Link>
            ))}
             <Card className="bg-primary/5 border-2 border-dashed border-primary/20">
                <CardContent className="p-8 text-center flex flex-col items-center justify-center">
                    <PlusCircle className="h-12 w-12 text-primary mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Votre entreprise est-elle la prochaine ?</h2>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">Rejoignez la plateforme Yahnu pour accéder à un vivier de talents qualifiés et prêts à l'emploi issus des meilleures écoles de Côte d'Ivoire.</p>
                    <Button asChild size="lg">
                        <Link href="/signup?type=company">Devenir une entreprise partenaire</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
