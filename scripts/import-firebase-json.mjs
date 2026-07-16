import { createHash, createHmac } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import pg from 'pg'
import { directDatabaseConfig } from '../src/lib/server/database-config.mjs'
import { isApprovedQuarantinedFirestoreReference } from './firebase-quarantine-manifest.mjs'

const ROLE_MAP = new Map([
  ['graduate', 'graduate'],
  ['graduates', 'graduate'],
  ['alumni', 'graduate'],
  ['alumnus', 'graduate'],
  ['student', 'graduate'],
  ['company', 'company'],
  ['employer', 'company'],
  ['business', 'company'],
  ['school', 'school'],
  ['university', 'school'],
  ['institution', 'school'],
  ['admin', 'admin'],
  ['administrator', 'admin'],
  ['super_admin', 'super_admin'],
  ['superadmin', 'super_admin'],
  ['content_manager', 'content_manager'],
  ['contentmanager', 'content_manager'],
  ['content_moderator', 'content_moderator'],
  ['contentmoderator', 'content_moderator'],
  ['support_staff', 'support_staff'],
  ['supportstaff', 'support_staff'],
  ['support', 'support_staff'],
])
const NOTIFICATION_AUDIENCE_ROLES = new Set(ROLE_MAP.values())
const ANNOUNCEMENT_AUDIENCE_ROLES = new Set(['graduate', 'company', 'school'])
const GLOBAL_AUDIENCE_ALIASES = new Set(['all', 'all_users', 'everyone', 'global'])

const STATUS_MAP = new Map([
  ['pending', 'pending'],
  ['awaiting_approval', 'pending'],
  ['active', 'active'],
  ['approved', 'active'],
  ['enabled', 'active'],
  ['verified', 'active'],
  ['suspended', 'suspended'],
  ['disabled', 'suspended'],
  ['blocked', 'suspended'],
  ['inactive', 'suspended'],
  ['declined', 'declined'],
  ['rejected', 'declined'],
])

const INVITE_ROLES = new Set(['admin', 'super_admin', 'content_manager', 'content_moderator', 'support_staff'])
const INVITE_STATUS_MAP = new Map([
  ['pending', 'pending'],
  ['unused', 'pending'],
  ['used', 'used'],
  ['accepted', 'used'],
  ['completed', 'used'],
  ['revoked', 'revoked'],
  ['cancelled', 'revoked'],
  ['canceled', 'revoked'],
  ['expired', 'expired'],
])
const TICKET_STATUS_MAP = new Map([
  ['new', 'open'],
  ['open', 'open'],
  ['in_progress', 'in_progress'],
  ['inprogress', 'in_progress'],
  ['pending', 'in_progress'],
  ['resolved', 'resolved'],
  ['complete', 'resolved'],
  ['completed', 'resolved'],
  ['closed', 'closed'],
])
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1_000
const FALLBACK_AUTH_SECRET = 'yahnu-development-secret-change-me'
const FIRESTORE_FORMATS = new Set(['yahnu-firestore-rest-v1', 'yahnu-firestore-rest-v2'])
const SUPPORTED_FIREBASE_AUTH_PROVIDERS = new Set(['password', 'google.com'])
const MFA_EXPORT_FIELD_KEYS = new Set([
  'mfainfo', 'multifactor', 'multifactorinfo', 'multifactorenrollment',
  'multifactorenrollments', 'enrolledfactors',
])
const FIRESTORE_COLLECTIONS = [
  'users', 'invites', 'tickets', 'pages', 'dashboards', 'blogPosts',
  'conversations', 'notifications', 'emailVerificationCodes', 'jobs',
  'applications', 'partnerships', 'mail', 'announcements', 'knowledgeBaseArticles',
]
const FIRESTORE_COLLECTION_SET = new Set(FIRESTORE_COLLECTIONS)

const SENSITIVE_KEYS = new Set([
  'password',
  'confirmpassword',
  'passwordconfirmation',
  'rawpassword',
  'passwordhash',
  'passwordsalt',
  'salt',
  'refreshToken'.toLowerCase(),
  'oauthaccesstoken',
  'oauthidtoken',
  'firebasestoragedownloadtokens',
])
const PERSISTENCE_SECRET_KEYS = new Set(['token', 'code', 'secret', 'apikey', 'authorization'])
const PROFILE_AVATAR_KEYS = new Set([
  'avatar', 'avatarurl', 'photourl', 'profileimage', 'profileimageurl',
  'profilepicture', 'profilepictureurl',
])
const JOB_EMPLOYMENT_TYPES = new Set([
  'full_time', 'part_time', 'contract', 'internship', 'temporary', 'volunteer', 'other',
])
const JOB_STATUSES = new Set(['draft', 'open', 'closed'])
const APPLICATION_STATUSES = new Set([
  'submitted', 'reviewing', 'shortlisted', 'interviewing', 'accepted', 'rejected', 'withdrawn',
])
const APPLICATION_STATUS_ALIASES = new Map([
  ['pending', 'submitted'],
  ['reviewed', 'reviewing'],
])
const PARTNERSHIP_STATUS_MAP = new Map([
  ['pending', 'pending'], ['accepted', 'accepted'], ['approved', 'accepted'],
  ['declined', 'declined'], ['rejected', 'declined'], ['cancelled', 'cancelled'], ['canceled', 'cancelled'],
])
const REDACTED_EMBEDDED_URL_SECRET = '[yahnu-redacted-embedded-url-secret]'

const AUTHORITATIVE_PROFILE_KEYS = new Set([
  'id', 'uid', 'localid', 'userid', 'documentid', '__id__', '_id',
  'email', 'emailaddress', 'emailverified', 'emailverifiedat',
  'name', 'displayname', 'fullname', 'firstname', 'lastname',
  'role', 'userrole', 'accounttype', 'status', 'accountstatus', 'disabled',
  'schoolid', 'schoolname', 'companyname', 'contactname', 'industry',
  'experience', 'education', 'skills', 'phone', 'phonenumber',
  'createdat', 'creationtime', 'lastloginat', 'lastsignin', 'lastsignintime',
  'updatedat', 'profile', 'customattributes', 'customclaims',
  'provideruserinfo', 'collections', 'key',
])

function printHelp() {
  process.stdout.write(`Import Firebase Auth and Firestore JSON into Render PostgreSQL.

Usage:
  npm run firebase:import -- --file path/to/firebase-auth.json --source auth
  npm run firebase:import -- --file path/to/firestore.json --source firestore --dry-run

Options:
  --file <path>          Firebase JSON file (or FIREBASE_EXPORT_PATH)
  --source <kind>        auth or firestore; auto-detected for standard exports
  --preflight            Report Firebase Auth compatibility without a database connection
  --dry-run              Execute all checks and writes, then roll the transaction back
  --allow-partial        Commit valid records despite skipped/rejected records
  --help                 Show this help

Supported collections: users, invites, tickets, pages, dashboards, blogPosts,
conversations, notifications, emailVerificationCodes, jobs, applications,
partnerships, mail, announcements, and knowledgeBaseArticles. Input may use
named collection wrappers/maps, document arrays, direct maps, or REST-style typed fields.
Firebase Auth { users: [...] } is also supported. Auth preflight permits only email
password-reset continuity and stable Google identities; it rejects phone, anonymous,
MFA, tenant, malformed Google, and other federated account types before any write.
DATABASE_URL is required except for --preflight. AUTH_SECRET is required when an
importable pending invitation is present. Imported Firebase passwords and password hashes
are never used, and raw invitation tokens are never printed.
Email verification codes are one-way hashed and recorded as explicitly invalidated;
they are never inserted into the active auth_tokens table. Unknown collections and
document subcollections fail closed.
`)
}

function parseArguments(argv) {
  const result = {
    dryRun: false,
    allowPartial: false,
    preflight: false,
    file: undefined,
    source: undefined,
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
    if (argument === '--preflight') {
      result.preflight = true
      continue
    }
    if (argument === '--help') {
      result.help = true
      continue
    }
    if (argument === '--file' || argument.startsWith('--file=')) {
      const value = argument === '--file' ? argv[++index] : argument.slice('--file='.length)
      if (!value || value.startsWith('--')) throw new Error('--file requires a path.')
      if (result.file) throw new Error('Only one input file may be specified.')
      result.file = value
      continue
    }
    if (argument === '--source' || argument.startsWith('--source=')) {
      const value = argument === '--source' ? argv[++index] : argument.slice('--source='.length)
      if (!['auth', 'firestore'].includes(value)) throw new Error('--source must be auth or firestore.')
      result.source = value
      continue
    }
    if (argument.startsWith('--')) throw new Error(`Unknown option: ${argument}`)
    if (result.file) throw new Error('Only one input file may be specified.')
    result.file = argument
  }

  return result
}

function detectSourceMode(root) {
  if (FIRESTORE_FORMATS.has(root?._metadata?.format)) return 'firestore'
  if (Array.isArray(root?.users) && root.users.some((record) => isObject(record) && typeof record.localId === 'string')) {
    return 'auth'
  }
  return undefined
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizedKey(value) {
  return String(value).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
}

function decodeFieldMap(fields) {
  const result = {}
  for (const [key, value] of Object.entries(fields ?? {})) result[key] = decodeFirestoreValue(value)
  return result
}

function decodeFirestoreValue(value) {
  if (value === null || value === undefined || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(decodeFirestoreValue)

  if (Object.hasOwn(value, 'nullValue')) return null
  if (Object.hasOwn(value, 'stringValue')) return String(value.stringValue)
  if (Object.hasOwn(value, 'booleanValue')) return Boolean(value.booleanValue)
  if (Object.hasOwn(value, 'integerValue')) {
    const number = Number(value.integerValue)
    return Number.isSafeInteger(number) ? number : String(value.integerValue)
  }
  if (Object.hasOwn(value, 'doubleValue')) return Number(value.doubleValue)
  if (Object.hasOwn(value, 'timestampValue')) return value.timestampValue
  if (Object.hasOwn(value, 'referenceValue')) return value.referenceValue
  if (Object.hasOwn(value, 'bytesValue')) return value.bytesValue
  if (Object.hasOwn(value, 'geoPointValue')) return decodeFirestoreValue(value.geoPointValue)
  if (Object.hasOwn(value, 'arrayValue')) return (value.arrayValue?.values ?? []).map(decodeFirestoreValue)
  if (Object.hasOwn(value, 'mapValue')) return decodeFieldMap(value.mapValue?.fields ?? {})

  const result = {}
  for (const [key, nestedValue] of Object.entries(value)) result[key] = decodeFirestoreValue(nestedValue)
  return result
}

function sanitizeSensitive(value) {
  if (Array.isArray(value)) return value.map(sanitizeSensitive)
  if (!isObject(value)) return value

  const result = {}
  for (const [key, nestedValue] of Object.entries(value)) {
    const normalized = normalizedKey(key)
    if (SENSITIVE_KEYS.has(normalized) || ['__proto__', 'prototype', 'constructor'].includes(key)) continue
    result[key] = sanitizeSensitive(nestedValue)
  }
  return result
}

function decodedStringRepresentations(value) {
  if (typeof value !== 'string') return []
  const representations = []
  let current = value
  for (let pass = 0; pass < 4; pass += 1) {
    current = current
      .replace(/&amp;|&#0*38;|&#x0*26;/gi, '&')
      .replace(/&quest;|&#0*63;|&#x0*3f;/gi, '?')
      .replace(/&equals;|&#0*61;|&#x0*3d;/gi, '=')
    representations.push(current)
    try {
      const decoded = decodeURIComponent(current)
      if (decoded === current) break
      current = decoded
    } catch {
      break
    }
  }
  return representations
}

function containsEmbeddedUrlSecret(value) {
  return decodedStringRepresentations(value).some((candidate) => (
    /(?:[?&])(?:token|x-goog-signature|x-goog-credential)\s*=/i.test(candidate)
  ))
}

function containsFirebaseStorageReference(value) {
  if (Array.isArray(value)) return value.some(containsFirebaseStorageReference)
  if (isObject(value)) return Object.values(value).some(containsFirebaseStorageReference)
  return decodedStringRepresentations(value).some((candidate) => (
    candidate.includes(REDACTED_EMBEDDED_URL_SECRET)
    || /(?:gs:\/\/|https:\/\/(?:firebasestorage|storage)\.googleapis\.com\/)/i.test(candidate)
  ))
}

function canonicalFirebaseStorageReference(value) {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (trimmed.startsWith('gs://')) return trimmed
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol !== 'https:') return value
    if (parsed.hostname === 'firebasestorage.googleapis.com') {
      const match = /^\/v0\/b\/([^/]+)\/o\/([^/]+)$/.exec(parsed.pathname)
      if (!match) return value
      const bucket = decodeURIComponentSafe(match[1])
      const objectName = decodeURIComponentSafe(match[2])
      return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(objectName)}?alt=media`
    }
    if (parsed.hostname === 'storage.googleapis.com') {
      const segments = parsed.pathname.split('/').filter(Boolean).map(decodeURIComponentSafe)
      if (segments.length < 2) return value
      return `https://storage.googleapis.com/${encodeURIComponent(segments[0])}/${segments.slice(1).map(encodeURIComponent).join('/')}`
    }
  } catch {
    return value
  }
  return value
}

function redactFirebaseStorageSecrets(value) {
  if (Array.isArray(value)) return value.map(redactFirebaseStorageSecrets)
  if (isObject(value)) {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !PERSISTENCE_SECRET_KEYS.has(normalizedKey(key)))
      .map(([key, nested]) => [key, redactFirebaseStorageSecrets(nested)]))
  }
  const canonical = canonicalFirebaseStorageReference(value)
  if (canonical !== value) return canonical
  if (containsEmbeddedUrlSecret(value)) {
    return REDACTED_EMBEDDED_URL_SECRET
  }
  return value
}

function firebaseStorageReferenceHash(value) {
  const canonical = canonicalFirebaseStorageReference(value)
  if (typeof canonical !== 'string') return null
  if (
    canonical.startsWith('gs://')
    || canonical.startsWith('https://firebasestorage.googleapis.com/')
    || canonical.startsWith('https://storage.googleapis.com/')
  ) return sha256(canonical)
  return null
}

function documentPath(record) {
  const candidates = [record?.name, record?.path, record?.__name__]
  const key = record?.__key__
  if (typeof key === 'string') candidates.push(key)
  if (isObject(key)) {
    candidates.push(key.name, key.path)
    const segments = Array.isArray(key.path) ? key.path : key.path?.segments ?? key.segments
    if (Array.isArray(segments)) candidates.push(segments.join('/'))
  }

  return candidates.find((candidate) => typeof candidate === 'string' && candidate.trim()) ?? null
}

function idFromCollectionPath(value, collectionName) {
  if (typeof value !== 'string') return null
  const segments = value.split('/').filter(Boolean)
  const collectionIndex = segments.length - 2
  return collectionIndex >= 0 && segments[collectionIndex].toLowerCase() === collectionName.toLowerCase()
    ? decodeURIComponentSafe(segments[collectionIndex + 1])
    : null
}

function idFromDocumentPath(value) {
  return idFromCollectionPath(value, 'users')
}

