import type { PowerSyncDatabase } from '@powersync/web'
import { TOUTES_JOURNEES } from './vecu'

/**
 * LA TENUE D'UNE JOURNÉE — ce qu'on porte, à côté de ce qu'on enfourche.
 *
 * « on peut lier à la journée de roule 1) la moto quand il y en a plusieurs,
 *   2) le casque 3) la combi » — Julian, 1er septembre 2026. La moto était déjà
 * liée ; ce fichier est la LECTURE des deux autres, et de la moto avec elles.
 *
 * ⚠ CE MODULE NE LIT QUE. L'écriture vit dans src/db/depot.ts
 * (`poserPieceDeTenue`) parce que c'est la ligne `roulage` qu'elle modifie, et
 * que `marquerSaisie` y est déjà appelé par toutes les écritures de la journée.
 * Deux endroits qui écrivent la même ligne finissent par ne plus marquer la
 * même chose.
 *
 * ⚠ IL N'Y A ICI NI COMPTE, NI COMPLÉTUDE, NI « 2 SUR 3 ». Une tenue partielle
 * n'est pas un objectif à moitié rempli : une pièce non liée est une pièce dont
 * le pilote n'a rien dit, et le produit ne relance personne pour compléter un
 * carnet (AD-2). Le type ne porte donc aucun agrégat — pas même privé : un
 * champ « déclarées: 2 » se retrouverait à l'écran dans le mois.
 */

/** Ce que la pièce EST, quand le produit a besoin de la distinguer — et c'est
 *  `equipement.genre`, jamais `categorie`. `categorie` vaut 'protection' pour un
 *  casque comme pour une combinaison : elle ne peut pas alimenter deux
 *  sélecteurs séparés (migration 20260901000001). */
export type GenreDeTenue = 'casque' | 'combinaison'

/** Les deux genres AVEC LEUR MOT, dans l'ordre où ils s'affichent — et ils
 *  vivent ici, à côté du type, pour la raison qui vaut dans tout ce dépôt : une
 *  liste de libellés recopiée dans un écran prend du retard sur le type le jour
 *  où un troisième genre arrive, et c'est la copie qu'on oublie. Le tuple force
 *  le compilateur à les redemander tous les deux. */
export const GENRES_DE_TENUE: readonly (readonly [GenreDeTenue, string])[] = [
  ['casque', 'Casque'],
  ['combinaison', 'Combinaison'],
]

export type PieceDeTenue = {
  id: string
  nom: string
  /** Le portrait pixel, en data URI. `null` est un état PLEINEMENT valide : une
   *  pièce sans portrait reste une pièce, et l'écran le dit en toutes lettres
   *  plutôt que de laisser un cadre muet. */
  sprite: string | null
}

/**
 * TOUT CE QU'IL FAUT POUR RENDRE LA TENUE, EN UNE LECTURE.
 *
 * Les pièces PORTÉES et les pièces À CHOISIR descendent ensemble, et c'est une
 * décision : la règle d'apparition du sélecteur (« il ne s'affiche que s'il y a
 * de quoi choisir ») se lit sur les mêmes tableaux que le rendu. Deux lectures
 * séparées auraient laissé une fenêtre où l'écran connaît le casque porté sans
 * connaître encore la liste — donc où il affiche une tenue sans le moyen de la
 * corriger.
 */
export type TenueDuJour = {
  /** La moto de la journée. Son nom est marque + modèle, comme au garage. */
  machine: { id: string; nom: string; sprite: string | null } | null
  casque: PieceDeTenue | null
  combinaison: PieceDeTenue | null
  /** Ce qu'il y a À CHOISIR, tous genres confondus dans deux listes. Vides
   *  quand le pilote n'a déclaré aucune pièce de ce genre — et le sélecteur
   *  disparaît alors au lieu de proposer une liste vide. */
  casques: PieceDeTenue[]
  combinaisons: PieceDeTenue[]
}

/** Rangé par achat le plus récent, comme l'inventaire. Aucun tri par « âge » ni
 *  par « à remplacer » : ces classements n'existent nulle part dans ce produit,
 *  et sur du matériel de protection c'est une clause de sécurité (FR-48). */
