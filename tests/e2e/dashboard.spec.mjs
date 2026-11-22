// Admin dashboard: the `registrations` tickets are the only source of truth for the registered players. A player
// who unregisters on their own cannot write the event (rules), so its `participants`/`count` go stale until an
// admin's dashboard resyncs them.
import { randomUUID } from 'node:crypto'
import { expect, test } from './admin.mjs'
import { readDoc, seedDoc, seedEvent } from './emulator.mjs'

// A player document, as the registration page writes it. Returns its uid.
const seedPlayer = () =>
  seedDoc('users', {
    email: { stringValue: `joueur-${randomUUID()}@example.test` },
    pseudo: { stringValue: `Joueur${randomUUID().slice(0, 6)}` },
    roles: { mapValue: { fields: { admin: { booleanValue: false }, member: { booleanValue: false } } } },
  })

// Event fields as stored in Firestore: the number of places and the participants' uids.
async function storedPlaces(eventId) {
  const fields = await readDoc(`events/${eventId}`)
  return { count: Number(fields.count?.integerValue), participants: (fields.participants?.arrayValue?.values ?? []).map((v) => v.stringValue) }
}

// Fails the test on any alert ("déjà inscrit", "Accès refusé"…) and accepts the confirmations.
function recordDialogs(page) {
  const alerts = []
  page.on('dialog', async (dialog) => {
    if (dialog.type() === 'alert') alerts.push(dialog.message())
    await dialog.accept()
  })
  return alerts
}

test('the dashboard resyncs the places of an event from its tickets', async ({ page, admin }) => {
  const alerts = recordDialogs(page)
  // A player added by an admin, then unregistered on their own: their uid stays in the event, their ticket is gone.
  const playerId = await seedPlayer()
  const eventId = await seedEvent(`Tournoi e2e ${randomUUID()}`, [playerId])

  await page.goto('/admin/dashboard')

  await expect(page.locator(`#count-display-${eventId}`)).toHaveText('0 / 4')
  await expect.poll(() => storedPlaces(eventId)).toEqual({ count: 0, participants: [] })
  expect(alerts).toEqual([])
})

test('an admin can add back a player who unregistered on their own', async ({ page, admin }) => {
  const alerts = recordDialogs(page)
  const playerId = await seedPlayer()
  const eventId = await seedEvent(`Tournoi e2e ${randomUUID()}`, [playerId])

  await page.goto('/admin/dashboard')
  await page.locator(`.view-parts-ev[data-id="${eventId}"]`).click()
  const players = page.locator(`#parts-container-${eventId}`)
  await expect(players).toContainText('Aucun joueur inscrit')
  await page.locator(`#select-add-part-${eventId}`).selectOption(playerId)
  await page.locator(`#btn-add-part-${eventId}`).click()

  await expect(page.locator(`#count-display-${eventId}`)).toHaveText('1 / 4')
  await expect(players.locator(`.btn-kick-user[data-uid="${playerId}"]`)).toBeVisible()
  expect(await readDoc(`registrations/${eventId}_${playerId}`)).not.toBeNull()
  await expect.poll(() => storedPlaces(eventId)).toEqual({ count: 1, participants: [playerId] })
  expect(alerts).toEqual([])
})
