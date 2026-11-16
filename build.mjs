// Build: CMS-content (Link & Lead One) → statische, server-gerenderde Noblestreet AI-site in dist/.
//
// Koppeling (model A, headless): bij elke build haalt dit script de GEPUBLICEERDE content op via
// GET {CMS_BASE}/api/cms/content met het site-gescopete token. Publiceren in One Studio vuurt de
// Deploy Hook van deze site (sites.config.deploy_hook) → Vercel bouwt opnieuw → wijziging staat live.
//
//   CMS_TOKEN=cms_… SITE_ID=… node build.mjs      echte koppeling
//   CMS_FIXTURE=1 node build.mjs                   lokale ontwikkeling/tests met fixtures/content.json
//
// Is het CMS onbereikbaar, dan FAALT de build bewust (exit 1): Vercel laat dan de laatste goede
// deployment live staan — er komt nooit een lege of verzonnen site online.

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { haalContent, CmsFout } from './src/lib/cms/client.mjs'
import { normaliseer, paginaSlugs } from './src/lib/cms/normalize.mjs'
import { artikelHtml, homeHtml, nietGevondenHtml, onderhoudHtml } from './src/render/page.mjs'

laadEnv('.env')

const CMS_BASE = (process.env.CMS_BASE || 'https://linkandlead.nl').replace(/\/$/, '')
const FIXTURE = process.env.CMS_FIXTURE ? process.env.CMS_FIXTURE_PAD || 'fixtures/content.json' : null
const UIT = process.env.OUT_DIR || 'dist'

if (FIXTURE && process.env.VERCEL_ENV === 'production') {
  console.error('✗ CMS_FIXTURE is niet toegestaan in een productiebuild.')
  process.exit(1)
}

let rauw
try {
  rauw = await haalContent({ base: CMS_BASE, token: process.env.CMS_TOKEN, fixture: FIXTURE })
} catch (e) {
  console.error(`✗ ${e instanceof CmsFout ? e.message : e}`)
  console.error('  De build stopt; de vorige deployment blijft live (geen lege of verzonnen site).')
  process.exit(1)
}

const model = normaliseer(rauw)
for (const w of model.waarschuwingen) console.warn(`! ${w}`)

const SITE_ID = process.env.SITE_ID || ''
if (SITE_ID && !/^[0-9a-f-]{36}$/i.test(SITE_ID)) {
  console.error('✗ SITE_ID heeft geen geldig UUID-formaat.')
  process.exit(1)
}

const css = readFileSync('src/styles/tokens.css', 'utf8') + '\n' + genereerCss(model) + '\n' + readFileSync('src/styles/site.css', 'utf8')
const js = readFileSync('public/site.js', 'utf8')
const versie = createHash('sha256').update(css + js).digest('hex').slice(0, 10)

const contactSectie = model.secties.find((s) => s.soort === 'contact')
const ctx = {
  model,
  site: model.site,
  rotatie: model.rotatie,
  isHome: true,
  heeftFormulier: Boolean(contactSectie?.formulier),
  // Secundaire tekstlinks (diensten-voet, artikelkop, footer) gebruiken de knop van de gedeelde
  // Afsluitende oproep; anders de primaire actie uit Site > Navigatie.
  contactLink: contactSectie?.cta?.cta ?? model.site.actie ?? null,
  // Overzichtspagina met alle artikelen, als die in het CMS gepubliceerd is (pagina /inzichten).
  inzichtenPad: paginaSlugs(rauw).includes('/inzichten') ? '/inzichten/' : null,
  opties: {
    cmsBase: CMS_BASE,
    // Bij fixture-builds alleen met expliciete E2E_SITE_ID (browsertest van de lead-SDK, endpoint gemockt).
    siteId: FIXTURE ? process.env.E2E_SITE_ID || '' : SITE_ID,
    versie,
    // Indexeren alleen expliciet aanzetten (INDEXEREN=ja) zodra het echte domein gekoppeld is.
    indexeren: process.env.INDEXEREN === 'ja',
  },
}

