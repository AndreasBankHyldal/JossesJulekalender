import assert from 'node:assert/strict'
import { test } from 'node:test'
import { handleApi } from '../server/api.ts'
import {
  authenticate, AuthConfigurationError, createSession,
  readAuthConfig, SESSION_COOKIE, SESSION_SECONDS, verifySession,
} from '../server/auth.ts'
import { testAuthEnv } from './fixtures/auth.ts'

const config = readAuthConfig(testAuthEnv)

function loginRequest(username: string, password: string, extras = {}) {
  return new Request('https://calendar.test/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://calendar.test' },
    body: JSON.stringify({ username, password, ...extras }),
  })
}

test('only the two configured accounts authenticate, with distinct roles', () => {
  assert.equal(authenticate(testAuthEnv.JOSSE_USERNAME, testAuthEnv.JOSSE_PASSWORD, config), 'josse')
  assert.equal(authenticate(testAuthEnv.ADMIN_USERNAME, testAuthEnv.ADMIN_PASSWORD, config), 'admin')
  assert.equal(authenticate('stranger', testAuthEnv.ADMIN_PASSWORD, config), null)
  assert.equal(authenticate(testAuthEnv.ADMIN_USERNAME, 'wrong-password', config), null)
  assert.equal(authenticate('', '', config), null)
})

test('missing credentials, duplicate usernames, and a weak signing key fail closed', () => {
  assert.throws(() => readAuthConfig({}), AuthConfigurationError)
  assert.throws(() => readAuthConfig({ ...testAuthEnv, ADMIN_PASSWORD: '' }), AuthConfigurationError)
  assert.throws(() => readAuthConfig({ ...testAuthEnv, ADMIN_USERNAME: testAuthEnv.JOSSE_USERNAME }), AuthConfigurationError)
  assert.throws(() => readAuthConfig({ ...testAuthEnv, SESSION_SECRET: 'too-short' }), AuthConfigurationError)
})

test('sessions are signed, expire after seven days, and cannot have their role changed', () => {
  const now = 1_800_000_000_000
  const token = createSession('josse', config, now)
  assert.equal(verifySession(token, config, now), 'josse')
  assert.equal(verifySession(token, config, now + SESSION_SECONDS * 1000), null)
  const [payload, signature] = token.split('.')
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  const modified = Buffer.from(JSON.stringify({ ...claims, role: 'admin' })).toString('base64url')
  assert.equal(verifySession(`${modified}.${signature}`, config, now), null)
  assert.equal(verifySession('not.a.valid.session', config, now), null)
  assert.equal(verifySession('invalid.signature', config, now), null)
})

test('changing a password or signing key invalidates the affected sessions', () => {
  const token = createSession('admin', config)
  assert.equal(verifySession(token, readAuthConfig({ ...testAuthEnv, ADMIN_PASSWORD: 'changed-password' })), null)
  assert.equal(verifySession(token, readAuthConfig({ ...testAuthEnv, SESSION_SECRET: 'another-test-only-signing-key-with-32-characters' })), null)
})

test('anonymous API visitors cannot read the calendar notes', async () => {
  const response = await handleApi(new Request('https://calendar.test/api'), testAuthEnv)
  assert.equal(response.status, 401)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.equal('days' in await response.json(), false)
  const forged = await handleApi(new Request('https://calendar.test/api', {
    headers: { Cookie: `${SESSION_COOKIE}=fake.cookie` },
  }), testAuthEnv)
  assert.equal(forged.status, 401)
})

test('login sets a private secure cookie; the session restores without exposing credentials', async () => {
  const response = await handleApi(loginRequest(testAuthEnv.ADMIN_USERNAME, testAuthEnv.ADMIN_PASSWORD), testAuthEnv)
  assert.equal(response.status, 200)
  const cookie = response.headers.get('set-cookie')!
  for (const flag of ['HttpOnly', 'SameSite=Lax', 'Secure', 'Path=/']) assert.ok(cookie.includes(flag))
  const data = await response.json()
  assert.equal(data.role, 'admin')
  assert.equal(data.days.length, 24)
  assert.equal(JSON.stringify(data).includes(testAuthEnv.ADMIN_PASSWORD), false)
  assert.equal(JSON.stringify(data).includes(testAuthEnv.SESSION_SECRET), false)
  const restored = await handleApi(new Request('https://calendar.test/api', {
    headers: { Cookie: cookie.split(';')[0] },
  }), testAuthEnv)
  assert.equal(restored.status, 200)
  assert.equal((await restored.json()).role, 'admin')
})

test('requesting an admin role does not elevate a Josse login', async () => {
  const response = await handleApi(loginRequest(
    testAuthEnv.JOSSE_USERNAME, testAuthEnv.JOSSE_PASSWORD, { role: 'admin' },
  ), testAuthEnv)
  assert.equal((await response.json()).role, 'josse')
})

test('wrong credentials never set a session or return private notes', async () => {
  const response = await handleApi(loginRequest(testAuthEnv.ADMIN_USERNAME, 'wrong-password'), testAuthEnv)
  assert.equal(response.status, 401)
  assert.equal(response.headers.get('set-cookie'), null)
  assert.equal('days' in await response.json(), false)
})

test('logout expires the cookie, while foreign-origin login and logout are rejected', async () => {
  const response = await handleApi(new Request('https://calendar.test/api', { method: 'DELETE' }), testAuthEnv)
  assert.equal(response.status, 200)
  assert.ok(response.headers.get('set-cookie')!.includes('Max-Age=0'))
  for (const method of ['POST', 'DELETE']) {
    const blocked = await handleApi(new Request('https://calendar.test/api', {
      method, headers: { Origin: 'https://another-site.test' },
    }), testAuthEnv)
    assert.equal(blocked.status, 403)
    assert.equal(blocked.headers.get('set-cookie'), null)
  }
})

test('invalid input, oversized requests, and unsupported methods have explicit errors', async () => {
  const invalid = await handleApi(new Request('https://calendar.test/api', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken',
  }), testAuthEnv)
  assert.equal(invalid.status, 400)
  const oversized = await handleApi(loginRequest('a', 'a'.repeat(5000)), testAuthEnv)
  assert.equal(oversized.status, 413)
  const wrongType = await handleApi(new Request('https://calendar.test/api', {
    method: 'POST', body: 'username=hello&password=world',
  }), testAuthEnv)
  assert.equal(wrongType.status, 415)
  const wrongMethod = await handleApi(new Request('https://calendar.test/api', { method: 'PUT' }), testAuthEnv)
  assert.equal(wrongMethod.status, 405)
})

test('missing setup is reported instead of allowing a default login', async (context) => {
  const log = context.mock.method(console, 'error', () => {})
  const response = await handleApi(loginRequest('admin', 'admin'), {})
  assert.equal(response.status, 503)
  assert.equal(log.mock.callCount(), 1)
  assert.equal('days' in await response.json(), false)
})
