// Les trois gabarits, avec la moto, à leur taille réelle — et une vignette pour
// voir ce que ça donne dans un fil.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
})
const page = await nav.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:4173', { waitUntil: 'networkidle' })
await page.waitForFunction(() => !document.body.textContent.includes('chargement…'), null, { timeout: 60_000 })

// La moto d'abord, pour que le récapitulatif ait son portrait.
await page.click('nav.barre .onglet:has-text("GARAGE")')
await page.click('text=Reprendre la CBR 83')
await page.waitForSelector('.garage .sprite')
await page.click('text=Reprendre la saison 2026')
await page.waitForTimeout(1500)

await page.click('nav.barre .onglet:has-text("ROULAGES")')
await page.waitForSelector('.bloc', { timeout: 15_000 })
// Le premier de la liste est le plus récent DÉJÀ VÉCU ou à venir : on prend
// celui qui porte un chrono, sinon le récapitulatif n'a rien à montrer.
const cartes = await page.$$('.bloc')
for (const c of cartes) {
  if (/\d'\d\d"/.test(await c.textContent())) { await c.click(); break }
}
await page.waitForSelector('text=Meilleur tour du jour', { timeout: 15_000 })
await page.click('text=Ajouter une dépense')
await page.fill('#montant', '245')
await page.click('section.depense .bouton:not(.secondaire)')
await page.waitForSelector('text=Meilleur tour du jour')
await page.click('text=Voir le récapitulatif')
await page.waitForSelector('.recap-image')

const images = {}
for (const g of ['CHRONO', 'BUDGET', 'GESTE']) {
  // On attend que la SOURCE CHANGE, pas un délai : l'image est recomposée de
  // façon asynchrone, et un délai fixe lisait la précédente — la planche
  // sortait décalée d'un cran, ce qui ressemblait à un bug du produit.
  const avant = await page.$eval('.recap-image', n => n.src)
  await page.click(`.puce:has-text("${g}")`)
  if (g !== 'CHRONO') await page.waitForFunction(
    (a) => document.querySelector('.recap-image')?.src !== a, avant, { timeout: 15_000 })
  await page.waitForTimeout(200)
  const d = await page.$eval('.recap-image', async (n) => {
    const b = await (await fetch(n.src)).blob()
    return new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b) })
  })
  images[g] = d
  fs.writeFileSync(`/tmp/recap-${g}.png`, Buffer.from(d.split(',')[1], 'base64'))
  console.log(g, '→', Math.round(Buffer.from(d.split(',')[1], 'base64').length / 1024), 'Ko')
}

// Une planche : les trois en grand, puis la vignette de fil.
const html = `<meta charset="utf-8"><body style="margin:0;background:#05070F;font:12px/1.4 system-ui;color:#8FA3CE">
<div style="display:flex;gap:12px;padding:16px">
${['CHRONO','BUDGET','GESTE'].map(g => `<div><img src="${images[g]}" style="width:340px;display:block;border:1px solid #2a3358"><p style="letter-spacing:.14em">${g}</p></div>`).join('')}
<div><p style="letter-spacing:.14em">DANS UN FIL · 140 px</p>
${['CHRONO','BUDGET','GESTE'].map(g => `<img src="${images[g]}" style="width:140px;display:block;margin-bottom:8px;border:1px solid #2a3358">`).join('')}
</div></div></body>`
fs.writeFileSync('/tmp/planche.html', html)
const p2 = await nav.newPage({ viewport: { width: 1560, height: 900 }, deviceScaleFactor: 2 })
await p2.goto('file:///tmp/planche.html')
await p2.waitForTimeout(800)
await p2.screenshot({ path: process.argv[2] ?? '/tmp/planche-recap.png', fullPage: true })
await nav.close()
