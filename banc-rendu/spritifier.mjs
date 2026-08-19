// De l'APPARENCE du pixel art à un VRAI sprite. node banc-rendu/spritifier.mjs <image> [grille]
//
// Sondé sur d2f--IMG_9144.png : 60 138 couleurs distinctes pour une image qui a l'air d'un
// sprite 128×128 à 26 couleurs. Le modèle rend un LOOK, pas une structure — même leçon que le
// damier qu'il avait peint quand on lui demandait un canal alpha. Ce qui doit être structurel se
// produit en aval, par du code, et c'est gratuit.
//
// Quatre passes déterministes :
//   1. RAMENER À LA GRILLE — couleur modale par cellule, pas moyenne : une moyenne invente des
//      teintes intermédiaires et rend le sprite flou, la modale garde des aplats francs.
//   2. DÉTACHER — remplissage depuis les bords, tolérant au bruit de compression. Le contour
//      fermé du sprite arrête l'inondation, et rien ne fuit à l'intérieur.
//   3. QUANTIFIER — palette courte obtenue par fusion des couleurs proches, par ordre de masse.
//   4. RECADRER sur l'alpha.
// Sortie : un PNG de la taille de la grille, quelques kilo-octets, agrandissable au plus proche
// voisin sans jamais se dégrader — ce qui compte pour une application qui doit tourner hors ligne.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'

const ici = path.dirname(new URL(import.meta.url).pathname)
const cible = process.argv[2]
const GRILLE = Number(process.argv[3] ?? 128)
if (!cible) { console.error('usage : node banc-rendu/spritifier.mjs sorties/gemini/<image>.png [grille]'); process.exit(1) }

const nav = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--allow-file-access-from-files'],
})
const page = await nav.newPage()
await page.goto(`file://${ici}/`)

