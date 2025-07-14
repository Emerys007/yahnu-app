
"use client"

import React, { useState } from "react"
import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Search, School, Building, PlusCircle, Trash2, ShieldAlert, VenetianMask } from "lucide-react"
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

export type UserRole = "Company" | "School" | "Graduate" | "Admin"
export type UserStatus = "active" | "pending" | "suspended"

type User = {
  id: number
  name: string
  email: string
  role: UserRole
  status: UserStatus
  date: string
}

const allUsers: User[] = [
    { id: 1, name: "Amina Diallo", email: "amina.d@example.com", role: "Graduate", status: "pending", date: "2023-10-25" },
    { id: 2, name: "Ben Traoré", email: "ben.t@example.com", role: "Graduate", status: "active", date: "2023-10-24" },
    { id: 3, name: "Innovate Inc.", email: "contact@innovate.inc", role: "Company", status: "pending", date: "2023-10-23" },
    { id: 4, name: "Prestige University", email: "contact@prestige.edu", role: "School", status: "active", date: "2023-10-22" },
    { id: 5, name: "Global Tech", email: "hr@global.tech", role: "Company", status: "active", date: "2023-10-21" },
    { id: 6, name: "Moussa Diarra", email: "moussa.d@example.com", role: "Graduate", status: "suspended", date: "2023-10-20" },
    { id: 7, name: "Dr. Evelyn Reed", email: "e.reed@yahnu.ci", role: "Admin", status: "active", date: "2023-01-15" },
];

const ManageUserDialog = ({ user, onUserUpdate, onUserDelete }: { user: User; onUserUpdate: (user: User) => void; onUserDelete: (userId: number) => void; }) => {
    const { t } = useLocalization();
    const { toast } = useToast();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isManageOpen, setIsManageOpen] = useState(false)
    const [selectedRole, setSelectedRole] = useState<UserRole>(user.role)

    const handleStatusChange = (newStatus: UserStatus) => {
        onUserUpdate({ ...user, status: newStatus });
        toast({ title: t('Status Updated'), description: `${user.name}'s status is now ${t(newStatus)}.` });
        setIsManageOpen(false);
    }
    
    const handleRoleChange = () => {
        onUserUpdate({ ...user, role: selectedRole });
        toast({ title: t('Role Updated'), description: `${user.name}'s role is now ${t(selectedRole)}.` });
        setIsManageOpen(false);
    }
    
    const handleDelete = () => {
        onUserDelete(user.id);
        toast({ title: t('User Deleted'), description: `${user.name} has been removed from the platform.`, variant: "destructive" });
        setIsDeleteDialogOpen(false);
        setIsManageOpen(false);
    }

    return (
        <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="sm">{t('Manage')}</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('Manage User')}: {user.name}</DialogTitle>
                    <DialogDescription>{t('Update user roles, status, or remove them from the platform.')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>{t('Change Role')}</Label>
                        <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Select a role')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Graduate">{t('Graduate')}</SelectItem>
                                <SelectItem value="Company">{t('Company')}</SelectItem>
                                <SelectItem value="School">{t('School')}</SelectItem>
                                <SelectItem value="Admin">{t('Admin')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleRoleChange} disabled={selectedRole === user.role}>{t('Save Role')}</Button>
                    </div>
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
                            <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" />{t('Delete User')}</Button>
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

export default function ManageUsersPage() {
    const { t } = useLocalization();
    const [users, setUsers] = useState<User[]>(allUsers);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({ role: "all", status: "all" });

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }
    
    const filteredUsers = users.filter(user => {
        const searchMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const roleMatch = filters.role === 'all' || user.role === filters.role;
        const statusMatch = filters.status === 'all' || user.status === filters.status;
        return searchMatch && roleMatch && statusMatch;
    });

    const statusBadgeVariant = (status: User["status"]) => {
        switch (status) {
            case 'active': return 'secondary';
            case 'pending': return 'outline';
            case 'suspended': return 'destructive';
            default: return 'default';
        }
    }

    const handleUserUpdate = (updatedUser: User) => {
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const handleUserDelete = (userId: number) => {
        setUsers(users.filter(u => u.id !== userId));
    };
    
    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('Manage Users')}</h1>
                        <p className="text-muted-foreground mt-1">{t('Manage all user accounts across the platform.')}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" />{t('Add School')}</Button>
                        </DialogTrigger>
                        <DialogContent>
                             <DialogHeader>
                                <DialogTitle>{t('Add a new School')}</DialogTitle>
                                <DialogDescription>{t("Manually create a new school account. The account will be active immediately.")}</DialogDescription>
                            </DialogHeader>
                            {/* Form to add a school would go here */}
                        </DialogContent>
                    </Dialog>
                     <Dialog>
                        <DialogTrigger asChild>
                            <Button><PlusCircle className="mr-2 h-4 w-4" />{t('Add Company')}</Button>
                        </DialogTrigger>
                        <DialogContent>
                             <DialogHeader>
                                <DialogTitle>{t('Add a new Company')}</DialogTitle>
                                <DialogDescription>{t("Manually create a new company account. The account will be active immediately.")}</DialogDescription>
                            </DialogHeader>
                            {/* Form to add a company would go here */}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

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
                        <Select value={filters.role} onValueChange={(v) => handleFilterChange('role', v)}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder={t('Filter by role')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('All Roles')}</SelectItem>
                                <SelectItem value="Graduate">{t('Graduate')}</SelectItem>
                                <SelectItem value="Company">{t('Company')}</SelectItem>
                                <SelectItem value="School">{t('School')}</SelectItem>
                                <SelectItem value="Admin">{t('Admin')}</SelectItem>
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
                            </SelectContent>
                        </Select>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('User')}</TableHead>
                                <TableHead>{t('Role')}</TableHead>
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
                                            {user.role === 'Company' && <Building className="h-3 w-3" />}
                                            {user.role === 'School' && <School className="h-3 w-3" />}
                                            {user.role === 'Graduate' && <Users className="h-3 w-3" />}
                                            {user.role === 'Admin' && <VenetianMask className="h-3 w-3" />}
                                            {t(user.role)}
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
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

    