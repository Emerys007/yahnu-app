
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type SupportTicket = {
    id: string;
    userName: string;
    userEmail: string;
    subject: string;
    status: 'new' | 'open' | 'resolved';
    lastUpdate: string;
};

const tickets: SupportTicket[] = [
    { id: 'TKT-001', userName: 'Amina Diallo', userEmail: 'amina.diallo@example.com', subject: 'Problème de visibilité du profil', status: 'new', lastUpdate: 'Il y a 2 heures' },
    { id: 'TKT-002', userName: 'Kwame Nkrumah', userEmail: 'kwame.nkrumah@example.com', subject: 'Impossible de postuler à un emploi', status: 'new', lastUpdate: 'Il y a 5 heures' },
    { id: 'TKT-003', userName: 'Fatou Bensouda', userEmail: 'fatou.bensouda@example.com', subject: 'Question sur la facturation', status: 'open', lastUpdate: 'Il y a 1 jour' },
    { id: 'TKT-004', userName: 'Cheikh Anta Diop', userEmail: 'cheikh.anta.diop@example.com', subject: 'Échec de la réinitialisation du mot de passe', status: 'resolved', lastUpdate: 'Il y a 3 jours' },
];

export default function TicketManagement() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("new");

    const handleTicketSelect = (ticket: SupportTicket) => {
        const newConvoId = ticket.userEmail.split('@')[0].replace('.', '-');
        router.push(`/dashboard/messages?new=${newConvoId}&name=${encodeURIComponent(ticket.userName)}`);
    };

    const getStatusVariant = (status: SupportTicket['status']) => {
        switch (status) {
            case 'new': return 'destructive';
            case 'open': return 'secondary';
            case 'resolved': return 'default';
        }
    };
    
    const getStatusLabel = (status: SupportTicket['status']) => {
        switch (status) {
            case 'new': return 'Nouveau';
            case 'open': return 'Ouvert';
            case 'resolved': return 'Résolu';
        }
    }

    const renderTickets = (ticketList: SupportTicket[]) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>ID du Ticket</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Sujet</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière mise à jour</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {ticketList.length > 0 ? ticketList.map((ticket) => (
                    <TableRow key={ticket.id} onClick={() => handleTicketSelect(ticket)} className="cursor-pointer">
                        <TableCell className="font-medium">{ticket.id}</TableCell>
                        <TableCell>{ticket.userName}</TableCell>
                        <TableCell>{ticket.subject}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(ticket.status)}>{getStatusLabel(ticket.status)}</Badge>
                        </TableCell>
                        <TableCell>{ticket.lastUpdate}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">Aucun ticket dans cette file d'attente.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    const newTickets = tickets.filter(t => t.status === 'new');
    const openTickets = tickets.filter(t => t.status === 'open');
    const resolvedTickets = tickets.filter(t => t.status === 'resolved');

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        <Ticket className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gestion des Tickets</h1>
                        <p className="text-muted-foreground mt-1">Ici, vous pouvez gérer tous les tickets de support.</p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>File d'attente des tickets</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="new">{`Nouveau (${newTickets.length})`}</TabsTrigger>
                            <TabsTrigger value="open">{`Ouvert (${openTickets.length})`}</TabsTrigger>
                            <TabsTrigger value="resolved">{`Résolu (${resolvedTickets.length})`}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="new">
                            {renderTickets(newTickets)}
                        </TabsContent>
                        <TabsContent value="open">
                            {renderTickets(openTickets)}
                        </TabsContent>
                        <TabsContent value="resolved">
                            {renderTickets(resolvedTickets)}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
