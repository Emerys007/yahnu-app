import { createHash, timingSafeEqual } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { isIP } from 'node:net'
import { checkServerIdentity } from 'node:tls'

/** @typedef {NodeJS.ProcessEnv} Environment */
/** @typedef {'DATABASE_POOL_URL' | 'DATABASE_URL'} DatabaseConnectionSource */
/** @typedef {import('node:tls').ConnectionOptions} ConnectionOptions */
/**
 * @typedef {object} RuntimeDatabaseConfig
 * @property {string} connectionString
 * @property {DatabaseConnectionSource} source
 * @property {false | ConnectionOptions} ssl
 * @property {number} max
 */
/**
 * @typedef {object} DirectDatabaseConfig
 * @property {string} connectionString
 * @property {false | ConnectionOptions} ssl
 */

const SUPPORTED_SSL_MODES = new Set(['disable', 'require', 'verify-ca', 'verify-full'])
const DEFAULT_POOL_MAX = 10
const MAX_POOL_MAX = 100

/** @param {Environment} environment @param {string} name */
function configuredValue(environment, name) {
  const value = environment[name]
  if (value === undefined || value.trim() === '') return undefined
  return value
}

/** @param {string} value @param {DatabaseConnectionSource} name */
function decodedConnectionComponent(value, name) {
  let decoded
  try {
    decoded = decodeURIComponent(value)
  } catch {
    throw new Error(`${name} must not contain malformed percent-encoding.`)
  }
  if (/[\0\r\n]/.test(decoded)) {
    throw new Error(`${name} must not contain NUL, carriage return, or newline characters.`)
  }
  return decoded
}

/** @param {string | undefined} value @param {DatabaseConnectionSource} name */
function requiredConnectionUrl(value, name) {
  if (!value) throw new Error('DATABASE_URL is not configured.')
  if (value !== value.trim()) {
    throw new Error(`${name} must not contain leading or trailing whitespace.`)
  }

  let parsed
  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`${name} must be a valid PostgreSQL URL.`)
  }

  if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
    throw new Error(`${name} must use the postgres:// or postgresql:// scheme.`)
  }
  // node-postgres parses URL options after the explicit Pool/Client config and lets
  // them override the TLS object. Reject every delimiter, including an empty ? or #.
  if (value.includes('?') || value.includes('#') || parsed.search || parsed.hash) {
    throw new Error(
      `${name} must not include URL query parameters or fragments. Configure TLS with PGSSLMODE and DATABASE_SSL_CA(_FILE).`,
    )
  }
  if (!parsed.hostname || !parsed.pathname || parsed.pathname === '/') {
    throw new Error(`${name} must include a host and database name.`)
  }
  // node-postgres uses the ambient PGPORT when the URL omits its port. Normalize
  // the standard PostgreSQL default into the handed-off connection string so an
  // inherited environment value cannot redirect runtime or cutover traffic. We
  // accept omission because Render's internal connection strings omit :5432.
  if (parsed.port && (!/^[1-9]\d{0,4}$/.test(parsed.port) || Number(parsed.port) > 65_535)) {
    throw new Error(`${name} must use a TCP port between 1 and 65535.`)
  }
  if (!parsed.username || !parsed.password) {
    throw new Error(`${name} must include a non-empty username and password.`)
  }
  decodedConnectionComponent(parsed.username, name)
  decodedConnectionComponent(parsed.password, name)
  decodedConnectionComponent(parsed.pathname.slice(1), name)

  if (!parsed.port) parsed.port = '5432'
  return parsed.toString()
}

/** @param {Environment} environment */
function connectionUrl(environment) {
  // An explicitly configured pooled URL wins. A blank optional value is treated as unset,
  // while a non-blank but invalid pooled URL fails closed instead of falling back to the
  // direct migration URL.
  const pooled = configuredValue(environment, 'DATABASE_POOL_URL')
  if (pooled !== undefined) {
    return {
      connectionString: requiredConnectionUrl(pooled, 'DATABASE_POOL_URL'),
      source: /** @type {DatabaseConnectionSource} */ ('DATABASE_POOL_URL'),
    }
  }

  return {
    connectionString: requiredConnectionUrl(configuredValue(environment, 'DATABASE_URL'), 'DATABASE_URL'),
    source: /** @type {DatabaseConnectionSource} */ ('DATABASE_URL'),
  }
}

/** @param {string} value */
function isPemCertificate(value) {
  return /-----BEGIN CERTIFICATE-----[\s\S]+-----END CERTIFICATE-----/.test(value)
}

/** @param {Environment} environment */
function certificateAuthority(environment) {
  const inlineCertificate = configuredValue(environment, 'DATABASE_SSL_CA')
  const configuredFile = configuredValue(environment, 'DATABASE_SSL_CA_FILE')
  const libpqFile = configuredValue(environment, 'PGSSLROOTCERT')

  if (inlineCertificate && (configuredFile || libpqFile)) {
    throw new Error('Configure exactly one of DATABASE_SSL_CA, DATABASE_SSL_CA_FILE, or PGSSLROOTCERT.')
  }
  if (configuredFile && libpqFile && configuredFile !== libpqFile) {
    throw new Error('DATABASE_SSL_CA_FILE and PGSSLROOTCERT must reference the same file when both are set.')
  }
  if (inlineCertificate) {
    if (!isPemCertificate(inlineCertificate)) {
      throw new Error('DATABASE_SSL_CA must be a non-empty PEM certificate.')
    }
    return inlineCertificate
  }

  const certificateFile = configuredFile ?? libpqFile
  if (!certificateFile) return undefined
  try {
    // The CA is intentionally operator-mounted at runtime (for example, Render
    // Secret Files). Do not trace an environment-derived path into the standalone
    // artifact during the Next/Turbopack build.
    const certificate = readFileSync(/* turbopackIgnore: true */ certificateFile, 'utf8')
    if (!isPemCertificate(certificate)) throw new Error('not a PEM certificate')
    return certificate
  } catch {
    // Do not include a filesystem path in an application error: it can disclose the
    // deployment layout, and the variable name is enough for an operator to correct it.
    throw new Error('DATABASE_SSL_CA_FILE or PGSSLROOTCERT could not be read as a non-empty PEM certificate.')
  }
}

