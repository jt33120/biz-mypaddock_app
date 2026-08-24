import type { PowerSyncDatabase } from '@powersync/web'
import { supabase } from './supabase'

/**
 * L'ADOPTION — ce qui a été saisi AVANT le compte ne se perd pas.
 *
 * Le produit s'ouvre et fonctionne sans compte : c'est une règle de fond, pas une
 * tolérance. Un pilote peut donc arriver au compte avec une saison déjà saisie,
 * et cette saison n'appartient encore à personne.
 *
 * ⚠ POURQUOI CE N'EST PAS LA FILE D'ENVOI QUI FAIT LE TRAVAIL. PowerSync tient un
 * JOURNAL DES CHANGEMENTS, et le rejouer suppose que chaque changement était
 * valide au moment où il a eu lieu. Ceux-là ne l'étaient pas : ils désignent un
 * propriétaire qui n'existait pas. Rejouer l'histoire d'un pilote sans compte
 * échouerait à la première ligne et bloquerait la file pour toujours.
 *
 * L'adoption n'est donc PAS un rejeu, c'est une PRISE EN COMPTE DE L'ÉTAT : on
 * envoie ce qui est là, tel qu'il est, sous le nom du pilote qui vient d'arriver.
 * Le journal d'avant est ensuite écarté — il ne décrit le passé de personne.
 *
 * La même fonction sert de sauvegarde manuelle : envoyer l'état, c'est aussi ce
 * qu'on veut quand on appuie sur « sauvegarder ». Un seul chemin, deux usages.
 */

export type BilanEnvoi = Record<string, number>
export type Refus = { table: string; ligne: string; motif: string }
export type Resultat = { bilan: BilanEnvoi; refus: Refus[] }

/** L'ordre est celui des DÉPENDANCES, et il ne se négocie pas : une session sans
 *  son roulage est refusée par la clé étrangère, pas par une convention.
 *
 *  ⚠ IL A ÉTÉ FAUX DEUX FOIS, EN SENS INVERSE, et c'est le signe qu'un ordre écrit
 *  à la main ne suffit pas — d'où `DEPENDANCES` juste en dessous, et l'essai
 *  unitaire qui le confronte à cette liste.
 *
 *  ① `intervention` partait AVANT `photo` alors qu'elle la référence
 *     (`intervention.photo_id`) : la première sauvegarde échouait en 23503,
 *     l'adoption ne se marquait jamais, la synchronisation restait éteinte.
 *  ② Le correctif a créé le défaut symétrique. Depuis la preuve d'atelier,
 *     c'est la PHOTO qui désigne son intervention (`photo.intervention_id`), et
 *     une photo de facture n'a pas d'autre porteur. Partant avant l'intervention,
 *     elle était refusée en 23503 — nommée dans les refus, mais jamais renvoyée.
 *     Les pièces perdues étaient exactement celles qui valent quelque chose
 *     devant un tiers : la facture, la pièce montée.
 *
 *  Les deux liens existent, donc le graphe a un CYCLE, et aucun ordre ne le
 *  résout. Un des deux liens doit voyager séparément : voir `LIEN_DIFFERE`. */
// ⚠ L'ORDRE EST CELUI DES DÉPENDANCES, des racines vers les feuilles. Une ligne
// qui part avant celle qu'elle référence est refusée en 23503, écartée
// définitivement — quatre fois le même incident sur ce produit, et deux d'entre
// eux découverts des jours plus tard.
export const ORDRE = ['machine', 'equipement', 'roulage', 'session', 'tour', 'chute', 'depense', 'budget_saison', 'mesure', 'plan_si_alors', 'geste', 'intervention', 'photo', 'evenement_vise', 'horloge', 'checklist_ligne', 'document'] as const

/**
 * CE QUE CHAQUE TABLE RÉFÉRENCE, parmi les tables du pilote — les clés
 * étrangères vers le référentiel (circuit, organisateur) sont hors sujet : il
 * est déjà là, il ne remonte pas (AD-12).
 *
 * Cette carte n'est pas de la documentation : elle est CONFRONTÉE À `ORDRE` par
 * un essai unitaire. Une table ajoutée au schéma et oubliée ici, ou placée trop
 * tôt, fait rougir le banc au lieu de faire perdre des lignes à un pilote.
 */
export const DEPENDANCES: Readonly<Record<string, readonly string[]>> = {
  machine: [], equipement: [], budget_saison: [], mesure: [], plan_si_alors: [],
  roulage: ['machine'],
  session: ['roulage'],
  tour: ['session'],
  chute: ['roulage'],
  depense: ['roulage', 'machine'],
  geste: ['roulage'],
  intervention: ['machine', 'depense', 'chute', 'photo'],
  photo: ['roulage', 'machine', 'chute', 'geste', 'intervention'],
  evenement_vise: ['machine'],
  horloge: ['machine', 'intervention'],
  checklist_ligne: ['roulage'],
  document: ['machine'],
}

