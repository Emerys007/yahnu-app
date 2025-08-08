"use client"

import React, { useState } from "react"
import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building, School, Check, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { type UserStatus } from "@/context/auth-context"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

type User = {
  id: string
  name: string
  email: string
  accountType: "Company" | "School" | "Graduate" | "Admin"
  status: UserStatus
  date: string
}

type AdminClientProps = {
    initialRequests: User[];
};

export const AdminClient = ({ initialRequests }: AdminClientProps) => {
    const { t } = useLocalization();
    const { toast } = useToast();
    const [requests, setRequests] = useState(initialRequests);

    const handleRequest = async (id: string, action: "approve" | "reject") => {
        const request = requests.find(r => r.id === id)
        if (!request) return

        try {
            const userDocRef = doc(db, "users", id);
            const newStatus = action === "approve" ? "active" : "declined";
            await updateDoc(userDocRef, { status: newStatus });

            setRequests(requests.filter(r => r.id !== id))
            toast({
                title: t(action === "approve" ? "Request Approved" : "Request Rejected"),
                description: `${t('The registration for ')} ${request.name} ${t(action === "approve" ? ' has been approved.' : ' has been rejected.')}`,
            })
        } catch (error) {
            console.error("Failed to update user status:", error);
            toast({ title: t('Error'), description: t('Failed to update user status.'), variant: "destructive" });
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('dashboard.admin.overview.pendingRegistrationRequests')}</CardTitle>
                <CardDescription>{t('dashboard.admin.overview.approveOrRejectNewRegistrations')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('dashboard.admin.overview.organizationName')}</TableHead>
                            <TableHead>{t('common.type')}</TableHead>
                            <TableHead className="text-right">{t('dashboard.admin.overview.actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.map(req => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium">{req.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="gap-1">
                                        {req.accountType === 'Company' ? <Building className="h-3 w-3" /> : <School className="h-3 w-3" />}
                                        {t(`accountType.${req.accountType}`)}
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
                                <TableCell colSpan={3} className="h-24 text-center">{t('dashboard.admin.overview.noPendingRequests')}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}