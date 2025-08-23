
"use client"

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Check, Star, X, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

type EventType = "Career Fair" | "Workshop" | "Networking" | "Webinar";
type RsvpStatus = "going" | "interested" | "not_going" | null;

type Event = {
  id: number;
  title: string;
  host: string;
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
    title: "Salon Annuel de l'Emploi Technologique",
    host: "INP-HB",
    description: "Rencontrez les meilleures entreprises technologiques qui recrutent pour divers postes. Apportez votre CV et soyez prêt pour des entretiens sur place.",
    date: "2025-10-20",
    time: "10:00 - 16:00",
    location: "Grand Auditorium, INP-HB",
    type: "Career Fair",
    rsvp: null,
  },
  {
    id: 2,
    title: "Atelier IA & Machine Learning",
    host: "Google",
    description: "Un atelier pratique sur les fondamentaux de l'IA et du Machine Learning, animé par des experts de l'industrie de Google.",
    date: "2025-11-05",
    time: "13:00 - 17:00",
    location: "En ligne (Lien Zoom sera partagé)",
    type: "Workshop",
    rsvp: "interested",
  },
  {
    id: 3,
    title: "Soirée de Réseautage des Anciens",
    host: "INP-HB",
    description: "Connectez-vous avec d'autres anciens élèves et développez votre réseau professionnel. Une soirée de belles conversations et d'opportunités.",
    date: "2025-11-15",
    time: "19:00 et plus",
    location: "Salle Sociale de l'Université",
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

const eventTypeTranslations: Record<EventType, string> = {
    "Career Fair": "Salon de l'emploi",
    "Workshop": "Atelier",
    "Networking": "Réseautage",
    "Webinar": "Webinaire",
};


const rsvpOptions: { status: RsvpStatus, label: string, icon: React.ElementType }[] = [
    { status: "going", label: "Participe", icon: Check },
    { status: "interested", label: "Intéressé(e)", icon: Star },
    { status: "not_going", label: "Ne participe pas", icon: X },
];

export default function GraduateEventsPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>(initialEvents);

  const handleRsvp = (eventId: number, status: RsvpStatus) => {
    setEvents(events.map(e => e.id === eventId ? { ...e, rsvp: status } : e));
    toast({
        title: "RSVP envoyé",
        description: "Votre réponse a été enregistrée.",
    });
  }

  const getRsvpButtonContent = (status: RsvpStatus) => {
    if (!status) {
        return <>RSVP</>;
    }
    const option = rsvpOptions.find(o => o.status === status);
    if (!option) {
        return <>RSVP</>;
    }
    const Icon = option.icon;
    return <><Icon className="mr-2 h-4 w-4" /> {option.label}</>;
  }


  return (
    <motion.div 
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Événements à venir</h1>
                <p className="text-muted-foreground mt-1">Découvrez des événements exclusifs organisés par votre école et les meilleures entreprises.</p>
            </div>
        </div>
        
        {events.length > 0 ? (
            <motion.div 
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.1 } }
                }}
                initial="hidden"
                animate="visible"
            >
            {events.map((event) => (
                <motion.div
                    key={event.id}
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                    }}
                >
                    <Card className="flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <Badge variant="secondary" className={`self-start ${eventTypeColors[event.type]}`}>{eventTypeTranslations[event.type]}</Badge>
                                <p className="text-xs font-semibold text-muted-foreground">Organisé par {event.host}</p>
                            </div>
                            <CardTitle className="pt-2">{event.title}</CardTitle>
                         <CardDescription className="flex items-center gap-2 text-sm">
                         <Calendar className="h-4 w-4" />{" "}
                         {new Date(event.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                         </CardDescription>

                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-muted-foreground text-sm mb-4">{event.description}</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> {event.time}</div>
                                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {event.location}</div>
                            </div>
                        </CardContent>
                        <CardFooter>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant={event.rsvp ? 'default' : 'outline'} className="w-full">
                                        {getRsvpButtonContent(event.rsvp)}
                                        <ChevronDown className="ml-auto h-4 w-4"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[--radix-dropdown-menu-trigger-width]">
                                    {rsvpOptions.map(option => (
                                        <DropdownMenuItem key={option.status} onClick={() => handleRsvp(event.id, option.status)}>
                                            <option.icon className="mr-2 h-4 w-4" />
                                            <span>{option.label}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                             </DropdownMenu>
                        </CardFooter>
                    </Card>
                </motion.div>
            ))}
            </motion.div>
        ) : (
            <Card className="py-24">
                <CardContent className="text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-2xl font-bold">Aucun événement à venir</h2>
                    <p className="text-muted-foreground mt-2">Revenez plus tard pour les événements de votre école et des entreprises.</p>
                </CardContent>
            </Card>
        )}
    </motion.div>
  )
}
