
"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Check, X, Building, School, Eye } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { type ModerationItem } from './page';
import { apiFetch } from "@/lib/api-client";

export function ContentModerationClient({ initialItems }: { initialItems: ModerationItem[] }) {
    const [items, setItems] = useState<ModerationItem[]>(initialItems);
    const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
    const { toast } = useToast();

    const handleAction = async (itemId: string, status: 'active' | 'declined') => {
        const itemToUpdate = items.find(item => item.id === itemId);
        if (!itemToUpdate) return;
        
        try {
            await apiFetch(`/api/content/moderation/${encodeURIComponent(itemId)}`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            
            setItems(prevItems => prevItems.filter(item => item.id !== itemId));
            
            toast({
                title: `Profil ${status === 'active' ? 'Approuvé' : 'Rejeté'}`,
                description: `Le profil de ${itemToUpdate.name} a été mis à jour.`,
            });
        } catch (error) {
            console.error("Failed to update item status:", error);
            toast({
                title: "Erreur",
                description: "Impossible de mettre à jour le statut du profil.",
                variant: "destructive",
            });
        }
    };

    const companies = items.filter(item => item.type === 'company');
    const schools = items.filter(item => item.type === 'school');

    const renderItemsTable = (items: ModerationItem[]) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Date de soumission</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.length > 0 ? items.map(item => (
                    <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>{item.submittedAt}</TableCell>
                        <TableCell className="text-right space-x-2">
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)}><Eye className="h-4 w-4 mr-1" />Détails</Button>
                            </DialogTrigger>
                            <Button variant="ghost" size="icon" className="text-green-500" onClick={() => handleAction(item.id, 'active')}>
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleAction(item.id, 'declined')}>
                                <X className="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">Aucun élément en attente.</TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Contenu en attente d'approbation</CardTitle>
            </CardHeader>
            <CardContent>
                <Dialog>
                    <Tabs defaultValue="companies">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="companies"><Building className="h-4 w-4 mr-2" />Entreprises <Badge className="ml-2">{companies.length}</Badge></TabsTrigger>
                            <TabsTrigger value="schools"><School className="h-4 w-4 mr-2" />Écoles <Badge className="ml-2">{schools.length}</Badge></TabsTrigger>
                        </TabsList>
                        <TabsContent value="companies">
                            {renderItemsTable(companies)}
                        </TabsContent>
                        <TabsContent value="schools">
                            {renderItemsTable(schools)}
                        </TabsContent>
                    </Tabs>
                    
                    {selectedItem && (
                        <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Détails du profil</DialogTitle>
                                <DialogDescription>Examinez les informations soumises ci-dessous.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                {Object.entries(selectedItem.details).map(([key, value]) => (
                                    <div key={key} className="grid grid-cols-3 items-center gap-4">
                                        <div className="font-semibold capitalize col-span-1">{key.replace(/([A-Z])/g, ' $1')}</div>
                                        <div className="col-span-2 break-words text-muted-foreground">
                                            {typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? '—')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedItem(null)}>Fermer</Button>
                                <Button className="bg-red-500 hover:bg-red-600" onClick={() => { void handleAction(selectedItem.id, 'declined'); setSelectedItem(null); }}>Rejeter</Button>
                                <Button className="bg-green-500 hover:bg-green-600" onClick={() => { void handleAction(selectedItem.id, 'active'); setSelectedItem(null); }}>Approuver</Button>
                            </DialogFooter>
                        </DialogContent>
                    )}
                </Dialog>
            </CardContent>
        </Card>
    );
}