rmSync(UIT, { recursive: true, force: true })
mkdirSync(UIT, { recursive: true })
cpSync('public', UIT, { recursive: true })
writeFileSync(`${UIT}/site.css`, css)

if (model.pagina && model.secties.length) {
  writeFileSync(`${UIT}/index.html`, homeHtml(ctx))
} else {
  console.warn('! Geen gepubliceerde homepage in het CMS: nette onderhoudspagina gerenderd.')
  writeFileSync(`${UIT}/index.html`, onderhoudHtml(ctx))
}

const subCtx = { ...ctx, isHome: false, heeftFormulier: false }
const paden = ['/']

// Overige gepubliceerde CMS-pagina's (bv. /team) — elk met eigen secties uit haar blokken.
for (const slug of paginaSlugs(rauw).filter((sl) => sl !== '/')) {
  const sub = normaliseer(rauw, { slug })
  for (const w of sub.waarschuwingen) console.warn(`! [${slug}] ${w}`)
  if (!sub.pagina || !sub.secties.length) continue
  const subContact = sub.secties.find((s) => s.soort === 'contact')
  const pctx = {
    ...ctx,
    model: sub,
    rotatie: sub.rotatie,
    isHome: false,
    heeftFormulier: Boolean(subContact?.formulier),
    contactLink: subContact?.cta?.cta ?? ctx.contactLink,
  }
  mkdirSync(`${UIT}${slug}`, { recursive: true })
  writeFileSync(`${UIT}${slug}/index.html`, homeHtml(pctx))
  paden.push(`${slug}/`)
}
for (const a of model.artikelen) {
  mkdirSync(`${UIT}/inzichten/${a.slug}`, { recursive: true })
  writeFileSync(`${UIT}/inzichten/${a.slug}/index.html`, artikelHtml(subCtx, a))
  paden.push(`/inzichten/${a.slug}/`)
}
writeFileSync(`${UIT}/404.html`, nietGevondenHtml(subCtx))

// robots.txt + sitemap.xml
const basis = model.site.domein ? `https://${model.site.domein}` : ''
writeFileSync(
  `${UIT}/robots.txt`,
  ctx.opties.indexeren ? `User-agent: *\nAllow: /\n${basis ? `Sitemap: ${basis}/sitemap.xml\n` : ''}` : 'User-agent: *\nDisallow: /\n',
)
if (basis) {
  const urls = paden.map((p) => `  <url><loc>${basis}${p}</loc></url>`).join('\n')
  writeFileSync(`${UIT}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
}

// Alleen ter controle/debug: de genormaliseerde content (bevat geen geheimen).
writeFileSync(`${UIT}/content.json`, JSON.stringify({ bron: FIXTURE ? 'fixture' : 'cms', opgehaald: new Date().toISOString(), model }, null, 2))

console.log(
  `✓ ${FIXTURE ? 'FIXTURE' : 'CMS'}: "${model.site.naam}" — ${model.secties.length} secties, ${paden.length - model.artikelen.length} pagina('s), ${model.artikelen.length} gepubliceerde artikel(en) → ${UIT}/`,
)

// Focuspunt van de hero (CMS-velden focal_x/focal_y) als CSS-variabele — geen inline styles (CSP).
function genereerCss(m) {
  const kleuren = `:root{--dark:${m.site.kleuren.dark};--mint:${m.site.kleuren.mint}}`
  const hero = m.secties.find((s) => s.soort === 'hero')
  const focus = hero ? `.hero-photo{--focus-x:${hero.focus.x}%;--focus-y:${hero.focus.y}%}` : ''
  return `/* gegenereerd uit CMS */\n${kleuren}\n${focus}`
}

function laadEnv(bestand) {
  if (!existsSync(bestand)) return
  for (const regel of readFileSync(bestand, 'utf8').split('\n')) {
    const m = regel.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
