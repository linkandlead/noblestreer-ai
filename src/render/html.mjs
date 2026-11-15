// Kleine, veilige HTML-helpers. ALLE CMS-tekst gaat door esc(); attributen door attr().
// Er wordt nergens ruwe HTML uit het CMS gerenderd.

const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => MAP[c])
}

export const attr = esc

// Tagged template die geneste arrays samenvoegt en null/false weglaat. Waarden moeten al ge-escaped
// zijn (of zelf html-uitvoer van een component): interpolatie escapet NIET automatisch, zodat
// componenten te nesten zijn. Gebruik daarom altijd esc() voor CMS-waarden.
export function html(strings, ...waarden) {
  let uit = ''
  strings.forEach((s, i) => {
    uit += s
    if (i < waarden.length) uit += samen(waarden[i])
  })
  return uit
}

function samen(v) {
  if (v === null || v === undefined || v === false) return ''
  if (Array.isArray(v)) return v.map(samen).join('')
  return String(v)
}

// Woordmerk: "Noblestreet AI" → NOBLESTREET<span>AI</span> (laatste woord gedimd, zoals het ontwerp).
export function woordmerk(naam) {
  const delen = String(naam || '').trim().split(/\s+/)
  if (delen.length < 2) return esc(delen[0] || '')
  const laatste = delen.pop()
  return `${esc(delen.join(' '))}<span>${esc(laatste)}</span>`
}

export function isExtern(href) {
  return /^https:\/\//i.test(href || '')
}

export function linkAttrs(href) {
  return isExtern(href) ? ` href="${attr(href)}" rel="noopener noreferrer"` : ` href="${attr(href)}"`
}
