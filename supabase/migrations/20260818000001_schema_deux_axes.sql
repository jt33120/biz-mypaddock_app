-- ═══════════════════════════════════════════════════════════════════════════
-- Récit 1.1 — Le schéma et ses invariants.  Le premier récit de tous.
--
-- La seule décision dont le coût explose si elle est différée : si la machine
-- devient une propriété du roulage, l'axe atelier devient inatteignable et se
-- paie en migration.  Tout ce fichier sert AD-2, AD-3, AD-7, AD-8, AD-12,
-- AD-14, AD-17, AD-18.
--
-- CONVENTIONS SANS EXCEPTION :
--   · argent  = entier de CENTIMES.       Jamais de flottant sur de la monnaie.
--   · chrono  = entier de MILLISECONDES.  Jamais de flottant sur un temps.
--   · clés    = UUID v7 fournis PAR LE CLIENT (AD-14). Aucun DEFAULT sur une
--               entité que le pilote peut créer hors ligne : au paddock il n'y
--               a pas de réseau, donc pas de serveur pour attribuer un id.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Énumérations ──────────────────────────────────────────────────────────

-- AD-3 : le téléphone n'est JAMAIS le capteur. Le pilote ne l'a pas sur lui en
-- piste — il est resté au camion. Il n'y a pas de provenance GPS, et il n'y en
-- aura pas. Ajouter 'gps' ici serait une régression de sécurité, pas une
-- fonctionnalité.
create type provenance_chrono as enum (
  'saisie_manuelle',            -- palier 1, la base permanente et non une béquille
  'chronometre_embarque',       -- palier 2, import depuis un appareil dédié
  'transpondeur_organisateur'   -- palier 2, import depuis le chronométrage officiel
);

-- AD-9 : le Niveau est la seule entrée stable du coefficient d'usure, parce que
-- les groupes varient d'un organisateur à l'autre (Pau-Arnos annonce 2 à 4
-- groupes nommés Initiation/Intermédiaire/Confirmé/Expert, pas Blanc/Jaune/Rouge).
-- FR-6bis : le niveau SE CONSTATE, IL NE SE VISE PAS. C'est une clause de
-- sécurité — aucune vue ne doit exposer ce qui reste à faire pour y accéder.
create type niveau_mypaddock as enum ('debutant', 'intermediaire', 'confirme', 'racer');

-- AD-7 : trois cibles, exclusives et obligatoires.
create type cible_depense as enum ('roulage', 'machine', 'saison');

create type categorie_intervention as enum ('entretien', 'amelioration', 'reparation_non_vitale');

-- ═══════════════════════════════════════════════════════════════════════════
-- RÉFÉRENTIEL — écrit par la récolte, lu par tous (AD-12)
-- Seules tables à porter un DEFAULT sur l'id : aucun pilote ne les crée hors ligne.
-- ═══════════════════════════════════════════════════════════════════════════

create table circuit (
  id            uuid primary key default gen_random_uuid(),
  nom           text not null,
  pays          text not null default 'FR',
  longueur_m    integer,
  cree_le       timestamptz not null default now()
);

create table organisateur (
  id            uuid primary key default gen_random_uuid(),
  nom           text not null,
  site_web      text,
  cree_le       timestamptz not null default now()
);

-- Roulages publiés, récoltés sur les sites d'organisateurs et les agrégateurs.
-- Ce sont des BROUILLONS au sens de FR-61 : une sortie annoncée n'est pas un
-- roulage vécu, et ne le devient que confirmée par le pilote.
create table roulage_publie (
  id                uuid primary key default gen_random_uuid(),
  circuit_id        uuid not null references circuit(id),
  organisateur_id   uuid references organisateur(id),
  date_jour         date not null,
  prix_centimes     integer check (prix_centimes >= 0),
  nb_groupes        smallint,
  -- FR-61 + AD-11 : toute donnée récoltée porte sa provenance. Une extraction
  -- par IA n'est pas une transcription, c'est une reconstruction.
  source_url        text not null,
  recolte_le        timestamptz not null default now(),
  extrait_par_ia    boolean not null default true,
  cree_le           timestamptz not null default now()
);

