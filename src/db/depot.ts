import type { PowerSyncDatabase } from '@powersync/web'
import { nouvelId } from './ids'
import { marquerSaisie } from './mesures'
import { CIRCUITS_EMBARQUES } from './corpus'
import { effacerLocale, nomLocal } from './photos'
import { A_EU_LIEU, aujourdhui, TOUTES_JOURNEES } from './vecu'
import type { Poste } from './budget'

/** Toutes les lectures et écritures passent ici. Aucun écran n'écrit de SQL. */

export type Roulage = {
  id: string
  circuit_nom: string
  date_jour: string
  groupe_nom: string | null
  groupe_rang: number | null
  groupe_total: number | null
  machine_id: string | null
}

export type Machine = {
  id: string; marque: string; modele: string; annee: number | null
  /** Ce que la moto a coûté à entrer au garage. ⚠ PAS une dépense de saison :
   *  un achat conservé cinq ans écraserait le budget de la première année et
   *  disparaîtrait des quatre suivantes. C'est une donnée d'identité. */
  prix_achat_centimes: number | null
  /** Un MOIS, `AAAA-MM`. */
  achetee_le: string | null
  /** Portrait pixel en data URI. `null` est un état valide : le garage montre alors une
   *  silhouette. AD-2 fait de la machine une racine, pas un objet conditionnel à un média. */
  sprite: string | null
  /** La photo RÉELLE, indépendante du sprite — c'est elle qui reprend la scène
   *  quand un portrait de jeu est refusé ou retiré (récit 3bis.3). */
  photo_chemin: string | null
}

/** Le chrono vit en MILLISECONDES ENTIÈRES. Jamais de flottant sur un temps. */
export const formaterChrono = (ms: number): string => {
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  const d = Math.floor((ms % 1000) / 100)
  return `${m}'${String(s).padStart(2, '0')}"${d}`
}

/** Un écart porte TOUJOURS son signe — la couleur seule ne se distingue pas
 *  en deutéranopie, et le signe survit à l'impression comme au daltonisme. */
export const formaterEcart = (ms: number): string => {
  const signe = ms < 0 ? '−' : '+'
  const a = Math.abs(ms)
  const s = Math.floor(a / 1000)
  const d = Math.floor((a % 1000) / 100)
  return `${signe}${s}"${d}`
}

