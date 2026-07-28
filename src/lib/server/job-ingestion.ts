import 'server-only';

import type { PoolClient } from 'pg';

import type { JobSourceSummary } from '@/lib/job-discovery';
import { refreshBackoffMinutes, shouldAttemptJobSourceRefresh } from '@/lib/job-refresh-policy';
import {
  externalJobDedupKey,
  externalJobIdentity,
  externalJobSourceHash,
  fetchApprovedJobSource,
  JobSourceFetchError,
  type NormalizedExternalJob,
} from '@/lib/server/job-source-fetch';
import { reconcileExternalJob } from '@/lib/job-ingestion-store';
import { approvedJobSource, approvedJobSources, type ApprovedJobSource } from '@/lib/server/job-source-registry';
import { getPool, query } from '@/lib/server/db';

const SOURCE_LOCK_NAMESPACE = 912_470;

type SourceRow = {
  id: string;
  organization_name: string;
  adapter: 'lever' | 'greenhouse';
  feed_url: string;
  career_url: string;
  official_domain: string;
  market_scope: 'ivory_coast' | 'africa';
  enabled: boolean;
  sync_interval_minutes: number;
  max_items: number;
  last_sync_started_at: Date | string | null;
  last_sync_completed_at: Date | string | null;
  last_success_at: Date | string | null;
  next_sync_after: Date | string | null;
  last_error_code: string | null;
  consecutive_failures: number;
  last_item_count: number;
  active_item_count?: number | string;
  hidden_item_count?: number | string;
};

export type JobSourceSyncResult = {
  sourceId: string;
  status: 'synced' | 'skipped_locked' | 'skipped_disabled' | 'failed';
  itemCount: number;
  errorCode?: string;
};

function sourceMatchesRegistry(row: SourceRow, source: ApprovedJobSource) {
  return row.id === source.id
    && row.organization_name === source.organizationName
    && row.adapter === source.adapter
    && row.feed_url === source.feedUrl
    && row.career_url === source.careerUrl
    && row.official_domain === source.officialDomain
    && row.market_scope === source.marketScope
    && row.max_items === source.maxItems;
}

function sourceErrorCode(error: unknown) {
  if (error instanceof JobSourceFetchError) return error.code;
  if (error instanceof Error && error.name === 'ZodError') return 'schema_validation_failed';
  return 'sync_failed';
}

async function upsertExternalJob(
  client: Parameters<typeof reconcileExternalJob>[0],
  source: ApprovedJobSource,
  job: NormalizedExternalJob,
  seenAt: Date,
) {
  return reconcileExternalJob(client, {
    id: externalJobIdentity(source.id, job.externalId),
    sourceId: source.id,
    externalId: job.externalId,
    dedupKey: externalJobDedupKey(job),
    title: job.title,
    companyName: job.companyName,
    location: job.location,
    employmentType: job.employmentType,
    workplaceType: job.workplaceType,
    description: job.description,
    applyUrl: job.applyUrl,
    canonicalUrl: job.canonicalUrl,
    categories: job.categories,
    targetMarkets: job.targetMarkets,
    sourcePublishedAt: job.sourcePublishedAt,
    sourceUpdatedAt: job.sourceUpdatedAt,
    seenAt: seenAt.toISOString(),
    sourcePayload: job.sourcePayload,
    sourceHash: externalJobSourceHash(job),
  });
}

