import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  formatteerMaand,
  normaliseer,
  normaliseerArtikelen,
  parseKaartTekst,
  splitKop,
  splitZinnen,
  veiligeAfbeelding,
  veiligeHref,
} from '../src/lib/cms/normalize.mjs'
import { homeHtml, artikelHtml } from '../src/render/page.mjs'

const fixture = JSON.parse(readFileSync(new URL('../fixtures/content.json', import.meta.url), 'utf8'))
const kopie = () => structuredClone(fixture)
const blok = (d, type) => d.paginas[0].blokken.find((b) => b.type === type)

function ctxVoor(model) {
  const contact = model.secties.find((s) => s.soort === 'contact')
  return {
    model,
    site: model.site,
    rotatie: model.rotatie,
    isHome: true,
    heeftFormulier: Boolean(contact?.formulier),
    contactLink: contact?.cta?.cta ?? model.site.actie,
    opties: { cmsBase: 'https://linkandlead.nl', siteId: '43419df5-06b4-437a-9632-fd3f242a8364', versie: 'test', indexeren: false },
  }
}

test('hrefs: alleen ankers, interne paden, https, mailto en tel', () => {
  assert.equal(veiligeHref('#diensten'), '#diensten')
  assert.equal(veiligeHref('/inzichten/x/'), '/inzichten/x/')
  assert.equal(veiligeHref('https://example.nl/a'), 'https://example.nl/a')
  assert.equal(veiligeHref('mailto:a@b.nl'), 'mailto:a@b.nl')
  assert.equal(veiligeHref('javascript:alert(1)'), null)
  assert.equal(veiligeHref('JaVaScRiPt:alert(1)'), null)
  assert.equal(veiligeHref('data:text/html,x'), null)
  assert.equal(veiligeHref('//evil.com'), null)
  assert.equal(veiligeHref('http://onveilig.nl'), null)
  assert.equal(veiligeHref('#'), null, 'geen lege href="#"')
  assert.equal(veiligeAfbeelding('javascript:x'), null)
})

test('kaarttekst: beschrijving + maximaal vijf punten', () => {
  const r = parseKaartTekst('Korte uitleg.\n- een\n- twee\n• drie\n* vier\n- vijf\n- zes')
  assert.equal(r.beschrijving, 'Korte uitleg.')
  assert.deepEqual(r.punten, ['een', 'twee', 'drie', 'vier', 'vijf'])
  assert.equal(r.puntenAfgekapt, true)
})

test('kop en zinnen worden zoals het ontwerp over twee regels verdeeld', () => {
  assert.deepEqual(splitKop('Zelf bouwen met AI.'), ['Zelf bouwen', 'met AI.'])
  assert.deepEqual(splitKop('Kort'), ['Kort'])
  assert.deepEqual(splitKop('AI in je bedrijf. Goed geregeld.'), ['AI in je bedrijf.', 'Goed geregeld.'])
  assert.deepEqual(splitZinnen('Persoonlijk in contact. Professioneel in techniek.'), ['Persoonlijk in contact.', 'Professioneel in techniek.'])
})

test('datums in nl-NL, zonder datum geen verzonnen datum', () => {
  assert.equal(formatteerMaand('2026-11-12'), 'november 2026')
  assert.equal(formatteerMaand(null), '')
  assert.equal(formatteerMaand('gisteren'), '')
})

test('volledige fixture → zes secties in CMS-volgorde, wisseltermen uit de diensten', () => {
  const m = normaliseer(fixture)
  assert.deepEqual(m.secties.map((s) => s.soort), ['hero', 'diensten', 'logos', 'team', 'artikelen', 'contact'])
  assert.deepEqual(m.rotatie, ['AI Workspace.', 'AI Launch Check.', 'AI Guidance.', 'AI Support.'])
  const d = m.secties[1]
  assert.equal(d.items.length, 4)
  assert.ok(d.items.every((i) => i.punten.length === 5))
  assert.equal(d.items[0].punten[2], 'Rechten en veilige AI-instructies')
  assert.equal(m.site.kleuren.dark, '#052824')
  assert.equal(m.site.kleuren.mint, '#B1F9E1')
})

test('volgorde wijzigen in het CMS → volgorde én nummering volgen', () => {
  const d = kopie()
  const items = blok(d, 'kaarten').content.items
  ;[items[0], items[1]] = [items[1], items[0]]
  const m = normaliseer(d)
  const dienst = m.secties.find((s) => s.soort === 'diensten')
  assert.equal(dienst.items[0].titel, 'AI Launch Check')
  assert.equal(dienst.items[0].nummer, '01')
  assert.equal(dienst.items[1].titel, 'AI Workspace')
  assert.equal(dienst.items[1].nummer, '02')
  assert.equal(m.rotatie[0], 'AI Launch Check.')
})

