import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Building2, PlusCircle, RefreshCw, Sparkles } from "lucide-react";

import { Footer } from "@/components/landing/footer";
import { MainNav } from "@/components/landing/main-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listPublicOrganizations, type PublicOrganization } from "@/lib/public-organizations-server";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "Y";
}

function CompanyCard({ company }: { company: PublicOrganization }) {
  const jobLabel = company.openJobCount === 1 ? "1 offre ouverte" : `${company.openJobCount} offres ouvertes`;

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden border-border/70 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl dark:hover:border-orange-800">
      <div className="h-1.5 bg-gradient-to-r from-orange-500 via-white to-emerald-600 dark:via-slate-900" aria-hidden="true" />
      <CardHeader className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-lg font-extrabold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/60">
            {initials(company.name)}
          </div>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
            Compte actif
          </Badge>
        </div>
        <div className="space-y-2">
          <Badge variant="secondary">{company.industry || "Entreprise du réseau"}</Badge>
          <CardTitle className="text-xl leading-snug">{company.name}</CardTitle>
          <CardDescription className="inline-flex items-center gap-1.5">
            <BriefcaseBusiness className="h-4 w-4 text-orange-600" /> {jobLabel}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="mt-auto px-5 pb-5 sm:px-6 sm:pb-6">
        <Button asChild className="w-full" variant="outline">
          <Link href={`/companies/${encodeURIComponent(company.id)}`}>
            Découvrir l’entreprise <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default async function CompaniesPage() {
  let companies: PublicOrganization[] = [];
  let unavailable = false;

  try {
    companies = await listPublicOrganizations("company");
  } catch (error) {
    unavailable = true;
    console.error("Unable to load the public companies directory.", error);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-orange-200/60 bg-gradient-to-br from-orange-50 via-background to-emerald-50 dark:border-orange-900/30 dark:from-orange-950/25 dark:to-emerald-950/20">
          <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="outline" className="mb-4 border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/50 dark:bg-orange-950/40 dark:text-orange-200">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Réseau professionnel ivoirien
              </Badge>
              <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Les entreprises qui font bouger la Côte d’Ivoire
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
                Explorez les comptes actifs sur Yahnu, leurs secteurs et les opportunités ouvertes aux jeunes talents du pays.
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-10 sm:py-14">
          {unavailable ? (
            <Card className="mx-auto max-w-xl border-orange-200/70 dark:border-orange-900/40">
              <CardContent className="px-5 py-12 text-center sm:px-8">
                <RefreshCw className="mx-auto h-9 w-9 text-orange-600" />
                <h2 className="mt-4 text-xl font-semibold">L’annuaire fait une courte pause</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">La connexion n’a pas abouti. Actualisez la page dans quelques instants.</p>
                <Button asChild className="mt-6 w-full sm:w-auto" variant="outline">
                  <Link href="/companies">Réessayer</Link>
                </Button>
              </CardContent>
            </Card>
          ) : companies.length ? (
            <>
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">Annuaire Yahnu</p>
                  <h2 className="mt-1 text-2xl font-bold">{companies.length} {companies.length > 1 ? "entreprises à découvrir" : "entreprise à découvrir"}</h2>
                </div>
                <p className="text-sm text-muted-foreground">Comptes actifs affichés par ordre alphabétique</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {companies.map((company) => <CompanyCard key={company.id} company={company} />)}
              </div>
            </>
          ) : (
            <Card className="mx-auto max-w-xl">
              <CardContent className="px-5 py-12 text-center sm:px-8">
                <Building2 className="mx-auto h-10 w-10 text-emerald-600" />
                <h2 className="mt-4 text-xl font-semibold">L’annuaire se construit</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Les premiers comptes d’entreprises ivoiriennes apparaîtront ici dès leur publication.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="mt-10 overflow-hidden border-2 border-dashed border-orange-300/70 bg-gradient-to-br from-orange-50/80 to-emerald-50/70 dark:border-orange-900/60 dark:from-orange-950/20 dark:to-emerald-950/20 sm:mt-14">
            <CardContent className="flex flex-col items-center px-5 py-9 text-center sm:p-10">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-500 text-white shadow-sm">
                <PlusCircle className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-2xl font-bold">Faites découvrir votre entreprise aux talents ivoiriens</h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Créez votre espace, publiez vos opportunités et rencontrez des jeunes diplômés prêts à contribuer partout en Côte d’Ivoire.
              </p>
              <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
                <Link href="/signup?type=company">Créer un compte entreprise</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
