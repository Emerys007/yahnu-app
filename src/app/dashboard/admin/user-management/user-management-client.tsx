"use client"

import React, { useState } from "react"
import { useLocalization } from "@/context/localization-context"
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
    const { t } = useLocalization()
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
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold">{t('dashboard.user_management.title')}</h2>
                <p className="text-muted-foreground">{t('dashboard.user_management.description')}</p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder={t('dashboard.user_management.search_users')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={filters.accountType} onValueChange={(v) => handleFilterChange('accountType', v)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder={t('dashboard.user_management.filter_role')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('dashboard.user_management.all_roles')}</SelectItem>
                        <SelectItem value="graduate">{t('dashboard.user_management.graduate')}</SelectItem>
                        <SelectItem value="company">{t('dashboard.user_management.company')}</SelectItem>
                        <SelectItem value="school">{t('dashboard.user_management.school')}</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder={t('dashboard.user_management.filter_status')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('dashboard.user_management.all_statuses')}</SelectItem>
                        <SelectItem value="active">{t('dashboard.user_management.active')}</SelectItem>
                        <SelectItem value="pending">{t('dashboard.user_management.pending')}</SelectItem>
                        <SelectItem value="rejected">{t('dashboard.user_management.rejected')}</SelectItem>
                        <SelectItem value="suspended">{t('dashboard.user_management.suspended')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Users Table */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('dashboard.user_management.name')}</TableHead>
                            <TableHead>{t('dashboard.user_management.role')}</TableHead>
                            <TableHead>{t('dashboard.user_management.status')}</TableHead>
                            <TableHead>{t('dashboard.user_management.date')}</TableHead>
                            <TableHead className="text-right">{t('dashboard.user_management.actions')}</TableHead>
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
                                        {t(`dashboard.user_management.${user.accountType}`)}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge 
                                        variant={getStatusVariant(user.status)}
                                        className="capitalize"
                                    >
                                        {t(`dashboard.user_management.${user.status}`)}
                                    </Badge>
                                </TableCell>
                                <TableCell>{user.date}</TableCell>
                                <TableCell className="text-right">
                                    <ManageUserDialog user={user} onUserUpdate={handleUserUpdate} onUserDelete={handleUserDelete}/>
                                </TableCell>
                            </TableRow>
                        ))}
                         {filteredUsers.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">{t('dashboard.user_management.no_users_found')}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}