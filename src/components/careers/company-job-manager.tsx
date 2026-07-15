'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { AlertCircle, BriefcaseBusiness, Edit3, Loader2, Plus, Search, Users, X } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { employmentTypes, humanizeStatus, type Job } from '@/lib/careers';

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
  title: '', location: '', employmentType: 'full_time', description: '',
  status: 'draft', applicationUrl: '', closesAt: '',
};

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
      setError(caught instanceof ApiClientError ? caught.message : 'Your job postings could not be loaded.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [nextOffset, q, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(false), 200);
    return () => window.clearTimeout(timer);
  }, [q, status]);

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

  async function save(event: FormEvent) {
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
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'The job could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function closeJob(job: Job) {
    if (!window.confirm(`Close “${job.title}”? The posting will remain in your history.`)) return;
    setError('');
    try {
      await apiFetch(`/api/jobs/${encodeURIComponent(job.id)}`, { method: 'DELETE' });
      setJobs((current) => current.map((item) => item.id === job.id ? { ...item, status: 'closed' } : item));
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'The job could not be closed.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight">Job postings</h1><p className="mt-1 text-muted-foreground">Publish roles, preserve your history, and review applicants.</p></div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />New job</Button>
      </div>
      {error ? <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Action needed</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
      {showForm ? (
        <Card>
          <CardHeader className="flex-row items-start justify-between"><div><CardTitle>{editingId ? 'Edit job' : 'Create a job'}</CardTitle><CardDescription>Only open, unexpired jobs appear publicly.</CardDescription></div><Button variant="ghost" size="icon" onClick={() => setShowForm(false)} aria-label="Close form"><X className="h-4 w-4" /></Button></CardHeader>
          <CardContent>
            <form className="grid gap-5 md:grid-cols-2" onSubmit={save}>
              <div className="space-y-2 md:col-span-2"><Label htmlFor="job-title">Title</Label><Input id="job-title" required minLength={3} maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="job-location">Location</Label><Input id="job-location" maxLength={200} value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></div>
              <div className="space-y-2"><Label>Employment type</Label><Select value={form.employmentType} onValueChange={(value) => setForm({ ...form, employmentType: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{employmentTypes.map((type) => <SelectItem key={type} value={type}>{humanizeStatus(type)}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Status</Label><Select value={form.status} onValueChange={(value: FormState['status']) => setForm({ ...form, status: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="open">Open</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="job-closes">Closing date</Label><Input id="job-closes" type="date" value={form.closesAt} onChange={(event) => setForm({ ...form, closesAt: event.target.value })} /></div>
              <div className="space-y-2 md:col-span-2"><Label htmlFor="application-url">External application URL <span className="text-muted-foreground">(optional)</span></Label><Input id="application-url" type="url" maxLength={2048} value={form.applicationUrl} onChange={(event) => setForm({ ...form, applicationUrl: event.target.value })} placeholder="https://…" /></div>
              <div className="space-y-2 md:col-span-2"><Label htmlFor="job-description">Description</Label><Textarea id="job-description" required minLength={20} maxLength={100000} rows={10} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
              <div className="md:col-span-2 flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{editingId ? 'Save changes' : 'Create job'}</Button></div>
            </form>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-[1fr_12rem]">
          <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search your postings" /></div>
          <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="open">Open</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent></Select>
        </CardContent>
      </Card>
      {loading ? <div className="grid min-h-48 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : null}
      {!loading && jobs.length === 0 ? <Card><CardContent className="py-14 text-center"><BriefcaseBusiness className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-4 font-semibold">No job postings yet</h2><p className="mt-1 text-sm text-muted-foreground">Create a draft when you are ready to recruit.</p></CardContent></Card> : null}
      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div><div className="flex flex-wrap items-center gap-2"><CardTitle className="text-xl">{job.title}</CardTitle><Badge variant={job.status === 'open' ? 'default' : 'secondary'}>{humanizeStatus(job.status)}</Badge></div><CardDescription className="mt-2">{job.location || 'Location flexible'} · {job.employmentType ? humanizeStatus(job.employmentType) : 'Type not specified'}</CardDescription></div>
              <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => openEdit(job)}><Edit3 className="mr-2 h-4 w-4" />Edit</Button>{job.status !== 'closed' ? <Button variant="outline" size="sm" onClick={() => closeJob(job)}>Close</Button> : null}</div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-4"><p className="line-clamp-2 max-w-2xl text-sm text-muted-foreground">{job.description}</p><Button variant="secondary" asChild><Link href={`/dashboard/applicants?jobId=${encodeURIComponent(job.id)}`}><Users className="mr-2 h-4 w-4" />{job.applicationCount ?? 0} applicants</Link></Button></CardContent>
          </Card>
        ))}
      </div>
      {hasMore ? <div className="flex justify-center"><Button variant="outline" disabled={loadingMore} onClick={() => void load(true)}>{loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Load more</Button></div> : null}
    </div>
  );
}
