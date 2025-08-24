
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Megaphone, Plus, Edit, Trash2, Users, Clock, CalendarIcon, MoreVertical } from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"

type Announcement = {
    id: number;
    title: string;
    content: string;
    audience: 'Tous les utilisateurs' | 'Diplômés' | 'Entreprises' | 'Écoles';
    status: 'active' | 'draft';
    expiryDate: Date;
};

const announcementSchema = z.object({
    title: z.string().min(1, "Le titre est requis."),
    content: z.string().min(1, "Le contenu est requis."),
    audience: z.enum(['Tous les utilisateurs', 'Diplômés', 'Entreprises', 'Écoles']),
    status: z.enum(['active', 'draft']),
    expiryDate: z.date({
        required_error: "Une date d'expiration est requise.",
    }),
});

export default function AnnouncementsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [announcements, setAnnouncements] = useState<Announcement[]>([
        {
            id: 1,
            title: "Maintenance programmée de la plateforme",
            content: "Nous effectuerons une maintenance programmée sur la plateforme de 2h00 à 4h00 EST le 20 janvier. Pendant ce temps, certaines fonctionnalités peuvent être temporairement indisponibles.",
            audience: "Tous les utilisateurs",
            status: "active",
            expiryDate: new Date("2024-01-25"),
        },
        {
            id: 2,
            title: "Nouvel algorithme de correspondance d'emploi",
            content: "Nous avons amélioré notre algorithme de correspondance d'emploi pour fournir de meilleures recommandations aux diplômés. Mettez à jour votre profil pour obtenir les suggestions d'emploi les plus pertinentes.",
            audience: "Diplômés",
            status: "active",
            expiryDate: new Date("2024-02-15"),
        },
    ]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

    const form = useForm<z.infer<typeof announcementSchema>>({
        resolver: zodResolver(announcementSchema),
        defaultValues: {
            title: "",
            content: "",
            audience: "Tous les utilisateurs",
            status: "draft",
        },
    });

    const handleCreateNew = () => {
        setEditingAnnouncement(null);
        form.reset({
            title: "",
            content: "",
            audience: "Tous les utilisateurs",
            status: "draft",
            expiryDate: undefined,
        });
        setIsFormOpen(true);
    };

    const handleEdit = (announcement: Announcement) => {
        setEditingAnnouncement(announcement);
        form.reset(announcement);
        setIsFormOpen(true);
    };

    const handleDelete = (id: number) => {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
    };

    const onSubmit = async (values: z.infer<typeof announcementSchema>) => {
        if (editingAnnouncement) {
            setAnnouncements(prev => prev.map(a => a.id === editingAnnouncement.id ? { ...a, ...values } : a));
        } else {
            setAnnouncements(prev => [...prev, { ...values, id: Date.now() }]);
        }

        try {
            await addDoc(collection(db, "notifications"), {
                recipientRole: 'content_manager',
                text: `Une annonce a été ${editingAnnouncement ? 'mise à jour' : 'créée'}: "${values.title}"`,
                link: '/dashboard/admin/announcements',
                type: 'announcement',
                createdAt: serverTimestamp(),
                createdBy: user?.uid,
            });
        } catch (e) {
            console.error("Error creating notification for announcement:", e);
            toast({ title: "Erreur de Notification", description: "L'annonce a été sauvegardée, mais la notification a échoué.", variant: "destructive" });
        }

        setIsFormOpen(false);
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
                                                        <SelectItem value="Tous les utilisateurs">Tous les utilisateurs</SelectItem>
                                                        <SelectItem value="Diplômés">Diplômés</SelectItem>
                                                        <SelectItem value="Entreprises">Entreprises</SelectItem>
                                                        <SelectItem value="Écoles">Écoles</SelectItem>
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
                                    <Button type="submit">Enregistrer</Button>
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
                                        <p className="text-muted-foreground mb-4">{announcement.content}</p>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                <span>{announcement.audience}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                <span>Expire le: {format(announcement.expiryDate, "PPP", { locale: fr })}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(announcement)}>
                                            <Edit className="h-4 w-4 mr-1" />
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
                                                    <AlertDialogAction onClick={() => handleDelete(announcement.id)}>
                                                        Supprimer
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
