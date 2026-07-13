import { createHmac } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import pg from 'pg'

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
])

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
  --dry-run              Execute all checks and writes, then roll the transaction back
  --allow-partial        Commit valid records despite skipped/rejected records
  --help                 Show this help

Supported collections: users, invites, tickets, pages, and dashboards. Input may use
named collection wrappers/maps, document arrays, direct maps, or REST-style typed fields.
Firebase Auth { users: [...] } is also supported. DATABASE_URL is required. AUTH_SECRET
is required when an importable pending invitation is present. Imported Firebase passwords
and password hashes are never used, and raw invitation tokens are never printed.
`)
}

function parseArguments(argv) {
  const result = { dryRun: false, allowPartial: false, file: undefined, source: undefined, help: false }

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
  if (root?._metadata?.format === 'yahnu-firestore-rest-v1') return 'firestore'
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

function profileFromRecord(record) {
  const profile = isObject(record.profile) ? { ...record.profile } : {}
  for (const [key, value] of Object.entries(record)) {
    if (!AUTHORITATIVE_PROFILE_KEYS.has(normalizedKey(key))) profile[key] = value
  }
  return sanitizeSensitive(profile)
}

function referencedUserId(value) {
  if (typeof value !== 'string') return normalizeId(value)
  return normalizeId(idFromDocumentPath(value) ?? value)
}

function normalizeUser(source, importTimestamp, sourceMode) {
  const decoded = materializeRecord(source.record)
  if (!decoded) return { error: 'record is not an object' }
  const record = sanitizeSensitive(decoded)
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
  const hasExplicitStatus = firstPresent(record.status, record.accountStatus, record.disabled) !== undefined

  const firstName = String(record.firstName ?? '').trim() || null
  const lastName = String(record.lastName ?? '').trim() || null
  const joinedName = [firstName, lastName].filter(Boolean).join(' ') || null
  const fallbackName = email.slice(0, email.indexOf('@'))
  const name = String(firstPresent(
    record.name,
    record.displayName,
    record.fullName,
    joinedName,
    record.contactName,
    record.companyName,
    record.schoolName,
    fallbackName,
  )).trim().slice(0, 500) || fallbackName

  const createdAt = normalizeDate(firstPresent(record.createdAt, record.creationTime, source.record.createTime))
  const explicitVerifiedAt = normalizeDate(record.emailVerifiedAt)
  const emailVerified = record.emailVerified === true || String(record.emailVerified).toLowerCase() === 'true'
  const emailVerifiedAt = explicitVerifiedAt ?? (emailVerified ? createdAt ?? importTimestamp : null)

  return {
    user: {
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
      education: normalizeArray(record.education),
      skills: normalizeArray(record.skills, { splitStrings: true }),
      phone: String(record.phone ?? record.phoneNumber ?? '').trim() || null,
      profile: profileFromRecord(record),
      emailVerifiedAt,
      lastLoginAt: normalizeDate(firstPresent(record.lastLoginAt, record.lastSignIn, record.lastSignInTime)),
      createdAt,
      hasExplicitStatus,
    },
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
  return sanitizeSensitive(result)
}

function normalizeInvite(source, importTimestamp, sourceIndex) {
  const decoded = materializeRecord(source.record)
  if (!decoded) return { error: 'record is not an object' }
  const record = sanitizeSensitive(mergeNestedPayload(decoded, ['email', 'emailaddress', 'invitetoken', 'token']))
  const id = sourceRecordId(source, 'invites', record)
  if (!id) return { error: 'missing or invalid document ID' }

  const rawTokenValue = firstPresent(record.token, record.inviteToken, record.rawToken, id)
  const rawToken = typeof rawTokenValue === 'string' ? rawTokenValue.trim() : ''
  if (!rawToken || rawToken.length > 4_096) return { error: 'missing or invalid legacy token' }

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
  const record = sanitizeSensitive(mergeNestedPayload(decoded, ['message', 'description']))
  const id = sourceRecordId(source, 'tickets', record)
  if (!id) return { error: 'missing or invalid document ID' }

  const userId = referencedUserId(firstPresent(record.userId, record.user_id, record.createdBy, record.uid))
  if (!userId) return { error: 'missing user ID', id }
  const description = String(firstPresent(record.description, record.message) ?? '').trim()
  if (!description) return { error: 'missing description/message', id }

  const status = TICKET_STATUS_MAP.get(normalizeEnum(record.status)) ?? 'open'
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
      subject: String(record.subject ?? '').trim() || null,
      description,
      status,
      priority: 'normal',
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

  if (id !== 'about-us') {
    const title = requiredImportedText(sourceData.title, 300)
    const lastUpdated = requiredImportedText(sourceData.lastUpdated, 100)
    const content = importedRichText(sourceData.content)
    if (!title || !lastUpdated || content === null) return { error: 'legal page data does not match the supported schema' }
    if (Object.keys(sourceData).some((key) => !['title', 'lastUpdated', 'content'].includes(key))) {
      warnings.push('stale fields were removed from legal page content')
    }
    return { data: { title, lastUpdated, content }, warnings }
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
    if (replacedImages) warnings.push(`${replacedImages} remote or unsafe team image path(s) were replaced with placeholders`)
    data.teamMembers = teamMembers
  }

  const allowedKeys = new Set([...textFields.map(([key]) => key), ...richTextFields, 'teamMembers'])
  if (Object.keys(sourceData).some((key) => !allowedKeys.has(key))) warnings.push('stale fields were removed from about page content')
  return { data, warnings }
}

function normalizeImportedReports(value) {
  if (!isObject(value)) return { reports: {}, warnings: value === undefined ? [] : ['dashboard reports were not an object and were reset'] }
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
  return { reports, warnings: dropped ? [`${dropped} invalid or excess dashboard report(s) were removed`] : [] }
}

function normalizeImportedLayouts(value, reports) {
  if (!isObject(value)) return { layouts: {}, warnings: value === undefined ? [] : ['dashboard layouts were not an object and were reset'] }
  const layouts = {}
  const warnings = []
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
  if (repositioned) warnings.push(`${repositioned} bottom-positioned dashboard item(s) were assigned finite rows`)
  return { layouts, warnings }
}

function normalizePage(source, importTimestamp, sourceIndex) {
  const decoded = materializeRecord(source.record)
  if (!decoded) return { error: 'record is not an object' }
  const record = sanitizeSensitive(mergeNestedPayload(decoded, [
    'abouttitle', 'storytitle', 'content', 'lastupdated', 'teammembers',
  ]))
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
  }
}

function normalizeDashboard(source, importTimestamp, sourceIndex) {
  const decoded = materializeRecord(source.record)
  if (!decoded) return { error: 'record is not an object' }
  const record = sanitizeSensitive(mergeNestedPayload(decoded, ['layouts', 'reports']))
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
  }
}

function hashInviteToken(token, secret) {
  return createHmac('sha256', secret ?? FALLBACK_AUTH_SECRET).update(token).digest('hex')
}

function databaseConfig(connectionString) {
  const config = { connectionString }
  const sslMode = process.env.PGSSLMODE?.toLowerCase()
  if (sslMode === 'disable') config.ssl = false
  else if (sslMode === 'require') config.ssl = { rejectUnauthorized: false }
  else if (sslMode === 'verify-ca' || sslMode === 'verify-full') config.ssl = { rejectUnauthorized: true }
  return config
}

const UPSERT_AUTH_USER_SQL = `
  INSERT INTO users (
    id, legacy_firebase_uid, email, password_hash, google_sub, auth_provider,
    name, first_name, last_name, role, status, school_id, school_name,
    company_name, contact_name, industry, experience, education, skills,
    phone, profile, email_verified_at, last_login_at, created_at
  ) VALUES (
    $1, $1, $2, NULL, NULL, 'migrated',
    $3, $4, $5, $6, $7, $8, $9,
    $10, $11, $12, $13, $14::jsonb, $15::jsonb,
    $16, $17::jsonb, $18::timestamptz, $19::timestamptz, COALESCE($20::timestamptz, now())
  )
  ON CONFLICT (id) DO UPDATE SET
    legacy_firebase_uid = EXCLUDED.legacy_firebase_uid,
    email = EXCLUDED.email,
    auth_provider = CASE
      WHEN users.password_hash IS NULL AND users.google_sub IS NULL THEN 'migrated'
      ELSE users.auth_provider
    END,
    status = CASE WHEN EXCLUDED.status = 'suspended' THEN 'suspended' ELSE users.status END,
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
    profile = $16::jsonb
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
    $1, $2, 'support', $3, $4, $5, 'normal', $6::jsonb, $7::timestamptz, $8::timestamptz
  )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    type = 'support',
    subject = EXCLUDED.subject,
    description = EXCLUDED.description,
    status = CASE
      WHEN tickets.status IN ('resolved', 'closed') AND EXCLUDED.status IN ('open', 'in_progress') THEN tickets.status
      ELSE EXCLUDED.status
    END,
    priority = 'normal',
    metadata = EXCLUDED.metadata,
    submitted_at = LEAST(tickets.submitted_at, EXCLUDED.submitted_at),
    updated_at = EXCLUDED.updated_at
  WHERE $9::boolean AND tickets.updated_at < EXCLUDED.updated_at
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
  }
}

