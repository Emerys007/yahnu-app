
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import { CompanyProfileClient } from "./company-profile-client";

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

export default async function CompanyPage({ params }: { params: { slug: string } }) {
  const company = getCompanyBySlug(params.slug);

  if (!company) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background" data-hs-event-name="company_viewed">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <CompanyProfileClient company={company} />
      </main>
      <Footer />
    </div>
  );
}
