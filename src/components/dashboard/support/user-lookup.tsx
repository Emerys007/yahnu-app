
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocalization } from '@/context/localization-context';
import { Search, User, Mail, Briefcase, Building, School, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type UserAccount = {
    id: string;
    name: string;
    email: string;
    type: 'graduate' | 'company' | 'school' | 'admin';
    status: 'active' | 'pending' | 'suspended';
};

const allUsers: UserAccount[] = [
    { id: 'usr_001', name: 'Amina Diallo', email: 'amina.diallo@example.com', type: 'graduate', status: 'active' },
    { id: 'usr_002', name: 'Kwame Nkrumah', email: 'kwame.nkrumah@example.com', type: 'graduate', status: 'pending' },
    { id: 'usr_003', name: 'Orange', email: 'contact@orange.ci', type: 'company', status: 'active' },
    { id: 'usr_004', name: 'INP-HB', email: 'admin@inphb.ci', type: 'school', status: 'active' },
    { id: 'usr_005', name: 'Cheikh Anta Diop', email: 'cheikh.anta.diop@example.com', type: 'graduate', status: 'suspended' },
];

export default function UserLookup() {
    const { t } = useLocalization();
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

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                     <div className="bg-primary/10 p-3 rounded-lg">
                        <Search className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">User Lookup</h1>
                        <p className="text-muted-foreground mt-1">Search for users by name or email.</p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Search</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex w-full max-w-sm items-center space-x-2">
                        <Input 
                            type="text" 
                            placeholder="e.g., Amina Diallo or contact@orange.ci" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch}>Search</Button>
                    </div>
                </CardContent>
            </Card>

            {foundUser && (
                <Card>
                    <CardHeader>
                        <CardTitle>User Details</CardTitle>
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
                                <h4 className="font-semibold">Account Type</h4>
                                <p className="capitalize">{t(foundUser.type)}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold">Status</h4>
                                <Badge variant={getStatusVariant(foundUser.status)}>{t(foundUser.status)}</Badge>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                        <Button>View Profile (Not Implemented)</Button>
                        <Button variant="outline" onClick={() => handleSendMessage(foundUser)}>Send Message</Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
}
