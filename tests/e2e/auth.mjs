// Registration and login helpers shared by the specs that need a signed-in user.
import { randomUUID } from 'node:crypto'
import { expect } from './fixtures.mjs'

export const PASSWORD = 'correct-horse-battery'

// The emulators keep their data for the whole run: every test registers its own unique user.
export const newUser = () => ({ email: `joueur-${randomUUID()}@example.test`, pseudo: `Joueur${randomUUID().slice(0, 6)}` })

// `goto` can resolve before the page's module script has attached its handlers (seen on Firefox): a click on the
// mode toggle would then do nothing, and a click on submit would reload the page natively. Retry the toggle until
// the form really switches to registration mode, which proves the script ran.
export async function openAuthPage(page, mode) {
  await page.goto('/connexion')
  await expect(async () => {
    if (!(await page.locator('#field-pseudo').isVisible())) await page.locator('#btn-toggle-mode').click()
    await expect(page.locator('#field-pseudo')).toBeVisible({ timeout: 1000 })
  }).toPass()
  if (mode === 'login') await page.locator('#btn-toggle-mode').click()
}

export async function register(page, { email, pseudo }, password = PASSWORD) {
  await openAuthPage(page, 'register')
  await page.locator('#input-pseudo').fill(pseudo)
  await page.locator('#input-email').fill(email)
  await page.locator('#input-password').fill(password)
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
}

export async function login(page, email, password) {
  await openAuthPage(page, 'login')
  await page.locator('#input-email').fill(email)
  await page.locator('#input-password').fill(password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
}

// Wait for the profile to be loaded first: leaving earlier would abort the Firestore read and the page script
// may not have attached its handlers yet. Sign-out is asynchronous too: wait for the redirect, or the next
// navigation would still be authenticated.
export async function logout(page) {
  await expect(page.locator('#input-pseudo')).not.toHaveValue('')
  await page.locator('#btn-logout').click()
  await expect(page).not.toHaveURL(/\/profil/)
}
