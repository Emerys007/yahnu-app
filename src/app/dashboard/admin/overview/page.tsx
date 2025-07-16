
import { Shield } from "lucide-react";
import { AdminClient } from "../admin-client";
import { type UserStatus } from "@/context/auth-context";

type User = {
  id: number
  name: string
  email: string
  accountType: "Company" | "School" | "Graduate" | "Admin"
  status: UserStatus
  date: string
}

const allUsers: User[] = [
    { id: 3, name: "Innovate Inc.", email: "contact@innovate.inc", accountType: "Company", status: "pending", date: "2023-10-23" },
    { id: 4, name: "Prestige University", email: "contact@prestige.edu", accountType: "School", status: "pending", date: "2023-10-22" },
];

async function getPendingRequests() {
    // In a real app, you would fetch this data from a database
    return allUsers.filter(u => u.status === 'pending' && (u.accountType === 'Company' || u.accountType === 'School'));
}


export default async function AdminOverviewPage() {
    const pendingRequests = await getPendingRequests();
    
    return (
        <div className="space-y-8">
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
                    <p className="text-muted-foreground mt-1">Oversee and manage the entire Yahnu platform.</p>
                </div>
            </div>

            <AdminClient initialRequests={pendingRequests} />
        </div>
    )
}
