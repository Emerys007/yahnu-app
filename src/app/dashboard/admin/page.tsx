
"use client"

import React, { useState } from "react"
import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, Building, School, Check, X, Crown, Trash2, UserPlus, Search, Users, Clock, LineChart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { CountUp } from "@/components/ui/count-up"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type User = {
  id: number
  name: string
  email: string
  role: "Company" | "School" | "Graduate"
  status: "active" | "pending" | "suspended"
  date: string
}

type AdminUser = {
  id: number
  name: string
  email: string
  role: "Admin" | "Super Admin"
}

const allUsers: User[] = [
    { id: 1, name: "Amina Diallo", email: "amina.d@example.com", role: "Graduate", status: "pending", date: "2023-10-25" },
    { id: 2, name: "Ben Traoré", email: "ben.t@example.com", role: "Graduate", status: "active", date: "2023-10-24" },
    { id: 3, name: "Innovate Inc.", email: "contact@innovate.inc", role: "Company", status: "pending", date: "2023-10-23" },
    { id: 4, name: "Prestige University", email: "contact@prestige.edu", role: "School", status: "active", date: "2023-10-22" },
    { id: 5, name: "Global Tech", email: "hr@global.tech", role: "Company", status: "active", date: "2023-10-21" },
    { id: 6, name: "Moussa Diarra", email: "moussa.d@example.com", role: "Graduate", status: "suspended", date: "2023-10-20" },
];

const initialAdmins: AdminUser[] = [
  { id: 1, name: "Dr. Evelyn Reed", email: "e.reed@yahnu.ci", role: "Super Admin" },
  { id: 2, name: "John Carter", email: "j.carter@yahnu.ci", role: "Admin" },
]

const overviewStats = {
    totalUsers: 1256,
    pendingRegistrations: 5,
    activeCompanies: 48,
    activeSchools: 12
}

const userGrowthData = [
    { month: "Jan", users: 150 },
    { month: "Feb", users: 280 },
    { month: "Mar", users: 450 },
    { month: "Apr", users: 680 },
    { month: "May", users: 950 },
    { month: "Jun", users: 1256 },
];
const chartConfig = { users: { label: "Users", color: "hsl(var(--primary))" } }


