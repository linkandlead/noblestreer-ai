// Voorvertoning ("Voorbeeld op de site" in One Studio), volgens linkandlead-cms docs/bouwwijze.md §6.3.
//
//   GET /__voorvertoning?pad=/team&token=<kortlevend voorvertoningstoken>[&ingesloten=1]
//
// - De site kent geen geheim: ze vraagt het CONCEPT op bij het CMS met haar leestoken (serverkant) plus het
//   token uit de link: GET {CMS_BASE}/api/v1/pagina?pad=…&voorvertoning=<token>. Alleen als het CMS
//   `concept: true` teruggeeft, tonen we het concept (met de balk "Voorbeeld, niet gepubliceerd").
// - Zonder (geldig) token: gewoon de gepubliceerde pagina, status 200 — nooit een 404 op de route zelf.
// - Insluiten in de editor (B-110): op deze route (en alleen hier) `frame-ancestors 'self' <CMS>` en GEEN
//   X-Frame-Options; bij `ingesloten=1` geen eigen balk (de editor heeft er al een).
// - Het token gaat in een kortlevend cookie (SameSite=None; Secure; Partitioned), zodat het ook in een
//   iframe werkt; antwoorden zijn altijd `private, no-store` en `noindex`.
// - Klikken en typen in het echte ontwerp (B-115, B-127, site-kit 1.21): alleen bij een geldig concept én
//   `ingesloten=1` krijgt elke sectie `data-cms-sectie="<blok-id>"` en staat voorvertoningKlikken als inline script
//   onderaan de pagina. De CSP staat precies dat script toe met zijn sha256 (geen 'unsafe-inline'). Berichten gaan
//   alleen naar de origin van de editor (CMS_BEHEER_URL, standaard https://cms.linkandlead.nl).

import { haalContent } from './lib/cms/client.mjs'
import { normaliseer, paginaSlugs } from './lib/cms/normalize.mjs'
import { homeHtml } from './render/page.mjs'
import { esc } from './render/html.mjs'
import { klikScript } from './voorvertoningklikken.mjs'
import { createHash } from 'node:crypto'

export const COOKIE = 'nobl_voorvertoning'
const MAX_LEEFTIJD = 30 * 60

// Origins die de voorvertoning mogen insluiten: het CMS (beheeradres en het oude adres).
export function cmsOrigins(cmsBase) {
  const uit = new Set(['https://cms.linkandlead.nl', 'https://linkandlead.nl'])
  try {
    const u = new URL(cmsBase)
    if (u.protocol === 'https:') uit.add(u.origin)
  } catch {
    /* ongeldig adres: alleen de vaste origins */
  }
  return [...uit]
}

// De origin van de editor van het CMS: het enige doel van de berichten van het klikscript.
export const STANDAARD_EDITOR = 'https://cms.linkandlead.nl'

// scriptHash: de sha256 van het inline klikscript (alleen in het ingesloten voorbeeld), anders geen inline script.
export function voorvertoningHeaders(cmsBase, { scriptHash = null } = {}) {
  const fa = `frame-ancestors 'self' ${cmsOrigins(cmsBase).join(' ')}`
  const hash = scriptHash ? ` 'sha256-${scriptHash}'` : ''
  return {
    'content-type': 'text/html; charset=utf-8',
    'content-security-policy': `default-src 'self'; script-src 'self' https://linkandlead.nl${hash}; style-src 'self'; img-src 'self' data: https://mucwwqjctynklovacwbv.supabase.co; font-src 'self'; connect-src 'self' https://linkandlead.nl; form-action 'self'; base-uri 'self'; object-src 'none'; ${fa}`,
    'cache-control': 'private, no-store',
    'x-robots-tag': 'noindex, nofollow',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'x-content-type-options': 'nosniff',
  }
}

// Zelfde regels als leesVoorvertoningsUrl uit de site-kit.
export function leesLink(url) {
  const u = new URL(url)
  const pad = u.searchParams.get('pad') || '/'
  const token = u.searchParams.get('token') ?? u.searchParams.get('voorvertoning')
  const ingesloten = u.searchParams.get('ingesloten') === '1'
  const geldigPad = pad.startsWith('/') && !pad.startsWith('//') && pad.length <= 300
  return { pad: geldigPad ? pad : '/', token: token && token.length <= 2000 ? token : null, ingesloten }
}

function leesCookie(request, naam) {
  const kop = request.headers.get('cookie') || ''
  for (const deel of kop.split(';')) {
    const [k, ...v] = deel.trim().split('=')
    if (k === naam) return decodeURIComponent(v.join('='))
  }
  return null
}

