import type { PowerSyncDatabase } from '@powersync/web'
import { jeton } from '../db/compte'
import type { GenreDeTenue } from '../db/equipement'
import { reduire } from '../db/photos'
import { spritifier, type Sprite } from './spritifier'
import { GRILLE } from './reglages'
import { enBlob } from './octets'

/**
 * LE PORTRAIT DE JEU — l'orchestration côté application, récit 3bis.3.
 *
 * Deux moitiés, et elles n'ont ni le même coût ni les mêmes règles :
 *
 *   · LA MOITIÉ PAYANTE part au serveur. La clé n'existe pas ici (AD-15), le
 *     prompt non plus, et le quota se compte là-bas. L'application ne peut
 *     littéralement pas dépenser toute seule.
 *   · LA MOITIÉ GRATUITE reste ici : la spritification est déterministe, tourne
 *     hors ligne et se rejoue sans un centime. C'est elle qui transforme une
 *     apparence de pixel art en vrai sprite — le modèle rend un look, pas une
 *     structure.
 *
 * La GRILLE vient de la réponse du serveur, jamais de la constante locale : le
 * prompt et la spritification doivent travailler sur la même, et deux constantes
 * égales dans deux dépôts finissent toujours par diverger.
 */

/** Le côté long envoyé au modèle. La réponse le confirme ; c'est un repli. */
const COTE_MODELE = 1024

export type Issue =
  | { ok: true; sprite: Sprite; reste: number; version: string }
  | { ok: false; motif: string; message: string; reste?: number }

/** Chaque refus dit CE QUI S'EST PASSÉ et ce qui reste possible. Aucun ne
 *  reproche, aucun n'emploie l'impératif (FR-13), et aucun ne laisse croire que
 *  la machine ou la photo aurait été perdue — elles ne le sont jamais. */
const MOTS: Record<string, string> = {
  sans_compte: "Le portrait se fabrique sur le serveur, donc il demande un compte. "
    + 'La photo, elle, reste sur ce téléphone et ne dépend de rien.',
  quota: 'Le nombre de portraits inclus est atteint pour ce compte. '
    + 'La photo réelle continue de tenir la scène du garage.',
  plafond_global: "La fabrique a atteint son plafond de la journée, tous comptes confondus. "
    + 'Elle rouvrira demain, et rien n\'a été décompté de ton côté.',
  cle_absente: "La fabrique de portraits n'est pas encore ouverte. "
    + 'Rien n\'a été facturé, et la photo reste en place.',
  photo_trop_lourde: "Cette image est trop lourde pour partir. "
    + 'Une photo prise au téléphone passe sans difficulté.',
  sans_photo: "Aucune image n'est partie.",
  /* Il faudrait un client et un serveur en désaccord sur les sujets connus pour
     le lire — donc un redéploiement à moitié fait. La phrase le dit sans jargon
     et sans accuser le pilote, et surtout elle affirme le seul fait qui compte
     ici : rien n'a été prélevé, le refus part avant la réservation. */
  sujet_inconnu: "La fabrique n'a pas reconnu ce qu'elle avait à dessiner. "
    + "Rien n'est parti et rien n'a été décompté.",
  modele: "Le modèle d'image n'a rien rendu cette fois. Rien n'a été décompté.",
  aucune_image: "Le modèle n'a rendu aucune image. Rien n'a été décompté.",
  reseau: 'Le serveur est resté injoignable. Rien n\'a été décompté, et la photo est intacte.',
  spritification: "L'image est revenue mais n'a pas pu être détachée de son fond.",
}
const dire = (motif: string) => MOTS[motif] ?? "La fabrique de portraits n'a pas abouti."

