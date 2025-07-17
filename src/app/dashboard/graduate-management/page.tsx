
"use client"

import React, { useState, useEffect } from "react"
import { useLocalization } from "@/context/localization-context"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserCheck, Check, X, Search, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { collection, query, where, getDocs, doc, updateDoc, onSnapshot, DocumentData } from "firebase/firestore"
import { db } from "@/lib/firebase"


type GraduateStatus = "pending" | "active"
type Graduate = {
  id: string
  name: string
  email: string
  graduationYear?: number
  status: GraduateStatus
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
                graduationYear: data.graduationYear,
                status: data.status,
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
            <TableHead>{t('Email')}</TableHead>
            <TableHead>{t('Graduation Year')}</TableHead>
            <TableHead className="text-right">{t('Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            {data.map(grad => (
            <TableRow key={grad.id}>
              <TableCell className="font-medium">{grad.name}</TableCell>
              <TableCell>{grad.email}</TableCell>
              <TableCell>{grad.graduationYear || 'N/A'}</TableCell>
              <TableCell className="text-right space-x-2">
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
                <TableCell colSpan={4} className="h-24 text-center">{t('No graduates found.')}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <UserCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('Graduate Management')}</h1>
          <p className="text-muted-foreground mt-1">{t('Activate and manage graduate accounts from your institution.')}</p>
        </div>
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
