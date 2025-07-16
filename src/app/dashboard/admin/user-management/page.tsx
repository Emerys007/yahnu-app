import { UserCog } from "lucide-react";
import { UserManagementClient } from "./user-management-client";
import { type Role, type UserStatus } from "@/context/auth-context";

type User = {
  id: number;
  name: string;
  email: string;
  accountType: Role;
  status: UserStatus;
  date: string;
};

const allUsers: User[] = [
    { id: 1, name: "Amina Diallo", email: "amina.d@example.com", accountType: "graduate", status: "pending", date: "2023-10-25" },
    { id: 2, name: "Ben Traoré", email: "ben.t@example.com", accountType: "graduate", status: "active", date: "2023-10-24" },
    { id: 3, name: "Innovate Inc.", email: "contact@innovate.inc", accountType: "company", status: "pending", date: "2023-10-23" },
    { id: 4, name: "Prestige University", email: "contact@prestige.edu", accountType: "school", status: "pending", date: "2023-10-22" },
    { id: 5, name: "Global Tech", email: "hr@global.tech", accountType: "company", status: "active", date: "2023-10-21" },
    { id: 6, name: "Moussa Diarra", email: "moussa.d@example.com", accountType: "graduate", status: "suspended", date: "2023-10-20" },
    { id: 7, name: "Dr. Evelyn Reed", email: "e.reed@yahnu.ci", accountType: "admin", status: "active", date: "2023-01-15" },
];

async function getUsers() {
    // In a real app, this would be a database call
    return allUsers;
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
