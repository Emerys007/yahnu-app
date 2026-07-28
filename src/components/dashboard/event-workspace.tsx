"use client";

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  TicketCheck,
  UserCheck,
  Users,
  Video,
  XCircle,
} from 'lucide-react';

import { WorkspaceFrame } from '@/components/dashboard/workspace-frame';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api-client';
import type { CareerEvent } from '@/lib/role-workspaces';
import { cn } from '@/lib/utils';

type WorkspaceKind = 'graduate' | 'company' | 'school';
type EventRegistration = {
  graduateId: string;
  name: string;
  schoolName: string | null;
  status: 'registered' | 'attended';
  reminderState: CareerEvent['reminderState'];
  registeredAt: string;
  updatedAt: string;
};
type EventForm = {
  title: string;
  description: string;
  eventFormat: 'onsite' | 'online' | 'hybrid';
  location: string;
  onlineUrl: string;
  startsAt: string;
  endsAt: string;
  registrationDeadline: string;
  capacity: string;
  audience: 'all_graduates' | 'school_graduates';
  status: 'draft' | 'published';
};

function localDateInput(value: Date) {
  const offset = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - offset).toISOString().slice(0, 16);
}

function newEventForm(): EventForm {
  const starts = new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000);
  starts.setHours(10, 0, 0, 0);
  const ends = new Date(starts.getTime() + 2 * 60 * 60 * 1_000);
  const deadline = new Date(starts.getTime() - 24 * 60 * 60 * 1_000);
  return {
    title: '',
    description: '',
    eventFormat: 'onsite',
    location: '',
    onlineUrl: '',
    startsAt: localDateInput(starts),
    endsAt: localDateInput(ends),
    registrationDeadline: localDateInput(deadline),
    capacity: '',
    audience: 'all_graduates',
    status: 'draft',
  };
}

function eventToForm(event: CareerEvent): EventForm {
  return {
    title: event.title,
    description: event.description,
    eventFormat: event.eventFormat,
    location: event.location || '',
    onlineUrl: event.onlineUrl || '',
    startsAt: localDateInput(new Date(event.startsAt)),
    endsAt: localDateInput(new Date(event.endsAt)),
    registrationDeadline: event.registrationDeadline ? localDateInput(new Date(event.registrationDeadline)) : '',
    capacity: event.capacity === null ? '' : String(event.capacity),
    audience: event.audience,
    status: event.status === 'published' ? 'published' : 'draft',
  };
}

const statusCopy: Record<CareerEvent['status'], string> = {
  draft: 'Brouillon',
  published: 'Publié',
  cancelled: 'Annulé',
  completed: 'Terminé',
};

const reminderCopy: Record<CareerEvent['reminderState'], string> = {
  not_scheduled: 'Aucun rappel programmé',
  scheduled: 'Rappel programmé',
  processing: 'Rappel en traitement',
  completed: 'Rappel traité',
  failed: 'Rappel à vérifier',
};

