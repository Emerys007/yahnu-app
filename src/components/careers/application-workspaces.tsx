'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  FileText,
  Loader2,
  Mail,
  Search,
  UserRound,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { type ApplicationStatus, type JobApplication } from '@/lib/careers';

type ListResponse = { data: { applications: JobApplication[]; hasMore: boolean; nextOffset: number } };
type UpdateResponse = { data: { application: JobApplication } };

const companyStatuses: ApplicationStatus[] = ['submitted', 'reviewing', 'shortlisted', 'interviewing', 'accepted', 'rejected'];
const graduateStatuses = [...companyStatuses, 'withdrawn'] as const;

const statusLabels: Record<string, string> = {
  all: 'Tous les statuts',
  submitted: 'Envoyée',
  reviewing: 'En étude',
  shortlisted: 'Présélectionnée',
  interviewing: 'Entretien',
  accepted: 'Retenue',
  rejected: 'Non retenue',
  withdrawn: 'Retirée',
};

function statusLabel(value: string) {
  return statusLabels[value] ?? 'Étape à vérifier';
}

function statusAccent(value: string) {
  if (value === 'accepted') return 'bg-primary';
  if (value === 'interviewing' || value === 'shortlisted') return 'bg-terra';
  if (value === 'rejected' || value === 'withdrawn') return 'bg-muted-foreground/40';
  return 'bg-lagoon';
}

function statusBadge(value: string): 'default' | 'secondary' | 'outline' {
  if (value === 'accepted') return 'default';
  if (value === 'rejected' || value === 'withdrawn') return 'outline';
  return 'secondary';
}

function localizedApiError(caught: unknown, fallback: string) {
  if (!(caught instanceof ApiClientError)) return fallback;
  const messages: Record<string, string> = {
    application_finalized: 'Cette candidature a déjà reçu une décision et ne peut plus être retirée.',
    application_not_found: 'Cette candidature est introuvable.',
    application_withdrawn: 'Une candidature retirée ne peut plus être modifiée.',
    authentication_required: 'Connectez-vous pour continuer.',
    forbidden: 'Votre compte ne permet pas d’effectuer cette action.',
    invalid_application_action: 'Cette action n’est pas autorisée pour votre compte.',
    invalid_application_status: 'Sélectionnez une étape valide.',
    rate_limited: 'Trop de tentatives. Patientez un moment avant de réessayer.',
    request_failed: fallback,
  };
  return messages[caught.code] ?? fallback;
}

function ApplicationError({ message }: { message: string }) {
  return <Alert variant="destructive"><AlertCircle className="h-4 w-4" aria-hidden="true" /><AlertTitle>La demande n’a pas abouti</AlertTitle><AlertDescription>{message}</AlertDescription></Alert>;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('fr-CI', { dateStyle: 'long' }).format(new Date(value));
}

