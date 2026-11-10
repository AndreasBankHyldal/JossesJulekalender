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

test('login accepts the cozy activity from the authenticated payload', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => Response.json({ role: 'josse', days: adventDays }))
  const session = await login('test-user', 'test-password')
  assert.ok(session.days[1].activity)
  assert.deepEqual(session.days[1].activity, adventDays[1].activity)
})

test('days without an activity retain the existing session format', async (context) => {
  const days = adventDays.map((day) => ({ ...day, activity: undefined }))
  context.mock.method(globalThis, 'fetch', async () => Response.json({ role: 'admin', days }))
  const session = await login('test-user', 'test-password')
  assert.equal(session.days[1].activity, undefined)
  assert.deepEqual(session.days[0].letter, adventDays[0].letter)
})

test('malformed activities produce an explicit login error', async (context) => {
  let activity: unknown
  context.mock.method(globalThis, 'fetch', async () => Response.json({
    role: 'josse',
    days: adventDays.map((day) => day.day === 2 ? { ...day, activity } : day),
  }))
  for (activity of [
    null,
    {},
    { essentials: 'Not an array', timing: 'Whenever we have time' },
    { essentials: [], timing: 'Whenever we have time' },
    { essentials: [42], timing: 'Whenever we have time' },
    { essentials: [' '], timing: 'Whenever we have time' },
    { essentials: ['Movies'], timing: null },
    { essentials: ['Movies'], timing: ' ' },
  ]) {
    await assert.rejects(login('test-user', 'test-password'), {
      message: 'Kalenderen modtog et uventet svar fra serveren. Prøv at logge ind igen.',
    })
  }
})

test('login accepts the sleigh game while days without it remain compatible', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => Response.json({ role: 'josse', days: adventDays }))
  const session = await login('test-user', 'test-password')
  assert.ok(session.days[2].sleighGame)
  assert.deepEqual(session.days[2].sleighGame, adventDays[2].sleighGame)
  assert.equal(session.days[0].sleighGame, undefined)
  assert.deepEqual(session.days[0].letter, adventDays[0].letter)
  assert.deepEqual(session.days[1].activity, adventDays[1].activity)
})

test('malformed sleigh game content produces an explicit login error', async (context) => {
  let sleighGame: unknown
  context.mock.method(globalThis, 'fetch', async () => Response.json({
    role: 'josse',
    days: adventDays.map((day) => day.day === 3 ? { ...day, sleighGame } : day),
  }))
  for (sleighGame of [
    null,
    {},
    { instructions: 30, resultMessage: 'A personal note' },
    { instructions: ' ', resultMessage: 'A personal note' },
    { instructions: 'Steer the sleigh', resultMessage: null },
    { instructions: 'Steer the sleigh', resultMessage: ' ' },
  ]) {
    await assert.rejects(login('test-user', 'test-password'), {
      message: 'Kalenderen modtog et uventet svar fra serveren. Prøv at logge ind igen.',
    })
  }
})

test('login accepts the hot chocolate invitation while days without it remain compatible', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => Response.json({ role: 'josse', days: adventDays }))
  const session = await login('test-user', 'test-password')
  assert.ok(session.days[4].dateInvitation)
  assert.deepEqual(session.days[4].dateInvitation, adventDays[4].dateInvitation)
  assert.equal(session.days[3].dateInvitation, undefined)
})

test('malformed date invitations produce an explicit login error', async (context) => {
  let dateInvitation: unknown
  context.mock.method(globalThis, 'fetch', async () => Response.json({
    role: 'josse',
    days: adventDays.map((day) => day.day === 5 ? { ...day, dateInvitation } : day),
  }))
  for (dateInvitation of [
    null,
    {},
    { venue: 5, choice: 'Any hot chocolate', timing: 'Whenever suits us' },
    { venue: ' ', choice: 'Any hot chocolate', timing: 'Whenever suits us' },
    { venue: 'Peter Beier', choice: null, timing: 'Whenever suits us' },
    { venue: 'Peter Beier', choice: ' ', timing: 'Whenever suits us' },
    { venue: 'Peter Beier', choice: 'Any hot chocolate', timing: [] },
    { venue: 'Peter Beier', choice: 'Any hot chocolate', timing: ' ' },
  ]) {
    await assert.rejects(login('test-user', 'test-password'), {
      message: 'Kalenderen modtog et uventet svar fra serveren. Prøv at logge ind igen.',
    })
  }
})

test('login accepts the gift surprise while days without it remain compatible', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => Response.json({ role: 'josse', days: adventDays }))
  const session = await login('test-user', 'test-password')
  assert.ok(session.days[6].giftSurprise)
  assert.deepEqual(session.days[6].giftSurprise, adventDays[6].giftSurprise)
  assert.equal(session.days[0].giftSurprise, undefined)
})

test('malformed gift surprises produce an explicit login error', async (context) => {
  let giftSurprise: unknown
  const valid = adventDays[6].giftSurprise
  assert.ok(valid)
  context.mock.method(globalThis, 'fetch', async () => Response.json({
    role: 'josse',
    days: adventDays.map((day) => day.day === 7 ? { ...day, giftSurprise } : day),
  }))
  for (giftSurprise of [
    null,
    {},
    { ...valid, hints: 'Not an array' },
    { ...valid, hints: [] },
    { ...valid, hints: ['First', 'Second'] },
    { ...valid, hints: ['First', 'Second', 'Third', 'Fourth'] },
    { ...valid, hints: ['First', 2, 'Third'] },
    { ...valid, hints: ['First', ' ', 'Third'] },
    { ...valid, revealTitle: null },
    { ...valid, revealTitle: ' ' },
    { ...valid, revealMessage: 7 },
    { ...valid, revealMessage: ' ' },
  ]) {
    await assert.rejects(login('test-user', 'test-password'), {
      message: 'Kalenderen modtog et uventet svar fra serveren. Prøv at logge ind igen.',
    })
  }
})
