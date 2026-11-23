// Registration and login flows against the Auth + Firestore emulators.
import { login, logout, newUser, PASSWORD, register } from './auth.mjs'
import { expect, test } from './fixtures.mjs'

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

  await expect(page.locator('#auth-error')).toHaveText('E-mail ou mot de passe incorrect.')
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
