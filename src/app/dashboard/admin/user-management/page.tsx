
import { UserCog } from "lucide-react";
import { UserManagementClient } from "./user-management-client";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, DocumentData, where } from "firebase/firestore";
import { type Role, type UserStatus } from "@/context/auth-context";
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

type User = {
  id: string;
  name: string;
  email: string;
  accountType: Role;
  status: UserStatus;
  date: string;
};

async function getUsers(): Promise<User[]> {
    const usersRef = collection(db, "users");
    // Only fetch non-admin roles for this page
    const q = query(usersRef, where("role", "in", ["graduate", "company", "school"]));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        return {
            id: doc.id,
            name: data.name || data.email,
            email: data.email,
            accountType: data.role,
            status: data.status,
            date: createdAt.toISOString().split('T')[0],
        } as User;
    });
}

export default async function ManageUsersPage() {
    const users = await getUsers();
    
    // Simple translation function for server component
    const t = (key: string): string => {
        const keys = key.split('.');
        let value = fr; // Default to French
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Return key if not found
            }
        }
        
        return typeof value === 'string' ? value : key;
    };

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        <UserCog className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.user_management.title')}</h1>
                        <p className="text-muted-foreground mt-1">{t('dashboard.user_management.description')}</p>
                    </div>
                </div>
            </div>
            <UserManagementClient initialUsers={users} />
        </div>
    )
}
