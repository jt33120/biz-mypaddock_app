import { chromium } from 'playwright-core'
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' })
const context = await browser.newContext()
const writes = []
const errors = []
context.on('request', r => { if (['POST','PUT','PATCH','DELETE'].includes(r.method())) writes.push(r.url()) })
context.on('page', p => p.on('pageerror', e => errors.push(e.message)))
const normal = await context.newPage()
await normal.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded' })
await normal.locator('nav.barre').waitFor()
await normal.evaluate(async () => {
  const { ecrireLocale } = await import('/src/db/coffre.ts')
  await ecrireLocale('night-isolation-proof', new Blob(['original-reference']))
})
const preview = await context.newPage()
await preview.goto('http://127.0.0.1:5173/?apercu=night', { waitUntil: 'domcontentloaded' })
await preview.locator('.portrait-night').first().waitFor()
const isolated = await preview.evaluate(async () => {
  const { supabase, supabaseConfigure } = await import('/src/db/supabase.ts')
  const { ecrireLocale, lireLocale } = await import('/src/db/coffre.ts')
  const before = await lireLocale('night-isolation-proof')
  await ecrireLocale('night-isolation-proof', new Blob(['preview-reference']))
  return { noRemoteClient: supabase === null && !supabaseConfigure, separateMedia: before === null, ownMedia: await (await lireLocale('night-isolation-proof')).text() === 'preview-reference' }
})
const originalIntact = await normal.evaluate(async () => {
  const { lireLocale } = await import('/src/db/coffre.ts')
  return await (await lireLocale('night-isolation-proof')).text() === 'original-reference'
})
const directPrivateDenied = (await context.request.get('http://127.0.0.1:5173/.local/night-session/manifest.json')).status() === 403
const unrelated = await normal.evaluate(async () => {
  const { localPortraitData } = await import('/src/visuals/local-portraits.ts')
  return await localPortraitData('unrelated-entity') === null
})
const result = { ...isolated, originalIntact, directPrivateDenied, unrelated, noNetworkWrites: writes.length === 0, noRuntimeErrors: errors.length === 0 }
console.log(JSON.stringify(result, null, 2))
await browser.close()
if (Object.values(result).some(v => !v)) process.exitCode = 1