export function GraduateApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchApplications = useCallback(async (append: boolean, offset: number) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError('');
    const params = new URLSearchParams({ status, limit: '20', offset: String(offset) });
    try {
      const response = await apiFetch<ListResponse>(`/api/applications?${params}`);
      setApplications((current) => append ? [...current, ...response.data.applications] : response.data.applications);
      setHasMore(response.data.hasMore);
      setNextOffset(response.data.nextOffset);
    } catch (caught) {
      setError(localizedApiError(caught, 'Vos candidatures n’ont pas pu être chargées.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [status]);

  useEffect(() => { void fetchApplications(false, 0); }, [fetchApplications]);

  async function withdraw(application: JobApplication) {
    if (!window.confirm(`Retirer votre candidature pour « ${application.job?.title || 'cette offre'} » ?`)) return;
    setUpdatingId(application.id);
    setError('');
    try {
      const response = await apiFetch<UpdateResponse>(`/api/applications/${encodeURIComponent(application.id)}`, {
        method: 'PATCH', body: JSON.stringify({ status: 'withdrawn' }),
      });
      setApplications((current) => current.map((item) => item.id === application.id ? response.data.application : item));
    } catch (caught) {
      setError(localizedApiError(caught, 'La candidature n’a pas pu être retirée.'));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6" aria-busy={loading}>
      <section className="relative overflow-hidden rounded-3xl border bg-card p-5 shadow-soft sm:p-7">
        <div className="ci-pattern pointer-events-none absolute inset-0 opacity-45" aria-hidden="true" />
        <div className="relative">
          <p className="section-kicker">Mon parcours</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Mes candidatures</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Gardez le fil de chaque candidature envoyée sur Yahnu, de l’envoi jusqu’à la décision de l’employeur.</p>
        </div>
      </section>

      <Card className="max-w-md border-border/70"><CardContent className="pt-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-center"><Label htmlFor="graduate-application-status" className="shrink-0">Afficher</Label><Select value={status} onValueChange={setStatus}><SelectTrigger id="graduate-application-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous les statuts</SelectItem>{graduateStatuses.map((value) => <SelectItem key={value} value={value}>{statusLabel(value)}</SelectItem>)}</SelectContent></Select></div></CardContent></Card>

      {error ? <ApplicationError message={error} /> : null}
      {loading ? <div className="grid min-h-48 place-items-center" role="status"><Loader2 className="h-7 w-7 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" /><span className="sr-only">Chargement de vos candidatures…</span></div> : null}
      {!loading && applications.length === 0 ? <Card><CardContent className="py-14 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary"><FileText className="h-7 w-7" aria-hidden="true" /></div><h2 className="mt-4 font-display text-xl font-semibold">Aucune candidature dans cette vue</h2><p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Parcourez les offres ouvertes à Abidjan et partout en Côte d’Ivoire, puis candidatez quand une mission vous ressemble.</p><Button className="mt-5" asChild><Link href="/dashboard/jobs">Découvrir les offres<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button></CardContent></Card> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {applications.map((application) => (
          <Card key={application.id} className="relative overflow-hidden border-border/70">
            <div className={`absolute inset-y-0 left-0 w-1 ${statusAccent(application.status)}`} aria-hidden="true" />
            <CardHeader className="gap-3 pl-7 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0"><CardTitle>{application.job?.title || 'Offre indisponible'}</CardTitle><CardDescription className="mt-2 flex flex-wrap gap-x-3 gap-y-1"><span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4 text-lagoon" aria-hidden="true" />{application.job?.companyName || 'Employeur indisponible'}</span><span>Envoyée le {dateLabel(application.submittedAt)}</span></CardDescription></div>
              <Badge variant={statusBadge(application.status)}>{statusLabel(application.status)}</Badge>
            </CardHeader>
            <CardContent className="space-y-4 pl-7">
              {application.coverLetter ? <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Votre message</p><p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{application.coverLetter}</p></div> : <p className="text-sm text-muted-foreground">Aucun message de motivation n’a été joint.</p>}
              <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:flex-wrap">
                {application.job ? <Button variant="outline" size="sm" asChild><Link href={`/jobs/${encodeURIComponent(application.job.id)}`}>Voir l’offre</Link></Button> : null}
                {application.resumeUrl ? <Button variant="outline" size="sm" asChild><a href={application.resumeUrl} target="_blank" rel="noopener noreferrer"><FileText className="mr-2 h-4 w-4" aria-hidden="true" />Voir le CV envoyé</a></Button> : null}
                {!['accepted', 'rejected', 'withdrawn'].includes(application.status) ? <Button variant="ghost" size="sm" disabled={updatingId === application.id} onClick={() => void withdraw(application)}>{updatingId === application.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}{updatingId === application.id ? 'Retrait…' : 'Retirer ma candidature'}</Button> : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasMore ? <div className="flex justify-center"><Button variant="outline" disabled={loadingMore} onClick={() => void fetchApplications(true, nextOffset)}>{loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}{loadingMore ? 'Chargement…' : 'Afficher plus de candidatures'}</Button></div> : null}
    </div>
  );
}

export function CompanyApplicants({ initialJobId = '' }: { initialJobId?: string }) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [jobId, setJobId] = useState(initialJobId);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchApplications = useCallback(async (append: boolean, offset: number) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError('');
    const params = new URLSearchParams({ jobId, q, status, limit: '20', offset: String(offset) });
    try {
      const response = await apiFetch<ListResponse>(`/api/applications?${params}`);
      setApplications((current) => append ? [...current, ...response.data.applications] : response.data.applications);
      setHasMore(response.data.hasMore);
      setNextOffset(response.data.nextOffset);
    } catch (caught) {
      setError(localizedApiError(caught, 'Les candidatures n’ont pas pu être chargées.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [jobId, q, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchApplications(false, 0), 200);
    return () => window.clearTimeout(timer);
  }, [fetchApplications]);

  async function updateStatus(application: JobApplication, nextStatus: string) {
    setUpdatingId(application.id);
    setError('');
    try {
      const response = await apiFetch<UpdateResponse>(`/api/applications/${encodeURIComponent(application.id)}`, {
        method: 'PATCH', body: JSON.stringify({ status: nextStatus }),
      });
      setApplications((current) => current.map((item) => item.id === application.id ? response.data.application : item));
    } catch (caught) {
      setError(localizedApiError(caught, 'L’étape de cette candidature n’a pas pu être mise à jour.'));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6" aria-busy={loading}>
      <section className="relative overflow-hidden rounded-3xl border bg-card p-5 shadow-soft sm:p-7">
        <div className="ci-pattern pointer-events-none absolute inset-0 opacity-45" aria-hidden="true" />
        <div className="relative">
          <p className="section-kicker">Talents & recrutement</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Candidatures reçues</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Étudiez chaque profil avec attention et faites avancer les candidats dans votre processus de recrutement.</p>
        </div>
      </section>

      <Card className="border-border/70"><CardContent className="grid gap-4 pt-6 lg:grid-cols-[1fr_0.8fr_0.65fr]">
        <div className="space-y-2"><Label htmlFor="applicant-search">Candidat ou offre</Label><div className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" /><Input id="applicant-search" className="pl-9" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Ex. Awa ou marketing" /></div></div>
        <div className="space-y-2"><Label htmlFor="applicant-job-id">Référence de l’offre</Label><Input id="applicant-job-id" value={jobId} onChange={(event) => setJobId(event.target.value)} placeholder="Toutes les offres" /></div>
        <div className="space-y-2"><Label htmlFor="applicant-status">Étape</Label><Select value={status} onValueChange={setStatus}><SelectTrigger id="applicant-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Toutes les étapes</SelectItem>{companyStatuses.map((value) => <SelectItem key={value} value={value}>{statusLabel(value)}</SelectItem>)}</SelectContent></Select></div>
      </CardContent></Card>

      {error ? <ApplicationError message={error} /> : null}
      {loading ? <div className="grid min-h-48 place-items-center" role="status"><Loader2 className="h-7 w-7 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" /><span className="sr-only">Chargement des candidatures…</span></div> : null}
      {!loading && applications.length === 0 ? <Card><CardContent className="py-14 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary"><UserRound className="h-7 w-7" aria-hidden="true" /></div><h2 className="mt-4 font-display text-xl font-semibold">Aucune candidature dans cette vue</h2><p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Les nouveaux profils apparaîtront ici dès qu’un diplômé postulera à l’une de vos offres.</p></CardContent></Card> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {applications.map((application) => (
          <Card key={application.id} className="relative overflow-hidden border-border/70">
            <div className={`absolute inset-y-0 left-0 w-1 ${statusAccent(application.status)}`} aria-hidden="true" />
            <CardHeader className="gap-3 pl-7 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0"><CardTitle>{application.applicant?.name || 'Candidat issu de la migration'}</CardTitle><CardDescription className="mt-2 space-y-1"><span className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-lagoon" aria-hidden="true" />{application.applicant?.email || 'Coordonnées indisponibles'}</span><span className="flex items-center gap-1.5"><BriefcaseBusiness className="h-4 w-4 text-terra" aria-hidden="true" />{application.job?.title || 'Offre indisponible'} · {dateLabel(application.submittedAt)}</span></CardDescription></div>
              <Badge variant={statusBadge(application.status)}>{statusLabel(application.status)}</Badge>
            </CardHeader>
            <CardContent className="space-y-5 pl-7">
              <div><p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Message de motivation</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{application.coverLetter || 'Aucun message de motivation n’a été joint.'}</p></div>
              <div className="flex flex-col items-stretch gap-3 border-t pt-4 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="min-w-0 flex-1 space-y-1.5 sm:min-w-52"><Label htmlFor={`status-${application.id}`}>Faire avancer le dossier</Label><Select value={companyStatuses.includes(application.status as ApplicationStatus) ? application.status : 'submitted'} disabled={updatingId === application.id || application.status === 'withdrawn'} onValueChange={(value) => void updateStatus(application, value)}><SelectTrigger id={`status-${application.id}`}><SelectValue /></SelectTrigger><SelectContent>{companyStatuses.map((value) => <SelectItem key={value} value={value}>{statusLabel(value)}</SelectItem>)}</SelectContent></Select></div>
                {updatingId === application.id ? <span className="inline-flex items-center gap-2 pb-3 text-sm text-muted-foreground" role="status"><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />Mise à jour…</span> : null}
                {application.resumeUrl ? <Button variant="outline" asChild><a href={application.resumeUrl} target="_blank" rel="noopener noreferrer"><FileText className="mr-2 h-4 w-4" aria-hidden="true" />Consulter le CV privé</a></Button> : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasMore ? <div className="flex justify-center"><Button variant="outline" disabled={loadingMore} onClick={() => void fetchApplications(true, nextOffset)}>{loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}{loadingMore ? 'Chargement…' : 'Afficher plus de candidatures'}</Button></div> : null}
    </div>
  );
}
