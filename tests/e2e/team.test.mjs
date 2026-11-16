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

for (const width of [375, 768, 1440]) {
  test(`/team/ op ${width}px: 6 teamleden, één h1, geen horizontale scroll, geen fouten`, async () => {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const fouten = []
    page.on('pageerror', (e) => fouten.push(e.message))
    page.on('console', (m) => m.type() === 'error' && fouten.push(m.text()))
    const res = await page.goto(new URL('team/', base).href, { waitUntil: 'networkidle' })
    assert.equal(res.status(), 200)
    assert.equal(await page.locator('h1').count(), 1)
    assert.equal(await page.locator('.team-member').count(), 6)
    const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth])
    assert.ok(sw <= iw)
    assert.deepEqual(fouten, [])
    await page.close()
  })
}