-- Barème constructeur. C'est LE SEUL ENDROIT du produit où une erreur touche la
-- sécurité d'une machine — d'où les trois garde-fous en colonnes obligatoires.
create table bareme (
  id                uuid primary key default gen_random_uuid(),
  marque            text not null,
  modele            text not null,
  annee_debut       smallint,
  annee_fin         smallint,
  operation         text not null,
  intervalle_km     integer check (intervalle_km > 0),
  intervalle_mois   integer check (intervalle_mois > 0),
  source_url        text not null,
  recolte_le        timestamptz not null default now(),
  extrait_par_ia    boolean not null default true,
  cree_le           timestamptz not null default now(),
  -- Un barème qui ne dit ni km ni mois ne dit rien.
  constraint bareme_a_un_intervalle check (intervalle_km is not null or intervalle_mois is not null)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- DONNÉES DE PILOTE — protégées par RLS, jamais écrites par la récolte (AD-12)
-- ═══════════════════════════════════════════════════════════════════════════

create table pilote (
  id            uuid primary key references auth.users(id) on delete cascade,
  affichage     text,
  cree_le       timestamptz not null default now()
);

-- ─── RACINE 1 : LA MACHINE ────────────────────────────────────────────────
-- AD-2 : une machine SANS AUCUN ROULAGE est un état valide et testé.
-- C'est ce qui rend l'axe atelier atteignable en décembre sans migration.
create table machine (
  id            uuid primary key,                -- UUID v7 client (AD-14), pas de DEFAULT
  pilote_id     uuid not null references pilote(id) on delete cascade,
  marque        text not null,
  modele        text not null,
  annee         smallint,
  cree_le       timestamptz not null default now(),
  modifie_le    timestamptz not null default now()
);

-- ─── RACINE 2 : LE ROULAGE ────────────────────────────────────────────────
-- AD-2 : un roulage SANS MACHINE est un état valide et testé. La référence est
-- donc NULLABLE, et c'est l'invariant central de tout le schéma.
create table roulage (
  id                uuid primary key,            -- UUID v7 client (AD-14)
  pilote_id         uuid not null references pilote(id) on delete cascade,
  machine_id        uuid references machine(id) on delete set null,   -- NULLABLE : AD-2
  circuit_id        uuid references circuit(id),
  organisateur_id   uuid references organisateur(id),
  date_jour         date not null,
  -- Le groupe se saisit sur L'ÉCHELLE DE SON ORGANISATEUR, en nom comme en rang.
  -- Seul le rang est comparable d'une sortie à l'autre.
  groupe_nom        text,
  groupe_rang       smallint check (groupe_rang >= 1),
  groupe_total      smallint check (groupe_total >= 1),
  niveau            niveau_mypaddock,            -- projection stable (AD-9)
  cree_le           timestamptz not null default now(),
  modifie_le        timestamptz not null default now(),
  constraint groupe_rang_coherent check (groupe_rang is null or groupe_total is null or groupe_rang <= groupe_total)
);

-- ─── SESSION ET TOURS ─────────────────────────────────────────────────────
-- AD-3 : une session porte une COLLECTION de tours, même quand la v1 n'en écrit
-- qu'un seul. Modéliser « un meilleur tour par roulage » en dur obligerait à
-- réécrire le modèle au premier import de chronomètre embarqué.
create table session (
  id            uuid primary key,                -- UUID v7 client (AD-14)
  roulage_id    uuid not null references roulage(id) on delete cascade,
  ordre         smallint not null check (ordre >= 1),
  duree_ms      integer check (duree_ms > 0),
  cree_le       timestamptz not null default now(),
  unique (roulage_id, ordre)
);

create table tour (
  id            uuid primary key,                -- UUID v7 client (AD-14)
  session_id    uuid not null references session(id) on delete cascade,
  temps_ms      integer not null check (temps_ms > 0),   -- millisecondes ENTIÈRES
  provenance    provenance_chrono not null,              -- AD-3 : aucune valeur GPS n'existe
  cree_le       timestamptz not null default now()
);

-- ─── DÉPENSE ──────────────────────────────────────────────────────────────
-- AD-7 : trois cibles de premier rang, exclusives et obligatoires. Indexer le
-- coût sur le seul roulage ferait échapper la moitié du budget réel, et rendrait
-- inapplicable la clause « le coût au tour ne s'affiche jamais seul ».
-- AD-18 : saison_annee est un ENTIER, pas une référence — la saison est une vue
-- dérivée (AD-8) et n'a aucune ligne à référencer.
create table depense (
  id                uuid primary key,            -- UUID v7 client (AD-14)
  pilote_id         uuid not null references pilote(id) on delete cascade,
  cible             cible_depense not null,
  roulage_id        uuid references roulage(id) on delete cascade,
  machine_id        uuid references machine(id) on delete cascade,
  saison_annee      integer not null check (saison_annee between 2000 and 2100),
  montant_centimes  integer not null check (montant_centimes >= 0),   -- centimes ENTIERS
  libelle           text,
  cree_le           timestamptz not null default now(),
  modifie_le        timestamptz not null default now(),
  -- La cible est exclusive : exactement une colonne renseignée, ou aucune pour
  -- une dépense de saison. AD-17 en dépend — le coût d'une machine est
  -- EXCLUSIVEMENT la somme des dépenses qui la désignent, et rien d'autre.
  constraint depense_cible_exclusive check (
    (cible = 'roulage' and roulage_id is not null and machine_id is null) or
    (cible = 'machine' and machine_id is not null and roulage_id is null) or
    (cible = 'saison'  and roulage_id is null     and machine_id is null)
  )
);

-- ─── INTERVENTION ─────────────────────────────────────────────────────────
-- Le carnet est AUTO-DÉCLARÉ : il atteste ce que le propriétaire a consigné,
-- jamais un historique certifié. Ne jamais le présenter comme une attestation
-- tierce (FR-38).
create table intervention (
  id            uuid primary key,                -- UUID v7 client (AD-14)
  machine_id    uuid not null references machine(id) on delete cascade,
  categorie     categorie_intervention not null,
  libelle       text not null,
  date_jour     date not null,
  cout_centimes integer check (cout_centimes >= 0),
  cree_le       timestamptz not null default now(),
  modifie_le    timestamptz not null default now()
);

-- ─── Index ────────────────────────────────────────────────────────────────
create index on machine (pilote_id);
create index on roulage (pilote_id, date_jour desc);
create index on roulage (machine_id);
create index on session (roulage_id);
create index on tour (session_id);
create index on depense (pilote_id, saison_annee);
create index on depense (machine_id) where machine_id is not null;
create index on depense (roulage_id) where roulage_id is not null;
create index on intervention (machine_id, date_jour desc);
create index on roulage_publie (circuit_id, date_jour);
create index on bareme (marque, modele);
