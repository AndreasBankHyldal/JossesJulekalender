export const CALENDAR_YEAR = 2026
export const STORAGE_KEY = `josses-advent:${CALENDAR_YEAR}:v1`

export function getUnlockedDay(now: Date, year = CALENDAR_YEAR): number {
  if (now.getFullYear() < year) return 0
  if (now.getFullYear() > year) return 24
  if (now.getMonth() < 11) return 0
  return Math.min(now.getDate(), 24)
}

export function daysUntilDecember(now: Date, year = CALENDAR_YEAR): number {
  // Compare civil dates, not elapsed hours, so daylight-saving changes don't add a day.
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.ceil((Date.UTC(year, 11, 1) - today) / 86_400_000))
}

function isCalendarDay(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 24
}

export function parseProgress(raw: string | null): number[] {
  if (raw === null) return []
  const value: unknown = JSON.parse(raw)
  if (
    typeof value !== 'object' || value === null ||
    !('version' in value) || value.version !== 1 ||
    !('year' in value) || value.year !== CALENDAR_YEAR ||
    !('openedDays' in value) || !Array.isArray(value.openedDays) ||
    !value.openedDays.every(isCalendarDay)
  ) {
    throw new Error('Ugyldig gemt kalenderstatus')
  }
  return [...new Set<number>(value.openedDays)].sort((a, b) => a - b)
}

export function serializeProgress(openedDays: number[]): string {
  return JSON.stringify({ version: 1, year: CALENDAR_YEAR, openedDays })
}
