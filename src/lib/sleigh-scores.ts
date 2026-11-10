import { parseSleighHighScores } from './sleigh-game'
import type { RunResult, SleighHighScores } from './sleigh-game'

export async function requestSleighScores(result?: RunResult, signal?: AbortSignal): Promise<SleighHighScores> {
  const response = await fetch('/api?resource=sleigh-game', {
    method: result === undefined ? 'GET' : 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000),
    ...(result === undefined ? {} : {
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result),
    }),
  })
  const data: unknown = await response.json()
  if (!response.ok) {
    throw new Error(typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
      ? data.error
      : 'Rekorderne kunne ikke hentes eller gemmes. Prøv igen.')
  }
  return parseSleighHighScores(data)
}
