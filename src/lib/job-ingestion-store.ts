import type { PoolClient } from 'pg';

type CanonicalRow = {
  id: string;
  source_id: string;
  status: 'active' | 'expired' | 'hidden';
  moderated_by: string | null;
  moderated_at: Date | string | null;
  moderation_note: string | null;
};

export type ExternalJobStoreInput = {
  id: string;
  sourceId: string;
  externalId: string;
  dedupKey: string;
  title: string;
  companyName: string;
  location: string | null;
  employmentType: string | null;
  workplaceType: string | null;
  description: string;
  applyUrl: string;
  canonicalUrl: string;
  categories: string[];
  targetMarkets: string[];
  sourcePublishedAt: string | null;
  sourceUpdatedAt: string | null;
  seenAt: string;
  sourcePayload: Record<string, unknown>;
  sourceHash: string;
};

function valuesFor(input: ExternalJobStoreInput, canonicalId = input.id) {
  return [
    canonicalId,
    input.sourceId,
    input.externalId,
    input.dedupKey,
    input.title,
    input.companyName,
    input.location,
    input.employmentType,
    input.workplaceType,
    input.description,
    input.applyUrl,
    input.canonicalUrl,
    input.categories,
    input.targetMarkets,
    input.sourcePublishedAt,
    input.sourceUpdatedAt,
    input.seenAt,
    JSON.stringify(input.sourcePayload),
    input.sourceHash,
  ];
}

async function updateCanonical(
  client: Pick<PoolClient, 'query'>,
  canonicalId: string,
  input: ExternalJobStoreInput,
) {
  const result = await client.query<{ id: string }>(`
    UPDATE external_jobs SET
      source_id = $2,
      external_id = $3,
      dedup_key = $4,
      title = $5,
      company_name = $6,
      location = $7,
      employment_type = $8,
      workplace_type = $9,
      description = $10,
      apply_url = $11,
      canonical_url = $12,
      categories = $13::text[],
      target_markets = $14::text[],
      source_published_at = $15::timestamptz,
      source_updated_at = $16::timestamptz,
      last_seen_at = $17::timestamptz,
      expires_at = $17::timestamptz + interval '21 days',
      status = CASE WHEN status = 'hidden' THEN 'hidden' ELSE 'active' END,
      source_payload = $18::jsonb,
      source_hash = $19,
      updated_at = now()
    WHERE id = $1
    RETURNING id
  `, valuesFor(input, canonicalId));
  return Boolean(result.rows[0]);
}

async function preserveHiddenModeration(
  client: Pick<PoolClient, 'query'>,
  winner: CanonicalRow,
  loser: CanonicalRow,
) {
  if (winner.status === 'hidden' || loser.status !== 'hidden') return;
  await client.query(`
    UPDATE external_jobs SET
      status = 'hidden',
      moderated_by = $2,
      moderated_at = $3::timestamptz,
      moderation_note = $4,
      updated_at = now()
    WHERE id = $1
  `, [winner.id, loser.moderated_by, loser.moderated_at, loser.moderation_note]);
}

async function moveGraduateReferences(
  client: Pick<PoolClient, 'query'>,
  loserId: string,
  winnerId: string,
) {
  await client.query(`
    DELETE FROM saved_jobs loser
    WHERE loser.external_job_id = $1
      AND EXISTS (
        SELECT 1
        FROM saved_jobs winner
        WHERE winner.graduate_id = loser.graduate_id
          AND winner.external_job_id = $2
      )
  `, [loserId, winnerId]);
  await client.query(
    'UPDATE saved_jobs SET external_job_id = $2 WHERE external_job_id = $1',
    [loserId, winnerId],
  );

  await client.query(`
    INSERT INTO external_job_statuses (
      graduate_id, external_job_id, status, candidate_note,
      candidate_declared_at, applied_at, employer_confirmed, created_at, updated_at
    )
    SELECT
      graduate_id, $2, status, candidate_note,
      candidate_declared_at, applied_at, false, created_at, updated_at
    FROM external_job_statuses
    WHERE external_job_id = $1
    ON CONFLICT (graduate_id, external_job_id) DO UPDATE SET
      status = CASE
        WHEN EXCLUDED.updated_at >= external_job_statuses.updated_at THEN EXCLUDED.status
        ELSE external_job_statuses.status
      END,
      candidate_note = CASE
        WHEN EXCLUDED.updated_at >= external_job_statuses.updated_at THEN EXCLUDED.candidate_note
        ELSE external_job_statuses.candidate_note
      END,
      candidate_declared_at = GREATEST(
        EXCLUDED.candidate_declared_at,
        external_job_statuses.candidate_declared_at
      ),
      applied_at = coalesce(external_job_statuses.applied_at, EXCLUDED.applied_at),
      employer_confirmed = false,
      updated_at = GREATEST(EXCLUDED.updated_at, external_job_statuses.updated_at)
  `, [loserId, winnerId]);
  await client.query(
    'DELETE FROM external_job_statuses WHERE external_job_id = $1',
    [loserId],
  );
}

