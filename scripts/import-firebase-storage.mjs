import { createHash } from 'node:crypto'
import { readFile, realpath, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import pg from 'pg'

const FORMAT = 'yahnu-firebase-storage-v2'
const MAX_OBJECTS = 250_000
const MAX_OBJECT_BYTES = 100 * 1024 * 1024
const MAX_TOTAL_BYTES = 10 * 1024 * 1024 * 1024
const MAX_PUBLIC_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_LINKED_PRIVATE_BYTES = 10 * 1024 * 1024
const CAPACITY_SAFETY_FRACTION = 0.8
const STORAGE_IMPORT_PEAK_MULTIPLIER = 2

function printHelp() {
  process.stdout.write(`Import a Firebase Storage export into PostgreSQL-backed media assets.

Usage:
  node scripts/import-firebase-storage.mjs --manifest C:\\secure\\yahnu-storage\\manifest.json --dry-run

Options:
  --manifest <path>       Storage manifest created by export-firebase-storage.mjs (required)
  --rewrite-output <path> Optional new JSON file containing URL SHA-256 -> Render path mappings
  --database-capacity-bytes <n>
                          Opt-in preflight: reject if current database size plus twice the
                          manifest payload exceeds 80% of the declared database disk capacity
  --dry-run               Check and write every object, then roll the transaction back
  --allow-partial         Commit valid objects despite rejected/missing objects
  --help                  Show this help

DATABASE_URL is required. Without --allow-partial, one invalid object or URL mapping
rolls the entire import back. SHA-256 and byte length are recomputed before each write.
`)
}

function parseArguments(argv) {
  const result = {
    manifest: undefined,
    rewriteOutput: undefined,
    databaseCapacityBytes: process.env.YAHNU_DATABASE_CAPACITY_BYTES,
    dryRun: false,
    allowPartial: false,
    help: false,
  }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--dry-run') {
      result.dryRun = true
      continue
    }
    if (argument === '--allow-partial') {
      result.allowPartial = true
      continue
    }
    if (argument === '--help') {
      result.help = true
      continue
    }
    const option = [
      ['manifest', 'manifest'],
      ['rewrite-output', 'rewriteOutput'],
      ['database-capacity-bytes', 'databaseCapacityBytes'],
    ].find(([flag]) => argument === `--${flag}` || argument.startsWith(`--${flag}=`))
    if (!option) throw new Error(`Unknown option: ${argument}`)
    const [flag, key] = option
    const value = argument === `--${flag}` ? argv[++index] : argument.slice(`--${flag}=`.length)
    if (!value || value.startsWith('--')) throw new Error(`--${flag} requires a path.`)
    result[key] = value
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

function validGeneration(value) {
  return typeof value === 'string' && /^[1-9][0-9]{0,29}$/.test(value)
}

function deterministicStorageAssetId(bucket, name, generation) {
  if (!validGeneration(generation)) throw new Error(`Storage object ${name} has no valid immutable generation.`)
  return `firebase-${sha256(`${bucket}\0${name}\0${generation}`).slice(0, 48)}`
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function parseDatabaseCapacityBytes(value) {
  if (value === undefined || value === null || value === '') return null
  const text = String(value)
  if (!/^[1-9][0-9]*$/.test(text)) {
    throw new Error('--database-capacity-bytes must be a positive whole number of bytes.')
  }
  const parsed = Number(text)
  if (!Number.isSafeInteger(parsed)) {
    throw new Error('--database-capacity-bytes is outside the supported safe-integer range.')
  }
  return parsed
}

function assertStorageImportCapacity({ currentDatabaseBytes, manifestPayloadBytes, databaseCapacityBytes }) {
  const currentBytes = Number(currentDatabaseBytes)
  const payloadBytes = Number(manifestPayloadBytes)
  const capacityBytes = Number(databaseCapacityBytes)
  if (!Number.isSafeInteger(currentBytes) || currentBytes < 0) {
    throw new Error('PostgreSQL returned an invalid current database size for the Storage capacity preflight.')
  }
  if (!Number.isSafeInteger(payloadBytes) || payloadBytes < 0) {
    throw new Error('The Storage manifest has an invalid payload size for the capacity preflight.')
  }
  if (!Number.isSafeInteger(capacityBytes) || capacityBytes <= 0) {
    throw new Error('The declared database capacity must be a positive safe-integer byte count.')
  }

  const estimatedPeakBytes = currentBytes + (payloadBytes * STORAGE_IMPORT_PEAK_MULTIPLIER)
  if (!Number.isSafeInteger(estimatedPeakBytes)) {
    throw new Error('The estimated Storage import peak is outside the supported safe-integer range.')
  }
  const approvedLimitBytes = Math.floor(capacityBytes * CAPACITY_SAFETY_FRACTION)
  if (estimatedPeakBytes > approvedLimitBytes) {
    throw new Error(
      `Storage import capacity gate failed: current database size (${currentBytes}) plus twice the Storage payload (${payloadBytes}) `
      + `requires ${estimatedPeakBytes} bytes, above 80% of the declared capacity (${approvedLimitBytes} of ${capacityBytes}). `
      + 'Increase the approved database disk capacity or redesign the migration before continuing.',
    )
  }
  return { currentBytes, payloadBytes, capacityBytes, estimatedPeakBytes, approvedLimitBytes }
}

function isInsideDirectory(base, target) {
  const relative = path.relative(base, target)
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function safeDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function safeFileName(value) {
  const name = path.posix.basename(String(value ?? '')).replace(/[\u0000-\u001f]/g, '').trim()
  return name || 'firebase-object'
}

function storagePath(bucket, name, generation) {
  return `firebase/${encodeURIComponent(bucket)}/${encodeURIComponent(generation)}/${name.split('/').map(encodeURIComponent).join('/')}`
}

function replacementPath(id) {
  return `/api/media/${encodeURIComponent(id)}`
}

function checkedContentType(value) {
  const contentType = String(value || 'application/octet-stream').trim()
  if (!contentType || contentType.length > 500 || /[\u0000-\u001f\u007f]/.test(contentType)) {
    throw new Error('invalid content type')
  }
  return contentType
}

function databaseSafeStorageProvenance(entry) {
  const sourceUrlHashes = [...new Set(Array.isArray(entry?.sourceUrls) ? entry.sourceUrls.map((url) => sha256(url)) : [])]
  return {
    sourceUrlHashes,
    metadata: {
      metageneration: entry?.metageneration ?? null,
      md5Hash: entry?.md5Hash ?? null,
      crc32c: entry?.crc32c ?? null,
      customMetadataRedacted: isObject(entry?.customMetadata),
    },
  }
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

function validatedPublicImageContentType(bytes) {
  return bytes.length <= MAX_PUBLIC_IMAGE_BYTES ? detectPublicImageContentType(bytes) : null
}

function isRecoverableDataError(error) {
  return typeof error?.code === 'string' && (error.code.startsWith('22') || error.code.startsWith('23'))
}

async function executeRecoverable(client, savepoint, sql, parameters) {
  if (!/^[a-z_]+$/.test(savepoint)) throw new Error('Unsafe database savepoint name.')
  await client.query(`SAVEPOINT ${savepoint}`)
  try {
    const result = await client.query(sql, parameters)
    await client.query(`RELEASE SAVEPOINT ${savepoint}`)
    return { result }
  } catch (error) {
    await client.query(`ROLLBACK TO SAVEPOINT ${savepoint}`)
    await client.query(`RELEASE SAVEPOINT ${savepoint}`)
    if (!isRecoverableDataError(error)) throw error
    return { error }
  }
}

const UPSERT_MEDIA_SQL = `
  INSERT INTO media_assets (
    id, storage_path, original_filename, content_type, byte_size, sha256, content,
    is_public, source_provider, source_bucket, source_path, source_generation,
    metadata, legacy_url_hashes, source_created_at, source_updated_at
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7,
    $8, 'firebase_storage', $9, $10, $11, $12::jsonb,
    $13::jsonb, $14::timestamptz, $15::timestamptz
  )
  ON CONFLICT (id) DO UPDATE SET
    storage_path = EXCLUDED.storage_path,
    original_filename = EXCLUDED.original_filename,
    content_type = EXCLUDED.content_type,
    byte_size = EXCLUDED.byte_size,
    sha256 = EXCLUDED.sha256,
    content = EXCLUDED.content,
    is_public = EXCLUDED.is_public,
    metadata = EXCLUDED.metadata,
    legacy_url_hashes = EXCLUDED.legacy_url_hashes,
    source_created_at = EXCLUDED.source_created_at,
    source_updated_at = EXCLUDED.source_updated_at
  WHERE media_assets.source_provider = 'firebase_storage'
    AND media_assets.source_bucket = EXCLUDED.source_bucket
    AND media_assets.source_path = EXCLUDED.source_path
    AND media_assets.source_generation = EXCLUDED.source_generation
    AND (media_assets.storage_path IS DISTINCT FROM EXCLUDED.storage_path
      OR media_assets.original_filename IS DISTINCT FROM EXCLUDED.original_filename
      OR media_assets.content_type IS DISTINCT FROM EXCLUDED.content_type
      OR media_assets.byte_size IS DISTINCT FROM EXCLUDED.byte_size
      OR media_assets.sha256 IS DISTINCT FROM EXCLUDED.sha256
      OR media_assets.is_public IS DISTINCT FROM EXCLUDED.is_public
      OR media_assets.metadata IS DISTINCT FROM EXCLUDED.metadata
      OR media_assets.legacy_url_hashes IS DISTINCT FROM EXCLUDED.legacy_url_hashes
      OR media_assets.source_created_at IS DISTINCT FROM EXCLUDED.source_created_at
      OR media_assets.source_updated_at IS DISTINCT FROM EXCLUDED.source_updated_at)
  RETURNING id
`

const UPSERT_REWRITE_SQL = `
  INSERT INTO media_asset_url_rewrites (source_url_sha256, media_asset_id, replacement_path)
  VALUES ($1, $2, $3)
  ON CONFLICT (source_url_sha256) DO UPDATE SET
    media_asset_id = EXCLUDED.media_asset_id,
    replacement_path = EXCLUDED.replacement_path
  WHERE media_asset_url_rewrites.media_asset_id = EXCLUDED.media_asset_id
    OR EXISTS (
      SELECT 1
      FROM media_assets previous_asset
      WHERE previous_asset.id = media_asset_url_rewrites.media_asset_id
        AND previous_asset.source_provider = 'firebase_storage'
        AND previous_asset.source_bucket = $4
        AND previous_asset.source_path = $5
    )
  RETURNING source_url_sha256
`

async function loadManifest(manifestPath) {
  const resolved = path.resolve(manifestPath)
  let parsed
  try {
    parsed = JSON.parse(await readFile(resolved, 'utf8'))
  } catch (error) {
    throw new Error(`Unable to read Storage manifest: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (parsed?._metadata?.format !== FORMAT || !Array.isArray(parsed.files)) {
    throw new Error(`The Storage manifest must use ${FORMAT}.`)
  }
  if (
    !/^[0-9a-f]{64}$/.test(String(parsed._metadata.objectManifestSha256 ?? ''))
    || parsed._metadata.objectManifestSha256 !== sha256(stableJson(parsed.files))
  ) throw new Error('The Storage object manifest failed its SHA-256 integrity check.')
  if (parsed.files.length > MAX_OBJECTS) throw new Error(`The Storage manifest exceeds ${MAX_OBJECTS.toLocaleString()} objects.`)
  const declaredObjectCount = Number(parsed._metadata.objectCount)
  const declaredTotalBytes = Number(parsed._metadata.totalBytes)
  const computedTotalBytes = parsed.files.reduce((total, entry) => total + Number(entry?.size ?? Number.NaN), 0)
  if (!Number.isSafeInteger(declaredObjectCount) || declaredObjectCount !== parsed.files.length) {
    throw new Error('The Storage manifest object count does not match its file list.')
  }
  if (
    !Number.isSafeInteger(declaredTotalBytes)
    || declaredTotalBytes < 0
    || declaredTotalBytes > MAX_TOTAL_BYTES
    || !Number.isSafeInteger(computedTotalBytes)
    || declaredTotalBytes !== computedTotalBytes
  ) {
    throw new Error('The Storage manifest total byte count does not match its file list.')
  }
  const bucket = String(parsed._metadata.bucket ?? '').trim()
  if (!bucket || /[\s/\r\n]/.test(bucket)) throw new Error('The Storage manifest has an invalid bucket.')
  return { resolved, directory: path.dirname(resolved), bucket, parsed }
}

async function checkedBytes(manifestDirectory, entry) {
  if (!isObject(entry) || typeof entry.file !== 'string' || !entry.file) throw new Error('missing file path')
  const candidate = path.resolve(manifestDirectory, entry.file)
  if (!isInsideDirectory(manifestDirectory, candidate)) throw new Error('file path escapes the manifest directory')
  const [manifestRoot, actual] = await Promise.all([realpath(manifestDirectory), realpath(candidate)])
  if (!isInsideDirectory(manifestRoot, actual)) throw new Error('file symlink escapes the manifest directory')
  const declaredSize = Number(entry.size)
  if (!Number.isSafeInteger(declaredSize) || declaredSize < 0 || declaredSize > MAX_OBJECT_BYTES) throw new Error('invalid or over-limit size')
  const bytes = await readFile(actual)
  if (bytes.length !== declaredSize) throw new Error(`byte length mismatch (expected ${declaredSize}, found ${bytes.length})`)
  const actualSha256 = sha256(bytes)
  if (!/^[0-9a-f]{64}$/.test(String(entry.sha256)) || actualSha256 !== entry.sha256) throw new Error('SHA-256 mismatch')
  return bytes
}

async function main() {
  const args = parseArguments(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required.')
  if (!args.manifest) throw new Error('--manifest is required.')
  if (args.rewriteOutput && !path.isAbsolute(args.rewriteOutput)) throw new Error('--rewrite-output must be an absolute path.')
  if (args.rewriteOutput && isInsideDirectory(process.cwd(), path.resolve(args.rewriteOutput))) {
    throw new Error('--rewrite-output must be outside this repository.')
  }
  const databaseCapacityBytes = parseDatabaseCapacityBytes(args.databaseCapacityBytes)

  const manifest = await loadManifest(args.manifest)
  const seenIds = new Set()
  const seenNames = new Set()
  const seenSourceUrlHashes = new Set()
  const prepared = []
  const warnings = []
  let totalBytes = 0
  let invalid = 0
  for (const [index, entry] of manifest.parsed.files.entries()) {
    const id = typeof entry?.id === 'string' && /^firebase-[0-9a-f]{48}$/.test(entry.id) ? entry.id : null
    const name = typeof entry?.name === 'string' && entry.name && !entry.name.includes('\0') ? entry.name : null
    const generation = typeof entry?.generation === 'string' && validGeneration(entry.generation) ? entry.generation : null
    const expectedId = name && generation ? deterministicStorageAssetId(manifest.bucket, name, generation) : null
    const uniqueSourceUrls = Array.isArray(entry?.sourceUrls) ? new Set(entry.sourceUrls) : new Set()
    const safeProvenance = databaseSafeStorageProvenance(entry)
    const sourceUrlHashes = safeProvenance.sourceUrlHashes
    const sourceUrlsAreValid = Array.isArray(entry?.sourceUrls)
      && entry.sourceUrls.length > 0
      && uniqueSourceUrls.size === entry.sourceUrls.length
      && entry.sourceUrls.every((value) => typeof value === 'string' && value.length > 0 && value.length <= 16_384)
      && sourceUrlHashes.every((value) => !seenSourceUrlHashes.has(value))
    let contentType
    try {
      contentType = checkedContentType(entry?.contentType)
    } catch {
      contentType = null
    }
    if (!id || !name || !generation || id !== expectedId || !sourceUrlsAreValid || !contentType || seenIds.has(id) || seenNames.has(name)) {
      invalid += 1
      warnings.push(`Storage entry ${index + 1}: invalid generation-bound ID, content type, source URL list, or duplicate object name`)
      continue
    }
    seenIds.add(id)
    seenNames.add(name)
    for (const sourceUrlHash of sourceUrlHashes) seenSourceUrlHashes.add(sourceUrlHash)
    try {
      const bytes = await checkedBytes(manifest.directory, entry)
      totalBytes += bytes.length
      if (totalBytes > MAX_TOTAL_BYTES) throw new Error(`total import exceeds ${MAX_TOTAL_BYTES.toLocaleString()} bytes`)
      prepared.push({ id, name, generation, contentType, sourceUrlHashes, metadata: safeProvenance.metadata, entry })
    } catch (error) {
      invalid += 1
      warnings.push(`Storage entry ${index + 1} (${name ?? 'unknown'}): ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const client = new pg.Client(databaseConfig(connectionString))
  await client.connect()
  let transactionOpen = false
  let transactionOutcome = 'not_started'
  let inserted = 0
  let updated = 0
  let unchanged = 0
  let databaseRejected = 0
  let rewriteRejected = 0
  let publicAssets = 0
  let privateAssets = 0
  let privateMappings = 0
  let unmappedReferences = 0
  let messageAttachmentsLinked = 0
  let applicationResumesLinked = 0
  let capacityPreflight = null
  const rewrites = {}
  try {
    await client.query('BEGIN')
    transactionOpen = true
    await client.query('SELECT pg_advisory_xact_lock($1)', [78_342_111])
    if (databaseCapacityBytes !== null) {
      const sizeResult = await client.query('SELECT pg_database_size(current_database())::text AS current_database_bytes')
      capacityPreflight = assertStorageImportCapacity({
        currentDatabaseBytes: sizeResult.rows[0]?.current_database_bytes,
        manifestPayloadBytes: manifest.parsed._metadata.totalBytes,
        databaseCapacityBytes,
      })
    }
    const existingResult = await client.query(`
      SELECT id, source_provider, source_bucket, source_path, source_generation
      FROM media_assets
      WHERE id = ANY($1::text[])
    `, [prepared.map((object) => object.id)])
    const existingById = new Map(existingResult.rows.map((row) => [row.id, row]))
    const referencedPublicUrlsResult = await client.query(`
      SELECT legacy_image_url_sha256 AS source_url_sha256
      FROM blog_posts WHERE legacy_image_url_sha256 IS NOT NULL
      UNION
      SELECT legacy_avatar_url_sha256
      FROM users WHERE legacy_avatar_url_sha256 IS NOT NULL
      UNION
      SELECT legacy_avatar_url_sha256
      FROM conversations WHERE legacy_avatar_url_sha256 IS NOT NULL
    `)
    const referencedPublicUrlHashes = new Set(referencedPublicUrlsResult.rows.map((row) => row.source_url_sha256))
    const referencedPrivateUrlsResult = await client.query(`
      SELECT legacy_attachment_url_sha256 AS source_url_sha256
      FROM messages WHERE legacy_attachment_url_sha256 IS NOT NULL
      UNION
      SELECT legacy_resume_url_sha256
      FROM applications WHERE legacy_resume_url_sha256 IS NOT NULL
    `)
    const referencedPrivateUrlHashes = new Set(referencedPrivateUrlsResult.rows.map((row) => row.source_url_sha256))

    for (const object of prepared) {
      const entry = object.entry
      const isPublic = object.sourceUrlHashes.some((sourceUrlHash) => referencedPublicUrlHashes.has(sourceUrlHash))
      const isLinkedPrivate = object.sourceUrlHashes.some((sourceUrlHash) => referencedPrivateUrlHashes.has(sourceUrlHash))
      if (isPublic && isLinkedPrivate) {
        throw new Error(`Storage object ${object.name} is referenced by both public and private fields; resolve the exposure conflict before cutover.`)
      }
      const publicPath = isPublic ? replacementPath(object.id) : null
      const existing = existingById.get(object.id)
      let bytes
      try {
        // Second pass: re-read and re-hash only the current object immediately
        // before its upsert. No bucket-sized byte buffers are retained in memory.
        bytes = await checkedBytes(manifest.directory, entry)
      } catch (error) {
        databaseRejected += 1
        warnings.push(`Storage object ${object.name}: changed after validation (${error instanceof Error ? error.message : String(error)})`)
        continue
      }
      const detectedPublicContentType = isPublic ? validatedPublicImageContentType(bytes) : null
      if (isPublic && !detectedPublicContentType) {
        throw new Error(`Referenced public image ${object.name} violates the 5 MB JPEG/PNG/WebP/GIF serving contract.`)
      }
      if (isLinkedPrivate && bytes.length > MAX_LINKED_PRIVATE_BYTES) {
        throw new Error(`Referenced private file ${object.name} exceeds the 10 MB download contract.`)
      }
      const outcome = await executeRecoverable(client, 'firebase_storage_object_import', UPSERT_MEDIA_SQL, [
        object.id,
        storagePath(manifest.bucket, object.name, object.generation),
        safeFileName(object.name),
        detectedPublicContentType ?? object.contentType,
        bytes.length,
        entry.sha256,
        bytes,
        isPublic,
        manifest.bucket,
        object.name,
        object.generation,
        JSON.stringify(object.metadata),
        JSON.stringify(object.sourceUrlHashes),
        safeDate(entry.timeCreated),
        safeDate(entry.updated),
      ])
      if (outcome.error) {
        databaseRejected += 1
        warnings.push(`Storage object ${object.name}: rejected by database constraints (${outcome.error.code})`)
        continue
      }
      if (!outcome.result.rowCount) {
        const exactSourceIdentity = existing
          && existing.source_provider === 'firebase_storage'
          && existing.source_bucket === manifest.bucket
          && existing.source_path === object.name
          && existing.source_generation === object.generation
        if (!exactSourceIdentity) {
          databaseRejected += 1
          warnings.push(`Storage object ${object.name}: existing media ID has different source provenance`)
          continue
        }
        unchanged += 1
      } else if (existing) updated += 1
      else {
        inserted += 1
        existingById.set(object.id, {
          id: object.id,
          source_provider: 'firebase_storage',
          source_bucket: manifest.bucket,
          source_path: object.name,
          source_generation: object.generation,
        })
      }
      if (isPublic) publicAssets += 1
      else privateAssets += 1

      for (const sourceUrlHash of object.sourceUrlHashes) {
        const rewriteOutcome = await executeRecoverable(
          client,
          'firebase_storage_url_rewrite',
          UPSERT_REWRITE_SQL,
          [sourceUrlHash, object.id, publicPath, manifest.bucket, object.name],
        )
        if (rewriteOutcome.error || !rewriteOutcome.result.rowCount) {
          rewriteRejected += 1
          warnings.push(`Storage object ${object.name}: URL rewrite conflicted for SHA-256 ${sourceUrlHash.slice(0, 12)}`)
        } else if (publicPath) {
          rewrites[sourceUrlHash] = publicPath
        } else {
          privateMappings += 1
        }
      }
    }

    await client.query(`
      UPDATE blog_posts post SET
        image_asset_id = rewrite.media_asset_id,
        image_url = rewrite.replacement_path
      FROM media_asset_url_rewrites rewrite
      JOIN media_assets asset ON asset.id = rewrite.media_asset_id AND asset.is_public = true
      WHERE post.legacy_image_url_sha256 = rewrite.source_url_sha256
        AND rewrite.replacement_path IS NOT NULL
        AND (post.image_asset_id IS DISTINCT FROM rewrite.media_asset_id
          OR post.image_url IS DISTINCT FROM rewrite.replacement_path)
    `)

    await client.query(`
      UPDATE users app_user SET
        avatar_asset_id = rewrite.media_asset_id,
        profile = jsonb_set(app_user.profile, '{avatarUrl}', to_jsonb(rewrite.replacement_path), true)
      FROM media_asset_url_rewrites rewrite
      JOIN media_assets asset ON asset.id = rewrite.media_asset_id AND asset.is_public = true
      WHERE app_user.legacy_avatar_url_sha256 = rewrite.source_url_sha256
        AND rewrite.replacement_path IS NOT NULL
        AND (app_user.avatar_asset_id IS DISTINCT FROM rewrite.media_asset_id
          OR app_user.profile ->> 'avatarUrl' IS DISTINCT FROM rewrite.replacement_path)
    `)

    await client.query(`
      UPDATE conversations conversation SET
        avatar_asset_id = rewrite.media_asset_id,
        avatar_url = rewrite.replacement_path
      FROM media_asset_url_rewrites rewrite
      JOIN media_assets asset ON asset.id = rewrite.media_asset_id AND asset.is_public = true
      WHERE conversation.legacy_avatar_url_sha256 = rewrite.source_url_sha256
        AND rewrite.replacement_path IS NOT NULL
        AND (conversation.avatar_asset_id IS DISTINCT FROM rewrite.media_asset_id
          OR conversation.avatar_url IS DISTINCT FROM rewrite.replacement_path)
    `)

    const messageAttachmentResult = await client.query(`
      UPDATE messages message SET attachment_asset_id = rewrite.media_asset_id
      FROM media_asset_url_rewrites rewrite
      WHERE message.legacy_attachment_url_sha256 = rewrite.source_url_sha256
        AND message.attachment_asset_id IS DISTINCT FROM rewrite.media_asset_id
      RETURNING message.id
    `)
    messageAttachmentsLinked = messageAttachmentResult.rowCount

    const applicationResumeResult = await client.query(`
      UPDATE applications application SET resume_asset_id = rewrite.media_asset_id
      FROM media_asset_url_rewrites rewrite
      WHERE application.legacy_resume_url_sha256 = rewrite.source_url_sha256
        AND application.resume_asset_id IS DISTINCT FROM rewrite.media_asset_id
      RETURNING application.id
    `)
    applicationResumesLinked = applicationResumeResult.rowCount

    const unmappedResult = await client.query(`
      WITH firebase_references AS (
        SELECT 'blog'::text AS kind, id, legacy_image_url_sha256 AS source_url_sha256
        FROM blog_posts WHERE legacy_image_url_sha256 IS NOT NULL
        UNION ALL
        SELECT 'user_avatar', id, legacy_avatar_url_sha256
        FROM users WHERE legacy_avatar_url_sha256 IS NOT NULL
        UNION ALL
        SELECT 'conversation_avatar', id, legacy_avatar_url_sha256
        FROM conversations WHERE legacy_avatar_url_sha256 IS NOT NULL
        UNION ALL
        SELECT 'message', id, legacy_attachment_url_sha256
        FROM messages WHERE legacy_attachment_url_sha256 IS NOT NULL
        UNION ALL
        SELECT 'application', id, legacy_resume_url_sha256
        FROM applications WHERE legacy_resume_url_sha256 IS NOT NULL
      )
      SELECT reference.kind, reference.id
      FROM firebase_references reference
      WHERE NOT EXISTS (
        SELECT 1 FROM media_asset_url_rewrites rewrite
        JOIN media_assets asset ON asset.id = rewrite.media_asset_id
        WHERE rewrite.source_url_sha256 = reference.source_url_sha256
          AND CASE WHEN reference.kind IN ('blog', 'user_avatar', 'conversation_avatar')
            THEN rewrite.replacement_path IS NOT NULL AND asset.is_public = true
            ELSE true
          END
      )
      ORDER BY reference.kind, reference.id
    `)
    unmappedReferences = unmappedResult.rowCount
    for (const reference of unmappedResult.rows.slice(0, 30)) {
      warnings.push(`${reference.kind} ${reference.id}: Firebase media reference was not safely mapped`)
    }

    const partial = invalid > 0 || databaseRejected > 0 || rewriteRejected > 0 || unmappedReferences > 0
    if (args.dryRun) {
      await client.query('ROLLBACK')
      transactionOutcome = 'dry_run_rolled_back'
    } else if (partial && !args.allowPartial) {
      await client.query('ROLLBACK')
      transactionOutcome = 'rolled_back_partial'
    } else {
      await client.query('COMMIT')
      transactionOutcome = partial ? 'committed_partial' : 'committed'
    }
    transactionOpen = false

    if (args.rewriteOutput && transactionOutcome.startsWith('committed')) {
      try {
        await writeFile(path.resolve(args.rewriteOutput), `${JSON.stringify({
          _metadata: { format: 'yahnu-media-url-hash-rewrites-v2', generatedAt: new Date().toISOString(), bucket: manifest.bucket },
          urlHashRewrites: rewrites,
        }, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
      } catch (error) {
        if (error?.code === 'EEXIST') throw new Error('The rewrite output already exists; choose a new path.')
        throw error
      }
    }

    const output = {
      manifest: manifest.resolved,
      bucket: manifest.bucket,
      dryRun: args.dryRun,
      allowPartial: args.allowPartial,
      capacityPreflight: capacityPreflight ?? { enforced: false },
      transaction: transactionOutcome,
      counts: {
        source: manifest.parsed.files.length,
        valid: prepared.length,
        inserted,
        updated,
        unchanged,
        invalid,
        databaseRejected,
        rewriteRejected,
        rewrites: Object.keys(rewrites).length,
        privateMappings,
        publicAssets,
        privateAssets,
        messageAttachmentsLinked,
        applicationResumesLinked,
        unmappedReferences,
        totalBytes,
      },
      warnings: warnings.slice(0, 50),
    }
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
    if ((invalid || databaseRejected || rewriteRejected || unmappedReferences) && !args.allowPartial) process.exitCode = 2
  } catch (error) {
    if (transactionOpen) await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    await client.end()
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`Firebase Storage import failed: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}

export {
  assertStorageImportCapacity,
  databaseSafeStorageProvenance,
  deterministicStorageAssetId,
  parseDatabaseCapacityBytes,
  validatedPublicImageContentType,
}
