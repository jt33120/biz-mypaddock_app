-- ─── L'ATELIER — épique 8, l'axe machine prend ses écrans ─────────────────
--
-- Trois ajouts, et le premier porte à lui seul deux exigences que le PRD nomme
-- séparément mais qui sont le même objet vu de deux côtés.
--
-- ① `etat` — VISÉE ou FAITE. Une intervention « visée », c'est quelque chose qui
--   attend, et le produit en connaît exactement deux sortes :
--     · la PIÈCE ACHETÉE ET NON MONTÉE (FR-45), « un état de première classe,
--       pas une ligne de dépense qu'on interprète » ;
--     · la RÉPARATION NON VITALE EN ATTENTE (FR-48), qui n'a « aucune échéance,
--       aucun compteur à rebours et aucune relance ».
--   Ce sont deux fois la même forme — un acte désiré, pas encore posé — et elles
--   se distinguent par leur CATÉGORIE, qui ne les mélange jamais dans une liste
--   (FR-46). Les unifier ici et les séparer à l'écran est exactement le bon
--   partage : le modèle n'a pas à connaître deux objets là où il y en a un.
--
-- ② `date_jour` DEVIENT NULLABLE. Une intervention visée n'a pas de date — c'est
--   ce qui la définit. La contrainte l'exige seulement quand elle est faite,
--   et l'inverse est vrai aussi : une intervention faite SANS date serait un
--   acte sans moment, donc pas un acte.
--
-- ③ `depense_id` et `photo_id` — les deux portes d'entrée de l'atelier.
--   FR-26 : une dépense marquée « pièce » ouvre l'intervention.
--   FR-47 : une réparation non vitale se crée DEPUIS UNE PHOTO, au paddock,
--   sans rien remplir d'autre. Les deux sont `on delete set null` : effacer une
--   dépense ne doit pas effacer le geste qu'elle a payé.
--
-- Et l'ÉVÉNEMENT VISÉ (FR-54), « un objet léger — date approximative, coût
-- estimé — désiré avant d'être réservé ». Il n'est pas une intervention : il ne
-- touche pas la machine, il vise une sortie. Sa table est délibérément pauvre.

alter table intervention add column if not exists etat text not null default 'faite';
alter table intervention drop constraint if exists intervention_etat_coherent;
alter table intervention add constraint intervention_etat_coherent check (
  (etat = 'faite' and date_jour is not null) or
  (etat = 'visee' and date_jour is null)
);
alter table intervention alter column date_jour drop not null;

alter table intervention add column if not exists depense_id uuid
  references depense(id) on delete set null;
alter table intervention add column if not exists photo_id uuid
  references photo(id) on delete set null;

comment on column intervention.etat is
  'visee = un acte qui attend (pièce achetée non montée FR-45, réparation non '
  'vitale en attente FR-48) ; faite = un acte posé, qui porte alors sa date.';

create index if not exists intervention_visee
  on intervention (machine_id, categorie) where etat = 'visee';

-- ─── L'ÉVÉNEMENT VISÉ — FR-54 ────────────────────────────────────────────
-- « Désiré avant d'être réservé. » Il donne à l'accueil temporel quelque chose
-- à montrer quand rien n'est réservé — la faiblesse nommée de ce mécanisme.
-- La date est APPROXIMATIVE et le coût ESTIMÉ : ni l'un ni l'autre ne se
-- présente comme un fait, et rien ici ne déclenche de relance.
create table if not exists evenement_vise (
  id                  uuid primary key,
  pilote_id           uuid not null references pilote(id) on delete cascade,
  libelle             text not null check (length(btrim(libelle)) > 0),
  date_approx         date,
  cout_estime_centimes integer check (cout_estime_centimes >= 0),
  cree_le             timestamptz not null default now(),
  modifie_le          timestamptz not null default now()
);

create index if not exists evenement_vise_par_pilote
  on evenement_vise (pilote_id, date_approx);

alter table evenement_vise enable row level security;

create policy "evenement lisible par son pilote" on evenement_vise
  for select using (pilote_id = (select auth.uid()));
create policy "evenement ecrit par son pilote" on evenement_vise
  for insert with check (pilote_id = (select auth.uid()));
create policy "evenement modifie par son pilote" on evenement_vise
  for update using (pilote_id = (select auth.uid()));
create policy "evenement efface par son pilote" on evenement_vise
  for delete using (pilote_id = (select auth.uid()));
