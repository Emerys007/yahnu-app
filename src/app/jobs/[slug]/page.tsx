
"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import Image from "next/image";
import { useLocalization } from "@/context/localization-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Building, MapPin, Briefcase, ArrowLeft } from "lucide-react";

const jobListingsData = {
    en: [
      {
        slug: "software-engineer-frontend-innovate",
        title: "Software Engineer, Frontend",
        company: "Innovate Inc.",
        logoUrl: "https://placehold.co/100x100.png",
        location: "Remote",
        type: "Full-time",
        workplace: "remote",
        tags: ["React", "TypeScript", "Next.js", "CSS", "HTML"],
        description: "<p>We are seeking a talented Frontend Software Engineer to join our dynamic team. The ideal candidate will have a passion for creating beautiful and functional user interfaces. You will be responsible for developing and maintaining our web applications, collaborating with designers and backend engineers to deliver a top-notch user experience.</p><h3>Responsibilities:</h3><ul><li>Develop new user-facing features using React.js</li><li>Build reusable components and front-end libraries for future use</li><li>Translate designs and wireframes into high-quality code</li><li>Optimize components for maximum performance across a vast array of web-capable devices and browsers</li></ul><h3>Qualifications:</h3><ul><li>Strong proficiency in JavaScript, including DOM manipulation and the JavaScript object model</li><li>Thorough understanding of React.js and its core principles</li><li>Experience with popular React.js workflows (such as Flux or Redux)</li><li>Familiarity with modern front-end build pipelines and tools</li><li>Experience with common front-end development tools such as Babel, Webpack, NPM, etc.</li></ul>",
      },
      // Other jobs...
    ],
    fr: [
      {
        slug: "software-engineer-frontend-innovate",
        title: "Ingénieur logiciel, Frontend",
        company: "Innovate Inc.",
        logoUrl: "https://placehold.co/100x100.png",
        location: "Télétravail",
        type: "Temps plein",
        workplace: "remote",
        tags: ["React", "TypeScript", "Next.js", "CSS", "HTML"],
        description: "<p>Nous recherchons un ingénieur logiciel Frontend talentueux pour rejoindre notre équipe dynamique. Le candidat idéal aura une passion pour la création d'interfaces utilisateur belles et fonctionnelles. Vous serez responsable du développement et de la maintenance de nos applications Web, en collaborant avec les concepteurs et les ingénieurs backend pour offrir une expérience utilisateur de premier ordre.</p><h3>Responsabilités:</h3><ul><li>Développer de nouvelles fonctionnalités orientées utilisateur en utilisant React.js</li><li>Construire des composants réutilisables et des bibliothèques front-end pour une utilisation future</li><li>Traduire les conceptions et les wireframes en code de haute qualité</li><li>Optimiser les composants pour des performances maximales sur une vaste gamme d'appareils et de navigateurs compatibles avec le Web</li></ul><h3>Qualifications:</h3><ul><li>Forte maîtrise de JavaScript, y compris la manipulation du DOM et le modèle d'objet JavaScript</li><li>Compréhension approfondie de React.js et de ses principes fondamentaux</li><li>Expérience avec les workflows React.js populaires (tels que Flux ou Redux)</li><li> familiarité avec les pipelines et outils de construction front-end modernes</li><li>Expérience avec les outils de développement front-end courants tels que Babel, Webpack, NPM, etc.</li></ul>",
      },
      // Other jobs...
    ]
  };
  

export default function JobDetailPage({ params }: { params: { slug: string } }) {
  const { language, t } = useLocalization();
  const allJobs = [...jobListingsData.en, ...jobListingsData.fr];
  const job = allJobs.find((j) => j.slug === params.slug);
  
  const localizedJobs = jobListingsData[language as keyof typeof jobListingsData] || jobListingsData.en;
  const localizedJob = localizedJobs.find((j) => j.slug === params.slug);

  if (!job || !localizedJob) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <div className="mb-8">
            <Button variant="ghost" asChild>
                <Link href="/jobs">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('Back to all jobs')}
                </Link>
            </Button>
        </div>
        <div className="grid md:grid-cols-3 gap-8 items-start">
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">{localizedJob.title}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-base">
                            <span className="flex items-center gap-1.5"><Building className="h-4 w-4"/> {localizedJob.company}</span>
                            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4"/> {localizedJob.location}</span>
                            <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4"/> {t(localizedJob.type)}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: localizedJob.description }} />
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-1 sticky top-28">
                <Card>
                    <CardHeader className="text-center">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-lg overflow-hidden border">
                            <Image src={job.logoUrl} alt={`${job.company} logo`} width={100} height={100} className="object-contain" />
                        </div>
                        <CardTitle>{job.company}</CardTitle>
                        <CardDescription>{t('Ready to make an impact?')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full" size="lg">
                            <Link href="/register">{t('Apply Now')}</Link>
                        </Button>
                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            {job.tags.map((tag) => (
                                <Badge key={tag} variant="secondary">{tag}</Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

    