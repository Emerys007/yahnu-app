
"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Globe } from "lucide-react";
import { useLocalization } from "@/context/localization-context";

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

export function SchoolProfileClient({ school }: { school: School }) {
    const { t } = useLocalization();

    return (
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
                            alt={`${t(school.name)} logo`}
                            fill
                            sizes="128px"
                            className="object-contain"
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold">{school.acronym}</h1>
                        <p className="text-muted-foreground text-lg">{t(school.name)}</p>
                    </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8 mt-8">
                    <div className="md:col-span-2">
                        <h2 className="text-2xl font-bold mb-4">{t('About')} {school.acronym}</h2>
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: t(school.description) }} />
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
                                    <h3 className="font-semibold text-lg">{t(program)}</h3>
                                </div>
                                 <Button asChild variant="secondary">
                                    <Link href="/register">{t('Learn More')}</Link>
                                 </Button>
                            </Card>
                        ))}
                     </div>
                </div>
            </CardContent>
        </Card>
    );
}
