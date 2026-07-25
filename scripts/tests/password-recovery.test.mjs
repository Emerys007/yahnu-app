import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  emailAppOrigin,
  isEmailDeliveryConfigured,
  isLocalEmailDebugEnabled,
} from '../../src/lib/server/email-config.mjs'
import {
  PASSWORD_FORGOT_MINIMUM_RESPONSE_MS,
  PASSWORD_FORGOT_RESPONSE_JITTER_MS,
  remainingRecoveryResponseDelayMs,
} from '../../src/lib/server/password-recovery-policy.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(here, '..', '..')

test('production recovery fails closed when a global email prerequisite is missing', () => {
  const configured = {
    NODE_ENV: 'production',
    APP_URL: 'https://yahnu.org',
    RESEND_API_KEY: 'provider-key',
    EMAIL_FROM: 'Yahnu <contact@yahnu.org>',
  }

  assert.equal(isEmailDeliveryConfigured(configured), true)
  assert.equal(isEmailDeliveryConfigured({ ...configured, RESEND_API_KEY: '' }), false)
  assert.equal(isEmailDeliveryConfigured({ ...configured, EMAIL_FROM: '   ' }), false)
  assert.equal(isEmailDeliveryConfigured({ ...configured, APP_URL: '' }), false)
  assert.equal(isEmailDeliveryConfigured({ ...configured, APP_URL: 'http://yahnu.org' }), false)
  assert.equal(isEmailDeliveryConfigured({ ...configured, APP_URL: 'not-a-url' }), false)
  assert.equal(isEmailDeliveryConfigured({ ...configured, APP_URL: 'https://user:pass@yahnu.org' }), false)
  assert.equal(isEmailDeliveryConfigured({ ...configured, APP_URL: 'https://yahnu.org/recovery' }), false)
  assert.equal(isEmailDeliveryConfigured({ ...configured, APP_URL: 'https://yahnu.org?debug=1' }), false)
  assert.equal(isEmailDeliveryConfigured({ ...configured, APP_URL: 'https://yahnu.org#debug' }), false)
  assert.equal(emailAppOrigin({ ...configured, APP_URL: 'https://yahnu.org/' }), 'https://yahnu.org')
})

test('local debug links require an explicit flag and a loopback development origin', () => {
  const localDebug = {
    NODE_ENV: 'development',
    APP_URL: 'http://localhost:3000',
    YAHNU_ALLOW_LOCAL_EMAIL_DEBUG: 'true',
  }

  assert.equal(isLocalEmailDebugEnabled(localDebug), true)
  assert.equal(isEmailDeliveryConfigured(localDebug), true)
  assert.equal(isLocalEmailDebugEnabled({ ...localDebug, YAHNU_ALLOW_LOCAL_EMAIL_DEBUG: 'false' }), false)
  assert.equal(isLocalEmailDebugEnabled({ ...localDebug, YAHNU_ALLOW_LOCAL_EMAIL_DEBUG: undefined }), false)
  assert.equal(isLocalEmailDebugEnabled({ ...localDebug, APP_URL: undefined }), false)
  assert.equal(isLocalEmailDebugEnabled({ ...localDebug, NODE_ENV: 'production' }), false)
  assert.equal(isLocalEmailDebugEnabled({ ...localDebug, NODE_ENV: 'staging' }), false)
  assert.equal(isLocalEmailDebugEnabled({ ...localDebug, APP_URL: 'https://staging.yahnu.org' }), false)
  assert.equal(isLocalEmailDebugEnabled({ ...localDebug, APP_URL: 'http://127.0.0.1:3000' }), true)
  assert.equal(isLocalEmailDebugEnabled({ ...localDebug, APP_URL: 'http://[::1]:3000' }), true)
  assert.equal(isLocalEmailDebugEnabled({ ...localDebug, APP_URL: 'http://user:pass@localhost:3000' }), false)

  assert.equal(isEmailDeliveryConfigured({
    NODE_ENV: 'development',
    APP_URL: 'http://localhost:3000',
    RESEND_API_KEY: 'provider-key',
    EMAIL_FROM: 'Yahnu <contact@yahnu.org>',
  }), true)
  assert.equal(isEmailDeliveryConfigured({
    NODE_ENV: 'staging',
    APP_URL: 'https://staging.yahnu.org',
    RESEND_API_KEY: 'provider-key',
    EMAIL_FROM: 'Yahnu <contact@yahnu.org>',
  }), true)
  assert.equal(isEmailDeliveryConfigured({
    ...localDebug,
    NODE_ENV: 'production',
  }), false)
})

