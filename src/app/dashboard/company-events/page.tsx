
"use client"

import React, { useState } from "react"
import { useLocalization } from "@/context/localization-context"
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
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  date: z.string().min(1, "Date is required."),
  time: z.string().min(1, "Time is required."),
  location: z.string().min(3, "Location or link is required."),
  type: z.enum(["Career Fair", "Workshop", "Networking", "Webinar"]),
  targetAudience: z.enum(["all", "specific"]),
  targetLocation: z.string().optional(),
  targetSkills: z.string().optional(),
  targetGradYear: z.string().optional(),
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
                    <FormItem><FormLabel>{t('Event Title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>{t('Description')}</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
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

                <Card className="p-4 bg-muted/50">
                    <CardHeader className="p-2">
                        <CardTitle className="text-base">{t('Target Audience')}</CardTitle>
                        <CardDescription className="text-xs">{t('Choose who to invite to this event.')}</CardDescription>
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
                                        <FormLabel className="font-normal">{t('All Graduates')}</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl><RadioGroupItem value="specific" /></FormControl>
                                        <FormLabel className="font-normal">{t('Specific Group')}</FormLabel>
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
                                    <FormItem><FormLabel>{t('Location')}</FormLabel><FormControl><Input placeholder={t("e.g. Abidjan")} {...field} /></FormControl></FormItem>
                                )}/>
                                 <FormField control={form.control} name="targetSkills" render={({ field }) => (
                                    <FormItem><FormLabel>{t('Skills')}</FormLabel><FormControl><Input placeholder={t("e.g. React, TypeScript")} {...field} /></FormControl></FormItem>
                                )}/>
                                 <FormField control={form.control} name="targetGradYear" render={({ field }) => (
                                    <FormItem><FormLabel>{t('Graduation Year')}</FormLabel><FormControl><Input placeholder="e.g. 2024" type="number" {...field} /></FormControl></FormItem>
                                )}/>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <DialogFooter>
                    <Button type="submit">{t('Save Event')}</Button>
                </DialogFooter>
            </form>
        </Form>
    )
}

export default function CompanyEventsPage() {
  const { t } = useLocalization()
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
      target: values.targetAudience === 'all' ? t('All Graduates') : t('Specific Group')
    };
    setEvents(prev => [newEvent, ...prev]);
    toast({ title: t("Event Created"), description: t("Notifications have been sent to the target audience.") });
    setIsDialogOpen(false);
  }

  const handleDeleteEvent = (eventId: number) => {
    setEvents(events.filter(e => e.id !== eventId));
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
            <p className="text-muted-foreground mt-1">{t('Create and manage events to engage with potential candidates.')}</p>
            </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" />{t('Create Event')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
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
                <CardTitle>{t('Your Events')}</CardTitle>
                <CardDescription>{t('A list of all events you have scheduled.')}</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>{t('Event Title')}</TableHead>
                        <TableHead>{t('Date')}</TableHead>
                        <TableHead>{t('Type')}</TableHead>
                        <TableHead>{t('Target')}</TableHead>
                        <TableHead>{t('RSVPs')}</TableHead>
                        <TableHead className="text-right">{t('Actions')}</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                        {events.map(event => (
                        <TableRow key={event.id}>
                            <TableCell className="font-medium">{t(event.title)}</TableCell>
                            <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                            <TableCell>{t(event.type)}</TableCell>
                            <TableCell><div className="flex items-center gap-1"><Target className="h-4 w-4 text-muted-foreground" /> {t(event.target)}</div></TableCell>
                            <TableCell className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> {event.rsvps}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button size="icon" variant="ghost"><Edit className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDeleteEvent(event.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
                        </TableRow>
                        ))}
                        {events.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">{t('No events created yet.')}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  )
}
