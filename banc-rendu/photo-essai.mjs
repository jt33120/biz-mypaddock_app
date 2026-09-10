// La photo d'essai, fabriquée sur place.
//
// ⚠ CE FICHIER EXISTE À CAUSE D'UN DÉFAUT DU BANC, PAS DU PRODUIT.
//
// Quatre essais — photo, emport, portrait, atelier — pointaient un chemin absolu
// vers le répertoire jetable d'une session de travail. Ce répertoire a disparu,
// et les quatre essais sont tombés d'un coup avec un ENOENT : aucun défaut du
// produit, quatre lignes rouges. Un banc qui échoue pour une raison qui n'est pas
// son sujet est un banc qu'on finit par ne plus croire.
//
// La photo n'est donc plus un fichier qu'on trouve : c'est un fichier qu'on
// fabrique, ici, à la demande, sans réseau et sans photo personnelle.
//
// 8064 × 6048 = 48,8 Mpx — le format d'un iPhone récent, soit TROIS FOIS le
// plafond de canevas de Safari sur iOS (16 777 216 px). C'est le cas NOMINAL du
// produit : la réduction n'est pas un cas limite, c'est le chemin normal.
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ICI = path.dirname(fileURLToPath(import.meta.url))
// Même échappatoire que `unite.mjs` : le poste de travail reste le défaut, et
// `CHROME` permet à une machine sans `/Applications` de fabriquer la fixture.
// Sans elle, ce générateur est le seul maillon qui empêche le banc entier de
// tourner ailleurs — et une fixture qu'on ne peut pas fabriquer redevient une
// fixture qu'on doit trouver, ce que ce fichier existe précisément pour éviter.
export const CHROME = process.env.CHROME
  ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const DOSSIER = path.join(ICI, '.fixtures')
const FICHIER = path.join(DOSSIER, 'grande.jpg')

export const LARGEUR = 8064
export const HAUTEUR = 6048

/**
 * Rend le chemin d'une vraie photo JPEG de 48,8 Mpx, en la fabriquant au premier
 * appel. Les appels suivants la retrouvent sur le disque : la fabrication prend
 * quelques secondes, et vingt-cinq essais ne vont pas la refaire vingt-cinq fois.
 *
 * `PHOTO_ESSAI` permet de lui substituer une vraie photo d'appareil — utile pour
 * regarder un rendu à l'œil, jamais nécessaire pour que le banc passe.
 */
export const photoDEssai = async () => {
  if (process.env.PHOTO_ESSAI) return process.env.PHOTO_ESSAI
  if (fs.existsSync(FICHIER) && fs.statSync(FICHIER).size > 100_000) return FICHIER

  fs.mkdirSync(DOSSIER, { recursive: true })
  const nav = await chromium.launch({ executablePath: CHROME })
  const page = await nav.newPage()
  // Le dessin n'est pas décoratif : un aplat uni se comprimerait en quelques
  // kilo-octets et ne pèserait rien à la lecture. Du dégradé, du bruit et des
  // formes donnent un JPEG de taille réaliste — c'est le poids, autant que les
  // dimensions, qui met le chemin de réduction sous contrainte.
  const b64 = await page.evaluate(async ({ L, H }) => {
    const c = new OffscreenCanvas(L, H)
    const g = c.getContext('2d')
    const ciel = g.createLinearGradient(0, 0, 0, H)
    ciel.addColorStop(0, '#1b3a5c'); ciel.addColorStop(0.55, '#8fb3d9'); ciel.addColorStop(1, '#3c3f44')
    g.fillStyle = ciel; g.fillRect(0, 0, L, H)
    // Une pseudo-moto rouge et blanche, et de la piste : des masses de couleur
    // franches, comme sur une vraie photo de roulage.
    g.fillStyle = '#c0272d'; g.beginPath(); g.ellipse(L * 0.45, H * 0.55, L * 0.22, H * 0.14, -0.2, 0, 7); g.fill()
    g.fillStyle = '#f2f2f2'; g.beginPath(); g.ellipse(L * 0.55, H * 0.5, L * 0.1, H * 0.07, -0.2, 0, 7); g.fill()
    g.fillStyle = '#121212'
    for (const x of [0.3, 0.68]) { g.beginPath(); g.arc(L * x, H * 0.72, H * 0.11, 0, 7); g.fill() }
    // Du grain, dessiné par bandes : un bruit pixel par pixel sur 48,8 Mpx
    // tiendrait la minute pour rien.
    for (let i = 0; i < 6000; i++) {
      g.fillStyle = `rgba(${(i * 37) % 255},${(i * 91) % 255},${(i * 53) % 255},0.35)`
      g.fillRect((i * 811) % L, (i * 613) % H, 40, 40)
    }
    const blob = await c.convertToBlob({ type: 'image/jpeg', quality: 0.92 })
    const buf = new Uint8Array(await blob.arrayBuffer())
    let s = ''
    for (let i = 0; i < buf.length; i += 8192) s += String.fromCharCode(...buf.subarray(i, i + 8192))
    return btoa(s)
  }, { L: LARGEUR, H: HAUTEUR })
  await nav.close()

  fs.writeFileSync(FICHIER, Buffer.from(b64, 'base64'))
  return FICHIER
}

// Appelable seul, pour fabriquer la photo sans lancer d'essai.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const f = await photoDEssai()
  console.log(`${f} · ${Math.round(fs.statSync(f).size / 1024)} Ko · ${LARGEUR} × ${HAUTEUR}`)
}
