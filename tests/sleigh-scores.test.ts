import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { handleApi } from '../server/api.ts'
import { createSession, readAuthConfig, SESSION_COOKIE } from '../server/auth.ts'
import { createLocalScoreStore } from '../server/local-scores.ts'
import { calendarApi } from '../server/vite-api.ts'
import { isRunResult, mergeBests, parseSleighHighScores } from '../src/lib/sleigh-game.ts'
import type { AccountRole } from '../src/types/session.ts'
import { testAuthEnv } from './fixtures/auth.ts'

const config = readAuthConfig(testAuthEnv)
const redisEnv = {
  ...testAuthEnv, KV_REST_API_URL: 'https://redis.test',
  KV_REST_API_TOKEN: 'fictional-test-redis-token', VERCEL_ENV: 'production',
}
const result = (presents: number, durationMs: number) => ({ presents, durationMs })

function scoreRequest(role: AccountRole, value?: unknown, overrides: RequestInit = {}) {
  return new Request('https://calendar.test/api?resource=sleigh-game', {
    method: value === undefined ? 'GET' : 'POST',
    headers: {
      Cookie: `${SESSION_COOKIE}=${createSession(role, config)}`,
      'Content-Type': 'application/json', Origin: 'https://calendar.test',
    },
    ...(value === undefined ? {} : { body: JSON.stringify(value) }),
    ...overrides,
  })
}

test('records validate both independent metrics, including zero and unplayed games', () => {
  assert.ok(isRunResult(result(0, 0)))
  assert.ok(isRunResult(result(200, 300_000)))
  for (const value of [null, {}, result(-1, 200), result(1, -1), result(1.5, 200), result(1, 1.5), result(Infinity, 200), result(1, Number.MAX_SAFE_INTEGER + 1)]) {
    assert.equal(isRunResult(value), false)
  }
  assert.deepEqual(mergeBests(result(8, 2000), result(3, 5000)), result(8, 5000))
  assert.deepEqual(parseSleighHighScores({ admin: result(0, 0), josse: null, storage: 'shared' }), { admin: result(0, 0), josse: null, storage: 'shared' })
  for (const value of [null, {}, { admin: 0, josse: null, storage: 'shared' }, { admin: null, josse: null, storage: 'other' }]) {
    assert.throws(() => parseSleighHighScores(value))
  }
})

test('Redis updates gifts and survival atomically, retaining separate maxima for each account', async (context) => {
  const sets = new Map<string, Map<string, number>>()
  context.mock.method(globalThis, 'fetch', async (_input: unknown, init: RequestInit) => {
    const command: unknown = JSON.parse(String(init.body))
    assert.ok(Array.isArray(command))
    const [name, key] = command
    assert.equal(typeof key, 'string')
    assert.ok(key.includes('sleigh-game'))
    const scores = sets.get(key) ?? new Map<string, number>()
    sets.set(key, scores)
    if (name === 'zadd') {
      assert.equal(command[2], 'gt')
      assert.equal(command.length, 7)
      for (let index = 3; index < command.length; index += 2) {
        const member = String(command[index + 1])
        scores.set(member, Math.max(scores.get(member) ?? 0, Number(command[index])))
      }
      return Response.json({ result: 2 })
    }
    assert.equal(name, 'zmscore')
    assert.equal(command.length, 6)
    return Response.json({ result: command.slice(2).map((member) => scores.get(String(member))?.toString() ?? null) })
  })
  for (const [role, score] of [['admin', result(7, 10_000)], ['josse', result(3, 15_000)], ['admin', result(2, 20_000)]] as const) {
    assert.equal((await handleApi(scoreRequest(role, score), redisEnv)).status, 200)
  }
  const response = await handleApi(scoreRequest('josse'), redisEnv)
  assert.deepEqual(await response.json(), { admin: result(7, 20_000), josse: result(3, 15_000), storage: 'shared' })
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  const preview = await handleApi(scoreRequest('admin'), { ...redisEnv, VERCEL_ENV: 'preview' })
  assert.deepEqual(await preview.json(), { admin: null, josse: null, storage: 'shared' })
  await Promise.all([5, 9, 4, 8].map((score) => handleApi(scoreRequest('admin', result(score, 30_000 - score * 100)), redisEnv)))
  assert.deepEqual(await (await handleApi(scoreRequest('josse'), redisEnv)).json(), {
    admin: result(9, 29_600), josse: result(3, 15_000), storage: 'shared',
  })
})

