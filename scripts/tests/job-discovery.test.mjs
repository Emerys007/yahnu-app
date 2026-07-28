import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  escapeLikePattern,
  parseDiscoveryBoolean,
} from '../../src/lib/job-discovery.ts';
import {
  refreshBackoffMinutes,
  shouldAttemptJobSourceRefresh,
} from '../../src/lib/job-refresh-policy.ts';
import {
  collectCompleteSourcePages,
  JobSourcePaginationError,
} from '../../src/lib/job-source-pagination.ts';
import {
  approvedHttpsUrl,
  isBlockedHostname,
  isPrivateOrReservedIp,
} from '../../src/lib/job-source-security.ts';
import { reconcileExternalJob } from '../../src/lib/job-ingestion-store.ts';
import {
  recommendationReasons,
  recommendationScore,
} from '../../src/lib/job-recommendations.ts';

let PGlite;
try {
  ({ PGlite } = await import('@electric-sql/pglite'));
} catch {
  // Migration verification remains optional outside development/test installs.
}

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..', '..');

test('official source URL checks reject SSRF and redirect-shaped targets', () => {
  const allowed = approvedHttpsUrl(
    'https://api.lever.co/v0/postings/heetch?mode=json',
    ['api.lever.co'],
  );
  assert.equal(allowed?.hostname, 'api.lever.co');
  assert.equal(
    approvedHttpsUrl('http://api.lever.co/v0/postings/heetch', ['api.lever.co']),
    null,
  );
  assert.equal(
    approvedHttpsUrl('https://api.lever.co.attacker.example/jobs', ['api.lever.co']),
    null,
  );
  assert.equal(
    approvedHttpsUrl('https://user:secret@api.lever.co/jobs', ['api.lever.co']),
    null,
  );
  assert.equal(
    approvedHttpsUrl('https://api.lever.co:8443/jobs', ['api.lever.co']),
    null,
  );
  assert.equal(
    approvedHttpsUrl(
      'https://jobs.lever.co/attacker/job-id',
      ['jobs.lever.co'],
      ['/heetch/'],
    ),
    null,
  );
  assert.equal(
    approvedHttpsUrl(
      'https://jobs.lever.co/heetch/job-id',
      ['jobs.lever.co'],
      ['/heetch/'],
    )?.pathname,
    '/heetch/job-id',
  );
  assert.equal(isBlockedHostname('metadata.google.internal'), true);
  assert.equal(isBlockedHostname('jobs.internal'), true);
});

test('bounded pagination collects a complete source and fails closed on a full final page', async () => {
  const calls = [];
  const values = await collectCompleteSourcePages(async (offset, pageSize) => {
    calls.push({ offset, pageSize });
    const sourceItemCount = offset < 100 ? 50 : 6;
    return {
      sourceItemCount,
      items: Array.from({ length: sourceItemCount }, (_, index) => offset + index),
    };
  }, { pageSize: 50, maxSourceItems: 500 });
  assert.equal(values.length, 106);
  assert.deepEqual(calls, [
    { offset: 0, pageSize: 50 },
    { offset: 50, pageSize: 50 },
    { offset: 100, pageSize: 50 },
  ]);

  await assert.rejects(
    collectCompleteSourcePages(
      async (offset, pageSize) => ({
        sourceItemCount: pageSize,
        items: [offset],
      }),
      { pageSize: 50, maxSourceItems: 100 },
    ),
    (error) => error instanceof JobSourcePaginationError && error.code === 'source_truncated',
  );
});