/**
 * LE SEUL LIEN QUI VOYAGE SÉPARÉMENT.
 *
 * `intervention.photo_id` et `photo.intervention_id` existent tous les deux, donc
 * le graphe a un cycle. Il fallait choisir lequel des deux couper, et le choix
 * est FORCÉ par une contrainte du serveur, pas par un goût :
 *
 *   check (roulage_id is not null or machine_id is not null
 *       or intervention_id is not null or chute_id is not null)
 *
 * Une photo de facture n'a que son intervention pour porteur. Lui retirer
 * `intervention_id` le temps d'un envoi, ce n'est pas la relâcher : c'est la
 * rendre INSÉRABLE NULLE PART. `intervention.photo_id`, lui, est simplement
 * nullable et ne porte aucune contrainte — c'est donc lui qu'on coupe.
 *
 * L'intervention part sans sa photo, la photo part ensuite, et le lien se repose
 * en dernier. S'il échoue, il est nommé comme un refus : il ne manquera qu'une
 * vignette de tête, jamais une pièce.
 */
export const LIEN_DIFFERE = { table: 'intervention', colonne: 'photo_id' } as const

/** TOUTES les tables de pilote portent leur propriétaire côté serveur, feuilles
 *  comprises, pour que le flux descendant s'écrive à plat et que l'envoi n'ait
 *  aucun cas particulier. Ce n'est pas une contrainte du moteur — les Sync
 *  Streams acceptent les sous-requêtes — c'est une simplification assumée.
 *  Le local, lui, n'en garde aucun : le propriétaire est apposé ici. */
export const PORTE_PROPRIETAIRE: ReadonlySet<string> = new Set<string>(ORDRE)

/** Ce qui est là, avant tout envoi. Sert à montrer au pilote ce que le compte
 *  va reprendre — un chiffre concret vaut mieux qu'une promesse. */
export const etatLocal = async (db: PowerSyncDatabase): Promise<BilanEnvoi> => {
  const etat: BilanEnvoi = {}
  for (const table of ORDRE) {
    const r = await db.get<{ n: number }>(`SELECT count(*) AS n FROM ${table}`)
    if (r.n) etat[table] = r.n
  }
  return etat
}

/**
 * ⚠ UNE LIGNE REFUSÉE NE BLOQUE PLUS LES AUTRES, et c'est le correctif le plus
 * important de ce fichier.
 *
 * La première version envoyait chaque table en un bloc et s'arrêtait à la
 * première erreur. Sur un vrai téléphone, UNE ligne malformée — un roulage écrit
 * par la sonde, sans circuit — a bloqué quatre-vingt-cinq changements et rendu
 * la sauvegarde impossible sans qu'on puisse dire lequel fautait.
 *
 * Le bloc reste le chemin normal, parce qu'il est cent fois moins bavard. Mais
 * s'il échoue, on repasse LIGNE PAR LIGNE : ce qui peut partir part, ce qui est
 * refusé est nommé. Une saison ne se perd pas à cause d'une ligne.
 */
const envoyer = async (
  table: string, charge: Record<string, unknown>[], refus: Refus[],
): Promise<number> => {
  const { error } = await supabase!.from(table).upsert(charge)
  if (!error) return charge.length

  let passees = 0
  for (const ligne of charge) {
    const { error: e } = await supabase!.from(table).upsert(ligne)
    if (e) refus.push({ table, ligne: String(ligne.id), motif: e.message })
    else passees++
  }
  return passees
}

