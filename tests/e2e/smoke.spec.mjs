// Smoke tests: the site is served by the hosting emulator and boots against the Auth/Firestore emulators.
import { expect, test } from '@playwright/test'

// Firestore long-poll channels are closed by the SDK when a page closes: the emulator may answer 400
// (`TYPE=terminate`) and WebKit reports "network connection was lost" on an in-flight Listen request.
const isFirestoreChannelNoise = (message) => {
  const { url } = message.location()
  return url.includes('/google.firestore.v1.Firestore/') && url.includes('/channel?')
}

// Collect uncaught exceptions and console errors so a broken Firebase init or a failed bundle fails the test.
test.beforeEach(({ page }) => {
  page.errors = []
  page.on('pageerror', (error) => page.errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error' && !isFirestoreChannelNoise(message)) page.errors.push(`console: ${message.text()} (${message.location().url})`)
  })
})

test.afterEach(({ page }) => {
  expect(page.errors, 'no uncaught errors or console errors').toEqual([])
})

test('home page renders with navbar and content sections', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle(/MEVA Initiative/)
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('#home-calendar-days')).not.toBeEmpty()
})

test('login page exposes the sign-in form', async ({ page }) => {
  await page.goto('/connexion')

  await expect(page).toHaveTitle(/Connexion/)
  await expect(page.getByRole('heading', { name: 'Espace Joueur' })).toBeVisible()
  await expect(page.locator('#input-email')).toBeVisible()
  await expect(page.locator('#input-password')).toBeVisible()
  await expect(page.locator('#btn-submit')).toBeEnabled()
})

test('firebase emulators are wired in the generated config', async ({ page }) => {
  await page.goto('/')

  const config = await page.evaluate(() => import('/firebase-config.generated.js').then((m) => m.emulators))
  expect(config, 'run through `npm run test:e2e` so dev:config enables the emulators').not.toBeNull()
  expect(config.authPort).toBe(9099)
  expect(config.firestorePort).toBe(8080)
})
