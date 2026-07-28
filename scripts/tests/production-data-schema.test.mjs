import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  assertPartialFirestoreImportAllowed,
  disambiguateBlogSlugs,
  hasBlockingImportIssues,
  normalizeAnnouncement,
  normalizeApplication,
  normalizeBlogPost,
  normalizeConversation,
  normalizeDashboard,
  normalizeInvite,
  normalizeJob,
  normalizeKnowledgeBaseArticle,
  normalizeMail,
  normalizeNotification,
  normalizePage,
  normalizePartnership,
  normalizeTicket,
  normalizeUser,
  preflightFirebaseAuthExport,
  isConversationEligibleForImport,
  runtimeConversationTicketReference,
  rawFirestoreUserIdentityCandidates as importRawFirestoreUserIdentityCandidates,
  synthesizedAnnouncementNotification,
} from '../import-firebase-json.mjs'
import { deterministicStorageAssetId as exportedStorageAssetId } from '../export-firebase-storage.mjs'
import {
  assertStorageImportCapacity,
  databaseSafeStorageProvenance,
  deterministicStorageAssetId as importedStorageAssetId,
  validatedPublicImageContentType,
} from '../import-firebase-storage.mjs'
import { firestoreJson } from '../export-firestore-json.mjs'
import {
  QUARANTINED_FIRESTORE_REFERENCE_MANIFEST,
  isApprovedQuarantinedFirestoreReference,
} from '../firebase-quarantine-manifest.mjs'
import {
  classifyFirestoreUsersForArchive,
  expectedArchiveProfileReferences,
  expectedBlogAfterIvorianLaunch,
  expectedJobAfterIvorianLaunch,
  expectedQuarantinedFirestoreReferenceRows,
  rawFirestoreUserIdentityCandidates as verifyRawFirestoreUserIdentityCandidates,
  runtimeTokenHash,
} from '../verify-firebase-import.mjs'
import {
  deterministicStorageAssetId as verifiedStorageAssetId,
  hashStoredContentOneAtATime,
} from '../verify-firebase-storage.mjs'

let PGlite
try {
  ({ PGlite } = await import('@electric-sql/pglite'))
} catch {
  // The project intentionally keeps migration verification outside runtime
  // dependencies. Install @electric-sql/pglite temporarily to execute these tests.
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
  '009_unified_job_discovery.sql',
  '010_role_workspaces.sql',
]
const sourceHash = 'a'.repeat(64)

async function migratedDatabase() {
  const database = new PGlite()
  for (const migration of migrations) {
    await database.exec(await readFile(path.join(projectRoot, 'db', 'migrations', migration), 'utf8'))
  }
  return database
}

