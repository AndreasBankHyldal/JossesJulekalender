import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { CALENDAR_YEAR } from '../../src/lib/calendar'
import { formatDuration, mergeBests } from '../../src/lib/sleigh-game'
import type { RunResult } from '../../src/lib/sleigh-game'
import { signIn } from './sign-in'

async function openGame(page: Page, role: 'josse' | 'admin' = 'josse', reducedMotion: 'reduce' | 'no-preference' = 'reduce') {
  await page.emulateMedia({ reducedMotion })
  await page.clock.install({ time: new Date(CALENDAR_YEAR, 11, 3, 12) })
  await page.addInitScript(() => { Math.random = () => 0 })
  await page.goto('/')
  await signIn(page, role)
  await page.getByRole('button', { name: '3. december, åbn din overraskelse', exact: true }).click()
  const game = page.getByRole('region', { name: 'Julemandens kane', exact: true })
  await expect(game).toBeVisible()
  await expect(game.locator('.sleigh-player-record, .sleigh-records [role="alert"]').first()).toBeVisible()
  await page.clock.pauseAt(new Date(CALENDAR_YEAR, 11, 3, 13))
  return game
}

async function crash(page: Page, game: Locator) {
  await page.keyboard.down('ArrowLeft')
  await page.clock.runFor(800)
  await page.keyboard.up('ArrowLeft')
  await page.clock.runFor(12_000)
  await expect(game.getByRole('button', { name: 'Spil igen' })).toBeVisible()
}

test('waits for start, collects presents, keeps two hearts, and continues beyond 30 seconds with rising speed', async ({ page }) => {
  const game = await openGame(page)
  await expect(game.getByRole('status', { name: 'Gaver', exact: true })).toHaveText('Gaver0')
  await expect(game.getByRole('timer')).toHaveText('Tid0:00,0')
  await expect(game.getByRole('status', { name: 'Liv: 2 af 2' })).toBeVisible()
  await page.clock.runFor(40_000)
  await expect(game.getByRole('timer')).toHaveText('Tid0:00,0')
  await game.getByRole('button', { name: 'Start turen' }).focus()
  await page.keyboard.press('Enter')
  await expect(game.getByRole('slider', { name: 'Styr kanen' })).toBeFocused()
  await page.clock.runFor(6_000)
  const collected = Number(await game.getByRole('status', { name: 'Gaver', exact: true }).locator('strong').innerText())
  expect(collected).toBeGreaterThan(0)
  await page.clock.runFor(25_200)
  await expect(game.getByRole('timer')).toContainText('0:31')
  await expect(game.getByRole('status', { name: 'Liv: 2 af 2' })).toBeVisible()
  await expect(game.getByRole('button', { name: 'Spil igen' })).toHaveCount(0)
  await expect(game.getByText('Fart 2,6×', { exact: true })).toBeVisible()
})

test('two collisions end the run, save both metrics, and allow a fresh replay', async ({ page }) => {
  const game = await openGame(page)
  await game.getByRole('button', { name: 'Start turen' }).click()
  await page.keyboard.down('ArrowLeft')
  await page.clock.runFor(3_200)
  await page.keyboard.up('ArrowLeft')
  await expect(game.getByRole('status', { name: 'Liv: 1 af 2' })).toBeVisible()
  await expect(game.getByRole('button', { name: 'Spil igen' })).toHaveCount(0)
  await page.clock.runFor(10_000)
  await expect(game.getByRole('status', { name: 'Liv: 0 af 2' })).toBeVisible()
  await expect(game.getByText('Dine rekorder er gemt.', { exact: true })).toBeVisible()
  const endedTime = await game.getByRole('timer').locator('strong').innerText()
  await page.clock.runFor(5_000)
  await expect(game.getByRole('timer').locator('strong')).toHaveText(endedTime)
  await game.getByRole('button', { name: 'Spil igen' }).click()
  await expect(game.getByRole('status', { name: 'Liv: 2 af 2' })).toBeVisible()
  await expect(game.getByRole('status', { name: 'Gaver', exact: true })).toHaveText('Gaver0')
  await expect(game.getByRole('timer')).toHaveText('Tid0:00,0')
})

