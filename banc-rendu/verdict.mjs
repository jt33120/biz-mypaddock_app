/**
 * LA CONVENTION DU BANC DEVIENT UNE GARANTIE.
 *
 * ⚠ CE FICHIER EXISTE À CAUSE D'UN DÉFAUT DU BANC QUI NE S'ÉTAIT PAS ENCORE
 * MANIFESTÉ — et c'est exactement le genre qu'on ne trouve qu'en le cherchant.
 *
 * Huit essais de bout en bout écrivent leurs verdicts par convention :
 *
 *     console.log('   la clause est tenue :', ok ? 'oui' : 'NON')
 *
 * …puis se terminent tous par la même ligne :
 *
 *     process.exit(erreurs.length ? 1 : 0)
 *
 * Or `erreurs` ne collecte QUE les erreurs de console et les exceptions de page.
 * Une assertion pouvait donc imprimer « NON » en grand, et le lanceur compter
 * l'essai comme vert. Quarante-deux assertions étaient dans ce cas.
 *
 * VÉRIFIÉ AVANT DE CORRIGER : au 25 août 2026, un passage complet du banc ne
 * produit AUCUN « NON ». Aucun essai ne mentait donc réellement — la faiblesse
 * était latente, pas active. Mais un banc dont l'honnêteté tient à la chance
 * est un banc qu'on croit à tort, et c'est pire qu'un banc rouge : on ne relit
 * pas ce qu'on croit vert.
 *
 * On ne réécrit pas les quarante-deux assertions : on rend la convention
 * OPPOSABLE. Importer ce module met `console.log` sous écoute ; toute ligne
 * portant « NON » en capitales — le mot que le banc s'est donné pour dire
 * l'échec — est retenue, et `sortir()` la fait compter.
 */

const rates = []
const vraiLog = console.log

console.log = (...args) => {
  const ligne = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ')
  // Les capitales font la différence, et c'est délibéré : « non » en minuscules
  // est une RÉPONSE légitime dans ce banc — « le message d'échec est présent :
  // non » veut dire que tout va bien. Seul « NON » en capitales est le mot que
  // la convention réserve à l'échec.
  if (/\bNON\b/.test(ligne)) rates.push(ligne.trim())
  vraiLog(...args)
}

/** Ce que le banc a imprimé comme échec, dans l'ordre. */
export const nonDits = () => [...rates]

/**
 * La sortie unique de tout essai qui suit la convention. Elle échoue sur DEUX
 * motifs indépendants, et il faut les deux : une erreur de console sans
 * assertion fausse est un vrai incident, et une assertion fausse sans erreur de
 * console est exactement le cas que ce fichier existe pour attraper.
 */
export const sortir = (erreurs = []) => {
  console.log('erreurs :', erreurs.length ? erreurs : 'aucune')
  if (rates.length) {
    vraiLog(`\n✗ ${rates.length} assertion(s) en échec :`)
    for (const r of rates) vraiLog('  · ' + r)
  }
  process.exit(erreurs.length || rates.length ? 1 : 0)
}
