
"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Building, Globe } from "lucide-react";
import { useLocalization } from "@/context/localization-context";

// Mock Data
const companiesData = {
  en: [
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
    {
      name: "AgriBiz Côte d'Ivoire",
      tagline: "Sowing the seeds of progress.",
      logoUrl: "/images/job-agronomist.jpg",
      location: "Yamoussoukro, Côte d'Ivoire",
      industry: "Agriculture",
      website: "https://agribiz.ci",
      description: "<p>AgriBiz Côte d'Ivoire is a leading agricultural firm dedicated to sustainable farming and food security. We leverage technology to optimize crop yields and improve the livelihoods of farmers.</p><p>Our vision is to create a vibrant and resilient agricultural sector in Côte d'Ivoire. We are looking for passionate individuals to join our team and make a difference.</p>",
      jobs: [
          { title: "Agronomist", type: "Full-time", location: "Yamoussoukro" },
          { title: "Supply Chain Manager", type: "Full-time", location: "Abidjan" },
          { title: "Data Analyst (Agriculture)", type: "Full-time", location: "Yamoussoukro" },
      ],
      slug: "agribiz-cote-divoire",
      },
      {
      name: "Finance & Forte",
      tagline: "Your trusted financial partner.",
      logoUrl: "/images/LogoYahnu.png",
      location: "Abidjan, Côte d'Ivoire",
      industry: "Finance",
      website: "https://financeforte.ci",
      description: "<p>Finance & Forte is a premier investment bank and financial advisory firm in Abidjan. We provide a wide range of services to corporate and institutional clients.</p><p>Our team of experienced professionals is committed to delivering exceptional results for our clients. We are seeking talented individuals who are passionate about finance and want to build a rewarding career.</p>",
      jobs: [
          { title: "Financial Analyst", type: "Full-time", location: "Abidjan" },
          { title: "Investment Banker", type: "Full-time", location: "Abidjan" },
          { title: "Compliance Officer", type: "Full-time", location: "Abidjan" },
      ],
      slug: "finance-forte",
      }
  ],
  fr: [
    {
      name: "Tech Solutions Abidjan",
      tagline: "Innover pour une Afrique numérique.",
      logoUrl: "/images/Logo.png",
      location: "Abidjan, Côte d'Ivoire",
      industry: "Technologies de l'information",
      website: "https://techsolutions.ci",
      description: "<p>Tech Solutions Abidjan est un fournisseur de premier plan de solutions technologiques innovantes pour les entreprises d'Afrique de l'Ouest. Nous sommes spécialisés dans le développement de logiciels, le cloud computing et la cybersécurité.</p><p>Notre mission est de donner aux entreprises africaines les outils dont elles ont besoin pour réussir à l'ère numérique. Nous nous engageons à favoriser une culture d'innovation, de collaboration et d'excellence.</p>",
      jobs: [
        { title: "Développeur Frontend Senior", type: "Temps plein", location: "Abidjan" },
        { title: "Ingénieur en infrastructure Cloud", type: "Temps plein", location: "Télétravail" },
        { title: "Chef de produit principal", type: "Temps plein", location: "Abidjan" },
      ],
      slug: "tech-solutions-abidjan",
    },
    {
      name: "AgriBiz Côte d'Ivoire",
      tagline: "Semer les graines du progrès.",
      logoUrl: "/images/job-agronomist.jpg",
      location: "Yamoussoukro, Côte d'Ivoire",
      industry: "Agriculture",
      website: "https://agribiz.ci",
      description: "<p>AgriBiz Côte d'Ivoire est une entreprise agricole de premier plan dédiée à l'agriculture durable et à la sécurité alimentaire. Nous tirons parti de la technologie pour optimiser les rendements des cultures et améliorer les moyens de subsistance des agriculteurs.</p><p>Notre vision est de créer un secteur agricole dynamique et résilient en Côte d'Ivoire. Nous recherchons des personnes passionnées pour rejoindre notre équipe et faire la différence.</p>",
      jobs: [
          { title: "Agronome", type: "Temps plein", location: "Yamoussoukro" },
          { title: "Responsable de la chaîne d'approvisionnement", type: "Temps plein", location: "Abidjan" },
          { title: "Analyste de données (Agriculture)", type: "Temps plein", location: "Yamoussoukro" },
      ],
      slug: "agribiz-cote-divoire",
      },
      {
      name: "Finance & Forte",
      tagline: "Votre partenaire financier de confiance.",
      logoUrl: "/images/LogoYahnu.png",
      location: "Abidjan, Côte d'Ivoire",
      industry: "Finance",
      website: "https://financeforte.ci",
      description: "<p>Finance & Forte est une banque d'investissement et un cabinet de conseil financier de premier plan à Abidjan. Nous offrons une large gamme de services aux entreprises et aux clients institutionnels.</p><p>Notre équipe de professionnels expérimentés s'engage à fournir des résultats exceptionnels à nos clients. Nous recherchons des personnes talentueuses passionnées par la finance et désireuses de bâtir une carrière enrichissante.</p>",
      jobs: [
          { title: "Analyste Financier", type: "Temps plein", location: "Abidjan" },
          { title: "Banquier d'affaires", type: "Temps plein", location: "Abidjan" },
          { title: "Agent de conformité", type: "Temps plein", location: "Abidjan" },
      ],
      slug: "finance-forte",
      }
  ]
};


export default function CompanyPage({ params }: { params: { slug: string } }) {
  const { language, t } = useLocalization();
  const companies = companiesData[language as keyof typeof companiesData] || companiesData.en;
  const company = companies.find((c) => c.slug === params.slug);

  if (!company) {
    notFound();
  }

  const jobTypes: {[key: string]: string} = {
    "Full-time": t("Full-time"),
    "Remote": t("Remote")
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
                        <h2 className="text-2xl font-bold mb-4">{t('About')} {company.name}</h2>
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: company.description }} />
                    </div>
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('Company Info')}</CardTitle>
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
                     <h2 className="text-2xl font-bold mb-4">{t('Open Positions')}</h2>
                     <div className="space-y-4">
                        {company.jobs.map(job => (
                            <Card key={job.title} className="p-4 flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-lg">{job.title}</h3>
                                    <p className="text-muted-foreground">{jobTypes[job.type] || job.type} &middot; {job.location}</p>
                                </div>
                                <Button>{t('Apply Now')}</Button>
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
