import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  CALENDAR_YEAR,
  daysUntilDecember,
  getUnlockedDay,
  getAvailableDay,
  getProgressKey,
  parseProgress,
  serializeProgress,
  STORAGE_KEY,
} from '../src/lib/calendar.ts'
import { adventDays } from '../src/data/advent.ts'

test('all 24 days have unique numbers and complete starter content', () => {
  assert.deepEqual(adventDays.map(({ day }) => day), Array.from({ length: 24 }, (_, i) => i + 1))
  for (const day of adventDays) {
    assert.ok(day.title && day.message && day.littleJoy && day.theme && day.art && day.pattern)
  }
})

test('doors are locked before December of the configured year', () => {
  assert.equal(getUnlockedDay(new Date(CALENDAR_YEAR - 1, 11, 24)), 0)
  assert.equal(getUnlockedDay(new Date(CALENDAR_YEAR, 9, 27)), 0)
  assert.equal(getUnlockedDay(new Date(CALENDAR_YEAR, 10, 30, 23, 59, 59)), 0)
})

test('admin can open every door regardless of the date while Josse keeps date locks', () => {
  const beforeDecember = new Date(CALENDAR_YEAR, 9, 27)
  const duringDecember = new Date(CALENDAR_YEAR, 11, 12)
  assert.equal(getAvailableDay(beforeDecember, 'admin'), 24)
  assert.equal(getAvailableDay(beforeDecember, 'josse'), 0)
  assert.equal(getAvailableDay(duringDecember, 'admin'), 24)
  assert.equal(getAvailableDay(duringDecember, 'josse'), 12)
})

test('admin testing has separate progress and Josse retains her existing saved doors', () => {
  assert.equal(getProgressKey('josse'), STORAGE_KEY)
  assert.notEqual(getProgressKey('admin'), getProgressKey('josse'))
})

test('each door unlocks at local midnight and earlier doors stay openable', () => {
  for (let day = 1; day <= 24; day++) {
    assert.equal(getUnlockedDay(new Date(CALENDAR_YEAR, 11, day, 0, 0, 0)), day)
    assert.equal(getUnlockedDay(new Date(CALENDAR_YEAR, 11, day, 23, 59, 59)), day)
  }
})

test('all doors stay available after Christmas and in following years', () => {
  assert.equal(getUnlockedDay(new Date(CALENDAR_YEAR, 11, 25)), 24)
  assert.equal(getUnlockedDay(new Date(CALENDAR_YEAR + 1, 0, 1)), 24)
})

test('countdown uses calendar dates rather than DST-sensitive elapsed hours', () => {
  assert.equal(daysUntilDecember(new Date(CALENDAR_YEAR, 9, 27, 23, 59)), 35)
  assert.equal(daysUntilDecember(new Date(CALENDAR_YEAR, 10, 30, 0, 1)), 1)
  assert.equal(daysUntilDecember(new Date(CALENDAR_YEAR, 11, 1)), 0)
  assert.equal(daysUntilDecember(new Date(CALENDAR_YEAR + 1, 0, 1)), 0)
})

test('progress round-trips, deduplicates, and sorts', () => {
  assert.deepEqual(parseProgress(null), [])
  assert.deepEqual(parseProgress(serializeProgress([24, 3, 1, 3])), [1, 3, 24])
})

test('corrupt, outdated, and out-of-range progress is explicitly rejected', () => {
  const invalid = [
    '{broken', 'null', '[]',
    JSON.stringify({ version: 2, year: CALENDAR_YEAR, openedDays: [1] }),
    JSON.stringify({ version: 1, year: CALENDAR_YEAR - 1, openedDays: [1] }),
    serializeProgress([0]), serializeProgress([25]), serializeProgress([1.5]),
    JSON.stringify({ version: 1, year: CALENDAR_YEAR, openedDays: ['1'] }),
  ]
  for (const raw of invalid) assert.throws(() => parseProgress(raw))
})
