import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { directDatabaseConfig, runtimeDatabaseConfig } from '../../src/lib/server/database-config.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(here, '..', '..')
const validUrl = 'postgresql://yahnu:local_password@127.0.0.1:5432/yahnu'
const noPortUrl = 'postgresql://yahnu:local_password@127.0.0.1/yahnu'
const pooledUrl = 'postgresql://pool_user:pool_password@pool.example.test:6432/yahnu'
const certificate = '-----BEGIN CERTIFICATE-----\nZmFrZS10ZXN0LWNh\n-----END CERTIFICATE-----\n'

test('uses the direct URL and explicit non-TLS config for local development', () => {
  const config = runtimeDatabaseConfig({ DATABASE_URL: validUrl })

  assert.equal(config.connectionString, validUrl)
  assert.equal(config.source, 'DATABASE_URL')
  assert.equal(config.ssl, false)
  assert.equal(config.max, 10)
})

test('uses a non-empty pooled URL before DATABASE_URL', () => {
  const config = runtimeDatabaseConfig({
    DATABASE_POOL_URL: pooledUrl,
    DATABASE_URL: `${validUrl}?sslmode=no-verify`,
  })

  assert.equal(config.connectionString, pooledUrl)
  assert.equal(config.source, 'DATABASE_POOL_URL')
})

test('treats a blank optional pooled URL as unset', () => {
  const config = runtimeDatabaseConfig({ DATABASE_POOL_URL: '  ', DATABASE_URL: validUrl })

  assert.equal(config.connectionString, validUrl)
  assert.equal(config.source, 'DATABASE_URL')
})

test('rejects selected URLs with query parameters, fragments, or malformed credentials', () => {
  for (const databaseUrl of [
    `${validUrl}?sslmode=no-verify`,
    `${validUrl}?`,
    `${validUrl}#ignored`,
    `${validUrl}#`,
    'postgresql://yahnu:local_password@127.0.0.1:0/yahnu',
    'postgresql://yahnu%00:local_password@127.0.0.1:5432/yahnu',
    'postgresql://yahnu:local%0Dpassword@127.0.0.1:5432/yahnu',
    'postgresql://yahnu:local_password@127.0.0.1:5432/yahnu%0Aarchive',
    'postgresql://yahnu%:local_password@127.0.0.1:5432/yahnu',
    'postgresql://yahnu@127.0.0.1:5432/yahnu',
    'https://yahnu:local_password@127.0.0.1:5432/yahnu',
  ]) {
    assert.throws(
      () => runtimeDatabaseConfig({ DATABASE_URL: databaseUrl }),
      /DATABASE_URL (must not include URL query parameters or fragments|must use a TCP port between 1 and 65535|must not contain NUL, carriage return, or newline characters|must not contain malformed percent-encoding|must include a non-empty username and password|must use the postgres)/,
    )
  }

  assert.throws(
    () => runtimeDatabaseConfig({ DATABASE_POOL_URL: `${pooledUrl}?sslmode=no-verify`, DATABASE_URL: validUrl }),
    /DATABASE_POOL_URL must not include URL query parameters or fragments/,
  )
})

test('an explicit URL port cannot be redirected through ambient PGPORT', () => {
  const previousPort = process.env.PGPORT
  process.env.PGPORT = '6543'
  try {
    const config = directDatabaseConfig({ DATABASE_URL: noPortUrl })
    const client = new pg.Client(config)

    assert.equal(config.connectionString, validUrl)
    assert.equal(client.port, 5432)
  } finally {
    if (previousPort === undefined) delete process.env.PGPORT
    else process.env.PGPORT = previousPort
  }
})

test('requires a verified TLS configuration and rejects node-postgres no-verify compatibility mode', () => {
  assert.deepEqual(runtimeDatabaseConfig({ DATABASE_URL: validUrl, PGSSLMODE: 'require' }).ssl, {
    rejectUnauthorized: true,
  })
  assert.throws(
    () => runtimeDatabaseConfig({ DATABASE_URL: validUrl, PGSSLMODE: 'no-verify' }),
    /PGSSLMODE must be disable, require, verify-ca, or verify-full/,
  )
  assert.throws(
    () => runtimeDatabaseConfig({ DATABASE_URL: validUrl, PGSSLMODE: 'prefer' }),
    /PGSSLMODE must be disable, require, verify-ca, or verify-full/,
  )
})

