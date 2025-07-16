
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Building, Globe } from "lucide-react";
import Link from "next/link";

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
        tagline: "La vie change avec Orange",
        logoUrl: "/images/Orange.png",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Telecommunications",
        website: "https://www.orange.ci",
        description: "<p>Orange Côte d'Ivoire is a leading telecommunications operator in Côte d'Ivoire, offering mobile, fixed, and internet services. As a key player in the digital economy, we are committed to innovation and providing our customers with an unparalleled experience.</p>",
        jobs: [
            { title: "Tech Lead - Mobile Money", type: "Full-time", location: "Abidjan" },
            { title: "Marketing Manager", type: "Full-time", location: "Abidjan" },
            { title: "Network Engineer", type: "Full-time", location: "Abidjan" }
        ],
    },
    {
        id: "2",
        name: "SIFCA",
        slug: "sifca",
        tagline: "Le leader de l'agro-industrie en Afrique de l'Ouest",
        logoUrl: "/images/SIFCA.png",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Agriculture",
        website: "https://www.groupesifca.com",
        description: "<p>SIFCA is a leading agro-industrial group specializing in the cultivation, processing, and marketing of palm oil, natural rubber, and sugar cane. With a strong commitment to sustainable development, SIFCA plays a major role in the economies of West Africa.</p>",
        jobs: [
            { title: "Agronomist", type: "Full-time", location: "Yamoussoukro" },
            { title: "Supply Chain Manager", type: "Full-time", location: "Abidjan" },
            { title: "Financial Analyst", type: "Full-time", location: "Abidjan" }
        ],
    },
     {
        id: "3",
        name: "Bridge Bank Group",
        slug: "bridge-bank-group",
        tagline: "Votre partenaire pour la croissance",
        logoUrl: "/images/BridgeBank.png",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Finance & Banking",
        website: "https://www.bridgebankgroup.com",
        description: "<p>Bridge Bank Group Côte d'Ivoire offers a wide range of banking and financial services to individuals, businesses, and institutions. Our mission is to support the economic development of the region by providing innovative and tailored financial solutions.</p>",
        jobs: [
            { title: "Data Analyst", type: "Full-time", location: "Abidjan" },
            { title: "Relationship Manager", type: "Full-time", location: "Abidjan" },
            { title: "IT Security Specialist", type: "Full-time", location: "Abidjan" }
        ],
    },
     {
        id: "4",
        name: "Bolloré Logistics",
        slug: "bollore-logistics",
        tagline: "Leader du transport et de la logistique",
        logoUrl: "/images/Bollore.png",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Transportation & Logistics",
        website: "https://www.bollore-logistics.com",
        description: "<p>Bolloré Logistics is a global leader in international transport and logistics. We offer a full range of services, including multimodal transport, customs and regulatory compliance, logistics, and supply chain management, supported by a large integrated logistics network.</p>",
        jobs: [
            { title: "Logistics Coordinator", type: "Full-time", location: "San-Pédro" },
            { title: "Customs Broker", type: "Full-time", location: "Abidjan" },
            { title: "Operations Supervisor", type: "Full-time", location: "Abidjan" }
        ],
    },
];

async function getCompanyBySlug(slug: string): Promise<CompanyProfile | null> {
    const company = companiesData.find((c) => c.slug === slug);
    return company || null;
}

export async function generateStaticParams() {
    return companiesData.map((company) => ({
      slug: company.slug,
    }));
}

export default async function CompanyPage({ params }: { params: { slug: string } }) {
  const company = await getCompanyBySlug(params.slug);

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
                    <div className="relative h-32 w-32 rounded-full overflow-hidden border-8 border-background shrink-0 bg-white p-2">
                         <Image
                            src={company.logoUrl}
                            alt={`${company.name} logo`}
                            fill
                            sizes="128px"
                            className="object-contain"
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
                                <Button asChild>
                                    <Link href="/register">Apply Now</Link>
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
