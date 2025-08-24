
"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, PlusCircle, Edit, Trash2, Users, Target } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { motion } from "framer-motion"

type EventType = "Career Fair" | "Workshop" | "Networking" | "Webinar";

type Event = {
  id: number
  title: string
  date: string
  type: EventType,
  rsvps: number,
  target: string
}

const initialEvents: Event[] = [
  { id: 1, title: "Tech Recruitment Day", date: "2025-09-30", type: "Career Fair", rsvps: 150, target: "All Graduates" },
  { id: 2, title: "Fintech Webinar", date: "2025-10-10", type: "Webinar", rsvps: 65, target: "Finance Graduates" },
];

const eventSchema = z.object({
  title: z.string().min(3, "Le titre doit comporter au moins 3 caractères."),
  description: z.string().min(10, "La description doit comporter au moins 10 caractères."),
  date: z.string().min(1, "La date est requise."),
  time: z.string().min(1, "L'heure est requise."),
  location: z.string().min(3, "Le lieu ou le lien est requis."),
  type: z.enum(["Career Fair", "Workshop", "Networking", "Webinar"]),
  targetAudience: z.enum(["all", "specific"]),
  targetLocation: z.string().optional(),
  targetSkills: z.string().optional(),
  targetGradYear: z.string().optional(),
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
          targetAudience: "all",
          targetLocation: "",
          targetSkills: "",
          targetGradYear: "",
        },
    });

    const onSubmit = (values: z.infer<typeof eventSchema>) => {
        onSave(values);
    };

    const targetAudience = form.watch("targetAudience");

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Titre de l'événement</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
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

                <Card className="p-4 bg-muted/50">
                    <CardHeader className="p-2">
                        <CardTitle className="text-base">Public cible</CardTitle>
                        <CardDescription className="text-xs">Choisissez qui inviter à cet événement.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-2">
                         <FormField
                            control={form.control}
                            name="targetAudience"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex items-center space-x-4"
                                    >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="all" /></FormControl>
                                        <FormLabel className="font-normal">Tous les diplômés</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="specific" /></FormControl>
                                        <FormLabel className="font-normal">Groupe spécifique</FormLabel>
                                    </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                        {targetAudience === 'specific' && (
                            <div className="space-y-4 pt-4">
                                <FormField control={form.control} name="targetLocation" render={({ field }) => (
                                    <FormItem><FormLabel>Lieu</FormLabel><FormControl><Input placeholder={"Ex: Abidjan"} {...field} /></FormControl></FormItem>
                                )}/>
                                 <FormField control={form.control} name="targetSkills" render={({ field }) => (
                                    <FormItem><FormLabel>Compétences</FormLabel><FormControl><Input placeholder={"Ex: React, TypeScript"} {...field} /></FormControl></FormItem>
                                )}/>
                                 <FormField control={form.control} name="targetGradYear" render={({ field }) => (
                                    <FormItem><FormLabel>Année de diplôme</FormLabel><FormControl><Input placeholder="Ex: 2024" type="number" {...field} /></FormControl></FormItem>
                                )}/>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <DialogFooter>
                    <Button type="submit">Enregistrer l'événement</Button>
                </DialogFooter>
            </form>
        </Form>
    )
}

export default function CompanyEventsPage() {
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCreateEvent = (values: z.infer<typeof eventSchema>) => {
    const newEvent: Event = {
      id: Date.now(),
      title: values.title,
      date: values.date,
      type: values.type,
      rsvps: 0,
      target: values.targetAudience === 'all' ? 'Tous les diplômés' : 'Groupe spécifique'
    };
    setEvents(prev => [newEvent, ...prev]);
    toast({ title: "Événement créé", description: "Des notifications ont été envoyées au public cible." });
    setIsDialogOpen(false);
  }

  const handleDeleteEvent = (eventId: number) => {
    setEvents(events.filter(e => e.id !== eventId));
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
            <p className="text-muted-foreground mt-1">Créez et gérez des événements pour interagir avec des candidats potentiels.</p>
            </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" />Créer un événement</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
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
                <CardTitle>Vos événements</CardTitle>
                <CardDescription>Une liste de tous les événements que vous avez programmés.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Titre de l'événement</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Cible</TableHead>
                        <TableHead>Inscriptions</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events.map(event => (
                        <TableRow key={event.id}>
                            <TableCell className="font-medium">{event.title}</TableCell>
                            <TableCell>
                                {new Date(event.date).toLocaleDateString('fr-FR', {
                                    day: '2-digit', month: 'long', year: 'numeric'
                                })}
                            </TableCell>
                            <TableCell>{event.type}</TableCell>
                            <TableCell><div className="flex items-center gap-1"><Target className="h-4 w-4 text-muted-foreground" /> {event.target}</div></TableCell>
                            <TableCell className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> {event.rsvps}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button size="icon" variant="ghost"><Edit className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDeleteEvent(event.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
                        </TableRow>
                        ))}
                        {events.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">Aucun événement créé pour le moment.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </motion.div>
  )
}
