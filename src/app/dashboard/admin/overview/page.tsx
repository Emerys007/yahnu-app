import { Shield, Users, Building, School, UserPlus, Briefcase } from "lucide-react";
import { AdminClient } from "../admin-client";
import { type UserStatus } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type User = {
  id: string
  name: string
  email: string
  accountType: "Company" | "School" | "Graduate" | "Admin"
  status: UserStatus
  date: string
}

type Activity = {
    id: string;
    type: 'new_user' | 'new_job';
    text: string;
    icon: React.ElementType;
    time: string;
}

// In a real-world scenario, this data would come from a more complex query or pre-aggregated data.
async function getAdminDashboardData() {
    const usersRef = collection(db, "users");
    
    // Fetch counts
    const graduateQuery = query(usersRef, where("role", "==", "graduate"), where("status", "==", "active"));
    const companyQuery = query(usersRef, where("role", "==", "company"), where("status", "==", "active"));
    const schoolQuery = query(usersRef, where("role", "==", "school"), where("status", "==", "active"));
    
    const [graduateSnapshot, companySnapshot, schoolSnapshot] = await Promise.all([
        getDocs(graduateQuery),
        getDocs(companyQuery),
        getDocs(schoolQuery),
    ]);

    const stats = {
        totalUsers: graduateSnapshot.size + companySnapshot.size + schoolSnapshot.size,
        activeCompanies: companySnapshot.size,
        activeSchools: schoolSnapshot.size,
    };

    // Fetch pending requests
    const pendingQuery = query(
        usersRef, 
        where('status', '==', 'pending'), 
        where('role', 'in', ['company', 'school'])
    );
    const pendingSnapshot = await getDocs(pendingQuery);
    const pendingRequests = pendingSnapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        return {
            id: doc.id,
            name: data.name,
            email: data.email,
            accountType: data.role.charAt(0).toUpperCase() + data.role.slice(1),
            status: data.status,
            date: createdAt.toISOString().split('T')[0],
        } as User;
    });

    // Fetch recent activity (mocking job posts for now)
    const recentUsersQuery = query(usersRef, orderBy("createdAt", "desc"), limit(3));
    const recentUsersSnapshot = await getDocs(recentUsersQuery);
    const recentActivity: Activity[] = recentUsersSnapshot.docs.map(doc => {
        const data = doc.data() as DocumentData;
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        const timeAgo = `${Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 60))} minutes ago`;
        return {
            id: doc.id,
            type: 'new_user',
            text: `${data.name} signed up as a ${data.role}.`,
            icon: UserPlus,
            time: timeAgo
        }
    });
    
    // Adding a mock job post for variety
    recentActivity.push({
        id: 'job-1',
        type: 'new_job',
        text: 'Orange Côte d\'Ivoire posted a new job: "Software Engineer".',
        icon: Briefcase,
        time: "55 minutes ago"
    });

    recentActivity.sort(() => Math.random() - 0.5); // Randomize for demo

    return { stats, pendingRequests, recentActivity };
}

export default async function AdminOverviewPage() {
    const { stats, pendingRequests, recentActivity } = await getAdminDashboardData();

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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold"><CountUp end={stats.totalUsers} /></div>
                        <p className="text-xs text-muted-foreground">+2 from yesterday</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold"><CountUp end={stats.activeCompanies} /></div>
                        <p className="text-xs text-muted-foreground">Across all regions</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Partner Schools</CardTitle>
                        <School className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold"><CountUp end={stats.activeSchools} /></div>
                         <p className="text-xs text-muted-foreground">Verified institutions</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2">
                    <AdminClient initialRequests={pendingRequests} />
                </div>
                <div className="lg:col-span-1">
                     <Card>
                        <CardHeader>
                            <CardTitle>Recent Platform Activity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {recentActivity.map((activity) => (
                                <div key={activity.id} className="flex items-center gap-4">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback className="bg-primary/10">
                                            <activity.icon className="h-4 w-4 text-primary" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid gap-1">
                                        <p className="text-sm font-medium leading-none">{activity.text}</p>
                                        <p className="text-sm text-muted-foreground">{activity.time}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>

        </div>
    )
}
