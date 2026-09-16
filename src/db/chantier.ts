import type { PowerSyncDatabase } from '@powersync/web'
import { nouvelId } from './ids'
import { marquerSaisie } from './mesures'
import { anneeSaison } from './depot'
import { estCategorieIntervention, type Categorie } from './atelier'

/**
 * LE STATUT DE LA MOTO ET SON CHANTIER — retour de Julian du 16 septembre 2026.
 *
 *   « Je viens de finir la dernière journée de la saison. J'aimerais rajouter
 *     un statut sur les motos : ready, en réparation et hivernation. La mienne
 *     passe donc en hivernation, avec une liste d'actions à mener et ordonnées,
 *     et une liste de choses à acheter avec le prix pour estimer le coût. »
 *
 * ⚠ FR-46 — « LES TROIS CATÉGORIES NE COHABITENT JAMAIS DANS UNE MÊME LISTE » —
 * ET POURQUOI LE CHANTIER NE LE VIOLE PAS. La clause protège une LISTE
 * D'ATTENTE : « plaquettes en fin de vie » posée à côté de « sticker décollé »
 * hérite du caractère repoussable du cosmétique. Le chantier n'est pas une liste
 * d'attente, c'est un ORDRE DE TRAVAIL : tout ce qu'il contient se fait cet
 * hiver, et son ordre est le sujet — Julian a demandé « ordonnées », et regrouper
 * par catégorie mettrait la peinture après la batterie. Deux garde-fous tiennent
 * la clause là où elle vit :
 *   · chaque étape AFFICHE sa catégorie, par le tracé ET le mot ;
 *   · la cocher CONSIGNE une intervention dans SA catégorie — le carnet, qui est
 *     la liste que FR-46 gouverne, reste strictement séparé.
 *
 * ⚠ ET LE PRIX EST UNE ESTIMATION, JAMAIS UNE PRÉVISION DU BUDGET. `budget.ts`
 * ne fabrique aucun avenir ; ceci non plus. Le pilote a saisi un prix — c'est
 * le précédent de `evenement_vise.cout_estime_centimes` — et ce chiffre ne
 * rejoint jamais la jauge. « Acheté » écrit une vraie dépense, avec son jour et
 * son poste : c'est elle, et elle seule, que le budget lit.
 */

export type StatutMachine = 'prete' | 'en_reparation' | 'hivernage'
export type GenreChantier = 'hivernage' | 'reparation'

export const STATUTS_MACHINE = [
  'prete', 'en_reparation', 'hivernage',
] as const satisfies readonly StatutMachine[]

export const estStatutMachine = (v: unknown): v is StatutMachine =>
  typeof v === 'string' && (STATUTS_MACHINE as readonly string[]).includes(v)

/** « Ready » est devenu PRÊTE, « hivernation » est devenu HIVERNAGE : le premier
 *  est le mot de Julian traduit, le second le mot du garage — l'autre est celui
 *  des marmottes. */
export const NOM_STATUT: Record<StatutMachine, string> = {
  prete: 'Prête',
  en_reparation: 'En réparation',
  hivernage: 'Hivernage',
}

/** Le statut qui ouvre un chantier, et lequel. Prête n'en ouvre aucun : c'est
 *  précisément ce qui les clôt. */
export const GENRE_DU_STATUT: Record<StatutMachine, GenreChantier | null> = {
  prete: null,
  en_reparation: 'reparation',
  hivernage: 'hivernage',
}

export type Chantier = {
  id: string
  machine_id: string
  genre: GenreChantier
  libelle: string
  ouvert_le: string
  clos_le: string | null
}

export type Etape = {
  id: string
  chantier_id: string
  ordre: number
  libelle: string
  categorie: Categorie
  note: string | null
  faite_le: string | null
  intervention_id: string | null
  horloge_id: string | null
  /** Le nom de l'horloge désignée, lu par jointure — pour dire ce que le geste
   *  fera repartir AVANT qu'il soit fait. */
  horloge_operation: string | null
}

