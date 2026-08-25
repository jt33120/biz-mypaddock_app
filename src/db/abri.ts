/**
 * OÙ VIT LA SAISON — et le jour où le navigateur décide qu'elle n'y vit plus.
 *
 * ⚠ CE FICHIER RÉPARE LE SEUL DÉFAUT QUI BLOQUAIT LA SORTIE, et c'est un défaut
 * qui ne casse rien à l'écran : il efface, plus tard, tout seul.
 *
 * NFR-1 demande DEUX choses. La première était faite : `persist()` se demande à
 * chaque démarrage (`demanderPersistance`, powersync.ts). La seconde ne l'était
 * pas : son état ne se lisait NULLE PART sauf dans l'écran de diagnostic, que
 * personne n'ouvre. Le booléen était même jeté — `.then(() => …)`.
 *
 * Ce que ça donne concrètement pour un inconnu venu d'une publicité : il ouvre
 * l'application dans un onglet Safari, il saisit sa journée, il repart. Safari
 * plafonne à SEPT JOURS le stockage d'un site qu'on ne revient pas visiter. Or
 * ce carnet s'ouvre onze fois par an. La saison ne « bugue » pas : elle n'est
 * plus là, sans un message, et personne ne saura jamais qu'il y en a eu une.
 *
 * Le produit ne peut pas empêcher ça. Il peut le DIRE, et proposer le seul geste
 * qui le règle — poser l'application sur l'écran d'accueil, où le stockage cesse
 * d'être plafonné.
 *
 * ⚠ ET IL NE HARCÈLE PAS. Rien ne s'affiche quand le stockage est déjà
 * persistant : c'est un ÉTAT qu'on énonce, pas une campagne d'installation.
 */

export type Systeme = 'ios' | 'autre'

export type Abri = {
  /** `navigator.storage.persisted()` — la seule chose qui protège vraiment.
   *  Pas l'icône sur l'écran d'accueil : l'exemption liée à l'installation
   *  n'est documentée nulle part, et se fier à elle serait deviner. */
  persistant: boolean
  /** Lancée depuis l'écran d'accueil plutôt que dans un onglet. */
  installee: boolean
  /** Un `beforeinstallprompt` a été retenu et peut encore être présenté.
   *  Chrome et Edge le donnent ; Safari ne l'a jamais implémenté. */
  proposable: boolean
  systeme: Systeme
  /** Ce que l'écran doit faire : se taire, ou dire. */
  menace: boolean
}

const surIOS = (): boolean => {
  const ua = navigator.userAgent
  // L'iPad moderne se présente comme un Mac : le seul signe qui reste est
  // l'écran tactile. Sans ce second test, un iPad passerait pour un ordinateur
  // et recevrait un conseil d'installation qui n'existe pas chez lui.
  return /iPad|iPhone|iPod/.test(ua)
    || (/Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document)
}

export const estInstallee = (): boolean =>
  window.matchMedia?.('(display-mode: standalone)').matches === true
  || (navigator as unknown as { standalone?: boolean }).standalone === true

/**
 * ⚠ L'ÉVÉNEMENT SE RETIENT AU CHARGEMENT DU MODULE, PAS DANS UN COMPOSANT.
 *
 * `beforeinstallprompt` est tiré UNE FOIS, tôt, et il ne repasse pas. Un
 * écouteur posé dans un `useEffect` arrive après la première peinture de React
 * et le rate — l'invitation n'apparaîtrait alors jamais, sans erreur nulle part.
 */
type Invitation = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
let retenue: Invitation | null = null
const abonnes = new Set<() => void>()
const prevenir = () => { for (const f of abonnes) f() }

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Sans `preventDefault`, Chrome affiche sa propre barre : deux invitations
    // pour un seul geste, dont une que le produit ne contrôle pas.
    e.preventDefault()
    retenue = e as Invitation
    prevenir()
  })
  // Posée pendant la session : l'écran doit se taire immédiatement, sans
  // attendre un rechargement.
  window.addEventListener('appinstalled', () => { retenue = null; prevenir() })
}

