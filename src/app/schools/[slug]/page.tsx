
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Globe } from "lucide-react";
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
        logoUrl: "/images/University.png",
        location: "Yamoussoukro",
        website: "https://www.inphb.ci",
        description: "<p>The Institut National Polytechnique Félix Houphouët-Boigny (INP-HB) is a public polytechnic institute in Yamoussoukro, Côte d'Ivoire. It is a leading institution for engineering, technology, and agricultural sciences in West Africa.</p>",
        programs: ["Computer Science & Engineering", "Civil Engineering", "Agronomy", "Mines & Geology"],
        slug: "inp-hb",
    },
    {
        id: "2",
        name: "Université Félix Houphouët-Boigny",
        acronym: "UFHB",
        logoUrl: "/images/UFHB.png",
        location: "Abidjan",
        website: "https://www.univ-fhb.edu.ci",
        description: "<p>The Université Félix Houphouët-Boigny (formerly the University of Cocody) is the largest university in Côte d'Ivoire. It offers a comprehensive range of programs across multiple faculties, including medicine, law, economics, and humanities.</p>",
        programs: ["Economics & Management", "Law", "Medicine", "Letters, Arts and Human Sciences"],
        slug: "ufhb",
    },
    {
        id: "3",
        name: "Groupe CSI Pôle Polytechnique",
        acronym: "CSI",
        logoUrl: "/images/CSI.png",
        location: "Abidjan",
        website: "https://www.csi-polytechnique.com",
        description: "<p>Groupe CSI Pôle Polytechnique is a well-regarded private higher education institution in Abidjan. It focuses on providing quality education in technology, industrial sciences, and management to meet the demands of the modern workforce.</p>",
        programs: ["Industrial Technology", "Computer Networks & Telecommunications", "Finance & Accounting", "Human Resource Management"],
        slug: "csi",
    }
];

async function getSchoolBySlug(slug: string): Promise<School | null> {
    const school = schoolsData.find(s => s.slug === slug);
    return school || null;
}

export async function generateStaticParams() {
    return schoolsData.map((school) => ({
      slug: school.slug,
    }));
}

export default async function SchoolPage({ params }: { params: { slug: string } }) {
  const school = await getSchoolBySlug(params.slug);

  if (!school) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
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
                            alt={`${school.name} logo`}
                            fill
                            sizes="128px"
                            className="object-contain"
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold">{school.acronym}</h1>
                        <p className="text-muted-foreground text-lg">{school.name}</p>
                    </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8 mt-8">
                    <div className="md:col-span-2">
                        <h2 className="text-2xl font-bold mb-4">About {school.acronym}</h2>
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: school.description }} />
                    </div>
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Institution Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-muted-foreground"/> <span>{school.location}</span></div>
                                <div className="flex items-center gap-3"><Globe className="h-5 w-5 text-muted-foreground"/> <a href={school.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{school.website}</a></div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="mt-12">
                     <h2 className="text-2xl font-bold mb-4">Featured Programs</h2>
                     <div className="space-y-4">
                        {school.programs.map(program => (
                            <Card key={program} className="p-4 flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-lg">{program}</h3>
                                </div>
                                 <Button asChild variant="secondary">
                                    <Link href="/register">Learn More</Link>
                                </Button>
                            </Card>
                        ))}
                     </div>
                </div>
            </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
