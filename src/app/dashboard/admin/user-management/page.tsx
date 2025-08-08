"use client"

import { UserCog } from "lucide-react";
import { UserManagementClient } from "./user-management-client";
import { UserManagementHeader } from "./user-management-header";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, DocumentData, where } from "firebase/firestore";
import { type Role, type UserStatus } from "@/context/auth-context";
import { useLocalization } from "@/context/localization-context"

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
    const { t } = useLocalization()

    // Simple translation function for server component
    // Note: In a real app, you'd get the user's language preference from cookies or headers
    // For now, we'll use a simple approach that checks both locales
    const tServer = (key: string, preferredLocale: 'en' | 'fr' = 'en'): string => {
        const keys = key.split('.');
        let value = preferredLocale === 'fr' ? {
            "dashboard.user_management.title": "Gestion des utilisateurs",
            "dashboard.user_management.description": "Gérer les comptes utilisateurs de votre organisation."
        } : {
            "dashboard.user_management.title": "User Management",
            "dashboard.user_management.description": "Manage your organization's user accounts."
        };

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