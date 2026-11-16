// Minimale statische server voor dist/ (preview + tests). Past de headers uit vercel.json toe
// (o.a. de CSP), zodat lokaal hetzelfde beveiligingsbeleid geldt als op Vercel.
//   node scripts/serve.mjs dist [poort]

import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
}

export function startServer(dir = 'dist', port = 0) {
  const root = path.resolve(dir)
  const vercel = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
  const globaal = vercel.headers.find((h) => h.source.startsWith('/(('))?.headers ?? []
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://x')
    let pad = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '')
    let bestand = path.join(root, pad)
    if (!bestand.startsWith(root)) {
      res.writeHead(403).end()
      return
    }
    if (existsSync(bestand) && statSync(bestand).isDirectory()) bestand = path.join(bestand, 'index.html')
    let status = 200
    if (!existsSync(bestand)) {
      bestand = path.join(root, '404.html')
      status = 404
    }
    for (const h of globaal) res.setHeader(h.key, h.value)
    res.setHeader('content-type', MIME[path.extname(bestand)] ?? 'application/octet-stream')
    res.writeHead(status)
    res.end(readFileSync(bestand))
  })
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = await startServer(process.argv[2] || 'dist', Number(process.argv[3] || 4173))
  console.log(`▸ http://127.0.0.1:${server.address().port}/`)
}
