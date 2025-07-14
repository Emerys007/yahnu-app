
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Globe, BookOpen, Users } from "lucide-react";

// Mock Data
const schools = [
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
  // Add more schools here
];

export async function generateStaticParams() {
    return schools.map((school) => ({
      slug: school.slug,
    }));
  }

export default function SchoolPage({ params }: { params: { slug: string } }) {
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
                                <Button variant="secondary">Learn More</Button>
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
