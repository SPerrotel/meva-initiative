// Firestore unreachable (e.g. a tab resumed on mobile while the network wakes up): getDocs then answers at once
// from the empty memory cache instead of failing. Pages must fall back to the local copy instead of hanging.
import { expect, test } from './fixtures.mjs'

// Firefox reports the aborted requests as CORS console errors: expected here.
const blockFirestore = (page, allowedConsoleErrors) => {
  allowedConsoleErrors.push(/google\.firestore\.v1\.Firestore\/(Listen|Write)\/channel/)
  return page.route(/google\.firestore\.v1\.Firestore/, (route) => route.abort())
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
