// Browsertests (Playwright via de vooraf geïnstalleerde Chromium). Draai na `npm run build:fixture`
// (of een echte build): npm run test:e2e. Server past de CSP uit vercel.json toe.

import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { startServer } from '../../scripts/serve.mjs'

const { chromium } = createRequire(import.meta.url)('playwright')
const DIR = process.env.E2E_DIR || 'dist'

let server, browser, base
before(async () => {
  server = await startServer(DIR, 0)
  base = `http://127.0.0.1:${server.address().port}/`
  browser = await chromium.launch()
})
after(async () => {
  await browser?.close()
  server?.close()
})

async function open(opts = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ...opts })
  const fouten = []
  const verzoeken = []
  page.on('console', (m) => m.type() === 'error' && fouten.push(m.text()))
  page.on('pageerror', (e) => fouten.push(e.message))
  page.on('request', (r) => verzoeken.push(r.url()))
  await page.goto(base, { waitUntil: 'networkidle' })
  return { page, fouten, verzoeken }
}

for (const width of [375, 768, 1024, 1440]) {
  test(`${width}px: geen horizontale scroll, één h1, geen consolefouten`, async () => {
    const { page, fouten } = await open({ viewport: { width, height: 900 } })
    const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth])
    assert.ok(sw <= iw, `scrollWidth ${sw} > ${iw}`)
    assert.equal(await page.locator('h1').count(), 1)
    // De reuzenwoordmerk mag niet buiten het footerpaneel lopen.
    const giant = await page.locator('.footer-giant').boundingBox()
    assert.ok(giant.x + giant.width <= width + 1, 'footer-woordmerk loopt over')
    // Dienstkaarten afgesneden?
    for (const box of await page.locator('.service-card').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().right))) {
      assert.ok(box <= width + 1)
    }
    assert.deepEqual(fouten, [])
    await page.close()
  })
}

test('geen externe fontaanvragen; Outfit wordt lokaal geladen', async () => {
  const { page, verzoeken } = await open()
  assert.ok(!verzoeken.some((u) => /fonts\.(googleapis|gstatic)\.com/.test(u)))
  assert.ok(verzoeken.some((u) => u.includes('/fonts/outfit-latin-500-normal.woff2')))
  const font = await page.evaluate(() => getComputedStyle(document.body).fontFamily)
  assert.match(font, /Outfit/)
  assert.equal(await page.evaluate(() => document.fonts.check('500 16px Outfit')), true)
  await page.close()
})

test('menu: muis, Escape, focus trap en focus terug naar de opener', async () => {
  const { page } = await open()
  const knop = page.locator('#open-menu')
  assert.equal(await knop.getAttribute('aria-expanded'), 'false')
  await knop.click()
  await page.waitForSelector('#main-menu.open')
  assert.equal(await knop.getAttribute('aria-expanded'), 'true')
  assert.equal(await page.evaluate(() => document.activeElement.id), 'close-menu')
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflow), 'hidden')
  // Focus trap: veel Tabs blijven in het menu.
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab')
  assert.equal(await page.evaluate(() => document.getElementById('main-menu').contains(document.activeElement)), true)
  await page.keyboard.press('Shift+Tab')
  assert.equal(await page.evaluate(() => document.getElementById('main-menu').contains(document.activeElement)), true)
  // Achtergrond is inert.
  assert.equal(await page.locator('main').getAttribute('inert'), '')
  await page.keyboard.press('Escape')
  await page.waitForFunction(() => !document.getElementById('main-menu').classList.contains('open'))
  assert.equal(await page.evaluate(() => document.activeElement.id), 'open-menu')
  assert.equal(await knop.getAttribute('aria-expanded'), 'false')
  assert.equal(await page.locator('main').getAttribute('inert'), null)
  await page.close()
})

test('menu: navigatielink sluit het menu en springt naar het anker', async () => {
  const { page } = await open()
  await page.locator('#open-menu').press('Enter')
  await page.waitForSelector('#main-menu.open')
  const labels = await page.locator('.menu-list a').allTextContents()
  assert.deepEqual(labels, ['Home', 'Diensten', 'Over ons', 'Inzichten', 'Contact'])
  await page.locator('.menu-list a', { hasText: 'Diensten' }).click()
  await page.waitForFunction(() => !document.getElementById('main-menu').classList.contains('open'))
  await page.waitForFunction(() => location.hash === '#diensten')
  await page.close()
})

