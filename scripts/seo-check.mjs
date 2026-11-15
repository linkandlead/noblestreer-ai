#!/usr/bin/env node
// SEO-/crawler-basiscontrole voor een HEADLESS klant-frontend (Model A), vóór livegang.
//
// Waarom: het CMS levert de content als gestructureerde velden; een eigen frontend bakt daar HTML
// van. Wíj kunnen niet afdwingen dat die HTML semantisch en server-gerenderd is. AI-crawlers
// (ChatGPT, Perplexity) én Google's eerste pass voeren vaak GEEN JavaScript uit — staat de basis
// niet in de rauwe HTML, dan is de pagina voor hen een inhoudsopgave zonder inhoud.
//
// Dit script doet precies de "view-source"-test uit de opdracht: het haalt de pagina ZONDER JS op
// (gewone fetch) en controleert de harde basis. Het is bewust frontend-agnostisch — het leest
// alleen de HTML, dus het werkt op elke headless site, ongeacht de techniek.
//
// Gebruik:
//   node scripts/seo-basis-check.mjs https://preview-url/ [https://preview-url/tweede-pagina ...]
//
// Exit 0 = alle harde checks slagen op alle pagina's. Exit 1 = minstens één harde check faalt.
// Exit 2 = verkeerd gebruik (geen URL meegegeven).

const urls = process.argv.slice(2).filter((a) => /^https?:\/\//.test(a))
if (urls.length === 0) {
  console.error('[seo-basis] Geef minstens één URL mee, bv.:')
  console.error('  node scripts/seo-basis-check.mjs https://mijn-site.vercel.app/ https://mijn-site.vercel.app/over-ons')
  process.exit(2)
}

// Zichtbare tekst uit de rauwe HTML halen (script/style eruit, tags strippen). Een (bijna) lege
// uitkomst betekent een SPA-shell die pas ná JavaScript vult — precies wat een crawler niet ziet.
function zichtbareTekst(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const MIN_TEKST = 200 // tekens zichtbare tekst zonder JS; minder = vermoedelijk lege SPA-shell

async function checkPagina(url) {
  let html
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; LL-SEO-basis-check)' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return { url, fouten: [`HTTP ${res.status} — pagina niet opgehaald`], waarschuwingen: [] }
    html = await res.text()
  } catch (e) {
    return { url, fouten: [`Niet bereikbaar: ${e.message}`], waarschuwingen: [] }
  }

  const tel = (re) => (html.match(re) ?? []).length
  const titelMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const titel = titelMatch ? zichtbareTekst(titelMatch[1]) : ''
  const h1n = tel(/<h1[\s>]/gi)
  const tekstlengte = zichtbareTekst(html).length

  const fouten = []
  const waarschuwingen = []

  // Harde basis (faalt de livegang-check):
  if (!titel) fouten.push('geen niet-lege <title>')
  if (tel(/<title[^>]*>/gi) > 1) fouten.push(`${tel(/<title[^>]*>/gi)} <title>-tags (moet precies 1)`)
  if (!/<link\s[^>]*rel=["']canonical["']/i.test(html)) fouten.push('geen <link rel="canonical">')
  if (!/<meta\s[^>]*name=["']description["'][^>]*content=/i.test(html)) fouten.push('geen <meta name="description"> met inhoud')
  if (!/<main[\s>]/i.test(html)) fouten.push('geen <main>-landmark')
  if (h1n === 0) fouten.push('geen <h1>')
  else if (h1n > 1) fouten.push(`${h1n} <h1>-tags (moet precies 1)`)
  if (tekstlengte < MIN_TEKST)
    fouten.push(`slechts ${tekstlengte} tekens zichtbare tekst zónder JS — vermoedelijk een lege SPA-shell (crawlers zien geen inhoud)`)

  // Aanbevolen (waarschuwing, geen blokkade):
  if (!/application\/ld\+json/i.test(html)) waarschuwingen.push('geen JSON-LD (structured data)')
  if (!/<nav[\s>]/i.test(html)) waarschuwingen.push('geen <nav>-landmark')
  if (!/<footer[\s>]/i.test(html)) waarschuwingen.push('geen <footer>-landmark')

  return { url, titel, h1n, tekstlengte, fouten, waarschuwingen }
}

const resultaten = await Promise.all(urls.map(checkPagina))

let faalt = false
for (const r of resultaten) {
  console.log('')
  console.log(`▸ ${r.url}`)
  if (r.titel) console.log(`  title: "${r.titel}"${r.h1n != null ? `  ·  ${r.h1n}× <h1>  ·  ${r.tekstlengte} tekens tekst` : ''}`)
  if (r.fouten.length === 0) {
    console.log('  ✓ SEO-basis op orde (title, canonical, description, <main>, één <h1>, content zonder JS)')
  } else {
    faalt = true
    for (const f of r.fouten) console.log(`  ✗ ${f}`)
  }
  for (const w of r.waarschuwingen) console.log(`  ⚠ ${w}`)
}

console.log('')
if (faalt) {
  console.error('[seo-basis] NIET op orde — los de ✗-punten op vóór livegang.')
  process.exit(1)
}
console.log('[seo-basis] Alle harde checks geslaagd. ✓')
process.exit(0)
