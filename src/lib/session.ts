import type { AdventDay, AdventLetter } from '../data/advent'
import type { CalendarSession } from '../types/session'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isLetter(value: unknown): value is AdventLetter {
  return isRecord(value) &&
    typeof value.greeting === 'string' && value.greeting.trim().length > 0 &&
    Array.isArray(value.paragraphs) && value.paragraphs.length > 0 &&
    value.paragraphs.every((paragraph) => typeof paragraph === 'string' && paragraph.trim().length > 0) &&
    typeof value.signature === 'string' && value.signature.trim().length > 0
}

function isDay(value: unknown): value is AdventDay {
  return isRecord(value) &&
    typeof value.day === 'number' && Number.isInteger(value.day) && value.day >= 1 && value.day <= 24 &&
    typeof value.title === 'string' && typeof value.message === 'string' && typeof value.littleJoy === 'string' &&
    typeof value.theme === 'string' && ['cranberry', 'pine', 'cream', 'olive'].includes(value.theme) &&
    typeof value.pattern === 'string' && ['stars', 'stripes', 'snow', 'plain'].includes(value.pattern) &&
    typeof value.art === 'string' && ['bow', 'star', 'tree', 'heart', 'ornament', 'snowflake', 'gift', 'sprig'].includes(value.art) &&
    (value.letter === undefined || isLetter(value.letter))
}

function parseSession(value: unknown): CalendarSession {
  if (
    !isRecord(value) || (value.role !== 'josse' && value.role !== 'admin') ||
    !Array.isArray(value.days) || value.days.length !== 24 || !value.days.every(isDay) ||
    new Set(value.days.map((day) => day.day)).size !== 24
  ) throw new Error('Kalenderen modtog et uventet svar fra serveren. Prøv at logge ind igen.')
  return { role: value.role, days: value.days }
}

async function requestApi(method: 'POST' | 'DELETE', body?: { username: string; password: string }): Promise<unknown> {
  let response: Response
  try {
    response = await fetch('/api', {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    })
  } catch (error) {
    console.error('Kunne ikke kontakte loginserveren:', error)
    throw new Error('Kunne ikke kontakte loginserveren. Kontroller forbindelsen, og prøv igen.')
  }
  let data: unknown
  try {
    data = await response.json()
  } catch (error) {
    console.error('Loginserveren sendte et uventet svar:', error)
    throw new Error('Loginserveren kunne ikke svare korrekt. Prøv igen om lidt.')
  }
  if (!response.ok) {
    throw new Error(isRecord(data) && typeof data.error === 'string'
      ? data.error
      : 'Der opstod en fejl. Prøv igen om lidt.')
  }
  return data
}

export async function login(username: string, password: string): Promise<CalendarSession> {
  return parseSession(await requestApi('POST', { username, password }))
}

export async function logout(): Promise<void> {
  await requestApi('DELETE')
}
