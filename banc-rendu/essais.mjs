// Tous les essais, d'un seul geste. L'ordre n'est pas anodin : les unitaires
// d'abord, parce qu'ils tournent en quelques secondes et qu'un invariant cassé
// rend inutile de dérouler dix parcours complets pour le découvrir.
import { spawn } from 'node:child_process'

const lancer = (cmd, args) => new Promise((res) => {
  const p = spawn(cmd, args, { stdio: 'inherit' })
  p.on('exit', (code) => res(code ?? 1))
})

/**
 * ⚠ LE BANC MONTE SON PROPRE SERVEUR.
 *
 * Sans ça, une session où `vite preview` n'a pas été lancé à la main rend
 * VINGT-DEUX ÉCHECS d'un coup — tous avec `ERR_CONNECTION_REFUSED`, aucun avec
 * un défaut du produit. C'est arrivé, et le premier réflexe devant vingt-deux
 * lignes rouges est de douter du code plutôt que du harnais.
 *
 * Un banc qui échoue pour une raison qui n'est pas le sujet est un banc qu'on
 * finit par ne plus croire, et un banc qu'on ne croit plus ne protège rien.
 */
const attendreLeServeur = async (url, essais = 60) => {
  for (let i = 0; i < essais; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(1000) })
      if (r.ok) return true
    } catch { /* pas encore debout */ }
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

let serveur = null
const monterLeServeur = async () => {
  if (await attendreLeServeur('http://localhost:4173/', 1)) {
    console.log('  (un serveur écoute déjà sur 4173 — on l\'utilise)')
    return true
  }
  console.log('  démarrage de vite preview sur 4173…')
  serveur = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'],
    { stdio: 'ignore', detached: false })
  const debout = await attendreLeServeur('http://localhost:4173/')
  if (!debout) console.error('  ✗ le serveur n\'est pas monté — les essais vont tous échouer')
  return debout
}
const descendreLeServeur = () => { if (serveur) serveur.kill() }
process.on('exit', descendreLeServeur)
process.on('SIGINT', () => { descendreLeServeur(); process.exit(130) })

const BOUT_EN_BOUT = [
  'fumee', 'fumee-chargement', 'fumee-accueil', 'fumee-conseil', 'fumee-cout', 'fumee-instruments',
  'fumee-confirmation', 'fumee-journee', 'fumee-chute', 'fumee-preparation', 'fumee-photo', 'fumee-coffre', 'fumee-recap', 'fumee-circuit', 'fumee-circuit-fiche', 'fumee-emport', 'fumee-portrait', 'fumee-atelier', 'fumee-budget', 'fumee-machine', 'fumee-legal', 'fumee-vide-saisonnier', 'fumee-courbe', 'fumee-usure', 'fumee-checklist', 'fumee-saison', 'fumee-cercle', 'fumee-destructif',
]

console.log('\n═══ essais unitaires ═══')
let rates = await lancer('node', ['banc-rendu/unite.mjs']) ? ['unitaires'] : []

// Les essais de bout en bout attaquent le PAQUET CONSTRUIT, servi par `vite
// preview` — pas les sources. C'est le seul moyen de voir un défaut que le
// bundler introduit, et c'est déjà arrivé.
// La photo de 48,8 Mpx que quatre essais versent se fabrique ICI, une fois. Si
// elle échouait à l'intérieur d'un essai, on lirait quatre échecs là où il n'y a
// qu'un problème de harnais — c'est exactement ce qui est arrivé.
console.log('\n═══ essais de bout en bout ═══')
const { photoDEssai } = await import('./photo-essai.mjs')
const photo = await photoDEssai()
console.log(`  photo d'essai : ${photo}`)
if (!await monterLeServeur()) {
  console.error('\n✗ aucun serveur sur 4173 : les essais de bout en bout n\'ont pas tourné.')
  process.exit(1)
}
for (const t of BOUT_EN_BOUT) {
  console.log(`\n─── ${t}`)
  const args = t === 'fumee'
    ? [`banc-rendu/${t}.mjs`, 'http://localhost:4173', `/tmp/${t}.png`]
    : [`banc-rendu/${t}.mjs`, `/tmp/${t}.png`]
  if (await lancer('node', args)) rates.push(t)
}

descendreLeServeur()
console.log(rates.length
  ? `\n✗ ${rates.length} en échec : ${rates.join(', ')}`
  : `\n✓ ${BOUT_EN_BOUT.length + 1} essais verts`)
process.exit(rates.length ? 1 : 0)
