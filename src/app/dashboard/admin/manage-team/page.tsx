
import { Users } from "lucide-react";
import { ManageTeamClient } from "./manage-team-client";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";

type AdminUser = {
  id: string
  name: string
  email: string
  accountType: "Admin" | "Super Admin" | "Content Moderator" | "Support Staff"
}

async function getAdmins(): Promise<AdminUser[]> {
    const adminRoles = ["admin", "super_admin", "content_moderator", "support_staff"];
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
            // A simple mapping from role ID to display name
            accountType: data.role.replace('_', ' ').replace(/\b\w/g, (l:string) => l.toUpperCase()) as AdminUser['accountType'],
        });
    });
    
    // Ensure Super Admins are listed first
    admins.sort((a, b) => {
        if (a.accountType === 'Super Admin') return -1;
        if (b.accountType === 'Super Admin') return 1;
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

