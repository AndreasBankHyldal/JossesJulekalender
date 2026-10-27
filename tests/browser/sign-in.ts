import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { testAuthEnv } from '../fixtures/auth'

export async function signIn(page: Page, role: 'josse' | 'admin') {
  await expect(page.getByLabel('Brugernavn', { exact: true })).toBeVisible()
  await page.getByLabel('Brugernavn', { exact: true }).fill(
    role === 'admin' ? testAuthEnv.ADMIN_USERNAME : testAuthEnv.JOSSE_USERNAME,
  )
  await page.getByLabel('Adgangskode', { exact: true }).fill(
    role === 'admin' ? testAuthEnv.ADMIN_PASSWORD : testAuthEnv.JOSSE_PASSWORD,
  )
  await page.getByRole('button', { name: 'Åbn vores december' }).click()
  await expect(page.locator('.calendar-grid')).toBeVisible()
}
