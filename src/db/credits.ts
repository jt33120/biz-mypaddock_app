/**
 * LE SOLDE EN CRÉDITS — la seule chose que le pilote lit avant de dépenser.
 *
 * « Ne pas marquer 16 cts, faire un système de crédit […] avec un compteur en
 * haut à gauche qui peut se faire rajouter. Un crédit couvre un appel IA en gros
 * sur la clé Gemini » — Julian, 3 septembre 2026.
 *
 * ⚠ POURQUOI LE CENTIME DISPARAÎT DE L'ÉCRAN SANS DISPARAÎTRE DE LA BASE. Les
 * deux unités ne servent pas au même : le centime MESURE ce que ça coûte à
 * Julian, le crédit SE DÉPENSE. `generation.cout_centimes` continue donc
 * d'enregistrer les centimes vrais, acte par acte — c'est la seule base honnête
 * pour fixer un prix de vente le jour venu (A-FAIRE §6 ③). Ce qui change, c'est
 * qu'on ne demande plus au pilote de convertir mentalement un prix d'achat en
 * décision : « 0,16 € » n'est pas une information qu'il peut utiliser, « il te
 * reste 3 crédits » en est une.
 *
 * ⚠ LE SOLDE NE SE CALCULE PAS ICI, ET C'EST LA GARDE QUI COMPTE. Il vient de
 * `mon_solde()`, côté serveur, qui le dérive du registre — accueil + accordés −
 * consommés. Le recalculer côté client demanderait de connaître les crédits
 * accordés, donc de les faire descendre, donc d'offrir une surface où les
 * écrire. « Un compteur que le compté peut écrire ne compte rien » : c'est la
 * phrase qui a fait de `generation` une table sans politique d'insertion, et
 * elle vaut autant ici.
 *
 * ⚠ ET IL SE SOUVIENT, PARCE QUE LE PRODUIT VIT HORS LIGNE. Au paddock il n'y a
 * pas de réseau : demander le solde au serveur à chaque affichage donnerait un
 * compteur vide là où le pilote en a le plus besoin. La dernière valeur connue
 * est donc gardée, et c'est elle qui s'affiche tant qu'une plus fraîche n'est pas
 * revenue. Elle peut être PÉRIMÉE — d'un crédit dépensé sur un autre appareil,
 * par exemple — et c'est acceptable : le serveur reste seul juge au moment de
 * dépenser, et il refuse tout seul. Un compteur périmé n'autorise rien.
 */
import { identite } from './compte'
import { supabase } from './supabase'

export type Solde = {
  /** Ce qu'il reste. Sans objet quand `illimite` est vrai — il vaut alors ce que
   *  le serveur a répondu, mais rien à l'écran ne doit s'en servir. */
  reste: number
  /** Le compte de test. Il ne consomme aucun crédit — voir la migration
   *  20260903000001, qui dit aussi pourquoi il reste sous le plafond global. */
  illimite: boolean
}

/** ⚠ ELLE RECOPIE UN DÉFAUT DE LA BASE, DONC ELLE PEUT MENTIR SI ON L'OUBLIE.
 *  `plafond.credits_accueil` est la source ; un essai unitaire relit la migration
 *  et confronte les deux, comme il le faisait déjà pour l'ancien quota. Elle ne
 *  sert qu'à parler AVANT d'avoir la réponse du serveur — jamais à décider. */
export const CREDITS_ACCUEIL = 3

/** Ce que coûte un portrait. Même garde : `plafond.credits_sprite` est la source,
 *  un essai les confronte. Un crédit = un appel IA sur la clé Gemini. */
export const CREDITS_PORTRAIT = 1

/* La dernière valeur connue. `localStorage` et non la base locale : c'est une
   donnée de SERVEUR mise en cache, pas une donnée du pilote. La ranger dans le
   coffre PowerSync la ferait ressembler à quelque chose qui se synchronise, et
   quelqu'un finirait par vouloir la remonter. */
const CLE = 'mypaddock.solde'

