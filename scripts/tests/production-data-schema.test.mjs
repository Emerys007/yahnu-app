import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  normalizeAnnouncement,
  normalizeApplication,
  normalizeBlogPost,
  normalizeConversation,
  normalizeInvite,
  normalizeJob,
  normalizeKnowledgeBaseArticle,
  normalizeMail,
  normalizeNotification,
  normalizePartnership,
  normalizeTicket,
  normalizeUser,
  preflightFirebaseAuthExport,
  synthesizedAnnouncementNotification,
} from '../import-firebase-json.mjs'
import { deterministicStorageAssetId as exportedStorageAssetId } from '../export-firebase-storage.mjs'
import {
  assertStorageImportCapacity,
  databaseSafeStorageProvenance,
  deterministicStorageAssetId as importedStorageAssetId,
  validatedPublicImageContentType,
} from '../import-firebase-storage.mjs'
import { runtimeTokenHash } from '../verify-firebase-import.mjs'
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
]
const sourceHash = 'a'.repeat(64)

async function migratedDatabase() {
  const database = new PGlite()
  for (const migration of migrations) {
    await database.exec(await readFile(path.join(projectRoot, 'db', 'migrations', migration), 'utf8'))
  }
  return database
}

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
  } finally {
    await database.close()
  }
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
        (SELECT count(*)::integer FROM invalidated_legacy_email_codes WHERE source_hash = '${sourceHash}') AS invalidated_codes
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