/**
 * ⚠ LE SUJET VOYAGE, ET LE QUOTA NE BOUGE PAS. « La combinaison c'est comme un
 * skin, et le casque aussi, c'est à pixeliser ! » — une combinaison passe par la
 * même fabrique qu'une moto, donc par le même compteur et le même plafond.
 *
 * Le sujet est un OBJET NOMMÉ et non un second `string` positionnel : deux
 * chaînes se confondent, et cette confusion a déjà coûté une intervention
 * écartée définitivement côté serveur — un identifiant de machine passé là où
 * un identifiant de roulage était attendu.
 *
 * ⚠ LE GENRE EST OBLIGATOIRE SUR UN ÉQUIPEMENT, ET LE TYPE L'EXIGE. Le serveur
 * a un prompt PAR SUJET — la moto est rendue de PROFIL STRICT, le casque et la
 * combinaison en TROIS-QUARTS — et il ne devine rien. Tant que le genre ne
 * voyageait pas, un casque partait avec `machineId: null` et recevait la
 * consigne « c'est CETTE moto » : le rendu était faux, et il était payé.
 * Rendre `genre` facultatif rouvrirait exactement ce trou, en silence.
 *
 * ⚠ ET UN `string` NU N'EST PLUS ACCEPTÉ, alors qu'il l'était. Il valait
 * « machine », donc `genererPortrait(db, uneCleDEquipement, photo)` compilait
 * et facturait un prompt de moto sur un casque. Un raccourci d'appel qui ne
 * ferme pas la porte au seul geste qui dépense ne vaut pas les deux appelants
 * qu'il épargne (Garage.tsx, Budget.tsx).
 *
 * ⚠ LE GENRE VIENT DE `db/equipement.ts`, IL N'EST PAS REDÉCLARÉ ICI. C'est le
 * même fait — ce qu'une pièce EST — que celui qui alimente le sélecteur de tenue
 * du jour. Deux unions égales dans deux fichiers finissent par diverger, et
 * celle-ci a déjà deux porteurs hors de portée du compilateur : la contrainte
 * `equipement_genre_connu` en base, et la liste des sujets connus du serveur. Un
 * porteur de moins est un désaccord de moins.
 */
export type Sujet =
  | { machineId: string; equipementId?: never; genre?: never }
  | { equipementId: string; genre: GenreDeTenue; machineId?: never }

/**
 * ⚠ CE QUI AUTORISE UNE FABRICATION, LU EN UN SEUL ENDROIT.
 *
 * Il y en avait deux, et ils ne se parlaient pas : la fabrique refusait sur
 * « pas de serveur OU pas de jeton », pendant que l'écran d'annonce composait sa
 * phrase sans rien regarder du tout. L'écran promettait « ce compte en a 3
 * inclus, dont aucun n'a encore servi » à un pilote SANS COMPTE — et le geste
 * suivant lui répondait « le portrait demande un compte ». Deux phrases
 * contradictoires dans le même geste, sur le seul bouton qui dépense.
 *
 * Et ce n'est pas un cas de bord : le produit est local-first, ne pas avoir de
 * compte est l'ÉTAT PAR DÉFAUT — c'est la phrase que lit la majorité.
 *
 * Le jeton, pas seulement l'identité : hors ligne, avec un jeton expiré, il n'y
 * a plus de droit de parler au serveur même si l'identité tient (compte.ts). La
 * fabrique refuserait ; l'annonce doit donc refuser aussi.
 */
const jetonDeFabrique = async (): Promise<string | null> => {
  if (!import.meta.env.VITE_SUPABASE_URL) return null
  try { return await jeton() } catch { return null }   // hors ligne : pas de droit
}

/** Vrai quand une fabrication PEUT partir. Ne sert qu'à ANNONCER — le serveur
 *  reste seul juge, et cette fonction ne fait passer personne. */
export const fabriqueOuverte = async (): Promise<boolean> =>
  (await jetonDeFabrique()) !== null

export const genererPortrait = async (
  _db: PowerSyncDatabase, sujet: Sujet, photo: Blob, piloteEnSelle = false,
): Promise<Issue> => {
  const machineId = sujet.machineId ?? null
  /** Ce que le serveur choisira comme prompt. `'machine'` est aussi ce qu'il
   *  suppose quand le champ manque (compatibilité des clients déjà installés) —
   *  raison de plus pour que ce soit le TYPE, et non ce calcul, qui garantisse
   *  qu'un équipement ne parte jamais sans genre. */
  const quoi: 'machine' | GenreDeTenue = sujet.genre ?? 'machine'
  const base = import.meta.env.VITE_SUPABASE_URL
  const jwt = await jetonDeFabrique()
  if (!jwt) return { ok: false, motif: 'sans_compte', message: dire('sans_compte') }

  // La photo part RÉDUITE. Le modèle n'a pas besoin de 48 Mpx pour reconnaître
  // une moto, et les jetons d'image se paient.
  const r = await reduire(photo, COTE_MODELE)
  const b64 = await new Promise<string>((res, rej) => {
    const l = new FileReader()
    l.onload = () => res((l.result as string).replace(/^data:[^,]+,/, ''))
    l.onerror = () => rej(l.error ?? new Error('lecture impossible'))
    l.readAsDataURL(r.blob)
  })

  let rep: Response
  try {
    rep = await fetch(`${base}/functions/v1/sprite`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      // `machineId` sert au serveur à rattacher la ligne de `generation` : il
      // reste nul pour un équipement, et la génération est alors comptée sans
      // machine — le quota, lui, porte sur le PILOTE, pas sur l'objet.
      // `sujet` choisit le PROMPT, et c'est autre chose : il n'est jamais nul,
      // et il ne se déduit pas de `machineId` côté serveur — un équipement et
      // une machine sans rattachement ont tous deux `machineId: null`.
      body: JSON.stringify({ photo: b64, machineId, sujet: quoi, piloteEnSelle }),
    })
  } catch { return { ok: false, motif: 'reseau', message: dire('reseau') } }

  const corps = await rep.json().catch(() => ({}))
  if (!rep.ok || !corps.image) {
    const motif = corps.refus ?? 'reseau'
    return { ok: false, motif, message: dire(motif), reste: corps.reste }
  }

  // La moitié gratuite. Un échec ici ne rend PAS le quota — l'image a bien été
  // produite et payée. Le dire est plus honnête que de laisser croire l'inverse.
  try {
    // Même piège que la vitrine : l'image rendue par la fonction est une URI
    // `data:`, et `fetch` sur `data:` est refusé par `connect-src` en ligne.
    const octets = await enBlob(corps.image)
    const sprite = await spritifier(octets, corps.grille ?? GRILLE)
    return { ok: true, sprite, reste: corps.reste ?? 0, version: corps.version ?? '?' }
  } catch {
    return { ok: false, motif: 'spritification', message: dire('spritification'), reste: corps.reste }
  }
}

