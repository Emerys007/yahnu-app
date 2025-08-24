
"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, PlusCircle, Edit, Trash2, Users, Building } from "lucide-react"
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
  host: string
}

const initialSchoolEvents: Event[] = [
  { id: 1, title: "Annual Tech Career Fair", date: "2025-10-20", type: "Career Fair", rsvps: 78, host: "INP-HB" },
  { id: 2, title: "AI & Machine Learning Workshop", date: "2025-11-05", type: "Workshop", rsvps: 25, host: "INP-HB" },
  { id: 3, title: "Alumni Networking Night", date: "2025-11-15", type: "Networking", rsvps: 42, host: "INP-HB" },
];

const initialCompanyEvents: Event[] = [
    { id: 4, title: "Recruitment Day", date: "2025-09-30", type: "Career Fair", rsvps: 150, host: "Tech Solutions Abidjan" },
    { id: 5, title: "Fintech Webinar", date: "2025-10-10", type: "Webinar", rsvps: 65, host: "Finance & Forte" },
];

const eventSchema = z.object({
  title: z.string().min(3, "Le titre doit comporter au moins 3 caractères."),
  description: z.string().min(10, "La description doit comporter au moins 10 caractères."),
  date: z.string().min(1, "La date est requise."),
  time: z.string().min(1, "L'heure est requise."),
  location: z.string().min(3, "Le lieu ou le lien est requis."),
  type: z.enum(["Career Fair", "Workshop", "Networking", "Webinar"]),
});

const EventForm = ({ event, onSave }: { event?: z.infer<typeof eventSchema>; onSave: (values: z.infer<typeof eventSchema>) => void }) => {
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
                    <FormItem><FormLabel>Description</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>
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
                    <Button type="submit">Enregistrer l'événement</Button>
                </DialogFooter>
            </form>
        </Form>
    )
}

const EventsTable = ({ events, onAction, showHost, canEdit }: { events: Event[], onAction: (id: number) => void, showHost?: boolean, canEdit?: boolean }) => {
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
                        {showHost && <TableCell>{event.host}</TableCell>}
                        <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                        <TableCell>{event.type}</TableCell>
                        <TableCell className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> {event.rsvps}</TableCell>
                        <TableCell className="text-right space-x-2">
                            {canEdit && <Button size="icon" variant="ghost"><Edit className="h-4 w-4" /></Button>}
                            {canEdit && <Button size="icon" variant="ghost" onClick={() => onAction(event.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                            {!canEdit && <Button size="sm" variant="outline">Voir les détails</Button>}
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
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCreateEvent = (values: z.infer<typeof eventSchema>) => {
    const newEvent: Event = {
      id: Date.now(),
      title: values.title,
      date: values.date,
      type: values.type,
      rsvps: 0,
      host: "INP-HB" // This should be dynamic based on the logged-in school
    };
    setSchoolEvents(prev => [newEvent, ...prev]);
    toast({ title: "Événement créé", description: "Les diplômés de votre école ont été notifiés." });
    setIsDialogOpen(false);
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" />Créer un événement</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Créer un nouvel événement</DialogTitle>
                    <DialogDescription>Remplissez les détails ci-dessous pour planifier un nouvel événement.</DialogDescription>
                </DialogHeader>
                <EventForm onSave={handleCreateEvent} />
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
                        <EventsTable events={schoolEvents} onAction={handleDeleteEvent} canEdit />
                    </TabsContent>
                    <TabsContent value="company-events" className="mt-4">
                         <CardDescription>Événements organisés par les entreprises sur la plateforme Yahnu.</CardDescription>
                        <EventsTable events={companyEvents} onAction={() => {}} showHost />
                    </TabsContent>
                </Tabs>
            </CardHeader>
        </Card>
    </motion.div>
  )
}
