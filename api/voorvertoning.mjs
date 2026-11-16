// Vercel-functie achter /__voorvertoning (rewrite in vercel.json). Het leestoken (CMS_TOKEN) blijft hier,
// serverkant; zie src/voorvertoning.mjs voor het protocol.
import { voorvertoning } from '../src/voorvertoning.mjs'

export async function GET(request) {
  return voorvertoning(request, {
    cmsBase: process.env.CMS_BASE || 'https://linkandlead.nl',
    token: process.env.CMS_TOKEN,
    versie: (process.env.VERCEL_GIT_COMMIT_SHA || 'vv').slice(0, 10),
  })
}
