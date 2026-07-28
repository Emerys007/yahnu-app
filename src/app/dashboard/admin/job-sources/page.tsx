'use client';

import * as React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  EyeOff,
  Globe2,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import type { JobSourceSummary } from '@/lib/job-discovery';
import { cn } from '@/lib/utils';

type SourceResponse = { data: { sources: JobSourceSummary[] } };
type ExternalJob = {
  id: string;
  title: string;
  companyName: string;
  location: string | null;
  employmentType: string | null;
  workplaceType: string | null;
  status: 'active' | 'expired' | 'hidden';
  canonicalUrl: string;
  sourceId: string;
  sourceName: string;
  officialDomain: string;
  sourceUpdatedAt: string | null;
  lastSeenAt: string;
  expiresAt: string;
  moderationNote: string | null;
};
type JobsResponse = {
  data: {
    jobs: ExternalJob[];
    hasMore: boolean;
    nextOffset: number;
  };
};
type SyncResponse = {
  data: {
    results: Array<{
      sourceId: string;
      status: 'synced' | 'skipped_locked' | 'skipped_disabled' | 'failed';
      itemCount: number;
      errorCode?: string;
    }>;
    sources: JobSourceSummary[];
  };
};

function apiError(error: unknown, fallback: string) {
  if (!(error instanceof ApiClientError)) return fallback;
  if (error.code === 'rate_limited') return 'Trop de synchronisations rapprochées. Patientez avant de réessayer.';
  if (error.code === 'forbidden') return 'Votre rôle ne permet pas de piloter les sources emploi.';
  return error.message || fallback;
}

