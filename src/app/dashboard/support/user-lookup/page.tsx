
"use client"

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Mail, Briefcase, Building, School, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type UserAccount = {
    id: string;
    name: string;
    email: string;
    type: 'graduate' | 'company' | 'school' | 'admin';
    status: 'active' | 'pending' | 'suspended';
    slug?: string;
};

const allUsers: UserAccount[] = [
    { id: 'usr_001', name: 'Amina Diallo', email: 'amina.diallo@example.com', type: 'graduate', status: 'active', slug: 'amina-diallo' },
    { id: 'usr_002', name: 'Orange Côte d\'Ivoire', email: 'contact@orange.ci', type: 'company', status: 'active', slug: 'orange-ci' },
    { id: 'usr_003', name: 'INP-HB', email: 'admin@inphb.ci', type: 'school', status: 'active', slug: 'inp-hb' },
    { id: 'usr_004', name: 'Ben Traoré', email: 'ben.traore@example.com', type: 'graduate', status: 'pending', slug: 'ben-traore'},
    { id: 'usr_005', name: 'SIFCA', email: 'contact@sifca.ci', type: 'company', status: 'suspended', slug: 'sifca'},
];

export default function UserLookupPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = useMemo(() => {
        if (!searchTerm) {
            return allUsers.filter(u => u.type !== 'admin');
        }
        const term = searchTerm.toLowerCase();
        return allUsers.filter(u => 
            u.type !== 'admin' && 
            (u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term))
        );
    }, [searchTerm]);

    const handleSendMessage = (user: UserAccount) => {
        const newConvoId = user.email.split('@')[0].replace('.', '-');
        router.push(`/dashboard/messages?new=${newConvoId}&name=${encodeURIComponent(user.name)}`);
    };

    const getStatusVariant = (status: UserAccount['status']) => {
        switch (status) {
            case 'active': return 'default';
            case 'pending': return 'secondary';
            case 'suspended': return 'destructive';
        }
    };
    
    const getAccountTypeIcon = (type: UserAccount['type']) => {
        switch(type) {
            case 'graduate': return <UserCheck className="h-4 w-4" />;
            case 'company': return <Building className="h-4 w-4" />;
            case 'school': return <School className="h-4 w-4" />;
            case 'admin': return <Briefcase className="h-4 w-4" />;
        }
    }
    
    const getProfileLink = (user: UserAccount) => {
        if (!user.slug) return null;
        switch(user.type) {
            case 'graduate': return `/dashboard/talent-pool/${user.slug}`;
            case 'company': return `/companies/${user.slug}`;
            case 'school': return `/schools/${user.slug}`;
            default: return null;
        }
    }

    const roleTranslations: Record<UserAccount['type'], string> = {
        graduate: "Diplômé",
        company: "Entreprise",
        school: "École",
        admin: "Admin",
    };

    const statusTranslations: Record<UserAccount['status'], string> = {
        active: "Actif",
        pending: "En attente",
        suspended: "Suspendu",
    };

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                     <div className="bg-primary/10 p-3 rounded-lg">
                        <Search className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Recherche d'utilisateur</h1>
                        <p className="text-muted-foreground mt-1">Recherchez des utilisateurs par nom ou par e-mail.</p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filtrer les utilisateurs</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex w-full max-w-sm items-center space-x-2">
                        <Input 
                            type="text" 
                            placeholder="Ex: Amina Diallo ou contact@orange.ci" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Résultats de la recherche</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-sm text-muted-foreground">{user.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getAccountTypeIcon(user.type)}
                                            <span>{roleTranslations[user.type]}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(user.status)}>{statusTranslations[user.status]}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        {getProfileLink(user) && (
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={getProfileLink(user)!}>Voir le Profil</Link>
                                            </Button>
                                        )}
                                        <Button variant="outline" size="sm" onClick={() => handleSendMessage(user)}>
                                            Message
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        Aucun utilisateur ne correspond à votre recherche.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
