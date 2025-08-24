
"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, PlusCircle, Edit, Trash2, Users, Building, Clock, MapPin } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

type EventType = "Career Fair" | "Workshop" | "Networking" | "Webinar";

type Event = {
  id: number
  title: string
  date: string
  type: EventType,
  rsvps: number,
  host: string,
  description?: string;
  time?: string;
  location?: string;
}

const initialSchoolEvents: Event[] = [
  { id: 1, title: "Salon Annuel de l'Emploi Technologique", date: "2025-10-20", type: "Career Fair", rsvps: 78, host: "INP-HB", description: "Rencontrez les meilleures entreprises technologiques qui recrutent pour divers postes.", time: "10:00 - 16:00", location: "Grand Auditorium, INP-HB" },
  { id: 2, title: "Atelier IA & Machine Learning", date: "2025-11-05", type: "Workshop", rsvps: 25, host: "INP-HB", description: "Un atelier pratique sur les fondamentaux de l'IA et du Machine Learning.", time: "13:00 - 17:00", location: "En ligne" },
  { id: 3, title: "Soirée de Réseautage des Anciens", date: "2025-11-15", type: "Networking", rsvps: 42, host: "INP-HB", description: "Connectez-vous avec d'autres anciens élèves et développez votre réseau professionnel.", time: "19:00", location: "Salle Sociale de l'Université" },
];

const initialCompanyEvents: Event[] = [
    { id: 4, title: "Journée Recrutement Orange", date: "2025-09-30", type: "Career Fair", rsvps: 150, host: "Orange Côte d'Ivoire", description: "Orange recrute ! Venez découvrir nos offres dans les domaines de la tech, du marketing et de la finance.", time: "09:00 - 17:00", location: "Siège Orange, Abidjan" },
    { id: 5, title: "Webinaire Fintech", date: "2025-10-10", type: "Webinar", rsvps: 65, host: "Bridge Bank Group", description: "Découvrez l'avenir de la finance avec nos experts. Thèmes abordés : mobile money, blockchain et inclusion financière.", time: "18:00 - 19:30", location: "En ligne (lien sur inscription)" },
    { id: 6, title: "Atelier sur la Chaîne d'Approvisionnement", date: "2025-10-18", type: "Workshop", rsvps: 40, host: "Ceva Logistics", description: "Atelier interactif sur les défis et innovations de la logistique moderne en Afrique de l'Ouest.", time: "14:00 - 17:00", location: "Zone portuaire, San-Pédro" },
];

const eventSchema = z.object({
  title: z.string().min(3, "Le titre doit comporter au moins 3 caractères."),
  description: z.string().min(10, "La description doit comporter au moins 10 caractères."),
  date: z.string().min(1, "La date est requise."),
  time: z.string().min(1, "L'heure est requise."),
  location: z.string().min(3, "Le lieu ou le lien est requis."),
  type: z.enum(["Career Fair", "Workshop", "Networking", "Webinar"]),
});

