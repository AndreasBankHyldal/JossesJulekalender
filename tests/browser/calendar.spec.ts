import { expect, test } from '@playwright/test'
import { CALENDAR_YEAR } from '../../src/lib/calendar'
import { adventDays } from '../../src/data/advent'
import { signIn } from './sign-in'

test('shows 24 date-locked doors and a helpful message before December', async ({ page }) => {
  await page.clock.install({ time: new Date(CALENDAR_YEAR, 9, 27, 12) })
  await page.goto('/')
  await signIn(page, 'josse')
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
  await signIn(page, 'josse')
  await expect(page.locator('.calendar-door[aria-disabled="false"]')).toHaveCount(12)
  const door = page.getByRole('button', { name: '3. december, åbn din overraskelse', exact: true })
  await door.click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Julemandens kane', level: 2 })).toBeVisible()
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
  await signIn(page, 'josse')
  await expect(page.getByText('1 af 24 små glæder', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: '3. december, åbnet, læs igen', exact: true }).click()
  await page.getByRole('button', { name: 'Tilbage til vores december' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`December 1 opens a welcome letter and can be reread with ${reducedMotion} motion`, async ({ page }) => {
    const welcomeLetter = adventDays[0].letter
    if (!welcomeLetter) throw new Error('December 1 must have a welcome letter')
    await page.emulateMedia({ reducedMotion })
    await page.clock.install({ time: new Date(CALENDAR_YEAR, 11, 1, 12) })
    await page.goto('/')
    await signIn(page, 'josse')
    await page.getByRole('button', { name: '1. december, åbn din overraskelse', exact: true }).click()
    const dialog = page.getByRole('dialog')
    const letter = dialog.getByRole('article', { name: 'Dit decemberbrev', includeHidden: true })
    await expect(dialog.getByRole('heading', { name: 'Velkommen til december' })).toBeVisible()
    await expect(letter).toBeHidden()
    const openButton = dialog.getByRole('button', { name: 'Åbn dit brev', exact: true })
    await expect(openButton).toHaveAttribute('aria-expanded', 'false')
    await expect(dialog.getByRole('button', { name: 'Luk og vend tilbage til kalenderen' })).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(openButton).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(letter).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Fold brevet sammen' })).toHaveAttribute('aria-expanded', 'true')
    for (const paragraph of welcomeLetter.paragraphs) {
      await expect(letter.getByText(paragraph, { exact: true })).toBeVisible()
    }
    await page.clock.fastForward(10_000)
    await expect(letter).toHaveCSS('opacity', '1')
    if (reducedMotion === 'reduce') {
      expect(await dialog.locator('.welcome-snow > span').evaluateAll((flakes) =>
        flakes.every((flake) => getComputedStyle(flake).animationName === 'none'),
      )).toBe(true)
      const duration = await dialog.locator('.welcome-envelope-flap').evaluate((flap) =>
        parseFloat(getComputedStyle(flap).transitionDuration),
      )
      expect(duration).toBeLessThan(.001)
    } else {
      await expect(dialog.locator('.welcome-envelope-flap')).toHaveCSS('transition-duration', '0.65s')
    }
    await dialog.getByRole('button', { name: 'Fold brevet sammen' }).click()
    await expect(letter).toBeHidden()
    await openButton.click()
    await expect(letter).toBeVisible()
    await dialog.getByRole('button', { name: 'Tilbage til vores december' }).focus()
    await page.keyboard.press('Tab')
    await expect(dialog.getByRole('button', { name: 'Luk og vend tilbage til kalenderen' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(page.getByRole('button', { name: '1. december, åbnet, læs igen', exact: true })).toBeFocused()
    await page.reload()
    await signIn(page, 'josse')
    await page.getByRole('button', { name: '1. december, åbnet, læs igen', exact: true }).click()
    await expect(letter).toBeHidden()
    await openButton.click()
    await expect(letter).toBeVisible()
    await expect(letter.getByText(welcomeLetter.signature, { exact: true })).toBeVisible()
  })
}

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`December 2 directly reveals a rereadable activity with ${reducedMotion} motion`, async ({ page }) => {
    const day = adventDays[1]
    if (!day.activity) throw new Error('December 2 must have a cozy activity')
    await page.emulateMedia({ reducedMotion })
    await page.clock.install({ time: new Date(CALENDAR_YEAR, 11, 2, 12) })
    await page.goto('/')
    await signIn(page, 'josse')
    await page.getByRole('button', { name: '2. december, åbn din overraskelse', exact: true }).click()
    const dialog = page.getByRole('dialog')
    const activity = dialog.getByRole('region', { name: 'DAGENS AKTIVITET' })
    await expect(dialog.getByRole('heading', { name: 'En hyggelig aften' })).toBeVisible()
    await expect(dialog.locator('#reveal-message')).toHaveText(day.message)
    await expect(activity).toBeVisible()
    await expect(activity).toContainText(day.littleJoy)
    await expect(activity.getByRole('listitem')).toHaveText(day.activity.essentials)
    await expect(activity).toContainText(day.activity.timing)
    await expect(dialog.getByRole('button')).toHaveCount(2)
    await expect(dialog.locator('.little-joy')).toHaveCount(0)
    const initialContent = await activity.innerText()
    await page.clock.fastForward(2_000)
    await expect(dialog.locator('.reveal-letter')).toHaveCSS('opacity', '1')
    const close = dialog.getByRole('button', { name: 'Luk og vend tilbage til kalenderen' })
    const back = dialog.getByRole('button', { name: 'Tilbage til vores december' })
    await expect(close).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(back).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(close).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    const openedDoor = page.getByRole('button', { name: '2. december, åbnet, læs igen', exact: true })
    await expect(openedDoor).toBeFocused()
    await openedDoor.click()
    await expect(activity).toHaveText(initialContent, { useInnerText: true })
    await back.click()
    await page.reload()
    await signIn(page, 'josse')
    await openedDoor.click()
    await expect(activity).toHaveText(initialContent, { useInnerText: true })
  })
}

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`December 5 reveals a Peter Beier hot chocolate invitation by button or scratching with ${reducedMotion} motion`, async ({ page }) => {
    const day = adventDays[4]
    const invitation = day.dateInvitation
    if (!invitation) throw new Error('December 5 must have a date invitation')
    await page.emulateMedia({ reducedMotion })
    await page.clock.install({ time: new Date(CALENDAR_YEAR, 11, 5, 12) })
    await page.goto('/')
    await signIn(page, 'josse')
    await page.getByRole('button', { name: '5. december, åbn din overraskelse', exact: true }).click()
    const dialog = page.getByRole('dialog')
    const card = dialog.getByRole('region', { name: 'DIN INVITATION' })
    const cover = card.locator('canvas.scratch-card-cover')
    const revealButton = card.getByRole('button', { name: 'Vis hele invitationen' })
    await expect(dialog.getByRole('heading', { name: day.title, level: 2 })).toBeVisible()
    await expect(dialog.locator('#reveal-message')).toHaveText(day.message)
    await expect(dialog.locator('.little-joy')).toHaveCount(0)
    await page.clock.fastForward(2_000)
    await expect(dialog.locator('.reveal-letter')).toHaveCSS('opacity', '1')

    // The essential invitation is available to assistive technology before scratching.
    await expect(cover).toHaveAttribute('aria-hidden', 'true')
    await expect(card.getByText(invitation.venue, { exact: true })).toBeVisible()
    await expect(card).toContainText(day.littleJoy)
    await expect(card).toContainText(invitation.choice)
    await expect(card).toContainText(invitation.timing)
    expect(await cover.evaluate((canvas: HTMLCanvasElement) => {
      const context = canvas.getContext('2d')!
      return context.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data[3]
    })).toBe(255)

    const close = dialog.getByRole('button', { name: 'Luk og vend tilbage til kalenderen' })
    const back = dialog.getByRole('button', { name: 'Tilbage til vores december' })
    await expect(close).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(revealButton).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(revealButton).toHaveCount(0)
    await expect(card.locator('.scratch-card-content')).toBeFocused()
    if (reducedMotion === 'reduce') {
      await expect(cover).toHaveCount(0)
    } else {
      await expect(cover).toHaveClass(/is-clearing/)
      await page.clock.fastForward(1_000)
      await expect(cover).toHaveCount(0)
    }
    await expect(card).toContainText('Invitationen er skrabet fri')
    await page.keyboard.press('Tab')
    await expect(back).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(close).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)

    const openedDoor = page.getByRole('button', { name: '5. december, åbnet, læs igen', exact: true })
    await expect(openedDoor).toBeFocused()
    await page.reload()
    await signIn(page, 'josse')
    await openedDoor.click()
    await page.clock.fastForward(2_000)
    await expect(cover).toBeVisible()
    await cover.scrollIntoViewIfNeeded()
    const box = (await cover.boundingBox())!
    for (let y = box.y + 6; y < box.y + box.height; y += 24) {
      await page.mouse.move(box.x + 4, y)
      await page.mouse.down()
      await page.mouse.move(box.x + box.width - 4, y, { steps: 12 })
      await page.mouse.up()
      if (await cover.count() === 0 || await cover.evaluate((canvas) => canvas.classList.contains('is-clearing'))) break
    }
    await page.clock.fastForward(1_000)
    await expect(cover).toHaveCount(0)
    await expect(revealButton).toHaveCount(0)
    await expect(card.getByText(invitation.venue, { exact: true })).toBeVisible()
    await back.click()
    await expect(dialog).toHaveCount(0)
  })
}