export const creerMachine = async (
  db: PowerSyncDatabase,
  m: { marque: string; modele: string; annee: number | null; sprite: string | null
       prixAchatCentimes?: number | null; acheteeLe?: string | null },
) => {
  const id = nouvelId()
  await db.execute(
    `INSERT INTO machine (id, marque, modele, annee, sprite, prix_achat_centimes, achetee_le)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, m.marque, m.modele, m.annee, m.sprite,
      m.prixAchatCentimes ?? null, m.acheteeLe || null],
  )
  await marquerSaisie(db)
  return id
}

export const listerMachines = (db: PowerSyncDatabase) =>
  db.getAll<Machine>(
    `SELECT id, marque, modele, annee, sprite, photo_chemin,
            prix_achat_centimes, achetee_le
       FROM machine ORDER BY id DESC`)

/** Le sprite se pose et se retire sans toucher au reste de la machine : c'est une
 *  reconstruction, pas une donnée d'identité. Le pilote doit pouvoir le refuser. */
export const poserSprite = (db: PowerSyncDatabase, machineId: string, sprite: string | null) =>
  db.execute(`UPDATE machine SET sprite = ? WHERE id = ?`, [sprite, machineId])

/**
 * Ce que la machine a coûté : EXCLUSIVEMENT ce qui la désigne. Jamais une
 * jointure implicite par les roulages (AD-17).
 *
 * DEUX SOURCES, ET UNE SEULE FOIS CHACUNE. L'argent d'un geste d'atelier entre
 * par deux portes — une dépense de cible « machine » (FR-26), ou le montant
 * porté par l'intervention elle-même quand aucune dépense n'a été saisie
 * (FR-43 : « consigner le geste ne dépend jamais d'avoir consigné l'argent »).
 * Additionner les deux sans condition compterait DEUX FOIS une pièce dont on a
 * fait les deux — d'où la clause `depense_id is null` : le montant de
 * l'intervention ne compte que lorsqu'il est la seule trace de la somme.
 *
 * Trouvé à l'écran : le garage annonçait « — » sous « ce qu'elle a coûté »
 * alors que 145,90 € venaient d'être consignés à l'atelier.
 */
export const coutMachine = async (db: PowerSyncDatabase, machineId: string) => {
  const r = await db.get<{ total: number | null }>(
    `SELECT (SELECT coalesce(sum(montant_centimes), 0) FROM depense
              WHERE cible = 'machine' AND machine_id = ?)
          + (SELECT coalesce(sum(cout_centimes), 0) FROM intervention
              WHERE machine_id = ? AND etat = 'faite' AND depense_id IS NULL)
       AS total`,
    [machineId, machineId],
  )
  return r.total ?? 0
}

/** Corriger ce qu'on a déclaré. Une machine se saisit au paddock, souvent de
 *  mémoire — la CBR de Julian est entrée en 2012 alors qu'elle est de 2010. Une
 *  donnée d'identité qu'on ne peut pas corriger est une donnée qu'on n'ose plus
 *  saisir. */
export const modifierMachine = async (
  db: PowerSyncDatabase,
  machineId: string,
  m: {
    marque: string; modele: string; annee: number | null
    prixAchatCentimes?: number | null; acheteeLe?: string | null
  },
) => {
  await db.execute(
    `UPDATE machine SET marque = ?, modele = ?, annee = ?,
            prix_achat_centimes = ?, achetee_le = ?
      WHERE id = ?`,
    [m.marque.trim(), m.modele.trim(), m.annee,
      m.prixAchatCentimes ?? null, m.acheteeLe || null, machineId])
  await marquerSaisie(db)
}

export type BilanMachine = {
  roulages: number
  /** ⚠ LE MEILLEUR TOUR VOYAGE AVEC SON CIRCUIT, et le type l'y oblige.
   *
   *  « Meilleur tour : préciser le circuit, ça n'a pas de sens sinon au global
   *  comme ça » — Julian, et il a raison au sens fort : un chrono sans circuit
   *  n'est pas une information imprécise, c'est une information FAUSSE. 1'38 à
   *  Pau-Arnos et 1'38 à Nogaro ne se comparent pas, et le garage les mettait
   *  dans la même case. Les deux champs sont donc un seul objet, comme le coût
   *  au tour et son budget : on ne peut pas déstructurer la moitié du couple. */
  meilleur: { ms: number; circuit: string } | null
  /** Le circuit le plus roulé PAR CETTE MACHINE. `null` tant qu'aucun roulage
   *  ne la désigne — pas « — », pas zéro : l'absence est une absence. */
  favori: { nom: string; roulages: number } | null
}

/** Une machine sans roulage rend des zéros et des nuls — c'est un état valide,
 *  pas une absence de données (AD-2). */
export const bilanMachine = async (
  db: PowerSyncDatabase, machineId: string, jour = aujourdhui(),
): Promise<BilanMachine> => {
  // ⚠ LES TROIS CHIFFRES DU GARAGE COMPTENT DE L'USURE, pas des intentions.
  // Une journée annoncée pour septembre faisait dire au garage « 5 roulages »
  // le jour de sa saisie, à côté d'une horloge d'usure qui, elle, en comptait
  // 4 — les deux chiffres se contredisaient à trois centimètres d'écart.
  const r = await db.get<{ roulages: number }>(
    `SELECT COUNT(*) AS roulages FROM roulage
      WHERE machine_id = ? AND ${A_EU_LIEU('')}`, [machineId, jour])

  // Le meilleur tour se cherche AVEC sa journée, donc avec son circuit. Un
  // `min()` global aurait rendu le chrono sans savoir où il a été fait.
  const m = await db.getAll<{ ms: number; circuit: string }>(
    `SELECT t.temps_ms AS ms, r.circuit_nom AS circuit
       FROM tour t
       JOIN session s ON s.id = t.session_id
       JOIN roulage r ${TOUTES_JOURNEES} ON r.id = s.roulage_id
      WHERE r.machine_id = ? AND r.circuit_nom IS NOT NULL
      ORDER BY t.temps_ms ASC LIMIT 1`, [machineId])

  // Le favori se compte à plat : deux orthographes du même circuit ne font pas
  // deux circuits, et c'est exactement le genre d'endroit où l'égalité stricte
  // couperait un favori en deux. Le départage se fait par la date la plus
  // récente — à égalité de visites, le favori est celui d'aujourd'hui.
  const l = await db.getAll<{ nom: string; n: number; dernier: string }>(
    `SELECT circuit_nom AS nom, count(*) AS n, max(date_jour) AS dernier
       FROM roulage
      WHERE machine_id = ? AND circuit_nom IS NOT NULL AND trim(circuit_nom) <> ''
        AND ${A_EU_LIEU('')}
      GROUP BY circuit_nom`, [machineId, jour])
  const groupes = new Map<string, { nom: string; n: number; dernier: string }>()
  for (const x of l) {
    const cle = aplati(x.nom)
    const d = groupes.get(cle)
    if (!d) { groupes.set(cle, { ...x }); continue }
    d.n += x.n
    // Le NOM retenu est celui de la visite la plus récente : c'est la dernière
    // orthographe que le pilote a choisie, donc celle qu'il reconnaît.
    if (x.dernier > d.dernier) { d.nom = x.nom; d.dernier = x.dernier }
  }
  const favori = [...groupes.values()]
    .sort((a, b) => b.n - a.n || (a.dernier < b.dernier ? 1 : -1))[0]

  return {
    roulages: r.roulages ?? 0,
    meilleur: m[0] ? { ms: m[0].ms, circuit: m[0].circuit } : null,
    favori: favori ? { nom: favori.nom, roulages: favori.n } : null,
  }
}

/** Comparaison de saisie : sans accent, sans casse, ET SANS SÉPARATEUR.
 *
 *  Le repli des traits d'union n'est pas une coquetterie — il a été trouvé par
 *  l'essai. « pau arnos » tapé un soir ne trouvait pas « Pau-Arnos », et pire :
 *  le bilan du lendemain annonçait « premier chrono sur ce circuit » alors que
 *  le pilote y roulait pour la deuxième fois. Deux noms qui ne diffèrent que par
 *  leur ponctuation désignent le même circuit ; il n'existe aucun contre-exemple. */
export const aplati = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim()

/** Le circuit est stocké EN CLAIR, dans `circuit_nom`. La récolte viendra poser
 *  `circuit_id` par-dessus ; elle n'est pas au noyau. Écrire le nom dans la
 *  référence — ce que faisait la v0 — bloquait toute synchronisation (récit 1.2). */
export const creerRoulage = async (
  db: PowerSyncDatabase,
  r: { circuit: string; date: string; groupeNom: string | null; rang: number | null; total: number | null; machineId: string | null },
) => {
  const id = nouvelId()

  // ⚠ « UNE SEULE MACHINE AU GARAGE, C'EST FORCÉMENT ELLE » SE DÉCIDE ICI, À
  // L'ÉCRITURE, ET PLUS AU RENDU.
  //
  // La règle existait déjà, mais dans un `useEffect` du formulaire : il listait
  // les machines, et posait la sélection quand la liste revenait. Entre le
  // moment où l'écran s'affiche et celui où cette liste arrive, « Continuer »
  // est déjà tapable — et un tap dans cette fenêtre écrivait un roulage sans
  // machine, définitivement. La fenêtre est invisible sur une machine de bureau
  // et large sur un téléphone, où SQLite passe par un worker OPFS.
  //
  // La conséquence était celle qu'on connaît déjà par cœur sur ce produit : les
  // trois chiffres du garage restent à zéro pour toujours, sans que rien ne le
  // signale. Le même défaut a déjà été corrigé une fois (`machineId` était en
  // dur à `null`) ; il revenait par une autre porte.
  //
  // AD-2 n'est pas entamé : un roulage sans machine reste un état valide, et
  // c'est exactement ce qui est écrit quand le garage est vide ou quand il
  // contient plusieurs machines dont aucune n'a été choisie. La règle ne
  // s'applique qu'au cas où la question n'a qu'une réponse possible.
  let machineId = r.machineId
  if (!machineId) {
    const m = await db.getAll<{ id: string }>(`SELECT id FROM machine LIMIT 2`)
    if (m.length === 1) machineId = m[0].id
  }

  await db.execute(
    // ⚠ `etat` S'ÉCRIT EXPLICITEMENT. Une colonne déclarée au schéma local mais
    // jamais renseignée part à NULL dans la file d'envoi, et Postgres la porte
    // en `not null default 'usage'` — la ligne serait refusée et bloquerait la
    // file derrière elle. C'est l'incident du 19 août, à l'identique. Et côté
    // lecture, l'horloge d'usure ne compte que les roulages en `usage` : un
    // NULL les rendait tous invisibles, donc l'horloge annonçait zéro.
    // ⚠ `chrono_visible` S'ÉCRIT AUSSI, et pour le motif exact de `etat` juste
    // au-dessus — il a coûté la même chose deux fois. Le serveur la porte en
    // `not null default false` : une colonne jamais écrite part à NULL, et NULL
    // n'est pas « absente », donc le défaut ne s'applique pas et la ligne est
    // refusée en 23502. `sansLesNuls` (sauvegarde.ts) ferme la classe entière ;
    // ceci ferme la source, et rend le masquage EXPLICITE au lieu d'inconnu.
    `INSERT INTO roulage
       (id, machine_id, date_jour, groupe_nom, groupe_rang, groupe_total, circuit_nom,
        etat, chrono_visible)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'usage', 0)`,
    [id, machineId, r.date, r.groupeNom, r.rang, r.total, r.circuit],
  )
  await marquerSaisie(db)
  return id
}

/**
 * CE QU'UNE JOURNÉE EMPORTE AVEC ELLE, compté avant de le détruire.
 *
 * ⚠ LA PHRASE DE CONFIRMATION PROMETTAIT MOINS QUE CE QUE LE CODE DÉTRUISAIT.
 * Elle nommait « ses N session, ses chronos et ses photos », toujours les mêmes
 * mots, quelle que soit la journée. Or `supprimerRoulage` emporte AUSSI les
 * gestes, les lignes de checklist et LES DÉPENSES DE LA JOURNÉE. Un pilote
 * pouvait donc retirer une journée mal saisie et perdre les 340 € d'engagement
 * qu'il y avait notés, sans qu'une seule ligne le lui ait dit.
 *
 * Sur la seule opération irréversible du produit, la phrase doit nommer ce qui
 * est là — et rien d'autre : sur une journée vide, annoncer la destruction de
 * chronos et de photos qui n'existent pas fait hésiter pour rien.
 *
 * Ces cinq comptes descendent avec la liste (`listerRoulages`), pas à la
 * demande : la phrase doit être là au moment du tap, pas une requête plus tard.
 */
export type ContenuDuRoulage = {
  sessions: number; photos: number; gestes: number
  depenses: number; depenses_centimes: number; checklist: number
}

export const listerRoulages = (db: PowerSyncDatabase) =>
  db.getAll<Roulage & ContenuDuRoulage & { meilleur: number | null }>(
    `SELECT r.id, r.circuit_nom, r.date_jour, r.groupe_nom, r.groupe_rang,
            r.groupe_total, r.machine_id,
            (SELECT count(*) FROM session s WHERE s.roulage_id = r.id) AS sessions,
            (SELECT min(t.temps_ms) FROM tour t
               JOIN session s2 ON s2.id = t.session_id WHERE s2.roulage_id = r.id) AS meilleur,
            -- ⚠ CE QUE LA JOURNÉE EMPORTERAIT SI ON LA RETIRAIT, compté ICI et
            -- non au moment du tap. Une confirmation qui attend une requête
            -- pour s'afficher est une confirmation qu'on tape deux fois.
            (SELECT count(*) FROM photo p WHERE p.roulage_id = r.id) AS photos,
            (SELECT count(*) FROM geste g WHERE g.roulage_id = r.id) AS gestes,
            (SELECT count(*) FROM checklist_ligne c WHERE c.roulage_id = r.id) AS checklist,
            (SELECT count(*) FROM depense d
              WHERE d.cible = 'roulage' AND d.roulage_id = r.id) AS depenses,
            (SELECT coalesce(sum(d.montant_centimes), 0) FROM depense d
              WHERE d.cible = 'roulage' AND d.roulage_id = r.id) AS depenses_centimes
       -- ⚠ ET ELLE PREND TOUT, Y COMPRIS CE QUI N'A PAS ENCORE EU LIEU. Une
       -- journée annoncée est SAISIE : elle est à toi, elle porte déjà ses
       -- dépenses et sa checklist, et elle se retire comme une autre. La cacher
       -- ici la rendrait introuvable — c'est le seul écran d'où on la corrige.
       FROM roulage r ${TOUTES_JOURNEES}
      ORDER BY r.date_jour DESC, r.id DESC`,
  )

/**
 * RETIRER UNE JOURNÉE — et c'est la seule opération destructive que le pilote
 * puisse déclencher sur ses propres données de roulage.
 *
 * Elle existe parce qu'elle manquait : Julian s'est retrouvé avec vingt-cinq
 * roulages là où il en avait saisi cinq, et le produit n'offrait AUCUN moyen
 * d'en retirer un seul. Une donnée qu'on ne peut pas corriger cesse d'être
 * saisie — c'est l'instrument ① qui l'aurait constaté, six mois trop tard.
 *
 * ⚠ ELLE DESCEND L'ARBRE ENTIER, dans l'ordre des feuilles vers la racine. Une
 * ligne orpheline n'est pas un détail cosmétique : côté serveur la clé étrangère
 * la refuse, la ligne est écartée, et c'est toute la file d'envoi qui s'arrête
 * derrière elle. Le même incident s'est déjà produit deux fois sur ce produit.
 *
 * Ce qu'elle NE touche pas, délibérément :
 *   · les dépenses de cible `machine` ou `saison` — elles ne désignent pas cette
 *     journée, et AD-7 fait des trois cibles des mondes séparés ;
 *   · les octets déjà partis au stockage objet. La ligne disparaît, la copie
 *     locale aussi ; l'objet distant devient orphelin et sera ramassé par
 *     l'effacement de compte, qui est le seul endroit qui parle au stockage.
 */
export const supprimerRoulage = async (db: PowerSyncDatabase, roulageId: string) => {
  // Les photos d'abord, parce qu'elles ont un corps hors de la base : leur
  // copie locale doit partir avec leur ligne, sinon le téléphone garde des
  // octets que plus rien ne référence.
  const ph = await db.getAll<{ id: string; chemin_objet: string }>(
    `SELECT id, chemin_objet FROM photo WHERE roulage_id = ?`, [roulageId])
  for (const p of ph) {
    try { await effacerLocale(nomLocal(p)) } catch { /* déjà partie : rien à faire */ }
  }

  await db.writeTransaction(async (tx) => {
    await tx.execute(
      `DELETE FROM tour WHERE session_id IN (SELECT id FROM session WHERE roulage_id = ?)`,
      [roulageId])
    await tx.execute(`DELETE FROM session WHERE roulage_id = ?`, [roulageId])
    await tx.execute(`DELETE FROM photo WHERE roulage_id = ?`, [roulageId])
    await tx.execute(`DELETE FROM geste WHERE roulage_id = ?`, [roulageId])
    await tx.execute(`DELETE FROM checklist_ligne WHERE roulage_id = ?`, [roulageId])
    await tx.execute(
      `DELETE FROM depense WHERE cible = 'roulage' AND roulage_id = ?`, [roulageId])
    await tx.execute(`DELETE FROM roulage WHERE id = ?`, [roulageId])
  })
}

/** AD-3 : une session porte une COLLECTION de tours, même quand la v1 n'en
 *  écrit qu'un. Et tout chrono porte sa provenance — il n'y a pas de GPS. */
export const ajouterSession = async (db: PowerSyncDatabase, roulageId: string, tempsMs: number) => {
  const rangs = await db.getAll<{ n: number }>(
    `SELECT coalesce(max(ordre), 0) AS n FROM session WHERE roulage_id = ?`, [roulageId])
  const ordre = (rangs[0]?.n ?? 0) + 1
  const sessionId = nouvelId()
  await db.execute(`INSERT INTO session (id, roulage_id, ordre) VALUES (?, ?, ?)`,
    [sessionId, roulageId, ordre])
  await db.execute(
    `INSERT INTO tour (id, session_id, temps_ms, provenance) VALUES (?, ?, ?, ?)`,
    [nouvelId(), sessionId, tempsMs, 'saisie_manuelle'],
  )
  await marquerSaisie(db)
  return ordre
}

/** Le meilleur tour du jour, et l'écart À CIRCUIT CONSTANT avec la dernière
 *  fois. Comparer deux circuits différents ne veut rien dire. */
export const bilanRoulage = async (db: PowerSyncDatabase, roulageId: string) => {
  /* ⚠ `machine_id` DESCEND AVEC LE RESTE — récit 17.2. L'écran d'une journée à
     venir dérive sa préparation de la MOTO qui roulera : sans cette colonne,
     l'écran devait relire le roulage une seconde fois, et la seconde lecture
     est exactement l'endroit où l'on oublie de filtrer comme la première.
     Une lecture PAR IDENTIFIANT ne se prononce pas sur le temps : elle rend la
     journée qu'on lui demande, vécue ou non — c'est l'appelant qui décide quoi
     en faire (`sePrepare`, src/db/vecu.ts). */
  /* ⚠ `mesures` DESCEND AVEC LE RESTE, ET C'EST CE QUI MANQUAIT À `sePrepare`.
     Il ne regardait que `sessions` : une photo prise au paddock, un geste
     déclaré ou une chute consignée le jour même ne faisaient PAS basculer la
     journée en vécue, et l'écran continuait d'ouvrir sa préparation alors que
     le pilote y était. FR-61 dit « confirmé par le pilote OU PAR UNE MESURE » —
     une photo en est une.
     L'ARGENT N'EN EST PAS UNE, et son absence ici est délibérée : « L'engagement »
     est une ligne d'« Avant d'y aller », donc une dépense comptée comme trace
     ferait disparaître la liste à l'instant où l'on suit sa consigne. Le motif
     complet est sur `sePrepare` (src/db/vecu.ts). */
  const l = await db.getAll<{ id: string; circuit: string; date: string; machine_id: string | null; sessions: number; meilleur: number | null; mesures: number }>(
    `SELECT r.id, r.circuit_nom AS circuit, r.date_jour AS date, r.machine_id,
            (SELECT count(*) FROM session s WHERE s.roulage_id = r.id) AS sessions,
            (SELECT min(t.temps_ms) FROM tour t
               JOIN session s2 ON s2.id = t.session_id WHERE s2.roulage_id = r.id) AS meilleur,
            ((SELECT count(*) FROM photo p WHERE p.roulage_id = r.id)
           + (SELECT count(*) FROM geste g WHERE g.roulage_id = r.id)
           + (SELECT count(*) FROM chute c WHERE c.roulage_id = r.id)) AS mesures
       FROM roulage r ${TOUTES_JOURNEES} WHERE r.id = ?`, [roulageId])
  const cur = l[0]
  if (!cur) return null

  // « À circuit constant » se compare SUR LE CIRCUIT, pas sur l'orthographe.
  // L'égalité SQL stricte faisait de « pau-arnos » tapé un soir et « Pau-Arnos »
  // choisi le suivant deux circuits distincts : la progression disparaissait
  // sans rien signaler. Le rapprochement se fait donc à plat — sans accent, sans
  // casse — côté application, parce que le `lower()` de SQLite ignore les accents.
  // Un CHRONO prouve la journée mieux qu'une date : cette lecture passe par
  // `tour`, donc elle ne peut voir qu'un jour où l'on a roulé.
  const anterieurs = await db.getAll<{ circuit: string; meilleur: number }>(
    `SELECT r.circuit_nom AS circuit, min(t.temps_ms) AS meilleur
       FROM tour t
       JOIN session s ON s.id = t.session_id
       JOIN roulage r ${TOUTES_JOURNEES} ON r.id = s.roulage_id
      WHERE r.id <> ? AND r.date_jour <= ?
      GROUP BY r.circuit_nom`,
    [roulageId, cur.date])

  const cle = aplati(cur.circuit)
  const ancien = anterieurs.reduce<number | null>(
    (m, a) => (aplati(a.circuit) === cle && (m == null || a.meilleur < m) ? a.meilleur : m), null)
  return {
    ...cur,
    ecart: ancien != null && cur.meilleur != null ? cur.meilleur - ancien : null,
    reference: ancien,
  }
}

/* ─── LES DÉPENSES ─────────────────────────────────────────────────────────
   AD-7 : trois cibles de premier rang, exclusives et obligatoires — roulage,
   machine, saison. Indexer le coût sur le seul roulage ferait échapper la
   moitié du budget réel, et rendrait inapplicable la clause « le coût au tour
   ne s'affiche jamais seul ».
   L'argent est en CENTIMES ENTIERS. Jamais de flottant sur de la monnaie. */

export type Cible = 'roulage' | 'machine' | 'saison'

/** AD-18 : `saison_annee` est un entier fixé À LA SAISIE et jamais recalculé.
 *
 *  Le récit 5.1 demande deux choses qui SEMBLENT en demander trois : « la saison
 *  en cours si elle existe, sinon la saison à venir », et « aucune expression
 *  conditionnelle ne compare un mois de l'année ». Les deux clauses se replient
 *  sur UNE SEULE expression — l'année de la date de la dépense. Si un roulage a
 *  déjà eu lieu cette année-là, la dépense rejoint une saison en cours ; sinon
 *  elle rejoint une saison qui n'a pas encore commencé. Même calcul, deux
 *  lectures. C'est PARCE QUE la règle se replie ainsi qu'aucun mois n'est testé,
 *  et c'est ce qui la rend vraie pour qui roule en janvier (AD-8). */
export const anneeSaison = (dateIso: string) => Number(dateIso.slice(0, 4))

export const creerDepense = async (
  db: PowerSyncDatabase,
  d: { cible: Cible; roulageId: string | null; machineId: string | null; centimes: number
       libelle: string; date: string; poste: Poste | null },
) => {
  const id = nouvelId()
  // ⚠ `date_jour` PART AVEC LA LIGNE, ET C'EST TOUT LE RÉCIT 19.2. Cette
  // fonction recevait déjà la date : elle en tirait l'année et jetait le reste.
  // Le mois n'était donc pas « pas encore affiché », il était DÉTRUIT À
  // L'ÉCRITURE — et aucune requête, aucun écran, aucune migration ne pouvait le
  // rattraper après coup. Un essai unitaire lit désormais les deux INSERT et
  // exige la colonne : un troisième chemin d'écriture qui l'oublierait ferait
  // rougir le banc au lieu de perdre les mois d'une saison entière.
  // ⚠ `poste` AUSSI, ET POUR UN DÉFAUT QUI SE VOYAIT À L'ÉCRAN. Cette fonction
  // ne l'écrivait pas du tout. Conséquence sur le seul chemin qui compte : la
  // liste « Avant d'y aller » dérive sa ligne « L'engagement » d'une requête
  // `WHERE cible = 'roulage' AND poste = 'engagement'` (src/db/preparation.ts).
  // Le pilote payait son engagement DEPUIS CETTE LIGNE, la dépense partait sans
  // poste — et la ligne restait affichée, pour toujours. La promesse de cette
  // liste est que chaque ligne mène quelque part ET disparaît quand c'est réglé ;
  // la moitié qui disparaît ne pouvait pas fonctionner.
  await db.execute(
    `INSERT INTO depense
       (id, cible, roulage_id, machine_id, saison_annee, montant_centimes, libelle, date_jour, poste)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, d.cible, d.roulageId, d.machineId, anneeSaison(d.date), d.centimes, d.libelle || null,
      d.date, d.poste],
  )
  await marquerSaisie(db)
  return id
}

