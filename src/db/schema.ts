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
const machine = new Table({
  pilote_id: column.text,
  marque: column.text,
  modele: column.text,
  annee: column.integer,
  // Portrait pixel détouré, PNG en data URI. Nullable : une machine sans sprite est un état
  // valide (AD-2) et le garage affiche alors sa silhouette — il n'exige jamais une photo pour
  // fonctionner. Produit une seule fois puis CONSERVÉ : c'est le seul champ du produit dont le
  // calcul coûte de l'argent.
  sprite: column.text,
})

// ─── RACINE 2 : le roulage ────────────────────────────────────────────────
// AD-2 : `machine_id` est NULLABLE — un roulage sans machine est un état valide.
// C'est l'invariant qui rend l'axe atelier atteignable sans migration.
const roulage = new Table({
  pilote_id: column.text,
  machine_id: column.text,
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
  pilote_id: column.text,
  cible: column.text,
  roulage_id: column.text,
  machine_id: column.text,
  saison_annee: column.integer,
  montant_centimes: column.integer,
  libelle: column.text,
})

const intervention = new Table({
  machine_id: column.text,
  categorie: column.text,
  libelle: column.text,
  date_jour: column.text,
  cout_centimes: column.integer,
})

// ─── Référentiel — lu, jamais écrit par la PWA (AD-12) ────────────────────
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
  intervention,
  circuit,
  organisateur,
  roulage_publie,
  bareme,
})

export type Database = (typeof AppSchema)['types']