const RegistrationRequests = () => {
    const { t } = useLocalization();
    const { toast } = useToast();
    const [requests, setRequests] = useState(allUsers.filter(u => u.status === 'pending' && u.role !== 'Graduate'));

    const handleRequest = (id: number, action: "approve" | "reject") => {
        const request = requests.find(r => r.id === id)
        if (!request) return

        setRequests(requests.filter(r => r.id !== id))
        toast({
            title: t(action === "approve" ? "Request Approved" : "Request Rejected"),
            description: `${t('The registration for ')} ${request.name} ${t(action === "approve" ? ' has been approved.' : ' has been rejected.')}`,
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('Pending Registration Requests')}</CardTitle>
                <CardDescription>{t('Approve or reject new company and school registrations.')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('Organization Name')}</TableHead>
                            <TableHead>{t('Type')}</TableHead>
                            <TableHead className="text-right">{t('Actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.map(req => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium">{req.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="gap-1">
                                        {req.role === 'Company' ? <Building className="h-3 w-3" /> : <School className="h-3 w-3" />}
                                        {t(req.role)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button size="sm" variant="outline" onClick={() => handleRequest(req.id, "reject")}><X className="h-4 w-4" /></Button>
                                    <Button size="sm" onClick={() => handleRequest(req.id, "approve")}><Check className="h-4 w-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {requests.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">{t('No pending requests.')}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

const UserManagement = () => {
    const { t } = useLocalization();
    const [users, setUsers] = useState<User[]>(allUsers);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({ role: "all", status: "all" });

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }
    
    const filteredUsers = users.filter(user => {
        const searchMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const roleMatch = filters.role === 'all' || user.role.toLowerCase() === filters.role;
        const statusMatch = filters.status === 'all' || user.status === filters.status;
        return searchMatch && roleMatch && statusMatch;
    });

    const statusBadgeVariant = (status: User["status"]) => {
        switch (status) {
            case 'active': return 'secondary';
            case 'pending': return 'outline';
            case 'suspended': return 'destructive';
            default: return 'default';
        }
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('User Management')}</CardTitle>
                <CardDescription>{t('View, manage, and search for all users on the platform.')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder={t("Search by name or email...")} className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <Select value={filters.role} onValueChange={(v) => handleFilterChange('role', v)}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder={t('Filter by role')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('All Roles')}</SelectItem>
                            <SelectItem value="Graduate">{t('Graduate')}</SelectItem>
                            <SelectItem value="Company">{t('Company')}</SelectItem>
                            <SelectItem value="School">{t('School')}</SelectItem>
                        </SelectContent>
                    </Select>
                     <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder={t('Filter by status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('All Statuses')}</SelectItem>
                            <SelectItem value="active">{t('Active')}</SelectItem>
                            <SelectItem value="pending">{t('Pending')}</SelectItem>
                            <SelectItem value="suspended">{t('Suspended')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('User')}</TableHead>
                            <TableHead>{t('Role')}</TableHead>
                            <TableHead>{t('Status')}</TableHead>
                            <TableHead>{t('Registration Date')}</TableHead>
                            <TableHead className="text-right">{t('Actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.map(user => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="font-medium">{user.name}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                </TableCell>
                                <TableCell>{t(user.role)}</TableCell>
                                <TableCell>
                                    <Badge variant={statusBadgeVariant(user.status)}>{t(user.status)}</Badge>
                                </TableCell>
                                <TableCell>{user.date}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">{t('Manage')}</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

const AdminManagement = () => {
    const { t } = useLocalization();
    const { toast } = useToast();
    const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);

    const handleDeleteAdmin = (id: number) => {
        const adminToDelete = admins.find(a => a.id === id);
        if (adminToDelete?.role === 'Super Admin') {
            toast({
                title: t('Action Forbidden'),
                description: t('The Super Admin account cannot be deleted.'),
                variant: "destructive"
            });
            return;
        }
        setAdmins(admins.filter(a => a.id !== id));
        toast({
            title: t('Admin Removed'),
            description: `${adminToDelete?.name} ${t('has been removed from administrators.')}`,
        })
    }

    const handleInviteAdmin = () => {
        toast({
            title: t("Invite Sent"),
            description: t("An invitation has been sent to the new administrator's email.")
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('Platform Administrators')}</CardTitle>
                <CardDescription>{t('Manage users with administrative privileges.')}</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="mb-6 p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">{t('Invite New Administrator')}</h4>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input placeholder={t("New admin's email")} type="email" className="flex-grow" />
                        <Button onClick={handleInviteAdmin}><UserPlus className="mr-2 h-4 w-4" />{t('Send Invite')}</Button>
                    </div>
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('Name')}</TableHead>
                            <TableHead>{t('Email')}</TableHead>
                            <TableHead>{t('Role')}</TableHead>
                            <TableHead className="text-right">{t('Actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {admins.map(admin => (
                            <TableRow key={admin.id}>
                                <TableCell className="font-medium">{admin.name}</TableCell>
                                <TableCell>{admin.email}</TableCell>
                                <TableCell>
                                    <Badge variant={admin.role === 'Super Admin' ? 'default' : 'secondary'}>
                                        {admin.role === 'Super Admin' && <Crown className="mr-1 h-3 w-3" />}
                                        {t(admin.role)}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button size="icon" variant="ghost" onClick={() => handleDeleteAdmin(admin.id)} disabled={admin.role === 'Super Admin'}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

const DashboardOverview = () => {
    const { t } = useLocalization();
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('Total Users')}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold"><CountUp end={overviewStats.totalUsers} /></div>
                        <p className="text-xs text-muted-foreground">{t('+180 this month')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('Pending Registrations')}</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold"><CountUp end={overviewStats.pendingRegistrations} /></div>
                        <p className="text-xs text-muted-foreground">{t('Require your approval')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('Active Companies')}</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold"><CountUp end={overviewStats.activeCompanies} /></div>
                        <p className="text-xs text-muted-foreground">{t('+5 this month')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('Active Schools')}</CardTitle>
                        <School className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold"><CountUp end={overviewStats.activeSchools} /></div>
                        <p className="text-xs text-muted-foreground">{t('+1 this month')}</p>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>{t('User Growth')}</CardTitle>
                    <CardDescription>{t('Total users on the platform over the last 6 months.')}</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                        <BarChart accessibilityLayer data={userGrowthData}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis tickLine={false} axisLine={false} />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                            <Bar dataKey="users" fill="var(--color-users)" radius={8} />
                        </BarChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    )
}

export default function AdminPage() {
    const { t } = useLocalization()
    
    return (
        <div className="space-y-8">
            <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-lg">
                    <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('Admin Panel')}</h1>
                    <p className="text-muted-foreground mt-1">{t('Oversee and manage the entire Yahnu platform.')}</p>
                </div>
            </div>

            <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview"><LineChart className="mr-2 h-4 w-4"/>{t('Overview')}</TabsTrigger>
                    <TabsTrigger value="requests"><Clock className="mr-2 h-4 w-4"/>{t('Pending Requests')}</TabsTrigger>
                    <TabsTrigger value="users"><Users className="mr-2 h-4 w-4"/>{t('User Management')}</TabsTrigger>
                    <TabsTrigger value="admins"><Crown className="mr-2 h-4 w-4"/>{t('Administrators')}</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4">
                    <DashboardOverview />
                </TabsContent>
                <TabsContent value="requests" className="mt-4">
                    <RegistrationRequests />
                </TabsContent>
                <TabsContent value="users" className="mt-4">
                    <UserManagement />
                </TabsContent>
                <TabsContent value="admins" className="mt-4">
                    <AdminManagement />
                </TabsContent>
            </Tabs>
        </div>
    )
}

    