/** « 245,50 » comme « 245.5 » comme « 245 » → 24550. Rien d'autre ne passe —
 *  et surtout pas un flottant : 0,1 + 0,2 ne fait pas 0,3, et une saison entière
 *  d'additions finit par le montrer. */
export const enCentimes = (saisie: string): number | null => {
  const t = saisie.trim().replace(',', '.')
  if (!/^\d{1,6}(\.\d{0,2})?$/.test(t)) return null
  const [e, dec = ''] = t.split('.')
  return Number(e) * 100 + Number(dec.padEnd(2, '0'))
}

/** Un montant rond s'écrit sans décimales, un montant à centimes en porte DEUX.
 *  « 180,5 € » n'est pas une somme d'argent, c'est un nombre — et sur une colonne
 *  de dépenses ça saute aux yeux. */
export const formaterEuros = (centimes: number) => {
  const d = centimes % 100 === 0 ? 0 : 2
  return (centimes / 100).toLocaleString('fr-FR',
    { minimumFractionDigits: d, maximumFractionDigits: d }) + ' €'
}

/** Ce qui a été DÉPENSÉ sur une saison — toutes cibles confondues, c'est le
 *  budget DU PILOTE. AD-17 : le coût d'une machine est une autre requête, celle
 *  des seules dépenses qui la désignent. Ne pas confondre les deux. */
