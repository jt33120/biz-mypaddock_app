import { column, Schema, Table } from '@powersync/web'

/**
 * Miroir local du schéma Postgres — récit 1.1.
 *
 * ⚠ AUCUNE colonne `cree_le` / `modifie_le` sur les tables que le pilote écrit.
 * Une opération PUT de PowerSync transmet les colonnes DÉCLARÉES ; celles que
 * l'application ne renseigne jamais partiraient à null, et Postgres les porte
 * en `not null default now()` — tout envoi échouerait. Le serveur les remplit
 * lui-même, et l'ordre chronologique est de toute façon dans l'UUID v7 (AD-14),
 * jamais dans un horodatage. Le référentiel les garde : il est en lecture seule
 * (AD-12) et ne remonte rien.
 *
 * SQLite ne connaît que text, integer et real. D'où les conventions, qui sont
 * les mêmes des deux côtés et ne se négocient pas :
 *   · argent  → integer de CENTIMES
 *   · chrono  → integer de MILLISECONDES
 *   · date    → text ISO 8601 (AAAA-MM-JJ)
 *   · booléen → integer 0 / 1
 *
 * PowerSync ajoute implicitement une colonne `id` de type text à chaque table :
 * elle n'est pas déclarée ici, et c'est elle qui reçoit l'UUID v7 client.
 */

// ─── RACINE 1 : la machine ────────────────────────────────────────────────
// AD-2 : une machine sans aucun roulage est un état valide.
//
// ⚠ LE PROPRIÉTAIRE N'EST PAS UNE DONNÉE LOCALE — récit 1.2. Ni ici, ni sur le
// roulage, ni sur la dépense. C'est une CONSÉQUENCE du compte, apposée à l'envoi
// par le connecteur. Le tenir en local obligeait à inventer une valeur avant
// qu'un compte existe — c'était la chaîne `local`, qui n'est pas un uuid, et que
// Postgres aurait refusée sur la toute première ligne envoyée.
const machine = new Table({
  marque: column.text,
  modele: column.text,
  annee: column.integer,
  // Portrait pixel détouré, PNG en data URI. Nullable : une machine sans sprite est un état
  // valide (AD-2) et le garage affiche alors sa silhouette — il n'exige jamais une photo pour
  // fonctionner. Produit une seule fois puis CONSERVÉ : c'est le seul champ du produit dont le
  // calcul coûte de l'argent.
  sprite: column.text,
  // La photo RÉELLE de la machine, distincte du sprite. C'est elle qui rend
  // vraie la clause « un rendu refusé, la photo reprend sa place » : sans elle
  // il n'y aurait rien à quoi revenir, et retirer un sprite laisserait un vide.
  photo_chemin: column.text,
  /** Ce que la moto a coûté à entrer au garage. ⚠ PAS une `depense` : une
   *  dépense appartient à une saison (AD-18), et un achat conservé cinq ans
   *  écraserait le budget de la première année pour disparaître des quatre
   *  suivantes. C'est une donnée d'identité de la machine. */
  prix_achat_centimes: column.integer,
  /** Un MOIS, `AAAA-MM`. Même raison qu'à l'équipement : personne ne cherche sa
   *  carte grise pour saisir un garage. */
  achetee_le: column.text,
})

// ─── LA CHUTE ─────────────────────────────────────────────────────────────
// ⚠ CE QU'ELLE N'AURA JAMAIS, et c'est la clause la plus importante de ce
// fichier : aucun compteur, aucune série « sans chute », aucune gravité, aucune
// responsabilité. Le produit est né d'une chute causée par la recherche d'un
// geste ; il n'a pas le droit d'en faire un score.
//
// La série « X roulages sans chute » serait la plus tentante et la pire : elle
// crée une pression à ne pas la rompre, donc à NE PAS DÉCLARER. Un carnet qu'on
// n'ose pas remplir ne vaut rien, et sur ce sujet-là il vaut moins que rien.
//
// Ce qu'elle porte est un RÉCIT et un ENDROIT, libres et facultatifs tous les
// deux : une chute qu'on ne veut pas raconter reste une chute consignée.
const chute = new Table({
  roulage_id: column.text,
  /** « virage 3 », « l'épingle » : ce que le pilote dit, jamais une coordonnée.
   *  Le téléphone n'est pas en piste (AD-3). */
  endroit: column.text,
  recit: column.text,
})

