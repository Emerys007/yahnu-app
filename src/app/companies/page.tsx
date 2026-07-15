import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, Building2, PlusCircle, RefreshCw } from 'lucide-react';

import { Footer } from '@/components/landing/footer';
import { MainNav } from '@/components/landing/main-nav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { listPublicOrganizations, type PublicOrganization } from '@/lib/public-organizations-server';

export const dynamic = 'force-dynamic';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'Y';
}

function CompanyCard({ company }: { company: PublicOrganization }) {
  const jobLabel = company.openJobCount === 1 ? '1 offre ouverte' : `${company.openJobCount} offres ouvertes`;

  return (
    <Card className="group flex h-full flex-col border-border/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <CardHeader className="space-y-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-lg font-bold text-primary">
          {initials(company.name)}
        </div>
        <div className="space-y-2">
          <Badge variant="secondary">{company.industry || 'Entreprise partenaire'}</Badge>
          <CardTitle className="text-xl leading-snug">{company.name}</CardTitle>
          <CardDescription className="inline-flex items-center gap-1.5">
            <BriefcaseBusiness className="h-4 w-4" />{jobLabel}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="mt-auto">
        <Button asChild className="w-full" variant="outline">
          <Link href={`/companies/${encodeURIComponent(company.id)}`}>
            Voir l’entreprise <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
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
    companies = await listPublicOrganizations('company');
  } catch (error) {
    unavailable = true;
    console.error('Unable to load the public companies directory.', error);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="container mx-auto flex-1 py-12">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <Badge variant="secondary" className="mb-4">Réseau Yahnu</Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Entreprises partenaires</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Découvrez les entreprises actives qui recrutent et font grandir l’écosystème Yahnu.
          </p>
        </div>

        {unavailable ? (
          <Card className="mx-auto max-w-xl">
            <CardContent className="py-12 text-center">
              <RefreshCw className="mx-auto h-8 w-8 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-semibold">Le répertoire est momentanément indisponible</h2>
              <p className="mt-2 text-sm text-muted-foreground">Réessayez dans un instant.</p>
              <Button asChild className="mt-6" variant="outline"><Link href="/companies">Actualiser</Link></Button>
            </CardContent>
          </Card>
        ) : companies.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => <CompanyCard key={company.id} company={company} />)}
          </div>
        ) : (
          <Card className="mx-auto max-w-xl">
            <CardContent className="py-12 text-center">
              <Building2 className="mx-auto h-9 w-9 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-semibold">Aucune entreprise n’est encore publiée</h2>
              <p className="mt-2 text-sm text-muted-foreground">Revenez bientôt pour découvrir les nouveaux partenaires.</p>
            </CardContent>
          </Card>
        )}

        <Card className="mt-10 border-2 border-dashed border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col items-center p-8 text-center">
            <PlusCircle className="mb-4 h-12 w-12 text-primary" />
            <h2 className="text-2xl font-bold">Votre entreprise sera-t-elle la prochaine&nbsp;?</h2>
            <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
              Rejoignez Yahnu pour présenter vos opportunités aux talents issus des établissements partenaires.
            </p>
            <Button asChild size="lg" className="mt-6"><Link href="/signup?type=company">Devenir partenaire</Link></Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
