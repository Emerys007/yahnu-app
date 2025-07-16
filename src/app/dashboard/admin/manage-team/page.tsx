import { Users } from "lucide-react";
import { ManageTeamClient } from "./manage-team-client";

type AdminUser = {
  id: number
  name: string
  email: string
  accountType: "Admin" | "Super Admin" | "Content Moderator" | "Support Staff"
}

const initialAdmins: AdminUser[] = [
  { id: 1, name: "Dr. Evelyn Reed", email: "e.reed@yahnu.ci", accountType: "Super Admin" },
  { id: 2, name: "John Carter", email: "j.carter@yahnu.ci", accountType: "Admin" },
]

async function getAdmins() {
    // In a real app, this would be a database call
    return initialAdmins;
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