test('pilot inquiries are retained as a separate privacy-bounded operational queue', { skip: !PGlite }, async () => {
  const database = await migratedDatabase()
  await database.exec(`
    INSERT INTO pilot_inquiries (
      id, kind, full_name, email, organization_name, organization_type,
      country_code, timeline, message, locale, source, consented_at
    ) VALUES (
      '11111111-1111-4111-8111-111111111111',
      'pilot',
      'Aya Nguessan',
      'aya@example.ci',
      'Programme Emploi Jeunes',
      'public_institution',
      'CI',
      'three_months',
      'Nous souhaitons mesurer le passage de la formation au premier emploi.',
      'fr',
      'institutions',
      now()
    );
  `)
  const saved = await database.query(`
    SELECT status, retention_expires_at > created_at AS retention_bounded
    FROM pilot_inquiries
    WHERE id = '11111111-1111-4111-8111-111111111111'
  `)
  assert.deepEqual(saved.rows[0], { status: 'new', retention_bounded: true })

  const columns = await database.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'pilot_inquiries'
  `)
  const names = new Set(columns.rows.map((row) => row.column_name))
  assert.equal(names.has('ip_address'), false)
  assert.equal(names.has('user_agent'), false)
  assert.equal(names.has('password'), false)

  await assert.rejects(
    database.exec(`
      UPDATE pilot_inquiries
      SET status = 'unrestricted'
      WHERE id = '11111111-1111-4111-8111-111111111111'
    `),
  )
  await database.close()
})

test('the Côte d’Ivoire launch migration changes only exact prototype fingerprints', { skip: !PGlite }, async () => {
  const database = new PGlite()
  for (const migration of migrations.slice(0, -1)) {
    await database.exec(await readFile(path.join(projectRoot, 'db', 'migrations', migration), 'utf8'))
  }

  await database.exec(`
    INSERT INTO jobs (
      id, company_ref, title, location, description, status, source_payload
    ) VALUES
      (
        'job1', 'comp1', 'Frontend Developer', 'Remote',
        'We are looking for a skilled Frontend Developer to join our team.', 'open',
        '{"companyId":"comp1","salary":"Competitive"}'
      ),
      (
        'job2', 'comp2', 'Marketing Specialist', 'New York, NY',
        'We are seeking a Marketing Specialist to help grow our brand.', 'open',
        '{"companyId":"comp2","salary":"Experience Dependent"}'
      ),
      (
        'employer-job', 'company-real', 'Frontend Developer', 'Remote',
        'A genuine employer-authored role that must remain visible after the cleanup.', 'open',
        '{"companyId":"company-real","salary":"Competitive"}'
      );

    INSERT INTO applications (id, job_id, job_ref, applicant_ref, status)
    VALUES ('application-on-seed', 'job1', 'job1', 'graduate-1', 'submitted');

    INSERT INTO pages (id, data)
    VALUES (
      'about-us',
      $json$
      {
        "aboutTitle": "About Yahnu",
        "aboutSubtitle": "We are on a mission to bridge the gap between education and employment, creating a thriving ecosystem for talent to connect with opportunity in {country} and beyond.",
        "storyTitle": "Our Story",
        "storyContent1": "<p>Founded by a team of educators and entrepreneurs, Yahnu was born from a shared vision: to unlock the immense potential of graduates by directly connecting them with the industries that need their skills. We saw a disconnect between the classroom and the workplace and set out to build the bridge.</p>",
        "storyContent2": "<p>Today, Yahnu is a dynamic platform that empowers students to launch their careers, helps companies find the right talent efficiently, and enables schools to forge meaningful industry partnerships. We believe in building futures, one connection at a time.</p>",
        "missionTitle": "Our Mission",
        "missionContent": "<p>To empower graduates, companies, and schools by creating a seamless and efficient ecosystem for talent development and career growth.</p>",
        "visionTitle": "Our Vision",
        "visionContent": "<p>To be the leading platform for professional connection and opportunity in Africa, driving economic growth and individual success.</p>",
        "valuesTitle": "Our Values",
        "valuesContent": "<p>Integrity, Innovation, Collaboration, and an unwavering commitment to the success of our users.</p>",
        "teamMembers": [
          {"name":"Colombe Koffi","role":"Founder & CEO","imageUrl":""},
          {"name":"Joël K","role":"Head of Product & Lead Engineer","imageUrl":""},
          {"name":"Bethel Touman","role":"Data Engineer","imageUrl":""}
        ]
      }$json$::jsonb
    );

    INSERT INTO blog_posts (
      id, slug, title, author, excerpt, content_html, status
    ) VALUES
      (
        'okXTCncxBSJrQIYAnIrm', 'legacy-creator-story',
        'Entrepreneuriat numérique : Comment Yahnu soutient la nouvelle génération de créateurs en Afrique',
        'Yahnu Staff', 'Un exemple suffisamment descriptif pour le test.',
        '<p>Exemple fictif : Aïda, diplômée en informatique à Dakar, lance son produit.</p>',
        'published'
      ),
      (
        'nzi7LABXAQ8GHlRpFxiD', 'legacy-remote-story',
        'L''avenir du travail en Afrique est à distance',
        'Yanhu Staff', 'Un second exemple suffisamment descriptif pour le test.',
        '<p>Exemple fictif : Aïda, diplômée en informatique à Dakar, lance son produit.</p>',
        'published'
      ),
      (
        'editor-post', 'editor-owned-story', 'Un article éditorial distinct',
        'Yahnu Staff', 'Un contenu créé par un éditeur et laissé intact.',
        '<p>Aïda, diplômée en informatique à Dakar, apparaît dans un article distinct.</p>',
        'published'
      );
  `)

  const migrationSql = await readFile(
    path.join(projectRoot, 'db', 'migrations', '006_finalize_ivorian_launch_content.sql'),
    'utf8',
  )
  await database.exec(migrationSql)

  const jobs = await database.query('SELECT id, status FROM jobs ORDER BY id')
  assert.deepEqual(jobs.rows, [
    { id: 'employer-job', status: 'open' },
    { id: 'job1', status: 'closed' },
    { id: 'job2', status: 'closed' },
  ])

  const applications = await database.query(`
    SELECT id, job_id FROM applications WHERE id = 'application-on-seed'
  `)
  assert.deepEqual(applications.rows, [
    { id: 'application-on-seed', job_id: 'job1' },
  ])

  const about = await database.query(`
    SELECT
      data ->> 'aboutTitle' AS title,
      data #>> '{teamMembers,0,imageUrl}' AS image_url
    FROM pages
    WHERE id = 'about-us'
  `)
  assert.deepEqual(about.rows, [{
    title: 'Faire du diplôme un vrai point de départ.',
    image_url: '/images/Colombe Koffi.jpeg',
  }])

  const posts = await database.query(`
    SELECT id, author, content_html FROM blog_posts ORDER BY id
  `)
  assert.equal(posts.rows.find((post) => post.id === 'okXTCncxBSJrQIYAnIrm').content_html.includes('à Abidjan'), true)
  assert.equal(posts.rows.find((post) => post.id === 'nzi7LABXAQ8GHlRpFxiD').author, 'Yahnu Staff')
  assert.equal(posts.rows.find((post) => post.id === 'nzi7LABXAQ8GHlRpFxiD').content_html.includes('à Abidjan'), true)
  assert.equal(posts.rows.find((post) => post.id === 'editor-post').content_html.includes('à Dakar'), true)

  const audits = await database.query(`
    SELECT action, count(*)::integer AS count
    FROM audit_logs
    GROUP BY action
    ORDER BY action
  `)
  assert.deepEqual(audits.rows, [
    { action: 'migration.close_legacy_seed_job', count: 2 },
    { action: 'migration.localize_legacy_about_page', count: 1 },
    { action: 'migration.localize_legacy_blog_example', count: 2 },
  ])

  await database.exec(migrationSql)
  const auditCount = await database.query('SELECT count(*)::integer AS count FROM audit_logs')
  assert.deepEqual(auditCount.rows, [{ count: 5 }])

  await database.close()
})

test('the Firebase verifier recognizes only exact audited Côte d’Ivoire launch overrides', () => {
  const legacyBlog = {
    title: 'L\'avenir du travail en Afrique est à distance',
    authorName: 'Yanhu Staff',
    content: '<p>Aïda, diplômée en informatique à Dakar construit son projet.</p>',
    status: 'published',
  }
  const localizedBlog = expectedBlogAfterIvorianLaunch('nzi7LABXAQ8GHlRpFxiD', legacyBlog)
  assert.equal(localizedBlog.authorName, 'Yahnu Staff')
  assert.equal(localizedBlog.content.includes('à Abidjan'), true)
  assert.equal(expectedBlogAfterIvorianLaunch('editor-owned-post', legacyBlog), legacyBlog)

  const legacyJob = {
    companyRef: 'comp1',
    companyName: null,
    title: 'Frontend Developer',
    description: 'We are looking for a skilled Frontend Developer to join our team.',
    location: 'Remote',
    employmentType: null,
    applicationUrl: null,
    status: 'open',
    payload: { companyId: 'comp1', salary: 'Competitive' },
  }
  assert.equal(expectedJobAfterIvorianLaunch('job1', legacyJob).status, 'closed')
  const editedJob = { ...legacyJob, description: 'An employer-edited description.' }
  assert.equal(expectedJobAfterIvorianLaunch('job1', editedJob), editedJob)
})

async function importerSql(name) {
  const source = await readFile(path.join(projectRoot, 'scripts', 'import-firebase-json.mjs'), 'utf8')
  const match = source.match(new RegExp(`const ${name} = ` + '`([\\s\\S]*?)`'))
  assert.ok(match, `missing importer SQL constant ${name}`)
  return match[1]
}

async function firestoreVerifierSql(name) {
  const source = await readFile(path.join(projectRoot, 'scripts', 'verify-firebase-import.mjs'), 'utf8')
  const match = source.match(new RegExp(`const ${name} = ` + '`([\\s\\S]*?)`'))
  assert.ok(match, `missing Firestore verifier SQL constant ${name}`)
  return match[1]
}

async function storageImporterSql(name) {
  const source = await readFile(path.join(projectRoot, 'scripts', 'import-firebase-storage.mjs'), 'utf8')
  const match = source.match(new RegExp(`const ${name} = ` + '`([\\s\\S]*?)`'))
  assert.ok(match, `missing Storage importer SQL constant ${name}`)
  return match[1]
}

async function storageVerifierSql(name) {
  const source = await readFile(path.join(projectRoot, 'scripts', 'verify-firebase-storage.mjs'), 'utf8')
  const match = source.match(new RegExp(`const ${name} = ` + '`([\\s\\S]*?)`'))
  assert.ok(match, `missing Storage verifier SQL constant ${name}`)
  return match[1]
}

test('Firestore exporter retries bounded transient responses before returning JSON', async () => {
  const statuses = [503, 503, 200]
  const delays = []
  const calls = []
  const result = await firestoreJson('https://firestore.example.test/read', { token: 'test-token' }, {
    fetchImpl: async (endpoint, request) => {
      calls.push({ endpoint, method: request.method })
      const status = statuses.shift()
      return status === 200
        ? new Response(JSON.stringify({ collectionIds: ['users'] }), { status })
        : new Response('', { status })
    },
    sleepImpl: async (milliseconds) => { delays.push(milliseconds) },
  })

  assert.deepEqual(result, { collectionIds: ['users'] })
  assert.deepEqual(delays, [500, 1_000])
  assert.equal(calls.length, 3)
  assert.ok(calls.every((call) => call.method === 'GET'))
})

test('Firestore exporter sanitizes exhausted transient network failures', async () => {
  const token = 'super-sensitive-test-token'
  const endpoint = 'https://firestore.example.test/read?pageToken=private-page-token'
  const delays = []
  let calls = 0

  await assert.rejects(
    firestoreJson(endpoint, { token }, {
      fetchImpl: async () => {
        calls += 1
        throw new TypeError('fetch failed', { cause: { code: 'ETIMEDOUT' } })
      },
      sleepImpl: async (milliseconds) => { delays.push(milliseconds) },
    }),
    (error) => {
      assert.match(error.message, /after 4 attempts/i)
      assert.match(error.message, /ETIMEDOUT/)
      assert.equal(error.message.includes(token), false)
      assert.equal(error.message.includes('private-page-token'), false)
      return true
    },
  )

  assert.equal(calls, 4)
  assert.deepEqual(delays, [500, 1_000, 2_000])
})

test('Firestore exporter does not retry authorization failures', async () => {
  const delays = []
  let calls = 0

  await assert.rejects(
    firestoreJson('https://firestore.example.test/read', { token: 'test-token' }, {
      fetchImpl: async () => {
        calls += 1
        return new Response(JSON.stringify({ error: { message: 'The caller is not authorized.' } }), { status: 401 })
      },
      sleepImpl: async (milliseconds) => { delays.push(milliseconds) },
    }),
    /Firestore API request was rejected \(401\).*caller is not authorized/i,
  )

  assert.equal(calls, 1)
  assert.deepEqual(delays, [])
})

test('production parity schema supports native APIs and Firebase provenance rows', { skip: !PGlite }, async () => {
  const database = await migratedDatabase()
  try {
    await database.exec(`
      INSERT INTO users (id, email, name, role, status, email_verified_at)
      VALUES
        ('admin-1', 'admin@example.com', 'Admin', 'admin', 'active', now()),
        ('user-1', 'user@example.com', 'User', 'graduate', 'active', now());

      INSERT INTO auth_identities (user_id, provider, provider_subject, provider_email)
      VALUES ('user-1', 'google.com', 'google-subject-1', 'user@example.com');

      INSERT INTO media_assets (
        id, storage_path, original_filename, content_type, byte_size, sha256,
        content, is_public, uploaded_by
      ) VALUES (
        'native-media', 'blogImages/native.png', 'native.png', 'image/png', 3,
        '${'b'.repeat(64)}', decode('010203', 'hex'), true, 'admin-1'
      );

      INSERT INTO media_assets (
        id, storage_path, original_filename, content_type, byte_size, sha256,
        content, source_provider, source_bucket, source_path, source_generation,
        metadata, legacy_url_hashes
      ) VALUES (
        'firebase-${'c'.repeat(48)}', 'firebase/example.appspot.com/1/blogImages/legacy.png',
        'legacy.png', 'image/png', 3, '${'c'.repeat(64)}', decode('040506', 'hex'),
        'firebase_storage', 'example.appspot.com', 'blogImages/legacy.png', '1', '{}', '[]'
      );

      INSERT INTO blog_posts (
        id, slug, title, author, excerpt, content_html, status, image_url,
        created_by
      ) VALUES (
        'native-blog', 'native-blog', 'Native blog', 'Admin', 'A useful excerpt',
        '<p>Native article</p>', 'published', '/api/media/native-media', 'admin-1'
      );

      INSERT INTO blog_posts (
        id, slug, title, author, excerpt, content_html, status, image_url,
        created_by, author_ref, legacy_image_url_sha256, source_payload, source_hash
      ) VALUES (
        'firebase-blog', 'firebase-blog', 'Firebase blog', 'Legacy author',
        'Legacy excerpt', '<p>Legacy article</p>', 'published',
        NULL, 'admin-1', 'admin-1',
        '${'e'.repeat(64)}', '{}', '${sourceHash}'
      );

      INSERT INTO conversations (id, name, last_message, last_message_at, metadata)
      VALUES ('conversation-1', 'Conversation', 'Hello', now(), '{}');
      INSERT INTO conversation_participants (conversation_id, user_id, unread_count, last_read_at)
      VALUES ('conversation-1', 'user-1', 1, NULL), ('conversation-1', 'admin-1', 0, now());
      INSERT INTO messages (id, conversation_id, sender_id, body)
      VALUES ('message-1', 'conversation-1', 'admin-1', 'Hello');

      INSERT INTO notifications (id, user_id, type, title, body, link, payload, created_by)
      VALUES ('notification-1', 'user-1', 'message', 'New message', 'Hello', '/dashboard/messages', '{}', 'admin-1');
      INSERT INTO notification_receipts (notification_id, user_id, read_at)
      VALUES ('notification-1', 'user-1', now());

      INSERT INTO announcements (id, title, content, audience, status, expires_at, created_by)
      VALUES ('announcement-1', 'Launch', 'We are live', 'all', 'active', NULL, 'admin-1');
      INSERT INTO knowledge_base_articles (id, title, category, content_html, status, created_by)
      VALUES (
        'kb-1', 'Getting started', 'General',
        '<p>Welcome to Yahnu. This article explains how to get started safely.</p>',
        'published', 'admin-1'
      );

      INSERT INTO jobs (id, title, description, source_payload, source_hash)
      VALUES ('job-1', 'Engineer', 'Build and maintain reliable Yahnu services.', '{}', '${sourceHash}');
      INSERT INTO applications (id, job_id, job_ref, applicant_id, applicant_ref, source_payload, source_hash)
      VALUES ('application-1', 'job-1', 'job-1', 'user-1', 'user-1', '{}', '${sourceHash}');
      INSERT INTO partnerships (id, requester_id, requester_ref, partner_id, partner_ref, source_payload, source_hash)
      VALUES ('partnership-1', 'admin-1', 'admin-1', 'user-1', 'user-1', '{}', '${sourceHash}');
      INSERT INTO archived_mail (id, envelope_to, source_payload, source_hash)
      VALUES (
        'mail-1', '["user@example.com"]',
        '{"format":"yahnu-archived-mail-metadata-v1"}', '${sourceHash}'
      );
      INSERT INTO invalidated_legacy_email_codes (id, user_ref, email, code_sha256, source_hash)
      VALUES ('code-1', 'user-1', 'user@example.com', '${'d'.repeat(64)}', '${sourceHash}');
    `)

    const tables = await database.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `)
    const tableNames = new Set(tables.rows.map((row) => row.table_name))
    for (const table of [
      'auth_identities', 'media_assets', 'media_asset_url_rewrites', 'blog_posts',
      'conversations', 'conversation_participants', 'messages', 'notifications',
      'notification_receipts', 'jobs', 'applications', 'partnerships', 'archived_mail',
      'announcements', 'knowledge_base_articles', 'invalidated_legacy_email_codes',
      'legacy_firestore_user_archives', 'legacy_firestore_user_archive_references',
      'legacy_unresolved_firestore_references',
    ]) assert.ok(tableNames.has(table), `missing table ${table}`)

    const counts = await database.query(`
      SELECT
        (SELECT count(*)::integer FROM media_assets) AS media,
        (SELECT count(*)::integer FROM blog_posts) AS blogs,
        (SELECT count(*)::integer FROM messages) AS messages,
        (SELECT count(*)::integer FROM notifications) AS notifications,
        (SELECT count(*)::integer FROM invalidated_legacy_email_codes) AS invalidated_codes
    `)
    assert.deepEqual(counts.rows[0], {
      media: 2,
      blogs: 2,
      messages: 1,
      notifications: 1,
      invalidated_codes: 1,
    })
  } finally {
    await database.close()
  }
})

