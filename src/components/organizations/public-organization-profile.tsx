import Link from 'next/link';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, MapPin } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import { humanizeStatus } from '@/lib/careers';
import type {
  PublicCompanyJob,
  PublicOrganization,
  PublicOrganizationRole,
} from '@/lib/public-organizations-server';

type PublicOrganizationProfileProps = {
  organization: PublicOrganization;
  role: PublicOrganizationRole;
  jobs?: PublicCompanyJob[];
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'Y';
}

export function PublicOrganizationProfile({ organization, role, jobs = [] }: PublicOrganizationProfileProps) {
  const isCompany = role === 'company';
  const directoryHref = isCompany ? '/companies' : '/schools';
  const directoryLabel = isCompany ? 'Retour aux entreprises' : 'Retour aux écoles';
  const roleLabel = isCompany ? 'Entreprise partenaire' : 'Établissement partenaire';

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href={directoryHref}><ArrowLeft className="mr-2 h-4 w-4" />{directoryLabel}</Link>
      </Button>

      <Card className="overflow-hidden border-border/70">
        <div className="h-28 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent sm:h-36" />
        <CardContent className="-mt-14 px-6 pb-8 sm:-mt-16 sm:px-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="grid h-28 w-28 shrink-0 place-items-center rounded-3xl border-8 border-background bg-card text-3xl font-bold text-primary shadow-sm">
              {initials(organization.name)}
            </div>
            <div className="space-y-2">
              <Badge variant="secondary">{roleLabel}</Badge>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{organization.name}</h1>
              {isCompany && organization.industry ? <p className="text-muted-foreground">{organization.industry}</p> : null}
            </div>
          </div>

          {isCompany ? (
            <div className="mt-10 space-y-5">
              <div>
                <h2 className="text-2xl font-semibold">Offres ouvertes</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {organization.openJobCount === 1 ? '1 offre est actuellement disponible.' : `${organization.openJobCount} offres sont actuellement disponibles.`}
                </p>
              </div>

              {jobs.length ? (
                <div className="space-y-3">
                  {jobs.map((job) => (
                    <Card key={job.id} className="border-border/70">
                      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="font-semibold">{job.title}</h3>
                          <CardDescription className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            {job.employmentType ? <span>{humanizeStatus(job.employmentType)}</span> : null}
                            {job.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span> : null}
                          </CardDescription>
                        </div>
                        <Button asChild variant="outline">
                          <Link href={`/jobs/${encodeURIComponent(job.id)}`}>Voir l’offre <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed bg-muted/20">
                  <CardContent className="flex flex-col items-center p-8 text-center">
                    <BriefcaseBusiness className="h-8 w-8 text-muted-foreground" />
                    <h3 className="mt-3 font-semibold">Aucune offre ouverte pour le moment</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Les nouvelles opportunités apparaîtront ici dès leur publication.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <section className="mt-10 rounded-2xl border bg-muted/20 p-6">
              <h2 className="text-xl font-semibold">Partenaire Yahnu</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Cet établissement est actif dans le réseau Yahnu. Les programmes et informations détaillées ne sont publiés que lorsque l’établissement choisit de les partager.
              </p>
            </section>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
