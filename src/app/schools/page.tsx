import Link from "next/link";
import { ArrowRight, GraduationCap, PlusCircle, RefreshCw, School, Sparkles } from "lucide-react";

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

function SchoolCard({ school }: { school: PublicOrganization }) {
  return (
    <Card className="group relative flex h-full flex-col overflow-hidden border-border/70 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl dark:hover:border-emerald-800">
      <div className="h-1.5 bg-gradient-to-r from-orange-500 via-white to-emerald-600 dark:via-slate-900" aria-hidden="true" />
      <CardHeader className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-lg font-extrabold text-orange-800 ring-1 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-200 dark:ring-orange-900/60">
            {initials(school.name)}
          </div>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
            Compte actif
          </Badge>
        </div>
        <div className="space-y-2">
          <Badge variant="secondary">Établissement du réseau</Badge>
          <CardTitle className="text-xl leading-snug">{school.name}</CardTitle>
          <CardDescription className="leading-6">
            Découvrez son profil institutionnel et son engagement auprès de sa communauté diplômée.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="mt-auto px-5 pb-5 sm:px-6 sm:pb-6">
        <Button asChild className="w-full" variant="outline">
          <Link href={`/schools/${encodeURIComponent(school.id)}`}>
            Découvrir l’établissement <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default async function SchoolsPage() {
  let schools: PublicOrganization[] = [];
  let unavailable = false;

  try {
    schools = await listPublicOrganizations("school");
  } catch (error) {
    unavailable = true;
    console.error("Unable to load the public schools directory.", error);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-background to-orange-50 dark:border-emerald-900/30 dark:from-emerald-950/25 dark:to-orange-950/20">
          <div className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="outline" className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Campus & avenir en Côte d’Ivoire
              </Badge>
              <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Les établissements qui préparent la relève
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
                Retrouvez les écoles et universités actives sur Yahnu, et suivez les passerelles qu’elles créent entre formation et premier emploi.
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-10 sm:py-14">
          {unavailable ? (
            <Card className="mx-auto max-w-xl border-emerald-200/70 dark:border-emerald-900/40">
              <CardContent className="px-5 py-12 text-center sm:px-8">
                <RefreshCw className="mx-auto h-9 w-9 text-emerald-600" />
                <h2 className="mt-4 text-xl font-semibold">L’annuaire fait une courte pause</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">La connexion n’a pas abouti. Actualisez la page dans quelques instants.</p>
                <Button asChild className="mt-6 w-full sm:w-auto" variant="outline">
                  <Link href="/schools">Réessayer</Link>
                </Button>
              </CardContent>
            </Card>
          ) : schools.length ? (
            <>
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">Annuaire Yahnu</p>
                  <h2 className="mt-1 text-2xl font-bold">{schools.length} {schools.length > 1 ? "établissements à découvrir" : "établissement à découvrir"}</h2>
                </div>
                <p className="text-sm text-muted-foreground">Comptes actifs affichés par ordre alphabétique</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {schools.map((school) => <SchoolCard key={school.id} school={school} />)}
              </div>
            </>
          ) : (
            <Card className="mx-auto max-w-xl">
              <CardContent className="px-5 py-12 text-center sm:px-8">
                <GraduationCap className="mx-auto h-10 w-10 text-orange-600" />
                <h2 className="mt-4 text-xl font-semibold">L’annuaire se construit</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Les premiers comptes d’établissements ivoiriens apparaîtront ici dès leur publication.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="mt-10 overflow-hidden border-2 border-dashed border-emerald-300/70 bg-gradient-to-br from-emerald-50/80 to-orange-50/70 dark:border-emerald-900/60 dark:from-emerald-950/20 dark:to-orange-950/20 sm:mt-14">
            <CardContent className="flex flex-col items-center px-5 py-9 text-center sm:p-10">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                <School className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-2xl font-bold">Accompagnez vos diplômés au-delà du campus</h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Donnez de la visibilité à vos formations, suivez l’insertion et rapprochez votre établissement des employeurs de Côte d’Ivoire.
              </p>
              <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
                <Link href="/signup?type=school"><PlusCircle className="mr-2 h-4 w-4" /> Créer un compte établissement</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
