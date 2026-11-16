// Documentopbouw: <head> (SEO, canonical, OG, JSON-LD), layout en de pagina's (home, artikel, 404).
// Alles wordt server-side (build-time) als HTML gerenderd: titel, content en links staan in
// view-source zonder JavaScript (eis uit KLANT-KOPPELING.md §4).

import { attr, esc, html } from './html.mjs'
import { ArtikelKaart, ArtikelMeta, FullScreenMenu, Footer, SECTIES, SiteHeader, maakHref } from './components.mjs'

function canonical(site, pad) {
  return site.domein ? `https://${site.domein}${pad}` : null
}

function jsonLd(obj) {
  // JSON in een <script type="application/ld+json">: "<" escapen voorkomt dat CMS-tekst de tag sluit.
  return JSON.stringify(obj).replace(/</g, '\\u003c')
}

export function documentHtml(ctx, { titel, beschrijving, pad, ogBeeld, ogType = 'website', body, preloadBeeld, extraLd = [] }) {
  const { site, opties } = ctx
  const url = canonical(site, pad)
  const org = site.naam
    ? { '@context': 'https://schema.org', '@type': 'Organization', name: site.naam, ...(site.domein ? { url: `https://${site.domein}/` } : {}), ...(site.contact.email ? { email: site.contact.email } : {}), ...(site.linkedin ? { sameAs: [site.linkedin] } : {}) }
    : null
  return html`<!DOCTYPE html>
<html lang="${attr(site.locale || 'nl')}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(titel)}</title>
  ${beschrijving ? html`<meta name="description" content="${attr(beschrijving)}">` : ''}
  ${url ? html`<link rel="canonical" href="${attr(url)}">` : ''}
  ${opties.indexeren ? '' : '<meta name="robots" content="noindex, nofollow">'}
  <meta name="theme-color" content="${attr(site.kleuren.dark)}">
  <meta property="og:type" content="${attr(ogType)}">
  <meta property="og:title" content="${attr(titel)}">
  ${beschrijving ? html`<meta property="og:description" content="${attr(beschrijving)}">` : ''}
  ${url ? html`<meta property="og:url" content="${attr(url)}">` : ''}
  ${ogBeeld ? html`<meta property="og:image" content="${attr(ogBeeld)}">` : ''}
  <meta property="og:locale" content="nl_NL">
  ${site.naam ? html`<meta property="og:site_name" content="${attr(site.naam)}">` : ''}
  ${site.favicon ? html`<link rel="icon" href="${attr(site.favicon)}">` : '<link rel="icon" href="/favicon.svg" type="image/svg+xml">'}
  <link rel="preload" href="/fonts/outfit-latin-500-normal.woff2" as="font" type="font/woff2" crossorigin>
  ${preloadBeeld ? html`<link rel="preload" href="${attr(preloadBeeld)}" as="image" fetchpriority="high">` : ''}
  <link rel="stylesheet" href="/site.css?v=${attr(opties.versie)}">
  ${org ? html`<script type="application/ld+json">${jsonLd(org)}</script>` : ''}
  ${extraLd.map((ld) => html`<script type="application/ld+json">${jsonLd(ld)}</script>`)}
  <script src="/site.js?v=${attr(opties.versie)}" defer></script>
  ${opties.siteId ? html`<script defer src="${attr(opties.cmsBase)}/meet.js" data-site="${attr(opties.siteId)}"></script>` : ''}
  ${opties.siteId && ctx.heeftFormulier ? html`<script defer src="${attr(opties.cmsBase)}/cms-client.js" data-site="${attr(opties.siteId)}"></script>` : ''}
</head>
<body>
  <a class="skip-link" href="#inhoud">Direct naar de inhoud</a>
  ${SiteHeader(ctx)}
  ${FullScreenMenu(ctx)}
  <main id="top">
    <span id="inhoud" tabindex="-1"></span>
${body}
  </main>
  ${Footer(ctx)}
</body>
</html>
`
}

// Rendert een CMS-pagina (homepage of subpagina zoals /team) uit haar blokken.
export function homeHtml(ctx) {
  const { model } = ctx
  const p = model.pagina
  const body = model.secties.map((s) => SECTIES[s.soort]?.(ctx, s) ?? '').join('\n')
  const hero = model.secties.find((s) => s.soort === 'hero')
  const pad = !p || p.slug === '/' ? '/' : `${p.slug}/`
  return documentHtml(ctx, {
    titel: p?.titel || model.site.naam,
    beschrijving: p?.beschrijving,
    pad,
    ogBeeld: p?.ogBeeld || hero?.beeld || null,
    preloadBeeld: hero && !hero.compact ? hero.beeld : null,
    body,
  })
}

function alineas(t) {
  return String(t || '')
    .split(/\n\s*\n/)
    .map((a) => a.trim())
    .filter(Boolean)
}

// Artikeldetail. hoofdtekst wordt als platte tekst behandeld (alinea's op lege regels, regels die
// met "## " beginnen worden tussenkoppen) — nooit als HTML.
function leestijd(t) {
  const woorden = String(t || '').split(/\s+/).filter(Boolean).length
  return woorden ? `${Math.max(1, Math.round(woorden / 200))} min lezen` : ''
}

