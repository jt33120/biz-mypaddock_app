-- ═══════════════════════════════════════════════════════════════════════════
-- LES INSTRUMENTS DE BORD — récit 7.1.
--
-- Sans eux, l'échec du produit ne se constate qu'en octobre 2027, quand la
-- saison est finie et qu'il n'y a plus rien à corriger.
--
-- AD-20 : un événement d'instrument est UNE DONNÉE DE PILOTE COMME UNE AUTRE.
-- Écrit en local d'abord, synchronisé ensuite, protégé par RLS. Il n'existe
-- aucun appel réseau dédié à la mesure, aucun SDK d'analytique, aucun point de
-- terminaison de télémétrie — d'où cette table, et rien d'autre.
--
-- AD-16 : EXACTEMENT TROIS mesures, et le genre est une énumération fermée par
-- le moteur. Ajouter une quatrième valeur ici sera un acte délibéré, pas une
-- dérive : c'est ainsi qu'on empêche une table de mesure de devenir un mouchard.
--
-- ⚠ ET UNE MESURE N'EST PAS DANS CETTE TABLE — la plus importante, le délai
-- entre le roulage et sa saisie. Elle ne s'écrit pas : elle se DÉDUIT. L'id du
-- roulage est un UUID v7 (AD-14), dont les 48 premiers bits portent la
-- milliseconde d'écriture ; `date_jour` porte le jour vécu. Le délai est la
-- différence. Rien à consigner, donc rien qui puisse diverger de la réalité, et
-- une mesure de moins à demander au pilote d'accepter.
-- ═══════════════════════════════════════════════════════════════════════════

create type genre_mesure as enum (
  'ouverture',      -- une ouverture de l'application (FR-59)
  'recap_genere',   -- un récapitulatif produit  (FR-58)
  'recap_poste'     -- un récapitulatif réellement partagé — l'autre moitié de FR-58
);

create table mesure (
  id          uuid primary key,                  -- UUID v7 client (AD-14)
  pilote_id   uuid not null references pilote(id) on delete cascade,
  genre       genre_mesure not null,
  -- Pour une ouverture : 1 si elle a produit une saisie, 0 sinon. FR-59 insiste,
  -- et ce n'est pas une nuance de style : une ouverture sans saisie N'EST PAS UN
  -- ÉCHEC, c'est exactement ce que l'accueil temporel cherche à provoquer.
  valeur      smallint not null default 0,
  jour        date not null,
  cree_le     timestamptz not null default now()
);

create index on mesure (pilote_id, jour);

alter table mesure enable row level security;

create policy "mesure du pilote" on mesure
  for all using (pilote_id = (select auth.uid())) with check (pilote_id = (select auth.uid()));

revoke all on mesure from recolte;

alter publication powersync add table mesure;
