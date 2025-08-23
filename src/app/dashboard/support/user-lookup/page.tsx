
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Mail, Briefcase, Building, School, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type UserAccount = {
    id: string;
    name: string;
    email: string;
    type: 'graduate' | 'company' | 'school' | 'admin';
    status: 'active' | 'pending' | 'suspended';
    slug?: string;
};

// Data consistent with talent-pool and company profiles
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
    const [foundUser, setFoundUser] = useState<UserAccount | null>(null);

    const handleSearch = () => {
        const term = searchTerm.toLowerCase();
        const user = allUsers.find(u => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
        setFoundUser(user || null);
    };

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
            case 'graduate': return <UserCheck className="h-5 w-5" />;
            case 'company': return <Building className="h-5 w-5" />;
            case 'school': return <School className="h-5 w-5" />;
            case 'admin': return <Briefcase className="h-5 w-5" />;
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
                    <CardTitle>Rechercher</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex w-full max-w-sm items-center space-x-2">
                        <Input 
                            type="text" 
                            placeholder="Ex: Amina Diallo ou contact@orange.ci" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch}>Rechercher</Button>
                    </div>
                </CardContent>
            </Card>

            {foundUser && (
                <Card>
                    <CardHeader>
                        <CardTitle>Détails de l'utilisateur</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                {getAccountTypeIcon(foundUser.type)}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">{foundUser.name}</h3>
                                <p className="text-sm text-muted-foreground">{foundUser.email}</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div>
                                <h4 className="font-semibold">Type de compte</h4>
                                <p className="capitalize">{roleTranslations[foundUser.type]}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold">Statut</h4>
                                <Badge variant={getStatusVariant(foundUser.status)}>{statusTranslations[foundUser.status]}</Badge>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                         {getProfileLink(foundUser) ? (
                            <Button asChild>
                                <Link href={getProfileLink(foundUser)!}>Voir le Profil</Link>
                            </Button>
                        ) : (
                            <Button disabled>Voir le Profil</Button>
                        )}
                        <Button variant="outline" onClick={() => handleSendMessage(foundUser)}>Envoyer un message</Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
