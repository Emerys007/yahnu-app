'use client';

import { type ChangeEvent, type FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  FileText,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { employmentTypes, type Job } from '@/lib/careers';

type JobListResponse = { data: { jobs: Job[]; hasMore: boolean; nextOffset: number } };
type JobResponse = { data: { job: Job } };

const MAX_RESUME_SIZE_BYTES = 8 * 1024 * 1024;
const suggestedLocations = ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro'];

const employmentLabels: Record<string, string> = {
  full_time: 'Temps plein',
  part_time: 'Temps partiel',
  contract: 'Contrat',
  internship: 'Stage',
  temporary: 'Mission temporaire',
  volunteer: 'Bénévolat',
  other: 'Autre',
};

function employmentLabel(value: string) {
  return employmentLabels[value] ?? 'Autre';
}

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat('fr-CI', { dateStyle: 'long' }).format(new Date(value));
}

function localizedApiError(caught: unknown, fallback: string) {
  if (!(caught instanceof ApiClientError)) return fallback;
  const messages: Record<string, string> = {
    already_applied: 'Vous avez déjà postulé à cette offre.',
    application_create_failed: 'Votre candidature n’a pas pu être envoyée.',
    authentication_required: 'Connectez-vous pour continuer.',
    forbidden: 'Votre compte ne permet pas d’effectuer cette action.',
    invalid_resume: 'Sélectionnez un CV valide au format PDF.',
    job_not_available: 'Cette offre n’est plus disponible.',
    payload_too_large: 'Le fichier envoyé est trop volumineux.',
    rate_limited: 'Trop de tentatives. Patientez un moment avant de réessayer.',
    request_failed: fallback,
    resume_too_large: 'Votre CV doit peser 8 Mo maximum.',
    unsupported_resume_type: 'Votre CV doit être au format PDF.',
  };
  return messages[caught.code] ?? fallback;
}

function ErrorNotice({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>Impossible d’afficher les opportunités</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>{message}</span>
        {retry ? <Button size="sm" variant="outline" onClick={retry}>Réessayer</Button> : null}
      </AlertDescription>
    </Alert>
  );
}

