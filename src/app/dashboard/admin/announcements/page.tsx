"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  AlertCircle,
  CalendarDays,
  CalendarIcon,
  Clock3,
  Edit3,
  Loader2,
  Megaphone,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

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
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api-client"
import { cn } from "@/lib/utils"

type AnnouncementAudience = "all" | "graduate" | "company" | "school"
type AnnouncementStatus = "active" | "draft"

type Announcement = {
  id: string
  title: string
  content: string
  audience: AnnouncementAudience
  status: AnnouncementStatus
  expiryDate: Date | null
}

type AnnouncementSummary = Omit<Announcement, "content"> & { contentPreview: string }
type ApiAnnouncement = Omit<Announcement, "expiryDate"> & { expiresAt: string | null }
type ApiAnnouncementSummary = Omit<ApiAnnouncement, "content"> & { contentPreview: string }
type AnnouncementsResponse = {
  data: { announcements: ApiAnnouncementSummary[]; hasMore: boolean; nextOffset: number | null }
}
type AnnouncementResponse = { data: { announcement: ApiAnnouncement } }

const PAGE_SIZE = 30

const announcementSchema = z.object({
  title: z.string().trim().min(3, "Ajoutez un titre d’au moins 3 caractères.").max(180, "Le titre est trop long."),
  content: z.string().trim().min(10, "Ajoutez un message d’au moins 10 caractères.").max(5_000, "Le message est trop long."),
  audience: z.enum(["all", "graduate", "company", "school"]),
  status: z.enum(["active", "draft"]),
  expiryDate: z.date({ required_error: "Choisissez une date de fin." }),
})

type AnnouncementForm = z.infer<typeof announcementSchema>

const audienceLabels: Record<AnnouncementAudience, string> = {
  all: "Toute la communauté",
  graduate: "Jeunes diplômés",
  company: "Entreprises",
  school: "Écoles et universités",
}

const parseExpiry = (value: string | null) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const fromApi = (announcement: ApiAnnouncement): Announcement => ({
  ...announcement,
  expiryDate: parseExpiry(announcement.expiresAt),
})

const summaryFromApi = (announcement: ApiAnnouncementSummary): AnnouncementSummary => ({
  ...announcement,
  expiryDate: parseExpiry(announcement.expiresAt),
})

const previewContent = (content: string) => content.length <= 480 ? content : `${content.slice(0, 477).trimEnd()}…`

const summaryFromAnnouncement = (announcement: Announcement): AnnouncementSummary => ({
  id: announcement.id,
  title: announcement.title,
  contentPreview: previewContent(announcement.content),
  audience: announcement.audience,
  status: announcement.status,
  expiryDate: announcement.expiryDate,
})

const fetchAnnouncements = (offset = 0) =>
  apiFetch<AnnouncementsResponse>(`/api/announcements?limit=${PAGE_SIZE}&offset=${offset}`)

function endOfToday() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

