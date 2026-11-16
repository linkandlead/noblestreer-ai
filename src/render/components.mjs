// Sitecomponenten (model A: de frontend bepaalt de vorm, het CMS de inhoud).
// Equivalent van components/site/{Header,FullScreenMenu,Hero,ServiceGrid,TeamBanner,ArticleGrid,
// Contact,Footer}. Elke component krijgt genormaliseerde props (src/lib/cms/normalize.mjs).

import { attr, esc, html, linkAttrs, woordmerk } from './html.mjs'

const PIJL = '<span class="arrow" aria-hidden="true">↗</span>'

// Ankers (#diensten) werken op de homepage; op subpagina's verwijzen ze naar /#diensten.
export function maakHref(ctx, href) {
  if (!href) return null
  return href.startsWith('#') && !ctx.isHome ? `/${href}` : href
}

function tekstLink(ctx, link, extraKlasse = '') {
  if (!link) return ''
  return html`<a class="text-link${extraKlasse ? ` ${extraKlasse}` : ''}"${linkAttrs(maakHref(ctx, link.href))}>${esc(link.label)} ${PIJL}</a>`
}

export function SiteHeader(ctx) {
  const { site } = ctx
  return html`<header class="site-header">
    <a class="wordmark" href="${ctx.isHome ? '#top' : '/'}" aria-label="${attr(site.naam)}, naar ${ctx.isHome ? 'boven' : 'de homepage'}">${woordmerk(site.naam)}</a>
    <button class="menu-toggle js-only" type="button" id="open-menu" aria-controls="main-menu" aria-expanded="false">Menu <span class="hamburger" aria-hidden="true"><b></b><b></b></span></button>
    <a class="menu-toggle no-js-only" href="#site-footer">Menu <span class="hamburger" aria-hidden="true"><b></b><b></b></span></a>
  </header>`
}

export function FullScreenMenu(ctx) {
  const { site } = ctx
  if (!site.nav.length) return ''
  const plaats = site.contact.postcode_plaats
  return html`<nav id="main-menu" class="fullscreen-menu" aria-label="Volledig menu" hidden>
    <div class="menu-top"><a href="${ctx.isHome ? '#top' : '/'}" class="wordmark menu-nav-link" aria-label="${attr(site.naam)}">${woordmerk(site.naam)}</a><button class="close-menu" type="button" id="close-menu">Sluiten <span aria-hidden="true">×</span></button></div>
    <ul class="menu-list" role="list">${site.nav.map((n) => html`<li><a class="menu-nav-link"${linkAttrs(maakHref(ctx, n.href))}>${esc(n.label)}</a></li>`)}</ul>
    <div class="menu-bottom">${site.slogan ? html`<span>${esc(site.slogan)}</span>` : html`<span></span>`}<span>${esc(site.naam)}${plaats ? ` · ${esc(plaats)}` : ''}</span></div>
  </nav>`
}

export function Hero(ctx, s) {
  const Kop = s.niveau === 1 ? 'h1' : 'h2'
  const rotatie = s.niveau === 1 ? ctx.rotatie : []
  const regels = s.kopRegels
  return html`<section class="hero${s.compact ? ' hero--compact' : ''}" aria-label="Introductie">
    ${s.beeld ? html`<img class="hero-photo" src="${attr(s.beeld)}" alt="${attr(s.beeldAlt)}" fetchpriority="high" decoding="async">` : ''}
    <div class="hero-content">
      ${s.eyebrow ? html`<p class="eyebrow">${esc(s.eyebrow)}</p>` : ''}
      <${Kop} class="hero-title">${regels.map((r) => html`<span class="line">${esc(r)}</span>`)}${
        rotatie.length
          ? html`<span class="line hero-rotate" data-rotate aria-hidden="true">${rotatie.map((r, i) => html`<span class="rotate-item${i === 0 ? ' is-active' : ''}">${esc(r)}</span>`)}</span><span class="visually-hidden">${esc(rotatie.join(' '))}</span>`
          : ''
      }</${Kop}>
    </div>
    <div class="hero-bottom">${s.intro ? html`<p class="hero-intro">${esc(s.intro)}</p>` : html`<span></span>`}${tekstLink(ctx, s.cta)}</div>
    <span class="corner-marker" aria-hidden="true"></span>
  </section>`
}

