import { createHash } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const FORMAT = 'yahnu-firebase-storage-v2'
const PAGE_SIZE = 1_000
const MAX_OBJECTS = 250_000
const MAX_OBJECT_BYTES = 100 * 1024 * 1024
const MAX_TOTAL_BYTES = 10 * 1024 * 1024 * 1024

function printHelp() {
  process.stdout.write(`Export Firebase Storage objects and a cryptographic manifest.

Usage:
  node scripts/export-firebase-storage.mjs --bucket <confirmed-live-bucket> --output-dir C:\\secure\\yahnu-storage

Options:
  --bucket <name>       Operator-confirmed live bucket (or FIREBASE_STORAGE_BUCKET); never inferred
  --prefix <path>       Optional object-name prefix; defaults to every object
  --output-dir <path>   New absolute directory outside this repository (required)
  --help                Show this help

GOOGLE_ACCESS_TOKEN must be a short-lived token with Storage object read access.
The destination must not already exist. Objects are content-checked and the manifest
contains stable IDs, SHA-256 hashes, metadata, and every known Firebase download URL.
`)
}

function parseArguments(argv) {
  const result = { bucket: process.env.FIREBASE_STORAGE_BUCKET, prefix: '', outputDir: undefined, help: false }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--help') {
      result.help = true
      continue
    }
    const option = [
      ['bucket', 'bucket'],
      ['prefix', 'prefix'],
      ['output-dir', 'outputDir'],
    ].find(([flag]) => argument === `--${flag}` || argument.startsWith(`--${flag}=`))
    if (!option) throw new Error(`Unknown option: ${argument}`)
    const [flag, key] = option
    const value = argument === `--${flag}` ? argv[++index] : argument.slice(`--${flag}=`.length)
    if (value === undefined || value.startsWith('--')) throw new Error(`--${flag} requires a value.`)
    result[key] = value
  }
  return result
}

function isInsideDirectory(base, target) {
  const relative = path.relative(base, target)
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
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

function encodedObjectPath(name) {
  return name.split('/').map(encodeURIComponent).join('/')
}

function sourceUrls(bucket, object) {
  const urls = new Set([
    `gs://${bucket}/${object.name}`,
    `https://storage.googleapis.com/${bucket}/${encodedObjectPath(object.name)}`,
    `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(object.name)}?alt=media`,
  ])
  const rawTokens = object.metadata?.firebaseStorageDownloadTokens
  for (const token of String(rawTokens ?? '').split(',').map((value) => value.trim()).filter(Boolean)) {
    urls.add(`https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(object.name)}?alt=media&token=${encodeURIComponent(token)}`)
  }
  return [...urls]
}

async function storageJson(endpoint, token) {
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const providerMessage = typeof body?.error?.message === 'string' ? ` ${body.error.message.slice(0, 300)}` : ''
    throw new Error(`Cloud Storage rejected the export request (${response.status}).${providerMessage}`)
  }
  return response.json()
}

async function listObjects(bucket, prefix, token) {
  const objects = []
  let pageToken
  do {
    const endpoint = new URL(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o`)
    endpoint.searchParams.set('maxResults', String(PAGE_SIZE))
    endpoint.searchParams.set('projection', 'full')
    if (prefix) endpoint.searchParams.set('prefix', prefix)
    if (pageToken) endpoint.searchParams.set('pageToken', pageToken)
    const body = await storageJson(endpoint, token)
    if (Array.isArray(body.items)) objects.push(...body.items)
    if (objects.length > MAX_OBJECTS) throw new Error(`Storage exceeded the ${MAX_OBJECTS.toLocaleString()} object safety limit.`)
    pageToken = typeof body.nextPageToken === 'string' && body.nextPageToken ? body.nextPageToken : undefined
  } while (pageToken)
  return objects.sort((left, right) => String(left.name).localeCompare(String(right.name)))
}

async function downloadObject(bucket, object, token) {
  const declaredSize = Number(object.size)
  if (!Number.isSafeInteger(declaredSize) || declaredSize < 0 || declaredSize > MAX_OBJECT_BYTES) {
    throw new Error(`Object ${object.name} has an invalid or over-limit size (${object.size ?? 'unknown'}).`)
  }
  const endpoint = new URL(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(object.name)}`)
  endpoint.searchParams.set('alt', 'media')
  if (object.generation) endpoint.searchParams.set('generation', String(object.generation))
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(120_000),
  })
  if (!response.ok) throw new Error(`Cloud Storage rejected download of ${object.name} (${response.status}).`)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length !== declaredSize) throw new Error(`Object ${object.name} changed size during export.`)
  return bytes
}

