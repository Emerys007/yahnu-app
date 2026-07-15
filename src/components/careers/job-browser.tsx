'use client';

import { type ChangeEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, BriefcaseBusiness, Building2, CalendarClock, Loader2, MapPin, Search } from 'lucide-react';

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
import { employmentTypes, humanizeStatus, type Job } from '@/lib/careers';

type JobListResponse = { data: { jobs: Job[]; hasMore: boolean; nextOffset: number } };
type JobResponse = { data: { job: Job } };
const MAX_RESUME_SIZE_BYTES = 8 * 1024 * 1024;

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}

function ErrorNotice({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Unable to load opportunities</AlertTitle>
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <span>{message}</span>
        {retry ? <Button size="sm" variant="outline" onClick={retry}>Try again</Button> : null}
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
  const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
  if (!response.ok) throw new Error(payload?.error?.message || 'Your application could not be submitted.');
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
      setError('Choose a PDF resume that is 8 MB or smaller.');
      return;
    }
    if (file.type && file.type.toLowerCase() !== 'application/pdf' && file.type.toLowerCase() !== 'application/x-pdf') {
      event.target.value = '';
      setResume(null);
      setError('Upload your resume as a PDF.');
      return;
    }
    setResume(file);
  }

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      await submitApplication(job.id, coverLetter.trim(), resume);
      onApplied();
    } catch (caught) {
      setError(caught instanceof ApiClientError
        ? caught.message
        : caught instanceof Error && caught.message
          ? caught.message
          : 'Your application could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border bg-muted/25 p-4">
      <div className="space-y-1.5">
        <Label htmlFor={`cover-${job.id}`}>Cover letter <span className="text-muted-foreground">(optional)</span></Label>
        <Textarea
          id={`cover-${job.id}`}
          value={coverLetter}
          onChange={(event) => setCoverLetter(event.target.value)}
          maxLength={20_000}
          rows={5}
          placeholder="Tell the employer why this role is a good match."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`resume-${job.id}`}>Resume <span className="text-muted-foreground">(PDF, optional)</span></Label>
        <Input
          id={`resume-${job.id}`}
          type="file"
          accept="application/pdf,.pdf"
          disabled={submitting}
          aria-describedby={`resume-help-${job.id}`}
          onChange={chooseResume}
        />
        <p id={`resume-help-${job.id}`} className="text-xs text-muted-foreground">PDF only, up to 8 MB. It is stored privately and shared only with this employer for this application.</p>
        {resume ? <div className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-sm"><span className="min-w-0 truncate">{resume.name} · {Math.ceil(resume.size / 1024)} KB</span><Button type="button" variant="ghost" size="sm" disabled={submitting} onClick={() => setResume(null)}>Remove</Button></div> : null}
      </div>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      <Button onClick={submit} disabled={submitting}>
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Submit application
      </Button>
    </div>
  );
}