test('production constraints reject mismatched media bytes and active legacy auth codes', { skip: !PGlite }, async () => {
  const database = await migratedDatabase()
  try {
    await assert.rejects(database.exec(`
      INSERT INTO media_assets (
        id, storage_path, original_filename, content_type, byte_size, sha256, content
      ) VALUES ('bad', 'bad', 'bad.png', 'image/png', 99, '${'e'.repeat(64)}', decode('01', 'hex'));
    `), /check constraint/i)

    await assert.rejects(database.exec(`
      INSERT INTO notifications (id, title, body)
      VALUES ('audience-less', 'Unsafe', 'Must never become global');
    `), /check constraint/i)

    const activePurpose = await database.query(`
      SELECT check_clause
      FROM information_schema.check_constraints
      WHERE constraint_name LIKE 'auth_tokens_purpose%'
    `)
    assert.equal(activePurpose.rows.some((row) => String(row.check_clause).includes('legacy')), false)

    await database.exec(`
      INSERT INTO legacy_firestore_user_archives (
        legacy_firebase_uid, source_payload, source_hash, archive_reason
      ) VALUES (
        'firestore-only-profile', '{"format":"yahnu-legacy-firestore-user-archive-v1"}', '${sourceHash}', 'missing_auth_identity'
      );
    `)
    await assert.rejects(database.exec(`
      INSERT INTO legacy_firestore_user_archive_references (
        source_collection, source_id, source_field, legacy_firebase_uid, source_hash
      ) VALUES ('tickets', 'ticket-1', 'user_id', 'firestore-only-profile', '${sourceHash}');
    `), /check constraint/i)
    await assert.rejects(database.exec(`
      INSERT INTO legacy_unresolved_firestore_references (
        source_collection, source_id, source_field, target_ref_sha256, source_hash, reason
      ) VALUES ('partnerships', 'partnership-1', 'requester_ref', '${'b'.repeat(64)}', '${sourceHash}', 'source_target_absent_from_export');
    `), /check constraint/i)
  } finally {
    await database.close()
  }
})

test('Firestore-only profiles are archived only when no Auth identity candidate exists', () => {
  const auth = {
    identities: new Map([
      ['auth-uid', { id: 'auth-uid', email: 'auth@example.com' }],
      ['direct-uid', { id: 'direct-uid', email: 'direct@example.com' }],
      ['other-auth', { id: 'other-auth', email: 'other@example.com' }],
    ]),
  }
  const users = {
    records: new Map([
      ['auth-uid', { id: 'auth-uid', firestoreIdentityCandidateIds: [], firestoreIdentityCandidateEmails: [] }],
      ['archive-uid', { id: 'archive-uid', firestoreIdentityCandidateIds: [], firestoreIdentityCandidateEmails: [] }],
      ['ambiguous-uid', {
        id: 'ambiguous-uid', firestoreIdentityCandidateIds: ['auth-uid'], firestoreIdentityCandidateEmails: [],
      }],
      ['ambiguous-email', {
        id: 'ambiguous-email', firestoreIdentityCandidateIds: [], firestoreIdentityCandidateEmails: ['auth@example.com'],
      }],
      ['direct-uid', {
        id: 'direct-uid', firestoreIdentityCandidateIds: ['other-auth'], firestoreIdentityCandidateEmails: [],
      }],
    ]),
  }
  const classification = classifyFirestoreUsersForArchive(users, auth)
  assert.deepEqual([...classification.active.keys()], ['auth-uid'])
  assert.deepEqual([...classification.archived.keys()], ['archive-uid'])
  assert.deepEqual(classification.identityConflicts.sort(), ['ambiguous-email', 'ambiguous-uid', 'direct-uid'])
})

test('provider emails prevent a Firebase reference from being treated as absent', () => {
  const timestamp = '2026-07-13T00:00:00.000Z'
  const normalized = normalizeUser({
    record: {
      id: 'firestore-profile',
      email: 'profile@example.com',
      providerUserInfo: [{ email: 'Provider.Identity@example.com' }],
    },
    inferredId: null,
  }, timestamp, 'firestore')
  assert.equal(normalized.error, undefined)
  assert.deepEqual(normalized.user.firestoreIdentityCandidateEmails, [
    'profile@example.com',
    'provider.identity@example.com',
  ])

  const restUser = {
    name: 'projects/test/databases/(default)/documents/users/firestore-profile',
    fields: {
      providerUserInfo: {
        arrayValue: {
          values: [{
            mapValue: {
              fields: { email: { stringValue: 'Provider.Identity@example.com' } },
            },
          }],
        },
      },
    },
  }
  const importerCandidates = importRawFirestoreUserIdentityCandidates({ users: [restUser] })
  assert.equal(importerCandidates.emails.has('provider.identity@example.com'), true)

  const verifierCandidates = verifyRawFirestoreUserIdentityCandidates({
    users: { documents: [restUser] },
  })
  assert.equal(verifierCandidates.emails.has('provider.identity@example.com'), true)
})

test('Firestore cutovers cannot opt into partial commits', () => {
  assert.throws(
    () => assertPartialFirestoreImportAllowed('firestore', true),
    /allow-partial is prohibited/i,
  )
  assert.doesNotThrow(() => assertPartialFirestoreImportAllowed('auth', true))
  assert.doesNotThrow(() => assertPartialFirestoreImportAllowed('firestore', false))
})

test('a conversation with only frozen verified-absent participants is preserved without a synthetic account', () => {
  const runtimeUsers = new Set(['active-user'])
  const isVerifiedAbsent = (participant) => participant.ref === 'frozen-absent-user'

  assert.equal(isConversationEligibleForImport(
    [{ ref: 'frozen-absent-user' }],
    runtimeUsers,
    isVerifiedAbsent,
  ), true)
  assert.equal(isConversationEligibleForImport(
    [{ ref: 'unknown-user' }],
    runtimeUsers,
    isVerifiedAbsent,
  ), false)
  assert.equal(isConversationEligibleForImport(
    [{ ref: 'active-user' }, { ref: 'unknown-user' }],
    runtimeUsers,
    isVerifiedAbsent,
  ), true, 'the per-participant gate remains responsible for blocking mixed memberships')
  assert.equal(isConversationEligibleForImport([], runtimeUsers, isVerifiedAbsent), false)
})

test('a fully quarantined legacy conversation cannot be linked into a live support ticket', () => {
  const runtimeUsers = new Set(['active-user'])
  const runtimeTickets = new Set(['live-ticket'])
  assert.equal(runtimeConversationTicketReference({
    ticketRef: 'live-ticket', participants: [{ ref: 'frozen-absent-user' }],
  }, runtimeUsers, runtimeTickets), null)
  assert.equal(runtimeConversationTicketReference({
    ticketRef: 'live-ticket', participants: [{ ref: 'active-user' }],
  }, runtimeUsers, runtimeTickets), 'live-ticket')
  assert.equal(runtimeConversationTicketReference({
    ticketRef: 'unknown-ticket', participants: [{ ref: 'active-user' }],
  }, runtimeUsers, runtimeTickets), null)
})

test('only sanctioned Firestore archive references are expected outside runtime foreign keys', () => {
  const archiveId = 'archive-uid'
  const sourceHash = 'b'.repeat(64)
  const active = new Map([['active-uid', {
    id: 'active-uid', schoolId: archiveId, firestoreSourceHash: sourceHash,
  }]])
  const archived = new Map([[archiveId, { id: archiveId }]])
  const references = expectedArchiveProfileReferences({
    jobs: { records: new Map([['job-1', { companyRef: archiveId, sourceHash }]]) },
    applications: { records: new Map([['application-1', { applicantRef: archiveId, sourceHash }]]) },
    partnerships: { records: new Map([['partnership-1', {
      requesterRef: archiveId, partnerRef: archiveId, sourceHash,
    }]]) },
  }, active, archived)
  assert.deepEqual([...references.values()], [
    { sourceCollection: 'users', sourceId: 'active-uid', sourceField: 'school_id', legacyFirebaseUid: archiveId, sourceHash },
    { sourceCollection: 'jobs', sourceId: 'job-1', sourceField: 'company_ref', legacyFirebaseUid: archiveId, sourceHash },
    { sourceCollection: 'applications', sourceId: 'application-1', sourceField: 'applicant_ref', legacyFirebaseUid: archiveId, sourceHash },
    { sourceCollection: 'partnerships', sourceId: 'partnership-1', sourceField: 'requester_ref', legacyFirebaseUid: archiveId, sourceHash },
    { sourceCollection: 'partnerships', sourceId: 'partnership-1', sourceField: 'partner_ref', legacyFirebaseUid: archiveId, sourceHash },
  ])
})

