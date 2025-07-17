
import { UserCog } from "lucide-react";
import { UserManagementClient } from "./user-management-client";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, DocumentData } from "firebase/firestore";
import { type Role, type UserStatus } from "@/context/auth-context";

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
    const q = query(usersRef);
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

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        <UserCog className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                        <p className="text-muted-foreground mt-1">Manage all user accounts across the platform.</p>
                    </div>
                </div>
            </div>
            <UserManagementClient initialUsers={users} />
        </div>
    )
}
