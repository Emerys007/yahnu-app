
"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, School, Building, Trash2, Users, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { type Role, type UserStatus } from "@/context/auth-context"
import { doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"


type User = {
  id: string
  name: string
  email: string
  accountType: Role
  status: UserStatus
  joinDate: string
}

const statusTranslations: Record<UserStatus, string> = {
    active: "Actif",
    pending: "En attente",
    suspended: "Suspendu",
    declined: "Refusé",
    rejected: "Rejeté",
}

const roleTranslations: Record<Role, string> = {
    graduate: "Diplômé",
    company: "Entreprise",
    school: "École",
    admin: "Admin",
    super_admin: "Super Admin",
    content_manager: "Gestionnaire de contenu",
    support_staff: "Support",
}

const ManageUserDialog = ({ user, onUserUpdate, onUserDelete }: { user: User; onUserUpdate: (user: User) => void; onUserDelete: (userId: string) => void; }) => {
    const { toast } = useToast();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isManageOpen, setIsManageOpen] = useState(false)

    const handleStatusChange = async (newStatus: UserStatus) => {
        try {
            const userDocRef = doc(db, "users", user.id);
            await updateDoc(userDocRef, { status: newStatus });
            onUserUpdate({ ...user, status: newStatus });
            toast({ title: "Statut mis à jour", description: `Le statut de ${user.name} est maintenant ${statusTranslations[newStatus]}.` });
            setIsManageOpen(false);
        } catch (error) {
            console.error("Failed to update status:", error);
            toast({ title: "Erreur", description: "Échec de la mise à jour du statut.", variant: "destructive" });
        }
    }

    const handleDelete = async () => {
        try {
            const userDocRef = doc(db, "users", user.id);
            await deleteDoc(userDocRef);
            onUserDelete(user.id);
            toast({ title: "Utilisateur supprimé", description: `${user.name} a été supprimé de la plateforme.`, variant: "destructive" });
        } catch (error) {
            console.error("Failed to delete user:", error);
            toast({ title: "Erreur", description: "Échec de la suppression de l'utilisateur.", variant: "destructive" });
        } finally {
            setIsDeleteDialogOpen(false);
            setIsManageOpen(false);
        }
    }

    return (
        <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="sm">Gérer</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gérer l'utilisateur : {user.name}</DialogTitle>
                    <DialogDescription>Modifier le statut de l'utilisateur ou supprimer le compte.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <div className="space-y-2">
                         <Label>Changer le statut</Label>
                         <div className="flex gap-2">
                            {user.status !== 'active' && <Button onClick={() => handleStatusChange('active')}>Activer</Button>}
                            {user.status !== 'suspended' && <Button variant="secondary" onClick={() => handleStatusChange('suspended')}>Suspendre</Button>}
                         </div>
                    </div>
                </div>
                <DialogFooter>
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={user.accountType === "admin" || user.accountType === "super_admin"}>
                                <Trash2 className="mr-2 h-4 w-4" />Supprimer l'utilisateur
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Cette action ne peut pas être annulée. Cela supprimera définitivement le compte de l'utilisateur et ses données de nos serveurs.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>Oui, supprimer</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function UserManagementClient({ initialUsers }: { initialUsers: User[] }) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({ accountType: "all", status: "all" });

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }

    const filteredUsers = users.filter(user => {
        const searchMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const roleMatch = filters.accountType === 'all' || user.accountType === filters.accountType;
        const statusMatch = filters.status === 'all' || user.status === filters.status;
        return searchMatch && roleMatch && statusMatch;
    });

    const getStatusVariant = (status: User["status"]) => {
        switch (status) {
            case 'active': return 'secondary';
            case 'pending': return 'outline';
            case 'suspended': return 'destructive';
            case 'declined': return 'destructive';
            case 'rejected': return 'destructive';
            default: return 'default';
        }
    }

    const handleUserUpdate = (updatedUser: User) => {
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const handleUserDelete = (userId: string) => {
        setUsers(users.filter(u => u.id !== userId));
    };

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Rechercher des utilisateurs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={filters.accountType} onValueChange={(v) => handleFilterChange('accountType', v)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filtrer par rôle" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les rôles</SelectItem>
                        <SelectItem value="graduate">Diplômé</SelectItem>
                        <SelectItem value="company">Entreprise</SelectItem>
                        <SelectItem value="school">École</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="rejected">Rejeté</SelectItem>
                        <SelectItem value="suspended">Suspendu</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Users Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Rôle</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Date d'inscription</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map(user => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="font-medium">{user.name}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                </TableCell>
                                <TableCell>
                                     <Badge variant="outline" className="gap-1 capitalize">
                                        {user.accountType === 'company' && <Building className="h-3 w-3" />}
                                        {user.accountType === 'school' && <School className="h-3 w-3" />}
                                        {user.accountType === 'graduate' && <Users className="h-3 w-3" />}
                                        {roleTranslations[user.accountType]}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge 
                                        variant={getStatusVariant(user.status)}
                                        className="capitalize"
                                    >
                                        {statusTranslations[user.status]}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {new Date(user.joinDate).toLocaleDateString('fr-FR', {
                                        day: '2-digit',
                                        month: '2-digit', 
                                        year: 'numeric'
                                    })}
                                </TableCell>
                                <TableCell className="text-right">
                                    <ManageUserDialog user={user} onUserUpdate={handleUserUpdate} onUserDelete={handleUserDelete}/>
                                </TableCell>
                            </TableRow>
                        ))}
                         {filteredUsers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Aucun utilisateur trouvé.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
