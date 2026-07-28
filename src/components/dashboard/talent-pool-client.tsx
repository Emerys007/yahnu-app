"use client";

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundSearch,
} from 'lucide-react';

import { WorkspaceFrame } from '@/components/dashboard/workspace-frame';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api-client';
import { availabilityOptions, type TalentCard } from '@/lib/role-workspaces';
import { cn } from '@/lib/utils';

const availabilityLabels: Record<string, string> = {
  immediate: 'Disponible maintenant',
  one_month: 'Sous un mois',
  three_months: 'Sous trois mois',
  exploring: 'À l’écoute',
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'YT';
}

export function TalentPoolClient() {
  const { toast } = useToast();
  const [talents, setTalents] = useState<TalentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [availability, setAvailability] = useState('');
  const [shortlisted, setShortlisted] = useState<'all' | 'yes' | 'no'>('all');
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (offset = 0) => {
    setLoading(true);
    if (offset === 0) setTalents([]);
    try {
      const params = new URLSearchParams({
        q,
        location,
        shortlisted,
        limit: '50',
        offset: String(offset),
      });
      if (availability) params.set('availability', availability);
      const response = await apiFetch<{ data: { talents: TalentCard[]; hasMore: boolean } }>(`/api/talent?${params}`);
      setTalents((current) => offset > 0 ? [...current, ...response.data.talents] : response.data.talents);
      setHasMore(response.data.hasMore);
    } catch (error) {
      toast({
        title: 'Vivier indisponible',
        description: error instanceof Error ? error.message : 'Réessayez dans un instant.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [availability, location, q, shortlisted, toast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(0), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const toggleShortlist = async (talent: TalentCard) => {
    setWorkingId(talent.id);
    try {
      if (talent.shortlisted) {
        await apiFetch(`/api/talent/${encodeURIComponent(talent.id)}/shortlist`, { method: 'DELETE' });
      } else {
        await apiFetch(`/api/talent/${encodeURIComponent(talent.id)}/shortlist`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'saved', note: '' }),
        });
      }
      setTalents((current) => current.map((entry) => entry.id === talent.id
        ? { ...entry, shortlisted: !talent.shortlisted, shortlistStatus: talent.shortlisted ? 'archived' : 'saved' }
        : entry));
      toast({ title: talent.shortlisted ? 'Profil retiré de la sélection' : 'Profil ajouté à la sélection' });
    } catch (error) {
      toast({
        title: 'Sélection non modifiée',
        description: error instanceof Error ? error.message : 'Réessayez.',
        variant: 'destructive',
      });
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <WorkspaceFrame
      eyebrow="Découverte responsable"
      title="Repérer le potentiel, avec le consentement."
      description="Chaque profil visible a choisi d’apparaître ici. Recherchez par projet, compétence ou territoire sans accéder aux coordonnées privées."
      icon={UserRoundSearch}
      accent="lagoon"
    >
      <Alert className="border-primary/20 bg-primary/[0.04]">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Un vivier volontaire, pas une base de données privée</AlertTitle>
        <AlertDescription>
          Les coordonnées restent masquées. La prise de contact passe par la messagerie Yahnu et respecte une limite de 20 nouvelles conversations par 24 heures.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_0.8fr_0.8fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(event) => setQ(event.target.value)} className="pl-9" placeholder="Métier, compétence, projet…" aria-label="Rechercher un talent" />
          </div>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input value={location} onChange={(event) => setLocation(event.target.value)} className="pl-9" placeholder="Abidjan, Bouaké…" aria-label="Filtrer par lieu" />
          </div>
          <select value={availability} onChange={(event) => setAvailability(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm" aria-label="Filtrer par disponibilité">
            <option value="">Toute disponibilité</option>
            {availabilityOptions.map((option) => <option key={option} value={option}>{availabilityLabels[option]}</option>)}
          </select>
          <select value={shortlisted} onChange={(event) => setShortlisted(event.target.value as typeof shortlisted)} className="h-10 rounded-md border border-input bg-background px-3 text-sm" aria-label="Filtrer la sélection">
            <option value="all">Tous les profils</option>
            <option value="yes">Ma sélection</option>
            <option value="no">Non sélectionnés</option>
          </select>
          <Button type="button" variant="outline" size="icon" onClick={() => void load(0)} aria-label="Actualiser">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </CardContent>
      </Card>

      {loading && talents.length === 0 ? (
        <div className="grid min-h-72 place-items-center" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <span className="sr-only">Chargement du vivier de talents</span>
        </div>
      ) : talents.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="px-5 py-14 text-center">
            <Sparkles className="mx-auto h-9 w-9 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Aucun profil ne correspond à ces critères</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Élargissez les filtres. Le vivier n’affiche que des diplômés actifs ayant donné leur accord.</p>
            <Button className="mt-6" variant="outline" onClick={() => { setQ(''); setLocation(''); setAvailability(''); setShortlisted('all'); }}>Réinitialiser les filtres</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {talents.map((talent) => (
            <Card key={talent.id} className="group flex h-full flex-col overflow-hidden border-border/70 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift">
              <div className="h-1.5 bg-gradient-to-r from-terra via-primary to-lagoon" />
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/[0.08] font-display text-lg font-bold text-primary ring-1 ring-primary/15">
                    {initials(talent.name)}
                  </div>
                  <Button
                    size="icon"
                    variant={talent.shortlisted ? 'default' : 'outline'}
                    onClick={() => void toggleShortlist(talent)}
                    disabled={workingId === talent.id}
                    aria-label={talent.shortlisted ? 'Retirer de la sélection' : 'Ajouter à la sélection'}
                  >
                    {workingId === talent.id ? <Loader2 className="h-4 w-4 animate-spin" /> : talent.shortlisted ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                  </Button>
                </div>
                <div>
                  <CardTitle className="font-display text-xl">{talent.name}</CardTitle>
                  <CardDescription className="mt-1 line-clamp-2 min-h-10">{talent.headline}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {talent.skills.slice(0, 4).map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                  {talent.skills.length > 4 && <Badge variant="outline">+{talent.skills.length - 4}</Badge>}
                </div>
                <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{talent.summary || 'Ce talent n’a pas encore ajouté de présentation détaillée.'}</p>
                <div className="mt-auto space-y-3 pt-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{talent.preferredLocations[0] || 'Mobilité à préciser'}</span>
                    <span>{talent.availability ? availabilityLabels[talent.availability] : 'Disponibilité à préciser'}</span>
                  </div>
                  <Button asChild className="w-full justify-between" variant="outline">
                    <Link href={`/dashboard/talent-pool/${encodeURIComponent(talent.id)}`}>Voir le profil choisi <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>
          {hasMore ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => void load(talents.length)} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Afficher plus de talents
              </Button>
            </div>
          ) : null}
        </>
      )}
    </WorkspaceFrame>
  );
}
