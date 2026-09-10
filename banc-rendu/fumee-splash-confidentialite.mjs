// Actual source modules under Vite; every browser context is disposable.
import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'
const base = process.env.SPLASH_TEST_URL ?? 'http://127.0.0.1:5173'
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname))
const browser = await chromium.launch({ executablePath: process.env.CHROME
  ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' })
const errors = []
try {
  const page = await browser.newPage()
  page.on('pageerror', e => errors.push(e.message))
  await page.route('**/src/main.tsx', route => route.fulfill({ contentType: 'application/javascript', body: '' }))
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  const failed = await page.evaluate(async () => {
    const { effacerLeTelephone } = await import('/src/db/effacer.ts')
    localStorage.setItem('mypaddock.identite', JSON.stringify({ id: 'rider-a', email: null }))
    const cache = window.mypaddockSplash
    const ticket = cache.ticket()
    const canvas = document.createElement('canvas'); canvas.width = 16; canvas.height = 16
    const raster = canvas.toDataURL('image/png')
    cache.remember('bike-a', ticket); cache.write('bike-a', raster, ticket)
    let rejected = false
    try { await effacerLeTelephone({ disconnectAndClear: async () => { throw new Error('SQLite locked') } }) }
    catch { rejected = true }
    return {
      rejected,
      pictureRemoved: !localStorage.getItem('mypaddock.splash.image.v1'),
      retriesStillIdentifyDevice: !!localStorage.getItem('mypaddock.identite'),
      pendingWriteRejected: !cache.write('bike-a', raster, ticket),
      blocked: cache.ticket() === null && localStorage.getItem('mypaddock.splash.blocked') === '1',
    }
  })
  for (const [name, ok] of Object.entries(failed)) assert(ok, name)
  await page.reload({ waitUntil: 'domcontentloaded' })
  assert(await page.evaluate(() => window.mypaddockSplash.ticket() === null))
  console.log('✓ failed SQLite erasure rejects, preserves retry state, blocks cache and survives restart')
  const success = await page.evaluate(async () => {
    const { effacerLeTelephone } = await import('/src/db/effacer.ts')
    let cleared = false
    await effacerLeTelephone({ disconnectAndClear: async () => { cleared = true } })
    return { cleared, noPersonalKeys: Object.keys(localStorage).every(k => !k.startsWith('mypaddock.')) }
  })
  assert(success.cleared && success.noPersonalKeys)
  console.log('✓ confirmed cleanup removes the block and all personal keys')
  await page.close()

  const switched = await browser.newPage()
  switched.on('pageerror', e => errors.push(e.message))
  await switched.addInitScript(() => {
    localStorage.setItem('mypaddock.identite', JSON.stringify({ id: 'rider-b', email: null }))
    localStorage.setItem('mypaddock.splash.trust.v1', JSON.stringify({ owner: 'rider-a', ids: ['old-bike-a'] }))
  })
  await switched.route('**/src/main.tsx', route => route.fulfill({ contentType: 'application/javascript', body: '' }))
  let rls = 0
  await switched.route('**/rest/v1/machine?*', route => {
    const query = new URL(route.request().url()).searchParams
    assert.equal(query.get('pilote_id'), 'eq.rider-b')
    assert.equal(query.get('id'), 'eq.old-bike-a')
    rls++
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]',
      headers: { 'Access-Control-Allow-Origin': new URL(base).origin } })
  })
  await switched.goto(base, { waitUntil: 'domcontentloaded' })
  const start = await switched.evaluate(async () => {
    const { surveillerMotoDeChargement } = await import('/src/visuals/splash-personalization.ts')
    const cache = window.mypaddockSplash
    window.__claims = 0
    const remember = cache.remember
    cache.remember = (...args) => { window.__claims++; return remember(...args) }
    const revision = cache.ticket().revision
    const canvas = document.createElement('canvas'); canvas.width = 16; canvas.height = 16
    surveillerMotoDeChargement({
      getAll: async () => [{ id: 'old-bike-a', sprite: canvas.toDataURL('image/webp'), photo_chemin: null }],
      onChange: () => () => {},
    })
    return revision
  })
  await switched.waitForFunction(start => window.mypaddockSplash.ticket()?.revision !== start, start)
  assert.equal(rls, 1)
  assert(await switched.evaluate(() => window.__claims === 0 && !window.mypaddockSplash.read()))
  console.log('✓ RLS refusal prevents a new account from claiming a surviving SQLite motorcycle')
  await switched.close()
  const ui = await browser.newPage()
  ui.on('pageerror', e => errors.push(e.message))
  let serverDeletes = 0
  await ui.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.pathname === '/src/main.tsx') return route.fulfill({ contentType: 'application/javascript', body: '' })
    if (url.pathname === '/functions/v1/effacer') {
      serverDeletes++
      return route.fulfill({ status: 200, contentType: 'application/json', body: '{"efface":true,"objets":0}',
        headers: { 'Access-Control-Allow-Origin': new URL(base).origin } })
    }
    return url.origin === new URL(base).origin ? route.continue() : route.abort()
  })
  await ui.goto(base, { waitUntil: 'domcontentloaded' })
  await ui.evaluate(async () => {
    const reactModule = await import('/node_modules/.vite/deps/react.js')
    const React = reactModule.default ?? reactModule
    const rootModule = await import('/node_modules/.vite/deps/react-dom_client.js')
    const { createRoot } = rootModule.default ?? rootModule
    const { Compte } = await import('/src/ecrans/Compte.tsx')
    const { supabase } = await import('/src/db/supabase.ts')
    supabase.auth.getSession = async () => ({ data: { session: { access_token: 'local-test-only' } }, error: null })
    let attempts = 0
    const db = { getAll: async () => [], get: async () => ({ n: 0 }),
      disconnectAndClear: async () => { if (++attempts === 1) throw new Error('SQLite locked') } }
    document.getElementById('chargement').remove()
    createRoot(document.getElementById('root')).render(React.createElement(Compte, {
      db, identite: { id: 'rider-a', email: null }, adoption: { etat: 'inconnue' },
      onLegal() {}, onSonde() {},
    }))
  })
  await ui.getByRole('button', { name: 'Effacer mon compte', exact: true }).click()
  await ui.getByRole('button', { name: 'Effacer définitivement', exact: true }).click()
  await ui.getByText("Le compte a été effacé au serveur, mais le nettoyage de ce téléphone n'a pas abouti. Réessaie pour le terminer.", { exact: true }).waitFor()
  assert.equal(await ui.getByRole('heading', { name: 'Il ne reste rien' }).count(), 0)
  await ui.getByRole('button', { name: 'Terminer le nettoyage de ce téléphone', exact: true }).click()
  await ui.getByRole('heading', { name: 'Il ne reste rien' }).waitFor()
  assert.equal(serverDeletes, 1)
  console.log('✓ partial erasure stays truthful and UI retry finishes locally without deleting the server twice')
  await ui.close()
  assert.deepEqual(errors, [])
} finally { await browser.close() }