export const lireAbri = async (): Promise<Abri> => {
  let persistant = false
  try { persistant = (await navigator.storage?.persisted?.()) === true } catch { /* pas exposé */ }
  const installee = estInstallee()
  const systeme: Systeme = surIOS() ? 'ios' : 'autre'
  return {
    persistant,
    installee,
    proposable: retenue !== null,
    systeme,
    // ⚠ LE SEUL CRITÈRE EST `persistant`. Une application installée dont le
    // stockage n'est pas persistant reste exposée ; une application dans un
    // onglet dont le stockage l'est ne l'est pas. On énonce l'état réel, jamais
    // le raccourci « installée donc protégée », qui n'est garanti nulle part.
    menace: !persistant,
  }
}

/** Rejoue la lecture quand l'état a pu changer : retour au premier plan,
 *  installation acceptée, invitation reçue. Rend de quoi se retirer. */
export const surAbri = (relire: () => void): (() => void) => {
  const visible = () => { if (document.visibilityState === 'visible') relire() }
  document.addEventListener('visibilitychange', visible)
  abonnes.add(relire)
  return () => { document.removeEventListener('visibilitychange', visible); abonnes.delete(relire) }
}

export type Issue = 'acceptee' | 'refusee' | 'impossible'

/** ⚠ L'INVITATION NE SE PRÉSENTE QU'UNE FOIS. Chrome invalide l'événement dès
 *  qu'il a été montré : on le libère donc quoi qu'il arrive, sans quoi un second
 *  tap présenterait un objet mort et ne ferait rien du tout. */
export const proposerInstallation = async (): Promise<Issue> => {
  const e = retenue
  if (!e) return 'impossible'
  retenue = null
  try {
    await e.prompt()
    const { outcome } = await e.userChoice
    prevenir()
    return outcome === 'accepted' ? 'acceptee' : 'refusee'
  } catch {
    prevenir()
    return 'impossible'
  }
}

/**
 * CE QUE L'ÉCRAN DIT, ET IL DIT LA CONSÉQUENCE AVANT LE GESTE.
 *
 * Les deux systèmes n'ont pas la même menace, et lui donner le même mot serait
 * faux dans un cas sur deux : iOS PLAFONNE dans le temps — sept jours sans
 * visite — là où les autres navigateurs évincent sous pression de place. Le
 * premier tombe tout seul sur un carnet ouvert onze fois par an ; le second ne
 * tombe presque jamais.
 */
export const direLAbri = (a: Abri): { titre: string; texte: string; geste: string | null } | null => {
  if (!a.menace) return null

  if (a.systeme === 'ios' && !a.installee) {
    return {
      titre: 'ta saison vit dans un onglet',
      texte: 'Safari efface le contenu d’un site resté sept jours sans visite, et ce carnet '
        + 's’ouvre onze fois par an. Posé sur l’écran d’accueil, il n’est plus concerné.',
      geste: 'Appuie sur Partager, puis « Sur l’écran d’accueil ».',
    }
  }
  if (!a.installee) {
    return {
      titre: 'ta saison vit dans un onglet',
      texte: 'Tant qu’elle est là, le navigateur peut la libérer quand il manque de place. '
        + 'Installée, elle ne dépend plus de ça.',
      // Le repli quand aucune invitation n'a été retenue — le navigateur en
      // porte une dans son menu, sous un nom qui varie. On ne nomme donc aucun
      // libellé précis : promettre un mot exact qu'on ne trouve pas est pire
      // que de décrire l'endroit.
      geste: 'Le menu de ton navigateur propose de l’installer, ou de l’ajouter à l’écran d’accueil.',
    }
  }
  // Installée, et pourtant non persistante : rare, et ça ne se règle pas d'un
  // geste. On le dit quand même — la promesse de continuité n'est pas tenue, et
  // le produit ne cache pas ce qu'il ne tient pas.
  return {
    titre: 'le stockage durable a été refusé',
    texte: 'L’application est bien installée, mais ce navigateur n’a pas accordé le stockage '
      + 'durable. Ce qui n’est pas encore parti au serveur reste exposé. Un compte met la '
      + 'saison à l’abri pour de bon.',
    geste: null,
  }
}
