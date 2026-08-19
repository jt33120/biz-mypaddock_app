-- ─── FR-61 : LA FRONTIÈRE DES QUATRE ÉTATS, ET L'HORLOGE D'USURE ─────────
--
-- FR-61 devait exister AVANT le premier récit du mouvement 3, et non pendant.
-- L'audit de viabilité la voulait dans le schéma avant tout développement ; la
-- nuance qui décidait de sa date est qu'elle gouverne l'import et le moteur de
-- règles. Elle ne bloquait donc pas le noyau, qui n'a ni l'un ni l'autre —
-- elle bloquait l'horloge d'usure et le barème, c'est-à-dire cette épique.
--
-- Contrainte de MODÈLE, pas lexique d'interface : les quatre mots — brouillon,
-- usage, preuve, recommandation — ne remontent jamais à l'écran. Le pilote voit
-- au plus une distinction, « à confirmer » contre confirmé. Quelqu'un qui ouvre
-- l'application onze fois par an n'apprend pas le vocabulaire de son schéma.

alter table roulage add column if not exists etat text not null default 'usage';
alter table roulage drop constraint if exists roulage_etat_connu;
alter table roulage add constraint roulage_etat_connu check (etat in ('brouillon', 'usage'));

comment on column roulage.etat is
  'FR-61. brouillon = importé d''un calendrier d''organisateur : une inscription '
  'ou une présence ne prouve pas qu''on a roulé, et certains roulages loisir '
  'interdisent tout chronométrage. usage = confirmé par le pilote ou par une '
  'mesure. Un roulage saisi à la main naît en usage.';

-- LE COEFFICIENT D'USURE — FR-41, FR-42.
-- De la donnée, jamais une constante compilée. Il part à 1 pour tous les
-- niveaux parce qu'AUCUNE SOURCE NE L'ÉTAYE à ce jour : partir à 1, c'est
-- compter les roulages sans les pondérer, donc l'horloge fonctionne dès le
-- premier jour et la finesse arrive quand une saison de données existe.
--
-- L'entrée est le NIVEAU MYPADDOCK, jamais le nom du groupe : « Rouge » chez un
-- organisateur et « Expert » chez un autre projettent sur le même niveau, et le
-- produit n'a pas à tenir une table de noms qui changerait à chaque nouvel
-- organisateur.
create table if not exists coefficient_usure (
  niveau      text primary key check (niveau in ('debutant','intermediaire','confirme','racer')),
  coefficient real not null default 1 check (coefficient > 0)
);
insert into coefficient_usure (niveau, coefficient) values
  ('debutant', 1), ('intermediaire', 1), ('confirme', 1), ('racer', 1)
on conflict (niveau) do nothing;
alter table coefficient_usure enable row level security;
create policy "coefficient lisible par tous" on coefficient_usure for select using (true);

-- L'HORLOGE D'USURE — l'échéance d'un poste sur une machine.
--
-- FR-44 : le barème est TRANSCRIT, JAMAIS INTERPRÉTÉ. Aucune sortie de ce
-- produit ne certifie la sécurité d'un véhicule ni la durée de vie restante
-- d'une pièce. D'où les trois colonnes de provenance, et d'où l'ABSENCE de tout
-- champ qui ressemblerait à un verdict — pas de `etat_piece`, pas de `risque`,
-- pas de `a_faire_avant`. Ce qui n'existe pas dans le schéma ne s'affiche pas
-- par accident.
create table if not exists horloge (
  id                 uuid primary key,
  pilote_id          uuid not null references pilote(id) on delete cascade,
  machine_id         uuid not null references machine(id) on delete cascade,
  operation          text not null check (length(btrim(operation)) > 0),
  intervalle_roulages integer check (intervalle_roulages > 0),
  source_url         text,
  recolte_le         timestamptz,
  extrait_par_ia     boolean not null default false,
  -- La dernière fois que le poste a été fait. Nulle = jamais, ce qui est un
  -- état valide et non un trou : l'horloge part alors du premier roulage.
  depuis_intervention uuid references intervention(id) on delete set null,
  cree_le            timestamptz not null default now(),
  modifie_le         timestamptz not null default now()
);
create index if not exists horloge_par_machine on horloge (machine_id);
alter table horloge enable row level security;
create policy "horloge du pilote" on horloge
  for all using (pilote_id = (select auth.uid())) with check (pilote_id = (select auth.uid()));
