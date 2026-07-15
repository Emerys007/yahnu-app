import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import pg from 'pg'

const FORMAT = 'yahnu-firebase-storage-v2'
const MAX_OBJECTS = 250_000
const MAX_OBJECT_BYTES = 100 * 1024 * 1024
const MAX_TOTAL_BYTES = 10 * 1024 * 1024 * 1024
const MAX_PUBLIC_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_LINKED_PRIVATE_BYTES = 10 * 1024 * 1024

function printHelp() {
  process.stdout.write(`Reconcile Firebase Storage objects against PostgreSQL media assets.

Usage:
  node scripts/verify-firebase-storage.mjs --manifest C:\\secure\\yahnu-storage\\manifest.json

Options:
  --manifest <path>  Storage manifest created by export-firebase-storage.mjs (required)
  --help             Show this help

DATABASE_URL is required. Verification checks generation-bound object IDs, exact
object and URL sets, stored bytea hashes, public/private exposure, and linked blog,
message attachment, and application resume references. It exits 2 on mismatch.
`)
}

function parseArguments(argv) {
  const result = { manifest: undefined, help: false }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--help') {
      result.help = true
      continue
    }
    if (argument === '--manifest' || argument.startsWith('--manifest=')) {
      const value = argument === '--manifest' ? argv[++index] : argument.slice('--manifest='.length)
      if (!value || value.startsWith('--')) throw new Error('--manifest requires a path.')
      result.manifest = value
      continue
    }
    throw new Error(`Unknown option: ${argument}`)
  }
  return result
}

