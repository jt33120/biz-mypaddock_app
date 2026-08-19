// Étape IA du pipeline — et son périmètre est délibérément minuscule.
//
// Ce que le banc a montré sur les six photos de Julian : à réglages identiques, les trois
// photos où la moto occupe une petite part du cadre sont inexploitables, parce que la teinte
// dominante et la résolution du pixel sont mesurées sur TOUTE l'image. Le gazon et la piste
// gagnent par la masse. Ce n'est pas un défaut de réglage, c'est un défaut de cadrage.
//
// Donc l'IA répond à UNE question, celle qu'un modèle de vision fait bien :
//   « où est la machine dans ce cadre, et sous quel angle la voit-on ? »
//
// Elle ne choisit aucune couleur, aucun seuil, aucune palette. Tout ce qui est numérique
// reste MESURÉ par le pipeline déterministe, à l'intérieur du cadre qu'elle a rendu. C'est ce
// qui rend l'ensemble reproductible : la surface d'IA est réduite au strict minimum, sa
// réponse est contrainte par un schéma, et elle est MISE EN CACHE par photo — donc un rendu
// rejoué est identique à l'octet près, et gratuit.
//
// Et si l'IA échoue, se trompe ou n'est pas joignable : repli sur le cadre plein. Le produit
// dégrade, il ne casse pas.

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ici = path.dirname(new URL(import.meta.url).pathname)
const dossier = path.join(ici, 'photos')
const MODELE = 'mistral-large-2512'

const cle = (() => {
  const env = fs.readFileSync(path.join(ici, '..', '.env.local'), 'utf8')
  // Les guillemets autour de la valeur font partie du .env — les garder envoie une clé invalide.
  return env.match(/^(?:VITE_)?MISTRAL_API_KEY=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '')
})()
if (!cle) { console.error('clé Mistral absente de .env.local'); process.exit(1) }

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['machine_presente', 'cadre', 'vue', 'pilote_present', 'confiance'],
  properties: {
    machine_presente: { type: 'boolean' },
    // Coordonnées normalisées 0–1. Un modèle de vision est fiable sur une boîte,
    // pas sur un contour — on ne lui demande donc qu'une boîte.
    cadre: {
      type: 'object', additionalProperties: false,
      required: ['x', 'y', 'l', 'h'],
      properties: {
        x: { type: 'number' }, y: { type: 'number' },
        l: { type: 'number' }, h: { type: 'number' },
      },
    },
    vue: { type: 'string', enum: ['profil', 'trois_quarts_avant', 'trois_quarts_arriere', 'face', 'arriere', 'autre'] },
    pilote_present: { type: 'boolean' },
    confiance: { type: 'number' },
  },
}

const CONSIGNE = `Tu reçois la photo d'une moto. Rends la boîte englobante de la MACHINE.

Règles :
- Coordonnées normalisées entre 0 et 1 : x et y sont le coin haut-gauche, l la largeur, h la hauteur.
- La boîte serre la machine : roue avant à roue arrière, bas des pneus au haut du carénage ou du guidon.
- Si un pilote est dessus, la boîte suit la MACHINE, pas le pilote — mais elle ne coupe pas la machine.
- N'inclus ni le paddock, ni le camion, ni la remorque, ni le sol au-delà des pneus.
- Si aucune moto n'est présente, machine_presente vaut faux et le cadre couvre tout (0,0,1,1).
- confiance est ton propre degré de certitude sur la boîte, entre 0 et 1.`

async function cadrer(nom) {
  const cache = path.join(dossier, nom + '.cadre.json')
  if (fs.existsSync(cache)) return { ...JSON.parse(fs.readFileSync(cache, 'utf8')), cache: true }

  // On envoie une version réduite : la boîte est normalisée, donc la résolution n'y change
  // rien, et 768 px suffisent largement pour situer une moto. Les jetons, eux, comptent.
  const petit = path.join(dossier, '.' + nom + '.768.jpg')
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '80', '-Z', '768',
    path.join(dossier, nom), '--out', petit], { stdio: 'ignore' })
  const b64 = fs.readFileSync(petit).toString('base64')
  fs.unlinkSync(petit)

  const appel = () => fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cle}` },
    body: JSON.stringify({
      model: MODELE,
      temperature: 0,          // la variance ne sert à rien ici
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: CONSIGNE },
          { type: 'image_url', image_url: `data:image/jpeg;base64,${b64}` },
        ],
      }],
      // Le schéma contraint la FORME, jamais la vérité : une boîte bien formée peut être
      // fausse. D'où confiance, le repli sur cadre plein, et le fait que rien de numérique
      // ne dépende du modèle.
      response_format: { type: 'json_schema', json_schema: { name: 'cadre_machine', strict: true, schema: SCHEMA } },
    }),
  })
  // Limite de débit : on attend et on reprend. Sans ça une photo sur six tombe au hasard,
  // ce qui ressemblerait à un défaut de pipeline alors que c'est un quota.
  let r
  for (let essai = 0; ; essai++) {
    r = await appel()
    if (r.ok) break
    if (r.status !== 429 || essai >= 4) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`)
    await new Promise(t => setTimeout(t, 2000 * (essai + 1)))
  }
  const rep = await r.json()
  const out = JSON.parse(rep.choices[0].message.content)
  out.modele = MODELE
  out.jetons = rep.usage
  fs.writeFileSync(cache, JSON.stringify(out, null, 1))
  return out
}

const noms = fs.readdirSync(dossier).filter(f => /\.(jpe?g|png|webp)$/i.test(f) && !f.startsWith('.')).sort()
let jetons = 0
for (const nom of noms) {
  try {
    const c = await cadrer(nom)
    jetons += c.jetons?.total_tokens ?? 0
    const { x, y, l, h } = c.cadre
    console.log(`${nom.padEnd(18)} ${c.cache ? '(cache) ' : '        '}` +
      `cadre ${x.toFixed(2)},${y.toFixed(2)} ${l.toFixed(2)}×${h.toFixed(2)}  ` +
      `${c.vue.padEnd(19)} pilote:${c.pilote_present ? 'oui' : 'non '} conf:${c.confiance}`)
  } catch (e) { console.log(`${nom.padEnd(18)} ÉCHEC : ${e.message}`) }
}
if (jetons) console.log(`\n${jetons} jetons — mis en cache, donc payés une seule fois par photo.`)
