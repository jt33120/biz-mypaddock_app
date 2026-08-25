import type { PowerSyncDatabase } from '@powersync/web'
import { nouvelId } from './ids'
import { marquerSaisie } from './mesures'

/**
 * LA CHECKLIST DE CHARGEMENT — épique 13, FR-49 à FR-51.
 *
 * ⚠ LE PRODUIT NE CERTIFIE PAS L'ADMISSION. Il rapporte ce qu'un organisateur a
 * publié, et la nuance n'est pas de politesse : une checklist qui coche
 * « conforme » engage la responsabilité de quelqu'un le jour où le pilote est
 * refusé au contrôle technique — ou pire, admis avec un équipement qui ne
 * convient pas. D'où trois conséquences dans le code, pas dans le texte :
 *
 *   · aucune fonction ne rend un booléen « conforme » ni un pourcentage de
 *     conformité. Une case cochée dit « je l'ai chargé », jamais « c'est bon » ;
 *   · toute ligne de conformité porte sa SOURCE et sa DATE, garanties par une
 *     contrainte serveur — une règle sans provenance ne peut pas exister ;
 *   · une fiche de plus de douze mois affiche son âge (FR-51) et ne se présente
 *     jamais comme à jour.
 *
 * La checklist reste attachée au roulage comme TRACE. Elle ne se vide pas, ne
 * se réinitialise pas, et un roulage passé garde la sienne : c'est ce qui la
 * rend utile l'année suivante, quand on ne se rappelle plus ce qu'on avait pris.
 */

/** ⚠ `preparation` DIT CE QU'ON FAIT AVANT, les trois autres ce qu'on EMPORTE.
 *  Elles ne se remplacent pas : on peut avoir tout chargé et n'avoir pas payé. */
export type Categorie = 'machine' | 'equipement' | 'conformite' | 'preparation'

export type Ligne = {
  id: string
  libelle: string
  categorie: Categorie
  cochee: number
  source_url: string | null
  publie_le: string | null
  /** Le nom de l'organisateur — ou du circuit à défaut. Nul pour une ligne de
   *  chargement, qui ne vient de personne. */
  publie_par: string | null
  /** ⚠ 1 quand la règle a été RECONSTRUITE par une extraction automatique. Une
   *  extraction n'est pas une transcription, et ce texte-là engage le passage au
   *  contrôle technique — la mention doit atteindre le pilote (QO-6). */
  extrait_par_ia: number | null
}

/**
 * ⚠ CE QUE LE CHARGEMENT REGARDE — ET CE QU'IL NE REGARDE PAS.
 *
 * `preparation` partage la table `checklist_ligne` avec le chargement, sur le
 * MÊME roulage, parce que c'est la même nature d'objet : une ligne qu'on coche.
 * Mais ce n'est pas la même LISTE, et l'écran du chargement ne doit jamais la
 * voir — ni la rendre, ni la compter, ni la laisser décider s'il y a déjà
 * quelque chose.
 *
 * Le défaut que cette constante ferme s'était installé le 23 août, quand la
 * quatrième catégorie est arrivée : `lignes()` rend TOUTES les catégories, et le
 * chargement s'en servait pour trois choses à la fois. Conséquences, toutes
 * silencieuses et toutes atteignables par le geste ordinaire — noter « payer
 * l'engagement » le jeudi soir, puis charger le camion :
 *
 *   · `composer` comptait les lignes existantes pour savoir s'il devait
 *     composer. Une tâche de préparation le faisait rendre 0 : le chargement
 *     devenait DÉFINITIVEMENT INCOMPOSABLE pour ce roulage ;
 *   · l'écran se croyait déjà composé, n'offrait donc plus « Préparer le
 *     chargement », et ouvrait sur une liste vide ;
 *   · l'en-tête comptait ces lignes — « 3 lignes » pour un camion vide, et
 *     « 1 chargé » quand on cochait « prévenir Ludo ». Le chargement annonçait
 *     dans le camion une chose qui n'y était pas.
 */
export const CHARGEMENT: readonly Categorie[] = ['machine', 'equipement', 'conformite']

export const NOM_CATEGORIE: Record<Categorie, string> = {
  machine: 'La machine',
  equipement: 'Ce que tu portes',
  conformite: "Ce que l'organisateur publie",
  preparation: "Avant d'y aller",
}

/**
 * LE CHARGEMENT DE BASE, embarqué.
 *
 * Même motif que les conseils et les circuits : il doit exister hors ligne, au
 * premier lancement, avant tout compte. Et il ne contient QUE du chargement —
 * aucune règle, aucune obligation, rien qui ressemble à une exigence
 * d'organisateur. Ce qui vient d'un organisateur porte sa source ou n'existe pas.
 */