test('refresh backoff and explicit query booleans fail safely', () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6, 7, 8].map(refreshBackoffMinutes),
    [5, 10, 20, 40, 80, 160, 320, 360],
  );
  assert.equal(refreshBackoffMinutes(20), 360);
  assert.equal(parseDiscoveryBoolean('false'), false);
  assert.equal(parseDiscoveryBoolean('true'), true);
  assert.equal(escapeLikePattern('100%_remote\\team'), '100\\%\\_remote\\\\team');

  const now = new Date('2026-07-25T12:00:00.000Z');
  assert.equal(shouldAttemptJobSourceRefresh({
    force: false,
    enabled: true,
    lastSuccessAt: null,
    nextSyncAfter: '2026-07-25T12:05:00.000Z',
    syncIntervalMinutes: 60,
    now,
  }), false);
  assert.equal(shouldAttemptJobSourceRefresh({
    force: true,
    enabled: true,
    lastSuccessAt: null,
    nextSyncAfter: '2026-07-25T12:05:00.000Z',
    syncIntervalMinutes: 60,
    now,
  }), true);
});

test('private and reserved network ranges fail closed', () => {
  for (const address of [
    '0.0.0.0',
    '10.0.0.1',
    '100.64.0.1',
    '127.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '192.168.1.1',
    '224.0.0.1',
    '::',
    '::1',
    'fc00::1',
    'fe80::1',
    '2001:db8::1',
  ]) {
    assert.equal(isPrivateOrReservedIp(address), true, address);
  }
  assert.equal(isPrivateOrReservedIp('8.8.8.8'), false);
  assert.equal(isPrivateOrReservedIp('2606:4700:4700::1111'), false);
  assert.equal(isPrivateOrReservedIp('not-an-ip'), true);
});

test('recommendations are deterministic and explain skill/location signals', () => {
  const profile = {
    skills: ['SQL', 'Excel', 'Gestion de projet'],
    education: [{ degree: 'Licence', field: 'Finance' }],
  };
  const job = {
    kind: 'external',
    title: 'Analyste data junior',
    description: 'Vous utilisez SQL et Excel pour produire les tableaux de bord.',
    location: 'Abidjan, Côte d’Ivoire',
    categories: ['Data'],
  };
  assert.deepEqual(recommendationReasons(profile, job), [
    'Correspond à vos compétences : SQL, Excel',
    'Opportunité située en Côte d’Ivoire',
  ]);
  assert.equal(recommendationScore(profile, job), 28);
  assert.equal(recommendationScore(profile, job), recommendationScore(profile, job));
});

