
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocalization } from "@/context/localization-context";
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
};

// Mock data, replace with actual data fetching
const tickets: Ticket[] = [
    { id: 'TKT-001', subject: 'Problem with my profile visibility', userName: 'John Doe', userEmail: 'j.katako@gmail.com', submittedAt: '2 hours ago', status: 'new' },
    { id: 'TKT-002', subject: 'Cannot apply for a job', userName: 'Jane Smith', userEmail: 'jane.smith@example.com', submittedAt: '8 hours ago', status: 'open' },
    { id: 'TKT-003', subject: 'Question about billing', userName: 'Bob Johnson', userEmail: 'bob.j@example.com', submittedAt: '1 day ago', status: 'open' },
    { id: 'TKT-004', subject: 'Password Reset Failed', userName: 'Alice Williams', userEmail: 'alice.w@example.com', submittedAt: '3 days ago', status: 'resolved' },
];


const TicketStatusBadge = ({ status }: { status: Ticket['status'] }) => {
    const { t } = useLocalization();
    const statusMap = {
        new: { label: t('new'), color: "bg-red-500", text: "text-white" },
        open: { label: t('open'), color: "bg-blue-500", text: "text-white" },
        resolved: { label: t('resolved'), color: "bg-green-500", text: "text-white" },
    };
    const { label, color, text } = statusMap[status];
    return <Badge className={cn("capitalize", color, text)}>{label}</Badge>;
};

const TicketQueue = ({ tickets, title, onTicketSelect }: { tickets: Ticket[], title: string, onTicketSelect: (ticket: Ticket) => void }) => {
    const { t } = useLocalization();
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('User')}</TableHead>
                            <TableHead>{t('Subject')}</TableHead>
                            <TableHead>{t('Status')}</TableHead>
                            <TableHead>{t('Submitted')}</TableHead>
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
                                    <Button variant="outline" size="sm" onClick={() => onTicketSelect(ticket)}>View Ticket</Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">{t('No tickets in this queue.')}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};


export default function SupportCenterPage() {
    const { t } = useLocalization();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("new");

    const handleTicketSelect = (ticket: Ticket) => {
        const newConvoId = ticket.userEmail.split('@')[0].replace('.', '-');
        router.push(`/dashboard/messages?new=${newConvoId}&name=${encodeURIComponent(ticket.userName)}`);
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
                        <h1 className="text-3xl font-bold tracking-tight">{t('Support Center')}</h1>
                        <p className="text-muted-foreground mt-1">{t('Manage user inquiries and resolve support tickets.')}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('New Tickets')}</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{newTickets.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('Open Tickets')}</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{openTickets.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('Resolved Today')}</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{resolvedTickets.length}</div>
                    </CardContent>
                </Card>
            </div>

            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">{t('Ticket Queue')}</h2>
                <p className="text-muted-foreground mb-4">{t('Address incoming support requests from users.')}</p>
                <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="new">
                    <TabsList>
                        <TabsTrigger value="new">{t('New')}</TabsTrigger>
                        <TabsTrigger value="open">{t('Open')}</TabsTrigger>
                        <TabsTrigger value="resolved">{t('Resolved')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="new">
                        <TicketQueue tickets={newTickets} title={t("New Tickets")} onTicketSelect={handleTicketSelect}/>
                    </TabsContent>
                    <TabsContent value="open">
                        <TicketQueue tickets={openTickets} title={t("Open Tickets")} onTicketSelect={handleTicketSelect}/>
                    </TabsContent>
                    <TabsContent value="resolved">
                        <TicketQueue tickets={resolvedTickets} title={t("Resolved Tickets")} onTicketSelect={handleTicketSelect}/>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