test('sectie uitgeschakeld/verwijderd in het CMS → verdwijnt zonder fouten', () => {
  const d = kopie()
  d.paginas[0].blokken = d.paginas[0].blokken.filter((b) => b.type !== 'mediatekst')
  const m = normaliseer(d)
  assert.ok(!m.secties.some((s) => s.soort === 'team'))
  assert.ok(!homeHtml(ctxVoor(m)).includes('id="over-ons"'))
})

test('blokken herschikken → secties volgen de CMS-volgorde', () => {
  const d = kopie()
  const b = d.paginas[0].blokken
  const i = b.findIndex((x) => x.type === 'artikelen_grid')
  const [art] = b.splice(i, 1)
  b.splice(1, 0, art)
  assert.deepEqual(normaliseer(d).secties.map((s) => s.soort), ['hero', 'artikelen', 'diensten', 'logos', 'team', 'contact'])
})

test('0, 1, 4 en 5 dienstkaarten renderen netjes', () => {
  for (const n of [0, 1, 4, 5]) {
    const d = kopie()
    const bron = blok(fixture, 'kaarten').content.items
    blok(d, 'kaarten').content.items = [...bron, { ...bron[0], titel: 'AI Development' }].slice(0, n)
    const m = normaliseer(d)
    const html = homeHtml(ctxVoor(m))
    const kaarten = (html.match(/class="service-card"/g) ?? []).length
    assert.equal(kaarten, n)
    if (n === 0) assert.ok(!html.includes('service-stage'), 'geen lege randen bij 0 kaarten')
    else assert.ok(html.includes(`count-${n}`))
  }
})

test('meer dan vijf kaarten → maximaal vijf + waarschuwing', () => {
  const d = kopie()
  const items = blok(d, 'kaarten').content.items
  items.push({ ...items[0], titel: 'Extra 1' }, { ...items[0], titel: 'Extra 2' })
  const m = normaliseer(d)
  assert.equal(m.secties.find((s) => s.soort === 'diensten').items.length, 5)
  assert.ok(m.waarschuwingen.some((w) => w.includes('maximaal 5')))
})

test('artikelen: nieuwste eerst, maximaal 3, lege stand zonder verzonnen content', () => {
  const lijst = normaliseerArtikelen({
    artikelen: [
      { slug: 'oud', titel: 'Oud', gepubliceerd_op: '2025-01-01' },
      { slug: 'nieuw', titel: 'Nieuw', gepubliceerd_op: '2026-11-01' },
      { slug: 'ongeldig slug!', titel: 'X' },
    ],
  })
  assert.deepEqual(lijst.map((a) => a.slug), ['nieuw', 'oud'])
  const d = kopie()
  delete d.records
  const m = normaliseer(d)
  assert.equal(m.secties.find((s) => s.soort === 'artikelen').artikelen.length, 0)
  const html = homeHtml(ctxVoor(m))
  assert.ok(html.includes('class="empty-state"'))
  assert.ok(!html.includes('article-card'))
})

test('XSS: CMS-tekst wordt altijd ge-escaped, ook in JSON-LD en artikeltekst', () => {
  const d = kopie()
  blok(d, 'header').content.heading = '<img src=x onerror=alert(1)> Zelf bouwen'
  blok(d, 'header').content.cta_primair_link = 'javascript:alert(1)'
  d.site.merk.naam = 'Noble</script><script>alert(1)</script>'
  const m = normaliseer(d)
  const html = homeHtml(ctxVoor(m))
  assert.ok(!html.includes('<img src=x'))
  assert.ok(!html.includes('javascript:'))
  assert.ok(!html.includes('</script><script>alert(1)'))
  const art = artikelHtml({ ...ctxVoor(m), isHome: false }, m.artikelen[0])
  assert.ok(!art.includes('<script>alert(1)</script>'))
  assert.ok(art.includes('&lt;script&gt;'))
})

test('SEO-basis: één h1, title, description, canonical, noindex op staging', () => {
  const m = normaliseer(fixture)
  const html = homeHtml(ctxVoor(m))
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1)
  assert.match(html, /<title>Noblestreet AI \| Bouw zelf met AI\. Met technische zekerheid\.<\/title>/)
  assert.match(html, /<meta name="description" content="Noblestreet AI zet je AI-workflow professioneel op/)
  assert.match(html, /<link rel="canonical" href="https:\/\/noblestreet-ai\.vercel\.app\/">/)
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/)
  assert.ok(html.includes('<html lang="nl">'))
  assert.ok(!/fonts\.googleapis|fonts\.gstatic/.test(html), 'geen externe fontserver')
})