const res = await page.evaluate(async ({ cible, GRILLE }) => {
  const im = new Image(); im.src = './' + cible
  await im.decode()
  const c = new OffscreenCanvas(im.width, im.height)
  const cx = c.getContext('2d', { willReadFrequently: true })
  cx.drawImage(im, 0, 0)
  const src = cx.getImageData(0, 0, im.width, im.height).data
  const bloc = Math.floor(Math.min(im.width, im.height) / GRILLE)
  const gw = Math.floor(im.width / bloc), gh = Math.floor(im.height / bloc)

  // --- passe 1 : couleur MODALE par cellule ---------------------------------------------
  // Les couleurs sont d'abord ramenées à 5 bits par canal pour que le bruit de compression
  // ne fasse pas de chaque pixel une couleur unique ; on vote ensuite sur ces classes.
  const grille = new Uint8ClampedArray(gw * gh * 3)
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const votes = new Map()
      for (let y = gy * bloc; y < (gy + 1) * bloc; y++) {
        for (let x = gx * bloc; x < (gx + 1) * bloc; x++) {
          const i = (y * im.width + x) * 4
          const k = ((src[i] >> 3) << 10) | ((src[i+1] >> 3) << 5) | (src[i+2] >> 3)
          const v = votes.get(k)
          if (v) { v.n++; v.r += src[i]; v.g += src[i+1]; v.b += src[i+2] }
          else votes.set(k, { n: 1, r: src[i], g: src[i+1], b: src[i+2] })
        }
      }
      let best = null
      for (const v of votes.values()) if (!best || v.n > best.n) best = v
      const o = (gy * gw + gx) * 3
      grille[o] = best.r / best.n; grille[o+1] = best.g / best.n; grille[o+2] = best.b / best.n
    }
  }

  // --- passe 2 : détachement par inondation depuis les bords ------------------------------
  const alpha = new Uint8Array(gw * gh).fill(255)
  const proche = (i, r, g, b, tol) =>
    Math.abs(grille[i*3] - r) + Math.abs(grille[i*3+1] - g) + Math.abs(grille[i*3+2] - b) < tol
  const pile = []
  const vu = new Uint8Array(gw * gh)
  const semer = (i) => { if (!vu[i]) { vu[i] = 1; pile.push(i) } }
  for (let x = 0; x < gw; x++) { semer(x); semer((gh - 1) * gw + x) }
  for (let y = 0; y < gh; y++) { semer(y * gw); semer(y * gw + gw - 1) }
  // Chaque cellule de départ porte sa propre référence : le fond a plusieurs aplats (ciel,
  // bandes, sol) et une référence unique laisserait les autres.
  const refs = pile.map(i => [grille[i*3], grille[i*3+1], grille[i*3+2]])
  const TOL = 46
  while (pile.length) {
    const i = pile.pop()
    let dedans = false
    for (const [r, g, b] of refs) if (proche(i, r, g, b, TOL)) { dedans = true; break }
    if (!dedans) continue
    alpha[i] = 0
    const x = i % gw, y = (i / gw) | 0
    if (x > 0) semer(i - 1)
    if (x < gw - 1) semer(i + 1)
    if (y > 0) semer(i - gw)
    if (y < gh - 1) semer(i + gw)
  }

  // --- passe 3 : palette courte ----------------------------------------------------------
  const masse = new Map()
  for (let i = 0; i < gw * gh; i++) {
    if (!alpha[i]) continue
    const k = ((grille[i*3] >> 3) << 10) | ((grille[i*3+1] >> 3) << 5) | (grille[i*3+2] >> 3)
    const v = masse.get(k)
    if (v) { v.n++ } else masse.set(k, { n: 1, r: grille[i*3], g: grille[i*3+1], b: grille[i*3+2] })
  }
  const tries = [...masse.values()].sort((a, b) => b.n - a.n)
  const palette = []
  for (const cnd of tries) {
    if (palette.length >= 26) break
    // On ne retient une couleur que si elle apporte vraiment une teinte de plus.
    if (!palette.some(p => Math.abs(p.r - cnd.r) + Math.abs(p.g - cnd.g) + Math.abs(p.b - cnd.b) < 30))
      palette.push(cnd)
  }

  // --- passe 4 : composition + recadrage sur l'alpha --------------------------------------
  let x0 = gw, y0 = gh, x1 = -1, y1 = -1
  for (let i = 0; i < gw * gh; i++) {
    if (!alpha[i]) continue
    const x = i % gw, y = (i / gw) | 0
    if (x < x0) x0 = x; if (x > x1) x1 = x
    if (y < y0) y0 = y; if (y > y1) y1 = y
  }
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1
  const out = new OffscreenCanvas(cw, ch)
  const ox = out.getContext('2d')
  const img = ox.createImageData(cw, ch)
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const i = (y + y0) * gw + (x + x0), j = (y * cw + x) * 4
      if (!alpha[i]) { img.data[j+3] = 0; continue }
      let best = palette[0], d = Infinity
      for (const p of palette) {
        const dd = Math.abs(p.r - grille[i*3]) + Math.abs(p.g - grille[i*3+1]) + Math.abs(p.b - grille[i*3+2])
        if (dd < d) { d = dd; best = p }
      }
      img.data[j] = best.r; img.data[j+1] = best.g; img.data[j+2] = best.b; img.data[j+3] = 255
    }
  }
  ox.putImageData(img, 0, 0)
  const blob = await out.convertToBlob({ type: 'image/png' })
  const buf = new Uint8Array(await blob.arrayBuffer())
  return {
    b64: btoa(String.fromCharCode(...buf)),
    gw, gh, bloc, cw, ch, couleurs: palette.length,
    opaques: alpha.reduce((a, v) => a + (v ? 1 : 0), 0),
  }
}, { cible, GRILLE })

await nav.close()
const nom = path.basename(cible, '.png') + `-sprite${GRILLE}.png`
const dest = path.join(ici, 'sorties', 'sprites')
fs.mkdirSync(dest, { recursive: true })
const chemin = path.join(dest, nom)
fs.writeFileSync(chemin, Buffer.from(res.b64, 'base64'))
console.log(`grille ${res.gw}×${res.gh} (bloc ${res.bloc} px) · recadré ${res.cw}×${res.ch} · ` +
            `${res.couleurs} couleurs · ${res.opaques} cellules opaques`)
console.log(`sprite → ${chemin}  (${Math.round(fs.statSync(chemin).size / 1024 * 10) / 10} Ko)`)
