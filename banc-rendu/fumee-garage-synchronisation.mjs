import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'

// Mount the real Garage with a disposable SQLite database. Writes arrive through
// the database, independently from its buttons, as they do during PowerSync sync.
const base = process.argv[2] ?? 'http://127.0.0.1:5173'
assert(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname))
const browser = await chromium.launch({ executablePath: process.env.CHROME
  ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const modules = new Map()
const errors = []
page.on('pageerror', e => errors.push(e.message))
page.on('request', request => {
  const url = new URL(request.url())
  if (/\/react(?:-dom_client)?\.js$/.test(url.pathname)) modules.set(url.pathname.split('/').pop(), url.href)
})
await page.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin
  ? route.continue() : route.abort())
try {
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  await page.locator('nav.barre').waitFor({ timeout: 30000 })
  await page.evaluate(async ({ react, dom }) => {
    const [reactModule, domModule, { Garage }, { ouvrirBase }] = await Promise.all([
      import(react), import(dom), import('/src/ecrans/Garage.tsx'), import('/src/db/powersync.ts'),
    ])
    const { createElement } = reactModule.default
    const { createRoot } = domModule.default
    const db = ouvrirBase('collection-hydration-test.db')
    await db.init()
    window.collectionDb = db
    const fixture = document.createElement('div'); fixture.id = 'collection-fixture'
    document.body.append(fixture)
    createRoot(fixture).render(createElement(Garage, { db, onEcrit: () => {}, onArgentParMoto: null }))
    const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64
    const ctx = canvas.getContext('2d')
    const portrait = color => { ctx.fillStyle = color; ctx.fillRect(0, 0, 64, 64); return canvas.toDataURL('image/webp') }
    window.collectionPortraits = { initial: portrait('#888888'), remote: portrait('#333333') }
  }, { react: modules.get('react.js'), dom: modules.get('react-dom_client.js') })
  const root = page.locator('#collection-fixture')
  await root.locator('.garage.vide').waitFor()
  await page.evaluate(async () => {
    await window.collectionDb.execute('INSERT INTO machine (id, marque, modele, annee, sprite) VALUES (?, ?, ?, ?, ?)',
      ['sync-bike', 'Honda', 'Sync initial', 2010, window.collectionPortraits.initial])
  })
  await root.locator('.garage-vehicle .portrait-night').waitFor()
  assert.equal(await root.locator('.modele').textContent(), 'Sync initial')
  console.log('ok motorcycle arriving after mount replaces the empty form')

  await root.locator('.tete-inventaire').click()
  await page.evaluate(async () => {
    for (const [id, nom, genre] of [['sync-helmet', 'Casque synchronisé', 'casque'], ['sync-suit', 'Combi synchronisée', 'combinaison']])
      await window.collectionDb.execute('INSERT INTO equipement (id, nom, categorie, genre, sprite) VALUES (?, ?, ?, ?, ?)',
        [id, nom, 'protection', genre, window.collectionPortraits.initial])
  })
  await root.locator('.materiel').nth(1).waitFor()
  const helmet = root.locator('.materiel').filter({ hasText: 'Casque synchronisé' })
  assert.equal(await helmet.getByRole('button', { name: 'Casque', exact: true }).getAttribute('data-actif'), '1')
  console.log('ok equipment and its genre arriving after expansion become visible')

  await root.getByRole('button', { name: 'Modifier la moto', exact: true }).click()
  await root.getByLabel('Modèle', { exact: true }).fill('Brouillon conservé')
  await root.locator('.garage-selection > input[accept="image/png,image/jpeg,image/webp"]').setInputFiles('public/icon-512.png')
  await root.locator('.garage-illustration-preview').waitFor()
  await helmet.getByLabel('Illustration de Casque synchronisé', { exact: true }).setInputFiles('public/icon-512.png')
  await helmet.getByRole('region').waitFor()
  const machineCandidate = await root.locator('.garage-illustration-preview img').getAttribute('src')
  const equipmentCandidate = await helmet.getByRole('region').locator('img').getAttribute('src')
  await page.evaluate(async () => {
    await window.collectionDb.execute('UPDATE machine SET modele = ?, sprite = ? WHERE id = ?',
      ['Sync changed', window.collectionPortraits.remote, 'sync-bike'])
    await window.collectionDb.execute('UPDATE equipement SET sprite = ? WHERE id = ?',
      [window.collectionPortraits.remote, 'sync-helmet'])
  })
  await page.waitForFunction(() => {
    const root = document.getElementById('collection-fixture')
    return root.querySelector('.modele')?.textContent === 'Sync changed'
      && root.querySelector('.garage-vehicle img')?.src === window.collectionPortraits.remote
      && [...root.querySelectorAll('.materiel')].find(el => el.textContent.includes('Casque synchronisé'))
        ?.querySelector('.scene-equipement img')?.src === window.collectionPortraits.remote
  })
  assert.equal(await root.getByLabel('Modèle', { exact: true }).inputValue(), 'Brouillon conservé')
  assert.equal(await root.locator('.garage-illustration-preview img').getAttribute('src'), machineCandidate)
  assert.equal(await helmet.getByRole('region').locator('img').getAttribute('src'), equipmentCandidate)
  console.log('ok external portrait updates render while machine draft and both import previews survive')

  await page.evaluate(async () => {
    await window.collectionDb.execute('INSERT INTO machine (id, marque, modele, annee) VALUES (?, ?, ?, ?)',
      ['zz-new-bike', 'Yamaha', 'New arrival', 2019])
  })
  await root.locator('nav[aria-label="Choisir une moto"] button').nth(1).waitFor()
  assert.equal(await root.locator('.modele').textContent(), 'Sync changed')
  assert.equal(await root.getByLabel('Modèle', { exact: true }).inputValue(), 'Brouillon conservé')
  assert.equal(await root.locator('.garage-illustration-preview img').getAttribute('src'), machineCandidate)
  console.log('ok a second machine does not change the selected identity or edit state')
  assert.deepEqual(errors, [])
  console.log('4/4 collection synchronization checks passed; no runtime errors or external writes.')
} finally { await browser.close() }
