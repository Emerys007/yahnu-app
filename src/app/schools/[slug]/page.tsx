
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Globe } from "lucide-react";
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
    programs: string[];
    slug: string;
}

const schoolsData: School[] = [
    {
        id: "1",
        name: "school_1_name",
        acronym: "INP-HB",
        logoUrl: "/images/University.png",
        location: "Yamoussoukro",
        website: "https://www.inphb.ci",
        description: "school_1_description",
        programs: ["school_1_program_1", "school_1_program_2", "school_1_program_3", "school_1_program_4"],
        slug: "inp-hb",
    },
    {
        id: "2",
        name: "school_2_name",
        acronym: "UFHB",
        logoUrl: "/images/UFHB.png",
        location: "Abidjan",
        website: "https://www.univ-fhb.edu.ci",
        description: "school_2_description",
        programs: ["school_2_program_1", "school_2_program_2", "school_2_program_3", "school_2_program_4"],
        slug: "ufhb",
    },
    {
        id: "3",
        name: "school_3_name",
        acronym: "CSI",
        logoUrl: "/images/CSI.png",
        location: "Abidjan",
        website: "https://www.csi-polytechnique.com",
        description: "school_3_description",
        programs: ["school_3_program_1", "school_3_program_2", "school_3_program_3", "school_3_program_4"],
        slug: "csi",
    }
];

function getSchoolBySlug(slug: string): School | null {
    const school = schoolsData.find(s => s.slug === slug);
    return school || null;
}

// Client Component for rendering the profile
function SchoolProfile({ school }: { school: School }) {
    "use client";
    const { t } = useLocalization();

    return (
        <Card className="overflow-hidden">
            <CardHeader className="p-0">
                 <div className="relative w-full h-48 md:h-64 bg-muted">
                    {/* Placeholder for a banner image */}
                 </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8 -mt-20">
                <div className="flex items-end gap-6">
                    <div className="relative h-32 w-32 rounded-full overflow-hidden border-8 border-background shrink-0 bg-white p-2">
                         <Image
                            src={school.logoUrl}
                            alt={`${t(school.name)} logo`}
                            fill
                            sizes="128px"
                            className="object-contain"
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold">{school.acronym}</h1>
                        <p className="text-muted-foreground text-lg">{t(school.name)}</p>
                    </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8 mt-8">
                    <div className="md:col-span-2">
                        <h2 className="text-2xl font-bold mb-4">{t('About')} {school.acronym}</h2>
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: t(school.description) }} />
                    </div>
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Institution Details')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-muted-foreground"/> <span>{school.location}</span></div>
                                <div className="flex items-center gap-3"><Globe className="h-5 w-5 text-muted-foreground"/> <a href={school.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{school.website}</a></div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="mt-12">
                     <h2 className="text-2xl font-bold mb-4">{t('Featured Programs')}</h2>
                     <div className="space-y-4">
                        {school.programs.map(program => (
                            <Card key={program} className="p-4 flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-lg">{t(program)}</h3>
                                </div>
                                 <Button asChild variant="secondary">
                                    <Link href="/register">{t('Learn More')}</Link>
                                 </Button>
                            </Card>
                        ))}
                     </div>
                </div>
            </CardContent>
        </Card>
    );
}


// Server Component Page
export default async function SchoolPage({ params }: { params: { slug: string } }) {
  const school = getSchoolBySlug(params.slug);

  if (!school) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <SchoolProfile school={school} />
      </main>
      <Footer />
    </div>
  );
}