async function syncWithClient(client: PoolClient, source: ApprovedJobSource, row: SourceRow) {
  const startedAt = new Date();
  await client.query(`
    UPDATE job_sources SET
      last_sync_started_at = $2,
      last_error_code = NULL,
      updated_at = now()
    WHERE id = $1
  `, [source.id, startedAt.toISOString()]);

  try {
    const fetched = await fetchApprovedJobSource(source);
    if (fetched.length > row.max_items) {
      throw new JobSourceFetchError('source_item_limit_exceeded');
    }
    if (!fetched.length && row.last_item_count > 0) {
      throw new JobSourceFetchError('unexpected_empty_result');
    }

    await client.query('BEGIN');
    let itemCount = 0;
    try {
      for (const job of fetched) {
        if (await upsertExternalJob(client, source, job, startedAt)) itemCount += 1;
      }
      await client.query(`
        UPDATE external_jobs SET
          status = 'expired',
          expires_at = LEAST(expires_at, now()),
          updated_at = now()
        WHERE source_id = $1
          AND status = 'active'
          AND last_seen_at < $2
      `, [source.id, startedAt.toISOString()]);
      await client.query(`
        UPDATE job_sources SET
          last_sync_completed_at = now(),
          last_success_at = now(),
          next_sync_after = NULL,
          last_error_code = NULL,
          consecutive_failures = 0,
          last_item_count = $2,
          updated_at = now()
        WHERE id = $1
      `, [source.id, itemCount]);
      await client.query('COMMIT');
      return { sourceId: source.id, status: 'synced', itemCount } satisfies JobSourceSyncResult;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    const errorCode = sourceErrorCode(error);
    const nextSyncAfter = new Date(
      Date.now() + refreshBackoffMinutes(row.consecutive_failures + 1) * 60_000,
    ).toISOString();
    await client.query(`
      UPDATE job_sources SET
        last_sync_completed_at = now(),
        next_sync_after = $3::timestamptz,
        last_error_code = $2,
        consecutive_failures = consecutive_failures + 1,
        updated_at = now()
      WHERE id = $1
    `, [source.id, errorCode, nextSyncAfter]);
    return { sourceId: source.id, status: 'failed', itemCount: 0, errorCode } satisfies JobSourceSyncResult;
  }
}

export async function syncJobSource(sourceId: string, force = false): Promise<JobSourceSyncResult> {
  const source = approvedJobSource(sourceId);
  if (!source) return { sourceId, status: 'failed', itemCount: 0, errorCode: 'source_not_approved' };

  const client = await getPool().connect();
  let locked = false;
  try {
    const lock = await client.query<{ locked: boolean }>(
      'SELECT pg_try_advisory_lock($1, hashtext($2)) AS locked',
      [SOURCE_LOCK_NAMESPACE, source.id],
    );
    locked = Boolean(lock.rows[0]?.locked);
    if (!locked) return { sourceId, status: 'skipped_locked', itemCount: 0 };

    const result = await client.query<SourceRow>('SELECT * FROM job_sources WHERE id = $1', [source.id]);
    const row = result.rows[0];
    if (!row || !sourceMatchesRegistry(row, source)) {
      return { sourceId, status: 'failed', itemCount: 0, errorCode: 'source_registry_mismatch' };
    }
    if (!row.enabled) return { sourceId, status: 'skipped_disabled', itemCount: 0 };
    if (!shouldAttemptJobSourceRefresh({
      force,
      enabled: row.enabled,
      lastSuccessAt: row.last_success_at,
      nextSyncAfter: row.next_sync_after,
      syncIntervalMinutes: row.sync_interval_minutes,
    })) {
      return { sourceId, status: 'synced', itemCount: row.last_item_count };
    }
    return await syncWithClient(client, source, row);
  } finally {
    if (locked) {
      await client.query('SELECT pg_advisory_unlock($1, hashtext($2))', [SOURCE_LOCK_NAMESPACE, source.id])
        .catch(() => undefined);
    }
    client.release();
  }
}

export async function refreshStaleJobSources(options: { force?: boolean; maxSources?: number } = {}) {
  const force = options.force ?? false;
  const maxSources = Math.max(1, Math.min(options.maxSources ?? approvedJobSources.length, approvedJobSources.length));
  const candidates = await query<{ id: string }>(`
    SELECT id
    FROM job_sources
    WHERE enabled = true
      AND (
        $1::boolean
        OR (
          (next_sync_after IS NULL OR next_sync_after <= now())
          AND (
            last_success_at IS NULL
            OR last_success_at + (sync_interval_minutes * interval '1 minute') <= now()
          )
        )
      )
    ORDER BY last_success_at ASC NULLS FIRST, id
    LIMIT $2
  `, [force, maxSources]);
  return Promise.all(candidates.rows.map((row) => syncJobSource(row.id, force)));
}

let accessRefreshInFlight: Promise<void> | null = null;
let accessRefreshCheckAfter = 0;

export function triggerAccessRefresh() {
  if (accessRefreshInFlight || Date.now() < accessRefreshCheckAfter) return false;
  accessRefreshCheckAfter = Date.now() + 5_000;

  // Render runs the Next server as a persistent web process. Access refreshes
  // never block the graduate response, and one process launches at most one
  // bounded refresh batch at a time. PostgreSQL advisory locks remain the
  // cross-process guard; next_sync_after supplies durable failure backoff.
  accessRefreshInFlight = refreshStaleJobSources({ maxSources: 2 })
    .then((results) => {
      // A non-empty batch may leave more approved sources to seed. An empty
      // batch means every source is fresh or durably backed off, so avoid a
      // database freshness query on each search keystroke.
      accessRefreshCheckAfter = Date.now() + (results.length ? 3_000 : 60_000);
    })
    .catch((error) => {
      accessRefreshCheckAfter = Date.now() + 30_000;
      console.error('Background job-source refresh failed:', error);
    })
    .finally(() => {
      accessRefreshInFlight = null;
    });
  return true;
}

export async function listJobSources(): Promise<JobSourceSummary[]> {
  const result = await query<SourceRow>(`
    SELECT source.*,
      count(job.id) FILTER (WHERE job.status = 'active' AND job.expires_at > now())::integer AS active_item_count,
      count(job.id) FILTER (WHERE job.status = 'hidden')::integer AS hidden_item_count
    FROM job_sources source
    LEFT JOIN external_jobs job ON job.source_id = source.id
    GROUP BY source.id
    ORDER BY source.organization_name
  `);
  return result.rows.map((row) => ({
    id: row.id,
    organizationName: row.organization_name,
    adapter: row.adapter,
    careerUrl: row.career_url,
    officialDomain: row.official_domain,
    marketScope: row.market_scope,
    enabled: row.enabled,
    lastSyncStartedAt: row.last_sync_started_at ? new Date(row.last_sync_started_at).toISOString() : null,
    lastSyncCompletedAt: row.last_sync_completed_at ? new Date(row.last_sync_completed_at).toISOString() : null,
    lastSuccessAt: row.last_success_at ? new Date(row.last_success_at).toISOString() : null,
    nextSyncAfter: row.next_sync_after ? new Date(row.next_sync_after).toISOString() : null,
    lastErrorCode: row.last_error_code,
    consecutiveFailures: Number(row.consecutive_failures),
    lastItemCount: Number(row.last_item_count),
    activeItemCount: Number(row.active_item_count ?? 0),
    hiddenItemCount: Number(row.hidden_item_count ?? 0),
    stale: !row.last_success_at
      || new Date(row.last_success_at).getTime() + row.sync_interval_minutes * 60_000 <= Date.now(),
  }));
}
