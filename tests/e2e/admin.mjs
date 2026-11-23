// `admin` fixture: the page is signed in as a new user promoted to admin straight in the emulator (the rules
// forbid a user to give themselves a role). The dashboard checks the role once signed in, so the promotion
// happens before any test navigates there.
import { registerUser } from './auth.mjs'
import { patchDoc } from './emulator.mjs'
import { test as base } from './fixtures.mjs'

export const test = base.extend({
  admin: async ({ page }, use) => {
    const uid = await registerUser(page)
    await patchDoc(`users/${uid}`, {
      roles: { mapValue: { fields: { admin: { booleanValue: true }, member: { booleanValue: true } } } },
    })
    await use({ uid })
  },
})

export { expect } from './fixtures.mjs'
