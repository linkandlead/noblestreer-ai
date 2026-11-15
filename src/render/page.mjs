// Documentopbouw: <head> (SEO, canonical, OG, JSON-LD), layout en de pagina's (home, artikel, 404).
// Alles wordt server-side (build-time) als HTML gerenderd: titel, content en links staan in
// view-source zonder JavaScript (eis uit KLANT-KOPPELING.md §4).

import { attr, esc, html } from './html.mjs'
import { FullScreenMenu, Footer, SECTIES, SiteHeader } from './components.mjs'

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

export function homeHtml(ctx) {
  const { model } = ctx
  const p = model.pagina
  const body = model.secties.map((s) => SECTIES[s.soort]?.(ctx, s) ?? '').join('\n')
  const hero = model.secties.find((s) => s.soort === 'hero')
  return documentHtml(ctx, {
    titel: p?.titel || model.site.naam,
    beschrijving: p?.beschrijving,
    pad: '/',
    ogBeeld: p?.ogBeeld || hero?.beeld || null,
    preloadBeeld: hero?.beeld || null,
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
export function artikelHtml(ctx, a) {
  const { site } = ctx
  const delen = alineas(a.hoofdtekst).map((blok) =>
    blok.startsWith('## ') ? html`<h2>${esc(blok.slice(3))}</h2>` : html`<p>${esc(blok).replace(/\n/g, '<br>')}</p>`,
  )
  const body = html`<article class="article-page section-pad" aria-labelledby="artikel-titel">
    <a class="text-link back-link" href="/#inzichten"><span aria-hidden="true">←</span> Alle inzichten</a>
    <header class="article-head">
      <span class="article-meta">${a.rubriek ? html`<span>${esc(a.rubriek)}</span>` : ''}${a.datum ? html`<span><time datetime="${attr(a.datum)}">${esc(a.datumLabel)}</time></span>` : ''}</span>
      <h1 id="artikel-titel">${esc(a.titel)}</h1>
      ${a.samenvatting ? html`<p class="article-lead">${esc(a.samenvatting)}</p>` : ''}
    </header>
    ${a.foto ? html`<img class="article-hero" src="${attr(a.foto)}" alt="${attr(a.fotoAlt)}" decoding="async">` : ''}
    <div class="article-body">
      ${a.antwoordblok ? html`<p class="article-answer">${esc(a.antwoordblok)}</p>` : ''}
      ${delen}
      ${a.auteur ? html`<p class="article-author">Door ${esc(a.auteur)}</p>` : ''}
    </div>
  </article>`
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
