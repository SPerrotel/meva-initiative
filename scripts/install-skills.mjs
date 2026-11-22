// Agent skills used for automated testing (Playwright + Firebase).
//
//   node scripts/install-skills.mjs        restore skills from skills-lock.json (postinstall)
//   node scripts/install-skills.mjs update (re)fetch the skills below and refresh skills-lock.json
//
// Restore is skipped on CI (`CI`) or with SKIP_SKILLS=1.
import { spawnSync } from 'node:child_process'

const SOURCES = [
  ['https://github.com/currents-dev/playwright-best-practices-skill', ['playwright-best-practices']],
  ['testdino-hq/playwright-skill', ['playwright-core', 'playwright-ci']],
  [
    'firebase/agent-skills',
    ['firebase-basics', 'firebase-firestore', 'firebase-hosting-basics', 'firebase-security-rules-auditor'],
  ],
]

const skills = (args) => spawnSync('npx', ['--no-install', 'skills', ...args], { stdio: 'inherit' }).status === 0

if (process.argv[2] === 'update') {
  for (const [source, names] of SOURCES) {
    if (!skills(['add', source, '--skill', ...names, '--yes'])) {
      console.error(`[skills] Failed to add ${source}`)
      process.exitCode = 1
    }
  }
} else if (process.env.CI || process.env.SKIP_SKILLS) {
  console.log('[skills] CI / SKIP_SKILLS detected, skipping skills installation.')
} else if (!skills(['install', '--frozen-lockfile'])) {
  // Never break `npm install` because of a network hiccup.
  console.warn('[skills] Failed to restore skills from skills-lock.json, continuing.')
}
