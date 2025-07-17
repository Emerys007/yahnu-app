
"use client"

import React, { useState, useEffect } from "react"
import { useLocalization } from "@/context/localization-context"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserCheck, Check, X, Search, Loader2, Send } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot, DocumentData } from "firebase/firestore"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"


type GraduateStatus = "pending" | "active"
type EducationEntry = {
    degree: string
    field: string
    gradYear: string
    verified: boolean
}

type Graduate = {
  id: string
  name: string
  email: string
  status: GraduateStatus
  education?: EducationEntry[]
}

const BroadcastDialog = ({ graduates }: { graduates: Graduate[] }) => {
    const { t } = useLocalization();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    
    const pendingCount = graduates.filter(g => g.status === 'pending').length;
    const activeCount = graduates.filter(g => g.status === 'active').length;

    const handleSendBroadcast = () => {
        // In a real app, this would trigger a backend process
        toast({
            title: t("Broadcast Sent"),
            description: t("Your message is being sent to the selected graduates."),
        });
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Send className="mr-2 h-4 w-4" />
                    {t('Broadcast Message')}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('Send a Broadcast Message')}</DialogTitle>
                    <DialogDescription>
                        {t('Compose a message to send to multiple graduates at once. They will receive it as an individual message.')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="recipients">{t('Recipients')}</Label>
                        <Select defaultValue="all">
                            <SelectTrigger id="recipients">
                                <SelectValue placeholder={t("Select recipients")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('All Graduates')} ({graduates.length})</SelectItem>
                                <SelectItem value="pending">{t('Pending Graduates')} ({pendingCount})</SelectItem>
                                <SelectItem value="active">{t('Active Graduates')} ({activeCount})</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="subject">{t('Subject')}</Label>
                        <Input id="subject" placeholder={t("e.g., Upcoming Career Fair")} />
                    </div>
                     <div>
                        <Label htmlFor="message-body">{t('Message')}</Label>
                        <Textarea id="message-body" rows={8} placeholder={t("Type your message here...")} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSendBroadcast}>
                         <Send className="mr-2 h-4 w-4" />
                        {t('Send Broadcast')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function GraduateManagementPage() {
  const { t } = useLocalization()
  const { toast } = useToast()
  const { user } = useAuth()
  const [graduates, setGraduates] = useState<Graduate[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    setIsLoading(true);
    const graduatesQuery = query(
        collection(db, "users"),
        where("role", "==", "graduate"),
        where("schoolId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(graduatesQuery, (querySnapshot) => {
        const grads = querySnapshot.docs.map(doc => {
            const data = doc.data() as DocumentData;
            return {
                id: doc.id,
                name: data.name,
                email: data.email,
                status: data.status,
                education: data.education || [],
            } as Graduate;
        });
        setGraduates(grads);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching graduates:", error);
        toast({ title: "Error", description: "Could not fetch graduate data.", variant: "destructive" });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const handleStatusChange = async (id: string, newStatus: GraduateStatus) => {
    const graduate = graduates.find(g => g.id === id)
    if (!graduate) return

    try {
        const userDocRef = doc(db, "users", id);
        await updateDoc(userDocRef, { status: newStatus });
        
        toast({
          title: t(newStatus === 'active' ? 'Account activated' : 'Account deactivated'),
          description: `${graduate.name}'s ${t(newStatus === 'active' ? 'account has been activated.' : 'account has been deactivated.')}`,
        })
    } catch (error) {
        console.error("Failed to update status:", error);
        toast({ title: t('Error'), description: t('Failed to update status.'), variant: "destructive" });
    }
  }

  const handleVerifyEducation = async (graduateId: string, eduIndex: number) => {
    const graduate = graduates.find(g => g.id === graduateId);
    if (!graduate || !graduate.education) return;
    
    const updatedEducation = [...graduate.education];
    updatedEducation[eduIndex].verified = true;

    try {
        const userDocRef = doc(db, "users", graduateId);
        await updateDoc(userDocRef, { education: updatedEducation });
        toast({ title: t("Education Verified"), description: t("The degree has been marked as verified.") });
    } catch (error) {
        console.error("Failed to verify education:", error);
        toast({ title: t('Error'), description: t('Failed to verify education.'), variant: "destructive" });
    }
  }

  const filteredGraduates = graduates.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingGraduates = filteredGraduates.filter(g => g.status === 'pending');
  const activeGraduates = filteredGraduates.filter(g => g.status === 'active');
  
  const renderTable = (data: Graduate[]) => (
     <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('Name')}</TableHead>
            <TableHead>{t('Education Details')}</TableHead>
            <TableHead className="text-right">{t('Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            {data.map(grad => (
            <TableRow key={grad.id}>
              <TableCell className="font-medium align-top">
                <div className="font-semibold">{grad.name}</div>
                <div className="text-sm text-muted-foreground">{grad.email}</div>
              </TableCell>
              <TableCell>
                {grad.education && grad.education.length > 0 ? (
                    <ul className="space-y-2">
                        {grad.education.map((edu, index) => (
                            <li key={index} className="text-sm p-2 border rounded-md bg-muted/50 flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{edu.degree} {t('in')} {edu.field}</p>
                                    <p className="text-muted-foreground">{t('Graduated')}: {edu.gradYear}</p>
                                </div>
                                {edu.verified ? (
                                    <Badge variant="secondary" className="gap-1"><Check className="h-3 w-3"/>{t('Verified')}</Badge>
                                ) : (
                                    <Button size="xs" variant="outline" onClick={() => handleVerifyEducation(grad.id, index)}>{t('Verify')}</Button>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-muted-foreground">{t('No education details provided.')}</p>}
              </TableCell>
              <TableCell className="text-right space-x-2 align-top">
                {grad.status === 'pending' && (
                    <Button size="sm" onClick={() => handleStatusChange(grad.id, 'active')}>
                        <Check className="mr-2 h-4 w-4" /> {t('Activate')}
                    </Button>
                )}
                {grad.status === 'active' && (
                    <Button size="sm" variant="destructive" onClick={() => handleStatusChange(grad.id, 'pending')}>
                        <X className="mr-2 h-4 w-4" /> {t('Deactivate')}
                    </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && !isLoading && (
            <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">{t('No graduates found.')}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
            <UserCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('Graduate Management')}</h1>
            <p className="text-muted-foreground mt-1">{t('Activate accounts and verify academic credentials.')}</p>
            </div>
        </div>
        <BroadcastDialog graduates={graduates} />
      </div>

       <Card>
            <CardHeader>
                <CardTitle>{t('All Graduates')}</CardTitle>
                <CardDescription>{t('Search and manage all graduates associated with your school.')}</CardDescription>
                <div className="relative pt-4">
                    <Search className="absolute left-2.5 top-6.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t("Search by name or email...")} className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    </div>
                ) : (
                    <Tabs defaultValue="pending">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="pending">{t('Pending Activation')} ({pendingGraduates.length})</TabsTrigger>
                            <TabsTrigger value="active">{t('Active Accounts')} ({activeGraduates.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="pending" className="mt-4">
                            {renderTable(pendingGraduates)}
                        </TabsContent>
                        <TabsContent value="active" className="mt-4">
                            {renderTable(activeGraduates)}
                        </TabsContent>
                    </Tabs>
                )}
            </CardContent>
        </Card>
    </div>
  )
}

    