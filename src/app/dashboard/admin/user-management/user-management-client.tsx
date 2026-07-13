"use client"

import React, { useEffect, useState } from "react"
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
import { apiFetch } from "@/lib/api-client"


export type User = {
  id: string
  name: string
  email: string
  accountType: Role
  status: UserStatus
  date: string
}

const ManageUserDialog = ({ user, onUserUpdate, onUserDelete }: { user: User; onUserUpdate: (user: User) => void; onUserDelete: (userId: string) => void; }) => {
    const { t, language } = useLocalization();
    const { toast } = useToast();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isManageOpen, setIsManageOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const handleStatusChange = async (newStatus: UserStatus) => {
        if (isSaving) return
        setIsSaving(true)
        try {
            const response = await apiFetch<{ data: { user: User } }>(`/api/admin/users/${encodeURIComponent(user.id)}`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
            })
            onUserUpdate(response.data.user);
            toast({ title: t('dashboard.user_management.status_updated'), description: `${user.name} ${t('dashboard.user_management.status_now')} ${t(`dashboard.user_management.${newStatus}`)}.` });
            setIsManageOpen(false);
        } catch (error) {
            toast({ title: t('common.error'), description: error instanceof Error ? error.message : t('dashboard.user_management.failed_update_status'), variant: "destructive" });
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (isSaving) return
        setIsSaving(true)
        try {
            await apiFetch(`/api/admin/users/${encodeURIComponent(user.id)}`, { method: "DELETE" })
            onUserDelete(user.id);
            toast({ title: t('dashboard.user_management.user_deleted'), description: `${user.name} ${t('dashboard.user_management.removed_from_platform')}`, variant: "destructive" });
        } catch (error) {
            toast({ title: t('common.error'), description: error instanceof Error ? error.message : t('dashboard.user_management.failed_delete_user'), variant: "destructive" });
        } finally {
            setIsSaving(false)
            setIsDeleteDialogOpen(false);
            setIsManageOpen(false);
        }
    }

    return (
        <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
            <DialogTrigger asChild>
                 <Button variant="ghost" size="sm">{t('dashboard.user_management.manage')}</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {language === 'en' ? 
                            `Manage User: ${user.name}` : 
                            t('dashboard.user_management.manage_user').replace('{{name}}', user.name)
                        }
                    </DialogTitle>
                    <DialogDescription>{t('dashboard.user_management.manage_user_description')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                     <div className="space-y-2">
                         <Label>{t('dashboard.user_management.change_status')}</Label>
                         <div className="flex gap-2">
                            {user.status !== 'active' && <Button disabled={isSaving} onClick={() => handleStatusChange('active')}>{t('dashboard.user_management.activate')}</Button>}
                            {user.status !== 'suspended' && <Button disabled={isSaving} variant="secondary" onClick={() => handleStatusChange('suspended')}>{t('dashboard.user_management.suspend')}</Button>}
                         </div>
                    </div>
                </div>
                <DialogFooter>
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isSaving || user.accountType === "admin" || user.accountType === "super_admin"}>
                                <Trash2 className="mr-2 h-4 w-4" />{t('dashboard.user_management.delete_user')}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t('dashboard.user_management.are_you_sure')}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t('dashboard.user_management.delete_warning')}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                                <AlertDialogAction disabled={isSaving} onClick={handleDelete}>{t('dashboard.user_management.yes_delete')}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export function UserManagementClient({ initialUsers }: { initialUsers: User[] }) {
    const { t, language } = useLocalization()
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({ accountType: "all", status: "all" });

    useEffect(() => setUsers(initialUsers), [initialUsers])

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
            default: return 'default';
        }
    }

    const handleUserUpdate = (updatedUser: User) => {
        setUsers((current) => current.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const handleUserDelete = (userId: string) => {
        setUsers((current) => current.filter(u => u.id !== userId));
    };

    return (
        <div className="space-y-6">
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
                        <SelectItem value="graduate">{language === 'en' ? 'Graduate' : t('common.graduate')}</SelectItem>
                        <SelectItem value="company">{language === 'en' ? 'Company' : t('common.company')}</SelectItem>
                        <SelectItem value="school">{language === 'en' ? 'School' : t('common.school')}</SelectItem>
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
                        <SelectItem value="declined">{t('dashboard.user_management.rejected')}</SelectItem>
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
                                        {language === 'en' ? user.accountType.charAt(0).toUpperCase() + user.accountType.slice(1) : t(`common.${user.accountType}`)}
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
                                <TableCell>
                                    {language === 'en' ? 
                                        new Date(user.date).toLocaleDateString('en-CA') : // YYYY-MM-DD format
                                        new Date(user.date).toLocaleDateString('fr-FR', {
                                            day: '2-digit',
                                            month: '2-digit', 
                                            year: 'numeric'
                                        })
                                    }
                                </TableCell>
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
