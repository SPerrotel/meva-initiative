// Shared fixtures: every test fails on uncaught page errors and console errors,
// so a broken Firebase init or a failed bundle cannot go unnoticed.
import { expect, test as base } from '@playwright/test'

// Firestore long-poll channels are torn down by the SDK when a page closes or navigates away: the emulator
// may answer 400 (`TYPE=terminate`) and WebKit reports aborted in-flight requests as "network connection was
// lost" console errors or as "... due to access control checks" page errors.
const isFirestoreChannelUrl = (url) => url.includes('/google.firestore.v1.Firestore/') && url.includes('/channel?')
// Same teardown, other symptoms: the SDK warns that it "could not reach" the backend when a navigation cuts its
// connection, and the Realtime Database long-poll iframe trips the `unload` permissions policy. Real outages
// still fail the tests: they assert on data read from Firestore (e.g. the profile).
const isTransportNoise = (message) => {
  const text = message.text()
  return (
    isFirestoreChannelUrl(message.location().url) ||
    text.includes('Could not reach Cloud Firestore backend') ||
    (text.includes('Permissions policy violation: unload') && message.location().url.includes('/.lp?'))
  )
}
const isFirestoreAbortedRequest = (error) =>
  error.message.includes('access control checks') && isFirestoreChannelUrl(error.message)

export const test = base.extend({
  // Console errors a test expects on purpose (e.g. a rejected sign-in): `allowedConsoleErrors.push(/identitytoolkit/)`.
  allowedConsoleErrors: async ({}, use) => {
    await use([])
  },

  page: async ({ page, allowedConsoleErrors }, use) => {
    const errors = []
    page.on('pageerror', (error) => {
      if (!isFirestoreAbortedRequest(error)) errors.push(`pageerror: ${error.message}`)
    })
    page.on('console', (message) => {
      if (message.type() !== 'error' || isTransportNoise(message)) return
      const text = `${message.text()} (${message.location().url})`
      if (allowedConsoleErrors.some((pattern) => pattern.test(text))) return
      errors.push(`console: ${text}`)
    })
    await use(page)
    expect(errors, 'no uncaught errors or console errors').toEqual([])
  },
})

export { expect }
