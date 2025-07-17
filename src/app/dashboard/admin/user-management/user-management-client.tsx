
"use client"

import React, { useState } from "react"
import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, Search, School, Building, PlusCircle, Trash2, ShieldAlert, VenetianMask, UserCog } from "lucide-react"
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
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { type Role, type UserStatus } from "@/context/auth-context"
import { doc, updateDoc } from "firebase/firestore"
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
    
    const handleDelete = () => {
        onUserDelete(user.id);
        toast({ title: t('User Deleted'), description: `${user.name} ${t('has been removed from the platform.')}`, variant: "destructive" });
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
                            <Button variant="destructive" disabled={user.accountType === "admin"}><Trash2 className="mr-2 h-4 w-4" />{t('Delete User')}</Button>
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

const addOrgSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email(),
})

const AddSchoolDialog = ({ onAdd }: { onAdd: (user: User) => void }) => {
    const { t } = useLocalization()
    const [isOpen, setIsOpen] = useState(false)
    const [passwordInfo, setPasswordInfo] = useState<{ name: string; pass: string } | null>(null)
    const form = useForm<z.infer<typeof addOrgSchema>>({
        resolver: zodResolver(addOrgSchema),
        defaultValues: { name: "", email: "" },
    })

    function onSubmit(values: z.infer<typeof addOrgSchema>) {
        const tempPassword = Math.random().toString(36).slice(-8);
        const newUser: User = {
            id: Date.now().toString(), // Use string ID for consistency
            name: values.name,
            email: values.email,
            accountType: "school",
            status: "active",
            date: new Date().toISOString().split('T')[0],
        }
        onAdd(newUser)
        setPasswordInfo({ name: values.name, pass: tempPassword })
        form.reset()
        setIsOpen(false)
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" />{t('Add School')}</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Add a new School')}</DialogTitle>
                        <DialogDescription>{t("Manually create a new school account. The account will be active immediately.")}</DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                             <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('School Name')}</FormLabel>
                                    <FormControl><Input placeholder={t("Prestige University")} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('Administrator Email')}</FormLabel>
                                    <FormControl><Input placeholder="admin@prestige.edu" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit">{t('Create School Account')}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
             <AlertDialog open={!!passwordInfo} onOpenChange={() => setPasswordInfo(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('Account Created Successfully!')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('The account for {name} has been created. Please securely share the following temporary password with them.', { name: passwordInfo?.name })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="bg-muted p-4 rounded-md text-center">
                        <p className="text-sm text-muted-foreground">{t('Temporary Password')}</p>
                        <p className="text-lg font-bold tracking-widest">{passwordInfo?.pass}</p>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setPasswordInfo(null)}>{t('Close')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

const AddCompanyDialog = ({ onAdd }: { onAdd: (user: User) => void }) => {
    const { t } = useLocalization()
    const [isOpen, setIsOpen] = useState(false)
    const [passwordInfo, setPasswordInfo] = useState<{ name: string; pass: string } | null>(null)
    const form = useForm<z.infer<typeof addOrgSchema>>({
        resolver: zodResolver(addOrgSchema),
        defaultValues: { name: "", email: "" },
    })

    function onSubmit(values: z.infer<typeof addOrgSchema>) {
        const tempPassword = Math.random().toString(36).slice(-8);
        const newUser: User = {
            id: Date.now().toString(), // Use string ID for consistency
            name: values.name,
            email: values.email,
            accountType: "company",
            status: "active",
            date: new Date().toISOString().split('T')[0],
        }
        onAdd(newUser)
        setPasswordInfo({ name: values.name, pass: tempPassword })
        form.reset()
        setIsOpen(false)
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button><PlusCircle className="mr-2 h-4 w-4" />{t('Add Company')}</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('Add a new Company')}</DialogTitle>
                        <DialogDescription>{t("Manually create a new company account. The account will be active immediately.")}</DialogDescription>
                    </DialogHeader>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                             <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('Company Name')}</FormLabel>
                                    <FormControl><Input placeholder={t("Innovate Inc.")} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('Administrator Email')}</FormLabel>
                                    <FormControl><Input placeholder="hr@innovate.inc" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="submit">{t('Create Company Account')}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            <AlertDialog open={!!passwordInfo} onOpenChange={() => setPasswordInfo(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('Account Created Successfully!')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('The account for {name} has been created. Please securely share the following temporary password with them.', { name: passwordInfo?.name })}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="bg-muted p-4 rounded-md text-center">
                        <p className="text-sm text-muted-foreground">{t('Temporary Password')}</p>
                        <p className="text-lg font-bold tracking-widest">{passwordInfo?.pass}</p>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setPasswordInfo(null)}>{t('Close')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
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
            default: return 'default';
        }
    }

    const handleUserUpdate = (updatedUser: User) => {
        setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const handleUserDelete = (userId: string) => {
        setUsers(users.filter(u => u.id !== userId));
    };

    const handleAddUser = (newUser: User) => {
        setUsers(prev => [newUser, ...prev])
    }
    
    return (
        <>
            <div className="flex justify-end gap-2">
                <AddSchoolDialog onAdd={handleAddUser} />
                <AddCompanyDialog onAdd={handleAddUser} />
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
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    )
}