const relire = (): Solde | null => {
  try {
    const brut = localStorage.getItem(CLE)
    if (!brut) return null
    const v = JSON.parse(brut) as Partial<Solde>
    // Un cache écrit par une version antérieure peut avoir n'importe quelle
    // forme. On ne fait confiance qu'à ce qu'on reconnaît.
    if (typeof v.reste !== 'number' || typeof v.illimite !== 'boolean') return null
    return { reste: v.reste, illimite: v.illimite }
  } catch { return null }
}

const garder = (s: Solde) => {
  // Un navigateur en navigation privée refuse d'écrire. Ce n'est pas une panne :
  // le compteur vivra le temps de la session, et c'est tout ce qu'on lui demande.
  try { localStorage.setItem(CLE, JSON.stringify(s)) } catch { /* tant pis */ }
}

/** Le compteur se relit après une dépense. Il n'y a pas d'abonnement temps réel :
 *  le solde ne bouge que sur un geste du pilote ou un ajout côté serveur, et
 *  écouter en continu coûterait une connexion permanente pour un nombre qui
 *  change trois fois par an. */
export const oublierSolde = () => {
  try { localStorage.removeItem(CLE) } catch { /* tant pis */ }
}

/** Ce qu'on sait sans rien demander — pour peindre tout de suite, avant le
 *  réseau. `null` quand on n'a jamais rien su, ET quand il n'y a pas de compte :
 *  la garde est ici plutôt que chez les deux appelants, parce qu'un troisième
 *  appelant arriverait un jour sans elle. Sans ça, le premier rendu d'un pilote
 *  déconnecté afficherait le solde du précédent, le temps que la lecture
 *  asynchrone le démente — un chiffre faux qui s'affiche puis se corrige est
 *  pire qu'un chiffre absent. */
export const soldeConnu = (): Solde | null => (identite() ? relire() : null)

/**
 * Le solde, demandé au serveur, et gardé.
 *
 * `null` a UN SEUL sens : il n'y a pas de compte, ou le serveur n'a pas répondu
 * et rien n'a jamais été gardé. Dans les deux cas l'écran n'affiche pas de
 * compteur — un compteur qui dit « 0 » à qui n'a pas de compte annonce une
 * pénurie inventée, et c'est exactement le défaut déjà corrigé dans `Refaire`
 * (« elle regarde s'il y a un compte avant de parler d'un compte »).
 */
export const lireSolde = async (): Promise<Solde | null> => {
  /* ⚠ ON NE DEMANDE RIEN QUAND IL N'Y A PERSONNE À QUI DEMANDER, et cette garde
     a été payée par le banc : trente et une fumées sont passées au rouge d'un
     coup sur « aucune erreur de console ». Le compteur appelait `mon_solde()` à
     chaque montage d'écran ; sans session, PostgREST refuse (401, la fonction
     n'est ouverte qu'au rôle `authenticated`) et le navigateur journalise
     l'échec. Une erreur de console par écran, sur le chemin le plus fréquenté
     du produit.

     Le vrai défaut n'était pas le bruit, c'était l'appel lui-même. Ce produit
     est local-first : ne pas avoir de compte est l'ÉTAT PAR DÉFAUT, donc le cas
     majoritaire. Émettre une requête réseau à chaque écran pour un pilote qui
     n'a pas de compte, c'est dépenser de la batterie et du réseau au paddock
     pour une réponse dont on sait d'avance qu'elle sera un refus.

     `identite()` est une lecture LOCALE et synchrone — elle ne joint personne,
     elle ne peut donc pas rater. Et le solde gardé est oublié en même temps :
     un compteur qui survivrait à une déconnexion afficherait le solde de
     quelqu'un d'autre au suivant qui ouvre l'application. */
  if (!identite()) { oublierSolde(); return null }
  if (!supabase) return relire()
  // supabase-js NE LÈVE PAS, il RETOURNE l'erreur — même remarque que dans
  // `cercle.ts`. Un `try` seul ne suffirait donc pas.
  const { data, error } = await supabase.rpc('mon_solde')
  if (error || !data) return relire()
  const ligne = (Array.isArray(data) ? data[0] : data) as
    { reste?: number; illimite?: boolean } | undefined
  if (!ligne || typeof ligne.reste !== 'number') return relire()
  const s: Solde = { reste: ligne.reste, illimite: ligne.illimite === true }
  garder(s)
  return s
}