async function submitApplication(jobId: string, coverLetter: string, resume: File | null) {
  if (!resume) {
    await apiFetch('/api/applications', {
      method: 'POST',
      body: JSON.stringify({ jobId, coverLetter: coverLetter || null }),
    });
    return;
  }

  const formData = new FormData();
  formData.set('jobId', jobId);
  if (coverLetter) formData.set('coverLetter', coverLetter);
  formData.set('resume', resume);
  const response = await fetch('/api/applications', {
    method: 'POST',
    body: formData,
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  const payload = await response.json().catch(() => null) as { error?: { code?: string; message?: string } } | null;
  if (!response.ok) {
    throw new ApiClientError(
      payload?.error?.message || 'La candidature n’a pas pu être envoyée.',
      payload?.error?.code || 'application_create_failed',
      response.status,
    );
  }
}

function ApplicationForm({ job, onApplied }: { job: Job; onApplied: () => void }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [resume, setResume] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function chooseResume(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null;
    setError('');
    if (!file) {
      setResume(null);
      return;
    }
    if (file.size > MAX_RESUME_SIZE_BYTES) {
      event.target.value = '';
      setResume(null);
      setError('Choisissez un CV PDF de 8 Mo maximum.');
      return;
    }
    if (file.type && file.type.toLowerCase() !== 'application/pdf' && file.type.toLowerCase() !== 'application/x-pdf') {
      event.target.value = '';
      setResume(null);
      setError('Votre CV doit être au format PDF.');
      return;
    }
    setResume(file);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await submitApplication(job.id, coverLetter.trim(), resume);
      onApplied();
    } catch (caught) {
      setError(localizedApiError(caught, 'Votre candidature n’a pas pu être envoyée. Réessayez dans un instant.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold">Présentez votre motivation</p>
          <p className="text-sm text-muted-foreground">Soyez simple, précis et vous-même.</p>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`cover-${job.id}`}>Message de motivation <span className="font-normal text-muted-foreground">(facultatif)</span></Label>
        <Textarea
          id={`cover-${job.id}`}
          value={coverLetter}
          onChange={(event) => setCoverLetter(event.target.value)}
          maxLength={20_000}
          rows={5}
          placeholder="Expliquez en quelques lignes ce que vous pouvez apporter à l’équipe."
          disabled={submitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`resume-${job.id}`}>CV <span className="font-normal text-muted-foreground">(PDF, facultatif)</span></Label>
        <Input
          id={`resume-${job.id}`}
          type="file"
          accept="application/pdf,.pdf"
          disabled={submitting}
          aria-describedby={`resume-help-${job.id}`}
          onChange={chooseResume}
        />
        <p id={`resume-help-${job.id}`} className="flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
          PDF uniquement, 8 Mo maximum. Votre CV reste privé et n’est partagé qu’avec cet employeur.
        </p>
        {resume ? (
          <div className="flex min-w-0 items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2 text-sm">
            <span className="flex min-w-0 items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /><span className="truncate">{resume.name} · {Math.ceil(resume.size / 1024)} Ko</span></span>
            <Button type="button" variant="ghost" size="sm" disabled={submitting} onClick={() => setResume(null)}>Retirer</Button>
          </div>
        ) : null}
      </div>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
        {submitting ? 'Envoi en cours…' : 'Envoyer ma candidature'}
      </Button>
    </form>
  );
}

function JobCard({ job, dashboard }: { job: Job; dashboard: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const closingDate = formatDate(job.closesAt);

  return (
    <Card className="group relative overflow-hidden border-border/70 shadow-soft transition-[border-color,box-shadow] duration-200 hover:border-primary/30 hover:shadow-lift motion-reduce:transition-none">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-terra via-soleil to-primary" aria-hidden="true" />
      <CardHeader className="gap-3 pt-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <CardTitle className="text-xl sm:text-2xl">
              <Link className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/jobs/${encodeURIComponent(job.id)}`}>
                {job.title}
              </Link>
            </CardTitle>
            <CardDescription className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4 text-lagoon" aria-hidden="true" />{job.companyName}</span>
              {job.location ? <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-terra" aria-hidden="true" />{job.location}</span> : null}
            </CardDescription>
          </div>
          {job.employmentType ? <Badge variant="secondary">{employmentLabel(job.employmentType)}</Badge> : null}
        </div>
        {closingDate ? <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />Candidatures jusqu’au {closingDate}</p> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{job.description}</p>
        {applied ? <Alert><BriefcaseBusiness className="h-4 w-4" aria-hidden="true" /><AlertTitle>Candidature envoyée</AlertTitle><AlertDescription>Suivez son évolution depuis « Mes candidatures ».</AlertDescription></Alert> : null}
        {applying && !applied ? <ApplicationForm job={job} onApplied={() => { setApplied(true); setApplying(false); }} /> : null}
      </CardContent>
      <CardFooter className="flex flex-col-reverse items-stretch justify-between gap-3 border-t bg-muted/15 pt-5 sm:flex-row sm:items-center">
        <Button variant="ghost" asChild><Link href={`/jobs/${encodeURIComponent(job.id)}`}>Voir l’offre<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button>
        {!authLoading && user?.role === 'graduate' && !applied ? (
          <Button onClick={() => setApplying((value) => !value)} variant={applying ? 'outline' : 'default'} aria-expanded={applying}>{applying ? 'Fermer le formulaire' : 'Postuler maintenant'}</Button>
        ) : null}
        {!authLoading && !user && !dashboard ? <Button asChild><Link href={`/login?next=${encodeURIComponent(`/jobs/${job.id}`)}`}>Se connecter pour postuler</Link></Button> : null}
      </CardFooter>
    </Card>
  );
}

export function JobBrowser({ dashboard = false }: { dashboard?: boolean }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQ(params.get('q') ?? '');
    setLocation(params.get('location') ?? '');
    const requestedType = params.get('employmentType');
    if (requestedType && employmentTypes.includes(requestedType as (typeof employmentTypes)[number])) {
      setEmploymentType(requestedType);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ limit: '12', q, location });
      if (employmentType !== 'all') params.set('employmentType', employmentType);
      try {
        const response = await apiFetch<JobListResponse>(`/api/jobs?${params}`, { signal: controller.signal });
        setJobs(response.data.jobs);
        setHasMore(response.data.hasMore);
        setNextOffset(response.data.nextOffset);
      } catch (caught) {
        if (!controller.signal.aborted) setError(localizedApiError(caught, 'La liste des offres est momentanément indisponible.'));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [q, location, employmentType, reloadKey]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    setError('');
    const params = new URLSearchParams({ limit: '12', offset: String(nextOffset), q, location });
    if (employmentType !== 'all') params.set('employmentType', employmentType);
    try {
      const response = await apiFetch<JobListResponse>(`/api/jobs?${params}`);
      setJobs((current) => [...current, ...response.data.jobs]);
      setHasMore(response.data.hasMore);
      setNextOffset(response.data.nextOffset);
    } catch (caught) {
      setError(localizedApiError(caught, 'Les offres suivantes n’ont pas pu être chargées.'));
    } finally {
      setLoadingMore(false);
    }
  }, [employmentType, location, nextOffset, q]);

  return (
    <section className={dashboard ? 'space-y-6' : 'page-shell space-y-8 py-10 sm:py-14'} aria-busy={loading}>
      <div className={dashboard ? 'relative overflow-hidden rounded-3xl border bg-card p-5 sm:p-7' : 'relative mx-auto max-w-3xl text-center'}>
        {dashboard ? <div className="ci-pattern pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" /> : null}
        <div className="relative">
          <Badge variant="secondary" className="mb-3"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />Opportunités en Côte d’Ivoire</Badge>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Trouvez le poste qui vous fera avancer</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Yahnu affiche uniquement les offres ouvertes et non expirées publiées par les employeurs de la plateforme.</p>
        </div>
      </div>

      <Card className="overflow-hidden border-primary/15">
        <div className="h-1 bg-gradient-to-r from-terra via-soleil to-primary" aria-hidden="true" />
        <CardContent className="grid gap-4 pt-6 md:grid-cols-[1fr_0.75fr_0.6fr]">
          <div className="space-y-2">
            <Label htmlFor="job-search">Métier ou compétence</Label>
            <div className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" /><Input id="job-search" className="pl-9" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Ex. développeur, comptabilité, agronomie" /></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-location">Lieu</Label>
            <Input id="job-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Ex. Abidjan ou télétravail" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-employment">Type d’engagement</Label>
            <Select value={employmentType} onValueChange={setEmploymentType}><SelectTrigger id="job-employment"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous les types</SelectItem>{employmentTypes.map((type) => <SelectItem key={type} value={type}>{employmentLabel(type)}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:col-span-3">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Villes recherchées</span>
            {suggestedLocations.map((city) => <Button key={city} type="button" size="sm" variant={location === city ? 'secondary' : 'ghost'} onClick={() => setLocation(location === city ? '' : city)}>{city}</Button>)}
          </div>
        </CardContent>
      </Card>

      {error ? <ErrorNotice message={error} retry={() => setReloadKey((value) => value + 1)} /> : null}
      {loading ? <div className="grid min-h-52 place-items-center" role="status"><Loader2 className="h-7 w-7 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" /><span className="sr-only">Chargement des offres…</span></div> : null}
      {!loading && jobs.length === 0 && !error ? <Card><CardContent className="py-14 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary"><BriefcaseBusiness className="h-7 w-7" aria-hidden="true" /></div><h2 className="mt-4 font-display text-xl font-semibold">Aucune offre ne correspond encore</h2><p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Élargissez le métier ou la ville. Une recherche comme « commerce » ou « Abidjan » peut ouvrir davantage de pistes.</p></CardContent></Card> : null}
      {!loading && jobs.length ? <><p className="text-sm text-muted-foreground" aria-live="polite">{jobs.length} offre{jobs.length > 1 ? 's' : ''} affichée{jobs.length > 1 ? 's' : ''}</p><div className="grid gap-5 lg:grid-cols-2">{jobs.map((job) => <JobCard key={job.id} job={job} dashboard={dashboard} />)}</div></> : null}
      {hasMore ? <div className="flex justify-center"><Button variant="outline" onClick={loadMore} disabled={loadingMore}>{loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}{loadingMore ? 'Chargement…' : 'Afficher plus d’offres'}</Button></div> : null}
    </section>
  );
}

export function JobDetail({ id }: { id: string }) {
  const { user, loading: authLoading } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    apiFetch<JobResponse>(`/api/jobs/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then((response) => setJob(response.data.job))
      .catch((caught) => { if (!controller.signal.aborted) setError(localizedApiError(caught, 'Cette offre n’a pas pu être chargée.')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, reloadKey]);

  if (loading) return <div className="grid min-h-[55vh] place-items-center" role="status"><Loader2 className="h-8 w-8 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" /><span className="sr-only">Chargement de l’offre…</span></div>;
  if (error || !job) return <div className="page-shell py-16"><ErrorNotice message={error || 'Cette offre n’est plus disponible.'} retry={() => setReloadKey((value) => value + 1)} /></div>;
  const closingDate = formatDate(job.closesAt);

  return (
    <div>
      <section className="relative overflow-hidden border-b bg-ivory/70 dark:bg-card">
        <div className="lagoon-grid pointer-events-none absolute inset-0 opacity-35" aria-hidden="true" />
        <div className="page-shell relative py-10 sm:py-16">
          <Button variant="ghost" asChild className="mb-6 -ml-3"><Link href="/jobs"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />Retour aux offres</Link></Button>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl space-y-4">
              <Badge>{job.employmentType ? employmentLabel(job.employmentType) : 'Opportunité'}</Badge>
              <h1 className="font-display text-4xl font-bold tracking-tight text-cocoa sm:text-5xl dark:text-foreground">{job.title}</h1>
              <p className="flex flex-wrap gap-4 text-base text-muted-foreground sm:text-lg"><span className="inline-flex items-center gap-2"><Building2 className="h-5 w-5 text-lagoon" aria-hidden="true" />{job.companyName}</span>{job.location ? <span className="inline-flex items-center gap-2"><MapPin className="h-5 w-5 text-terra" aria-hidden="true" />{job.location}</span> : null}</p>
            </div>
            {closingDate ? <p className="rounded-full border bg-background/90 px-4 py-2 text-sm shadow-sm"><CalendarClock className="mr-1.5 inline h-4 w-4 text-terra" aria-hidden="true" />Clôture le {closingDate}</p> : null}
          </div>
        </div>
      </section>
      <section className="page-shell grid gap-8 py-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <article className="max-w-3xl rounded-3xl border bg-card p-5 shadow-soft sm:p-8">
          <span className="section-kicker">La mission</span>
          <h2 className="mt-3 font-display text-2xl font-semibold">À propos du poste</h2>
          <p className="mt-5 whitespace-pre-line text-base leading-8 text-muted-foreground">{job.description}</p>
        </article>
        <aside className="h-fit space-y-4 rounded-3xl border border-primary/15 bg-card p-5 shadow-soft sm:p-6 lg:sticky lg:top-24">
          <div><p className="section-kicker">Votre prochaine étape</p><h2 className="mt-2 font-display text-xl font-semibold">Envie de tenter votre chance ?</h2></div>
          {applied ? <Alert><BriefcaseBusiness className="h-4 w-4" aria-hidden="true" /><AlertTitle>Candidature envoyée</AlertTitle><AlertDescription>Vous pouvez suivre son évolution depuis votre tableau de bord.</AlertDescription></Alert> : null}
          {!applied && applying ? <ApplicationForm job={job} onApplied={() => { setApplied(true); setApplying(false); }} /> : null}
          {!authLoading && user?.role === 'graduate' && !applied && !applying ? <Button className="w-full" onClick={() => setApplying(true)}>Postuler avec Yahnu</Button> : null}
          {!authLoading && !user ? <Button className="w-full" asChild><Link href={`/login?next=${encodeURIComponent(`/jobs/${job.id}`)}`}>Se connecter pour postuler</Link></Button> : null}
          {!authLoading && user && user.role !== 'graduate' ? <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">La candidature en ligne est réservée aux comptes diplômés.</p> : null}
          {job.applicationUrl ? <Button className="w-full" variant="outline" asChild><a href={job.applicationUrl} target="_blank" rel="noopener noreferrer">Postuler sur le site de l’employeur<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></a></Button> : null}
          <p className="flex items-start gap-2 border-t pt-4 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />Yahnu protège vos données et ne partage votre dossier qu’avec l’employeur concerné.</p>
        </aside>
      </section>
    </div>
  );
}
