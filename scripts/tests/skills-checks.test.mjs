import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  accommodationSeconds,
  createRandomizedManifest,
  remainingAttemptSeconds,
} from '../../src/lib/skills-checks.ts'
import {
  importSkillsBank,
  parseSkillsBank,
  skillsBankDigest,
} from '../lib/skills-bank-importer.mjs'

let PGlite
try {
  ({ PGlite } = await import('@electric-sql/pglite'))
} catch {
  // Migration verification is skipped when optional development dependencies
  // are unavailable in a production-only install.
}

const here = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(here, '..', '..')
const migrations = [
  '001_render_postgres.sql',
  '002_legacy_invite_provenance.sql',
  '003_production_data_parity.sql',
  '004_legacy_firestore_user_archives.sql',
  '005_quarantined_firestore_references.sql',
  '006_finalize_ivorian_launch_content.sql',
  '007_pilot_inquiries.sql',
  '008_verified_skills.sql',
]

async function migratedDatabase() {
  const database = new PGlite()
  for (const migration of migrations) {
    await database.exec(
      await readFile(path.join(projectRoot, 'db', 'migrations', migration), 'utf8'),
    )
  }
  const fixture = JSON.parse(await readFile(
    path.join(projectRoot, 'scripts', 'tests', 'fixtures', 'skills-bank.synthetic.json'),
    'utf8',
  ))
  const template = fixture.checks[0]
  const checks = [
    ['service-client-ci', 'service'],
    ['analyse-donnees-ci', 'data'],
    ['logistique-operations-ci', 'operations'],
  ].map(([checkId, prefix]) => ({
    ...template,
    checkId,
    questions: template.questions.map((question, index) => ({
      ...question,
      id: `synthetic-${prefix}-${String(index + 1).padStart(2, '0')}`,
    })),
  }))
  const bank = parseSkillsBank(JSON.stringify({ ...fixture, checks }))
  await importSkillsBank(database, bank, skillsBankDigest(bank))
  return database
}

test('randomized manifests select without replacement and never contain answer keys', () => {
  const sequence = [0, 1, 0, 2, 1, 0, 1, 0, 0, 1, 0, 0]
  let cursor = 0
  const manifest = createRandomizedManifest([
    { id: 'one', optionCount: 4 },
    { id: 'two', optionCount: 4 },
    { id: 'three', optionCount: 4 },
  ], 2, (maximum) => sequence[cursor++ % sequence.length] % maximum)

  assert.equal(manifest.length, 2)
  assert.equal(new Set(manifest.map((entry) => entry.questionId)).size, 2)
  for (const entry of manifest) {
    assert.deepEqual([...entry.optionOrder].sort(), [0, 1, 2, 3])
    assert.deepEqual(Object.keys(entry).sort(), ['optionOrder', 'questionId'])
    assert.equal('answer' in entry, false)
    assert.equal('correctIndex' in entry, false)
  }
})

test('accommodations extend only time and server countdown never goes negative', () => {
  assert.equal(accommodationSeconds(800, 'none'), 0)
  assert.equal(accommodationSeconds(800, 'extra_time_25'), 200)
  assert.equal(accommodationSeconds(800, 'extra_time_50'), 400)
  assert.equal(
    remainingAttemptSeconds(
      '2026-07-25T12:00:00.000Z',
      '2026-07-25T12:02:01.000Z',
    ),
    121,
  )
  assert.equal(
    remainingAttemptSeconds(
      '2026-07-25T12:03:00.000Z',
      '2026-07-25T12:02:01.000Z',
    ),
    0,
  )
})