export const depenseSaison = async (db: PowerSyncDatabase, annee: number) => {
  const r = await db.getAll<{ total: number | null }>(
    `SELECT sum(montant_centimes) AS total FROM depense WHERE saison_annee = ?`, [annee])
  return r[0]?.total ?? 0
}

/** Ce que le pilote S'ÉTAIT FIXÉ. `null` est un état parfaitement normal, et
 *  c'est LUI qui gouverne l'affichage du coût au tour (FR-24). */
export const budgetDeclare = async (db: PowerSyncDatabase, annee: number) => {
  const r = await db.get<{ montant_centimes: number | null }>(
    `SELECT max(montant_centimes) AS montant_centimes FROM budget_saison WHERE annee = ?`, [annee])
  return r.montant_centimes ?? null
}

/** Poser ou corriger le budget d'une saison. On réutilise la ligne existante
 *  plutôt que d'en créer une seconde : deux budgets pour une même saison n'ont
 *  aucun sens, et le serveur le refuserait. */
export const poserBudget = async (db: PowerSyncDatabase, annee: number, centimes: number) => {
  const exist = await db.getAll<{ id: string }>(
    `SELECT id FROM budget_saison WHERE annee = ? LIMIT 1`, [annee])
  if (exist[0]) {
    await db.execute(`UPDATE budget_saison SET montant_centimes = ? WHERE id = ?`,
      [centimes, exist[0].id])
    await marquerSaisie(db)
    return exist[0].id
  }
  const id = nouvelId()
  await db.execute(
    `INSERT INTO budget_saison (id, annee, montant_centimes) VALUES (?, ?, ?)`,
    [id, annee, centimes])
  await marquerSaisie(db)
  return id
}

