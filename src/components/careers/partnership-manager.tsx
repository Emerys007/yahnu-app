'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Building2, Check, Handshake, Loader2, Search, X } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { humanizeStatus, type Partnership, type PartnershipDirectoryEntry, type PartnershipStatus } from '@/lib/careers';

type ListResponse = { data: { partnerships: Partnership[]; hasMore: boolean; nextOffset: number } };
type DirectoryResponse = { data: { organizations: PartnershipDirectoryEntry[]; hasMore: boolean; nextOffset: number } };
type PartnershipResponse = { data: { partnership: Partnership } };

function counterpart(partnership: Partnership) {
  return partnership.direction === 'incoming' ? partnership.requester : partnership.partner;
}

export function PartnershipManager() {
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [organizations, setOrganizations] = useState<PartnershipDirectoryEntry[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [directoryLoading, setDirectoryLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [directoryLoadingMore, setDirectoryLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [directoryHasMore, setDirectoryHasMore] = useState(false);
  const [directoryNextOffset, setDirectoryNextOffset] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadPartnerships = useCallback(async (append = false) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError('');
    try {
      const response = await apiFetch<ListResponse>(`/api/partnerships?limit=20&offset=${append ? nextOffset : 0}`);
      setPartnerships((current) => append ? [...current, ...response.data.partnerships] : response.data.partnerships);
      setHasMore(response.data.hasMore);
      setNextOffset(response.data.nextOffset);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'Partnerships could not be loaded.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [nextOffset]);

  const loadDirectory = useCallback(async (append = false) => {
    append ? setDirectoryLoadingMore(true) : setDirectoryLoading(true);
    setError('');
    const params = new URLSearchParams({ q, limit: '20', offset: append ? String(directoryNextOffset) : '0' });
    try {
      const response = await apiFetch<DirectoryResponse>(`/api/partnerships/directory?${params}`);
      setOrganizations((current) => append ? [...current, ...response.data.organizations] : response.data.organizations);
      setDirectoryHasMore(response.data.hasMore);
      setDirectoryNextOffset(response.data.nextOffset);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'The organization directory could not be loaded.');
    } finally {
      setDirectoryLoading(false);
      setDirectoryLoadingMore(false);
    }
  }, [directoryNextOffset, q]);

  useEffect(() => { void loadPartnerships(false); }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void loadDirectory(false), 200);
    return () => window.clearTimeout(timer);
  }, [q]);

  async function requestPartnership(organization: PartnershipDirectoryEntry) {
    setUpdatingId(organization.id);
    setError('');
    try {
      const response = await apiFetch<PartnershipResponse>('/api/partnerships', {
        method: 'POST', body: JSON.stringify({ partnerId: organization.id }),
      });
      setPartnerships((current) => [response.data.partnership, ...current]);
      setOrganizations((current) => current.filter((item) => item.id !== organization.id));
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'The partnership request could not be sent.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function updatePartnership(partnership: Partnership, status: Extract<PartnershipStatus, 'accepted' | 'declined' | 'cancelled'>) {
    setUpdatingId(partnership.id);
    setError('');
    try {
      const response = await apiFetch<PartnershipResponse>(`/api/partnerships/${encodeURIComponent(partnership.id)}`, {
        method: 'PATCH', body: JSON.stringify({ status }),
      });
      setPartnerships((current) => current.map((item) => item.id === partnership.id ? response.data.partnership : item));
      if (status !== 'accepted') void loadDirectory(false);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : 'The partnership request could not be updated.');
    } finally {
      setUpdatingId(null);
    }
  }

  const incoming = partnerships.filter((item) => item.direction === 'incoming');
  const outgoing = partnerships.filter((item) => item.direction === 'outgoing');
  const active = partnerships.filter((item) => item.status === 'accepted');

  function RequestList({ items, kind }: { items: Partnership[]; kind: 'incoming' | 'outgoing' | 'active' }) {
    if (items.length === 0) return <div className="py-12 text-center"><Handshake className="mx-auto h-8 w-8 text-muted-foreground" /><h3 className="mt-4 font-semibold">Nothing here yet</h3><p className="mt-1 text-sm text-muted-foreground">Partnership activity will appear here.</p></div>;
    return (
      <div className="divide-y">
        {items.map((partnership) => {
          const organization = counterpart(partnership);
          return (
            <div key={partnership.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-5 w-5" /></div><div><p className="font-medium">{organization?.organizationName || organization?.name || 'Migrated organization'}</p><p className="text-sm text-muted-foreground">{organization?.role ? humanizeStatus(organization.role) : 'Organization'} · {new Date(partnership.createdAt).toLocaleDateString()}</p></div></div>
              <div className="flex items-center gap-2"><Badge variant={partnership.status === 'accepted' ? 'default' : 'secondary'}>{humanizeStatus(partnership.status)}</Badge>{kind === 'incoming' && partnership.status === 'pending' ? <><Button size="sm" variant="outline" disabled={updatingId === partnership.id} onClick={() => void updatePartnership(partnership, 'declined')}><X className="mr-1 h-4 w-4" />Decline</Button><Button size="sm" disabled={updatingId === partnership.id} onClick={() => void updatePartnership(partnership, 'accepted')}>{updatingId === partnership.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}Accept</Button></> : null}{kind === 'outgoing' && partnership.status === 'pending' ? <Button size="sm" variant="ghost" disabled={updatingId === partnership.id} onClick={() => void updatePartnership(partnership, 'cancelled')}>Cancel request</Button> : null}</div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Partnerships</h1><p className="mt-1 text-muted-foreground">Build trusted company–school relationships. Only the two organizations can act on a request.</p></div>
      {error ? <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Unable to complete the request</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
      <Tabs defaultValue="requests">
        <TabsList><TabsTrigger value="requests">Requests</TabsTrigger><TabsTrigger value="active">Active ({active.length})</TabsTrigger><TabsTrigger value="discover">Discover</TabsTrigger></TabsList>
        <TabsContent value="requests" className="mt-5 grid gap-5 xl:grid-cols-2">
          <Card><CardHeader><CardTitle>Incoming</CardTitle><CardDescription>Requests your organization can accept or decline.</CardDescription></CardHeader><CardContent>{loading ? <div className="grid min-h-36 place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : <RequestList items={incoming} kind="incoming" />}</CardContent></Card>
          <Card><CardHeader><CardTitle>Outgoing</CardTitle><CardDescription>Requests sent by your organization.</CardDescription></CardHeader><CardContent>{loading ? <div className="grid min-h-36 place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : <RequestList items={outgoing} kind="outgoing" />}</CardContent></Card>
        </TabsContent>
        <TabsContent value="active" className="mt-5"><Card><CardHeader><CardTitle>Active partnerships</CardTitle><CardDescription>Accepted relationships across Yahnu.</CardDescription></CardHeader><CardContent><RequestList items={active} kind="active" /></CardContent></Card></TabsContent>
        <TabsContent value="discover" className="mt-5"><Card><CardHeader><CardTitle>Discover organizations</CardTitle><CardDescription>Organizations with pending or active relationships are automatically excluded.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search organizations" /></div>{directoryLoading ? <div className="grid min-h-36 place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : null}{!directoryLoading && organizations.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No available organizations match this search.</p> : null}<div className="divide-y">{organizations.map((organization) => <div key={organization.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-medium">{organization.organizationName}</p><p className="text-sm text-muted-foreground">{humanizeStatus(organization.role)}{organization.industry ? ` · ${organization.industry}` : ''}</p></div><Button size="sm" disabled={updatingId === organization.id} onClick={() => void requestPartnership(organization)}>{updatingId === organization.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Handshake className="mr-2 h-4 w-4" />}Request partnership</Button></div>)}</div>{directoryHasMore ? <div className="flex justify-center"><Button variant="outline" disabled={directoryLoadingMore} onClick={() => void loadDirectory(true)}>{directoryLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Load more organizations</Button></div> : null}</CardContent></Card></TabsContent>
      </Tabs>
      {hasMore ? <div className="flex justify-center"><Button variant="outline" disabled={loadingMore} onClick={() => void loadPartnerships(true)}>{loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Load more partnership history</Button></div> : null}
    </div>
  );
}