const EventForm = ({ event, onSave, onCancel }: { event?: z.infer<typeof eventSchema>; onSave: (values: z.infer<typeof eventSchema>) => void; onCancel: () => void; }) => {
    const form = useForm<z.infer<typeof eventSchema>>({
        resolver: zodResolver(eventSchema),
        defaultValues: event || {
          title: "",
          description: "",
          date: "",
          time: "",
          location: "",
          type: "Career Fair",
        },
    });
    
    React.useEffect(() => {
        form.reset(event);
    }, [event, form]);

    const onSubmit = (values: z.infer<typeof eventSchema>) => {
        onSave(values);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Titre de l'événement</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><RichTextEditor placeholder="Décrivez l'événement..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="date" render={({ field }) => (
                        <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="time" render={({ field }) => (
                        <FormItem><FormLabel>Heure</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel>Lieu / Lien</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>Type d'événement</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Career Fair">Salon de l'emploi</SelectItem>
                                <SelectItem value="Workshop">Atelier</SelectItem>
                                <SelectItem value="Networking">Réseautage</SelectItem>
                                <SelectItem value="Webinar">Webinaire</SelectItem>
                            </SelectContent>
                        </Select>
                    <FormMessage /></FormItem>
                )} />
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
                    <Button type="submit">Enregistrer l'événement</Button>
                </DialogFooter>
            </form>
        </Form>
    )
}

const EventsTable = ({ events, onEdit, onDelete, showHost, onViewDetails }: { events: Event[], onEdit?: (event: Event) => void, onDelete?: (id: number) => void, showHost?: boolean, onViewDetails?: (event: Event) => void }) => {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Titre de l'événement</TableHead>
                    {showHost && <TableHead>Hôte</TableHead>}
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Inscriptions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {events.map(event => (
                    <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.title}</TableCell>
                        {showHost && <TableCell><div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" />{event.host}</div></TableCell>}
                        <TableCell>{new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric'})}</TableCell>
                        <TableCell>{event.type}</TableCell>
                        <TableCell className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> {event.rsvps}</TableCell>
                        <TableCell className="text-right space-x-2">
                           {onEdit && <Button size="icon" variant="ghost" onClick={() => onEdit(event)}><Edit className="h-4 w-4" /></Button>}
                            {onDelete && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Cette action est irréversible et supprimera définitivement cet événement.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => onDelete(event.id)}>Supprimer</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                             {!onEdit && onViewDetails && <Button size="sm" variant="outline" onClick={() => onViewDetails(event)}>Voir les détails</Button>}
                        </TableCell>
                    </TableRow>
                ))}
                {events.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={showHost ? 6 : 5} className="h-24 text-center">Aucun événement trouvé.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}

export default function SchoolEventsPage() {
  const { toast } = useToast()
  const [schoolEvents, setSchoolEvents] = useState<Event[]>(initialSchoolEvents)
  const [companyEvents] = useState<Event[]>(initialCompanyEvents);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);

  const getFormValuesFromEvent = (event: Event | null): z.infer<typeof eventSchema> => {
      if (!event) {
          return {
            title: "", description: "", date: "", time: "", location: "", type: "Career Fair",
          };
      }
      return {
          title: event.title,
          description: event.description || `Description pour ${event.title}`,
          date: event.date,
          time: event.time || "10:00",
          location: event.location || "Défini dans la description",
          type: event.type,
      };
  };

  const handleCreateClick = () => {
    setEditingEvent(null);
    setIsFormDialogOpen(true);
  }

  const handleEditClick = (event: Event) => {
    setEditingEvent(event);
    setIsFormDialogOpen(true);
  }

  const handleViewDetails = (event: Event) => {
    setViewingEvent(event);
  };

  const handleSaveEvent = (values: z.infer<typeof eventSchema>) => {
    if (editingEvent) {
         setSchoolEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...values } : e));
         toast({ title: "Événement mis à jour", description: `"${values.title}" a été mis à jour.` });
    } else {
        const newEvent: Event = {
            id: Date.now(),
            title: values.title,
            date: values.date,
            type: values.type,
            rsvps: 0,
            host: "INP-HB", // This should be dynamic based on the logged-in school
            description: values.description,
            time: values.time,
            location: values.location
        };
        setSchoolEvents(prev => [newEvent, ...prev]);
        toast({ title: "Événement créé", description: "Les diplômés de votre école ont été notifiés." });
    }
    
    setIsFormDialogOpen(false);
    setEditingEvent(null);
  }

  const handleDeleteEvent = (eventId: number) => {
    setSchoolEvents(schoolEvents.filter(e => e.id !== eventId));
    toast({ title: "Événement supprimé", variant: "destructive" });
  }

  return (
    <motion.div 
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
            <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des événements</h1>
            <p className="text-muted-foreground mt-1">Gérez vos événements et voyez ce que les entreprises organisent.</p>
            </div>
        </div>
        <Dialog open={isFormDialogOpen} onOpenChange={(isOpen) => {
            setIsFormDialogOpen(isOpen);
            if (!isOpen) setEditingEvent(null);
        }}>
            <DialogTrigger asChild>
                <Button onClick={handleCreateClick}><PlusCircle className="mr-2 h-4 w-4" />Créer un événement</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingEvent ? "Modifier l'événement" : "Créer un nouvel événement"}</DialogTitle>
                    <DialogDescription>Remplissez les détails ci-dessous pour planifier un nouvel événement.</DialogDescription>
                </DialogHeader>
                <EventForm event={getFormValuesFromEvent(editingEvent)} onSave={handleSaveEvent} onCancel={() => setIsFormDialogOpen(false)} />
            </DialogContent>
        </Dialog>
      </div>

       <Card>
            <CardHeader>
                <Tabs defaultValue="your-events">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="your-events">Vos événements</TabsTrigger>
                        <TabsTrigger value="company-events">Événements d'entreprise</TabsTrigger>
                    </TabsList>
                    <TabsContent value="your-events" className="mt-4">
                        <CardDescription>Une liste de tous les événements que vous avez programmés.</CardDescription>
                        <EventsTable events={schoolEvents} onEdit={handleEditClick} onDelete={handleDeleteEvent} />
                    </TabsContent>
                    <TabsContent value="company-events" className="mt-4">
                         <CardDescription>Événements organisés par les entreprises sur la plateforme Yahnu.</CardDescription>
                        <EventsTable events={companyEvents} showHost onViewDetails={handleViewDetails} />
                    </TabsContent>
                </Tabs>
            </CardHeader>
        </Card>
        
        <Dialog open={!!viewingEvent} onOpenChange={(open) => !open && setViewingEvent(null)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{viewingEvent?.title}</DialogTitle>
                    <DialogDescription>Organisé par {viewingEvent?.host}</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: viewingEvent?.description || '' }} />
                    <Separator />
                    <div className="text-sm text-muted-foreground space-y-2">
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> <span>{viewingEvent && new Date(viewingEvent.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                        <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> <span>{viewingEvent?.time}</span></div>
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> <span>{viewingEvent?.location}</span></div>
                        <div className="flex items-center gap-2"><Users className="h-4 w-4" /> <span>{viewingEvent?.rsvps} participants inscrits</span></div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setViewingEvent(null)}>Fermer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </motion.div>
  )
}