export const coutRoulage = async (db: PowerSyncDatabase, roulageId: string) => {
  const r = await db.getAll<{ total: number | null }>(
    `SELECT sum(montant_centimes) AS total FROM depense WHERE cible = 'roulage' AND roulage_id = ?`, [roulageId])
  return r[0]?.total ?? 0
}

export const listerDepenses = (db: PowerSyncDatabase, annee: number) =>
  db.getAll<{ id: string; cible: Cible; libelle: string | null; montant_centimes: number; roulage_id: string | null }>(
    `SELECT id, cible, libelle, montant_centimes, roulage_id
       FROM depense WHERE saison_annee = ? ORDER BY id DESC`, [annee])

/* ─── REPRISE D'UNE BASE ÉCRITE AVANT LE RÉCIT 1.2 ─────────────────────────
   La v0 rangeait le NOM du circuit dans `circuit_id`, une référence au
   référentiel. Les bases déjà posées sur un téléphone portent donc leurs
   roulages au mauvais endroit, et aucun d'eux ne pourrait partir.

   Une seule passe, idempotente, à l'ouverture : le nom rejoint sa colonne et la
   référence redevient nulle — ce qu'elle aurait toujours dû être tant que la
   récolte n'a rien apparié. */
/**
 * Les roulages écrits avant l'épique 12 n'ont pas d'`etat`. Deux conséquences,
 * et la seconde est bloquante : l'horloge d'usure ne les compte pas, et leur
 * envoi partirait à NULL sur une colonne `not null` — une ligne refusée bloque
 * la file derrière elle.
 *
 * Ils naissent en `usage` : ils ont été saisis à la main par le pilote, donc
 * ils sont des journées vécues. Seul un import de calendrier produit un
 * brouillon, et il n'existe pas encore.
 */
