"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock3,
  Cpu,
  Database,
  HardDrive,
  Loader2,
  RefreshCw,
  Server,
  TriangleAlert,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";

type Health = {
  status: "operational" | "degraded";
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
  return new Intl.NumberFormat("fr-CI", {
    style: "unit",
    unit: "megabyte",
    maximumFractionDigits: 1,
  }).format(bytes / 1024 / 1024);
}

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return days > 0 ? `${days} j ${hours} h` : `${hours} h ${minutes} min`;
}

function formatCheckDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Heure du contrôle indisponible";
  return new Intl.DateTimeFormat("fr-CI", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Abidjan",
  }).format(date);
}

export default function SystemHealth() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch<HealthResponse>("/api/system-health");
      setHealth(response.data);
      setHasError(false);
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const metrics = health ? [
    { label: "Réponse PostgreSQL", value: `${health.metrics.databaseLatencyMs} ms`, icon: Database, note: "Base principale" },
    { label: "Durée de service", value: formatUptime(health.metrics.processUptimeSeconds), icon: Clock3, note: "Depuis le dernier redémarrage" },
    { label: "Mémoire du service", value: formatBytes(health.metrics.residentMemoryBytes), icon: HardDrive, note: "Mémoire résidente" },
    { label: "Mémoire JavaScript", value: formatBytes(health.metrics.heapUsedBytes), icon: Cpu, note: "Tas utilisé" },
  ] : [];

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="dashboard-surface lagoon-grid overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="section-kicker">Infrastructure · Abidjan</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">État de la plateforme</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Un diagnostic en direct du service Render et de la base PostgreSQL de Yahnu.
            </p>
          </div>
          <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
            {loading
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
              : <RefreshCw className="mr-2 h-4 w-4" />}
            Relancer le contrôle
          </Button>
        </div>
      </section>

      {hasError ? (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Diagnostic indisponible</AlertTitle>
          <AlertDescription>
            Les mesures n’ont pas pu être récupérées. Vérifiez la connexion au service puis réessayez.
          </AlertDescription>
        </Alert>
      ) : null}

      {loading && !health ? (
        <Card aria-live="polite">
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary motion-reduce:animate-none" />
            <p>Contrôle de la plateforme en cours…</p>
          </CardContent>
        </Card>
      ) : health ? (
        <>
          <Card className={health.status === "degraded" ? "border-terra/50" : "border-primary/30"}>
            <CardHeader>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {health.status === "operational"
                      ? <CheckCircle2 className="h-5 w-5 text-primary" />
                      : <TriangleAlert className="h-5 w-5 text-terra" />}
                    {health.status === "operational" ? "Tous les services répondent" : "Service partiellement dégradé"}
                  </CardTitle>
                  <CardDescription className="mt-1">Dernier contrôle : {formatCheckDate(health.checkedAt)} (heure d’Abidjan)</CardDescription>
                </div>
                <Badge variant="outline" className={health.status === "operational" ? "border-primary/30 bg-primary/10 text-primary" : "border-terra/40 bg-terra/10 text-cocoa"}>
                  <Activity className="mr-1.5 h-3.5 w-3.5" />
                  {health.status === "operational" ? "Opérationnel" : "À surveiller"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Badge variant="outline"><Server className="mr-1 h-3 w-3" />{health.release.region ?? "Région Render"}</Badge>
              <Badge variant="outline">Moteur {health.release.node}</Badge>
              {health.release.commit ? <Badge variant="outline">Version {health.release.commit.slice(0, 10)}</Badge> : null}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <Card key={metric.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-xl bg-muted p-2.5"><metric.icon className="h-4 w-4 text-primary" /></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                  </div>
                  <p className="mt-5 text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 font-display text-2xl font-semibold tracking-tight">{metric.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{metric.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