// ─── RACINE 2 : le roulage ────────────────────────────────────────────────
// AD-2 : `machine_id` est NULLABLE — un roulage sans machine est un état valide.
// C'est l'invariant qui rend l'axe atelier atteignable sans migration.
const roulage = new Table({
  machine_id: column.text,
  // Le circuit SE SAISIT. `circuit_nom` fait foi ; la référence au référentiel
  // est la normalisation que la récolte posera plus tard, et reste nulle jusque-là.
  // Écrire le nom dans la référence — ce que faisait la v0 — rendait toute
  // synchronisation impossible : côté serveur c'est un uuid à clé étrangère.
  circuit_nom: column.text,
  circuit_id: column.text,
  organisateur_id: column.text,
  date_jour: column.text,
  // Le groupe se saisit sur l'échelle de SON organisateur : Pau-Arnos annonce
  // 2 à 4 groupes nommés Initiation/Intermédiaire/Confirmé/Expert. Seul le rang
  // est comparable d'une sortie à l'autre.
  groupe_nom: column.text,
  groupe_rang: column.integer,
  groupe_total: column.integer,
  niveau: column.text,
  // FR-19 : masqué par défaut, roulage par roulage. Une comparaison imposée
  // fait cesser la saisie de celui qui en aurait le plus besoin — le défaut
  // est donc celui qui protège, et il ne se règle jamais globalement.
  chrono_visible: column.integer,
  // FR-61 : brouillon = importé d'un calendrier, une inscription ne prouve pas
  // qu'on a roulé. usage = confirmé. Un roulage saisi à la main naît en usage,
  // et les quatre mots de la frontière ne remontent JAMAIS à l'écran.
  etat: column.text,
  /** `a_renseigner` n'est pas un faux négatif : aucune chute consignée ne
   *  prouve jamais qu'il n'y en a pas eu. Seul le pilote pose `aucun`. */
  crash_statut: column.text,
})

// ─── Session et tours ─────────────────────────────────────────────────────
// AD-3 : une session porte n tours, même quand la v1 n'en écrit qu'un seul.
const session = new Table({
  roulage_id: column.text,
  ordre: column.integer,
  duree_ms: column.integer,
})

// AD-3 : chaque tour porte sa provenance, et il n'existe AUCUNE valeur GPS.
// Le pilote n'a pas son téléphone en piste — il est resté au camion.
const tour = new Table({
  session_id: column.text,
  temps_ms: column.integer,
  provenance: column.text,
})

// ─── Dépense ──────────────────────────────────────────────────────────────
// AD-7 : trois cibles exclusives. AD-18 : `saison_annee` est un entier et non
// une référence — la saison est dérivée et n'a aucune ligne à pointer.
const depense = new Table({
  cible: column.text,
  roulage_id: column.text,
  machine_id: column.text,
  saison_annee: column.integer,
  montant_centimes: column.integer,
  libelle: column.text,
  /** LE JOUR DE LA DÉPENSE — récit 19.2, et c'est la colonne qui rend le mois
   *  possible. Avant elle, `saison_annee` était TOUT ce que la table gardait du
   *  temps : « ce que j'ai dépensé en juillet » n'était pas imprécis, il était
   *  INCALCULABLE, et aucun écran ne pouvait le dire.
   *
   *  ⚠ ON RANGE LE JOUR, JAMAIS LE MOIS. Le mois se dérive (`moisDuJour`,
   *  src/db/budget.ts) et ne se stocke pas : une colonne `mois` posée à côté de
   *  sa source serait une seconde vérité, et c'est toujours la copie qu'on
   *  oublie de corriger. Même règle que `saison_annee`… qui est l'exception
   *  assumée d'AD-18, fixée à la saisie parce qu'elle ne doit JAMAIS bouger.
   *
   *  ⚠ NULLABLE POUR TOUJOURS. Les dépenses saisies avant cette colonne n'ont
   *  aucun jour et n'en auront jamais : le leur inventer — celui du roulage,
   *  celui de l'uuid, le 1er janvier — fabriquerait une donnée que personne n'a
   *  donnée. L'écran dit « Sans mois », exactement comme il dit « Sans poste ».
   */
  date_jour: column.text,
  // LE POSTE dit DE QUOI il s'agit ; la cible dit À QUOI c'est rattaché. Les
  // deux sont orthogonaux et AD-7 n'est pas touché : 90 € d'essence sont un
  // poste « essence » ET une cible « saison ». Nullable pour toujours — les
  // dépenses saisies avant cette colonne n'en ont pas, et leur en inventer un
  // fabriquerait une donnée que personne n'a donnée.
  poste: column.text,
})

