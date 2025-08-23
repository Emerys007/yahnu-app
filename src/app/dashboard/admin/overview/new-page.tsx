"use client"

import {
    Activity,
    ArrowUpRight,
    Building,
    CheckCircle,
    CircleUser,
    Clock,
    DollarSign,
    Download,
    Eye,
    GraduationCap,
    Menu,
    Package2,
    Search,
    Shield,
    TrendingUp,
    Users,
    UserPlus,
    Briefcase,
    XCircle,
  } from "lucide-react"
  import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "@/components/ui/avatar"
  import { Badge } from "@/components/ui/badge"
  import { Button } from "@/components/ui/button"
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
  import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  import { Input } from "@/components/ui/input"
  import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
  import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
  import { type UserStatus } from "@/context/auth-context"
  import { db } from "@/lib/firebase"
  import { collection, query, where, getDocs, DocumentData, orderBy, limit } from "firebase/firestore"
  import { useLocalization } from "@/context/localization-context"
  import { useEffect, useState } from "react"
  import { motion } from "framer-motion"
  import { CountUp } from "@/components/ui/count-up"
  import { useRouter } from 'next/navigation'

  
  type User = {
    id: string
    name: string
    email: string
    accountType: "Company" | "School" | "Graduate" | "Admin"
    status: UserStatus
    date: string
  }
  
  type ActivityItem = {
      id: string;
      type: 'new_user' | 'new_job' | 'system_update';
      text: string;
      icon: React.ElementType;
      time: string;
  }

  const chartData = [
    { month: "Jan", total: Math.floor(Math.random() * 100) + 50 },
    { month: "Fév", total: Math.floor(Math.random() * 100) + 150 },
    { month: "Mar", total: Math.floor(Math.random() * 150) + 200 },
    { month: "Avr", total: Math.floor(Math.random() * 200) + 250 },
    { month: "Mai", total: Math.floor(Math.random() * 250) + 300 },
    { month: "Juin", total: Math.floor(Math.random() * 300) + 400 },
  ]
  
  async function getAdminDashboardData() {
      const usersRef = collection(db, "users");
  
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
          activeGraduates: graduateSnapshot.size,
          activeCompanies: companySnapshot.size,
          activeSchools: schoolSnapshot.size,
      };
  
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
  
      const recentUsersQuery = query(usersRef, orderBy("createdAt", "desc"), limit(3));
      const recentUsersSnapshot = await getDocs(recentUsersQuery);
      const recentActivity: ActivityItem[] = recentUsersSnapshot.docs.map(doc => {
          const data = doc.data() as DocumentData;
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
          const timeAgo = Math.floor((new Date().getTime() - createdAt.getTime()) / (1000 * 60));
          return {
              id: doc.id,
              type: 'new_user',
              text: `${data.name}|${data.role}`,
              icon: UserPlus,
              time: timeAgo.toString()
          }
      });
  
      recentActivity.push({
          id: 'job-1',
          type: 'new_job',
          text: 'Orange Côte d\'Ivoire|Développeur de logiciels',
          icon: Briefcase,
          time: "55"
      });

      recentActivity.push({
        id: 'sys-1',
        type: 'system_update',
        text: 'Mise à jour du système|v2.1.0 déployée',
        icon: Shield,
        time: "125"
    });
  
      recentActivity.sort(() => Math.random() - 0.5);
  
      return { stats, pendingRequests, recentActivity };
  }
  
  const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
        },
      },
    };
  
    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          type: "spring",
          stiffness: 100,
          damping: 10,
        },
      },
    };
  
  export default function NewAdminOverviewPage() {
      const { t } = useLocalization();
      const router = useRouter();
      const [stats, setStats] = useState({ totalUsers: 0, activeGraduates: 0, activeCompanies: 0, activeSchools: 0 });
      const [pendingRequests, setPendingRequests] = useState<User[]>([]);
      const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  
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
          return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
      };
  
      const formatActivityTime = (minutes: string) => {
          const mins = parseInt(minutes, 10);
          if (mins < 60) return t('common.time.minutes_ago', { count: mins });
          const hours = Math.floor(mins / 60);
          if (hours < 24) return t('common.time.hours_ago', { count: hours });
          const days = Math.floor(hours / 24);
          return t('common.time.days_ago', { count: days });
      };
      
      const getRoleTranslation = (role: string) => {
          const roleKey = `common.${role.toLowerCase()}`;
          const translation = t(roleKey);
          return translation === roleKey ? role : translation;
      }

      const handleGenerateReport = () => {
        const headers = ["Métrique", "Valeur"];
        const rows = [
            ["Utilisateurs Totaux", stats.totalUsers],
            ["Entreprises Actives", stats.activeCompanies],
            ["Diplômés Actifs", stats.activeGraduates],
            ["Écoles Actives", stats.activeSchools],
            ["Demandes en Attente", pendingRequests.length],
        ];

        let csvContent = "\uFEFF" // UTF-8 BOM
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", "rapport_dashboard_admin.csv");
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
      }

      const handleManageUsers = () => {
        router.push('/dashboard/admin/user-management');
      }
  
      return (
          <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between space-y-2">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                        <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.overview.title')}</h1>
                        <p className="text-muted-foreground mt-1">{t('dashboard.overview.description')}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={handleGenerateReport}>
                        <Download className="mr-2 h-4 w-4" />
                        Générer un Rapport
                    </Button>
                    <Button onClick={handleManageUsers}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Gérer les Utilisateurs
                    </Button>
                </div>
              </div>

              <motion.div 
                  className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
              >
                  <motion.div 
                    variants={itemVariants} 
                    whileHover={{ y: -5, boxShadow: "0 8px 15px rgba(0, 0, 0, 0.1)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">{t('dashboard.overview.totalUsers')}</CardTitle>
                              <Users className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold"><CountUp end={stats.totalUsers} /></div>
                              <p className="text-xs text-muted-foreground text-green-500">+5.2% ce mois-ci</p>
                          </CardContent>
                      </Card>
                  </motion.div>
                  <motion.div 
                    variants={itemVariants} 
                    whileHover={{ y: -5, boxShadow: "0 8px 15px rgba(0, 0, 0, 0.1)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">{t('dashboard.overview.activeCompanies')}</CardTitle>
                              <Building className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold"><CountUp end={stats.activeCompanies} /></div>
                              <p className="text-xs text-muted-foreground text-green-500">+10 entreprises ce trimestre</p>
                          </CardContent>
                      </Card>
                  </motion.div>
                  <motion.div 
                    variants={itemVariants} 
                    whileHover={{ y: -5, boxShadow: "0 8px 15px rgba(0, 0, 0, 0.1)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">{t('dashboard.nav.graduates')}</CardTitle>
                              <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold"><CountUp end={stats.activeGraduates} /></div>
                              <p className="text-xs text-muted-foreground text-green-500">+120 diplômés ce mois-ci</p>
                          </CardContent>
                      </Card>
                  </motion.div>
                  <motion.div 
                    variants={itemVariants} 
                    whileHover={{ y: -5, boxShadow: "0 8px 15px rgba(0, 0, 0, 0.1)" }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                      <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Taux d'Approbation</CardTitle>
                              <CheckCircle className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <div className="text-2xl font-bold">98.5%</div>
                              <p className="text-xs text-muted-foreground text-red-500">-0.2% depuis hier</p>
                          </CardContent>
                      </Card>
                  </motion.div>
              </motion.div>
  
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <motion.div 
                    className="lg:col-span-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                   >
                    <Card>
                        <CardHeader>
                          <CardTitle>Croissance des Utilisateurs</CardTitle>
                          <CardDescription>Évolution du nombre total d'utilisateurs sur les 6 derniers mois.</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                          <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    cursor={{fill: 'rgba(142, 68, 173, 0.1)'}}
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd' }}
                                />
                                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                    </Card>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Card>
                        <CardHeader>
                            <CardTitle>Activité Récente</CardTitle>
                            <CardDescription>Dernières actions sur la plateforme.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6">
                        {recentActivity.map((activity) => {
                                let displayText = "";
                                const [name, detail] = activity.text.split('|');
                                if (activity.type === 'new_user') {
                                    displayText = t('dashboard.overview.signedUpAs', { name, role: getRoleTranslation(detail) });
                                } else if (activity.type === 'new_job') {
                                    displayText = t('dashboard.overview.postedNewJob', { name, jobTitle: detail });
                                } else {
                                    displayText = `${name}: ${detail}`;
                                }
                                return (
                                    <div key={activity.id} className="flex items-start gap-4">
                                        <Avatar className="hidden h-9 w-9 sm:flex">
                                            <AvatarFallback className="bg-primary/10 border border-primary/20">
                                                <activity.icon className="h-5 w-5 text-primary" />
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
                  </motion.div>
              </div>

              <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.overview.pendingRequests')}</CardTitle>
                        <CardDescription>{t('dashboard.overview.pendingRequestsDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom de l'organisation</TableHead>
                                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                                    <TableHead className="hidden md:table-cell">Date de soumission</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {pendingRequests.length > 0 ? pendingRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>
                                        <div className="font-medium">{req.name}</div>
                                        <div className="text-sm text-muted-foreground md:hidden">{formatDate(req.date)}</div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <Badge variant="outline" className="capitalize">{getRoleTranslation(req.accountType)}</Badge>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">{formatDate(req.date)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm"><Eye className="h-4 w-4" /></Button>
                                            <Button variant="destructive" size="sm"><XCircle className="h-4 w-4" /></Button>
                                            <Button size="sm"><CheckCircle className="h-4 w-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                    {t('dashboard.overview.noPendingRequests')}
                                    </TableCell>
                                </TableRow>
                            )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
              </motion.div>
          </div>
      )
  }
  