/**
 * ⚠ CE QUE COÛTE UN PORTRAIT, POUR POUVOIR LE DIRE AVANT D'APPELER.
 *
 * Ces deux nombres ne servent QU'À ANNONCER : le serveur reste seul juge, il
 * réserve sous verrou avant d'appeler le modèle, et l'application n'a aucun
 * moyen de dépenser toute seule (AD-15). Ils sont ici parce qu'un bouton nommé
 * « Refaire », posé en haut d'un écran, transforme un tap accidentel en dépense
 * — et qu'un produit qui prélève sans avoir dit ce qu'il prélève est un produit
 * qu'on n'ouvre plus.
 *
 * ⚠ ILS PEUVENT MENTIR SI ON LES OUBLIE. `PORTRAITS_INCLUS` recopie le défaut de
 * `pilote.quota_sprites` posé par la migration 20260819000010 ; le jour où ce
 * défaut change là-bas, l'annonce d'ici devient fausse sans que rien ne casse.
 * Un essai unitaire relit donc la migration et les confronte — c'est la seule
 * chose qui relie deux dépôts que rien d'autre ne relie.
 *
 * Le coût, lui, vient de A-FAIRE §1 : ≈ 0,16 € par portrait chez le fournisseur
 * d'images. Il est APPROXIMATIF et l'écran le dit — annoncer un prix exact qu'on
 * ne facture pas serait pire que d'annoncer un ordre de grandeur vrai.
 *
 * ⚠ ET LE PRIX SE CONFRONTE COMME LE QUOTA. Il n'avait aucune garde alors qu'il
 * est le seul des deux nombres à s'écrire EN EUROS à l'écran : le
 * `cout_unitaire_centimes … default 16` du filet monétaire (migration
 * 20260819000012) est ce qui décompte vraiment, et le jour où il bouge là-bas,
 * l'écran d'ici annonce un prix que personne ne facture. Le même essai unitaire
 * relit les deux.
 */
export const COUT_PORTRAIT_CENTIMES = 16
export const PORTRAITS_INCLUS = 3

/** Ce qui a déjà été fabriqué depuis ce compte, lu dans les lignes descendues.
 *  La table `generation` descend et ne remonte jamais : c'est le serveur qui
 *  l'écrit, et c'est ce qui rend ce compte crédible. Hors ligne ou sans compte
 *  elle est vide, donc ce chiffre vaut zéro — il ne bloque rien, il énonce. */
export const portraitsFaits = async (db: PowerSyncDatabase): Promise<number> => {
  const r = await db.get<{ n: number }>(`SELECT count(*) AS n FROM generation`)
  return r.n ?? 0
}

/* ⚠ IL Y AVAIT ICI UN `portraitsRestants`, ET IL N'AVAIT AUCUN APPELANT.
   Il soustrayait les portraits faits d'un quota SUPPOSÉ — or ce quota peut
   avoir été relevé pour un compte (A-BRANCHER §7) sans que l'application le
   voie. Il ne rendait donc pas « ce qui reste » mais « ce qui resterait si
   personne n'avait rien changé », c'est-à-dire un chiffre faux au moment précis
   où quelqu'un aurait voulu s'en servir.

   Ce qui est GARDÉ, c'est ce qui se mesure : `portraitsFaits`, un décompte de
   lignes descendues du serveur. Ce qui reste, seul le serveur le sait — et
   quand il le dit, il le dit dans `Issue.reste`. */
