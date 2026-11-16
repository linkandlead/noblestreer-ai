import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { voorvertoning, leesLink, COOKIE } from '../src/voorvertoning.mjs'
import { klikScript, voorvertoningKlikken } from '../src/voorvertoningklikken.mjs'

const fixture = JSON.parse(readFileSync(new URL('../fixtures/content.json', import.meta.url), 'utf8'))
const CMS = 'https://linkandlead.nl'
const SITE = 'https://noblestreer-ai-link-and-lead.vercel.app'

// Nep-CMS: legacy content + v1 pagina met concept bij token "goed".
function nepCms({ conceptKop = 'CONCEPTKOP. Nog niet live.', id = (i) => `b${i}` } = {}) {
  const gezien = []
  const fetchImpl = async (url, init) => {
    gezien.push({ url: String(url), auth: init?.headers?.authorization })
    const u = new URL(url)
    if (u.pathname === '/api/cms/content') return Response.json(fixture)
    if (u.pathname === '/api/v1/pagina') {
      if (u.searchParams.get('voorvertoning') !== 'goed') return Response.json({ fout: 'ongeldig' }, { status: 401 })
      const home = fixture.paginas.find((p) => p.slug === (u.searchParams.get('pad') || '/'))
      const blokken = home.blokken.map((b, i) => ({ id: id(i), type: b.type, bg: b.bg, gedeeld: null, inhoud: b.type === 'header' ? { ...b.content, heading: conceptKop } : b.content }))
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

// Klikken en typen in het echte ontwerp (linkandlead-cms B-115, B-127, site-kit 1.21)
const uuid = (i) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`
const scriptUit = (html) => /<script>(\(function voorvertoningKlikken[\s\S]*?)<\/script>/.exec(html)?.[1] ?? null

test('ingesloten met geldig concept → data-cms-sectie per blok, het klikscript en zijn sha256 in de CSP', async () => {
  const r = await voorvertoning(req('/__voorvertoning?pad=/&ingesloten=1', `${COOKIE}=goed`), env(nepCms({ id: uuid })))
  const html = await r.text()
  assert.match(html, new RegExp(`<section[^>]* data-cms-sectie="${uuid(0)}"`))
  const script = scriptUit(html)
  assert.ok(script, 'klikscript staat in de pagina')
  assert.ok(script.includes('"cmsUrl":"https://cms.linkandlead.nl","ingesloten":true,"velden":{'))
  assert.ok(script.includes('CONCEPTKOP. Nog niet live.'), 'de tekstvelden van het concept gaan mee')
  const csp = r.headers.get('content-security-policy')
  const hash = createHash('sha256').update(script, 'utf8').digest('base64')
  assert.ok(csp.includes(`script-src 'self' https://linkandlead.nl 'sha256-${hash}'`), csp)
  assert.ok(!csp.includes('unsafe-inline'))
  assert.match(csp, /frame-ancestors 'self' https:\/\/cms\.linkandlead\.nl/)
})

test('zonder ingesloten, zonder geldig concept of op de gewone site: geen data-cms-sectie en geen klikscript', async () => {
  for (const [pad, cookie] of [['/__voorvertoning?pad=/', `${COOKIE}=goed`], ['/__voorvertoning?pad=/&ingesloten=1', `${COOKIE}=fout`], ['/__voorvertoning?pad=/&ingesloten=1', null]]) {
    const r = await voorvertoning(req(pad, cookie), env(nepCms({ id: uuid })))
    const html = await r.text()
    assert.ok(!html.includes('data-cms-'), `${pad} ${cookie}`)
    assert.ok(!html.includes('cms-voorbeeld'), `${pad} ${cookie}`)
    assert.ok(!r.headers.get('content-security-policy').includes('sha256-'))
  }
})

test('klikscript: inhoud kan het script niet afsluiten; alleen een https-editor', () => {
  const s = klikScript('https://cms.linkandlead.nl/admin', [{ id: uuid(0), inhoud: { titel: '</script><script>alert(1)</script>' } }])
  assert.ok(!s.includes('</script>'))
  assert.equal(klikScript('http://cms.example', []), '')
  assert.equal(klikScript('geen url', []), '')
})

test('klikscript als losse code: klaar-bericht, typen na een selectie van de CMS-origin, Escape zet terug', () => {
  const CMS = 'https://cms.linkandlead.nl'
  const berichten = [], klikken = [], berichtLuisteraars = [], luister = {}
  const sectie = { getAttribute: (n) => (n === 'data-cms-sectie' ? uuid(0) : null), closest(sel) { return sel.includes('data-cms-sectie') ? this : null }, contains: () => true }
  const veld = {
    getAttribute: (n) => (n === 'data-cms-veld' ? 'titel' : null),
    closest(sel) { return sel.includes('data-cms-veld') ? this : sectie.closest(sel) },
    textContent: 'Kop', childElementCount: 0, contentEditable: 'inherit',
    addEventListener: (t, f) => { luister[t] = f }, removeEventListener: (t) => { delete luister[t] }, focus() {},
  }
  const w = {
    location: { search: '?ingesloten=1' },
    document: { addEventListener: (t, f) => klikken.push(f), removeEventListener() {}, querySelectorAll: () => [veld] },
    addEventListener: (t, f) => berichtLuisteraars.push(f), removeEventListener() {},
    parent: { postMessage: (b, doel) => berichten.push({ b, doel }) },
  }
  new Function('window', klikScript(CMS, []))(w)
  assert.deepEqual(berichten.shift(), { doel: CMS, b: { bron: 'cms-voorbeeld', soort: 'klaar' } })
  const e = { target: veld, button: 0, gevolgd: true, preventDefault() { e.gevolgd = false }, stopPropagation() {} }
  klikken[0](e)
  assert.equal(e.gevolgd, false)
  assert.equal(berichten.shift().b.typbaar, true)
  const menu = { target: { getAttribute: () => null, closest: (s) => (s === 'a[href]' ? {} : null) }, button: 0, gevolgd: true, preventDefault() { menu.gevolgd = false }, stopPropagation() {} }
  klikken[0](menu)
  assert.equal(menu.gevolgd, false, 'een link buiten een sectie opent geen andere pagina')
  const selectie = { bron: 'cms-editor', soort: 'selectie', geselecteerd: uuid(0), pad: ['titel'], typen: 1 }
  berichtLuisteraars[0]({ origin: 'https://kwaad.example', data: selectie })
  assert.equal(veld.contentEditable, 'inherit')
  berichtLuisteraars[0]({ origin: CMS, data: selectie })
  veld.textContent = 'Kop nieuw'
  luister.input({})
  assert.deepEqual(berichten.shift(), { doel: CMS, b: { bron: 'cms-voorbeeld', soort: 'tekst', sectieId: uuid(0), pad: ['titel'], waarde: 'Kop nieuw', typen: 1 } })
  luister.keydown({ key: 'Escape', preventDefault() {} })
  assert.equal(veld.textContent, 'Kop')
  assert.equal(veld.contentEditable, 'false')
  assert.equal(typeof voorvertoningKlikken, 'function')
})
