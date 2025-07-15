
"use client"

import React, { useState } from "react"
import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, Building, School, Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { UserStatus } from "@/context/auth-context"

type User = {
  id: number
  name: string
  email: string
  accountType: "Company" | "School" | "Graduate" | "Admin"
  status: UserStatus
  date: string
}

const allUsers: User[] = [
    { id: 3, name: "Innovate Inc.", email: "contact@innovate.inc", accountType: "Company", status: "pending", date: "2023-10-23" },
    { id: 4, name: "Prestige University", email: "contact@prestige.edu", accountType: "School", status: "active", date: "2023-10-22" },
];

const RegistrationRequests = () => {
    const { t } = useLocalization();
    const { toast } = useToast();
    const [requests, setRequests] = useState(allUsers.filter(u => u.status === 'pending' && (u.accountType === 'Company' || u.accountType === 'School')));

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
                                        {req.accountType === 'Company' ? <Building className="h-3 w-3" /> : <School className="h-3 w-3" />}
                                        {t(req.accountType)}
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

            <RegistrationRequests />
        </div>
    )
}