export const normaliserEtats = async (db: PowerSyncDatabase): Promise<number> => {
  // Une REPRISE de base regarde toutes les lignes déjà écrites : c'est son
  // objet même, et une journée à venir doit être normalisée comme une autre.
  const r = await db.get<{ n: number }>(
    `SELECT count(*) AS n FROM roulage ${TOUTES_JOURNEES} WHERE etat IS NULL OR etat = ''`)
  if (!r.n) return 0
  await db.execute(`UPDATE roulage SET etat = 'usage' WHERE etat IS NULL OR etat = ''`)
  return r.n
}

export const normaliserCircuits = async (db: PowerSyncDatabase): Promise<number> => {
  const avant = await db.get<{ n: number }>(
    `SELECT count(*) AS n FROM roulage ${TOUTES_JOURNEES} WHERE circuit_nom IS NULL`)
  if (!avant.n) return 0

  // ① Le nom rangé dans la référence : il rejoint sa colonne.
  await db.execute(
    `UPDATE roulage SET circuit_nom = circuit_id, circuit_id = NULL
      WHERE circuit_nom IS NULL AND circuit_id IS NOT NULL`)

  // ② Un roulage SANS AUCUN circuit. Ce n'est pas une saisie du pilote — le
  //    formulaire refuse un circuit vide — c'est la sonde d'écriture, qui
  //    insérait « SONDE » dans la référence et parfois rien du tout. Le serveur
  //    les refuse, et une seule d'entre elles bloquait toute la file d'envoi.
  //    Les nommer n'invente rien : c'est le seul écrivain qui ait pu les créer.
  await db.execute(
    `UPDATE roulage SET circuit_nom = 'Sonde' WHERE circuit_nom IS NULL AND circuit_id IS NULL`)

  return avant.n
}

