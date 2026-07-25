import { createHash } from 'node:crypto'
import { realpath, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const FORMAT = 'yahnu-firebase-auth-rest-v1'
const PAGE_SIZE = 1_000
const MAX_USERS = 250_000
const MAX_PAGE_TOKEN_LENGTH = 16_384
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
const SECRET_FIELD_NAMES = new Set([
  'access_token',
  'accesstoken',
  'apikey',
  'authorization',
  'captcharesp',
  'captcharesponse',
  'credential',
  'id_token',
  'idtoken',
  'oob_code',
  'oobcode',
  'oauth_access_token',
  'oauth_id_token',
  'oauthaccesstoken',
  'oauthidtoken',
  'password',
  'password_hash',
  'password_salt',
  'passwordhash',
  'passwordsalt',
  'rawpassword',
  'recaptchatoken',
  'refresh_token',
  'refreshtoken',
  'salt',
  'secret',
  'session_cookie',
  'session_info',
  'sessioncookie',
  'sessioninfo',
  'safetynettoken',
  'token',
  'temporaryproof',
  'verificationproof',
])
const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function printHelp() {
  process.stdout.write(`Export Firebase Authentication users through the authenticated Admin REST API.

Usage:
  GOOGLE_ACCESS_TOKEN=... node scripts/export-firebase-auth-rest.mjs --project <id> --output C:\\secure\\yahnu-auth.json

Options:
  --project <id>    Firebase / Google Cloud project ID (or FIREBASE_PROJECT_ID)
  --output <path>   New absolute output path outside this repository (required)
  --help            Show this help

Safety:
  GOOGLE_ACCESS_TOKEN must be a short-lived OAuth access token with Firebase Auth
  user-read permission. It is sent only in an Authorization header to
  identitytoolkit.googleapis.com; it is never written or logged. The output is
  created with owner-only permissions, must not already exist, and excludes password
  hashes, salts, access tokens, refresh tokens, and similarly named credential fields.
`)
}

function parseArguments(argv) {
  const result = {
    project: process.env.FIREBASE_PROJECT_ID,
    output: undefined,
    help: false,
  }
  const supplied = new Set()

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--help') {
      result.help = true
      continue
    }

    const option = ['project', 'output'].find((name) => argument === `--${name}` || argument.startsWith(`--${name}=`))
    if (!option) throw new Error('Unknown option.')
    if (supplied.has(option)) throw new Error(`--${option} may be supplied only once.`)
    const value = argument === `--${option}` ? argv[++index] : argument.slice(`--${option}=`.length)
    if (!value || value.startsWith('--')) throw new Error(`--${option} requires a value.`)
    result[option] = value
    supplied.add(option)
  }

  return result
}

function validateProject(value) {
  const project = typeof value === 'string' ? value.trim() : ''
  if (!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(project)) {
    throw new Error('Firebase project ID is invalid.')
  }
  return project
}

function validateAccessToken(value) {
  const token = typeof value === 'string' ? value.trim() : ''
  if (token.length < 20 || /[\s\u0000-\u001F\u007F]/.test(token)) {
    throw new Error('GOOGLE_ACCESS_TOKEN is required and must be a valid single-line OAuth token.')
  }
  return token
}

function isInsideDirectory(base, target) {
  const relative = path.relative(base, target)
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
}

async function validateOutputPath(value) {
  if (typeof value !== 'string' || !value || /[\u0000\r\n]/.test(value) || !path.isAbsolute(value)) {
    throw new Error('--output must be an absolute path.')
  }
  const outputPath = path.resolve(value)
  if (!path.parse(outputPath).base) throw new Error('--output must name a new file.')
  const outputParent = path.dirname(outputPath)
  let [repositoryRoot, resolvedParent] = await Promise.all([
    realpath(REPOSITORY_ROOT),
    realpath(outputParent),
  ])
  repositoryRoot = path.resolve(repositoryRoot)
  resolvedParent = path.resolve(resolvedParent)

  if (isInsideDirectory(repositoryRoot, resolvedParent)) {
    throw new Error('For credential safety, the export path must be outside this repository.')
  }
  return outputPath
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map((entry) => stableJson(entry === undefined ? null : entry)).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
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

function firebaseAuthEndpoint(project) {
  return `https://identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(project)}/accounts:batchGet`
}

async function firebaseAuthJson(endpoint, { token }, { fetchImpl = globalThis.fetch, sleepImpl = sleep } = {}) {
  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt += 1) {
    let response
    try {
      response = await fetchImpl(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        redirect: 'error',
        signal: AbortSignal.timeout(30_000),
      })
    } catch (error) {
      if (isRetryableTransportError(error) && attempt < MAX_FETCH_ATTEMPTS) {
        await sleepImpl(retryDelayMilliseconds(attempt))
        continue
      }
      const suffix = isRetryableTransportError(error) ? ` after ${attempt} attempts` : ''
      throw new Error(`Firebase Auth API request failed${suffix}: ${safeTransportCause(error)}.`)
    }

    if (response.ok) {
      try {
        const body = await response.json()
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          throw new Error('Firebase Auth API returned a malformed response.')
        }
        return body
      } catch (error) {
        if (error instanceof Error && error.message === 'Firebase Auth API returned a malformed response.') throw error
        if (isRetryableTransportError(error) && attempt < MAX_FETCH_ATTEMPTS) {
          await sleepImpl(retryDelayMilliseconds(attempt))
          continue
        }
        throw new Error(`Firebase Auth API returned an unreadable response: ${safeTransportCause(error)}.`)
      }
    }

    await response.body?.cancel().catch(() => undefined)
    if (RETRYABLE_HTTP_STATUSES.has(response.status) && attempt < MAX_FETCH_ATTEMPTS) {
      await sleepImpl(retryDelayMilliseconds(attempt))
      continue
    }
    const suffix = RETRYABLE_HTTP_STATUSES.has(response.status) ? ` after ${attempt} attempts` : ''
    throw new Error(`Firebase Auth API request was rejected (${response.status})${suffix}.`)
  }

  throw new Error('Firebase Auth API request exhausted without a response.')
}

