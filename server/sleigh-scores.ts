import { Redis } from '@upstash/redis'
import { CALENDAR_YEAR } from '../src/lib/calendar.ts'
import { isRunResult, parseSleighHighScores } from '../src/lib/sleigh-game.ts'
import type { RunResult, SleighHighScores } from '../src/lib/sleigh-game.ts'
import type { AccountRole } from '../src/types/session.ts'
import { AuthConfigurationError, readAuthConfig, sessionFromCookie } from './auth.ts'
import { json } from './http.ts'

export class ScoreConfigurationError extends Error {}

export type SleighScoreStore = {
  read(): Promise<SleighHighScores>
  record(role: AccountRole, result: RunResult): Promise<SleighHighScores>
}

export function createScoreStore(env: Record<string, string | undefined>): SleighScoreStore {
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) throw new ScoreConfigurationError('Fælles rekorder er ikke sat op endnu. Forbind Upstash Redis i Vercel.')
  const redis = new Redis({ url, token, enableAutoPipelining: false })
  const key = `josses:sleigh-game:${env.VERCEL_ENV || 'development'}:${CALENDAR_YEAR}`

  function player(presents: unknown, durationMs: unknown): RunResult | null {
    if (presents === null && durationMs === null) return null
    const result = { presents, durationMs }
    if (!isRunResult(result)) throw new Error('Den gemte spilrekord har forkert format.')
    return result
  }
  async function read(): Promise<SleighHighScores> {
    const values = await redis.zmscore(key, ['admin:presents', 'admin:durationMs', 'josse:presents', 'josse:durationMs'])
    if (!values || values.length !== 4) throw new Error('Rekordserveren sendte et ufuldstændigt svar.')
    return parseSleighHighScores({
      admin: player(values[0], values[1]), josse: player(values[2], values[3]), storage: 'shared',
    })
  }

  return {
    read,
    async record(role: AccountRole, result: RunResult) {
      await redis.zadd(key, { gt: true },
        { member: `${role}:presents`, score: result.presents },
        { member: `${role}:durationMs`, score: result.durationMs },
      )
      return read()
    },
  }
}

export async function handleSleighScores(
  request: Request,
  env: Record<string, string | undefined> = process.env,
  localStore?: SleighScoreStore,
): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json({ error: 'Denne metode er ikke tilladt.' }, 405, { Allow: 'GET, POST' })
  }
  if (request.method === 'POST') {
    const origin = request.headers.get('origin')
    if (
      (origin && origin !== new URL(request.url).origin) ||
      request.headers.get('sec-fetch-site') === 'cross-site'
    ) return json({ error: 'Denne forespørgsel er ikke tilladt.' }, 403)
  }
  if (!request.headers.get('cookie')) return json({ error: 'Log ind for at se og gemme rekorder.' }, 401)

  try {
    const role = sessionFromCookie(request.headers.get('cookie'), readAuthConfig(env))
    if (!role) return json({ error: 'Din session er udløbet. Log ind igen for at se og gemme rekorder.' }, 401)
    if (request.method === 'GET') return json(await (localStore ?? createScoreStore(env)).read())
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
      return json({ error: 'Resultatet skal sendes som JSON.' }, 415)
    }
    const body = await request.text()
    if (Buffer.byteLength(body, 'utf8') > 1024) return json({ error: 'Resultatet er for stort.' }, 413)
    let value: unknown
    try {
      value = JSON.parse(body)
    } catch (error) {
      if (error instanceof SyntaxError) return json({ error: 'Resultatet kunne ikke læses.' }, 400)
      throw error
    }
    if (
      typeof value !== 'object' || value === null ||
      !isRunResult(value) || Object.keys(value).length !== 2
    ) return json({ error: 'Resultatet er ikke gyldigt.' }, 400)
    return json(await (localStore ?? createScoreStore(env)).record(role, value))
  } catch (error) {
    if (error instanceof ScoreConfigurationError || error instanceof AuthConfigurationError) {
      console.error('Rekordserveren mangler konfiguration.')
      return json({ error: error.message }, 503)
    }
    console.error('Fælles rekorder kunne ikke opdateres:', error instanceof Error ? error.name : 'Ukendt fejl')
    return json({ error: 'Rekorderne kunne ikke hentes eller gemmes. Prøv igen om lidt.' }, 502)
  }
}