test('migration 009 creates bounded tracking tables and approved sources', { skip: !PGlite }, async () => {
  const database = new PGlite();
  try {
    for (const name of [
      '001_render_postgres.sql',
      '002_legacy_invite_provenance.sql',
      '003_production_data_parity.sql',
      '004_legacy_firestore_user_archives.sql',
      '005_quarantined_firestore_references.sql',
      '006_finalize_ivorian_launch_content.sql',
      '007_pilot_inquiries.sql',
      '009_unified_job_discovery.sql',
    ]) {
      await database.exec(await readFile(path.join(projectRoot, 'db', 'migrations', name), 'utf8'));
    }

    const sources = await database.query(`
      SELECT id, adapter, market_scope, enabled
      FROM job_sources
      ORDER BY id
    `);
    assert.deepEqual(sources.rows, [
      { id: 'greenhouse-alx-africa', adapter: 'greenhouse', market_scope: 'africa', enabled: true },
      { id: 'greenhouse-jumia', adapter: 'greenhouse', market_scope: 'africa', enabled: true },
      { id: 'lever-heetch', adapter: 'lever', market_scope: 'ivory_coast', enabled: true },
      { id: 'lever-yassir', adapter: 'lever', market_scope: 'africa', enabled: true },
    ]);

    await database.exec(`
      INSERT INTO users (id, email, name, role, status, email_verified_at)
      VALUES ('graduate-1', 'graduate@example.ci', 'Aya', 'graduate', 'active', now());

      INSERT INTO external_jobs (
        id, source_id, external_id, dedup_key, title, company_name, location,
        description, apply_url, canonical_url, source_hash
      ) VALUES (
        'ext_11111111111111111111111111111111',
        'lever-heetch',
        'official-1',
        '${'a'.repeat(64)}',
        'Analyste junior',
        'Heetch / Fleetch',
        'Abidjan',
        'Une description complète et vérifiée depuis la page carrière officielle.',
        'https://jobs.lever.co/heetch/official-1/apply',
        'https://jobs.lever.co/heetch/official-1',
        '${'b'.repeat(64)}'
      );

      INSERT INTO external_job_statuses (
        graduate_id, external_job_id, status, employer_confirmed
      ) VALUES (
        'graduate-1',
        'ext_11111111111111111111111111111111',
        'applied',
        false
      );
    `);

    await assert.rejects(database.exec(`
      UPDATE external_job_statuses
      SET employer_confirmed = true
      WHERE graduate_id = 'graduate-1'
    `));
    await assert.rejects(database.exec(`
      UPDATE job_sources
      SET feed_url = 'http://localhost/jobs'
      WHERE id = 'lever-heetch'
    `));

    await database.exec(`
      UPDATE external_jobs
      SET status = 'hidden', moderation_note = 'duplicate moderation must survive'
      WHERE id = 'ext_11111111111111111111111111111111';

      INSERT INTO saved_jobs (
        id, graduate_id, job_kind, external_job_id
      ) VALUES (
        'saved_11111111111111111111111111111111',
        'graduate-1',
        'external',
        'ext_11111111111111111111111111111111'
      );
    `);
    await database.transaction(async (transaction) => {
      assert.equal(await reconcileExternalJob(transaction, {
        id: 'ext_22222222222222222222222222222222',
        sourceId: 'lever-heetch',
        externalId: 'official-repost-2',
        dedupKey: 'a'.repeat(64),
        title: 'Analyste junior',
        companyName: 'Heetch / Fleetch',
        location: 'Abidjan',
        employmentType: 'full_time',
        workplaceType: 'hybrid',
        description: 'Une nouvelle copie complète depuis le même flux employeur approuvé.',
        applyUrl: 'https://jobs.lever.co/heetch/official-repost-2/apply',
        canonicalUrl: 'https://jobs.lever.co/heetch/official-repost-2',
        categories: ['Data'],
        targetMarkets: ['Côte d’Ivoire'],
        sourcePublishedAt: '2026-07-25T10:00:00.000Z',
        sourceUpdatedAt: '2026-07-25T10:00:00.000Z',
        seenAt: '2026-07-25T12:00:00.000Z',
        sourcePayload: { adapter: 'lever' },
        sourceHash: 'c'.repeat(64),
      }), true);
    });
    const canonical = await database.query(`
      SELECT id, external_id, status, moderation_note, source_hash
      FROM external_jobs
      WHERE dedup_key = '${'a'.repeat(64)}'
    `);
    assert.deepEqual(canonical.rows, [{
      id: 'ext_11111111111111111111111111111111',
      external_id: 'official-repost-2',
      status: 'hidden',
      moderation_note: 'duplicate moderation must survive',
      source_hash: 'c'.repeat(64),
    }]);
    assert.equal(
      (await database.query(`SELECT external_job_id FROM saved_jobs WHERE graduate_id = 'graduate-1'`)).rows[0].external_job_id,
      'ext_11111111111111111111111111111111',
    );
    assert.equal(
      (await database.query(`SELECT external_job_id FROM external_job_statuses WHERE graduate_id = 'graduate-1'`)).rows[0].external_job_id,
      'ext_11111111111111111111111111111111',
    );

    await database.exec(`
      UPDATE external_jobs
      SET status = 'active', moderation_note = NULL
      WHERE id = 'ext_11111111111111111111111111111111';

      INSERT INTO external_jobs (
        id, source_id, external_id, dedup_key, title, company_name, location,
        description, apply_url, canonical_url, status, moderation_note, source_hash
      ) VALUES (
        'ext_33333333333333333333333333333333',
        'lever-heetch',
        'official-converge-3',
        '${'d'.repeat(64)}',
        'Analyste junior — doublon',
        'Heetch / Fleetch',
        'Abidjan',
        'Une seconde identité fournisseur qui converge vers la carte canonique.',
        'https://jobs.lever.co/heetch/official-converge-3/apply',
        'https://jobs.lever.co/heetch/official-converge-3',
        'hidden',
        'moderation from converging identity',
        '${'e'.repeat(64)}'
      );

      INSERT INTO saved_jobs (
        id, graduate_id, job_kind, external_job_id
      ) VALUES (
        'saved_33333333333333333333333333333333',
        'graduate-1',
        'external',
        'ext_33333333333333333333333333333333'
      );

      INSERT INTO external_job_statuses (
        graduate_id, external_job_id, status, employer_confirmed, updated_at
      ) VALUES (
        'graduate-1',
        'ext_33333333333333333333333333333333',
        'offer',
        false,
        '2099-01-01T00:00:00.000Z'
      );
    `);
    await database.transaction(async (transaction) => {
      assert.equal(await reconcileExternalJob(transaction, {
        id: 'ext_33333333333333333333333333333333',
        sourceId: 'lever-heetch',
        externalId: 'official-converge-3',
        dedupKey: 'a'.repeat(64),
        title: 'Analyste junior',
        companyName: 'Heetch / Fleetch',
        location: 'Abidjan',
        employmentType: 'full_time',
        workplaceType: 'hybrid',
        description: 'La copie fournisseur convergée reste complète et correctement modérée.',
        applyUrl: 'https://jobs.lever.co/heetch/official-converge-3/apply',
        canonicalUrl: 'https://jobs.lever.co/heetch/official-converge-3',
        categories: ['Data'],
        targetMarkets: ['Côte d’Ivoire'],
        sourcePublishedAt: '2026-07-25T10:00:00.000Z',
        sourceUpdatedAt: '2026-07-25T13:00:00.000Z',
        seenAt: '2026-07-25T13:00:00.000Z',
        sourcePayload: { adapter: 'lever' },
        sourceHash: 'f'.repeat(64),
      }), true);
    });
    const merged = await database.query(`
      SELECT id, external_id, status, moderation_note
      FROM external_jobs
      WHERE source_id = 'lever-heetch'
    `);
    assert.deepEqual(merged.rows, [{
      id: 'ext_11111111111111111111111111111111',
      external_id: 'official-converge-3',
      status: 'hidden',
      moderation_note: 'moderation from converging identity',
    }]);
    assert.equal(
      Number((await database.query(`SELECT count(*)::integer AS count FROM saved_jobs WHERE graduate_id = 'graduate-1'`)).rows[0].count),
      1,
    );
    assert.deepEqual(
      (await database.query(`SELECT external_job_id, status FROM external_job_statuses WHERE graduate_id = 'graduate-1'`)).rows,
      [{ external_job_id: 'ext_11111111111111111111111111111111', status: 'offer' }],
    );
  } finally {
    await database.close();
  }
});