export const piecesDeGenre = (db: PowerSyncDatabase, genre: GenreDeTenue) =>
  db.getAll<PieceDeTenue>(
    `SELECT id, nom, sprite FROM equipement WHERE genre = ?
      ORDER BY coalesce(achete_le, '0000') DESC, id DESC`,
    [genre])

type LigneDeTenue = {
  m_id: string | null; m_marque: string | null; m_modele: string | null; m_sprite: string | null
  c_id: string | null; c_nom: string | null; c_sprite: string | null
  k_id: string | null; k_nom: string | null; k_sprite: string | null
}

const piece = (
  id: string | null, nom: string | null, sprite: string | null,
): PieceDeTenue | null => (id && nom != null ? { id, nom, sprite } : null)

/**
 * ⚠ CHAQUE PIÈCE EST RÉSOLUE PAR SON IDENTIFIANT, ET PAR RIEN D'AUTRE.
 *
 * La jointure porte `ON e.id = r.casque_id` : si le lien est nul, ou s'il
 * désigne une ligne absente en local, le casque revient `null` et l'écran écrit
 * « rien de déclaré ». Il ne retombe JAMAIS sur « le premier casque de la
 * liste », qui afficherait le portrait d'une pièce que le pilote n'a pas portée
 * ce jour-là — un mensonge silencieux, et le seul que ce bloc puisse produire.
 *
 * ⚠ ET LE LIEN SURVIT AU GENRE. La jointure ne vérifie pas
 * `genre = 'casque'` : retirer le genre d'une pièce, ou le corriger, ne doit pas
 * effacer les journées où elle a été portée. C'est la même règle que le
 * `on delete set null` du serveur — seule la VENTE délie, et la journée garde
 * tout le reste. Le genre décide de ce qu'on PROPOSE, jamais de ce qui a eu lieu.
 *
 * ⚠ La suppression locale d'une pièce (`oublierEquipement`) ne remet pas les
 * liens à nul : SQLite n'applique pas les clés étrangères du serveur ici. Le
 * lien pend donc jusqu'à ce que le serveur le mette à `null` et le renvoie. La
 * jointure rend ce cas indistinguable d'une pièce non déclarée, ce qui est la
 * seule lecture honnête possible en local : on ne sait plus de quoi il s'agit.
 */
export const tenueDuJour = async (
  db: PowerSyncDatabase, roulageId: string,
): Promise<TenueDuJour> => {
  const [lignes, casques, combinaisons] = await Promise.all([
    db.getAll<LigneDeTenue>(
      // `${TOUTES_JOURNEES}` : cette lecture PREND TOUT, et c'est voulu — la
      // tenue se déclare AVANT de partir, sur une journée qui n'a pas encore eu
      // lieu, et se relit après. Filtrer sur le passé la rendrait invisible
      // exactement au moment où elle sert (récit 17.1).
      `SELECT m.id AS m_id, m.marque AS m_marque, m.modele AS m_modele, m.sprite AS m_sprite,
              c.id AS c_id, c.nom AS c_nom, c.sprite AS c_sprite,
              k.id AS k_id, k.nom AS k_nom, k.sprite AS k_sprite
         FROM roulage r ${TOUTES_JOURNEES}
         LEFT JOIN machine m ON m.id = r.machine_id
         LEFT JOIN equipement c ON c.id = r.casque_id
         LEFT JOIN equipement k ON k.id = r.combinaison_id
        WHERE r.id = ?`,
      [roulageId]),
    piecesDeGenre(db, 'casque'),
    piecesDeGenre(db, 'combinaison'),
  ])

  const l = lignes[0]
  return {
    machine: l?.m_id
      ? {
        id: l.m_id,
        // Le même nom qu'au garage : `marque modele`. Une moto nommée par son
        // seul modèle sur un écran et par les deux sur l'autre se lit comme
        // deux motos.
        nom: `${l.m_marque ?? ''} ${l.m_modele ?? ''}`.trim(),
        sprite: l.m_sprite,
      }
      : null,
    casque: piece(l?.c_id ?? null, l?.c_nom ?? null, l?.c_sprite ?? null),
    combinaison: piece(l?.k_id ?? null, l?.k_nom ?? null, l?.k_sprite ?? null),
    casques,
    combinaisons,
  }
}
