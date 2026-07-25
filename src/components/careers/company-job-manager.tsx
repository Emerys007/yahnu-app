'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Edit3,
  Loader2,
  MapPin,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { employmentTypes, type Job } from '@/lib/careers';

type JobListResponse = { data: { jobs: Job[]; hasMore: boolean; nextOffset: number } };
type JobResponse = { data: { job: Job } };
type FormState = {
  title: string;
  location: string;
  employmentType: string;
  description: string;
  status: 'draft' | 'open' | 'closed';
  applicationUrl: string;
  closesAt: string;
};

const emptyForm: FormState = {
  title: '',
  location: '',
  employmentType: 'full_time',
  description: '',
  status: 'draft',
  applicationUrl: '',
  closesAt: '',
};

const employmentLabels: Record<string, string> = {
  full_time: 'Temps plein',
  part_time: 'Temps partiel',
  contract: 'Contrat',
  internship: 'Stage',
  temporary: 'Mission temporaire',
  volunteer: 'Bénévolat',
  other: 'Autre',
};

const jobStatusLabels: Record<string, string> = {
  all: 'Tous les statuts',
  draft: 'Brouillon',
  open: 'En ligne',
  closed: 'Clôturée',
};

function employmentLabel(value: string) {
  return employmentLabels[value] ?? 'Autre';
}

function apiError(caught: unknown, fallback: string) {
  if (!(caught instanceof ApiClientError)) return fallback;
  const messages: Record<string, string> = {
    authentication_required: 'Connectez-vous pour continuer.',
    forbidden: 'Votre compte ne permet pas d’effectuer cette action.',
    invalid_origin: 'Votre session doit être actualisée avant de continuer.',
    job_create_failed: 'L’offre n’a pas pu être créée.',
    job_not_found: 'Cette offre est introuvable.',
    job_update_failed: 'Les modifications n’ont pas pu être enregistrées.',
    rate_limited: 'Trop de tentatives. Patientez un moment avant de réessayer.',
    request_failed: fallback,
  };
  return messages[caught.code] ?? fallback;
}

function toForm(job: Job): FormState {
  const allowedStatus = ['draft', 'open', 'closed'].includes(job.status) ? job.status as FormState['status'] : 'closed';
  return {
    title: job.title,
    location: job.location || '',
    employmentType: employmentTypes.includes(job.employmentType as (typeof employmentTypes)[number]) ? job.employmentType! : 'other',
    description: job.description,
    status: allowedStatus,
    applicationUrl: job.applicationUrl || '',
    closesAt: job.closesAt ? job.closesAt.slice(0, 10) : '',
  };
}

