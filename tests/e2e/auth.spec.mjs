// Registration and login flows against the Auth + Firestore emulators.
import { randomUUID } from 'node:crypto'
import { expect, test } from './fixtures.mjs'

const PASSWORD = 'correct-horse-battery'

// The emulators keep their data for the whole run: every test registers its own unique user.
const newUser = () => ({ email: `joueur-${randomUUID()}@example.test`, pseudo: `Joueur${randomUUID().slice(0, 6)}` })

// `goto` can resolve before the page's module script has attached its handlers (seen on Firefox): a click on the
// mode toggle would then do nothing, and a click on submit would reload the page natively. Retry the toggle until
// the form really switches to registration mode, which proves the script ran.
async function openAuthPage(page, mode) {
  await page.goto('/connexion')
  await expect(async () => {
    if (!(await page.locator('#field-pseudo').isVisible())) await page.locator('#btn-toggle-mode').click()
    await expect(page.locator('#field-pseudo')).toBeVisible({ timeout: 1000 })
  }).toPass()
  if (mode === 'login') await page.locator('#btn-toggle-mode').click()
}

async function register(page, { email, pseudo }, password = PASSWORD) {
  await openAuthPage(page, 'register')
  await page.locator('#input-pseudo').fill(pseudo)
  await page.locator('#input-email').fill(email)
  await page.locator('#input-password').fill(password)
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
}

async function login(page, email, password) {
  await openAuthPage(page, 'login')
  await page.locator('#input-email').fill(email)
  await page.locator('#input-password').fill(password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
}

// Wait for the profile to be loaded first: leaving earlier would abort the Firestore read and the page script
// may not have attached its handlers yet. Sign-out is asynchronous too: wait for the redirect, or the next
// navigation would still be authenticated.
async function logout(page) {
  await expect(page.locator('#input-pseudo')).not.toHaveValue('')
  await page.locator('#btn-logout').click()
  await expect(page).not.toHaveURL(/\/profil/)
}

test('registering creates the account and lands on the profile', async ({ page }) => {
  const user = newUser()
  await register(page, user)

  await expect(page).toHaveURL(/\/profil/)
  await expect(page.getByRole('heading', { name: 'Espace Joueur' })).toBeVisible()
  await expect(page.locator('#input-email')).toHaveValue(user.email)
  await expect(page.locator('#input-pseudo')).toHaveValue(user.pseudo)
})

test('a registered user can log out then log back in', async ({ page }) => {
  const user = newUser()
  await register(page, user)
  await expect(page).toHaveURL(/\/profil/)

  await logout(page)

  await login(page, user.email, PASSWORD)
  await expect(page).toHaveURL(/\/profil/)
  await expect(page.locator('#input-pseudo')).toHaveValue(user.pseudo)
})

test('a wrong password is rejected with an error message', async ({ page, allowedConsoleErrors }) => {
  allowedConsoleErrors.push(/identitytoolkit|accounts:signInWithPassword/)
  const user = newUser()
  await register(page, user)
  await expect(page).toHaveURL(/\/profil/)
  await logout(page)

  await login(page, user.email, 'not-the-password')

  // The app maps `auth/invalid-credential` (production); the emulator still answers `auth/wrong-password`,
  // which the app shows raw. Both mean "rejected": assert the error is displayed and we stay on the login page.
  await expect(page.locator('#auth-error')).toHaveText(/E-mail ou mot de passe incorrect|wrong-password/)
  await expect(page).toHaveURL(/\/connexion/)
})

test('registering twice with the same e-mail is rejected', async ({ page, allowedConsoleErrors }) => {
  allowedConsoleErrors.push(/identitytoolkit|accounts:signUp/)
  const user = newUser()
  await register(page, user)
  await expect(page).toHaveURL(/\/profil/)
  await logout(page)

  await register(page, user)

  await expect(page.locator('#auth-error')).toHaveText('Cette adresse e-mail est déjà utilisée.')
})

test('a too short password is rejected', async ({ page, allowedConsoleErrors }) => {
  allowedConsoleErrors.push(/identitytoolkit|accounts:signUp/)
  await register(page, newUser(), '123')

  await expect(page.locator('#auth-error')).toHaveText('Le mot de passe doit faire au moins 6 caractères.')
})