/** @param {string} value */
function isValidTlsServername(value) {
  if (value.length > 253 || isIP(value) !== 0) return false
  return value.split('.').every((label) => /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label))
}

/** @param {Environment} environment */
function tlsServername(environment) {
  const servername = configuredValue(environment, 'DATABASE_SSL_SERVERNAME')
  if (!servername) return undefined
  if (!isValidTlsServername(servername)) {
    throw new Error('DATABASE_SSL_SERVERNAME must be a DNS name, not an IP address or wildcard.')
  }
  return servername
}

/** @param {Environment} environment */
function certificateFingerprint(environment) {
  const fingerprint = configuredValue(environment, 'DATABASE_SSL_CERT_SHA256')
  if (!fingerprint) return undefined
  if (!/^(?:[0-9a-f]{2}:){31}[0-9a-f]{2}$/i.test(fingerprint) && !/^[0-9a-f]{64}$/i.test(fingerprint)) {
    throw new Error('DATABASE_SSL_CERT_SHA256 must be a SHA-256 certificate fingerprint.')
  }
  const normalized = fingerprint.replaceAll(':', '').toLowerCase()
  return normalized
}

/** @param {string} expected @param {import('node:tls').PeerCertificate} certificate */
function certificateFingerprintMatches(expected, certificate) {
  const actual = Buffer.isBuffer(certificate.raw)
    ? createHash('sha256').update(certificate.raw).digest('hex')
    : typeof certificate.fingerprint256 === 'string'
      ? certificate.fingerprint256.replaceAll(':', '').toLowerCase()
      : undefined
  if (!actual || !/^[0-9a-f]{64}$/.test(actual)) return false
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual, 'hex'))
}

/** @param {Environment} environment @returns {false | ConnectionOptions} */
function sslConfig(environment) {
  const rawMode = configuredValue(environment, 'PGSSLMODE')
  const sslMode = rawMode?.toLowerCase()
  const ca = certificateAuthority(environment)
  const servername = tlsServername(environment)
  const fingerprint = certificateFingerprint(environment)

  if (sslMode && !SUPPORTED_SSL_MODES.has(sslMode)) {
    throw new Error('PGSSLMODE must be disable, require, verify-ca, or verify-full.')
  }
  if (sslMode === 'disable') {
    if (ca || servername || fingerprint) {
      throw new Error('A database CA certificate, DATABASE_SSL_SERVERNAME, or certificate fingerprint cannot be configured when PGSSLMODE=disable.')
    }
    return false
  }
  if ((servername || fingerprint) && !ca) {
    throw new Error('DATABASE_SSL_SERVERNAME and DATABASE_SSL_CERT_SHA256 require DATABASE_SSL_CA, DATABASE_SSL_CA_FILE, or PGSSLROOTCERT.')
  }
  if (!sslMode && !ca) {
    // Explicitly override node-postgres environment defaults. In particular, this
    // prevents a stray PGSSLMODE=no-verify from silently weakening the connection.
    return false
  }

  // node-postgres's "require" mode otherwise maps to rejectUnauthorized: false.
  // Always verify the server certificate; the platform trust store is used when no
  // custom CA is supplied, while DATABASE_SSL_CA(_FILE) supports private CAs.
  // node-postgres overwrites TLS `servername` with the URL host, so an intentional
  // certificate identity override must delegate to Node's strict identity checker.
  return {
    rejectUnauthorized: true,
    ...(ca ? { ca } : {}),
    ...(servername || fingerprint
      ? {
          checkServerIdentity: (urlHost, certificate) => {
            const identityError = checkServerIdentity(servername ?? urlHost, certificate)
            if (identityError) return identityError
            if (fingerprint && !certificateFingerprintMatches(fingerprint, certificate)) {
              return new Error('Database TLS certificate fingerprint did not match DATABASE_SSL_CERT_SHA256.')
            }
            return undefined
          },
        }
      : {}),
  }
}

/** @param {Environment} environment */
function poolMax(environment) {
  const value = configuredValue(environment, 'DATABASE_POOL_MAX')
  if (!value) return DEFAULT_POOL_MAX
  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error(`DATABASE_POOL_MAX must be an integer between 1 and ${MAX_POOL_MAX}.`)
  }

  const max = Number(value)
  if (!Number.isSafeInteger(max) || max > MAX_POOL_MAX) {
    throw new Error(`DATABASE_POOL_MAX must be an integer between 1 and ${MAX_POOL_MAX}.`)
  }
  return max
}

/** @param {Environment} [environment] @returns {RuntimeDatabaseConfig} */
export function runtimeDatabaseConfig(environment = process.env) {
  return {
    ...connectionUrl(environment),
    ssl: sslConfig(environment),
    max: poolMax(environment),
  }
}

/** @param {Environment} [environment] @returns {DirectDatabaseConfig} */
export function directDatabaseConfig(environment = process.env) {
  return {
    connectionString: requiredConnectionUrl(configuredValue(environment, 'DATABASE_URL'), 'DATABASE_URL'),
    ssl: sslConfig(environment),
  }
}