test('uses an inline or file-based CA only with certificate verification', async () => {
  const certificateDirectory = await mkdtemp(path.join(os.tmpdir(), 'yahnu-db-ca-'))
  const certificateFile = path.join(certificateDirectory, 'postgres-ca.pem')
  const pinnedLeaf = Buffer.from('database-config-test-leaf')
  const pinnedFingerprint = createHash('sha256').update(pinnedLeaf).digest('hex')
  await writeFile(certificateFile, certificate, 'utf8')

  try {
    assert.deepEqual(
      runtimeDatabaseConfig({ DATABASE_URL: validUrl, PGSSLMODE: 'verify-full', DATABASE_SSL_CA: certificate }).ssl,
      { rejectUnauthorized: true, ca: certificate },
    )
    assert.deepEqual(
      runtimeDatabaseConfig({ DATABASE_URL: validUrl, PGSSLMODE: 'verify-ca', DATABASE_SSL_CA_FILE: certificateFile }).ssl,
      { rejectUnauthorized: true, ca: certificate },
    )
    const customIdentityConfig = runtimeDatabaseConfig({
      DATABASE_URL: validUrl,
      PGSSLMODE: 'verify-ca',
      DATABASE_SSL_CA_FILE: certificateFile,
      DATABASE_SSL_SERVERNAME: 'render-internal-leaf',
      DATABASE_SSL_CERT_SHA256: pinnedFingerprint.match(/../g).join(':').toUpperCase(),
    }).ssl
    assert.equal(customIdentityConfig.rejectUnauthorized, true)
    assert.equal(customIdentityConfig.ca, certificate)
    assert.equal(typeof customIdentityConfig.checkServerIdentity, 'function')
    assert.equal(
      customIdentityConfig.checkServerIdentity('database-url-host', {
        subject: { CN: 'render-internal-leaf' },
        raw: pinnedLeaf,
      }),
      undefined,
    )
    assert.match(
      customIdentityConfig.checkServerIdentity('database-url-host', {
        subject: { CN: 'wrong-name' },
        raw: pinnedLeaf,
      }).code,
      /ERR_TLS_CERT_ALTNAME_INVALID/,
    )
    assert.match(
      customIdentityConfig.checkServerIdentity('database-url-host', {
        subject: { CN: 'render-internal-leaf' },
        raw: Buffer.from('different-leaf'),
      }).message,
      /fingerprint did not match DATABASE_SSL_CERT_SHA256/,
    )
    const pgClient = new pg.Client({ connectionString: validUrl, ssl: customIdentityConfig })
    assert.equal(pgClient.connection.ssl.rejectUnauthorized, true)
    assert.equal(pgClient.connection.ssl.ca, certificate)
    assert.equal(
      pgClient.connection.ssl.checkServerIdentity('database-url-host', {
        subject: { CN: 'render-internal-leaf' },
        raw: pinnedLeaf,
      }),
      undefined,
    )
    assert.throws(
      () => runtimeDatabaseConfig({ DATABASE_URL: validUrl, PGSSLMODE: 'disable', DATABASE_SSL_CA: certificate }),
      /cannot be configured when PGSSLMODE=disable/,
    )
    assert.throws(
      () => runtimeDatabaseConfig({ DATABASE_URL: validUrl, DATABASE_SSL_CA: 'not a PEM certificate' }),
      /DATABASE_SSL_CA must be a non-empty PEM certificate/,
    )
    assert.throws(
      () => runtimeDatabaseConfig({ DATABASE_URL: validUrl, DATABASE_SSL_SERVERNAME: 'render-internal-leaf' }),
      /DATABASE_SSL_SERVERNAME and DATABASE_SSL_CERT_SHA256 require DATABASE_SSL_CA, DATABASE_SSL_CA_FILE, or PGSSLROOTCERT/,
    )
    assert.throws(
      () => runtimeDatabaseConfig({
        DATABASE_URL: validUrl,
        DATABASE_SSL_CA: certificate,
        DATABASE_SSL_SERVERNAME: '*.invalid',
      }),
      /DATABASE_SSL_SERVERNAME must be a DNS name, not an IP address or wildcard/,
    )
    assert.throws(
      () => runtimeDatabaseConfig({
        DATABASE_URL: validUrl,
        DATABASE_SSL_CA: certificate,
        DATABASE_SSL_CERT_SHA256: 'not-a-fingerprint',
      }),
      /DATABASE_SSL_CERT_SHA256 must be a SHA-256 certificate fingerprint/,
    )
  } finally {
    await rm(certificateDirectory, { recursive: true, force: true })
  }
})

test('bounds the runtime pool size', () => {
  assert.equal(runtimeDatabaseConfig({ DATABASE_URL: validUrl, DATABASE_POOL_MAX: '32' }).max, 32)
  for (const value of ['0', '-1', '1.5', '10connections', '101']) {
    assert.throws(
      () => runtimeDatabaseConfig({ DATABASE_URL: validUrl, DATABASE_POOL_MAX: value }),
      /DATABASE_POOL_MAX must be an integer between 1 and 100/,
    )
  }
})

test('cutover commands always use and validate DATABASE_URL directly', () => {
  const config = directDatabaseConfig({ DATABASE_URL: validUrl, DATABASE_POOL_URL: pooledUrl })
  assert.equal(config.connectionString, validUrl)
  assert.equal(config.ssl, false)

  assert.throws(
    () => directDatabaseConfig({ DATABASE_URL: `${validUrl}?sslmode=no-verify`, DATABASE_POOL_URL: pooledUrl }),
    /DATABASE_URL must not include URL query parameters or fragments/,
  )
})

test('every PostgreSQL CLI client uses the shared strict direct configuration', async () => {
  const databaseScripts = [
    'migrate-database.mjs',
    'import-firebase-json.mjs',
    'verify-firebase-import.mjs',
    'import-firebase-storage.mjs',
    'verify-firebase-storage.mjs',
    'create-admin.mjs',
  ]

  for (const script of databaseScripts) {
    const source = await readFile(path.join(projectRoot, 'scripts', script), 'utf8')
    assert.match(source, /import \{ directDatabaseConfig \} from '\.\.\/src\/lib\/server\/database-config\.mjs'/)
    assert.match(source, /directDatabaseConfig\(\)/)
    assert.doesNotMatch(source, /rejectUnauthorized:\s*false/)
  }
})
