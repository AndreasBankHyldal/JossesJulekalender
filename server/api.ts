import { adventDays } from '../src/data/advent.ts'
import type { AccountRole, CalendarSession } from '../src/types/session.ts'
import {
  authenticate, AuthConfigurationError, createSession,
  readAuthConfig, sessionCookie, sessionFromCookie,
} from './auth.ts'

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'Vary': 'Cookie',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  })
}

export async function handleApi(
  request: Request,
  env: Record<string, string | undefined> = process.env,
): Promise<Response> {
  const secure = new URL(request.url).protocol === 'https:'
  if (request.method !== 'GET') {
    const origin = request.headers.get('origin')
    if (
      (origin && origin !== new URL(request.url).origin) ||
      request.headers.get('sec-fetch-site') === 'cross-site'
    ) return json({ error: 'Denne forespørgsel er ikke tilladt.' }, 403)
  }

  if (request.method === 'DELETE') {
    return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', secure) })
  }
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json({ error: 'Denne metode er ikke tilladt.' }, 405, { Allow: 'GET, POST, DELETE' })
  }
  if (request.method === 'GET' && !request.headers.get('cookie')) {
    return json({ error: 'Log ind for at se kalenderen.' }, 401)
  }

  try {
    const config = readAuthConfig(env)
    let role: AccountRole | null
    const headers: Record<string, string> = {}

    if (request.method === 'POST') {
      if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
        return json({ error: 'Login skal sendes som JSON.' }, 415)
      }
      const body = await request.text()
      if (Buffer.byteLength(body, 'utf8') > 4096) {
        return json({ error: 'Loginoplysningerne er for lange.' }, 413)
      }
      const credentials: unknown = JSON.parse(body)
      if (
        typeof credentials !== 'object' || credentials === null ||
        !('username' in credentials) || typeof credentials.username !== 'string' ||
        !('password' in credentials) || typeof credentials.password !== 'string' ||
        credentials.username.length > 128 || credentials.password.length > 512
      ) return json({ error: 'Udfyld brugernavn og adgangskode.' }, 400)

      role = authenticate(credentials.username, credentials.password, config)
      if (role) headers['Set-Cookie'] = sessionCookie(createSession(role, config), secure)
    } else {
      role = sessionFromCookie(request.headers.get('cookie'), config)
    }

    if (!role) return json({ error: 'Forkert brugernavn eller adgangskode. Prøv igen.' }, 401)
    const session: CalendarSession = { role, days: adventDays }
    return json(session, 200, headers)
  } catch (error) {
    if (error instanceof SyntaxError) return json({ error: 'Loginoplysningerne kunne ikke læses.' }, 400)
    if (error instanceof AuthConfigurationError) {
      console.error('Login mangler konfiguration.')
      return json({ error: error.message }, 503)
    }
    console.error('Der opstod en fejl i kalenderens login:', error)
    return json({ error: 'Login er midlertidigt utilgængeligt. Prøv igen om lidt.' }, 500)
  }
}
