-- ═══════════════════════════════════════════════════════════════════════════
-- LE PROPRIÉTAIRE DESCEND JUSQU'AUX FEUILLES — récit 1.2.
--
-- Pourquoi maintenant, et pas plus tard : les règles de synchronisation de
-- PowerSync ne savent PAS faire de jointure. Une règle décrit un seau par une
-- requête sur UNE table, filtrée par un paramètre. `session`, `tour` et
-- `intervention` ne portaient leur possession qu'à travers leur parent — elles
-- étaient donc, littéralement, hors d'atteinte de toute synchronisation.
--
-- Le coût de la correction est nul aujourd'hui (les trois tables sont vides) et
-- serait une migration sur données vivantes en février. C'est exactement le
-- profil d'AD-2 : une décision dont le prix explose si on la diffère.
--
-- ⚠ CE N'EST PAS UN AFFAIBLISSEMENT DE LA FRONTIÈRE. La possession traversée
-- reste vérifiée : chaque politique exige les DEUX conditions — la colonne dit
-- le même pilote que l'ascendance. Une ligne qui se déclarerait d'un autre
-- propriétaire que son parent est refusée par le moteur, pas par une convention.
-- ═══════════════════════════════════════════════════════════════════════════

alter table session      add column pilote_id uuid not null references pilote(id) on delete cascade;
alter table tour         add column pilote_id uuid not null references pilote(id) on delete cascade;
alter table intervention add column pilote_id uuid not null references pilote(id) on delete cascade;

comment on column session.pilote_id is
  'Dénormalisé pour la synchronisation : une règle PowerSync ne joint pas. Doit toujours valoir celui du roulage parent — la politique RLS l''exige.';
comment on column tour.pilote_id is
  'Dénormalisé pour la synchronisation. Doit toujours valoir celui de la session parente.';
comment on column intervention.pilote_id is
  'Dénormalisé pour la synchronisation. Doit toujours valoir celui de la machine parente.';

create index on session (pilote_id);
create index on tour (pilote_id);
create index on intervention (pilote_id);

-- ─── Les politiques exigent la colonne ET l'ascendance ────────────────────
drop policy "session du pilote" on session;
create policy "session du pilote" on session for all
  using (
    pilote_id = (select auth.uid())
    and exists (select 1 from roulage r where r.id = session.roulage_id and r.pilote_id = session.pilote_id))
  with check (
    pilote_id = (select auth.uid())
    and exists (select 1 from roulage r where r.id = session.roulage_id and r.pilote_id = session.pilote_id));

drop policy "tour du pilote" on tour;
create policy "tour du pilote" on tour for all
  using (
    pilote_id = (select auth.uid())
    and exists (select 1 from session s where s.id = tour.session_id and s.pilote_id = tour.pilote_id))
  with check (
    pilote_id = (select auth.uid())
    and exists (select 1 from session s where s.id = tour.session_id and s.pilote_id = tour.pilote_id));

drop policy "intervention du pilote" on intervention;
create policy "intervention du pilote" on intervention for all
  using (
    pilote_id = (select auth.uid())
    and exists (select 1 from machine m where m.id = intervention.machine_id and m.pilote_id = intervention.pilote_id))
  with check (
    pilote_id = (select auth.uid())
    and exists (select 1 from machine m where m.id = intervention.machine_id and m.pilote_id = intervention.pilote_id));

-- AD-12 tient toujours : la récolte n'a rien gagné au passage.
revoke all on session, tour, intervention from recolte;