async function main() {
  const args = parseArguments(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required.')
  const input = args.file ?? process.env.FIREBASE_EXPORT_PATH
  if (!input) throw new Error('Provide a JSON path as an argument, with --file, or through FIREBASE_EXPORT_PATH.')

  const inputPath = path.resolve(input)
  let parsed
  try {
    parsed = JSON.parse(await readFile(inputPath, 'utf8'))
  } catch (error) {
    throw new Error(`Unable to read valid JSON from ${inputPath}: ${error instanceof Error ? error.message : String(error)}`)
  }

  const extracted = extractPersistedCollections(parsed)
  const totalSourceRecords = Object.values(extracted).reduce((total, records) => total + records.length, 0)
  if (!totalSourceRecords) throw new Error('No supported Firebase records were found in the supplied JSON structure.')
  const detectedSource = detectSourceMode(parsed)
  if (args.source && detectedSource && args.source !== detectedSource) {
    throw new Error(`The input looks like a ${detectedSource} export but --source ${args.source} was supplied.`)
  }
  const sourceMode = args.source ?? detectedSource
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
      protectedAccounts: 0,
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
    for (const warning of normalized.warnings ?? []) warn(`Page ${normalized.page.id}: ${warning}`)
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
    for (const warning of normalized.warnings ?? []) warn(`Dashboard ${normalized.dashboard.userId}: ${warning}`)
    dashboards.push(normalized.dashboard)
  }

  const client = new pg.Client(databaseConfig(connectionString))
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

    for (const user of users) {
      const existingUser = existingUsers.get(user.id)
      const existingById = Boolean(existingUser)

      if (sourceMode === 'firestore' && (!existingUser || existingUser.legacy_firebase_uid !== user.id)) {
        collections.users.orphaned += 1
        collections.users.skipped += 1
        warn(`Firestore user ${user.id}: no matching Firebase Auth identity was imported`)
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

      if (user.schoolId && !validSchoolIds.has(user.schoolId)) {
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

    partial = Object.values(collections).some((collection) => [
      'skipped', 'invalid', 'orphaned', 'databaseRejected', 'emailConflicts',
    ].some((key) => (collection[key] ?? 0) > 0))

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

main().catch((error) => {
  process.stderr.write(`Firebase import failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