export function CompanyJobManager() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = useCallback(async (append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError('');
    const params = new URLSearchParams({ scope: 'mine', q, status, limit: '20', offset: append ? String(nextOffset) : '0' });
    try {
      const response = await apiFetch<JobListResponse>(`/api/jobs?${params}`);
      setJobs((current) => append ? [...current, ...response.data.jobs] : response.data.jobs);
      setHasMore(response.data.hasMore);
      setNextOffset(response.data.nextOffset);
    } catch (caught) {
      setError(apiError(caught, 'Vos offres n’ont pas pu être chargées.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [nextOffset, q, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(false), 200);
    return () => window.clearTimeout(timer);
  }, [q, status]);

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError('');
  }

  function openEdit(job: Job) {
    setEditingId(job.id);
    setForm(toForm(job));
    setShowForm(true);
    setError('');
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await apiFetch<JobResponse>(editingId ? `/api/jobs/${encodeURIComponent(editingId)}` : '/api/jobs', {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify({
          ...form,
          location: form.location || null,
          applicationUrl: form.applicationUrl || null,
          closesAt: form.closesAt || null,
        }),
      });
      setJobs((current) => editingId
        ? current.map((job) => job.id === editingId ? { ...response.data.job, applicationCount: job.applicationCount } : job)
        : [{ ...response.data.job, applicationCount: 0 }, ...current]);
      closeForm();
    } catch (caught) {
      setError(apiError(caught, 'L’offre n’a pas pu être enregistrée. Vérifiez les informations saisies.'));
    } finally {
      setSaving(false);
    }
  }

  async function closeJob(job: Job) {
    if (!window.confirm(`Clôturer l’offre « ${job.title} » ? Elle restera visible dans votre historique.`)) return;
    setError('');
    try {
      await apiFetch(`/api/jobs/${encodeURIComponent(job.id)}`, { method: 'DELETE' });
      setJobs((current) => current.map((item) => item.id === job.id ? { ...item, status: 'closed' } : item));
    } catch (caught) {
      setError(apiError(caught, 'Cette offre n’a pas pu être clôturée.'));
    }
  }

  return (
    <div className="space-y-6" aria-busy={loading}>
      <section className="relative overflow-hidden rounded-3xl border bg-card p-5 shadow-soft sm:p-7">
        <div className="ci-pattern pointer-events-none absolute inset-0 opacity-45" aria-hidden="true" />
        <div className="relative flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="section-kicker">Espace recruteur</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Vos offres d’emploi</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">Publiez vos besoins, suivez chaque annonce et retrouvez les talents ivoiriens qui vous ont contacté.</p>
          </div>
          <Button onClick={openCreate} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Créer une offre</Button>
        </div>
      </section>

      {error ? <Alert variant="destructive"><AlertCircle className="h-4 w-4" aria-hidden="true" /><AlertTitle>Une action est nécessaire</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}

      {showForm ? (
        <Card className="overflow-hidden border-primary/20 shadow-lift">
          <div className="h-1 bg-gradient-to-r from-terra via-soleil to-primary" aria-hidden="true" />
          <CardHeader className="flex-row items-start justify-between gap-4 pt-7">
            <div><CardTitle>{editingId ? 'Modifier l’offre' : 'Créer une offre'}</CardTitle><CardDescription>Seules les offres ouvertes et non expirées sont publiées sur Yahnu.</CardDescription></div>
            <Button variant="ghost" size="icon" onClick={closeForm} aria-label="Fermer le formulaire"><X className="h-4 w-4" aria-hidden="true" /></Button>
          </CardHeader>
          <CardContent>
            <form className="grid gap-5 md:grid-cols-2" onSubmit={save}>
              <div className="space-y-2 md:col-span-2"><Label htmlFor="job-title">Intitulé du poste</Label><Input id="job-title" required minLength={3} maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ex. Chargé·e de clientèle junior" /></div>
              <div className="space-y-2"><Label htmlFor="job-location">Lieu</Label><Input id="job-location" maxLength={200} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Ex. Abidjan, Cocody" /></div>
              <div className="space-y-2"><Label htmlFor="job-employment">Type d’engagement</Label><Select value={form.employmentType} onValueChange={(value) => setForm({ ...form, employmentType: value })}><SelectTrigger id="job-employment"><SelectValue /></SelectTrigger><SelectContent>{employmentTypes.map((type) => <SelectItem key={type} value={type}>{employmentLabel(type)}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="job-status">Statut de publication</Label><Select value={form.status} onValueChange={(value: FormState['status']) => setForm({ ...form, status: value })}><SelectTrigger id="job-status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Brouillon</SelectItem><SelectItem value="open">En ligne</SelectItem><SelectItem value="closed">Clôturée</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="job-closes">Date limite de candidature</Label><Input id="job-closes" type="date" value={form.closesAt} onChange={(event) => setForm({ ...form, closesAt: event.target.value })} /></div>
              <div className="space-y-2 md:col-span-2"><Label htmlFor="application-url">Lien externe de candidature <span className="font-normal text-muted-foreground">(facultatif)</span></Label><Input id="application-url" type="url" maxLength={2048} value={form.applicationUrl} onChange={(event) => setForm({ ...form, applicationUrl: event.target.value })} placeholder="https://votre-entreprise.ci/recrutement" /></div>
              <div className="space-y-2 md:col-span-2"><Label htmlFor="job-description">Description du poste</Label><Textarea id="job-description" required minLength={20} maxLength={100000} rows={10} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Présentez la mission, les responsabilités, le profil recherché et les modalités de candidature." /></div>
              <div className="flex flex-col-reverse gap-3 md:col-span-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={closeForm}>Annuler</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}{saving ? 'Enregistrement…' : editingId ? 'Enregistrer les modifications' : 'Créer l’offre'}</Button></div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/70">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-[1fr_13rem]">
          <div className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" /><Input className="pl-9" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Rechercher dans vos offres" aria-label="Rechercher dans vos offres" /></div>
          <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Filtrer par statut"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(jobStatusLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
        </CardContent>
      </Card>

      {loading ? <div className="grid min-h-48 place-items-center" role="status"><Loader2 className="h-7 w-7 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" /><span className="sr-only">Chargement de vos offres…</span></div> : null}
      {!loading && jobs.length === 0 ? <Card><CardContent className="py-14 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary"><BriefcaseBusiness className="h-7 w-7" aria-hidden="true" /></div><h2 className="mt-4 font-display text-xl font-semibold">Aucune offre pour le moment</h2><p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Créez un brouillon pour préparer votre prochain recrutement, puis publiez-le quand votre équipe est prête.</p><Button className="mt-5" onClick={openCreate}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Préparer une offre</Button></CardContent></Card> : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {jobs.map((job) => (
          <Card key={job.id} className="relative overflow-hidden border-border/70 transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-lift motion-reduce:transition-none">
            <div className={`absolute inset-y-0 left-0 w-1 ${job.status === 'open' ? 'bg-primary' : job.status === 'draft' ? 'bg-terra' : 'bg-muted-foreground/40'}`} aria-hidden="true" />
            <CardHeader className="gap-4 pl-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><CardTitle className="text-xl">{job.title}</CardTitle><Badge variant={job.status === 'open' ? 'default' : 'secondary'}>{jobStatusLabels[job.status] ?? 'Statut indisponible'}</Badge></div><CardDescription className="mt-3 flex flex-wrap gap-x-4 gap-y-2"><span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-terra" aria-hidden="true" />{job.location || 'Lieu flexible'}</span><span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4 text-lagoon" aria-hidden="true" />{job.employmentType ? employmentLabel(job.employmentType) : 'Type non précisé'}</span>{job.closesAt ? <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" aria-hidden="true" />Avant le {new Intl.DateTimeFormat('fr-CI', { dateStyle: 'medium' }).format(new Date(job.closesAt))}</span> : null}</CardDescription></div>
                <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => openEdit(job)}><Edit3 className="mr-2 h-4 w-4" aria-hidden="true" />Modifier</Button>{job.status !== 'closed' ? <Button variant="ghost" size="sm" onClick={() => closeJob(job)}>Clôturer</Button> : null}</div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-start justify-between gap-4 pl-7 sm:flex-row sm:items-end"><p className="line-clamp-3 max-w-2xl text-sm leading-6 text-muted-foreground">{job.description}</p><Button className="w-full shrink-0 sm:w-auto" variant="secondary" asChild><Link href={`/dashboard/applicants?jobId=${encodeURIComponent(job.id)}`}><Users className="mr-2 h-4 w-4" aria-hidden="true" />{job.applicationCount ?? 0} candidature{(job.applicationCount ?? 0) > 1 ? 's' : ''}</Link></Button></CardContent>
          </Card>
        ))}
      </div>

      {hasMore ? <div className="flex justify-center"><Button variant="outline" disabled={loadingMore} onClick={() => void load(true)}>{loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}{loadingMore ? 'Chargement…' : 'Afficher plus d’offres'}</Button></div> : null}
    </div>
  );
}
