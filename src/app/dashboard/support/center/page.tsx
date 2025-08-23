
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MessageSquare, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Ticket = {
    id: string;
    subject: string;
    userName: string;
    userEmail: string;
    submittedAt: string;
    status: 'new' | 'open' | 'resolved';
    convoId: string;
};

const tickets: Ticket[] = [
    { id: 'TKT-001', subject: 'Problème de visibilité du profil', userName: 'Amina Diallo', userEmail: 'amina.diallo@example.com', submittedAt: 'Il y a 2 heures', status: 'new', convoId: 'amina-diallo' },
    { id: 'TKT-002', subject: 'Impossible de postuler à un emploi', userName: 'Tech Solutions', userEmail: 'contact@techsolutions.com', submittedAt: 'Il y a 8 heures', status: 'open', convoId: 'contact-techsolutions' },
    { id: 'TKT-003', subject: 'Question sur la vérification de diplôme', userName: 'Admin INP-HB', userEmail: 'admin@inphb.ci', submittedAt: 'Il y a 1 jour', status: 'open', convoId: 'admin-inphb' },
    { id: 'TKT-004', subject: 'Échec de la réinitialisation du mot de passe', userName: 'Alice Williams', userEmail: 'alice.w@example.com', submittedAt: 'Il y a 3 jours', status: 'resolved', convoId: 'alice-williams' },
];


const TicketStatusBadge = ({ status }: { status: Ticket['status'] }) => {
    const statusMap = {
        new: { label: 'Nouveau', color: "bg-red-500", text: "text-white" },
        open: { label: 'Ouvert', color: "bg-blue-500", text: "text-white" },
        resolved: { label: 'Résolu', color: "bg-green-500", text: "text-white" },
    };
    const { label, color, text } = statusMap[status];
    return <Badge className={cn("capitalize", color, text)}>{label}</Badge>;
};

const TicketQueue = ({ tickets, title, onTicketSelect }: { tickets: Ticket[], title: string, onTicketSelect: (ticket: Ticket) => void }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Utilisateur</TableHead>
                            <TableHead>Sujet</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Soumis</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tickets.length > 0 ? tickets.map(ticket => (
                            <TableRow key={ticket.id}>
                                <TableCell>
                                    <div className="font-medium">{ticket.userName}</div>
                                    <div className="text-sm text-muted-foreground">{ticket.userEmail}</div>
                                </TableCell>
                                <TableCell>{ticket.subject}</TableCell>
                                <TableCell><TicketStatusBadge status={ticket.status} /></TableCell>
                                <TableCell>{ticket.submittedAt}</TableCell>
                                <TableCell>
                                    <Button variant="outline" size="sm" onClick={() => onTicketSelect(ticket)}>Voir le Ticket</Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">Aucun ticket dans cette file d'attente.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};


export default function SupportCenterPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("new");

    const handleTicketSelect = (ticket: Ticket) => {
        router.push(`/dashboard/messages?new=${ticket.convoId}&name=${encodeURIComponent(ticket.userName)}`);
    };

    const newTickets = tickets.filter(t => t.status === 'new');
    const openTickets = tickets.filter(t => t.status === 'open');
    const resolvedTickets = tickets.filter(t => t.status === 'resolved');

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Centre de Support</h1>
                        <p className="text-muted-foreground mt-1">Gérez les demandes de support des utilisateurs et suivez les tickets.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Nouveaux Tickets</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{newTickets.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tickets Ouverts</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{openTickets.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Résolus Aujourd'hui</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{resolvedTickets.length}</div>
                    </CardContent>
                </Card>
            </div>

            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">File d'attente des tickets</h2>
                <p className="text-muted-foreground mb-4">Consultez et répondez aux tickets des utilisateurs pour fournir une assistance.</p>
                <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="new">
                    <TabsList>
                        <TabsTrigger value="new">Nouveaux</TabsTrigger>
                        <TabsTrigger value="open">Ouverts</TabsTrigger>
                        <TabsTrigger value="resolved">Résolus</TabsTrigger>
                    </TabsList>
                    <TabsContent value="new">
                        <TicketQueue tickets={newTickets} title={"Nouveaux Tickets"} onTicketSelect={handleTicketSelect}/>
                    </TabsContent>
                    <TabsContent value="open">
                        <TicketQueue tickets={openTickets} title={"Tickets Ouverts"} onTicketSelect={handleTicketSelect}/>
                    </TabsContent>
                    <TabsContent value="resolved">
                        <TicketQueue tickets={resolvedTickets} title={"Tickets Résolus"} onTicketSelect={handleTicketSelect}/>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

    