export function ServiceGrid(ctx, s) {
  const n = s.items.length
  const kop = s.titel || s.intro || n
  if (!kop) return ''
  const voetLink = ctx.contactLink
  return html`<section id="diensten" class="section-pad services" aria-labelledby="services-heading">
    <div class="section-heading" data-reveal>
      <div>${s.eyebrow ? html`<p class="eyebrow section-eyebrow">${esc(s.eyebrow)}</p>` : ''}${s.titel ? html`<h2 class="services-title" id="services-heading">${esc(s.titel)}</h2>` : html`<h2 class="visually-hidden" id="services-heading">Diensten</h2>`}</div>
      <div class="services-head-right">${s.intro ? html`<p>${esc(s.intro)}</p>` : ''}${tekstLink(ctx, ctx.site.actie)}</div>
    </div>
    ${
      n
        ? html`<div class="service-wrap"><ul class="service-stage count-${n}" role="list">${s.items.map(
            (d, i) => html`<li class="service-item" data-pos="${i + 1}" data-reveal><a class="service-card"${linkAttrs(maakHref(ctx, d.href))} aria-describedby="dienst-${i + 1}-punten">
              <span class="service-number">${esc(d.nummer)} /</span>
              <span class="arrow-square" aria-hidden="true">↗</span>
              <span class="service-desc" id="dienst-${i + 1}-punten">${d.beschrijving ? html`<span class="visually-hidden">${esc(d.beschrijving)}</span>` : ''}${d.punten.map((p) => html`<span class="service-point">${esc(p)}</span>`)}</span>
              <span class="service-title">${esc(d.titel)}</span>
            </a></li>`,
          )}</ul></div>`
        : ''
    }
    ${voetLink && n ? html`<div class="services-foot" data-reveal>${tekstLink(ctx, voetLink)}</div>` : ''}
  </section>`
}

export function TeamBanner(ctx, s) {
  if (!s.titel && !s.alineas.length) return ''
  return html`<section id="over-ons" class="team${s.beeld ? '' : ' team--zonder-beeld'}" aria-labelledby="team-heading">
    ${s.beeld ? html`<img class="team-photo" src="${attr(s.beeld)}" alt="${attr(s.beeldAlt)}" loading="lazy" decoding="async">` : ''}
    ${s.beeld && s.label ? html`<span class="photo-label">${esc(s.label)}</span>` : ''}
    <div class="team-content">
      <h2 id="team-heading" data-reveal>${s.titelRegels.map((r, i) => html`${i ? '<br>' : ''}${esc(r)}`)}</h2>
      <div class="team-side" data-reveal>${s.alineas.map((a) => html`<p>${esc(a)}</p>`)}${s.punten.length ? html`<ul class="team-points">${s.punten.map((p) => html`<li>${esc(p)}</li>`)}</ul>` : ''}${tekstLink(ctx, s.cta)}</div>
    </div>
  </section>`
}

