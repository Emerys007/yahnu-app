import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import {
  authExportPayload,
  firebaseAuthEndpoint,
  firebaseAuthJson,
  listFirebaseAuthUsers,
  parseArguments,
  sanitizeAuthExportValue,
  validateOutputPath,
} from '../export-firebase-auth-rest.mjs'
import { preflightFirebaseAuthExport } from '../import-firebase-json.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(here, '..', '..')
const project = 'yahnu-50c61'
const testToken = 'not-a-real-access-token-value'

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    body: { cancel: async () => undefined },
    json: async () => body,
  }
}

test('exports every Auth page, removes credentials, and preserves importer-compatible users', async () => {
  const observed = []
  const responses = [
    jsonResponse({
      users: [{
        localId: 'first-user',
        email: 'first@example.test',
        passwordHash: 'must-not-survive',
        salt: 'must-not-survive',
        providerUserInfo: [{ providerId: 'password', rawId: 'first@example.test', accessToken: 'must-not-survive' }],
      }],
      nextPageToken: 'next-page',
    }),
    jsonResponse({
      users: [{
        localId: 'second-user',
        email: 'second@example.test',
        providerUserInfo: [{ providerId: 'google.com', rawId: 'google-subject' }],
        nested: { refreshToken: 'must-not-survive', retained: 'yes' },
      }],
    }),
  ]

  const result = await listFirebaseAuthUsers({ project, token: testToken }, {
    fetchImpl: async (url, options) => {
      observed.push({ url: new URL(url), authorization: options.headers.Authorization, redirect: options.redirect })
      return responses.shift()
    },
  })

  assert.equal(result.pages, 2)
  assert.equal(result.users.length, 2)
  assert.equal(observed.length, 2)
  assert.equal(observed[0].url.origin, 'https://identitytoolkit.googleapis.com')
  assert.equal(observed[0].url.pathname, '/v1/projects/yahnu-50c61/accounts:batchGet')
  assert.equal(observed[0].url.searchParams.get('maxResults'), '1000')
  assert.equal(observed[0].url.searchParams.get('nextPageToken'), null)
  assert.equal(observed[1].url.searchParams.get('nextPageToken'), 'next-page')
  assert.equal(observed[0].authorization, `Bearer ${testToken}`)
  assert.equal(observed[0].redirect, 'error')
  assert.equal(result.users[0].passwordHash, undefined)
  assert.equal(result.users[0].salt, undefined)
  assert.equal(result.users[0].providerUserInfo[0].accessToken, undefined)
  assert.equal(result.users[1].nested.refreshToken, undefined)
  assert.equal(result.users[1].nested.retained, 'yes')

  const payload = authExportPayload({ project, ...result, exportedAt: '2026-07-16T00:00:00.000Z' })
  assert.ok(Array.isArray(payload.users))
  assert.equal(payload.users[0].localId, 'first-user')
  assert.equal(payload._metadata.userCount, 2)
  assert.match(payload._metadata.usersSha256, /^[a-f0-9]{64}$/)
  assert.equal(preflightFirebaseAuthExport(payload).passed, true)
})

test('retries transient Auth API failures without inspecting or echoing provider bodies', async () => {
  let calls = 0
  const delays = []
  const result = await firebaseAuthJson(firebaseAuthEndpoint(project), { token: testToken }, {
    fetchImpl: async () => {
      calls += 1
      if (calls === 1) return jsonResponse({ error: { message: 'do not expose response body' } }, 503)
      return jsonResponse({ users: [] })
    },
    sleepImpl: async (milliseconds) => delays.push(milliseconds),
  })

  assert.deepEqual(result, { users: [] })
  assert.equal(calls, 2)
  assert.deepEqual(delays, [500])
})

test('fails closed on repeated pagination tokens and duplicate Firebase UIDs', async () => {
  await assert.rejects(
    listFirebaseAuthUsers({ project, token: testToken }, {
      fetchImpl: async () => jsonResponse({ users: [], nextPageToken: 'repeat-me' }),
    }),
    /repeated a page token/i,
  )

  let calls = 0
  await assert.rejects(
    listFirebaseAuthUsers({ project, token: testToken }, {
      fetchImpl: async () => {
        calls += 1
        return calls === 1
          ? jsonResponse({ users: [{ localId: 'duplicate-user' }], nextPageToken: 'page-2' })
          : jsonResponse({ users: [{ localId: 'duplicate-user' }] })
      },
    }),
    /duplicate user ID/i,
  )
})

test('rejects repository output paths and duplicate option values', async () => {
  await assert.rejects(
    validateOutputPath(path.join(projectRoot, 'firebase-auth.json')),
    /outside this repository/i,
  )
  assert.throws(
    () => parseArguments(['--project', project, '--project', project]),
    /only once/i,
  )
})

test('sanitizes nested credential fields without changing UID or provider identity fields', () => {
  const sanitized = sanitizeAuthExportValue({
    localId: 'stable-uid',
    providerUserInfo: [{ providerId: 'google.com', rawId: 'stable-subject', oauth_id_token: 'discard-me' }],
    customAttributes: '{"role":"graduate"}',
    nested: { Authorization: 'discard-me', stable: true },
  })

  assert.deepEqual(sanitized, {
    localId: 'stable-uid',
    providerUserInfo: [{ providerId: 'google.com', rawId: 'stable-subject' }],
    customAttributes: '{"role":"graduate"}',
    nested: { stable: true },
  })
})