test('only the frozen, verified-absent reference manifest can enter the quarantine ledger', () => {
  assert.equal(QUARANTINED_FIRESTORE_REFERENCE_MANIFEST.size, 3)
  assert.deepEqual(
    new Set([...QUARANTINED_FIRESTORE_REFERENCE_MANIFEST].map((entry) => {
      const [collection, , field] = entry.split('\0')
      return `${collection}\0${field}`
    })),
    new Set(['conversations\0participant_ref', 'jobs\0company_ref', 'partnerships\0partner_ref']),
  )
  const sourceHash = 'c'.repeat(64)
  const references = expectedQuarantinedFirestoreReferenceRows({
    jobs: { records: new Map([
      ['job-stale', { companyRef: 'missing-company', sourceHash }],
      ['job-known', { companyRef: 'known-source-document', sourceHash }],
    ]) },
    partnerships: { records: new Map([
      ['partnership-stale', { requesterRef: 'runtime-user', partnerRef: 'missing-partner', sourceHash }],
    ]) },
    conversations: { records: new Map([
      ['conversation-stale', { participants: [{ ref: 'missing-participant' }, { ref: 'runtime-user' }], sourceHash }],
    ]) },
  }, new Map([['runtime-user', { id: 'runtime-user' }]]), new Map(), new Set(['known-source-document']), {
    identities: new Map([['runtime-user', { id: 'runtime-user', email: 'runtime@example.com' }]]),
  }, { ids: new Set(), emails: new Set() })
  assert.equal(references.size, 0, 'unreviewed source rows must remain blocking')

  assert.equal(isApprovedQuarantinedFirestoreReference(
    'jobs',
    'e7825afd4dba4f8fa840c305377165b2e3cc73d900219eda610ddcd93abf05cc',
    'company_ref',
    '3a339982067713c0bdf5632501aaa6018c387411409261f8ba9e970fa9ff71d9',
    'd85d4a82a8444e8c27328ad9c02cdb7af185b603b06f5398c3985a46b44c14e8',
  ), true)
  assert.equal(isApprovedQuarantinedFirestoreReference(
    'jobs',
    'e7825afd4dba4f8fa840c305377165b2e3cc73d900219eda610ddcd93abf05cc',
    'company_ref',
    sourceHash,
    'd85d4a82a8444e8c27328ad9c02cdb7af185b603b06f5398c3985a46b44c14e8',
  ), false)
})

test('legacy email codes activated with the runtime HMAC are detected', { skip: !PGlite }, async () => {
  const database = await migratedDatabase()
  try {
    const secret = 'render-production-auth-secret-32-chars-minimum'
    const legacyCode = 'legacy-verification-code-that-must-stay-dead'
    const tokenHash = runtimeTokenHash(legacyCode, secret)
    await database.exec(`
      INSERT INTO users (id, email, name, role, status)
      VALUES ('user-legacy-code', 'legacy-code@example.com', 'Legacy', 'graduate', 'active');
    `)
    await database.query(`
      INSERT INTO auth_tokens (token_hash, user_id, purpose, expires_at)
      VALUES ($1, 'user-legacy-code', 'verify_email', now() + interval '1 day')
    `, [tokenHash])
    const activated = await database.query(await firestoreVerifierSql('ACTIVE_LEGACY_AUTH_TOKEN_SQL'), [[tokenHash]])
    assert.equal(activated.rows.length, 1)
    assert.equal(activated.rows[0].token_hash, tokenHash)
    assert.throws(() => runtimeTokenHash(legacyCode, 'short'), /AUTH_SECRET/i)
  } finally {
    await database.close()
  }
})

test('every production collection importer upsert matches the migrated schema', { skip: !PGlite }, async () => {
  const database = await migratedDatabase()
  try {
    await database.exec(`
      INSERT INTO users (id, email, name, role, status, email_verified_at)
      VALUES
        ('admin-1', 'admin@example.com', 'Admin', 'admin', 'active', now()),
        ('user-1', 'user@example.com', 'User', 'graduate', 'active', now());
      INSERT INTO tickets (id, user_id, type, description)
      VALUES ('ticket-1', 'user-1', 'support', 'Please help with my Yahnu account.');
      UPDATE users SET legacy_firebase_uid = id WHERE id = 'user-1';
    `)
    const now = new Date().toISOString()
    const payload = JSON.stringify({ source: 'firebase' })
    const mailPayload = JSON.stringify({ format: 'yahnu-archived-mail-metadata-v1' })

    await database.query(await importerSql('UPDATE_FIRESTORE_USER_SQL'), [
      'user-1', 'Updated User', 'Updated', 'User', 'graduate', 'active', null, null,
      null, null, null, null, '[]', '[]', null, payload, true, sourceHash, null, false,
    ])
    await database.query(await importerSql('UPSERT_LEGACY_FIRESTORE_USER_ARCHIVE_SQL'), [
      'firestore-only-profile', payload, sourceHash, now, now,
    ])
    await database.query(await importerSql('UPSERT_LEGACY_FIRESTORE_USER_ARCHIVE_REFERENCE_SQL'), [
      'jobs', 'job-1', 'company_ref', 'firestore-only-profile', sourceHash,
    ])
    await database.query(await importerSql('UPSERT_LEGACY_UNRESOLVED_FIRESTORE_REFERENCE_SQL'), [
      'jobs', 'job-1', 'company_ref', 'b'.repeat(64), sourceHash,
    ])
    await database.query(await importerSql('UPSERT_TICKET_SQL'), [
      'ticket-1', 'user-1', 'Account assistance',
      'Please help with my Yahnu account.', 'in_progress', 'high', payload,
      now, now, true,
    ])

    await database.query(await importerSql('UPSERT_AUTH_IDENTITY_SQL'), [
      'user-1', 'google.com', 'google-subject', 'user@example.com',
    ])
    await database.query(await importerSql('UPSERT_BLOG_POST_SQL'), [
      'blog-1', 'blog-one', 'Blog one', 'Legacy author', 'Excerpt', '<p>Body</p>',
      'published', 'https://example.com/image.png', 'admin-1', 'admin-1',
      null, now, payload, sourceHash, now, now, now,
    ])
    await database.query(await importerSql('UPSERT_CONVERSATION_SQL'), [
      'conversation-1', 'Conversation', null, null, 'Hello', now, 'ticket-1', payload,
      sourceHash, now, now, now,
    ])
    await database.query(await importerSql('UPSERT_CONVERSATION_PARTICIPANT_SQL'), [
      'conversation-1', 'user-1', 'user-1', 'User', 1, now, payload,
    ])
    await database.query(await importerSql('UPSERT_MESSAGE_SQL'), [
      'conversation-1:message-1', 'conversation-1', 'user-1', 'user-1', 'Hello',
      null, 0, payload, sourceHash, now, now, null,
    ])
    await database.query(await importerSql('UPSERT_NOTIFICATION_SQL'), [
      'notification-1', 'user-1', 'user-1', null, false, 'admin-1', 'admin-1', 'message',
      'New message', 'Hello', '/dashboard/messages', payload, sourceHash, now, now, null,
    ])
    await database.query(await importerSql('UPSERT_NOTIFICATION_RECEIPT_SQL'), [
      'notification-1', 'user-1', now, now, null,
    ])
    await database.query(await importerSql('UPSERT_JOB_SQL'), [
      'job-1', null, 'company-1', 'Engineer', 'Company', 'Remote', 'full_time',
      'A complete imported job description.', 'open', null, null, payload, sourceHash, now, now, now,
    ])
    await database.query(await importerSql('UPSERT_APPLICATION_SQL'), [
      'application-1', 'job-1', 'job-1', 'user-1', 'user-1', 'submitted', null,
      null, payload, sourceHash, now, now, now,
    ])
    await database.query(await importerSql('UPSERT_PARTNERSHIP_SQL'), [
      'partnership-1', 'admin-1', 'admin-1', 'user-1', 'user-1', 'Yahnu',
      'contact@example.com', 'pending', payload, sourceHash, now, now, now,
    ])
    await database.query(await importerSql('UPSERT_ARCHIVED_MAIL_SQL'), [
      'mail-1', 'sender@example.com', JSON.stringify(['user@example.com']), 'Subject',
      'SUCCESS', mailPayload, sourceHash, now, now, now,
    ])
    await database.query(await importerSql('UPSERT_ANNOUNCEMENT_SQL'), [
      'announcement-1', 'Announcement', 'Content', 'all', 'active', null, 'admin-1',
      payload, sourceHash, now, now, now,
    ])
    await database.query(await importerSql('UPSERT_ANNOUNCEMENT_NOTIFICATION_SQL'), [
      'firebase-announcement-fixture', null, true, 'announcement-1', 'admin-1', 'admin-1',
      'Announcement', 'Content', JSON.stringify({
        migrationKind: 'firebase_announcement_notification_v1',
        announcementId: 'announcement-1',
        announcementSourceHash: sourceHash,
      }), sourceHash, now, now, null,
    ])
    await database.query(await importerSql('UPSERT_KNOWLEDGE_ARTICLE_SQL'), [
      'kb-1', 'Article', 'General',
      '<p>This knowledge-base article contains enough useful content for runtime validation.</p>',
      'published', 'admin-1',
      payload, sourceHash, now, now, now,
    ])
    await database.query(await importerSql('UPSERT_INVALIDATED_EMAIL_CODE_SQL'), [
      'code-1', 'user-1', 'user@example.com', 'd'.repeat(64), sourceHash, now, now,
    ])

    const result = await database.query(`
      SELECT
        (SELECT count(*)::integer FROM auth_identities) AS identities,
        (SELECT count(*)::integer FROM users WHERE legacy_firestore_source_hash = '${sourceHash}') AS firestore_users,
        (SELECT count(*)::integer FROM tickets WHERE status = 'in_progress' AND priority = 'high') AS tickets,
        (SELECT count(*)::integer FROM blog_posts WHERE source_hash = '${sourceHash}') AS blogs,
        (SELECT count(*)::integer FROM conversations WHERE source_hash = '${sourceHash}') AS conversations,
        (SELECT count(*)::integer FROM messages WHERE source_hash = '${sourceHash}') AS messages,
        (SELECT count(*)::integer FROM notifications WHERE source_hash = '${sourceHash}') AS notifications,
        (SELECT count(*)::integer FROM jobs WHERE source_hash = '${sourceHash}') AS jobs,
        (SELECT count(*)::integer FROM applications WHERE source_hash = '${sourceHash}') AS applications,
        (SELECT count(*)::integer FROM partnerships WHERE source_hash = '${sourceHash}') AS partnerships,
        (SELECT count(*)::integer FROM archived_mail WHERE source_hash = '${sourceHash}') AS mail,
        (SELECT count(*)::integer FROM announcements WHERE source_hash = '${sourceHash}') AS announcements,
        (SELECT count(*)::integer FROM knowledge_base_articles WHERE source_hash = '${sourceHash}') AS knowledge,
        (SELECT count(*)::integer FROM invalidated_legacy_email_codes WHERE source_hash = '${sourceHash}') AS invalidated_codes,
        (SELECT count(*)::integer FROM legacy_firestore_user_archives WHERE source_hash = '${sourceHash}') AS archived_profiles,
        (SELECT count(*)::integer FROM legacy_firestore_user_archive_references WHERE source_hash = '${sourceHash}') AS archived_profile_references,
        (SELECT count(*)::integer FROM legacy_unresolved_firestore_references WHERE source_hash = '${sourceHash}') AS quarantined_references
    `)
    assert.deepEqual(result.rows[0], {
      identities: 1,
      firestore_users: 1,
      tickets: 1,
      blogs: 1,
      conversations: 1,
      messages: 1,
      notifications: 2,
      jobs: 1,
      applications: 1,
      partnerships: 1,
      mail: 1,
      announcements: 1,
      knowledge: 1,
      invalidated_codes: 1,
      archived_profiles: 1,
      archived_profile_references: 1,
      quarantined_references: 1,
    })
  } finally {
    await database.close()
  }
})

