import assert from 'node:assert/strict'
import { test } from 'node:test'
import { adventDays } from '../src/data/advent.ts'
import { login } from '../src/lib/session.ts'

test('login accepts the complete welcome letter from the authenticated payload', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => Response.json({ role: 'josse', days: adventDays }))
  const session = await login('test-user', 'test-password')
  assert.ok(session.days[0].letter)
  assert.deepEqual(session.days[0].letter, adventDays[0].letter)
})

test('days without a letter retain the existing session format', async (context) => {
  const days = adventDays.map((day) => ({ ...day, letter: undefined }))
  context.mock.method(globalThis, 'fetch', async () => Response.json({ role: 'admin', days }))
  const session = await login('test-user', 'test-password')
  assert.equal(session.days[0].letter, undefined)
  assert.equal(session.days.length, 24)
})

test('malformed welcome letters produce an explicit login error', async (context) => {
  let letter: unknown
  context.mock.method(globalThis, 'fetch', async () => Response.json({
    role: 'josse',
    days: adventDays.map((day) => day.day === 1 ? { ...day, letter } : day),
  }))
  for (letter of [
    null,
    {},
    { greeting: 'Hello', paragraphs: 'Not an array', signature: 'Love' },
    { greeting: 'Hello', paragraphs: [], signature: 'Love' },
    { greeting: 'Hello', paragraphs: [42], signature: 'Love' },
    { greeting: 'Hello', paragraphs: [' '], signature: 'Love' },
    { greeting: ' ', paragraphs: ['A letter'], signature: 'Love' },
    { greeting: 'Hello', paragraphs: ['A letter'], signature: null },
    { greeting: 'Hello', paragraphs: ['A letter'], signature: ' ' },
  ]) {
    await assert.rejects(login('test-user', 'test-password'), {
      message: 'Kalenderen modtog et uventet svar fra serveren. Prøv at logge ind igen.',
    })
  }
})
