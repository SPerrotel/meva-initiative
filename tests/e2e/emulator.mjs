// Direct access to the Firestore emulator, for the specs that need data the UI cannot create.
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { expect } from './fixtures.mjs'

const { emulators } = JSON.parse(readFileSync('firebase.json', 'utf8'))
const { projects } = JSON.parse(readFileSync('.firebaserc', 'utf8'))

// Writes a document straight into the emulator, bypassing the security rules (`Bearer owner`).
// Returns the document id (a unique one unless given).
export async function seedDoc(collection, fields, id = `e2e-${randomUUID()}`) {
  const url = `http://localhost:${emulators.firestore.port}/v1/projects/${projects.dev}/databases/(default)/documents/${collection}?documentId=${id}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  })
  expect(response.ok, await response.text()).toBe(true)
  return id
}
