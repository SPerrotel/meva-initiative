// Firestore unreachable (e.g. a tab resumed on mobile while the network wakes up): getDocs then answers at once
// from the empty memory cache instead of failing. Pages must fall back to the local copy instead of hanging.
import { randomUUID } from 'node:crypto'
import { logout, newUser, register } from './auth.mjs'
import { seedDoc } from './emulator.mjs'
import { expect, test } from './fixtures.mjs'

const FIRESTORE_URL = /google\.firestore\.v1\.Firestore/

// Firefox reports the aborted requests as CORS console errors: expected here.
const blockFirestore = (page, allowedConsoleErrors) => {
  allowedConsoleErrors.push(/google\.firestore\.v1\.Firestore\/(Listen|Write)\/channel/)
  return page.route(FIRESTORE_URL, (route) => route.abort())
}

// Its `createdAt` keeps it behind the other news, so it never becomes the home page headline other tests may rely on.
const seedNews = (title) =>
  seedDoc('news', { title: { stringValue: title }, content: { stringValue: 'Article de test.' }, createdAt: { integerValue: '0' } })

// Far in the future, so it never shows up in the months other tests display.
const seedEvent = (title) =>
  seedDoc('events', { title: { stringValue: title }, location: { stringValue: 'MEVA' }, startDate: { stringValue: '2099-12-31' } })

test('home page renders without Firestore on a first visit', async ({ page, allowedConsoleErrors }) => {
  await blockFirestore(page, allowedConsoleErrors)
  await page.goto('/')

  await expect(page.locator('#home-calendar-days')).not.toBeEmpty()
  await expect(page.locator('#stores-grid')).not.toBeEmpty()
  await expect(page.locator('#news-grid')).not.toBeEmpty()
})

test('home page falls back to the last data read when Firestore becomes unreachable', async ({ page, allowedConsoleErrors }) => {
  await page.goto('/')
  await expect(page.locator('#stores-grid')).not.toBeEmpty()
  const storesOnline = await page.locator('#stores-grid').innerHTML()

  await blockFirestore(page, allowedConsoleErrors)
  await page.reload()

  await expect(page.locator('#home-calendar-days')).not.toBeEmpty()
  await expect(page.locator('#stores-grid')).toHaveJSProperty('innerHTML', storesOnline)
})

test('news page refreshes once Firestore is reachable again', async ({ page, allowedConsoleErrors }) => {
  const title = `Actualité e2e ${randomUUID()}`
  await seedNews(title)
  await blockFirestore(page, allowedConsoleErrors)
  await page.goto('/actualites')

  await expect(page.locator('#news-page-grid')).not.toBeEmpty()
  await expect(page.locator('#news-page-grid')).not.toContainText(title)

  await page.unroute(FIRESTORE_URL)
  // The SDK retries with a backoff: going back online makes it reconnect at once. Its transport then probes the
  // network with an image request that fails while the context is still offline.
  allowedConsoleErrors.push(/www\.google\.com\/images\/cleardot\.gif/)
  await page.context().setOffline(true)
  await page.context().setOffline(false)

  await expect(page.locator('#news-page-grid')).toContainText(title, { timeout: 15_000 })
})

test('calendar falls back to the last events read when Firestore becomes unreachable', async ({ page, allowedConsoleErrors }) => {
  const title = `Tournoi e2e ${randomUUID()}`
  await seedEvent(title)
  await page.goto('/calendrier')
  await expect(page.locator('#events-list')).toContainText(title)

  await blockFirestore(page, allowedConsoleErrors)
  await page.reload()

  await expect(page.locator('#events-list')).toContainText(title)
})

test('calendar still falls back to the last events read after unregistering from the profile', async ({ page, allowedConsoleErrors }) => {
  const title = `Tournoi e2e ${randomUUID()}`
  const eventId = await seedEvent(title)
  await register(page, newUser())
  await expect(page).toHaveURL(/\/profil/)
  // The profile shows once the session is restored. Same module instance as the page's: the signed-in user.
  await expect(page.locator('#input-pseudo')).not.toHaveValue('')
  const uid = await page.evaluate(async () => (await import('/firebase-config.js')).auth.currentUser.uid)
  await seedDoc('registrations', { eventId: { stringValue: eventId }, userId: { stringValue: uid } })

  await page.goto('/calendrier')
  await expect(page.locator('#events-list')).toContainText(title)

  await page.goto('/profil')
  page.once('dialog', (dialog) => dialog.accept())
  await page.locator(`.btn-cancel-reg[data-eventid="${eventId}"]`).click()
  await expect(page.locator(`.btn-cancel-reg[data-eventid="${eventId}"]`)).toHaveCount(0)
  // Signed in, the navbar's user profile read fails without Firestore: not what this test is about.
  await logout(page)

  await blockFirestore(page, allowedConsoleErrors)
  await page.goto('/calendrier')

  await expect(page.locator('#events-list')).toContainText(title)
})