test('neutral recovery timing applies a bounded floor and jitter', () => {
  assert.equal(
    remainingRecoveryResponseDelayMs(1_000, 1_100, 0),
    PASSWORD_FORGOT_MINIMUM_RESPONSE_MS - 100,
  )
  assert.equal(
    remainingRecoveryResponseDelayMs(1_000, 1_100, PASSWORD_FORGOT_RESPONSE_JITTER_MS),
    PASSWORD_FORGOT_MINIMUM_RESPONSE_MS + PASSWORD_FORGOT_RESPONSE_JITTER_MS - 100,
  )
  assert.equal(
    remainingRecoveryResponseDelayMs(1_000, 1_100, PASSWORD_FORGOT_RESPONSE_JITTER_MS + 5_000),
    PASSWORD_FORGOT_MINIMUM_RESPONSE_MS + PASSWORD_FORGOT_RESPONSE_JITTER_MS - 100,
  )
  assert.equal(remainingRecoveryResponseDelayMs(1_000, 10_000, 0), 0)
})

test('the recovery route checks global delivery readiness before looking up an account', async () => {
  const route = await readFile(
    path.join(projectRoot, 'src', 'app', 'api', 'auth', 'password', 'forgot', 'route.ts'),
    'utf8',
  )

  const readinessCheck = route.indexOf('assertEmailDeliveryConfigured()')
  const accountLookup = route.indexOf('SELECT id, name, email FROM users')

  assert.notEqual(readinessCheck, -1)
  assert.notEqual(accountLookup, -1)
  assert.ok(readinessCheck < accountLookup)
  assert.match(route, /password_forgot_email_hour/)
  assert.match(route, /password_forgot_email_day/)
  assert.match(route, /created_at > now\(\) - \(\$2 \* interval '1 minute'\)/)
  assert.match(route, /waitForNeutralRecoveryTiming/)
  assert.doesNotMatch(
    route,
    /DELETE FROM auth_tokens WHERE user_id = \$1 AND purpose = 'reset_password' AND used_at IS NULL/,
  )
  assert.match(route, /Unable to deliver password reset email after request acceptance\./)
  assert.doesNotMatch(route, /Unable to deliver password reset email:', error/)
  assert.doesNotMatch(route, /process\.env\.NODE_ENV/)
})

test('reset checks token validity before password hashing and revalidates under lock', async () => {
  const route = await readFile(
    path.join(projectRoot, 'src', 'app', 'api', 'auth', 'password', 'reset', 'route.ts'),
    'utf8',
  )

  const cheapLookup = route.indexOf('const candidate = await query')
  const passwordHash = route.indexOf('const passwordHash = await hashPassword')
  const lockedLookup = route.indexOf('FOR UPDATE')

  assert.notEqual(cheapLookup, -1)
  assert.notEqual(passwordHash, -1)
  assert.notEqual(lockedLookup, -1)
  assert.ok(cheapLookup < passwordHash)
  assert.ok(passwordHash < lockedLookup)
  assert.match(route, /if \(!candidate\.rowCount\) throw invalidResetToken\(\)/)
})

test('debug URLs are gated in the email helper rather than by broad route environment checks', async () => {
  const files = [
    path.join(projectRoot, 'src', 'lib', 'server', 'email.ts'),
    path.join(projectRoot, 'src', 'app', 'api', 'admin', 'invites', 'route.ts'),
    path.join(projectRoot, 'src', 'app', 'api', 'auth', 'verify', 'resend', 'route.ts'),
  ]
  const sources = await Promise.all(files.map((file) => readFile(file, 'utf8')))

  assert.match(sources[0], /isLocalEmailDebugEnabled\(\) \? url : undefined/)
  for (const source of sources) {
    assert.doesNotMatch(source, /NODE_ENV\s*!==\s*['"]production['"].*debugUrl/)
  }
})

test('health fails readiness without exposing configuration details and reset removes token from history', async () => {
  const [health, resetPage] = await Promise.all([
    readFile(path.join(projectRoot, 'src', 'app', 'api', 'health', 'route.ts'), 'utf8'),
    readFile(path.join(projectRoot, 'src', 'app', 'reset-password', 'page.tsx'), 'utf8'),
  ])

  assert.match(health, /emailReady/)
  assert.match(health, /status: emailReady \? 200 : 503/)
  assert.doesNotMatch(health, /RESEND_API_KEY|EMAIL_FROM/)
  assert.match(resetPage, /sanitized\.searchParams\.delete\("token"\)/)
  assert.match(resetPage, /window\.history\.replaceState/)
})
