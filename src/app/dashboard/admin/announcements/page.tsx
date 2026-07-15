
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Megaphone, Plus, Edit, Trash2, Users, Clock, CalendarIcon, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api-client"

type Announcement = {
    id: string;
    title: string;
    content: string;
    audience: 'all' | 'graduate' | 'company' | 'school';
    status: 'active' | 'draft';
    expiryDate: Date;
};

type AnnouncementSummary = Omit<Announcement, 'content'> & { contentPreview: string };
type ApiAnnouncement = Omit<Announcement, 'expiryDate'> & { expiresAt: string | null };
type ApiAnnouncementSummary = Omit<ApiAnnouncement, 'content'> & { contentPreview: string };
type AnnouncementsResponse = { data: { announcements: ApiAnnouncementSummary[]; hasMore: boolean; nextOffset: number | null } };
type AnnouncementResponse = { data: { announcement: ApiAnnouncement } };

const PAGE_SIZE = 30;

const fromApi = (announcement: ApiAnnouncement): Announcement => ({
    ...announcement,
    expiryDate: announcement.expiresAt ? new Date(announcement.expiresAt) : new Date(Date.now() + 30 * 86400000),
});

const previewContent = (content: string) => content.length <= 480 ? content : `${content.slice(0, 477).trimEnd()}...`;

const summaryFromApi = (announcement: ApiAnnouncementSummary): AnnouncementSummary => ({
    ...announcement,
    expiryDate: announcement.expiresAt ? new Date(announcement.expiresAt) : new Date(Date.now() + 30 * 86400000),
});

const summaryFromAnnouncement = (announcement: Announcement): AnnouncementSummary => ({
    id: announcement.id,
    title: announcement.title,
    contentPreview: previewContent(announcement.content),
    audience: announcement.audience,
    status: announcement.status,
    expiryDate: announcement.expiryDate,
});

const fetchAnnouncements = (offset = 0) => apiFetch<AnnouncementsResponse>(`/api/announcements?limit=${PAGE_SIZE}&offset=${offset}`);

const announcementSchema = z.object({
    title: z.string().min(1, "Le titre est requis."),
    content: z.string().min(1, "Le contenu est requis."),
    audience: z.enum(['all', 'graduate', 'company', 'school']),
    status: z.enum(['active', 'draft']),
    expiryDate: z.date({
        required_error: "Une date d'expiration est requise.",
    }),
});

