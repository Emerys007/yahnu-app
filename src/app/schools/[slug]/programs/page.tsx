
"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, Clock, Users } from "lucide-react";
import Link from "next/link";
import { useLocalization } from "@/context/localization-context";

interface School {
    id: string;
    name: string;
    acronym: string;
    logoUrl: string;
    location: string;
    website: string;
    description: string;
    programs: { 
        nameKey: string; 
        duration: string; 
        capacity: string; 
        descriptionKey: string;
    }[];
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
        description: "school_1_description",
        programs: [
            {
                nameKey: "school_1_program_1",
                duration: "5 years",
                capacity: "150 students",
                descriptionKey: "school_1_program_1_description"
            },
            {
                nameKey: "school_1_program_2",
                duration: "5 years", 
                capacity: "120 students",
                descriptionKey: "school_1_program_2_description"
            },
            {
                nameKey: "school_1_program_3",
                duration: "5 years",
                capacity: "200 students",
                descriptionKey: "school_1_program_3_description"
            },
            {
                nameKey: "school_1_program_4",
                duration: "5 years",
                capacity: "100 students",
                descriptionKey: "school_1_program_4_description"
            }
        ],
        slug: "inp-hb",
    },
    {
        id: "2",
        name: "Université Félix Houphouët-Boigny",
        acronym: "UFHB",
        logoUrl: "https://w.univ-fhb.edu.ci/wp-content/uploads/2023/11/logo-UFHB-e1699536639348-1024x747.png",
        location: "Abidjan",
        website: "https://www.univ-fhb.edu.ci",
        description: "school_2_description",
        programs: [
            {
                nameKey: "school_2_program_1",
                duration: "7 years",
                capacity: "300 students",
                descriptionKey: "school_2_program_1_description"
            },
            {
                nameKey: "school_2_program_2",
                duration: "4 years",
                capacity: "250 students",
                descriptionKey: "school_2_program_2_description"
            },
            {
                nameKey: "school_2_program_3",
                duration: "3 years",
                capacity: "400 students",
                descriptionKey: "school_2_program_3_description"
            },
            {
                nameKey: "school_2_program_4",
                duration: "3 years",
                capacity: "200 students",
                descriptionKey: "school_2_program_4_description"
            }
        ],
        slug: "ufhb",
    },
    {
        id: "3",
        name: "Groupe CSI Pôle Polytechnique",
        acronym: "CSI",
        logoUrl: "https://groupecsi-pp.com/wp-content/uploads/2023/05/nouveau-logo.jpeg",
        location: "Abidjan",
        website: "https://www.csi-polytechnique.com",
        description: "school_3_description",
        programs: [
            {
                nameKey: "school_3_program_1",
                duration: "3 years",
                capacity: "180 students",
                descriptionKey: "school_3_program_1_description"
            },
            {
                nameKey: "school_3_program_2",
                duration: "3 years",
                capacity: "200 students",
                descriptionKey: "school_3_program_2_description"
            },
            {
                nameKey: "school_3_program_3",
                duration: "3 years",
                capacity: "120 students",
                descriptionKey: "school_3_program_3_description"
            },
            {
                nameKey: "school_3_program_4",
                duration: "2 years",
                capacity: "100 students",
                descriptionKey: "school_3_program_4_description"
            }
        ],
        slug: "csi",
    },
    {
        id: "4",
        name: "École Supérieure Africaine des TIC",
        acronym: "ESATIC",
        logoUrl: "https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg",
        location: "Abidjan",
        website: "https://www.esatic.edu.ci",
        description: "school_4_description",
        programs: [
            {
                nameKey: "school_4_program_1",
                duration: "3 years",
                capacity: "250 students",
                descriptionKey: "school_4_program_1_description"
            },
            {
                nameKey: "school_4_program_2",
                duration: "3 years",
                capacity: "150 students",
                descriptionKey: "school_4_program_2_description"
            },
            {
                nameKey: "school_4_program_3",
                duration: "3 years",
                capacity: "100 students",
                descriptionKey: "school_4_program_3_description"
            },
            {
                nameKey: "school_4_program_4",
                duration: "2 years",
                capacity: "80 students",
                descriptionKey: "school_4_program_4_description"
            }
        ],
        slug: "esatic",
    },
    {
        id: "5",
        name: "École Nationale Supérieure de Statistique et d'Économie Appliquée",
        acronym: "ENSEA",
        logoUrl: "https://ensea.ed.ci/wp-content/uploads/2021/07/logo_ensea.png",
        location: "Abidjan",
        website: "https://www.ensea.edu.ci",
        description: "school_5_description",
        programs: [
            {
                nameKey: "school_5_program_1",
                duration: "3 years",
                capacity: "120 students",
                descriptionKey: "school_5_program_1_description"
            },
            {
                nameKey: "school_5_program_2",
                duration: "3 years",
                capacity: "150 students",
                descriptionKey: "school_5_program_2_description"
            },
            {
                nameKey: "school_5_program_3",
                duration: "3 years",
                capacity: "80 students",
                descriptionKey: "school_5_program_3_description"
            },
            {
                nameKey: "school_5_program_4",
                duration: "2 years",
                capacity: "100 students",
                descriptionKey: "school_5_program_4_description"
            }
        ],
        slug: "ensea",
    }
];

function getSchoolBySlug(slug: string): School | null {
    const school = schoolsData.find(s => s.slug === slug);
    return school || null;
}

function SchoolProgramsPageClient({ school }: { school: School }) {
  const { t } = useLocalization();

  return (
    <>
      <div className="mb-8">
        <Button asChild variant="ghost" className="mb-4">
          <Link href={`/schools/${school.slug}`} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('common.go_back_to_homepage')} {school.acronym}
          </Link>
        </Button>
        <h1 className="text-4xl font-bold mb-2">{school.acronym} {t('pages.schools.explore_programs')}</h1>
        <p className="text-lg text-muted-foreground">{school.name}</p>
      </div>

      <div className="grid gap-6">
        {school.programs.map((program, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <GraduationCap className="h-6 w-6 text-primary" />
                {t(program.nameKey)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{t(program.descriptionKey)}</p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{program.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{program.capacity}</span>
                </div>
              </div>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/signup">{t('common.apply_now')}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

export default function SchoolProgramsPage({ params }: { params: { slug: string } }) {
  const school = getSchoolBySlug(params.slug);

  if (!school) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <SchoolProgramsPageClient school={school} />
      </main>
      <Footer />
    </div>
  );
}
