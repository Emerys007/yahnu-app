import { randomBytes, randomUUID, scrypt as scryptCallback } from 'node:crypto'
import { promisify } from 'node:util'
import pg from 'pg'
import { directDatabaseConfig } from '../src/lib/server/database-config.mjs'

const SCRYPT_N = 32_768
const SCRYPT_R = 8
const SCRYPT_P = 1
const SCRYPT_KEY_LENGTH = 64
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024
const scrypt = promisify(scryptCallback)

function printHelp() {
  process.stdout.write(`Create or deliberately update a Yahnu administrator.

Usage:
  npm run admin:create -- --email admin@example.com --name "Yahnu Admin" --password "..."

Options:
  --email <email>       Administrator email (or ADMIN_EMAIL)
  --password <value>    Administrator password (or ADMIN_PASSWORD)
  --name <name>         Administrator display name (or ADMIN_NAME)
  --role <role>         super_admin (default) or admin (or ADMIN_ROLE)
  --update              Replace credentials/details for an existing account
  --help                Show this help

For better shell-history hygiene, pass the password through ADMIN_PASSWORD.
DATABASE_URL is required.
`)
}

function parseArguments(argv) {
  const values = {}
  const booleanFlags = new Set(['update', 'help'])
  const valueFlags = new Set(['email', 'password', 'name', 'role'])

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (!argument.startsWith('--')) throw new Error(`Unexpected positional argument: ${argument}`)

    const separator = argument.indexOf('=')
    const key = argument.slice(2, separator === -1 ? undefined : separator)
    if (booleanFlags.has(key)) {
      if (separator !== -1) throw new Error(`--${key} does not accept a value.`)
      values[key] = true
      continue
    }

    if (!valueFlags.has(key)) throw new Error(`Unknown option: --${key}`)
    const value = separator === -1 ? argv[++index] : argument.slice(separator + 1)
    if (value === undefined || value.startsWith('--')) throw new Error(`--${key} requires a value.`)
    values[key] = value
  }

  return values
}

function normalizeEmail(value) {
  const email = String(value ?? '').trim().toLowerCase()
  if (!email || email.length > 320 || /\s/.test(email) || email.indexOf('@') <= 0 || email.lastIndexOf('@') !== email.indexOf('@')) {
    throw new Error('A valid administrator email is required.')
  }
  return email
}

function validatePassword(value) {
  const password = String(value ?? '')
  if (password.length < 12) throw new Error('The administrator password must be at least 12 characters long.')
  if (password.length > 128) throw new Error('The administrator password must be at most 128 characters long.')
  return password
}

async function hashPassword(password) {
  const salt = randomBytes(16)
  const derivedKey = await scrypt(password, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAX_MEMORY,
  })

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`
}

async function main() {
  const args = parseArguments(process.argv.slice(2))
  if (args.help) {
    printHelp()
    return
  }

  const email = normalizeEmail(args.email ?? process.env.ADMIN_EMAIL)
  const password = validatePassword(args.password ?? process.env.ADMIN_PASSWORD)
  const name = String(args.name ?? process.env.ADMIN_NAME ?? '').trim()
  if (name.length < 2 || name.length > 160) throw new Error('ADMIN_NAME/--name must be between 2 and 160 characters.')

  const role = String(args.role ?? process.env.ADMIN_ROLE ?? 'super_admin').trim().toLowerCase()
  if (!['admin', 'super_admin'].includes(role)) throw new Error('ADMIN_ROLE/--role must be admin or super_admin.')

  const client = new pg.Client(directDatabaseConfig())
  await client.connect()

  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock($1)', [78_342_112])
    const existingResult = await client.query(
      `SELECT id, email, role, deleted_at
       FROM users
       WHERE lower(email) = lower($1)
       ORDER BY (deleted_at IS NULL) DESC, created_at DESC
       LIMIT 1
       FOR UPDATE`,
      [email],
    )
    const existing = existingResult.rows[0]

    if (existing && !args.update) {
      throw new Error(`An account already exists for ${email}. Re-run with --update only if replacing it is intentional.`)
    }

    const passwordHash = await hashPassword(password)
    let id
    let action

    if (existing) {
      id = existing.id
      action = 'updated'
      if (existing.role === 'super_admin' && role !== 'super_admin') {
        const otherSuperAdmins = await client.query(
          `SELECT 1 FROM users
           WHERE role = 'super_admin' AND status = 'active' AND deleted_at IS NULL AND id <> $1
           LIMIT 1`,
          [id],
        )
        if (!otherSuperAdmins.rowCount) throw new Error('Refusing to demote the only active super administrator.')
      }
      await client.query(
        `UPDATE users
         SET email = $2,
             password_hash = $3,
             google_sub = NULL,
             auth_provider = 'password',
             name = $4,
             role = $5,
             status = 'active',
             email_verified_at = COALESCE(email_verified_at, now()),
             pending_email = NULL,
             deleted_at = NULL
         WHERE id = $1`,
        [id, email, passwordHash, name, role],
      )
      await client.query('DELETE FROM sessions WHERE user_id = $1', [id])
      await client.query('DELETE FROM auth_tokens WHERE user_id = $1', [id])
    } else {
      id = randomUUID()
      action = 'created'
      await client.query(
        `INSERT INTO users (
           id, email, password_hash, auth_provider, name, role, status, email_verified_at
         ) VALUES ($1, $2, $3, 'password', $4, $5, 'active', now())`,
        [id, email, passwordHash, name, role],
      )
    }

    await client.query('COMMIT')
    process.stdout.write(`${JSON.stringify({ action, id, email, role }, null, 2)}\n`)
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  process.stderr.write(`Administrator creation failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exitCode = 1
})
