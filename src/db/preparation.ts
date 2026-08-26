import type { PowerSyncDatabase } from '@powersync/web'
import { anneeSaison, aplati } from './depot'
import { horloges, poserHorloge } from './usure'

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
 *   · aucun engagement payé sur cette journée → elle n'est peut-être pas réglée ;
 *   · aucune assurance saisie sur la saison → elle n'est peut-être pas prise.
 *
 * Chacun de ces points existe parce qu'une donnée existe. Si le garage est
 * vide, la liste est vide — et une liste vide est un état juste, pas un écran
 * raté.
 *
 * ⚠ ET C'EST BIEN LÀ QUE LE BÂT BLESSAIT — RÉCIT 17.3, DÉCISION DE JULIAN DU
 * 25 AOÛT. Sa liste était structurellement vide : `horloge` ne comptait AUCUNE
 * ligne, aucun semeur n'existait, et la boucle des horloges sortait donc sans
 * rien produire. Il ne réclamait pas une liste embarquée par paresse — il la
 * réclamait parce que la sienne ne pouvait rien afficher.
 *
 * Sa réponse est une troisième voie, et elle est meilleure que les deux qu'on
 * lui proposait :
 *
 *   « Dans la réalité il y a bien des choses communes à chaque moto, qui doit
 *     être complété par un websearch vers le manuel d'utilisation. J'ai une
 *     moto, je cherche le manuel sur internet, je remplis et prépare tout ce
 *     qu'il peut m'apporter sur la moto, mais c'est transparent pour
 *     l'utilisateur. »
 *
 * La règle du 23 août tient donc, et le socle n'est PAS une liste à cocher :
 * `POSTES_DE_BASE` est un référentiel de POSTES D'ENTRETIEN, posé sur LA moto
 * du pilote en un geste, tous sans intervalle. Sans barème, une horloge compte
 * sans jamais échoir (FR-44) : elle ne produit donc AUCUNE ligne d'avant-roulage
 * tant que le manuel de cette machine-là n'a pas donné son intervalle. Rien
 * n'est affirmé que la donnée ne porte.
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
  /**
   * FR-40 — LA COMPLÉTUDE DU CHIFFRE, DANS LE MÊME OBJET QUE LE CHIFFRE.
   *
   * ⚠ ELLE MANQUAIT ICI, ET FR-40 N'A PAS D'EXCEPTION D'ÉCRAN. Le garage
   * affiche « sur 7 roulages saisis » à côté de chaque horloge (Usure.tsx) ;
   * l'avant-roulage affichait le même chiffre tout nu, donc avec une précision
   * que sa source n'a pas — et sur les seules lignes du produit qui touchent la
   * sécurité d'une machine. Elle est portée par le TYPE plutôt que par un
   * ternaire de rendu, exactement comme `Avancement` : ce qui est dans le type
   * ne se contourne pas à la troisième correction.
   */
  complet: string | null
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
 * LE SOCLE — récit 17.3, décision de Julian du 25 août 2026.
 *
 * ⚠ CE N'EST PAS UNE CHECKLIST EMBARQUÉE, ET LA DIFFÉRENCE EST ENTIÈRE. Une
 * checklist embarquée s'AFFICHERAIT identique chez tout le monde et se
 * cocherait sans être lue. Ceci pose des HORLOGES sur la machine du pilote :
 * elles portent son identifiant, elles comptent SES roulages, et tant qu'aucun
 * barème n'est connu elles n'affichent rien du tout dans l'avant-roulage.
 *
 * Ce sont les postes qu'un manuel d'atelier traite pour toute moto de piste, et
 * c'est le seul point commun qu'on s'autorise. Les INTERVALLES, eux, sont
 * propres à la machine et ne viennent que du manuel de CETTE machine — jamais
 * d'ici, jamais d'une moyenne, jamais d'une hypothèse : un intervalle inventé
 * sur une plaquette de frein est la faute que ce produit ne peut pas commettre.
 */
export const POSTES_DE_BASE: readonly string[] = [
  'Vidange moteur',
  'Filtre à huile',
  'Filtre à air',
  'Plaquettes de frein',
  'Liquide de frein',
  'Chaîne et couronne',
  'Pneus',
  'Bougies',
]

/**
 * Poser le socle sur une machine — un geste, et il n'écrase rien.
 *
 * Ce qui existe déjà n'est pas retouché : ni son intervalle, ni son point de
 * départ, ni sa source. Une horloge posée à la main par le pilote, ou remplie
 * par le manuel, garde ce qu'elle porte. Rendu : le nombre RÉELLEMENT posé —
 * un compte annoncé qui ne serait pas le compte écrit est le genre de garde qui
 * ne garde rien.
 */
