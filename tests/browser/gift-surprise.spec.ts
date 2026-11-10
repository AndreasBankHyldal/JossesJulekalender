import { expect, test } from '@playwright/test'
import { adventDays } from '../../src/data/advent'
import { CALENDAR_YEAR } from '../../src/lib/calendar'
import { signIn } from './sign-in'

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`December 7 reveals three ordered hints before the gift with ${reducedMotion} motion`, async ({ page }) => {
    const day = adventDays[6]
    const surprise = day.giftSurprise
    if (!surprise) throw new Error('December 7 must have a gift surprise')
    await page.emulateMedia({ reducedMotion })
    await page.clock.install({ time: new Date(CALENDAR_YEAR, 11, 7, 12) })
    await page.goto('/')
    await signIn(page, 'josse')
    await page.getByRole('button', { name: '7. december, åbn din overraskelse', exact: true }).click()
    const dialog = page.getByRole('dialog')
    const card = dialog.getByRole('region', { name: 'EN LILLE HEMMELIGHED' })
    const hints = card.getByRole('listitem')
    const close = dialog.getByRole('button', { name: 'Luk og vend tilbage til kalenderen' })
    const back = dialog.getByRole('button', { name: 'Tilbage til vores december' })
    await page.clock.fastForward(2_000)
    await expect(dialog.getByRole('heading', { name: day.title, level: 2 })).toBeVisible()
    await expect(dialog.locator('#reveal-message')).toHaveText(day.message)
    await expect(dialog.locator('.little-joy')).toHaveCount(0)
    await expect(card).toContainText('0 af 3 hints åbnet')
    await expect(hints).toHaveCount(0)
    await expect(card.getByText(surprise.revealTitle, { exact: true })).toHaveCount(0)
    await expect(card.getByText(surprise.revealMessage, { exact: true })).toHaveCount(0)
    await expect(card.getByText(day.littleJoy, { exact: true })).toHaveCount(0)
    for (const hint of surprise.hints) await expect(card.getByText(hint, { exact: true })).toHaveCount(0)

    await expect(close).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(back).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(close).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(card.getByRole('button', { name: 'Åbn første hint' })).toBeFocused()

    for (let count = 1; count <= 3; count++) {
      await page.keyboard.press(count === 2 ? 'Space' : 'Enter')
      await expect(card).toContainText(`${count} af 3 hints åbnet`)
      await expect(hints).toHaveCount(count)
      for (let index = 0; index < surprise.hints.length; index++) {
        const hint = card.getByText(surprise.hints[index], { exact: true })
        if (index < count) await expect(hint).toHaveCount(1)
        else await expect(hint).toHaveCount(0)
      }
      if (count < 3) {
        await expect(card.getByRole('button', { name: 'Åbn næste hint' })).toBeFocused()
        await expect(card.locator('.gift-surprise-reveal')).toHaveCount(0)
        await expect(card).not.toContainText(surprise.revealTitle)
        await expect(card).not.toContainText(surprise.revealMessage)
        await page.clock.fastForward(60_000)
        await expect(hints).toHaveCount(count)
      }
    }

    const reveal = card.getByRole('group', { name: surprise.revealTitle })
    await expect(reveal).toBeFocused()
    await expect(reveal).toBeInViewport()
    await expect(reveal.getByRole('heading', { name: surprise.revealTitle })).toBeVisible()
    await expect(reveal).toContainText(surprise.revealMessage)
    await expect(reveal).toContainText(day.littleJoy)
    await expect(card.getByRole('button')).toHaveCount(0)
    expect(await card.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    expect(await dialog.locator('.reveal-letter').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
    await page.keyboard.press('Tab')
    await expect(back).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(close).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    const openedDoor = page.getByRole('button', { name: '7. december, åbnet, læs igen', exact: true })
    await expect(openedDoor).toBeFocused()
    await openedDoor.click()
    await expect(hints).toHaveCount(0)
    await expect(card.locator('.gift-surprise-reveal')).toHaveCount(0)
    await card.getByRole('button', { name: 'Åbn første hint' }).click()
    await expect(hints).toHaveCount(1)
    await back.click()
    await page.reload()
    await signIn(page, 'josse')
    await openedDoor.click()
    await expect(hints).toHaveCount(0)
    for (let count = 0; count < 3; count++) {
      await card.getByRole('button', { name: count === 0 ? 'Åbn første hint' : 'Åbn næste hint' }).click()
      await expect(hints).toHaveCount(count + 1)
    }
    await expect(reveal).toBeVisible()
    await back.click()
    await expect(dialog).toHaveCount(0)
  })
}

test('December 7 stays date-locked for Josse while admin can test the hints early', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.install({ time: new Date(CALENDAR_YEAR, 11, 6, 12) })
  await page.goto('/')
  await signIn(page, 'josse')
  const door = page.getByRole('button', { name: '7. december, låst indtil den 7. december', exact: true })
  await expect(door).toHaveAttribute('aria-disabled', 'true')
  await door.click({ force: true })
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByText(`Lidt tålmodighed, goffe. Låge 7 åbner den 7. december ${CALENDAR_YEAR}.`)).toBeVisible()
  await page.getByRole('button', { name: 'Log ud', exact: true }).click()
  await signIn(page, 'admin')
  await page.getByRole('button', { name: '7. december, åbn din overraskelse', exact: true }).click()
  const card = page.getByRole('region', { name: 'EN LILLE HEMMELIGHED' })
  await card.getByRole('button', { name: 'Åbn første hint' }).click()
  await expect(card.getByRole('listitem')).toHaveCount(1)
})