test('diensten: hover en toetsenbordfocus tonen alle vijf punten', async () => {
  const { page } = await open({ reducedMotion: 'reduce' })
  const kaart = page.locator('.service-card').first()
  const punten = kaart.locator('.service-point')
  assert.equal(await punten.count(), 5)
  const opac = () => kaart.locator('.service-desc').evaluate((e) => getComputedStyle(e).opacity)
  assert.equal(await opac(), '0')
  await kaart.hover()
  await page.waitForTimeout(50)
  assert.equal(await opac(), '1')
  const bg = await kaart.evaluate((e) => getComputedStyle(e).backgroundColor)
  assert.equal(bg, 'rgb(177, 249, 225)', 'kaart vult mint')
  await page.mouse.move(0, 0)
  await kaart.focus()
  await page.waitForTimeout(50)
  assert.equal(await opac(), '1')
  await page.close()
})

test('touchscherm: de vijf punten zijn zonder hover zichtbaar', async () => {
  const { page } = await open({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' })
  const opac = await page.locator('.service-desc').first().evaluate((e) => getComputedStyle(e).opacity)
  assert.equal(opac, '1')
  await page.close()
})

test('hero: wisselt alleen de laatste regel, zonder hoogteverandering', async () => {
  const { page } = await open()
  const items = await page.locator('.rotate-item').allTextContents()
  assert.deepEqual(items, ['AI Workspace.', 'AI Launch Check.', 'AI Guidance.', 'AI Support.'])
  const h1 = page.locator('h1')
  const voor = (await h1.boundingBox()).height
  await page.waitForFunction(() => document.querySelector('.rotate-item.is-active')?.textContent === 'AI Launch Check.', null, { timeout: 6000 })
  const na = (await h1.boundingBox()).height
  assert.equal(voor, na)
  await page.close()
})

test('reduced motion: geen wisseling, reveal-elementen direct zichtbaar', async () => {
  const { page } = await open({ reducedMotion: 'reduce' })
  await page.waitForTimeout(4200)
  assert.equal(await page.locator('.rotate-item.is-active').textContent(), 'AI Workspace.')
  const opac = await page.locator('[data-reveal]').last().evaluate((e) => getComputedStyle(e).opacity)
  assert.equal(opac, '1')
  await page.close()
})

test('zonder JavaScript: inhoud staat in de HTML, eerste term zichtbaar, formulier doet niet alsof', async () => {
  const ctx = await browser.newContext({ javaScriptEnabled: false })
  const page = await ctx.newPage()
  await page.goto(base)
  assert.equal(await page.locator('.rotate-item.is-active').isVisible(), true)
  assert.equal(await page.locator('.service-card').count(), 4)
  assert.equal(await page.locator('.no-js-only.menu-toggle').isVisible(), true)
  assert.equal(await page.locator('.form-nojs').isVisible(), true)
  assert.equal(await page.locator('.contact-form button[type=submit]').isDisabled(), true)
  await ctx.close()
})

test('artikelen 2:1:1 op desktop en kaart opent een werkende detailroute', async () => {
  const { page } = await open()
  const n = await page.locator('.article-card').count()
  if (n === 3) {
    const breedtes = await page.locator('.article-card').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width))
    assert.ok(Math.abs(breedtes[0] - 2 * breedtes[1]) < 25, `verhouding ${breedtes}`)
  }
  if (n > 0) {
    const href = await page.locator('.article-link').first().getAttribute('href')
    assert.match(href, /^\/inzichten\/[a-z0-9-]+\/$/)
    const res = await page.goto(new URL(href, base).href)
    assert.equal(res.status(), 200)
    assert.equal(await page.locator('h1').count(), 1)
  } else {
    assert.equal(await page.locator('.empty-state').isVisible(), true)
  }
  assert.equal(await page.locator('a[href="#"]').count(), 0, 'geen lege href="#"')
  await page.close()
})

test('formulier: labels aanwezig, ongeldige e-mail geeft tekstuele foutmelding', async () => {
  const { page } = await open()
  for (const id of ['f-naam', 'f-email', 'f-bedrijf', 'f-vraag']) assert.equal(await page.locator(`label[for="${id}"]`).count(), 1)
  await page.locator('#f-email').fill('geen-email')
  await page.locator('.contact-form button[type=submit]').click()
  const fout = page.locator('.form-error')
  assert.equal(await fout.isVisible(), true)
  const label = await fout.evaluate((e) => getComputedStyle(e, '::before').content)
  assert.match(label, /Fout/)
  assert.equal(await page.locator('#f-email').getAttribute('aria-invalid'), 'true')
  assert.equal(await page.locator('.form-success').isVisible(), false, 'geen nep-bevestiging')
  await page.close()
})

test('404-pagina in huisstijl', async () => {
  const page = await browser.newPage()
  const res = await page.goto(new URL('bestaat-niet/', base).href)
  assert.equal(res.status(), 404)
  assert.match(await page.locator('h1').textContent(), /bestaat niet/)
  await page.close()
})