test('dragging on the canvas steers continuously with touch and mouse', async ({ page }, testInfo) => {
  const game = await openGame(page)
  await game.getByRole('button', { name: 'Start turen' }).click()
  const canvas = game.getByRole('slider', { name: 'Styr kanen' })
  const bounds = await canvas.boundingBox()
  if (!bounds) throw new Error('The playing field must be visible')
  const y = bounds.y + bounds.height * .65
  const right = bounds.x + bounds.width * .9
  const left = bounds.x + bounds.width * .1
  if (testInfo.project.name === 'mobile') {
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: right, y, id: 1 }] })
    await page.clock.runFor(400)
    expect(Number(await canvas.getAttribute('aria-valuenow'))).toBeGreaterThan(250)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: left, y, id: 1 }] })
    await page.clock.runFor(600)
    expect(Number(await canvas.getAttribute('aria-valuenow'))).toBeLessThan(110)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await cdp.detach()
  } else {
    await page.mouse.move(right, y)
    await page.mouse.down()
    await page.clock.runFor(400)
    expect(Number(await canvas.getAttribute('aria-valuenow'))).toBeGreaterThan(250)
    await page.mouse.move(left, y, { steps: 4 })
    await page.clock.runFor(600)
    expect(Number(await canvas.getAttribute('aria-valuenow'))).toBeLessThan(110)
    await page.mouse.up()
  }
  await expect(canvas).toHaveCSS('touch-action', 'none')
})

test('pause and tab blur freeze the road and active survival time until explicitly resumed', async ({ page }) => {
  const game = await openGame(page)
  await game.getByRole('button', { name: 'Start turen' }).click()
  await page.clock.runFor(1000)
  await game.getByRole('button', { name: 'Pause', exact: true }).click()
  const pausedTime = await game.getByRole('timer').locator('strong').innerText()
  await page.clock.runFor(60_000)
  await expect(game.getByRole('timer').locator('strong')).toHaveText(pausedTime)
  await game.getByRole('button', { name: 'Fortsæt turen' }).click()
  await page.clock.runFor(500)
  await expect(game.getByRole('timer').locator('strong')).not.toHaveText(pausedTime)
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))
  await expect(game.getByRole('button', { name: 'Fortsæt turen' })).toBeVisible()
  const blurredTime = await game.getByRole('timer').locator('strong').innerText()
  await page.clock.runFor(60_000)
  await expect(game.getByRole('timer').locator('strong')).toHaveText(blurredTime)
})

test('admin gifts and survival records appear for Josse in another context and survive lower replays', async ({ page, browser }) => {
  const game = await openGame(page, 'admin')
  await game.getByRole('button', { name: 'Start turen' }).click()
  await page.clock.runFor(6_000)
  await crash(page, game)
  await expect(game.getByText('Dine rekorder er gemt.', { exact: true })).toBeVisible()
  const saved = await (await page.request.get('/api?resource=sleigh-game')).json()
  expect(saved.admin.presents).toBeGreaterThan(0)
  expect(saved.admin.durationMs).toBeGreaterThan(6_000)
  const context = await browser.newContext()
  try {
    const jossePage = await context.newPage()
    const josseGame = await openGame(jossePage)
    await expect(josseGame.locator('.sleigh-player-record').filter({ hasText: "Andreas' rekorder" }).locator('dd'))
      .toHaveText([String(saved.admin.presents), formatDuration(saved.admin.durationMs)])
    await page.bringToFront()
    await game.getByRole('button', { name: 'Spil igen' }).click()
    await crash(page, game)
    await expect(game.getByText('Dine rekorder er gemt.', { exact: true })).toBeVisible()
    const later = await (await page.request.get('/api?resource=sleigh-game')).json()
    expect(later.admin.presents).toBeGreaterThanOrEqual(saved.admin.presents)
    expect(later.admin.durationMs).toBeGreaterThanOrEqual(saved.admin.durationMs)
    await page.reload()
    await signIn(page, 'admin')
    await page.getByRole('button', { name: '3. december, åbnet, læs igen', exact: true }).click()
    await expect(page.locator('.sleigh-player-record').filter({ hasText: 'Dine rekorder' }).locator('dd'))
      .toHaveText([String(later.admin.presents), formatDuration(later.admin.durationMs)])
  } finally {
    await context.close()
  }
})