export type Achat = {
  id: string
  chantier_id: string | null
  etape_id: string | null
  machine_id: string | null
  libelle: string
  quantite: number
  prix_centimes: number | null
  url: string | null
  note: string | null
  achete_le: string | null
  depense_id: string | null
  /** Le montant RÉEL, lu sur la dépense écrite à l'achat. Nul tant que rien
   *  n'est acheté, ou si la dépense a été retirée du budget depuis. */
  paye_centimes: number | null
}

/* ─── LES NOMS ─────────────────────────────────────────────────────────── */

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août',
  'sept.', 'oct.', 'nov.', 'déc.']

/** « 16 sept. » — le jour d'un chantier se lit comme on le dit. */
export const jourCourt = (iso: string): string => {
  const [, m, j] = iso.split('-').map(Number)
  return `${j} ${MOIS[(m || 1) - 1]}`
}

/** « Hivernage 2026–2027 » : un hiver chevauche deux années, et le nommer par
 *  la seule année d'ouverture ferait croire en mars qu'il date de l'an passé.
 *  Avant juillet, l'hiver a commencé l'année d'avant. */
export const libelleDuChantier = (genre: GenreChantier, jour: string): string => {
  const annee = Number(jour.slice(0, 4))
  const mois = Number(jour.slice(5, 7))
  if (genre === 'hivernage') {
    const debut = mois >= 7 ? annee : annee - 1
    return `Hivernage ${debut}–${debut + 1}`
  }
  return `Réparation · ${MOIS[mois - 1]} ${annee}`
}

/** Les étapes d'hivernage que tout garage connaît — UNE BASE À ADAPTER, pas un
 *  barème constructeur, et l'écran le dit. Aucune note ici : une note qui donne
 *  une contenance ou un couple de serrage engage une moto précise. */
export const ETAPES_COURANTES: readonly { libelle: string; categorie: Categorie }[] = [
  { libelle: 'Nettoyage', categorie: 'entretien' },
  { libelle: "Stabilisateur d'essence", categorie: 'entretien' },
  { libelle: 'Vidange + filtre à huile', categorie: 'entretien' },
  { libelle: 'Liquide de refroidissement', categorie: 'entretien' },
  { libelle: 'Charge de la batterie', categorie: 'entretien' },
]

/* ─── LES MARCHANDS ────────────────────────────────────────────────────── */

/**
 * LE PONT VERS DAFY ET AMAZON — une RECHERCHE, et c'est une décision mesurée.
 *
 * Lire le prix d'une page produit depuis le serveur a été essayé le 16 sept.
 * 2026 : dafy-moto.com répond 403 à toute lecture automatisée (protection
 * Incapsula, même avec un agent de navigateur), et la recherche d'amazon.fr rend
 * un défi anti-robot sous un statut 200. Un pont qui marche une fois sur trois
 * serait pire qu'un lien : on croirait le prix lu alors qu'il est vieux.
 *
 * Ce qui marche à tous les coups : ouvrir la recherche du marchand dans le
 * navigateur du pilote, et garder le lien qu'il en rapporte. AUCUN paramètre
 * d'affiliation — un lien affilié exige un contrat et une mention légale
 * (A-FAIRE.md), et poser un `tag=` sans eux serait une infraction.
 */
export type Marchand = 'dafy' | 'amazon'

export const NOM_MARCHAND: Record<Marchand, string> = {
  dafy: 'Dafy Moto',
  amazon: 'Amazon',
}

export const rechercheChez = (marchand: Marchand, requete: string): string => {
  const q = encodeURIComponent(requete.trim())
  return marchand === 'dafy'
    ? `https://www.dafy-moto.com/catalogsearch/result/?q=${q}`
    : `https://www.amazon.fr/s?k=${q}`
}

/** Le nom d'hôte seul, sans « www. » — ce que le pilote reconnaît. `null` pour
 *  une adresse illisible : mieux vaut ne rien dire qu'un nom faux. */
export const hoteDe = (url: string | null): string | null => {
  if (!url) return null
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return null }
}

/** Ce que le serveur accepte : https, et rien d'autre. Un lien collé sans
 *  protocole reçoit le sien ; un `http://` est refusé plutôt que réécrit, parce
 *  qu'un site qui ne sert pas https n'est pas celui qu'on croit. */
