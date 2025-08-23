
"use client"

import { UserCog } from "lucide-react";
import { UserManagementClient } from "./user-management-client";
import { UserManagementHeader } from "./user-management-header";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, DocumentData, where } from "firebase/firestore";
import { type Role, type UserStatus } from "@/context/auth-context";
import React, { useState, useEffect } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
  accountType: Role;
  status: UserStatus;
  joinDate: string;
};

export default function ManageUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function getUsers(): Promise<User[]> {
            try {
                const usersRef = collection(db, "users");
                // Only fetch non-admin roles for this page
                const q = query(usersRef, where("role", "in", ["graduate", "company", "school"]));
                const usersSnapshot = await getDocs(q);

                const users: User[] = [];
                usersSnapshot.forEach((doc) => {
                    const data = doc.data() as DocumentData;
                    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
                    users.push({
                        id: doc.id,
                        name: data.name || data.email,
                        email: data.email,
                        accountType: data.role,
                        status: data.status,
                        joinDate: createdAt.toISOString().split('T')[0],
                    } as User);
                });

                return users; // No need to sort here if the original didn't
            } catch (error) {
                console.error("Error fetching users:", error);
                return [];
            }
        }

        getUsers().then((fetchedUsers) => {
            setUsers(fetchedUsers);
            setLoading(false);
        });
    }, []);

    if (loading) {
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
                <div className="text-center">Chargement...</div>
            </div>
        );
    }

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
