
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Globe } from "lucide-react";
import { useLocalization } from "@/context/localization-context";

// Mock Data
const schoolsData = {
  en: [
    {
      name: "Institut National Polytechnique Félix Houphouët-Boigny",
      acronym: "INP-HB",
      logoUrl: "/images/University.png",
      location: "Yamoussoukro",
      website: "https://www.inphb.ci",
      description: "<p>The INP-HB is a public polytechnic institution in Yamoussoukro, Côte d'Ivoire. It was founded in 1996 and is one of the most prestigious engineering schools in West Africa.</p><p>The institute offers a wide range of programs in engineering, technology, and applied sciences. It is known for its strong ties with industry and its commitment to research and innovation.</p>",
      programs: [
        "Computer Science & Engineering",
        "Civil Engineering",
        "Mechanical Engineering",
        "Electrical Engineering",
        "Agronomy",
      ],
      slug: "inp-hb",
    },
  ],
  fr: [
    {
      name: "Institut National Polytechnique Félix Houphouët-Boigny",
      acronym: "INP-HB",
      logoUrl: "/images/University.png",
      location: "Yamoussoukro",
      website: "https://www.inphb.ci",
      description: "<p>L'INP-HB est une institution polytechnique publique à Yamoussoukro, Côte d'Ivoire. Elle a été fondée en 1996 et est l'une des écoles d'ingénieurs les plus prestigieuses d'Afrique de l'Ouest.</p><p>L'institut propose une large gamme de programmes en ingénierie, technologie et sciences appliquées. Il est reconnu pour ses liens étroits avec l'industrie et son engagement en faveur de la recherche et de l'innovation.</p>",
      programs: [
        "Génie Informatique",
        "Génie Civil",
        "Génie Mécanique",
        "Génie Électrique",
        "Agronomie",
      ],
      slug: "inp-hb",
    },
  ]
};


export async function generateStaticParams() {
    return schoolsData.en.map((school) => ({
      slug: school.slug,
    }));
  }

export default function SchoolPage({ params }: { params: { slug: string } }) {
  const { language, t } = useLocalization();
  const schools = schoolsData[language as keyof typeof schoolsData] || schoolsData.en;
  const school = schools.find((s) => s.slug === params.slug);

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
                    <div className="relative h-32 w-32 rounded-full overflow-hidden border-8 border-background shrink-0">
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
                        <h2 className="text-2xl font-bold mb-4">{t('About')} {school.acronym}</h2>
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: school.description }} />
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
                                    <h3 className="font-semibold text-lg">{program}</h3>
                                </div>
                                <Button variant="secondary">{t('Learn More')}</Button>
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
