import { Shield } from "lucide-react";
import { AdminClient } from "../admin-client";
import { type UserStatus } from "@/context/auth-context";

type User = {
  id: string
  name: string
  email: string
  accountType: "Company" | "School" | "Graduate" | "Admin"
  status: UserStatus
  date: string
}

type AdminOverviewPageProps = {
    pendingRequests: User[];
}

export default function AdminOverviewPage({ pendingRequests }: AdminOverviewPageProps) {
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
