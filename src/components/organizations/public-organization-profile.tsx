import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CheckCircle2, ExternalLink, Globe2, MapPin } from 'lucide-react';

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
  const roleLabel = isCompany ? 'Profil entreprise publié' : 'Profil établissement publié';

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href={directoryHref}><ArrowLeft className="mr-2 h-4 w-4" />{directoryLabel}</Link>
      </Button>

      <Card className="overflow-hidden border-border/70">
        <div className="relative h-32 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent sm:h-48">
          {organization.coverUrl ? (
            <Image src={organization.coverUrl} alt="" fill unoptimized className="object-cover" />
          ) : <div className="ci-pattern absolute inset-0 opacity-50" />}
        </div>
        <CardContent className="-mt-14 px-6 pb-8 sm:-mt-16 sm:px-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="relative grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-3xl border-8 border-background bg-card text-3xl font-bold text-primary shadow-sm">
              {organization.logoUrl ? (
                <Image src={organization.logoUrl} alt={`Logo ${organization.name}`} fill unoptimized className="object-cover" />
              ) : initials(organization.name)}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{roleLabel}</Badge>
                {organization.verificationStatus === 'verified' ? (
                  <Badge><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Identité vérifiée</Badge>
                ) : null}
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{organization.name}</h1>
              <p className="text-muted-foreground">{organization.organizationType || (isCompany ? organization.industry : null)}</p>
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold">À propos</h2>
                <p className="mt-3 whitespace-pre-wrap leading-7 text-muted-foreground">{organization.description}</p>
              </section>
              {organization.programs.length ? (
                <section>
                  <h2 className="text-xl font-semibold">{isCompany ? 'Métiers & domaines recherchés' : 'Programmes mis en avant'}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">{organization.programs.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}</div>
                </section>
              ) : null}
              {organization.culture.length || organization.benefits.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {organization.culture.length ? (
                    <section className="rounded-2xl border bg-muted/20 p-5"><h2 className="font-semibold">Culture & valeurs</h2><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{organization.culture.map((item) => <li key={item}>• {item}</li>)}</ul></section>
                  ) : null}
                  {organization.benefits.length ? (
                    <section className="rounded-2xl border bg-muted/20 p-5"><h2 className="font-semibold">{isCompany ? 'Avantages' : 'Services aux diplômés'}</h2><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{organization.benefits.map((item) => <li key={item}>• {item}</li>)}</ul></section>
                  ) : null}
                </div>
              ) : null}
            </div>
            <aside className="space-y-4 rounded-2xl border bg-muted/20 p-5">
              <h2 className="font-semibold">Repères</h2>
              <div className="space-y-3 text-sm">
                {organization.locations.map((location) => <div key={location} className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{location}</span></div>)}
                {organization.websiteUrl ? (
                  <div className="flex items-start gap-2"><Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><Link href={organization.websiteUrl} target="_blank" rel="noreferrer" className="break-all text-primary hover:underline">Visiter le site <ExternalLink className="ml-1 inline h-3.5 w-3.5" /></Link></div>
                ) : null}
              </div>
              <p className="border-t pt-3 text-xs leading-5 text-muted-foreground">Profil publié le {new Intl.DateTimeFormat('fr-CI', { dateStyle: 'long' }).format(new Date(organization.publishedAt))} et mis à jour depuis par l’organisation.</p>
            </aside>
          </div>

          {isCompany ? (
            <div className="mt-12 space-y-5">
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
                          <Link href={`/login?next=${encodeURIComponent(`/jobs/${job.id}`)}`}>Voir l’offre <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
              <h2 className="text-xl font-semibold">Profil institutionnel</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Les informations de cette page sont publiées par l’établissement. Le statut « vérifié » n’apparaît que lorsqu’un contrôle Yahnu a réellement été effectué.
              </p>
            </section>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