test('failed loads and saves are explicit and retry both metrics without losing the run', async ({ page }) => {
  let failLoad = true
  let failSave = true
  const posted: RunResult[] = []
  await page.route('**/api?resource=sleigh-game', async (route) => {
    const post = route.request().method() === 'POST'
    if (post) posted.push(route.request().postDataJSON())
    if (post ? failSave : failLoad) await route.fulfill({ status: 503, json: { error: 'Test unavailable' } })
    else await route.continue()
  })
  const game = await openGame(page)
  await expect(game.getByRole('alert')).toContainText('Rekorderne kunne ikke hentes')
  failLoad = false
  await game.getByRole('button', { name: 'Hent rekorder igen' }).click()
  await expect(game.locator('.sleigh-player-record')).toHaveCount(2)
  await game.getByRole('button', { name: 'Start turen' }).click()
  await crash(page, game)
  await expect(game.getByRole('alert')).toContainText('Dit resultat er ikke gemt')
  failSave = false
  await game.getByRole('button', { name: 'Prøv at gemme igen' }).click()
  await expect(game.getByText('Dine rekorder er gemt.', { exact: true })).toBeVisible()
  expect(posted.length).toBe(2)
  expect(posted[0]).toEqual(posted[1])
  expect(posted[0].durationMs).toBeGreaterThan(0)
})

test('a better replay queues behind an unfinished save and retains both independent bests', async ({ page }) => {
  let releaseFirst: () => void = () => {}
  const firstSave = new Promise<void>((resolve) => { releaseFirst = resolve })
  const posted: RunResult[] = []
  let ownBest: RunResult | null = null
  await page.route('**/api?resource=sleigh-game', async (route) => {
    if (route.request().method() === 'POST') {
      const score: RunResult = route.request().postDataJSON()
      posted.push(score)
      if (posted.length === 1) await firstSave
      ownBest = mergeBests(ownBest, score)
    }
    await route.fulfill({ json: { admin: { presents: 4, durationMs: 20_000 }, josse: ownBest, storage: 'shared' } })
  })
  const game = await openGame(page)
  await game.getByRole('button', { name: 'Start turen' }).click()
  await crash(page, game)
  await expect.poll(() => posted.length).toBe(1)
  await game.getByRole('button', { name: 'Spil igen' }).click()
  await page.clock.runFor(6_000)
  await crash(page, game)
  releaseFirst()
  await expect(game.getByText('Dine rekorder er gemt.', { exact: true })).toBeVisible()
  expect(posted.length).toBe(2)
  expect(posted[1].presents).toBeGreaterThan(posted[0].presents)
  expect(posted[1].durationMs).toBeGreaterThan(posted[0].durationMs)
  await expect(game.locator('.sleigh-player-record').filter({ hasText: 'Dine rekorder' }).locator('dd'))
    .toHaveText([String(posted[1].presents), formatDuration(posted[1].durationMs)])
})

test('closing an active run cancels it without submitting and reopening is fresh', async ({ page }) => {
  const errors: string[] = []
  const posted: unknown[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    if (request.url().includes('resource=sleigh-game') && request.method() === 'POST') posted.push(request.postDataJSON())
  })
  const game = await openGame(page)
  await game.getByRole('button', { name: 'Start turen' }).click()
  await page.clock.runFor(1000)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const door = page.getByRole('button', { name: '3. december, åbnet, læs igen', exact: true })
  await expect(door).toBeFocused()
  await page.clock.runFor(60_000)
  await door.click()
  await expect(game.getByRole('button', { name: 'Start turen' })).toBeVisible()
  await expect(game.getByRole('timer')).toHaveText('Tid0:00,0')
  await expect(game.getByRole('status', { name: 'Liv: 2 af 2' })).toBeVisible()
  expect(posted).toEqual([])
  expect(errors).toEqual([])
})

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`steering and collision rules work with ${reducedMotion} motion`, async ({ page }) => {
    const game = await openGame(page, 'josse', reducedMotion)
    await game.getByRole('button', { name: 'Start turen' }).click()
    await page.keyboard.down('d')
    await page.clock.runFor(400)
    await page.keyboard.up('d')
    expect(Number(await game.getByRole('slider', { name: 'Styr kanen' }).getAttribute('aria-valuenow'))).toBeGreaterThan(250)
    await crash(page, game)
    await expect(game.getByRole('status', { name: 'Liv: 0 af 2' })).toBeVisible()
  })
}
