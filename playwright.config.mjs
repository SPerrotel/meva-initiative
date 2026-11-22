// Playwright E2E config (desktop: chromium, firefox, webkit; mobile: Pixel 7, iPhone 15).
// The site and the Firebase emulators are NOT started here: `npm run test:e2e` wraps playwright
// in `firebase emulators:exec` (hosting + auth + firestore), so ports come from firebase.json.
import { readFileSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

const { emulators } = JSON.parse(readFileSync('firebase.json', 'utf8'))
const baseURL = `http://localhost:${emulators.hosting.port}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    locale: 'fr-FR',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 15'] } },
  ],
})
