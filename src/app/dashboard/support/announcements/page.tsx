"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock3, Edit3, Loader2, Megaphone, Plus, Trash2, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-client";

type Audience = "all" | "graduate" | "company" | "school";
type AnnouncementStatus = "active" | "draft";

type Announcement = {
  id: string;
  title: string;
  content: string;
  audience: Audience;
  status: AnnouncementStatus;
  expiryDate: Date;
};

type AnnouncementSummary = Omit<Announcement, "content"> & { contentPreview: string };
type ApiAnnouncement = Omit<Announcement, "expiryDate"> & { expiresAt: string | null };
type ApiAnnouncementSummary = Omit<ApiAnnouncement, "content"> & { contentPreview: string };
type AnnouncementsResponse = { data: { announcements: ApiAnnouncementSummary[]; hasMore: boolean; nextOffset: number | null } };
type AnnouncementResponse = { data: { announcement: ApiAnnouncement } };

const PAGE_SIZE = 30;

const announcementSchema = z.object({
  title: z.string().trim().min(5, "Le titre doit contenir au moins 5 caractères."),
  content: z.string().trim().min(20, "Le message doit contenir au moins 20 caractères."),
  audience: z.enum(["all", "graduate", "company", "school"]),
  status: z.enum(["active", "draft"]),
  expiryDate: z.string().min(1, "Choisissez une date de fin."),
});

type AnnouncementForm = z.infer<typeof announcementSchema>;

const AUDIENCE_LABELS: Record<Audience, string> = {
  all: "Toute la communauté",
  graduate: "Diplômés",
  company: "Entreprises",
  school: "Établissements",
};

function defaultExpiryDate() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
}

const EMPTY_FORM: AnnouncementForm = {
  title: "",
  content: "",
  audience: "all",
  status: "draft",
  expiryDate: defaultExpiryDate(),
};

const fromApi = (announcement: ApiAnnouncement): Announcement => ({
  ...announcement,
  expiryDate: announcement.expiresAt ? new Date(announcement.expiresAt) : new Date(`${defaultExpiryDate()}T23:59:59.000Z`),
});

const summaryFromApi = (announcement: ApiAnnouncementSummary): AnnouncementSummary => ({
  ...announcement,
  expiryDate: announcement.expiresAt ? new Date(announcement.expiresAt) : new Date(`${defaultExpiryDate()}T23:59:59.000Z`),
});

const previewContent = (content: string) => content.length <= 480 ? content : `${content.slice(0, 477).trimEnd()}…`;

const summaryFromAnnouncement = (announcement: Announcement): AnnouncementSummary => ({
  id: announcement.id,
  title: announcement.title,
  contentPreview: previewContent(announcement.content),
  audience: announcement.audience,
  status: announcement.status,
  expiryDate: announcement.expiryDate,
});

const fetchAnnouncements = (offset = 0) => apiFetch<AnnouncementsResponse>(`/api/announcements?limit=${PAGE_SIZE}&offset=${offset}`);

function formatDate(date: Date) {
  if (Number.isNaN(date.getTime())) return "Date à vérifier";
  return new Intl.DateTimeFormat("fr-CI", {
    dateStyle: "long",
    timeZone: "Africa/Abidjan",
  }).format(date);
}

function dateInputValue(date: Date) {
  if (Number.isNaN(date.getTime())) return defaultExpiryDate();
  return date.toISOString().slice(0, 10);
}

