
"use client"

import { useState } from "react";
import { useLocalization } from "@/context/localization-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Tag, Users, Check, Star, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type EventType = "Career Fair" | "Workshop" | "Networking" | "Webinar";
type RsvpStatus = "going" | "interested" | "not_going" | null;

type Event = {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: EventType;
  rsvp: RsvpStatus;
};

const initialEvents: Event[] = [
  {
    id: 1,
    title: "Annual Tech Career Fair",
    description: "Meet with top tech companies hiring for various roles. Bring your resume and be prepared for on-the-spot interviews.",
    date: "2025-10-20",
    time: "10:00 AM - 4:00 PM",
    location: "Grand Auditorium, INP-HB",
    type: "Career Fair",
    rsvp: null,
  },
  {
    id: 2,
    title: "AI & Machine Learning Workshop",
    description: "A hands-on workshop covering the fundamentals of AI and Machine Learning. Led by industry experts from Google.",
    date: "2025-11-05",
    time: "1:00 PM - 5:00 PM",
    location: "Online (Zoom Link will be shared)",
    type: "Workshop",
    rsvp: "interested",
  },
  {
    id: 3,
    title: "Alumni Networking Night",
    description: "Connect with fellow alumni and expand your professional network. An evening of great conversations and opportunities.",
    date: "2025-11-15",
    time: "7:00 PM onwards",
    location: "University Social Hall",
    type: "Networking",
    rsvp: null,
  },
];

const eventTypeColors: Record<EventType, string> = {
    "Career Fair": "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    "Workshop": "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    "Networking": "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    "Webinar": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
};


export default function GraduateEventsPage() {
  const { t } = useLocalization();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>(initialEvents);

  const handleRsvp = (eventId: number, status: RsvpStatus) => {
    setEvents(events.map(e => e.id === eventId ? { ...e, rsvp: status } : e));
    toast({
        title: t("RSVP Submitted"),
        description: t("Your response has been recorded."),
    });
  }

  return (
    <div className="space-y-8">
        <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('Upcoming Events')}</h1>
                <p className="text-muted-foreground mt-1">{t('Discover exclusive events hosted by your school.')}</p>
            </div>
        </div>
        
        {events.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
                <Card key={event.id} className="flex flex-col">
                    <CardHeader>
                        <Badge variant="secondary" className={`self-start ${eventTypeColors[event.type]}`}>{t(event.type)}</Badge>
                        <CardTitle className="pt-2">{t(event.title)}</CardTitle>
                        <CardDescription className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4" /> {new Date(event.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-muted-foreground text-sm mb-4">{t(event.description)}</p>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {t(event.time)}</div>
                            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {t(event.location)}</div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start gap-2">
                         <p className="text-xs font-semibold text-muted-foreground">{t('Will you attend?')}</p>
                         <div className="flex gap-2 w-full">
                            <Button size="sm" variant={event.rsvp === 'going' ? 'default' : 'outline'} className="flex-1" onClick={() => handleRsvp(event.id, 'going')}><Check className="mr-2 h-4 w-4" />{t('Going')}</Button>
                            <Button size="sm" variant={event.rsvp === 'interested' ? 'default' : 'outline'} className="flex-1" onClick={() => handleRsvp(event.id, 'interested')}><Star className="mr-2 h-4 w-4" />{t('Interested')}</Button>
                            <Button size="sm" variant={event.rsvp === 'not_going' ? 'default' : 'outline'} className="flex-1" onClick={() => handleRsvp(event.id, 'not_going')}><X className="mr-2 h-4 w-4" />{t('Not Going')}</Button>
                         </div>
                    </CardFooter>
                </Card>
            ))}
            </div>
        ) : (
            <Card className="py-24">
                <CardContent className="text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-2xl font-bold">{t('No Upcoming Events')}</h2>
                    <p className="text-muted-foreground mt-2">{t('Check back later for events from your school.')}</p>
                </CardContent>
            </Card>
        )}
    </div>
  )
}