export const poserLesPostesDeBase = async (
  db: PowerSyncDatabase, machineId: string,
): Promise<number> => {
  const deja = await db.getAll<{ operation: string }>(
    `SELECT operation FROM horloge WHERE machine_id = ?`, [machineId])
  const connues = new Set(deja.map((d) => aplati(d.operation)))
  let n = 0
  for (const p of POSTES_DE_BASE) {
    if (connues.has(aplati(p))) continue
    await poserHorloge(db, { machineId, operation: p, intervalle: null })
    connues.add(aplati(p))
    n++
  }
  return n
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
        complet: null,
        vers: 'atelier',
      })
    }

    // ② LES HORLOGES AU-DELÀ DE LEUR INTERVALLE — et c'est le MÊME CALCUL QUE
    //    LE GARAGE, parce que c'est maintenant LA MÊME FONCTION.
    //
    //    ⚠ DEUX ERREURS VIVAIENT ICI, ET ELLES SE COMPENSAIENT EXACTEMENT :
    //
    //      · ce fichier faisait un `count(*)` BRUT là où le garage additionne
    //        des coefficients de pondération (usure.ts) — deux chiffres
    //        différents pour la même horloge sur deux écrans ;
    //      · et il testait `n > intervalle` là où le garage lit
    //        `pondérés >= intervalle` (Usure.tsx).
    //
    //    Comme `n` valait exactement `pondérés + 1` sur le cas ordinaire — le
    //    roulage préparé se comptant lui-même —, `n > i` équivalait à
    //    `pondérés >= i` et RIEN NE SE VOYAIT. Corriger une seule des deux
    //    aurait décalé toute la liste d'un roulage. Elles partent ensemble, et
    //    de la seule manière qui empêche la troisième de renaître : il n'y a
    //    plus de second calcul du tout.
    //
    //    ⚠ ET LE ROULAGE PRÉPARÉ NE SE COMPTE PLUS LUI-MÊME. `horloges` compte
    //    au JOUR COURANT par défaut ; une journée de septembre est postérieure,
    //    donc hors du compte (`A_EU_LIEU`, src/db/vecu.ts). Le commentaire qui
    //    surplombait l'ancien code décrivait un comportement qui n'existait pas.
    for (const h of await horloges(db, roulage.machineId)) {
      const a = h.avancement
      if (a.intervalle == null) continue      // sans barème, elle compte sans échoir
      if (a.ponderes < a.intervalle) continue
      l.push({
        genre: 'usure',
        libelle: h.operation,
        motif: `${a.ponderes} roulages pondérés depuis, l’intervalle est de ${a.intervalle}`,
        complet: direLaCompletude(a.completude),
        vers: 'usure',
      })
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
      complet: null,
      vers: 'budget',
    })
  }

  // ④ L'ASSURANCE — récit 17.3, et c'est le troisième mot de la phrase de
  //    Julian : « checker huile, si accident réparer, payer ». Elle se dérive
  //    exactement comme l'engagement, à la SAISON près : on ne s'assure pas
  //    journée par journée, et une assurance annuelle saisie en mars couvre
  //    celle de septembre.
  //
  //    ⚠ ET ELLE DISPARAÎT DÈS QUE LA DÉPENSE EXISTE. C'est la promesse entière
  //    de cette liste — chaque ligne mène quelque part, et chaque ligne s'en va
  //    quand c'est réglé —, et c'est exactement celle que « L'engagement » ne
  //    tenait pas tant que `creerDepense` n'écrivait aucun poste.
  const annee = anneeSaison(roulage.date)
  const assurance = await db.get<{ n: number }>(
    `SELECT count(*) AS n FROM depense WHERE poste = 'assurance' AND saison_annee = ?`,
    [annee])
  if (!assurance.n) {
    l.push({
      genre: 'argent',
      libelle: "L'assurance",
      motif: `aucune dépense d’assurance saisie sur la saison ${annee}`,
      complet: null,
      vers: 'budget',
    })
  }

  return l
}

/** FR-40 — la complétude en toutes lettres, dans les mêmes mots qu'au garage
 *  (Usure.tsx). Deux formulations pour le même fait sur deux écrans font douter
 *  du chiffre, et c'est le chiffre qui touche la sécurité. */
export const direLaCompletude = (c: { saisis: number; sansGroupe: number }): string =>
  `sur ${c.saisis} roulage${c.saisis > 1 ? 's' : ''} saisi${c.saisis > 1 ? 's' : ''}`
  + (c.sansGroupe > 0 ? ` · ${c.sansGroupe} sans groupe, donc comptés sans pondération` : '')

/**
 * LE RAPPROCHEMENT D'UNE TÂCHE ÉCRITE À LA MAIN AVEC UNE TÂCHE DÉRIVÉE.
 *
 * ⚠ IL NE RAPPROCHAIT QUE LES LIBELLÉS STRICTEMENT IDENTIQUES, et c'est le cas
 * qui n'arrive jamais : la ligne dérivée s'appelle « L'assurance », le pilote
 * tape « assurance ». Deux lignes pour la même chose, et le produit ne disait
 * rien — ce qui est pire que de la montrer deux fois, parce qu'on ne sait plus
 * laquelle fait foi.
 *
 * L'article de tête tombe donc des deux côtés. On ne va pas plus loin : une
 * racinisation approximative rapprocherait « pneus » et « pneumatique », et
 * rapprocher à tort masque une tâche que le pilote a écrite lui-même. Dans le
 * doute, on montre — jamais on ne cache.
 */
const NOYAU = /^(l|le|la|les|un|une|des|du|de|mon|ma|mes)\s+/
export const noyauDeTache = (s: string) => aplati(s).replace(NOYAU, '')
export const memeTache = (a: string, b: string) => noyauDeTache(a) === noyauDeTache(b)