test('Storage importer persists bytes and URL rewrites against the canonical media contract', { skip: !PGlite }, async () => {
  const database = await migratedDatabase()
  try {
    const bytes = Buffer.from([1, 2, 3, 4])
    const contentHash = '9f64a747e1b97f131fabb6b447296c9b6f0201e79fb3c5356e6c77e89b6a806a'
    const bucket = 'example.appspot.com'
    const objectName = 'blogImages/one.png'
    const id = importedStorageAssetId(bucket, objectName, '1')
    const nextGenerationId = importedStorageAssetId(bucket, objectName, '2')
    const sourceUrl = 'https://firebasestorage.googleapis.com/v0/b/example.appspot.com/o/blogImages%2Fone.png?alt=media'
    const sourceUrlHash = createHash('sha256').update(sourceUrl).digest('hex')
    const privateName = 'resumes/user-1.pdf'
    const privateId = importedStorageAssetId(bucket, privateName, '9')
    const privateUrl = 'gs://example.appspot.com/resumes/user-1.pdf'
    const privateUrlHash = createHash('sha256').update(privateUrl).digest('hex')
    const now = new Date().toISOString()
    await database.query(await storageImporterSql('UPSERT_MEDIA_SQL'), [
      id,
      'firebase/example.appspot.com/1/blogImages/one.png',
      'one.png',
      'image/png',
      bytes.length,
      contentHash,
      bytes,
      true,
      bucket,
      objectName,
      '1',
      JSON.stringify({ customMetadata: {} }),
      JSON.stringify([sourceUrlHash]),
      now,
      now,
    ])
    await database.query(await storageImporterSql('UPSERT_REWRITE_SQL'), [
      sourceUrlHash, id, `/api/media/${id}`, bucket, objectName,
    ])

    await database.query(await storageImporterSql('UPSERT_MEDIA_SQL'), [
      nextGenerationId,
      'firebase/example.appspot.com/2/blogImages/one.png',
      'one.png',
      'image/png',
      bytes.length,
      contentHash,
      bytes,
      true,
      bucket,
      objectName,
      '2',
      JSON.stringify({ customMetadata: {} }),
      JSON.stringify([sourceUrlHash]),
      now,
      now,
    ])
    await database.query(await storageImporterSql('UPSERT_REWRITE_SQL'), [
      sourceUrlHash, nextGenerationId, `/api/media/${nextGenerationId}`, bucket, objectName,
    ])

    await database.query(await storageImporterSql('UPSERT_MEDIA_SQL'), [
      privateId,
      'firebase/example.appspot.com/9/resumes/user-1.pdf',
      'user-1.pdf',
      'application/pdf',
      bytes.length,
      contentHash,
      bytes,
      false,
      bucket,
      privateName,
      '9',
      JSON.stringify({ customMetadata: {} }),
      JSON.stringify([privateUrlHash]),
      now,
      now,
    ])
    await database.query(await storageImporterSql('UPSERT_REWRITE_SQL'), [
      privateUrlHash, privateId, null, bucket, privateName,
    ])
    const result = await database.query(`
      SELECT asset.id, asset.byte_size, asset.sha256, asset.is_public, rewrite.replacement_path
      FROM media_assets asset
      JOIN media_asset_url_rewrites rewrite ON rewrite.media_asset_id = asset.id
      WHERE asset.id = ANY($1::text[])
      ORDER BY asset.id
    `, [[nextGenerationId, privateId]])
    const byId = new Map(result.rows.map((row) => [row.id, row]))
    assert.equal(byId.get(nextGenerationId).byte_size, 4)
    assert.equal(byId.get(nextGenerationId).sha256, contentHash)
    assert.equal(byId.get(nextGenerationId).is_public, true)
    assert.equal(byId.get(nextGenerationId).replacement_path, `/api/media/${nextGenerationId}`)
    assert.equal(byId.get(privateId).is_public, false)
    assert.equal(byId.get(privateId).replacement_path, null)

    const generations = await database.query(`
      SELECT id, source_generation
      FROM media_assets
      WHERE source_bucket = $1 AND source_path = $2
      ORDER BY source_generation
    `, [bucket, objectName])
    assert.deepEqual(generations.rows, [
      { id, source_generation: '1' },
      { id: nextGenerationId, source_generation: '2' },
    ])
  } finally {
    await database.close()
  }
})

test('Storage asset IDs are immutable-generation bound in export, import, and verify contracts', () => {
  const bucket = 'example.appspot.com'
  const name = 'blogImages/one.png'
  const generationOne = exportedStorageAssetId(bucket, name, '1700000000000001')
  const generationTwo = exportedStorageAssetId(bucket, name, '1700000000000002')
  assert.notEqual(generationOne, generationTwo)
  assert.equal(importedStorageAssetId(bucket, name, '1700000000000001'), generationOne)
  assert.equal(verifiedStorageAssetId(bucket, name, '1700000000000001'), generationOne)
  assert.throws(() => importedStorageAssetId(bucket, name, ''), /generation/i)
})

test('Storage capacity preflight leaves WAL and bytea headroom before an import', () => {
  const gib = 1024 ** 3
  assert.deepEqual(
    assertStorageImportCapacity({
      currentDatabaseBytes: 2 * gib,
      manifestPayloadBytes: 4 * gib,
      databaseCapacityBytes: 16 * gib,
    }),
    {
      currentBytes: 2 * gib,
      payloadBytes: 4 * gib,
      capacityBytes: 16 * gib,
      estimatedPeakBytes: 10 * gib,
      approvedLimitBytes: Math.floor(16 * gib * 0.8),
    },
  )
  assert.throws(
    () => assertStorageImportCapacity({
      currentDatabaseBytes: 4 * gib,
      manifestPayloadBytes: 5 * gib,
      databaseCapacityBytes: 16 * gib,
    }),
    /capacity gate failed/i,
  )
})

test('public Firebase media uses the runtime image signatures and 5 MB cap', () => {
  assert.equal(validatedPublicImageContentType(Buffer.from([0xff, 0xd8, 0xff, 0x00])), 'image/jpeg')
  assert.equal(
    validatedPublicImageContentType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    'image/png',
  )
  assert.equal(validatedPublicImageContentType(Buffer.from('GIF89a', 'ascii')), 'image/gif')
  assert.equal(validatedPublicImageContentType(Buffer.from('not-an-image')), null)
  const oversizedJpeg = Buffer.alloc(5 * 1024 * 1024 + 1)
  oversizedJpeg.set([0xff, 0xd8, 0xff])
  assert.equal(validatedPublicImageContentType(oversizedJpeg), null)
})

test('Firebase download tokens and token metadata never enter Storage database parameters', () => {
  const token = 'private-firebase-download-token-value'
  const tokenUrl = `https://firebasestorage.googleapis.com/v0/b/example.appspot.com/o/resumes%2Fuser.pdf?alt=media&token=${token}`
  const projection = databaseSafeStorageProvenance({
    sourceUrls: [
      'gs://example.appspot.com/resumes/user.pdf',
      tokenUrl,
    ],
    metageneration: '2',
    md5Hash: 'safe-md5',
    crc32c: 'safe-crc',
    customMetadata: {
      firebaseStorageDownloadTokens: token,
      authorization: `Bearer ${token}`,
    },
  })
  const serializedParameters = JSON.stringify(projection)
  assert.equal(serializedParameters.includes(token), false)
  assert.equal(serializedParameters.includes(tokenUrl), false)
  assert.equal(serializedParameters.includes('firebaseStorageDownloadTokens'), false)
  assert.deepEqual(projection.sourceUrlHashes, [
    createHash('sha256').update('gs://example.appspot.com/resumes/user.pdf').digest('hex'),
    createHash('sha256').update(tokenUrl).digest('hex'),
  ])
})