/* ─── LES DEUX COÛTS, ET LA CLAUSE QUI LES SÉPARE ──────────────────────────
   Le coût de la journée est une CONSTATATION : on a payé ça. Le coût au tour
   est un RAPPORT, et un rapport se manipule — il descend quand on roule plus.
   Affiché seul, il souffle « roule encore, ça baissera » ; c'est exactement le
   mécanisme que les clauses de sécurité du produit interdisent.

   D'où FR-21 et FR-24, tenus ICI plutôt que dans un écran, pour qu'aucun futur
   écran ne puisse les enfreindre par commodité : le coût au tour n'existe QUE
   s'il vient avec le budget consommé. Pas de budget, pas de coût au tour — et
   ni zéro ni tiret, l'absence est une absence. */

export type CoutRoulage = {
  /** La constatation. Toujours disponible, même à zéro. */
  journeeCentimes: number
  tours: number
  /**
   * LE RAPPORT ET SON BUDGET SONT UN SEUL OBJET, et c'est délibéré.
   *
   * Exposés en trois champs indépendants, rien n'empêchait un futur écran — ou
   * le compositeur du récapitulatif — de rendre le coût au tour sans le budget
   * consommé : la clause n'était plus tenue que par un ternaire de rendu.
   * FR-35 exige qu'AUCUN CHEMIN ne puisse le contourner, donc l'invariant
   * descend dans le TYPE : on ne peut pas déstructurer la moitié de ce couple.
   * `null` = pas de budget = pas de rapport, ni zéro ni tiret.
   */
  auTour: { centimes: number; budgetCentimes: number; consommeCentimes: number } | null
  /** Le consommé de la saison, disponible seul — il n'a rien de pervers. */
  consommeCentimes: number
}

