
"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Crown, Trash2, UserPlus, Copy, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useAuth, type Role } from "@/context/auth-context"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"


type AdminUser = {
  id: string
  name: string
  email: string
  accountType: Role
}

export function ManageTeamClient({ initialAdmins }: { initialAdmins: AdminUser[] }) {
    const { toast } = useToast();
    const { role } = useAuth();
    const router = useRouter();
    const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [inviteLink, setInviteLink] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const [inviteDetails, setInviteDetails] = useState({ email: "", role: "admin" as Role });

    useEffect(() => {
        // Protect this page and only allow super_admins
        if (role && role !== 'super_admin') {
            toast({
                title: "Accès non autorisé",
                description: "Vous n'avez pas la permission de voir cette page.",
                variant: "destructive",
            });
            router.push('/dashboard');
        }
    }, [role, router, toast]);

    const handleDeleteAdmin = (id: string) => {
        const adminToDelete = admins.find(a => a.id === id);
        if (adminToDelete?.accountType === 'super_admin') {
            toast({
                title: "Action Interdite",
                description: "Le compte Super Admin ne peut pas être supprimé.",
                variant: "destructive"
            });
            return;
        }
        setAdmins(admins.filter(a => a.id !== id));
        toast({
            title: "Administrateur Supprimé",
            description: `${adminToDelete?.name} a été retiré des administrateurs.`,
        })
    }

    const handleInviteAdmin = async () => {
        if (!inviteDetails.email) {
            toast({ title: "E-mail requis", description: "Veuillez saisir une adresse e-mail pour envoyer une invitation.", variant: "destructive"});
            return;
        }
        setIsInviting(true);
        try {
            const invitesCollection = collection(db, "invites");
            const newInvite = {
                email: inviteDetails.email,
                role: inviteDetails.role,
                status: "pending",
                createdAt: serverTimestamp(),
            };
            const docRef = await addDoc(invitesCollection, newInvite);
            const newInviteLink = `${window.location.origin}/register/${docRef.id}`;
            setInviteLink(newInviteLink);
            setIsInviteDialogOpen(true);
        } catch (error) {
            console.error("Failed to create invite:", error);
            toast({ title: "Erreur", description: "Impossible de créer le lien d'invitation.", variant: "destructive"});
        } finally {
            setIsInviting(false);
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        toast({
            title: "Lien Copié",
            description: "Le lien d'invitation a été copié dans votre presse-papiers.",
        });
    }

    const getRoleDisplayName = (role: Role) => {
        const roleMap: Record<Role, string> = {
            admin: 'Administrateur',
            super_admin: 'Super Administrateur',
            content_manager: 'Gestionnaire de Contenu',
            support_staff: 'Personnel de Support',
            graduate: 'Diplômé',
            company: 'Entreprise',
            school: 'École'
        }
        return roleMap[role] || role;
    }

    // Render nothing or a loading state while redirecting
    if (role && role !== 'super_admin') {
        return null;
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Gérer l'équipe</CardTitle>
                    <CardDescription>Gérez les utilisateurs avec des privilèges administratifs.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="mb-6 p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">Inviter un nouveau membre</h4>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            <Input 
                                id="invite-email" 
                                placeholder="E-mail du nouvel administrateur" 
                                type="email" 
                                value={inviteDetails.email}
                                onChange={(e) => setInviteDetails(prev => ({...prev, email: e.target.value}))}
                                disabled={isInviting}
                                className="flex-grow"
                            />
                            <Select 
                                defaultValue={inviteDetails.role} 
                                onValueChange={(value) => setInviteDetails(prev => ({...prev, role: value as Role}))}
                                disabled={isInviting}
                            >
                                <SelectTrigger className="w-full sm:w-[200px]">
                                    <SelectValue placeholder="Sélectionner un rôle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Administrateur</SelectItem>
                                    <SelectItem value="content_manager">Gestionnaire de Contenu</SelectItem>
                                    <SelectItem value="support_staff">Personnel de Support</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleInviteAdmin} className="w-full sm:w-auto" disabled={isInviting}>
                                {isInviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                {isInviting ? "Envoi en cours..." : "Envoyer l'Invitation"}
                            </Button>
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>E-mail</TableHead>
                                <TableHead>Type de Compte</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admins.map(admin => (
                                <TableRow key={admin.id}>
                                    <TableCell className="font-medium">{admin.name}</TableCell>
                                    <TableCell>{admin.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={admin.accountType === 'super_admin' ? 'default' : 'secondary'}>
                                            {admin.accountType === 'super_admin' && <Crown className="mr-1 h-3 w-3" />}
                                            {getRoleDisplayName(admin.accountType)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="icon" variant="ghost" onClick={() => handleDeleteAdmin(admin.id)} disabled={admin.accountType === 'super_admin'}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Lien d'Invitation pour l'Administrateur</DialogTitle>
                        <DialogDescription>Partagez ce lien avec le nouvel administrateur pour lui permettre de s'inscrire.</DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 mt-4">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="link" className="sr-only">
                                Lien
                            </Label>
                            <Input
                                id="link"
                                defaultValue={inviteLink}
                                readOnly
                            />
                        </div>
                        <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
                            <span className="sr-only">Copier</span>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Fermer</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
