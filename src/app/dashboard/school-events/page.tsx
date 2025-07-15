
"use client"

import React, { useState } from "react"
import { useLocalization } from "@/context/localization-context"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"


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
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  date: z.string().min(1, "Date is required."),
  time: z.string().min(1, "Time is required."),
  location: z.string().min(3, "Location or link is required."),
  type: z.enum(["Career Fair", "Workshop", "Networking", "Webinar"]),
});

const EventForm = ({ event, onSave }: { event?: z.infer<typeof eventSchema>; onSave: (values: z.infer<typeof eventSchema>) => void }) => {
    const { t } = useLocalization();
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
                    <FormItem><FormLabel>{t('Event Title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>{t('Description')}</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="date" render={({ field }) => (
                        <FormItem><FormLabel>{t('Date')}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="time" render={({ field }) => (
                        <FormItem><FormLabel>{t('Time')}</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel>{t('Location / Link')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>{t('Event Type')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Career Fair">{t('Career Fair')}</SelectItem>
                                <SelectItem value="Workshop">{t('Workshop')}</SelectItem>
                                <SelectItem value="Networking">{t('Networking')}</SelectItem>
                                <SelectItem value="Webinar">{t('Webinar')}</SelectItem>
                            </SelectContent>
                        </Select>
                    <FormMessage /></FormItem>
                )} />
                <DialogFooter>
                    <Button type="submit">{t('Save Event')}</Button>
                </DialogFooter>
            </form>
        </Form>
    )
}

const EventsTable = ({ events, onAction, showHost, canEdit }: { events: Event[], onAction: (id: number) => void, showHost?: boolean, canEdit?: boolean }) => {
    const { t } = useLocalization();
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{t('Event Title')}</TableHead>
                    {showHost && <TableHead>{t('Host')}</TableHead>}
                    <TableHead>{t('Date')}</TableHead>
                    <TableHead>{t('Type')}</TableHead>
                    <TableHead>{t('RSVPs')}</TableHead>
                    <TableHead className="text-right">{t('Actions')}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {events.map(event => (
                    <TableRow key={event.id}>
                        <TableCell className="font-medium">{t(event.title)}</TableCell>
                        {showHost && <TableCell>{t(event.host)}</TableCell>}
                        <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                        <TableCell>{t(event.type)}</TableCell>
                        <TableCell className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> {event.rsvps}</TableCell>
                        <TableCell className="text-right space-x-2">
                            {canEdit && <Button size="icon" variant="ghost"><Edit className="h-4 w-4" /></Button>}
                            {canEdit && <Button size="icon" variant="ghost" onClick={() => onAction(event.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                            {!canEdit && <Button size="sm" variant="outline">{t('View Details')}</Button>}
                        </TableCell>
                    </TableRow>
                ))}
                {events.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={showHost ? 6 : 5} className="h-24 text-center">{t('No events found.')}</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    )
}

export default function SchoolEventsPage() {
  const { t } = useLocalization()
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
    toast({ title: t("Event Created"), description: t("Graduates from your school have been notified.") });
    setIsDialogOpen(false);
  }

  const handleDeleteEvent = (eventId: number) => {
    setSchoolEvents(schoolEvents.filter(e => e.id !== eventId));
    toast({ title: t("Event Deleted"), variant: "destructive" });
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
            <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('Event Management')}</h1>
            <p className="text-muted-foreground mt-1">{t('Manage your events and see what companies are hosting.')}</p>
            </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" />{t('Create Event')}</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('Create a New Event')}</DialogTitle>
                    <DialogDescription>{t('Fill in the details below to schedule a new event.')}</DialogDescription>
                </DialogHeader>
                <EventForm onSave={handleCreateEvent} />
            </DialogContent>
        </Dialog>
      </div>

       <Card>
            <CardHeader>
                <Tabs defaultValue="your-events">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="your-events">{t('Your Events')}</TabsTrigger>
                        <TabsTrigger value="company-events">{t('Company Events')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="your-events" className="mt-4">
                        <CardDescription>{t('A list of all events you have scheduled.')}</CardDescription>
                        <EventsTable events={schoolEvents} onAction={handleDeleteEvent} canEdit />
                    </TabsContent>
                    <TabsContent value="company-events" className="mt-4">
                         <CardDescription>{t("Events hosted by companies on the Yahnu platform.")}</CardDescription>
                        <EventsTable events={companyEvents} onAction={() => {}} showHost />
                    </TabsContent>
                </Tabs>
            </CardHeader>
        </Card>
    </div>
  )
}