export const coutDuRoulage = async (
  db: PowerSyncDatabase, roulageId: string, annee: number,
): Promise<CoutRoulage> => {
  const journeeCentimes = await coutRoulage(db, roulageId)
  const t = await db.get<{ n: number }>(
    `SELECT count(*) AS n FROM tour t
       JOIN session s ON s.id = t.session_id
      WHERE s.roulage_id = ?`, [roulageId])
  const budgetCentimes = await budgetDeclare(db, annee)
  const consommeCentimes = await depenseSaison(db, annee)

  // La condition porte sur le BUDGET, pas sur le calcul : le rapport est
  // calculable sans lui, et c'est précisément pour ça qu'il faut le retenir.
  const auTour = budgetCentimes != null && t.n > 0
    ? { centimes: Math.round(journeeCentimes / t.n), budgetCentimes, consommeCentimes }
    : null

  return { journeeCentimes, tours: t.n, auTour, consommeCentimes }
}

/* ─── LES CIRCUITS ─────────────────────────────────────────────────────────
   Le sélecteur de circuits. Trois règles le gouvernent, et aucune des trois
   n'est négociable parce que chacune répare un défaut connu :

   ① LE TEXTE LIBRE NE DISPARAÎT JAMAIS. La liste propose, elle ne contraint
     pas. Un circuit privé, une piste étrangère, une orthographe personnelle :
     ce qui est tapé est ce qui est écrit. Un sélecteur fermé transformerait un
     roulage réel en roulage impossible à saisir.

   ② LA PWA N'ÉCRIT RIEN DANS `circuit` (AD-12). Le référentiel se lit. Choisir
     dans la liste ne crée pas de ligne, et un circuit tapé à la main n'en
     ajoute pas une non plus.

   ③ `circuit_id` RESTE NUL. La tentation est forte de poser la référence quand
     le pilote a choisi dans la liste — mais la liste embarquée n'a pas les
     identifiants du serveur, et fabriquer un uuid côté client produirait une
     clé étrangère invalide, donc une ligne refusée à l'envoi, donc une file
     bloquée. C'est exactement l'incident du 19 août. La normalisation se fait
     côté serveur, où les deux tables sont dans la même base. */

/** `deja` : ce circuit est dans la saison du pilote. `connu` : il vient du
 *  référentiel. La distinction s'affiche, parce qu'un pilote qui revient au même
 *  circuit pour la cinquième fois doit le trouver en premier et sans lire. */
export type Propose = { nom: string; source: 'deja' | 'connu' }

export const circuitsProposes = async (
  db: PowerSyncDatabase, saisie: string, max = 6,
): Promise<Propose[]> => {
  // Les siens d'abord, le plus récent en tête : sur onze ouvertures par an, la
  // bonne réponse est presque toujours l'une des deux dernières.
  // Le départage se fait par l'UUID v7 (AD-14) quand deux roulages tombent le
  // même jour : la date seule les laisse dans un ordre arbitraire, et c'est le
  // dernier SAISI qu'un pilote s'attend à retrouver en tête.
  // ⚠ ET UNE JOURNÉE À VENIR PROPOSE SON CIRCUIT COMME UNE AUTRE. Le pilote
  // qui saisit sa deuxième journée à Pau-Arnos doit retrouver « Pau-Arnos » en
  // tête, que la première ait déjà eu lieu ou non : c'est une aide à la SAISIE,
  // pas un compte de ce qui a été roulé.
  const siens = await db.getAll<{ nom: string }>(
    `SELECT circuit_nom AS nom, max(date_jour) AS dernier, max(id) AS ecrit
       FROM roulage ${TOUTES_JOURNEES}
      WHERE circuit_nom IS NOT NULL AND trim(circuit_nom) <> ''
      GROUP BY circuit_nom ORDER BY dernier DESC, ecrit DESC`)
  const enBase = await db.getAll<{ nom: string }>(`SELECT nom FROM circuit ORDER BY nom`)

  const q = aplati(saisie)
  const tel_quel = saisie.trim()
  const vus = new Set<string>()
  const sortie: Propose[] = []
  const retenir = (nom: string, source: Propose['source'], matiere: string) => {
    const cle = aplati(nom)
    if (vus.has(cle)) return
    vus.add(cle)
    if (q && !aplati(matiere).includes(q)) return
    // Une proposition IDENTIQUE À LA LETTRE n'a rien à offrir : c'est déjà ce
    // qui est écrit, et la liste qui se replie confirme le choix. La comparaison
    // est stricte à dessein — « ledenon » n'est pas « Lédenon », et proposer
    // l'orthographe complète est précisément le service rendu.
    if (nom === tel_quel) return
    sortie.push({ nom, source })
  }

  for (const r of siens) retenir(r.nom, 'deja', r.nom)
  // La tête curée avant la queue qui grossit — et les alias ne servent qu'ici,
  // à trouver, jamais à écrire.
  for (const c of CIRCUITS_EMBARQUES) retenir(c.nom, 'connu', `${c.nom} ${c.alias ?? ''}`)
  for (const c of enBase) retenir(c.nom, 'connu', c.nom)

  return sortie.slice(0, max)
}
