
"use client"

import React, { useState } from "react"
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
                title: action === "approve" ? "Demande approuvée" : "Demande rejetée",
                description: `L'inscription pour ${request.name} a été ${action === "approve" ? 'approuvée' : 'rejetée'}.`,
            })
        } catch (error) {
            console.error("Failed to update user status:", error);
            toast({ title: "Erreur", description: "La mise à jour du statut de l'utilisateur a échoué.", variant: "destructive" });
        }
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nom de l'organisation</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {requests.map(req => (
                    <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.name}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className="gap-1">
                                {req.accountType === 'Company' ? <Building className="h-3 w-3" /> : <School className="h-3 w-3" />}
                                {req.accountType}
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
                        <TableCell colSpan={3} className="h-24 text-center">Aucune demande en attente</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}
