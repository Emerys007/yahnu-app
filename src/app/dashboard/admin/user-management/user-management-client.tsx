
"use client"

import React, { useState } from "react"
import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, School, Building, Trash2 } from "lucide-react"
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
  date: string
}

const ManageUserDialog = ({ user, onUserUpdate, onUserDelete }: { user: User; onUserUpdate: (user: User) => void; onUserDelete: (userId: string) => void; }) => {
    const { t } = useLocalization();
    const { toast } = useToast();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isManageOpen, setIsManageOpen] = useState(false)

    const handleStatusChange = async (newStatus: UserStatus) => {
        try {
            const userDocRef = doc(db, "users", user.id);
            await updateDoc(userDocRef, { status: newStatus });
            onUserUpdate({ ...user, status: newStatus });
            toast({ title: t('Status Updated'), description: `${user.name}'s status is now ${t(newStatus)}.` });
            setIsManageOpen(false);
        } catch (error) {
            console.error("Failed to update status:", error);
            toast({ title: t('Error'), description: t('Failed to update user status.'), variant: "destructive" });
        }
    }
    
    const handleDelete = async () => {
        try {
            const userDocRef = doc(db, "users", user.id);
            await deleteDoc(userDocRef); // This will delete the user document from Firestore.
                                         // Note: This does not delete the user from Firebase Authentication.
                                         // A server-side function (e.g., Firebase Function) would be needed for that.
            onUserDelete(user.id);
            toast({ title: t('User Deleted'), description: `${user.name} ${t('has been removed from the platform.')}`, variant: "destructive" });
        } catch (error) {
            console.error("Failed to delete user:", error);
            toast({ title: t('Error'), description: t('Failed to delete user.'), variant: "destructive" });
        } finally {
            setIsDeleteDialogOpen(false);
            setIsManageOpen(false);
        }
    }

    return (
        <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="sm">{t('Manage')}</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('Manage User')}: {user.name}</DialogTitle>
                    <DialogDescription>{t('Update user status or remove them from the platform.')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <div className="space-y-2">
                         <Label>{t('Change Status')}</Label>
                         <div className="flex gap-2">
                            {user.status !== 'active' && <Button onClick={() => handleStatusChange('active')}>{t('Activate')}</Button>}
                            {user.status !== 'suspended' && <Button variant="secondary" onClick={() => handleStatusChange('suspended')}>{t('Suspend')}</Button>}
                         </div>
                    </div>
                </div>
                <DialogFooter>
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={user.accountType === "admin" || user.accountType === "super_admin"}>
                                <Trash2 className="mr-2 h-4 w-4" />{t('Delete User')}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t('Are you absolutely sure?')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t('This action cannot be undone. This will permanently delete the user account and remove their data from our servers.')}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t('Cancel')}</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>{t('Yes, delete user')}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function UserManagementClient({ initialUsers }: { initialUsers: User[] }) {
    const { t } = useLocalization();
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

    const statusBadgeVariant = (status: User["status"]) => {
        switch (status) {
            case 'active': return 'secondary';
            case 'pending': return 'outline';
            case 'suspended': return 'destructive';
            case 'declined': return 'destructive';
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
        <>
            <Card>
                <CardHeader>
                    <CardTitle>{t('All Users')}</CardTitle>
                    <CardDescription>{t('View, manage, and search for all users on the platform.')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder={t("Search by name or email...")} className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <Select value={filters.accountType} onValueChange={(v) => handleFilterChange('accountType', v)}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder={t('Filter by Account Type')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('All Account Types')}</SelectItem>
                                <SelectItem value="graduate">{t('Graduate')}</SelectItem>
                                <SelectItem value="company">{t('Company')}</SelectItem>
                                <SelectItem value="school">{t('School')}</SelectItem>
                            </SelectContent>
                        </Select>
                         <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder={t('Filter by status')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('All Statuses')}</SelectItem>
                                <SelectItem value="active">{t('Active')}</SelectItem>
                                <SelectItem value="pending">{t('Pending')}</SelectItem>
                                <SelectItem value="suspended">{t('Suspended')}</SelectItem>
                                <SelectItem value="declined">{t('Declined')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('User')}</TableHead>
                                <TableHead>{t('Account Type')}</TableHead>
                                <TableHead>{t('Status')}</TableHead>
                                <TableHead>{t('Registration Date')}</TableHead>
                                <TableHead className="text-right">{t('Actions')}</TableHead>
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
                                         <Badge variant="outline" className="gap-1">
                                            {user.accountType === 'company' && <Building className="h-3 w-3" />}
                                            {user.accountType === 'school' && <School className="h-3 w-3" />}
                                            {user.accountType === 'graduate' && <Users className="h-3 w-3" />}
                                            {t(user.accountType)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={statusBadgeVariant(user.status)}>{t(user.status)}</Badge>
                                    </TableCell>
                                    <TableCell>{user.date}</TableCell>
                                    <TableCell className="text-right">
                                        <ManageUserDialog user={user} onUserUpdate={handleUserUpdate} onUserDelete={handleUserDelete}/>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {filteredUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">{t('No users found.')}</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    )
}

    