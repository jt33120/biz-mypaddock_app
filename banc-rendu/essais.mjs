// Tous les essais, d'un seul geste. L'ordre n'est pas anodin : les unitaires
// d'abord, parce qu'ils tournent en quelques secondes et qu'un invariant cassé
// rend inutile de dérouler dix parcours complets pour le découvrir.
import { spawn } from 'node:child_process'

const lancer = (cmd, args) => new Promise((res) => {
  const p = spawn(cmd, args, { stdio: 'inherit' })
  p.on('exit', (code) => res(code ?? 1))
})

const BOUT_EN_BOUT = [
  'fumee', 'fumee-accueil', 'fumee-conseil', 'fumee-cout', 'fumee-instruments',
  'fumee-confirmation', 'fumee-photo', 'fumee-recap', 'fumee-circuit', 'fumee-emport', 'fumee-portrait', 'fumee-atelier', 'fumee-machine', 'fumee-legal', 'fumee-vide-saisonnier', 'fumee-courbe',
]

console.log('\n═══ essais unitaires ═══')
let rates = await lancer('node', ['banc-rendu/unite.mjs']) ? ['unitaires'] : []

// Les essais de bout en bout attaquent le PAQUET CONSTRUIT, servi par `vite
// preview` — pas les sources. C'est le seul moyen de voir un défaut que le
// bundler introduit, et c'est déjà arrivé.
console.log('\n═══ essais de bout en bout ═══')
for (const t of BOUT_EN_BOUT) {
  console.log(`\n─── ${t}`)
  const args = t === 'fumee'
    ? [`banc-rendu/${t}.mjs`, 'http://localhost:4173', `/tmp/${t}.png`]
    : [`banc-rendu/${t}.mjs`, `/tmp/${t}.png`]
  if (await lancer('node', args)) rates.push(t)
}

console.log(rates.length
  ? `\n✗ ${rates.length} en échec : ${rates.join(', ')}`
  : `\n✓ ${BOUT_EN_BOUT.length + 1} essais verts`)
process.exit(rates.length ? 1 : 0)
