'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  Check,
  GraduationCap,
  Handshake,
  Loader2,
  Search,
  Send,
  X,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiFetch, ApiClientError } from '@/lib/api-client';
import { type Partnership, type PartnershipDirectoryEntry, type PartnershipStatus } from '@/lib/careers';

type ListResponse = { data: { partnerships: Partnership[]; hasMore: boolean; nextOffset: number } };
type DirectoryResponse = { data: { organizations: PartnershipDirectoryEntry[]; hasMore: boolean; nextOffset: number } };
type PartnershipResponse = { data: { partnership: Partnership } };

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  accepted: 'Actif',
  declined: 'Refusé',
  cancelled: 'Annulé',
};

const roleLabels: Record<string, string> = {
  company: 'Entreprise',
  school: 'Établissement',
};

function statusLabel(value: string) {
  return statusLabels[value] ?? 'Statut à vérifier';
}

function roleLabel(value: string) {
  return roleLabels[value] ?? 'Organisation';
}

function partnershipError(caught: unknown, fallback: string) {
  if (!(caught instanceof ApiClientError)) return fallback;
  const messages: Record<string, string> = {
    authentication_required: 'Connectez-vous pour continuer.',
    forbidden: 'Votre compte ne permet pas d’effectuer cette action.',
    invalid_partner: 'Choisissez une autre organisation.',
    invalid_partnership_action: 'Cette action n’est pas autorisée pour votre organisation.',
    partner_not_found: 'Cette organisation n’est plus disponible.',
    partnership_exists: 'Une demande ou un partenariat actif existe déjà avec cette organisation.',
    partnership_finalized: 'Cette demande a déjà reçu une réponse.',
    partnership_not_found: 'Cette demande de partenariat est introuvable.',
    rate_limited: 'Trop de tentatives. Patientez un moment avant de réessayer.',
    request_failed: fallback,
  };
  return messages[caught.code] ?? fallback;
}

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

  const fetchPartnerships = useCallback(async (append: boolean, offset: number) => {
    append ? setLoadingMore(true) : setLoading(true);
    setError('');
    try {
      const response = await apiFetch<ListResponse>(`/api/partnerships?limit=20&offset=${offset}`);
      setPartnerships((current) => append ? [...current, ...response.data.partnerships] : response.data.partnerships);
      setHasMore(response.data.hasMore);
      setNextOffset(response.data.nextOffset);
    } catch (caught) {
      setError(partnershipError(caught, 'Vos partenariats n’ont pas pu être chargés.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchDirectory = useCallback(async (append: boolean, offset: number) => {
    append ? setDirectoryLoadingMore(true) : setDirectoryLoading(true);
    setError('');
    const params = new URLSearchParams({ q, limit: '20', offset: String(offset) });
    try {
      const response = await apiFetch<DirectoryResponse>(`/api/partnerships/directory?${params}`);
      setOrganizations((current) => append ? [...current, ...response.data.organizations] : response.data.organizations);
      setDirectoryHasMore(response.data.hasMore);
      setDirectoryNextOffset(response.data.nextOffset);
    } catch (caught) {
      setError(partnershipError(caught, 'L’annuaire des organisations n’a pas pu être chargé.'));
    } finally {
      setDirectoryLoading(false);
      setDirectoryLoadingMore(false);
    }
  }, [q]);

  useEffect(() => { void fetchPartnerships(false, 0); }, [fetchPartnerships]);
  useEffect(() => {
    const timer = window.setTimeout(() => void fetchDirectory(false, 0), 200);
    return () => window.clearTimeout(timer);
  }, [fetchDirectory]);

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
      setError(partnershipError(caught, 'La demande de partenariat n’a pas pu être envoyée.'));
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
      if (status !== 'accepted') void fetchDirectory(false, 0);
    } catch (caught) {
      setError(partnershipError(caught, 'La demande de partenariat n’a pas pu être mise à jour.'));
    } finally {
      setUpdatingId(null);
    }
  }

  const incoming = partnerships.filter((item) => item.direction === 'incoming');
  const outgoing = partnerships.filter((item) => item.direction === 'outgoing');
  const active = partnerships.filter((item) => item.status === 'accepted');

  function RequestList({ items, kind }: { items: Partnership[]; kind: 'incoming' | 'outgoing' | 'active' }) {
    const emptyCopy = kind === 'incoming'
      ? 'Les nouvelles demandes reçues apparaîtront ici.'
      : kind === 'outgoing'
        ? 'Les demandes envoyées apparaîtront ici.'
        : 'Découvrez une organisation pour créer votre premier partenariat.';

    if (items.length === 0) return <div className="py-12 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary"><Handshake className="h-7 w-7" aria-hidden="true" /></div><h3 className="mt-4 font-display text-lg font-semibold">Rien à signaler pour le moment</h3><p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{emptyCopy}</p></div>;

    return (
      <div className="divide-y">
        {items.map((partnership) => {
          const organization = counterpart(partnership);
          const organizationRole = organization?.role;
          return (
            <div key={partnership.id} className="flex flex-col items-start justify-between gap-4 py-5 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${organizationRole === 'school' ? 'bg-terra/10 text-terra' : 'bg-lagoon/10 text-lagoon'}`}>
                  {organizationRole === 'school' ? <GraduationCap className="h-5 w-5" aria-hidden="true" /> : <Building2 className="h-5 w-5" aria-hidden="true" />}
                </div>
                <div className="min-w-0"><p className="truncate font-semibold">{organization?.organizationName || organization?.name || 'Organisation issue de la migration'}</p><p className="text-sm text-muted-foreground">{organizationRole ? roleLabel(organizationRole) : 'Organisation'} · {new Intl.DateTimeFormat('fr-CI', { dateStyle: 'medium' }).format(new Date(partnership.createdAt))}</p></div>
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                <Badge variant={partnership.status === 'accepted' ? 'default' : partnership.status === 'pending' ? 'secondary' : 'outline'}>{statusLabel(partnership.status)}</Badge>
                {kind === 'incoming' && partnership.status === 'pending' ? <><Button size="sm" variant="outline" disabled={updatingId === partnership.id} onClick={() => void updatePartnership(partnership, 'declined')}><X className="mr-1 h-4 w-4" aria-hidden="true" />Refuser</Button><Button size="sm" disabled={updatingId === partnership.id} onClick={() => void updatePartnership(partnership, 'accepted')}>{updatingId === partnership.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Check className="mr-1 h-4 w-4" aria-hidden="true" />}Accepter</Button></> : null}
                {kind === 'outgoing' && partnership.status === 'pending' ? <Button size="sm" variant="ghost" disabled={updatingId === partnership.id} onClick={() => void updatePartnership(partnership, 'cancelled')}>Annuler la demande</Button> : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border bg-card p-5 shadow-soft sm:p-7">
        <div className="ci-pattern pointer-events-none absolute inset-0 opacity-45" aria-hidden="true" />
        <div className="relative">
          <p className="section-kicker">Écosystème Yahnu</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Partenariats école–entreprise</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">Créez des liens de confiance entre les établissements ivoiriens et les employeurs qui veulent former, accueillir et recruter la nouvelle génération.</p>
        </div>
      </section>

      {error ? <Alert variant="destructive"><AlertCircle className="h-4 w-4" aria-hidden="true" /><AlertTitle>La demande n’a pas abouti</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}

      <Tabs defaultValue="requests">
        <div className="overflow-x-auto pb-1"><TabsList className="min-w-max"><TabsTrigger value="requests">Demandes</TabsTrigger><TabsTrigger value="active">Actifs ({active.length})</TabsTrigger><TabsTrigger value="discover">Découvrir</TabsTrigger></TabsList></div>
        <TabsContent value="requests" className="mt-5 grid gap-5 xl:grid-cols-2">
          <Card><CardHeader><CardTitle>Demandes reçues</CardTitle><CardDescription>Votre organisation peut les accepter ou les refuser.</CardDescription></CardHeader><CardContent>{loading ? <div className="grid min-h-36 place-items-center" role="status"><Loader2 className="h-6 w-6 animate-spin motion-reduce:animate-none" aria-hidden="true" /><span className="sr-only">Chargement des demandes reçues…</span></div> : <RequestList items={incoming} kind="incoming" />}</CardContent></Card>
          <Card><CardHeader><CardTitle>Demandes envoyées</CardTitle><CardDescription>Suivez les invitations proposées par votre organisation.</CardDescription></CardHeader><CardContent>{loading ? <div className="grid min-h-36 place-items-center" role="status"><Loader2 className="h-6 w-6 animate-spin motion-reduce:animate-none" aria-hidden="true" /><span className="sr-only">Chargement des demandes envoyées…</span></div> : <RequestList items={outgoing} kind="outgoing" />}</CardContent></Card>
        </TabsContent>

        <TabsContent value="active" className="mt-5"><Card><CardHeader><CardTitle>Partenariats actifs</CardTitle><CardDescription>Les relations déjà acceptées dans le réseau Yahnu.</CardDescription></CardHeader><CardContent><RequestList items={active} kind="active" /></CardContent></Card></TabsContent>

        <TabsContent value="discover" className="mt-5">
          <Card className="overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-terra via-soleil to-primary" aria-hidden="true" />
            <CardHeader className="pt-7"><CardTitle>Découvrir des organisations</CardTitle><CardDescription>Les organisations déjà invitées ou partenaires sont automatiquement retirées de cette liste.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <div className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" aria-hidden="true" /><Input className="pl-9" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Ex. université, banque, agro-industrie" aria-label="Rechercher une organisation" /></div>
              {directoryLoading ? <div className="grid min-h-36 place-items-center" role="status"><Loader2 className="h-6 w-6 animate-spin motion-reduce:animate-none" aria-hidden="true" /><span className="sr-only">Chargement des organisations…</span></div> : null}
              {!directoryLoading && organizations.length === 0 ? <div className="py-10 text-center"><Handshake className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" /><p className="mt-3 text-sm text-muted-foreground">Aucune organisation disponible ne correspond à cette recherche.</p></div> : null}
              <div className="grid gap-3 lg:grid-cols-2">
                {organizations.map((organization) => (
                  <div key={organization.id} className="flex flex-col items-start justify-between gap-4 rounded-2xl border bg-background p-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 items-center gap-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${organization.role === 'school' ? 'bg-terra/10 text-terra' : 'bg-lagoon/10 text-lagoon'}`}>{organization.role === 'school' ? <GraduationCap className="h-5 w-5" aria-hidden="true" /> : <Building2 className="h-5 w-5" aria-hidden="true" />}</div><div className="min-w-0"><p className="truncate font-semibold">{organization.organizationName}</p><p className="text-sm text-muted-foreground">{roleLabel(organization.role)}{organization.industry ? ` · ${organization.industry}` : ''}</p></div></div>
                    <Button className="w-full shrink-0 sm:w-auto" size="sm" disabled={updatingId === organization.id} onClick={() => void requestPartnership(organization)}>{updatingId === organization.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Send className="mr-2 h-4 w-4" aria-hidden="true" />}{updatingId === organization.id ? 'Envoi…' : 'Proposer un partenariat'}</Button>
                  </div>
                ))}
              </div>
              {directoryHasMore ? <div className="flex justify-center"><Button variant="outline" disabled={directoryLoadingMore} onClick={() => void fetchDirectory(true, directoryNextOffset)}>{directoryLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}{directoryLoadingMore ? 'Chargement…' : 'Afficher plus d’organisations'}</Button></div> : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {hasMore ? <div className="flex justify-center"><Button variant="outline" disabled={loadingMore} onClick={() => void fetchPartnerships(true, nextOffset)}>{loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}{loadingMore ? 'Chargement…' : 'Afficher l’historique suivant'}</Button></div> : null}
    </div>
  );
}
