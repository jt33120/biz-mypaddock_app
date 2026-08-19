-- ═══════════════════════════════════════════════════════════════════════════
-- LE BUDGET DE SAISON — récit 5.3.
--
-- C'est la seule chose du domaine du coût que le produit ne peut pas dériver :
-- ce qu'on a DÉPENSÉ se calcule, ce qu'on s'était FIXÉ se déclare.
--
-- Et cette table existe pour une raison de sécurité, pas de confort. FR-24 :
-- tant qu'aucun budget n'est déclaré, LE COÛT AU TOUR NE S'AFFICHE PAS — ni
-- zéro, ni tiret. Un coût au tour seul est une invitation à rouler plus pour le
-- faire baisser ; adossé au budget consommé, c'est une mesure. Sans cette
-- table, il n'y aurait aucun moyen de tenir la clause : on afficherait le
-- rapport parce qu'il est calculable.
--
-- AD-18 : `annee` est un ENTIER, pas une référence. La saison est dérivée
-- (AD-8) et n'a aucune ligne à pointer.
-- ═══════════════════════════════════════════════════════════════════════════

create table budget_saison (
  id                uuid primary key,            -- UUID v7 client (AD-14)
  pilote_id         uuid not null references pilote(id) on delete cascade,
  annee             integer not null check (annee between 2000 and 2100),
  montant_centimes  integer not null check (montant_centimes > 0),
  cree_le           timestamptz not null default now(),
  modifie_le        timestamptz not null default now(),
  -- Deux budgets pour une même saison n'ont aucun sens.
  unique (pilote_id, annee)
);

comment on table budget_saison is
  'Ce que le pilote s''était fixé pour une saison. Se déclare, ne se dérive pas — contrairement au dépensé. Sans lui, le coût au tour reste caché (FR-24).';

create index on budget_saison (pilote_id, annee);

alter table budget_saison enable row level security;

create policy "budget du pilote" on budget_saison
  for all using (pilote_id = (select auth.uid())) with check (pilote_id = (select auth.uid()));

-- AD-12 : la récolte n'a rien à faire ici non plus.
revoke all on budget_saison from recolte;

-- Le flux descendant en a besoin.
alter publication powersync add table budget_saison;
