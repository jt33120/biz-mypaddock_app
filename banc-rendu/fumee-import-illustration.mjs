import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'

// Isolated anonymous local browser: no request may reach an external service.
const base = process.argv[2] ?? 'http://127.0.0.1:5173'
assert(['localhost', '127.0.0.1', '[::1]'].includes(new URL(base).hostname))
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
let generationRequests = 0
await page.route('**/*', (route) => {
  const url = new URL(route.request().url())
  if (/\/functions\/v1\/sprite|generativelanguage|gemini/i.test(url.href)) generationRequests++
  return url.origin === new URL(base).origin ? route.continue() : route.abort()
})
try {
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  await page.locator('nav.barre').waitFor({ timeout: 30_000 })
  const validation = await page.evaluate(async () => {
    const { importerIllustration, estIllustrationImportee } = await import('/src/visuals/import-illustration.ts')
    const results = []
    const reject = async (name, file, expected) => {
      try { await importerIllustration(file); results.push({ name, ok: false }) }
      catch (error) { results.push({ name, ok: error.message.includes(expected) }) }
    }
    await reject('unsupported type', new File(['x'], 'x.svg', { type: 'image/svg+xml' }), 'PNG')
    await reject('10MB input limit', new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'x.png', { type: 'image/png' }), '10 Mo')
    await reject('disguised SVG', new File(['<svg/>'], 'x.png', { type: 'image/png' }), 'illisible')
    await reject('corrupt PNG', new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0])], 'x.png', { type: 'image/png' }), 'illisible')
    const oversized = (w, h) => {
      const bytes = new Uint8Array(32)
      bytes.set([137, 80, 78, 71, 13, 10, 26, 10]); bytes.set([73, 72, 68, 82], 12)
      const view = new DataView(bytes.buffer); view.setUint32(16, w); view.setUint32(20, h)
      return new File([bytes], 'huge.png', { type: 'image/png' })
    }
    let decodes = 0
    const decode = HTMLImageElement.prototype.decode
    HTMLImageElement.prototype.decode = function () { decodes++; return decode.call(this) }
    await reject('8192px limit', oversized(9000, 1), 'trop grande')
    await reject('24MP limit', oversized(6000, 5000), 'trop grande')
    results.push({ name: 'huge inputs never decoded', ok: decodes === 0 })
    HTMLImageElement.prototype.decode = decode
    const canvas = document.createElement('canvas'); canvas.width = 2400; canvas.height = 800
    const context = canvas.getContext('2d'); context.fillStyle = '#ec7a78'; context.fillRect(0, 0, 2400, 800)
    for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
      const file = new File([await new Promise((resolve) => canvas.toBlob(resolve, type))], 'wide', { type })
      const src = await importerIllustration(file)
      const image = new Image(); image.src = src; await image.decode()
      results.push({ name: `${type} resize`, ok: image.naturalWidth === 1536 && image.naturalHeight === 512
        && estIllustrationImportee(src) && atob(src.split(',')[1]).length <= 1024 * 1024 })
    }
    results.push({ name: 'legacy sprite remains distinguishable', ok: !estIllustrationImportee('data:image/png;base64,x') })
    canvas.width = 1536; canvas.height = 1536
    const noise = context.createImageData(1536, 1536); let seed = 927
    for (let i = 0; i < noise.data.length; i += 4) {
      for (let j = 0; j < 3; j++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; noise.data[i + j] = seed >>> 24 }
      noise.data[i + 3] = 255
    }
    context.putImageData(noise, 0, 0)
    await reject('1MB output limit', new File([await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))], 'noise.png', { type: 'image/png' }), 'trop lourde')
    return results
  })
  for (const result of validation) assert(result.ok, result.name)

  const openEquipment = async () => {
    await page.locator('nav.barre .onglet').filter({ hasText: 'GARAGE' }).click()
    await page.locator('.atelier.equipement .atelier-tete').click()
  }
  await openEquipment()
  for (const name of ['Casque import test', 'Combi untouched test']) {
    await page.getByText('Déclarer une pièce', { exact: true }).click()
    await page.getByPlaceholder('Combinaison cuir').fill(name)
    await page.getByRole('button', { name: 'Déclarer', exact: true }).click()
    await page.locator('.materiel').filter({ hasText: name }).waitFor()
  }
  const helmet = () => page.locator('.materiel').filter({ hasText: 'Casque import test' })
  const suit = () => page.locator('.materiel').filter({ hasText: 'Combi untouched test' })
  await helmet().locator('input[accept="image/*"]').setInputFiles('public/icon-192.png')
  await helmet().locator('.scene-equipement img').waitFor()
  const original = await helmet().locator('.scene-equipement img').getAttribute('src')
  const upload = () => helmet().locator('input[aria-label="Illustration de Casque import test"]')
    .setInputFiles('public/icon-512.png')
  await upload()
  await helmet().getByRole('region').waitFor()
  assert.equal(await helmet().locator('.scene-equipement img').first().getAttribute('src'), original)
  await helmet().getByRole('button', { name: 'Annuler', exact: true }).click()
  assert.equal(await helmet().getByRole('region').count(), 0)
  assert.equal(await helmet().locator('.scene-equipement img').getAttribute('src'), original)
  await upload()
  await helmet().getByRole('button', { name: 'Garder ce portrait', exact: true }).click()
  await page.waitForFunction(() => [...document.querySelectorAll('.materiel')]
    .find((el) => el.textContent.includes('Casque import test'))?.querySelector('img')?.src.startsWith('data:image/webp;'))
  assert.equal(await suit().locator('img').count(), 0)
  assert(await helmet().getByRole('button', { name: 'Remplacer la photo', exact: true }).isVisible())
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('nav.barre').waitFor({ timeout: 30_000 })
  await openEquipment()
  await helmet().locator('img').waitFor()
  assert((await helmet().locator('img').getAttribute('src')).startsWith('data:image/webp;'))
  assert.equal(await suit().locator('img').count(), 0)
  assert(await helmet().getByRole('button', { name: 'Remplacer la photo', exact: true }).isVisible())
  await mkdir('.local/night-session/qa', { recursive: true })
  await helmet().screenshot({ path: '.local/night-session/qa/import-equipment.png' })
  assert.equal(generationRequests, 0)
  console.log(`${validation.length}/12 image validation checks passed; equipment preview, cancel, confirm, original-photo preservation, item isolation and reload passed; zero generation requests.`)
} finally { await browser.close() }