test('migration declares and protected importer publishes three Côte d’Ivoire skills checks', { skip: !PGlite }, async () => {
  const database = await migratedDatabase()
  const checks = await database.query(`
    SELECT c.id, v.questions_per_attempt, count(q.id)::integer AS question_count
    FROM skills_checks c
    JOIN skills_check_versions v
      ON v.check_id = c.id AND v.version = c.current_version
    JOIN skills_check_questions q
      ON q.check_id = c.id AND q.check_version = v.version AND q.is_active = true
    WHERE c.status = 'published' AND v.lifecycle_status = 'published'
    GROUP BY c.id, v.questions_per_attempt
    ORDER BY c.id
  `)
  assert.equal(checks.rows.length, 3)
  for (const check of checks.rows) {
    assert.ok(check.question_count >= check.questions_per_attempt)
  }

  const migrationSource = await readFile(
    path.join(projectRoot, 'db', 'migrations', '008_verified_skills.sql'),
    'utf8',
  )
  assert.doesNotMatch(migrationSource, /INSERT\s+INTO\s+skills_check_questions/i)
  assert.doesNotMatch(migrationSource, /INSERT\s+INTO\s+skills_check_answer_keys/i)

  const attemptColumns = await database.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'skills_check_attempts'
  `)
  const attemptColumnNames = new Set(attemptColumns.rows.map((row) => row.column_name))
  for (const invasive of [
    'camera_recording',
    'microphone_recording',
    'screen_recording',
    'biometric_data',
    'answer_key',
  ]) {
    assert.equal(attemptColumnNames.has(invasive), false)
  }
  await database.close()
})

test('graduate ownership and public-consent constraints hold through an end-to-end attestation lifecycle', { skip: !PGlite }, async () => {
  const database = await migratedDatabase()
  await database.exec(`
    INSERT INTO users (id, email, name, role, status, email_verified_at)
    VALUES
      ('graduate-1', 'aya@example.ci', 'Aya N’Guessan', 'graduate', 'active', now()),
      ('company-1', 'company@example.ci', 'Entreprise', 'company', 'active', now());
  `)

  const manifest = JSON.stringify([
    { questionId: 'synthetic-service-01', optionOrder: [0, 1, 2, 3] },
    { questionId: 'synthetic-service-02', optionOrder: [1, 0, 3, 2] },
    { questionId: 'synthetic-service-03', optionOrder: [2, 3, 0, 1] },
    { questionId: 'synthetic-service-04', optionOrder: [3, 2, 1, 0] },
    { questionId: 'synthetic-service-05', optionOrder: [0, 2, 1, 3] },
    { questionId: 'synthetic-service-06', optionOrder: [1, 2, 3, 0] },
  ]).replaceAll("'", "''")

  await assert.rejects(database.exec(`
    INSERT INTO skills_check_attempts (
      id, user_id, check_id, check_version, question_manifest, expires_at
    ) VALUES (
      '11111111-1111-4111-8111-111111111111',
      'company-1',
      'service-client-ci',
      1,
      '${manifest}'::jsonb,
      now() + interval '12 minutes'
    );
  `), /graduate accounts/i)

  await assert.rejects(database.exec(`
    INSERT INTO skills_check_attempts (
      id, user_id, check_id, check_version, question_manifest, expires_at
    ) VALUES (
      '12121212-1212-4212-8212-121212121212',
      'graduate-1',
      'service-client-ci',
      1,
      '[{"questionId":"synthetic-service-01","optionOrder":[0,1,2,3],"correctIndex":0}]'::jsonb,
      now() + interval '12 minutes'
    );
  `), /attempt manifest/i)

  await database.exec(`
    INSERT INTO skills_check_attempts (
      id, user_id, check_id, check_version, question_manifest,
      conditions_version, conditions_accepted_at, privacy_notice_version, expires_at
    ) VALUES (
      '22222222-2222-4222-8222-222222222222',
      'graduate-1',
      'service-client-ci',
      1,
      '${manifest}'::jsonb,
      'test-conditions-v1',
      now(),
      'test-privacy-v1',
      now() + interval '12 minutes'
    );

    INSERT INTO skills_check_integrity_signals (attempt_id, kind, metadata)
    VALUES (
      '22222222-2222-4222-8222-222222222222',
      'focus_lost',
      '{"meaning":"review_signal_only"}'::jsonb
    );

    UPDATE skills_check_attempts
    SET
      status = 'submitted',
      submitted_at = now(),
      score = 83,
      passed = true,
      integrity_signal_count = 1
    WHERE id = '22222222-2222-4222-8222-222222222222';

    INSERT INTO skills_attestations (
      id, attempt_id, user_id, check_id, check_version, score, verification_code
    ) VALUES (
      '33333333-3333-4333-8333-333333333333',
      '22222222-2222-4222-8222-222222222222',
      'graduate-1',
      'service-client-ci',
      1,
      83,
      'opaque_verification_code_0123456789'
    );
  `)

  const privateByDefault = await database.query(`
    SELECT is_public, public_consent_at, revoked_at
    FROM skills_attestations
    WHERE id = '33333333-3333-4333-8333-333333333333'
  `)
  assert.deepEqual(privateByDefault.rows[0], {
    is_public: false,
    public_consent_at: null,
    revoked_at: null,
  })

  await assert.rejects(database.exec(`
    UPDATE skills_attestations
    SET is_public = true
    WHERE id = '33333333-3333-4333-8333-333333333333';
  `))

  await database.exec(`
    UPDATE skills_attestations
    SET is_public = true, public_consent_at = now(),
      public_consent_version = 'test-public-consent-v1'
    WHERE id = '33333333-3333-4333-8333-333333333333';

    UPDATE skills_attestations
    SET
      is_public = false,
      revoked_at = now(),
      revocation_reason = 'Revoked by the graduate account owner'
    WHERE id = '33333333-3333-4333-8333-333333333333';
  `)
  const revoked = await database.query(`
    SELECT is_public, public_consent_at IS NOT NULL AS was_public,
      revoked_at IS NOT NULL AS is_revoked
    FROM skills_attestations
    WHERE id = '33333333-3333-4333-8333-333333333333'
  `)
  assert.deepEqual(revoked.rows[0], {
    is_public: false,
    was_public: true,
    is_revoked: true,
  })

  await assert.rejects(database.exec(`
    INSERT INTO skills_attestations (
      id, attempt_id, user_id, check_id, check_version, score, verification_code
    ) VALUES (
      '44444444-4444-4444-8444-444444444444',
      '22222222-2222-4222-8222-222222222222',
      'graduate-1',
      'analyse-donnees-ci',
      1,
      83,
      'another_opaque_verification_code_001'
    );
  `))

  await database.close()
})

test('expired review evidence never becomes an automatic clearance', { skip: !PGlite }, async () => {
  const database = await migratedDatabase()
  await database.exec(`
    INSERT INTO users (id, email, name, role, status, email_verified_at)
    VALUES
      ('graduate-review', 'review@example.ci', 'Aminata Traoré', 'graduate', 'active', now()),
      ('admin-review', 'admin@example.ci', 'Administratrice', 'super_admin', 'active', now());

    INSERT INTO skills_check_attempts (
      id, user_id, check_id, check_version, status, question_manifest,
      conditions_version, conditions_accepted_at, privacy_notice_version,
      started_at, expires_at, submitted_at, score, passed,
      integrity_review_status, integrity_signal_count
    ) VALUES (
      '55555555-5555-4555-8555-555555555555',
      'graduate-review',
      'service-client-ci',
      1,
      'submitted',
      '[
        {"questionId":"synthetic-service-01","optionOrder":[0,1,2,3]},
        {"questionId":"synthetic-service-02","optionOrder":[0,1,2,3]},
        {"questionId":"synthetic-service-03","optionOrder":[0,1,2,3]},
        {"questionId":"synthetic-service-04","optionOrder":[0,1,2,3]},
        {"questionId":"synthetic-service-05","optionOrder":[0,1,2,3]},
        {"questionId":"synthetic-service-06","optionOrder":[0,1,2,3]}
      ]'::jsonb,
      'test-conditions-v1',
      now() - interval '91 days',
      'test-privacy-v1',
      now() - interval '91 days',
      now() - interval '91 days' + interval '12 minutes',
      now() - interval '91 days' + interval '10 minutes',
      83,
      true,
      'review_suggested',
      3
    );

    INSERT INTO skills_check_integrity_signals (
      attempt_id, kind, received_at, retention_expires_at
    ) VALUES (
      '55555555-5555-4555-8555-555555555555',
      'focus_lost',
      now() - interval '91 days',
      now() - interval '1 day'
    );

    INSERT INTO skills_attestations (
      id, attempt_id, user_id, check_id, check_version, score, verification_code
    ) VALUES (
      '66666666-6666-4666-8666-666666666666',
      '55555555-5555-4555-8555-555555555555',
      'graduate-review',
      'service-client-ci',
      1,
      83,
      'review_expiry_verification_code_001'
    );

    SELECT purge_expired_skills_integrity_signals();
  `)

  const review = await database.query(`
    SELECT integrity_review_status, integrity_reviewed_by,
      integrity_review_note, (
        SELECT count(*)::integer
        FROM skills_check_integrity_signals
        WHERE attempt_id = skills_check_attempts.id
      ) AS retained_signals
    FROM skills_check_attempts
    WHERE id = '55555555-5555-4555-8555-555555555555'
  `)
  assert.deepEqual(review.rows, [{
    integrity_review_status: 'review_expired',
    integrity_reviewed_by: null,
    integrity_review_note: 'Evidence retention window expired without a human decision',
    retained_signals: 0,
  }])

  await assert.rejects(database.exec(`
    UPDATE skills_attestations
    SET is_public = true, public_consent_at = now(),
      public_consent_version = 'test-public-consent-v1'
    WHERE id = '66666666-6666-4666-8666-666666666666';
  `))
  await database.close()
})

test('skills UI and APIs contain no invasive capture calls or client-shipped question keys', async () => {
  const files = [
    'src/components/skills/skills-check-attempt.tsx',
    'src/components/skills/skills-check-intro.tsx',
    'src/components/skills/skills-checks-hub.tsx',
    'src/app/api/skills/attempts/[attemptId]/route.ts',
    'src/app/api/skills/attempts/[attemptId]/submit/route.ts',
  ]
  const sources = await Promise.all(
    files.map((file) => readFile(path.join(projectRoot, file), 'utf8')),
  )
  const combined = sources.join('\n')
  assert.doesNotMatch(combined, /getUserMedia|getDisplayMedia|mediaDevices|MediaRecorder/)
  assert.doesNotMatch(
    await readFile(
      path.join(projectRoot, 'src/app/api/skills/attempts/[attemptId]/route.ts'),
      'utf8',
    ),
    /correct_index|correctIndex|answerKey/,
  )
  const privilegedRoute = await readFile(
    path.join(projectRoot, 'src/app/api/admin/skills/attempts/[attemptId]/route.ts'),
    'utf8',
  )
  const serverDomain = await readFile(
    path.join(projectRoot, 'src/lib/skills-checks-server.ts'),
    'utf8',
  )
  assert.match(privilegedRoute, /adminRoles/)
  assert.match(serverDomain, /skills_attempt\.integrity_review/)
  assert.match(serverDomain, /writeAuditLog/)
})
