// First-paint artwork is independent of React; readiness and failure both release it.
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { dirname, extname } from 'node:path'
import { chromium } from 'playwright-core'
import { sortir } from './verdict.mjs'

const base = process.env.SPLASH_TEST_URL ?? 'http://localhost:4173'
const sortie = process.argv[2] ?? '/tmp/chargement.png'
const racine = sortie.slice(0, -extname(sortie).length)
await mkdir(dirname(sortie), { recursive: true })
const nav = await chromium.launch({
  executablePath: process.env.CHROME
    ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const erreurs = []

// Hold application scripts, preserving the real document, image, CSS and fonts.
const sceneSeule = async (viewport, reducedMotion = 'no-preference') => {
  const page = await nav.newPage({ viewport, deviceScaleFactor: 1, reducedMotion })
  await page.route('**/*', (route) => route.request().resourceType() === 'script'
    && /^\/(?:src\/main\.tsx|assets\/index-[^/]+\.js)$/.test(new URL(route.request().url()).pathname)
    ? route.fulfill({ contentType: 'application/javascript', body: '' })
    : route.continue())
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => {
    const image = document.querySelector('.ch-art')
    return image?.complete && image.naturalWidth > 0
  })
  await page.evaluate(() => document.fonts.ready)
  return page
}

for (const [width, height] of [[390, 844], [768, 1024], [1440, 960]]) {
  const page = await sceneSeule({ width, height })
  assert.equal(await page.locator('#chargement [role="status"]').innerText(), 'Ouverture du paddock')
  assert.equal(await page.locator('.ch-brand').innerText(), await page.title())
  assert.equal(await page.locator('#chargement [aria-valuenow], #chargement progress').count(), 0)
  assert.equal(await page.locator('.ch-art').getAttribute('alt'), '')
  const rendu = await page.evaluate(() => {
    const marque = document.querySelector('.ch-brand').getBoundingClientRect()
    return {
      overflow: document.documentElement.scrollWidth > innerWidth,
      titreVisible: marque.left >= 0 && marque.right <= innerWidth,
      renduImage: getComputedStyle(document.querySelector('.ch-art')).imageRendering,
      fonte: getComputedStyle(document.querySelector('.ch-brand')).fontFamily,
    }
  })
  assert.equal(rendu.overflow, false, `horizontal overflow at ${width}`)
  assert.equal(rendu.titreVisible, true, `brand clipped at ${width}`)
  assert.notEqual(rendu.renduImage, 'pixelated')
  assert.match(rendu.fonte, /-apple-system|BlinkMacSystemFont|SF Pro Display|Segoe UI/, 'system display font before React')
  await page.screenshot({ path: width === 390 ? sortie : `${racine}-${width}.png` })
  console.log(`✓ scène avant React, statut accessible et mise en page ${width} px`)
  await page.close()
}

const calme = await sceneSeule({ width: 390, height: 844 }, 'reduce')
assert.equal(await calme.locator('.ch-rail').evaluate(el => getComputedStyle(el, '::after').animationName), 'none')
assert.equal(await calme.locator('.ch-art').evaluate(el => getComputedStyle(el).animationName), 'none')
await calme.close()
console.log('✓ mouvement réduit : indicateur immobile')

const page = await nav.newPage({ viewport: { width: 390, height: 844 } })
page.on('pageerror', e => erreurs.push(e.message))
await page.goto(base, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('nav.barre', { timeout: 30_000 })
await page.waitForFunction(() => !document.getElementById('chargement'), null, { timeout: 1000 })
await page.getByRole('button', { name: 'GARAGE', exact: true }).click()
await page.waitForSelector('section.garage', { timeout: 10_000 })
console.log('✓ application prête : décor retiré, navigation accessible')
await page.close()

// Simulate a browser that cannot provide a database worker. The error UI must
// replace the scene, including with transitions disabled.
const panne = await nav.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
await panne.addInitScript(() => {
  class WorkerIndisponible {
    constructor() { throw new Error('Stockage indisponible pour cet essai') }
  }
  Object.defineProperty(window, 'Worker', { value: WorkerIndisponible })
  Object.defineProperty(window, 'SharedWorker', { value: WorkerIndisponible })
})
await panne.goto(base, { waitUntil: 'domcontentloaded' })
await panne.getByRole('heading', { name: 'Le stockage a refusé' }).waitFor({ timeout: 30_000 })
await panne.waitForFunction(() => !document.getElementById('chargement'), null, { timeout: 1000 })
assert.equal(await panne.getByRole('button', { name: 'Réessayer', exact: true }).isVisible(), true)
assert.equal(await panne.getByRole('link', { name: 'Ouvrir dans le navigateur', exact: true }).isVisible(), true)
await panne.screenshot({ path: `${racine}-erreur.png`, fullPage: true })
console.log('✓ stockage indisponible : message et actions de reprise visibles')
await panne.close()

await nav.close()
sortir(erreurs)
