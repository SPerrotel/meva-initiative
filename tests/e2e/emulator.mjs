// Direct access to the Firestore emulator, for the specs that need data the UI cannot create.
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { expect } from './fixtures.mjs'

const { emulators } = JSON.parse(readFileSync('firebase.json', 'utf8'))
const { projects } = JSON.parse(readFileSync('.firebaserc', 'utf8'))

const docUrl = (path) =>
  `http://localhost:${emulators.firestore.port}/v1/projects/${projects.dev}/databases/(default)/documents/${path}`

// Writes a document straight into the emulator, bypassing the security rules (`Bearer owner`).
// Returns the document id (a unique one unless given).
export async function seedDoc(collection, fields, id = `e2e-${randomUUID()}`) {
  const response = await fetch(`${docUrl(collection)}?documentId=${id}`, {
    method: 'POST',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  expect(response.ok, await response.text()).toBe(true)
  return id
}

// Updates fields of an existing document straight in the emulator, bypassing the security rules.
export async function patchDoc(path, fields) {
  const mask = Object.keys(fields).map((field) => `updateMask.fieldPaths=${field}`).join('&')
  const response = await fetch(`${docUrl(path)}?${mask}`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  expect(response.ok, await response.text()).toBe(true)
}

// Reads a document straight from the emulator, bypassing the security rules. Returns its REST fields
// (e.g. `{ count: { integerValue: '1' } }`), or null when it does not exist.
export async function readDoc(path) {
  const response = await fetch(docUrl(path), { headers: { Authorization: 'Bearer owner' } })
  if (response.status === 404) return null
  const body = await response.text()
  expect(response.ok, body).toBe(true)
  return JSON.parse(body).fields ?? {}
}

// A public event with 4 places, far in the future so it never shows up in the months other tests display.
// `participants` are uids, as the admin dashboard writes them.
export const seedEvent = (title, participants = []) =>
  seedDoc('events', {
    title: { stringValue: title },
    location: { stringValue: 'MEVA' },
    startDate: { stringValue: '2099-12-31' },
    capacity: { integerValue: '4' },
    participants: { arrayValue: { values: participants.map((uid) => ({ stringValue: uid })) } },
    count: { integerValue: String(participants.length) },
  })