export const sauvegarder = async (
  db: PowerSyncDatabase,
  piloteId: string,
): Promise<Resultat> => {
  if (!supabase) throw new Error("Le compte n'est pas configuré.")

  // ⚠ CE `upsert` DIRECT A CASSÉ LA SAUVEGARDE EN PRODUCTION.
  //
  //   « pilote : new row violates row-level security policy for table pilote »
  //
  // La table `pilote` n'a plus qu'une politique de LECTURE depuis le filet
  // monétaire, et c'est volontaire : avec `for all`, un simple PATCH posait
  // `quota_sprites` à 32767 — 5 242 € de générations d'image. Un quota que le
  // compté peut écrire ne compte rien.
  //
  // La garantie passe donc par une fonction `security definer` SANS AUCUN
  // PARAMÈTRE : elle lit l'identité dans le jeton et laisse les défauts de la
  // table poser le quota. Le client ne peut ni désigner un autre pilote, ni
  // choisir ce qu'il vaut.
  //
  // La ligne est de toute façon posée par le déclencheur sur auth.users ; ceci
  // est un FILET, pour les comptes nés avant lui et pour le jour où il tombe.
  // Sans elle, toutes les clés étrangères s'effondrent et l'échec devient
  // incompréhensible depuis l'écran.
  const { error: ePilote } = await supabase.rpc('assurer_pilote')
  if (ePilote) throw new Error('pilote : ' + ePilote.message)

  const bilan: BilanEnvoi = {}
  const refus: Refus[] = []
  // Le lien coupé, mis de côté pour le dernier passage. Voir `LIEN_DIFFERE`.
  const aReposer: { id: string; valeur: unknown }[] = []

  for (const table of ORDRE) {
    const lignes = await db.getAll<Record<string, unknown>>(`SELECT * FROM ${table}`)
    if (!lignes.length) { bilan[table] = 0; continue }

    const charge = lignes.map((l) => {
      const avecProprio: Record<string, unknown> = PORTE_PROPRIETAIRE.has(table)
        ? { ...l, pilote_id: piloteId } : { ...l }
      if (table === LIEN_DIFFERE.table && avecProprio[LIEN_DIFFERE.colonne]) {
        aReposer.push({ id: String(avecProprio.id), valeur: avecProprio[LIEN_DIFFERE.colonne] })
        avecProprio[LIEN_DIFFERE.colonne] = null
      }
      return avecProprio
    })

    // `upsert` et non `insert` : l'adoption doit pouvoir être relancée sans
    // dupliquer quoi que ce soit. Les identifiants sont des UUID v7 posés par le
    // client (AD-14), donc la même ligne retrouve toujours sa place.
    bilan[table] = await envoyer(table, charge, refus)
  }

  // ── Le dernier passage : reposer le lien coupé, une ligne à la fois.
  // `update` et non `upsert` : la ligne EXISTE déjà, et un upsert partiel
  // repartirait sur le chemin de l'insertion, donc laisserait à null les colonnes
  // non transmises — `libelle`, `date_jour`, `categorie`. Ce serait écraser une
  // intervention pour lui rendre sa vignette.
  for (const { id, valeur } of aReposer) {
    const { error } = await supabase.from(LIEN_DIFFERE.table)
      .update({ [LIEN_DIFFERE.colonne]: valeur }).eq('id', id)
    if (error) refus.push({ table: LIEN_DIFFERE.table, ligne: id, motif: error.message })
  }

  return { bilan, refus }
}

/**
 * Écarter le journal local sans toucher aux données.
 *
 * Appelé une seule fois, juste après une adoption réussie : à cet instant le
 * serveur porte exactement l'état local, donc les changements en attente n'ont
 * plus rien à raconter. Les garder ferait rejouer, sous le nom du pilote, une
 * histoire écrite quand il n'avait pas de nom.
 */
export const ecarterJournal = async (db: PowerSyncDatabase): Promise<number> => {
  let ecartes = 0
  for (;;) {
    const tx = await db.getNextCrudTransaction()
    if (!tx) break
    ecartes += tx.crud.length
    await tx.complete()
  }
  return ecartes
}

/* ─── LE PASSAGE, ET POURQUOI IL EST GARDÉ ─────────────────────────────────
   La synchronisation continue ne doit PAS s'allumer sur une base qui n'a jamais
   été adoptée. Son journal contient alors des changements écrits sans compte,
   qui seraient rejoués tels quels : c'est exactement ce que l'adoption existe
   pour éviter. On retient donc, par pilote, que l'état a déjà été posé une fois
   sur le serveur — après quoi le journal redevient une histoire fiable. */

const CLE_ADOPTE = 'mypaddock.adopte.'

export const estAdopte = (piloteId: string): boolean => {
  try { return localStorage.getItem(CLE_ADOPTE + piloteId) === '1' } catch { return false }
}

const marquerAdopte = (piloteId: string) => {
  try { localStorage.setItem(CLE_ADOPTE + piloteId, '1') } catch { /* rien à faire */ }
}

/**
 * L'adoption complète : poser l'état, écarter le journal d'avant, ouvrir la voie
 * à la synchronisation continue.
 *
 * ⚠ LE JOURNAL N'EST ÉCARTÉ QUE SI TOUT EST PASSÉ. S'il reste un refus, le
 * serveur ne porte pas encore l'état complet : jeter le journal reviendrait à
 * perdre ce qui n'est pas monté. On garde tout, on nomme ce qui coince, et la
 * synchronisation continue reste éteinte jusqu'à ce que ce soit réglé.
 */
export const adopter = async (
  db: PowerSyncDatabase,
  piloteId: string,
): Promise<{ bilan: BilanEnvoi; refus: Refus[]; ecartes: number }> => {
  const { bilan, refus } = await sauvegarder(db, piloteId)
  if (refus.length) return { bilan, refus, ecartes: 0 }
  const ecartes = await ecarterJournal(db)
  marquerAdopte(piloteId)
  return { bilan, refus, ecartes }
}