test('legacy Firebase invite document tokens become opaque PostgreSQL IDs', () => {
  const timestamp = '2026-07-13T00:00:00.000Z'
  const legacyToken = 'HhK4wA0wbKZJn3TuYm8Q'
  const fromLegacyDocument = normalizeInvite({
    record: {
      name: `projects/yahnu-50c61/databases/(default)/documents/invites/${legacyToken}`,
      fields: {
        email: { stringValue: 'admin@example.com' },
        role: { stringValue: 'admin' },
        status: { stringValue: 'pending' },
        createdBy: { stringValue: 'super-admin-1' },
        createdAt: { timestampValue: timestamp },
      },
    },
    inferredId: null,
  }, timestamp, 1).invite

  assert.equal(fromLegacyDocument.rawToken, legacyToken)
  assert.match(fromLegacyDocument.id, /^firebase-invite-[0-9a-f]{48}$/)
  assert.notEqual(fromLegacyDocument.id, legacyToken)
  assert.equal(fromLegacyDocument.id.includes(legacyToken), false)
  assert.equal(JSON.stringify({ ...fromLegacyDocument, rawToken: undefined }).includes(legacyToken), false)

  const explicitToken = 'separate-legacy-invite-token'
  const fromSeparateFields = normalizeInvite({
    record: {
      id: 'firestore-invite-record-1',
      token: explicitToken,
      email: 'admin@example.com',
      role: 'admin',
      status: 'pending',
      createdBy: 'super-admin-1',
      createdAt: timestamp,
    },
    inferredId: null,
  }, timestamp, 2).invite

  assert.equal(fromSeparateFields.id, 'firestore-invite-record-1')
  assert.equal(fromSeparateFields.rawToken, explicitToken)
})

test('Firestore media references persist only canonical URL hashes and redacted payloads', () => {
  const timestamp = '2026-07-13T00:00:00.000Z'
  const token = 'firestore-private-download-token'
  const tokenUrl = `https://firebasestorage.googleapis.com/v0/b/example.appspot.com/o/resumes%2Fuser.pdf?alt=media&token=${token}`
  const canonicalUrl = 'https://firebasestorage.googleapis.com/v0/b/example.appspot.com/o/resumes%2Fuser.pdf?alt=media'
  const expectedHash = createHash('sha256').update(canonicalUrl).digest('hex')

  const application = normalizeApplication({
    record: {
      id: 'application-token', jobId: 'job-1', userId: 'user-1', resumeUrl: tokenUrl,
      status: 'submitted', createdAt: timestamp,
    },
    inferredId: null,
  }, timestamp).application
  assert.equal(application.legacyResumeUrlSha256, expectedHash)
  assert.equal(JSON.stringify(application.payload).includes(token), false)

  const conversation = normalizeConversation({
    record: {
      id: 'conversation-token',
      participants: ['user-1'],
      messages: [{ id: 'message-1', senderId: 'user-1', text: 'Resume', attachmentUrl: tokenUrl }],
      createdAt: timestamp,
    },
    inferredId: null,
  }, timestamp).conversation
  assert.equal(conversation.messages[0].legacyAttachmentUrlSha256, expectedHash)
  assert.equal(JSON.stringify(conversation.messages[0].payload).includes(token), false)

  const avatarTokenUrl = `https://firebasestorage.googleapis.com/v0/b/example.appspot.com/o/avatars%2Fuser.png?alt=media&token=${token}`
  const canonicalAvatarUrl = 'https://firebasestorage.googleapis.com/v0/b/example.appspot.com/o/avatars%2Fuser.png?alt=media'
  const expectedAvatarHash = createHash('sha256').update(canonicalAvatarUrl).digest('hex')
  const user = normalizeUser({
    record: {
      id: 'user-1', email: 'user@example.com', profile: { photoURL: avatarTokenUrl, locale: 'fr' },
    },
    inferredId: null,
  }, timestamp, 'firestore').user
  assert.equal(user.legacyAvatarUrlSha256, expectedAvatarHash)
  assert.equal(user.hasAvatarField, true)
  assert.deepEqual(user.profile, { locale: 'fr' })

  const avatarConversation = normalizeConversation({
    record: {
      id: 'conversation-avatar', participants: ['user-1'], avatarUrl: avatarTokenUrl, createdAt: timestamp,
    },
    inferredId: null,
  }, timestamp).conversation
  assert.equal(avatarConversation.avatarUrl, null)
  assert.equal(avatarConversation.legacyAvatarUrlSha256, expectedAvatarHash)

  const serializedParameters = JSON.stringify({ application, conversation, user, avatarConversation })
  assert.equal(serializedParameters.includes(token), false)
  assert.equal(serializedParameters.includes('token='), false)
})

test('conversation normalization fails closed on missing or malformed membership', () => {
  const timestamp = '2026-07-13T00:00:00.000Z'
  const missingParticipants = normalizeConversation({
    record: { id: 'conversation-empty', createdAt: timestamp },
    inferredId: null,
  }, timestamp)
  assert.match(missingParticipants.error, /no participants/i)

  const invalidParticipant = normalizeConversation({
    record: {
      id: 'conversation-invalid-participant',
      participants: [{ displayName: 'Missing identity' }],
      createdAt: timestamp,
    },
    inferredId: null,
  }, timestamp)
  assert.match(invalidParticipant.error, /participant 1.*user reference/i)
})

test('embedded signed URLs fail closed instead of leaking through operational text', () => {
  const timestamp = '2026-07-13T00:00:00.000Z'
  const encodedTokenUrl = 'https://firebasestorage.googleapis.com/v0/b/example.appspot.com/o/private%2Ffile.pdf?alt=media&amp;token=plaintext-secret'
  const ticket = normalizeTicket({
    record: {
      id: 'ticket-secret', userId: 'user-1', subject: 'A support request',
      description: `Please inspect ${encodedTokenUrl} before responding.`,
    },
    inferredId: null,
  }, timestamp, 1)
  assert.match(ticket.error, /unsupported Firebase Storage/i)
  assert.equal(JSON.stringify(ticket).includes('plaintext-secret'), false)

  const doubleEncoded = 'https%253A%252F%252Ffirebasestorage.googleapis.com%252Fv0%252Fb%252Fexample.appspot.com%252Fo%252Fprivate%25252Ffile.pdf%253Falt%253Dmedia%2526token%253Dplaintext-secret'
  const announcement = normalizeAnnouncement({
    record: { id: 'announcement-secret', title: 'Notice', content: doubleEncoded, audience: 'all', status: 'active' },
    inferredId: null,
  }, timestamp)
  assert.match(announcement.error, /Firebase Storage|signed URL/i)
  assert.equal(JSON.stringify(announcement).includes('plaintext-secret'), false)
})

test('explicit unknown user roles and statuses fail closed', () => {
  const timestamp = '2026-07-13T00:00:00.000Z'
  const unknownRole = normalizeUser({
    record: { id: 'user-role', email: 'role@example.com', role: 'future_super_admin' },
    inferredId: null,
  }, timestamp, 'firestore')
  assert.match(unknownRole.error, /role is not supported/i)

  const unknownStatus = normalizeUser({
    record: { id: 'user-status', email: 'status@example.com', role: 'graduate', status: 'migrating' },
    inferredId: null,
  }, timestamp, 'firestore')
  assert.match(unknownStatus.error, /status is not supported/i)
})

test('Firebase Auth preflight permits password reset and stable Google continuity', () => {
  const report = preflightFirebaseAuthExport({
    users: [
      {
        localId: 'password-user',
        email: 'password@example.com',
        providerUserInfo: [{ providerId: 'password' }],
      },
      {
        localId: 'google-user',
        email: 'google@example.com',
        providerUserInfo: [{ providerId: 'google.com', rawId: 'google-subject-1' }],
      },
    ],
  })

  assert.equal(report.passed, true)
  assert.equal(report.totalUsers, 2)
  assert.equal(report.importableUsers, 2)
  assert.equal(report.passwordResetEligible, 2)
  assert.equal(report.googleContinuityEligible, 1)
  assert.deepEqual(report.blockedReasonCounts, {})
  assert.deepEqual(report.blockedAccounts, [])
})

test('Firebase Auth preflight fails closed for unsupported or lossy account types', () => {
  const report = preflightFirebaseAuthExport({
    users: [
      {
        localId: 'phone-user',
        email: 'phone@example.com',
        phoneNumber: '+15555550100',
        providerUserInfo: [{ providerId: 'phone', rawId: 'phone-subject' }],
      },
      {
        localId: 'anonymous-user',
        isAnonymous: true,
        providerUserInfo: [{ providerId: 'anonymous', rawId: 'anonymous-subject' }],
      },
      {
        localId: 'mfa-user',
        email: 'mfa@example.com',
        mfaInfo: [{ mfaEnrollmentId: 'enrollment-1', phoneInfo: '+15555550101' }],
        providerUserInfo: [{ providerId: 'password' }],
      },
      {
        localId: 'federated-user',
        email: 'federated@example.com',
        providerUserInfo: [{ providerId: 'facebook.com', rawId: 'facebook-subject' }],
      },
      {
        localId: 'google-without-subject',
        email: 'google-missing@example.com',
        providerUserInfo: [{ providerId: 'google.com' }],
      },
      {
        localId: 'tenant-user',
        email: 'tenant@example.com',
        tenantId: 'tenant-1',
        providerUserInfo: [{ providerId: 'password' }],
      },
    ],
  })

  assert.equal(report.passed, false)
  assert.equal(report.importableUsers, 0)
  assert.equal(report.blockedAccounts.length, 6)
  assert.equal(report.blockedReasonCounts['phone authentication'], 1)
  assert.equal(report.blockedReasonCounts['anonymous account'], 1)
  assert.equal(report.blockedReasonCounts['multi-factor authentication'], 1)
  assert.equal(report.blockedReasonCounts['unsupported provider facebook.com'], 1)
  assert.equal(report.blockedReasonCounts['Google identity is missing a stable subject'], 1)
  assert.equal(report.blockedReasonCounts['Firebase multi-tenant account'], 1)
  assert.ok(report.blockedAccounts.every((account) => account.uid))
  assert.equal(report.blockedAccounts.find((account) => account.uid === 'anonymous-user').reasons.includes('missing a usable email address for password reset'), true)
})

