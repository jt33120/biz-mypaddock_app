import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

type Portrait = { kind: 'machine' | 'equipement'; src: string }
/** Private artwork is served only by the loopback development server, never emitted. */
export function localNightPortraits(): Plugin {
  return {
    name: 'private-local-night-portraits',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0]
        if (!pathname.startsWith('/__local-night-portraits') && pathname !== '/__local-night-preview') return next()
        const local = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress ?? '')
        if (!local) { res.statusCode = 403; res.end(); return }
        res.setHeader('Cache-Control', 'no-store')
        res.setHeader('X-Content-Type-Options', 'nosniff')
        try {
          const directory = resolve(process.cwd(), '.local/night-session')
          if (pathname === '/__local-night-preview') {
            res.setHeader('Content-Type', 'application/json')
            res.end(await readFile(resolve(directory, 'preview.json')))
            return
          }
          const manifest = JSON.parse(await readFile(resolve(directory, 'manifest.json'), 'utf8')) as { portraits: Record<string, Portrait> }
          const portraits = Object.fromEntries(Object.entries(manifest.portraits).filter(([, p]) => /^\/__local-night-portraits\/[a-zA-Z0-9_-]+\.(png|webp)$/.test(p.src)))
          if (pathname === '/__local-night-portraits') {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ portraits }))
            return
          }
          const portrait = Object.values(portraits).find(p => p.src === pathname)
          if (!portrait) { res.statusCode = 404; res.end(); return }
          const filename = portrait.src.split('/').pop()!
          res.setHeader('Content-Type', filename.endsWith('.webp') ? 'image/webp' : 'image/png')
          res.end(await readFile(resolve(directory, filename)))
        } catch {
          res.setHeader('Content-Type', 'application/json')
          if (pathname === '/__local-night-portraits') res.end('{"portraits":{}}')
          else { res.statusCode = 404; res.end() }
        }
      })
    },
  }
}
