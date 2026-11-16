// Normalisatie: rauwe CMS-respons (unknown) → getypeerd, gesaneerd paginamodel voor de frontend.
//
// Hier staat GEEN content — alleen de vertaling van echte CMS-velden (Link & Lead One-bloktypen)
// naar presentatie-props. Elke externe waarde wordt hier gevalideerd: strings begrensd, links via een
// allowlist (geen javascript:/data:), afbeeldingen alleen https of interne paden. De renderers
// escapen daarna nog eens alles bij het uitschrijven (dubbele borging tegen XSS).
//
// Blokmapping (CMS-type → sectie), zie README "CMS-blokkenkaart":
//   header          → hero        (Header (hero), lay-out "achtergrond", eerste = h1)
//   kaarten         → diensten    (Kaartenrij; max. 5 kaarten; per kaart: titel, tekst = beschrijving + punten, link)
//   mediatekst      → team        (Tekst met beeld; full-bleed foto + tekstoverlay)
//   artikelen_grid  → artikelen   (collectie Artikelen, records.artikelen, max 3, nieuwste eerst)
//   cta (+formulier)→ contact     (Afsluitende oproep + Formulier soort contact)
// Onbekende bloktypen worden veilig overgeslagen (de pagina breekt nooit).

/** @typedef {{ label: string, href: string }} Link */

const MAX_DIENSTEN = 5
const MAX_PUNTEN = 5
const MAX_ARTIKELEN = 3

export function tekst(v, max = 2000) {
  if (typeof v !== 'string') return ''
  // Stuurtekens (behalve regeleinde/tab) eruit; lengte begrenzen.
  // eslint-disable-next-line no-control-regex
  const schoon = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim()
  return schoon.length > max ? schoon.slice(0, max).trimEnd() : schoon
}