test('ticket and partnership enums preserve meaning or fail closed', () => {
  const timestamp = '2026-07-13T00:00:00.000Z'
  const highPriority = normalizeTicket({
    record: {
      id: 'ticket-high', userId: 'user-1', type: 'support', priority: 'high',
      status: 'in progress', subject: 'Account assistance',
      description: 'Please help resolve this account access issue.',
    },
    inferredId: null,
  }, timestamp, 1)
  assert.equal(highPriority.ticket.priority, 'high')
  assert.equal(highPriority.ticket.status, 'in_progress')

  const badTicket = normalizeTicket({
    record: {
      id: 'ticket-bad', userId: 'user-1', type: 'billing', priority: 'critical',
      status: 'waiting_forever', subject: 'Account assistance',
      description: 'Please help resolve this account access issue.',
    },
    inferredId: null,
  }, timestamp, 1)
  assert.match(badTicket.error, /unsupported ticket/i)

  const ambiguousPartnership = normalizePartnership({
    record: {
      id: 'partnership-ambiguous', schoolId: 'school-1', companyId: 'company-1', status: 'pending',
    },
    inferredId: null,
  }, timestamp)
  assert.match(ambiguousPartnership.error, /initiatedBy is required/i)
})

test('Storage bytea verification keeps at most one bounded object in flight', async () => {
  const bytesById = new Map([
    ['asset-1', Buffer.from('first')],
    ['asset-2', Buffer.from('second')],
    ['asset-3', Buffer.from('third')],
  ])
  const sourceById = new Map([...bytesById].map(([id, bytes]) => [id, {
    sha256: createHash('sha256').update(bytes).digest('hex'),
  }]))
  const databaseById = new Map([...bytesById.keys()].map((id) => [id, { id }]))
  let inFlight = 0
  let maximumInFlight = 0
  const queriedIds = []
  const client = {
    async query(sql, [id]) {
      assert.match(sql, /SELECT content[\s\S]*WHERE id = \$1/)
      queriedIds.push(id)
      inFlight += 1
      maximumInFlight = Math.max(maximumInFlight, inFlight)
      await new Promise((resolve) => setImmediate(resolve))
      inFlight -= 1
      return { rows: [{ content: bytesById.get(id) }] }
    },
  }
  const checks = await hashStoredContentOneAtATime(client, sourceById, databaseById)
  assert.deepEqual(checks.hashMismatches, [])
  assert.deepEqual(checks.publicImageMismatches, [])
  assert.deepEqual(queriedIds, ['asset-1', 'asset-2', 'asset-3'])
  assert.equal(maximumInFlight, 1)
})

test('Storage verifier reports a Firebase blog image when its rewrite row is missing', { skip: !PGlite }, async () => {
  const database = await migratedDatabase()
  try {
    const legacyUrl = 'https://firebasestorage.googleapis.com/v0/b/example.appspot.com/o/blogImages%2Fmissing.png?alt=media'
    const legacyUrlHash = createHash('sha256').update(legacyUrl).digest('hex')
    await database.query(`
      INSERT INTO blog_posts (
        id, slug, title, author, excerpt, content_html, status,
        image_url, legacy_image_url_sha256
      ) VALUES (
        'missing-rewrite-blog', 'missing-rewrite-blog', 'Missing rewrite', 'Yahnu',
        'A complete excerpt', '<p>A complete article body for this fixture.</p>',
        'published', NULL, $1
      )
    `, [legacyUrlHash])
    const sql = await storageVerifierSql('BLOG_IMAGE_MISMATCH_SQL')
    assert.match(sql, /LEFT JOIN media_asset_url_rewrites/)
    const result = await database.query(sql, ['example.appspot.com', []])
    assert.deepEqual(result.rows, [{ id: 'missing-rewrite-blog' }])
  } finally {
    await database.close()
  }
})

test('live notification fields normalize without audience/body drift and reject external links', () => {
  const timestamp = '2026-07-13T00:00:00.000Z'
  const contentManager = normalizeNotification({
    record: {
      id: 'notification-1',
      recipientRole: 'content-manager',
      text: 'Un article a été créé.',
      link: '/dashboard/content/blog?tab=published',
      type: 'blog',
      createdBy: 'admin-1',
      createdAt: timestamp,
    },
    inferredId: null,
  }, timestamp).notification
  assert.equal(contentManager.audienceRole, 'content_manager')
  assert.equal(contentManager.isGlobal, false)
  assert.equal(contentManager.body, 'Un article a été créé.')
  assert.equal(contentManager.title, 'Un article a été créé.')
  assert.equal(contentManager.link, '/dashboard/content/blog?tab=published')

  const recipient = normalizeNotification({
    record: {
      id: 'notification-2',
      userId: 'user-1',
      text: 'Message privé',
      link: 'https://attacker.example/steal',
      createdAt: timestamp,
    },
    inferredId: null,
  }, timestamp)
  assert.match(recipient.error, /same-origin path/i)

  const global = normalizeNotification({
    record: {
      id: 'notification-3',
      audience: 'all',
      text: 'Visible to every signed-in user',
      createdAt: timestamp,
    },
    inferredId: null,
  }, timestamp).notification
  assert.equal(global.recipientRef, null)
  assert.equal(global.audienceRole, null)
  assert.equal(global.isGlobal, true)

  const missingAudience = normalizeNotification({
    record: { id: 'notification-4', text: 'Must be quarantined', createdAt: timestamp },
    inferredId: null,
  }, timestamp)
  assert.match(missingAudience.error, /no explicit audience/i)

  const conflictingAudience = normalizeNotification({
    record: {
      id: 'notification-5', userId: 'user-1', audience: 'all', text: 'Conflict', createdAt: timestamp,
    },
    inferredId: null,
  }, timestamp)
  assert.match(conflictingAudience.error, /conflicting audiences/i)
})

test('blog normalization fails closed instead of truncating runtime-bound fields', () => {
  const timestamp = '2026-07-13T00:00:00.000Z'
  const validRecord = {
    id: 'blog-1',
    slug: 'valid-blog-post',
    title: 'Valid blog post',
    author: 'Yahnu Team',
    excerpt: 'A sufficiently descriptive excerpt.',
    content: `<p>${'Useful article content '.repeat(4)}</p>`,
    status: 'published',
    imageUrl: 'https://firebasestorage.googleapis.com/v0/b/example/o/blogImages%2Fone.png?alt=media',
    createdAt: timestamp,
  }
  const valid = normalizeBlogPost({ record: validRecord, inferredId: null }, timestamp)
  assert.equal(valid.post.slug, validRecord.slug)
  assert.equal(valid.post.title, validRecord.title)

  const oversizedTitle = normalizeBlogPost({
    record: { ...validRecord, id: 'blog-2', title: 'x'.repeat(241) },
    inferredId: null,
  }, timestamp)
  assert.match(oversizedTitle.error, /title.*240/i)

  const oversizedImage = normalizeBlogPost({
    record: { ...validRecord, id: 'blog-3', imageUrl: `https://example.com/${'x'.repeat(2_100)}` },
    inferredId: null,
  }, timestamp)
  assert.match(oversizedImage.error, /image URL exceeds/i)
})

test('legacy application status aliases map only to supported Render statuses', () => {
  const timestamp = '2026-07-13T00:00:00.000Z'
  const pending = normalizeApplication({
    record: { id: 'application-pending', status: 'pending' }, inferredId: null,
  }, timestamp)
  const reviewed = normalizeApplication({
    record: { id: 'application-reviewed', status: 'reviewed' }, inferredId: null,
  }, timestamp)
  const unsupported = normalizeApplication({
    record: { id: 'application-unsupported', status: 'needs-followup' }, inferredId: null,
  }, timestamp)

  assert.equal(pending.application.status, 'submitted')
  assert.equal(reviewed.application.status, 'reviewing')
  assert.match(unsupported.error, /not supported/i)
})

