// Le lanceur des essais unitaires.
//
// Ils tournent dans Chrome, sur les modules RÉELS servis par Vite en mode
// développement — pas sur une copie transpilée à part. Un essai qui éprouve
// autre chose que ce qui part n'éprouve rien.
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'

const vite = spawn('npx', ['vite', '--port', '5199', '--strictPort'], { stdio: 'pipe' })
const mourir = (code) => { try { vite.kill('SIGTERM') } catch { /* déjà partie */ } process.exit(code) }

// On attend que le serveur réponde, sans jamais dormir à l'aveugle.
const attendre = async () => {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch('http://localhost:5199/')).ok) return true } catch { /* pas encore */ }
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}
if (!await attendre()) { console.error('vite n\'a pas démarré'); mourir(1) }

// Le Chrome du poste de travail reste le défaut. `CHROME` n'existe que pour les
// machines qui n'ont pas d'`/Applications` — un conteneur d'intégration, une
// revue à distance : sans elle, la seule façon de faire tourner ces essais
// ailleurs est de modifier ce fichier, et une modification locale finit par
// partir dans un commit.
const nav = await chromium.launch({
  executablePath: process.env.CHROME
    ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage()
const erreurs = []
page.on('pageerror', (e) => erreurs.push(e.message))
await page.goto('http://localhost:5199/banc-rendu/unite/index.html', { waitUntil: 'networkidle' })
await page.waitForFunction(() => !!window.__unite, null, { timeout: 30_000 }).catch(() => {})

const u = await page.evaluate(() => window.__unite ?? null)
await nav.close()

if (!u) {
  console.error('les essais n\'ont pas tourné :', erreurs.length ? erreurs : 'raison inconnue')
  mourir(1)
}
for (const r of u.resultats)
  console.log(`${r.ok ? '  ok  ' : '  RATÉ'}  ${r.titre}${r.detail ? '\n          ' + r.detail : ''}`)
console.log(`\n${u.total - u.rates} / ${u.total} essais unitaires`)
if (erreurs.length) console.log('erreurs de page :', erreurs)
mourir(u.rates || erreurs.length ? 1 : 0)
