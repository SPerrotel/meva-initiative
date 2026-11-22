// Site configuration (home and association texts) stored in Firestore: visitors read it, admins save it.
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { expect, test } from './fixtures.mjs'

const { emulators } = JSON.parse(readFileSync('firebase.json', 'utf8'))
const { projects } = JSON.parse(readFileSync('.firebaserc', 'utf8'))

const FIRESTORE_REST = `http://localhost:${emulators.firestore.port}/v1/projects/${projects.dev}/databases/(default)/documents`
const AUTH_REST = `http://localhost:${emulators.auth.port}/identitytoolkit.googleapis.com/v1`
const PASSWORD = 'correct-horse-battery'

// Writes a document straight into the emulator, bypassing the security rules (`Bearer owner`).
async function writeDoc(path, fields) {
  const response = await fetch(`${FIRESTORE_REST}/${path}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  expect(response.ok, await response.text()).toBe(true)
}

// Creates an Auth emulator account and its profile with the admin role (only the rules owner can grant it).
async function createAdmin() {
  const email = `admin-${randomUUID()}@example.test`
  const response = await fetch(`${AUTH_REST}/accounts:signUp?key=e2e`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD, returnSecureToken: true }),
  })
  const body = await response.json()
  expect(response.ok, JSON.stringify(body)).toBe(true)
  await writeDoc(`users/${body.localId}`, {
    email: { stringValue: email },
    pseudo: { stringValue: 'AdminE2E' },
    roles: { mapValue: { fields: { admin: { booleanValue: true }, member: { booleanValue: true } } } },
  })
  return email
}

// The page opens in registration or login mode depending on the script having run: wait for the toggle to work
// (see auth.spec.mjs) before switching to login. Admins are then redirected to the dashboard: wait for it rather
// than navigating, which would abort the redirect's in-flight Auth requests (WebKit reports them as page errors).
async function loginAsAdmin(page, email) {
  await page.goto('/connexion')
  await expect(async () => {
    if (!(await page.locator('#field-pseudo').isVisible())) await page.locator('#btn-toggle-mode').click()
    await expect(page.locator('#field-pseudo')).toBeVisible({ timeout: 1000 })
  }).toPass()
  await page.locator('#btn-toggle-mode').click()
  await page.locator('#input-email').fill(email)
  await page.locator('#input-password').fill(PASSWORD)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await expect(page).toHaveURL(/\/admin\/dashboard/)
}

// Every project writes the same values: tests running in parallel cannot see each other's data.
// The home texts are shared by the home page test and the admin save test, which both write config_home/home.
const HOME_TEXTS = {
  tagline: 'MEVA Initiative (e2e)',
  title: 'Accueil <span class="text-meva-accent">e2e</span>',
  subtitle: "Sous-titre de l'accueil enregistré dans Firestore.",
}

test('home page shows the texts stored in Firestore', async ({ page }) => {
  await writeDoc('config_home/home', {
    tagline: { stringValue: HOME_TEXTS.tagline },
    title: { stringValue: HOME_TEXTS.title },
    subtitle: { stringValue: HOME_TEXTS.subtitle },
  })

  await page.goto('/')

  await expect(page.locator('#home-tagline')).toHaveText(HOME_TEXTS.tagline)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Accueil e2e')
  await expect(page.locator('#home-title .text-meva-accent')).toHaveText('e2e')
  await expect(page.locator('#home-subtitle')).toHaveText(HOME_TEXTS.subtitle)
})

test('association page shows the texts stored in Firestore', async ({ page }) => {
  const title = "L'association MEVA Initiative (e2e)"
  await writeDoc('config_asso/asso', {
    title: { stringValue: title },
    subtitle: { stringValue: 'Sous-titre enregistré dans Firestore.' },
  })

  await page.goto('/association')

  await expect(page.locator('#asso-display-title')).toHaveText(title)
  await expect(page.locator('#asso-display-subtitle')).toHaveText('Sous-titre enregistré dans Firestore.')
})

// The success message only shows once Firestore accepted the write: a save refused by the rules shows an error.
test('an admin saves the home page texts', async ({ page }) => {
  const dialogs = []
  page.on('dialog', (dialog) => {
    dialogs.push(dialog.message())
    dialog.accept()
  })
  await loginAsAdmin(page, await createAdmin())

  // The form is filled by the last step of the dashboard script: its handlers are attached by then.
  await expect(page.locator('#home-tagline')).not.toHaveValue('')
  await page.locator('#btn-tab-home').click()

  await page.locator('#home-tagline').fill(HOME_TEXTS.tagline)
  await page.locator('#home-title').fill(HOME_TEXTS.title)
  await page.locator('#home-subtitle').fill(HOME_TEXTS.subtitle)
  await page.locator('#form-home-config').getByRole('button', { name: 'Enregistrer' }).click()

  await expect.poll(() => dialogs).toContain("Page d'accueil mise à jour !")
  expect(dialogs.filter((message) => message.startsWith('Erreur'))).toEqual([])
})
