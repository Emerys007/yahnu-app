
"use client";

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import { SchoolProfileClient } from "@/components/schools/school-profile-client";
import Link from "next/link";

interface School {
    id: string;
    name: string;
    acronym: string;
    logoUrl: string;
    location: string;
    website: string;
    description: string;
    programs: string[];
    slug: string;
}

const schoolsData: School[] = [
    {
        id: "1",
        name: "Institut National Polytechnique Félix Houphouët-Boigny",
        acronym: "INP-HB",
        logoUrl: "https://www.adminsite.inphb.app/Imagessiteprincipal/Icon.png",
        location: "Yamoussoukro",
        website: "https://www.inphb.ci",
        description: "L'INP-HB est une institution d'excellence reconnue en Afrique, formant des ingénieurs et des techniciens supérieurs dans les domaines de l'industrie, du commerce, et de l'administration. Elle est réputée pour sa rigueur et la qualité de ses programmes académiques.",
        programs: ["Génie Civil", "Génie Électrique et Électronique", "Informatique et Télécommunications", "Sciences et Techniques Commerciales"],
        slug: "inp-hb",
    },
    {
        id: "2",
        name: "Université Félix Houphouët-Boigny",
        acronym: "UFHB",
        logoUrl: "https://w.univ-fhb.edu.ci/wp-content/uploads/2023/11/logo-UFHB-e1699536639348-1024x747.png",
        location: "Abidjan",
        website: "https://www.univ-fhb.edu.ci",
        description: "L'Université Félix Houphouët-Boigny est la plus grande et la plus ancienne université de Côte d'Ivoire. Elle offre une vaste gamme de formations dans les sciences humaines, juridiques, économiques, et de la santé, contribuant de manière significative à la formation des cadres du pays.",
        programs: ["Droit", "Sciences Économiques et de Gestion", "Médecine", "Lettres, Langues et Civilisations"],
        slug: "ufhb",
    },
    {
        id: "3",
        name: "Groupe CSI Pôle Polytechnique",
        acronym: "CSI",
        logoUrl: "https://groupecsi-pp.com/wp-content/uploads/2023/05/nouveau-logo.jpeg",
        location: "Abidjan",
        website: "https://groupecsi-pp.com/",
        description: "Le Groupe CSI est un pôle d'enseignement supérieur privé axé sur l'innovation et la technologie. Il propose des formations professionnalisantes en informatique, gestion, et sciences de l'ingénieur, avec un fort accent sur l'employabilité.",
        programs: ["Réseaux Informatiques et Télécommunications", "Développement d'Applications", "Marketing et Management", "Finance et Comptabilité"],
        slug: "csi",
    },
    {
        id: "4",
        name: "École Supérieure Africaine des TIC",
        acronym: "ESATIC",
        logoUrl: "https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg",
        location: "Abidjan",
        website: "https://esatic.ci/",
        description: "ESATIC est l'école de référence en Côte d'Ivoire pour les métiers des Technologies de l'Information et de la Communication. Elle forme des experts pour accompagner la transformation numérique de l'Afrique.",
        programs: ["Sécurité des Systèmes d'Information", "Systèmes et Réseaux Informatiques", "Télécommunications", "Développement d'Applications"],
        slug: "esatic",
    },
    {
        id: "5",
        name: "École Nationale Supérieure de Statistique et d'Économie Appliquée",
        acronym: "ENSEA",
        logoUrl: "https://media.licdn.com/dms/image/C4D0BAQG3X2b1q7X0ZA/company-logo_200_200/0/163065company-logo_638_359/ensea_abidjan_logo?e=2147483647&v=beta&t=O_2X9Z8c_3b9b3e3j3e3j3e3j3e3j3e3j3e3j3e",
        location: "Abidjan",
        website: "https://www.ensea.ed.ci/",
        description: "L'ENSEA est un centre d'excellence de l'UEMOA pour la formation de statisticiens et d'économistes de haut niveau. Ses diplômés sont très recherchés pour leurs compétences en analyse quantitative et en modélisation économique.",
        programs: ["Ingénieur Statisticien Économiste", "Analyste Statisticien", "Actuariat", "Data Science"],
        slug: "ensea",
    }
];

function getSchoolBySlug(slug: string): School | null {
    const school = schoolsData.find(s => s.slug === slug);
    return school || null;
}

export default function SchoolPage({ params }: { params: { slug: string } }) {
  const school = getSchoolBySlug(params.slug);

  if (!school) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12 max-w-4xl">
         <div className="max-w-4xl mx-auto mb-8">
          <Link href="/schools" className="text-primary hover:underline">← Retour aux écoles</Link>
        </div>
        <SchoolProfileClient school={school} />
      </main>
      <Footer />
    </div>
  );
}
