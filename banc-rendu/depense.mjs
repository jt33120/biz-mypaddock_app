// Garde-fou de dépense pour toute génération d'image. Écrit après un dépassement réel :
// 107 images produites, dont 91 par un workflow d'agents à qui j'avais donné un PLANCHER
// d'itérations (« itère au moins 4 fois ») et aucun PLAFOND. Le vrai danger n'était pas le prix
// unitaire, c'était qu'une dépense ait lieu en tâche de fond, sans être visible pendant qu'elle
// se produisait.
//
// Trois verrous, et le troisième est le seul qui aurait arrêté ce qui s'est passé :
//   1. le cache — une image déjà produite ne se repaie jamais ;
//   2. le plafond — un compteur persistant qui refuse d'aller au-delà ;
//   3. la confirmation EXPLICITE et CHIFFRÉE — rien ne part sans --confirme=<n>, où n doit
//      être exactement le nombre d'appels prévus. Un agent qui boucle ne peut pas satisfaire
//      cette condition sans l'avoir annoncée.
import fs from 'node:fs'
import path from 'node:path'

const ici = path.dirname(new URL(import.meta.url).pathname)
const JOURNAL = path.join(ici, 'journal-depenses.json')

// Prix unitaire DÉRIVÉ du relevé de Julian (≈ 16,98 € pour ~107 images), pas d'un tarif publié.
// Il est donc à vérifier avant tout usage économique. Le journal enregistre les jetons réels
// pour qu'un tarif exact puisse être réappliqué après coup sans redemander une facture.
const EUR_PAR_IMAGE = 0.16

function lire() {
  if (!fs.existsSync(JOURNAL))
    return { plafond_eur: 5, eur_par_image_estime: EUR_PAR_IMAGE, appels: [] }
  return JSON.parse(fs.readFileSync(JOURNAL, 'utf8'))
}

export function etat() {
  const j = lire()
  const n = j.appels.length
  const depense = n * (j.eur_par_image_estime ?? EUR_PAR_IMAGE)
  return { n, depense, plafond: j.plafond_eur, reste: j.plafond_eur - depense }
}

/**
 * À appeler AVANT la première requête. Refuse si la confirmation manque, si le nombre annoncé
 * ne correspond pas, ou si le plafond serait franchi. Le message dit toujours quoi faire.
 */
export function autoriser(prevus, { quoi = 'génération' } = {}) {
  const arg = process.argv.find(a => a.startsWith('--confirme'))
  const e = etat()

  if (!arg) {
    console.error(
      `\n  REFUSÉ — aucune confirmation.\n` +
      `  ${quoi} : ${prevus} appel(s) d'image prévus, soit ≈ ${(prevus * EUR_PAR_IMAGE).toFixed(2)} €.\n` +
      `  Déjà dépensé sur ce banc : ${e.depense.toFixed(2)} € sur un plafond de ${e.plafond.toFixed(2)} €.\n` +
      `  Pour lancer : relancer la même commande avec --confirme=${prevus}\n`)
    process.exit(2)
  }
  const annonce = Number(arg.split('=')[1])
  if (annonce !== prevus) {
    console.error(
      `\n  REFUSÉ — le nombre confirmé ne correspond pas.\n` +
      `  Confirmé : ${annonce}. Réellement prévu : ${prevus}.\n` +
      `  C'est volontairement strict : une boucle qui dérive ne peut pas satisfaire cette condition.\n`)
    process.exit(2)
  }
  const apres = e.depense + prevus * EUR_PAR_IMAGE
  if (apres > e.plafond) {
    console.error(
      `\n  REFUSÉ — plafond du banc franchi.\n` +
      `  ${e.depense.toFixed(2)} € dépensés + ${(prevus * EUR_PAR_IMAGE).toFixed(2)} € = ` +
      `${apres.toFixed(2)} € pour un plafond de ${e.plafond.toFixed(2)} €.\n` +
      `  Relever le plafond dans banc-rendu/journal-depenses.json, en connaissance de cause.\n`)
    process.exit(2)
  }
  console.log(`  autorisé : ${prevus} appel(s) ≈ ${(prevus * EUR_PAR_IMAGE).toFixed(2)} € · ` +
              `déjà dépensé ${e.depense.toFixed(2)} € / ${e.plafond.toFixed(2)} €`)
}

/** À appeler APRÈS chaque requête réussie. Les jetons réels sont conservés pour pouvoir
 *  réappliquer un tarif exact plus tard sans redemander une facture. */
export function enregistrer({ version, cible, jetons, modele }) {
  const j = lire()
  // Pas de Date.now() dans les scripts de workflow ; ici on est en CLI, c'est légitime.
  j.appels.push({ quand: new Date().toISOString(), version, cible, jetons, modele })
  fs.writeFileSync(JOURNAL, JSON.stringify(j, null, 1))
}
