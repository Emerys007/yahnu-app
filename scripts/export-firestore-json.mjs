import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const COLLECTIONS = [
  'users',
  'invites',
  'tickets',
  'pages',
  'dashboards',
  'blogPosts',
  'conversations',
  'notifications',
  'emailVerificationCodes',
  'jobs',
  'applications',
  'partnerships',
  'mail',
  'announcements',
  'knowledgeBaseArticles',
]
const ACCOUNTED_COLLECTIONS = new Set(COLLECTIONS)
const PAGE_SIZE = 300
const MAX_DOCUMENTS_PER_COLLECTION = 250_000
const SUBCOLLECTION_SCAN_CONCURRENCY = 12
const MAX_FETCH_ATTEMPTS = 4
const RETRY_BASE_DELAY_MS = 500
const RETRY_MAX_DELAY_MS = 2_000
const RETRYABLE_HTTP_STATUSES = new Set([408, 429, 500, 502, 503, 504])
const RETRYABLE_NETWORK_CODES = new Set([
  'EAI_AGAIN',
  'ECONNRESET',
  'ECONNREFUSED',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'ETIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
  'UND_ERR_SOCKET',
])

function printHelp() {
  process.stdout.write(`Export every accounted Yahnu Firestore root collection as importer-compatible JSON.

Usage:
  node scripts/export-firestore-json.mjs --project <id> --output C:\\secure\\yahnu-firestore.json

Options:
  --project <id>    Firebase / Google Cloud project ID (or FIREBASE_PROJECT_ID)
  --database <id>   Firestore database ID; defaults to (default)
  --output <path>   Absolute output path outside this repository (required)
  --help            Show this help

Safety:
  Root collections are discovered dynamically. The export fails closed if Firestore
  contains an unknown collection or any document subcollection, so data cannot be
  silently omitted from cutover. Empty accounted collections are included explicitly.

Authentication:
  Set GOOGLE_ACCESS_TOKEN to a short-lived OAuth access token with permission to read
  Firestore. The token is sent only to firestore.googleapis.com and is never written.
`)
}

function parseArguments(argv) {
  const result = { project: process.env.FIREBASE_PROJECT_ID, database: process.env.FIRESTORE_DATABASE_ID ?? '(default)', output: undefined, help: false }

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--help') {
      result.help = true
      continue
    }

    const option = ['project', 'database', 'output'].find((name) => argument === `--${name}` || argument.startsWith(`--${name}=`))
    if (!option) throw new Error(`Unknown option: ${argument}`)
    const value = argument === `--${option}` ? argv[++index] : argument.slice(`--${option}=`.length)
    if (!value || value.startsWith('--')) throw new Error(`--${option} requires a value.`)
    result[option] = value
  }

  return result
}

function validateIdentifier(value, label) {
  if (typeof value !== 'string' || !value.trim() || value.length > 128 || /[\r\n/]/.test(value)) {
    throw new Error(`${label} is invalid.`)
  }
  return value.trim()
}