function decodeURIComponentSafe(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function materializeRecord(record) {
  if (!isObject(record)) return null

  const directKeys = Object.keys(record).map(normalizedKey)
  const hasDirectUserFields = directKeys.some((key) => ['email', 'emailaddress', 'uid', 'localid', 'role'].includes(key))
  if (isObject(record.fields) && !hasDirectUserFields) return decodeFieldMap(record.fields)
  if (isObject(record.data) && !hasDirectUserFields && (record.id || record.uid || record.localId || documentPath(record))) {
    return decodeFirestoreValue(record.data)
  }
  return decodeFirestoreValue(record)
}

function looksLikeUserRecord(record) {
  const data = materializeRecord(record)
  if (!isObject(data)) return false
  if (looksLikeInviteRecord(record)) return false
  const keys = new Set(Object.keys(data).map(normalizedKey))
  return ['email', 'emailaddress', 'uid', 'localid', 'displayname', 'role'].some((key) => keys.has(key))
}

function collectionRecords(collection, looksLikeRecord = looksLikeUserRecord) {
  if (Array.isArray(collection)) return collection.filter(isObject).map((record) => ({ record, inferredId: null }))
  if (!isObject(collection)) return []
  if (looksLikeRecord(collection)) return [{ record: collection, inferredId: null }]

  for (const key of ['documents', 'docs', 'items', 'records']) {
    if (Array.isArray(collection[key])) return collectionRecords(collection[key], looksLikeRecord)
  }

  return Object.entries(collection)
    .filter(([, record]) => isObject(record))
    .map(([inferredId, record]) => ({ record, inferredId }))
}

function propertyCaseInsensitive(container, key) {
  if (!isObject(container)) return undefined
  const match = Object.keys(container).find((candidate) => candidate.toLowerCase() === key.toLowerCase())
  return match ? container[match] : undefined
}

function explicitCollectionCandidates(root, collectionName) {
  return [
    propertyCaseInsensitive(root, collectionName),
    propertyCaseInsensitive(root.collections, collectionName),
    propertyCaseInsensitive(root.__collections__, collectionName),
    propertyCaseInsensitive(root.data, collectionName),
    propertyCaseInsensitive(root.result, collectionName),
  ].filter((candidate) => candidate !== undefined)
}

function extractCollectionRecords(root, collectionName, looksLikeRecord, { allowBare = false } = {}) {
  if (!isObject(root) && !Array.isArray(root)) return []

  if (isObject(root)) {
    for (const candidate of explicitCollectionCandidates(root, collectionName)) {
      if (collectionName === 'users' && isObject(candidate)) {
        const materialized = materializeRecord(candidate)
        const keys = isObject(materialized) ? new Set(Object.keys(materialized).map(normalizedKey)) : new Set()
        if (keys.has('email') || keys.has('emailaddress')) return [{ record: candidate, inferredId: null }]
      }
      const records = collectionRecords(candidate, looksLikeRecord)
      if (records.length) return records
    }

    for (const key of ['documents', 'docs', 'data', 'items', 'records']) {
      if (!Array.isArray(root[key])) continue
      const records = collectionRecords(root[key], looksLikeRecord)
      const matched = records.filter(({ record }) => idFromCollectionPath(documentPath(record), collectionName))
      if (matched.length) return matched
      if (allowBare) {
        const inferred = records.filter(({ record }) => looksLikeRecord(record))
        if (inferred.length) return inferred
      }
    }

    if (looksLikeRecord(root)) return [{ record: root, inferredId: null }]
  }

  const records = collectionRecords(root, looksLikeRecord)
  const pathMatched = records.filter(({ record }) => idFromCollectionPath(documentPath(record), collectionName))
  if (pathMatched.length) return pathMatched
  return records.filter(({ record }) => looksLikeRecord(record))
}

function extractUserRecords(root) {
  return extractCollectionRecords(root, 'users', looksLikeUserRecord, { allowBare: true })
}

function extractNamedCollectionRecords(root, collectionName) {
  if (!isObject(root)) return []
  for (const candidate of explicitCollectionCandidates(root, collectionName)) {
    return collectionRecords(candidate, () => false)
  }
  for (const key of ['documents', 'docs', 'items', 'records']) {
    if (!Array.isArray(root[key])) continue
    return collectionRecords(root[key], () => false)
      .filter(({ record }) => idFromCollectionPath(documentPath(record), collectionName))
  }
  return []
}

function suppliedFirestoreCollectionNames(root) {
  const names = new Set()
  if (!isObject(root)) return names
  const wrapperNames = new Set(['collections', '__collections__', 'data', 'result'])
  const documentListNames = new Set(['documents', 'docs', 'items', 'records'])
  for (const key of Object.keys(root)) {
    if (key === '_metadata') continue
    if (wrapperNames.has(key) || documentListNames.has(key)) continue
    if (Array.isArray(root[key]) || isObject(root[key])) names.add(key)
  }
  for (const wrapperName of wrapperNames) {
    const wrapper = root[wrapperName]
    if (!isObject(wrapper)) continue
    for (const key of Object.keys(wrapper)) names.add(key)
  }
  for (const listName of documentListNames) {
    if (!Array.isArray(root[listName])) continue
    for (const record of root[listName]) {
      const recordPath = documentPath(record)
      const segments = String(recordPath ?? '').split('/').filter(Boolean)
      const documentsIndex = segments.lastIndexOf('documents')
      const collectionIndex = documentsIndex >= 0 ? documentsIndex + 1 : segments.length - 2
      if (collectionIndex >= 0 && segments[collectionIndex]) names.add(segments[collectionIndex])
    }
  }
  return names
}

function assertAccountedFirestoreShape(root, sourceMode) {
  if (sourceMode !== 'firestore') return
  const suppliedNames = [...suppliedFirestoreCollectionNames(root)]
  const hasExplicitShape = FIRESTORE_FORMATS.has(root?._metadata?.format)
    || suppliedNames.some((name) => FIRESTORE_COLLECTION_SET.has(name))
    || isObject(root?.collections)
    || isObject(root?.__collections__)
  if (!hasExplicitShape) return
  const unknown = suppliedNames
    .filter((name) => !FIRESTORE_COLLECTION_SET.has(name))
    .sort()
  if (unknown.length) {
    throw new Error(`Unaccounted Firestore root collection(s): ${unknown.join(', ')}. Add an explicit migration contract before importing.`)
  }
  const subcollections = root?._metadata?.subcollections
  if (Array.isArray(subcollections) && subcollections.length) {
    throw new Error(`Firestore subcollections are not importable without an explicit contract: ${subcollections.slice(0, 20).join(', ')}`)
  }
}

function rawFirestoreDocumentIds(root) {
  const ids = new Set()
  if (!isObject(root)) return ids
  for (const collectionName of FIRESTORE_COLLECTIONS) {
    const records = propertyCaseInsensitive(root, collectionName)
    if (!Array.isArray(records)) continue
    for (const record of records) {
      if (!isObject(record)) continue
      const id = normalizeId(
        idFromCollectionPath(documentPath(record), collectionName)
        ?? record.id
        ?? record.documentId
        ?? record.__id__
        ?? record._id,
      )
      if (id) ids.add(id)
    }
  }
  return ids
}

function rawFirestoreUserIdentityCandidates(root) {
  const ids = new Set()
  const emails = new Set()
  const records = propertyCaseInsensitive(root, 'users')
  if (!Array.isArray(records)) return { ids, emails }
  for (const record of records) {
    if (!isObject(record)) continue
    const materialized = materializeRecord(record) ?? {}
    for (const candidate of [
      idFromCollectionPath(documentPath(record), 'users'),
      record.localId,
      record.uid,
      record.userId,
      record.firebaseUid,
      record.id,
      materialized.localId,
      materialized.uid,
      materialized.userId,
      materialized.firebaseUid,
      materialized.id,
    ]) {
      const id = referencedEntityId(candidate)
      if (id) ids.add(id)
    }
    for (const candidate of [
      record.email,
      record.emailAddress,
      materialized.email,
      materialized.emailAddress,
    ]) {
      const email = normalizeEmail(candidate)
      if (email) emails.add(email)
    }
    for (const provider of [
      ...normalizeArray(record.providerUserInfo),
      ...normalizeArray(materialized.providerUserInfo),
    ]) {
      if (!isObject(provider)) continue
      const email = normalizeEmail(provider.email ?? provider.emailAddress)
      if (email) emails.add(email)
    }
  }
  return { ids, emails }
}

function looksLikeInviteRecord(record) {
  const data = materializeRecord(record)
  if (!isObject(data)) return false
  const keys = new Set(Object.keys(data).map(normalizedKey))
  if (!keys.has('email') || !keys.has('role')) return false
  const explicitInviteKeys = [
    'token', 'invitetoken', 'rawtoken', 'createdby', 'createdbyid', 'invitedby',
    'usedby', 'acceptedby', 'expiresat', 'expirationtime', 'usedat', 'acceptedat',
  ]
  if (explicitInviteKeys.some((key) => keys.has(key))) return true

  const role = ROLE_MAP.get(normalizeEnum(data.role ?? data.userRole ?? data.accountType))
  const status = normalizeEnum(data.status)
  const userIdentityKeys = [
    'uid', 'localid', 'name', 'displayname', 'fullname', 'firstname', 'lastname',
    'emailverified', 'passwordhash', 'provideruserinfo', 'companyname', 'schoolname',
  ]
  const hasUserIdentity = userIdentityKeys.some((key) => keys.has(key))
  return Boolean(
    role
    && INVITE_ROLES.has(role)
    && !hasUserIdentity
    && ['pending', 'unused', 'used', 'accepted', 'revoked', 'expired'].includes(status),
  )
}

function looksLikeTicketRecord(record) {
  const data = materializeRecord(record)
  if (!isObject(data)) return false
  const keys = new Set(Object.keys(data).map(normalizedKey))
  return (keys.has('message') || keys.has('description')) && (
    keys.has('userid') || keys.has('subject') || keys.has('status')
  )
}

function looksLikePageRecord(record) {
  const data = materializeRecord(record)
  if (!isObject(data)) return false
  const keys = new Set(Object.keys(data).map(normalizedKey))
  return ['abouttitle', 'storytitle', 'content', 'lastupdated', 'teammembers'].some((key) => keys.has(key))
}

function looksLikeDashboardRecord(record) {
  const data = materializeRecord(record)
  if (!isObject(data)) return false
  const keys = new Set(Object.keys(data).map(normalizedKey))
  return keys.has('layouts') || keys.has('reports')
}

function extractPersistedCollections(root) {
  return {
    users: extractUserRecords(root),
    invites: extractCollectionRecords(root, 'invites', looksLikeInviteRecord),
    tickets: extractCollectionRecords(root, 'tickets', looksLikeTicketRecord),
    pages: extractCollectionRecords(root, 'pages', looksLikePageRecord),
    dashboards: extractCollectionRecords(root, 'dashboards', looksLikeDashboardRecord),
    blogPosts: extractNamedCollectionRecords(root, 'blogPosts'),
    conversations: extractNamedCollectionRecords(root, 'conversations'),
    notifications: extractNamedCollectionRecords(root, 'notifications'),
    emailVerificationCodes: extractNamedCollectionRecords(root, 'emailVerificationCodes'),
    jobs: extractNamedCollectionRecords(root, 'jobs'),
    applications: extractNamedCollectionRecords(root, 'applications'),
    partnerships: extractNamedCollectionRecords(root, 'partnerships'),
    mail: extractNamedCollectionRecords(root, 'mail'),
    announcements: extractNamedCollectionRecords(root, 'announcements'),
    knowledgeBaseArticles: extractNamedCollectionRecords(root, 'knowledgeBaseArticles'),
  }
}

function normalizeEmail(value) {
  const email = String(value ?? '').trim().toLowerCase()
  if (!email || email.length > 320 || /\s/.test(email)) return null
  const at = email.indexOf('@')
  return at > 0 && at === email.lastIndexOf('@') && at < email.length - 1 ? email : null
}

function firstPresent(...values) {
  return values.find((value) => value !== null && value !== undefined && (typeof value !== 'string' || value.trim()))
}

function normalizeId(value) {
  const id = String(value ?? '').trim()
  if (!id || id.length > 1_500 || id.includes('\0')) return null
  return id
}

function routeCompatibleId(id, maximum, pattern = null) {
  return typeof id === 'string' && id.length <= maximum && (!pattern || pattern.test(id))
}

function normalizeEnum(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
}

function normalizeRole(value) {
  const source = normalizeEnum(value)
  return { role: ROLE_MAP.get(source) ?? 'graduate', defaulted: Boolean(source) && !ROLE_MAP.has(source) }
}

function normalizeStatus(value, disabled) {
  if (disabled === true || String(disabled).toLowerCase() === 'true') return { status: 'suspended', defaulted: false }
  const source = normalizeEnum(value)
  return { status: STATUS_MAP.get(source) ?? 'pending', defaulted: Boolean(source) && !STATUS_MAP.has(source) }
}

function normalizeDate(value) {
  if (value === null || value === undefined || value === '') return null

  if (isObject(value)) {
    const seconds = value.seconds ?? value._seconds
    const nanoseconds = value.nanoseconds ?? value._nanoseconds ?? 0
    if (seconds !== undefined) return dateFromMilliseconds(Number(seconds) * 1_000 + Number(nanoseconds) / 1_000_000)
    if (Object.hasOwn(value, '$date')) return normalizeDate(value.$date)
    if (value.__datatype__ === 'timestamp' || value.type === 'timestamp') return normalizeDate(value.value)
    if (Object.hasOwn(value, 'timestampValue')) return normalizeDate(value.timestampValue)
    return null
  }

  if (typeof value === 'number' || (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.trim()))) {
    const number = Number(value)
    if (!Number.isFinite(number)) return null
    const magnitude = Math.abs(number)
    let milliseconds
    if (magnitude >= 1e17) milliseconds = number / 1e6
    else if (magnitude >= 1e14) milliseconds = number / 1e3
    else if (magnitude >= 1e11) milliseconds = number
    else milliseconds = number * 1_000
    return dateFromMilliseconds(milliseconds)
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

function dateFromMilliseconds(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function parseCustomClaims(value) {
  if (isObject(value)) return value
  if (typeof value !== 'string' || !value.trim()) return {}
  try {
    const parsed = JSON.parse(value)
    return isObject(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function firstProviderEmail(value) {
  if (!Array.isArray(value)) return null
  return value.map((provider) => provider?.email).find(Boolean) ?? null
}

function normalizeArray(value, { splitStrings = false } = {}) {
  if (Array.isArray(value)) return value
  if (isObject(value)) return Object.values(value)
  if (typeof value !== 'string' || !value.trim()) return []
  return splitStrings ? value.split(',').map((item) => item.trim()).filter(Boolean) : [value.trim()]
}

function hasAuthExportValue(value) {
  if (Array.isArray(value)) return value.length > 0
  if (isObject(value)) return Object.keys(value).length > 0
  if (typeof value === 'string') return Boolean(value.trim())
  return value !== null && value !== undefined
}

function firebaseAuthProviderSubject(provider) {
  return normalizeId(firstPresent(
    provider.rawId,
    provider.federatedId,
    provider.uid,
    provider.userId,
  ))
}

function firebaseAuthPreflightFailure(report) {
  const summary = Object.entries(report.blockedReasonCounts)
    .map(([reason, count]) => `${reason} (${count})`)
    .join(', ')
  return [
    `Firebase Auth preflight rejected ${report.blockedAccounts.length} of ${report.totalUsers} account(s): ${summary}.`,
    'The Render target supports email password-reset continuity and stable Google identities only.',
    'No database writes were attempted. Run the same command with --preflight to inspect UID-only details.',
  ].join(' ')
}

function preflightFirebaseAuthExport(root) {
  const blockedAccounts = []
  const blockedReasonCounts = {}
  const accepted = {
    passwordResetEligible: 0,
    googleContinuityEligible: 0,
  }
  const sourceUsers = Array.isArray(root?.users) ? root.users : null

  if (!sourceUsers) {
    const reason = 'missing top-level users array'
    return {
      passed: false,
      totalUsers: 0,
      importableUsers: 0,
      ...accepted,
      blockedReasonCounts: { [reason]: 1 },
      blockedAccounts: [{ index: 0, uid: null, reasons: [reason] }],
    }
  }

  for (const [index, sourceRecord] of sourceUsers.entries()) {
    const reasons = new Set()
    const record = isObject(sourceRecord) ? sourceRecord : null
    const uid = record ? normalizeId(record.localId) : null
    let hasGoogleIdentity = false

    if (!record) {
      reasons.add('malformed Auth user record')
    } else {
      if (!uid) reasons.add('missing or invalid Firebase UID')
      if (record.isAnonymous === true || String(record.isAnonymous).toLowerCase() === 'true') {
        reasons.add('anonymous account')
      }
      if (hasAuthExportValue(record.phoneNumber)) reasons.add('phone authentication')
      if (hasAuthExportValue(record.tenantId) || hasAuthExportValue(record.tenant)) {
        reasons.add('Firebase multi-tenant account')
      }
      if (Object.entries(record).some(([key, value]) => (
        MFA_EXPORT_FIELD_KEYS.has(normalizedKey(key)) && hasAuthExportValue(value)
      ))) reasons.add('multi-factor authentication')

      const rawProviders = record.providerUserInfo
      if (rawProviders !== undefined && rawProviders !== null && !Array.isArray(rawProviders)) {
        reasons.add('malformed provider metadata')
      }
      const providers = Array.isArray(rawProviders) ? rawProviders : []
      const googleSubjects = new Set()
      for (const provider of providers) {
        if (!isObject(provider)) {
          reasons.add('malformed provider metadata')
          continue
        }
        const providerName = String(firstPresent(provider.providerId, provider.provider) ?? '').trim().toLowerCase()
        if (!providerName) {
          reasons.add('malformed provider metadata')
          continue
        }
        if (providerName === 'anonymous') reasons.add('anonymous account')
        if (providerName === 'phone' || providerName === 'phone.com' || hasAuthExportValue(provider.phoneNumber)) {
          reasons.add('phone authentication')
        }
        if (!SUPPORTED_FIREBASE_AUTH_PROVIDERS.has(providerName)) {
          reasons.add(`unsupported provider ${providerName}`)
          continue
        }
        if (providerName === 'google.com') {
          const subject = firebaseAuthProviderSubject(provider)
          if (!subject) {
            reasons.add('Google identity is missing a stable subject')
          } else {
            googleSubjects.add(subject)
            hasGoogleIdentity = true
          }
        }
      }
      if (googleSubjects.size > 1) reasons.add('conflicting Google identities')

      const email = normalizeEmail(firstPresent(record.email, record.emailAddress, firstProviderEmail(rawProviders)))
      if (!email) reasons.add('missing a usable email address for password reset')
    }

    if (reasons.size) {
      const sortedReasons = [...reasons].sort()
      blockedAccounts.push({ index: index + 1, uid, reasons: sortedReasons })
      for (const reason of sortedReasons) {
        blockedReasonCounts[reason] = (blockedReasonCounts[reason] ?? 0) + 1
      }
      continue
    }

    accepted.passwordResetEligible += 1
    if (hasGoogleIdentity) accepted.googleContinuityEligible += 1
  }

  return {
    passed: blockedAccounts.length === 0,
    totalUsers: sourceUsers.length,
    importableUsers: sourceUsers.length - blockedAccounts.length,
    ...accepted,
    blockedReasonCounts,
    blockedAccounts,
  }
}

function profileFromRecord(record) {
  const profile = isObject(record.profile) ? { ...record.profile } : {}
  for (const [key, value] of Object.entries(record)) {
    if (!AUTHORITATIVE_PROFILE_KEYS.has(normalizedKey(key))) profile[key] = value
  }
  return redactFirebaseStorageSecrets(sanitizeSensitive(profile))
}

function inventoryProfileAvatar(profile) {
  const persistedProfile = { ...profile }
  const hashes = new Set()
  let hasAvatarField = false
  let hasNonFirebaseAvatar = false
  for (const [key, value] of Object.entries(persistedProfile)) {
    if (!PROFILE_AVATAR_KEYS.has(normalizedKey(key))) continue
    hasAvatarField = true
    const hash = firebaseStorageReferenceHash(value)
    if (!hash) {
      const validatedAvatar = strictImportedBlogImage(value)
      if (validatedAvatar.error) return { error: `profile avatar ${validatedAvatar.error}` }
      if (value !== null && value !== undefined && String(value).trim()) hasNonFirebaseAvatar = true
      continue
    }
    hashes.add(hash)
    delete persistedProfile[key]
  }
  if (hashes.size > 1) {
    return { error: 'profile contains multiple distinct Firebase avatar references' }
  }
  if (hashes.size && hasNonFirebaseAvatar) {
    return { error: 'profile contains conflicting Firebase and non-Firebase avatar references' }
  }
  if (containsFirebaseStorageReference(persistedProfile)) {
    return { error: 'profile contains an unsupported Firebase Storage reference outside an avatar field' }
  }
  return { profile: persistedProfile, legacyAvatarUrlSha256: [...hashes][0] ?? null, hasAvatarField }
}

function profileWithProviderAvatar(profile, providerUserInfo) {
  if (Object.keys(profile).some((key) => PROFILE_AVATAR_KEYS.has(normalizedKey(key)))) return { profile }
  const providerAvatars = new Set(normalizeArray(providerUserInfo)
    .map((provider) => isObject(provider) ? firstPresent(provider.photoURL, provider.photoUrl, provider.avatarUrl) : null)
    .filter((value) => typeof value === 'string' && value.trim())
    .map((value) => value.trim()))
  if (providerAvatars.size > 1) return { error: 'authentication providers contain conflicting avatar references' }
  if (providerAvatars.size === 1) return { profile: { ...profile, avatarUrl: [...providerAvatars][0] } }
  return { profile }
}

function referencedUserId(value) {
  if (typeof value !== 'string') return normalizeId(value)
  return normalizeId(idFromDocumentPath(value) ?? value)
}

function authProviderIdentities(record, userId, fallbackEmail, sourceMode) {
  if (sourceMode !== 'auth') return []
  const identities = [{ provider: 'firebase', subject: userId, email: fallbackEmail }]
  const seenProviders = new Set(['firebase'])
  for (const provider of normalizeArray(record.providerUserInfo)) {
    if (!isObject(provider)) continue
    const providerName = String(firstPresent(provider.providerId, provider.provider) ?? '').trim().toLowerCase()
    const subject = normalizeId(firstPresent(provider.rawId, provider.federatedId, provider.uid, provider.userId))
    if (!providerName || !subject || seenProviders.has(providerName)) continue
    seenProviders.add(providerName)
    identities.push({
      provider: providerName,
      subject,
      email: normalizeEmail(provider.email) ?? fallbackEmail,
    })
  }
  return identities
}

function firestoreArchivePayload(user) {
  return {
    format: 'yahnu-legacy-firestore-user-archive-v1',
    id: user.id,
    email: user.email,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    schoolId: user.schoolId,
    schoolName: user.schoolName,
    companyName: user.companyName,
    contactName: user.contactName,
    industry: user.industry,
    experience: user.experience,
    education: user.education,
    skills: user.skills,
    phone: user.phone,
    profile: user.profile,
    legacyAvatarUrlSha256: user.legacyAvatarUrlSha256,
    hasAvatarField: user.hasAvatarField,
    emailVerifiedAt: user.emailVerifiedAt,
    lastLoginAt: user.lastLoginAt,
    sourceCreatedAt: user.createdAt,
    sourceUpdatedAt: user.sourceUpdatedAt,
  }
}

function normalizeUser(source, importTimestamp, sourceMode) {
  const decoded = materializeRecord(source.record)
  if (!decoded) return { error: 'record is not an object' }
  const rawRecord = sanitizeSensitive(decoded)
  const record = redactFirebaseStorageSecrets(rawRecord)
  const pathId = idFromDocumentPath(documentPath(source.record))
  const id = normalizeId(firstPresent(...(sourceMode === 'auth' ? [
    record.localId,
    record.uid,
    source.record.localId,
    source.record.uid,
    record.id,
    source.record.id,
  ] : [
    pathId,
    source.inferredId,
    record.documentId,
    record.__id__,
    record._id,
    source.record.documentId,
    source.record.__id__,
    source.record._id,
    record.id,
    source.record.id,
  ])))
  if (!id) return { error: 'missing or invalid Firebase UID/document ID' }

  const email = normalizeEmail(firstPresent(record.email, record.emailAddress, firstProviderEmail(record.providerUserInfo)))
  if (!email) return { error: 'missing or invalid email', id }

  const customClaims = {
    ...parseCustomClaims(record.customAttributes),
    ...parseCustomClaims(record.customClaims),
  }
  const roleResult = normalizeRole(firstPresent(record.role, record.userRole, record.accountType, customClaims.role))
  const statusResult = normalizeStatus(firstPresent(record.status, record.accountStatus), record.disabled)
  if (roleResult.defaulted) return { error: 'explicit user role is not supported by the Render application', id }
  if (statusResult.defaulted) return { error: 'explicit user status is not supported by the Render application', id }
  const hasExplicitStatus = firstPresent(record.status, record.accountStatus, record.disabled) !== undefined

  const firstName = String(record.firstName ?? '').trim() || null
  const lastName = String(record.lastName ?? '').trim() || null
  const joinedName = [firstName, lastName].filter(Boolean).join(' ') || null
  const fallbackName = email.slice(0, email.indexOf('@'))
  const importedName = String(firstPresent(
    record.name,
    record.displayName,
    record.fullName,
    joinedName,
    record.contactName,
    record.companyName,
    record.schoolName,
    fallbackName,
  )).trim()
  if (importedName.length > 500) return { error: 'user name exceeds 500 characters', id }
  const name = importedName || fallbackName

  const createdAt = normalizeDate(firstPresent(record.createdAt, record.creationTime, source.record.createTime))
  const sourceUpdatedAt = normalizeDate(firstPresent(
    record.updatedAt,
    record.lastUpdatedAt,
    source.record.updateTime,
  ))
  const explicitVerifiedAt = normalizeDate(record.emailVerifiedAt)
  const emailVerified = record.emailVerified === true || String(record.emailVerified).toLowerCase() === 'true'
  const emailVerifiedAt = explicitVerifiedAt ?? (emailVerified ? createdAt ?? importTimestamp : null)
  const providerProfile = profileWithProviderAvatar(profileFromRecord(record), record.providerUserInfo)
  if (providerProfile.error) return { error: providerProfile.error, id }
  const profileMedia = inventoryProfileAvatar(providerProfile.profile)
  if (profileMedia.error) return { error: profileMedia.error, id }
  const education = normalizeArray(record.education)
  const skills = normalizeArray(record.skills, { splitStrings: true })
  const phone = String(record.phone ?? record.phoneNumber ?? '').trim() || null
  if (containsFirebaseStorageReference([
    name, firstName, lastName, record.schoolName, record.companyName, record.contactName,
    record.industry, record.experience, education, skills, phone,
  ])) return { error: 'user profile fields contain an unsupported Firebase Storage or signed URL reference', id }

  const firestoreIdentityCandidateIds = sourceMode === 'firestore'
    ? [...new Set([
      record.localId,
      record.uid,
      record.userId,
      record.firebaseUid,
      record.id,
    ].map(referencedEntityId).filter(Boolean))]
    : []
  const firestoreIdentityCandidateEmails = sourceMode === 'firestore'
    ? [...new Set([
      record.email,
      record.emailAddress,
      ...normalizeArray(record.providerUserInfo).map((provider) => isObject(provider) ? provider.email : null),
    ].map(normalizeEmail).filter(Boolean))]
    : []
  const user = {
    id,
    email,
    name,
    firstName,
    lastName,
    role: roleResult.role,
    status: statusResult.status,
    schoolId: referencedUserId(record.schoolId),
    schoolName: String(record.schoolName ?? '').trim() || null,
    companyName: String(record.companyName ?? '').trim() || null,
    contactName: String(record.contactName ?? '').trim() || null,
    industry: String(record.industry ?? '').trim() || null,
    experience: String(record.experience ?? '').trim() || null,
    education,
    skills,
    phone,
    profile: profileMedia.profile,
    legacyAvatarUrlSha256: profileMedia.legacyAvatarUrlSha256,
    hasAvatarField: profileMedia.hasAvatarField,
    emailVerifiedAt,
    lastLoginAt: normalizeDate(firstPresent(record.lastLoginAt, record.lastSignIn, record.lastSignInTime)),
    createdAt,
    sourceUpdatedAt,
    hasExplicitStatus,
    firestoreSourceHash: sourceMode === 'firestore' ? sha256(stableJson(rawRecord)) : null,
    firestoreIdentityCandidateIds,
    firestoreIdentityCandidateEmails,
    identities: authProviderIdentities(record, id, email, sourceMode),
  }
  if (sourceMode === 'firestore') user.firestoreArchivePayload = firestoreArchivePayload(user)

  return {
    user,
    roleDefaulted: roleResult.defaulted,
    statusDefaulted: statusResult.defaulted,
  }
}

function sourceRecordId(source, collectionName, record = materializeRecord(source.record)) {
  const pathId = idFromCollectionPath(documentPath(source.record), collectionName)
  return normalizeId(firstPresent(
    pathId,
    source.inferredId,
    source.record.id,
    source.record.documentId,
    source.record.__id__,
    source.record._id,
    record?.id,
    record?.documentId,
    record?.__id__,
    record?._id,
  ))
}

function mergeNestedPayload(record, identifyingKeys) {
  if (!isObject(record?.data)) return record
  const keys = new Set(Object.keys(record).map(normalizedKey))
  if (identifyingKeys.some((key) => keys.has(key))) return record
  const { data, ...metadata } = record
  return { ...metadata, ...data }
}

function extraRecordData(record, excludedKeys) {
  const result = {}
  for (const [key, value] of Object.entries(record)) {
    if (!excludedKeys.has(normalizedKey(key))) result[key] = value
  }
  return redactFirebaseStorageSecrets(sanitizeSensitive(result))
}

function legacyInviteDatabaseId(rawToken) {
  // The previous Firebase client used the Firestore document ID as the public
  // registration token. Keep that token only long enough to create its HMAC;
  // it must never become a PostgreSQL primary key or appear in administrative
  // identifiers.
  return `firebase-invite-${sha256(`legacy-invite-id:${rawToken}`).slice(0, 48)}`
}

function normalizeInvite(source, importTimestamp, sourceIndex) {
  const decoded = materializeRecord(source.record)
  if (!decoded) return { error: 'record is not an object' }
  const record = sanitizeSensitive(mergeNestedPayload(decoded, ['email', 'emailaddress', 'invitetoken', 'token']))
  const sourceId = sourceRecordId(source, 'invites', record)
  if (!sourceId) return { error: 'missing or invalid document ID' }

  const rawTokenValue = firstPresent(record.token, record.inviteToken, record.rawToken, sourceId)
  const rawToken = typeof rawTokenValue === 'string' ? rawTokenValue.trim() : ''
  if (!rawToken || rawToken.length > 4_096) return { error: 'missing or invalid legacy token' }
  const id = rawToken === sourceId ? legacyInviteDatabaseId(rawToken) : sourceId

  const email = normalizeEmail(firstPresent(record.email, record.emailAddress))
  if (!email) return { error: 'missing or invalid email' }
  const role = ROLE_MAP.get(normalizeEnum(firstPresent(record.role, record.userRole, record.accountType)))
  if (!role || !INVITE_ROLES.has(role)) return { error: 'missing or unsupported staff role' }

  const createdBy = referencedUserId(firstPresent(
    record.createdBy,
    record.created_by,
    record.createdById,
    record.invitedBy,
    record.actorId,
    record.userId,
  ))

  const sourceCreatedAt = normalizeDate(firstPresent(record.createdAt, record.creationTime, source.record.createTime))
  const createdAt = sourceCreatedAt ?? importTimestamp
  const importTime = Date.parse(importTimestamp)
  const createdTime = Date.parse(createdAt)
  const suppliedExpiry = normalizeDate(firstPresent(record.expiresAt, record.expiry, record.expirationTime))
  const suppliedExpiryTime = suppliedExpiry ? Date.parse(suppliedExpiry) : Number.POSITIVE_INFINITY
  const rawStatus = normalizeEnum(record.status)
  let status = rawStatus ? INVITE_STATUS_MAP.get(rawStatus) ?? 'revoked' : 'pending'
  let expiresAt

  if (status === 'pending') {
    const expiryTime = Math.min(
      importTime + SEVEN_DAYS_MS,
      Number.isFinite(createdTime) ? createdTime + SEVEN_DAYS_MS : Number.POSITIVE_INFINITY,
      Number.isFinite(suppliedExpiryTime) ? suppliedExpiryTime : Number.POSITIVE_INFINITY,
    )
    expiresAt = new Date(expiryTime).toISOString()
    if (expiryTime <= importTime) status = 'expired'
  } else {
    const fallbackExpiry = Number.isFinite(createdTime) ? createdTime + SEVEN_DAYS_MS : importTime
    expiresAt = Number.isFinite(suppliedExpiryTime) ? suppliedExpiry : new Date(fallbackExpiry).toISOString()
  }

  return {
    invite: {
      id,
      rawToken,
      email,
      role,
      status,
      createdBy,
      usedBy: referencedUserId(firstPresent(record.usedBy, record.used_by, record.acceptedBy)),
      expiresAt,
      createdAt,
      usedAt: normalizeDate(firstPresent(record.usedAt, record.acceptedAt)),
      hasSourceTimestamp: Boolean(sourceCreatedAt),
      sourceIndex,
    },
  }
}

function normalizeTicket(source, importTimestamp, sourceIndex) {
  const decoded = materializeRecord(source.record)
  if (!decoded) return { error: 'record is not an object' }
  const record = redactFirebaseStorageSecrets(sanitizeSensitive(mergeNestedPayload(decoded, ['message', 'description'])))
  const id = sourceRecordId(source, 'tickets', record)
  if (!id) return { error: 'missing or invalid document ID' }
  if (!routeCompatibleId(id, 200)) return { error: 'ticket ID exceeds the 200-character route limit', id }

  const userId = referencedUserId(firstPresent(record.userId, record.user_id, record.createdBy, record.uid))
  if (!userId) return { error: 'missing user ID', id }
  const description = strictImportedText(String(firstPresent(record.description, record.message) ?? ''), 'description/message', 20, 10_000)
  if (description.error) return { error: description.error, id }
  const subject = strictOptionalImportedText(record.subject, 'subject', 200, 5)
  if (subject.error) return { error: subject.error, id }
  if (containsFirebaseStorageReference(subject.value) || containsFirebaseStorageReference(description.value)) {
    return { error: 'ticket text contains an unsupported Firebase Storage reference', id }
  }

  const rawStatus = normalizeEnum(record.status)
  const status = rawStatus ? TICKET_STATUS_MAP.get(rawStatus) : 'open'
  if (!status) return { error: `unsupported ticket status (${rawStatus})`, id }
  const rawPriority = normalizeEnum(record.priority)
  const priority = rawPriority || 'normal'
  if (!['low', 'normal', 'high', 'urgent'].includes(priority)) {
    return { error: `unsupported ticket priority (${rawPriority})`, id }
  }
  const rawType = normalizeEnum(record.type)
  if (rawType && rawType !== 'support') return { error: `unsupported ticket type (${rawType})`, id }
  const sourceSubmittedAt = normalizeDate(firstPresent(
    record.submittedAt,
    record.createdAt,
    record.creationTime,
    source.record.createTime,
  ))
  const sourceUpdatedAt = normalizeDate(firstPresent(record.updatedAt, source.record.updateTime))
  const submittedAt = sourceSubmittedAt ?? importTimestamp
  const updatedAt = sourceUpdatedAt ?? submittedAt
  const excluded = new Set([
    'id', 'documentid', 'userid', 'uid', 'createdby', 'description', 'message',
    'subject', 'status', 'type', 'priority', 'submittedat', 'createdat', 'updatedat',
    'creationtime', 'key', 'name', 'collections',
  ])

  return {
    ticket: {
      id,
      userId,
      type: 'support',
      subject: subject.value,
      description: description.value,
      status,
      priority,
      metadata: extraRecordData(record, excluded),
      submittedAt,
      updatedAt,
      hasSourceTimestamp: Boolean(sourceUpdatedAt || sourceSubmittedAt),
      sourceIndex,
    },
  }
}

const SUPPORTED_PAGE_IDS = new Set(['about-us', 'privacy-policy', 'terms-of-service'])
const UNSAFE_PAGE_HTML = /<\s*(?:script|iframe|object|embed|style|link|meta|form)\b|(?:\s|\/)on[a-z]+\s*=|(?:href|src)\s*=\s*["']?\s*(?:javascript|vbscript|data)\s*:/i
const LOCAL_IMAGE_PATH = /^\/(?!\/)(?!\.\.(?:\/|$))(?!.*\/\.\.(?:\/|$))[^?#\\\u0000-\u001f]+$/

function requiredImportedText(value, maximum) {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text && text.length <= maximum ? text : null
}

function importedRichText(value) {
  return typeof value === 'string' && value.length <= 100_000 && !UNSAFE_PAGE_HTML.test(value) ? value : null
}

function normalizeImportedPageData(id, sourceData) {
  if (!SUPPORTED_PAGE_IDS.has(id)) return { error: 'page ID is not supported by the Render application' }
  const warnings = []
  const safetyNormalizations = []

  if (id !== 'about-us') {
    const title = requiredImportedText(sourceData.title, 300)
    const lastUpdated = requiredImportedText(sourceData.lastUpdated, 100)
    const content = importedRichText(sourceData.content)
    if (!title || !lastUpdated || content === null) return { error: 'legal page data does not match the supported schema' }
    if (Object.keys(sourceData).some((key) => !['title', 'lastUpdated', 'content'].includes(key))) {
      warnings.push('stale fields were removed from legal page content')
    }
    return { data: { title, lastUpdated, content }, warnings, safetyNormalizations }
  }

  const textFields = [
    ['aboutTitle', 300], ['aboutSubtitle', 2_000], ['storyTitle', 300],
    ['missionTitle', 300], ['visionTitle', 300], ['valuesTitle', 300],
  ]
  const richTextFields = ['storyContent1', 'storyContent2', 'missionContent', 'visionContent', 'valuesContent']
  const data = {}
  for (const [key, maximum] of textFields) {
    const value = requiredImportedText(sourceData[key], maximum)
    if (!value) return { error: `about page field ${key} is missing or invalid` }
    data[key] = value
  }
  for (const key of richTextFields) {
    const value = importedRichText(sourceData[key])
    if (value === null) return { error: `about page field ${key} contains invalid markup or is too large` }
    data[key] = value
  }

  if (sourceData.teamMembers !== undefined) {
    if (!Array.isArray(sourceData.teamMembers)) return { error: 'about page teamMembers must be an array' }
    const teamMembers = []
    let droppedMembers = 0
    let replacedImages = 0
    for (const member of sourceData.teamMembers.slice(0, 50)) {
      if (!isObject(member)) {
        droppedMembers += 1
        continue
      }
      const name = requiredImportedText(member.name, 160)
      const role = requiredImportedText(member.role, 160)
      if (!name || !role) {
        droppedMembers += 1
        continue
      }
      const rawImage = typeof member.imageUrl === 'string' ? member.imageUrl.trim() : ''
      const imageUrl = rawImage === '' || (rawImage.length <= 2_048 && LOCAL_IMAGE_PATH.test(rawImage)) ? rawImage : ''
      if (rawImage && !imageUrl) replacedImages += 1
      teamMembers.push({ name, role, imageUrl })
    }
    if (sourceData.teamMembers.length > 50) droppedMembers += sourceData.teamMembers.length - 50
    if (droppedMembers) warnings.push(`${droppedMembers} invalid or excess team member(s) were removed`)
    if (replacedImages) safetyNormalizations.push(`${replacedImages} remote or unsafe team image path(s) were replaced with placeholders`)
    data.teamMembers = teamMembers
  }

  const allowedKeys = new Set([...textFields.map(([key]) => key), ...richTextFields, 'teamMembers'])
  if (Object.keys(sourceData).some((key) => !allowedKeys.has(key))) warnings.push('stale fields were removed from about page content')
  return { data, warnings, safetyNormalizations }
}

function normalizeImportedReports(value) {
  if (!isObject(value)) {
    return {
      reports: {},
      warnings: value === undefined ? [] : ['dashboard reports were not an object and were reset'],
      safetyNormalizations: [],
    }
  }
  const reports = {}
  let dropped = 0
  for (const [id, report] of Object.entries(value).slice(0, 100)) {
    if (
      !id.trim() || id.length > 100 || !isObject(report) ||
      !['graduates', 'companies', 'applications'].includes(report.dataSource) ||
      !['bar', 'pie', 'count'].includes(report.visualization) ||
      !requiredImportedText(report.title, 160)
    ) {
      dropped += 1
      continue
    }
    reports[id] = {
      dataSource: report.dataSource,
      visualization: report.visualization,
      title: report.title.trim(),
    }
  }
  if (Object.keys(value).length > 100) dropped += Object.keys(value).length - 100
  return {
    reports,
    warnings: dropped ? [`${dropped} invalid or excess dashboard report(s) were removed`] : [],
    safetyNormalizations: [],
  }
}

function normalizeImportedLayouts(value, reports) {
  if (!isObject(value)) {
    return {
      layouts: {},
      warnings: value === undefined ? [] : ['dashboard layouts were not an object and were reset'],
      safetyNormalizations: [],
    }
  }
  const layouts = {}
  const warnings = []
  const safetyNormalizations = []
  let dropped = 0
  let repositioned = 0
  const entries = Object.entries(value).slice(0, 5)

  for (const [breakpoint, items] of entries) {
    if (!breakpoint || breakpoint.length > 50 || !Array.isArray(items)) {
      dropped += Array.isArray(items) ? items.length : 1
      continue
    }
    const normalizedItems = []
    const seenIds = new Set()
    let bottom = 0
    for (const item of items.slice(0, 100)) {
      if (!isObject(item)) {
        dropped += 1
        continue
      }
      const id = typeof item.i === 'string' ? item.i.trim() : ''
      const validNumber = (number, minimum, maximum) => Number.isInteger(number) && number >= minimum && number <= maximum
      if (
        !id || id.length > 100 || seenIds.has(id) || !Object.hasOwn(reports, id) ||
        !validNumber(item.x, 0, 10_000) || !validNumber(item.w, 1, 100) || !validNumber(item.h, 1, 100)
      ) {
        dropped += 1
        continue
      }
      let y = item.y
      if (y === null || y === 'Infinity' || y === Number.POSITIVE_INFINITY) {
        y = bottom
        repositioned += 1
      }
      if (!validNumber(y, 0, 100_000)) {
        dropped += 1
        continue
      }
      normalizedItems.push({ i: id, x: item.x, y, w: item.w, h: item.h })
      seenIds.add(id)
      bottom = Math.max(bottom, y + item.h)
    }
    if (items.length > 100) dropped += items.length - 100
    layouts[breakpoint] = normalizedItems
  }
  if (Object.keys(value).length > 5) dropped += Object.keys(value).length - 5
  if (dropped) warnings.push(`${dropped} invalid, orphaned, or excess dashboard layout item(s) were removed`)
  if (repositioned) safetyNormalizations.push(`${repositioned} bottom-positioned dashboard item(s) were assigned finite rows`)
  return { layouts, warnings, safetyNormalizations }
}

function normalizePage(source, importTimestamp, sourceIndex) {
  const decoded = materializeRecord(source.record)
  if (!decoded) return { error: 'record is not an object' }
  const record = redactFirebaseStorageSecrets(sanitizeSensitive(mergeNestedPayload(decoded, [
    'abouttitle', 'storytitle', 'content', 'lastupdated', 'teammembers',
  ])))
  const id = sourceRecordId(source, 'pages', record)
  if (!id || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/.test(id)) return { error: 'missing or unsafe page ID' }

  const sourceCreatedAt = normalizeDate(firstPresent(record.createdAt, record.creationTime, source.record.createTime))
  const sourceUpdatedAt = normalizeDate(firstPresent(record.updatedAt, source.record.updateTime))
  const createdAt = sourceCreatedAt ?? importTimestamp
  const updatedAt = sourceUpdatedAt ?? createdAt
  const excluded = new Set([
    'id', 'documentid', 'createdat', 'updatedat', 'creationtime', 'updatedby',
    'key', 'name', 'collections',
  ])
  const pageData = normalizeImportedPageData(id, extraRecordData(record, excluded))
  if (pageData.error) return { error: pageData.error }
  if (containsFirebaseStorageReference(pageData.data)) {
    return { error: 'page content contains an unsupported Firebase Storage reference' }
  }

  return {
    page: {
      id,
      data: pageData.data,
      updatedBy: referencedUserId(firstPresent(record.updatedBy, record.updated_by)),
      createdAt,
      updatedAt,
      hasSourceTimestamp: Boolean(sourceUpdatedAt || sourceCreatedAt),
      sourceIndex,
    },
    warnings: pageData.warnings,
    safetyNormalizations: pageData.safetyNormalizations,
  }
}

function normalizeDashboard(source, importTimestamp, sourceIndex) {
  const decoded = materializeRecord(source.record)
  if (!decoded) return { error: 'record is not an object' }
  const record = redactFirebaseStorageSecrets(sanitizeSensitive(mergeNestedPayload(decoded, ['layouts', 'reports'])))
  const documentId = sourceRecordId(source, 'dashboards', record)
  const userId = referencedUserId(firstPresent(record.userId, record.user_id, documentId))
  if (!userId) return { error: 'missing user/document ID' }

  const sourceUpdatedAt = normalizeDate(firstPresent(record.updatedAt, source.record.updateTime))
  const normalizedReports = normalizeImportedReports(record.reports)
  const normalizedLayouts = normalizeImportedLayouts(record.layouts, normalizedReports.reports)
  return {
    dashboard: {
      userId,
      layouts: normalizedLayouts.layouts,
      reports: normalizedReports.reports,
      updatedAt: sourceUpdatedAt ?? importTimestamp,
      hasSourceTimestamp: Boolean(sourceUpdatedAt),
      sourceIndex,
    },
    warnings: [...normalizedReports.warnings, ...normalizedLayouts.warnings],
    safetyNormalizations: [
      ...normalizedReports.safetyNormalizations,
      ...normalizedLayouts.safetyNormalizations,
    ],
  }
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

function referencedEntityId(value) {
  if (isObject(value)) return normalizeId(firstPresent(value.id, value.uid, value.userId, value.ref, value.path))
  if (typeof value === 'string') {
    const segments = value.split('/').filter(Boolean)
    return normalizeId(segments.at(-1) ?? value)
  }
  return normalizeId(value)
}

function baseSourceRecord(source, collectionName, importTimestamp) {
  const decoded = materializeRecord(source.record)
  if (!decoded) return { error: 'record is not an object' }
  const sanitizedPayload = sanitizeSensitive(decoded)
  const payload = redactFirebaseStorageSecrets(sanitizedPayload)
  const id = sourceRecordId(source, collectionName, payload)
  if (!id) return { error: 'missing or invalid document ID' }
  const createdAt = normalizeDate(firstPresent(payload.createdAt, payload.creationTime, source.record.createTime)) ?? importTimestamp
  const sourceUpdatedAt = normalizeDate(firstPresent(payload.updatedAt, payload.lastUpdatedAt, source.record.updateTime))
  return {
    id,
    payload,
    sourceHash: sha256(stableJson(sanitizedPayload)),
    createdAt,
    updatedAt: sourceUpdatedAt ?? createdAt,
    hasSourceTimestamp: Boolean(sourceUpdatedAt || source.record.createTime || payload.createdAt),
  }
}

function strictImportedText(value, label, minimum, maximum) {
  if (typeof value !== 'string') return { error: `${label} is missing` }
  const text = value.trim()
  if (text.length < minimum || text.length > maximum) {
    return { error: `${label} must contain between ${minimum} and ${maximum} characters` }
  }
  return { value: text }
}

function strictOptionalImportedText(value, label, maximum, minimum = 1) {
  if (value === null || value === undefined || (typeof value === 'string' && !value.trim())) return { value: null }
  return strictImportedText(String(value), label, minimum, maximum)
}

function strictImportedHttpUrl(value, label) {
  const text = strictOptionalImportedText(value, label, 2_048)
  if (text.error || text.value === null) return text
  try {
    const parsed = new URL(text.value)
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) {
      return { error: `${label} must be a valid HTTP or HTTPS URL` }
    }
  } catch {
    return { error: `${label} must be a valid HTTP or HTTPS URL` }
  }
  if (containsFirebaseStorageReference(text.value)) {
    return { error: `${label} contains an unsupported Firebase Storage reference` }
  }
  return text
}

const ALLOWED_IMPORTED_HTML_TAGS = new Set([
  'a', 'p', 'br', 'strong', 'em', 'u', 's', 'blockquote', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li',
])
const FORBIDDEN_IMPORTED_MARKUP = /<\s*(?:script|iframe|object|embed|style|link|meta|form|input|button|svg|math)\b|(?:\s|\/)on[a-z]+\s*=|\s(?:style|srcdoc)\s*=/i
const IMPORTED_TAG_PATTERN = /<\/?\s*([a-z][a-z0-9-]*)\b[^>]*>/gi
const IMPORTED_HREF_PATTERN = /\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi

function decodeImportedUrlForValidation(value) {
  return value
    .replace(/&#x0*([0-9a-f]+);?/gi, (_match, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#0*([0-9]+);?/g, (_match, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&colon;/gi, ':')
    .replace(/&tab;|&newline;/gi, '')
    .replace(/[\u0000-\u0020\u007f]+/g, '')
    .toLowerCase()
}

function isValidatedImportedHtml(value) {
  if (FORBIDDEN_IMPORTED_MARKUP.test(value)) return false
  IMPORTED_TAG_PATTERN.lastIndex = 0
  for (let match = IMPORTED_TAG_PATTERN.exec(value); match; match = IMPORTED_TAG_PATTERN.exec(value)) {
    if (!ALLOWED_IMPORTED_HTML_TAGS.has(match[1].toLowerCase())) return false
  }
  IMPORTED_HREF_PATTERN.lastIndex = 0
  for (let match = IMPORTED_HREF_PATTERN.exec(value); match; match = IMPORTED_HREF_PATTERN.exec(value)) {
    const href = decodeImportedUrlForValidation(match[1] ?? match[2] ?? match[3] ?? '')
    if (!/^(?:https?:|mailto:|\/(?!\/)|#)/.test(href)) return false
  }
  return true
}

function strictOptionalImportedDate(value, label) {
  if (value === null || value === undefined || value === '') return { value: null }
  const normalized = normalizeDate(value)
  return normalized ? { value: normalized } : { error: `${label} must be a valid date` }
}

function strictImportedBlogImage(value) {
  if (value === null || value === undefined || value === '') return { value: null }
  if (typeof value !== 'string') return { error: 'image URL must be a string' }
  const imageUrl = value.trim()
  if (imageUrl.length > 2_048) return { error: 'image URL exceeds 2048 characters' }
  if (firebaseStorageReferenceHash(imageUrl)) return { value: canonicalFirebaseStorageReference(imageUrl) }
  if (/^\/(?!\/)(?!.*\\)[^\u0000-\u001f\u007f]*$/.test(imageUrl)) return { value: imageUrl }
  try {
    const parsed = new URL(imageUrl)
    if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username || parsed.password) {
      return { error: 'image URL must use HTTPS or a safe local path' }
    }
    return { value: imageUrl }
  } catch {
    return { error: 'image URL must use HTTPS or a safe local path' }
  }
}

function blogSlugCandidate(baseSlug, postId, collisionSeed, hashLength) {
  const digest = collisionSeed === 0
    ? sha256(postId)
    : sha256(`${postId}:blog-slug-collision:${collisionSeed}`)
  const suffix = `-${digest.slice(0, hashLength)}`
  const stem = baseSlug.slice(0, 120 - suffix.length).replace(/-+$/, '')
  return `${stem}${suffix}`
}

function compareBlogSlugPriority(left, right) {
  const leftTimestamp = left.slugPriorityAt ?? ''
  const rightTimestamp = right.slugPriorityAt ?? ''
  return leftTimestamp.localeCompare(rightTimestamp) || left.id.localeCompare(right.id)
}

function disambiguateBlogSlugs(posts) {
  const bySlug = new Map()
  const occupiedSlugs = new Set(posts.map((post) => post.slug))
  const resolvedSlugs = new Map()

  for (const post of posts) {
    const group = bySlug.get(post.slug) ?? []
    group.push(post)
    bySlug.set(post.slug, group)
  }

  for (const [slug, group] of bySlug) {
    if (group.length < 2) continue
    const sorted = [...group].sort(compareBlogSlugPriority)
    for (const post of sorted.slice(1)) {
      let candidate = null
      for (let collisionSeed = 0; collisionSeed < 1024 && !candidate; collisionSeed += 1) {
        for (const hashLength of [8, 12, 16, 24, 32, 48, 64]) {
          const next = blogSlugCandidate(slug, post.id, collisionSeed, hashLength)
          if (!occupiedSlugs.has(next)) {
            candidate = next
            break
          }
        }
      }
      if (!candidate) throw new Error('Unable to deterministically disambiguate duplicate blog slugs.')
      occupiedSlugs.add(candidate)
      resolvedSlugs.set(post.id, candidate)
    }
  }

  return {
    posts: posts.map((post) => resolvedSlugs.has(post.id)
      ? { ...post, slug: resolvedSlugs.get(post.id) }
      : post),
    slugDisambiguated: resolvedSlugs.size,
  }
}

function normalizeBlogPost(source, importTimestamp) {
  const base = baseSourceRecord(source, 'blogPosts', importTimestamp)
  if (base.error) return base
  if (!routeCompatibleId(base.id, 200, /^[A-Za-z0-9_-]+$/)) {
    return { error: 'blog ID must use 1-200 ASCII letters, digits, underscores, or hyphens', id: base.id }
  }
  const record = base.payload
  const title = strictImportedText(record.title, 'title', 3, 240)
  if (title.error) return { error: title.error, id: base.id }
  const slug = strictImportedText(firstPresent(record.slug, record.handle), 'slug', 3, 120)
  if (slug.error || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.value)) {
    return { error: slug.error ?? 'slug contains unsupported characters', id: base.id }
  }
  const author = strictImportedText(firstPresent(record.author, record.authorName), 'author', 2, 160)
  if (author.error) return { error: author.error, id: base.id }
  const excerpt = strictImportedText(firstPresent(record.excerpt, record.summary), 'excerpt', 10, 500)
  if (excerpt.error) return { error: excerpt.error, id: base.id }
  const content = strictImportedText(firstPresent(record.content, record.body, record.contentHtml), 'content', 1, 200_000)
  if (content.error) return { error: content.error, id: base.id }
  if (!isValidatedImportedHtml(content.value)) return { error: 'content contains unsupported HTML markup', id: base.id }
  if (containsFirebaseStorageReference([title.value, excerpt.value, content.value])) {
    return { error: 'blog text contains an unsupported Firebase Storage reference; only the image field is mapped', id: base.id }
  }
  const contentPlainText = content.value.replace(/<[^>]*>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim()
  if (contentPlainText.length < 50) return { error: 'content must contain at least 50 visible characters', id: base.id }
  const image = strictImportedBlogImage(firstPresent(record.imageUrl, record.imageURL, record.featuredImage))
  if (image.error) return { error: image.error, id: base.id }
  const legacyImageUrlSha256 = firebaseStorageReferenceHash(image.value)
  const rawStatus = normalizeEnum(record.status)
  if (!['draft', 'published'].includes(rawStatus)) return { error: 'status must be draft or published', id: base.id }
  const slugPriorityAt = normalizeDate(firstPresent(
    record.publishedAt,
    record.createdAt,
    record.creationTime,
    source.record.createTime,
    record.updatedAt,
    source.record.updateTime,
  ))
  return {
    post: {
      ...base,
      slug: slug.value,
      title: title.value,
      excerpt: excerpt.value,
      content: content.value,
      status: rawStatus,
      authorRef: referencedEntityId(firstPresent(record.authorId, record.createdBy, record.userId)),
      authorName: author.value,
      imageUrl: legacyImageUrlSha256 ? null : image.value,
      legacyImageUrlSha256,
      publishedAt: normalizeDate(firstPresent(record.publishedAt, rawStatus === 'published' ? record.updatedAt : null)),
      // Deliberately separate from base.createdAt: the latter may be the
      // current import time when legacy source timestamps are absent.
      slugPriorityAt,
    },
  }
}

function normalizeParticipant(value, index, conversationId, joinedAt) {
  const participant = isObject(value) ? sanitizeSensitive(value) : {}
  const ref = referencedEntityId(isObject(value)
    ? firstPresent(participant.id, participant.uid, participant.userId, participant.ref)
    : value)
  if (!ref) return { error: `participant ${index + 1} has no valid user reference` }
  const unread = Number(firstPresent(participant.unreadCount, participant.unread, 0))
  const displayName = strictOptionalImportedText(firstPresent(participant.name, participant.displayName), 'participant name', 500)
  if (displayName.error) return { error: displayName.error }
  return {
    ref,
    displayName: displayName.value,
    unreadCount: Number.isSafeInteger(unread) && unread >= 0 ? unread : 0,
    joinedAt: normalizeDate(participant.joinedAt) ?? joinedAt,
    metadata: isObject(value) ? participant : { sourceIndex: index, conversationId },
  }
}

function normalizeConversationMessage(value, index, conversationId, fallbackTimestamp) {
  if (!isObject(value)) return { error: `message ${index + 1} is not an object` }
  const payload = sanitizeSensitive(value)
  const sourceHash = sha256(stableJson(payload))
  const originalId = normalizeId(firstPresent(payload.id, payload.messageId))
  const id = originalId
    ? `${conversationId}:${originalId}`
    : `${conversationId}:generated:${sourceHash.slice(0, 32)}:${index}`
  const body = strictOptionalImportedText(firstPresent(payload.text, payload.body, payload.message), 'message body', 10_000, 0)
  if (body.error) return { error: `message ${index + 1}: ${body.error}` }
  if (containsFirebaseStorageReference(body.value)) {
    return { error: `message ${index + 1} body contains an unsupported Firebase Storage reference` }
  }
  const attachmentUrl = strictOptionalImportedText(
    firstPresent(payload.attachmentUrl, payload.fileUrl, payload.imageUrl),
    'message attachment URL',
    8_192,
  )
  if (attachmentUrl.error) return { error: `message ${index + 1}: ${attachmentUrl.error}` }
  const legacyAttachmentUrlSha256 = firebaseStorageReferenceHash(attachmentUrl.value)
  if (attachmentUrl.value && !legacyAttachmentUrlSha256) {
    return { error: `message ${index + 1} attachment is not an inventory-backed Firebase Storage reference` }
  }
  return { message: {
    id,
    conversationId,
    senderRef: referencedEntityId(firstPresent(payload.senderId, payload.userId, payload.authorId, payload.from)),
    body: body.value ?? '',
    legacyAttachmentUrlSha256,
    sourceIndex: index,
    payload,
    sourceHash,
    sentAt: normalizeDate(firstPresent(payload.timestamp, payload.sentAt, payload.createdAt)) ?? fallbackTimestamp,
    editedAt: normalizeDate(firstPresent(payload.editedAt, payload.updatedAt)),
  } }
}

function normalizeConversation(source, importTimestamp) {
  const base = baseSourceRecord(source, 'conversations', importTimestamp)
  if (base.error) return base
  if (!routeCompatibleId(base.id, 240)) return { error: 'conversation ID exceeds the 240-character route limit', id: base.id }
  const record = base.payload
  const participantValues = normalizeArray(record.participants)
  if (!participantValues.length) return { error: 'conversation has no participants', id: base.id }
  const normalizedParticipants = participantValues
    .map((value, index) => normalizeParticipant(value, index, base.id, base.createdAt))
  const invalidParticipant = normalizedParticipants.find((value) => value?.error)
  if (invalidParticipant) return { error: invalidParticipant.error, id: base.id }
  const participants = normalizedParticipants
  if (containsFirebaseStorageReference(participants.map((participant) => ({
    displayName: participant.displayName,
    metadata: participant.metadata,
  })))) return { error: 'conversation participant data contains an unsupported Firebase Storage reference', id: base.id }
  const normalizedMessages = normalizeArray(record.messages)
    .map((value, index) => normalizeConversationMessage(value, index, base.id, base.createdAt))
  const invalidMessage = normalizedMessages.find((value) => value.error)
  if (invalidMessage) return { error: invalidMessage.error, id: base.id }
  const messages = normalizedMessages.map((value) => value.message)
  const lastMessage = strictOptionalImportedText(
    firstPresent(record.lastMessage, messages.at(-1)?.body),
    'last message',
    10_000,
    0,
  )
  if (lastMessage.error) return { error: lastMessage.error, id: base.id }
  const name = strictOptionalImportedText(firstPresent(record.name, record.title), 'conversation name', 500, 0)
  if (name.error) return { error: name.error, id: base.id }
  const avatar = strictImportedBlogImage(firstPresent(record.avatar, record.avatarUrl))
  if (avatar.error) return { error: `conversation avatar ${avatar.error}`, id: base.id }
  const legacyAvatarUrlSha256 = firebaseStorageReferenceHash(avatar.value)
  if (containsFirebaseStorageReference([name.value, lastMessage.value])) {
    return { error: 'conversation text contains an unsupported Firebase Storage reference', id: base.id }
  }
  const lastMessageAt = normalizeDate(firstPresent(
    record.lastMessageTimestamp,
    record.lastMessageAt,
    messages.at(-1)?.sentAt,
    base.updatedAt,
  )) ?? base.updatedAt
  return {
    conversation: {
      ...base,
      name: name.value ?? '',
      avatarUrl: legacyAvatarUrlSha256 ? null : avatar.value,
      legacyAvatarUrlSha256,
      ticketRef: referencedEntityId(record.ticketId),
      lastMessage: lastMessage.value,
      lastMessageAt,
      participants,
      messages,
    },
  }
}

function normalizeLocalLink(value) {
  if (typeof value !== 'string' || value.length > 8_192) return null
  const link = value.trim()
  if (!link || !/^\/(?!\/)/.test(link) || /[\\\u0000-\u001f\u007f]/.test(link)) return null
  try {
    const parsed = new URL(link, 'https://yahnu.invalid')
    if (parsed.origin !== 'https://yahnu.invalid') return null
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
}

function normalizeNotification(source, importTimestamp) {
  const base = baseSourceRecord(source, 'notifications', importTimestamp)
  if (base.error) return base
  if (!routeCompatibleId(base.id, 500)) return { error: 'notification ID exceeds the 500-character PATCH limit', id: base.id }
  const record = base.payload
  const recipientRef = referencedEntityId(firstPresent(
    record.userId, record.recipientId, record.targetUserId, record.recipient,
  ))
  const explicitReadAt = normalizeDate(record.readAt)
  const hasReadFlag = record.read === true || record.isRead === true
  const readAt = explicitReadAt ?? (hasReadFlag ? base.updatedAt : null)
  const body = strictOptionalImportedText(
    firstPresent(record.text, record.message, record.body, record.description),
    'notification body',
    10_000,
    0,
  )
  if (body.error) return { error: body.error, id: base.id }
  const title = strictOptionalImportedText(record.title, 'notification title', 500, 0)
  if (title.error) return { error: title.error, id: base.id }
  const type = strictOptionalImportedText(record.type, 'notification type', 100)
  if (type.error) return { error: type.error, id: base.id }
  if (containsFirebaseStorageReference([body.value, title.value, type.value])) {
    return { error: 'notification text contains an unsupported Firebase Storage reference', id: base.id }
  }
  const rawLink = firstPresent(record.link, record.url, record.href)
  const link = normalizeLocalLink(rawLink)
  if (rawLink && !link) return { error: 'notification link must be a safe same-origin path', id: base.id }
  const rawAudienceRole = firstPresent(
    record.recipientRole, record.role, record.audienceRole, record.targetRole, record.audience,
  )
  const normalizedRawAudience = normalizeEnum(rawAudienceRole)
  const isGlobal = record.isGlobal === true
    || record.global === true
    || GLOBAL_AUDIENCE_ALIASES.has(normalizedRawAudience)
  const audienceRole = isGlobal ? null : ROLE_MAP.get(normalizedRawAudience)
  if (rawAudienceRole && !isGlobal && !audienceRole) {
    return { error: `unsupported notification audience role (${normalizedRawAudience})`, id: base.id }
  }
  const audienceCount = Number(Boolean(recipientRef)) + Number(Boolean(audienceRole)) + Number(isGlobal)
  if (audienceCount !== 1) {
    return { error: audienceCount ? 'notification has conflicting audiences' : 'notification has no explicit audience', id: base.id }
  }
  return {
    notification: {
      ...base,
      recipientRef,
      audienceRole,
      isGlobal,
      actorRef: referencedEntityId(firstPresent(record.actorId, record.senderId, record.createdBy)),
      type: type.value ?? 'general',
      title: title.value ?? ((body.value ?? '').slice(0, 240) || 'Notification Yahnu'),
      body: body.value ?? '',
      link,
      expiresAt: normalizeDate(record.expiresAt),
      deliveredAt: normalizeDate(record.deliveredAt),
      readAt,
      dismissedAt: normalizeDate(record.dismissedAt),
      hasExactReadAt: Boolean(explicitReadAt || (hasReadFlag && base.hasSourceTimestamp)),
    },
  }
}

function normalizeJob(source, importTimestamp) {
  const base = baseSourceRecord(source, 'jobs', importTimestamp)
  if (base.error) return base
  if (!routeCompatibleId(base.id, 200)) return { error: 'job ID exceeds the 200-character route limit', id: base.id }
  const record = base.payload
  const title = strictImportedText(String(record.title ?? ''), 'job title', 3, 160)
  if (title.error) return { error: title.error, id: base.id }
  const companyName = strictOptionalImportedText(firstPresent(record.companyName, record.company), 'company name', 500)
  if (companyName.error) return { error: companyName.error, id: base.id }
  const location = strictOptionalImportedText(record.location, 'job location', 200)
  if (location.error) return { error: location.error, id: base.id }
  const employmentType = normalizeEnum(firstPresent(record.employmentType, record.type))
  if (employmentType && !JOB_EMPLOYMENT_TYPES.has(employmentType)) {
    return { error: 'job employment type is not supported by the Render application', id: base.id }
  }
  const description = strictImportedText(String(record.description ?? ''), 'job description', 20, 100_000)
  if (description.error) return { error: description.error, id: base.id }
  const status = normalizeEnum(record.status || 'open')
  if (!JOB_STATUSES.has(status)) return { error: 'job status must be draft, open, or closed', id: base.id }
  const applicationUrl = strictImportedHttpUrl(firstPresent(record.applicationUrl, record.applyUrl), 'application URL')
  if (applicationUrl.error) return { error: applicationUrl.error, id: base.id }
  const rawClosesAt = firstPresent(record.closesAt, record.deadline, record.expiresAt)
  const closesAt = strictOptionalImportedDate(rawClosesAt, 'job closing date')
  if (closesAt.error) return { error: closesAt.error, id: base.id }
  if (containsFirebaseStorageReference([
    title.value, companyName.value, location.value, description.value,
  ])) return { error: 'job text contains an unsupported Firebase Storage reference', id: base.id }
  return {
    job: {
      ...base,
      companyRef: referencedEntityId(firstPresent(record.companyId, record.employerId, record.createdBy)),
      title: title.value,
      companyName: companyName.value,
      location: location.value,
      employmentType: employmentType || null,
      description: description.value,
      status,
      applicationUrl: applicationUrl.value,
      closesAt: closesAt.value,
    },
  }
}

function normalizeApplication(source, importTimestamp) {
  const base = baseSourceRecord(source, 'applications', importTimestamp)
  if (base.error) return base
  if (!routeCompatibleId(base.id, 200)) return { error: 'application ID exceeds the 200-character route limit', id: base.id }
  const record = base.payload
  const normalizedStatus = normalizeEnum(record.status || 'submitted')
  const status = APPLICATION_STATUS_ALIASES.get(normalizedStatus) ?? normalizedStatus
  if (!APPLICATION_STATUSES.has(status)) return { error: 'application status is not supported by the Render application', id: base.id }
  const coverLetter = strictOptionalImportedText(record.coverLetter, 'cover letter', 20_000, 0)
  if (coverLetter.error) return { error: coverLetter.error, id: base.id }
  if (containsFirebaseStorageReference(coverLetter.value)) {
    return { error: 'cover letter contains an unsupported Firebase Storage reference', id: base.id }
  }
  const resumeUrl = strictOptionalImportedText(firstPresent(record.resumeUrl, record.cvUrl), 'resume URL', 8_192)
  if (resumeUrl.error) return { error: resumeUrl.error, id: base.id }
  const legacyResumeUrlSha256 = firebaseStorageReferenceHash(resumeUrl.value)
  if (resumeUrl.value && !legacyResumeUrlSha256) {
    return { error: 'resume URL is not an inventory-backed Firebase Storage reference', id: base.id }
  }
  return {
    application: {
      ...base,
      jobRef: referencedEntityId(firstPresent(record.jobId, record.job)),
      applicantRef: referencedEntityId(firstPresent(record.graduateId, record.applicantId, record.userId, record.createdBy)),
      status,
      coverLetter: coverLetter.value,
      legacyResumeUrlSha256,
      submittedAt: normalizeDate(firstPresent(record.submittedAt, record.createdAt)) ?? base.createdAt,
    },
  }
}

function normalizePartnership(source, importTimestamp) {
  const base = baseSourceRecord(source, 'partnerships', importTimestamp)
  if (base.error) return base
  if (!routeCompatibleId(base.id, 200)) return { error: 'partnership ID exceeds the 200-character route limit', id: base.id }
  const record = base.payload
  const initiatedBy = normalizeEnum(record.initiatedBy)
  if (initiatedBy && !['company', 'school'].includes(initiatedBy)) {
    return { error: `unsupported partnership initiator (${initiatedBy})`, id: base.id }
  }
  const schoolRef = referencedEntityId(record.schoolId)
  const companyRef = referencedEntityId(record.companyId)
  const explicitRequesterRef = referencedEntityId(record.requesterId)
  const explicitPartnerRef = referencedEntityId(record.partnerId)
  if ((!explicitRequesterRef || !explicitPartnerRef) && schoolRef && companyRef && !initiatedBy) {
    return { error: 'partnership initiatedBy is required when deriving requester/partner direction', id: base.id }
  }
  const organizationName = strictOptionalImportedText(
    firstPresent(record.organizationName, record.companyName, record.schoolName),
    'partnership organization name',
    500,
  )
  if (organizationName.error) return { error: organizationName.error, id: base.id }
  if (containsFirebaseStorageReference(organizationName.value)) {
    return { error: 'partnership text contains an unsupported Firebase Storage reference', id: base.id }
  }
  const status = PARTNERSHIP_STATUS_MAP.get(normalizeEnum(record.status || 'pending'))
  if (!status) return { error: 'partnership status is not supported by the Render application', id: base.id }
  return {
    partnership: {
      ...base,
      requesterRef: explicitRequesterRef ?? (initiatedBy === 'company' ? companyRef : schoolRef),
      partnerRef: explicitPartnerRef ?? (initiatedBy === 'company' ? schoolRef : companyRef),
      organizationName: organizationName.value,
      contactEmail: normalizeEmail(firstPresent(record.contactEmail, record.email)),
      status,
    },
  }
}

function mailContentSha256(value) {
  if (value === null || value === undefined) return null
  const serialized = typeof value === 'string' ? value : stableJson(value)
  return sha256(serialized)
}

function normalizeMail(source, importTimestamp) {
  const base = baseSourceRecord(source, 'mail', importTimestamp)
  if (base.error) return base
  const record = base.payload
  const rawRecord = sanitizeSensitive(materializeRecord(source.record) ?? {})
  const message = isObject(record.message) ? record.message : {}
  const rawMessage = isObject(rawRecord.message) ? rawRecord.message : {}
  const envelopeFrom = strictOptionalImportedText(firstPresent(record.from, message.from), 'mail sender', 1_000)
  if (envelopeFrom.error) return { error: envelopeFrom.error, id: base.id }
  const envelopeTo = normalizeArray(firstPresent(record.to, message.to)).map((value) => String(value).trim())
  if (envelopeTo.some((value) => !value || value.length > 1_000)) return { error: 'mail recipient exceeds 1000 characters', id: base.id }
  const subject = strictOptionalImportedText(firstPresent(record.subject, message.subject), 'mail subject', 10_000, 0)
  if (subject.error) return { error: subject.error, id: base.id }
  const deliveryStatus = strictOptionalImportedText(
    firstPresent(record.delivery?.state, record.state, record.status),
    'mail delivery status',
    200,
  )
  if (deliveryStatus.error) return { error: deliveryStatus.error, id: base.id }
  if (containsFirebaseStorageReference([envelopeFrom.value, envelopeTo, subject.value, deliveryStatus.value])) {
    return { error: 'mail envelope metadata contains an unsupported Firebase Storage or signed URL reference', id: base.id }
  }
  const explicitQueuedAt = normalizeDate(firstPresent(record.createdAt, record.queuedAt))
  const queuedAt = explicitQueuedAt ?? base.createdAt
  const completedAt = normalizeDate(firstPresent(record.delivery?.endTime, record.completedAt, record.deliveredAt))
  const metadataPayload = {
    format: 'yahnu-archived-mail-metadata-v1',
    textSha256: mailContentSha256(firstPresent(rawMessage.text, rawRecord.text, rawMessage.body, rawRecord.body)),
    htmlSha256: mailContentSha256(firstPresent(rawMessage.html, rawRecord.html)),
  }
  return {
    mail: {
      ...base,
      payload: metadataPayload,
      envelopeFrom: envelopeFrom.value,
      envelopeTo,
      subject: subject.value,
      deliveryStatus: deliveryStatus.value,
      queuedAt,
      completedAt,
      hasExplicitQueuedAt: Boolean(explicitQueuedAt),
    },
  }
}

function announcementNotificationId(announcementId) {
  return `firebase-announcement-${sha256(String(announcementId)).slice(0, 48)}`
}

function synthesizedAnnouncementNotification(announcement) {
  const payload = {
    migrationKind: 'firebase_announcement_notification_v1',
    announcementId: announcement.id,
    announcementSourceHash: announcement.sourceHash,
  }
  return {
    id: announcementNotificationId(announcement.id),
    announcementId: announcement.id,
    audienceRole: announcement.audienceRole,
    isGlobal: announcement.isGlobal,
    actorRef: announcement.createdByRef,
    title: announcement.title,
    body: announcement.content,
    payload,
    sourceHash: announcement.sourceHash,
    sourceUpdatedAt: announcement.hasSourceTimestamp ? announcement.updatedAt : null,
    createdAt: announcement.createdAt,
    expiresAt: announcement.expiresAt,
  }
}

function normalizeAnnouncement(source, importTimestamp) {
  const base = baseSourceRecord(source, 'announcements', importTimestamp)
  if (base.error) return base
  if (!routeCompatibleId(base.id, 160)) return { error: 'announcement ID exceeds the 160-character route limit', id: base.id }
  const record = base.payload
  const title = strictImportedText(record.title, 'announcement title', 1, 180)
  if (title.error) return { error: title.error, id: base.id }
  const content = strictImportedText(firstPresent(record.content, record.body, record.message), 'announcement content', 1, 10_000)
  if (content.error) return { error: content.error, id: base.id }
  if (containsFirebaseStorageReference([title.value, content.value])) {
    return { error: 'announcement text contains an unsupported Firebase Storage or signed URL reference', id: base.id }
  }
  const rawStatus = normalizeEnum(record.status)
  const status = ['active', 'published'].includes(rawStatus) ? 'active' : rawStatus === 'draft' ? 'draft' : null
  if (!status) return { error: 'announcement status must be draft or active', id: base.id }
  const rawAudience = firstPresent(record.audience, record.audienceRole, record.role)
  const normalizedRawAudience = normalizeEnum(rawAudience)
  const isGlobal = GLOBAL_AUDIENCE_ALIASES.has(normalizedRawAudience)
  const normalizedRole = ROLE_MAP.get(normalizedRawAudience)
  const audienceRole = isGlobal ? null : (ANNOUNCEMENT_AUDIENCE_ROLES.has(normalizedRole) ? normalizedRole : null)
  if (!isGlobal && !audienceRole) return { error: `announcement has no supported audience (${normalizedRawAudience || 'missing'})`, id: base.id }
  const expiresAt = strictOptionalImportedDate(record.expiresAt, 'announcement expiry')
  if (expiresAt.error) return { error: expiresAt.error, id: base.id }
  return {
    announcement: {
      ...base,
      title: title.value,
      content: content.value,
      audience: isGlobal ? 'all' : audienceRole,
      audienceRole: status === 'active' ? audienceRole : null,
      isGlobal: status === 'active' && isGlobal,
      status,
      expiresAt: expiresAt.value,
      createdByRef: referencedEntityId(firstPresent(record.createdBy, record.authorId)),
    },
  }
}

function normalizeKnowledgeBaseArticle(source, importTimestamp) {
  const base = baseSourceRecord(source, 'knowledgeBaseArticles', importTimestamp)
  if (base.error) return base
  if (!routeCompatibleId(base.id, 160)) return { error: 'knowledge-base ID exceeds the 160-character route limit', id: base.id }
  const record = base.payload
  const title = strictImportedText(record.title, 'knowledge-base title', 1, 180)
  if (title.error) return { error: title.error, id: base.id }
  const category = strictImportedText(record.category, 'knowledge-base category', 1, 100)
  if (category.error) return { error: category.error, id: base.id }
  const content = strictImportedText(
    firstPresent(record.contentHtml, record.content, record.body),
    'knowledge-base content',
    50,
    100_000,
  )
  if (content.error) return { error: content.error, id: base.id }
  if (!isValidatedImportedHtml(content.value)) {
    return { error: 'knowledge-base content contains unsupported HTML markup', id: base.id }
  }
  if (containsFirebaseStorageReference([title.value, category.value, content.value])) {
    return { error: 'knowledge-base content contains an unsupported Firebase Storage or signed URL reference', id: base.id }
  }
  const rawStatus = normalizeEnum(record.status)
  const status = rawStatus || 'published'
  if (!['draft', 'published'].includes(status)) {
    return { error: 'knowledge-base status must be draft or published', id: base.id }
  }
  return {
    article: {
      ...base,
      title: title.value,
      category: category.value,
      contentHtml: content.value,
      status,
      createdByRef: referencedEntityId(firstPresent(record.createdBy, record.authorId)),
    },
  }
}

function normalizeInvalidatedEmailCode(source, importTimestamp) {
  const base = baseSourceRecord(source, 'emailVerificationCodes', importTimestamp)
  if (base.error) return base
  const record = materializeRecord(source.record) ?? {}
  const rawCodeValue = firstPresent(record.code, record.token, record.verificationCode)
  const rawCode = rawCodeValue === null || rawCodeValue === undefined ? null : String(rawCodeValue).trim() || null
  return {
    code: {
      id: base.id,
      userRef: referencedEntityId(firstPresent(record.userId, record.uid)),
      email: normalizeEmail(firstPresent(record.newEmail, record.email, record.to)),
      codeSha256: rawCode ? sha256(rawCode) : null,
      sourceHash: base.sourceHash,
      sourceExpiresAt: normalizeDate(firstPresent(record.expiresAt, record.expiry)),
      invalidatedAt: importTimestamp,
    },
  }
}

function hashInviteToken(token, secret) {
  return createHmac('sha256', secret ?? FALLBACK_AUTH_SECRET).update(token).digest('hex')
}

const UPSERT_AUTH_USER_SQL = `
  INSERT INTO users (
    id, legacy_firebase_uid, email, password_hash, google_sub, auth_provider,
    name, first_name, last_name, role, status, school_id, school_name,
    company_name, contact_name, industry, experience, education, skills,
    phone, profile, email_verified_at, last_login_at, created_at, legacy_avatar_url_sha256
  ) VALUES (
    $1, $1, $2, NULL, NULL, 'migrated',
    $3, $4, $5, $6, $7, $8, $9,
    $10, $11, $12, $13, $14::jsonb, $15::jsonb,
    $16, $17::jsonb, $18::timestamptz, $19::timestamptz, COALESCE($20::timestamptz, now()), $21
  )
  ON CONFLICT (id) DO UPDATE SET
    legacy_firebase_uid = EXCLUDED.legacy_firebase_uid,
    email = EXCLUDED.email,
    auth_provider = CASE
      WHEN users.password_hash IS NULL AND users.google_sub IS NULL THEN 'migrated'
      ELSE users.auth_provider
    END,
    status = CASE WHEN EXCLUDED.status = 'suspended' THEN 'suspended' ELSE users.status END,
    profile = CASE WHEN users.legacy_firestore_source_hash IS NULL THEN EXCLUDED.profile ELSE users.profile END,
    avatar_asset_id = CASE
      WHEN users.legacy_firestore_source_hash IS NOT NULL THEN users.avatar_asset_id
      WHEN EXCLUDED.legacy_avatar_url_sha256 IS NOT NULL
        AND users.legacy_avatar_url_sha256 IS NOT DISTINCT FROM EXCLUDED.legacy_avatar_url_sha256
      THEN users.avatar_asset_id ELSE NULL
    END,
    legacy_avatar_url_sha256 = CASE
      WHEN users.legacy_firestore_source_hash IS NULL THEN EXCLUDED.legacy_avatar_url_sha256
      ELSE users.legacy_avatar_url_sha256
    END,
    email_verified_at = EXCLUDED.email_verified_at,
    last_login_at = COALESCE(EXCLUDED.last_login_at, users.last_login_at),
    created_at = LEAST(users.created_at, COALESCE($20::timestamptz, users.created_at))
  WHERE users.password_hash IS NULL AND users.google_sub IS NULL
  RETURNING id, role, deleted_at
`

const UPDATE_FIRESTORE_USER_SQL = `
  UPDATE users SET
    name = $2,
    first_name = $3,
    last_name = $4,
    role = $5,
    status = CASE
      WHEN users.status IN ('suspended', 'declined') THEN users.status
      WHEN $17::boolean THEN $6
      ELSE users.status
    END,
    school_id = $7,
    school_name = $8,
    company_name = $9,
    contact_name = $10,
    industry = $11,
    experience = $12,
    education = $13::jsonb,
    skills = $14::jsonb,
    phone = $15,
    profile = CASE
      WHEN $20::boolean = false AND COALESCE(
        users.profile ->> 'avatarUrl', users.profile ->> 'photoURL',
        users.profile ->> 'photoUrl', users.profile ->> 'avatar'
      ) IS NOT NULL THEN jsonb_set(
        $16::jsonb,
        '{avatarUrl}',
        to_jsonb(COALESCE(
          users.profile ->> 'avatarUrl', users.profile ->> 'photoURL',
          users.profile ->> 'photoUrl', users.profile ->> 'avatar'
        )),
        true
      )
      ELSE $16::jsonb
    END,
    avatar_asset_id = CASE
      WHEN $20::boolean = false THEN users.avatar_asset_id
      WHEN $19::text IS NOT NULL AND users.legacy_avatar_url_sha256 IS NOT DISTINCT FROM $19::text THEN users.avatar_asset_id
      ELSE NULL
    END,
    legacy_avatar_url_sha256 = CASE WHEN $20::boolean THEN $19::text ELSE users.legacy_avatar_url_sha256 END,
    legacy_firestore_source_hash = $18
  WHERE id = $1
    AND legacy_firebase_uid = $1
    AND deleted_at IS NULL
    AND password_hash IS NULL
    AND google_sub IS NULL
  RETURNING id, role, deleted_at
`

function userParameters(user) {
  return [
    user.id,
    user.email,
    user.name,
    user.firstName,
    user.lastName,
    user.role,
    user.status,
    user.schoolId,
    user.schoolName,
    user.companyName,
    user.contactName,
    user.industry,
    user.experience,
    JSON.stringify(user.education),
    JSON.stringify(user.skills),
    user.phone,
    JSON.stringify(user.profile),
    user.emailVerifiedAt,
    user.lastLoginAt,
    user.createdAt,
    user.legacyAvatarUrlSha256,
  ]
}

function firestoreUserParameters(user) {
  return [
    user.id,
    user.name,
    user.firstName,
    user.lastName,
    user.role,
    user.status,
    user.schoolId,
    user.schoolName,
    user.companyName,
    user.contactName,
    user.industry,
    user.experience,
    JSON.stringify(user.education),
    JSON.stringify(user.skills),
    user.phone,
    JSON.stringify(user.profile),
    user.hasExplicitStatus,
    user.firestoreSourceHash,
    user.legacyAvatarUrlSha256,
    user.hasAvatarField,
  ]
}

const UPSERT_INVITE_SQL = `
  INSERT INTO invites (
    id, token_hash, email, role, status, created_by, used_by, expires_at, created_at, used_at
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8::timestamptz, $9::timestamptz, $10::timestamptz
  )
  ON CONFLICT (id) DO UPDATE SET
    token_hash = CASE WHEN invites.status = 'pending' THEN invites.token_hash ELSE EXCLUDED.token_hash END,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    status = CASE
      WHEN invites.status = 'used' THEN 'used'
      WHEN invites.status = 'revoked' THEN 'revoked'
      WHEN invites.status = 'expired' AND EXCLUDED.status = 'pending' THEN 'expired'
      ELSE EXCLUDED.status
    END,
    created_by = COALESCE(invites.created_by, EXCLUDED.created_by),
    used_by = COALESCE(invites.used_by, EXCLUDED.used_by),
    expires_at = LEAST(invites.expires_at, EXCLUDED.expires_at),
    created_at = LEAST(invites.created_at, EXCLUDED.created_at),
    used_at = COALESCE(invites.used_at, EXCLUDED.used_at)
  WHERE $11::boolean AND invites.created_at <= EXCLUDED.created_at
  RETURNING id
`

const UPSERT_TICKET_SQL = `
  INSERT INTO tickets (
    id, user_id, type, subject, description, status, priority, metadata, submitted_at, updated_at
  ) VALUES (
    $1, $2, 'support', $3, $4, $5, $6, $7::jsonb, $8::timestamptz, $9::timestamptz
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    type = 'support',
    subject = EXCLUDED.subject,
    description = EXCLUDED.description,
    priority = EXCLUDED.priority,
    status = CASE
      WHEN tickets.status IN ('resolved', 'closed') AND EXCLUDED.status IN ('open', 'in_progress') THEN tickets.status
      ELSE EXCLUDED.status
    END,
    metadata = EXCLUDED.metadata,
    submitted_at = LEAST(tickets.submitted_at, EXCLUDED.submitted_at),
    updated_at = EXCLUDED.updated_at
  WHERE $10::boolean AND tickets.updated_at < EXCLUDED.updated_at
  RETURNING id
`

const UPSERT_PAGE_SQL = `
  INSERT INTO pages (id, data, updated_by, created_at, updated_at)
  VALUES ($1, $2::jsonb, $3, $4::timestamptz, $5::timestamptz)
  ON CONFLICT (id) DO UPDATE SET
    data = EXCLUDED.data,
    updated_by = COALESCE(EXCLUDED.updated_by, pages.updated_by),
    created_at = LEAST(pages.created_at, EXCLUDED.created_at),
    updated_at = EXCLUDED.updated_at
  WHERE $6::boolean AND pages.updated_at < EXCLUDED.updated_at
  RETURNING id
`

const UPSERT_DASHBOARD_SQL = `
  INSERT INTO dashboard_preferences (user_id, layouts, reports, updated_at)
  VALUES ($1, $2::jsonb, $3::jsonb, $4::timestamptz)
  ON CONFLICT (user_id) DO UPDATE SET
    layouts = EXCLUDED.layouts,
    reports = EXCLUDED.reports,
    updated_at = EXCLUDED.updated_at
  WHERE $5::boolean AND dashboard_preferences.updated_at < EXCLUDED.updated_at
  RETURNING user_id
`

function inviteParameters(invite, secret) {
  return [
    invite.id,
    hashInviteToken(invite.rawToken, secret),
    invite.email,
    invite.role,
    invite.status,
    invite.createdBy,
    invite.usedBy,
    invite.expiresAt,
    invite.createdAt,
    invite.usedAt,
    invite.hasSourceTimestamp,
  ]
}

function ticketParameters(ticket) {
  return [
    ticket.id,
    ticket.userId,
    ticket.subject,
    ticket.description,
    ticket.status,
    ticket.priority,
    JSON.stringify(ticket.metadata),
    ticket.submittedAt,
    ticket.updatedAt,
    ticket.hasSourceTimestamp,
  ]
}

function pageParameters(page) {
  return [page.id, JSON.stringify(page.data), page.updatedBy, page.createdAt, page.updatedAt, page.hasSourceTimestamp]
}

function dashboardParameters(dashboard) {
  return [
    dashboard.userId,
    JSON.stringify(dashboard.layouts),
    JSON.stringify(dashboard.reports),
    dashboard.updatedAt,
    dashboard.hasSourceTimestamp,
  ]
}

const UPSERT_AUTH_IDENTITY_SQL = `
  INSERT INTO auth_identities (
    user_id, provider, provider_subject, provider_email
  ) VALUES ($1, $2, $3, $4)
  ON CONFLICT (user_id, provider) DO UPDATE SET
    provider_subject = EXCLUDED.provider_subject,
    provider_email = EXCLUDED.provider_email
  RETURNING user_id
`

const UPSERT_LEGACY_FIRESTORE_USER_ARCHIVE_SQL = `
  INSERT INTO legacy_firestore_user_archives (
    legacy_firebase_uid, source_payload, source_hash, archive_reason, source_created_at, source_updated_at
  ) VALUES ($1, $2::jsonb, $3, 'missing_auth_identity', $4::timestamptz, $5::timestamptz)
  ON CONFLICT (legacy_firebase_uid) DO UPDATE SET
    source_payload = EXCLUDED.source_payload,
    source_hash = EXCLUDED.source_hash,
    archive_reason = EXCLUDED.archive_reason,
    source_created_at = EXCLUDED.source_created_at,
    source_updated_at = EXCLUDED.source_updated_at
  WHERE legacy_firestore_user_archives.source_hash <> EXCLUDED.source_hash
    OR legacy_firestore_user_archives.source_payload IS DISTINCT FROM EXCLUDED.source_payload
    OR legacy_firestore_user_archives.source_created_at IS DISTINCT FROM EXCLUDED.source_created_at
    OR legacy_firestore_user_archives.source_updated_at IS DISTINCT FROM EXCLUDED.source_updated_at
  RETURNING legacy_firebase_uid
`

const UPSERT_LEGACY_FIRESTORE_USER_ARCHIVE_REFERENCE_SQL = `
  INSERT INTO legacy_firestore_user_archive_references (
    source_collection, source_id, source_field, legacy_firebase_uid, source_hash
  ) VALUES ($1, $2, $3, $4, $5)
  ON CONFLICT (source_collection, source_id, source_field) DO UPDATE SET
    legacy_firebase_uid = EXCLUDED.legacy_firebase_uid,
    source_hash = EXCLUDED.source_hash,
    updated_at = now()
  WHERE legacy_firestore_user_archive_references.legacy_firebase_uid IS DISTINCT FROM EXCLUDED.legacy_firebase_uid
    OR legacy_firestore_user_archive_references.source_hash <> EXCLUDED.source_hash
  RETURNING source_id
`

const UPSERT_LEGACY_UNRESOLVED_FIRESTORE_REFERENCE_SQL = `
  INSERT INTO legacy_unresolved_firestore_references (
    source_collection, source_id, source_field, target_ref_sha256, source_hash, reason
  ) VALUES ($1, $2, $3, $4, $5, 'source_target_absent_from_export')
  ON CONFLICT (source_collection, source_id, source_field, target_ref_sha256) DO UPDATE SET
    source_hash = EXCLUDED.source_hash,
    reason = EXCLUDED.reason,
    updated_at = now()
  WHERE legacy_unresolved_firestore_references.source_hash <> EXCLUDED.source_hash
  RETURNING source_id
`

const UPSERT_BLOG_POST_SQL = `
  INSERT INTO blog_posts (
    id, slug, title, author, excerpt, content_html, status, image_url, created_by,
    author_ref, legacy_image_url_sha256, published_at, source_payload, source_hash, source_updated_at,
    created_at, updated_at
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9,
    $10, $11, $12::timestamptz, $13::jsonb, $14, $15::timestamptz,
    $16::timestamptz, $17::timestamptz
  )
  ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug, title = EXCLUDED.title, author = EXCLUDED.author,
    excerpt = EXCLUDED.excerpt, content_html = EXCLUDED.content_html,
    status = EXCLUDED.status, image_url = EXCLUDED.image_url,
    image_asset_id = CASE
      WHEN EXCLUDED.legacy_image_url_sha256 IS NOT NULL
        AND blog_posts.legacy_image_url_sha256 IS NOT DISTINCT FROM EXCLUDED.legacy_image_url_sha256
      THEN blog_posts.image_asset_id ELSE NULL
    END,
    created_by = EXCLUDED.created_by, author_ref = EXCLUDED.author_ref,
    legacy_image_url = NULL,
    legacy_image_url_sha256 = EXCLUDED.legacy_image_url_sha256,
    published_at = EXCLUDED.published_at, source_payload = EXCLUDED.source_payload,
    source_hash = EXCLUDED.source_hash, source_updated_at = EXCLUDED.source_updated_at,
    created_at = LEAST(blog_posts.created_at, EXCLUDED.created_at),
    updated_at = EXCLUDED.updated_at
  WHERE blog_posts.source_hash <> EXCLUDED.source_hash
    AND (EXCLUDED.source_updated_at IS NULL OR blog_posts.source_updated_at IS NULL
      OR blog_posts.source_updated_at <= EXCLUDED.source_updated_at)
  RETURNING id
`

const UPSERT_CONVERSATION_SQL = `
  INSERT INTO conversations (
    id, name, avatar_url, legacy_avatar_url_sha256, last_message, last_message_at, ticket_id, metadata,
    source_payload, source_hash, source_updated_at, created_at, updated_at
  ) VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7, $8::jsonb, $8::jsonb, $9, $10::timestamptz, $11::timestamptz, $12::timestamptz)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url,
    avatar_asset_id = CASE
      WHEN EXCLUDED.legacy_avatar_url_sha256 IS NOT NULL
        AND conversations.legacy_avatar_url_sha256 IS NOT DISTINCT FROM EXCLUDED.legacy_avatar_url_sha256
      THEN conversations.avatar_asset_id ELSE NULL
    END,
    legacy_avatar_url_sha256 = EXCLUDED.legacy_avatar_url_sha256,
    last_message = EXCLUDED.last_message, last_message_at = EXCLUDED.last_message_at,
    ticket_id = EXCLUDED.ticket_id, metadata = EXCLUDED.metadata,
    source_payload = EXCLUDED.source_payload,
    source_hash = EXCLUDED.source_hash, source_updated_at = EXCLUDED.source_updated_at,
    created_at = LEAST(conversations.created_at, EXCLUDED.created_at),
    updated_at = EXCLUDED.updated_at
  WHERE conversations.source_hash <> EXCLUDED.source_hash
    AND (EXCLUDED.source_updated_at IS NULL OR conversations.source_updated_at IS NULL
      OR conversations.source_updated_at <= EXCLUDED.source_updated_at)
  RETURNING id
`

const UPSERT_CONVERSATION_PARTICIPANT_SQL = `
  INSERT INTO conversation_participants (
    conversation_id, user_id, participant_ref, display_name, unread_count, joined_at, metadata
  ) VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7::jsonb)
  ON CONFLICT (conversation_id, user_id) DO UPDATE SET
    participant_ref = EXCLUDED.participant_ref, display_name = EXCLUDED.display_name,
    unread_count = GREATEST(conversation_participants.unread_count, EXCLUDED.unread_count),
    joined_at = LEAST(conversation_participants.joined_at, EXCLUDED.joined_at),
    metadata = EXCLUDED.metadata
  RETURNING user_id
`

const UPSERT_MESSAGE_SQL = `
  INSERT INTO messages (
    id, conversation_id, sender_id, sender_ref, body, legacy_attachment_url_sha256,
    source_index, source_payload, source_hash, source_updated_at, sent_at, edited_at, created_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10::timestamptz, $11::timestamptz, $12::timestamptz, $11::timestamptz)
  ON CONFLICT (id) DO UPDATE SET
    sender_id = EXCLUDED.sender_id, sender_ref = EXCLUDED.sender_ref,
    body = EXCLUDED.body,
    attachment_asset_id = CASE
      WHEN EXCLUDED.legacy_attachment_url_sha256 IS NOT NULL
        AND messages.legacy_attachment_url_sha256 IS NOT DISTINCT FROM EXCLUDED.legacy_attachment_url_sha256
      THEN messages.attachment_asset_id ELSE NULL
    END,
    legacy_attachment_url = NULL,
    legacy_attachment_url_sha256 = EXCLUDED.legacy_attachment_url_sha256,
    source_index = EXCLUDED.source_index, source_payload = EXCLUDED.source_payload,
    source_hash = EXCLUDED.source_hash, source_updated_at = EXCLUDED.source_updated_at,
    sent_at = EXCLUDED.sent_at, edited_at = EXCLUDED.edited_at
  WHERE messages.conversation_id = EXCLUDED.conversation_id
    AND messages.source_hash <> EXCLUDED.source_hash
    AND (EXCLUDED.source_updated_at IS NULL OR messages.source_updated_at IS NULL
      OR messages.source_updated_at <= EXCLUDED.source_updated_at)
  RETURNING id
`

const UPSERT_NOTIFICATION_SQL = `
  INSERT INTO notifications (
    id, user_id, recipient_ref, target_role, is_global, created_by, actor_ref,
    type, title, body, link, payload, source_payload, source_hash, source_updated_at, created_at, expires_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $12::jsonb, $13, $14::timestamptz, $15::timestamptz, $16::timestamptz)
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id, recipient_ref = EXCLUDED.recipient_ref,
    target_role = EXCLUDED.target_role, is_global = EXCLUDED.is_global,
    created_by = EXCLUDED.created_by,
    actor_ref = EXCLUDED.actor_ref, type = EXCLUDED.type, title = EXCLUDED.title,
    body = EXCLUDED.body, link = EXCLUDED.link, payload = EXCLUDED.payload,
    source_payload = EXCLUDED.source_payload,
    source_hash = EXCLUDED.source_hash, source_updated_at = EXCLUDED.source_updated_at,
    created_at = LEAST(notifications.created_at, EXCLUDED.created_at),
    expires_at = EXCLUDED.expires_at
  WHERE notifications.source_hash <> EXCLUDED.source_hash
    AND (EXCLUDED.source_updated_at IS NULL OR notifications.source_updated_at IS NULL
      OR notifications.source_updated_at <= EXCLUDED.source_updated_at)
  RETURNING id
`

const UPSERT_ANNOUNCEMENT_NOTIFICATION_SQL = `
  INSERT INTO notifications (
    id, user_id, recipient_ref, target_role, is_global, announcement_id,
    created_by, actor_ref, type, title, body, link, payload, source_payload,
    source_hash, source_updated_at, created_at, expires_at
  ) VALUES (
    $1, NULL, NULL, $2, $3, $4,
    $5, $6, 'announcement', $7, $8, NULL, $9::jsonb, $9::jsonb,
    $10, $11::timestamptz, $12::timestamptz, $13::timestamptz
  )
  ON CONFLICT (id) DO UPDATE SET
    target_role = EXCLUDED.target_role,
    is_global = EXCLUDED.is_global,
    created_by = EXCLUDED.created_by,
    actor_ref = EXCLUDED.actor_ref,
    title = EXCLUDED.title,
    body = EXCLUDED.body,
    payload = EXCLUDED.payload,
    source_payload = EXCLUDED.source_payload,
    source_hash = EXCLUDED.source_hash,
    source_updated_at = EXCLUDED.source_updated_at,
    created_at = LEAST(notifications.created_at, EXCLUDED.created_at),
    expires_at = EXCLUDED.expires_at
  WHERE notifications.announcement_id = EXCLUDED.announcement_id
    AND notifications.source_payload ->> 'migrationKind' = 'firebase_announcement_notification_v1'
    AND (notifications.source_hash <> EXCLUDED.source_hash
      OR notifications.target_role IS DISTINCT FROM EXCLUDED.target_role
      OR notifications.is_global IS DISTINCT FROM EXCLUDED.is_global
      OR notifications.created_by IS DISTINCT FROM EXCLUDED.created_by
      OR notifications.actor_ref IS DISTINCT FROM EXCLUDED.actor_ref
      OR notifications.title IS DISTINCT FROM EXCLUDED.title
      OR notifications.body IS DISTINCT FROM EXCLUDED.body
      OR notifications.payload IS DISTINCT FROM EXCLUDED.payload
      OR notifications.expires_at IS DISTINCT FROM EXCLUDED.expires_at)
  RETURNING id
`

const UPSERT_NOTIFICATION_RECEIPT_SQL = `
  INSERT INTO notification_receipts (notification_id, user_id, delivered_at, read_at, dismissed_at)
  VALUES ($1, $2, $3::timestamptz, $4::timestamptz, $5::timestamptz)
  ON CONFLICT (notification_id, user_id) DO UPDATE SET
    delivered_at = COALESCE(notification_receipts.delivered_at, EXCLUDED.delivered_at),
    read_at = COALESCE(notification_receipts.read_at, EXCLUDED.read_at),
    dismissed_at = COALESCE(notification_receipts.dismissed_at, EXCLUDED.dismissed_at)
  RETURNING notification_id
`

const UPSERT_JOB_SQL = `
  INSERT INTO jobs (
    id, company_id, company_ref, title, company_name, location, employment_type,
    description, status, application_url, closes_at, source_payload, source_hash,
    source_updated_at, created_at, updated_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::timestamptz, $12::jsonb, $13, $14::timestamptz, $15::timestamptz, $16::timestamptz)
  ON CONFLICT (id) DO UPDATE SET
    company_id = EXCLUDED.company_id, company_ref = EXCLUDED.company_ref,
    title = EXCLUDED.title, company_name = EXCLUDED.company_name, location = EXCLUDED.location,
    employment_type = EXCLUDED.employment_type, description = EXCLUDED.description,
    status = EXCLUDED.status, application_url = EXCLUDED.application_url,
    closes_at = EXCLUDED.closes_at, source_payload = EXCLUDED.source_payload,
    source_hash = EXCLUDED.source_hash, source_updated_at = EXCLUDED.source_updated_at,
    created_at = LEAST(jobs.created_at, EXCLUDED.created_at), updated_at = EXCLUDED.updated_at
  WHERE jobs.source_hash <> EXCLUDED.source_hash
    AND (EXCLUDED.source_updated_at IS NULL OR jobs.source_updated_at IS NULL
      OR jobs.source_updated_at <= EXCLUDED.source_updated_at)
  RETURNING id
`

const UPSERT_APPLICATION_SQL = `
  INSERT INTO applications (
    id, job_id, job_ref, applicant_id, applicant_ref, status, cover_letter,
    legacy_resume_url_sha256, source_payload, source_hash, source_updated_at, submitted_at, updated_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11::timestamptz, $12::timestamptz, $13::timestamptz)
  ON CONFLICT (id) DO UPDATE SET
    job_id = EXCLUDED.job_id, job_ref = EXCLUDED.job_ref,
    applicant_id = EXCLUDED.applicant_id, applicant_ref = EXCLUDED.applicant_ref,
    status = EXCLUDED.status, cover_letter = EXCLUDED.cover_letter,
    resume_asset_id = CASE
      WHEN EXCLUDED.legacy_resume_url_sha256 IS NOT NULL
        AND applications.legacy_resume_url_sha256 IS NOT DISTINCT FROM EXCLUDED.legacy_resume_url_sha256
      THEN applications.resume_asset_id ELSE NULL
    END,
    legacy_resume_url = NULL, legacy_resume_url_sha256 = EXCLUDED.legacy_resume_url_sha256,
    source_payload = EXCLUDED.source_payload,
    source_hash = EXCLUDED.source_hash, source_updated_at = EXCLUDED.source_updated_at,
    submitted_at = LEAST(applications.submitted_at, EXCLUDED.submitted_at),
    updated_at = EXCLUDED.updated_at
  WHERE applications.source_hash <> EXCLUDED.source_hash
    AND (EXCLUDED.source_updated_at IS NULL OR applications.source_updated_at IS NULL
      OR applications.source_updated_at <= EXCLUDED.source_updated_at)
  RETURNING id
`

const UPSERT_PARTNERSHIP_SQL = `
  INSERT INTO partnerships (
    id, requester_id, requester_ref, partner_id, partner_ref, organization_name,
    contact_email, status, source_payload, source_hash, source_updated_at, created_at, updated_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11::timestamptz, $12::timestamptz, $13::timestamptz)
  ON CONFLICT (id) DO UPDATE SET
    requester_id = EXCLUDED.requester_id, requester_ref = EXCLUDED.requester_ref,
    partner_id = EXCLUDED.partner_id, partner_ref = EXCLUDED.partner_ref,
    organization_name = EXCLUDED.organization_name, contact_email = EXCLUDED.contact_email,
    status = EXCLUDED.status, source_payload = EXCLUDED.source_payload,
    source_hash = EXCLUDED.source_hash, source_updated_at = EXCLUDED.source_updated_at,
    created_at = LEAST(partnerships.created_at, EXCLUDED.created_at), updated_at = EXCLUDED.updated_at
  WHERE partnerships.source_hash <> EXCLUDED.source_hash
    AND (EXCLUDED.source_updated_at IS NULL OR partnerships.source_updated_at IS NULL
      OR partnerships.source_updated_at <= EXCLUDED.source_updated_at)
  RETURNING id
`

const UPSERT_ARCHIVED_MAIL_SQL = `
  INSERT INTO archived_mail (
    id, envelope_from, envelope_to, subject, delivery_status, source_payload,
    source_hash, source_updated_at, queued_at, completed_at
  ) VALUES ($1, $2, $3::jsonb, $4, $5, $6::jsonb, $7, $8::timestamptz, $9::timestamptz, $10::timestamptz)
  ON CONFLICT (id) DO UPDATE SET
    envelope_from = EXCLUDED.envelope_from, envelope_to = EXCLUDED.envelope_to,
    subject = EXCLUDED.subject, delivery_status = EXCLUDED.delivery_status,
    source_payload = EXCLUDED.source_payload, source_hash = EXCLUDED.source_hash,
    source_updated_at = EXCLUDED.source_updated_at, queued_at = EXCLUDED.queued_at,
    completed_at = EXCLUDED.completed_at
  WHERE archived_mail.source_hash <> EXCLUDED.source_hash
    AND (EXCLUDED.source_updated_at IS NULL OR archived_mail.source_updated_at IS NULL
      OR archived_mail.source_updated_at <= EXCLUDED.source_updated_at)
  RETURNING id
`

const UPSERT_ANNOUNCEMENT_SQL = `
  INSERT INTO announcements (
    id, title, content, audience, status, expires_at, created_by,
    source_payload, source_hash, source_updated_at, created_at, updated_at
  ) VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7, $8::jsonb, $9, $10::timestamptz, $11::timestamptz, $12::timestamptz)
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, content = EXCLUDED.content, audience = EXCLUDED.audience,
    status = EXCLUDED.status, expires_at = EXCLUDED.expires_at, created_by = EXCLUDED.created_by,
    source_payload = EXCLUDED.source_payload, source_hash = EXCLUDED.source_hash,
    source_updated_at = EXCLUDED.source_updated_at,
    created_at = LEAST(announcements.created_at, EXCLUDED.created_at), updated_at = EXCLUDED.updated_at
  WHERE announcements.source_hash <> EXCLUDED.source_hash
    AND (EXCLUDED.source_updated_at IS NULL OR announcements.source_updated_at IS NULL
      OR announcements.source_updated_at <= EXCLUDED.source_updated_at)
  RETURNING id
`

const UPSERT_KNOWLEDGE_ARTICLE_SQL = `
  INSERT INTO knowledge_base_articles (
    id, title, category, content_html, status, created_by,
    source_payload, source_hash, source_updated_at, created_at, updated_at
  ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9::timestamptz, $10::timestamptz, $11::timestamptz)
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, category = EXCLUDED.category,
    content_html = EXCLUDED.content_html, status = EXCLUDED.status,
    created_by = EXCLUDED.created_by, source_payload = EXCLUDED.source_payload,
    source_hash = EXCLUDED.source_hash, source_updated_at = EXCLUDED.source_updated_at,
    created_at = LEAST(knowledge_base_articles.created_at, EXCLUDED.created_at),
    updated_at = EXCLUDED.updated_at
  WHERE knowledge_base_articles.source_hash <> EXCLUDED.source_hash
    AND (EXCLUDED.source_updated_at IS NULL OR knowledge_base_articles.source_updated_at IS NULL
      OR knowledge_base_articles.source_updated_at <= EXCLUDED.source_updated_at)
  RETURNING id
`

const UPSERT_INVALIDATED_EMAIL_CODE_SQL = `
  INSERT INTO invalidated_legacy_email_codes (
    id, user_ref, email, code_sha256, source_hash, source_expires_at, invalidated_at
  ) VALUES ($1, $2, $3, $4, $5, $6::timestamptz, $7::timestamptz)
  ON CONFLICT (id) DO UPDATE SET
    user_ref = EXCLUDED.user_ref, email = EXCLUDED.email,
    code_sha256 = EXCLUDED.code_sha256, source_hash = EXCLUDED.source_hash,
    source_expires_at = EXCLUDED.source_expires_at,
    invalidated_at = LEAST(invalidated_legacy_email_codes.invalidated_at, EXCLUDED.invalidated_at)
  WHERE invalidated_legacy_email_codes.source_hash <> EXCLUDED.source_hash
  RETURNING id
`

function isRecoverableDataError(error) {
  return typeof error?.code === 'string' && (error.code.startsWith('22') || error.code.startsWith('23'))
}

async function executeRecoverableUpsert(client, savepoint, sql, parameters) {
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

function baseCollectionSummary(sourceRecords) {
  return {
    sourceRecords,
    validRecords: 0,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    invalid: 0,
    orphaned: 0,
    duplicateIds: 0,
    databaseRejected: 0,
    normalizationWarnings: 0,
    safetyNormalizations: 0,
    archivedReferences: 0,
    quarantinedReferences: 0,
  }
}

function hasBlockingImportIssues(collections) {
  return Object.values(collections).some((collection) => [
    'skipped', 'invalid', 'orphaned', 'databaseRejected', 'emailConflicts', 'identityConflicts',
    'normalizationWarnings',
  ].some((key) => (collection[key] ?? 0) > 0))
}

function assertPartialFirestoreImportAllowed(sourceMode, allowPartial) {
  if (sourceMode === 'firestore' && allowPartial) {
    throw new Error('--allow-partial is prohibited for Firebase Firestore cutover imports.')
  }
}

// A legacy conversation that has no current runtime participant is normally
// unsafe to import: it would be detached from every account. The one narrow
// exception is a conversation whose every participant is an independently
// verified, frozen-manifest reference. In that case the conversation payload
// can be preserved and each absent participant is recorded in the quarantine
// ledger without creating a synthetic account or a runtime foreign key.
function isConversationEligibleForImport(participants, validUserIds, isVerifiedAbsentReference) {
  if (!participants.length) return false
  if (participants.some((participant) => validUserIds.has(participant.ref))) return true
  return participants.every((participant) => isVerifiedAbsentReference(participant))
}

function runtimeConversationTicketReference(conversation, validUserIds, validTicketIds) {
  const hasRuntimeParticipant = conversation.participants.some((participant) => validUserIds.has(participant.ref))
  if (!hasRuntimeParticipant || !conversation.ticketRef || !validTicketIds.has(conversation.ticketRef)) return null
  return conversation.ticketRef
}

async function main() {
  const args = parseArguments(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const input = args.file ?? process.env.FIREBASE_EXPORT_PATH
  if (!input) throw new Error('Provide a JSON path as an argument, with --file, or through FIREBASE_EXPORT_PATH.')

  const inputPath = path.resolve(input)
  let parsed
  try {
    parsed = JSON.parse(await readFile(inputPath, 'utf8'))
  } catch (error) {
    throw new Error(`Unable to read valid JSON from ${inputPath}: ${error instanceof Error ? error.message : String(error)}`)
  }

  const detectedSource = detectSourceMode(parsed)
  if (args.source && detectedSource && args.source !== detectedSource) {
    throw new Error(`The input looks like a ${detectedSource} export but --source ${args.source} was supplied.`)
  }
  const sourceMode = args.source ?? detectedSource
  assertAccountedFirestoreShape(parsed, sourceMode)
  assertPartialFirestoreImportAllowed(sourceMode, args.allowPartial)
  if (args.preflight && sourceMode !== 'auth') {
    throw new Error('--preflight is available only for Firebase Auth exports. Supply --source auth if auto-detection is ambiguous.')
  }
  if (sourceMode === 'auth') {
    const preflight = preflightFirebaseAuthExport(parsed)
    if (args.preflight) {
      process.stdout.write(`${JSON.stringify({ input: inputPath, source: 'auth', preflight: true, ...preflight }, null, 2)}\n`)
      if (!preflight.passed) process.exitCode = 2
      return
    }
    if (!preflight.passed) throw new Error(firebaseAuthPreflightFailure(preflight))
  }

  const database = directDatabaseConfig()
  const knownFirestoreDocumentIds = sourceMode === 'firestore'
    ? rawFirestoreDocumentIds(parsed)
    : new Set()
  const rawFirestoreUserIdentityValues = sourceMode === 'firestore'
    ? rawFirestoreUserIdentityCandidates(parsed)
    : { ids: new Set(), emails: new Set() }
  const extracted = extractPersistedCollections(parsed)
  const totalSourceRecords = Object.values(extracted).reduce((total, records) => total + records.length, 0)
  if (!totalSourceRecords) throw new Error('No supported Firebase records were found in the supplied JSON structure.')
  if (extracted.users.length && !sourceMode) {
    throw new Error('The user-record source is ambiguous. Supply --source auth or --source firestore.')
  }

  const importTimestamp = new Date().toISOString()
  const collections = {
    users: {
      ...baseCollectionSummary(extracted.users.length),
      emailConflicts: 0,
      missingSchoolReferences: 0,
      defaultedRoles: 0,
      defaultedStatuses: 0,
      identityEmailMismatches: 0,
      identityConflicts: 0,
      identitiesUpserted: 0,
      protectedAccounts: 0,
      archivedNonAuthProfiles: 0,
      archivedNonAuthProfilesInserted: 0,
      archivedNonAuthProfilesUpdated: 0,
      archivedNonAuthProfilesUnchanged: 0,
    },
    invites: {
      ...baseCollectionSummary(extracted.invites.length),
      invalidUsedByCleared: 0,
      missingCreator: 0,
      untrustedPendingRevoked: 0,
    },
    tickets: baseCollectionSummary(extracted.tickets.length),
    pages: {
      ...baseCollectionSummary(extracted.pages.length),
      invalidUpdatedByCleared: 0,
    },
    dashboards: baseCollectionSummary(extracted.dashboards.length),
    blogPosts: {
      ...baseCollectionSummary(extracted.blogPosts.length),
      slugDisambiguated: 0,
    },
    conversations: {
      ...baseCollectionSummary(extracted.conversations.length),
      participants: 0,
      messages: 0,
    },
    notifications: {
      ...baseCollectionSummary(extracted.notifications.length),
      receipts: 0,
    },
    emailVerificationCodes: {
      ...baseCollectionSummary(extracted.emailVerificationCodes.length),
      invalidated: 0,
    },
    jobs: baseCollectionSummary(extracted.jobs.length),
    applications: baseCollectionSummary(extracted.applications.length),
    partnerships: baseCollectionSummary(extracted.partnerships.length),
    mail: baseCollectionSummary(extracted.mail.length),
    announcements: {
      ...baseCollectionSummary(extracted.announcements.length),
      notificationsSynthesized: 0,
    },
    knowledgeBaseArticles: baseCollectionSummary(extracted.knowledgeBaseArticles.length),
  }
  const warnings = []
  let omittedWarnings = 0
  const warn = (message) => {
    if (warnings.length < 30) warnings.push(message)
    else omittedWarnings += 1
  }
  const users = []
  const seenIds = new Set()

  for (const [index, source] of extracted.users.entries()) {
    const normalized = normalizeUser(source, importTimestamp, sourceMode)
    if (normalized.error) {
      collections.users.invalid += 1
      collections.users.skipped += 1
      warn(`User record ${index + 1}: ${normalized.error}${normalized.id ? ` (${normalized.id})` : ''}`)
      continue
    }
    if (seenIds.has(normalized.user.id)) {
      collections.users.duplicateIds += 1
      collections.users.skipped += 1
      warn(`User record ${index + 1}: duplicate Firebase UID ${normalized.user.id}`)
      continue
    }

    seenIds.add(normalized.user.id)
    collections.users.validRecords += 1
    if (normalized.roleDefaulted) collections.users.defaultedRoles += 1
    if (normalized.statusDefaulted) collections.users.defaultedStatuses += 1
    users.push(normalized.user)
  }

  users.sort((left, right) => Number(right.role === 'school') - Number(left.role === 'school'))

  const invites = []
  const seenInviteIds = new Set()
  for (const [index, source] of extracted.invites.entries()) {
    const normalized = normalizeInvite(source, importTimestamp, index + 1)
    if (normalized.error) {
      collections.invites.invalid += 1
      collections.invites.skipped += 1
      warn(`Invite record ${index + 1}: ${normalized.error}`)
      continue
    }
    if (seenInviteIds.has(normalized.invite.id)) {
      collections.invites.duplicateIds += 1
      collections.invites.skipped += 1
      warn(`Invite record ${index + 1}: duplicate document ID`)
      continue
    }
    seenInviteIds.add(normalized.invite.id)
    collections.invites.validRecords += 1
    invites.push(normalized.invite)
  }

  const tickets = []
  const seenTicketIds = new Set()
  for (const [index, source] of extracted.tickets.entries()) {
    const normalized = normalizeTicket(source, importTimestamp, index + 1)
    if (normalized.error) {
      collections.tickets.invalid += 1
      collections.tickets.skipped += 1
      warn(`Ticket record ${index + 1}: ${normalized.error}${normalized.id ? ` (${normalized.id})` : ''}`)
      continue
    }
    if (seenTicketIds.has(normalized.ticket.id)) {
      collections.tickets.duplicateIds += 1
      collections.tickets.skipped += 1
      warn(`Ticket record ${index + 1}: duplicate document ID (${normalized.ticket.id})`)
      continue
    }
    seenTicketIds.add(normalized.ticket.id)
    collections.tickets.validRecords += 1
    tickets.push(normalized.ticket)
  }

  const pages = []
  const seenPageIds = new Set()
  for (const [index, source] of extracted.pages.entries()) {
    const normalized = normalizePage(source, importTimestamp, index + 1)
    if (normalized.error) {
      collections.pages.invalid += 1
      collections.pages.skipped += 1
      warn(`Page record ${index + 1}: ${normalized.error}`)
      continue
    }
    if (seenPageIds.has(normalized.page.id)) {
      collections.pages.duplicateIds += 1
      collections.pages.skipped += 1
      warn(`Page record ${index + 1}: duplicate document ID (${normalized.page.id})`)
      continue
    }
    seenPageIds.add(normalized.page.id)
    collections.pages.validRecords += 1
    for (const warning of normalized.warnings ?? []) {
      collections.pages.normalizationWarnings += 1
      warn(`Page ${normalized.page.id}: ${warning}`)
    }
    // These are deterministic safety repairs (for example, replacing an
    // unsafe asset path), not data-loss warnings that should block cutover.
    collections.pages.safetyNormalizations += (normalized.safetyNormalizations ?? []).length
    pages.push(normalized.page)
  }

  const dashboards = []
  const seenDashboardUsers = new Set()
  for (const [index, source] of extracted.dashboards.entries()) {
    const normalized = normalizeDashboard(source, importTimestamp, index + 1)
    if (normalized.error) {
      collections.dashboards.invalid += 1
      collections.dashboards.skipped += 1
      warn(`Dashboard record ${index + 1}: ${normalized.error}`)
      continue
    }
    if (seenDashboardUsers.has(normalized.dashboard.userId)) {
      collections.dashboards.duplicateIds += 1
      collections.dashboards.skipped += 1
      warn(`Dashboard record ${index + 1}: duplicate user/document ID (${normalized.dashboard.userId})`)
      continue
    }
    seenDashboardUsers.add(normalized.dashboard.userId)
    collections.dashboards.validRecords += 1
    for (const warning of normalized.warnings ?? []) {
      collections.dashboards.normalizationWarnings += 1
      warn(`Dashboard ${normalized.dashboard.userId}: ${warning}`)
    }
    // See page handling above: these repairs preserve a renderable,
    // runtime-safe record and are reported separately from partial imports.
    collections.dashboards.safetyNormalizations += (normalized.safetyNormalizations ?? []).length
    dashboards.push(normalized.dashboard)
  }

  function normalizeSourceCollection(collectionName, normalizer, resultKey) {
    const records = []
    const ids = new Set()
    for (const [index, source] of extracted[collectionName].entries()) {
      const normalized = normalizer(source, importTimestamp, index + 1)
      const record = normalized[resultKey]
      if (normalized.error || !record) {
        collections[collectionName].invalid += 1
        collections[collectionName].skipped += 1
        warn(`${collectionName} record ${index + 1}: ${normalized.error ?? 'could not be normalized'}`)
        continue
      }
      if (ids.has(record.id)) {
        collections[collectionName].duplicateIds += 1
        collections[collectionName].skipped += 1
        warn(`${collectionName} record ${index + 1}: duplicate document ID (${record.id})`)
        continue
      }
      ids.add(record.id)
      collections[collectionName].validRecords += 1
      records.push(record)
    }
    return records
  }

  const normalizedBlogPosts = normalizeSourceCollection('blogPosts', normalizeBlogPost, 'post')
  const resolvedBlogPosts = disambiguateBlogSlugs(normalizedBlogPosts)
  const blogPosts = resolvedBlogPosts.posts
  collections.blogPosts.slugDisambiguated = resolvedBlogPosts.slugDisambiguated
  const conversations = normalizeSourceCollection('conversations', normalizeConversation, 'conversation')
  const notifications = normalizeSourceCollection('notifications', normalizeNotification, 'notification')
  const invalidatedEmailCodes = normalizeSourceCollection(
    'emailVerificationCodes',
    normalizeInvalidatedEmailCode,
    'code',
  )
  const jobs = normalizeSourceCollection('jobs', normalizeJob, 'job')
  const applications = normalizeSourceCollection('applications', normalizeApplication, 'application')
  const partnerships = normalizeSourceCollection('partnerships', normalizePartnership, 'partnership')
  const archivedMail = normalizeSourceCollection('mail', normalizeMail, 'mail')
  const announcements = normalizeSourceCollection('announcements', normalizeAnnouncement, 'announcement')
  const knowledgeBaseArticles = normalizeSourceCollection(
    'knowledgeBaseArticles',
    normalizeKnowledgeBaseArticle,
    'article',
  )

  const client = new pg.Client(database)
  await client.connect()
  let transactionOpen = false
  let partial = false
  let transactionOutcome = 'not_started'

  try {
    await client.query('BEGIN')
    transactionOpen = true
    await client.query('SELECT pg_advisory_xact_lock($1)', [78_342_110])
    const existingUserResult = await client.query(`
      SELECT id, email, legacy_firebase_uid, deleted_at,
        (password_hash IS NOT NULL OR google_sub IS NOT NULL) AS has_native_auth
      FROM users
    `)
    const existingUsers = new Map(existingUserResult.rows.map((row) => [row.id, row]))
    const existingSchoolResult = await client.query("SELECT id FROM users WHERE role = 'school' AND deleted_at IS NULL")
    const validSchoolIds = new Set(existingSchoolResult.rows.map((row) => row.id))
    const existingArchivedUserResult = await client.query(`
      SELECT legacy_firebase_uid FROM legacy_firestore_user_archives
    `)
    const existingArchivedUserIds = new Set(existingArchivedUserResult.rows.map((row) => row.legacy_firebase_uid))
    const importedAuthIdentityIds = new Set([...existingUsers.values()]
      .filter((user) => user.legacy_firebase_uid && !user.deleted_at)
      .map((user) => user.legacy_firebase_uid))
    const importedAuthIdentityEmails = new Set([...existingUsers.values()]
      .filter((user) => user.legacy_firebase_uid && !user.deleted_at && typeof user.email === 'string')
      .map((user) => user.email.toLowerCase()))
    const archiveCandidateIds = new Set()
    const identityConflictIds = new Set()
    if (sourceMode === 'firestore') {
      for (const user of users) {
        const existingUser = existingUsers.get(user.id)
        const matchingCandidateIds = user.firestoreIdentityCandidateIds
          .filter((id) => importedAuthIdentityIds.has(id))
        const matchingCandidateEmails = user.firestoreIdentityCandidateEmails
          .filter((email) => importedAuthIdentityEmails.has(email))
        const directAuthIdentity = importedAuthIdentityIds.has(user.id)
        const directAuthEmail = directAuthIdentity && typeof existingUser?.email === 'string'
          ? existingUser.email.toLowerCase()
          : null
        const mismatchedDirectIdentity = directAuthIdentity && (
          matchingCandidateIds.some((id) => id !== user.id)
          || matchingCandidateEmails.some((email) => email !== directAuthEmail)
        )
        if (mismatchedDirectIdentity || (!existingUser && (matchingCandidateIds.length || matchingCandidateEmails.length))) {
          identityConflictIds.add(user.id)
          collections.users.identityConflicts += 1
          collections.users.skipped += 1
          warn(`Firestore user ${user.id}: potential Firebase Auth identity requires an explicit reviewed mapping`)
          continue
        }
        if (existingUser) continue
        archiveCandidateIds.add(user.id)
      }
    }
    const archivedFirestoreUserIds = new Set()

    // Archive candidates before any active-profile reconciliation: an
    // Auth-backed profile may safely reference one of these archive rows.
    for (const user of users) {
      if (!archiveCandidateIds.has(user.id)) continue
      if (!user.firestoreArchivePayload || !user.firestoreSourceHash) {
        collections.users.databaseRejected += 1
        collections.users.skipped += 1
        warn(`Firestore user ${user.id}: could not create a safe non-auth profile archive`)
        continue
      }
      const existingArchive = existingArchivedUserIds.has(user.id)
      const archiveOutcome = await executeRecoverableUpsert(
        client,
        'firebase_non_auth_user_archive',
        UPSERT_LEGACY_FIRESTORE_USER_ARCHIVE_SQL,
        [
          user.id,
          JSON.stringify(user.firestoreArchivePayload),
          user.firestoreSourceHash,
          user.createdAt,
          user.sourceUpdatedAt,
        ],
      )
      if (archiveOutcome.error) {
        collections.users.databaseRejected += 1
        collections.users.skipped += 1
        warn(`Firestore user ${user.id}: non-auth profile archive was rejected (${archiveOutcome.error.code})`)
        continue
      }
      archivedFirestoreUserIds.add(user.id)
      collections.users.archivedNonAuthProfiles += 1
      if (!archiveOutcome.result.rowCount) collections.users.archivedNonAuthProfilesUnchanged += 1
      else if (existingArchive) collections.users.archivedNonAuthProfilesUpdated += 1
      else {
        collections.users.archivedNonAuthProfilesInserted += 1
        existingArchivedUserIds.add(user.id)
      }
    }

    async function reconcileArchivedProfileReference(collectionName, recordId, fieldName, reference, sourceHash) {
      const archivedProfileId = reference && archivedFirestoreUserIds.has(reference) ? reference : null
      if (!archivedProfileId) {
        await client.query(`
          DELETE FROM legacy_firestore_user_archive_references
          WHERE source_collection = $1 AND source_id = $2 AND source_field = $3
        `, [collectionName, recordId, fieldName])
        return false
      }
      const outcome = await executeRecoverableUpsert(
        client,
        'firebase_archived_profile_reference',
        UPSERT_LEGACY_FIRESTORE_USER_ARCHIVE_REFERENCE_SQL,
        [collectionName, recordId, fieldName, archivedProfileId, sourceHash],
      )
      if (outcome.error) {
        collections[collectionName].databaseRejected += 1
        collections[collectionName].skipped += 1
        warn(`${collectionName} ${recordId}: archived profile reference was rejected (${outcome.error.code})`)
        return true
      }
      collections[collectionName].archivedReferences += 1
      return true
    }

    for (const user of users) {
      const existingUser = existingUsers.get(user.id)
      const existingById = Boolean(existingUser)

      if (sourceMode === 'firestore' && identityConflictIds.has(user.id)) {
        continue
      }
      if (sourceMode === 'firestore' && !existingUser) {
        continue
      }
      if (existingUser?.deleted_at || (existingUser && existingUser.legacy_firebase_uid !== user.id)) {
        collections.users.protectedAccounts += 1
        collections.users.skipped += 1
        warn(`User ${user.id}: an existing non-legacy or deleted account was protected from import`)
        continue
      }
      if (existingUser?.has_native_auth) {
        collections.users.protectedAccounts += 1
        collections.users.skipped += 1
        warn(`User ${user.id}: an account with a Yahnu password or Google identity was protected from import`)
        continue
      }
      if (sourceMode === 'firestore' && existingUser.email.toLowerCase() !== user.email.toLowerCase()) {
        collections.users.identityEmailMismatches += 1
        warn(`Firestore user ${user.id}: profile email differed from Firebase Auth and was ignored`)
      }

      const archivedSchoolReference = sourceMode === 'firestore'
        && user.schoolId
        && archivedFirestoreUserIds.has(user.schoolId)
        ? user.schoolId
        : null
      if (archivedSchoolReference) user.schoolId = null
      else if (user.schoolId && !validSchoolIds.has(user.schoolId)) {
        collections.users.missingSchoolReferences += 1
        collections.users.orphaned += 1
        warn(`User ${user.id}: school ${user.schoolId} was not found; school_id was left unset`)
        user.schoolId = null
      }

      if (sourceMode === 'auth') {
        const emailConflict = await client.query(
          `SELECT id FROM users
           WHERE lower(email) = lower($1) AND id <> $2 AND deleted_at IS NULL
           LIMIT 1`,
          [user.email, user.id],
        )
        if (emailConflict.rowCount) {
          collections.users.emailConflicts += 1
          collections.users.skipped += 1
          warn(`User ${user.id}: email is already attached to a different account`)
          continue
        }
      }

      const outcome = await executeRecoverableUpsert(
        client,
        'firebase_user_import',
        sourceMode === 'auth' ? UPSERT_AUTH_USER_SQL : UPDATE_FIRESTORE_USER_SQL,
        sourceMode === 'auth' ? userParameters(user) : firestoreUserParameters(user),
      )
      if (outcome.error) {
        collections.users.databaseRejected += 1
        collections.users.skipped += 1
        warn(`User ${user.id}: rejected by database constraints (${outcome.error.code})`)
        continue
      }
      if (sourceMode === 'auth') {
        for (const identity of user.identities) {
          const identityOutcome = await executeRecoverableUpsert(
            client,
            'firebase_identity_import',
            UPSERT_AUTH_IDENTITY_SQL,
            [user.id, identity.provider, identity.subject, identity.email],
          )
          if (identityOutcome.error) {
            collections.users.identityConflicts += 1
            warn(`User ${user.id}: ${identity.provider} identity conflicted with another account`)
          } else {
            collections.users.identitiesUpserted += Number(identityOutcome.result.rowCount > 0)
          }
        }
      }
      if (sourceMode === 'firestore') {
        await reconcileArchivedProfileReference(
          'users',
          user.id,
          'school_id',
          archivedSchoolReference,
          user.firestoreSourceHash,
        )
      }
      if (!outcome.result.rowCount) {
        collections.users.unchanged += 1
        continue
      }
      if (existingById) collections.users.updated += 1
      else collections.users.inserted += 1
      if (!existingById) {
        existingUsers.set(user.id, {
          id: user.id,
          email: user.email,
          legacy_firebase_uid: user.id,
          deleted_at: null,
          has_native_auth: false,
        })
      }
      const storedUser = outcome.result.rows[0]
      if (!storedUser.deleted_at && storedUser.role === 'school') validSchoolIds.add(user.id)
    }

    const validUserResult = await client.query('SELECT id, role, status FROM users WHERE deleted_at IS NULL')
    const validUsers = new Map(validUserResult.rows.map((row) => [row.id, row]))
    const validUserIds = new Set(validUsers.keys())

    const importableInvites = []
    for (const invite of invites) {
      const creator = invite.createdBy ? validUsers.get(invite.createdBy) : null
      if (!creator) {
        invite.createdBy = null
        collections.invites.missingCreator += 1
        if (invite.status !== 'pending') {
          warn(`Invite record ${invite.sourceIndex}: missing creator provenance was preserved as null`)
        }
      }
      if (invite.status === 'pending') {
        const trustedCreator = creator?.status === 'active'
          && ['admin', 'super_admin'].includes(creator.role)
          && (invite.role !== 'super_admin' || creator.role === 'super_admin')
        if (!trustedCreator) {
          invite.status = 'revoked'
          collections.invites.untrustedPendingRevoked += 1
          warn(`Invite record ${invite.sourceIndex}: pending legacy invite lacked authorized creator provenance and was revoked`)
        }
      }
      if (invite.usedBy && !validUserIds.has(invite.usedBy)) {
        invite.usedBy = null
        collections.invites.invalidUsedByCleared += 1
        warn(`Invite record ${invite.sourceIndex}: unknown used-by account was cleared`)
      }
      importableInvites.push(invite)
    }

    const authSecret = process.env.AUTH_SECRET
    if (importableInvites.some((invite) => invite.status === 'pending') && (!authSecret || authSecret.length < 32)) {
      throw new Error('AUTH_SECRET with at least 32 characters is required to import pending invitations.')
    }

    const existingInviteResult = await client.query('SELECT id FROM invites')
    const existingInviteIds = new Set(existingInviteResult.rows.map((row) => row.id))
    for (const invite of importableInvites) {
      const existing = existingInviteIds.has(invite.id)
      const outcome = await executeRecoverableUpsert(
        client,
        'firebase_invite_import',
        UPSERT_INVITE_SQL,
        inviteParameters(invite, authSecret),
      )
      if (outcome.error) {
        collections.invites.databaseRejected += 1
        collections.invites.skipped += 1
        warn(`Invite record ${invite.sourceIndex}: rejected by database constraints (${outcome.error.code})`)
        continue
      }
      if (!outcome.result.rowCount) collections.invites.unchanged += 1
      else if (existing) collections.invites.updated += 1
      else {
        collections.invites.inserted += 1
        existingInviteIds.add(invite.id)
      }
    }

    const existingTicketResult = await client.query('SELECT id FROM tickets')
    const existingTicketIds = new Set(existingTicketResult.rows.map((row) => row.id))
    for (const ticket of tickets) {
      if (!validUserIds.has(ticket.userId)) {
        collections.tickets.orphaned += 1
        collections.tickets.skipped += 1
        warn(`Ticket ${ticket.id}: user account was not found`)
        continue
      }
      const existing = existingTicketIds.has(ticket.id)
      const outcome = await executeRecoverableUpsert(
        client,
        'firebase_ticket_import',
        UPSERT_TICKET_SQL,
        ticketParameters(ticket),
      )
      if (outcome.error) {
        collections.tickets.databaseRejected += 1
        collections.tickets.skipped += 1
        warn(`Ticket ${ticket.id}: rejected by database constraints (${outcome.error.code})`)
        continue
      }
      if (!outcome.result.rowCount) collections.tickets.unchanged += 1
      else if (existing) collections.tickets.updated += 1
      else {
        collections.tickets.inserted += 1
        existingTicketIds.add(ticket.id)
      }
    }

    const existingPageResult = await client.query('SELECT id FROM pages')
    const existingPageIds = new Set(existingPageResult.rows.map((row) => row.id))
    for (const page of pages) {
      if (page.updatedBy && !validUserIds.has(page.updatedBy)) {
        page.updatedBy = null
        collections.pages.invalidUpdatedByCleared += 1
        warn(`Page ${page.id}: unknown updated-by account was cleared`)
      }
      const existing = existingPageIds.has(page.id)
      const outcome = await executeRecoverableUpsert(
        client,
        'firebase_page_import',
        UPSERT_PAGE_SQL,
        pageParameters(page),
      )
      if (outcome.error) {
        collections.pages.databaseRejected += 1
        collections.pages.skipped += 1
        warn(`Page ${page.id}: rejected by database constraints (${outcome.error.code})`)
        continue
      }
      if (!outcome.result.rowCount) collections.pages.unchanged += 1
      else if (existing) collections.pages.updated += 1
      else {
        collections.pages.inserted += 1
        existingPageIds.add(page.id)
      }
    }

    const existingDashboardResult = await client.query('SELECT user_id FROM dashboard_preferences')
    const existingDashboardUsers = new Set(existingDashboardResult.rows.map((row) => row.user_id))
    for (const dashboard of dashboards) {
      if (!validUserIds.has(dashboard.userId)) {
        collections.dashboards.orphaned += 1
        collections.dashboards.skipped += 1
        warn(`Dashboard ${dashboard.userId}: user account was not found`)
        continue
      }
      const existing = existingDashboardUsers.has(dashboard.userId)
      const outcome = await executeRecoverableUpsert(
        client,
        'firebase_dashboard_import',
        UPSERT_DASHBOARD_SQL,
        dashboardParameters(dashboard),
      )
      if (outcome.error) {
        collections.dashboards.databaseRejected += 1
        collections.dashboards.skipped += 1
        warn(`Dashboard ${dashboard.userId}: rejected by database constraints (${outcome.error.code})`)
        continue
      }
      if (!outcome.result.rowCount) collections.dashboards.unchanged += 1
      else if (existing) collections.dashboards.updated += 1
      else {
        collections.dashboards.inserted += 1
        existingDashboardUsers.add(dashboard.userId)
      }
    }

    async function existingIdSet(sql, column = 'id') {
      const result = await client.query(sql)
      return new Set(result.rows.map((row) => row[column]))
    }

    async function trackedUpsert(collectionName, id, existingIds, savepoint, sql, parameters) {
      const existing = existingIds.has(id)
      const outcome = await executeRecoverableUpsert(client, savepoint, sql, parameters)
      if (outcome.error) {
        collections[collectionName].databaseRejected += 1
        collections[collectionName].skipped += 1
        warn(`${collectionName} ${id}: rejected by database constraints (${outcome.error.code})`)
        return { accepted: false, changed: false }
      }
      if (!outcome.result.rowCount) collections[collectionName].unchanged += 1
      else if (existing) collections[collectionName].updated += 1
      else {
        collections[collectionName].inserted += 1
        existingIds.add(id)
      }
      return { accepted: true, changed: Boolean(outcome.result.rowCount) }
    }

    function noteMissingReference(collectionName, recordId, label, reference, validIds) {
      if (!reference || validIds.has(reference)) return
      collections[collectionName].orphaned += 1
      warn(`${collectionName} ${recordId}: referenced ${label} ${reference} was not found; the source reference was preserved without a foreign key`)
    }

    function isVerifiedAbsentFirestoreReference(
      collectionName,
      recordId,
      fieldName,
      reference,
      sourceHash,
    ) {
      const targetRefSha256 = reference ? sha256(reference) : null
      return sourceMode === 'firestore'
        && Boolean(reference)
        && !validUserIds.has(reference)
        && !archivedFirestoreUserIds.has(reference)
        && !importedAuthIdentityIds.has(reference)
        && !importedAuthIdentityEmails.has(String(reference).toLowerCase())
        && !knownFirestoreDocumentIds.has(reference)
        && !rawFirestoreUserIdentityValues.ids.has(reference)
        && !rawFirestoreUserIdentityValues.emails.has(String(reference).toLowerCase())
        && Boolean(targetRefSha256)
        && isApprovedQuarantinedFirestoreReference(
          collectionName,
          sha256(recordId),
          fieldName,
          sourceHash,
          targetRefSha256,
        )
    }

    async function reconcileQuarantinedFirestoreReference(
      collectionName,
      recordId,
      fieldName,
      reference,
      sourceHash,
      shouldQuarantine,
    ) {
      if (!shouldQuarantine) {
        await client.query(`
          DELETE FROM legacy_unresolved_firestore_references
          WHERE source_collection = $1 AND source_id = $2 AND source_field = $3
        `, [collectionName, recordId, fieldName])
        return false
      }
      const targetRefSha256 = sha256(reference)
      await client.query(`
        DELETE FROM legacy_unresolved_firestore_references
        WHERE source_collection = $1
          AND source_id = $2
          AND source_field = $3
          AND target_ref_sha256 <> $4
      `, [collectionName, recordId, fieldName, targetRefSha256])
      const outcome = await executeRecoverableUpsert(
        client,
        'firebase_unresolved_reference',
        UPSERT_LEGACY_UNRESOLVED_FIRESTORE_REFERENCE_SQL,
        [collectionName, recordId, fieldName, targetRefSha256, sourceHash],
      )
      if (outcome.error) {
        collections[collectionName].databaseRejected += 1
        collections[collectionName].skipped += 1
        warn(`${collectionName} ${recordId}: verified-absent reference quarantine was rejected (${outcome.error.code})`)
        return true
      }
      collections[collectionName].quarantinedReferences += 1
      return true
    }

    async function reconcileQuarantinedConversationParticipants(conversation, references) {
      const targetHashes = [...new Set(references.map((reference) => sha256(reference)))]
      if (targetHashes.length) {
        await client.query(`
          DELETE FROM legacy_unresolved_firestore_references
          WHERE source_collection = 'conversations'
            AND source_id = $1
            AND source_field = 'participant_ref'
            AND NOT (target_ref_sha256 = ANY($2::text[]))
        `, [conversation.id, targetHashes])
      } else {
        await client.query(`
          DELETE FROM legacy_unresolved_firestore_references
          WHERE source_collection = 'conversations'
            AND source_id = $1
            AND source_field = 'participant_ref'
        `, [conversation.id])
      }
      for (const targetHash of targetHashes) {
        const outcome = await executeRecoverableUpsert(
          client,
          'firebase_unresolved_participant',
          UPSERT_LEGACY_UNRESOLVED_FIRESTORE_REFERENCE_SQL,
          ['conversations', conversation.id, 'participant_ref', targetHash, conversation.sourceHash],
        )
        if (outcome.error) {
          collections.conversations.databaseRejected += 1
          collections.conversations.skipped += 1
          warn(`Conversation ${conversation.id}: verified-absent participant quarantine was rejected (${outcome.error.code})`)
          continue
        }
        collections.conversations.quarantinedReferences += 1
      }
    }

    const existingBlogPostIds = await existingIdSet('SELECT id FROM blog_posts')
    for (const post of blogPosts) {
      noteMissingReference('blogPosts', post.id, 'author', post.authorRef, validUserIds)
      await trackedUpsert('blogPosts', post.id, existingBlogPostIds, 'firebase_blog_post_import', UPSERT_BLOG_POST_SQL, [
        post.id,
        post.slug,
        post.title,
        post.authorName ?? 'Yahnu',
        post.excerpt,
        post.content,
        post.status,
        post.imageUrl,
        post.authorRef && validUserIds.has(post.authorRef) ? post.authorRef : null,
        post.authorRef,
        post.legacyImageUrlSha256,
        post.publishedAt,
        JSON.stringify(post.payload),
        post.sourceHash,
        post.hasSourceTimestamp ? post.updatedAt : null,
        post.createdAt,
        post.updatedAt,
      ])
    }

    const existingJobIds = await existingIdSet('SELECT id FROM jobs')
    for (const job of jobs) {
      const archivedCompanyReference = archivedFirestoreUserIds.has(job.companyRef)
      const quarantinedCompanyReference = !archivedCompanyReference
        && isVerifiedAbsentFirestoreReference('jobs', job.id, 'company_ref', job.companyRef, job.sourceHash)
      if (!archivedCompanyReference && !quarantinedCompanyReference) {
        noteMissingReference('jobs', job.id, 'company', job.companyRef, validUserIds)
      }
      const jobOutcome = await trackedUpsert('jobs', job.id, existingJobIds, 'firebase_job_import', UPSERT_JOB_SQL, [
        job.id,
        job.companyRef && validUserIds.has(job.companyRef) ? job.companyRef : null,
        job.companyRef,
        job.title,
        job.companyName,
        job.location,
        job.employmentType,
        job.description,
        job.status,
        job.applicationUrl,
        job.closesAt,
        JSON.stringify(job.payload),
        job.sourceHash,
        job.hasSourceTimestamp ? job.updatedAt : null,
        job.createdAt,
        job.updatedAt,
      ])
      if (jobOutcome.accepted) {
        await reconcileArchivedProfileReference('jobs', job.id, 'company_ref', job.companyRef, job.sourceHash)
        await reconcileQuarantinedFirestoreReference(
          'jobs',
          job.id,
          'company_ref',
          job.companyRef,
          job.sourceHash,
          quarantinedCompanyReference,
        )
      }
    }

    const validJobIds = await existingIdSet('SELECT id FROM jobs')
    const existingApplicationIds = await existingIdSet('SELECT id FROM applications')
    for (const application of applications) {
      noteMissingReference('applications', application.id, 'job', application.jobRef, validJobIds)
      const archivedApplicantReference = archivedFirestoreUserIds.has(application.applicantRef)
      if (!archivedApplicantReference) {
        noteMissingReference('applications', application.id, 'applicant', application.applicantRef, validUserIds)
      }
      const applicationOutcome = await trackedUpsert('applications', application.id, existingApplicationIds, 'firebase_application_import', UPSERT_APPLICATION_SQL, [
        application.id,
        application.jobRef && validJobIds.has(application.jobRef) ? application.jobRef : null,
        application.jobRef,
        application.applicantRef && validUserIds.has(application.applicantRef) ? application.applicantRef : null,
        application.applicantRef,
        application.status,
        application.coverLetter,
        application.legacyResumeUrlSha256,
        JSON.stringify(application.payload),
        application.sourceHash,
        application.hasSourceTimestamp ? application.updatedAt : null,
        application.submittedAt,
        application.updatedAt,
      ])
      if (applicationOutcome.accepted) {
        await reconcileArchivedProfileReference(
          'applications',
          application.id,
          'applicant_ref',
          application.applicantRef,
          application.sourceHash,
        )
      }
    }

    const existingPartnershipIds = await existingIdSet('SELECT id FROM partnerships')
    for (const partnership of partnerships) {
      const archivedRequesterReference = archivedFirestoreUserIds.has(partnership.requesterRef)
      const archivedPartnerReference = archivedFirestoreUserIds.has(partnership.partnerRef)
      const quarantinedPartnerReference = !archivedPartnerReference
        && isVerifiedAbsentFirestoreReference(
          'partnerships',
          partnership.id,
          'partner_ref',
          partnership.partnerRef,
          partnership.sourceHash,
        )
      if (!archivedRequesterReference) {
        noteMissingReference('partnerships', partnership.id, 'requester', partnership.requesterRef, validUserIds)
      }
      if (!archivedPartnerReference && !quarantinedPartnerReference) {
        noteMissingReference('partnerships', partnership.id, 'partner', partnership.partnerRef, validUserIds)
      }
      const partnershipOutcome = await trackedUpsert('partnerships', partnership.id, existingPartnershipIds, 'firebase_partnership_import', UPSERT_PARTNERSHIP_SQL, [
        partnership.id,
        partnership.requesterRef && validUserIds.has(partnership.requesterRef) ? partnership.requesterRef : null,
        partnership.requesterRef,
        partnership.partnerRef && validUserIds.has(partnership.partnerRef) ? partnership.partnerRef : null,
        partnership.partnerRef,
        partnership.organizationName,
        partnership.contactEmail,
        partnership.status,
        JSON.stringify(partnership.payload),
        partnership.sourceHash,
        partnership.hasSourceTimestamp ? partnership.updatedAt : null,
        partnership.createdAt,
        partnership.updatedAt,
      ])
      if (partnershipOutcome.accepted) {
        await reconcileArchivedProfileReference(
          'partnerships',
          partnership.id,
          'requester_ref',
          partnership.requesterRef,
          partnership.sourceHash,
        )
        await reconcileArchivedProfileReference(
          'partnerships',
          partnership.id,
          'partner_ref',
          partnership.partnerRef,
          partnership.sourceHash,
        )
        await reconcileQuarantinedFirestoreReference(
          'partnerships',
          partnership.id,
          'partner_ref',
          partnership.partnerRef,
          partnership.sourceHash,
          quarantinedPartnerReference,
        )
      }
    }

    const validTicketIds = await existingIdSet('SELECT id FROM tickets')
    const existingConversationIds = await existingIdSet('SELECT id FROM conversations')
    for (const conversation of conversations) {
      noteMissingReference('conversations', conversation.id, 'ticket', conversation.ticketRef, validTicketIds)
      if (!isConversationEligibleForImport(
        conversation.participants,
        validUserIds,
        (participant) => isVerifiedAbsentFirestoreReference(
          'conversations',
          conversation.id,
          'participant_ref',
          participant.ref,
          conversation.sourceHash,
        ),
      )) {
        collections.conversations.orphaned += 1
        collections.conversations.skipped += 1
        warn(`Conversation ${conversation.id}: no participant has an imported runtime account`)
        continue
      }
      const conversationOutcome = await trackedUpsert(
        'conversations',
        conversation.id,
        existingConversationIds,
        'firebase_conversation_import',
        UPSERT_CONVERSATION_SQL,
        [
          conversation.id,
          conversation.name,
          conversation.avatarUrl,
          conversation.legacyAvatarUrlSha256,
          conversation.lastMessage,
          conversation.lastMessageAt,
          runtimeConversationTicketReference(conversation, validUserIds, validTicketIds),
          JSON.stringify(conversation.payload),
          conversation.sourceHash,
          conversation.hasSourceTimestamp ? conversation.updatedAt : null,
          conversation.createdAt,
          conversation.updatedAt,
        ],
      )
      if (!conversationOutcome.accepted) continue

      const quarantinedParticipantReferences = []
      for (const participant of conversation.participants) {
        if (!validUserIds.has(participant.ref)) {
          if (isVerifiedAbsentFirestoreReference(
            'conversations',
            conversation.id,
            'participant_ref',
            participant.ref,
            conversation.sourceHash,
          )) {
            quarantinedParticipantReferences.push(participant.ref)
            continue
          }
          collections.conversations.orphaned += 1
          collections.conversations.skipped += 1
          warn(`Conversation ${conversation.id}: participant ${participant.ref} has no imported user account`)
          continue
        }
        const participantOutcome = await executeRecoverableUpsert(
          client,
          'firebase_conversation_participant_import',
          UPSERT_CONVERSATION_PARTICIPANT_SQL,
          [
            conversation.id,
            participant.ref,
            participant.ref,
            participant.displayName,
            participant.unreadCount,
            participant.joinedAt,
            JSON.stringify(participant.metadata),
          ],
        )
        if (participantOutcome.error) {
          collections.conversations.databaseRejected += 1
          warn(`Conversation ${conversation.id}: participant ${participant.ref} was rejected (${participantOutcome.error.code})`)
        } else {
          collections.conversations.participants += 1
        }
      }
      await reconcileQuarantinedConversationParticipants(conversation, quarantinedParticipantReferences)

      for (const message of conversation.messages) {
        if (!message.senderRef || !validUserIds.has(message.senderRef)) {
          collections.conversations.orphaned += 1
          collections.conversations.skipped += 1
          warn(`Conversation ${conversation.id}: message ${message.id} has no imported sender account`)
          continue
        }
        const messageOutcome = await executeRecoverableUpsert(
          client,
          'firebase_conversation_message_import',
          UPSERT_MESSAGE_SQL,
          [
            message.id,
            conversation.id,
            message.senderRef,
            message.senderRef,
            message.body,
            message.legacyAttachmentUrlSha256,
            message.sourceIndex,
            JSON.stringify(message.payload),
            message.sourceHash,
            message.editedAt ?? message.sentAt,
            message.sentAt,
            message.editedAt,
          ],
        )
        if (messageOutcome.error) {
          collections.conversations.databaseRejected += 1
          warn(`Conversation ${conversation.id}: message ${message.id} was rejected (${messageOutcome.error.code})`)
        } else {
          collections.conversations.messages += 1
        }
      }
    }

    const existingNotificationIds = await existingIdSet('SELECT id FROM notifications')
    for (const notification of notifications) {
      const recipientId = notification.recipientRef && validUserIds.has(notification.recipientRef)
        ? notification.recipientRef
        : null
      noteMissingReference('notifications', notification.id, 'recipient', notification.recipientRef, validUserIds)
      noteMissingReference('notifications', notification.id, 'actor', notification.actorRef, validUserIds)
      if (notification.recipientRef && !recipientId) {
        collections.notifications.skipped += 1
        warn(`notifications ${notification.id}: unresolved recipient was quarantined and not imported`)
        continue
      }
      const notificationOutcome = await trackedUpsert(
        'notifications',
        notification.id,
        existingNotificationIds,
        'firebase_notification_import',
        UPSERT_NOTIFICATION_SQL,
        [
          notification.id,
          recipientId,
          notification.recipientRef,
          notification.audienceRole,
          notification.isGlobal,
          notification.actorRef && validUserIds.has(notification.actorRef) ? notification.actorRef : null,
          notification.actorRef,
          notification.type,
          notification.title,
          notification.body,
          notification.link,
          JSON.stringify(notification.payload),
          notification.sourceHash,
          notification.hasSourceTimestamp ? notification.updatedAt : null,
          notification.createdAt,
          notification.expiresAt,
        ],
      )
      if (!notificationOutcome.accepted || !recipientId) continue
      const receiptOutcome = await executeRecoverableUpsert(
        client,
        'firebase_notification_receipt_import',
        UPSERT_NOTIFICATION_RECEIPT_SQL,
        [
          notification.id,
          recipientId,
          notification.deliveredAt,
          notification.readAt,
          notification.dismissedAt,
        ],
      )
      if (receiptOutcome.error) {
        collections.notifications.databaseRejected += 1
        warn(`Notification ${notification.id}: receipt was rejected (${receiptOutcome.error.code})`)
      } else {
        collections.notifications.receipts += 1
      }
    }

    const existingMailIds = await existingIdSet('SELECT id FROM archived_mail')
    for (const mail of archivedMail) {
      await trackedUpsert('mail', mail.id, existingMailIds, 'firebase_mail_import', UPSERT_ARCHIVED_MAIL_SQL, [
        mail.id,
        mail.envelopeFrom,
        JSON.stringify(mail.envelopeTo),
        mail.subject,
        mail.deliveryStatus,
        JSON.stringify(mail.payload),
        mail.sourceHash,
        mail.hasSourceTimestamp ? mail.updatedAt : null,
        mail.queuedAt,
        mail.completedAt,
      ])
    }

    const existingAnnouncementIds = await existingIdSet('SELECT id FROM announcements')
    for (const announcement of announcements) {
      noteMissingReference('announcements', announcement.id, 'creator', announcement.createdByRef, validUserIds)
      const announcementOutcome = await trackedUpsert('announcements', announcement.id, existingAnnouncementIds, 'firebase_announcement_import', UPSERT_ANNOUNCEMENT_SQL, [
        announcement.id,
        announcement.title,
        announcement.content,
        announcement.audience,
        announcement.status,
        announcement.expiresAt,
        announcement.createdByRef && validUserIds.has(announcement.createdByRef) ? announcement.createdByRef : null,
        JSON.stringify(announcement.payload),
        announcement.sourceHash,
        announcement.hasSourceTimestamp ? announcement.updatedAt : null,
        announcement.createdAt,
        announcement.updatedAt,
      ])
      if (!announcementOutcome.accepted || announcement.status !== 'active') continue

      const persistedAnnouncement = await client.query(`
        SELECT source_hash, status
        FROM announcements
        WHERE id = $1
      `, [announcement.id])
      if (
        persistedAnnouncement.rowCount !== 1
        || persistedAnnouncement.rows[0].source_hash !== announcement.sourceHash
        || persistedAnnouncement.rows[0].status !== 'active'
      ) {
        throw new Error(`Active announcement ${announcement.id} could not be reconciled before notification synthesis.`)
      }

      const generated = synthesizedAnnouncementNotification(announcement)
      const createdBy = generated.actorRef && validUserIds.has(generated.actorRef) ? generated.actorRef : null
      const generatedResult = await client.query(UPSERT_ANNOUNCEMENT_NOTIFICATION_SQL, [
        generated.id,
        generated.audienceRole,
        generated.isGlobal,
        generated.announcementId,
        createdBy,
        generated.actorRef,
        generated.title,
        generated.body,
        JSON.stringify(generated.payload),
        generated.sourceHash,
        generated.sourceUpdatedAt,
        generated.createdAt,
        generated.expiresAt,
      ])
      if (!generatedResult.rowCount) {
        const existingGenerated = await client.query(`
          SELECT announcement_id, target_role, is_global, type, title, body,
            source_payload, source_hash
          FROM notifications
          WHERE id = $1
        `, [generated.id])
        const row = existingGenerated.rows[0]
        if (
          existingGenerated.rowCount !== 1
          || row.announcement_id !== generated.announcementId
          || row.target_role !== generated.audienceRole
          || row.is_global !== generated.isGlobal
          || row.type !== 'announcement'
          || row.title !== generated.title
          || row.body !== generated.body
          || stableJson(row.source_payload) !== stableJson(generated.payload)
          || row.source_hash !== generated.sourceHash
        ) {
          throw new Error(`Active announcement ${announcement.id} collided with an unrelated notification ID.`)
        }
      }
      collections.announcements.notificationsSynthesized += 1
    }

    const existingKnowledgeArticleIds = await existingIdSet('SELECT id FROM knowledge_base_articles')
    for (const article of knowledgeBaseArticles) {
      noteMissingReference('knowledgeBaseArticles', article.id, 'creator', article.createdByRef, validUserIds)
      await trackedUpsert('knowledgeBaseArticles', article.id, existingKnowledgeArticleIds, 'firebase_knowledge_article_import', UPSERT_KNOWLEDGE_ARTICLE_SQL, [
        article.id,
        article.title,
        article.category,
        article.contentHtml,
        article.status,
        article.createdByRef && validUserIds.has(article.createdByRef) ? article.createdByRef : null,
        JSON.stringify(article.payload),
        article.sourceHash,
        article.hasSourceTimestamp ? article.updatedAt : null,
        article.createdAt,
        article.updatedAt,
      ])
    }

    const existingInvalidatedCodeIds = await existingIdSet('SELECT id FROM invalidated_legacy_email_codes')
    for (const code of invalidatedEmailCodes) {
      noteMissingReference('emailVerificationCodes', code.id, 'user', code.userRef, validUserIds)
      const outcome = await trackedUpsert(
        'emailVerificationCodes',
        code.id,
        existingInvalidatedCodeIds,
        'firebase_email_code_invalidation',
        UPSERT_INVALIDATED_EMAIL_CODE_SQL,
        [
          code.id,
          code.userRef,
          code.email,
          code.codeSha256,
          code.sourceHash,
          code.sourceExpiresAt,
          code.invalidatedAt,
        ],
      )
      if (outcome.accepted) collections.emailVerificationCodes.invalidated += 1
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

    partial = hasBlockingImportIssues(collections)

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
  } catch (error) {
    if (transactionOpen) await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    await client.end()
  }

  const totals = Object.values(collections).reduce((aggregate, collection) => {
    for (const key of ['sourceRecords', 'validRecords', 'inserted', 'updated', 'unchanged', 'skipped', 'invalid', 'orphaned', 'databaseRejected']) {
      aggregate[key] += collection[key] ?? 0
    }
    return aggregate
  }, {
    sourceRecords: 0,
    validRecords: 0,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    invalid: 0,
    orphaned: 0,
    databaseRejected: 0,
  })
  const output = {
    input: inputPath,
    source: sourceMode ?? 'data-only',
    dryRun: args.dryRun,
    allowPartial: args.allowPartial,
    partial,
    transaction: transactionOutcome,
    collections,
    totals,
  }
  if (warnings.length) output.warnings = warnings
  if (omittedWarnings) output.warningNote = `${omittedWarnings} additional warning(s) were omitted.`
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
  if (partial && !args.allowPartial) process.exitCode = 2
}

const invokedAsScript = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url

if (invokedAsScript) {
  main().catch((error) => {
    process.stderr.write(`Firebase import failed: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}

export {
  announcementNotificationId,
  disambiguateBlogSlugs,
  hasBlockingImportIssues,
  normalizeApplication,
  normalizeAnnouncement,
  normalizeBlogPost,
  normalizeLocalLink,
  normalizeMail,
  normalizeKnowledgeBaseArticle,
  normalizeConversation,
  normalizeDashboard,
  normalizeInvite,
  normalizeJob,
  normalizeNotification,
  normalizePage,
  normalizePartnership,
  normalizeTicket,
  normalizeUser,
  firestoreArchivePayload,
  preflightFirebaseAuthExport,
  isValidatedImportedHtml,
  isConversationEligibleForImport,
  runtimeConversationTicketReference,
  synthesizedAnnouncementNotification,
  assertPartialFirestoreImportAllowed,
  rawFirestoreDocumentIds,
  rawFirestoreUserIdentityCandidates,
}