// CMS-pad '/team/' of '/team' → slug '/team'.
function slugVoor(pad) {
  const p = pad.split(/[?#]/)[0].replace(/\/+$/, '')
  return p === '' ? '/' : p
}

// PaginaV1 (lees-API v1) → de vorm die normalize.mjs leest (gelijk aan /api/cms/content).
export function paginaV1NaarContent(site, v1) {
  const p = v1.pagina
  return {
    ok: true,
    site,
    paginas: [
      {
        slug: p.slug,
        titel: p.seo?.titel || p.titel,
        beschrijving: p.seo?.beschrijving || p.beschrijving || '',
        og_beeld: p.seo?.social_beeld ?? null,
        blokken: (p.blokken || []).map((b) => ({ ...(typeof b.id === 'string' ? { id: b.id } : {}), type: b.type, bg: b.bg, content: b.inhoud || {} })),
      },
    ],
    records: p.records || {},
  }
}

function balk(pad) {
  return `<div class="voorvertoning-balk" role="status"><span>Voorbeeld, niet gepubliceerd</span><a href="${esc(pad)}">Voorbeeld sluiten</a></div>`
}

function maakCtx(model, opties) {
  const contact = model.secties.find((s) => s.soort === 'contact')
  return {
    model,
    site: model.site,
    rotatie: model.rotatie,
    isHome: false,
    heeftFormulier: Boolean(contact?.formulier),
    contactLink: contact?.cta?.cta ?? model.site.actie ?? null,
    opties,
  }
}

/**
 * @param {Request} request
 * @param {{ cmsBase: string, token?: string, siteId?: string, versie?: string, editorUrl?: string, fetchImpl?: typeof fetch }} env
 * @returns {Promise<Response>}
 */
export async function voorvertoning(request, env) {
  const fetchImpl = env.fetchImpl ?? fetch
  const headers = voorvertoningHeaders(env.cmsBase)
  const link = leesLink(request.url)
  const base = env.cmsBase.replace(/\/$/, '')

  // Token uit de link → cookie, en door naar dezelfde route zonder token in de URL (303).
  if (link.token) {
    const doel = new URL(request.url)
    doel.searchParams.delete('token')
    doel.searchParams.delete('voorvertoning')
    const cookie = `${COOKIE}=${encodeURIComponent(link.token)}; Path=/__voorvertoning; Max-Age=${MAX_LEEFTIJD}; HttpOnly; Secure; SameSite=None; Partitioned`
    return new Response(null, { status: 303, headers: { ...headers, location: doel.pathname + doel.search, 'set-cookie': cookie } })
  }

  const token = leesCookie(request, COOKIE)
  const slug = slugVoor(link.pad)
  // Gepubliceerde site-instellingen (merk, navigatie, kleuren) en records komen uit de bestaande lees-API.
  let gepubliceerd = null
  try {
    gepubliceerd = await haalContent({ base, token: env.token, fetchImpl })
  } catch {
    gepubliceerd = null
  }

  let rauw = gepubliceerd
  let concept = false
  let conceptBlokken = []
  if (token && gepubliceerd) {
    try {
      const res = await fetchImpl(`${base}/api/v1/pagina?pad=${encodeURIComponent(slug)}&voorvertoning=${encodeURIComponent(token)}`, {
        headers: { authorization: `Bearer ${env.token}` },
      })
      if (res.ok) {
        const v1 = await res.json()
        if (v1 && v1.concept === true && v1.pagina) {
          const eigen = paginaV1NaarContent(gepubliceerd.site, v1)
          eigen.records = { ...(gepubliceerd.records || {}), ...(eigen.records || {}) }
          rauw = eigen
          concept = true
          conceptBlokken = Array.isArray(v1.pagina.blokken) ? v1.pagina.blokken : []
        }
      }
    } catch {
      /* CMS onbereikbaar of ongeldig token: gepubliceerde versie tonen */
    }
  }

  if (!rauw) {
    const fout = '<!DOCTYPE html><html lang="nl"><meta charset="utf-8"><title>Voorbeeld</title><body style="font-family:sans-serif;background:#052824;color:#B1F9E1;padding:40px">Het voorbeeld kan nu niet worden geladen. Probeer het zo opnieuw.</body></html>'
    return new Response(fout, { status: 200, headers })
  }

  let model = normaliseer(rauw, { slug })
  const opPad = Boolean(model.pagina)
  if (!model.pagina && slug !== '/') model = normaliseer(rauw, { slug: '/' })
  // Klikken en typen: alleen in de editor (ingesloten) en alleen op het concept van deze pagina.
  const script = concept && link.ingesloten && opPad ? klikScript(env.editorUrl || STANDAARD_EDITOR, conceptBlokken) : ''
  const ctx = maakCtx(model, {
    cmsBase: base,
    siteId: '',
    versie: env.versie || 'vv',
    indexeren: false,
    klikken: Boolean(script),
  })
  ctx.isHome = model.pagina?.slug === '/'
  ctx.inzichtenPad = paginaSlugs(gepubliceerd ?? rauw).includes('/inzichten') ? '/inzichten/' : null
  let html = homeHtml(ctx)
  if (concept && !link.ingesloten) html = html.replace('<body>', `<body class="met-voorvertoning-balk">\n  ${balk(slug === '/' ? '/' : `${slug}/`)}`)
  if (script) {
    const eind = html.lastIndexOf('</body>')
    const tag = `<script>${script}</script>\n`
    html = eind >= 0 ? html.slice(0, eind) + tag + html.slice(eind) : html + tag
    const scriptHash = createHash('sha256').update(script, 'utf8').digest('base64')
    return new Response(html, { status: 200, headers: voorvertoningHeaders(env.cmsBase, { scriptHash }) })
  }
  return new Response(html, { status: 200, headers })
}
