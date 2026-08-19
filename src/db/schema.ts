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
  // Une photo appartient à un roulage OU à une machine. La photo d'une
  // réparation non vitale n'a pas de journée : elle a une moto.
  machine_id: column.text,
  geste_id: column.text,
  chemin_objet: column.text,
  largeur: column.integer,
  hauteur: column.integer,
  etat: column.text,
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

const circuit = new Table({ nom: column.text, pays: column.text, longueur_m: column.integer })
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
  intervention,
  mesure,
  evenement_vise,
  horloge,
  checklist_ligne,
  photo,
  geste,
  plan_si_alors,
  generation,
  coefficient_usure,
  regle_organisateur,
  conseil,
  cap,
  circuit,
  organisateur,
  roulage_publie,
  bareme,
})

export type Database = (typeof AppSchema)['types']
