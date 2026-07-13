import { readFile } from 'node:fs/promises'
import path from 'node:path'
import pg from 'pg'

function printHelp() {
  process.stdout.write(`Reconcile a completed Firebase-to-PostgreSQL import.

Usage:
  npm run firebase:verify -- --auth C:\\secure\\yahnu-auth.json --firestore C:\\secure\\yahnu-firestore.json

Options:
  --auth <path>       Firebase Auth JSON export (required)
  --firestore <path>  Output from scripts/export-firestore-json.mjs (required)
  --help              Show this help

DATABASE_URL is required. The command exits 2 when reconciliation finds a mismatch.
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

function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase()
}

function authIdentities(root) {
  if (!Array.isArray(root?.users)) throw new Error('The Auth export must contain a top-level users array.')
  const identities = new Map()
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
  }
  return { identities, invalid }
}

function firestoreCounts(root) {
  if (root?._metadata?.format !== 'yahnu-firestore-rest-v1') {
    throw new Error('The Firestore file is not a Yahnu REST exporter result.')
  }
  const names = ['users', 'invites', 'tickets', 'pages', 'dashboards']
  const counts = {}
  for (const name of names) {
    if (!Array.isArray(root[name])) throw new Error(`The Firestore export is missing the ${name} collection array.`)
    counts[name] = root[name].length
  }
  const userIds = new Set(root.users.map((document) => {
    const segments = String(document?.name ?? '').split('/').filter(Boolean)
    return segments.at(-1)
  }).filter(Boolean))
  return { counts, userIds }
}

function databaseConfig(connectionString) {
  const config = { connectionString }
  const sslMode = process.env.PGSSLMODE?.toLowerCase()
  if (sslMode === 'disable') config.ssl = false
  else if (sslMode === 'require') config.ssl = { rejectUnauthorized: false }
  else if (sslMode === 'verify-ca' || sslMode === 'verify-full') config.ssl = { rejectUnauthorized: true }
  return config
}

function sample(values, limit = 20) {
  return values.slice(0, limit)
}

async function main() {
  const args = parseArguments(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required.')
  const [authFile, firestoreFile] = await Promise.all([
    readJson(args.auth, 'auth'),
    readJson(args.firestore, 'firestore'),
  ])
  const auth = authIdentities(authFile.data)
  const firestore = firestoreCounts(firestoreFile.data)

  const client = new pg.Client(databaseConfig(connectionString))
  await client.connect()
  try {
    const legacyUsers = await client.query(`
        SELECT id, email, status, email_verified_at IS NOT NULL AS email_verified
        FROM users WHERE legacy_firebase_uid IS NOT NULL AND deleted_at IS NULL
      `)
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
    const schoolProblems = await client.query(`
        SELECT graduate.id, graduate.school_id
        FROM users graduate
        LEFT JOIN users school ON school.id = graduate.school_id
        WHERE graduate.role = 'graduate' AND graduate.deleted_at IS NULL
          AND graduate.school_id IS NOT NULL
          AND (school.id IS NULL OR school.role <> 'school' OR school.deleted_at IS NOT NULL)
      `)
    const tableCounts = await client.query(`
        SELECT
          (SELECT count(*)::integer FROM users WHERE legacy_firebase_uid IS NOT NULL AND deleted_at IS NULL) AS users,
          (SELECT count(*)::integer FROM invites) AS invites,
          (SELECT count(*)::integer FROM tickets) AS tickets,
          (SELECT count(*)::integer FROM pages) AS pages,
          (SELECT count(*)::integer FROM dashboard_preferences) AS dashboards
      `)

    const databaseUsers = new Map(legacyUsers.rows.map((row) => [row.id, row]))
    const missingAuthUids = []
    const emailMismatches = []
    const verificationMismatches = []
    const disabledNotSuspended = []
    for (const identity of auth.identities.values()) {
      const stored = databaseUsers.get(identity.id)
      if (!stored) {
        missingAuthUids.push(identity.id)
        continue
      }
      if (normalizeEmail(stored.email) !== identity.email) emailMismatches.push(identity.id)
      if (Boolean(stored.email_verified) !== identity.emailVerified) verificationMismatches.push(identity.id)
      if (identity.disabled && stored.status !== 'suspended') disabledNotSuspended.push(identity.id)
    }

    const extraLegacyUids = [...databaseUsers.keys()].filter((id) => !auth.identities.has(id))
    const firestoreOnlyUids = [...firestore.userIds].filter((id) => !auth.identities.has(id))
    const actualCounts = tableCounts.rows[0]
    const expectedCounts = {
      users: auth.identities.size,
      invites: firestore.counts.invites,
      tickets: firestore.counts.tickets,
      pages: firestore.counts.pages,
      dashboards: firestore.counts.dashboards,
    }
    const collectionShortfalls = Object.fromEntries(Object.entries(expectedCounts)
      .filter(([name, expected]) => Number(actualCounts[name]) < expected)
      .map(([name, expected]) => [name, { expectedAtLeast: expected, actual: Number(actualCounts[name]) }]))

    const failures = {
      invalidAuthRecords: auth.invalid,
      missingAuthUids: sample(missingAuthUids),
      extraLegacyUids: sample(extraLegacyUids),
      emailMismatches: sample(emailMismatches),
      verificationMismatches: sample(verificationMismatches),
      disabledNotSuspended: sample(disabledNotSuspended),
      invalidSchoolRelationships: sample(schoolProblems.rows),
      collectionShortfalls,
    }
    const passed = Object.values(failures).every((value) => Array.isArray(value)
      ? value.length === 0
      : Object.keys(value).length === 0)

    const output = {
      passed,
      sources: { auth: authFile.path, firestore: firestoreFile.path },
      counts: { expected: expectedCounts, actual: actualCounts, roleStatus: roleStatus.rows },
      failures,
      review: {
        privilegedAccounts: privileged.rows,
        firestoreOnlyUids: sample(firestoreOnlyUids),
        firestoreOnlyUidCount: firestoreOnlyUids.length,
      },
    }
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`)
    if (!passed) process.exitCode = 2
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  process.stderr.write(`Firebase reconciliation failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