function isInsideDirectory(base, target) {
  const relative = path.relative(base, target)
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

function documentId(document) {
  const segments = String(document?.name ?? '').split('/').filter(Boolean)
  return segments.at(-1) ?? ''
}

function documentsBase({ project, database }) {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(project)}/databases/${encodeURIComponent(database)}/documents`
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function retryDelayMilliseconds(attempt) {
  return Math.min(RETRY_MAX_DELAY_MS, RETRY_BASE_DELAY_MS * (2 ** (attempt - 1)))
}

function transportCode(error) {
  const code = error?.cause?.code ?? error?.code
  return typeof code === 'string' && /^[A-Z0-9_]{2,64}$/.test(code) ? code : null
}

function isRetryableTransportError(error) {
  return error?.name === 'AbortError'
    || error?.name === 'TimeoutError'
    || error?.name === 'TypeError'
    || RETRYABLE_NETWORK_CODES.has(transportCode(error))
}

function safeTransportCause(error) {
  if (error?.name === 'AbortError' || error?.name === 'TimeoutError') return 'request timed out'
  const code = transportCode(error)
  return code ? `network error ${code}` : 'network request failed'
}

async function firestoreJson(
  endpoint,
  { token, method = 'GET', body } = {},
  { fetchImpl = globalThis.fetch, sleepImpl = sleep } = {},
) {
  const request = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  }

  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt += 1) {
    let response
    try {
      response = await fetchImpl(endpoint, {
        ...request,
        signal: AbortSignal.timeout(30_000),
      })
    } catch (error) {
      if (isRetryableTransportError(error) && attempt < MAX_FETCH_ATTEMPTS) {
        await sleepImpl(retryDelayMilliseconds(attempt))
        continue
      }
      const suffix = isRetryableTransportError(error) ? ` after ${attempt} attempts` : ''
      throw new Error(`Firestore API request failed${suffix}: ${safeTransportCause(error)}.`)
    }

    if (response.ok) {
      try {
        return await response.json()
      } catch (error) {
        if (isRetryableTransportError(error) && attempt < MAX_FETCH_ATTEMPTS) {
          await sleepImpl(retryDelayMilliseconds(attempt))
          continue
        }
        throw new Error(`Firestore API returned an unreadable response: ${safeTransportCause(error)}.`)
      }
    }

    if (RETRYABLE_HTTP_STATUSES.has(response.status) && attempt < MAX_FETCH_ATTEMPTS) {
      await response.body?.cancel().catch(() => undefined)
      await sleepImpl(retryDelayMilliseconds(attempt))
      continue
    }

    const responseBody = await response.json().catch(() => null)
    const providerMessage = typeof responseBody?.error?.message === 'string'
      ? ` ${responseBody.error.message.slice(0, 300)}`
      : ''
    const suffix = RETRYABLE_HTTP_STATUSES.has(response.status) ? ` after ${attempt} attempts` : ''
    throw new Error(`Firestore API request was rejected (${response.status})${suffix}.${providerMessage}`)
  }
}

async function listCollectionIds({ project, database, token, documentPath = '' }) {
  const ids = []
  let pageToken
  const encodedDocumentPath = documentPath
    ? `/${documentPath.split('/').filter(Boolean).map(encodeURIComponent).join('/')}`
    : ''
  const endpoint = `${documentsBase({ project, database })}${encodedDocumentPath}:listCollectionIds`

  do {
    const body = { pageSize: PAGE_SIZE }
    if (pageToken) body.pageToken = pageToken
    const response = await firestoreJson(endpoint, { token, method: 'POST', body })
    if (Array.isArray(response.collectionIds)) ids.push(...response.collectionIds)
    pageToken = typeof response.nextPageToken === 'string' && response.nextPageToken
      ? response.nextPageToken
      : undefined
  } while (pageToken)

  return [...new Set(ids)].sort()
}

async function listCollection({ project, database, collection, token }) {
  const listedDocuments = []
  let pageToken

  do {
    const endpoint = new URL(`${documentsBase({ project, database })}/${encodeURIComponent(collection)}`)
    endpoint.searchParams.set('pageSize', String(PAGE_SIZE))
    // Missing parent documents can still own subcollections. Include their names
    // in the safety scan, but never serialize them as real source documents.
    endpoint.searchParams.set('showMissing', 'true')
    if (pageToken) endpoint.searchParams.set('pageToken', pageToken)
    const body = await firestoreJson(endpoint, { token })

    if (Array.isArray(body.documents)) listedDocuments.push(...body.documents)
    if (listedDocuments.length > MAX_DOCUMENTS_PER_COLLECTION) {
      throw new Error(`${collection} exceeded the ${MAX_DOCUMENTS_PER_COLLECTION.toLocaleString()} document safety limit.`)
    }
    pageToken = typeof body.nextPageToken === 'string' && body.nextPageToken ? body.nextPageToken : undefined
  } while (pageToken)

  const documents = listedDocuments.filter((document) => (
    isObject(document.fields) || Boolean(document.createTime) || Boolean(document.updateTime)
  ))
  return { documents, scanDocuments: listedDocuments }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function relativeDocumentPath(document) {
  const marker = '/documents/'
  const name = String(document?.name ?? '')
  const markerIndex = name.indexOf(marker)
  return markerIndex >= 0 ? name.slice(markerIndex + marker.length) : ''
}

async function findSubcollections({ project, database, token, collections }) {
  const documents = Object.values(collections).flat()
  const found = []
  let cursor = 0

  async function worker() {
    while (cursor < documents.length) {
      const index = cursor
      cursor += 1
      const document = documents[index]
      const documentPath = relativeDocumentPath(document)
      if (!documentPath) throw new Error('Firestore returned a document without a valid resource path.')
      const collectionIds = await listCollectionIds({ project, database, token, documentPath })
      for (const collectionId of collectionIds) found.push(`${documentPath}/${collectionId}`)
    }
  }

  await Promise.all(Array.from(
    { length: Math.min(SUBCOLLECTION_SCAN_CONCURRENCY, Math.max(1, documents.length)) },
    () => worker(),
  ))
  return found.sort()
}

function collectionManifest(documents) {
  const sortedDocuments = [...documents].sort((left, right) => documentId(left).localeCompare(documentId(right)))
  const ids = sortedDocuments.map(documentId)
  return {
    count: sortedDocuments.length,
    idSha256: sha256(stableJson(ids)),
    documentSha256: sha256(stableJson(sortedDocuments)),
  }
}

async function main() {
  const args = parseArguments(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const project = validateIdentifier(args.project, 'Firebase project ID')
  const database = validateIdentifier(args.database, 'Firestore database ID')
  const token = process.env.GOOGLE_ACCESS_TOKEN?.trim()
  if (!token || token.length < 20 || /\s/.test(token)) throw new Error('GOOGLE_ACCESS_TOKEN is required and must be a valid single-line OAuth token.')
  if (!args.output || !path.isAbsolute(args.output)) throw new Error('--output must be an absolute path.')

  const outputPath = path.resolve(args.output)
  if (isInsideDirectory(process.cwd(), outputPath)) {
    throw new Error('For credential safety, the export path must be outside this repository.')
  }

  const discoveredCollections = await listCollectionIds({ project, database, token })
  const unknownCollections = discoveredCollections.filter((name) => !ACCOUNTED_COLLECTIONS.has(name))
  if (unknownCollections.length) {
    throw new Error(`Unaccounted Firestore root collection(s): ${unknownCollections.join(', ')}. Add an explicit migration contract before exporting.`)
  }

  const entries = await Promise.all(COLLECTIONS.map(async (collection) => [
    collection,
    discoveredCollections.includes(collection)
      ? await listCollection({ project, database, collection, token })
      : { documents: [], scanDocuments: [] },
  ]))
  const collectionResults = Object.fromEntries(entries)
  const collections = Object.fromEntries(COLLECTIONS.map((collection) => [
    collection,
    collectionResults[collection].documents,
  ]))
  const scanCollections = Object.fromEntries(COLLECTIONS.map((collection) => [
    collection,
    collectionResults[collection].scanDocuments,
  ]))
  const subcollections = await findSubcollections({ project, database, token, collections: scanCollections })
  if (subcollections.length) {
    const sample = subcollections.slice(0, 30).join(', ')
    const suffix = subcollections.length > 30 ? ` (and ${subcollections.length - 30} more)` : ''
    throw new Error(`Firestore document subcollection(s) require an explicit migration contract: ${sample}${suffix}.`)
  }

  const collectionMetadata = Object.fromEntries(COLLECTIONS.map((collection) => [
    collection,
    collectionManifest(collections[collection]),
  ]))
  const payload = {
    _metadata: {
      format: 'yahnu-firestore-rest-v2',
      project,
      database,
      exportedAt: new Date().toISOString(),
      discoveredRootCollections: discoveredCollections,
      subcollections: [],
      collections: collectionMetadata,
    },
    ...collections,
  }

  try {
    await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, { encoding: 'utf8', flag: 'wx', mode: 0o600 })
  } catch (error) {
    if (error?.code === 'EEXIST') throw new Error('The output file already exists; choose a new path so an earlier export is not overwritten.')
    throw error
  }

  const counts = Object.fromEntries(COLLECTIONS.map((collection) => [collection, collections[collection].length]))
  process.stdout.write(`${JSON.stringify({ output: outputPath, discoveredCollections, counts }, null, 2)}\n`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`Firestore export failed: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}

export { firestoreJson }
