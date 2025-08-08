
"use client"

import { UserCog } from "lucide-react";
import { UserManagementClient } from "./user-management-client";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, DocumentData, where } from "firebase/firestore";
import { type Role, type UserStatus } from "@/context/auth-context";
import { useLocalization } from "@/context/localization-context";
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';

// Client component for the header that respects language context
function UserManagementHeader() {
    const { t } = useLocalization();
    return (
        <>
            <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.user_management.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('dashboard.user_management.description')}</p>
        </>
    );
}

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
    // Note: In a real app, you'd get the user's language preference from cookies or headers
    // For now, we'll use a simple approach that checks both locales
    const t = (key: string, preferredLocale: 'en' | 'fr' = 'en'): string => {
        const keys = key.split('.');
        let value = preferredLocale === 'fr' ? fr : en;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Return key if not found
            }
        }
        
        return typeof value === 'string' ? value : key;
    };

    // For demonstration, we'll render both language versions
    // In a real app, you'd determine the user's language preference

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        <UserCog className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        {/* Client-side rendered title and description to respect language context */}
                        <UserManagementHeader />
                    </div>
                </div>
            </div>
            <UserManagementClient initialUsers={users} />
        </div>
    )
}
