'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Globe2,
  Loader2,
  MapPin,
  Radar,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { employmentTypes } from '@/lib/careers';
import type { DiscoveryJob, ExternalJobStatus } from '@/lib/job-discovery';
import { cn } from '@/lib/utils';

type DiscoveryResponse = {
  data: {
    jobs: DiscoveryJob[];
    total: number;
    hasMore: boolean;
    nextOffset: number;
    sources: Array<{
      id: string;
      organizationName: string;
      careerUrl: string;
      officialDomain: string;
      marketScope: 'ivory_coast' | 'africa';
      lastSuccessAt: string | null;
      stale: boolean;
    }>;
    refreshModel: 'access_triggered_stale_while_revalidate';
  };
};

const suggestedLocations = ['Abidjan', 'Côte d’Ivoire', 'Dakar', 'Remote'];
const employmentLabels: Record<string, string> = {
  full_time: 'Temps plein',
  part_time: 'Temps partiel',
  contract: 'Contrat / freelance',
  internship: 'Stage / alternance',
  temporary: 'Mission temporaire',
  volunteer: 'Bénévolat',
  other: 'Autre',
};
const statusLabels: Record<ExternalJobStatus, string> = {
  opened: 'Consultée',
  considering: 'À étudier',
  applied: 'J’ai postulé',
  interview: 'Entretien',
  offer: 'Offre reçue',
  rejected: 'Non retenue',
  withdrawn: 'Retirée',
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('fr-CI', { dateStyle: 'medium' }).format(new Date(value));
}

function localizedError(error: unknown, fallback: string) {
  if (!(error instanceof ApiClientError)) return fallback;
  const messages: Record<string, string> = {
    authentication_required: 'Votre session a expiré. Reconnectez-vous pour continuer.',
    forbidden: 'Cette action n’est pas disponible pour votre compte.',
    job_not_available: 'Cette opportunité n’est plus disponible.',
    rate_limited: 'Vous allez un peu vite. Patientez un instant puis réessayez.',
  };
  return messages[error.code] ?? fallback;
}

function provenanceLabel(job: DiscoveryJob) {
  if (job.kind === 'yahnu') return 'Publiée sur Yahnu';
  return `${job.provenance.sourceName} · ${job.provenance.freshnessLabel}`;
}

