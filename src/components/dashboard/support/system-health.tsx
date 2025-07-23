
"use client"

import { useAuth } from '@/context/auth-context';
import { useLocalization } from '@/context/localization-context';
import { HeartPulse, CheckCircle2, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type ServiceStatus = 'operational' | 'degraded' | 'outage';

type SystemComponent = {
    name: string;
    status: ServiceStatus;
    description: string;
};

const systemStatus: SystemComponent[] = [
    { name: 'API', status: 'operational', description: 'All API endpoints are responding normally.' },
    { name: 'Database', status: 'operational', description: 'Database is performing as expected.' },
    { name: 'Authentication', status: 'degraded', description: 'Users are reporting slow login times.' },
    { name: 'Firebase Services', status: 'operational', description: 'All Firebase services are functional.' },
];

const statusConfig: Record<ServiceStatus, { color: string; icon: React.ReactNode; text: string }> = {
    operational: { color: 'bg-green-500', icon: <CheckCircle2 className="h-4 w-4" />, text: 'Operational' },
    degraded: { color: 'bg-yellow-500', icon: <AlertTriangle className="h-4 w-4" />, text: 'Degraded Performance' },
    outage: { color: 'bg-red-500', icon: <XCircle className="h-4 w-4" />, text: 'Outage' },
};

export default function SystemHealth() {
    const { t } = useLocalization();
    const { role } = useAuth();

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                 <div className="flex items-start gap-4">
                     <div className="bg-primary/10 p-3 rounded-lg">
                        <HeartPulse className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
                        <p className="text-muted-foreground mt-1">View the real-time status of the application.</p>
                    </div>
                </div>
                {role !== 'support_staff' && (
                    <Link href="https://console.firebase.google.com/u/0/project/_/crashlytics" target="_blank">
                        <Button variant="outline">
                            Firebase Crashlytics <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                    </Link>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Core Services Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {systemStatus.map((service) => (
                        <div key={service.name} className="flex items-center justify-between p-4 rounded-lg border">
                            <div>
                                <h3 className="font-semibold">{service.name}</h3>
                                <p className="text-sm text-muted-foreground">{service.description}</p>
                            </div>
                            <Badge className={`flex items-center gap-2 ${statusConfig[service.status].color} text-white`}>
                                {statusConfig[service.status].icon}
                                <span>{statusConfig[service.status].text}</span>
                            </Badge>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
