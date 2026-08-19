-- ═══════════════════════════════════════════════════════════════════════════
-- LA PHOTO ET LE GESTE — épique 3.
--
-- ⚠ LEVÉE D'AMBIGUÏTÉ, à écrire noir sur blanc parce qu'elle a failli coûter
-- toute cette couche : NFR-5 interdit « les Storage Buckets ». Le motif cité —
-- « absent de tous les Safari » — ne peut viser qu'une API DE NAVIGATEUR, donc
-- `navigator.storageBuckets`. Il ne vise PAS Supabase Storage, que l'épine
-- d'architecture nomme trois fois comme le lieu de vie des photos. Le stockage
-- objet est autorisé et prévu.
--
-- DEUX CHEMINS D'ÉCRITURE, assumés et distincts (Consistency Conventions) :
--   · la LIGNE `photo` part en SQLite local puis PowerSync, comme tout le reste
--   · les OCTETS partent en HTTP direct vers le stockage, hors synchronisation
-- Ils sont désynchronisables par nature : la ligne peut exister sans que
-- l'objet soit monté. C'est ce que porte `etat`, et c'est pour ça qu'aucune
-- photo ne peut être « en attente » à l'écran : elle s'affiche depuis sa copie
-- locale, montée ou non (FR-10, NFR-7).
-- ═══════════════════════════════════════════════════════════════════════════

create type etat_photo as enum ('locale', 'montee');

create table photo (
  id            uuid primary key,                -- UUID v7 client (AD-14)
  pilote_id     uuid not null references pilote(id) on delete cascade,
  roulage_id    uuid not null references roulage(id) on delete cascade,
  -- FR-29 : le lien geste ↔ photo est facultatif DANS LES DEUX SENS. Un geste
  -- se déclare sans photo, une photo se verse sans geste.
  geste_id      uuid,
  -- Dérivé de l'UUID v7, donc connu AVANT tout réseau : le téléversement
  -- différé est idempotent et rejouable sans risque de doublon (AD-14).
  chemin_objet  text not null,
  largeur       integer,
  hauteur       integer,
  etat          etat_photo not null default 'locale',
  cree_le       timestamptz not null default now()
);

create index on photo (pilote_id);
create index on photo (roulage_id);

-- ─── Le geste, purement déclaratif ────────────────────────────────────────
-- FR-28 : AUCUNE reconnaissance automatique d'image. Jamais. C'est une
-- exclusion permanente, pas un report : la photo n'est jamais lue par une
-- machine pour en déduire un fait.
create table geste (
  id          uuid primary key,                  -- UUID v7 client (AD-14)
  pilote_id   uuid not null references pilote(id) on delete cascade,
  roulage_id  uuid not null references roulage(id) on delete cascade,
  -- Le code du cap dans le catalogue. Un CODE et non une clé étrangère : le
  -- catalogue vit en base ET en repli embarqué (AD-10), donc un geste déclaré
  -- hors ligne ne peut pas dépendre d'une ligne qui n'est pas encore descendue.
  cap_code    text not null,
  cree_le     timestamptz not null default now()
);

create index on geste (pilote_id);
create index on geste (roulage_id);

alter table photo add constraint photo_geste_fk
  foreign key (geste_id) references geste(id) on delete set null;

-- ─── Le catalogue de caps — référentiel (AD-10) ───────────────────────────
create table cap (
  code       text primary key,
  libelle    text not null,
  -- 'bravoure' contre 'discipline', et la distinction est PORTANTE : FR-39bis
  -- interdit qu'un cap de bravoure parte automatiquement au cercle. Sans cette
  -- colonne, la règle ne serait qu'une intention.
  categorie  text not null check (categorie in ('bravoure', 'discipline')),
  -- AD-10 : la condition est une DONNÉE évaluée contre ce qui est déjà saisi,
  -- jamais du code compilé. Un cap s'ajoute sans redéploiement.
  -- FR-31 : aucune condition ne peut porter une série, une durée limitée, une
  -- remise à zéro ni un état qui redescend — et aucun écran n'affiche ce qui
  -- reste à faire pour l'obtenir. Un cap SE CONSTATE.
  condition  jsonb not null default '{}'::jsonb,
  actif      boolean not null default true,
  cree_le    timestamptz not null default now()
);

comment on table cap is
  'Catalogue des caps (AD-10, FR-30). La condition est une donnée évaluée, jamais compilée. Le produit ÉNONCE le fait — « genou gauche posé » — et ne décerne rien : ni badge, ni médaille, ni étoile, ni points.';

alter table cap enable row level security;
create policy "cap lisible par tous" on cap for select using (true);
grant select, insert, update on cap to recolte;

alter table photo enable row level security;
alter table geste enable row level security;

create policy "photo du pilote" on photo
  for all using (pilote_id = (select auth.uid())) with check (pilote_id = (select auth.uid()));
create policy "geste du pilote" on geste
  for all using (pilote_id = (select auth.uid())) with check (pilote_id = (select auth.uid()));

revoke all on photo, geste from recolte;

alter publication powersync add table photo;
alter publication powersync add table geste;
alter publication powersync add table cap;

-- Le catalogue de départ. Aucun n'est à série ni à durée : ce sont des FAITS
-- qui se constatent une fois et ne redescendent jamais.
insert into cap (code, libelle, categorie) values
  ('genou_gauche',   'Genou gauche posé',            'bravoure'),
  ('genou_droit',    'Genou droit posé',             'bravoure'),
  ('coude_gauche',   'Coude gauche posé',            'bravoure'),
  ('coude_droit',    'Coude droit posé',             'bravoure'),
  ('premier_circuit', 'Premier roulage sur ce circuit', 'discipline'),
  ('nuit',           'Roulage de nuit',              'discipline'),
  ('pluie',          'Roulage sous la pluie',        'discipline');
