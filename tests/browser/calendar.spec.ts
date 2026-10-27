import { expect, test } from '@playwright/test'
import { CALENDAR_YEAR } from '../../src/lib/calendar'

test('shows 24 date-locked doors and a helpful message before December', async ({ page }) => {
  await page.clock.install({ time: new Date(CALENDAR_YEAR, 9, 27, 12) })
  await page.goto('/')
  await expect(page.getByRole('button', { name: /^\d+\. december, / })).toHaveCount(24)
  await expect(page.locator('.calendar-door[aria-disabled="true"]')).toHaveCount(24)
  await expect(page.getByText('35 nætter til den første lille overraskelse')).toBeVisible()
  await page.getByRole('button', { name: '1. december, låst indtil den 1. december', exact: true }).click({ force: true })
  await expect(page.getByText(`Låge 1 åbner den 1. december ${CALENDAR_YEAR}.`)).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('opens into an almost-full-page reveal, traps focus, dismisses, and remembers progress', async ({ page }) => {
  await page.clock.install({ time: new Date(CALENDAR_YEAR, 11, 12, 12) })
  await page.goto('/')
  await expect(page.locator('.calendar-door[aria-disabled="false"]')).toHaveCount(12)
  const door = page.getByRole('button', { name: '3. december, åbn din overraskelse', exact: true })
  await door.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Du lyser min verden op' })).toBeVisible()
  const box = await dialog.boundingBox()
  const viewport = page.viewportSize()!
  expect(box!.width / viewport.width).toBeGreaterThan(.8)
  expect(box!.height / viewport.height).toBeGreaterThan(.8)
  await expect(page.getByRole('button', { name: 'Luk og vend tilbage til kalenderen' })).toBeFocused()
  const zoom = await page.locator('.reveal-panel').evaluate((panel) => {
    const animation = panel.getAnimations()[0]
    return {
      duration: animation?.effect?.getTiming().duration,
      firstTransform: animation?.effect?.getKeyframes()[0].transform,
    }
  })
  expect(zoom.duration).toBe(720)
  expect(zoom.firstTransform).toContain('scale(')
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('button', { name: 'Tilbage til vores december' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Luk og vend tilbage til kalenderen' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('button', { name: '3. december, åbnet, læs igen', exact: true })).toBeFocused()
  await page.reload()
  await expect(page.getByText('1 af 24 små glæder', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '3. december, åbnet, læs igen', exact: true }).click()
  await page.getByRole('button', { name: 'Tilbage til vores december' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('all 24 doors reveal their own content on Christmas Eve with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.install({ time: new Date(CALENDAR_YEAR, 11, 24, 12) })
  await page.goto('/')
  const titles = new Set<string>()
  for (let day = 1; day <= 24; day++) {
    await page.getByRole('button', { name: `${day}. december, åbn din overraskelse`, exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    titles.add(await dialog.getByRole('heading').innerText())
    await expect(dialog.locator('#reveal-message')).not.toBeEmpty()
    await expect(dialog.locator('.little-joy > p:last-child')).not.toBeEmpty()
    await page.keyboard.press('Escape')
  }
  expect(titles.size).toBe(24)
  await expect(page.getByText('24 af 24 små glæder', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('unlocks the next door when the page stays open over midnight', async ({ page }) => {
  await page.clock.install({ time: new Date(CALENDAR_YEAR, 11, 1, 23, 59, 50) })
  await page.goto('/')
  await expect(page.locator('.calendar-door[aria-disabled="false"]')).toHaveCount(1)
  await page.clock.fastForward(31_000)
  await expect(page.locator('.calendar-door[aria-disabled="false"]')).toHaveCount(2)
})

test('the calendar and full-page reveal fit narrow, tablet, and wide screens', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.install({ time: new Date(CALENDAR_YEAR, 11, 24, 12) })
  await page.goto('/')
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 768, height: 1024 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await page.getByRole('button', { name: /^24\. december, / }).click()
    const dialog = page.getByRole('dialog')
    const box = await dialog.boundingBox()
    expect(box!.width / viewport.width).toBeGreaterThan(.9)
    expect(box!.height / viewport.height).toBeGreaterThan(.85)
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.y).toBeGreaterThanOrEqual(0)
    await dialog.getByRole('button', { name: 'Tilbage til vores december' }).click()
    await expect(dialog).toHaveCount(0)
  }
})

test('shows a real warning when saving is unavailable but still opens the door', async ({ page }) => {
  await page.clock.install({ time: new Date(CALENDAR_YEAR, 11, 1, 12) })
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage blocked', 'SecurityError') }
  })
  await page.goto('/')
  await page.getByRole('button', { name: '1. december, åbn din overraskelse', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('alert')).toHaveText('Din browser kunne ikke gemme dine åbnede låger. De kan blive nulstillet, når du forlader siden.')
})
