
"use client"

import React, { useState, useEffect, useMemo } from "react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select"


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
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
    
    const recipientOptions: MultiSelectOption[] = useMemo(() => {
        const groupOptions: MultiSelectOption[] = [
            { value: 'group-all', label: 'Tous les diplômés' },
            { value: 'group-pending', label: 'Diplômés en attente' },
            { value: 'group-active', label: 'Diplômés actifs' }
        ];
        const individualOptions: MultiSelectOption[] = graduates.map(g => ({ value: g.id, label: g.name }));
        return [...groupOptions, ...individualOptions];
    }, [graduates]);


    const handleSendBroadcast = () => {
        // In a real app, this would trigger a backend process
        // You would resolve the selected recipients (groups and individuals) into a list of UIDs
        // and send the message via a server-side function.
        console.log("Sending broadcast to:", selectedRecipients);
        
        toast({
            title: "Message diffusé envoyé",
            description: "Votre message est en cours d'envoi aux diplômés sélectionnés.",
        });
        setIsOpen(false);
        setSelectedRecipients([]);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Send className="mr-2 h-4 w-4" />
                    Diffuser un message
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Envoyer un message de diffusion</DialogTitle>
                    <DialogDescription>
                        Composez un message à envoyer à plusieurs diplômés à la fois. Ils le recevront comme un message individuel.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="recipients">Destinataires</Label>
                        <MultiSelect
                            options={recipientOptions}
                            selected={selectedRecipients}
                            onChange={setSelectedRecipients}
                            placeholder={"Sélectionnez des destinataires..."}
                            searchPlaceholder={"Recherchez des diplômés ou des groupes..."}
                            emptyPlaceholder={"Aucun résultat trouvé."}
                        />
                    </div>
                     <div>
                        <Label htmlFor="subject">Sujet</Label>
                        <Input id="subject" placeholder={"Ex: Prochain salon de l'emploi"} />
                    </div>
                     <div>
                        <Label htmlFor="message-body">Message</Label>
                        <Textarea id="message-body" rows={8} placeholder={"Tapez votre message ici..."} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSendBroadcast} disabled={selectedRecipients.length === 0}>
                         <Send className="mr-2 h-4 w-4" />
                        Envoyer la diffusion
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function GraduateManagementPage() {
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
        toast({ title: "Erreur", description: "Impossible de récupérer les données des diplômés.", variant: "destructive" });
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
          title: newStatus === 'active' ? 'Compte activé' : 'Compte désactivé',
          description: `Le compte de ${graduate.name} a été ${newStatus === 'active' ? 'activé.' : 'désactivé.'}`,
        })
    } catch (error) {
        console.error("Failed to update status:", error);
        toast({ title: 'Erreur', description: 'Échec de la mise à jour du statut.', variant: "destructive" });
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
        toast({ title: "Formation vérifiée", description: "Le diplôme a été marqué comme vérifié." });
    } catch (error) {
        console.error("Failed to verify education:", error);
        toast({ title: 'Erreur', description: 'Échec de la vérification de la formation.', variant: "destructive" });
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
            <TableHead>Nom</TableHead>
            <TableHead>Détails de la formation</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
                                    <p className="font-medium">{edu.degree} en {edu.field}</p>
                                    <p className="text-muted-foreground">Diplômé : {edu.gradYear}</p>
                                </div>
                                {edu.verified ? (
                                    <Badge variant="secondary" className="gap-1"><Check className="h-3 w-3"/>Vérifié</Badge>
                                ) : (
                                    <Button size="xs" variant="outline" onClick={() => handleVerifyEducation(grad.id, index)}>Vérifier</Button>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-muted-foreground">Aucun détail de formation fourni.</p>}
              </TableCell>
              <TableCell className="text-right space-x-2 align-top">
                {grad.status === 'pending' && (
                    <Button size="sm" onClick={() => handleStatusChange(grad.id, 'active')}>
                        <Check className="mr-2 h-4 w-4" /> Activer
                    </Button>
                )}
                {grad.status === 'active' && (
                    <Button size="sm" variant="destructive" onClick={() => handleStatusChange(grad.id, 'pending')}>
                        <X className="mr-2 h-4 w-4" /> Désactiver
                    </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && !isLoading && (
            <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">Aucun diplômé trouvé.</TableCell>
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
            <h1 className="text-3xl font-bold tracking-tight">Gestion des diplômés</h1>
            <p className="text-muted-foreground mt-1">Activez les comptes et vérifiez les diplômes.</p>
            </div>
        </div>
        <BroadcastDialog graduates={graduates} />
      </div>

       <Card>
            <CardHeader>
                <CardTitle>Tous les diplômés</CardTitle>
                <CardDescription>Recherchez et gérez tous les diplômés associés à votre école.</CardDescription>
                <div className="relative pt-4">
                    <Search className="absolute left-2.5 top-6.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={"Rechercher par nom ou par e-mail..."} className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                            <TabsTrigger value="pending">Activation en attente ({pendingGraduates.length})</TabsTrigger>
                            <TabsTrigger value="active">Comptes actifs ({activeGraduates.length})</TabsTrigger>
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

    