// ─── RACINE 3 : l'équipement ──────────────────────────────────────────────
// « Dans le garage, il y a toujours une machine mais aussi un espace équipement :
// combi, tente, gants, accessoire, chaise, tout ce qui est nécessaire à une
// journée circuit mais sans être spécifique à une machine. » — Julian.
//
// C'est bien une RACINE et non une feuille de `machine` : la combinaison existe
// sans moto et survit à la vente de la moto. La rattacher obligerait à choisir
// une machine pour déclarer une paire de gants.
//
// ⚠ AUCUN CHAMP D'ÉCHÉANCE, et c'est une clause de sécurité. Un casque a une
// durée de vie, une dorsale a une norme datée — et un compteur à rebours sur du
// matériel de protection fabrique une pression qui produit du report, pas du
// remplacement (FR-48, contre-mesure C1). Le produit consigne un fait, la date
// d'achat, et n'en dérive aucun verdict. Ce qui n'est pas au schéma ne peut pas
// s'afficher par accident.
const equipement = new Table({
  nom: column.text,
  categorie: column.text,
  /** Un MOIS, `AAAA-MM`. Personne ne se souvient du jour où il a acheté ses
   *  gants ; exiger une date exacte transforme dix secondes de saisie en
   *  recherche de facture, donc en saisie qu'on ne fait pas. */
  achete_le: column.text,
  cout_centimes: column.integer,
  note: column.text,
  /** « La combinaison c'est comme un skin, et le casque aussi, c'est à
   *  pixeliser ! » — mêmes deux colonnes que `machine`, et pour les mêmes
   *  raisons : la photo RÉELLE existe indépendamment du sprite, sinon retirer
   *  un portrait laisserait un vide et « le pixel est une présentation, jamais
   *  un remplacement destructif » ne serait vrai que dans le texte. */
  sprite: column.text,
  photo_chemin: column.text,
})

// Ce que le pilote S'ÉTAIT FIXÉ — la seule grandeur du coût qui ne se dérive pas.
// Tant qu'elle est absente, le coût au tour reste caché (FR-24) : un rapport qui
// descend quand on roule plus est une invitation, pas une mesure.
const budget_saison = new Table({
  annee: column.integer,
  montant_centimes: column.integer,
})

// L'ATELIER — épique 8. `etat` porte à lui seul deux exigences que le PRD nomme
// séparément : la pièce achetée non montée (FR-45) et la réparation non vitale
// en attente (FR-48) sont le MÊME OBJET — un acte désiré, pas encore posé — et
// se distinguent par leur catégorie, qui ne les mélange jamais dans une liste
// (FR-46). `date_jour` est nulle tant que l'acte est visé : une intervention
// visée n'a pas de date, c'est ce qui la définit.
const intervention = new Table({
  machine_id: column.text,
  /** Ce que la chute a cassé. Le lien est ICI et non l'inverse : une chute
   *  produit zéro, une ou dix réparations, et chacune reste une intervention
   *  ordinaire — même carnet, même preuve, même horloge. */
  chute_id: column.text,
  categorie: column.text,
  etat: column.text,
  libelle: column.text,
  date_jour: column.text,
  cout_centimes: column.integer,
  depense_id: column.text,
  photo_id: column.text,
})

