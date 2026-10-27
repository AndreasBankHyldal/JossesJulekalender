import type { AdventDay } from '../data/advent.ts'

export type AccountRole = 'josse' | 'admin'

export type CalendarSession = {
  role: AccountRole
  days: AdventDay[]
}