test('all 24 doors reveal their own content on Christmas Eve with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.install({ time: new Date(CALENDAR_YEAR, 11, 24, 12) })
  await page.goto('/')
  await signIn(page, 'josse')
  const titles = new Set<string>()
  for (let day = 1; day <= 24; day++) {
    await page.getByRole('button', { name: `${day}. december, åbn din overraskelse`, exact: true }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    titles.add(await dialog.getByRole('heading', { level: 2 }).innerText())
    await expect(dialog.locator('#reveal-message')).not.toBeEmpty()
    await expect(dialog.locator('.little-joy, .activity-card, .date-invitation')).toContainText(adventDays[day - 1].littleJoy)
    await page.keyboard.press('Escape')
  }
  expect(titles.size).toBe(24)
  await expect(page.getByText('24 af 24 små glæder', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('unlocks the next door when the page stays open over midnight', async ({ page }) => {
  await page.clock.install({ time: new Date(CALENDAR_YEAR, 11, 1, 23, 59, 50) })
  await page.goto('/')
  await signIn(page, 'josse')
  await expect(page.locator('.calendar-door[aria-disabled="false"]')).toHaveCount(1)
  await page.getByRole('button', { name: '2. december, låst indtil den 2. december', exact: true }).click({ force: true })
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByText(`Låge 2 åbner den 2. december ${CALENDAR_YEAR}.`)).toBeVisible()
  await page.clock.fastForward(31_000)
  await expect(page.locator('.calendar-door[aria-disabled="false"]')).toHaveCount(2)
  await page.getByRole('button', { name: '2. december, åbn din overraskelse', exact: true }).click()
  await expect(page.getByRole('region', { name: 'DAGENS AKTIVITET' })).toBeVisible()
})

test('the calendar and full-page reveal fit narrow, tablet, and wide screens', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.install({ time: new Date(CALENDAR_YEAR, 11, 24, 12) })
  await page.goto('/')
  await signIn(page, 'josse')
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 768, height: 1024 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    for (const day of [1, 2, 3, 5, 24]) {
      await page.getByRole('button', { name: new RegExp(`^${day}\\. december, `) }).click()
      const dialog = page.getByRole('dialog')
      const box = await dialog.boundingBox()
      expect(box!.width / viewport.width).toBeGreaterThan(.9)
      expect(box!.height / viewport.height).toBeGreaterThan(.85)
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.y).toBeGreaterThanOrEqual(0)
      if (day === 1) {
        await dialog.getByRole('button', { name: 'Åbn dit brev', exact: true }).click()
        const letter = dialog.getByRole('article', { name: 'Dit decemberbrev' })
        await expect(letter).toBeVisible()
        const letterBox = await letter.boundingBox()
        expect(letterBox!.x).toBeGreaterThanOrEqual(box!.x)
        expect(letterBox!.x + letterBox!.width).toBeLessThanOrEqual(box!.x + box!.width)
        expect(await dialog.locator('.reveal-letter').evaluate((content) => content.scrollWidth <= content.clientWidth)).toBe(true)
      }
      if (day === 2) {
        const activity = dialog.getByRole('region', { name: 'DAGENS AKTIVITET' })
        await expect(activity).toBeVisible()
        await activity.scrollIntoViewIfNeeded()
        const activityBox = await activity.boundingBox()
        expect(activityBox!.x).toBeGreaterThanOrEqual(box!.x)
        expect(activityBox!.x + activityBox!.width).toBeLessThanOrEqual(box!.x + box!.width)
        expect(await dialog.locator('.reveal-letter').evaluate((content) => content.scrollWidth <= content.clientWidth)).toBe(true)
      }
      if (day === 5) {
        const invitation = dialog.getByRole('region', { name: 'DIN INVITATION' })
        await expect(invitation).toBeVisible()
        await invitation.scrollIntoViewIfNeeded()
        const invitationBox = await invitation.boundingBox()
        expect(invitationBox!.x).toBeGreaterThanOrEqual(box!.x)
        expect(invitationBox!.x + invitationBox!.width).toBeLessThanOrEqual(box!.x + box!.width)
        const coverBox = await invitation.locator('canvas.scratch-card-cover').boundingBox()
        const contentBox = await invitation.locator('.scratch-card-content').boundingBox()
        expect(coverBox).toEqual(contentBox)
        expect(await dialog.locator('.reveal-letter').evaluate((content) => content.scrollWidth <= content.clientWidth)).toBe(true)
      }
      if (day === 3) {
        const game = dialog.getByRole('region', { name: 'Julemandens kane' })
        await expect(game).toBeVisible()
        const gameBox = await game.boundingBox()
        expect(gameBox!.x).toBeGreaterThanOrEqual(box!.x)
        expect(gameBox!.x + gameBox!.width).toBeLessThanOrEqual(box!.x + box!.width)
        expect(await dialog.locator('.reveal-letter').evaluate((content) => content.scrollWidth <= content.clientWidth)).toBe(true)
        await game.getByRole('button', { name: 'Start turen' }).click()
        const boardBox = await game.getByRole('slider', { name: 'Styr kanen' }).boundingBox()
        expect(boardBox!.width).toBeGreaterThanOrEqual(180)
        for (const control of await game.locator('.sleigh-controls button').all()) {
          const controlBox = await control.boundingBox()
          expect(controlBox!.width).toBeGreaterThanOrEqual(44)
          expect(controlBox!.height).toBeGreaterThanOrEqual(44)
        }
      }
      await dialog.getByRole('button', { name: 'Tilbage til vores december' }).click()
      await expect(dialog).toHaveCount(0)
    }
  }
})

test('shows a real warning when saving is unavailable but still opens the door', async ({ page }) => {
  await page.clock.install({ time: new Date(CALENDAR_YEAR, 11, 1, 12) })
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new DOMException('Storage blocked', 'SecurityError') }
  })
  await page.goto('/')
  await signIn(page, 'josse')
  await page.getByRole('button', { name: '1. december, åbn din overraskelse', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('alert')).toHaveText('Din browser kunne ikke gemme dine åbnede låger. De kan blive nulstillet, når du forlader siden.')
})
