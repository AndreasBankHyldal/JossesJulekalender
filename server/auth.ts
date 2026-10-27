import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import type { AccountRole } from '../src/types/session.ts'

export const SESSION_COOKIE = 'josses-session'
export const SESSION_SECONDS = 7 * 24 * 60 * 60

type Account = { username: string; password: string }
export type AuthConfig = { josse: Account; admin: Account; secret: string }

export class AuthConfigurationError extends Error {}

export function readAuthConfig(env: Record<string, string | undefined> = process.env): AuthConfig {
  const config = {
    josse: { username: env.JOSSE_USERNAME?.trim() ?? '', password: env.JOSSE_PASSWORD ?? '' },
    admin: { username: env.ADMIN_USERNAME?.trim() ?? '', password: env.ADMIN_PASSWORD ?? '' },
    secret: env.SESSION_SECRET ?? '',
  }
  if (
    !config.josse.username || !config.josse.password ||
    !config.admin.username || !config.admin.password ||
    config.secret.length < 32 || config.josse.username === config.admin.username
  ) {
    throw new AuthConfigurationError('Login er ikke sat op endnu. Udfyld de to konti og SESSION_SECRET i miljøvariablerne.')
  }
  return config
}

function equalSecret(left: string, right: string): boolean {
  return timingSafeEqual(
    createHash('sha256').update(left).digest(),
    createHash('sha256').update(right).digest(),
  )
}

export function authenticate(username: string, password: string, config: AuthConfig): AccountRole | null {
  for (const role of ['josse', 'admin'] as const) {
    const account = config[role]
    const usernameMatches = equalSecret(username.trim(), account.username)
    const passwordMatches = equalSecret(password, account.password)
    if (usernameMatches && passwordMatches) return role
  }
  return null
}

function sign(payload: string, role: AccountRole, config: AuthConfig): string {
  // Tying signatures to the credentials also invalidates sessions when a login changes.
  const account = config[role]
  return createHmac('sha256', config.secret)
    .update(JSON.stringify([account.username, account.password, payload]))
    .digest('base64url')
}

export function createSession(role: AccountRole, config: AuthConfig, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({
    role,
    expiresAt: Math.floor(now / 1000) + SESSION_SECONDS,
  })).toString('base64url')
  return `${payload}.${sign(payload, role, config)}`
}

export function verifySession(token: string, config: AuthConfig, now = Date.now()): AccountRole | null {
  if (token.length > 1024) return null
  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra !== undefined) return null
  let claims: unknown
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch (error) {
    if (error instanceof SyntaxError) return null
    throw error
  }
  if (
    typeof claims !== 'object' || claims === null ||
    !('role' in claims) || (claims.role !== 'josse' && claims.role !== 'admin') ||
    !('expiresAt' in claims) || typeof claims.expiresAt !== 'number' ||
    !Number.isInteger(claims.expiresAt) || claims.expiresAt <= Math.floor(now / 1000) ||
    !equalSecret(signature, sign(payload, claims.role, config))
  ) return null
  return claims.role
}

export function sessionFromCookie(cookie: string | null, config: AuthConfig): AccountRole | null {
  const token = cookie?.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1)
  return token ? verifySession(token, config) : null
}

export function sessionCookie(token: string, secure: boolean): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${token ? SESSION_SECONDS : 0}${secure ? '; Secure' : ''}`
}
