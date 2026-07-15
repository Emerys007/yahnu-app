'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, FileText, Loader2, Search, UserRound } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { humanizeStatus, type ApplicationStatus, type JobApplication } from '@/lib/careers';

type ListResponse = { data: { applications: JobApplication[]; hasMore: boolean; nextOffset: number } };
type UpdateResponse = { data: { application: JobApplication } };
const companyStatuses: ApplicationStatus[] = ['submitted', 'reviewing', 'shortlisted', 'interviewing', 'accepted', 'rejected'];

function ApplicationError({ message }: { message: string }) {
  return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Unable to complete the request</AlertTitle><AlertDescription>{message}</AlertDescription></Alert>;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
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

  const load = useCallback(async (append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError('');
    const params = new URLSearchParams({ status, limit: '20', offset: append ? String(nextOffset) : '0' });
    try {
      const response = await apiFetch<ListResponse>(`/api/applications?${params}`);
      setApplications((current) => append ? [...current, ...response.data.applications] : response.data.applications);
      setHasMore(response.data.hasMore);
      setNextOffset(response.data.nextOffset);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Your applications could not be loaded.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [nextOffset, status]);

  useEffect(() => { void load(false); }, [status]);

  async function withdraw(application: JobApplication) {
    if (!window.confirm(`Withdraw your application for “${application.job?.title || 'this job'}”?`)) return;
    setUpdatingId(application.id);
    setError('');
    try {
      const response = await apiFetch<UpdateResponse>(`/api/applications/${encodeURIComponent(application.id)}`, {
        method: 'PATCH', body: JSON.stringify({ status: 'withdrawn' }),
      });
      setApplications((current) => current.map((item) => item.id === application.id ? response.data.application : item));
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'The application could not be withdrawn.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">My applications</h1><p className="mt-1 text-muted-foreground">Track every application submitted through Yahnu.</p></div>
      <div className="flex max-w-xs items-center gap-3"><Label className="shrink-0">Status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{[...companyStatuses, 'withdrawn'].map((value) => <SelectItem key={value} value={value}>{humanizeStatus(value)}</SelectItem>)}</SelectContent></Select></div>
      {error ? <ApplicationError message={error} /> : null}
      {loading ? <div className="grid min-h-48 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : null}
      {!loading && applications.length === 0 ? <Card><CardContent className="py-14 text-center"><FileText className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-4 font-semibold">No applications found</h2><p className="mt-1 text-sm text-muted-foreground">Explore open roles and apply when one fits.</p><Button className="mt-5" asChild><Link href="/dashboard/jobs">Browse jobs</Link></Button></CardContent></Card> : null}
      <div className="space-y-4">
        {applications.map((application) => (
          <Card key={application.id}>
            <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle>{application.job?.title || 'Unavailable job'}</CardTitle><CardDescription className="mt-2">{application.job?.companyName || 'Employer unavailable'} · Submitted {dateLabel(application.submittedAt)}</CardDescription></div><Badge variant={application.status === 'accepted' ? 'default' : 'secondary'}>{humanizeStatus(application.status)}</Badge></CardHeader>
            <CardContent className="space-y-4">{application.coverLetter ? <p className="line-clamp-3 whitespace-pre-line text-sm text-muted-foreground">{application.coverLetter}</p> : <p className="text-sm text-muted-foreground">No cover letter was included.</p>}<div className="flex flex-wrap gap-3">{application.job ? <Button variant="outline" size="sm" asChild><Link href={`/jobs/${encodeURIComponent(application.job.id)}`}>View job</Link></Button> : null}{application.resumeUrl ? <Button variant="outline" size="sm" asChild><a href={application.resumeUrl}>Private resume</a></Button> : null}{!['accepted', 'rejected', 'withdrawn'].includes(application.status) ? <Button variant="ghost" size="sm" disabled={updatingId === application.id} onClick={() => void withdraw(application)}>{updatingId === application.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Withdraw</Button> : null}</div></CardContent>
          </Card>
        ))}
      </div>
      {hasMore ? <div className="flex justify-center"><Button variant="outline" disabled={loadingMore} onClick={() => void load(true)}>{loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Load more</Button></div> : null}
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

  const load = useCallback(async (append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError('');
    const params = new URLSearchParams({ jobId, q, status, limit: '20', offset: append ? String(nextOffset) : '0' });
    try {
      const response = await apiFetch<ListResponse>(`/api/applications?${params}`);
      setApplications((current) => append ? [...current, ...response.data.applications] : response.data.applications);
      setHasMore(response.data.hasMore);
      setNextOffset(response.data.nextOffset);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Applicants could not be loaded.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [jobId, nextOffset, q, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(false), 200);
    return () => window.clearTimeout(timer);
  }, [jobId, q, status]);

  async function updateStatus(application: JobApplication, nextStatus: string) {
    setUpdatingId(application.id);
    setError('');
    try {
      const response = await apiFetch<UpdateResponse>(`/api/applications/${encodeURIComponent(application.id)}`, {
        method: 'PATCH', body: JSON.stringify({ status: nextStatus }),
      });
      setApplications((current) => current.map((item) => item.id === application.id ? response.data.application : item));
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'The applicant status could not be updated.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Applicants</h1><p className="mt-1 text-muted-foreground">Review candidates only for jobs owned by your company.</p></div>
      <Card><CardContent className="grid gap-4 pt-6 md:grid-cols-3"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Applicant or job" /></div><Input value={jobId} onChange={(event) => setJobId(event.target.value)} placeholder="Filter by exact job ID" /><Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{companyStatuses.map((value) => <SelectItem key={value} value={value}>{humanizeStatus(value)}</SelectItem>)}</SelectContent></Select></CardContent></Card>
      {error ? <ApplicationError message={error} /> : null}
      {loading ? <div className="grid min-h-48 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div> : null}
      {!loading && applications.length === 0 ? <Card><CardContent className="py-14 text-center"><UserRound className="mx-auto h-8 w-8 text-muted-foreground" /><h2 className="mt-4 font-semibold">No applicants found</h2><p className="mt-1 text-sm text-muted-foreground">New applications will appear here.</p></CardContent></Card> : null}
      <div className="space-y-4">
        {applications.map((application) => (
          <Card key={application.id}>
            <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle>{application.applicant?.name || 'Migrated applicant'}</CardTitle><CardDescription className="mt-2">{application.applicant?.email || 'Contact unavailable'} · {application.job?.title || 'Unavailable job'} · {dateLabel(application.submittedAt)}</CardDescription></div><Badge variant="secondary">{humanizeStatus(application.status)}</Badge></CardHeader>
            <CardContent className="space-y-4"><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cover letter</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{application.coverLetter || 'No cover letter supplied.'}</p></div><div className="flex flex-wrap items-end gap-3"><div className="w-52 space-y-1.5"><Label>Status</Label><Select value={companyStatuses.includes(application.status as ApplicationStatus) ? application.status : 'submitted'} disabled={updatingId === application.id || application.status === 'withdrawn'} onValueChange={(value) => void updateStatus(application, value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{companyStatuses.map((value) => <SelectItem key={value} value={value}>{humanizeStatus(value)}</SelectItem>)}</SelectContent></Select></div>{updatingId === application.id ? <Loader2 className="mb-2 h-4 w-4 animate-spin" /> : null}{application.resumeUrl ? <Button variant="outline" asChild><a href={application.resumeUrl}><FileText className="mr-2 h-4 w-4" />View private resume</a></Button> : null}</div></CardContent>
          </Card>
        ))}
      </div>
      {hasMore ? <div className="flex justify-center"><Button variant="outline" disabled={loadingMore} onClick={() => void load(true)}>{loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Load more</Button></div> : null}
    </div>
  );
}