// Veilige link: anker, intern pad, https, mailto of tel. Alles anders → null (dan geen link tonen).
export function veiligeHref(v) {
  const s = tekst(v, 500)
  if (!s) return null
  if (/^#[A-Za-z][\w-]*$/.test(s) || s === '#') return s === '#' ? null : s
  if (/^\/(?!\/)[^\s<>"']*$/.test(s)) return s
  if (/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(?::\d+)?(\/[^\s<>"']*)?$/i.test(s)) return s
  if (/^mailto:[^\s<>"']+@[^\s<>"']+$/i.test(s)) return s
  if (/^tel:\+?[0-9 ()-]{6,20}$/i.test(s)) return s
  return null
}

// Afbeeldingen: alleen https of intern pad (CMS-mediabibliotheek levert https-URL's).
export function veiligeAfbeelding(v) {
  const s = tekst(v, 1000)
  if (!s) return null
  if (/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(\/[^\s<>"']*)?$/i.test(s)) return s
  if (/^\/(?!\/)[^\s<>"']*$/.test(s)) return s
  return null
}

const KLEUR_RE = /^#[0-9a-fA-F]{6}$/

function obj(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
}
function lijst(v) {
  return Array.isArray(v) ? v : []
}

// "Zelf bouwen met AI." → ["Zelf bouwen", "met AI."]: splits op de woordgrens het dichtst bij het
// midden (in woorden), zodat de monumentale kop net als in het ontwerp over twee regels loopt.
export function splitKop(kop) {
  // Meerdere zinnen ("AI in je bedrijf. Goed geregeld.") → één zin per regel.
  const zinnen = splitZinnen(kop)
  if (zinnen.length > 1) return zinnen
  const woorden = tekst(kop, 200).split(/\s+/).filter(Boolean)
  if (woorden.length < 2) return woorden.length ? [woorden[0]] : []
  const midden = Math.ceil(woorden.length / 2)
  return [woorden.slice(0, midden).join(' '), woorden.slice(midden).join(' ')]
}

// "Persoonlijk in contact. Professioneel in techniek." → twee zinnen op twee regels.
export function splitZinnen(t) {
  const s = tekst(t, 300)
  const delen = s.split(/(?<=[.!?])\s+(?=\S)/).filter(Boolean)
  return delen.length ? delen : s ? [s] : []
}

// Kaarttekst → beschrijving + punten. Conventie (gelijk aan het CMS-veld "één punt per regel" bij
// prijskaarten): regels die met "-", "•" of "*" beginnen zijn opsommingspunten; overige regels vormen
// samen de korte beschrijving.
export function parseKaartTekst(t) {
  const regels = tekst(t, 3000).split(/\r?\n/).map((r) => r.trim()).filter(Boolean)
  const punten = []
  const beschrijving = []
  for (const r of regels) {
    const m = r.match(/^[-•*]\s*(.+)$/)
    if (m) punten.push(tekst(m[1], 160))
    else beschrijving.push(r)
  }
  return { beschrijving: beschrijving.join(' '), punten: punten.slice(0, MAX_PUNTEN), puntenAfgekapt: punten.length > MAX_PUNTEN }
}

function rotatieLabel(titel) {
  const t = tekst(titel, 80)
  if (!t) return ''
  return /[.!?]$/.test(t) ? t : `${t}.`
}

export function formatteerMaand(datum) {
  if (typeof datum !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(datum)) return ''
  const d = new Date(`${datum.slice(0, 10)}T12:00:00Z`)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric', timeZone: 'Europe/Amsterdam' }).format(d)
}

export function isoDatum(datum) {
  return typeof datum === 'string' && /^\d{4}-\d{2}-\d{2}/.test(datum) ? datum.slice(0, 10) : ''
}

function normaliseerArtikel(r) {
  const a = obj(r)
  const slug = tekst(a.slug, 120).toLowerCase()
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null
  const titel = tekst(a.titel, 200)
  if (!titel) return null
  return {
    id: tekst(a.id, 64),
    slug,
    titel,
    rubriek: tekst(a.rubriek, 40),
    samenvatting: tekst(a.samenvatting, 400),
    antwoordblok: tekst(a.antwoordblok, 1200),
    hoofdtekst: tekst(a.hoofdtekst, 40000),
    foto: veiligeAfbeelding(a.foto),
    fotoAlt: tekst(a.foto_alt, 200),
    datum: isoDatum(a.gepubliceerd_op),
    datumLabel: formatteerMaand(a.gepubliceerd_op),
    auteur: tekst(a.auteur, 80),
  }
}

// Alle gepubliceerde artikelen (de lees-API levert alleen published=true), nieuwste eerst.
export function normaliseerArtikelen(records) {
  return lijst(obj(records).artikelen)
    .map(normaliseerArtikel)
    .filter(Boolean)
    .sort((a, b) => (b.datum || '').localeCompare(a.datum || ''))
}

function sectieHero(c, index) {
  const heading = tekst(c.heading, 200)
  return {
    soort: 'hero',
    niveau: index === 0 ? 1 : 2,
    eyebrow: tekst(c.eyebrow, 140),
    kopRegels: splitKop(heading),
    kop: heading,
    intro: tekst(c.subheading, 600),
    cta: maakLink(c.cta_primair_label, c.cta_primair_link),
    beeld: c.media_type === 'afbeelding' || (!c.media_type && c.media_afbeelding) ? veiligeAfbeelding(c.media_afbeelding) : null,
    beeldAlt: tekst(c.media_alt, 250),
    // USP's van het Header-blok = de wisselende laatste regel (klantvoordelen). Leeg → dienstnamen.
    usps: lijst(c.usps).map((u) => rotatieLabel(obj(u).tekst)).filter(Boolean).slice(0, 6),
    focus: { x: getal(c.focal_x, 50), y: getal(c.focal_y, 47) },
  }
}

function getal(v, standaard) {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : Number.NaN
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : standaard
}

function maakLink(label, href) {
  const l = tekst(label, 80)
  const h = veiligeHref(href)
  return l && h ? { label: l, href: h } : null
}

function sectieDiensten(c, waarschuwingen) {
  const rauw = lijst(c.items)
  if (rauw.length > MAX_DIENSTEN) waarschuwingen.push(`Kaartenrij heeft ${rauw.length} kaarten; het ontwerp toont er maximaal ${MAX_DIENSTEN}.`)
  const items = rauw
    .map((k) => obj(k))
    .filter((k) => tekst(k.titel, 120))
    .slice(0, MAX_DIENSTEN)
    .map((k, i) => {
      const { beschrijving, punten, puntenAfgekapt } = parseKaartTekst(k.tekst)
      if (puntenAfgekapt) waarschuwingen.push(`Dienst "${tekst(k.titel, 80)}" heeft meer dan ${MAX_PUNTEN} punten; alleen de eerste ${MAX_PUNTEN} worden getoond.`)
      return {
        nummer: String(i + 1).padStart(2, '0'),
        titel: tekst(k.titel, 120),
        beschrijving,
        punten,
        href: veiligeHref(k.link) ?? '#contact',
        rotatieLabel: rotatieLabel(k.titel),
      }
    })
  return {
    soort: 'diensten',
    eyebrow: tekst(c.eyebrow, 140),
    titel: tekst(c.titel, 200),
    intro: tekst(c.intro, 600),
    items,
  }
}

function sectieTeam(c) {
  return {
    soort: 'team',
    label: tekst(c.eyebrow, 80),
    titelRegels: splitZinnen(c.titel),
    titel: tekst(c.titel, 300),
    alineas: lijst(c.alineas).map((a) => tekst(obj(a).tekst, 1200)).filter(Boolean),
    punten: lijst(c.punten).map((p) => tekst(obj(p).tekst, 200)).filter(Boolean),
    beeld: veiligeAfbeelding(c.beeld),
    beeldAlt: tekst(c.beeld_alt, 250),
    cta: maakLink(c.knoptekst, c.knop),
  }
}

function sectieArtikelen(c, artikelen) {
  const max = Math.min(MAX_ARTIKELEN, Math.max(1, getal(c.maximaal, MAX_ARTIKELEN) || MAX_ARTIKELEN))
  const rubriek = tekst(c.filter_rubriek, 40)
  const lijstArt = artikelen.filter((a) => !rubriek || a.rubriek.toLowerCase() === rubriek.toLowerCase()).slice(0, max)
  return {
    soort: 'artikelen',
    eyebrow: tekst(c.eyebrow, 140),
    titelRegels: splitZinnen(c.titel),
    titel: tekst(c.titel, 200),
    artikelen: lijstArt,
  }
}

function sectieCta(c) {
  return {
    eyebrow: tekst(c.eyebrow, 140),
    titel: tekst(c.titel, 200),
    tekst: tekst(c.tekst, 1200),
    cta: maakLink(c.knoptekst, c.knop),
    meta: lijst(c.meta).map((m) => tekst(obj(m).tekst, 160)).filter(Boolean),
  }
}

function sectieFormulier(c) {
  return {
    soort: tekst(c.soort, 20) || 'contact',
    eyebrow: tekst(c.eyebrow, 140),
    titel: tekst(c.titel, 200),
    intro: tekst(c.intro, 800),
    knoptekst: tekst(c.knoptekst, 60) || 'Versturen',
    voetnoot: tekst(c.voetnoot, 400),
    bevestiging: tekst(c.bevestigingstekst, 600),
  }
}

function normaliseerNav(items) {
  return lijst(items)
    .map((n) => obj(n))
    .map((n) => ({ label: tekst(n.titel, 60), href: veiligeHref(n.href) }))
    .filter((n) => n.label && n.href)
}

function normaliseerSite(rauw, waarschuwingen) {
  const site = obj(rauw)
  const merk = obj(site.merk)
  const nav = obj(site.navigatie)
  const tokens = obj(site.design_tokens)
  const kleur = (k, standaard) => (typeof tokens[k] === 'string' && KLEUR_RE.test(tokens[k]) ? tokens[k] : standaard)
  const contactRauw = obj(merk.contact)
  const contact = {}
  for (const k of ['bedrijf', 'email', 'telefoon', 'adres', 'postcode_plaats', 'kvk', 'reactietijd']) {
    const v = tekst(contactRauw[k], 200)
    if (v) contact[k] = v
  }
  if (contact.email && !/^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/i.test(contact.email)) delete contact.email
  if (contact.telefoon && !/^\+?[0-9 ()-]{6,20}$/.test(contact.telefoon)) delete contact.telefoon
  const naam = tekst(merk.naam, 80) || tekst(site.naam, 80)
  if (!naam) waarschuwingen.push('Geen sitenaam/merknaam in het CMS gevonden.')
  const domein = tekst(site.domein, 200).toLowerCase()
  const actieRauw = obj(nav.actie)
  return {
    naam,
    domein: /^[a-z0-9.-]+\.[a-z]{2,}$/.test(domein) ? domein : '',
    locale: tekst(site.locale, 10) || 'nl',
    // Twee merkkleuren: donker = 'nacht', mint = 'limoen' uit Site > Navigatie en instellingen.
    kleuren: { dark: kleur('nacht', '#052824'), mint: kleur('limoen', '#B1F9E1') },
    tagline: tekst(merk.tagline, 240),
    slogan: tekst(merk.slogan, 80),
    favicon: veiligeAfbeelding(merk.favicon),
    linkedin: veiligeHref(obj(merk.socials).linkedin),
    contact,
    nav: normaliseerNav(nav.hoofd),
    footerKolommen: lijst(nav.footer)
      .map((k) => obj(k))
      .map((k) => ({ kop: tekst(k.kop, 60), links: normaliseerNav(k.links) }))
      .filter((k) => k.kop && k.links.length),
    juridisch: normaliseerNav(nav.juridisch),
    actie: maakLink(actieRauw.titel, actieRauw.href),
  }
}

/**
 * @param {unknown} rauw   respons van /api/cms/content
 * @param {{ slug?: string }} [opties]
 */
export function normaliseer(rauw, { slug = '/' } = {}) {
  const data = obj(rauw)
  const waarschuwingen = []
  const site = normaliseerSite(data.site, waarschuwingen)
  const paginas = lijst(data.paginas).map(obj)
  const p = paginas.find((x) => x.slug === slug) ?? null
  const artikelen = normaliseerArtikelen(data.records)

  const secties = []
  let heroTeller = 0
  if (p) {
    const blokken = lijst(p.blokken).map(obj)
    for (let i = 0; i < blokken.length; i++) {
      const b = blokken[i]
      const c = obj(b.content)
      switch (b.type) {
        case 'header':
          secties.push(sectieHero(c, heroTeller++))
          break
        case 'kaarten':
          secties.push(sectieDiensten(c, waarschuwingen))
          break
        case 'mediatekst':
          secties.push(sectieTeam(c))
          break
        case 'artikelen_grid':
          secties.push(sectieArtikelen(c, artikelen))
          break
        case 'cta': {
          // Afsluitende oproep + direct volgend contactformulier = één contactsectie.
          const volgende = blokken[i + 1]
          const form = volgende?.type === 'formulier' && obj(volgende.content).soort !== 'nieuwsbrief' ? sectieFormulier(obj(volgende.content)) : null
          if (form) i++
          secties.push({ soort: 'contact', cta: sectieCta(c), formulier: form })
          break
        }
        case 'formulier': {
          const f = sectieFormulier(c)
          if (f.soort === 'contact') secties.push({ soort: 'contact', cta: null, formulier: f })
          break
        }
        default:
          if (b.type) waarschuwingen.push(`Bloktype "${tekst(b.type, 40)}" wordt door deze frontend niet getoond.`)
      }
    }
  } else {
    waarschuwingen.push(`Pagina "${slug}" niet gevonden of niet gepubliceerd in het CMS.`)
  }

  // Wisseltermen in de hero: bij voorkeur de USP's van het Header-blok (klantvoordelen, beheerd in
  // One Studio); zijn die leeg, dan de titels van de dienstkaarten (geen dubbele content).
  const hero = secties.find((s) => s.soort === 'hero' && s.niveau === 1)
  const diensten = secties.find((s) => s.soort === 'diensten')
  const rotatie = hero?.usps?.length ? hero.usps : diensten ? diensten.items.map((d) => d.rotatieLabel).filter(Boolean) : []

  return {
    site,
    pagina: p
      ? { slug: p.slug, titel: tekst(p.titel, 200), beschrijving: tekst(p.beschrijving, 320), ogBeeld: veiligeAfbeelding(p.og_beeld) }
      : null,
    secties,
    rotatie,
    artikelen,
    waarschuwingen,
  }
}
