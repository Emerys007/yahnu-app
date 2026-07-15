import { createHash, createHmac } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import pg from 'pg'
import {
  normalizeApplication,
  normalizeBlogPost,
  normalizeConversation,
  normalizeDashboard,
  normalizeInvite,
  normalizeJob,
  normalizeMail,
  normalizeNotification,
  normalizePage,
  normalizePartnership,
  normalizeTicket,
  normalizeUser,
} from './import-firebase-json.mjs'

const FIRESTORE_FORMATS = new Set(['yahnu-firestore-rest-v1', 'yahnu-firestore-rest-v2'])
const COLLECTIONS = [
  'users', 'invites', 'tickets', 'pages', 'dashboards', 'blogPosts',
  'conversations', 'notifications', 'emailVerificationCodes', 'jobs',
  'applications', 'partnerships', 'mail', 'announcements', 'knowledgeBaseArticles',
]
const COLLECTION_SET = new Set(COLLECTIONS)
const ROUTE_ID_CONTRACTS = new Map([
  ['pages', { maximum: 128, pattern: /^[A-Za-z0-9][A-Za-z0-9_-]*$/ }],
  ['tickets', { maximum: 200 }],
  ['blogPosts', { maximum: 200, pattern: /^[A-Za-z0-9_-]+$/ }],
  ['conversations', { maximum: 240 }],
  ['notifications', { maximum: 500 }],
  ['jobs', { maximum: 200 }],
  ['applications', { maximum: 200 }],
  ['partnerships', { maximum: 200 }],
  ['announcements', { maximum: 160 }],
  ['knowledgeBaseArticles', { maximum: 160 }],
])
const SENSITIVE_KEYS = new Set([
  'password', 'confirmpassword', 'passwordconfirmation', 'rawpassword',
  'passwordhash', 'passwordsalt', 'salt', 'refreshtoken', 'oauthaccesstoken',
  'oauthidtoken', 'firebasestoragedownloadtokens',
])
const PERSISTENCE_SECRET_KEYS = new Set(['token', 'code', 'secret', 'apikey', 'authorization'])
const REDACTED_EMBEDDED_URL_SECRET = '[yahnu-redacted-embedded-url-secret]'
const PROFILE_AVATAR_KEYS = new Set([
  'avatar', 'avatarurl', 'photourl', 'profileimage', 'profileimageurl',
  'profilepicture', 'profilepictureurl',
])
const ANNOUNCEMENT_AUDIENCE_ROLES = new Set(['graduate', 'company', 'school'])
const GLOBAL_AUDIENCE_ALIASES = new Set(['all', 'all_users', 'everyone', 'global'])
const ALLOWED_IMPORTED_HTML_TAGS = new Set([
  'a', 'p', 'br', 'strong', 'em', 'u', 's', 'blockquote', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li',
])
const FORBIDDEN_IMPORTED_MARKUP = /<\s*(?:script|iframe|object|embed|style|link|meta|form|input|button|svg|math)\b|(?:\s|\/)on[a-z]+\s*=|\s(?:style|srcdoc)\s*=/i
const IMPORTED_TAG_PATTERN = /<\/?\s*([a-z][a-z0-9-]*)\b[^>]*>/gi
const IMPORTED_HREF_PATTERN = /\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi

function printHelp() {
  process.stdout.write(`Reconcile a completed Firebase-to-PostgreSQL import.

Usage:
  node scripts/verify-firebase-import.mjs --auth C:\\secure\\yahnu-auth.json --firestore C:\\secure\\yahnu-firestore.json

Options:
  --auth <path>       Firebase Auth JSON export (required)
  --firestore <path>  Output from export-firestore-json.mjs (required)
  --help              Show this help

DATABASE_URL and the exact Render AUTH_SECRET (at least 32 characters) are required.
Reconciliation checks exact source IDs and canonical
payload hashes for production collections, normalized conversation messages and
participants, Firebase provider identities, and explicit invalidation of every
legacy email-verification code. The command exits 2 on any mismatch.
`)
}

function parseArguments(argv) {
  const result = { auth: undefined, firestore: undefined, help: false }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--help') {
      result.help = true
      continue
    }
    const option = ['auth', 'firestore'].find((name) => argument === `--${name}` || argument.startsWith(`--${name}=`))
    if (!option) throw new Error(`Unknown option: ${argument}`)
    const value = argument === `--${option}` ? argv[++index] : argument.slice(`--${option}=`.length)
    if (!value || value.startsWith('--')) throw new Error(`--${option} requires a path.`)
    result[option] = value
  }
  return result
}

async function readJson(file, label) {
  if (!file) throw new Error(`--${label} is required.`)
  const resolved = path.resolve(file)
  try {
    return { path: resolved, data: JSON.parse(await readFile(resolved, 'utf8')) }
  } catch (error) {
    throw new Error(`Unable to read ${label} JSON: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizedKey(value) {
  return String(value).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
}

function decodeFieldMap(fields) {
  return Object.fromEntries(Object.entries(fields ?? {}).map(([key, value]) => [key, decodeFirestoreValue(value)]))
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
  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, decodeFirestoreValue(nested)]))
}

function sanitizeSensitive(value) {
  if (Array.isArray(value)) return value.map(sanitizeSensitive)
  if (!isObject(value)) return value
  const result = {}
  for (const [key, nested] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(normalizedKey(key)) || ['__proto__', 'prototype', 'constructor'].includes(key)) continue
    result[key] = sanitizeSensitive(nested)
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

function persistenceView(value) {
  if (Array.isArray(value)) return value.map(persistenceView)
  if (isObject(value)) {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !PERSISTENCE_SECRET_KEYS.has(normalizedKey(key)))
      .map(([key, nested]) => [key, persistenceView(nested)]))
  }
  const canonical = canonicalFirebaseStorageReference(value)
  if (canonical !== value) return canonical
  return containsEmbeddedUrlSecret(value) ? REDACTED_EMBEDDED_URL_SECRET : value
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
      const bucket = decodeURIComponent(match[1])
      const objectName = decodeURIComponent(match[2])
      return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(objectName)}?alt=media`
    }
    if (parsed.hostname === 'storage.googleapis.com') {
      const segments = parsed.pathname.split('/').filter(Boolean).map(decodeURIComponent)
      if (segments.length < 2) return value
      return `https://storage.googleapis.com/${encodeURIComponent(segments[0])}/${segments.slice(1).map(encodeURIComponent).join('/')}`
    }
  } catch {
    return value
  }
  return value
}

function materializeDocumentRaw(document) {
  if (!isObject(document)) return null
  if (isObject(document.fields)) return decodeFieldMap(document.fields)
  if (isObject(document.data)) return decodeFirestoreValue(document.data)
  return decodeFirestoreValue(document)
}

function materializeDocument(document) {
  return sanitizeSensitive(materializeDocumentRaw(document))
}

function materializePersistenceDocument(document) {
  return persistenceView(materializeDocument(document))
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

function runtimeTokenHash(token, secret) {
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new Error('AUTH_SECRET with at least 32 characters is required for reconciliation.')
  }
  return createHmac('sha256', secret).update(token).digest('hex')
}

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase()
}

function documentId(document) {
  const pathSegments = String(document?.name ?? document?.path ?? '').split('/').filter(Boolean)
  return String(pathSegments.at(-1) ?? document?.id ?? document?.documentId ?? document?.__id__ ?? '').trim()
}

function referenceId(value) {
  if (isObject(value)) return String(value.id ?? value.uid ?? value.userId ?? '').trim()
  const segments = String(value ?? '').split('/').filter(Boolean)
  return String(segments.at(-1) ?? '').trim()
}

