-- ═══════════════════════════════════════════════════════════════════════════
-- AD-12 — Le service de récolte n'écrit JAMAIS dans les données d'un pilote.
--
-- Deux propriétaires pour une même table, c'est un incident de récolte qui
-- corrompt une saison. La frontière est donc portée par la base elle-même et
-- non par la discipline du code : un rôle distinct, sans aucun droit d'écriture
-- sur les tables de pilote.
--
--   · référentiel        → PUBLIC EN LECTURE, écrit par le seul rôle de récolte
--   · données de pilote  → RLS, chaque pilote ne voit que les siennes
-- ═══════════════════════════════════════════════════════════════════════════

alter table pilote        enable row level security;
alter table machine       enable row level security;
alter table roulage       enable row level security;
alter table session       enable row level security;
alter table tour          enable row level security;
alter table depense       enable row level security;
alter table intervention  enable row level security;

alter table circuit         enable row level security;
alter table organisateur    enable row level security;
alter table roulage_publie  enable row level security;
alter table bareme          enable row level security;

-- ─── Référentiel : lecture pour tous, écriture pour personne via l'API ────
-- La récolte écrira par le rôle dédié créé plus bas, qui contourne RLS.
create policy "referentiel lisible par tous" on circuit        for select using (true);
create policy "referentiel lisible par tous" on organisateur   for select using (true);
create policy "referentiel lisible par tous" on roulage_publie for select using (true);
create policy "referentiel lisible par tous" on bareme         for select using (true);

-- ─── Pilote ───────────────────────────────────────────────────────────────
create policy "un pilote ne voit que lui" on pilote
  for all using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ─── Racines : possession directe ─────────────────────────────────────────
create policy "machine du pilote" on machine
  for all using (pilote_id = (select auth.uid())) with check (pilote_id = (select auth.uid()));

create policy "roulage du pilote" on roulage
  for all using (pilote_id = (select auth.uid())) with check (pilote_id = (select auth.uid()));

create policy "depense du pilote" on depense
  for all using (pilote_id = (select auth.uid())) with check (pilote_id = (select auth.uid()));

-- ─── Descendants : possession traversée ───────────────────────────────────
create policy "session du pilote" on session
  for all using (exists (select 1 from roulage r where r.id = session.roulage_id and r.pilote_id = (select auth.uid())))
  with check (exists (select 1 from roulage r where r.id = session.roulage_id and r.pilote_id = (select auth.uid())));

create policy "tour du pilote" on tour
  for all using (exists (
    select 1 from session s join roulage r on r.id = s.roulage_id
    where s.id = tour.session_id and r.pilote_id = (select auth.uid())))
  with check (exists (
    select 1 from session s join roulage r on r.id = s.roulage_id
    where s.id = tour.session_id and r.pilote_id = (select auth.uid())));

create policy "intervention du pilote" on intervention
  for all using (exists (select 1 from machine m where m.id = intervention.machine_id and m.pilote_id = (select auth.uid())))
  with check (exists (select 1 from machine m where m.id = intervention.machine_id and m.pilote_id = (select auth.uid())));

-- ─── Le rôle de récolte (AD-12) ───────────────────────────────────────────
-- Il écrit le référentiel. Il n'a AUCUN droit sur les tables de pilote, et ce
-- n'est pas une convention : c'est un défaut de privilège au niveau du moteur.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'recolte') then
    create role recolte nologin;
  end if;
end $$;

grant usage on schema public to recolte;
grant select, insert, update on circuit, organisateur, roulage_publie, bareme to recolte;

-- La frontière, énoncée en négatif et vérifiable :
revoke all on pilote, machine, roulage, session, tour, depense, intervention from recolte;

-- Un pilote qui s'inscrit obtient sa ligne sans aller-retour applicatif.
create or replace function public.gerer_nouveau_pilote()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.pilote (id, affichage)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.gerer_nouveau_pilote();
