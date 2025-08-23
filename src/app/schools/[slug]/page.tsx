
"use client";

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import { SchoolProfileClient } from "@/components/schools/school-profile-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocalization } from "@/context/localization-context";

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
        description: "pages.schools.school_1_description",
        programs: ["pages.schools.school_1_program_1", "pages.schools.school_1_program_2", "pages.schools.school_1_program_3", "pages.schools.school_1_program_4"],
        slug: "inp-hb",
    },
    {
        id: "2",
        name: "Université Félix Houphouët-Boigny",
        acronym: "UFHB",
        logoUrl: "https://w.univ-fhb.edu.ci/wp-content/uploads/2023/11/logo-UFHB-e1699536639348-1024x747.png",
        location: "Abidjan",
        website: "https://www.univ-fhb.edu.ci",
        description: "pages.schools.school_2_description",
        programs: ["pages.schools.school_2_program_1", "pages.schools.school_2_program_2", "pages.schools.school_2_program_3", "pages.schools.school_2_program_4"],
        slug: "ufhb",
    },
    {
        id: "3",
        name: "Groupe CSI Pôle Polytechnique",
        acronym: "CSI",
        logoUrl: "https://groupecsi-pp.com/wp-content/uploads/2023/05/nouveau-logo.jpeg",
        location: "Abidjan",
        website: "https://groupecsi-pp.com/",
        description: "pages.schools.school_3_description",
        programs: ["pages.schools.school_3_program_1", "pages.schools.school_3_program_2", "pages.schools.school_3_program_3", "pages.schools.school_3_program_4"],
        slug: "csi",
    },
    {
        id: "4",
        name: "École Supérieure Africaine des TIC",
        acronym: "ESATIC",
        logoUrl: "https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg",
        location: "Abidjan",
        website: "https://esatic.ci/",
        description: "pages.schools.school_4_description",
        programs: ["pages.schools.school_4_program_1", "pages.schools.school_4_program_2", "pages.schools.school_4_program_3", "pages.schools.school_4_program_4"],
        slug: "esatic",
    },
    {
        id: "5",
        name: "École Nationale Supérieure de Statistique et d'Économie Appliquée",
        acronym: "ENSEA",
        logoUrl: "https://media.licdn.com/dms/image/C4D0BAQG3X2b1q7X0ZA/company-logo_200_200/0/163065company-logo_638_359/ensea_abidjan_logo?e=2147483647&v=beta&t=O_2X9Z8c_3b9b3e3j3e3j3e3j3e3j3e3j3e3j3e",
        location: "Abidjan",
        website: "https://www.ensea.ed.ci/",
        description: "pages.schools.school_5_description",
        programs: ["pages.schools.school_5_program_1", "pages.schools.school_5_program_2", "pages.schools.school_5_program_3", "pages.schools.school_5_program_4"],
        slug: "ensea",
    }
];

function getSchoolBySlug(slug: string): School | null {
    const school = schoolsData.find(s => s.slug === slug);
    return school || null;
}

export default function SchoolPage({ params }: { params: { slug: string } }) {
  const { t } = useLocalization();
  const school = getSchoolBySlug(params.slug);

  if (!school) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12 max-w-4xl">
 <div className="max-w-4xl mx-auto mb-8">
          <Link href="/schools" className="text-primary hover:underline">← {t('common.back_to_schools')}</Link>
        </div>
        <SchoolProfileClient school={school} />
      </main>
      <Footer />
    </div>
  );
}
