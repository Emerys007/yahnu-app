
import { Users } from "lucide-react";
import { ManageTeamClient } from "./manage-team-client";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";
import { type Role } from "@/context/auth-context";

type AdminUser = {
  id: string
  name: string
  email: string
  accountType: Role
}

async function getAdmins(): Promise<AdminUser[]> {
    const adminRoles: Role[] = ["admin", "super_admin", "content_moderator", "support_staff"];
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("role", "in", adminRoles));
    
    const querySnapshot = await getDocs(q);
    const admins: AdminUser[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        admins.push({
            id: doc.id,
            name: data.name || "Unnamed Admin",
            email: data.email,
            accountType: data.role as Role,
        });
    });
    
    // Ensure Super Admins are listed first
    admins.sort((a, b) => {
        if (a.accountType === 'super_admin') return -1;
        if (b.accountType === 'super_admin') return 1;
        return a.name.localeCompare(b.name);
    });

    return admins;
}

export default async function ManageTeamPage() {
    const admins = await getAdmins();

    return (
        <div className="space-y-8">
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Team</h1>
                    <p className="text-muted-foreground mt-1">Invite and manage users with administrative privileges.</p>
                </div>
            </div>
            <ManageTeamClient initialAdmins={admins} />
        </div>
    );
}

    