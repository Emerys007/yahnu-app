import type { ReportMetric, ReportSeriesPoint, WorkspaceReport } from '@/lib/role-workspaces';
import { requireUser } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { handleApiError, jsonOk } from '@/lib/server/http';
import { enforceRateLimit, enforceRateLimitSubject } from '@/lib/server/rate-limit';

const reportingRoles = new Set<'company' | 'school'>(['company', 'school']);

type AggregateRow = Record<string, number | string | null>;

function numberValue(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function metric(id: string, label: string, value: unknown, detail: string): ReportMetric {
  return { id, label, value: numberValue(value), detail };
}

export async function GET(request: Request) {
  try {
    const actor = await requireUser(reportingRoles);
    await enforceRateLimit(request, 'workspace-report-read', 60, 5 * 60, actor.uid);
    await enforceRateLimitSubject('workspace-report-read-account', 60, 5 * 60, actor.uid);
    if (actor.role === 'company') {
      const [jobTotals, applicationStatuses, eventTotals, rows] = await Promise.all([
        query<AggregateRow>(`
          SELECT
            count(*)::integer AS total_jobs,
            count(*) FILTER (WHERE status = 'open' AND (closes_at IS NULL OR closes_at > now()))::integer AS open_jobs
          FROM jobs
          WHERE company_id = $1
        `, [actor.uid]),
        query<{ status: string; count: number | string }>(`
          SELECT application.status, count(*)::integer AS count
          FROM applications application
          JOIN jobs job ON job.id = application.job_id
          WHERE job.company_id = $1
          GROUP BY application.status
          ORDER BY application.status
        `, [actor.uid]),
        query<AggregateRow>(`
          SELECT
            count(DISTINCT event.id) FILTER (WHERE event.status = 'published' AND event.ends_at > now())::integer AS upcoming_events,
            count(registration.graduate_id) FILTER (WHERE registration.status IN ('registered', 'attended'))::integer AS registrations
          FROM career_events event
          LEFT JOIN career_event_registrations registration ON registration.event_id = event.id
          WHERE event.organizer_id = $1
        `, [actor.uid]),
        query<AggregateRow>(`
          SELECT job.title, job.status,
            count(application.id)::integer AS applications,
            count(application.id) FILTER (WHERE application.status IN ('shortlisted', 'interviewing'))::integer AS progressing,
            count(application.id) FILTER (WHERE application.status = 'accepted')::integer AS accepted
          FROM jobs job
          LEFT JOIN applications application ON application.job_id = job.id
          WHERE job.company_id = $1
          GROUP BY job.id
          ORDER BY job.updated_at DESC, job.id
          LIMIT 250
        `, [actor.uid]),
      ]);
      const statuses = applicationStatuses.rows.map((row): ReportSeriesPoint => ({
        label: row.status,
        value: numberValue(row.count),
      }));
      const applications = statuses.reduce((total, row) => total + row.value, 0);
      const progressing = statuses
        .filter((row) => row.label === 'shortlisted' || row.label === 'interviewing')
        .reduce((total, row) => total + row.value, 0);
      const totals = jobTotals.rows[0] || {};
      const events = eventTotals.rows[0] || {};
      const report: WorkspaceReport = {
        role: 'company',
        generatedAt: new Date().toISOString(),
        context: 'Données en direct de vos offres, candidatures et événements Yahnu.',
        metrics: [
          metric('open_jobs', 'Offres ouvertes', totals.open_jobs, `${numberValue(totals.total_jobs)} offre(s) créée(s) au total`),
          metric('applications', 'Candidatures reçues', applications, 'Toutes les candidatures liées à vos offres'),
          metric('progressing', 'Profils en progression', progressing, 'Présélectionnés ou en entretien'),
          metric('event_registrations', 'Inscriptions aux événements', events.registrations, `${numberValue(events.upcoming_events)} événement(s) à venir`),
        ],
        statusBreakdown: statuses,
        rows: rows.rows.map((row) => ({
          offre: String(row.title || ''),
          statut: String(row.status || ''),
          candidatures: numberValue(row.applications),
          en_progression: numberValue(row.progressing),
          acceptées: numberValue(row.accepted),
        })),
      };
      return jsonOk({ report });
    }

    const [graduateTotals, applicationStatuses, eventTotals] = await Promise.all([
      query<AggregateRow>(`
        SELECT
          count(*)::integer AS graduates,
          count(*) FILTER (WHERE graduate.status = 'active')::integer AS active_graduates,
          count(*) FILTER (
            WHERE talent.visibility_consent = true
              AND talent.withdrawn_at IS NULL
          )::integer AS visible_talents,
          COALESCE(sum((
            SELECT count(*) FROM jsonb_array_elements(graduate.education) education
            WHERE COALESCE((education->>'verified')::boolean, false) = true
          )), 0)::integer AS verified_education_entries
        FROM users graduate
        LEFT JOIN talent_profiles talent ON talent.user_id = graduate.id
        WHERE graduate.role = 'graduate'
          AND graduate.school_id = $1
          AND graduate.deleted_at IS NULL
      `, [actor.uid]),
      query<{ status: string; count: number | string }>(`
        SELECT application.status, count(*)::integer AS count
        FROM applications application
        JOIN users graduate ON graduate.id = application.applicant_id
        WHERE graduate.school_id = $1
          AND graduate.role = 'graduate'
          AND graduate.deleted_at IS NULL
        GROUP BY application.status
        ORDER BY application.status
      `, [actor.uid]),
      query<AggregateRow>(`
        SELECT
          count(DISTINCT event.id) FILTER (WHERE event.status = 'published' AND event.ends_at > now())::integer AS upcoming_events,
          count(registration.graduate_id) FILTER (WHERE registration.status IN ('registered', 'attended'))::integer AS registrations
        FROM career_events event
        LEFT JOIN career_event_registrations registration ON registration.event_id = event.id
        WHERE event.organizer_id = $1
      `, [actor.uid]),
    ]);
    const totals = graduateTotals.rows[0] || {};
    const events = eventTotals.rows[0] || {};
    const statuses = applicationStatuses.rows.map((row): ReportSeriesPoint => ({
      label: row.status,
      value: numberValue(row.count),
    }));
    const report: WorkspaceReport = {
      role: 'school',
      generatedAt: new Date().toISOString(),
      context: 'Données agrégées des diplômés rattachés à votre établissement, de leurs candidatures et de vos événements. Les parcours individuels restent privés.',
      metrics: [
        metric('graduates', 'Diplômés rattachés', totals.graduates, `${numberValue(totals.active_graduates)} compte(s) actif(s)`),
        metric('visible_talents', 'Profils visibles', totals.visible_talents, 'Consentement actif pour le vivier recruteur'),
        metric('verified_education', 'Parcours vérifiés', totals.verified_education_entries, 'Entrées de formation vérifiées par votre établissement'),
        metric('event_registrations', 'Inscriptions aux événements', events.registrations, `${numberValue(events.upcoming_events)} événement(s) à venir`),
      ],
      statusBreakdown: statuses,
      rows: statuses.map((row) => ({
        étape: row.label,
        nombre_de_candidatures: row.value,
      })),
    };
    return jsonOk({ report });
  } catch (error) {
    return handleApiError(error);
  }
}
