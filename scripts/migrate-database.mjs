import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required to run database migrations.')

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const migrationsDirectory = path.join(root, 'db', 'migrations')
const sslMode = process.env.PGSSLMODE?.toLowerCase()
const pool = new pg.Pool({
  connectionString: databaseUrl,
  ...(sslMode === 'disable' ? { ssl: false } : {}),
  ...(sslMode === 'require' ? { ssl: { rejectUnauthorized: false } } : {}),
  ...(['verify-ca', 'verify-full'].includes(sslMode) ? { ssl: { rejectUnauthorized: true } } : {}),
})

const client = await pool.connect()
try {
  await client.query('SELECT pg_advisory_lock($1)', [78342109])
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `)

  const files = (await readdir(migrationsDirectory)).filter((file) => file.endsWith('.sql')).sort()
  for (const file of files) {
    const sql = await readFile(path.join(migrationsDirectory, file), 'utf8')
    const checksum = createHash('sha256').update(sql).digest('hex')
    const existing = await client.query('SELECT checksum FROM schema_migrations WHERE name = $1', [file])

    if (existing.rowCount) {
      if (existing.rows[0].checksum !== checksum) throw new Error(`Migration ${file} changed after it was applied.`)
      continue
    }

    await client.query('BEGIN')
    try {
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [file, checksum])
      await client.query('COMMIT')
      process.stdout.write(`Applied ${file}\n`)
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    }
  }
} finally {
  await client.query('SELECT pg_advisory_unlock($1)', [78342109]).catch(() => undefined)
  client.release()
  await pool.end()
}