export const CHARGEMENT_EMBARQUE: readonly { libelle: string; categorie: Categorie }[] = [
  { libelle: 'Combinaison', categorie: 'equipement' },
  { libelle: 'Casque', categorie: 'equipement' },
  { libelle: 'Gants', categorie: 'equipement' },
  { libelle: 'Bottes', categorie: 'equipement' },
  { libelle: 'Dorsale', categorie: 'equipement' },
  { libelle: 'Bidon d\'essence', categorie: 'machine' },
  { libelle: 'Béquilles', categorie: 'machine' },
  { libelle: 'Chauffe-pneus ou couvertures', categorie: 'machine' },
  { libelle: 'Caisse à outils', categorie: 'machine' },
  { libelle: 'Plaques de numéro', categorie: 'machine' },
  { libelle: 'Adhésif et durites de rechange', categorie: 'machine' },
]

/** ⚠ `composer` ne pose QUE du chargement, jamais de préparation : la
 *  préparation est DÉRIVÉE de ce que le pilote a saisi, et un fait dérivé ne se
 *  stocke pas — il se recalcule, sinon il ment le jour où la donnée change.
 *  Seules les lignes ajoutées à la main y sont écrites. */
export const lignes = (db: PowerSyncDatabase, roulageId: string) =>
  db.getAll<Ligne>(
    `SELECT id, libelle, categorie, cochee, source_url, publie_le,
            publie_par, extrait_par_ia
       FROM checklist_ligne WHERE roulage_id = ?
      ORDER BY categorie, libelle`, [roulageId])

/** Le chargement, et lui seul — voir `CHARGEMENT`. Le filtre est posé DANS LA
 *  REQUÊTE plutôt qu'après : filtrer côté écran laisserait la porte ouverte au
 *  prochain lecteur qui appellerait `lignes` sans y penser. */
export const lignesDuChargement = (db: PowerSyncDatabase, roulageId: string) =>
  db.getAll<Ligne>(
    `SELECT id, libelle, categorie, cochee, source_url, publie_le,
            publie_par, extrait_par_ia
       FROM checklist_ligne WHERE roulage_id = ?
        AND categorie IN (${CHARGEMENT.map(() => '?').join(', ')})
      ORDER BY categorie, libelle`, [roulageId, ...CHARGEMENT])

/**
 * Composer la checklist d'un roulage — FR-49.
 *
 * Elle se compose depuis le chargement de base ET les règles publiées par
 * l'organisateur du circuit, quand elles existent. Elle ne se compose qu'UNE
 * FOIS : la recomposer effacerait ce que le pilote a coché, et une liste qui
 * se décoche toute seule est une liste qu'on cesse d'utiliser.
 */
export const composer = async (
  db: PowerSyncDatabase, roulageId: string,
): Promise<number> => {
  // ⚠ ON NE COMPTE QUE LE CHARGEMENT. Compter toutes les catégories rendait le
  // chargement incomposable dès qu'une tâche de préparation existait — voir
  // `CHARGEMENT`.
  const deja = await db.get<{ n: number }>(
    `SELECT count(*) AS n FROM checklist_ligne WHERE roulage_id = ?
       AND categorie IN (${CHARGEMENT.map(() => '?').join(', ')})`,
    [roulageId, ...CHARGEMENT])
  if (deja.n) return 0

  const r = await db.get<{ circuit_id: string | null; organisateur_id: string | null }>(
    `SELECT circuit_id, organisateur_id FROM roulage WHERE id = ?`, [roulageId])

  // Les règles publiées, si le référentiel en connaît pour ce circuit ou cet
  // organisateur. Aucune n'est inventée : le produit n'en a aucune à lui.
  // ⚠ LE NOM DU PUBLIEUR SE RECOPIE ICI, pas à l'affichage. La ligne est une
  // TRACE : un organisateur renommé en 2028 ne doit pas réécrire ce qui a été
  // chargé en 2026. `organisateur` d'abord, `circuit` à défaut — une règle
  // rattachée au seul circuit est publiée par le circuit lui-même.
  const regles = (r.circuit_id || r.organisateur_id)
    ? await db.getAll<{
        libelle: string; source_url: string; publie_le: string
        publie_par: string | null; extrait_par_ia: number | null
      }>(
        `SELECT g.libelle, g.source_url, g.publie_le,
                coalesce(o.nom, c.nom) AS publie_par,
                coalesce(g.extrait_par_ia, 1) AS extrait_par_ia
           FROM regle_organisateur g
           LEFT JOIN organisateur o ON o.id = g.organisateur_id
           LEFT JOIN circuit c ON c.id = g.circuit_id
          WHERE (? IS NOT NULL AND g.circuit_id = ?)
             OR (? IS NOT NULL AND g.organisateur_id = ?)`,
        [r.circuit_id, r.circuit_id, r.organisateur_id, r.organisateur_id])
    : []

  let n = 0
  for (const c of CHARGEMENT_EMBARQUE) {
    await db.execute(
      `INSERT INTO checklist_ligne (id, roulage_id, libelle, categorie, cochee)
       VALUES (?, ?, ?, ?, 0)`, [nouvelId(), roulageId, c.libelle, c.categorie])
    n++
  }
  for (const g of regles) {
    await db.execute(
      `INSERT INTO checklist_ligne
         (id, roulage_id, libelle, categorie, cochee, source_url, publie_le,
          publie_par, extrait_par_ia)
       VALUES (?, ?, ?, 'conformite', 0, ?, ?, ?, ?)`,
      [nouvelId(), roulageId, g.libelle, g.source_url, g.publie_le,
       g.publie_par, g.extrait_par_ia ?? 1])
    n++
  }
  await marquerSaisie(db)
  return n
}