function initialen(naam) {
  return naam.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

// Team (collectie Team). Zonder foto: een kader met initialen — nooit een verzonnen portret.
export function TeamGrid(ctx, s) {
  return html`<section id="team" class="section-pad teamgrid" aria-labelledby="teamgrid-heading">
    <div class="section-heading" data-reveal>
      <h2 id="teamgrid-heading">${s.titelRegels.length ? s.titelRegels.map((r, i) => html`${i ? '<br>' : ''}${esc(r)}`) : 'Team'}</h2>
      ${s.intro ? html`<div class="services-head-right"><p>${esc(s.intro)}</p></div>` : ''}
    </div>
    ${
      s.leden.length
        ? html`<ul class="team-grid" role="list">${s.leden.map(
            (l) => html`<li class="team-member" data-reveal>
              ${l.foto ? html`<img class="team-member-photo" src="${attr(l.foto)}" alt="${attr(l.fotoAlt || l.naam)}" loading="lazy" decoding="async">` : html`<span class="team-member-photo team-member-photo--leeg" aria-hidden="true">${esc(initialen(l.naam))}</span>`}
              ${l.functie ? html`<p class="team-member-role">${esc(l.functie)}</p>` : ''}
              <h3>${esc(l.naam)}</h3>
              ${l.tekst ? html`<p class="team-member-text">${esc(l.tekst)}</p>` : ''}
              ${l.linkedin ? html`<a class="text-link team-member-link"${linkAttrs(l.linkedin)}>LinkedIn ${PIJL}</a>` : ''}
            </li>`,
          )}</ul>`
        : html`<p class="empty-state" data-reveal>Het team wordt binnenkort voorgesteld.</p>`
    }
  </section>`
}

export function ArticleGrid(ctx, s) {
  return html`<section id="inzichten" class="articles" aria-labelledby="articles-heading">
    <div class="section-heading" data-reveal>
      <div>${s.eyebrow ? html`<p class="eyebrow section-eyebrow">${esc(s.eyebrow)}</p>` : ''}<h2 id="articles-heading">${s.titelRegels.length ? s.titelRegels.map((r, i) => html`${i ? '<br>' : ''}${esc(r)}`) : 'Inzichten'}</h2></div>
      ${tekstLink(ctx, ctx.contactLink)}
    </div>
    ${
      s.artikelen.length
        ? html`<div class="articles-grid count-${s.artikelen.length}">${s.artikelen.map(
            (a, i) => html`<article class="article-card" data-reveal>
              <a class="article-link" href="/inzichten/${attr(a.slug)}/">
                ${a.foto ? html`<img class="article-cover" src="${attr(a.foto)}" alt="${attr(a.fotoAlt)}" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async">` : html`<span class="article-cover article-cover--leeg" aria-hidden="true"></span>`}
                <span class="article-meta">${a.rubriek ? html`<span>${esc(a.rubriek)}</span>` : ''}${a.datum ? html`<span><time datetime="${attr(a.datum)}">${esc(a.datumLabel)}</time></span>` : ''}</span>
                <h3>${esc(a.titel)}</h3>
                ${a.samenvatting ? html`<p>${esc(a.samenvatting)}</p>` : ''}
                <span class="article-more">Lees het artikel <span aria-hidden="true">↗</span></span>
              </a>
            </article>`,
          )}</div>`
        : html`<p class="empty-state" data-reveal>Er zijn nog geen inzichten gepubliceerd. Nieuwe artikelen verschijnen hier zodra ze live staan.</p>`
    }
  </section>`
}

export function Contact(ctx, s) {
  const { cta, formulier } = s
  const titel = cta?.titel || formulier?.titel
  const c = ctx.site.contact
  return html`<section id="contact" class="section-pad contact" aria-labelledby="contact-heading">
    <span class="corner-marker corner-marker--top" aria-hidden="true"></span>
    <div class="section-heading" data-reveal>
      <div>${cta?.eyebrow ? html`<p class="eyebrow section-eyebrow">${esc(cta.eyebrow)}</p>` : ''}<h2 id="contact-heading">${esc(titel || 'Contact')}</h2></div>
      <div class="services-head-right">${cta?.tekst ? html`<p>${esc(cta.tekst)}</p>` : ''}${cta?.cta && !formulier ? tekstLink(ctx, cta.cta) : ''}</div>
    </div>
    <div class="contact-grid">
      <div class="contact-side" data-reveal>
        ${cta?.meta?.length ? html`<ul class="contact-meta" role="list">${cta.meta.map((m) => html`<li>${esc(m)}</li>`)}</ul>` : ''}
        ${
          c.email || c.telefoon || c.adres
            ? html`<dl class="contact-details">${c.email ? html`<dt>E-mail</dt><dd><a href="mailto:${attr(c.email)}">${esc(c.email)}</a></dd>` : ''}${c.telefoon ? html`<dt>Telefoon</dt><dd><a href="tel:${attr(c.telefoon.replace(/[^+0-9]/g, ''))}">${esc(c.telefoon)}</a></dd>` : ''}${c.adres ? html`<dt>Adres</dt><dd>${esc(c.adres)}${c.postcode_plaats ? html`<br>${esc(c.postcode_plaats)}` : ''}</dd>` : ''}</dl>`
            : ''
        }
      </div>
      ${formulier ? ContactForm(ctx, formulier) : ''}
    </div>
  </section>`
}

function ContactForm(ctx, f) {
  // Koppelpunt 2 (leads): cms-client.js van Link & Lead One wire't dit formulier aan /api/cms/lead,
  // met site_id, honeypot + tijdmeting. Zonder JS of zonder SDK verstuurt het formulier NIETS en
  // toont het dat eerlijk (zie .form-nojs) — er is geen nep-bevestiging.
  const succes = f.bevestiging || 'Bedankt. We nemen zo snel mogelijk contact met je op.'
  return html`<form id="contact-formulier" class="contact-form" data-ll-lead data-ll-herkomst="noblestreet-contact" data-ll-success="${attr(succes)}" novalidate data-reveal>
    ${f.intro ? html`<p class="form-intro">${esc(f.intro)}</p>` : ''}
    <div class="field"><label for="f-naam">Naam</label><input id="f-naam" name="naam" type="text" autocomplete="name" maxlength="120"></div>
    <div class="field"><label for="f-email">E-mailadres <span aria-hidden="true">*</span></label><input id="f-email" name="email" type="email" autocomplete="email" required maxlength="200" aria-required="true"></div>
    <div class="field"><label for="f-bedrijf">Organisatie</label><input id="f-bedrijf" name="bedrijf" type="text" autocomplete="organization" maxlength="160"></div>
    <div class="field"><label for="f-vraag">Waar wil je mee verder?</label><textarea id="f-vraag" name="vraag" rows="4" maxlength="4000"></textarea></div>
    <p class="form-error" data-ll-error role="alert" hidden></p>
    <p class="form-success" data-ll-success role="status" hidden></p>
    <p class="form-nojs no-js-only">Dit formulier heeft JavaScript nodig om te verzenden. Zonder JavaScript wordt er niets verstuurd.</p>
    <div class="form-actions"><button class="button-mint" type="submit" disabled data-enable-js>${esc(f.knoptekst)} <span aria-hidden="true">↗</span></button>${f.voetnoot ? html`<p class="form-footnote">${esc(f.voetnoot)}</p>` : ''}</div>
  </form>`
}

export function Footer(ctx) {
  const { site } = ctx
  const c = site.contact
  const kolommen = site.footerKolommen.length ? site.footerKolommen : site.nav.length ? [{ kop: 'Navigatie', links: site.nav }] : []
  const jaar = new Date().getFullYear()
  return html`<footer id="site-footer" class="footer-frame">
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand"><a class="wordmark" href="${ctx.isHome ? '#top' : '/'}" aria-label="${attr(site.naam)}">${woordmerk(site.naam)}</a>${site.tagline ? html`<p class="footer-tagline">${esc(site.tagline)}</p>` : ''}</div>
        ${kolommen.map(
          (k) => html`<div><p class="footer-label">${esc(k.kop)}</p><nav class="footer-nav" aria-label="${attr(k.kop)}">${k.links.map((l) => html`<a${linkAttrs(maakHref(ctx, l.href))}>${esc(l.label)}</a>`)}</nav></div>`,
        )}
        <div><p class="footer-label">Contact</p><div class="footer-times">
          ${c.email ? html`<p><a class="footer-contact-link" href="mailto:${attr(c.email)}">${esc(c.email)}</a></p>` : ''}
          ${c.telefoon ? html`<p><a class="footer-contact-link" href="tel:${attr(c.telefoon.replace(/[^+0-9]/g, ''))}">${esc(c.telefoon)}</a></p>` : ''}
          ${c.adres ? html`<p>${esc(c.adres)}</p>` : ''}${c.postcode_plaats ? html`<p>${esc(c.postcode_plaats)}</p>` : ''}
          ${c.reactietijd ? html`<p>${esc(c.reactietijd)}</p>` : ''}
          ${ctx.contactLink ? html`<p class="footer-cta"><a class="footer-contact-link"${linkAttrs(maakHref(ctx, ctx.contactLink.href))}>${esc(ctx.contactLink.label)} <span aria-hidden="true">↗</span></a></p>` : ''}
        </div></div>
      </div>
      <p class="footer-giant" aria-hidden="true">${esc(site.naam)}</p>
      <div class="footer-bottom"><span>${site.slogan ? `${esc(site.slogan)} · ` : ''}© ${jaar} ${esc(site.naam)}</span><div class="footer-bottom-links">${site.juridisch.map((l) => html`<a${linkAttrs(maakHref(ctx, l.href))}>${esc(l.label)}</a>`)}${site.linkedin ? html`<a${linkAttrs(site.linkedin)}>LinkedIn</a>` : ''}<a href="#top">Naar boven <span aria-hidden="true">↑</span></a></div></div>
    </div>
  </footer>`
}

export const SECTIES = {
  hero: Hero,
  diensten: ServiceGrid,
  team: TeamBanner,
  artikelen: ArticleGrid,
  teamgrid: TeamGrid,
  contact: Contact,
}