function formatDate(value: string | null) {
  if (!value) return 'Jamais';
  return new Intl.DateTimeFormat('fr-CI', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function SourceCard({
  source,
  busy,
  onToggle,
  onSync,
}: {
  source: JobSourceSummary;
  busy: boolean;
  onToggle: (source: JobSourceSummary) => void;
  onSync: (source: JobSourceSummary) => void;
}) {
  const healthy = !source.lastErrorCode && source.lastSuccessAt;
  return (
    <Card className="relative overflow-hidden border-primary/10">
      <div className={cn(
        'absolute inset-y-0 left-0 w-1',
        !source.enabled ? 'bg-muted-foreground/30' : healthy ? 'bg-primary' : 'bg-terra',
      )} aria-hidden="true" />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Globe2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate font-display text-lg">{source.organizationName}</CardTitle>
              <a
                href={source.careerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
              >
                {source.officialDomain}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </div>
          <Badge variant={!source.enabled ? 'outline' : healthy ? 'secondary' : 'destructive'}>
            {!source.enabled ? 'En pause' : healthy ? 'Opérationnelle' : 'À contrôler'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-muted/50 p-2">
            <p className="font-display text-xl font-bold">{source.activeItemCount}</p>
            <p className="text-[11px] text-muted-foreground">actives</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-2">
            <p className="font-display text-xl font-bold">{source.hiddenItemCount}</p>
            <p className="text-[11px] text-muted-foreground">masquées</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-2">
            <p className="font-display text-xl font-bold">{source.lastItemCount}</p>
            <p className="text-[11px] text-muted-foreground">dernier lot</p>
          </div>
        </div>
        <dl className="space-y-2 text-xs">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Dernier succès</dt>
            <dd className="text-right font-medium">{formatDate(source.lastSuccessAt)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Périmètre</dt>
            <dd className="font-medium">{source.marketScope === 'ivory_coast' ? 'Côte d’Ivoire' : 'Afrique'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Connecteur</dt>
            <dd className="font-medium capitalize">{source.adapter}</dd>
          </div>
          {source.nextSyncAfter ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Nouvel essai auto.</dt>
              <dd className="text-right font-medium">{formatDate(source.nextSyncAfter)}</dd>
            </div>
          ) : null}
        </dl>
        {source.lastErrorCode ? (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
            Dernière erreur : {source.lastErrorCode}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" disabled={busy || !source.enabled} onClick={() => onSync(source)}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />}
            Synchroniser
          </Button>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => onToggle(source)}>
            {source.enabled
              ? <PauseCircle className="mr-2 h-4 w-4" aria-hidden="true" />
              : <PlayCircle className="mr-2 h-4 w-4" aria-hidden="true" />}
            {source.enabled ? 'Mettre en pause' : 'Réactiver'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function JobSourcesPage() {
  const { toast } = useToast();
  const [sources, setSources] = React.useState<JobSourceSummary[]>([]);
  const [jobs, setJobs] = React.useState<ExternalJob[]>([]);
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState<'all' | 'active' | 'expired' | 'hidden'>('all');
  const [loading, setLoading] = React.useState(true);
  const [jobsLoading, setJobsLoading] = React.useState(true);
  const [jobsLoadingMore, setJobsLoadingMore] = React.useState(false);
  const [jobsHasMore, setJobsHasMore] = React.useState(false);
  const [nextJobsOffset, setNextJobsOffset] = React.useState(0);
  const [busyId, setBusyId] = React.useState('');
  const [syncingAll, setSyncingAll] = React.useState(false);
  const [error, setError] = React.useState('');

  const loadSources = React.useCallback(async () => {
    const response = await apiFetch<SourceResponse>('/api/admin/job-sources');
    setSources(response.data.sources);
  }, []);

  const loadJobs = React.useCallback(async (offset = 0, append = false) => {
    if (append) setJobsLoadingMore(true);
    else setJobsLoading(true);
    try {
      const params = new URLSearchParams({ q, status, limit: '100', offset: String(offset) });
      const response = await apiFetch<JobsResponse>(`/api/admin/external-jobs?${params}`);
      setJobs((current) => {
        if (!append) return response.data.jobs;
        return Array.from(
          new Map([...current, ...response.data.jobs].map((job) => [job.id, job])).values(),
        );
      });
      setJobsHasMore(response.data.hasMore);
      setNextJobsOffset(response.data.nextOffset);
    } finally {
      if (append) setJobsLoadingMore(false);
      else setJobsLoading(false);
    }
  }, [q, status]);

  React.useEffect(() => {
    setLoading(true);
    setError('');
    loadSources()
      .catch((caught) => setError(apiError(caught, 'Le pilotage des sources n’a pas pu être chargé.')))
      .finally(() => setLoading(false));
  }, [loadSources]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      setError('');
      void loadJobs(0, false).catch((caught) => setError(apiError(caught, 'La liste des offres n’a pas pu être chargée.')));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [loadJobs]);

  async function toggleSource(source: JobSourceSummary) {
    setBusyId(source.id);
    try {
      const response = await apiFetch<SourceResponse>('/api/admin/job-sources', {
        method: 'PATCH',
        body: JSON.stringify({ sourceId: source.id, enabled: !source.enabled }),
      });
      setSources(response.data.sources);
      toast({
        title: source.enabled ? 'Source mise en pause' : 'Source réactivée',
        description: source.enabled
          ? 'Ses offres restent en cache mais ne sont plus visibles ni actualisées.'
          : 'Ses offres encore fraîches redeviennent visibles ; une synchronisation contrôle ensuite le flux.',
      });
      await loadJobs(0, false);
    } catch (caught) {
      toast({ variant: 'destructive', title: 'Modification impossible', description: apiError(caught, 'La source n’a pas été modifiée.') });
    } finally {
      setBusyId('');
    }
  }

  async function sync(sourceId: string | null) {
    if (sourceId) setBusyId(sourceId);
    else setSyncingAll(true);
    try {
      const response = await apiFetch<SyncResponse>('/api/admin/job-sources/sync', {
        method: 'POST',
        body: JSON.stringify({ sourceId }),
      });
      setSources(response.data.sources);
      const failed = response.data.results.filter((result) => result.status === 'failed');
      const imported = response.data.results.reduce((total, result) => total + result.itemCount, 0);
      toast({
        variant: failed.length ? 'destructive' : 'default',
        title: failed.length ? 'Synchronisation partielle' : 'Veille actualisée',
        description: failed.length
          ? `${failed.length} source(s) à contrôler. Les derniers résultats fiables restent disponibles.`
          : `${imported} opportunité(s) active(s) issues des flux ATS approuvés.`,
      });
      await loadJobs(0, false);
    } catch (caught) {
      toast({ variant: 'destructive', title: 'Synchronisation impossible', description: apiError(caught, 'Les derniers résultats fiables restent disponibles.') });
    } finally {
      setBusyId('');
      setSyncingAll(false);
    }
  }

  async function moderate(job: ExternalJob) {
    setBusyId(job.id);
    const nextStatus = job.status === 'hidden' ? 'active' : 'hidden';
    try {
      const response = await apiFetch<{ data: { job: ExternalJob } }>('/api/admin/external-jobs', {
        method: 'PATCH',
        body: JSON.stringify({
          jobId: job.id,
          status: nextStatus,
          note: nextStatus === 'hidden' ? 'Masquée depuis le tableau de modération.' : null,
        }),
      });
      setJobs((current) => current
        .map((item) => item.id === job.id ? response.data.job : item)
        .filter((item) => status === 'all' || item.status === status));
      toast({
        title: nextStatus === 'hidden' ? 'Offre masquée' : 'Offre restaurée',
        description: nextStatus === 'hidden'
          ? 'Elle n’apparaît plus dans la veille des diplômés.'
          : 'Elle est à nouveau visible si sa copie officielle est encore fraîche.',
      });
      await loadSources();
    } catch (caught) {
      toast({ variant: 'destructive', title: 'Modération impossible', description: apiError(caught, 'Le statut de cette offre n’a pas été modifié.') });
    } finally {
      setBusyId('');
    }
  }

  async function loadMoreJobs() {
    try {
      await loadJobs(nextJobsOffset, true);
    } catch (caught) {
      toast({
        variant: 'destructive',
        title: 'Chargement interrompu',
        description: apiError(caught, 'Les offres suivantes n’ont pas pu être chargées.'),
      });
    }
  }

  return (
    <div className="space-y-7 pb-10">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-[radial-gradient(circle_at_90%_0%,hsl(var(--lagoon)/.16),transparent_36%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--ivory)/.72))] p-5 shadow-soft sm:p-8 dark:bg-card">
        <div className="lagoon-grid pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
              Registre de sources approuvées
            </Badge>
            <h1 className="font-display text-3xl font-bold tracking-tight text-cocoa sm:text-5xl dark:text-foreground">
              Radar emploi vérifiable
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Pilotez les connecteurs, la fraîcheur et la modération. Les URL sont verrouillées dans le registre
              applicatif : personne ne peut saisir une adresse arbitraire à récupérer.
            </p>
          </div>
          <Button size="lg" disabled={syncingAll || loading} onClick={() => sync(null)}>
            {syncingAll
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              : <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />}
            Synchroniser toutes les sources
          </Button>
        </div>
      </section>

      <Alert>
        <Clock3 className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Actualisation sans service payant</AlertTitle>
        <AlertDescription>
          Yahnu tente une mise à jour lorsqu’un diplômé ouvre sa veille et qu’une source est ancienne.
          « Synchroniser » force un contrôle immédiat. En cas d’échec, le dernier lot fiable est conservé.
        </AlertDescription>
      </Alert>

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Le pilotage est momentanément indisponible</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <section aria-labelledby="source-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="section-kicker">Connecteurs</p>
            <h2 id="source-heading" className="mt-1 font-display text-2xl font-semibold">Flux ATS approuvés</h2>
          </div>
          <p className="text-sm text-muted-foreground">{sources.filter((source) => source.enabled).length} active(s)</p>
        </div>
        {loading ? (
          <div className="grid min-h-44 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" /></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {sources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                busy={busyId === source.id}
                onToggle={toggleSource}
                onSync={(item) => sync(item.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="moderation-heading">
        <div>
          <p className="section-kicker">Contrôle éditorial</p>
          <h2 id="moderation-heading" className="mt-1 font-display text-2xl font-semibold">Offres importées</h2>
        </div>
        <Card>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-[1fr_14rem]">
            <div className="space-y-2">
              <Label htmlFor="moderation-search">Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input id="moderation-search" className="pl-9" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Poste, entreprise ou ville" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="moderation-status">Statut</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
                <SelectTrigger id="moderation-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actives</SelectItem>
                  <SelectItem value="hidden">Masquées</SelectItem>
                  <SelectItem value="expired">Expirées</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {jobsLoading ? (
          <div className="grid min-h-44 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" /></div>
        ) : jobs.length ? (
          <div className="grid gap-3">
            {jobs.map((job) => (
              <Card key={job.id} className={cn('overflow-hidden', job.status === 'hidden' && 'border-terra/30 bg-terra/[0.025]')}>
                <CardContent className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={job.status === 'active' ? 'secondary' : job.status === 'hidden' ? 'destructive' : 'outline'}>
                        {job.status === 'active' ? 'Active' : job.status === 'hidden' ? 'Masquée' : 'Expirée'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{job.sourceName} · {job.officialDomain}</span>
                    </div>
                    <h3 className="mt-2 font-display text-lg font-semibold">{job.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {job.companyName}{job.location ? ` · ${job.location}` : ''} · vue le {formatDate(job.lastSeenAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={job.canonicalUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                        Source
                      </a>
                    </Button>
                    {job.status !== 'expired' ? (
                      <Button
                        variant={job.status === 'hidden' ? 'secondary' : 'ghost'}
                        size="sm"
                        disabled={busyId === job.id}
                        onClick={() => moderate(job)}
                      >
                        {busyId === job.id
                          ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                          : job.status === 'hidden'
                            ? <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                            : <EyeOff className="mr-2 h-4 w-4" aria-hidden="true" />}
                        {job.status === 'hidden' ? 'Restaurer' : 'Masquer'}
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
              <h3 className="mt-3 font-display text-xl font-semibold">Aucune offre dans cette vue</h3>
              <p className="mt-1 text-sm text-muted-foreground">Modifiez le filtre ou lancez une synchronisation.</p>
            </CardContent>
          </Card>
        )}
        {jobsHasMore && !jobsLoading ? (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              disabled={jobsLoadingMore}
              onClick={loadMoreJobs}
            >
              {jobsLoadingMore
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                : null}
              {jobsLoadingMore ? 'Chargement…' : 'Afficher les offres suivantes'}
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