test('formulier: lead-SDK met publiek site_id, geen token in de HTML', () => {
  const m = normaliseer(fixture)
  const html = homeHtml(ctxVoor(m))
  assert.ok(html.includes('data-ll-lead'))
  assert.ok(html.includes('cms-client.js" data-site="43419df5-06b4-437a-9632-fd3f242a8364"'))
  assert.ok(!html.includes('cms_'), 'geen API-token in de uitvoer')
  assert.ok(html.includes('data-ll-success="Bedankt. Je aanvraag is ontvangen'))
})

test('pagina ontbreekt (CMS leeg) → geen secties, waarschuwing', () => {
  const m = normaliseer({ ok: true, site: fixture.site, paginas: [] })
  assert.equal(m.pagina, null)
  assert.equal(m.secties.length, 0)
  assert.ok(m.waarschuwingen.length > 0)
})

test("hero-USP's gaan vóór dienstnamen als wisseltermen; leeg → dienstnamen", () => {
  const d = kopie()
  blok(d, 'header').content.usps = [{ tekst: 'Veilig opgezet' }, { tekst: 'Klaar voor je klanten.' }, { tekst: '' }]
  assert.deepEqual(normaliseer(d).rotatie, ['Veilig opgezet.', 'Klaar voor je klanten.'])
  blok(d, 'header').content.usps = []
  assert.equal(normaliseer(d).rotatie[0], 'AI Workspace.')
})

test('teampagina: compacte hero, 6 teamleden met initialen, geen verzonnen foto', () => {
  const m = normaliseer(fixture, { slug: '/team' })
  assert.deepEqual(m.secties.map((s) => s.soort), ['hero', 'teamgrid', 'contact'])
  assert.equal(m.secties[0].compact, true)
  const html = homeHtml({ ...ctxVoor(m), isHome: false })
  assert.equal((html.match(/class="team-member"/g) ?? []).length, 6)
  assert.equal((html.match(/team-member-photo--leeg/g) ?? []).length, 6)
  assert.match(html, /<link rel="canonical" href="https:\/\/[^"]+\/team\/">/)
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1)
})

test('teampagina zonder gepubliceerde leden → nette lege stand', () => {
  const d = kopie()
  d.records.teamleden = []
  const html = homeHtml({ ...ctxVoor(normaliseer(d, { slug: '/team' })), isHome: false })
  assert.ok(html.includes('class="empty-state"'))
  assert.ok(!html.includes('team-member'))
})

test('logostrook: logo\'s uit het CMS, tweede kopie aria-hidden, onveilige logo\'s eruit', () => {
  const d = kopie()
  const lb = blok(d, 'logostrook')
  lb.content.items.push({ logo: 'javascript:alert(1)', alt: 'Kwaad' }, { logo: 'https://x.nl/a.png', alt: '' })
  const m = normaliseer(d)
  const s = m.secties.find((x) => x.soort === 'logos')
  assert.equal(s.items.length, 22)
  assert.deepEqual(m.secties.map((x) => x.soort).slice(0, 3), ['hero', 'diensten', 'logos'])
  const html = homeHtml(ctxVoor(m))
  assert.equal((html.match(/<ul class="logo-list" role="list" aria-hidden="true">/g) ?? []).length, 1)
  assert.ok(html.includes('alt="Claude"'))
  assert.ok(!html.includes('Kwaad'))
})

test('overzicht /inzichten: alle artikelen, gelijk raster, rubriekfilter; homepage max 3 met link naar overzicht', () => {
  const ov = normaliseer(fixture, { slug: '/inzichten' })
  const s = ov.secties.find((x) => x.soort === 'artikelen')
  assert.equal(s.artikelen.length, 6)
  assert.equal(s.overzicht, true)
  const html = homeHtml({ ...ctxVoor(ov), isHome: false, inzichtenPad: '/inzichten/' })
  assert.ok(html.includes('articles-grid--gelijk'))
  assert.equal((html.match(/class="filter-knop"/g) ?? []).length, 4, 'Alle + 3 rubrieken')
  assert.equal((html.match(/class="article-cel"/g) ?? []).length, 6)
  const home = normaliseer(fixture)
  assert.equal(home.secties.find((x) => x.soort === 'artikelen').artikelen.length, 3)
  const homeHtmlUit = homeHtml({ ...ctxVoor(home), inzichtenPad: '/inzichten/' })
  assert.ok(homeHtmlUit.includes('href="/inzichten/">Alle inzichten'))
  assert.ok(!homeHtmlUit.includes('filter-knop'))
})