export const lienAcceptable = (saisie: string): string | null => {
  const t = saisie.trim()
  if (!t) return null
  const avec = /^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`
  try {
    const u = new URL(avec)
    return u.protocol === 'https:' && u.hostname.includes('.') ? u.toString() : null
  } catch { return null }
}

/* ─── LE STATUT ────────────────────────────────────────────────────────── */

/**
 * DÉCLARER LE STATUT — et ce que la déclaration ouvre ou clôt.
 *
 *   · hivernage / en réparation : le chantier de ce genre s'ouvre s'il n'y en a
 *     pas déjà un d'ouvert. Il reprend les étapes du dernier chantier du même
 *     genre, décochées : l'hiver prochain ressemble à celui-ci, et retaper sept
 *     lignes chaque automne est la saisie qu'on ne fait pas.
 *   · prête : TOUS les chantiers ouverts de la moto se closent. Rien n'est
 *     effacé — une étape non cochée reste non cochée, lisible, et l'écran l'a
 *     dit avant qu'on confirme.
 *
 * Rend l'id du chantier ouvert, ou `null`.
 */
export const declarerStatut = async (
  db: PowerSyncDatabase, machineId: string, statut: StatutMachine, jour: string,
): Promise<string | null> => {
  if (!estStatutMachine(statut)) throw new Error(`statut inconnu : ${String(statut)}`)
  const genre = GENRE_DU_STATUT[statut]
  let ouvert: string | null = null
  await db.writeTransaction(async (tx) => {
    await tx.execute(
      `UPDATE machine SET statut = ?, statut_depuis = ? WHERE id = ?`,
      [statut, jour, machineId])
    if (!genre) {
      await tx.execute(
        `UPDATE chantier SET clos_le = ?
          WHERE machine_id = ? AND clos_le IS NULL AND ouvert_le <= ?`,
        [jour, machineId, jour])
      return
    }
    const deja = await tx.getOptional<{ id: string }>(
      `SELECT id FROM chantier WHERE machine_id = ? AND genre = ? AND clos_le IS NULL
        ORDER BY ouvert_le DESC, id DESC LIMIT 1`, [machineId, genre])
    if (deja) { ouvert = deja.id; return }

    const id = nouvelId()
    await tx.execute(
      `INSERT INTO chantier (id, machine_id, genre, libelle, ouvert_le, clos_le)
       VALUES (?, ?, ?, ?, ?, NULL)`,
      [id, machineId, genre, libelleDuChantier(genre, jour), jour])
    const precedent = await tx.getOptional<{ id: string }>(
      `SELECT id FROM chantier WHERE machine_id = ? AND genre = ? AND id != ?
        ORDER BY ouvert_le DESC, id DESC LIMIT 1`, [machineId, genre, id])
    if (precedent) {
      const etapes = await tx.getAll<{ libelle: string; categorie: string; note: string | null;
                                       horloge_id: string | null }>(
        `SELECT libelle, categorie, note, horloge_id FROM chantier_etape
          WHERE chantier_id = ? ORDER BY ordre, id`, [precedent.id])
      let rang = 0
      for (const e of etapes) {
        if (!estCategorieIntervention(e.categorie)) continue
        await tx.execute(
          `INSERT INTO chantier_etape
             (id, chantier_id, ordre, libelle, categorie, note, faite_le, intervention_id, horloge_id)
           VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?)`,
          [nouvelId(), id, ++rang, e.libelle, e.categorie, e.note, e.horloge_id])
      }
    }
    ouvert = id
  })
  await marquerSaisie(db)
  return ouvert
}

/* ─── LECTURE ──────────────────────────────────────────────────────────── */

/** Le chantier ouvert que le statut désigne, ou `null`. Le plus récent gagne :
 *  deux téléphones hors ligne peuvent en avoir ouvert un chacun. */
export const chantierOuvert = async (
  db: PowerSyncDatabase, machineId: string, genre: GenreChantier,
): Promise<Chantier | null> =>
  db.getOptional<Chantier>(
    `SELECT id, machine_id, genre, libelle, ouvert_le, clos_le FROM chantier
      WHERE machine_id = ? AND genre = ? AND clos_le IS NULL
      ORDER BY ouvert_le DESC, id DESC LIMIT 1`, [machineId, genre])

/**
 * LE CHANTIER QUE LE STATUT ACTUEL DÉSIGNE — lu dans la base, pas dans une prop.
 *
 * ⚠ TROUVÉ PAR LE BANC, PAS À LA RELECTURE. Le raccourci passait le genre tiré
 * de la machine affichée ; au changement de statut, un rappel de synchronisation
 * encore armé avec l'ANCIEN genre (nul, « prête ») revenait 80 ms plus tard
 * écraser la bonne lecture. Le garage affichait « Ouvrir le chantier » sur un
 * chantier qui venait de s'ouvrir. La requête lit donc le statut elle-même :
 * quel que soit le rappel qui la lance, elle rend la même vérité.
 */
export const chantierDuStatut = async (
  db: PowerSyncDatabase, machineId: string,
): Promise<Chantier | null> =>
  db.getOptional<Chantier>(
    `SELECT c.id, c.machine_id, c.genre, c.libelle, c.ouvert_le, c.clos_le
       FROM chantier c JOIN machine m ON m.id = c.machine_id
      WHERE c.machine_id = ? AND c.clos_le IS NULL
        AND c.genre = CASE coalesce(m.statut, 'prete')
                        WHEN 'hivernage' THEN 'hivernage'
                        WHEN 'en_reparation' THEN 'reparation' END
      ORDER BY c.ouvert_le DESC, c.id DESC LIMIT 1`, [machineId])

export const etapesDuChantier = (db: PowerSyncDatabase, chantierId: string) =>
  db.getAll<Etape>(
    `SELECT e.id, e.chantier_id, e.ordre, e.libelle, e.categorie, e.note, e.faite_le,
            e.intervention_id, e.horloge_id, h.operation AS horloge_operation
       FROM chantier_etape e LEFT JOIN horloge h ON h.id = e.horloge_id
      WHERE e.chantier_id = ?
      ORDER BY e.ordre, e.id`, [chantierId])

export const achatsDuChantier = (db: PowerSyncDatabase, chantierId: string) =>
  db.getAll<Achat>(
    `SELECT a.id, a.chantier_id, a.etape_id, a.machine_id, a.libelle, a.quantite,
            a.prix_centimes, a.url, a.note, a.achete_le, a.depense_id,
            d.montant_centimes AS paye_centimes
       FROM achat a LEFT JOIN depense d ON d.id = a.depense_id
      WHERE a.chantier_id = ?
      ORDER BY (a.achete_le IS NOT NULL), a.id`, [chantierId])

export type Resume = {
  faites: number
  aVenir: number
  prochaine: { libelle: string; categorie: Categorie } | null
  /** Σ prix × quantité de ce qui n'est pas acheté ET a un prix. */
  estimeCentimes: number
  /** Ce qui reste à acheter sans prix : l'estimation ne le compte pas, et le dit. */
  sansPrix: number
  aAcheter: number
  /** Σ des dépenses réellement écrites à l'achat. */
  payeCentimes: number
}

/** Le résumé est CALCULÉ ICI, en code, sur les deux listes déjà lues : une
 *  seconde requête d'agrégat dirait tôt ou tard autre chose que les lignes. */
export const resumer = (etapes: readonly Etape[], achats: readonly Achat[]): Resume => {
  const faites = etapes.filter((e) => e.faite_le).length
  const prochaine = etapes.find((e) => !e.faite_le) ?? null
  const restants = achats.filter((a) => !a.achete_le)
  return {
    faites,
    aVenir: etapes.length - faites,
    prochaine: prochaine ? { libelle: prochaine.libelle, categorie: prochaine.categorie } : null,
    estimeCentimes: restants.reduce((s, a) => s + (a.prix_centimes ?? 0) * a.quantite, 0),
    sansPrix: restants.filter((a) => a.prix_centimes == null).length,
    aAcheter: restants.length,
    payeCentimes: achats.reduce((s, a) => s + (a.achete_le ? a.paye_centimes ?? 0 : 0), 0),
  }
}

/** Les horloges de la machine, pour qu'une étape puisse en désigner une. */
export const horlogesDeLaMachine = (db: PowerSyncDatabase, machineId: string) =>
  db.getAll<{ id: string; operation: string }>(
    `SELECT id, operation FROM horloge WHERE machine_id = ? ORDER BY operation`, [machineId])

/* ─── LES ÉTAPES ───────────────────────────────────────────────────────── */

export const ajouterEtape = async (
  db: PowerSyncDatabase, chantierId: string,
  e: { libelle: string; categorie: Categorie; horlogeId?: string | null },
): Promise<string> => {
  const libelle = e.libelle.trim()
  if (!libelle) throw new Error('une étape a un nom')
  if (!estCategorieIntervention(e.categorie)) throw new Error(`catégorie inconnue : ${e.categorie}`)
  const id = nouvelId()
  await db.writeTransaction(async (tx) => {
    const r = await tx.get<{ n: number | null }>(
      `SELECT max(ordre) AS n FROM chantier_etape WHERE chantier_id = ?`, [chantierId])
    await tx.execute(
      `INSERT INTO chantier_etape
         (id, chantier_id, ordre, libelle, categorie, note, faite_le, intervention_id, horloge_id)
       VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, ?)`,
      [id, chantierId, (r.n ?? 0) + 1, libelle, e.categorie, e.horlogeId ?? null])
  })
  await marquerSaisie(db)
  return id
}

/** Les étapes courantes, à la suite de ce qui existe déjà — EN UNE TRANSACTION :
 *  écrites une à une, l'écran les voyait arriver par morceaux, et un tap entre
 *  deux écritures agissait sur une liste à moitié posée. */
export const partirDesEtapesCourantes = async (db: PowerSyncDatabase, chantierId: string) => {
  await db.writeTransaction(async (tx) => {
    const r = await tx.get<{ n: number | null }>(
      `SELECT max(ordre) AS n FROM chantier_etape WHERE chantier_id = ?`, [chantierId])
    let rang = r.n ?? 0
    for (const e of ETAPES_COURANTES)
      await tx.execute(
        `INSERT INTO chantier_etape
           (id, chantier_id, ordre, libelle, categorie, note, faite_le, intervention_id, horloge_id)
         VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL, NULL)`,
        [nouvelId(), chantierId, ++rang, e.libelle, e.categorie])
  })
  await marquerSaisie(db)
}

/**
 * MONTER OU DESCENDRE D'UN RANG — deux boutons, jamais un glisser.
 *
 * UX-DR4 : « balayage ET appui haut/bas — avec des gants le balayage rate ». Les
 * rangs sont RENUMÉROTÉS 1..n dans la même transaction : deux ex æquo venus de
 * deux téléphones se départagent une fois pour toutes au premier déplacement.
 */
export const deplacerEtape = async (
  db: PowerSyncDatabase, etapeId: string, sens: -1 | 1,
) => {
  await db.writeTransaction(async (tx) => {
    const e = await tx.getOptional<{ chantier_id: string }>(
      `SELECT chantier_id FROM chantier_etape WHERE id = ?`, [etapeId])
    if (!e) return
    const ids = (await tx.getAll<{ id: string }>(
      `SELECT id FROM chantier_etape WHERE chantier_id = ? ORDER BY ordre, id`,
      [e.chantier_id])).map((x) => x.id)
    const i = ids.indexOf(etapeId)
    const j = i + sens
    if (i < 0 || j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    for (let k = 0; k < ids.length; k++)
      await tx.execute(
        `UPDATE chantier_etape SET ordre = ? WHERE id = ? AND ordre != ?`, [k + 1, ids[k], k + 1])
  })
  await marquerSaisie(db)
}

/**
 * C'EST FAIT — l'étape se coche, ET LE GESTE ENTRE AU CARNET.
 *
 * FR-43 en entier, comme à l'atelier : un tap, la date se remplit, l'horloge
 * désignée repart. L'intervention est consignée dans la catégorie de l'étape —
 * c'est ce qui garde FR-46 vrai là où il compte. Son coût reste NUL : l'argent
 * est déjà dans les dépenses écrites à l'achat, et `coutMachine` compterait
 * deux fois une intervention chiffrée sans dépense liée.
 */
export const terminerEtape = async (
  db: PowerSyncDatabase, etapeId: string, jour: string,
): Promise<string | null> => {
  let interventionId: string | null = null
  await db.writeTransaction(async (tx) => {
    const e = await tx.getOptional<{
      libelle: string; categorie: string; faite_le: string | null; horloge_id: string | null
      machine_id: string
    }>(
      `SELECT e.libelle, e.categorie, e.faite_le, e.horloge_id, c.machine_id
         FROM chantier_etape e JOIN chantier c ON c.id = e.chantier_id
        WHERE e.id = ?`, [etapeId])
    if (!e || e.faite_le) return
    if (!estCategorieIntervention(e.categorie)) throw new Error(`catégorie inconnue : ${e.categorie}`)
    const id = nouvelId()
    await tx.execute(
      `INSERT INTO intervention
         (id, machine_id, categorie, etat, libelle, date_jour)
       VALUES (?, ?, ?, 'faite', ?, ?)`,
      [id, e.machine_id, e.categorie, e.libelle, jour])
    await tx.execute(
      `UPDATE chantier_etape SET faite_le = ?, intervention_id = ? WHERE id = ?`,
      [jour, id, etapeId])
    if (e.horloge_id)
      await tx.execute(`UPDATE horloge SET depuis_intervention = ? WHERE id = ?`,
        [id, e.horloge_id])
    interventionId = id
  })
  await marquerSaisie(db)
  return interventionId
}

/**
 * PAS ENCORE FAIT — le geste coché par erreur se reprend, et SON INTERVENTION
 * PART AVEC LUI. Sinon la cocher à nouveau en consignerait une seconde, et le
 * carnet dirait deux vidanges.
 *
 * ⚠ SAUF SI ELLE PORTE UNE PREUVE. Une facture ou une photo versée au carnet
 * depuis l'atelier ne se détruit pas par un décochage : on refuse, et l'écran
 * dit où la reprendre. L'horloge qui en repartait perd ce point de départ.
 */
export const rouvrirEtape = async (
  db: PowerSyncDatabase, etapeId: string,
): Promise<{ ok: true } | { ok: false; motif: 'preuve' }> => {
  let issue: { ok: true } | { ok: false; motif: 'preuve' } = { ok: true }
  await db.writeTransaction(async (tx) => {
    const e = await tx.getOptional<{ intervention_id: string | null }>(
      `SELECT intervention_id FROM chantier_etape WHERE id = ?`, [etapeId])
    if (!e) return
    if (e.intervention_id) {
      const preuves = await tx.get<{ n: number }>(
        `SELECT count(*) AS n FROM photo WHERE intervention_id = ?`, [e.intervention_id])
      if (preuves.n > 0) { issue = { ok: false, motif: 'preuve' }; return }
      await tx.execute(`UPDATE horloge SET depuis_intervention = NULL WHERE depuis_intervention = ?`,
        [e.intervention_id])
      await tx.execute(`DELETE FROM intervention WHERE id = ?`, [e.intervention_id])
    }
    await tx.execute(
      `UPDATE chantier_etape SET faite_le = NULL, intervention_id = NULL WHERE id = ?`, [etapeId])
  })
  return issue
}

/** Retirer une étape. Le geste déjà consigné RESTE au carnet — il a eu lieu —
 *  et les achats qui la servaient restent sur la liste, détachés. Aucune
 *  cascade locale n'existe : le détachement est écrit, dans la même transaction. */
export const retirerEtape = async (db: PowerSyncDatabase, etapeId: string) => {
  await db.writeTransaction(async (tx) => {
    await tx.execute(`UPDATE achat SET etape_id = NULL WHERE etape_id = ?`, [etapeId])
    await tx.execute(`DELETE FROM chantier_etape WHERE id = ?`, [etapeId])
  })
}

/* ─── LES ACHATS ───────────────────────────────────────────────────────── */

export const ajouterAchat = async (
  db: PowerSyncDatabase,
  a: {
    chantierId: string; machineId: string | null; etapeId?: string | null
    libelle: string; quantite: number; prixCentimes: number | null
    url?: string | null; note?: string | null
  },
): Promise<string> => {
  const libelle = a.libelle.trim()
  if (!libelle) throw new Error('un achat a un nom')
  // Les gardes du serveur, recopiées : un 23514 est écarté POUR DE BON par le
  // connecteur, et la ligne disparaîtrait du second téléphone sans un mot.
  const quantite = Number.isInteger(a.quantite) && a.quantite >= 1 ? a.quantite : 1
  const prix = a.prixCentimes != null && a.prixCentimes >= 0 ? Math.round(a.prixCentimes) : null
  const url = a.url ? lienAcceptable(a.url) : null
  const id = nouvelId()
  await db.execute(
    `INSERT INTO achat
       (id, chantier_id, etape_id, machine_id, libelle, quantite, prix_centimes, url, note,
        achete_le, depense_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
    [id, a.chantierId, a.etapeId ?? null, a.machineId, libelle, quantite, prix, url,
      a.note?.trim() || null])
  await marquerSaisie(db)
  return id
}

