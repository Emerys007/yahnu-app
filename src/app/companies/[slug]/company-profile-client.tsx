
"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Building, Globe } from "lucide-react";

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

export function CompanyProfileClient({ company }: { company: CompanyProfile }) {

    return (
        <div className="space-y-6">
            <Link href="/companies" className="text-primary hover:underline">← Retour aux entreprises</Link>
            
            <Card className="overflow-hidden">
                <CardHeader className="p-0">
                     <div className="relative w-full h-48 md:h-64 bg-muted">
                        {/* Placeholder for a banner image */}
                     </div>
                </CardHeader>
            <CardContent className="p-6 md:p-8 -mt-20">
                <div className="flex items-end gap-6">
                    <div className="relative h-32 w-32 rounded-full overflow-hidden border-8 border-background shrink-0 bg-gradient-to-br from-slate-50 to-slate-100 p-3 flex items-center justify-center">
                         <div className="relative w-full h-full">
                            <Image
                                src={company.logoUrl}
                                alt={`${company.name} logo`}
                                fill
                                sizes="128px"
                                className="object-contain drop-shadow-sm"
                                style={{
                                    filter: company.name === "Bridge Bank Group" ? "invert(1) brightness(0)" : "none"
                                }}
                            />
                         </div>
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold">{company.name}</h1>
                        <p className="text-muted-foreground text-lg">"{company.tagline}"</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 mt-8">
                    <div className="md:col-span-2">
                        <h2 className="text-2xl font-bold mb-4">À propos de {company.name}</h2>
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: company.description }} />
                    </div>
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle>Infos sur l'entreprise</CardTitle>
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
                     <h2 className="text-2xl font-bold mb-4">Postes à pourvoir</h2>
                     <div className="space-y-4">
                        {company.jobs.map(job => (
                            <Card key={job.title} className="p-4 flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-lg">{job.title}</h3>
                                    <p className="text-muted-foreground">{job.type} &middot; {job.location}</p>
                                </div>
                                <Button asChild>
                                    <Link href="/signup?role=graduate">Postuler</Link>
                                </Button>
                            </Card>
                        ))}
                     </div>
                </div>
            </CardContent>
        </Card>
        </div>
    )
}