export default function AnnouncementsPage() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<AnnouncementSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const form = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementSchema),
    defaultValues: EMPTY_FORM,
  });

  useEffect(() => {
    let cancelled = false;
    fetchAnnouncements()
      .then((response) => {
        if (cancelled) return;
        setAnnouncements(response.data.announcements.map(summaryFromApi));
        setHasMore(response.data.hasMore);
        setNextOffset(response.data.nextOffset ?? 0);
      })
      .catch(() => {
        if (!cancelled) toast({
          title: "Chargement impossible",
          description: "Les annonces sont momentanément indisponibles.",
          variant: "destructive",
        });
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [toast]);

  const loadMoreAnnouncements = async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const response = await fetchAnnouncements(nextOffset);
      const loaded = response.data.announcements.map(summaryFromApi);
      setAnnouncements((current) => [
        ...current,
        ...loaded.filter((announcement) => !current.some((existing) => existing.id === announcement.id)),
      ]);
      setHasMore(response.data.hasMore);
      setNextOffset(response.data.nextOffset ?? 0);
    } catch {
      toast({
        title: "Chargement interrompu",
        description: "Les autres annonces n’ont pas pu être récupérées. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleCreateNew = () => {
    setEditingAnnouncement(null);
    form.reset({ ...EMPTY_FORM, expiryDate: defaultExpiryDate() });
    setIsFormOpen(true);
  };

  const handleEdit = async (announcement: AnnouncementSummary) => {
    setEditingId(announcement.id);
    try {
      const response = await apiFetch<AnnouncementResponse>(`/api/announcements/${encodeURIComponent(announcement.id)}`);
      const fullAnnouncement = fromApi(response.data.announcement);
      setEditingAnnouncement(fullAnnouncement);
      form.reset({
        title: fullAnnouncement.title,
        content: fullAnnouncement.content,
        audience: fullAnnouncement.audience,
        status: fullAnnouncement.status,
        expiryDate: dateInputValue(fullAnnouncement.expiryDate),
      });
      setIsFormOpen(true);
    } catch {
      toast({
        title: "Annonce indisponible",
        description: "Cette annonce n’a pas pu être ouverte. Réessayez dans un instant.",
        variant: "destructive",
      });
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await apiFetch(`/api/announcements/${encodeURIComponent(id)}`, { method: "DELETE" });
      setAnnouncements((current) => current.filter((announcement) => announcement.id !== id));
      toast({ title: "Annonce supprimée" });
    } catch {
      toast({
        title: "Suppression impossible",
        description: "L’annonce est toujours en place. Réessayez dans un instant.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const onSubmit = async (values: AnnouncementForm) => {
    setIsSaving(true);
    try {
      const endpoint = editingAnnouncement
        ? `/api/announcements/${encodeURIComponent(editingAnnouncement.id)}`
        : "/api/announcements";
      const response = await apiFetch<AnnouncementResponse>(endpoint, {
        method: editingAnnouncement ? "PATCH" : "POST",
        body: JSON.stringify({
          title: values.title,
          content: values.content,
          audience: values.audience,
          status: values.status,
          expiresAt: new Date(`${values.expiryDate}T23:59:59.000Z`).toISOString(),
        }),
      });
      const saved = summaryFromAnnouncement(fromApi(response.data.announcement));
      setAnnouncements((current) => editingAnnouncement
        ? current.map((announcement) => announcement.id === editingAnnouncement.id ? saved : announcement)
        : [saved, ...current]);
      setIsFormOpen(false);
      toast({
        title: editingAnnouncement ? "Annonce mise à jour" : values.status === "active" ? "Annonce diffusée" : "Brouillon enregistré",
        description: values.status === "active" ? `Visible par : ${AUDIENCE_LABELS[values.audience].toLowerCase()}.` : "Vous pourrez la reprendre avant diffusion.",
      });
    } catch {
      toast({
        title: "Enregistrement impossible",
        description: "L’annonce n’a pas pu être enregistrée. Vérifiez votre connexion puis réessayez.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const activeCount = announcements.filter((announcement) => announcement.status === "active").length;
  const draftCount = announcements.filter((announcement) => announcement.status === "draft").length;

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="dashboard-surface ci-pattern overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="section-kicker">Informations de la communauté</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Le bon message, au bon moment</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Informez clairement les diplômés, les recruteurs et les établissements sans bruit inutile.
            </p>
          </div>
          <Button onClick={handleCreateNew}><Plus className="mr-2 h-4 w-4" />Nouvelle annonce</Button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">En diffusion</p><p className="mt-1 font-display text-2xl font-semibold">{activeCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Brouillons</p><p className="mt-1 font-display text-2xl font-semibold">{draftCount}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Annonces enregistrées</CardTitle>
          <CardDescription>Les contenus sont issus de la plateforme. Aucun chiffre n’est simulé.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-muted-foreground" aria-live="polite">
              <Loader2 className="h-8 w-8 animate-spin text-primary motion-reduce:animate-none" />
              <p>Chargement des annonces…</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
              <span className="rounded-full bg-terra/10 p-3"><Megaphone className="h-6 w-6 text-terra" /></span>
              <div><p className="font-display text-lg font-semibold">Aucune annonce</p><p className="mt-1 text-sm text-muted-foreground">Créez un message seulement lorsqu’il apporte une information utile.</p></div>
              <Button variant="outline" onClick={handleCreateNew}><Plus className="mr-2 h-4 w-4" />Rédiger une annonce</Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {announcements.map((announcement) => (
                <article key={announcement.id} className="rounded-2xl border p-4 sm:p-5">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-display text-lg font-semibold">{announcement.title}</h2>
                        <Badge variant="outline" className={announcement.status === "active" ? "border-primary/30 bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>
                          {announcement.status === "active" ? "En diffusion" : "Brouillon"}
                        </Badge>
                      </div>
                      <p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{announcement.contentPreview}</p>
                      <div className="mt-4 flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                        <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{AUDIENCE_LABELS[announcement.audience]}</span>
                        <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />Fin prévue le {formatDate(announcement.expiryDate)}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" onClick={() => void handleEdit(announcement)} disabled={editingId !== null || deletingId !== null}>
                        {editingId === announcement.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Edit3 className="mr-2 h-4 w-4" />}
                        Modifier
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={deletingId !== null} aria-label={`Supprimer ${announcement.title}`}>
                            {deletingId === announcement.id ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette annonce ?</AlertDialogTitle>
                            <AlertDialogDescription>« {announcement.title} » disparaîtra définitivement. Cette action est irréversible.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Conserver l’annonce</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void handleDelete(announcement.id)}>Supprimer définitivement</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {hasMore ? (
            <div className="mt-5 flex justify-center border-t pt-5">
              <Button variant="outline" onClick={() => void loadMoreAnnouncements()} disabled={isLoadingMore}>
                {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}
                Afficher plus d’annonces
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!isSaving) setIsFormOpen(open);
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? "Modifier l’annonce" : "Créer une annonce"}</DialogTitle>
            <DialogDescription>Restez précis : à qui s’adresse le message, ce qui change et avant quelle date.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl><Input placeholder="Ex. Forum emploi numérique à Abidjan" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl><Textarea rows={7} maxLength={5_000} placeholder="Indiquez le lieu, la date, l’heure et l’action attendue…" {...field} /></FormControl>
                  <div className="flex items-center justify-between gap-3">
                    <FormMessage />
                    <span className="ml-auto text-xs text-muted-foreground">{field.value.length.toLocaleString("fr-CI")} / 5 000</span>
                  </div>
                </FormItem>
              )} />
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField control={form.control} name="audience" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public concerné</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="all">Toute la communauté</SelectItem>
                        <SelectItem value="graduate">Diplômés</SelectItem>
                        <SelectItem value="company">Entreprises</SelectItem>
                        <SelectItem value="school">Établissements</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diffusion</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon — équipe uniquement</SelectItem>
                        <SelectItem value="active">Diffuser maintenant</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="expiryDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date de fin</FormLabel>
                  <FormControl><Input type="date" min={new Date().toISOString().slice(0, 10)} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSaving}>Annuler</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Megaphone className="mr-2 h-4 w-4" />}
                  {form.watch("status") === "active" ? "Diffuser l’annonce" : "Enregistrer le brouillon"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
