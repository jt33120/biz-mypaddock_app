-- ═══════════════════════════════════════════════════════════════════════════
-- LA MOTO HIBERNE, ET SON CHANTIER S'OUVRE — retour de Julian du 16 sept. 2026.
--
--   « Je viens de finir la dernière journée de la saison. J'aimerais rajouter
--     un statut sur les motos : ready, en réparation et hivernation. La mienne
--     passe donc en hivernation, avec une liste d'actions à mener et ordonnées,
--     et une liste de choses à acheter avec le prix pour estimer le coût. »
--
-- Trois objets, et un seul d'entre eux touche une table existante.
--
-- ① `machine.statut` — ce que le PILOTE DÉCLARE de sa moto. Ce n'est pas un
--   verdict du produit sur son état : « prête » veut dire « je la déclare
--   prête », exactement comme un roulage saisi à la main naît en usage.
--   « Hivernation » est devenu HIVERNAGE : c'est le mot du garage, l'autre est
--   celui des marmottes.
--
-- ② `chantier` + `chantier_etape` — un ORDRE DE TRAVAIL. Il s'ouvre quand la
--   moto entre en hivernage ou en réparation, et se clôt quand elle redevient
--   prête. Ses étapes sont ordonnées parce que l'ordre est le sujet : la
--   vidange se fait moteur chaud, donc après avoir fait tourner le stabilisateur,
--   et la batterie en dernier, quand plus rien n'a besoin de démarrer.
--
--   ⚠ FR-46 EST TENU PAR LE CARNET, PAS CONTOURNÉ PAR LE CHANTIER. Une étape
--   porte sa catégorie d'atelier, et la cocher CONSIGNE une intervention dans
--   SA catégorie — plaquettes à l'entretien, peinture aux bricoles. Le carnet
--   ne mélange donc toujours rien. Le chantier, lui, est une SÉQUENCE : tout ce
--   qu'il contient se fait cet hiver, et rien n'y hérite du caractère
--   repoussable d'une liste d'attente — il n'en est pas une.
--
-- ③ `achat` — la liste de courses, au prix ESTIMÉ. Comme `evenement_vise`, ce
--   coût ne se présente jamais comme un fait et n'entre dans aucun budget : il
--   ne devient une dépense que le jour où le pilote dit « acheté », et c'est
--   alors une vraie ligne de `depense`, avec son jour et son poste.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── ① LE STATUT DE LA MACHINE ─────────────────────────────────────────────
-- ⚠ `add column … default` NE RÉÉCRIT AUCUNE LIGNE ET N'ÉMET RIEN dans le flux
-- logique : une machine déjà synchronisée garde un statut nul en local tant que
-- sa ligne ne change pas. Tout lecteur passe donc par `coalesce(statut,'prete')`.
alter table machine add column if not exists statut text not null default 'prete';
alter table machine drop constraint if exists machine_statut_connu;
alter table machine add constraint machine_statut_connu
  check (statut in ('prete', 'en_reparation', 'hivernage'));

-- Le JOUR où le pilote l'a déclaré. Nul pour les machines d'avant : personne ne
-- sait depuis quand elles sont prêtes, et le leur inventer serait faux.
alter table machine add column if not exists statut_depuis date;

comment on column machine.statut is
  'Ce que le pilote déclare de sa moto : prete, en_reparation ou hivernage. '
  'Une déclaration, jamais un verdict du produit sur son état.';

-- ─── ② LE CHANTIER ─────────────────────────────────────────────────────────
create table if not exists chantier (
  id            uuid primary key,
  pilote_id     uuid not null references pilote(id) on delete cascade,
  machine_id    uuid not null references machine(id) on delete cascade,
  genre         text not null,
  libelle       text not null,
  ouvert_le     date not null,
  clos_le       date,
  cree_le       timestamptz not null default now(),
  modifie_le    timestamptz not null default now(),
  constraint chantier_genre_connu check (genre in ('hivernage', 'reparation')),
  constraint chantier_libelle_non_vide check (length(btrim(libelle)) > 0),
  constraint chantier_clos_apres_ouverture check (clos_le is null or clos_le >= ouvert_le)
);

-- ⚠ AUCUN INDEX UNIQUE « un seul chantier ouvert par machine ». Deux téléphones
-- hors ligne peuvent en ouvrir un chacun ; le second serait refusé en 23505,
-- écarté pour de bon — et ses étapes, qui le référencent, rejouées en 23503
-- pour toujours, bloquant la file d'envoi entière. L'application lit le plus
-- récent, et c'est suffisant.

comment on table chantier is
  'Un ordre de travail sur une machine : hivernage ou réparation. S''ouvre avec '
  'le statut, se clôt quand la moto redevient prête. Ses étapes sont ordonnées.';

create table if not exists chantier_etape (
  id               uuid primary key,
  pilote_id        uuid not null references pilote(id) on delete cascade,
  chantier_id      uuid not null references chantier(id) on delete cascade,
  ordre            integer not null,
  libelle          text not null,
  categorie        categorie_intervention not null,
  note             text,
  faite_le         date,
  intervention_id  uuid references intervention(id) on delete set null,
  horloge_id       uuid references horloge(id) on delete set null,
  cree_le          timestamptz not null default now(),
  modifie_le       timestamptz not null default now(),
  constraint chantier_etape_ordre_positif check (ordre >= 1),
  constraint chantier_etape_libelle_non_vide check (length(btrim(libelle)) > 0)
);