// FR-54 — « un objet léger, désiré avant d'être réservé ». Il ne touche pas la
// machine : il vise une sortie. Sa pauvreté est le sujet, pas un manque.
const evenement_vise = new Table({
  libelle: column.text,
  date_approx: column.text,
  cout_estime_centimes: column.integer,
})

// ─── Instruments de bord (AD-16, AD-20) ───────────────────────────────────
// Une mesure est une donnée de pilote COMME UNE AUTRE : même base, même file
// d'envoi, même RLS. C'est ce qui interdit le second canal — et ce qui rend la
// mesure juste hors ligne, là où elle se joue précisément.
const mesure = new Table({
  genre: column.text,
  valeur: column.integer,
  jour: column.text,
})

// La PHOTO. ⚠ Seules ses MÉTADONNÉES passent ici. Les octets vont en HTTP direct
// vers le stockage objet, hors synchronisation — copier le motif du sprite
// (data URI dans une colonne texte) mettrait 4 Mo de base64 par photo dans la
// file d'envoi, et une saison de paddock la ferait exploser.
const photo = new Table({
  roulage_id: column.text,
  // Une photo appartient à un roulage, à une machine OU à une intervention. La
  // photo d'une bricole n'a pas de journée : elle a une moto. La facture des
  // plaquettes, elle, a un geste — c'est ce qui en fait une preuve.
  machine_id: column.text,
  intervention_id: column.text,
  /** L'état d'une moto après une chute est une preuve, au même titre qu'une
   *  facture. `set null` côté serveur : retirer une chute ne détruit pas les
   *  photos de la journée. */
  chute_id: column.text,
  geste_id: column.text,
  chemin_objet: column.text,
  largeur: column.integer,
  hauteur: column.integer,
  etat: column.text,
  /** 'photo' | 'facture'. La photo montre un état, la facture prouve une
   *  dépense — les compter ensemble annoncerait « 3 preuves » là où il y a
   *  trois clichés du même disque et aucun justificatif. */
  genre: column.text,
})

// Le GESTE — purement déclaratif. Aucune reconnaissance d'image, jamais (FR-28).
const geste = new Table({
  roulage_id: column.text,
  cap_code: column.text,
  // FR-39bis : faux par défaut, toujours. La présence de pairs augmente la
  // prise de risque en augmentant la sensibilité à la récompense du choix
  // risqué — le danger n'est ni dans le catalogue ni dans le cercle pris
  // seuls, il est dans leur conjonction.
  partage: column.integer,
})

// Le plan si-alors du pilote — la donnée la plus intime du produit, et la seule
// que le code s'interdit formellement de retoucher. MOT POUR MOT : ni reformulé,
// ni corrigé, ni noté. C'est le fait qu'il soit dans SES mots qui le fait
// fonctionner (d ≈ 0,65 sur 94 essais).
const plan_si_alors = new Table({ texte: column.text })

// LE DOCUMENT — le manuel d'atelier en tête, versé PAR LE PILOTE.
// ⚠ Seules ses MÉTADONNÉES passent ici, comme pour la photo : les octets vont
// en HTTP direct vers le stockage, hors synchronisation. Un manuel scanné de
// 20 Mo en base64 dans la file d'envoi la ferait exploser au premier document.
const document_ = new Table({
  machine_id: column.text,
  nom: column.text,
  genre: column.text,
  chemin_objet: column.text,
  octets: column.integer,
  type_mime: column.text,
  /** ⚠ D'OÙ VIENT LE FICHIER quand il n'a pas été versé à la main. Nul pour un
   *  document versé par le pilote, et c'est cette distinction qui doit rester
   *  lisible : un document rapatrié qui ne dirait pas sa provenance serait
   *  indistinguable d'un document qu'on a soi-même choisi.
   *
   *  Ces deux colonnes ont manqué ici pendant une heure alors qu'elles
   *  existaient côté serveur : la requête de lecture les demandait, SQLite ne
   *  les connaissait pas, et TOUTE la liste des documents devenait vide sans le
   *  moindre message. Une colonne ajoutée d'un seul côté est une colonne qui
   *  casse la lecture entière de sa table. */
  source_url: column.text,
  rapatrie_le: column.text,
})

