-- ─── ÉPIQUE 13 : CHECKLIST DE CHARGEMENT ET CONFORMITÉ ──────────────────
--
-- FR-50 : « Le système NE CERTIFIE PAS l'admission : il rapporte ce qu'un
-- organisateur a publié. » C'est une conséquence de SCHÉMA, pas de rédaction —
-- chaque ligne de conformité porte sa source ET sa date, et il n'existe aucune
-- colonne qui dirait « conforme », « admis » ou « validé ». Ce qui n'est pas
-- dans le schéma ne s'affiche pas par accident.
--
-- FR-51 : une fiche de plus de douze mois affiche son âge. La date de
-- publication est donc OBLIGATOIRE dès qu'une source existe — sans elle, l'âge
-- serait incalculable et la fiche se présenterait comme à jour, ce qui est
-- exactement le contraire de ce que l'exigence demande.
--
-- La contrainte `conformite_porte_sa_source` interdit le seul cas dangereux :
-- une règle sans provenance. Une ligne de chargement — mon casque, ma
-- combinaison — n'a pas de source et n'a pas à en avoir ; elle vient du pilote.

create table if not exists regle_organisateur (
  id              uuid primary key default gen_random_uuid(),
  organisateur_id uuid references organisateur(id) on delete cascade,
  circuit_id      uuid references circuit(id) on delete cascade,
  libelle         text not null check (length(btrim(libelle)) > 0),
  source_url      text not null,
  publie_le       date not null,
  recolte_le      timestamptz not null default now(),
  extrait_par_ia  boolean not null default true
);
create index if not exists regle_par_organisateur on regle_organisateur (organisateur_id);
alter table regle_organisateur enable row level security;
create policy "referentiel lisible par tous" on regle_organisateur for select using (true);
grant select, insert, update on regle_organisateur to recolte;

create table if not exists checklist_ligne (
  id          uuid primary key,
  pilote_id   uuid not null references pilote(id) on delete cascade,
  roulage_id  uuid not null references roulage(id) on delete cascade,
  libelle     text not null check (length(btrim(libelle)) > 0),
  categorie   text not null check (categorie in ('machine', 'equipement', 'conformite')),
  cochee      boolean not null default false,
  source_url  text,
  publie_le   date,
  constraint conformite_porte_sa_source check (
    categorie <> 'conformite' or (source_url is not null and publie_le is not null)
  ),
  cree_le     timestamptz not null default now()
);
create index if not exists checklist_par_roulage on checklist_ligne (roulage_id);
alter table checklist_ligne enable row level security;
create policy "checklist du pilote" on checklist_ligne
  for all using (pilote_id = (select auth.uid())) with check (pilote_id = (select auth.uid()));
