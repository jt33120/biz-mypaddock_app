import { useEffect, useState } from 'react'
import { lireSolde, soldeConnu, type Solde } from '../db/credits'

/**
 * LE COMPTEUR DE CRÉDITS — en haut à gauche, sur tous les écrans.
 *
 * « Un compteur en haut à gauche qui peut se faire rajouter » — Julian,
 * 3 septembre 2026.
 *
 * ⚠ IL EST DANS LA COQUE, PAS DANS UN ÉCRAN, et c'est ce qui le rend utile. Les
 * crédits se dépensent au GARAGE (le portrait d'une moto) et dans l'ÉQUIPEMENT
 * (celui d'un casque) ; ils se liront demain ailleurs encore. Un compteur posé
 * sur l'écran où l'on dépense n'apprend rien — on le découvre au moment où il
 * est trop tard pour en tenir compte. Posé dans la coque, il est déjà su quand
 * on arrive sur le bouton.
 *
 * ⚠ IL N'APPARAÎT PAS SANS COMPTE, ET CE N'EST PAS UN OUBLI. Le produit est
 * local-first : ne pas avoir de compte est l'ÉTAT PAR DÉFAUT, donc le plus lu.
 * Un compteur qui annoncerait « 3 crédits » à quelqu'un qui ne peut pas s'en
 * servir promet ce que le geste suivant refuse — c'est le défaut exact déjà
 * corrigé dans `Refaire` (« elle regarde s'il y a un compte avant de parler d'un
 * compte »), et le recommettre trois centimètres plus haut serait pire.
 *
 * ⚠ CE N'EST PAS UNE JAUGE, ET IL NE PEUT PAS EN DEVENIR UNE. Aucune barre,
 * aucun plein, aucun pourcentage : il n'y a pas de maximum: un compte peut se
 * faire créditer autant qu'on veut, donc toute échelle serait inventée. C'est la
 * même règle que `Barres.tsx` applique aux tracés, et elle vaut ici pour la même
 * raison — une jauge affirme un plafond, et celui-là n'existe pas.
 *
 * ⚠ ET IL NE ROUGIT JAMAIS. Zéro crédit n'est pas une alerte : rien n'est cassé,
 * rien ne se perd, il y a seulement un geste payant qu'on ne peut pas faire
 * aujourd'hui. Le rouge de ce produit ne dit qu'une chose — « ceci part et ne
 * revient pas » — et le diluer sur une pénurie de crédits l'affaiblirait là où
 * il compte vraiment.
 */
export function Credits({ signal }: {
  /** Change à chaque fois qu'un crédit a pu partir. Le compteur se relit alors :
   *  il n'écoute rien en continu, parce qu'un nombre qui bouge trois fois par an
   *  ne justifie pas une connexion permanente. */
  signal: number
}) {
  /* On peint AVEC CE QU'ON SAIT DÉJÀ, avant tout réseau. Au paddock il n'y a pas
     de réseau du tout : un compteur qui n'apparaîtrait qu'après une réponse
     serait absent précisément là où on le consulte. */
  const [solde, setSolde] = useState<Solde | null>(() => soldeConnu())

  useEffect(() => {
    let vivant = true
    void lireSolde()
      .then((s) => { if (vivant && s) setSolde(s) })
      // Un échec ne vide pas le compteur : la dernière valeur connue vaut mieux
      // qu'un blanc, et elle n'autorise rien — le serveur reste seul juge au
      // moment de dépenser.
      .catch(() => {})
    return () => { vivant = false }
  }, [signal])

  if (!solde) return null

  return (
    <p className="hud-credits">
      <span className="chiffre">{solde.illimite ? '∞' : solde.reste}</span>
      <span className="mot">{solde.illimite || solde.reste !== 1 ? 'crédits' : 'crédit'}</span>
    </p>
  )
}
