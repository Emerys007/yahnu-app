"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Link2,
  Loader2,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api-client';
import type { TalentCard } from '@/lib/role-workspaces';

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'YT';
}

export function TalentProfileClient({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [talent, setTalent] = useState<TalentCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [message, setMessage] = useState('Bonjour, votre profil a retenu notre attention. Nous aimerions échanger avec vous sur une opportunité et comprendre vos objectifs professionnels.');

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ data: { talent: TalentCard } }>(`/api/talent/${encodeURIComponent(id)}`)
      .then((response) => {
        if (!cancelled) setTalent(response.data.talent);
      })
      .catch((error) => {
        if (!cancelled) toast({ title: 'Profil indisponible', description: error instanceof Error ? error.message : 'Ce profil n’est plus visible.', variant: 'destructive' });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, toast]);

  const save = async () => {
    if (!talent) return;
    setWorking(true);
    try {
      if (talent.shortlisted) {
        await apiFetch(`/api/talent/${encodeURIComponent(id)}/shortlist`, { method: 'DELETE' });
      } else {
        await apiFetch(`/api/talent/${encodeURIComponent(id)}/shortlist`, { method: 'PUT', body: JSON.stringify({ status: 'saved', note: '' }) });
      }
      setTalent({ ...talent, shortlisted: !talent.shortlisted, shortlistStatus: talent.shortlisted ? 'archived' : 'saved' });
    } catch (error) {
      toast({ title: 'Sélection non modifiée', description: error instanceof Error ? error.message : 'Réessayez.', variant: 'destructive' });
    } finally {
      setWorking(false);
    }
  };

  const contact = async () => {
    setWorking(true);
    try {
      const response = await apiFetch<{ data: { conversation: { id: string } } }>(`/api/talent/${encodeURIComponent(id)}/contact`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      setContactOpen(false);
      router.push(`/dashboard/messages?convoId=${encodeURIComponent(response.data.conversation.id)}`);
    } catch (error) {
      toast({ title: 'Message non envoyé', description: error instanceof Error ? error.message : 'Réessayez.', variant: 'destructive' });
    } finally {
      setWorking(false);
    }
  };

  if (loading) return <div className="grid min-h-[28rem] place-items-center"><Loader2 className="h-9 w-9 animate-spin text-primary" /></div>;
  if (!talent) {
    return (
      <Card className="mx-auto max-w-xl border-dashed">
        <CardContent className="p-10 text-center">
          <ShieldCheck className="mx-auto h-9 w-9 text-muted-foreground" />
          <h1 className="mt-4 text-xl font-semibold">Ce profil n’est plus visible</h1>
          <p className="mt-2 text-sm text-muted-foreground">Le diplômé a peut-être retiré son consentement.</p>
          <Button asChild className="mt-6"><Link href="/dashboard/talent-pool">Retour au vivier</Link></Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" className="-ml-3"><Link href="/dashboard/talent-pool"><ArrowLeft className="mr-2 h-4 w-4" /> Retour au vivier</Link></Button>
      <Card className="overflow-hidden border-border/70">
        <div className="ci-pattern h-28 bg-gradient-to-r from-terra/10 via-primary/10 to-lagoon/10 sm:h-40" />
        <CardContent className="-mt-12 px-5 pb-7 sm:-mt-16 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-[1.75rem] border-8 border-card bg-primary font-display text-2xl font-bold text-primary-foreground shadow-soft sm:h-32 sm:w-32 sm:text-3xl">
              {initials(talent.name)}
            </div>
            <div className="min-w-0 flex-1">
              <Badge variant="secondary"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Profil visible avec consentement</Badge>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">{talent.name}</h1>
              <p className="mt-1 text-base text-muted-foreground sm:text-lg">{talent.headline}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => void save()} disabled={working}>
                {talent.shortlisted ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <Bookmark className="mr-2 h-4 w-4" />}
                {talent.shortlisted ? 'Dans ma sélection' : 'Ajouter à ma sélection'}
              </Button>
              <Button onClick={() => setContactOpen(true)}><MessageSquare className="mr-2 h-4 w-4" /> Contacter dans Yahnu</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Ce que ce talent veut construire</CardTitle></CardHeader>
            <CardContent><p className="whitespace-pre-wrap leading-7 text-muted-foreground">{talent.summary || 'Aucune présentation détaillée.'}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Compétences & cap professionnel</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2">{talent.skills.map((skill) => <Badge key={skill} variant="secondary">{skill}</Badge>)}</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-muted/35 p-4"><p className="text-xs font-bold uppercase tracking-wider text-primary">Métiers visés</p><p className="mt-2 text-sm leading-6">{talent.preferredRoles.join(', ') || 'À préciser'}</p></div>
                <div className="rounded-2xl bg-muted/35 p-4"><p className="text-xs font-bold uppercase tracking-wider text-primary">Mobilité</p><p className="mt-2 text-sm leading-6">{talent.preferredLocations.join(', ') || 'À préciser'}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-primary/20">
            <div className="h-1.5 bg-gradient-to-r from-primary via-lagoon to-terra" aria-hidden="true" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-primary" />
                Yahnu skills attestations
              </CardTitle>
              <CardDescription>
                Résultats que le talent a explicitement rendus publics. Chaque lien permet
                de vérifier l’état et les conditions techniques de l’attestation.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {talent.publicAttestations.length ? talent.publicAttestations.map((attestation) => (
                <Link
                  href={`/verify/skills/${attestation.verificationCode}`}
                  target="_blank"
                  rel="noreferrer"
                  key={attestation.verificationCode}
                  className="group rounded-2xl border border-primary/15 bg-primary/[0.035] p-4 transition hover:border-primary/35 hover:shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <Badge variant="outline">{attestation.score} %</Badge>
                  </div>
                  <p className="mt-3 font-display font-semibold leading-5">{attestation.title}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    Vérifier l’attestation
                    <ExternalLink className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </Link>
              )) : (
                <p className="text-sm leading-6 text-muted-foreground sm:col-span-2">
                  Ce talent n’a rendu publique aucune Yahnu skills attestation.
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Parcours de formation</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {talent.education.length ? talent.education.map((education, index) => (
                <div key={`${education.degree}-${index}`} className="flex items-start justify-between gap-4 rounded-2xl border p-4">
                  <div><p className="font-semibold">{education.degree}</p><p className="mt-1 text-sm text-muted-foreground">{education.field}{education.gradYear ? ` · ${education.gradYear}` : ''}</p></div>
                  {education.verified ? <Badge><CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Vérifié</Badge> : <Badge variant="outline">Déclaré</Badge>}
                </div>
              )) : <p className="text-sm text-muted-foreground">Aucune formation renseignée.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" /> Preuves de portfolio</CardTitle><CardDescription>Liens déclarés par le talent, non certifiés par Yahnu sauf mention contraire.</CardDescription></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {talent.portfolioEvidence.length ? talent.portfolioEvidence.map((entry) => (
                <Button asChild variant="outline" className="h-auto min-h-12 justify-between whitespace-normal py-3 text-left" key={entry.url}>
                  <Link href={entry.url} target="_blank" rel="noreferrer">{entry.label}<ExternalLink className="ml-2 h-4 w-4 shrink-0" /></Link>
                </Button>
              )) : <p className="text-sm text-muted-foreground sm:col-span-2">Aucune preuve de portfolio partagée.</p>}
            </CardContent>
          </Card>
        </div>
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card className="border-primary/20">
            <CardHeader><CardTitle>Repères rapides</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 text-terra" /><div><p className="font-medium">Lieux souhaités</p><p className="text-muted-foreground">{talent.preferredLocations.join(', ') || 'À préciser'}</p></div></div>
              <div className="flex items-start gap-3"><Sparkles className="mt-0.5 h-4 w-4 text-primary" /><div><p className="font-medium">Organisation du travail</p><p className="text-muted-foreground">{talent.workModes.join(', ') || 'À préciser'}</p></div></div>
              <div className="flex items-start gap-3"><GraduationCap className="mt-0.5 h-4 w-4 text-lagoon" /><div><p className="font-medium">Établissement</p><p className="text-muted-foreground">{talent.schoolName || 'Non renseigné'}</p></div></div>
            </CardContent>
          </Card>
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Contact respectueux</AlertTitle>
            <AlertDescription>Présentez une opportunité réelle et laissez au talent le choix de répondre. Les coordonnées privées restent masquées.</AlertDescription>
          </Alert>
        </aside>
      </div>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Écrire à {talent.name}</DialogTitle>
            <DialogDescription>Donnez du contexte : mission, lieu, type de contrat et prochaine étape.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="talent-message">Premier message</Label>
            <Textarea id="talent-message" rows={7} value={message} onChange={(event) => setMessage(event.target.value)} />
            <p className="text-xs text-muted-foreground">20 caractères minimum. Le message sera enregistré dans la messagerie Yahnu.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContactOpen(false)}>Annuler</Button>
            <Button onClick={() => void contact()} disabled={working || message.trim().length < 20}>
              {working && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Envoyer et ouvrir la conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
