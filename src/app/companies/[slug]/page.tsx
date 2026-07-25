import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, RefreshCw } from "lucide-react";

import { Footer } from "@/components/landing/footer";
import { MainNav } from "@/components/landing/main-nav";
import { PublicOrganizationProfile } from "@/components/organizations/public-organization-profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicOrganizationById, listPublicCompanyJobs } from "@/lib/public-organizations-server";

export const dynamic = "force-dynamic";

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let company: Awaited<ReturnType<typeof getPublicOrganizationById>> = null;
  let jobs: Awaited<ReturnType<typeof listPublicCompanyJobs>> = [];
  let unavailable = false;

  try {
    company = await getPublicOrganizationById("company", slug);
    if (company) jobs = await listPublicCompanyJobs(company.id);
  } catch (error) {
    unavailable = true;
    console.error("Unable to load the public company profile.", error);
  }

  if (!unavailable && !company) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="container mx-auto flex-1 px-4 py-6 sm:py-10 lg:py-12">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-orange-200/70 bg-gradient-to-r from-orange-50/80 to-emerald-50/70 p-4 dark:border-orange-900/40 dark:from-orange-950/20 dark:to-emerald-950/20 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-500 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">Réseau Yahnu Côte d’Ivoire</Badge>
              <p className="mt-1 text-sm text-muted-foreground">Profil entreprise et opportunités publiées</p>
            </div>
          </div>
          <Button asChild variant="ghost" className="w-full justify-start sm:w-auto">
            <Link href="/companies"><ArrowLeft className="mr-2 h-4 w-4" /> Retour aux entreprises</Link>
          </Button>
        </div>

        {unavailable || !company ? (
          <Card className="mx-auto max-w-xl border-orange-200/70 dark:border-orange-900/40">
            <CardContent className="px-5 py-12 text-center sm:px-8">
              <RefreshCw className="mx-auto h-9 w-9 text-orange-600" />
              <h1 className="mt-4 text-xl font-semibold">Ce profil n’est pas disponible pour le moment</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">La connexion n’a pas abouti. Revenez à l’annuaire ou réessayez dans quelques instants.</p>
              <Button asChild className="mt-6 w-full sm:w-auto" variant="outline">
                <Link href="/companies">Retour à l’annuaire</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <PublicOrganizationProfile organization={company} role="company" jobs={jobs} />
        )}
      </main>
      <Footer />
    </div>
  );
}
