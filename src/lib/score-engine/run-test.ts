// Manual test runner — call with: npx tsx src/lib/score-engine/run-test.ts [url]
// Reads .env from project root automatically.

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env manually (tsx doesn't auto-load it)
const envPath = resolve(process.cwd(), '.env')
try {
  const envFile = readFileSync(envPath, 'utf8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key && val && !process.env[key]) process.env[key] = val
  }
} catch {
  console.warn('Could not load .env — keys must be set in environment')
}

import { runScore } from './index'

const url = process.argv[2] ?? 'https://www.erikapena.com'
console.log(`\n Running score engine against: ${url}\n`)

const result = await runScore(url)

console.log('\n════════════════════════════════════════════════════')
console.log(' HEALTH CHECK SCORE')
console.log('════════════════════════════════════════════════════')
console.log(` Total: ${result.healthCheck.total}/100  —  ${result.healthCheck.verdict}`)
console.log()

for (const check of result.checks) {
  const icon = check.band === 'pass' ? '✓' : check.band === 'partial' ? '~' : check.band === 'pending' ? '?' : '✗'
  const pts = `${check.score}/9`
  console.log(` ${icon} [${pts}] ${check.label}`)
  console.log(`        ${check.evidence}`)
  console.log()
}

console.log('\n════════════════════════════════════════════════════')
console.log(' AI VISIBILITY SCORE')
console.log('════════════════════════════════════════════════════')
console.log(` Total: ${result.visibility.total}/100  —  ${result.visibility.band}`)
console.log(` Biggest leak: ${result.visibility.biggestLeak}`)
console.log()

for (const dim of result.visibility.dimensions) {
  console.log(` ${dim.label}: ${dim.score}/20  (${dim.band})`)
  console.log(`   ${dim.explanation}`)
  console.log()
}

if (result.visibility.needsInput.length) {
  console.log(' Needs self-report input to complete:')
  for (const n of result.visibility.needsInput) {
    console.log(`   • ${n}`)
  }
}

console.log('\n════════════════════════════════════════════════════')
console.log(' SURFACE READ NOTE')
console.log('════════════════════════════════════════════════════')
// Word-wrap at ~80 chars
const words = result.surfaceReadNote.split(' ')
let line = ''
for (const word of words) {
  if ((line + word).length > 78) { console.log(' ' + line.trimEnd()); line = '' }
  line += word + ' '
}
if (line.trim()) console.log(' ' + line.trimEnd())

console.log('\n════════════════════════════════════════════════════')
console.log(` Completed in ${(result.durationMs / 1000).toFixed(1)}s`)
console.log('════════════════════════════════════════════════════\n')
