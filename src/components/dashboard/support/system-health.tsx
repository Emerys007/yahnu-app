'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Activity, Server, Database, Cpu, HardDrive, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useLocalization } from '@/context/localization-context';

type SystemStatus = 'operational' | 'degraded' | 'major_outage';

type Metric = {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  icon: React.ElementType;
};

type Incident = {
  id: string;
  title: string;
  description: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  timestamp: string;
};

export default function SystemHealth() {
  const { t } = useLocalization();
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('operational');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [metrics, setMetrics] = useState<Metric[]>([
    { name: t('dashboard.support.system_health.server_uptime'), value: 99.9, unit: '%', status: 'good', icon: Server },
    { name: t('dashboard.support.system_health.response_time'), value: 245, unit: 'ms', status: 'good', icon: Activity },
    { name: t('dashboard.support.system_health.error_rate'), value: 0.1, unit: '%', status: 'good', icon: AlertTriangle },
    { name: t('dashboard.support.system_health.active_users'), value: 1247, unit: '', status: 'good', icon: Activity },
    { name: t('dashboard.support.system_health.database_connections'), value: 45, unit: '', status: 'good', icon: Database },
    { name: t('dashboard.support.system_health.memory_usage'), value: 67, unit: '%', status: 'warning', icon: Activity },
    { name: t('dashboard.support.system_health.cpu_usage'), value: 34, unit: '%', status: 'good', icon: Cpu },
    { name: t('dashboard.support.system_health.disk_usage'), value: 78, unit: '%', status: 'warning', icon: HardDrive },
  ]);
  const [incidents, setIncidents] = useState<Incident[]>([]);

  const getStatusColor = (status: SystemStatus) => {
    switch (status) {
      case 'operational': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'major_outage': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: SystemStatus) => {
    switch (status) {
      case 'operational': return CheckCircle;
      case 'degraded': return AlertTriangle;
      case 'major_outage': return XCircle;
      default: return AlertTriangle;
    }
  };

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const refreshMetrics = () => {
    setLastUpdated(new Date());
    // Simulate metric updates
    setMetrics(prevMetrics =>
      prevMetrics.map(metric => ({
        ...metric,
        value: metric.value + (Math.random() - 0.5) * 10
      }))
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.support.system_health.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('dashboard.support.system_health.description')}</p>
          </div>
        </div>
        <Button variant="outline" onClick={refreshMetrics}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('dashboard.support.system_health.refresh')}
        </Button>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {React.createElement(getStatusIcon(systemStatus), { className: `h-5 w-5 ${getStatusColor(systemStatus).replace('bg-', 'text-')}` })}
            {t('dashboard.support.system_health.overall_status')}
          </CardTitle>
          <CardDescription>
            Last updated: {lastUpdated.toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge className={`${getStatusColor(systemStatus)} text-white`}>
            {t(`dashboard.support.system_health.${systemStatus}`)}
          </Badge>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">{t('dashboard.support.system_health.system_metrics')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                <metric.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getMetricStatusColor(metric.status)}`}>
                  {typeof metric.value === 'number' ? metric.value.toFixed(metric.unit === '%' ? 1 : 0) : metric.value}
                  {metric.unit}
                </div>
                {metric.unit === '%' && (
                  <Progress
                    value={metric.value}
                    className="mt-2"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Incidents */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">{t('dashboard.support.system_health.recent_incidents')}</h2>
        {incidents.length > 0 ? (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <Card key={incident.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{incident.title}</CardTitle>
                      <CardDescription>{incident.timestamp}</CardDescription>
                    </div>
                    <Badge variant="outline">{incident.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{incident.description}</p>
                  <Button variant="link" className="mt-2 h-auto p-0">
                    {t('dashboard.support.system_health.view_details')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">{t('dashboard.support.system_health.no_incidents')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