function databaseConfig(connectionString) {
  const config = { connectionString }
  const sslMode = process.env.PGSSLMODE?.toLowerCase()
  if (sslMode === 'disable') config.ssl = false
  else if (sslMode === 'require') config.ssl = { rejectUnauthorized: false }
  else if (sslMode === 'verify-ca' || sslMode === 'verify-full') config.ssl = { rejectUnauthorized: true }
  return config
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function validGeneration(value) {
  return typeof value === 'string' && /^[1-9][0-9]{0,29}$/.test(value)
}

function deterministicStorageAssetId(bucket, name, generation) {
  if (!validGeneration(generation)) throw new Error(`Storage object ${name} has no valid immutable generation.`)
  return `firebase-${sha256(`${bucket}\0${name}\0${generation}`).slice(0, 48)}`
}

function storagePath(bucket, name, generation) {
  return `firebase/${encodeURIComponent(bucket)}/${encodeURIComponent(generation)}/${name.split('/').map(encodeURIComponent).join('/')}`
}

function replacementPath(id) {
  return `/api/media/${encodeURIComponent(id)}`
}

function isFirebaseStorageReference(value) {
  return typeof value === 'string' && (
    value.startsWith('gs://')
    || value.startsWith('https://firebasestorage.googleapis.com/')
    || value.startsWith('https://storage.googleapis.com/')
  )
}

function sample(values, limit = 30) {
  return values.slice(0, limit)
}

function equalStringSets(left, right) {
  return left.size === right.size && [...left].every((value) => right.has(value))
}

function startsWithBytes(bytes, signature, offset = 0) {
  return signature.every((byte, index) => bytes[offset + index] === byte)
}

function detectPublicImageContentType(bytes) {
  if (bytes.length >= 3 && startsWithBytes(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (bytes.length >= 8 && startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (
    bytes.length >= 12
    && startsWithBytes(bytes, [0x52, 0x49, 0x46, 0x46])
    && startsWithBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) return 'image/webp'
  if (
    bytes.length >= 6
    && (startsWithBytes(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61])
      || startsWithBytes(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))
  ) return 'image/gif'
  return null
}

async function hashStoredContentOneAtATime(client, sourceById, databaseById, expectedPublicById = new Map()) {
  const hashMismatches = []
  const publicImageMismatches = []
  const publicContentTypes = new Map()
  for (const [id, entry] of sourceById) {
    if (!databaseById.has(id)) continue
    // Deliberately fetch a single bounded object per round trip. A Firebase
    // object is capped at MAX_OBJECT_BYTES, so verification never materializes
    // the bucket's aggregate bytea payload in the Node.js process.
    const result = await client.query(`
      SELECT content
      FROM media_assets
      WHERE id = $1
    `, [id])
    if (result.rows.length !== 1) {
      hashMismatches.push(id)
      continue
    }
    const bytes = result.rows[0].content
    if (sha256(bytes) !== entry.sha256) hashMismatches.push(id)
    if (expectedPublicById.get(id)) {
      const detected = detectPublicImageContentType(bytes)
      if (detected) publicContentTypes.set(id, detected)
      if (bytes.length > MAX_PUBLIC_IMAGE_BYTES || !detected) publicImageMismatches.push(id)
    }
  }
  return { hashMismatches, publicImageMismatches, publicContentTypes }
}

function validateManifest(manifest) {
  if (manifest?._metadata?.format !== FORMAT || !Array.isArray(manifest.files)) {
    throw new Error(`The Storage manifest must use ${FORMAT}.`)
  }
  if (
    !/^[0-9a-f]{64}$/.test(String(manifest._metadata.objectManifestSha256 ?? ''))
    || manifest._metadata.objectManifestSha256 !== sha256(stableJson(manifest.files))
  ) throw new Error('The Storage object manifest failed its SHA-256 integrity check.')
  if (manifest.files.length > MAX_OBJECTS) throw new Error(`The Storage manifest exceeds ${MAX_OBJECTS.toLocaleString()} objects.`)

  const bucket = String(manifest._metadata.bucket ?? '').trim()
  if (!bucket || /[\s/\r\n]/.test(bucket)) throw new Error('The Storage manifest has an invalid bucket.')
  const declaredCount = Number(manifest._metadata.objectCount)
  const declaredBytes = Number(manifest._metadata.totalBytes)
  if (!Number.isSafeInteger(declaredCount) || declaredCount !== manifest.files.length) {
    throw new Error('The Storage manifest object count does not match its file list.')
  }

  const sourceById = new Map()
  const seenNames = new Set()
  const seenUrls = new Set()
  let computedBytes = 0
  for (const [index, entry] of manifest.files.entries()) {
    const name = typeof entry?.name === 'string' && entry.name && !entry.name.includes('\0') ? entry.name : null
    const generation = typeof entry?.generation === 'string' && validGeneration(entry.generation) ? entry.generation : null
    const expectedId = name && generation ? deterministicStorageAssetId(bucket, name, generation) : null
    const size = Number(entry?.size)
    const urls = Array.isArray(entry?.sourceUrls) ? entry.sourceUrls : []
    const urlSet = new Set(urls)
    const validUrls = urls.length > 0
      && urlSet.size === urls.length
      && urls.every((url) => typeof url === 'string' && url.length > 0 && url.length <= 16_384 && !seenUrls.has(url))
    if (
      !name
      || !generation
      || entry?.id !== expectedId
      || sourceById.has(entry.id)
      || seenNames.has(name)
      || !Number.isSafeInteger(size)
      || size < 0
      || size > MAX_OBJECT_BYTES
      || !/^[0-9a-f]{64}$/.test(String(entry?.sha256 ?? ''))
      || !validUrls
    ) throw new Error(`Storage manifest entry ${index + 1} has invalid generation-bound identity, bytes, hash, URLs, or duplicates.`)
    computedBytes += size
    if (!Number.isSafeInteger(computedBytes) || computedBytes > MAX_TOTAL_BYTES) {
      throw new Error(`The Storage manifest exceeds ${MAX_TOTAL_BYTES.toLocaleString()} total bytes.`)
    }
    sourceById.set(entry.id, entry)
    seenNames.add(name)
    for (const url of urls) seenUrls.add(url)
  }
  if (!Number.isSafeInteger(declaredBytes) || declaredBytes !== computedBytes) {
    throw new Error('The Storage manifest total byte count does not match its file list.')
  }
  return { bucket, computedBytes, sourceById }
}

const BLOG_IMAGE_MISMATCH_SQL = `
  SELECT post.id
  FROM blog_posts post
  LEFT JOIN media_asset_url_rewrites rewrite ON rewrite.source_url_sha256 = post.legacy_image_url_sha256
  LEFT JOIN media_assets asset ON asset.id = rewrite.media_asset_id
  WHERE post.legacy_image_url_sha256 IS NOT NULL
    AND (
      rewrite.source_url_sha256 IS NULL
      OR asset.id IS NULL
      OR asset.source_provider IS DISTINCT FROM 'firebase_storage'
      OR asset.source_bucket IS DISTINCT FROM $1
      OR NOT (asset.id = ANY($2::text[]))
      OR asset.is_public IS DISTINCT FROM true
      OR rewrite.replacement_path IS DISTINCT FROM ('/api/media/' || asset.id)
      OR post.image_asset_id IS DISTINCT FROM rewrite.media_asset_id
      OR post.image_url IS DISTINCT FROM rewrite.replacement_path
    )
  ORDER BY post.id
`

const USER_AVATAR_MISMATCH_SQL = `
  SELECT app_user.id
  FROM users app_user
  LEFT JOIN media_asset_url_rewrites rewrite ON rewrite.source_url_sha256 = app_user.legacy_avatar_url_sha256
  LEFT JOIN media_assets asset ON asset.id = rewrite.media_asset_id
  WHERE app_user.legacy_avatar_url_sha256 IS NOT NULL
    AND (
      rewrite.source_url_sha256 IS NULL
      OR asset.id IS NULL
      OR asset.source_provider IS DISTINCT FROM 'firebase_storage'
      OR asset.source_bucket IS DISTINCT FROM $1
      OR NOT (asset.id = ANY($2::text[]))
      OR asset.is_public IS DISTINCT FROM true
      OR rewrite.replacement_path IS DISTINCT FROM ('/api/media/' || asset.id)
      OR app_user.avatar_asset_id IS DISTINCT FROM rewrite.media_asset_id
      OR app_user.profile ->> 'avatarUrl' IS DISTINCT FROM rewrite.replacement_path
    )
  ORDER BY app_user.id
`

const CONVERSATION_AVATAR_MISMATCH_SQL = `
  SELECT conversation.id
  FROM conversations conversation
  LEFT JOIN media_asset_url_rewrites rewrite ON rewrite.source_url_sha256 = conversation.legacy_avatar_url_sha256
  LEFT JOIN media_assets asset ON asset.id = rewrite.media_asset_id
  WHERE conversation.legacy_avatar_url_sha256 IS NOT NULL
    AND (
      rewrite.source_url_sha256 IS NULL
      OR asset.id IS NULL
      OR asset.source_provider IS DISTINCT FROM 'firebase_storage'
      OR asset.source_bucket IS DISTINCT FROM $1
      OR NOT (asset.id = ANY($2::text[]))
      OR asset.is_public IS DISTINCT FROM true
      OR rewrite.replacement_path IS DISTINCT FROM ('/api/media/' || asset.id)
      OR conversation.avatar_asset_id IS DISTINCT FROM rewrite.media_asset_id
      OR conversation.avatar_url IS DISTINCT FROM rewrite.replacement_path
    )
  ORDER BY conversation.id
`

const MESSAGE_ATTACHMENT_MISMATCH_SQL = `
  SELECT message.id
  FROM messages message
  LEFT JOIN media_asset_url_rewrites rewrite ON rewrite.source_url_sha256 = message.legacy_attachment_url_sha256
  LEFT JOIN media_assets asset ON asset.id = rewrite.media_asset_id
  WHERE message.legacy_attachment_url_sha256 IS NOT NULL
    AND (
      rewrite.source_url_sha256 IS NULL
      OR asset.id IS NULL
      OR asset.source_provider IS DISTINCT FROM 'firebase_storage'
      OR asset.source_bucket IS DISTINCT FROM $1
      OR NOT (asset.id = ANY($2::text[]))
      OR asset.is_public IS DISTINCT FROM false
      OR asset.byte_size > 10485760
      OR rewrite.replacement_path IS NOT NULL
      OR message.attachment_asset_id IS DISTINCT FROM rewrite.media_asset_id
    )
  ORDER BY message.id
`

const APPLICATION_RESUME_MISMATCH_SQL = `
  SELECT application.id
  FROM applications application
  LEFT JOIN media_asset_url_rewrites rewrite ON rewrite.source_url_sha256 = application.legacy_resume_url_sha256
  LEFT JOIN media_assets asset ON asset.id = rewrite.media_asset_id
  WHERE application.legacy_resume_url_sha256 IS NOT NULL
    AND (
      rewrite.source_url_sha256 IS NULL
      OR asset.id IS NULL
      OR asset.source_provider IS DISTINCT FROM 'firebase_storage'
      OR asset.source_bucket IS DISTINCT FROM $1
      OR NOT (asset.id = ANY($2::text[]))
      OR asset.is_public IS DISTINCT FROM false
      OR asset.byte_size > 10485760
      OR rewrite.replacement_path IS NOT NULL
      OR application.resume_asset_id IS DISTINCT FROM rewrite.media_asset_id
    )
  ORDER BY application.id
`

async function main() {
  const args = parseArguments(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }
  if (!args.manifest) throw new Error('--manifest is required.')
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required.')
  const manifestPath = path.resolve(args.manifest)
  let manifest
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  } catch (error) {
    throw new Error(`Unable to read Storage manifest: ${error instanceof Error ? error.message : String(error)}`)
  }
  const { bucket, computedBytes, sourceById } = validateManifest(manifest)
  const expectedIds = [...sourceById.keys()]

  const client = new pg.Client(databaseConfig(connectionString))
  await client.connect()
  let transactionOpen = false
  try {
    await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
    transactionOpen = true
    const publicUrlsResult = await client.query(`
      SELECT legacy_image_url_sha256 AS source_url_sha256
      FROM blog_posts WHERE legacy_image_url_sha256 IS NOT NULL
      UNION
      SELECT legacy_avatar_url_sha256
      FROM users WHERE legacy_avatar_url_sha256 IS NOT NULL
      UNION
      SELECT legacy_avatar_url_sha256
      FROM conversations WHERE legacy_avatar_url_sha256 IS NOT NULL
    `)
    const referencedPublicUrlHashes = new Set(publicUrlsResult.rows.map((row) => row.source_url_sha256))
    const privateUrlsResult = await client.query(`
      SELECT legacy_attachment_url_sha256 AS source_url_sha256
      FROM messages WHERE legacy_attachment_url_sha256 IS NOT NULL
      UNION
      SELECT legacy_resume_url_sha256
      FROM applications WHERE legacy_resume_url_sha256 IS NOT NULL
    `)
    const referencedPrivateUrlHashes = new Set(privateUrlsResult.rows.map((row) => row.source_url_sha256))
    const expectedPublicById = new Map([...sourceById].map(([id, entry]) => [
      id,
      entry.sourceUrls.some((url) => referencedPublicUrlHashes.has(sha256(url))),
    ]))
    const expectedLinkedPrivateById = new Map([...sourceById].map(([id, entry]) => [
      id,
      entry.sourceUrls.some((url) => referencedPrivateUrlHashes.has(sha256(url))),
    ]))
    const exposureConflictMismatches = [...sourceById.keys()].filter((id) => (
      expectedPublicById.get(id) && expectedLinkedPrivateById.get(id)
    ))
    const linkedPrivateSizeMismatches = [...sourceById].filter(([id, entry]) => (
      expectedLinkedPrivateById.get(id) && Number(entry.size) > MAX_LINKED_PRIVATE_BYTES
    )).map(([id]) => id)

    const result = await client.query(`
      SELECT id, storage_path, source_path, source_generation, content_type,
        byte_size, sha256, is_public, legacy_url_hashes
      FROM media_assets
      WHERE source_provider = 'firebase_storage' AND source_bucket = $1
      ORDER BY id
    `, [bucket])
    const databaseById = new Map(result.rows.map((row) => [row.id, row]))
    const missingIds = expectedIds.filter((id) => !databaseById.has(id))
    const extraIds = [...databaseById.keys()].filter((id) => !sourceById.has(id))
    const pathMismatches = []
    const storagePathMismatches = []
    const generationMismatches = []
    const sizeMismatches = []
    const hashMismatches = []
    const legacyUrlHashMismatches = []
    const visibilityMismatches = []
    const publicContentTypeMismatches = []

    for (const [id, entry] of sourceById) {
      const stored = databaseById.get(id)
      if (!stored) continue
      if (stored.source_path !== entry.name) pathMismatches.push(id)
      if (stored.storage_path !== storagePath(bucket, entry.name, entry.generation)) storagePathMismatches.push(id)
      if (stored.source_generation !== entry.generation) generationMismatches.push(id)
      if (Number(stored.byte_size) !== Number(entry.size)) sizeMismatches.push(id)
      if (stored.sha256 !== entry.sha256) hashMismatches.push(id)
      if (stored.is_public !== expectedPublicById.get(id)) visibilityMismatches.push(id)

      const expectedUrlHashes = new Set(entry.sourceUrls.map((url) => sha256(url)))
      let storedUrlHashes = stored.legacy_url_hashes
      if (typeof storedUrlHashes === 'string') {
        try { storedUrlHashes = JSON.parse(storedUrlHashes) } catch { storedUrlHashes = [] }
      }
      const storedUrlHashSet = new Set(Array.isArray(storedUrlHashes) ? storedUrlHashes : [])
      if (!equalStringSets(expectedUrlHashes, storedUrlHashSet)) legacyUrlHashMismatches.push(id)
    }
    const contentChecks = await hashStoredContentOneAtATime(client, sourceById, databaseById, expectedPublicById)
    for (const [id, isPublic] of expectedPublicById) {
      if (!isPublic) continue
      const stored = databaseById.get(id)
      if (!stored) continue
      const detected = contentChecks.publicContentTypes.get(id)
      if (!detected || stored.content_type !== detected) publicContentTypeMismatches.push(id)
    }

    const rewriteRows = await client.query(`
      SELECT source_url_sha256, media_asset_id, replacement_path
      FROM media_asset_url_rewrites
      WHERE media_asset_id = ANY($1::text[])
    `, [expectedIds])
    const rewriteByUrlHash = new Map(rewriteRows.rows.map((row) => [row.source_url_sha256, row]))
    const expectedRewriteUrlHashes = new Set(manifest.files.flatMap((entry) => entry.sourceUrls.map((url) => sha256(url))))
    const rewriteMismatches = []
    for (const [id, entry] of sourceById) {
      const expectedReplacement = expectedPublicById.get(id) ? replacementPath(id) : null
      for (const sourceUrl of entry.sourceUrls) {
        const sourceUrlHash = sha256(sourceUrl)
        const rewrite = rewriteByUrlHash.get(sourceUrlHash)
        if (!rewrite || rewrite.media_asset_id !== id || rewrite.replacement_path !== expectedReplacement) {
          rewriteMismatches.push(`${id}:${sha256(sourceUrl).slice(0, 12)}`)
        }
      }
    }
    for (const row of rewriteRows.rows) {
      if (!expectedRewriteUrlHashes.has(row.source_url_sha256)) rewriteMismatches.push(`${row.media_asset_id}:unexpected-url-hash`)
      const expectedPublic = expectedPublicById.get(row.media_asset_id)
      if (expectedPublic === false && row.replacement_path !== null) {
        rewriteMismatches.push(`${row.media_asset_id}:private-exposure`)
      }
    }

    const referenceParameters = [bucket, expectedIds]
    const [blogMismatchesResult, userAvatarMismatchesResult, conversationAvatarMismatchesResult, messageMismatchesResult, applicationMismatchesResult] = await Promise.all([
      client.query(BLOG_IMAGE_MISMATCH_SQL, referenceParameters),
      client.query(USER_AVATAR_MISMATCH_SQL, referenceParameters),
      client.query(CONVERSATION_AVATAR_MISMATCH_SQL, referenceParameters),
      client.query(MESSAGE_ATTACHMENT_MISMATCH_SQL, referenceParameters),
      client.query(APPLICATION_RESUME_MISMATCH_SQL, referenceParameters),
    ])
    const rawSecretLeakResult = await client.query(`
      SELECT 'media_metadata'::text AS kind, id
      FROM media_assets
      WHERE source_provider = 'firebase_storage'
        AND metadata::text ~* 'firebaseStorageDownloadTokens|[?&]token='
      UNION ALL
      SELECT 'blog_legacy_url', id FROM blog_posts WHERE legacy_image_url IS NOT NULL
      UNION ALL
      SELECT 'message_legacy_url', id FROM messages WHERE legacy_attachment_url IS NOT NULL
      UNION ALL
      SELECT 'application_legacy_url', id FROM applications WHERE legacy_resume_url IS NOT NULL
    `)
    const staleFirebaseAssetLinksResult = await client.query(`
      SELECT 'blog'::text AS kind, post.id
      FROM blog_posts post
      JOIN media_assets asset ON asset.id = post.image_asset_id AND asset.source_provider = 'firebase_storage'
      WHERE post.legacy_image_url_sha256 IS NULL
      UNION ALL
      SELECT 'user_avatar', app_user.id
      FROM users app_user
      JOIN media_assets asset ON asset.id = app_user.avatar_asset_id AND asset.source_provider = 'firebase_storage'
      WHERE app_user.legacy_avatar_url_sha256 IS NULL
      UNION ALL
      SELECT 'conversation_avatar', conversation.id
      FROM conversations conversation
      JOIN media_assets asset ON asset.id = conversation.avatar_asset_id AND asset.source_provider = 'firebase_storage'
      WHERE conversation.legacy_avatar_url_sha256 IS NULL
      UNION ALL
      SELECT 'message_attachment', message.id
      FROM messages message
      JOIN media_assets asset ON asset.id = message.attachment_asset_id AND asset.source_provider = 'firebase_storage'
      WHERE message.legacy_attachment_url_sha256 IS NULL
      UNION ALL
      SELECT 'application_resume', application.id
      FROM applications application
      JOIN media_assets asset ON asset.id = application.resume_asset_id AND asset.source_provider = 'firebase_storage'
      WHERE application.legacy_resume_url_sha256 IS NULL
      ORDER BY kind, id
    `)

    const failures = {
      missingIds: sample(missingIds),
      extraIds: sample(extraIds),
      pathMismatches: sample(pathMismatches),
      storagePathMismatches: sample(storagePathMismatches),
      generationMismatches: sample(generationMismatches),
      sizeMismatches: sample(sizeMismatches),
      hashMismatches: sample(hashMismatches),
      contentHashMismatches: sample(contentChecks.hashMismatches),
      publicImageMismatches: sample(contentChecks.publicImageMismatches),
      publicContentTypeMismatches: sample(publicContentTypeMismatches),
      legacyUrlHashMismatches: sample(legacyUrlHashMismatches),
      visibilityMismatches: sample(visibilityMismatches),
      exposureConflictMismatches: sample(exposureConflictMismatches),
      linkedPrivateSizeMismatches: sample(linkedPrivateSizeMismatches),
      rewriteMismatches: sample([...new Set(rewriteMismatches)]),
      blogImageMismatches: sample(blogMismatchesResult.rows.map((row) => row.id)),
      userAvatarMismatches: sample(userAvatarMismatchesResult.rows.map((row) => row.id)),
      conversationAvatarMismatches: sample(conversationAvatarMismatchesResult.rows.map((row) => row.id)),
      messageAttachmentMismatches: sample(messageMismatchesResult.rows.map((row) => row.id)),
      applicationResumeMismatches: sample(applicationMismatchesResult.rows.map((row) => row.id)),
      rawStorageSecretLeaks: sample(rawSecretLeakResult.rows),
      staleFirebaseAssetLinks: sample(staleFirebaseAssetLinksResult.rows),
    }
    const passed = Object.values(failures).every((value) => value.length === 0)
    const expectedPublicAssets = [...expectedPublicById.values()].filter(Boolean).length
    process.stdout.write(`${JSON.stringify({
      passed,
      manifest: manifestPath,
      bucket,
      counts: {
        expectedObjects: sourceById.size,
        databaseObjects: databaseById.size,
        expectedBytes: computedBytes,
        databaseBytes: result.rows.reduce((total, row) => total + Number(row.byte_size || 0), 0),
        expectedPublicAssets,
        expectedPrivateAssets: sourceById.size - expectedPublicAssets,
      },
      failures,
    }, null, 2)}\n`)
    await client.query('COMMIT')
    transactionOpen = false
    if (!passed) process.exitCode = 2
  } catch (error) {
    if (transactionOpen) await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    await client.end()
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`Firebase Storage reconciliation failed: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}

export { deterministicStorageAssetId, hashStoredContentOneAtATime }
