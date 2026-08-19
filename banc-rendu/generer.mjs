// Génération du portrait de garage par IA d'image.
//
// node banc-rendu/generer.mjs <fichier-de-prompt.js> [photo…]
//
// Reproductibilité : température 0, prompt figé et versionné dans un fichier, réponse mise en
// CACHE par (photo × version de prompt). Un rendu rejoué est identique et gratuit. Ce n'est pas
// la même reproductibilité qu'un pipeline déterministe — deux appels peuvent différer — mais
// c'est celle qui compte ici : le prompt est le code, il est relu, versionné et comparé.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ici = path.dirname(new URL(import.meta.url).pathname)
const dossier = path.join(ici, 'photos')
const sorties = path.join(ici, 'sorties', 'gemini')
fs.mkdirSync(sorties, { recursive: true })

const cle = (() => {
  const l = fs.readFileSync(path.join(ici, '..', '.env'), 'utf8')
    .split('\n').find(l => l.startsWith('GEMINI_IMAGE'))
  // La ligne porte un commentaire et des espaces autour du signe égal.
  return l?.split('=').slice(1).join('=').replace(/#.*/, '').replace(/["' ]/g, '').trim()
})()
if (!cle) { console.error('GEMINI_IMAGE absente de .env'); process.exit(1) }

const cheminPrompt = process.argv[2]
if (!cheminPrompt) { console.error('usage : node banc-rendu/generer.mjs prompts/<fichier>.js [photo…]'); process.exit(1) }
const P = await import(path.join(ici, cheminPrompt))

const filtre = process.argv.slice(3)
const noms = fs.readdirSync(dossier)
  .filter(f => /\.(jpe?g|png)$/i.test(f) && !f.startsWith('.'))
  .filter(f => !filtre.length || filtre.some(x => f.includes(x)))
  .sort()

// L'image d'entrée est réduite : le modèle n'a pas besoin de 18 Mpx pour reconnaître une moto,
// et les jetons d'image se paient.
function reduire(nom) {
  const tmp = path.join(sorties, '.entree.jpg')
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '86',
    '-Z', String(P.entreePx ?? 1024), path.join(dossier, nom), '--out', tmp], { stdio: 'ignore' })
  const b = fs.readFileSync(tmp).toString('base64')
  fs.unlinkSync(tmp)
  return b
}

async function generer(nom) {
  const cadre = (() => {
    const c = path.join(dossier, nom + '.cadre.json')
    return fs.existsSync(c) ? JSON.parse(fs.readFileSync(c, 'utf8')) : null
  })()

  const sortie = path.join(sorties, `${P.version}--${path.parse(nom).name}.png`)
  if (fs.existsSync(sortie)) return { nom, cache: true, sortie }

  const corps = {
    contents: [{
      role: 'user',
      parts: [
        { text: P.prompt(cadre) },
        { inlineData: { mimeType: 'image/jpeg', data: reduire(nom) } },
      ],
    }],
    generationConfig: {
      temperature: 0,
      responseModalities: ['IMAGE'],
      ...(P.generationConfig ?? {}),
    },
  }

  let r
  for (let essai = 0; ; essai++) {
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${P.modele}:generateContent`,
      { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle }, body: JSON.stringify(corps) })
    if (r.ok) break
    const t = await r.text()
    if ((r.status !== 429 && r.status < 500) || essai >= 3) throw new Error(`${r.status} ${t.slice(0, 300)}`)
    await new Promise(x => setTimeout(x, 4000 * (essai + 1)))
  }
  const rep = await r.json()
  const parts = rep.candidates?.[0]?.content?.parts ?? []
  const img = parts.find(p => p.inlineData)
  if (!img) throw new Error('aucune image : ' + JSON.stringify(rep).slice(0, 400))
  fs.writeFileSync(sortie, Buffer.from(img.inlineData.data, 'base64'))
  return { nom, sortie, jetons: rep.usageMetadata?.totalTokenCount }
}

console.log(`prompt ${P.version} · modèle ${P.modele} · ${noms.length} photo(s)`)
let jetons = 0
for (const nom of noms) {
  try {
    const r = await generer(nom)
    jetons += r.jetons ?? 0
    const ko = Math.round(fs.statSync(r.sortie).size / 1024)
    console.log(`  ${nom.padEnd(18)} ${r.cache ? '(cache)' : '       '} ${ko} Ko  ${path.basename(r.sortie)}`)
  } catch (e) { console.log(`  ${nom.padEnd(18)} ÉCHEC : ${e.message}`) }
}
if (jetons) console.log(`${jetons} jetons`)