test('duplicate blog slugs are deterministically disambiguated without replacing source slugs', () => {
  const baseSlug = 'shared-migration-slug'
  const laterId = 'blog-later'
  const digest = createHash('sha256').update(laterId).digest('hex')
  const posts = [
    { id: laterId, slug: baseSlug, slugPriorityAt: '2026-07-13T00:00:00.000Z' },
    { id: 'blog-earlier', slug: baseSlug, slugPriorityAt: '2025-07-13T00:00:00.000Z' },
    { id: 'blog-reserved', slug: `${baseSlug}-${digest.slice(0, 8)}`, slugPriorityAt: '2025-01-01T00:00:00.000Z' },
  ]

  const resolved = disambiguateBlogSlugs(posts)
  const reversed = disambiguateBlogSlugs([...posts].reverse())
  const byId = new Map(resolved.posts.map((post) => [post.id, post.slug]))
  const reversedById = new Map(reversed.posts.map((post) => [post.id, post.slug]))

  assert.equal(resolved.slugDisambiguated, 1)
  assert.equal(byId.get('blog-earlier'), baseSlug)
  assert.equal(byId.get(laterId), `${baseSlug}-${digest.slice(0, 12)}`)
  assert.equal(byId.get('blog-reserved'), `${baseSlug}-${digest.slice(0, 8)}`)
  assert.deepEqual([...byId.entries()].sort(), [...reversedById.entries()].sort())
  assert.equal(posts[0].slug, baseSlug)

  const longSlug = 'a'.repeat(120)
  const longResolved = disambiguateBlogSlugs([
    { id: 'long-one', slug: longSlug },
    { id: 'long-two', slug: longSlug },
  ])
  const longFollower = longResolved.posts.find((post) => post.id === 'long-two')
  assert.match(longFollower.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  assert.ok(longFollower.slug.length <= 120)
})

test('deterministic page and dashboard safety repairs do not become blocking warnings', () => {
  const timestamp = '2026-07-13T00:00:00.000Z'
  const page = normalizePage({
    record: {
      id: 'about-us',
      aboutTitle: 'About Yahnu', aboutSubtitle: 'Building stronger professional communities.',
      storyTitle: 'Our story', missionTitle: 'Our mission', visionTitle: 'Our vision', valuesTitle: 'Our values',
      storyContent1: '<p>Our story.</p>', storyContent2: '<p>Our future.</p>',
      missionContent: '<p>Our mission.</p>', visionContent: '<p>Our vision.</p>', valuesContent: '<p>Our values.</p>',
      teamMembers: [{ name: 'Yahnu Team', role: 'Administrator', imageUrl: 'https://example.com/unsafe-remote.png' }],
    },
    inferredId: null,
  }, timestamp, 1)
  const dashboard = normalizeDashboard({
    record: {
      id: 'user-1', userId: 'user-1',
      reports: { graduates: { dataSource: 'graduates', visualization: 'count', title: 'Graduates' } },
      layouts: { lg: [{ i: 'graduates', x: 0, y: null, w: 1, h: 1 }] },
    },
    inferredId: null,
  }, timestamp, 1)

  assert.deepEqual(page.warnings, [])
  assert.match(page.safetyNormalizations[0], /image path/i)
  assert.equal(page.page.data.teamMembers[0].imageUrl, '')
  assert.deepEqual(dashboard.warnings, [])
  assert.match(dashboard.safetyNormalizations[0], /finite rows/i)
  assert.equal(dashboard.dashboard.layouts.lg[0].y, 0)
  assert.equal(hasBlockingImportIssues({
    pages: { safetyNormalizations: 1 },
    dashboards: { safetyNormalizations: 1 },
  }), false)
  assert.equal(hasBlockingImportIssues({ pages: { normalizationWarnings: 1 } }), true)
})

test('mail normalization stores only allowlisted metadata and one-way body hashes', () => {
  const timestamp = '2026-07-13T00:00:00.000Z'
  const secretToken = 'super-secret-reset-token'
  const resetUrl = `https://yahnu.example/reset?token=${secretToken}`
  const normalized = normalizeMail({
    record: {
      id: 'mail-1',
      from: 'no-reply@yahnu.example',
      to: ['user@example.com'],
      createdAt: timestamp,
      delivery: { state: 'SUCCESS', endTime: timestamp },
      authorization: 'Bearer should-never-persist',
      nested: { token: secretToken, code: '123456', apiKey: 'api-key-value' },
      message: {
        subject: 'Reset your password',
        text: `Use this private link: ${resetUrl}`,
        html: `<a href="${resetUrl}">Reset</a>`,
        secret: secretToken,
      },
    },
    inferredId: null,
  }, timestamp).mail

  assert.deepEqual(Object.keys(normalized.payload).sort(), ['format', 'htmlSha256', 'textSha256'])
  assert.equal(normalized.payload.format, 'yahnu-archived-mail-metadata-v1')
  assert.match(normalized.payload.textSha256, /^[0-9a-f]{64}$/)
  assert.match(normalized.payload.htmlSha256, /^[0-9a-f]{64}$/)
  const persistedPayload = JSON.stringify(normalized.payload)
  assert.equal(persistedPayload.includes(secretToken), false)
  assert.equal(persistedPayload.includes(resetUrl), false)
  assert.equal(persistedPayload.includes('authorization'), false)
  assert.equal(persistedPayload.includes('apiKey'), false)
})

test('active announcements synthesize deterministic explicit-audience notifications', () => {
  const timestamp = '2026-07-13T00:00:00.000Z'
  const source = {
    record: {
      id: 'announcement-live',
      title: 'Production cutover',
      content: 'Yahnu is now running on Render.',
      audience: 'all',
      status: 'active',
      createdBy: 'admin-1',
      createdAt: timestamp,
    },
    inferredId: null,
  }
  const announcement = normalizeAnnouncement(source, timestamp).announcement
  assert.equal(announcement.isGlobal, true)
  assert.equal(announcement.audienceRole, null)
  const generated = synthesizedAnnouncementNotification(announcement)
  assert.match(generated.id, /^firebase-announcement-[0-9a-f]{48}$/)
  assert.equal(generated.announcementId, announcement.id)
  assert.equal(generated.isGlobal, true)
  assert.equal(generated.sourceHash, announcement.sourceHash)
  assert.deepEqual(Object.keys(generated.payload).sort(), [
    'announcementId', 'announcementSourceHash', 'migrationKind',
  ])

  const invalid = normalizeAnnouncement({
    record: {
      id: 'announcement-no-audience', title: 'Invisible', content: 'No audience', status: 'active',
    },
    inferredId: null,
  }, timestamp)
  assert.match(invalid.error, /no supported audience/i)

  const oversized = normalizeAnnouncement({
    record: {
      id: 'announcement-oversized', title: 'x'.repeat(181), content: 'Content', audience: 'all', status: 'active',
    },
    inferredId: null,
  }, timestamp)
  assert.match(oversized.error, /title.*180/i)

  const oversizedBody = normalizeAnnouncement({
    record: {
      id: 'announcement-body-oversized', title: 'Title', content: 'x'.repeat(10_001), audience: 'all', status: 'active',
    },
    inferredId: null,
  }, timestamp)
  assert.match(oversizedBody.error, /content.*10000/i)
})

test('knowledge-base normalization enforces runtime bounds and HTML policy', () => {
  const timestamp = '2026-07-13T00:00:00.000Z'
  const validRecord = {
    id: 'kb-valid',
    title: 'Secure account access',
    category: 'Account',
    content: `<p>${'Use a strong and unique password. '.repeat(3)}</p>`,
    status: 'published',
    createdAt: timestamp,
  }
  const valid = normalizeKnowledgeBaseArticle({ record: validRecord, inferredId: null }, timestamp)
  assert.equal(valid.article.title, validRecord.title)
  assert.equal(valid.article.status, 'published')

  const oversizedCategory = normalizeKnowledgeBaseArticle({
    record: { ...validRecord, id: 'kb-category', category: 'x'.repeat(101) },
    inferredId: null,
  }, timestamp)
  assert.match(oversizedCategory.error, /category.*100/i)

  const unsafeMarkup = normalizeKnowledgeBaseArticle({
    record: { ...validRecord, id: 'kb-script', content: `<p>${'Safe text '.repeat(8)}</p><script>alert(1)</script>` },
    inferredId: null,
  }, timestamp)
  assert.match(unsafeMarkup.error, /unsupported HTML/i)

  const unsafeHref = normalizeKnowledgeBaseArticle({
    record: { ...validRecord, id: 'kb-href', content: `<p>${'Safe text '.repeat(8)}<a href="javascript:alert(1)">click</a></p>` },
    inferredId: null,
  }, timestamp)
  assert.match(unsafeHref.error, /unsupported HTML/i)
})

test('collection IDs fail preflight when runtime routes cannot address them', () => {
  const timestamp = '2026-07-13T00:00:00.000Z'
  const badBlog = normalizeBlogPost({
    record: {
      id: 'bad/blog', slug: 'valid-slug', title: 'Valid title', author: 'Yahnu Team',
      excerpt: 'A valid excerpt for the post.', content: `<p>${'Valid content '.repeat(6)}</p>`,
      status: 'published', createdAt: timestamp,
    },
    inferredId: null,
  }, timestamp)
  assert.match(badBlog.error, /blog ID.*ASCII/i)

  const longConversation = normalizeConversation({
    record: { id: 'c'.repeat(241), createdAt: timestamp },
    inferredId: null,
  }, timestamp)
  assert.match(longConversation.error, /240-character/i)

  const longNotification = normalizeNotification({
    record: { id: 'n'.repeat(501), userId: 'user-1', text: 'Message', createdAt: timestamp },
    inferredId: null,
  }, timestamp)
  assert.match(longNotification.error, /500-character/i)

  const longAnnouncement = normalizeAnnouncement({
    record: { id: 'a'.repeat(161), title: 'Title', content: 'Content', audience: 'all', status: 'active' },
    inferredId: null,
  }, timestamp)
  assert.match(longAnnouncement.error, /160-character/i)

  const longKnowledge = normalizeKnowledgeBaseArticle({
    record: {
      id: 'k'.repeat(161), title: 'Title', category: 'General',
      content: `<p>${'Useful content '.repeat(5)}</p>`, status: 'published',
    },
    inferredId: null,
  }, timestamp)
  assert.match(longKnowledge.error, /160-character/i)

  const longTicket = normalizeTicket({
    record: { id: 't'.repeat(201), userId: 'user-1', description: 'Help needed' },
    inferredId: null,
  }, timestamp, 1)
  assert.match(longTicket.error, /200-character/i)

  const longJob = normalizeJob({
    record: { id: 'j'.repeat(201), title: 'A valid role' },
    inferredId: null,
  }, timestamp)
  assert.match(longJob.error, /200-character/i)

  const longApplication = normalizeApplication({
    record: { id: 'p'.repeat(201), status: 'submitted' },
    inferredId: null,
  }, timestamp)
  assert.match(longApplication.error, /200-character/i)

  const longPartnership = normalizePartnership({
    record: { id: 'r'.repeat(201), status: 'pending' },
    inferredId: null,
  }, timestamp)
  assert.match(longPartnership.error, /200-character/i)
})
