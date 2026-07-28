"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  Download,
  GraduationCap,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

import { WorkspaceFrame } from '@/components/dashboard/workspace-frame';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api-client';
import type { WorkspaceReport } from '@/lib/role-workspaces';
import { cn } from '@/lib/utils';

const statusLabels: Record<string, string> = {
  submitted: 'Reçues',
  reviewing: 'En examen',
  shortlisted: 'Présélectionnées',
  interviewing: 'En entretien',
  accepted: 'Acceptées',
  rejected: 'Refusées',
  withdrawn: 'Retirées',
};

function csvCell(value: string | number) {
  const raw = String(value);
  const text = /^[\t\r\n ]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(report: WorkspaceReport) {
  if (!report.rows.length) return false;
  const headers = Object.keys(report.rows[0]);
  const lines = [
    headers.map(csvCell).join(','),
    ...report.rows.map((row) => headers.map((header) => csvCell(row[header] ?? '')).join(',')),
  ];
  const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `yahnu-${report.role}-rapport-${new Date(report.generatedAt).toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
  return true;
}

export function ReportsWorkspace({ expectedRole }: { expectedRole?: 'company' | 'school' }) {
  const { role } = useAuth();
  const { toast } = useToast();
  const activeRole = expectedRole || (role === 'company' || role === 'school' ? role : null);
  const [report, setReport] = useState<WorkspaceReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await apiFetch<{ data: { report: WorkspaceReport } }>('/api/reports');
      setReport(response.data.report);
    } catch (error) {
      toast({
        title: 'Rapport indisponible',
        description: error instanceof Error ? error.message : 'Réessayez dans un instant.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeRole) void load();
    else setLoading(false);
  }, [activeRole]);

  const maxStatusValue = useMemo(() => Math.max(1, ...(report?.statusBreakdown.map((row) => row.value) || [1])), [report]);

  if (!activeRole) {
    return (
      <WorkspaceFrame
        eyebrow="Pilotage Yahnu"
        title="Les bonnes décisions partent de données réelles."
        description="Les rapports opérationnels sont calculés pour chaque organisation à partir de ses propres données."
        icon={BarChart3}
      >
        <Card className="mx-auto max-w-2xl">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="mx-auto h-9 w-9 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Vue organisation réservée</h2>
            <p className="mt-2 text-sm text-muted-foreground">Utilisez l’analyse administrateur pour piloter l’ensemble de la plateforme.</p>
            <Button asChild className="mt-6"><Link href="/dashboard/admin/overview">Ouvrir la vue administrateur <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>
          </CardContent>
        </Card>
      </WorkspaceFrame>
    );
  }

  const isCompany = activeRole === 'company';
  return (
    <WorkspaceFrame
      eyebrow={isCompany ? 'Intelligence recrutement' : 'Insertion mesurée'}
      title={isCompany ? 'Lire votre recrutement sans raconter d’histoires.' : 'Suivre ce qui se passe après le diplôme.'}
      description={isCompany
        ? 'Des indicateurs calculés en direct depuis vos offres, candidatures et événements. Aucun échantillon fictif.'
        : 'Une vue agrégée des diplômés rattachés à votre établissement, de leurs parcours Yahnu et de vos événements.'}
      icon={isCompany ? BriefcaseBusiness : GraduationCap}
      accent={isCompany ? 'terra' : 'primary'}
      actions={(
        <div className="flex w-full gap-2 sm:w-auto">
          <Button variant="outline" size="icon" onClick={() => void load()} disabled={loading} aria-label="Actualiser le rapport">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
          <Button
            onClick={() => {
              if (!report || !downloadCsv(report)) {
                toast({ title: 'Aucune ligne à exporter', description: 'Le CSV sera disponible dès que ce rapport contiendra des données.' });
              }
            }}
            disabled={!report}
          >
            <Download className="mr-2 h-4 w-4" /> Exporter le CSV
          </Button>
        </div>
      )}
    >
      {loading ? (
        <div className="grid min-h-80 place-items-center" role="status" aria-live="polite">
          <Loader2 className="h-9 w-9 animate-spin text-primary" aria-hidden="true" />
          <span className="sr-only">Chargement du rapport</span>
        </div>
      ) : !report ? (
        <Card className="border-dashed"><CardContent className="p-10 text-center"><BarChart3 className="mx-auto h-9 w-9 text-muted-foreground" /><h2 className="mt-4 text-xl font-semibold">Aucune donnée disponible</h2><p className="mt-2 text-sm text-muted-foreground">Actualisez la page ou commencez à utiliser les outils de votre espace.</p></CardContent></Card>
      ) : (
        <>
          <Alert className="border-primary/20 bg-primary/[0.04]">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Données privées et datées</AlertTitle>
            <AlertDescription>
              {report.context} Calcul effectué le {new Intl.DateTimeFormat('fr-CI', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(report.generatedAt))}.
            </AlertDescription>
          </Alert>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicateurs clés">
            {report.metrics.map((metric, index) => (
              <Card key={metric.id} className="relative overflow-hidden border-border/70">
                <div className={cn('absolute inset-x-0 top-0 h-1', index % 3 === 0 ? 'bg-terra' : index % 3 === 1 ? 'bg-primary' : 'bg-lagoon')} />
                <CardContent className="p-5 pt-6">
                  <p className="font-display text-4xl font-bold tracking-tight">{new Intl.NumberFormat('fr-CI').format(metric.value)}</p>
                  <p className="mt-2 font-semibold">{metric.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{metric.detail}</p>
                </CardContent>
              </Card>
            ))}
          </section>

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <Card>
              <CardHeader>
                <CardTitle>Étapes des candidatures</CardTitle>
                <CardDescription>Répartition réelle des dossiers reliés à cet espace.</CardDescription>
              </CardHeader>
              <CardContent>
                {report.statusBreakdown.length ? (
                  <div className="space-y-4">
                    {report.statusBreakdown.map((row) => (
                      <div key={row.label}>
                        <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                          <span>{statusLabels[row.label] || row.label}</span>
                          <span className="font-bold">{row.value}</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-gradient-to-r from-primary to-lagoon" style={{ width: `${Math.max(row.value ? 6 : 0, (row.value / maxStatusValue) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">Aucune candidature enregistrée pour cette organisation.</p>}
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div><CardTitle>{isCompany ? 'Performance par offre' : 'Synthèse agrégée des candidatures'}</CardTitle><CardDescription>{report.rows.length} ligne(s) issue(s) de la base active.</CardDescription></div>
                  <Badge variant="outline">Données live</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {report.rows.length ? (
                  <div className="max-h-[30rem] overflow-auto">
                    <table className="w-full min-w-[42rem] text-sm">
                      <thead className="sticky top-0 bg-muted/95 backdrop-blur">
                        <tr>{Object.keys(report.rows[0]).map((header) => <th key={header} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">{header.replaceAll('_', ' ')}</th>)}</tr>
                      </thead>
                      <tbody>
                        {report.rows.map((row, index) => (
                          <tr key={index} className="border-t">
                            {Object.keys(report.rows[0]).map((header) => <td key={header} className="px-4 py-3">{String(row[header] ?? '')}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="p-8 text-center text-sm text-muted-foreground">Aucune ligne à afficher ou exporter.</p>}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </WorkspaceFrame>
  );
}