function normalizedRole(value) {
  const role = String(value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  const aliases = {
    graduates: 'graduate',
    alumni: 'graduate',
    alumnus: 'graduate',
    student: 'graduate',
    employer: 'company',
    business: 'company',
    university: 'school',
    institution: 'school',
    administrator: 'admin',
    superadmin: 'super_admin',
    contentmanager: 'content_manager',
    contentmoderator: 'content_moderator',
    support: 'support_staff',
    supportstaff: 'support_staff',
  }
  return aliases[role] ?? role
}

function firstPresent(...values) {
  return values.find((value) => value !== null && value !== undefined && (typeof value !== 'string' || value.trim()))
}

function announcementNotificationId(announcementId) {
  return `firebase-announcement-${sha256(String(announcementId)).slice(0, 48)}`
}

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

function normalizedDate(value) {
  if (value === null || value === undefined || value === '') return null
  if (isObject(value)) {
    const seconds = value.seconds ?? value._seconds
    const nanoseconds = value.nanoseconds ?? value._nanoseconds ?? 0
    if (seconds !== undefined) return normalizedDate(Number(seconds) + Number(nanoseconds) / 1_000_000_000)
    if (Object.hasOwn(value, '$date')) return normalizedDate(value.$date)
    if (value.__datatype__ === 'timestamp' || value.type === 'timestamp') return normalizedDate(value.value)
    if (Object.hasOwn(value, 'timestampValue')) return normalizedDate(value.timestampValue)
    return null
  }
  let date
  if (typeof value === 'number' || (typeof value === 'string' && /^-?\d+(\.\d+)?$/.test(value.trim()))) {
    const number = Number(value)
    if (!Number.isFinite(number)) return null
    const magnitude = Math.abs(number)
    let milliseconds
    if (magnitude >= 1e17) milliseconds = number / 1e6
    else if (magnitude >= 1e14) milliseconds = number / 1e3
    else if (magnitude >= 1e11) milliseconds = number
    else milliseconds = number * 1_000
    date = new Date(milliseconds)
  } else date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function collectionDocuments(root, name) {
  const collection = root[name]
  if (collection === undefined) return []
  if (!Array.isArray(collection)) throw new Error(`The Firestore ${name} collection must be an array.`)
  return collection
}

function firestoreSource(root) {
  if (!FIRESTORE_FORMATS.has(root?._metadata?.format)) throw new Error('The Firestore file is not a Yahnu REST exporter result.')
  const unknown = Object.keys(root).filter((name) => name !== '_metadata' && !COLLECTION_SET.has(name))
  if (unknown.length) throw new Error(`The Firestore export contains unaccounted collection(s): ${unknown.join(', ')}.`)
  if (Array.isArray(root._metadata?.subcollections) && root._metadata.subcollections.length) {
    throw new Error('The Firestore export contains unaccounted document subcollections.')
  }
  const discovered = Array.isArray(root._metadata?.discoveredRootCollections)
    ? root._metadata.discoveredRootCollections
    : []
  const unknownDiscovered = discovered.filter((name) => !COLLECTION_SET.has(name))
  if (unknownDiscovered.length) throw new Error(`The Firestore metadata contains unaccounted collection(s): ${unknownDiscovered.join(', ')}.`)
  const collections = {}
  for (const name of COLLECTIONS) {
    const documents = collectionDocuments(root, name)
    const ids = new Set()
    const hashes = new Map()
    for (const document of documents) {
      const id = documentId(document)
      const payload = materializeDocument(document)
      if (!id || !payload) throw new Error(`The Firestore ${name} collection contains a document without a valid ID/payload.`)
      const idContract = ROUTE_ID_CONTRACTS.get(name)
      if (idContract && (id.length > idContract.maximum || (idContract.pattern && !idContract.pattern.test(id)))) {
        throw new Error(`The Firestore ${name} document ${id.slice(0, 80)} has an ID incompatible with its runtime route contract.`)
      }
      if (ids.has(id)) throw new Error(`The Firestore ${name} collection contains duplicate ID ${id}.`)
      ids.add(id)
      hashes.set(id, sha256(stableJson(payload)))
    }
    const manifest = root._metadata?.collections?.[name]
    if (root._metadata.format === 'yahnu-firestore-rest-v2') {
      if (!isObject(manifest)) throw new Error(`The Firestore metadata is missing the ${name} collection manifest.`)
      const sortedDocuments = [...documents].sort((left, right) => documentId(left).localeCompare(documentId(right)))
      const sortedIds = sortedDocuments.map(documentId)
      if (
        Number(manifest.count) !== documents.length
        || manifest.idSha256 !== sha256(stableJson(sortedIds))
        || manifest.documentSha256 !== sha256(stableJson(sortedDocuments))
      ) throw new Error(`The Firestore ${name} collection does not match its cryptographic export manifest.`)
    }
    collections[name] = { documents, ids, hashes }
  }
  return collections
}

function exactText(value, minimum, maximum) {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text.length >= minimum && text.length <= maximum ? text : null
}

function normalizedOperationalCollection(collection, normalizer, resultKey, idField = 'id') {
  const records = new Map()
  const invalid = []
  collection.documents.forEach((document, index) => {
    const result = normalizer(
      { record: document, inferredId: null },
      '2000-01-01T00:00:00.000Z',
      index + 1,
    )
    if (result.error || !result[resultKey] || result.warnings?.length) {
      invalid.push(documentId(document) || `index-${index + 1}`)
    }
    else records.set(result[resultKey][idField], result[resultKey])
  })
  return { records, invalid }
}

function comparableDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function parsedJsonObject(value) {
  if (isObject(value)) return value
  if (typeof value !== 'string') return {}
  try {
    const parsed = JSON.parse(value)
    return isObject(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function parsedJsonValue(value) {
  if (typeof value !== 'string') return value
  try { return JSON.parse(value) } catch { return value }
}

function jsonEquivalent(left, right) {
  return stableJson(parsedJsonValue(left)) === stableJson(parsedJsonValue(right))
}

function profileWithoutAvatar(value) {
  return Object.fromEntries(Object.entries(parsedJsonObject(value))
    .filter(([key]) => !PROFILE_AVATAR_KEYS.has(normalizedKey(key))))
}

function firstProfileAvatar(value) {
  for (const [key, candidate] of Object.entries(parsedJsonObject(value))) {
    if (PROFILE_AVATAR_KEYS.has(normalizedKey(key)) && typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }
  return null
}

function operationalAnnouncement(document, sourceHash) {
  const id = documentId(document)
  const payload = materializePersistenceDocument(document)
  const title = exactText(payload?.title, 1, 180)
  const content = exactText(firstPresent(payload?.content, payload?.body, payload?.message), 1, 10_000)
  const rawStatus = String(payload?.status ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  const status = ['active', 'published'].includes(rawStatus) ? 'active' : rawStatus === 'draft' ? 'draft' : null
  const rawAudience = firstPresent(payload?.audience, payload?.audienceRole, payload?.role)
  const normalizedRawAudience = normalizedRole(rawAudience)
  const isGlobal = GLOBAL_AUDIENCE_ALIASES.has(normalizedRawAudience)
  const audienceRole = isGlobal ? null : (ANNOUNCEMENT_AUDIENCE_ROLES.has(normalizedRawAudience) ? normalizedRawAudience : null)
  const audience = isGlobal ? 'all' : audienceRole
  const rawExpiry = payload?.expiresAt
  const expiresAt = normalizedDate(rawExpiry)
  if (!title || !content || !status || !audience || (rawExpiry !== null && rawExpiry !== undefined && rawExpiry !== '' && !expiresAt)) {
    return { error: true, id }
  }
  return {
    id,
    title,
    content,
    audience,
    audienceRole,
    isGlobal,
    status,
    expiresAt,
    createdByRef: referenceId(firstPresent(payload?.createdBy, payload?.authorId)) || null,
    sourceHash,
  }
}

function operationalKnowledgeArticle(document, sourceHash) {
  const id = documentId(document)
  const payload = materializePersistenceDocument(document)
  const title = exactText(payload?.title, 1, 180)
  const category = exactText(payload?.category, 1, 100)
  const content = exactText(firstPresent(payload?.contentHtml, payload?.content, payload?.body), 50, 100_000)
  const rawStatus = String(payload?.status ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  const status = rawStatus || 'published'
  if (!title || !category || !content || !isValidatedImportedHtml(content) || !['draft', 'published'].includes(status)) {
    return { error: true, id }
  }
  return {
    id,
    title,
    category,
    content,
    status,
    createdByRef: referenceId(firstPresent(payload?.createdBy, payload?.authorId)) || null,
    sourceHash,
  }
}

function expectedAnnouncementNotifications(collection) {
  const records = new Map()
  const invalidAnnouncements = []
  for (const document of collection.documents) {
    const id = documentId(document)
    const announcement = operationalAnnouncement(document, collection.hashes.get(id))
    if (announcement.error) {
      invalidAnnouncements.push(id)
      continue
    }
    if (announcement.status !== 'active') continue
    const sourceHash = announcement.sourceHash
    const notificationId = announcementNotificationId(id)
    records.set(notificationId, {
      id: notificationId,
      announcementId: id,
      targetRole: announcement.audienceRole,
      isGlobal: announcement.isGlobal,
      type: 'announcement',
      title: announcement.title,
      body: announcement.content,
      sourceHash,
      sourcePayload: {
        migrationKind: 'firebase_announcement_notification_v1',
        announcementId: id,
        announcementSourceHash: sourceHash,
      },
    })
  }
  return { records, invalidAnnouncements }
}

function authSource(root) {
  if (!Array.isArray(root?.users)) throw new Error('The Auth export must contain a top-level users array.')
  const identities = new Map()
  const providers = new Map()
  const invalid = []
  for (const [index, record] of root.users.entries()) {
    const id = typeof record?.localId === 'string' ? record.localId.trim() : ''
    const email = normalizeEmail(record?.email)
    if (!id || !email || !email.includes('@')) {
      invalid.push(index + 1)
      continue
    }
    if (identities.has(id)) throw new Error(`The Auth export contains duplicate UID ${id}.`)
    identities.set(id, {
      id,
      email,
      disabled: record.disabled === true || String(record.disabled).toLowerCase() === 'true',
      emailVerified: record.emailVerified === true || String(record.emailVerified).toLowerCase() === 'true',
    })
    providers.set(`${id}\0firebase`, { userId: id, provider: 'firebase', subject: id, email })
    for (const provider of Array.isArray(record.providerUserInfo) ? record.providerUserInfo : []) {
      const providerName = String(provider?.providerId ?? provider?.provider ?? '').trim().toLowerCase()
      const subject = String(provider?.rawId ?? provider?.federatedId ?? provider?.uid ?? '').trim()
      if (!providerName || !subject) continue
      providers.set(`${id}\0${providerName}`, {
        userId: id,
        provider: providerName,
        subject,
        email: normalizeEmail(provider.email) || email,
      })
    }
  }
  return { identities, providers, invalid }
}

function databaseConfig(connectionString) {
  const config = { connectionString }
  const sslMode = process.env.PGSSLMODE?.toLowerCase()
  if (sslMode === 'disable') config.ssl = false
  else if (sslMode === 'require') config.ssl = { rejectUnauthorized: false }
  else if (sslMode === 'verify-ca' || sslMode === 'verify-full') config.ssl = { rejectUnauthorized: true }
  return config
}

function setDifference(left, right) {
  return [...left].filter((value) => !right.has(value))
}

function sample(values, limit = 30) {
  return values.slice(0, limit)
}

function compareSet(label, expected, actual, failures) {
  const missing = setDifference(expected, actual)
  const extra = setDifference(actual, expected)
  if (missing.length) failures[`${label}MissingIds`] = sample(missing)
  if (extra.length) failures[`${label}ExtraIds`] = sample(extra)
}

function embeddedConversationExpectations(conversations) {
  const messageHashes = new Map()
  const participants = new Set()
  for (const document of conversations.documents) {
    const conversationId = documentId(document)
    const payload = materializePersistenceDocument(document)
    const rawParticipants = Array.isArray(payload.participants)
      ? payload.participants
      : isObject(payload.participants) ? Object.values(payload.participants) : []
    for (const participant of rawParticipants) {
      const participantId = referenceId(isObject(participant)
        ? participant.id ?? participant.uid ?? participant.userId ?? participant.ref
        : participant)
      if (participantId) participants.add(`${conversationId}\0${participantId}`)
    }
    const rawMessages = Array.isArray(payload.messages)
      ? payload.messages
      : isObject(payload.messages) ? Object.values(payload.messages) : []
    rawMessages.forEach((rawMessage, index) => {
      if (!isObject(rawMessage)) return
      const message = sanitizeSensitive(rawMessage)
      const hash = sha256(stableJson(message))
      const originalId = String(message.id ?? message.messageId ?? '').trim()
      const id = originalId
        ? `${conversationId}:${originalId}`
        : `${conversationId}:generated:${hash.slice(0, 32)}:${index}`
      messageHashes.set(id, hash)
    })
  }
  return { messageHashes, participants }
}

async function idHashRows(client, table, idColumn = 'id') {
  const allowed = new Set([
    'blog_posts', 'conversations', 'notifications', 'jobs', 'applications',
    'partnerships', 'archived_mail', 'announcements', 'knowledge_base_articles',
    'invalidated_legacy_email_codes', 'messages',
  ])
  if (!allowed.has(table) || !/^[a-z_]+$/.test(idColumn)) throw new Error('Unsafe verifier table identifier.')
  const result = await client.query(`SELECT ${idColumn} AS id, source_hash FROM ${table}`)
  return new Map(result.rows.map((row) => [row.id, row.source_hash]))
}

const ACTIVE_LEGACY_AUTH_TOKEN_SQL = `
  SELECT token_hash
  FROM auth_tokens
  WHERE used_at IS NULL AND token_hash = ANY($1::text[])
`

async function main() {
  const args = parseArguments(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required.')
  const authSecret = process.env.AUTH_SECRET
  if (!authSecret || authSecret.length < 32) {
    throw new Error('AUTH_SECRET with at least 32 characters is required for reconciliation.')
  }
  const [authFile, firestoreFile] = await Promise.all([
    readJson(args.auth, 'auth'),
    readJson(args.firestore, 'firestore'),
  ])
  const auth = authSource(authFile.data)
  const firestore = firestoreSource(firestoreFile.data)
  const failures = {}
  const operational = {
    users: normalizedOperationalCollection(
      firestore.users,
      (source, timestamp) => normalizeUser(source, timestamp, 'firestore'),
      'user',
    ),
    invites: normalizedOperationalCollection(firestore.invites, normalizeInvite, 'invite'),
    tickets: normalizedOperationalCollection(firestore.tickets, normalizeTicket, 'ticket'),
    pages: normalizedOperationalCollection(firestore.pages, normalizePage, 'page'),
    dashboards: normalizedOperationalCollection(firestore.dashboards, normalizeDashboard, 'dashboard', 'userId'),
    blogPosts: normalizedOperationalCollection(firestore.blogPosts, normalizeBlogPost, 'post'),
    conversations: normalizedOperationalCollection(firestore.conversations, normalizeConversation, 'conversation'),
    notifications: normalizedOperationalCollection(firestore.notifications, normalizeNotification, 'notification'),
    jobs: normalizedOperationalCollection(firestore.jobs, normalizeJob, 'job'),
    applications: normalizedOperationalCollection(firestore.applications, normalizeApplication, 'application'),
    partnerships: normalizedOperationalCollection(firestore.partnerships, normalizePartnership, 'partnership'),
    mail: normalizedOperationalCollection(firestore.mail, normalizeMail, 'mail'),
  }
  const operationalAuthUsers = normalizedOperationalCollection(
    { documents: authFile.data.users },
    (source, timestamp) => normalizeUser(source, timestamp, 'auth'),
    'user',
  )
  if (operationalAuthUsers.invalid.length) {
    failures.authUsersInvalidOperationalFields = sample(operationalAuthUsers.invalid)
  }
  for (const [collection, expectation] of Object.entries(operational)) {
    if (expectation.invalid.length) failures[`${collection}InvalidOperationalFields`] = sample(expectation.invalid)
  }
  const announcementNotifications = expectedAnnouncementNotifications(firestore.announcements)
  if (announcementNotifications.invalidAnnouncements.length) {
    failures.invalidAnnouncementOperationalFields = sample(announcementNotifications.invalidAnnouncements)
  }
  const announcementNotificationCollisions = [...announcementNotifications.records.keys()]
    .filter((id) => firestore.notifications.ids.has(id))
  if (announcementNotificationCollisions.length) {
    failures.announcementNotificationIdCollisions = sample(announcementNotificationCollisions)
  }

  const client = new pg.Client(databaseConfig(connectionString))
  await client.connect()
  try {
    const legacyUsers = await client.query(`
      SELECT id, email, name, first_name, last_name, role, status, school_id,
        school_name, company_name, contact_name, industry, experience, education,
        skills, phone, profile, legacy_avatar_url_sha256,
        email_verified_at IS NOT NULL AS email_verified, legacy_firestore_source_hash
      FROM users WHERE legacy_firebase_uid IS NOT NULL AND deleted_at IS NULL
    `)
    const databaseUsers = new Map(legacyUsers.rows.map((row) => [row.id, row]))
    compareSet('authUsers', new Set(auth.identities.keys()), new Set(databaseUsers.keys()), failures)
    if (auth.invalid.length) failures.invalidAuthRecords = auth.invalid
    const emailMismatches = []
    const verificationMismatches = []
    const disabledNotSuspended = []
    for (const identity of auth.identities.values()) {
      const stored = databaseUsers.get(identity.id)
      if (!stored) continue
      if (normalizeEmail(stored.email) !== identity.email) emailMismatches.push(identity.id)
      if (Boolean(stored.email_verified) !== identity.emailVerified) verificationMismatches.push(identity.id)
      if (identity.disabled && stored.status !== 'suspended') disabledNotSuspended.push(identity.id)
    }
    if (emailMismatches.length) failures.authEmailMismatches = sample(emailMismatches)
    if (verificationMismatches.length) failures.authVerificationMismatches = sample(verificationMismatches)
    if (disabledNotSuspended.length) failures.disabledUsersNotSuspended = sample(disabledNotSuspended)
    const firestoreUsersWithoutAuth = setDifference(firestore.users.ids, new Set(auth.identities.keys()))
    if (firestoreUsersWithoutAuth.length) failures.firestoreUsersWithoutAuth = sample(firestoreUsersWithoutAuth)
    const firestoreUserHashMismatches = []
    for (const [id, expectedHash] of firestore.users.hashes) {
      const stored = databaseUsers.get(id)
      if (stored && stored.legacy_firestore_source_hash !== expectedHash) firestoreUserHashMismatches.push(id)
    }
    if (firestoreUserHashMismatches.length) failures.firestoreUserHashMismatches = sample(firestoreUserHashMismatches)
    const firestoreUserFieldMismatches = []
    for (const [id, expected] of operational.users.records) {
      const stored = databaseUsers.get(id)
      const authExpected = operationalAuthUsers.records.get(id)
      const protectedAuthStatus = ['suspended', 'declined'].includes(authExpected?.status)
      const expectedStatus = protectedAuthStatus
        ? authExpected.status
        : expected.hasExplicitStatus ? expected.status : authExpected?.status ?? expected.status
      const expectedAvatarHash = expected.hasAvatarField
        ? expected.legacyAvatarUrlSha256
        : authExpected?.legacyAvatarUrlSha256 ?? null
      let expectedProfile = expected.profile
      if (!expected.hasAvatarField && !expectedAvatarHash) {
        const authAvatar = firstProfileAvatar(authExpected?.profile)
        if (authAvatar) expectedProfile = { ...expectedProfile, avatarUrl: authAvatar }
      }
      const storedProfile = parsedJsonObject(stored?.profile)
      const profilesMatch = expectedAvatarHash
        ? stableJson(profileWithoutAvatar(storedProfile)) === stableJson(profileWithoutAvatar(expectedProfile))
        : stableJson(storedProfile) === stableJson(expectedProfile)
      if (stored && (
        stored.name !== expected.name
        || stored.first_name !== expected.firstName
        || stored.last_name !== expected.lastName
        || stored.role !== expected.role
        || stored.status !== expectedStatus
        || stored.school_id !== expected.schoolId
        || stored.school_name !== expected.schoolName
        || stored.company_name !== expected.companyName
        || stored.contact_name !== expected.contactName
        || stored.industry !== expected.industry
        || stored.experience !== expected.experience
        || !jsonEquivalent(stored.education, expected.education)
        || !jsonEquivalent(stored.skills, expected.skills)
        || stored.phone !== expected.phone
        || stored.legacy_avatar_url_sha256 !== expectedAvatarHash
        || !profilesMatch
      )) {
        firestoreUserFieldMismatches.push(id)
      }
    }
    if (firestoreUserFieldMismatches.length) {
      failures.firestoreUserFieldMismatches = sample(firestoreUserFieldMismatches)
    }

    const providerResult = await client.query(`
      SELECT user_id, provider, provider_subject, provider_email
      FROM auth_identities
      WHERE user_id = ANY($1::text[])
    `, [[...auth.identities.keys()]])
    const databaseProviders = new Map(providerResult.rows.map((row) => [`${row.user_id}\0${row.provider}`, row]))
    compareSet('authProviders', new Set(auth.providers.keys()), new Set(databaseProviders.keys()), failures)
    const providerMismatches = []
    for (const [key, expected] of auth.providers) {
      const actual = databaseProviders.get(key)
      if (actual && (actual.provider_subject !== expected.subject || normalizeEmail(actual.provider_email) !== expected.email)) {
        providerMismatches.push(`${expected.userId}:${expected.provider}`)
      }
    }
    if (providerMismatches.length) failures.authProviderMismatches = sample(providerMismatches)

    const allUsersResult = await client.query(`
      SELECT id, role, status FROM users WHERE deleted_at IS NULL
    `)
    const allUsers = new Map(allUsersResult.rows.map((row) => [row.id, row]))

    const inviteRows = await client.query(`
      SELECT id, token_hash, email, role, status, created_by, used_by,
        expires_at, created_at, used_at
      FROM invites WHERE id = ANY($1::text[])
    `, [[...firestore.invites.ids]])
    const inviteById = new Map(inviteRows.rows.map((row) => [row.id, row]))
    const inviteFieldMismatches = []
    firestore.invites.documents.forEach((document, index) => {
      const id = documentId(document)
      const stored = inviteById.get(id)
      if (!stored) return
      const normalized = normalizeInvite(
        { record: document, inferredId: null },
        comparableDate(stored.created_at) ?? new Date().toISOString(),
        index + 1,
      )
      if (normalized.error) return
      const expected = normalized.invite
      const creator = expected.createdBy ? allUsers.get(expected.createdBy) : null
      const createdBy = creator ? expected.createdBy : null
      const usedBy = expected.usedBy && allUsers.has(expected.usedBy) ? expected.usedBy : null
      let status = expected.status
      if (status === 'pending') {
        const trustedCreator = creator?.status === 'active'
          && ['admin', 'super_admin'].includes(creator.role)
          && (expected.role !== 'super_admin' || creator.role === 'super_admin')
        if (!trustedCreator) status = 'revoked'
      }
      if (
        stored.token_hash !== runtimeTokenHash(expected.rawToken, authSecret)
        || normalizeEmail(stored.email) !== expected.email
        || stored.role !== expected.role
        || stored.status !== status
        || stored.created_by !== createdBy
        || stored.used_by !== usedBy
        || comparableDate(stored.expires_at) !== expected.expiresAt
        || comparableDate(stored.created_at) !== expected.createdAt
        || comparableDate(stored.used_at) !== expected.usedAt
      ) inviteFieldMismatches.push(id)
    })
    if (inviteFieldMismatches.length) failures.inviteFieldMismatches = sample(inviteFieldMismatches)

    const simpleTables = {
      invites: ['invites', 'id'],
      tickets: ['tickets', 'id'],
      pages: ['pages', 'id'],
      dashboards: ['dashboard_preferences', 'user_id'],
    }
    for (const [collectionName, [table, idColumn]] of Object.entries(simpleTables)) {
      const result = await client.query(`SELECT ${idColumn} AS id FROM ${table}`)
      const expectedIds = collectionName === 'dashboards'
        ? new Set(firestore.dashboards.documents.map((document) => {
          const payload = materializePersistenceDocument(document)
          return referenceId(payload?.userId ?? payload?.user_id) || documentId(document)
        }))
        : firestore[collectionName].ids
      compareSet(collectionName, expectedIds, new Set(result.rows.map((row) => row.id)), failures)
    }

    const pageRows = await client.query(`
      SELECT id, data, updated_by FROM pages WHERE id = ANY($1::text[])
    `, [[...operational.pages.records.keys()]])
    const pageById = new Map(pageRows.rows.map((row) => [row.id, row]))
    const pageFieldMismatches = []
    for (const [id, expected] of operational.pages.records) {
      const stored = pageById.get(id)
      if (stored && (
        !jsonEquivalent(stored.data, expected.data)
        || stored.updated_by !== (expected.updatedBy && allUsers.has(expected.updatedBy) ? expected.updatedBy : null)
      )) pageFieldMismatches.push(id)
    }
    if (pageFieldMismatches.length) failures.pageFieldMismatches = sample(pageFieldMismatches)

    const dashboardRows = await client.query(`
      SELECT user_id, layouts, reports
      FROM dashboard_preferences WHERE user_id = ANY($1::text[])
    `, [[...operational.dashboards.records.keys()]])
    const dashboardByUser = new Map(dashboardRows.rows.map((row) => [row.user_id, row]))
    const dashboardFieldMismatches = []
    for (const [userId, expected] of operational.dashboards.records) {
      const stored = dashboardByUser.get(userId)
      if (stored && (
        !jsonEquivalent(stored.layouts, expected.layouts)
        || !jsonEquivalent(stored.reports, expected.reports)
      )) dashboardFieldMismatches.push(userId)
    }
    if (dashboardFieldMismatches.length) failures.dashboardFieldMismatches = sample(dashboardFieldMismatches)

    const hashedTables = {
      blogPosts: 'blog_posts',
      conversations: 'conversations',
      jobs: 'jobs',
      applications: 'applications',
      partnerships: 'partnerships',
      mail: 'archived_mail',
      announcements: 'announcements',
      knowledgeBaseArticles: 'knowledge_base_articles',
      emailVerificationCodes: 'invalidated_legacy_email_codes',
    }
    for (const [collectionName, table] of Object.entries(hashedTables)) {
      const actualHashes = await idHashRows(client, table)
      compareSet(collectionName, firestore[collectionName].ids, new Set(actualHashes.keys()), failures)
      const mismatches = []
      for (const [id, expectedHash] of firestore[collectionName].hashes) {
        if (actualHashes.has(id) && actualHashes.get(id) !== expectedHash) mismatches.push(id)
      }
      if (mismatches.length) failures[`${collectionName}HashMismatches`] = sample(mismatches)
    }

    const blogRows = await client.query(`
      SELECT id, slug, title, author, excerpt, content_html, status, image_url,
        created_by, author_ref, image_asset_id, legacy_image_url_sha256, published_at
      FROM blog_posts WHERE id = ANY($1::text[])
    `, [[...operational.blogPosts.records.keys()]])
    const blogById = new Map(blogRows.rows.map((row) => [row.id, row]))
    const blogFieldMismatches = []
    for (const [id, expected] of operational.blogPosts.records) {
      const stored = blogById.get(id)
      const externalImageMatches = expected.legacyImageUrlSha256
        ? stored?.legacy_image_url_sha256 === expected.legacyImageUrlSha256
        : stored?.legacy_image_url_sha256 === null
          && stored?.image_asset_id === null
          && stored?.image_url === expected.imageUrl
      if (stored && (
        stored.slug !== expected.slug
        || stored.title !== expected.title
        || stored.author !== expected.authorName
        || stored.excerpt !== expected.excerpt
        || stored.content_html !== expected.content
        || stored.status !== expected.status
        || stored.created_by !== (expected.authorRef && allUsers.has(expected.authorRef) ? expected.authorRef : null)
        || stored.author_ref !== expected.authorRef
        || comparableDate(stored.published_at) !== expected.publishedAt
        || !externalImageMatches
      )) blogFieldMismatches.push(id)
    }
    if (blogFieldMismatches.length) failures.blogFieldMismatches = sample(blogFieldMismatches)

    const ticketRows = await client.query(`
      SELECT id, user_id, type, subject, description, status, priority
      FROM tickets WHERE id = ANY($1::text[])
    `, [[...operational.tickets.records.keys()]])
    const ticketById = new Map(ticketRows.rows.map((row) => [row.id, row]))
    const ticketFieldMismatches = []
    for (const [id, expected] of operational.tickets.records) {
      const stored = ticketById.get(id)
      if (stored && (
        stored.user_id !== expected.userId
        || stored.type !== expected.type
        || stored.subject !== expected.subject
        || stored.description !== expected.description
        || stored.status !== expected.status
        || stored.priority !== expected.priority
      )) ticketFieldMismatches.push(id)
    }
    if (ticketFieldMismatches.length) failures.ticketFieldMismatches = sample(ticketFieldMismatches)

    const jobRows = await client.query(`
      SELECT id, company_ref, title, company_name, location, employment_type,
        description, status, application_url, closes_at
      FROM jobs WHERE id = ANY($1::text[])
    `, [[...operational.jobs.records.keys()]])
    const jobById = new Map(jobRows.rows.map((row) => [row.id, row]))
    const jobFieldMismatches = []
    for (const [id, expected] of operational.jobs.records) {
      const stored = jobById.get(id)
      if (stored && (
        stored.company_ref !== expected.companyRef
        || stored.title !== expected.title
        || stored.company_name !== expected.companyName
        || stored.location !== expected.location
        || stored.employment_type !== expected.employmentType
        || stored.description !== expected.description
        || stored.status !== expected.status
        || stored.application_url !== expected.applicationUrl
        || comparableDate(stored.closes_at) !== expected.closesAt
      )) jobFieldMismatches.push(id)
    }
    if (jobFieldMismatches.length) failures.jobFieldMismatches = sample(jobFieldMismatches)

    const applicationRows = await client.query(`
      SELECT id, job_ref, applicant_ref, status, cover_letter, legacy_resume_url_sha256
      FROM applications WHERE id = ANY($1::text[])
    `, [[...operational.applications.records.keys()]])
    const applicationById = new Map(applicationRows.rows.map((row) => [row.id, row]))
    const applicationFieldMismatches = []
    for (const [id, expected] of operational.applications.records) {
      const stored = applicationById.get(id)
      if (stored && (
        stored.job_ref !== expected.jobRef
        || stored.applicant_ref !== expected.applicantRef
        || stored.status !== expected.status
        || stored.cover_letter !== expected.coverLetter
        || stored.legacy_resume_url_sha256 !== expected.legacyResumeUrlSha256
      )) applicationFieldMismatches.push(id)
    }
    if (applicationFieldMismatches.length) failures.applicationFieldMismatches = sample(applicationFieldMismatches)

    const partnershipRows = await client.query(`
      SELECT id, requester_ref, partner_ref, organization_name, contact_email, status
      FROM partnerships WHERE id = ANY($1::text[])
    `, [[...operational.partnerships.records.keys()]])
    const partnershipById = new Map(partnershipRows.rows.map((row) => [row.id, row]))
    const partnershipFieldMismatches = []
    for (const [id, expected] of operational.partnerships.records) {
      const stored = partnershipById.get(id)
      if (stored && (
        stored.requester_ref !== expected.requesterRef
        || stored.partner_ref !== expected.partnerRef
        || stored.organization_name !== expected.organizationName
        || stored.contact_email !== expected.contactEmail
        || stored.status !== expected.status
      )) partnershipFieldMismatches.push(id)
    }
    if (partnershipFieldMismatches.length) failures.partnershipFieldMismatches = sample(partnershipFieldMismatches)

    const conversationRows = await client.query(`
      SELECT id, name, avatar_url, legacy_avatar_url_sha256, last_message
      FROM conversations WHERE id = ANY($1::text[])
    `, [[...operational.conversations.records.keys()]])
    const conversationById = new Map(conversationRows.rows.map((row) => [row.id, row]))
    const conversationFieldMismatches = []
    const expectedMessages = new Map()
    for (const [id, expected] of operational.conversations.records) {
      const stored = conversationById.get(id)
      const expectedAvatar = expected.legacyAvatarUrlSha256 ? null : expected.avatarUrl
      const avatarMatches = expected.legacyAvatarUrlSha256
        ? stored?.legacy_avatar_url_sha256 === expected.legacyAvatarUrlSha256
        : stored?.avatar_url === expectedAvatar && stored?.legacy_avatar_url_sha256 === null
      if (stored && (
        stored.name !== expected.name
        || !avatarMatches
        || stored.last_message !== expected.lastMessage
      )) conversationFieldMismatches.push(id)
      for (const message of expected.messages) expectedMessages.set(message.id, message)
    }
    if (conversationFieldMismatches.length) failures.conversationFieldMismatches = sample(conversationFieldMismatches)

    const messageRows = await client.query(`
      SELECT id, body, legacy_attachment_url_sha256, source_hash
      FROM messages WHERE id = ANY($1::text[])
    `, [[...expectedMessages.keys()]])
    const messageById = new Map(messageRows.rows.map((row) => [row.id, row]))
    const messageFieldMismatches = []
    for (const [id, expected] of expectedMessages) {
      const stored = messageById.get(id)
      if (stored && (
        stored.body !== expected.body
        || stored.legacy_attachment_url_sha256 !== expected.legacyAttachmentUrlSha256
        || stored.source_hash !== expected.sourceHash
      )) messageFieldMismatches.push(id)
    }
    if (messageFieldMismatches.length) failures.messageFieldMismatches = sample(messageFieldMismatches)

    const expectedNotificationHashes = new Map(firestore.notifications.hashes)
    for (const [id, expected] of announcementNotifications.records) {
      expectedNotificationHashes.set(id, expected.sourceHash)
    }
    const actualNotificationHashes = await idHashRows(client, 'notifications')
    compareSet(
      'notifications',
      new Set(expectedNotificationHashes.keys()),
      new Set(actualNotificationHashes.keys()),
      failures,
    )
    const notificationHashMismatches = []
    for (const [id, expectedHash] of expectedNotificationHashes) {
      if (actualNotificationHashes.has(id) && actualNotificationHashes.get(id) !== expectedHash) {
        notificationHashMismatches.push(id)
      }
    }
    if (notificationHashMismatches.length) {
      failures.notificationsHashMismatches = sample(notificationHashMismatches)
    }

    const expectedAnnouncements = new Map()
    for (const document of firestore.announcements.documents) {
      const id = documentId(document)
      const expected = operationalAnnouncement(document, firestore.announcements.hashes.get(id))
      if (!expected.error) expectedAnnouncements.set(id, expected)
    }
    const announcementRows = await client.query(`
      SELECT id, title, content, audience, status, expires_at, created_by
      FROM announcements
      WHERE id = ANY($1::text[])
    `, [[...firestore.announcements.ids]])
    const announcementById = new Map(announcementRows.rows.map((row) => [row.id, row]))
    const announcementFieldMismatches = []
    for (const [id, expected] of expectedAnnouncements) {
      const stored = announcementById.get(id)
      if (!stored) continue
      const storedExpiry = stored.expires_at ? new Date(stored.expires_at).toISOString() : null
      if (
        stored.title !== expected.title
        || stored.content !== expected.content
        || stored.audience !== expected.audience
        || stored.status !== expected.status
        || storedExpiry !== expected.expiresAt
        || stored.created_by !== expected.createdByRef
      ) announcementFieldMismatches.push(id)
    }
    if (announcementFieldMismatches.length) {
      failures.announcementFieldMismatches = sample(announcementFieldMismatches)
    }

    const expectedKnowledgeArticles = new Map()
    const invalidKnowledgeArticles = []
    for (const document of firestore.knowledgeBaseArticles.documents) {
      const id = documentId(document)
      const expected = operationalKnowledgeArticle(document, firestore.knowledgeBaseArticles.hashes.get(id))
      if (expected.error) invalidKnowledgeArticles.push(id)
      else expectedKnowledgeArticles.set(id, expected)
    }
    if (invalidKnowledgeArticles.length) {
      failures.invalidKnowledgeBaseOperationalFields = sample(invalidKnowledgeArticles)
    }
    const knowledgeRows = await client.query(`
      SELECT id, title, category, content_html, status, created_by
      FROM knowledge_base_articles
      WHERE id = ANY($1::text[])
    `, [[...firestore.knowledgeBaseArticles.ids]])
    const knowledgeById = new Map(knowledgeRows.rows.map((row) => [row.id, row]))
    const knowledgeFieldMismatches = []
    for (const [id, expected] of expectedKnowledgeArticles) {
      const stored = knowledgeById.get(id)
      if (!stored) continue
      if (
        stored.title !== expected.title
        || stored.category !== expected.category
        || stored.content_html !== expected.content
        || stored.status !== expected.status
        || stored.created_by !== expected.createdByRef
      ) knowledgeFieldMismatches.push(id)
    }
    if (knowledgeFieldMismatches.length) {
      failures.knowledgeBaseFieldMismatches = sample(knowledgeFieldMismatches)
    }

    const rawStorageSecretPayloads = await client.query(`
      WITH persisted_payloads AS (
        SELECT 'user'::text AS kind, id, profile AS payload FROM users
        UNION ALL SELECT 'user_operational', id, jsonb_build_object(
          'name', name, 'firstName', first_name, 'lastName', last_name,
          'schoolName', school_name, 'companyName', company_name, 'contactName', contact_name,
          'industry', industry, 'experience', experience, 'education', education,
          'skills', skills, 'phone', phone
        ) FROM users
        UNION ALL SELECT 'ticket', id, metadata FROM tickets
        UNION ALL SELECT 'ticket_operational', id, jsonb_build_object('subject', subject, 'description', description) FROM tickets
        UNION ALL SELECT 'page', id, data FROM pages
        UNION ALL SELECT 'dashboard_layouts', user_id, layouts FROM dashboard_preferences
        UNION ALL SELECT 'dashboard_reports', user_id, reports FROM dashboard_preferences
        UNION ALL SELECT 'blog', id, source_payload FROM blog_posts
        UNION ALL SELECT 'blog_operational', id, jsonb_build_object('imageUrl', image_url, 'title', title, 'excerpt', excerpt, 'content', content_html) FROM blog_posts
        UNION ALL SELECT 'conversation', id, source_payload FROM conversations
        UNION ALL SELECT 'conversation_operational', id, jsonb_build_object('name', name, 'avatarUrl', avatar_url, 'lastMessage', last_message) FROM conversations
        UNION ALL SELECT 'conversation_participant', conversation_id || ':' || user_id, jsonb_build_object('displayName', display_name, 'metadata', metadata) FROM conversation_participants
        UNION ALL SELECT 'message', id, source_payload FROM messages
        UNION ALL SELECT 'message_operational', id, jsonb_build_object('body', body) FROM messages
        UNION ALL SELECT 'notification', id, source_payload FROM notifications
        UNION ALL SELECT 'notification_operational', id, jsonb_build_object('type', type, 'title', title, 'body', body, 'link', link) FROM notifications
        UNION ALL SELECT 'job', id, source_payload FROM jobs
        UNION ALL SELECT 'job_operational', id, jsonb_build_object('title', title, 'companyName', company_name, 'location', location, 'employmentType', employment_type, 'description', description, 'applicationUrl', application_url) FROM jobs
        UNION ALL SELECT 'application', id, source_payload FROM applications
        UNION ALL SELECT 'application_operational', id, jsonb_build_object('coverLetter', cover_letter) FROM applications
        UNION ALL SELECT 'partnership', id, source_payload FROM partnerships
        UNION ALL SELECT 'partnership_operational', id, jsonb_build_object('organizationName', organization_name, 'contactEmail', contact_email) FROM partnerships
        UNION ALL SELECT 'mail', id, source_payload FROM archived_mail
        UNION ALL SELECT 'mail_operational', id, jsonb_build_object('from', envelope_from, 'to', envelope_to, 'subject', subject, 'status', delivery_status) FROM archived_mail
        UNION ALL SELECT 'announcement', id, source_payload FROM announcements
        UNION ALL SELECT 'announcement_operational', id, jsonb_build_object('title', title, 'content', content) FROM announcements
        UNION ALL SELECT 'knowledge', id, source_payload FROM knowledge_base_articles
        UNION ALL SELECT 'knowledge_operational', id, jsonb_build_object('title', title, 'category', category, 'content', content_html) FROM knowledge_base_articles
      )
      SELECT kind, id
      FROM persisted_payloads
      WHERE payload::text ~* 'firebaseStorageDownloadTokens|(token|x-goog-signature|x-goog-credential)(=|%3d|%253d)'
      UNION ALL SELECT 'blog_legacy_url', id FROM blog_posts WHERE legacy_image_url IS NOT NULL
      UNION ALL SELECT 'message_legacy_url', id FROM messages WHERE legacy_attachment_url IS NOT NULL
      UNION ALL SELECT 'application_legacy_url', id FROM applications WHERE legacy_resume_url IS NOT NULL
      ORDER BY kind, id
    `)
    if (rawStorageSecretPayloads.rowCount) {
      failures.rawStorageSecretsPersisted = sample(rawStorageSecretPayloads.rows)
    }

    const unsupportedOperationalFirebaseReferences = await client.query(`
      WITH operational_values AS (
        SELECT 'user_profile'::text AS kind, id, profile::text AS value FROM users
        UNION ALL SELECT 'user', id, concat_ws(' ', name, first_name, last_name, school_name, company_name, contact_name, industry, experience, education::text, skills::text, phone) FROM users
        UNION ALL SELECT 'ticket', id, concat_ws(' ', subject, description) FROM tickets
        UNION ALL SELECT 'page', id, data::text FROM pages
        UNION ALL SELECT 'blog', id, concat_ws(' ', image_url, title, excerpt, content_html) FROM blog_posts
        UNION ALL SELECT 'conversation', id, concat_ws(' ', name, avatar_url, last_message) FROM conversations
        UNION ALL SELECT 'conversation_participant', conversation_id || ':' || user_id, concat_ws(' ', display_name, metadata::text) FROM conversation_participants
        UNION ALL SELECT 'message', id, body FROM messages
        UNION ALL SELECT 'notification', id, concat_ws(' ', type, title, body, link, payload::text) FROM notifications
        UNION ALL SELECT 'job', id, concat_ws(' ', title, company_name, location, employment_type, description, application_url) FROM jobs
        UNION ALL SELECT 'application', id, cover_letter FROM applications
        UNION ALL SELECT 'partnership', id, concat_ws(' ', organization_name, contact_email) FROM partnerships
        UNION ALL SELECT 'mail', id, concat_ws(' ', envelope_from, envelope_to::text, subject, delivery_status) FROM archived_mail
        UNION ALL SELECT 'announcement', id, concat_ws(' ', title, content) FROM announcements
        UNION ALL SELECT 'knowledge', id, concat_ws(' ', title, category, content_html) FROM knowledge_base_articles
      )
      SELECT kind, id
      FROM operational_values
      WHERE value ~* '(gs://|https://(firebasestorage|storage)\.googleapis\.com/|yahnu-redacted-embedded-url-secret)'
      ORDER BY kind, id
    `)
    if (unsupportedOperationalFirebaseReferences.rowCount) {
      failures.unsupportedOperationalFirebaseReferences = sample(unsupportedOperationalFirebaseReferences.rows)
    }

    const archivedMailRows = await client.query(`
      SELECT id, envelope_from, envelope_to, subject, delivery_status,
        source_payload, queued_at, completed_at
      FROM archived_mail
      WHERE id = ANY($1::text[])
    `, [[...firestore.mail.ids]])
    const archivedMailById = new Map(archivedMailRows.rows.map((row) => [row.id, row]))
    const archivedMailFieldMismatches = []
    for (const [id, expected] of operational.mail.records) {
      const stored = archivedMailById.get(id)
      if (stored && (
        stored.envelope_from !== expected.envelopeFrom
        || !jsonEquivalent(stored.envelope_to, expected.envelopeTo)
        || stored.subject !== expected.subject
        || stored.delivery_status !== expected.deliveryStatus
        || !jsonEquivalent(stored.source_payload, expected.payload)
        || (expected.hasExplicitQueuedAt
          && comparableDate(stored.queued_at) !== expected.queuedAt)
        || comparableDate(stored.completed_at) !== expected.completedAt
      )) archivedMailFieldMismatches.push(id)
    }
    if (archivedMailFieldMismatches.length) {
      failures.archivedMailFieldMismatches = sample(archivedMailFieldMismatches)
    }

    const notificationRows = await client.query(`
      SELECT id, user_id, recipient_ref, target_role, is_global, created_by,
        actor_ref, type, title, body, link, payload, expires_at
      FROM notifications
      WHERE id = ANY($1::text[])
    `, [[...firestore.notifications.ids]])
    const notificationsById = new Map(notificationRows.rows.map((row) => [row.id, row]))
    const notificationFieldMismatches = []
    const expectedNotificationReceipts = new Map()
    for (const [id, expected] of operational.notifications.records) {
      const stored = notificationsById.get(id)
      if (!stored) continue
      const recipientId = expected.recipientRef && allUsers.has(expected.recipientRef)
        ? expected.recipientRef
        : null
      const createdBy = expected.actorRef && allUsers.has(expected.actorRef)
        ? expected.actorRef
        : null
      if (
        stored.user_id !== recipientId
        || stored.recipient_ref !== expected.recipientRef
        || stored.target_role !== expected.audienceRole
        || stored.is_global !== expected.isGlobal
        || stored.created_by !== createdBy
        || stored.actor_ref !== expected.actorRef
        || stored.type !== expected.type
        || stored.title !== expected.title
        || stored.body !== expected.body
        || stored.link !== expected.link
        || !jsonEquivalent(stored.payload, expected.payload)
        || comparableDate(stored.expires_at) !== expected.expiresAt
      ) notificationFieldMismatches.push(id)
      if (recipientId) {
        expectedNotificationReceipts.set(`${id}\0${recipientId}`, {
          deliveredAt: expected.deliveredAt,
          readAt: expected.readAt,
          dismissedAt: expected.dismissedAt,
          exactReadAt: expected.hasExactReadAt,
        })
      }
    }
    if (notificationFieldMismatches.length) failures.notificationFieldMismatches = sample(notificationFieldMismatches)
    const receiptRows = await client.query(`
      SELECT notification_id, user_id, delivered_at, read_at, dismissed_at
      FROM notification_receipts
      WHERE notification_id = ANY($1::text[])
    `, [[...firestore.notifications.ids]])
    const actualReceiptKeys = new Set(receiptRows.rows.map((row) => `${row.notification_id}\0${row.user_id}`))
    compareSet('notificationReceipts', new Set(expectedNotificationReceipts.keys()), actualReceiptKeys, failures)
    const receiptReadMismatches = receiptRows.rows
      .filter((row) => {
        const expected = expectedNotificationReceipts.get(`${row.notification_id}\0${row.user_id}`)
        return expected && (
          comparableDate(row.delivered_at) !== expected.deliveredAt
          || (expected.exactReadAt
            ? comparableDate(row.read_at) !== expected.readAt
            : Boolean(row.read_at) !== Boolean(expected.readAt))
          || comparableDate(row.dismissed_at) !== expected.dismissedAt
        )
      })
      .map((row) => row.notification_id)
    if (receiptReadMismatches.length) failures.notificationReceiptFieldMismatches = sample(receiptReadMismatches)

    const generatedAnnouncementRows = await client.query(`
      SELECT id, announcement_id, target_role, is_global, type, title, body,
        source_payload, source_hash
      FROM notifications
      WHERE announcement_id IS NOT NULL
      ORDER BY id
    `)
    const generatedAnnouncementById = new Map(generatedAnnouncementRows.rows.map((row) => [row.id, row]))
    compareSet(
      'announcementNotifications',
      new Set(announcementNotifications.records.keys()),
      new Set(generatedAnnouncementById.keys()),
      failures,
    )
    const announcementNotificationFieldMismatches = []
    for (const [id, expected] of announcementNotifications.records) {
      const stored = generatedAnnouncementById.get(id)
      if (!stored) continue
      if (
        stored.announcement_id !== expected.announcementId
        || stored.target_role !== expected.targetRole
        || stored.is_global !== expected.isGlobal
        || stored.type !== expected.type
        || stored.title !== expected.title
        || stored.body !== expected.body
        || stableJson(stored.source_payload) !== stableJson(expected.sourcePayload)
        || stored.source_hash !== expected.sourceHash
      ) announcementNotificationFieldMismatches.push(id)
    }
    if (announcementNotificationFieldMismatches.length) {
      failures.announcementNotificationFieldMismatches = sample(announcementNotificationFieldMismatches)
    }

    const invalidatedCodeRows = await client.query(`
      SELECT id, code_sha256 FROM invalidated_legacy_email_codes
      WHERE id = ANY($1::text[])
    `, [[...firestore.emailVerificationCodes.ids]])
    const invalidatedCodesById = new Map(invalidatedCodeRows.rows.map((row) => [row.id, row.code_sha256]))
    const codeHashMismatches = []
    const expectedRuntimeTokenHashes = []
    for (const document of firestore.emailVerificationCodes.documents) {
      const id = documentId(document)
      const payload = materializeDocumentRaw(document)
      const rawCode = String(payload.code ?? payload.token ?? payload.verificationCode ?? '').trim()
      const expectedHash = rawCode ? sha256(rawCode.slice(0, 100_000)) : null
      if (rawCode) expectedRuntimeTokenHashes.push(runtimeTokenHash(rawCode, authSecret))
      if ((invalidatedCodesById.get(id) ?? null) !== expectedHash) codeHashMismatches.push(id)
    }
    if (codeHashMismatches.length) failures.invalidatedCodeHashMismatches = sample(codeHashMismatches)
    if (expectedRuntimeTokenHashes.length) {
      const activeLegacyCodes = await client.query(ACTIVE_LEGACY_AUTH_TOKEN_SQL, [expectedRuntimeTokenHashes])
      if (activeLegacyCodes.rowCount) failures.legacyCodesPresentInActiveAuthTokens = activeLegacyCodes.rows.length
    }

    const embedded = embeddedConversationExpectations(firestore.conversations)
    const actualMessageHashes = await idHashRows(client, 'messages')
    compareSet('conversationMessages', new Set(embedded.messageHashes.keys()), new Set(actualMessageHashes.keys()), failures)
    const messageHashMismatches = []
    for (const [id, expectedHash] of embedded.messageHashes) {
      if (actualMessageHashes.has(id) && actualMessageHashes.get(id) !== expectedHash) messageHashMismatches.push(id)
    }
    if (messageHashMismatches.length) failures.conversationMessageHashMismatches = sample(messageHashMismatches)

    const participantResult = await client.query(`
      SELECT conversation_id, user_id FROM conversation_participants
      WHERE conversation_id = ANY($1::text[])
    `, [[...firestore.conversations.ids]])
    const actualParticipants = new Set(participantResult.rows.map((row) => `${row.conversation_id}\0${row.user_id}`))
    compareSet('conversationParticipants', embedded.participants, actualParticipants, failures)

    const schoolProblems = await client.query(`
      SELECT graduate.id, graduate.school_id
      FROM users graduate
      LEFT JOIN users school ON school.id = graduate.school_id
      WHERE graduate.role = 'graduate' AND graduate.deleted_at IS NULL
        AND graduate.school_id IS NOT NULL
        AND (school.id IS NULL OR school.role <> 'school' OR school.deleted_at IS NOT NULL)
    `)
    if (schoolProblems.rowCount) failures.invalidSchoolRelationships = sample(schoolProblems.rows)

    const roleStatus = await client.query(`
      SELECT role, status, count(*)::integer AS count
      FROM users WHERE deleted_at IS NULL GROUP BY role, status ORDER BY role, status
    `)
    const privileged = await client.query(`
      SELECT id, email, name, role, status
      FROM users
      WHERE role IN ('admin', 'super_admin', 'content_manager', 'content_moderator', 'support_staff')
        AND deleted_at IS NULL
      ORDER BY role, email
    `)
    const passed = Object.keys(failures).length === 0
    const expectedCounts = Object.fromEntries(COLLECTIONS.map((name) => [name, firestore[name].ids.size]))
    process.stdout.write(`${JSON.stringify({
      passed,
      sources: { auth: authFile.path, firestore: firestoreFile.path },
      counts: { authUsers: auth.identities.size, authProviders: auth.providers.size, ...expectedCounts, roleStatus: roleStatus.rows },
      failures,
      review: { privilegedAccounts: privileged.rows },
    }, null, 2)}\n`)
    if (!passed) process.exitCode = 2
  } finally {
    await client.end()
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((error) => {
    process.stderr.write(`Firebase reconciliation failed: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}

export { runtimeTokenHash }
