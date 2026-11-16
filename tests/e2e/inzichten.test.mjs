import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { startServer } from '../../scripts/serve.mjs'

const { chromium } = createRequire(import.meta.url)('playwright')
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

test('/inzichten/: alle artikelen, rubriekfilter met muis en toetsenbord, geen fouten', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const fouten = []
  page.on('pageerror', (e) => fouten.push(e.message))
  const res = await page.goto(new URL('inzichten/', base).href, { waitUntil: 'networkidle' })
  assert.equal(res.status(), 200)
  assert.equal(await page.locator('h1').count(), 1)
  const zichtbaar = () => page.locator('.article-cel:not([hidden])').count()
  assert.equal(await zichtbaar(), 6)
  await page.locator('.filter-knop', { hasText: 'Kwaliteit' }).click()
  assert.equal(await zichtbaar(), 2)
  assert.equal(await page.locator('.filter-knop', { hasText: 'Kwaliteit' }).getAttribute('aria-pressed'), 'true')
  await page.locator('.filter-knop', { hasText: 'Alle' }).focus()
  await page.keyboard.press('Enter')
  assert.equal(await zichtbaar(), 6)
  const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth])
  assert.ok(sw <= iw)
  assert.deepEqual(fouten, [])
  await page.close()
})

test('homepage linkt naar het overzicht; artikelpagina terug naar het overzicht', async () => {
  const page = await browser.newPage()
  await page.goto(base)
  assert.equal(await page.locator('#inzichten .section-heading a').getAttribute('href'), '/inzichten/')
  const href = await page.locator('.article-link').first().getAttribute('href')
  await page.goto(new URL(href, base).href)
  assert.equal(await page.locator('.back-link').getAttribute('href'), '/inzichten/')
  await page.close()
})

test('zonder JavaScript: geen filterknoppen, wel alle artikelen', async () => {
  const ctx = await browser.newContext({ javaScriptEnabled: false })
  const page = await ctx.newPage()
  await page.goto(new URL('inzichten/', base).href)
  assert.equal(await page.locator('.article-filter').isVisible(), false)
  assert.equal(await page.locator('.article-cel').count(), 6)
  await ctx.close()
})