function JobCard({ job, dashboard }: { job: Job; dashboard: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const closingDate = formatDate(job.closesAt);

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="text-xl"><Link className="hover:text-primary" href={`/jobs/${encodeURIComponent(job.id)}`}>{job.title}</Link></CardTitle>
            <CardDescription className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" />{job.companyName}</span>
              {job.location ? <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{job.location}</span> : null}
            </CardDescription>
          </div>
          {job.employmentType ? <Badge variant="secondary">{humanizeStatus(job.employmentType)}</Badge> : null}
        </div>
        {closingDate ? <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" />Applications close {closingDate}</p> : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="line-clamp-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{job.description}</p>
        {applied ? <Alert><BriefcaseBusiness className="h-4 w-4" /><AlertTitle>Application submitted</AlertTitle><AlertDescription>Track it from your applications dashboard.</AlertDescription></Alert> : null}
        {applying && !applied ? <ApplicationForm job={job} onApplied={() => { setApplied(true); setApplying(false); }} /> : null}
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-3 border-t bg-muted/15 pt-5">
        <Button variant="ghost" asChild><Link href={`/jobs/${encodeURIComponent(job.id)}`}>View details<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        {!authLoading && user?.role === 'graduate' && !applied ? (
          <Button onClick={() => setApplying((value) => !value)} variant={applying ? 'outline' : 'default'}>{applying ? 'Cancel' : 'Apply now'}</Button>
        ) : null}
        {!authLoading && !user && !dashboard ? <Button asChild><Link href={`/login?next=${encodeURIComponent(`/jobs/${job.id}`)}`}>Sign in to apply</Link></Button> : null}
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
        if (!controller.signal.aborted) setError(caught instanceof ApiClientError ? caught.message : 'The jobs list is temporarily unavailable.');
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
      setError(caught instanceof ApiClientError ? caught.message : 'More jobs could not be loaded.');
    } finally {
      setLoadingMore(false);
    }
  }, [employmentType, location, nextOffset, q]);

  return (
    <section className={dashboard ? 'space-y-6' : 'container mx-auto space-y-8 py-10 sm:py-14'}>
      <div className={dashboard ? 'space-y-2' : 'mx-auto max-w-3xl text-center'}>
        <Badge variant="secondary" className="mb-3">Verified opportunities</Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Find your next opportunity</h1>
        <p className="mt-2 text-muted-foreground">Only open, unexpired roles from Yahnu employers are shown.</p>
      </div>
      <Card className="border-border/70">
        <CardContent className="grid gap-4 pt-6 md:grid-cols-[1fr_0.7fr_0.55fr]">
          <div className="space-y-2"><Label htmlFor="job-search">Keywords</Label><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="job-search" className="pl-9" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Title, employer, or skill" /></div></div>
          <div className="space-y-2"><Label htmlFor="job-location">Location</Label><Input id="job-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City or remote" /></div>
          <div className="space-y-2"><Label>Employment</Label><Select value={employmentType} onValueChange={setEmploymentType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem>{employmentTypes.map((type) => <SelectItem key={type} value={type}>{humanizeStatus(type)}</SelectItem>)}</SelectContent></Select></div>
        </CardContent>
      </Card>
      {error ? <ErrorNotice message={error} retry={() => setReloadKey((value) => value + 1)} /> : null}
      {loading ? <div className="grid min-h-52 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" aria-label="Loading jobs" /></div> : null}
      {!loading && jobs.length === 0 && !error ? <Card><CardContent className="py-14 text-center"><BriefcaseBusiness className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-4 font-semibold">No matching jobs</h2><p className="mt-1 text-sm text-muted-foreground">Try a broader keyword or location.</p></CardContent></Card> : null}
      {!loading && jobs.length ? <div className="grid gap-5 lg:grid-cols-2">{jobs.map((job) => <JobCard key={job.id} job={job} dashboard={dashboard} />)}</div> : null}
      {hasMore ? <div className="flex justify-center"><Button variant="outline" onClick={loadMore} disabled={loadingMore}>{loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Load more</Button></div> : null}
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
      .catch((caught) => { if (!controller.signal.aborted) setError(caught instanceof ApiClientError ? caught.message : 'This job could not be loaded.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, reloadKey]);

  if (loading) return <div className="grid min-h-[55vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error || !job) return <div className="container mx-auto py-16"><ErrorNotice message={error || 'This job is unavailable.'} retry={() => setReloadKey((value) => value + 1)} /></div>;
  const closingDate = formatDate(job.closesAt);

  return (
    <div>
      <section className="border-b bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto py-10 sm:py-14">
          <Button variant="ghost" asChild className="mb-6"><Link href="/jobs">← Back to jobs</Link></Button>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl space-y-4"><Badge>{job.employmentType ? humanizeStatus(job.employmentType) : 'Opportunity'}</Badge><h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{job.title}</h1><p className="flex flex-wrap gap-4 text-lg text-muted-foreground"><span className="inline-flex items-center gap-2"><Building2 className="h-5 w-5" />{job.companyName}</span>{job.location ? <span className="inline-flex items-center gap-2"><MapPin className="h-5 w-5" />{job.location}</span> : null}</p></div>
            {closingDate ? <p className="rounded-full border bg-background px-4 py-2 text-sm">Closes {closingDate}</p> : null}
          </div>
        </div>
      </section>
      <section className="container mx-auto grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <article className="max-w-3xl"><h2 className="text-2xl font-semibold">About the role</h2><p className="mt-5 whitespace-pre-line text-base leading-8 text-muted-foreground">{job.description}</p></article>
        <aside className="h-fit space-y-4 rounded-2xl border bg-card p-6 shadow-sm lg:sticky lg:top-24">
          <h2 className="font-semibold">Ready to apply?</h2>
          {applied ? <Alert><BriefcaseBusiness className="h-4 w-4" /><AlertTitle>Application submitted</AlertTitle><AlertDescription>Track it from your dashboard.</AlertDescription></Alert> : null}
          {!applied && applying ? <ApplicationForm job={job} onApplied={() => { setApplied(true); setApplying(false); }} /> : null}
          {!authLoading && user?.role === 'graduate' && !applied && !applying ? <Button className="w-full" onClick={() => setApplying(true)}>Apply on Yahnu</Button> : null}
          {!authLoading && !user ? <Button className="w-full" asChild><Link href={`/login?next=${encodeURIComponent(`/jobs/${job.id}`)}`}>Sign in to apply</Link></Button> : null}
          {!authLoading && user && user.role !== 'graduate' ? <p className="text-sm text-muted-foreground">Applications are available to graduate accounts.</p> : null}
          {job.applicationUrl ? <Button className="w-full" variant="outline" asChild><a href={job.applicationUrl} target="_blank" rel="noopener noreferrer">Employer website<ArrowRight className="ml-2 h-4 w-4" /></a></Button> : null}
        </aside>
      </section>
    </div>
  );
}
