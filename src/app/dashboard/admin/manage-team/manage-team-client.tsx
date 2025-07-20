
"use client"

import React, { useState } from "react"
import { useLocalization } from "@/context/localization-context"
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
import { type Role } from "@/context/auth-context"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"


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
    const [isInviting, setIsInviting] = useState(false);
    const [inviteDetails, setInviteDetails] = useState({ email: "", role: "admin" as Role });

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

    const handleInviteAdmin = async () => {
        if (!inviteDetails.email) {
            toast({ title: t("Email required"), description: t("Please enter an email to send an invite."), variant: "destructive"});
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
            toast({ title: t("Error"), description: t("Could not create invitation link."), variant: "destructive"});
        } finally {
            setIsInviting(false);
        }
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
            content_manager: 'Content Manager',
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
                        <div className="flex flex-col sm:flex-row items-end gap-2">
                            <div className="grid gap-2 flex-grow w-full">
                                <Label htmlFor="invite-email">{t("New admin's email")}</Label>
                                <Input 
                                    id="invite-email" 
                                    placeholder={t("New admin's email")} 
                                    type="email" 
                                    value={inviteDetails.email}
                                    onChange={(e) => setInviteDetails(prev => ({...prev, email: e.target.value}))}
                                    disabled={isInviting}
                                />
                            </div>
                             <div className="grid gap-2 w-full sm:w-auto shrink-0">
                                 <Label htmlFor="invite-role">{t('Select role')}</Label>
                                <Select 
                                    defaultValue={inviteDetails.role} 
                                    onValueChange={(value) => setInviteDetails(prev => ({...prev, role: value as Role}))}
                                    disabled={isInviting}
                                >
                                    <SelectTrigger id="invite-role" className="w-full sm:w-[180px]">
                                        <SelectValue placeholder={t('Select role')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">{t('Admin')}</SelectItem>
                                        <SelectItem value="content_manager">{t('Content Manager')}</SelectItem>
                                        <SelectItem value="support_staff">{t('Support Staff')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleInviteAdmin} className="w-full sm:w-auto px-4" disabled={isInviting}>
                                {isInviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                {isInviting ? t('Sending...') : t('Send Invite')}
                            </Button>
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