// ─── Référentiel — lu, jamais écrit par la PWA (AD-12) ────────────────────
// Le corpus de conseils y appartient (AD-10) : il s'enrichit sans redéploiement.
const conseil = new Table({ texte: column.text, actif: column.integer })
// Le catalogue de caps. `categorie` est PORTANTE : sans elle, FR-39bis — un cap
// de bravoure ne part jamais tout seul au cercle — ne serait qu'une intention.
const cap = new Table({
  code: column.text, libelle: column.text, categorie: column.text, actif: column.integer,
})
// Le compteur de générations d'image. Table de PILOTE mais EN LECTURE SEULE :
// elle descend par la synchronisation et l'application n'y écrit jamais — elle
// n'est donc pas dans l'ordre d'envoi de `sauvegarde.ts`. Un quota que le
// compté peut écrire ne compte rien, et c'est le serveur qui l'écrit.
const generation = new Table({
  machine_id: column.text,
  version: column.text,
  modele: column.text,
  cout_centimes: column.integer,
  etat: column.text,
  cree_le: column.text,
})

// L'horloge d'usure. Elle porte sa PROVENANCE en colonnes obligatoires, et
// aucun champ qui ressemblerait à un verdict : ce qui n'existe pas dans le
// schéma ne s'affiche pas par accident (FR-44).
const horloge = new Table({
  machine_id: column.text,
  operation: column.text,
  intervalle_roulages: column.integer,
  /** ⚠ LA PÉRIODICITÉ TELLE QUE LE MANUEL L'ÉCRIT — « tous les 6 000 km ou
   *  12 mois ». Du TEXTE, et c'est une décision, pas une facilité : une journée
   *  de piste vaut 200 à 300 km selon le circuit et le groupe, et traduire des
   *  kilomètres en roulages serait une interprétation portant sur la sécurité
   *  d'une machine — ce que FR-44 interdit nommément. `intervalle_roulages`
   *  reste donc nul quand ce champ vient du manuel, et l'horloge compte sans
   *  jamais échoir. */
  barometre: column.text,
  source_url: column.text,
  recolte_le: column.text,
  extrait_par_ia: column.integer,
  depuis_intervention: column.text,
})

// Référentiel : le coefficient part à 1 partout, faute de source. Modifiable
// sans redéploiement (AD-10, NFR-14), et jamais affiché comme une constante.
const coefficient_usure = new Table({ niveau: column.text, coefficient: column.real })

// ÉPIQUE 13 — la checklist de chargement, attachée au roulage comme TRACE.
// Une ligne de conformité porte sa source et sa date ; une ligne de chargement
// n'en a pas et n'a pas à en avoir. Aucune colonne ne dit « conforme » :
// le produit rapporte ce qu'un organisateur a publié, il ne certifie rien.
const checklist_ligne = new Table({
  roulage_id: column.text,
  libelle: column.text,
  categorie: column.text,
  cochee: column.integer,
  source_url: column.text,
  publie_le: column.text,
  // ⚠ QUI l'a publiée, et COMMENT elle a été lue. Les deux se perdaient à la
  // composition — la mention « reconstruite par une machine » disparaissait
  // exactement au moment où elle atteint un humain (QO-6). Dénormalisées : une
  // trace dit ce qui était vrai le jour où elle a été prise.
  publie_par: column.text,
  extrait_par_ia: column.integer,
})

