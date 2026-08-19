-- ═══════════════════════════════════════════════════════════════════════════
-- LE CONSEIL DU JOUR ET LE PLAN SI-ALORS — récit 6.3.
--
-- Deux tables, et elles n'ont pas du tout le même statut.
--
-- `conseil` est du RÉFÉRENTIEL (AD-10) : lu par tous, écrit par personne via
-- l'API. Un conseil s'ajoute sans redéploiement — sinon le corpus suit les
-- sorties de version au lieu de suivre la pratique.
--
-- `plan_si_alors` est de la DONNÉE DE PILOTE, et la plus intime du produit.
-- ⚠ IL EST CONSERVÉ MOT POUR MOT. Le produit ne le reformule jamais, ne le
-- corrige jamais, ne le note jamais. C'est LE FAIT QU'IL SOIT DANS SES MOTS qui
-- le fait fonctionner — l'intention de mise en œuvre est l'intervention
-- comportementale la mieux établie du dossier (d ≈ 0,65 sur 94 essais), et elle
-- ne fonctionne que formulée par la personne elle-même.
-- ═══════════════════════════════════════════════════════════════════════════

create table conseil (
  id       uuid primary key default gen_random_uuid(),
  -- Un conseil ÉNONCE UNE TECHNIQUE. Jamais une performance à atteindre, jamais
  -- un chiffre à battre, et JAMAIS un bandeau de prévention : l'attention à un
  -- message d'avertissement chute dès la deuxième exposition, et une menace sans
  -- action facile associée produit de la défense, pas du changement
  -- (Witte & Allen, 93 études). « La plupart des chutes arrivent l'après-midi »
  -- sans dire quoi faire est PIRE que ne rien écrire.
  texte    text not null,
  actif    boolean not null default true,
  cree_le  timestamptz not null default now()
);

comment on table conseil is
  'Corpus du conseil du jour (AD-10, récit 6.3). Un conseil énonce une TECHNIQUE. Aucun bandeau de prévention, aucune performance à atteindre, aucun chiffre à battre.';

alter table conseil enable row level security;
create policy "conseil lisible par tous" on conseil for select using (true);
grant select, insert, update on conseil to recolte;

-- ─── Le plan si-alors ─────────────────────────────────────────────────────
create table plan_si_alors (
  id         uuid primary key,                  -- UUID v7 client (AD-14)
  pilote_id  uuid not null references pilote(id) on delete cascade,
  -- Tel qu'il l'a écrit. Aucune normalisation, aucune correction, aucune note.
  texte      text not null check (length(btrim(texte)) > 0),
  cree_le    timestamptz not null default now()
);

comment on column plan_si_alors.texte is
  'MOT POUR MOT. Ne jamais reformuler, corriger ni noter : c''est le fait qu''il soit dans ses mots qui le fait fonctionner.';

create index on plan_si_alors (pilote_id);

alter table plan_si_alors enable row level security;
create policy "plan du pilote" on plan_si_alors
  for all using (pilote_id = (select auth.uid())) with check (pilote_id = (select auth.uid()));
revoke all on plan_si_alors from recolte;

alter publication powersync add table conseil;
alter publication powersync add table plan_si_alors;

-- ─── Corpus de départ ─────────────────────────────────────────────────────
-- ⚠ CONTENU PROVISOIRE — le récit 6.3 porte « demande Julian » sur le contenu.
-- Ces six énoncés sont de la technique de pilotage courante et vérifiable ; ils
-- tiennent la clause de forme (une technique, aucune performance, aucun chiffre,
-- aucun avertissement) et attendent d'être remplacés par les siens.
insert into conseil (texte) values
  ('Le regard va où tu veux aller, jamais sur ce que tu veux éviter. Porte-le à la sortie du virage avant d''y entrer.'),
  ('Un freinage se relâche progressivement à l''entrée. Lâcher les freins d''un coup redresse la moto au moment où elle doit tomber.'),
  ('Une seule action à la fois : on freine droit, on tourne, puis on remet les gaz. Les mélanger consomme de l''adhérence deux fois.'),
  ('Le buste se déplace avant le virage, pas pendant. Bouger sur la moto une fois inclinée déstabilise la trajectoire.'),
  ('Les bras restent souples. Un guidon tenu ferme empêche la moto de se corriger toute seule sur un revêtement irrégulier.'),
  ('Le point de corde tardif ouvre la sortie. Tourner tôt oblige à rouvrir l''angle au moment où on voudrait accélérer.');