export const cocher = async (db: PowerSyncDatabase, id: string, oui: boolean) => {
  await db.execute(`UPDATE checklist_ligne SET cochee = ? WHERE id = ?`, [oui ? 1 : 0, id])
  await marquerSaisie(db)
}

export const ajouter = async (
  db: PowerSyncDatabase, roulageId: string, libelle: string, categorie: Categorie,
) => {
  // ⚠ Le pilote ne peut ajouter QUE du chargement. Lui laisser écrire une ligne
  // de conformité ferait exister une règle sans source — exactement ce que la
  // contrainte serveur interdit, et pour la même raison.
  const c: Categorie = categorie === 'conformite' ? 'machine' : categorie
  await db.execute(
    `INSERT INTO checklist_ligne (id, roulage_id, libelle, categorie, cochee)
     VALUES (?, ?, ?, ?, 0)`, [nouvelId(), roulageId, libelle.trim(), c])
  await marquerSaisie(db)
}

export const retirer = (db: PowerSyncDatabase, id: string) =>
  db.execute(`DELETE FROM checklist_ligne WHERE id = ?`, [id])

/** FR-51 — l'âge d'une fiche, en mois. Au-delà de douze, elle l'affiche et
 *  invite à vérifier ; elle ne se présente jamais comme à jour. */
export const MOIS_AVANT_DOUTE = 12

export const moisDepuis = (publieLe: string, jour: string): number => {
  const [a1, m1] = publieLe.split('-').map(Number)
  const [a2, m2] = jour.split('-').map(Number)
  if (!a1 || !m1 || !a2 || !m2) return 0
  return Math.max(0, (a2 - a1) * 12 + (m2 - m1))
}

/**
 * L'ÂGE D'UNE FICHE, EN TOUTES LETTRES — FR-51.
 *
 * ⚠ IL NE S'ARRONDIT PAS À L'ANNÉE. `Math.floor(mois / 12)` faisait lire
 * IDENTIQUEMENT une fiche de treize mois et une de vingt-trois : « il y a
 * 1 an(s) » dans les deux cas. Or c'est justement l'écart que FR-51 demande de
 * rendre exploitable — treize mois, on vérifie par acquit ; vingt-trois, la
 * saison entière a changé de règlement. En écrasant l'écart, la mention cessait
 * d'être une information pour devenir une décoration.
 *
 * Et « an(s) » n'est pas une phrase : c'est une machine qui refuse de choisir.
 */
export const direLAge = (mois: number): string => {
  if (mois < 24) return `il y a ${mois} mois`
  const ans = Math.floor(mois / 12)
  const reste = mois % 12
  return reste
    ? `il y a ${ans} ans et ${reste} mois`
    : `il y a ${ans} ans`
}

/** Une date se lit, elle ne se décode pas. « 2026-03-12 » est un identifiant ;
 *  « 12 mars 2026 » est une date — et FR-50 demande « en clair ». */
export const direPublication = (publieLe: string, par: string | null): string => {
  const d = new Date(publieLe + 'T12:00:00Z').toLocaleDateString('fr-FR',
    { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  return par ? `publié par ${par} le ${d}` : `publié le ${d}`
}
