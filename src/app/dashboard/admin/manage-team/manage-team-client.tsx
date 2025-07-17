
"use client"

import React, { useState } from "react"
import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Crown, Trash2, UserPlus, Copy } from "lucide-react"
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
import { type Role } from "@/context/auth-context"


type AdminUser = {
  id: string
  name: string
  email: string
  accountType: Role
}

export function ManageTeamClient({ initialAdmins }: { initialAdmins: AdminUser[] }) {
    const { t } = useLocalization();
    const { toast } = useToast();
    const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [inviteLink, setInviteLink] = useState("");

    const handleDeleteAdmin = (id: string) => {
        const adminToDelete = admins.find(a => a.id === id);
        if (adminToDelete?.accountType === 'super_admin') {
            toast({
                title: t('Action Forbidden'),
                description: t('The Super Admin account cannot be deleted.'),
                variant: "destructive"
            });
            return;
        }
        setAdmins(admins.filter(a => a.id !== id));
        toast({
            title: t('Admin Removed'),
            description: `${adminToDelete?.name} ${t('has been removed from administrators.')}`,
        })
    }

    const handleInviteAdmin = () => {
        // In a real app, you would generate a secure, single-use token on the server
        // and store it. For this example, we generate a client-side token.
        const uniqueToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const newInviteLink = `${window.location.origin}/register?invite=${uniqueToken}`;
        setInviteLink(newInviteLink);
        setIsInviteDialogOpen(true);
        // Here you would also typically save the token on the server with the associated
        // email and role to validate it upon registration.
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        toast({
            title: t('Link Copied'),
            description: t('The invite link has been copied to your clipboard.'),
        });
    }

    const getRoleDisplayName = (role: Role) => {
        const roleMap: Record<Role, string> = {
            admin: 'Admin',
            super_admin: 'Super Admin',
            content_moderator: 'Content Moderator',
            support_staff: 'Support Staff',
            graduate: 'Graduate',
            company: 'Company',
            school: 'School'
        }
        return t(roleMap[role] || role);
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>{t('Platform Administrators')}</CardTitle>
                    <CardDescription>{t('Manage users with administrative privileges.')}</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="mb-6 p-4 border rounded-lg">
                        <h4 className="font-semibold mb-2">{t('Invite New Administrator')}</h4>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Input placeholder={t("New admin's email")} type="email" className="flex-grow" />
                            <Select defaultValue="admin">
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder={t('Select role')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">{t('Admin')}</SelectItem>
                                    <SelectItem value="content_moderator">{t('Content Moderator')}</SelectItem>
                                    <SelectItem value="support_staff">{t('Support Staff')}</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleInviteAdmin}><UserPlus className="mr-2 h-4 w-4" />{t('Send Invite')}</Button>
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Name')}</TableHead>
                                <TableHead>{t('Email')}</TableHead>
                                <TableHead>{t('Account Type')}</TableHead>
                                <TableHead className="text-right">{t('Actions')}</TableHead>
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
                        <DialogTitle>{t('Administrator Invitation Link')}</DialogTitle>
                        <DialogDescription>{t('Share this link with the new administrator to allow them to register.')}</DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 mt-4">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="link" className="sr-only">
                                {t('Link')}
                            </Label>
                            <Input
                                id="link"
                                defaultValue={inviteLink}
                                readOnly
                            />
                        </div>
                        <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
                            <span className="sr-only">{t('Copy')}</span>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>{t('Close')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

    