export function artikelHtml(ctx, a) {
  const { site } = ctx
  const delen = alineas(a.hoofdtekst).map((blok) =>
    blok.startsWith('## ') ? html`<h2>${esc(blok.slice(3))}</h2>` : html`<p>${esc(blok).replace(/\n/g, '<br>')}</p>`,
  )
  const lt = leestijd(`${a.antwoordblok} ${a.hoofdtekst}`)
  // "Lees verder": de drie nieuwste andere artikelen, in dezelfde kaarten als op de homepage.
  const meer = (ctx.model?.artikelen ?? []).filter((x) => x.slug !== a.slug).slice(0, 3)
  const contact = ctx.contactLink
  const body = html`<article class="article-page" aria-labelledby="artikel-titel">
    <header class="article-head">
      <a class="text-link back-link" href="${attr(ctx.inzichtenPad || '/#inzichten')}"><span class="arrow" aria-hidden="true">←</span> Alle inzichten</a>
      ${ArtikelMeta(a, lt ? [esc(lt)] : [])}
      <h1 id="artikel-titel">${esc(a.titel)}</h1>
      ${a.samenvatting ? html`<p class="article-lead">${esc(a.samenvatting)}</p>` : ''}
      <span class="corner-marker" aria-hidden="true"></span>
    </header>
    ${a.foto ? html`<span class="duotoon article-hero-wrap"><img class="article-hero" src="${attr(a.foto)}" alt="${attr(a.fotoAlt)}" decoding="async" fetchpriority="high"></span>` : ''}
    <div class="article-layout">
      <aside class="article-aside" aria-label="Over dit artikel">
        <dl class="article-facts">
          ${a.rubriek ? html`<div><dt>Rubriek</dt><dd>${esc(a.rubriek)}</dd></div>` : ''}
          ${a.datum ? html`<div><dt>Gepubliceerd</dt><dd><time datetime="${attr(a.datum)}">${esc(a.datumLabel)}</time></dd></div>` : ''}
          ${lt ? html`<div><dt>Leestijd</dt><dd>${esc(lt.replace(' lezen', ''))}</dd></div>` : ''}
          ${a.auteur ? html`<div><dt>Auteur</dt><dd>${esc(a.auteur)}</dd></div>` : ''}
        </dl>
        ${contact ? html`<a class="text-link" href="${attr(maakHref(ctx, contact.href))}">${esc(contact.label)} <span class="arrow" aria-hidden="true">↗</span></a>` : ''}
      </aside>
      <div class="article-body">
        ${a.antwoordblok ? html`<div class="article-answer"><p class="eyebrow">In het kort</p><p>${esc(a.antwoordblok)}</p></div>` : ''}
        ${delen}
      </div>
    </div>
    ${
      contact
        ? html`<section class="article-cta" aria-labelledby="artikel-cta-kop">
      <h2 id="artikel-cta-kop">Vragen over dit onderwerp?</h2>
      <a class="button-mint" href="${attr(maakHref(ctx, contact.href))}">${esc(contact.label)} <span aria-hidden="true">↗</span></a>
    </section>`
        : ''
    }
  </article>
  ${
    meer.length
      ? html`<section class="articles article-more-section" aria-labelledby="lees-verder-kop">
    <div class="section-heading"><h2 id="lees-verder-kop">Lees verder.</h2><a class="text-link" href="${attr(ctx.inzichtenPad || '/#inzichten')}">Alle inzichten <span class="arrow" aria-hidden="true">↗</span></a></div>
    <div class="articles-grid articles-grid--gelijk">${meer.map((x) => ArtikelKaart(x))}</div>
  </section>`
      : ''
  }`
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.titel,
    ...(a.samenvatting ? { description: a.samenvatting } : {}),
    ...(a.datum ? { datePublished: a.datum } : {}),
    ...(a.foto ? { image: a.foto } : {}),
    ...(a.auteur ? { author: { '@type': 'Person', name: a.auteur } } : {}),
    ...(site.naam ? { publisher: { '@type': 'Organization', name: site.naam } } : {}),
  }
  return documentHtml(ctx, {
    titel: `${a.titel} | ${site.naam}`,
    beschrijving: a.samenvatting,
    pad: `/inzichten/${a.slug}/`,
    ogBeeld: a.foto,
    ogType: 'article',
    body,
    extraLd: [ld],
  })
}

export function nietGevondenHtml(ctx) {
  const body = html`<section class="section-pad not-found" aria-labelledby="nf-titel">
    <p class="eyebrow">404</p>
    <h1 id="nf-titel">Deze pagina bestaat niet (meer).</h1>
    <p><a class="text-link" href="/">Naar de homepage <span class="arrow" aria-hidden="true">↗</span></a></p>
  </section>`
  return documentHtml(ctx, { titel: `Pagina niet gevonden | ${ctx.site.naam}`, pad: '/404', body })
}

// Gedegradeerde stand: de homepage is (nog) niet gepubliceerd in het CMS. Geen verzonnen content,
// wel een nette pagina met merk + navigatie i.p.v. een lege witte pagina.
export function onderhoudHtml(ctx) {
  const body = html`<section class="section-pad not-found" aria-labelledby="nf-titel">
    <p class="eyebrow">${esc(ctx.site.naam)}</p>
    <h1 id="nf-titel">Deze website wordt op dit moment bijgewerkt.</h1>
    <p>Kom later nog eens terug.</p>
  </section>`
  return documentHtml(ctx, { titel: ctx.site.naam || 'Website', pad: '/', body })
}
