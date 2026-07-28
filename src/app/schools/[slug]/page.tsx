import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { ArrowLeft, GraduationCap, RefreshCw } from "lucide-react";

import { Footer } from "@/components/landing/footer";
import { MainNav } from "@/components/landing/main-nav";
import { PublicOrganizationProfile } from "@/components/organizations/public-organization-profile";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolvePublicOrganization } from "@/lib/public-organizations-server";
import { absoluteUrl, privatePageMetadata, publicPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

const resolveSchool = cache((slug: string) => resolvePublicOrganization("school", slug));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const result = await resolveSchool(slug);
    if (!result) return privatePageMetadata("Établissement introuvable");
    const school = result.organization;
    return publicPageMetadata({
      title: `${school.name} — établissement en Côte d’Ivoire`,
      description: school.description.slice(0, 220),
      path: `/schools/${school.slug}`,
      image: school.coverUrl || school.logoUrl,
      keywords: [school.name, "enseignement supérieur Côte d’Ivoire", school.organizationType || ""].filter(Boolean),
    });
  } catch {
    return privatePageMetadata("Profil établissement momentanément indisponible");
  }
}

export default async function SchoolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let school: Awaited<ReturnType<typeof resolvePublicOrganization>> = null;
  let unavailable = false;

  try {
    school = await resolveSchool(slug);
  } catch (error) {
    unavailable = true;
    console.error("Unable to load the public school profile.", error);
  }

  if (school?.matchedLegacyId) redirect(`/schools/${encodeURIComponent(school.organization.slug)}`);
  if (!unavailable && !school) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="container mx-auto flex-1 px-4 py-6 sm:py-10 lg:py-12">
        {school ? (
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "@id": absoluteUrl(`/schools/${school.organization.slug}#organization`),
              name: school.organization.name,
              description: school.organization.description,
              url: absoluteUrl(`/schools/${school.organization.slug}`),
              ...(school.organization.verificationStatus === 'verified' && school.organization.websiteUrl
                ? { sameAs: [school.organization.websiteUrl] }
                : {}),
              ...(school.organization.logoUrl
                ? { logo: absoluteUrl(school.organization.logoUrl) }
                : {}),
              ...(school.organization.locations.length
                ? {
                    location: school.organization.locations.map((location) => ({
                      "@type": "Place",
                      name: location,
                      address: {
                        "@type": "PostalAddress",
                        addressCountry: "CI",
                        addressLocality: location,
                      },
                    })),
                  }
                : {}),
            }}
          />
        ) : null}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50/80 to-orange-50/70 p-4 dark:border-emerald-900/40 dark:from-emerald-950/20 dark:to-orange-950/20 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-200">Campus & avenir en Côte d’Ivoire</Badge>
              <p className="mt-1 text-sm text-muted-foreground">Profil établissement sur le réseau Yahnu</p>
            </div>
          </div>
          <Button asChild variant="ghost" className="w-full justify-start sm:w-auto">
            <Link href="/schools"><ArrowLeft className="mr-2 h-4 w-4" /> Retour aux établissements</Link>
          </Button>
        </div>

        {unavailable || !school ? (
          <Card className="mx-auto max-w-xl border-emerald-200/70 dark:border-emerald-900/40">
            <CardContent className="px-5 py-12 text-center sm:px-8">
              <RefreshCw className="mx-auto h-9 w-9 text-emerald-600" />
              <h1 className="mt-4 text-xl font-semibold">Ce profil n’est pas disponible pour le moment</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">La connexion n’a pas abouti. Revenez à l’annuaire ou réessayez dans quelques instants.</p>
              <Button asChild className="mt-6 w-full sm:w-auto" variant="outline">
                <Link href="/schools">Retour à l’annuaire</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <PublicOrganizationProfile organization={school.organization} role="school" />
        )}
      </main>
      <Footer />
    </div>
  );
}