/**
 * ACHETÉ — l'estimation devient une DÉPENSE, la seule chose que le budget lit.
 *
 * La cible suit ce que l'achat désigne : une pièce de la moto va sur la moto,
 * une tente va sur la saison (AD-7). Le poste suit la même frontière —
 * entretien pour la moto, équipement pour le garage. Le montant est celui que
 * le pilote confirme, pas l'estimation : le prix a pu bouger entre-temps.
 */
export const marquerAchete = async (
  db: PowerSyncDatabase, achatId: string, d: { centimes: number; jour: string },
): Promise<string | null> => {
  if (!Number.isInteger(d.centimes) || d.centimes < 0) throw new Error('montant invalide')
  let depenseId: string | null = null
  await db.writeTransaction(async (tx) => {
    const a = await tx.getOptional<{ libelle: string; machine_id: string | null; achete_le: string | null }>(
      `SELECT libelle, machine_id, achete_le FROM achat WHERE id = ?`, [achatId])
    if (!a || a.achete_le) return
    const id = nouvelId()
    const cible = a.machine_id ? 'machine' : 'saison'
    const poste = a.machine_id ? 'entretien' : 'equipement'
    await tx.execute(
      `INSERT INTO depense
         (id, cible, roulage_id, machine_id, saison_annee, montant_centimes, libelle, poste, date_jour)
       VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?)`,
      [id, cible, a.machine_id, anneeSaison(d.jour), d.centimes, a.libelle, poste, d.jour])
    await tx.execute(`UPDATE achat SET achete_le = ?, depense_id = ? WHERE id = ?`,
      [d.jour, id, achatId])
    depenseId = id
  })
  await marquerSaisie(db)
  return depenseId
}

/** L'achat annulé — rendu, ou coché par erreur. SA DÉPENSE PART AVEC LUI : la
 *  laisser au budget y garderait de l'argent qui n'a pas été dépensé. */
export const annulerAchat = async (db: PowerSyncDatabase, achatId: string) => {
  await db.writeTransaction(async (tx) => {
    const a = await tx.getOptional<{ depense_id: string | null }>(
      `SELECT depense_id FROM achat WHERE id = ?`, [achatId])
    if (!a) return
    if (a.depense_id) await tx.execute(`DELETE FROM depense WHERE id = ?`, [a.depense_id])
    await tx.execute(`UPDATE achat SET achete_le = NULL, depense_id = NULL WHERE id = ?`, [achatId])
  })
}

/** Retirer une ligne de la liste. Une dépense déjà écrite RESTE au budget :
 *  l'argent a été dépensé, retirer la ligne de courses ne le rend pas. */
export const retirerAchat = (db: PowerSyncDatabase, achatId: string) =>
  db.execute(`DELETE FROM achat WHERE id = ?`, [achatId])