export default function AnnouncementsPage() {
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState<AnnouncementSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextOffset, setNextOffset] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)

  const form = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: "", content: "", audience: "all", status: "draft" },
  })

  const loadFirstPage = useCallback(async () => {
    setIsLoading(true)
    setLoadFailed(false)
    try {
      const response = await fetchAnnouncements()
      setAnnouncements(response.data.announcements.map(summaryFromApi))
      setHasMore(response.data.hasMore)
      setNextOffset(response.data.nextOffset ?? 0)
    } catch (error) {
      console.error("Unable to load announcements", error)
      setLoadFailed(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void loadFirstPage() }, [loadFirstPage])

  const counts = useMemo(() => ({
    active: announcements.filter((item) => item.status === "active").length,
    drafts: announcements.filter((item) => item.status === "draft").length,
  }), [announcements])

  const loadMoreAnnouncements = async () => {
    if (!hasMore || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const response = await fetchAnnouncements(nextOffset)
      const loaded = response.data.announcements.map(summaryFromApi)
      setAnnouncements((current) => [
        ...current,
        ...loaded.filter((item) => !current.some((existing) => existing.id === item.id)),
      ])
      setHasMore(response.data.hasMore)
      setNextOffset(response.data.nextOffset ?? 0)
    } catch (error) {
      console.error("Unable to load more announcements", error)
      toast({
        title: "Chargement interrompu",
        description: "Les annonces suivantes n’ont pas pu être récupérées. Réessayez dans un instant.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleCreateNew = () => {
    setEditingAnnouncement(null)
    form.reset({ title: "", content: "", audience: "all", status: "draft", expiryDate: undefined })
    setIsFormOpen(true)
  }

  const handleEdit = async (announcement: AnnouncementSummary) => {
    setEditingId(announcement.id)
    try {
      const response = await apiFetch<AnnouncementResponse>(`/api/announcements/${encodeURIComponent(announcement.id)}`)
      const fullAnnouncement = fromApi(response.data.announcement)
      setEditingAnnouncement(fullAnnouncement)
      form.reset({
        title: fullAnnouncement.title,
        content: fullAnnouncement.content,
        audience: fullAnnouncement.audience,
        status: fullAnnouncement.status,
        expiryDate: fullAnnouncement.expiryDate ?? undefined,
      })
      setIsFormOpen(true)
    } catch (error) {
      console.error("Unable to load announcement", error)
      toast({
        title: "Annonce indisponible",
        description: "Son contenu n’a pas pu être ouvert. Actualisez la page puis réessayez.",
        variant: "destructive",
      })
    } finally {
      setEditingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await apiFetch(`/api/announcements/${encodeURIComponent(id)}`, { method: "DELETE" })
      setAnnouncements((current) => current.filter((item) => item.id !== id))
      toast({ title: "Annonce supprimée", description: "Elle n’est plus diffusée sur Yahnu." })
    } catch (error) {
      console.error("Unable to delete announcement", error)
      toast({
        title: "Suppression impossible",
        description: "L’annonce est restée en place. Réessayez dans un instant.",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const onSubmit = async (values: AnnouncementForm) => {
    setIsSaving(true)
    try {
      const endpoint = editingAnnouncement
        ? `/api/announcements/${encodeURIComponent(editingAnnouncement.id)}`
        : "/api/announcements"
      const response = await apiFetch<AnnouncementResponse>(endpoint, {
        method: editingAnnouncement ? "PATCH" : "POST",
        body: JSON.stringify({
          title: values.title,
          content: values.content,
          audience: values.audience,
          status: values.status,
          expiresAt: values.expiryDate.toISOString(),
        }),
      })
      const saved = summaryFromAnnouncement(fromApi(response.data.announcement))
      setAnnouncements((current) => editingAnnouncement
        ? current.map((item) => item.id === editingAnnouncement.id ? saved : item)
        : [saved, ...current])
      setIsFormOpen(false)
      setEditingAnnouncement(null)
      toast({
        title: editingAnnouncement ? "Annonce mise à jour" : "Annonce créée",
        description: values.status === "active"
          ? "Le message est maintenant visible par le public choisi."
          : "Le brouillon est enregistré et reste invisible aux utilisateurs.",
      })
    } catch (error) {
      console.error("Unable to save announcement", error)
      toast({
        title: "Enregistrement impossible",
        description: "Aucune modification n’a été publiée. Vérifiez les champs puis réessayez.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="dashboard-surface lagoon-grid overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="section-kicker">Communication · Côte d’Ivoire</p>
            <div className="mt-2 flex items-start gap-3">
              <span className="rounded-2xl bg-terra/15 p-3 text-cocoa"><Megaphone className="h-6 w-6" /></span>
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Annonces de la plateforme</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Informez les diplômés, les recruteurs et les établissements avec un message clair, ciblé et daté.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => void loadFirstPage()} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Actualiser
            </Button>
            <Button onClick={handleCreateNew}><Plus className="mr-2 h-4 w-4" />Nouvelle annonce</Button>
          </div>
        </div>
        {!isLoading && !loadFailed ? (
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            <Badge variant="outline" className="bg-background/70">{counts.active} active{counts.active > 1 ? "s" : ""}</Badge>
            <Badge variant="outline" className="bg-background/70">{counts.drafts} brouillon{counts.drafts > 1 ? "s" : ""}</Badge>
            {hasMore ? <Badge variant="outline" className="bg-background/70">Résultats supplémentaires disponibles</Badge> : null}
          </div>
        ) : null}
      </section>

      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open)
        if (!open) setEditingAnnouncement(null)
      }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingAnnouncement ? "Modifier l’annonce" : "Créer une annonce"}</DialogTitle>
            <DialogDescription>
              Un statut « actif » diffuse immédiatement le message à l’audience choisie.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl><Input placeholder="Ex. Forum emploi d’Abidjan : inscriptions ouvertes" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl><Textarea rows={6} placeholder="Donnez l’information essentielle, la date, le lieu et la prochaine étape…" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="audience" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audience</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(audienceLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="active">Actif — diffuser</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="expiryDate" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date de fin</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP", { locale: fr }) : "Choisir une date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < endOfToday()} locale={fr} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} disabled={isSaving}>Annuler</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}
                  {editingAnnouncement ? "Enregistrer" : "Créer l’annonce"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Messages enregistrés</CardTitle>
          <CardDescription>Les annonces actives et les brouillons, du plus récent au plus ancien.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted-foreground" aria-live="polite">
              <Loader2 className="h-7 w-7 animate-spin text-primary motion-reduce:animate-none" />
              <p>Chargement des annonces…</p>
            </div>
          ) : loadFailed ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center" role="alert">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="mt-3 font-semibold">Annonces indisponibles</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">La liste n’a pas pu être récupérée. Aucun contenu n’a été modifié.</p>
              <Button variant="outline" className="mt-5" onClick={() => void loadFirstPage()}>Réessayer</Button>
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
              <span className="rounded-2xl bg-muted p-4"><Megaphone className="h-7 w-7 text-muted-foreground" /></span>
              <p className="mt-4 font-semibold">Aucune annonce pour le moment</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">Créez un premier message lorsque vous avez une information utile à partager.</p>
              <Button className="mt-5" onClick={handleCreateNew}><Plus className="mr-2 h-4 w-4" />Créer une annonce</Button>
            </div>
          ) : (
            <div className="divide-y">
              {announcements.map((announcement) => (
                <article key={announcement.id} className="p-5 transition-colors hover:bg-muted/20 sm:p-6">
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={announcement.status === "active" ? "default" : "secondary"}>
                          {announcement.status === "active" ? "Actif" : "Brouillon"}
                        </Badge>
                        <Badge variant="outline"><Users className="mr-1 h-3 w-3" />{audienceLabels[announcement.audience]}</Badge>
                      </div>
                      <h2 className="mt-3 font-display text-xl font-semibold leading-tight">{announcement.title}</h2>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{announcement.contentPreview}</p>
                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5" />
                          {announcement.expiryDate ? `Fin le ${format(announcement.expiryDate, "PPP", { locale: fr })}` : "Sans date de fin"}
                        </span>
                        <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Heure de référence : Abidjan</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Button variant="outline" size="sm" onClick={() => void handleEdit(announcement)} disabled={editingId !== null || deletingId !== null}>
                        {editingId === announcement.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Edit3 className="mr-2 h-4 w-4" />}
                        Modifier
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={deletingId !== null}>
                            {deletingId === announcement.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Supprimer
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer « {announcement.title} » ?</AlertDialogTitle>
                            <AlertDialogDescription>Cette annonce sera définitivement retirée de Yahnu. Cette action est irréversible.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Conserver</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void handleDelete(announcement.id)}>Supprimer définitivement</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </article>
              ))}
              {hasMore ? (
                <div className="flex justify-center border-t p-5">
                  <Button variant="outline" onClick={() => void loadMoreAnnouncements()} disabled={isLoadingMore}>
                    {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}
                    Charger la suite
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
