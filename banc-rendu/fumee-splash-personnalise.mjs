import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const base = process.env.SPLASH_TEST_URL ?? 'http://127.0.0.1:4175'
const output = process.argv[2] ?? '/tmp/splash-personnalise'
const fixture = process.env.SPLASH_TEST_IMAGE ?? 'public/icon-512.png'
assert(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname))
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.CHROME
  ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' })
const checks = []
const errors = []
let external = 0
const check = (name, ok) => { assert(ok, name); checks.push({ name, ok }); console.log(`✓ ${name}`) }
const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
context.on('page', page => page.on('pageerror', error => errors.push(error.message)))
await context.route('**/*', route => {
  if (new URL(route.request().url()).origin !== new URL(base).origin) { external++; return route.abort() }
  return route.continue()
})
const waitApp = async page => {
  await page.locator('nav.barre').waitFor({ timeout: 45000 })
  await page.waitForFunction(() => !document.getElementById('chargement'), null, { timeout: 5000 })
}
const holdApp = async page => {
  await page.route('**/*', route => route.request().resourceType() === 'script'
    && /^\/(?:src\/main\.tsx|assets\/index-[^/]+\.js)$/.test(new URL(route.request().url()).pathname)
    ? route.fulfill({ contentType: 'application/javascript', body: '' }) : route.fallback())
}
const page = await context.newPage()
try {
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  await waitApp(page)
  check('generic first opening has no personal cache', await page.evaluate(() => !window.mypaddockSplash.read()))
  await page.locator('nav.barre .onglet').filter({ hasText: 'GARAGE' }).click()
  await page.getByPlaceholder('Honda', { exact: true }).fill('Honda')
  await page.getByPlaceholder('CBR 1000 RR', { exact: true }).fill('CBR 83')
  await page.getByRole('button', { name: 'Déclarer ma moto', exact: true }).click()
  await page.locator('.garage .modele').waitFor()
  await page.locator('section.garage > input[accept="image/*"]').setInputFiles(fixture)
  await page.waitForFunction(() => !!window.mypaddockSplash.read(), null, { timeout: 10000 })
  const photo = await page.evaluate(() => window.mypaddockSplash.read())
  check('a real locally imported photo primes the next opening', photo.data.startsWith('data:image/webp;'))
  await page.locator('section.garage > input[accept="image/png,image/jpeg,image/webp"]').setInputFiles(fixture)
  await page.getByRole('button', { name: 'Garder cette illustration', exact: true }).click()
  await page.waitForFunction(() => !document.querySelector('.garage-illustration-preview'))
  await page.waitForFunction(previous => window.mypaddockSplash.read()?.data !== previous,
    photo.data, { timeout: 10000 })
  const saved = await page.evaluate(() => window.mypaddockSplash.read())
  check('one bounded raster cache is retained', saved.data.length <= 180000)
  // New tabs must hit the real held entry request, not an already controlling
  // service worker. Offline behavior is exercised separately below.
  await page.evaluate(async () => {
    for (const registration of await navigator.serviceWorker.getRegistrations()) await registration.unregister()
  })

  for (const [width, height] of [[390, 844], [768, 1024], [1440, 960]]) {
    const cold = await context.newPage()
    await cold.setViewportSize({ width, height })
    await holdApp(cold)
    await cold.goto(base, { waitUntil: 'domcontentloaded' })
    await cold.locator('#chargement.ch-personal').waitFor()
    const state = await cold.evaluate(() => ({
      source: document.querySelector('#ch-bike').src,
      emptyReact: !document.querySelector('#root').childElementCount,
      overflow: document.documentElement.scrollWidth > innerWidth,
      motion: getComputedStyle(document.querySelector('#ch-bike')).animationName,
    }))
    check(`personal motorcycle before React at ${width}px`, state.source === saved.data && state.emptyReact && !state.overflow)
    check(`horizontal motorcycle motion at ${width}px`, state.motion === 'ch-ride')
    await cold.evaluate(() => document.getAnimations().forEach(a => { a.pause(); a.currentTime = 1100 }))
    await cold.screenshot({ path: `${output}/personal-${width}.png` })
    await cold.close()
  }

  const reduced = await context.newPage()
  await reduced.emulateMedia({ reducedMotion: 'reduce' })
  await holdApp(reduced)
  await reduced.goto(base, { waitUntil: 'domcontentloaded' })
  await reduced.locator('#chargement.ch-personal').waitFor()
  check('reduced motion keeps the personal motorcycle still', await reduced.locator('#ch-bike')
    .evaluate(el => getComputedStyle(el).animationName === 'none'))
  await reduced.close()

  const preview = await context.newPage()
  await holdApp(preview)
  await preview.goto(`${base}/?apercu=night`, { waitUntil: 'domcontentloaded' })
  check('preview cannot read or mutate the personal cache', await preview.evaluate(() => {
    const before = localStorage.getItem('mypaddock.splash.image.v1')
    window.mypaddockSplash.clear(); window.mypaddockSplash.accountChanged()
    return !window.mypaddockSplash.ticket() && !window.mypaddockSplash.read()
      && before === localStorage.getItem('mypaddock.splash.image.v1')
      && !document.querySelector('#chargement.ch-personal')
  }))
  await preview.close()

  // The deployed PWA caches the bootstrap script with the rest of the shell.
  if (!base.includes(':5173')) {
    await page.evaluate(() => navigator.serviceWorker.register('/sw.js'))
    await page.evaluate(() => navigator.serviceWorker.ready)
    await page.reload({ waitUntil: 'domcontentloaded' }); await waitApp(page)
    await page.addInitScript(() => {
      window.__personalPaint = false
      new MutationObserver(() => {
        if (document.querySelector('#chargement.ch-personal')) window.__personalPaint = true
      }).observe(document, { childList: true, subtree: true, attributes: true })
    })
    await context.setOffline(true)
    await page.reload({ waitUntil: 'domcontentloaded' }); await waitApp(page)
    check('installed production shell and personal cold start work offline', await page.evaluate(() => window.__personalPaint))
    await context.setOffline(false)
  }

  if (base.includes(':5173')) {
    await page.evaluate(async () => {
      const { ouvrirBase } = await import('/src/db/powersync.ts')
      const db = ouvrirBase(); await db.init()
      await db.execute('UPDATE machine SET sprite = NULL, photo_chemin = NULL WHERE id = ?', [window.mypaddockSplash.read().id])
      window.__splashTestDb = db
    })
    await page.waitForFunction(() => !window.mypaddockSplash.read(), null, { timeout: 10000 })
    check('removing all source images invalidates the next splash', true)
    await page.evaluate(async saved => {
      await window.__splashTestDb.execute('UPDATE machine SET sprite = ? WHERE id = ?', [saved.data, saved.id])
    }, saved)
    await page.waitForFunction(() => !!window.mypaddockSplash.read(), null, { timeout: 10000 })
  }

  check('erasure cancels an in-flight thumbnail from the same account', await page.evaluate(() => {
    const cache = window.mypaddockSplash
    const old = cache.ticket(); const image = cache.read()
    cache.clear()
    return !cache.write(image.id, image.data, old) && !cache.read()
  }))
  await page.close()

  // Isolated first-paint cases: no main bundle or database can hide a failure.
  const invalid = [
    ['malformed JSON', '{'],
    ['unsupported version', JSON.stringify({ ...saved, v: 0 })],
    ['foreign account', JSON.stringify({ ...saved, owner: 'another-rider' })],
    ['null owner', JSON.stringify({ ...saved, owner: null })],
    ['remote URL', JSON.stringify({ ...saved, data: 'https://example.com/private.png' })],
    ['SVG content', JSON.stringify({ ...saved, data: 'data:image/svg+xml;base64,PHN2Zz4=' })],
    ['oversized cache', JSON.stringify({ ...saved, data: `data:image/png;base64,${'A'.repeat(180001)}` })],
    ['corrupt raster', JSON.stringify({ ...saved, data: 'data:image/png;base64,YmFk' })],
  ]
  for (const [name, record] of invalid) {
    const invalidContext = await browser.newContext()
    const p = await invalidContext.newPage()
    await p.addInitScript(record => localStorage.setItem('mypaddock.splash.image.v1', record), record)
    await holdApp(p)
    await p.goto(base, { waitUntil: 'domcontentloaded' })
    await p.waitForFunction(() => !localStorage.getItem('mypaddock.splash.image.v1'))
    check(`${name} falls back safely`, await p.locator('#ch-bike').isHidden())
    await invalidContext.close()
  }

  for (const identity of ['signed-out', 'malformed']) {
    const noOwner = await browser.newPage()
    await noOwner.addInitScript(({ saved, identity }) => {
      localStorage.setItem('mypaddock.splash.account-seen', '1')
      if (identity === 'malformed') localStorage.setItem('mypaddock.identite', '{')
      localStorage.setItem('mypaddock.splash.image.v1', JSON.stringify({ ...saved, owner: null }))
    }, { saved, identity })
    await holdApp(noOwner)
    await noOwner.goto(base, { waitUntil: 'domcontentloaded' })
    check(`${identity} identity cannot display a null-owner picture`, await noOwner.evaluate(() =>
      !window.mypaddockSplash.read() && !document.querySelector('#chargement.ch-personal')))
    await noOwner.close()
  }

  const denied = await browser.newPage()
  await denied.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('storage denied') }
    Storage.prototype.setItem = () => { throw new Error('storage denied') }
  })
  await holdApp(denied)
  await denied.goto(base, { waitUntil: 'domcontentloaded' })
  check('denied storage leaves generic splash usable', await denied.locator('#chargement [role="status"]').isVisible())
  await denied.close()

  const switched = await browser.newPage()
  await switched.addInitScript(saved => {
    localStorage.setItem('mypaddock.identite', JSON.stringify({ id: 'account-b', email: null }))
    localStorage.setItem('mypaddock.splash.image.v1', JSON.stringify({ ...saved, owner: 'account-a' }))
  }, saved)
  await holdApp(switched)
  await switched.goto(base, { waitUntil: 'domcontentloaded' })
  check('account switch never paints the previous rider', await switched.evaluate(() =>
    !window.mypaddockSplash.read() && !document.querySelector('#chargement.ch-personal')))
  check('logout cannot convert account data into anonymous data', await switched.evaluate(() => {
    window.mypaddockSplash.accountChanged(); localStorage.removeItem('mypaddock.identite')
    return window.mypaddockSplash.ticket() === null
  }))
  await switched.close()
  if (errors.length) console.error(errors)
  check('no runtime errors', errors.length === 0)
  check('anonymous personalization made no external requests', external === 0)
  await writeFile(`${output}/results.json`, JSON.stringify({ base, checks, errors }, null, 2))
} finally { await browser.close() }