function normalizeSecretFieldName(key) {
  return String(key).replace(/[^a-z0-9]/gi, '').toLowerCase()
}

function isSecretFieldName(key) {
  const normalized = normalizeSecretFieldName(key)
  return SECRET_FIELD_NAMES.has(key) || SECRET_FIELD_NAMES.has(normalized)
}

function sanitizeAuthExportValue(value) {
  if (Array.isArray(value)) return value.map(sanitizeAuthExportValue)
  if (!value || typeof value !== 'object') return value

  const sanitized = {}
  for (const [key, nestedValue] of Object.entries(value)) {
    if (isSecretFieldName(key)) continue
    sanitized[key] = sanitizeAuthExportValue(nestedValue)
  }
  return sanitized
}

function validLocalId(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 128 && !/[\u0000-\u001F\u007F]/.test(value)
}

function nextPageTokenFrom(body) {
  if (!Object.hasOwn(body, 'nextPageToken') || body.nextPageToken === '') return undefined
  if (typeof body.nextPageToken !== 'string' || body.nextPageToken.length > MAX_PAGE_TOKEN_LENGTH || /[\u0000-\u001F\u007F]/.test(body.nextPageToken)) {
    throw new Error('Firebase Auth API returned an invalid next-page token.')
  }
  return body.nextPageToken
}

async function listFirebaseAuthUsers({ project, token }, dependencies) {
  const users = []
  const seenUsers = new Set()
  const seenPageTokens = new Set()
  let pageToken
  let pages = 0

  do {
    if (pageToken) {
      if (seenPageTokens.has(pageToken)) throw new Error('Firebase Auth API repeated a page token; refusing an incomplete export.')
      seenPageTokens.add(pageToken)
    }
    const endpoint = new URL(firebaseAuthEndpoint(project))
    endpoint.searchParams.set('maxResults', String(PAGE_SIZE))
    if (pageToken) endpoint.searchParams.set('nextPageToken', pageToken)
    const body = await firebaseAuthJson(endpoint, { token }, dependencies)
    pages += 1

    if (body.users !== undefined && !Array.isArray(body.users)) {
      throw new Error('Firebase Auth API returned a malformed users list.')
    }
    for (const rawUser of body.users ?? []) {
      if (!rawUser || typeof rawUser !== 'object' || Array.isArray(rawUser) || !validLocalId(rawUser.localId)) {
        throw new Error('Firebase Auth API returned a user without a valid localId.')
      }
      if (seenUsers.has(rawUser.localId)) {
        throw new Error('Firebase Auth API returned a duplicate user ID; refusing an ambiguous export.')
      }
      seenUsers.add(rawUser.localId)
      users.push(sanitizeAuthExportValue(rawUser))
      if (users.length > MAX_USERS) {
        throw new Error(`Firebase Auth export exceeded the ${MAX_USERS.toLocaleString()} user safety limit.`)
      }
    }
    pageToken = nextPageTokenFrom(body)
  } while (pageToken)

  return { users, pages }
}

function authExportPayload({ project, users, pages, exportedAt = new Date().toISOString() }) {
  const metadata = {
    format: FORMAT,
    project,
    exportedAt,
    pageSize: PAGE_SIZE,
    pages,
    userCount: users.length,
    usersSha256: sha256(stableJson(users)),
  }
  return {
    _metadata: metadata,
    users,
  }
}

async function main() {
  const args = parseArguments(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const project = validateProject(args.project)
  const token = validateAccessToken(process.env.GOOGLE_ACCESS_TOKEN)
  const outputPath = await validateOutputPath(args.output)
  const { users, pages } = await listFirebaseAuthUsers({ project, token })
  const payload = authExportPayload({ project, users, pages })

  try {
    await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o600,
    })
  } catch (error) {
    if (error?.code === 'EEXIST') throw new Error('The output file already exists; choose a new path so an earlier export is not overwritten.')
    throw error
  }

  process.stdout.write(`${JSON.stringify({
    output: outputPath,
    project,
    count: users.length,
    metadataSha256: sha256(stableJson(payload._metadata)),
  }, null, 2)}\n`)
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`Firebase Auth export failed: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}

export {
  FORMAT,
  authExportPayload,
  firebaseAuthEndpoint,
  firebaseAuthJson,
  listFirebaseAuthUsers,
  parseArguments,
  sanitizeAuthExportValue,
  validateOutputPath,
}
