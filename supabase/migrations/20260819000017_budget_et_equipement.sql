-- ═══════════════════════════════════════════════════════════════════════════
-- LE BUDGET PAR POSTE, ET L'ÉQUIPEMENT — retours de Julian du 19 août 2026.
--
-- Deux demandes distinctes qui tiennent dans une seule migration parce qu'elles
-- répondent à la même question : « qu'est-ce qui coûte, dans une saison, qui
-- n'est pas la moto ? »
--
--   « ajouter parmi ces trois modules un aspect budget où on ajoute le budget
--     course entretien maintenance essence assurance etc, louage remorque »
--
--   « dans le garage, il y a toujours une machine mais aussi un espace
--     équipement : combi, tente, gants, accessoire, chaise, etc, tout ce qui est
--     nécessaire à une journée circuit mais sans être spécifique à une machine »
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── ① LE POSTE ────────────────────────────────────────────────────────────
-- AD-7 n'est PAS touché : les trois cibles restent roulage / machine / saison,
-- exclusives et obligatoires. Le poste est une seconde dimension, orthogonale —
-- il dit DE QUOI il s'agit, là où la cible dit À QUOI c'est rattaché. Les mêmes
-- 90 € d'essence sont un poste « essence » et une cible « saison » ; les mêmes
-- 240 € de pneus sont un poste « pneus » et une cible « machine ».
--
-- Il est NULLABLE et le restera : toutes les dépenses déjà saisies n'en ont pas,
-- et les rebaptiser d'office inventerait une information que personne n'a
-- donnée. Une dépense sans poste est une dépense, pas une dépense incomplète.
alter table depense add column if not exists poste text;

alter table depense drop constraint if exists depense_poste_connu;
alter table depense add constraint depense_poste_connu
  check (poste is null or poste in (
    'engagement', 'entretien', 'pneus', 'essence', 'assurance',
    'transport', 'equipement', 'autre'));

comment on column depense.poste is
  'De QUOI il s''agit — orthogonal à `cible`, qui dit à quoi c''est rattaché. '
  'Nullable : une dépense saisie avant cette colonne n''a pas de poste, et lui '
  'en inventer un serait fabriquer une donnée que le pilote n''a pas donnée.';

-- ─── ② L'ÉQUIPEMENT ────────────────────────────────────────────────────────
-- Une troisième racine, et c'est assumé. AD-2 fixe DEUX axes indépendants — le
-- roulage et la machine — parce que l'un ne conditionne pas l'autre. L'équipement
-- est exactement dans le même cas : la combinaison existe sans moto et survit à
-- la vente de la moto. La rattacher à `machine` obligerait à choisir une moto
-- pour déclarer une paire de gants, et à tout redéclarer au changement de moto.
--
-- ⚠ AUCUNE COLONNE D'ÉCHÉANCE, ET C'EST UNE CLAUSE DE SÉCURITÉ, pas un oubli.
-- La tentation est forte sur du matériel de protection : un casque a une durée
-- de vie, une dorsale a une norme datée. Mais un compteur à rebours sur un
-- équipement de sécurité est précisément la mécanique que le produit s'interdit
-- (FR-48, contre-mesure C1) : il fabrique une pression, et une pression sur un
-- achat coûteux produit du report, pas du remplacement. Le produit consigne donc
-- une DATE D'ACHAT — un fait — et n'en dérive aucun verdict. Ce qui n'existe pas
-- dans le schéma ne s'affiche pas par accident.
create table if not exists equipement (
  id uuid primary key,
  -- ⚠ `pilote_id`, PAS `proprietaire`, ET VERS `pilote` PAS VERS `auth.users`.
  -- La première écriture de cette migration s'était trompée sur les deux, et
  -- l'erreur était silencieuse : toute la chaîne d'envoi appose `pilote_id`
  -- (`PORTE_PROPRIETAIRE`, le connecteur, les quatorze requêtes de flux). Une
  -- colonne nommée autrement serait partie nulle sur un `not null` — ligne
  -- refusée, file d'envoi bloquée derrière elle. Trois fois le même incident.
  pilote_id uuid not null references pilote(id) on delete cascade,
  nom text not null,
  categorie text not null,
  -- Le mois suffit, et c'est délibéré : personne ne se souvient du jour où il a
  -- acheté ses gants. Exiger une date exacte transforme une saisie de dix
  -- secondes en recherche de facture, donc en saisie qu'on ne fait pas.
  achete_le text,
  cout_centimes integer,
  note text,
  cree_le timestamptz not null default now()
);

alter table equipement drop constraint if exists equipement_categorie_connue;
alter table equipement add constraint equipement_categorie_connue
  check (categorie in (
    'protection',   -- casque, combinaison, dorsale, gants, bottes
    'paddock',      -- tente, chaise, table, glacière
    'transport',    -- remorque, sangles, rampe
    'outillage',    -- caisse à outils, béquilles, compresseur
    'autre'));

alter table equipement drop constraint if exists equipement_achat_est_un_mois;
alter table equipement add constraint equipement_achat_est_un_mois
  check (achete_le is null or achete_le ~ '^\d{4}-\d{2}$');

comment on table equipement is
  'Ce qui sert une journée circuit sans appartenir à une machine. Troisième '
  'racine, au même titre que roulage et machine (AD-2) : la combinaison existe '
  'sans moto et survit à la vente de la moto. AUCUNE colonne d''échéance — un '
  'compteur à rebours sur du matériel de sécurité fabrique du report, pas du '
  'remplacement.';

alter table equipement enable row level security;
drop policy if exists "un pilote ne voit que son equipement" on equipement;
create policy "un pilote ne voit que son equipement" on equipement
  for all using (pilote_id = (select auth.uid()))
  with check (pilote_id = (select auth.uid()));

create index if not exists equipement_par_pilote on equipement (pilote_id);
