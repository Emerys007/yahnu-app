import 'server-only';

import type { UserProfile } from '@/lib/auth-types';
import { escapeLikePattern, type DiscoveryJob, type ExternalJobStatus } from '@/lib/job-discovery';
import { recommendationReasons, recommendationScore } from '@/lib/job-recommendations';
import { query } from '@/lib/server/db';

type DiscoveryRow = {
  id: string;
  kind: 'yahnu' | 'external';
  title: string;
  company_name: string;
  location: string | null;
  employment_type: string | null;
  workplace_type: string | null;
  description: string;
  apply_url: string | null;
  closes_at: Date | string | null;
  published_at: Date | string;
  updated_at: Date | string;
  saved: boolean;
  external_status: ExternalJobStatus | null;
  categories: string[] | null;
  source_name: string;
  source_adapter: 'lever' | 'greenhouse' | null;
  source_career_url: string | null;
  official_domain: string | null;
  fetched_at: Date | string;
};

export type DiscoveryQuery = {
  q: string;
  location: string;
  employmentType: string;
  source: 'all' | 'yahnu' | 'external';
  savedOnly: boolean;
  trackedOnly: boolean;
  limit: number;
  offset: number;
};

function freshnessLabel(value: Date | string) {
  const hours = Math.max(0, (Date.now() - new Date(value).getTime()) / 3_600_000);
  if (hours < 24) return 'Actualisée aujourd’hui';
  if (hours < 72) return 'Actualisée récemment';
  return `Vérifiée le ${new Intl.DateTimeFormat('fr-CI', { dateStyle: 'medium' }).format(new Date(value))}`;
}

export async function discoverJobs(user: UserProfile, input: DiscoveryQuery) {
  const result = await query<DiscoveryRow>(`
    WITH unified AS (
      SELECT
        job.id,
        'yahnu'::text AS kind,
        job.title,
        coalesce(job.company_name, owner.company_name, owner.name, 'Entreprise Yahnu') AS company_name,
        job.location,
        job.employment_type,
        NULL::text AS workplace_type,
        left(job.description, 30000) AS description,
        NULL::text AS apply_url,
        job.closes_at,
        job.created_at AS published_at,
        job.updated_at,
        (saved.id IS NOT NULL) AS saved,
        NULL::text AS external_status,
        '{}'::text[] AS categories,
        'Yahnu'::text AS source_name,
        NULL::text AS source_adapter,
        NULL::text AS source_career_url,
        NULL::text AS official_domain,
        job.updated_at AS fetched_at
      FROM jobs job
      LEFT JOIN users owner ON owner.id = job.company_id AND owner.deleted_at IS NULL
      LEFT JOIN saved_jobs saved
        ON saved.graduate_id = $1 AND saved.internal_job_id = job.id
      WHERE job.status = 'open'
        AND (job.closes_at IS NULL OR job.closes_at > now())
        AND (
          $3 = ''
          OR to_tsvector(
            'simple',
            coalesce(job.title, '') || ' ' || coalesce(job.company_name, '') || ' '
              || coalesce(job.location, '') || ' ' || left(coalesce(job.description, ''), 30000)
          ) @@ websearch_to_tsquery('simple', $3)
        )

      UNION ALL

      SELECT
        job.id,
        'external'::text AS kind,
        job.title,
        job.company_name,
        job.location,
        job.employment_type,
        job.workplace_type,
        left(job.description, 30000) AS description,
        job.apply_url,
        NULL::timestamptz AS closes_at,
        coalesce(job.source_published_at, job.first_seen_at) AS published_at,
        coalesce(job.source_updated_at, job.updated_at) AS updated_at,
        (saved.id IS NOT NULL) AS saved,
        tracking.status AS external_status,
        job.categories,
        source.organization_name AS source_name,
        source.adapter AS source_adapter,
        source.career_url AS source_career_url,
        source.official_domain,
        job.last_seen_at AS fetched_at
      FROM external_jobs job
      JOIN job_sources source ON source.id = job.source_id AND source.enabled = true
      LEFT JOIN saved_jobs saved
        ON saved.graduate_id = $1 AND saved.external_job_id = job.id
      LEFT JOIN external_job_statuses tracking
        ON tracking.graduate_id = $1 AND tracking.external_job_id = job.id
      WHERE job.status = 'active'
        AND job.expires_at > now()
        AND (
          $3 = ''
          OR to_tsvector(
            'simple',
            coalesce(job.title, '') || ' ' || coalesce(job.company_name, '') || ' '
              || coalesce(job.location, '') || ' ' || left(coalesce(job.description, ''), 30000)
          ) @@ websearch_to_tsquery('simple', $3)
          OR to_tsvector('simple', array_to_string(job.categories, ' '))
            @@ websearch_to_tsquery('simple', $3)
        )
    )
    SELECT *
    FROM unified
    WHERE ($2 = 'all' OR kind = $2)
      AND ($4 = '' OR location ILIKE $4 ESCAPE '\')
      AND ($5 = '' OR employment_type = $5)
      AND (NOT $6::boolean OR saved)
      AND (NOT $7::boolean OR external_status IS NOT NULL)
    ORDER BY published_at DESC, id
    LIMIT 300
  `, [
    user.uid,
    input.source,
    input.q,
    input.location ? `%${escapeLikePattern(input.location)}%` : '',
    input.employmentType,
    input.savedOnly,
    input.trackedOnly,
  ]);

  const ranked = result.rows.map((row) => {
    const recommendationJob = {
      kind: row.kind,
      title: row.title,
      description: row.description,
      location: row.location,
      categories: row.categories,
    } as const;
    const job: DiscoveryJob = {
      id: row.id,
      kind: row.kind,
      title: row.title,
      companyName: row.company_name,
      location: row.location,
      employmentType: row.employment_type,
      workplaceType: row.workplace_type,
      description: row.description,
      applyMode: row.kind === 'yahnu' ? 'yahnu' : 'official_site',
      applyUrl: row.kind === 'external' ? row.apply_url : null,
      detailUrl: row.kind === 'yahnu' ? `/jobs/${encodeURIComponent(row.id)}` : row.source_career_url,
      closesAt: row.closes_at ? new Date(row.closes_at).toISOString() : null,
      publishedAt: new Date(row.published_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      saved: Boolean(row.saved),
      externalStatus: row.external_status,
      recommendedBecause: recommendationReasons(user, recommendationJob),
      provenance: {
        sourceName: row.source_name,
        sourceCareerUrl: row.source_career_url,
        officialDomain: row.official_domain,
        applicationHost: row.kind === 'external' && row.apply_url
          ? new URL(row.apply_url).hostname
          : null,
        atsProvider: row.source_adapter === 'lever'
          ? 'Lever'
          : row.source_adapter === 'greenhouse'
            ? 'Greenhouse'
            : null,
        fetchedAt: new Date(row.fetched_at).toISOString(),
        freshnessLabel: row.kind === 'yahnu' ? 'Gérée sur Yahnu' : freshnessLabel(row.fetched_at),
        isOfficialSource: row.kind === 'external',
      },
    };
    return { job, score: recommendationScore(user, recommendationJob) };
  }).sort((left, right) => (
    right.score - left.score
    || new Date(right.job.publishedAt).getTime() - new Date(left.job.publishedAt).getTime()
    || left.job.id.localeCompare(right.job.id)
  ));

  return {
    jobs: ranked.slice(input.offset, input.offset + input.limit).map(({ job }) => job),
    total: ranked.length,
    hasMore: input.offset + input.limit < ranked.length,
    nextOffset: input.offset + Math.min(input.limit, Math.max(0, ranked.length - input.offset)),
  };
}
