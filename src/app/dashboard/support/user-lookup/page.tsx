
"use client"

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Mail, Briefcase, Building, School, UserCheck, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

type UserAccount = {
    id: string;
    name: string;
    email: string;
    type: 'graduate' | 'company' | 'school' | 'admin';
    status: 'active' | 'pending' | 'suspended';
    slug?: string;
    schoolName?: string;
    industry?: string;
    joinDate: string;
};

const UserProfileDialog = ({ user }: { user: UserAccount }) => {
    const getAccountTypeIcon = (type: UserAccount['type']) => {
        switch(type) {
            case 'graduate': return <UserCheck className="h-5 w-5 text-muted-foreground" />;
            case 'company': return <Building className="h-5 w-5 text-muted-foreground" />;
            case 'school': return <School className="h-5 w-5 text-muted-foreground" />;
            case 'admin': return <Briefcase className="h-5 w-5 text-muted-foreground" />;
        }
    };
    
    const statusIcons = {
        active: <CheckCircle className="h-4 w-4 text-green-500" />,
        pending: <Clock className="h-4 w-4 text-yellow-500" />,
        suspended: <XCircle className="h-4 w-4 text-red-500" />,
    };

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
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Profil de l'utilisateur</DialogTitle>
                <DialogDescription>
                    Aperçu des informations du compte de l'utilisateur.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="text-xl font-semibold">{user.name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Type de compte</p>
                        <div className="flex items-center gap-2">
                             {getAccountTypeIcon(user.type)}
                            <p>{roleTranslations[user.type]}</p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Statut</p>
                        <div className="flex items-center gap-2">
                            {statusIcons[user.status]}
                            <p className="capitalize">{statusTranslations[user.status]}</p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Date d'inscription</p>
                        <p>{new Date(user.joinDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                     {user.type === 'graduate' && user.schoolName && (
                        <div className="space-y-1">
                            <p className="text-muted-foreground">École</p>
                            <p>{user.schoolName}</p>
                        </div>
                    )}
                    {user.type === 'company' && user.industry && (
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Secteur</p>
                            <p>{user.industry}</p>
                        </div>
                    )}
                </div>
            </div>
        </DialogContent>
    );
};


export default function UserLookupPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [allUsers, setAllUsers] = useState<UserAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                const usersRef = collection(db, "users");
                const q = query(usersRef, where("role", "in", ["graduate", "company", "school"]));
                const querySnapshot = await getDocs(q);
                const usersList = querySnapshot.docs.map(doc => {
                    const data = doc.data() as DocumentData;
                    return {
                        id: doc.id,
                        name: data.name || data.email,
                        email: data.email,
                        type: data.role,
                        status: data.status,
                        slug: data.slug || doc.id,
                        schoolName: data.schoolName || '',
                        industry: data.industry || '',
                        joinDate: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                    } as UserAccount;
                });
                setAllUsers(usersList);
            } catch (error) {
                console.error("Error fetching users: ", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) {
            return allUsers;
        }
        const term = searchTerm.toLowerCase();
        return allUsers.filter(u =>
            (u.name && u.name.toLowerCase().includes(term)) ||
            (u.email && u.email.toLowerCase().includes(term))
        );
    }, [searchTerm, allUsers]);

    const handleSendMessage = (user: UserAccount) => {
        const newConvoId = user.email.split('@')[0].replace(/[^a-z0-9]/gi, '-');
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
                    <CardTitle>Résultats</CardTitle>
                </CardHeader>
                <CardContent>
                     {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
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
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm">Voir le Profil</Button>
                                            </DialogTrigger>
                                            <UserProfileDialog user={user} />
                                        </Dialog>
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
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