function EventEditorDialog({
  open,
  event,
  kind,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  event: CareerEvent | null;
  kind: 'company' | 'school';
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<EventForm>(() => newEventForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(event ? eventToForm(event) : newEventForm());
  }, [event, open]);

  const setField = <K extends keyof EventForm>(field: K, value: EventForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };
  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        eventFormat: form.eventFormat,
        location: form.location || null,
        onlineUrl: form.onlineUrl || null,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        registrationDeadline: form.registrationDeadline ? new Date(form.registrationDeadline).toISOString() : null,
        capacity: form.capacity ? Number(form.capacity) : null,
        audience: kind === 'company' ? 'all_graduates' : form.audience,
        status: form.status,
      };
      await apiFetch(event ? `/api/events/${encodeURIComponent(event.id)}` : '/api/events', {
        method: event ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      await onSaved();
      onOpenChange(false);
      toast({
        title: event ? 'Événement mis à jour' : 'Événement créé',
        description: form.status === 'published'
          ? 'Il est maintenant visible par le public sélectionné.'
          : 'Il reste privé dans vos brouillons.',
      });
    } catch (error) {
      toast({
        title: 'Événement non enregistré',
        description: error instanceof Error ? error.message : 'Vérifiez les dates et réessayez.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? 'Modifier l’événement' : 'Créer un rendez-vous utile'}</DialogTitle>
          <DialogDescription>
            Une information claire, une capacité réelle et une échéance lisible pour les jeunes diplômés.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-2 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="event-title">Titre</Label>
            <Input id="event-title" value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Rencontre métiers : finance digitale à Abidjan" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="event-description">Ce que les participants vont vivre</Label>
            <Textarea id="event-description" rows={6} value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Décrivez les intervenants, le programme et ce que les participants pourront emporter…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-format">Format</Label>
            <select id="event-format" value={form.eventFormat} onChange={(e) => setField('eventFormat', e.target.value as EventForm['eventFormat'])} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="onsite">En présentiel</option>
              <option value="online">En ligne</option>
              <option value="hybrid">Hybride</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-capacity">Capacité</Label>
            <Input id="event-capacity" type="number" min={1} value={form.capacity} onChange={(e) => setField('capacity', e.target.value)} placeholder="Illimitée si vide" />
          </div>
          {form.eventFormat !== 'online' ? (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="event-location">Lieu</Label>
              <Input id="event-location" value={form.location} onChange={(e) => setField('location', e.target.value)} placeholder="Plateau, Abidjan · Amphithéâtre Félix Houphouët-Boigny…" />
            </div>
          ) : null}
          {form.eventFormat !== 'onsite' ? (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="event-online-url">Lien de participation</Label>
              <Input id="event-online-url" type="url" value={form.onlineUrl} onChange={(e) => setField('onlineUrl', e.target.value)} placeholder="https://meet.example.com/…" />
              <p className="text-xs text-muted-foreground">Ce lien reste masqué aux personnes non inscrites.</p>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="event-starts">Début</Label>
            <Input id="event-starts" type="datetime-local" value={form.startsAt} onChange={(e) => setField('startsAt', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-ends">Fin</Label>
            <Input id="event-ends" type="datetime-local" value={form.endsAt} onChange={(e) => setField('endsAt', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event-deadline">Clôture des inscriptions</Label>
            <Input id="event-deadline" type="datetime-local" value={form.registrationDeadline} onChange={(e) => setField('registrationDeadline', e.target.value)} />
          </div>
          {kind === 'school' ? (
            <div className="space-y-2">
              <Label htmlFor="event-audience">Public</Label>
              <select id="event-audience" value={form.audience} onChange={(e) => setField('audience', e.target.value as EventForm['audience'])} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="all_graduates">Tous les diplômés Yahnu</option>
                <option value="school_graduates">Diplômés rattachés à mon établissement</option>
              </select>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="event-status">Visibilité</Label>
            <select id="event-status" value={form.status} onChange={(e) => setField('status', e.target.value as EventForm['status'])} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="draft">Brouillon privé</option>
              <option value="published">Publier maintenant</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => void save()} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {event ? 'Enregistrer' : 'Créer l’événement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EventWorkspace({ kind }: { kind: WorkspaceKind }) {
  const { toast } = useToast();
  const organizer = kind === 'company' || kind === 'school';
  const [events, setEvents] = useState<CareerEvent[]>([]);
  const [eventsHasMore, setEventsHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'upcoming' | 'registered'>(kind === 'graduate' ? 'upcoming' : 'upcoming');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CareerEvent | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [attendeesEvent, setAttendeesEvent] = useState<CareerEvent | null>(null);
  const [attendees, setAttendees] = useState<EventRegistration[]>([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [attendeesHasMore, setAttendeesHasMore] = useState(false);

  const load = useCallback(async (silent = false, offset = 0) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const scope = organizer ? 'mine' : filter;
      const response = await apiFetch<{ data: { events: CareerEvent[]; hasMore: boolean } }>(
        `/api/events?scope=${scope}&limit=50&offset=${offset}`,
      );
      setEvents((current) => offset > 0 ? [...current, ...response.data.events] : response.data.events);
      setEventsHasMore(response.data.hasMore);
    } catch (error) {
      toast({
        title: 'Agenda indisponible',
        description: error instanceof Error ? error.message : 'Réessayez dans un instant.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, organizer, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (event: CareerEvent, action: 'register' | 'cancel-registration' | 'publish' | 'cancel-event') => {
    setWorkingId(event.id);
    try {
      if (action === 'register') {
        await apiFetch(`/api/events/${encodeURIComponent(event.id)}/registration`, { method: 'POST' });
      } else if (action === 'cancel-registration') {
        await apiFetch(`/api/events/${encodeURIComponent(event.id)}/registration`, { method: 'DELETE' });
      } else {
        await apiFetch(`/api/events/${encodeURIComponent(event.id)}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: action === 'publish' ? 'published' : 'cancelled' }),
        });
      }
      await load(true);
      toast({
        title: action === 'register'
          ? 'Inscription confirmée'
          : action === 'cancel-registration'
            ? 'Inscription annulée'
            : action === 'publish'
              ? 'Événement publié'
              : 'Événement annulé',
        description: action === 'register'
          ? 'Retrouvez les informations pratiques ici. Aucun rappel n’est annoncé tant qu’il n’est pas programmé.'
          : 'La mise à jour a bien été enregistrée.',
      });
    } catch (error) {
      toast({
        title: 'Action impossible',
        description: error instanceof Error ? error.message : 'Réessayez dans un instant.',
        variant: 'destructive',
      });
    } finally {
      setWorkingId(null);
    }
  };

  const loadAttendees = async (event: CareerEvent, offset = 0) => {
    setAttendeesLoading(true);
    try {
      const response = await apiFetch<{ data: { registrations: EventRegistration[]; hasMore: boolean } }>(
        `/api/events/${encodeURIComponent(event.id)}/registrations?limit=50&offset=${offset}`,
      );
      setAttendees((current) => offset > 0
        ? [...current, ...response.data.registrations]
        : response.data.registrations);
      setAttendeesHasMore(response.data.hasMore);
    } catch (error) {
      toast({
        title: 'Participants indisponibles',
        description: error instanceof Error ? error.message : 'Réessayez dans un instant.',
        variant: 'destructive',
      });
    } finally {
      setAttendeesLoading(false);
    }
  };

  const openAttendees = async (event: CareerEvent) => {
    setAttendeesEvent(event);
    setAttendees([]);
    setAttendeesHasMore(false);
    await loadAttendees(event, 0);
  };

  const updateAttendance = async (registration: EventRegistration) => {
    if (!attendeesEvent) return;
    setWorkingId(registration.graduateId);
    const nextStatus = registration.status === 'attended' ? 'registered' : 'attended';
    try {
      const response = await apiFetch<{ data: { registration: EventRegistration } }>(
        `/api/events/${encodeURIComponent(attendeesEvent.id)}/registrations`,
        {
          method: 'PATCH',
          body: JSON.stringify({ graduateId: registration.graduateId, status: nextStatus }),
        },
      );
      setAttendees((current) => current.map((entry) => (
        entry.graduateId === registration.graduateId ? response.data.registration : entry
      )));
    } catch (error) {
      toast({
        title: 'Présence non modifiée',
        description: error instanceof Error ? error.message : 'Réessayez.',
        variant: 'destructive',
      });
    } finally {
      setWorkingId(null);
    }
  };

  const upcomingCount = useMemo(() => events.filter((event) => new Date(event.endsAt).getTime() > Date.now() && event.status === 'published').length, [events]);
  const registrations = useMemo(() => events.reduce((sum, event) => sum + event.registrationCount, 0), [events]);

  return (
    <WorkspaceFrame
      eyebrow={organizer ? 'Rencontres terrain' : 'Agenda carrière'}
      title={organizer
        ? kind === 'company' ? 'Créer la rencontre avant le recrutement.' : 'Faire vivre le lien après le diplôme.'
        : 'Les bonnes rencontres changent une trajectoire.'}
      description={organizer
        ? 'Publiez des événements avec des informations réelles, une capacité contrôlée et un suivi d’inscription en direct.'
        : 'Ateliers, rencontres métiers et rendez-vous campus accessibles selon votre profil. Les liens en ligne restent privés jusqu’à l’inscription.'}
      icon={CalendarDays}
      accent={kind === 'company' ? 'terra' : kind === 'school' ? 'primary' : 'lagoon'}
      actions={organizer ? (
        <Button onClick={() => { setEditing(null); setEditorOpen(true); }} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Créer un événement
        </Button>
      ) : null}
    >
      {organizer ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-primary/15 bg-primary/[0.04]"><CardContent className="p-5"><p className="text-3xl font-bold">{events.length}</p><p className="mt-1 text-sm text-muted-foreground">événement(s) enregistré(s)</p></CardContent></Card>
          <Card className="border-terra/15 bg-terra/[0.04]"><CardContent className="p-5"><p className="text-3xl font-bold">{upcomingCount}</p><p className="mt-1 text-sm text-muted-foreground">rendez-vous publié(s) à venir</p></CardContent></Card>
          <Card className="border-lagoon/15 bg-lagoon/[0.04]"><CardContent className="p-5"><p className="text-3xl font-bold">{registrations}</p><p className="mt-1 text-sm text-muted-foreground">inscription(s) actives</p></CardContent></Card>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button variant={filter === 'upcoming' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('upcoming')}>À découvrir</Button>
            <Button variant={filter === 'registered' ? 'default' : 'ghost'} size="sm" onClick={() => setFilter('registered')}>Mes inscriptions</Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => void load(true)} disabled={refreshing}>
            <RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} /> Actualiser
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid min-h-72 place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="px-5 py-14 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">{organizer ? 'Votre prochain rendez-vous commence ici' : filter === 'registered' ? 'Aucune inscription active' : 'Aucun événement ouvert pour le moment'}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              {organizer ? 'Créez un brouillon, vérifiez les détails puis publiez-le quand tout est prêt.' : 'Revenez régulièrement : l’agenda affiche uniquement les rendez-vous réellement publiés.'}
            </p>
            {organizer && <Button className="mt-6" onClick={() => setEditorOpen(true)}><Plus className="mr-2 h-4 w-4" /> Créer un événement</Button>}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            {events.map((event) => {
            const date = new Intl.DateTimeFormat('fr-CI', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(event.startsAt));
            const time = new Intl.DateTimeFormat('fr-CI', { hour: '2-digit', minute: '2-digit' }).format(new Date(event.startsAt));
            return (
              <Card key={event.id} className="group overflow-hidden border-border/70 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lift">
                <div className={cn('h-1.5', event.status === 'published' ? 'bg-gradient-to-r from-primary to-lagoon' : event.status === 'cancelled' ? 'bg-destructive/70' : 'bg-muted')} />
                <CardHeader className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>{statusCopy[event.status]}</Badge>
                      <Badge variant="outline">{event.eventFormat === 'onsite' ? 'Présentiel' : event.eventFormat === 'online' ? 'En ligne' : 'Hybride'}</Badge>
                    </div>
                    {event.audience === 'school_graduates' && <Badge variant="outline">Communauté du campus</Badge>}
                  </div>
                  <div>
                    <CardTitle className="font-display text-2xl leading-tight">{event.title}</CardTitle>
                    <CardDescription className="mt-2">{event.organizerName}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{event.description}</p>
                  <div className="grid gap-3 rounded-2xl bg-muted/35 p-4 text-sm sm:grid-cols-2">
                    <div className="flex items-start gap-2"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span><strong className="block">{date}</strong>{time}</span></div>
                    <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-terra" /><span>{event.location || (event.eventFormat === 'online' ? 'En ligne' : 'Lieu à préciser')}</span></div>
                    <div className="flex items-start gap-2"><Users className="mt-0.5 h-4 w-4 shrink-0 text-lagoon" /><span>{event.registrationCount} inscrit(s){event.capacity ? ` · ${event.seatsRemaining} place(s) restante(s)` : ''}</span></div>
                    <div className="flex items-start gap-2"><TicketCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{reminderCopy[event.reminderState]}</span></div>
                  </div>
                  {event.onlineUrl ? (
                    <Button asChild variant="outline" className="w-full justify-between">
                      <Link href={event.onlineUrl} target="_blank" rel="noreferrer">Ouvrir le lien de participation <ExternalLink className="h-4 w-4" /></Link>
                    </Button>
                  ) : null}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {organizer ? (
                      <>
                        <Button variant="ghost" className="flex-1" onClick={() => void openAttendees(event)}>
                          <Users className="mr-2 h-4 w-4" /> Participants
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => { setEditing(event); setEditorOpen(true); }}>
                          <Pencil className="mr-2 h-4 w-4" /> Modifier
                        </Button>
                        {event.status === 'draft' && (
                          <Button className="flex-1" onClick={() => void act(event, 'publish')} disabled={workingId === event.id}>
                            {workingId === event.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Publier
                          </Button>
                        )}
                        {event.status === 'published' && (
                          <Button variant="destructive" className="flex-1" onClick={() => void act(event, 'cancel-event')} disabled={workingId === event.id}>
                            <XCircle className="mr-2 h-4 w-4" /> Annuler
                          </Button>
                        )}
                      </>
                    ) : event.registered ? (
                      <Button variant="outline" className="w-full" onClick={() => void act(event, 'cancel-registration')} disabled={workingId === event.id}>
                        {workingId === event.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />} Annuler mon inscription
                      </Button>
                    ) : (
                      <Button className="w-full" onClick={() => void act(event, 'register')} disabled={!event.registrationOpen || workingId === event.id}>
                        {workingId === event.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <TicketCheck className="mr-2 h-4 w-4" />}
                        {event.registrationOpen ? 'Réserver ma place' : event.seatsRemaining === 0 ? 'Complet' : 'Inscriptions closes'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
          {eventsHasMore ? (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => void load(true, events.length)} disabled={refreshing}>
                {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Afficher plus d’événements
              </Button>
            </div>
          ) : null}
        </>
      )}
      {organizer && (
        <>
          <EventEditorDialog
            open={editorOpen}
            event={editing}
            kind={kind}
            onOpenChange={setEditorOpen}
            onSaved={() => load(true)}
          />
          <Dialog open={Boolean(attendeesEvent)} onOpenChange={(open) => !open && setAttendeesEvent(null)}>
            <DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Participants · {attendeesEvent?.title}</DialogTitle>
                <DialogDescription>
                  La liste contient uniquement les personnes inscrites. Les coordonnées privées ne sont pas exposées.
                </DialogDescription>
              </DialogHeader>
              {attendeesLoading && attendees.length === 0 ? (
                <div className="grid min-h-48 place-items-center" role="status" aria-live="polite">
                  <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
                  <span className="sr-only">Chargement des participants</span>
                </div>
              ) : attendees.length ? (
                <div className="space-y-2 py-2">
                  {attendees.map((registration) => (
                    <div key={registration.graduateId} className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{registration.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {registration.schoolName || 'Établissement non renseigné'} · Inscrit le {new Intl.DateTimeFormat('fr-CI', { dateStyle: 'medium' }).format(new Date(registration.registeredAt))}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={registration.status === 'attended' ? 'default' : 'outline'}
                        onClick={() => void updateAttendance(registration)}
                        disabled={workingId === registration.graduateId}
                      >
                        {workingId === registration.graduateId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
                        {registration.status === 'attended' ? 'Présence confirmée' : 'Marquer présent'}
                      </Button>
                    </div>
                  ))}
                  {attendeesHasMore && attendeesEvent ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => void loadAttendees(attendeesEvent, attendees.length)}
                      disabled={attendeesLoading}
                    >
                      {attendeesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Charger les participants suivants
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Aucune inscription active pour cet événement.
                </div>
              )}
              <DialogFooter><Button variant="outline" onClick={() => setAttendeesEvent(null)}>Fermer</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </WorkspaceFrame>
  );
}
