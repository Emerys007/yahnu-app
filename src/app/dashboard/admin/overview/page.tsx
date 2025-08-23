
"use client"

import { Shield, Users, Building, GraduationCap, CheckCircle, UserPlus, Briefcase } from "lucide-react";
import { type UserStatus } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, DocumentData, orderBy, limit } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"
import { Clock, XCircle, Eye } from "lucide-react"
import { motion } from "framer-motion";

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
        const timeAgo = Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 60));
        return {
            id: doc.id,
            type: 'new_user',
            text: `${data.name}|${data.role}`, // Store data for translation
            icon: UserPlus,
            time: timeAgo.toString()
        }
    });

    // Adding a mock job post for variety
    recentActivity.push({
        id: 'job-1',
        type: 'new_job',
        text: 'Orange Côte d\'Ivoire|Software Engineer', // Store data for translation
        icon: Briefcase,
        time: "55"
    });

    recentActivity.sort(() => Math.random() - 0.5); // Randomize for demo

    return { stats, pendingRequests, recentActivity };
}

export default function AdminOverviewPage() {
    const [stats, setStats] = useState({ totalUsers: 0, activeCompanies: 0, activeSchools: 0 });
    const [pendingRequests, setPendingRequests] = useState<User[]>([]);
    const [recentActivity, setRecentActivity] = useState<Activity[]>([]);

    useEffect(() => {
        async function fetchData() {
            const { stats, pendingRequests, recentActivity } = await getAdminDashboardData();
            setStats(stats);
            setPendingRequests(pendingRequests);
            setRecentActivity(recentActivity);
        }
        fetchData();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatActivityTime = (minutes: string) => {
        const mins = parseInt(minutes, 10);
        if (mins < 60) return `Il y a ${mins} minutes`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `Il y a ${hours} heures`;
        const days = Math.floor(hours / 24);
        return `Il y a ${days} jours`;
    };
    
    const getAccountTypeFrench = (accountType: string) => {
        switch(accountType.toLowerCase()){
            case 'company': return 'Entreprise';
            case 'school': return 'École';
            case 'graduate': return 'Diplômé';
            default: return accountType;
        }
    }
    
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
    };

    return (
        <div className="space-y-8">
            <motion.div 
                className="flex items-start gap-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="bg-primary/10 p-3 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
                    <p className="text-muted-foreground mt-1">Aperçu global de l'activité de la plateforme.</p>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div 
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Utilisateurs au total</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold"><CountUp end={stats.totalUsers} /></div>
                            <p className="text-xs text-muted-foreground">Total des utilisateurs actifs sur la plateforme.</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Entreprises Actives</CardTitle>
                            <Building className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold"><CountUp end={stats.activeCompanies} /></div>
                            <p className="text-xs text-muted-foreground">Entreprises partenaires actives.</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Écoles Partenaires</CardTitle>
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold"><CountUp end={stats.activeSchools} /></div>
                             <p className="text-xs text-muted-foreground">Écoles et universités partenaires.</p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Santé du système</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">99.8%</div>
                            <p className="text-xs text-muted-foreground">Disponibilité des 30 derniers jours.</p>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Pending Requests and Recent Activity */}
            <motion.div 
                className="grid lg:grid-cols-3 gap-8 items-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <div className="lg:col-span-2">
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Clock className="h-5 w-5" />
                              Demandes en attente
                            </CardTitle>
                            <CardDescription>Approuver les nouvelles inscriptions d'entreprises et d'écoles.</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {pendingRequests.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">Aucune demande en attente.</p>
                              ) : (
                                pendingRequests.map((request) => (
                                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                      <p className="font-medium">{request.name}</p>
                                      <p className="text-sm text-muted-foreground capitalize">{getAccountTypeFrench(request.accountType)} • {formatDate(request.date)}</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="outline">
                                        <Eye className="h-4 w-4 mr-1" />
                                        Voir profil
                                      </Button>
                                      <Button size="sm" variant="outline">
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Activer
                                      </Button>
                                      <Button size="sm" variant="destructive">
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Rejeter
                                      </Button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                     <Card>
                        <CardHeader>
                            <CardTitle>Activité Récente</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             {recentActivity.map((activity) => {
                                let displayText = "";
                                const [name, detail] = activity.text.split('|');

                                if (activity.type === 'new_user') {
                                    displayText = `${name} s'est inscrit en tant que ${getAccountTypeFrench(detail)}.`;
                                } else if (activity.type === 'new_job') {
                                    displayText = `${name} a publié une nouvelle offre : "${detail}".`;
                                }

                                return (
                                    <div key={activity.id} className="flex items-center gap-4">
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback className="bg-primary/10">
                                                <activity.icon className="h-4 w-4 text-primary" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-1">
                                            <p className="text-sm font-medium leading-none">{displayText}</p>
                                            <p className="text-sm text-muted-foreground">{formatActivityTime(activity.time)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>
            </motion.div>

        </div>
    )
}