test('authentication and origin checks prevent writing another account record', async () => {
  assert.equal((await handleApi(new Request('https://calendar.test/api?resource=sleigh-game'), redisEnv)).status, 401)
  assert.equal((await handleApi(scoreRequest('admin', undefined, { headers: { Cookie: `${SESSION_COOKIE}=fake.cookie` } }), redisEnv)).status, 401)
  assert.equal((await handleApi(scoreRequest('josse', { ...result(1, 2000), role: 'admin' }), redisEnv)).status, 400)
  assert.equal((await handleApi(scoreRequest('admin', result(1, 2000), { headers: { Origin: 'https://other.test' } }), redisEnv)).status, 403)
  assert.equal((await handleApi(scoreRequest('admin', result(1, 2000), { headers: { 'Sec-Fetch-Site': 'cross-site' } }), redisEnv)).status, 403)
})

test('invalid payloads, content types, and methods are rejected before storage', async () => {
  for (const value of [null, 3, result(-1, 10), result(1, -1), result(1.5, 100), { presents: '3', durationMs: 200 }]) {
    assert.equal((await handleApi(scoreRequest('admin', value), redisEnv)).status, 400)
  }
  assert.equal((await handleApi(scoreRequest('admin', result(0, 0), { body: '{broken' }), redisEnv)).status, 400)
  assert.equal((await handleApi(scoreRequest('admin', result(0, 0), { body: 'x'.repeat(1025) }), redisEnv)).status, 413)
  assert.equal((await handleApi(scoreRequest('admin', result(0, 0), { headers: { Cookie: `${SESSION_COOKIE}=${createSession('admin', config)}` } }), redisEnv)).status, 415)
  assert.equal((await handleApi(scoreRequest('admin', undefined, { method: 'DELETE' }), redisEnv)).status, 405)
})

test('configuration and storage failures do not look like successfully loaded records', async (context) => {
  context.mock.method(console, 'error', () => {})
  assert.equal((await handleApi(scoreRequest('admin'), testAuthEnv)).status, 503)
  context.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'Test failure' }))
  const failed = await handleApi(scoreRequest('admin', result(1, 2000)), redisEnv)
  assert.equal(failed.status, 502)
  assert.ok('error' in await failed.json())
})

test('local records survive reloads and concurrent writes without reducing either best', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'josses-sleigh-'))
  context.after(() => rm(directory, { recursive: true, force: true }))
  const file = join(directory, 'scores.json')
  const store = createLocalScoreStore(file)
  assert.deepEqual(await store.read(), { admin: null, josse: null, storage: 'local' })
  await Promise.all([2, 9, 1, 5].map((score) => store.record('admin', result(score, score * 1000))))
  await store.record('admin', result(3, 12_000))
  await store.record('josse', result(0, 2000))
  const expected = { admin: result(9, 12_000), josse: result(0, 2000), storage: 'local' }
  assert.deepEqual(await createLocalScoreStore(file).read(), expected)
  assert.deepEqual(await (await handleApi(scoreRequest('josse'), testAuthEnv, store)).json(), expected)
  await writeFile(file, '{broken')
  await assert.rejects(store.read(), SyntaxError)
})

test('local files cannot be enabled in a Vercel deployment', () => {
  assert.throws(() => calendarApi({ VERCEL: '1', CALENDAR_LOCAL_SCORE_FILE: '/unused/test.json' }))
})
