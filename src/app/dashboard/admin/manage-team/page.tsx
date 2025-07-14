
"use client"

import React, { useState } from "react"
import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Crown, Trash2, UserPlus, Users, Link as LinkIcon, Copy } from "lucide-react"
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

type AdminUser = {
  id: number
  name: string
  email: string
  accountType: "Admin" | "Super Admin" | "Content Moderator" | "Support Staff"
}

const initialAdmins: AdminUser[] = [
  { id: 1, name: "Dr. Evelyn Reed", email: "e.reed@yahnu.ci", accountType: "Super Admin" },
  { id: 2, name: "John Carter", email: "j.carter@yahnu.ci", accountType: "Admin" },
]

export default function ManageTeamPage() {
    const { t } = useLocalization();
    const { toast } = useToast();
    const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [inviteLink, setInviteLink] = useState("");

    const handleDeleteAdmin = (id: number) => {
        const adminToDelete = admins.find(a => a.id === id);
        if (adminToDelete?.accountType === 'Super Admin') {
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
        const uniqueToken = Math.random().toString(36).substring(2, 15);
        const newInviteLink = `https://yahnu.ci/register?invite=${uniqueToken}`;
        setInviteLink(newInviteLink);
        setIsInviteDialogOpen(true);
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        toast({
            title: t('Link Copied'),
            description: t('The invite link has been copied to your clipboard.'),
        });
    }

    return (
        <div className="space-y-8">
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('Manage Team')}</h1>
                    <p className="text-muted-foreground mt-1">{t('Invite and manage users with administrative privileges.')}</p>
                </div>
            </div>
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
                                        <Badge variant={admin.accountType === 'Super Admin' ? 'default' : 'secondary'}>
                                            {admin.accountType === 'Super Admin' && <Crown className="mr-1 h-3 w-3" />}
                                            {t(admin.accountType)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button size="icon" variant="ghost" onClick={() => handleDeleteAdmin(admin.id)} disabled={admin.accountType === 'Super Admin'}>
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
        </div>
    );
}