async function main() {
  const args = parseArguments(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }
  const token = process.env.GOOGLE_ACCESS_TOKEN?.trim()
  if (!token || token.length < 20 || /\s/.test(token)) throw new Error('GOOGLE_ACCESS_TOKEN is required and must be a valid single-line OAuth token.')
  const bucket = String(args.bucket ?? '').trim()
  if (!bucket || bucket.length > 222 || /[\s/\r\n]/.test(bucket)) throw new Error('--bucket is required and invalid.')
  if (typeof args.prefix !== 'string' || args.prefix.includes('\0')) throw new Error('--prefix is invalid.')
  if (!args.outputDir || !path.isAbsolute(args.outputDir)) throw new Error('--output-dir must be an absolute path.')
  const outputDir = path.resolve(args.outputDir)
  if (isInsideDirectory(process.cwd(), outputDir)) throw new Error('For data safety, --output-dir must be outside this repository.')

  await mkdir(outputDir, { recursive: false, mode: 0o700 })
  const objectsDir = path.join(outputDir, 'objects')
  await mkdir(objectsDir, { mode: 0o700 })
  await writeFile(path.join(outputDir, '.incomplete'), 'Storage export is incomplete until manifest.json exists.\n', { flag: 'wx', mode: 0o600 })

  const listedObjects = await listObjects(bucket, args.prefix, token)
  const files = []
  let totalBytes = 0
  for (const [index, object] of listedObjects.entries()) {
    if (typeof object.name !== 'string' || !object.name || object.name.includes('\0')) throw new Error(`Storage object ${index + 1} has an invalid name.`)
    const generation = object.generation ? String(object.generation) : ''
    if (!validGeneration(generation)) throw new Error(`Storage object ${object.name} has no valid immutable generation.`)
    const bytes = await downloadObject(bucket, object, token)
    totalBytes += bytes.length
    if (totalBytes > MAX_TOTAL_BYTES) throw new Error(`Storage export exceeded the ${MAX_TOTAL_BYTES.toLocaleString()}-byte safety limit.`)
    const contentSha256 = sha256(bytes)
    const assetId = deterministicStorageAssetId(bucket, object.name, generation)
    const relativeFile = `objects/${assetId}.bin`
    await writeFile(path.join(outputDir, ...relativeFile.split('/')), bytes, { flag: 'wx', mode: 0o600 })
    files.push({
      id: assetId,
      name: object.name,
      file: relativeFile,
      generation,
      metageneration: object.metageneration ? String(object.metageneration) : null,
      contentType: object.contentType || 'application/octet-stream',
      size: bytes.length,
      sha256: contentSha256,
      md5Hash: object.md5Hash ?? null,
      crc32c: object.crc32c ?? null,
      timeCreated: object.timeCreated ?? null,
      updated: object.updated ?? null,
      customMetadata: object.metadata ?? {},
      sourceUrls: sourceUrls(bucket, object),
    })
    process.stderr.write(`Exported Storage object ${index + 1}/${listedObjects.length}\r`)
  }
  if (listedObjects.length) process.stderr.write('\n')

  const manifest = {
    _metadata: {
      format: FORMAT,
      bucket,
      prefix: args.prefix,
      exportedAt: new Date().toISOString(),
      objectCount: files.length,
      totalBytes,
      objectManifestSha256: sha256(stableJson(files)),
    },
    files,
  }
  await writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
  await unlink(path.join(outputDir, '.incomplete'))
  process.stdout.write(`${JSON.stringify({ output: path.join(outputDir, 'manifest.json'), count: files.length, totalBytes }, null, 2)}\n`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`Firebase Storage export failed: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}

export { deterministicStorageAssetId }