export default function AnnouncementsPage() {
    const { toast } = useToast();
    const [announcements, setAnnouncements] = useState<AnnouncementSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextOffset, setNextOffset] = useState(0);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

    const form = useForm<z.infer<typeof announcementSchema>>({
        resolver: zodResolver(announcementSchema),
        defaultValues: {
            title: "",
            content: "",
            audience: "all",
            status: "draft",
        },
    });

    useEffect(() => {
        fetchAnnouncements()
            .then((response) => {
                setAnnouncements(response.data.announcements.map(summaryFromApi));
                setHasMore(response.data.hasMore);
                setNextOffset(response.data.nextOffset ?? 0);
            })
            .catch((error) => toast({
                title: 'Chargement impossible',
                description: error instanceof Error ? error.message : 'Les annonces sont temporairement indisponibles.',
                variant: 'destructive',
            }))
            .finally(() => setIsLoading(false));
    }, [toast]);

    const loadMoreAnnouncements = async () => {
        if (!hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const response = await fetchAnnouncements(nextOffset);
            const loaded = response.data.announcements.map(summaryFromApi);
            setAnnouncements((current) => [...current, ...loaded.filter((announcement) => !current.some((existing) => existing.id === announcement.id))]);
            setHasMore(response.data.hasMore);
            setNextOffset(response.data.nextOffset ?? 0);
        } catch (error) {
            toast({
                title: 'Chargement impossible',
                description: error instanceof Error ? error.message : 'Impossible de charger davantage d’annonces.',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleCreateNew = () => {
        setEditingAnnouncement(null);
        form.reset({
            title: "",
            content: "",
            audience: "all",
            status: "draft",
            expiryDate: undefined,
        });
        setIsFormOpen(true);
    };

    const handleEdit = async (announcement: AnnouncementSummary) => {
        setEditingId(announcement.id);
        try {
            const response = await apiFetch<AnnouncementResponse>(`/api/announcements/${encodeURIComponent(announcement.id)}`);
            const fullAnnouncement = fromApi(response.data.announcement);
            setEditingAnnouncement(fullAnnouncement);
            form.reset(fullAnnouncement);
            setIsFormOpen(true);
        } catch (error) {
            toast({
                title: 'Chargement impossible',
                description: error instanceof Error ? error.message : 'Impossible de charger cette annonce.',
                variant: 'destructive',
            });
        } finally {
            setEditingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await apiFetch(`/api/announcements/${encodeURIComponent(id)}`, { method: 'DELETE' });
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            toast({ title: 'Suppression impossible', description: error instanceof Error ? error.message : 'Veuillez réessayer.', variant: 'destructive' });
        }
    };

    const onSubmit = async (values: z.infer<typeof announcementSchema>) => {
        setIsSaving(true);
        try {
            const endpoint = editingAnnouncement
                ? `/api/announcements/${encodeURIComponent(editingAnnouncement.id)}`
                : '/api/announcements';
            const response = await apiFetch<AnnouncementResponse>(endpoint, {
                method: editingAnnouncement ? 'PATCH' : 'POST',
                body: JSON.stringify({
                    title: values.title,
                    content: values.content,
                    audience: values.audience,
                    status: values.status,
                    expiresAt: values.expiryDate.toISOString(),
                }),
            });
            const saved = summaryFromAnnouncement(fromApi(response.data.announcement));
            setAnnouncements((current) => editingAnnouncement
                ? current.map((announcement) => announcement.id === editingAnnouncement.id ? saved : announcement)
                : [saved, ...current]);
            setIsFormOpen(false);
            toast({ title: editingAnnouncement ? 'Annonce mise à jour' : 'Annonce créée' });
        } catch (error) {
            toast({ title: 'Enregistrement impossible', description: error instanceof Error ? error.message : 'Veuillez réessayer.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const audienceLabels: Record<Announcement['audience'], string> = {
        all: 'Tous les utilisateurs',
        graduate: 'Diplômés',
        company: 'Entreprises',
        school: 'Écoles',
    };

    return (
        <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        <Megaphone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Annonces</h1>
                        <p className="text-muted-foreground mt-1">Créez et gérez les annonces à l'échelle de la plateforme.</p>
                    </div>
                </div>
                 <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleCreateNew}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nouvelle Annonce
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                        <DialogHeader>
                            <DialogTitle>{editingAnnouncement ? "Modifier l'annonce" : "Créer une nouvelle annonce"}</DialogTitle>
                            <DialogDescription>
                                Remplissez les détails ci-dessous. Cliquez sur 'Enregistrer' lorsque vous avez terminé.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Titre</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Ex: Maintenance de la plateforme" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contenu</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Décrivez l'annonce..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="audience"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Audience</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Sélectionner l'audience" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="all">Tous les utilisateurs</SelectItem>
                                                        <SelectItem value="graduate">Diplômés</SelectItem>
                                                        <SelectItem value="company">Entreprises</SelectItem>
                                                        <SelectItem value="school">Écoles</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Statut</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Sélectionner le statut" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="active">Actif</SelectItem>
                                                        <SelectItem value="draft">Brouillon</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="expiryDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Date d'expiration</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP", { locale: fr })
                                                            ) : (
                                                                <span>Choisir une date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) => date < new Date()}
                                                        initialFocus
                                                        locale={fr}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Annuler</Button>
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Enregistrer
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Annonces Actives</CardTitle>
                    <CardDescription>Gérez les annonces de la plateforme.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : null}
                        {!isLoading && announcements.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Aucune annonce enregistrée.</p> : null}
                        {announcements.map((announcement) => (
                            <motion.div 
                                key={announcement.id} 
                                className="border rounded-lg p-6 space-y-4"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-semibold">{announcement.title}</h3>
                                            <Badge variant={announcement.status === 'active' ? 'default' : 'secondary'}>
                                                {announcement.status === 'active' ? 'Actif' : 'Brouillon'}
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground mb-4">{announcement.contentPreview}</p>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                <span>{audienceLabels[announcement.audience]}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                <span>Expire le: {format(announcement.expiryDate, "PPP", { locale: fr })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => void handleEdit(announcement)} disabled={editingId !== null}>
                                            {editingId === announcement.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Edit className="h-4 w-4 mr-1" />}
                                            Modifier
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm">
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Supprimer
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Cette action ne peut pas être annulée. Cela supprimera définitivement cette annonce.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => void handleDelete(announcement.id)}>
                                                        Supprimer
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {hasMore ? (
                            <div className="flex justify-center pt-2">
                                <Button variant="outline" onClick={() => void loadMoreAnnouncements()} disabled={isLoadingMore}>
                                    {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Afficher plus d&apos;annonces
                                </Button>
                            </div>
                        ) : null}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
