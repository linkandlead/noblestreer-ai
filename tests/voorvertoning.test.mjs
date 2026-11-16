import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { voorvertoning, leesLink, COOKIE } from '../src/voorvertoning.mjs'

const fixture = JSON.parse(readFileSync(new URL('../fixtures/content.json', import.meta.url), 'utf8'))
const CMS = 'https://linkandlead.nl'
const SITE = 'https://noblestreer-ai-link-and-lead.vercel.app'

// Nep-CMS: legacy content + v1 pagina met concept bij token "goed".
function nepCms({ conceptKop = 'CONCEPTKOP. Nog niet live.' } = {}) {
  const gezien = []
  const fetchImpl = async (url, init) => {
    gezien.push({ url: String(url), auth: init?.headers?.authorization })
    const u = new URL(url)
    if (u.pathname === '/api/cms/content') return Response.json(fixture)
    if (u.pathname === '/api/v1/pagina') {
      if (u.searchParams.get('voorvertoning') !== 'goed') return Response.json({ fout: 'ongeldig' }, { status: 401 })
      const home = fixture.paginas.find((p) => p.slug === (u.searchParams.get('pad') || '/'))
      const blokken = home.blokken.map((b, i) => ({ id: `b${i}`, type: b.type, bg: b.bg, gedeeld: null, inhoud: b.type === 'header' ? { ...b.content, heading: conceptKop } : b.content }))
      return Response.json({ versie: 'v1', taal: 'nl', concept: true, pagina: { slug: home.slug, titel: home.titel, beschrijving: '', type: 'landing', seo: { titel: home.titel, beschrijving: home.beschrijving, social_beeld: null, canonical: null, noindex: false }, blokken, record: null, records: {} } })
    }
    return new Response('nee', { status: 404 })
  }
  return { fetchImpl, gezien }
}
const env = (f) => ({ cmsBase: CMS, token: 'cms_testtoken', fetchImpl: f.fetchImpl })
const req = (pad, cookie) => new Request(`${SITE}${pad}`, cookie ? { headers: { cookie } } : {})

test('link lezen volgens de site-kit-regels', () => {
  assert.deepEqual(leesLink(`${SITE}/__voorvertoning?pad=/team&token=x&ingesloten=1`), { pad: '/team', token: 'x', ingesloten: true })
  assert.equal(leesLink(`${SITE}/__voorvertoning?pad=//evil&token=x`).pad, '/')
})

test('token in de link → cookie (SameSite=None; Secure; Partitioned) en 303 zonder token', async () => {
  const r = await voorvertoning(req('/__voorvertoning?pad=/&token=goed&ingesloten=1'), env(nepCms()))
  assert.equal(r.status, 303)
  assert.equal(r.headers.get('location'), '/__voorvertoning?pad=%2F&ingesloten=1')
  const c = r.headers.get('set-cookie')
  for (const deel of [`${COOKIE}=goed`, 'HttpOnly', 'Secure', 'SameSite=None', 'Partitioned', 'Path=/__voorvertoning', 'Max-Age=1800']) assert.ok(c.includes(deel), deel)
})

test('geldig concept → 200, concept zichtbaar, balk, insluitkoppen, geen X-Frame-Options, leestoken alleen serverkant', async () => {
  const cms = nepCms()
  const r = await voorvertoning(req('/__voorvertoning?pad=/', `${COOKIE}=goed`), env(cms))
  assert.equal(r.status, 200)
  const html = await r.text()
  assert.ok(html.includes('CONCEPTKOP.'))
  assert.ok(html.includes('Voorbeeld, niet gepubliceerd'))
  assert.ok(!html.includes('cms_testtoken'))
  const csp = r.headers.get('content-security-policy')
  assert.match(csp, /frame-ancestors 'self' https:\/\/cms\.linkandlead\.nl https:\/\/linkandlead\.nl/)
  assert.equal(r.headers.get('x-frame-options'), null)
  assert.equal(r.headers.get('cache-control'), 'private, no-store')
  assert.match(r.headers.get('x-robots-tag'), /noindex/)
  assert.ok(cms.gezien.some((g) => g.url.includes('/api/v1/pagina?pad=%2F&voorvertoning=goed') && g.auth === 'Bearer cms_testtoken'))
})

test('ingesloten in de editor → geen eigen balk', async () => {
  const r = await voorvertoning(req('/__voorvertoning?pad=/&ingesloten=1', `${COOKIE}=goed`), env(nepCms()))
  const html = await r.text()
  assert.ok(html.includes('CONCEPTKOP.'))
  assert.ok(!html.includes('voorvertoning-balk'))
})

test('subpagina (/team) als concept', async () => {
  const r = await voorvertoning(req('/__voorvertoning?pad=/team', `${COOKIE}=goed`), env(nepCms()))
  assert.equal(r.status, 200)
  assert.ok((await r.text()).includes('CONCEPTKOP.'))
})

test('ongeldig of geen token → gepubliceerde pagina, status 200, geen balk (nooit 404)', async () => {
  for (const cookie of [`${COOKIE}=fout`, null]) {
    const r = await voorvertoning(req('/__voorvertoning?pad=/', cookie), env(nepCms()))
    assert.equal(r.status, 200)
    const html = await r.text()
    assert.ok(!html.includes('CONCEPTKOP.'))
    assert.ok(!html.includes('voorvertoning-balk'))
    assert.ok(html.includes('<h1'))
  }
})

test('CMS onbereikbaar → nette melding, status 200', async () => {
  const kapot = { fetchImpl: async () => { throw new TypeError('fetch failed') } }
  const r = await voorvertoning(req('/__voorvertoning?pad=/', `${COOKIE}=goed`), env(kapot))
  assert.equal(r.status, 200)
  assert.match(await r.text(), /kan nu niet worden geladen/)
})
