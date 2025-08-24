
"use client"

import NewAdminOverviewPage from "./new-page";
import { useAuth } from "@/context/auth-context"
import { ContentManagerDashboard } from "@/features/dashboard/ContentManagerDashboard";

export default function AdminOverviewPage() {
    const { role } = useAuth();
    if (role === 'content_manager') {
        return <ContentManagerDashboard />
    }
    return <NewAdminOverviewPage />;
}
