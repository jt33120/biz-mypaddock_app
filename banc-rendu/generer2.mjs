// Génération à RÉFÉRENCES MULTIPLES.
//
// node banc-rendu/generer2.mjs prompts/<fichier>.js [nom-du-groupe…]
//
// Pourquoi ce changement. Sur IMG_9243, le modèle a rendu une AUTRE moto — livrée HRC de
// catalogue au lieu de la vraie. Cause : le pilote couvrait le carénage, donc le modèle n'a pas
// vu la décoration et il est retombé sur son a priori. Le modèle reproduit ce qu'il voit et
// INVENTE ce qu'il ne voit pas, et son invention est toujours une moto de salon.
//
// Le remède n'est pas un meilleur prompt, c'est plus d'information : on envoie PLUSIEURS photos
// de la même machine — une désignée comme pose, les autres comme pièces à conviction sur la
// décoration. C'est aussi ce que le produit devra demander au pilote : une à trois photos de sa
// machine, pas une seule photo d'action.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ici = path.dirname(new URL(import.meta.url).pathname)
const dossier = path.join(ici, 'photos')
const sorties = path.join(ici, 'sorties', 'gemini')
fs.mkdirSync(sorties, { recursive: true })

// La Tracer 9 sort du jeu : Julian l'a écartée du périmètre.
const GROUPES = {
  'cbr83': {
    machine: 'Honda CBR 1000 RR — numéro 83',
    // La pose vient de la photo la plus lisible : machine seule, de profil, décoration entière.
    pose: 'IMG_9144.jpg',
    // Les références servent uniquement à établir la décoration et les équipements réels.
    references: ['IMG_9245.PNG', 'IMG_9139.jpg', 'IMG_9243.PNG'],
  },
}

const cle = (() => {
  const l = fs.readFileSync(path.join(ici, '..', '.env'), 'utf8')
    .split('\n').find(l => l.startsWith('GEMINI_IMAGE'))
  return l?.split('=').slice(1).join('=').replace(/#.*/, '').replace(/["' ]/g, '').trim()
})()
if (!cle) { console.error('GEMINI_IMAGE absente de .env'); process.exit(1) }

const cheminPrompt = process.argv[2]
if (!cheminPrompt) { console.error('usage : node banc-rendu/generer2.mjs prompts/<f>.js [groupe…]'); process.exit(1) }
const P = await import(path.join(ici, cheminPrompt))
const voulus = process.argv.slice(3)
const noms = Object.keys(GROUPES).filter(g => !voulus.length || voulus.includes(g))

function reduire(nom, px) {
  const tmp = path.join(sorties, `.e-${nom}.jpg`)
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '86', '-Z', String(px),
    path.join(dossier, nom), '--out', tmp], { stdio: 'ignore' })
  const b = fs.readFileSync(tmp).toString('base64')
  fs.unlinkSync(tmp)
  return { inlineData: { mimeType: 'image/jpeg', data: b } }
}

for (const g of noms) {
  const G = GROUPES[g]
  const sortie = path.join(sorties, `${P.version}--${g}.png`)
  if (fs.existsSync(sortie)) { console.log(`  ${g} (cache) ${path.basename(sortie)}`); continue }

  const cadre = (() => {
    const c = path.join(dossier, G.pose + '.cadre.json')
    return fs.existsSync(c) ? JSON.parse(fs.readFileSync(c, 'utf8')) : null
  })()

  // Ordre des parties : consigne, puis la POSE, puis chaque référence annoncée. Le modèle doit
  // savoir quelle image fait quoi — sans étiquette, il moyenne les quatre points de vue.
  const parts = [{ text: P.prompt(cadre, G) }]
  parts.push({ text: 'IMAGE 1 — POSE ET DÉCORATION DE RÉFÉRENCE. C’est la vue qui commande l’angle du rendu.' })
  parts.push(reduire(G.pose, P.entreePx ?? 1024))
  G.references.forEach((r, i) => {
    parts.push({ text: `IMAGE ${i + 2} — MÊME MACHINE, autre angle. Sert UNIQUEMENT à établir la décoration réelle, les équipements et les couleurs. N’en reprends ni l’angle, ni le cadrage, ni le pilote.` })
    parts.push(reduire(r, 768))
  })

  const corps = {
    contents: [{ role: 'user', parts }],
    generationConfig: { temperature: 0, responseModalities: ['IMAGE'], ...(P.generationConfig ?? {}) },
  }

  try {
    let r
    for (let essai = 0; ; essai++) {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${P.modele}:generateContent`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle }, body: JSON.stringify(corps) })
      if (r.ok) break
      const t = await r.text()
      if ((r.status !== 429 && r.status < 500) || essai >= 3) throw new Error(`${r.status} ${t.slice(0, 300)}`)
      await new Promise(x => setTimeout(x, 5000 * (essai + 1)))
    }
    const rep = await r.json()
    const img = (rep.candidates?.[0]?.content?.parts ?? []).find(p => p.inlineData)
    if (!img) throw new Error('aucune image : ' + JSON.stringify(rep).slice(0, 300))
    fs.writeFileSync(sortie, Buffer.from(img.inlineData.data, 'base64'))
    console.log(`  ${g}  ${Math.round(fs.statSync(sortie).size / 1024)} Ko  ${path.basename(sortie)}  ` +
                `${G.references.length + 1} références · ${rep.usageMetadata?.totalTokenCount} jetons`)
  } catch (e) { console.log(`  ${g} ÉCHEC : ${e.message}`) }
}
