import { readFileSync, readdirSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { CALENDAR_YEAR } from '../../src/lib/calendar'
import { testAuthEnv } from '../fixtures/auth'
import { signIn } from './sign-in'

test('anonymous visitors see only login and cannot fetch private notes', async ({ page, request }) => {
  await page.goto('/')
  await expect(page.getByLabel('Brugernavn', { exact: true })).toBeVisible()
  await expect(page.locator('.calendar-door')).toHaveCount(0)
  const response = await request.get('/api')
  expect(response.status()).toBe(401)
  expect(await response.text()).not.toContain('Det bedste ved december')
  const scripts = readdirSync('dist/assets').filter((name) => name.endsWith('.js'))
    .map((name) => readFileSync(`dist/assets/${name}`, 'utf8')).join('\n')
  for (const privateText of ['Det bedste ved december', ...Object.values(testAuthEnv)]) {
    expect(scripts).not.toContain(privateText)
  }
  for (const secretFile of ['/.env', '/server/auth.ts', '/src/data/advent.ts']) {
    const source = await request.get(secretFile)
    expect(await source.text()).not.toContain(testAuthEnv.SESSION_SECRET)
    expect(await source.text()).not.toContain('Det bedste ved december')
  }
})

test('wrong credentials show a Danish error without exposing the calendar', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Brugernavn', { exact: true }).fill('unknown-user')
  await page.getByLabel('Adgangskode', { exact: true }).fill('wrong-password')
  await page.getByRole('button', { name: 'Åbn vores december' }).click()
  await expect(page.getByRole('alert')).toHaveText('Forkert brugernavn eller adgangskode. Prøv igen.')
  await expect(page.locator('.calendar-door')).toHaveCount(0)
})

for (const role of ['josse', 'admin'] as const) {
  test(`a saved ${role} session still starts at login on a fresh page`, async ({ page, context }) => {
    const response = await page.request.post('/api', {
      data: {
        username: role === 'admin' ? testAuthEnv.ADMIN_USERNAME : testAuthEnv.JOSSE_USERNAME,
        password: role === 'admin' ? testAuthEnv.ADMIN_PASSWORD : testAuthEnv.JOSSE_PASSWORD,
      },
    })
    expect(response.ok()).toBe(true)
    const apiRequests: string[] = []
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api') apiRequests.push(request.method())
    })

    await page.goto('/')
    await expect(page.getByLabel('Brugernavn', { exact: true })).toBeVisible()
    await expect(page.locator('.calendar-door')).toHaveCount(0)
    expect(apiRequests).toEqual([])
    await signIn(page, role)

    const newTab = await context.newPage()
    await newTab.goto('/')
    await expect(newTab.getByLabel('Brugernavn', { exact: true })).toBeVisible()
    await expect(newTab.locator('.calendar-door')).toHaveCount(0)
    await newTab.close()

    await page.reload()
    await expect(page.getByLabel('Brugernavn', { exact: true })).toBeVisible()
    await expect(page.locator('.calendar-door')).toHaveCount(0)
    await signIn(page, role)
  })
}

test('admin can open all 24 doors before December and progress survives logging in again', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.install({ time: new Date(CALENDAR_YEAR, 9, 27, 12) })
  await page.goto('/')
  await signIn(page, 'admin')
  await expect(page.getByText('Testadgang · Alle 24 låger kan åbnes')).toBeVisible()
  await expect(page.locator('.calendar-door[aria-disabled="false"]')).toHaveCount(24)
  for (let day = 1; day <= 24; day++) {
    await page.getByRole('button', { name: `${day}. december, åbn din overraskelse`, exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
  }
  await page.reload()
  await signIn(page, 'admin')
  await expect(page.getByText('24 af 24 små glæder', { exact: true })).toBeVisible()
})

test('logout hides the calendar and admin progress does not affect Josse', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.install({ time: new Date(CALENDAR_YEAR, 11, 1, 12) })
  await page.goto('/')
  await signIn(page, 'admin')
  await page.getByRole('button', { name: '24. december, åbn din overraskelse', exact: true }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByText('1 af 24 små glæder', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Log ud', exact: true }).click()
  await expect(page.getByLabel('Brugernavn', { exact: true })).toBeVisible()
  expect((await page.request.get('/api')).status()).toBe(401)
  await page.reload()
  await signIn(page, 'josse')
  await expect(page.locator('.calendar-door[aria-disabled="false"]')).toHaveCount(1)
  await expect(page.getByText('0 af 24 små glæder', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '24. december, låst indtil den 24. december', exact: true }).click({ force: true })
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByText(`Låge 24 åbner den 24. december ${CALENDAR_YEAR}.`)).toBeVisible()
})

test('network failures are explicit and a later login can succeed', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByLabel('Brugernavn', { exact: true })).toBeVisible()
  await page.route('**/api', (route) => route.abort())
  await page.getByLabel('Brugernavn', { exact: true }).fill(testAuthEnv.ADMIN_USERNAME)
  await page.getByLabel('Adgangskode', { exact: true }).fill(testAuthEnv.ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Åbn vores december' }).click()
  await expect(page.getByRole('alert')).toHaveText('Kunne ikke kontakte loginserveren. Kontroller forbindelsen, og prøv igen.')
  await page.unroute('**/api')
  await signIn(page, 'admin')
})