async function mergeCanonicalRows(
  client: Pick<PoolClient, 'query'>,
  winner: CanonicalRow,
  loser: CanonicalRow,
) {
  await preserveHiddenModeration(client, winner, loser);
  await moveGraduateReferences(client, loser.id, winner.id);
  await client.query('DELETE FROM external_jobs WHERE id = $1', [loser.id]);
}

/**
 * Reconciles provider identity and the cross-feed fingerprint separately.
 * Reposts from the same approved source retain the existing canonical row ID,
 * saved jobs, candidate tracking and any hidden moderation decision.
 */
export async function reconcileExternalJob(
  client: Pick<PoolClient, 'query'>,
  input: ExternalJobStoreInput,
) {
  const existingResult = await client.query<CanonicalRow>(`
    SELECT id, source_id, status, moderated_by, moderated_at, moderation_note
    FROM external_jobs
    WHERE source_id = $1 AND external_id = $2
    FOR UPDATE
  `, [input.sourceId, input.externalId]);
  const ownerResult = await client.query<CanonicalRow>(`
    SELECT id, source_id, status, moderated_by, moderated_at, moderation_note
    FROM external_jobs
    WHERE dedup_key = $1
    FOR UPDATE
  `, [input.dedupKey]);

  const existing = existingResult.rows[0] ?? null;
  const owner = ownerResult.rows[0] ?? null;

  if (owner && owner.source_id !== input.sourceId) {
    // A different approved feed already owns the canonical card. Never steal
    // its identity or overwrite its moderation state.
    return false;
  }

  if (existing && owner && existing.id !== owner.id) {
    await mergeCanonicalRows(client, owner, existing);
    return updateCanonical(client, owner.id, input);
  }
  if (existing) return updateCanonical(client, existing.id, input);
  if (owner) return updateCanonical(client, owner.id, input);

  const inserted = await client.query<{ id: string }>(`
    INSERT INTO external_jobs (
      id, source_id, external_id, dedup_key, title, company_name, location,
      employment_type, workplace_type, description, apply_url, canonical_url,
      categories, target_markets, source_published_at, source_updated_at,
      last_seen_at, expires_at, source_payload, source_hash
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
      $13::text[], $14::text[], $15::timestamptz, $16::timestamptz,
      $17::timestamptz, $17::timestamptz + interval '21 days', $18::jsonb, $19
    )
    ON CONFLICT DO NOTHING
    RETURNING id
  `, valuesFor(input));
  if (inserted.rows[0]) return true;

  // Another source transaction may have won the fingerprint race after the
  // initial SELECT. Same-source handoff is still safe; cross-source ownership
  // remains canonical and is intentionally left untouched.
  const racedOwner = await client.query<CanonicalRow>(`
    SELECT id, source_id, status, moderated_by, moderated_at, moderation_note
    FROM external_jobs
    WHERE dedup_key = $1
    FOR UPDATE
  `, [input.dedupKey]);
  const raced = racedOwner.rows[0];
  if (!raced || raced.source_id !== input.sourceId) return false;
  return updateCanonical(client, raced.id, input);
}