// Référentiel : les règles publiées par les organisateurs, récoltées.
const regle_organisateur = new Table({
  organisateur_id: column.text,
  circuit_id: column.text,
  libelle: column.text,
  source_url: column.text,
  publie_le: column.text,
  recolte_le: column.text,
  extrait_par_ia: column.integer,
})

// Référentiel — lu, jamais écrit par la PWA (AD-12). Ce qu'un circuit sait de
// lui-même : sa longueur, son sens, son plan, ses virages, et ce qu'il faut
// savoir avant d'y aller. Tout champ récolté porte sa source, comme le barème —
// « le virage 3 se prend en aveugle » est une phrase qui engage la sécurité de
// quelqu'un, et une extraction par IA est une reconstruction.
const circuit = new Table({
  nom: column.text,
  pays: column.text,
  longueur_m: column.integer,
  site_web: column.text,
  plan_url: column.text,
  nb_virages: column.integer,
  sens: column.text,
  bon_a_savoir: column.text,
  source_url: column.text,
  recolte_le: column.text,
  extrait_par_ia: column.integer,
})

/** Un virage par ligne, jamais une liste dans une colonne texte : une liste ne
 *  se lit pas, ne se corrige pas, et c'est pourtant un par un qu'on veut les
 *  afficher. */
const virage = new Table({
  circuit_id: column.text,
  numero: column.integer,
  nom: column.text,
  note: column.text,
  source_url: column.text,
  recolte_le: column.text,
  extrait_par_ia: column.integer,
})
const organisateur = new Table({ nom: column.text, site_web: column.text })

// FR-61 : un roulage publié est un BROUILLON. Une sortie annoncée n'est pas un
// roulage vécu — elle ne le devient que confirmée par le pilote.
const roulage_publie = new Table({
  circuit_id: column.text,
  organisateur_id: column.text,
  date_jour: column.text,
  prix_centimes: column.integer,
  nb_groupes: column.integer,
  source_url: column.text,
  recolte_le: column.text,
  extrait_par_ia: column.integer,
})

// Le seul endroit du produit où une erreur touche la sécurité d'une machine :
// d'où source, date de récolte et mention d'extraction automatique en colonnes.
const bareme = new Table({
  marque: column.text,
  modele: column.text,
  annee_debut: column.integer,
  annee_fin: column.integer,
  operation: column.text,
  intervalle_km: column.integer,
  intervalle_mois: column.integer,
  source_url: column.text,
  recolte_le: column.text,
  extrait_par_ia: column.integer,
})

export const AppSchema = new Schema({
  machine,
  roulage,
  session,
  tour,
  depense,
  budget_saison,
  equipement,
  chute,
  intervention,
  mesure,
  evenement_vise,
  horloge,
  checklist_ligne,
  photo,
  geste,
  plan_si_alors,
  document: document_,
  generation,
  coefficient_usure,
  regle_organisateur,
  conseil,
  cap,
  circuit,
  virage,
  organisateur,
  roulage_publie,
  bareme,
})

export type Database = (typeof AppSchema)['types']

/**
 * CE QUI DESCEND SANS JAMAIS REMONTER — AD-12.
 *
 * Le référentiel est lu, jamais écrit par le pilote : circuits, conseils, caps,
 * barèmes, règles d'organisateur. `generation` est du même bord pour une autre
 * raison — c'est un REGISTRE que seul le serveur écrit ; un compteur que le
 * compté peut écrire ne compte rien.
 *
 * Cette liste n'est pas décorative. Le complément (tout le schéma moins ceci)
 * est exactement ce que la sauvegarde doit envoyer, et un essai unitaire le
 * confronte à `ORDRE`. Une table de pilote ajoutée ici et oubliée là-bas ne
 * partirait jamais — un pilote la verrait sur son téléphone, et nulle part
 * ailleurs, sans qu'aucun message ne le prévienne.
 */
export const REFERENTIEL: ReadonlySet<string> = new Set([
  'generation', 'coefficient_usure', 'regle_organisateur', 'conseil', 'cap',
  'circuit', 'virage', 'organisateur', 'roulage_publie', 'bareme',
])
