function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0
}

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

function explicitLocalDebugRequested(environment) {
  return environment.NODE_ENV === 'development'
    && environment.YAHNU_ALLOW_LOCAL_EMAIL_DEBUG?.trim().toLowerCase() === 'true'
}

function parseAppUrl(environment) {
  const configuredUrl = environment.APP_URL?.trim()
  if (!configuredUrl) return null

  try {
    const parsed = new URL(configuredUrl)
    if (parsed.username || parsed.password || parsed.search || parsed.hash) return null
    if (parsed.pathname !== '/' && parsed.pathname !== '') return null

    const isLocal = LOCAL_HOSTNAMES.has(parsed.hostname)
    const safeProtocol = parsed.protocol === 'https:'
      || (environment.NODE_ENV === 'development' && isLocal && parsed.protocol === 'http:')
    return safeProtocol ? parsed : null
  } catch {
    return null
  }
}

/**
 * Local recovery links are intentionally available only after an explicit
 * opt-in in a development process whose configured application origin is a
 * loopback host. NODE_ENV alone is never sufficient.
 *
 * @param {Record<string, string | undefined>} [environment]
 */
export function isLocalEmailDebugEnabled(environment = process.env) {
  if (!explicitLocalDebugRequested(environment)) return false
  const parsed = parseAppUrl(environment)
  return Boolean(parsed && LOCAL_HOSTNAMES.has(parsed.hostname))
}

/**
 * Returns the validated application origin used in transactional email links.
 *
 * @param {Record<string, string | undefined>} [environment]
 */
export function emailAppOrigin(environment = process.env) {
  const parsed = parseAppUrl(environment)
  return parsed?.origin ?? null
}

/**
 * Reports whether the process can either deliver transactional email or,
 * after explicit opt-in, provide links to a loopback-only development app.
 *
 * @param {Record<string, string | undefined>} [environment]
 */
export function isEmailDeliveryConfigured(environment = process.env) {
  if (isLocalEmailDebugEnabled(environment)) return true
  if (!nonEmpty(environment.RESEND_API_KEY) || !nonEmpty(environment.EMAIL_FROM)) return false

  return emailAppOrigin(environment) !== null
}
