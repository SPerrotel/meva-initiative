// The `registrations` tickets are the only source of truth for who is registered and how many places are taken:
// the rules let only admins write an event, so its `participants`/`count` only reflect the admins' actions.
import { randomUUID } from 'node:crypto'
import { newUser, register } from './auth.mjs'
import { seedDoc } from './emulator.mjs'
import { expect, test } from './fixtures.mjs'

// Registers a new user and returns their uid, once the profile shows the restored session.
async function registerUser(page) {
  await register(page, newUser())
  await expect(page).toHaveURL(/\/profil/)
  await expect(page.locator('#input-pseudo')).not.toHaveValue('')
  // Same module instance as the page's: the signed-in user.
  return page.evaluate(async () => (await import('/firebase-config.js')).auth.currentUser.uid)
}

// Far in the future, so it never shows up in the months other tests display. Public, 4 places.
const seedEvent = (title, participants = []) =>
  seedDoc('events', {
    title: { stringValue: title },
    location: { stringValue: 'MEVA' },
    startDate: { stringValue: '2099-12-31' },
    capacity: { integerValue: '4' },
    participants: { arrayValue: { values: participants.map((uid) => ({ stringValue: uid })) } },
    count: { integerValue: String(participants.length) },
  })

const calendarRow = (page, title) => page.locator('#events-list a', { hasText: title })

test('a player added by an admin is no longer counted once unregistered from the profile', async ({ page }) => {
  const title = `Tournoi e2e ${randomUUID()}`
  const uid = await registerUser(page)
  // What the dashboard writes when an admin adds a player: the uid in the event and a ticket.
  const eventId = await seedEvent(title, [uid])
  await seedDoc('registrations', { eventId: { stringValue: eventId }, userId: { stringValue: uid }, addedByAdmin: { booleanValue: true } }, `${eventId}_${uid}`)

  await page.goto('/calendrier')
  await expect(calendarRow(page, title)).toContainText('1 / 4')

  await page.goto('/profil')
  page.once('dialog', (dialog) => dialog.accept())
  await page.locator(`.btn-cancel-reg[data-eventid="${eventId}"]`).click()
  await expect(page.locator(`.btn-cancel-reg[data-eventid="${eventId}"]`)).toHaveCount(0)

  await page.goto(`/evenement?id=${eventId}`)
  await expect(page.locator('#event-detail-card')).toContainText('0 / 4 places')
  await expect(page.locator('#btn-participate')).toHaveText(/Valider l'inscription/)

  await page.goto('/calendrier')
  await expect(calendarRow(page, title)).toContainText('0 / 4')
})

test('the event page counts the places from the tickets when a player registers then unregisters', async ({ page }) => {
  const title = `Tournoi e2e ${randomUUID()}`
  await registerUser(page)
  const eventId = await seedEvent(title)

  await page.goto(`/evenement?id=${eventId}`)
  await expect(page.locator('#event-detail-card')).toContainText('0 / 4 places')
  await page.locator('#select-seats').selectOption('2')
  await page.locator('#btn-participate').click()
  await expect(page.locator('#event-detail-card')).toContainText('2 / 4 places')
  await expect(page.locator('#btn-participate')).toContainText('Inscription validée (+1 invité)')

  await page.goto('/calendrier')
  await expect(calendarRow(page, title)).toContainText('2 / 4')

  await page.goto(`/evenement?id=${eventId}`)
  await page.locator('#btn-participate').click()
  await expect(page.locator('#event-detail-card')).toContainText('0 / 4 places')
  await expect(page.locator('#btn-participate')).toHaveText(/Valider l'inscription/)
})
