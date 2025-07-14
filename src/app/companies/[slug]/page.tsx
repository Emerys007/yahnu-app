
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Building, Globe } from "lucide-react";

// Mock Data
const companies = [
  {
    name: "Tech Solutions Abidjan",
    tagline: "Innovating for a digital Africa.",
    logoUrl: "/images/Logo.png",
    location: "Abidjan, Côte d'Ivoire",
    industry: "Information Technology",
    website: "https://techsolutions.ci",
    description: "<p>Tech Solutions Abidjan is a leading provider of innovative technology solutions for businesses across West Africa. We specialize in software development, cloud computing, and cybersecurity.</p><p>Our mission is to empower African businesses with the tools they need to succeed in the digital age. We are committed to fostering a culture of innovation, collaboration, and excellence.</p>",
    jobs: [
      { title: "Senior Frontend Developer", type: "Full-time", location: "Abidjan" },
      { title: "Cloud Infrastructure Engineer", type: "Full-time", location: "Remote" },
      { title: "Lead Product Manager", type: "Full-time", location: "Abidjan" },
    ],
    slug: "tech-solutions-abidjan",
  },
  // Add more companies here
];

export async function generateStaticParams() {
    return companies.map((company) => ({
      slug: company.slug,
    }));
  }

export default function CompanyPage({ params }: { params: { slug: string } }) {
  const company = companies.find((c) => c.slug === params.slug);

  if (!company) {
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
                            src={company.logoUrl}
                            alt={`${company.name} logo`}
                            fill
                            sizes="128px"
                            className="object-cover"
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold">{company.name}</h1>
                        <p className="text-muted-foreground text-lg">"{company.tagline}"</p>
                    </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8 mt-8">
                    <div className="md:col-span-2">
                        <h2 className="text-2xl font-bold mb-4">About {company.name}</h2>
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: company.description }} />
                    </div>
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Company Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-3"><Building className="h-5 w-5 text-muted-foreground"/> <span>{company.industry}</span></div>
                                <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-muted-foreground"/> <span>{company.location}</span></div>
                                <div className="flex items-center gap-3"><Globe className="h-5 w-5 text-muted-foreground"/> <a href={company.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{company.website}</a></div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="mt-12">
                     <h2 className="text-2xl font-bold mb-4">Open Positions</h2>
                     <div className="space-y-4">
                        {company.jobs.map(job => (
                            <Card key={job.title} className="p-4 flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-lg">{job.title}</h3>
                                    <p className="text-muted-foreground">{job.type} &middot; {job.location}</p>
                                </div>
                                <Button>Apply Now</Button>
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
