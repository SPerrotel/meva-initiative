// Firestore unreachable (e.g. a tab resumed on mobile while the network wakes up): getDocs then answers at once
// from the empty memory cache instead of failing. Pages must fall back to the local copy instead of hanging.
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { expect, test } from './fixtures.mjs'

const { emulators } = JSON.parse(readFileSync('firebase.json', 'utf8'))
const { projects } = JSON.parse(readFileSync('.firebaserc', 'utf8'))

const FIRESTORE_URL = /google\.firestore\.v1\.Firestore/

// Firefox reports the aborted requests as CORS console errors: expected here.
const blockFirestore = (page, allowedConsoleErrors) => {
  allowedConsoleErrors.push(/google\.firestore\.v1\.Firestore\/(Listen|Write)\/channel/)
  return page.route(FIRESTORE_URL, (route) => route.abort())
}

// Writes a news item straight into the emulator, bypassing the security rules (`Bearer owner`). Its `createdAt`
// keeps it behind the other news, so it never becomes the home page headline other tests may rely on.
async function seedNews(title) {
  const url = `http://localhost:${emulators.firestore.port}/v1/projects/${projects.dev}/databases/(default)/documents/news?documentId=e2e-${randomUUID()}`
  const fields = { title: { stringValue: title }, content: { stringValue: 'Article de test.' }, createdAt: { integerValue: '0' } }
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  expect(response.ok, await response.text()).toBe(true)
}

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
