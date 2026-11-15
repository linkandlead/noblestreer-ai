// Formulier → lead-SDK (cms-client.js van Link & Lead One). Laadt de ECHTE SDK van linkandlead.nl,
// maar mockt POST /api/cms/lead zodat er geen testleads in productie belanden. Controleert wat het
// formulier verstuurt, de bevestiging uit het CMS-veld en de foutstand.

import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { startServer } from '../../scripts/serve.mjs'

const { chromium } = createRequire(import.meta.url)('playwright')
const html = readFileSync('dist/index.html', 'utf8')
const heeftSdk = html.includes('/cms-client.js" data-site=')

let server, browser, base
before(async () => {
  server = await startServer('dist', 0)
  base = `http://127.0.0.1:${server.address().port}/`
  browser = await chromium.launch()
})
after(async () => {
  await browser?.close()
  server?.close()
})

async function pagina(antwoord) {
  const page = await browser.newPage()
  const verstuurd = []
  await page.route('https://linkandlead.nl/meet.js', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }))
  await page.route('https://linkandlead.nl/api/cms/lead', async (r) => {
    verstuurd.push(JSON.parse(r.request().postData() || '{}'))
    await r.fulfill({ status: antwoord.status, contentType: 'application/json', body: JSON.stringify(antwoord.body), headers: { 'access-control-allow-origin': '*' } })
  })
  await page.goto(base, { waitUntil: 'networkidle' })
  return { page, verstuurd }
}

test('formulier verstuurt via de echte lead-SDK met site_id en spambescherming', { skip: !heeftSdk && 'build zonder SITE_ID' }, async () => {
  const { page, verstuurd } = await pagina({ status: 200, body: { ok: true, melding: 'Bedankt!' } })
  assert.equal(await page.evaluate(() => typeof window.LLCMS?.lead), 'function', 'SDK geladen ondanks CSP')
  await page.fill('#f-naam', 'Test Persoon')
  await page.fill('#f-email', 'test@example.com')
  await page.fill('#f-bedrijf', 'Testbedrijf')
  await page.fill('#f-vraag', 'Testvraag')
  await page.click('.contact-form button[type=submit]')
  await page.waitForSelector('.form-success:not([hidden])')
  assert.match(await page.locator('.form-success').textContent(), /Bedankt\. Je aanvraag is ontvangen/)
  assert.equal(verstuurd.length, 1)
  const b = verstuurd[0]
  assert.equal(b.site_id, '43419df5-06b4-437a-9632-fd3f242a8364')
  assert.equal(b.email, 'test@example.com')
  assert.equal(b.naam, 'Test Persoon')
  assert.equal(b.bedrijf, 'Testbedrijf')
  assert.equal(b.vraag, 'Testvraag')
  assert.equal(b.herkomst, 'noblestreet-contact')
  assert.equal(b._website, '', 'honeypot leeg')
  assert.ok(typeof b._ts === 'number')
  await page.close()
})

test('servervalidatiefout → Nederlandstalige foutmelding, geen bevestiging', { skip: !heeftSdk && 'build zonder SITE_ID' }, async () => {
  const { page } = await pagina({ status: 400, body: { ok: false, melding: 'Ongeldige aanvraag.' } })
  await page.fill('#f-email', 'test@example.com')
  await page.click('.contact-form button[type=submit]')
  await page.waitForSelector('.form-error:not([hidden])')
  assert.match(await page.locator('.form-error').textContent(), /Verzenden mislukt/)
  assert.equal(await page.locator('.form-success').isVisible(), false)
  await page.close()
})