-- ⚠ PAS D'UNIQUE (chantier_id, ordre) NON PLUS. Monter une étape échange deux
-- rangs en deux écritures ; entre les deux, l'unicité serait violée, et le
-- connecteur écarte un 23505 définitivement. Le rang est un ORDRE DE TRI, pas
-- une identité — deux ex æquo se départagent par l'id.

comment on column chantier_etape.intervention_id is
  'L''intervention consignée quand l''étape a été faite. C''est elle qui porte '
  'le geste au carnet, dans SA catégorie (FR-46).';
comment on column chantier_etape.horloge_id is
  'L''horloge d''usure que le geste fait repartir, désignée et non devinée.';

-- ─── ③ LES ACHATS ──────────────────────────────────────────────────────────
create table if not exists achat (
  id             uuid primary key,
  pilote_id      uuid not null references pilote(id) on delete cascade,
  chantier_id    uuid references chantier(id) on delete set null,
  etape_id       uuid references chantier_etape(id) on delete set null,
  -- NUL = pour le garage (une tente, des couvertures chauffantes) : ce qui
  -- n'appartient à aucune moto, exactement comme l'équipement.
  machine_id     uuid references machine(id) on delete cascade,
  libelle        text not null,
  quantite       integer not null,
  prix_centimes  integer,
  url            text,
  note           text,
  achete_le      date,
  depense_id     uuid references depense(id) on delete set null,
  cree_le        timestamptz not null default now(),
  modifie_le     timestamptz not null default now(),
  constraint achat_libelle_non_vide check (length(btrim(libelle)) > 0),
  constraint achat_quantite_positive check (quantite >= 1),
  constraint achat_prix_positif check (prix_centimes is null or prix_centimes >= 0),
  constraint achat_url_https check (url is null or url ~ '^https://')
);

comment on column achat.prix_centimes is
  'Prix UNITAIRE ESTIMÉ, saisi par le pilote. Ne se présente jamais comme un fait '
  'et n''entre dans aucun budget : seul « acheté » écrit une dépense.';
comment on column achat.depense_id is
  'La dépense écrite le jour de l''achat. Le montant réel est le sien.';

-- ─── INDEX — chaque table de pilote est lue sous RLS, chaque clé est suivie ─
create index if not exists chantier_pilote_id_idx on chantier (pilote_id);
create index if not exists chantier_par_machine on chantier (machine_id);
create index if not exists chantier_etape_pilote_id_idx on chantier_etape (pilote_id);
create index if not exists chantier_etape_par_chantier on chantier_etape (chantier_id, ordre);
create index if not exists chantier_etape_par_intervention on chantier_etape (intervention_id)
  where intervention_id is not null;
create index if not exists chantier_etape_par_horloge on chantier_etape (horloge_id)
  where horloge_id is not null;
create index if not exists achat_pilote_id_idx on achat (pilote_id);
create index if not exists achat_par_chantier on achat (chantier_id) where chantier_id is not null;
create index if not exists achat_par_etape on achat (etape_id) where etape_id is not null;
create index if not exists achat_par_machine on achat (machine_id) where machine_id is not null;
create index if not exists achat_par_depense on achat (depense_id) where depense_id is not null;

-- ─── RLS — le pilote, et l'ascendance là où elle est obligatoire ───────────
-- Le style de `intervention` (20260819000003) : une ligne ne peut désigner que
-- la machine, ou le chantier, de son propre pilote.
alter table chantier enable row level security;
alter table chantier_etape enable row level security;
alter table achat enable row level security;

drop policy if exists "chantier du pilote" on chantier;
create policy "chantier du pilote" on chantier for all
  using (
    pilote_id = (select auth.uid())
    and exists (select 1 from machine m
                 where m.id = chantier.machine_id and m.pilote_id = chantier.pilote_id))
  with check (
    pilote_id = (select auth.uid())
    and exists (select 1 from machine m
                 where m.id = chantier.machine_id and m.pilote_id = chantier.pilote_id));

drop policy if exists "etape de chantier du pilote" on chantier_etape;
create policy "etape de chantier du pilote" on chantier_etape for all
  using (
    pilote_id = (select auth.uid())
    and exists (select 1 from chantier c
                 where c.id = chantier_etape.chantier_id and c.pilote_id = chantier_etape.pilote_id))
  with check (
    pilote_id = (select auth.uid())
    and exists (select 1 from chantier c
                 where c.id = chantier_etape.chantier_id and c.pilote_id = chantier_etape.pilote_id));

drop policy if exists "achat du pilote" on achat;
create policy "achat du pilote" on achat for all
  using (pilote_id = (select auth.uid()))
  with check (
    pilote_id = (select auth.uid())
    and (machine_id is null or exists (select 1 from machine m
          where m.id = achat.machine_id and m.pilote_id = achat.pilote_id))
    and (chantier_id is null or exists (select 1 from chantier c
          where c.id = achat.chantier_id and c.pilote_id = achat.pilote_id)));

-- ─── LA PUBLICATION ────────────────────────────────────────────────────────
-- Une table absente de la publication ne produit aucun changement dans le flux
-- logique : elle resterait vide sur le second appareil, sans la moindre erreur.
-- La liste de reprise du 26 août est figée par un essai : on publie ici.
do $$
declare
  nom_table text;
begin
  foreach nom_table in array array['chantier', 'chantier_etape', 'achat']
  loop
    if to_regclass(format('public.%I', nom_table)) is not null
       and not exists (
         select 1
           from pg_publication_tables
          where pubname = 'powersync'
            and schemaname = 'public'
            and tablename = nom_table
       ) then
      execute format('alter publication powersync add table public.%I', nom_table);
    end if;
  end loop;
end
$$;
