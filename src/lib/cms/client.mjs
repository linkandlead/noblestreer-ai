// CMS-client — koppelpunt 1 (content) van Link & Lead One.
//
// Haalt build-time de GEPUBLICEERDE content van de Noblestreet-site op via de bestaande lees-API
// `GET {CMS_BASE}/api/cms/content` met het site-gescopete bouw-token (Authorization: Bearer cms_…).
// Het token bepaalt de site; je kunt met dit token nooit een andere site lezen. Het token leeft
// alleen in de build-omgeving (env-var), nooit in de browserbundel.
//
// Contract: zie HEADLESS-FRONTEND.md + src/routes/api/cms/content.ts in linkandlead-cms.

import { readFileSync } from 'node:fs'

export class CmsFout extends Error {
  constructor(melding, status) {
    super(melding)
    this.name = 'CmsFout'
    this.status = status
  }
}

/**
 * @param {{ base: string, token?: string, fixture?: string, fetchImpl?: typeof fetch, timeoutMs?: number }} opties
 * @returns {Promise<unknown>} rauwe (ongevalideerde) respons — altijd door normalize.mjs halen.
 */
export async function haalContent({ base, token, fixture, fetchImpl = fetch, timeoutMs = 15000 }) {
  if (fixture) {
    // Alleen voor lokale ontwikkeling en tests (expliciet via CMS_FIXTURE=1). Nooit in productie.
    return JSON.parse(readFileSync(fixture, 'utf8'))
  }
  if (!token || !token.startsWith('cms_')) {
    throw new CmsFout('CMS_TOKEN ontbreekt of heeft een ongeldig formaat (verwacht cms_…).', 0)
  }
  // Cache-buster: de lees-API stuurt `cache-control: public, max-age=60`. Een build die direct na
  // publiceren door de Deploy Hook start, moet de verse versie krijgen, niet een gecachte.
  const url = `${base.replace(/\/$/, '')}/api/cms/content?_=${Date.now()}`
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  let res
  try {
    res = await fetchImpl(url, { headers: { authorization: `Bearer ${token}` }, signal: ctrl.signal })
  } catch (e) {
    throw new CmsFout(`CMS onbereikbaar (${e?.name === 'AbortError' ? 'time-out' : e?.message ?? e}).`, 0)
  } finally {
    clearTimeout(timer)
  }
  if (!res.ok) throw new CmsFout(`Content ophalen mislukt (HTTP ${res.status}). Controleer CMS_TOKEN en CMS_BASE.`, res.status)
  const data = await res.json()
  if (!data || data.ok !== true) throw new CmsFout('CMS gaf geen geldige content-respons.', res.status)
  return data
}
