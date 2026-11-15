// Stuurt een blauwdruk naar de bestaande self-service sync-API van Link & Lead One:
//   POST {CMS_BASE}/api/cms/sync   Authorization: Bearer $CMS_TOKEN
// Hard gescopet op de site van het token (kan nooit een andere site raken). Alleen bestaande
// bloktypen; de CMS-kant valideert dat opnieuw. Zie linkandlead-cms/src/routes/api/cms/sync.ts.
//
//   CMS_TOKEN=cms_… node scripts/cms-push.mjs cms/blauwdruk.mjs
//
// Waarschuwing: overschrijft de blokken van de meegegeven pagina's en (indien meegegeven) merk/
// navigatie. Gebruik het voor de eerste vulling — daarna is One Studio de bron van waarheid.

import path from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

if (existsSync('.env')) {
  for (const r of readFileSync('.env', 'utf8').split('\n')) {
    const m = r.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const bestand = process.argv[2]
if (!bestand) {
  console.error('Gebruik: node scripts/cms-push.mjs <blauwdruk.mjs>')
  process.exit(1)
}
const base = (process.env.CMS_BASE || 'https://linkandlead.nl').replace(/\/$/, '')
const token = process.env.CMS_TOKEN
if (!token?.startsWith('cms_')) {
  console.error('✗ Zet CMS_TOKEN (cms_…).')
  process.exit(1)
}

const bd = (await import(pathToFileURL(path.resolve(bestand)).href)).default
const res = await fetch(`${base}/api/cms/sync`, {
  method: 'POST',
  headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
  body: JSON.stringify(bd),
})
const uit = await res.json().catch(() => ({}))
if (!res.ok || !uit.ok) {
  console.error(`✗ Sync mislukt (HTTP ${res.status}): ${uit.melding ?? 'onbekende fout'}`)
  process.exit(1)
}
console.log(`✓ Gesynchroniseerd: site ${uit.siteId}, ${uit.paginas} pagina('s), ${uit.blokken} blok(ken).`)
