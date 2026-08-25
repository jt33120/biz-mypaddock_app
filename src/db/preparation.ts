import type { PowerSyncDatabase } from '@powersync/web'
import { aplati } from './depot'
import { A_EU_LIEU } from './vecu'

/**
 * CE QUI RESTE À FAIRE AVANT UN ROULAGE — retour de Julian du 23 août :
 *
 *   « Je mets le prochain roulage où je vais aller et j'ai une liste de tâches
 *     à faire : checker huile, si accident réparer, payer etc. »
 *
 * ⚠ LA LISTE EST DÉRIVÉE, ELLE N'EST PAS INVENTÉE, et c'est toute la conception
 * de ce fichier.
 *
 * La version paresseuse serait une liste embarquée — « vérifier l'huile,
 * vérifier la pression, vérifier la chaîne » — la même pour tout le monde, à
 * cocher tous les onze roulages. Elle serait cochée sans être lue dès la
 * deuxième fois, parce qu'elle ne sait rien de cette moto-là ni de ce jour-là.
 *
 * Ce fichier ne produit donc QUE des faits que le pilote a déjà saisis, chacun
 * rattaché à sa source dans les données :
 *
 *   · une pièce achetée et pas encore montée → elle t'attend au garage ;
 *   · une horloge au-delà de son intervalle → ce poste a passé son échéance ;
 *   · une réparation née d'une chute et pas encore faite ;
 *   · aucun engagement payé sur cette journée → elle n'est peut-être pas réglée.
 *
 * Chacun de ces quatre points existe parce qu'une donnée existe. Si le garage
 * est vide, la liste est vide — et une liste vide est un état juste, pas un
 * écran raté.
 *
 * ⚠ ET AUCUN COMPTEUR DE PROGRESSION. Ni « 3 sur 7 », ni barre qui se remplit,
 * ni pastille. FR-50 le dit déjà pour la checklist de chargement et vaut ici
 * mot pour mot : une liste qui affiche sa progression devient une chose à
 * finir, et une chose à finir se bâcle. On ÉNONCE ce qui attend ; on ne compte
 * pas ce qui manque.
 */

export type Genre = 'piece' | 'usure' | 'chute' | 'argent'

export type Tache = {
  genre: Genre
  libelle: string
  /** Le fait qui la produit, dit en clair. Une tâche sans son motif est un ordre ;
   *  avec son motif, c'est un constat qu'on peut contester. */
  motif: string
  /** Où aller pour la traiter. Une ligne qui ne mène nulle part ne sert à rien —
   *  c'est le défaut classique d'une liste de rappels. */
  vers: 'atelier' | 'usure' | 'budget'
}

export const NOM_GENRE: Record<Genre, string> = {
  piece: 'Au garage',
  usure: 'Usure',
  chute: 'Après la chute',
  argent: 'Argent',
}

/**
 * Ce qui attend avant CE roulage.
 *
 * `machineId` peut être nul — un roulage sans machine est un état valide
 * (AD-2) — et la liste se réduit alors aux points qui ne dépendent pas d'une
 * moto. Elle ne devient jamais une erreur.
 */
export const cequiResteAFaire = async (
  db: PowerSyncDatabase,
  roulage: { id: string; machineId: string | null; date: string },
): Promise<Tache[]> => {
  const l: Tache[] = []

  if (roulage.machineId) {
    // ① CE QUI ATTEND À L'ATELIER. Les trois catégories restent séparées
    //    (FR-46) : on ne fabrique pas ici la liste mélangée que l'atelier
    //    s'interdit. Le genre porte la catégorie, et l'écran ne les fusionne pas.
    const visees = await db.getAll<{ id: string; libelle: string; categorie: string; chute_id: string | null }>(
      `SELECT id, libelle, categorie, chute_id FROM intervention
        WHERE machine_id = ? AND etat = 'visee' ORDER BY categorie, id`,
      [roulage.machineId])
    for (const i of visees) {
      l.push({
        genre: i.chute_id ? 'chute' : 'piece',
        libelle: i.libelle,
        motif: i.chute_id
          ? 'né d’une chute, pas encore réparé'
          : i.categorie === 'reparation_non_vitale'
            ? 'à regarder, sans gravité'
            : 'acheté, pas encore monté',
        vers: 'atelier',
      })
    }

    // ② LES HORLOGES AU-DELÀ DE LEUR INTERVALLE. On ne compte QUE les roulages
    //    déjà vécus et déjà passés : une journée saisie pour septembre est un
    //    projet, pas de l'usure. Le même défaut a déjà fait avancer une horloge
    //    d'un cran sur un roulage qui n'avait pas eu lieu.
    const horloges = await db.getAll<{ operation: string; intervalle: number | null; depuis: string | null }>(
      `SELECT operation, intervalle_roulages AS intervalle, depuis_intervention AS depuis
         FROM horloge WHERE machine_id = ?`, [roulage.machineId])
    for (const h of horloges) {
      if (!h.intervalle) continue      // sans barème, elle compte sans échoir
      // ⚠ LE PARAMÈTRE DE DATE RESTE CELUI DU ROULAGE PRÉPARÉ, et c'est un
      //   défaut CONNU, pas un oubli : le roulage qu'on prépare se compte
      //   lui-même. Il ne se corrige pas ici parce qu'il en compense un second
      //   EXACTEMENT — `n > intervalle` là où le garage lit `pondérés >=
      //   intervalle` (usure.ts, Usure.tsx). Corriger l'un sans l'autre décale
      //   toute la liste d'un roulage. Les deux partent ensemble au récit 17.3,
      //   ou aucun.
      const depuis = await db.get<{ n: number }>(
        `SELECT count(*) AS n FROM roulage
          WHERE machine_id = ? AND ${A_EU_LIEU('')}
            AND (? IS NULL OR date_jour >= (
                  SELECT coalesce(date_jour, '0000') FROM intervention WHERE id = ?))`,
        [roulage.machineId, roulage.date, h.depuis, h.depuis])
      if (depuis.n > h.intervalle) {
        l.push({
          genre: 'usure',
          libelle: h.operation,
          motif: `${depuis.n} roulages depuis, l’intervalle est de ${h.intervalle}`,
          vers: 'usure',
        })
      }
    }
  }

  // ③ L'ENGAGEMENT. « Payer » est le seul des trois exemples de Julian qui ne
  //    vienne pas de l'atelier, et c'est aussi celui qui coûte le plus cher à
  //    oublier : une place non réglée est une place non réservée.
  //
  //    ⚠ ON NE DIT PAS « tu n'as pas payé ». On dit qu'AUCUNE DÉPENSE
  //    D'ENGAGEMENT N'EST SAISIE — ce qui est le fait, et qui peut vouloir dire
  //    « payé sans l'avoir noté ». Affirmer l'impayé sur une absence de saisie
  //    serait faux une fois sur deux, et le produit énonce ce qu'il sait.
  const paye = await db.get<{ n: number }>(
    `SELECT count(*) AS n FROM depense
      WHERE cible = 'roulage' AND roulage_id = ? AND poste = 'engagement'`, [roulage.id])
  if (!paye.n) {
    l.push({
      genre: 'argent',
      libelle: "L'engagement",
      motif: 'aucune dépense d’engagement saisie sur cette journée',
      vers: 'budget',
    })
  }

  return l
}

/** Les tâches ajoutées à la main portent la catégorie `preparation` de la
 *  checklist. On les rapproche à plat des tâches dérivées pour ne pas afficher
 *  deux fois la même chose sous deux orthographes. */
export const memeTache = (a: string, b: string) => aplati(a) === aplati(b)