function JobCard({
  job,
  busy,
  onSave,
  onStatus,
}: {
  job: DiscoveryJob;
  busy: boolean;
  onSave: (job: DiscoveryJob) => void;
  onStatus: (job: DiscoveryJob, status: ExternalJobStatus | null) => void;
}) {
  const external = job.applyMode === 'official_site';

  function recordOfficialOpen() {
    if (!external || !job.applyUrl || job.externalStatus) return;
    void fetch('/api/job-discovery/external-status', {
      method: 'POST',
      credentials: 'same-origin',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ jobId: job.id, status: 'opened', onlyIfUntracked: true }),
    });
  }

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden border-primary/10 bg-card/95 shadow-[0_18px_55px_-40px_hsl(var(--cocoa))] transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_70px_-38px_hsl(var(--cocoa))] motion-reduce:transform-none">
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-1',
          external
            ? 'bg-gradient-to-r from-lagoon via-primary to-soleil'
            : 'bg-gradient-to-r from-terra via-soleil to-primary',
        )}
        aria-hidden="true"
      />
      <CardHeader className="space-y-4 pb-3 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className={cn(
            'grid h-12 w-12 shrink-0 place-items-center rounded-2xl border',
            external
              ? 'border-lagoon/20 bg-lagoon/10 text-lagoon'
              : 'border-primary/20 bg-primary/10 text-primary',
          )}>
            {external ? <Globe2 className="h-5 w-5" aria-hidden="true" /> : <Building2 className="h-5 w-5" aria-hidden="true" />}
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className={cn('rounded-full', job.saved && 'bg-soleil/15 text-cocoa')}
            disabled={busy}
            aria-label={job.saved ? `Retirer ${job.title} des favoris` : `Enregistrer ${job.title}`}
            onClick={() => onSave(job)}
          >
            {busy
              ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              : job.saved
                ? <BookmarkCheck className="h-5 w-5" aria-hidden="true" />
                : <Bookmark className="h-5 w-5" aria-hidden="true" />}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant={external ? 'secondary' : 'default'}>
              {external ? <ShieldCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> : null}
              {external ? 'Flux ATS approuvé' : 'Candidature Yahnu'}
            </Badge>
            {job.employmentType ? <Badge variant="outline">{employmentLabels[job.employmentType] ?? job.employmentType}</Badge> : null}
            {job.workplaceType === 'remote' ? <Badge variant="outline">À distance</Badge> : null}
          </div>
          <h2 className="font-display text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
            {job.title}
          </h2>
          <p className="font-medium text-foreground/80">{job.companyName}</p>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {job.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-terra" aria-hidden="true" />
              {job.location}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-4 w-4 text-lagoon" aria-hidden="true" />
            {dateLabel(job.publishedAt)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <p className="line-clamp-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">
          {job.description}
        </p>
        <div className="rounded-2xl border border-primary/10 bg-primary/[0.04] p-3">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Recommandée parce que
          </p>
          <ul className="mt-2 space-y-1 text-sm text-foreground/80">
            {job.recommendedBecause.map((reason) => (
              <li key={reason} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lagoon" aria-hidden="true" />
          <span>
            {provenanceLabel(job)}
            {job.provenance.officialDomain ? ` · domaine employeur : ${job.provenance.officialDomain}` : ''}
            {job.provenance.applicationHost ? ` · candidature : ${job.provenance.applicationHost}` : ''}
          </span>
        </p>
      </CardContent>

      <CardFooter className="grid gap-3 border-t bg-muted/20 p-4 sm:p-5">
        {external ? (
          <>
            <Button asChild className="w-full">
              <a
                href={job.applyUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                aria-describedby={`external-open-disclosure-${job.id}`}
                onClick={recordOfficialOpen}
              >
                Voir et postuler sur {job.provenance.atsProvider ?? 'le portail employeur'}
                <ExternalLink className="ml-2 h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
            <p
              id={`external-open-disclosure-${job.id}`}
              className="text-[11px] leading-4 text-muted-foreground"
            >
              Ce lien ouvre le portail de candidature hébergé par {job.provenance.atsProvider ?? 'le prestataire de l’employeur'}.
              Yahnu note alors « Consultée » dans votre suivi personnel ; vous pouvez effacer ce statut à tout moment.
            </p>
            <div className="grid gap-1.5">
              <Label htmlFor={`status-${job.id}`} className="text-xs text-muted-foreground">
                Mon suivi personnel
              </Label>
              <Select
                value={job.externalStatus ?? 'none'}
                onValueChange={(value) => onStatus(job, value === 'none' ? null : value as ExternalJobStatus)}
                disabled={busy}
              >
                <SelectTrigger id={`status-${job.id}`} className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun statut</SelectItem>
                  {(Object.keys(statusLabels) as ExternalJobStatus[]).map((status) => (
                    <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] leading-4 text-muted-foreground">
                Déclaré par vous. Ni Yahnu ni l’employeur ne confirment ce statut.
              </p>
            </div>
          </>
        ) : (
          <Button asChild className="w-full">
            <Link href={`/jobs/${encodeURIComponent(job.id)}`}>
              Voir et postuler avec Yahnu
              <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function JobDiscoveryBrowser() {
  const { toast } = useToast();
  const [jobs, setJobs] = React.useState<DiscoveryJob[]>([]);
  const [sources, setSources] = React.useState<DiscoveryResponse['data']['sources']>([]);
  const [q, setQ] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [employmentType, setEmploymentType] = React.useState('all');
  const [source, setSource] = React.useState<'all' | 'yahnu' | 'external'>('all');
  const [collection, setCollection] = React.useState<'all' | 'saved' | 'tracked'>('all');
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [busyId, setBusyId] = React.useState('');
  const [error, setError] = React.useState('');
  const [total, setTotal] = React.useState(0);
  const [hasMore, setHasMore] = React.useState(false);
  const [nextOffset, setNextOffset] = React.useState(0);
  const [reloadKey, setReloadKey] = React.useState(0);
  const backgroundRetryCount = React.useRef(0);

  const buildParams = React.useCallback((offset = 0) => {
    const params = new URLSearchParams({
      q,
      location,
      source,
      limit: '24',
      offset: String(offset),
    });
    if (employmentType !== 'all') params.set('employmentType', employmentType);
    if (collection === 'saved') params.set('savedOnly', 'true');
    if (collection === 'tracked') params.set('trackedOnly', 'true');
    return params;
  }, [collection, employmentType, location, q, source]);

  React.useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await apiFetch<DiscoveryResponse>(`/api/job-discovery?${buildParams()}`, {
          signal: controller.signal,
        });
        setJobs(response.data.jobs);
        setSources(response.data.sources);
        setTotal(response.data.total);
        setHasMore(response.data.hasMore);
        setNextOffset(response.data.nextOffset);
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(localizedError(caught, 'Les opportunités sont momentanément indisponibles.'));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [buildParams, reloadKey]);

  React.useEffect(() => {
    if (loading || error || !sources.some((item) => item.stale)) {
      if (!sources.some((item) => item.stale)) backgroundRetryCount.current = 0;
      return;
    }
    if (backgroundRetryCount.current >= 3) return;

    const timer = window.setTimeout(() => {
      backgroundRetryCount.current += 1;
      setReloadKey((value) => value + 1);
    }, 5_000);
    return () => window.clearTimeout(timer);
  }, [error, loading, sources]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const response = await apiFetch<DiscoveryResponse>(`/api/job-discovery?${buildParams(nextOffset)}`);
      setJobs((current) => [...current, ...response.data.jobs]);
      setHasMore(response.data.hasMore);
      setNextOffset(response.data.nextOffset);
    } catch (caught) {
      toast({
        variant: 'destructive',
        title: 'Chargement interrompu',
        description: localizedError(caught, 'Les offres suivantes n’ont pas pu être chargées.'),
      });
    } finally {
      setLoadingMore(false);
    }
  }

  async function toggleSaved(job: DiscoveryJob) {
    setBusyId(job.id);
    try {
      await apiFetch('/api/job-discovery/saved', {
        method: job.saved ? 'DELETE' : 'POST',
        body: JSON.stringify({ jobKind: job.kind, jobId: job.id }),
      });
      const nextSaved = !job.saved;
      setJobs((current) => current
        .map((item) => item.id === job.id ? { ...item, saved: nextSaved } : item)
        .filter((item) => collection !== 'saved' || item.saved));
      toast({
        title: job.saved ? 'Retirée des favoris' : 'Opportunité enregistrée',
        description: job.saved
          ? 'Vous pourrez toujours la retrouver dans toutes les opportunités.'
          : 'Retrouvez-la dans l’onglet « Enregistrées ».',
      });
    } catch (caught) {
      toast({
        variant: 'destructive',
        title: 'Action impossible',
        description: localizedError(caught, 'Votre sélection n’a pas pu être enregistrée.'),
      });
    } finally {
      setBusyId('');
    }
  }

  async function updateExternalStatus(job: DiscoveryJob, status: ExternalJobStatus | null) {
    setBusyId(job.id);
    try {
      await apiFetch('/api/job-discovery/external-status', {
        method: status ? 'POST' : 'DELETE',
        body: JSON.stringify(status ? { jobId: job.id, status } : { jobId: job.id }),
      });
      setJobs((current) => current
        .map((item) => item.id === job.id ? { ...item, externalStatus: status } : item)
        .filter((item) => collection !== 'tracked' || item.externalStatus));
      toast({
        title: status ? 'Suivi mis à jour' : 'Suivi effacé',
        description: status
          ? `Statut personnel : ${statusLabels[status]}.`
          : 'Cette candidature externe n’est plus suivie.',
      });
    } catch (caught) {
      toast({
        variant: 'destructive',
        title: 'Suivi non enregistré',
        description: localizedError(caught, 'Votre statut n’a pas pu être mis à jour.'),
      });
    } finally {
      setBusyId('');
    }
  }

  return (
    <section className="space-y-6 pb-10" aria-busy={loading}>
      <div className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-[radial-gradient(circle_at_85%_10%,hsl(var(--soleil)/.20),transparent_35%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--ivory)/.78))] p-5 shadow-soft sm:p-8 dark:bg-card">
        <div className="ci-pattern pointer-events-none absolute inset-0 opacity-35" aria-hidden="true" />
        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end">
          <div>
            <Badge variant="secondary" className="mb-4">
              <Radar className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Radar emploi Côte d’Ivoire & Afrique
            </Badge>
            <h1 className="max-w-3xl font-display text-3xl font-bold tracking-tight text-cocoa sm:text-5xl dark:text-foreground">
              Une seule veille. Des sources que vous pouvez vérifier.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Retrouvez les offres publiées sur Yahnu et celles issues de flux ATS approuvés reliés aux pages carrière des employeurs.
              Chaque recommandation explique pourquoi elle apparaît.
            </p>
          </div>
          <div className="rounded-3xl border border-background/60 bg-background/80 p-4 shadow-sm backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Veille transparente</p>
            <p className="mt-2 text-3xl font-display font-bold">{total}</p>
            <p className="text-sm text-muted-foreground">opportunité{total > 1 ? 's' : ''} correspondant à vos filtres</p>
            <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Les sources sont rafraîchies à l’ouverture si elles sont anciennes. Aucun service de planification payant.
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden border-primary/15">
        <div className="h-1 bg-gradient-to-r from-terra via-soleil to-primary" aria-hidden="true" />
        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr_.7fr]">
            <div className="space-y-2">
              <Label htmlFor="discovery-search">Métier, entreprise ou compétence</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="discovery-search"
                  className="pl-9"
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder="Ex. marketing, data, logistique"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discovery-location">Lieu</Label>
              <Input
                id="discovery-location"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Abidjan, Dakar, remote…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discovery-employment">Type d’engagement</Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger id="discovery-employment"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  {employmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>{employmentLabels[type]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold uppercase tracking-[0.13em] text-muted-foreground">Raccourcis</span>
            {suggestedLocations.map((city) => (
              <Button
                key={city}
                type="button"
                size="sm"
                variant={location === city ? 'secondary' : 'outline'}
                aria-pressed={location === city}
                onClick={() => setLocation(location === city ? '' : city)}
              >
                {city}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 border-t pt-5 md:grid-cols-2">
            <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Source des opportunités">
              {([
                ['all', 'Toutes'],
                ['yahnu', 'Sur Yahnu'],
                ['external', 'Flux ATS approuvés'],
              ] as const).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={source === value ? 'default' : 'ghost'}
                  aria-pressed={source === value}
                  onClick={() => setSource(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:justify-end" aria-label="Ma collection">
              {([
                ['all', 'Tout voir'],
                ['saved', 'Enregistrées'],
                ['tracked', 'Suivies ailleurs'],
              ] as const).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={collection === value ? 'secondary' : 'ghost'}
                  aria-pressed={collection === value}
                  onClick={() => setCollection(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {sources.length ? (
        <div className="flex gap-3 overflow-x-auto pb-2" aria-label="Pages carrière des employeurs suivis">
          {sources.map((item) => (
            <a
              key={item.id}
              href={item.careerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-[13rem] items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 text-sm transition hover:border-primary/30 hover:bg-primary/[0.03]"
            >
              <span>
                <span className="block font-semibold">{item.organizationName}</span>
                <span className="text-xs text-muted-foreground">{item.officialDomain}</span>
              </span>
              <ExternalLink className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            </a>
          ))}
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>La veille n’a pas pu être chargée</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button size="sm" variant="outline" onClick={() => setReloadKey((value) => value + 1)}>Réessayer</Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="grid min-h-64 place-items-center" role="status">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">Nous croisons les opportunités avec votre profil…</p>
          </div>
        </div>
      ) : null}

      {!loading && !error && jobs.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-primary/10 text-primary">
              <Search className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold">Aucune piste avec ces filtres</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Essayez une compétence plus large, retirez la ville ou revenez à « Toutes ».
            </p>
            <Button
              variant="outline"
              className="mt-5"
              onClick={() => {
                setQ('');
                setLocation('');
                setEmploymentType('all');
                setSource('all');
                setCollection('all');
              }}
            >
              Réinitialiser les filtres
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!loading && jobs.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {jobs.map((job) => (
            <JobCard
              key={`${job.kind}:${job.id}`}
              job={job}
              busy={busyId === job.id}
              onSave={toggleSaved}
              onStatus={updateExternalStatus}
            />
          ))}
        </div>
      ) : null}

      {hasMore ? (
        <div className="flex justify-center">
          <Button variant="outline" size="lg" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
            {loadingMore ? 'Chargement…' : 'Afficher plus d’opportunités'}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
