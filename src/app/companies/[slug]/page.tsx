
"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Building, Globe } from "lucide-react";
import Link from "next/link";
import { useLocalization } from "@/context/localization-context";

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
        tagline: "company_1_tagline",
        logoUrl: "/images/Orange.png",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Telecommunications",
        website: "https://www.orange.ci",
        description: "company_1_description",
        jobs: [
            { title: "company_1_job_1", type: "Full-time", location: "Abidjan" },
            { title: "company_1_job_2", type: "Full-time", location: "Abidjan" },
            { title: "company_1_job_3", type: "Full-time", location: "Abidjan" }
        ],
    },
    {
        id: "2",
        name: "SIFCA",
        slug: "sifca",
        tagline: "company_2_tagline",
        logoUrl: "/images/SIFCA.png",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Agriculture",
        website: "https://www.groupesifca.com",
        description: "company_2_description",
        jobs: [
            { title: "company_2_job_1", type: "Full-time", location: "Yamoussoukro" },
            { title: "company_2_job_2", type: "Full-time", location: "Abidjan" },
            { title: "company_2_job_3", type: "Full-time", location: "Abidjan" }
        ],
    },
     {
        id: "3",
        name: "Bridge Bank Group",
        slug: "bridge-bank-group",
        tagline: "company_3_tagline",
        logoUrl: "/images/BridgeBank.png",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Finance & Banking",
        website: "https://www.bridgebankgroup.com",
        description: "company_3_description",
        jobs: [
            { title: "company_3_job_1", type: "Full-time", location: "Abidjan" },
            { title: "company_3_job_2", type: "Full-time", location: "Abidjan" },
            { title: "company_3_job_3", type: "Full-time", location: "Abidjan" }
        ],
    },
     {
        id: "4",
        name: "Bolloré Logistics",
        slug: "bollore-logistics",
        tagline: "company_4_tagline",
        logoUrl: "/images/Bollore.png",
        location: "Abidjan, Côte d'Ivoire",
        industry: "Transportation & Logistics",
        website: "https://www.bollore-logistics.com",
        description: "company_4_description",
        jobs: [
            { title: "company_4_job_1", type: "Full-time", location: "San-Pédro" },
            { title: "company_4_job_2", type: "Full-time", location: "Abidjan" },
            { title: "company_4_job_3", type: "Full-time", location: "Abidjan" }
        ],
    },
];

function getCompanyBySlug(slug: string): CompanyProfile | null {
    const company = companiesData.find((c) => c.slug === slug);
    return company || null;
}

export default function CompanyPage({ params }: { params: { slug: string } }) {
  const { t } = useLocalization();
  const company = getCompanyBySlug(params.slug);

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
                        <p className="text-muted-foreground text-lg">"{t(company.tagline)}"</p>
                    </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8 mt-8">
                    <div className="md:col-span-2">
                        <h2 className="text-2xl font-bold mb-4">{t('About')} {company.name}</h2>
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: t(company.description) }} />
                    </div>
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Company Info')}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-3"><Building className="h-5 w-5 text-muted-foreground"/> <span>{t(company.industry)}</span></div>
                                <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-muted-foreground"/> <span>{company.location}</span></div>
                                <div className="flex items-center gap-3"><Globe className="h-5 w-5 text-muted-foreground"/> <a href={company.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">{company.website}</a></div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="mt-12">
                     <h2 className="text-2xl font-bold mb-4">{t('Open Positions')}</h2>
                     <div className="space-y-4">
                        {company.jobs.map(job => (
                            <Card key={job.title} className="p-4 flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-lg">{t(job.title)}</h3>
                                    <p className="text-muted-foreground">{t(job.type)} &middot; {job.location}</p>
                                </div>
                                <Button asChild>
                                    <Link href="/register">{t('Apply Now')}</Link>
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
