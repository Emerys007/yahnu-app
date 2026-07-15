'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, CheckCircle, Clock3, Cpu, Database, HardDrive, Loader2, RefreshCw, Server, TriangleAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiFetch } from '@/lib/api-client';

type Health = {
  status: 'operational' | 'degraded';
  checkedAt: string;
  metrics: {
    databaseLatencyMs: number;
    processUptimeSeconds: number;
    residentMemoryBytes: number;
    heapUsedBytes: number;
  };
  release: { commit: string | null; region: string | null; node: string };
};

type HealthResponse = { data: Health };

function formatBytes(bytes: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'unit', unit: 'megabyte', maximumFractionDigits: 1 })
    .format(bytes / 1024 / 1024);
}

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return days > 0 ? `${days} j ${hours} h` : `${hours} h ${Math.floor((seconds % 3600) / 60)} min`;
}

export default function SystemHealth() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch<HealthResponse>('/api/system-health');
      setHealth(response.data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Le diagnostic est temporairement indisponible.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const metrics = health ? [
    { label: 'Latence PostgreSQL', value: `${health.metrics.databaseLatencyMs} ms`, icon: Database },
    { label: 'Disponibilité du processus', value: formatUptime(health.metrics.processUptimeSeconds), icon: Clock3 },
    { label: 'Mémoire résidente', value: formatBytes(health.metrics.residentMemoryBytes), icon: HardDrive },
    { label: 'Mémoire JavaScript', value: formatBytes(health.metrics.heapUsedBytes), icon: Cpu },
  ] : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-3"><Activity className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">État du système</h1>
            <p className="mt-1 text-muted-foreground">Mesures directes du service Render et de PostgreSQL.</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Actualiser
        </Button>
      </div>

      {error ? (
        <Card className="border-destructive/40"><CardContent className="flex items-center gap-3 py-5 text-destructive"><TriangleAlert className="h-5 w-5" />{error}</CardContent></Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {health?.status === 'operational' ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <TriangleAlert className="h-5 w-5 text-amber-600" />}
            Service {health?.status === 'degraded' ? 'dégradé' : 'opérationnel'}
          </CardTitle>
          <CardDescription>{health ? `Vérifié le ${new Date(health.checkedAt).toLocaleString('fr-FR')}` : 'Vérification en cours…'}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="outline"><Server className="mr-1 h-3 w-3" />{health?.release.region ?? 'Région Render'}</Badge>
          <Badge variant="outline">{health?.release.node ?? 'Node.js'}</Badge>
          {health?.release.commit ? <Badge variant="outline">Version {health.release.commit}</Badge> : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{metric.value}</div></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
