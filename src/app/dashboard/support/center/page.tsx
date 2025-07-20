
"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLocalization } from "@/context/localization-context"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Ticket, CheckCircle2, Clock, Loader2, Send } from "lucide-react"
import { CountUp } from "@/components/ui/count-up"
import { motion } from "framer-motion"
import { collection, onSnapshot, doc, updateDoc, query, orderBy, DocumentData } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/context/auth-context"

export type TicketStatus = "new" | "open" | "resolved"

export type SupportTicket = {
  id: string
  userId: string
  userName: string
  userEmail: string
  subject: string
  message: string
  submittedAt: {
    seconds: number;
    nanoseconds: number;
  };
  status: TicketStatus
}

const TicketDetailsDialog = ({ ticket, onStatusChange, onReply }: { ticket: SupportTicket, onStatusChange: (newStatus: TicketStatus) => void, onReply: () => void }) => {
    const { t } = useLocalization();
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">{t('View Ticket')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{ticket.subject}</DialogTitle>
                    <DialogDescription>
                        {t('Submitted by')} {ticket.userName} ({ticket.userEmail})
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="p-4 bg-muted rounded-md whitespace-pre-wrap">{ticket.message}</p>
                    <div className="flex items-center gap-2">
                        {ticket.status !== 'open' && <Button variant="secondary" onClick={() => { onStatusChange('open'); setIsOpen(false); }}>{t('Mark as Open')}</Button>}
                        {ticket.status !== 'resolved' && <Button onClick={() => { onStatusChange('resolved'); setIsOpen(false); }}>{t('Mark as Resolved')}</Button>}
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => { onReply(); setIsOpen(false); }}>
                        <Send className="mr-2 h-4 w-4" />
                        {t('Reply to User')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const TicketsTable = ({ tickets }: { tickets: SupportTicket[] }) => {
  const { t } = useLocalization()
  const { toast } = useToast()
  const router = useRouter()

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
        const ticketDocRef = doc(db, "tickets", ticketId);
        await updateDoc(ticketDocRef, { status: newStatus });
        toast({
            title: t("Status Updated"),
            description: t("The ticket status has been changed to {status}.", {status: t(newStatus)}),
        });
    } catch (error) {
        console.error("Failed to update ticket status:", error);
        toast({ title: t('Error'), description: t('Failed to update ticket status.'), variant: "destructive" });
    }
  }

  const handleReply = (userId: string) => {
    router.push(`/dashboard/messages?new=${userId}`);
  }

  const statusBadgeVariant = (status: TicketStatus) => {
    switch (status) {
      case "new": return "default"
      case "open": return "secondary"
      case "resolved": return "outline"
      default: return "default"
    }
  }

  const formatTimestamp = (timestamp: { seconds: number; nanoseconds: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString();
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('User')}</TableHead>
          <TableHead>{t('Subject')}</TableHead>
          <TableHead>{t('Status')}</TableHead>
          <TableHead>{t('Submitted')}</TableHead>
          <TableHead className="text-right">{t('Actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.length > 0 ? tickets.map((ticket) => (
          <TableRow key={ticket.id}>
            <TableCell>
              <div className="font-medium">{ticket.userName}</div>
              <div className="text-sm text-muted-foreground">{ticket.userEmail}</div>
            </TableCell>
            <TableCell>{t(ticket.subject)}</TableCell>
            <TableCell>
              <Badge variant={statusBadgeVariant(ticket.status)}>{t(ticket.status)}</Badge>
            </TableCell>
            <TableCell>{formatTimestamp(ticket.submittedAt)}</TableCell>
            <TableCell className="text-right">
                <TicketDetailsDialog 
                    ticket={ticket} 
                    onStatusChange={(newStatus) => handleStatusChange(ticket.id, newStatus)} 
                    onReply={() => handleReply(ticket.userId)}
                />
            </TableCell>
          </TableRow>
        )) : (
            <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">{t('No tickets in this queue.')}</TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  )
}

export default function SupportCenterPage() {
  const { t } = useLocalization()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const ticketsQuery = query(collection(db, "tickets"), orderBy("submittedAt", "desc"));
    const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
        const fetchedTickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket));
        setTickets(fetchedTickets);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching tickets:", error);
        setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const newTickets = tickets.filter(t => t.status === "new")
  const openTickets = tickets.filter(t => t.status === "open")
  const resolvedTickets = tickets.filter(t => t.status === "resolved")
  
  const resolvedTodayCount = tickets.filter(t => {
    if (t.status !== 'resolved' || !t.submittedAt) return false;
    const today = new Date();
    const resolvedDate = new Date(t.submittedAt.seconds * 1000);
    return resolvedDate.toDateString() === today.toDateString();
  }).length;

  const stats = [
    { title: "New Tickets", value: newTickets.length, icon: Ticket },
    { title: "Open Tickets", value: openTickets.length, icon: Clock },
    { title: "Resolved Today", value: resolvedTodayCount, icon: CheckCircle2 },
  ]
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };


  return (
    <motion.div 
        className="space-y-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">{t('Support Center')}</h1>
        <p className="text-muted-foreground mt-1">{t('Manage user inquiries and resolve support tickets.')}</p>
      </motion.div>
      
      <motion.div className="grid gap-4 md:grid-cols-3" variants={containerVariants}>
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t(stat.title)}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold"><CountUp end={stat.value} /></div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>{t('Ticket Queue')}</CardTitle>
            <CardDescription>{t('Address incoming support requests from users.')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <Tabs defaultValue="new">
                <TabsList>
                    <TabsTrigger value="new">{t('New')} <Badge className="ml-2">{newTickets.length}</Badge></TabsTrigger>
                    <TabsTrigger value="open">{t('Open')}</TabsTrigger>
                    <TabsTrigger value="resolved">{t('Resolved')}</TabsTrigger>
                </TabsList>
                <TabsContent value="new" className="mt-4">
                    <TicketsTable tickets={newTickets} />
                </TabsContent>
                <TabsContent value="open" className="mt-4">
                    <TicketsTable tickets={openTickets} />
                </TabsContent>
                <TabsContent value="resolved" className="mt-4">
                    <TicketsTable tickets={resolvedTickets} />
                </TabsContent>
                </Tabs>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
