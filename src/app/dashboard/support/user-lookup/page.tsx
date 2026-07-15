
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Briefcase, Building, School, UserCheck, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiFetch } from '@/lib/api-client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

type UserAccount = {
    id: string;
    name: string;
    email: string;
    type: 'graduate' | 'company' | 'school' | 'admin';
    status: 'active' | 'pending' | 'suspended' | string; // Allow for other statuses initially
    slug?: string;
    schoolName?: string;
    industry?: string;
    joinDate: string;
};

type UsersResponse = { data: { users: UserAccount[]; hasMore: boolean } };

const UserProfileDialog = ({ user }: { user: UserAccount }) => {
    const getAccountTypeIcon = (type: UserAccount['type']) => {
        switch(type) {
            case 'graduate': return <UserCheck className="h-5 w-5 text-muted-foreground" />;
            case 'company': return <Building className="h-5 w-5 text-muted-foreground" />;
            case 'school': return <School className="h-5 w-5 text-muted-foreground" />;
            case 'admin': return <Briefcase className="h-5 w-5 text-muted-foreground" />;
            default: return <User className="h-5 w-5 text-muted-foreground" />;
        }
    };
    
    const statusIcons: Record<string, JSX.Element> = {
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

    const statusTranslations: Record<string, string> = {
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
                        <AvatarFallback>{user.name ? user.name.charAt(0) : 'U'}</AvatarFallback>
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
                            <p>{roleTranslations[user.type] || user.type}</p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-muted-foreground">Statut</p>
                        <div className="flex items-center gap-2">
                            {statusIcons[user.status] || <Clock className="h-4 w-4 text-gray-500" />}
                            <p className="capitalize">{statusTranslations[user.status] || user.status}</p>
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
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [messageRecipient, setMessageRecipient] = useState<UserAccount | null>(null);
    const [messageBody, setMessageBody] = useState('');
    const [messageError, setMessageError] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    useEffect(() => {
        const query = searchTerm.trim();
        if (query.length < 2) {
            setAllUsers([]);
            setHasMore(false);
            setIsLoading(false);
            return;
        }
        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setIsLoading(true);
            try {
                const response = await apiFetch<UsersResponse>(`/api/support/users?q=${encodeURIComponent(query)}&limit=25&offset=0`, {
                    signal: controller.signal,
                });
                setAllUsers(response.data.users);
                setHasMore(response.data.hasMore);
            } catch (error) {
                if (!controller.signal.aborted) console.error("Error fetching users: ", error);
            } finally {
                if (!controller.signal.aborted) setIsLoading(false);
            }
        }, 350);
        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [searchTerm]);

    const loadMoreUsers = async () => {
        const query = searchTerm.trim();
        if (query.length < 2 || !hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const response = await apiFetch<UsersResponse>(
                `/api/support/users?q=${encodeURIComponent(query)}&limit=25&offset=${allUsers.length}`,
            );
            setAllUsers((current) => {
                const existing = new Set(current.map((user) => user.id));
                return [...current, ...response.data.users.filter((user) => !existing.has(user.id))];
            });
            setHasMore(response.data.hasMore);
        } catch (error) {
            console.error('Unable to load more users.', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleSendMessage = (user: UserAccount) => {
        setMessageRecipient(user);
        setMessageBody('');
        setMessageError('');
    };

    const createConversation = async () => {
        if (!messageRecipient || !messageBody.trim() || isSendingMessage) return;
        setIsSendingMessage(true);
        setMessageError('');
        try {
            const response = await apiFetch<{ data: { conversation: { id: string } } }>('/api/conversations', {
                method: 'POST',
                body: JSON.stringify({
                    recipientIds: [messageRecipient.id],
                    initialMessage: messageBody.trim(),
                }),
            });
            const conversationId = response.data.conversation.id;
            setMessageRecipient(null);
            router.push(`/dashboard/messages?convoId=${encodeURIComponent(conversationId)}`);
        } catch (error) {
            setMessageError(error instanceof Error ? error.message : 'Impossible de créer la conversation.');
        } finally {
            setIsSendingMessage(false);
        }
    };

    const getStatusVariant = (status: UserAccount['status']) => {
        switch (status) {
            case 'active': return 'default';
            case 'pending': return 'secondary';
            case 'suspended': return 'destructive';
            default: return 'outline';
        }
    };
    
    const getAccountTypeIcon = (type: UserAccount['type']) => {
        switch(type) {
            case 'graduate': return <UserCheck className="h-4 w-4" />;
            case 'company': return <Building className="h-4 w-4" />;
            case 'school': return <School className="h-4 w-4" />;
            case 'admin': return <Briefcase className="h-4 w-4" />;
            default: return <User className="h-4 w-4" />;
        }
    }

    const roleTranslations: Record<string, string> = {
        graduate: "Diplômé",
        company: "Entreprise",
        school: "École",
        admin: "Admin",
    };

    const statusTranslations: Record<string, string> = {
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
                            {allUsers.length > 0 ? allUsers.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-sm text-muted-foreground">{user.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getAccountTypeIcon(user.type)}
                                            <span>{roleTranslations[user.type] || user.type}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(user.status)}>{statusTranslations[user.status] || user.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm">Voir le Profil</Button>
                                            </DialogTrigger>
                                            <UserProfileDialog user={user} />
                                        </Dialog>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleSendMessage(user)}
                                            disabled={user.status !== 'active'}
                                            title={user.status === 'active' ? 'Envoyer un message' : 'Le compte doit être actif pour recevoir un message'}
                                        >
                                            Message
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        {searchTerm.trim().length < 2
                                            ? 'Saisissez au moins deux caractères pour rechercher un utilisateur.'
                                            : 'Aucun utilisateur ne correspond à votre recherche.'}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    )}
                    {hasMore && !isLoading && (
                        <div className="flex justify-center border-t pt-4">
                            <Button type="button" variant="outline" onClick={() => void loadMoreUsers()} disabled={isLoadingMore}>
                                {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Charger plus de résultats
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Dialog
                open={Boolean(messageRecipient)}
                onOpenChange={(open) => {
                    if (!open && !isSendingMessage) {
                        setMessageRecipient(null);
                        setMessageBody('');
                        setMessageError('');
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nouveau message</DialogTitle>
                        <DialogDescription>
                            Démarrez une conversation privée avec {messageRecipient?.name || 'cet utilisateur'}.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        value={messageBody}
                        onChange={(event) => setMessageBody(event.target.value)}
                        maxLength={10_000}
                        rows={7}
                        placeholder="Écrivez votre message…"
                        aria-label="Message initial"
                        disabled={isSendingMessage}
                    />
                    {messageError && <p className="text-sm text-destructive" role="alert">{messageError}</p>}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setMessageRecipient(null)}
                            disabled={isSendingMessage}
                        >
                            Annuler
                        </Button>
                        <Button type="button" onClick={() => void createConversation()} disabled={isSendingMessage || !messageBody.trim()}>
                            {isSendingMessage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Envoyer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
