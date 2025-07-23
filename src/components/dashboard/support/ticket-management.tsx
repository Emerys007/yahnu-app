
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalization } from '@/context/localization-context';
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
    { id: 'TKT-001', userName: 'Amina Diallo', userEmail: 'amina.diallo@example.com', subject: 'Problem with my profile visibility', status: 'new', lastUpdate: '2 hours ago' },
    { id: 'TKT-002', userName: 'Kwame Nkrumah', userEmail: 'kwame.nkrumah@example.com', subject: 'Cannot apply for a job', status: 'new', lastUpdate: '5 hours ago' },
    { id: 'TKT-003', userName: 'Fatou Bensouda', userEmail: 'fatou.bensouda@example.com', subject: 'Question about billing', status: 'open', lastUpdate: '1 day ago' },
    { id: 'TKT-004', userName: 'Cheikh Anta Diop', userEmail: 'cheikh.anta.diop@example.com', subject: 'Password Reset Failed', status: 'resolved', lastUpdate: '3 days ago' },
];

export default function TicketManagement() {
    const { t } = useLocalization();
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

    const renderTickets = (ticketList: SupportTicket[]) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Update</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {ticketList.length > 0 ? ticketList.map((ticket) => (
                    <TableRow key={ticket.id} onClick={() => handleTicketSelect(ticket)} className="cursor-pointer">
                        <TableCell className="font-medium">{ticket.id}</TableCell>
                        <TableCell>{ticket.userName}</TableCell>
                        <TableCell>{ticket.subject}</TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(ticket.status)}>{t(ticket.status)}</Badge>
                        </TableCell>
                        <TableCell>{ticket.lastUpdate}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">{t('No tickets in this queue.')}</TableCell>
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
                        <h1 className="text-3xl font-bold tracking-tight">Ticket Management</h1>
                        <p className="text-muted-foreground mt-1">Here you can manage all support tickets.</p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Ticket Queue</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList>
                            <TabsTrigger value="new">{t('new')} ({newTickets.length})</TabsTrigger>
                            <TabsTrigger value="open">{t('open')} ({openTickets.length})</TabsTrigger>
                            <TabsTrigger value="resolved">{t('resolved')} ({resolvedTickets.length})</TabsTrigger>
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