test('ingestion implementation retains hard network and last-known-good controls', async () => {
  const fetchSource = await readFile(
    path.join(projectRoot, 'src', 'lib', 'server', 'job-source-fetch.ts'),
    'utf8',
  );
  const ingestionSource = await readFile(
    path.join(projectRoot, 'src', 'lib', 'server', 'job-ingestion.ts'),
    'utf8',
  );
  assert.match(fetchSource, /MAX_RESPONSE_BYTES/);
  assert.match(fetchSource, /FETCH_TIMEOUT_MS/);
  assert.match(fetchSource, /redirect:\s*'error'/);
  assert.match(fetchSource, /assertPublicDns/);
  assert.match(fetchSource, /approvedHttpsUrl/);
  assert.match(fetchSource, /collectCompleteSourcePages/);
  assert.match(fetchSource, /searchParams\.set\('skip'/);
  assert.match(ingestionSource, /pg_try_advisory_lock/);
  assert.match(ingestionSource, /unexpected_empty_result/);
  assert.match(ingestionSource, /next_sync_after/);
  assert.match(ingestionSource, /accessRefreshInFlight/);
  assert.match(ingestionSource, /accessRefreshCheckAfter/);
  assert.match(ingestionSource, /last_error_code/);
  assert.match(ingestionSource, /never block/i);
});
