
"use client";

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import { CompanyProfileClient } from "./company-profile-client";

interface CompanyProfile {
    id: string;
    name: string;
    slug: string;
    tagline: string;
    logoUrl: string;
    location: string;
    industry: string;
    website: string;
    description: string;
    jobs: { title: string; type: string; location: string }[];
}

const companiesData: CompanyProfile[] = [
    {
        id: "1",
        name: "Orange Côte d'Ivoire",
        slug: "orange-ci",
        tagline: "Vous rapprocher de l'essentiel",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/c/c8/Orange_logo.svg",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Télécommunications",
        website: "https://www.orange.ci",
        description: "Orange Côte d'Ivoire est un leader des télécommunications, offrant une large gamme de services mobiles, internet et de paiement mobile. Nous nous engageons à connecter les Ivoiriens et à soutenir la transformation numérique du pays.",
        jobs: [
            { title: "Ingénieur Réseau Senior", type: "Temps plein", location: "Abidjan" },
            { title: "Chef de Produit Mobile Money", type: "Temps plein", location: "Abidjan" },
            { title: "Data Scientist", type: "Temps plein", location: "Abidjan" }
        ],
    },
    {
        id: "2",
        name: "SIFCA",
        slug: "sifca",
        tagline: "Le leader de l'agro-industrie en Afrique de l'Ouest",
        logoUrl: "https://groupesifca.com/wp-content/uploads/2021/04/Logotype_Sifca-1.png",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Agriculture",
        website: "https://www.groupesifca.com",
        description: "SIFCA est un groupe agro-industriel ivoirien spécialisé dans la production et la commercialisation d'huile de palme, de caoutchouc et de sucre. Nous contribuons activement au développement économique et social des communautés locales.",
        jobs: [
            { title: "Ingénieur Agronome", type: "Temps plein", location: "Yamoussoukro" },
            { title: "Contrôleur de Gestion", type: "Temps plein", location: "Abidjan" },
            { title: "Responsable Logistique", type: "Temps plein", location: "Abidjan" }
        ],
    },
     {
        id: "3",
        name: "Bridge Bank Group",
        slug: "bridge-bank-group",
        tagline: "Au-delà de la banque",
        logoUrl: "https://www.bridgebankgroup.com/images/interface/logo-white.svg",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Finance & Banque",
        website: "https://www.bridgebankgroup.com",
        description: "Bridge Bank Group Côte d’Ivoire est une banque commerciale axée sur les PME et les grandes entreprises. Nous offrons des solutions de financement innovantes et un accompagnement personnalisé pour soutenir la croissance de nos clients.",
        jobs: [
            { title: "Analyste Financier", type: "Temps plein", location: "Abidjan" },
            { title: "Chargé d'Affaires Entreprises", type: "Temps plein", location: "Abidjan" },
            { title: "Gestionnaire de Risque de Crédit", type: "Temps plein", location: "Abidjan" }
        ],
    },
     {
        id: "4",
        name: "Ceva Logistics",
        slug: "ceva-logistics",
        tagline: "Ce qui vous anime, nous anime.",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/6/62/CEVA_Logistics_New_Logo.png",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Transport & Logistique",
        website: "https://www.cevalogistics.com/fr",
        description: "CEVA Logistics, filiale du Groupe CMA CGM, est un acteur mondial de la logistique et du transport. Nous proposons des solutions de chaîne d'approvisionnement complètes pour les entreprises de toutes tailles, du fret aérien et maritime à la logistique contractuelle.",
        jobs: [
            { title: "Déclarant en Douane", type: "Temps plein", location: "San-Pédro" },
            { title: "Responsable d'Entrepôt", type: "Temps plein", location: "Abidjan" },
            { title: "Affréteur Routier", type: "Temps plein", location: "Abidjan" }
        ],
    },
];

function getCompanyBySlug(slug: string): CompanyProfile | null {
    const company = companiesData.find((c) => c.slug === slug);
    return company || null;
}

export default function CompanyPage({ params }: { params: { slug: string } }) {
  const company = getCompanyBySlug(params.slug);


  if (!company) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background" data-hs-event-name="company_viewed">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <CompanyProfileClient company={company} />
      </main>
      <Footer />
    </div>
  );
}
