
"use client"

import React, { useState } from "react"
import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, Building, School, Check, X, Crown, Trash2, UserPlus, Users, Clock, LineChart } from "lucide-react"
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

type AdminUser = {
  id: number
  name: string
  email: string
  role: "Admin" | "Super Admin" | "Content Moderator" | "Support Staff"
}

const allUsers = [
    { id: 3, name: "Innovate Inc.", email: "contact@innovate.inc", role: "Company", status: "pending", date: "2023-10-23" },
    { id: 4, name: "Prestige University", email: "contact@prestige.edu", role: "School", status: "active", date: "2023-10-22" },
];

const initialAdmins: AdminUser[] = [
  { id: 1, name: "Dr. Evelyn Reed", email: "e.reed@yahnu.ci", role: "Super Admin" },
  { id: 2, name: "John Carter", email: "j.carter@yahnu.ci", role: "Admin" },
]

const RegistrationRequests = () => {
    const { t } = useLocalization();
    const { toast } = useToast();
    const [requests, setRequests] = useState(allUsers.filter(u => u.status === 'pending' && u.role !== 'Graduate'));

    const handleRequest = (id: number, action: "approve" | "reject") => {
        const request = requests.find(r => r.id === id)
        if (!request) return

        setRequests(requests.filter(r => r.id !== id))
        toast({
            title: t(action === "approve" ? "Request Approved" : "Request Rejected"),
            description: `${t('The registration for ')} ${request.name} ${t(action === "approve" ? ' has been approved.' : ' has been rejected.')}`,
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('Pending Registration Requests')}</CardTitle>
                <CardDescription>{t('Approve or reject new company and school registrations.')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('Organization Name')}</TableHead>
                            <TableHead>{t('Type')}</TableHead>
                            <TableHead className="text-right">{t('Actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.map(req => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium">{req.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="gap-1">
                                        {req.role === 'Company' ? <Building className="h-3 w-3" /> : <School className="h-3 w-3" />}
                                        {t(req.role)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button size="sm" variant="outline" onClick={() => handleRequest(req.id, "reject")}><X className="h-4 w-4" /></Button>
                                    <Button size="sm" onClick={() => handleRequest(req.id, "approve")}><Check className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {requests.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">{t('No pending requests.')}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

const AdminManagement = () => {
    const { t } = useLocalization();
    const { toast } = useToast();
    const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);

    const handleDeleteAdmin = (id: number) => {
        const adminToDelete = admins.find(a => a.id === id);
        if (adminToDelete?.role === 'Super Admin') {
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
        toast({
            title: t("Invite Sent"),
            description: t("An invitation has been sent to the new administrator's email.")
        })
    }

    return (
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
                            <TableHead>{t('Role')}</TableHead>
                            <TableHead className="text-right">{t('Actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {admins.map(admin => (
                            <TableRow key={admin.id}>
                                <TableCell className="font-medium">{admin.name}</TableCell>
                                <TableCell>{admin.email}</TableCell>
                                <TableCell>
                                    <Badge variant={admin.role === 'Super Admin' ? 'default' : 'secondary'}>
                                        {admin.role === 'Super Admin' && <Crown className="mr-1 h-3 w-3" />}
                                        {t(admin.role)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button size="icon" variant="ghost" onClick={() => handleDeleteAdmin(admin.id)} disabled={admin.role === 'Super Admin'}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

export default function AdminPage() {
    const { t } = useLocalization()
    
    return (
        <div className="space-y-8">
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('Admin Overview')}</h1>
                    <p className="text-muted-foreground mt-1">{t('Oversee and manage the entire Yahnu platform.')}</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-start">
                <RegistrationRequests />
                <AdminManagement />
            </div>
        </div>
    )
}
