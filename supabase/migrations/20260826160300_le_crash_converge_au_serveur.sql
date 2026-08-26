-- ═══════════════════════════════════════════════════════════════════════════
-- LE TRI-ÉTAT DU CRASH CONVERGE AU SERVEUR, QUEL QUE SOIT L'ORDRE POWERSYNC.
--
-- Une transaction SQLite ne traverse pas le réseau comme une transaction :
-- ses mutations sont rejouées une par une. La relation chute ↔ roulage doit
-- donc être protégée là où ces écritures se rencontrent, dans Postgres.
-- ═══════════════════════════════════════════════════════════════════════════

-- `pilote_id = auth.uid()` sur chute ne suffit pas : sans ascendance, le pilote
-- A peut donner l'UUID d'un roulage B au trigger SECURITY DEFINER. La paire est
-- donc garantie AVANT la création du trigger. `NOT VALID` ferme d'abord la
-- porte aux nouvelles lignes ; la validation explicite juste après audite et
-- ferme aussi l'historique avant d'installer le corps privilégié.
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.roulage'::regclass
       and conname = 'roulage_id_pilote_id_unique'
  ) then
    alter table public.roulage
      add constraint roulage_id_pilote_id_unique unique (id, pilote_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.chute'::regclass
       and conname = 'chute_roulage_du_meme_pilote_fk'
  ) then
    alter table public.chute
      add constraint chute_roulage_du_meme_pilote_fk
      foreign key (roulage_id, pilote_id)
      references public.roulage (id, pilote_id)
      on delete cascade not valid;
  end if;
end
$$;

alter table public.chute
  validate constraint chute_roulage_du_meme_pilote_fk;

drop policy if exists "un pilote ne voit que ses chutes" on public.chute;
create policy "un pilote ne voit que ses chutes" on public.chute
  for all
  using (
    pilote_id = (select auth.uid())
    and exists (
      select 1 from public.roulage r
       where r.id = chute.roulage_id and r.pilote_id = chute.pilote_id
    )
  )
  with check (
    pilote_id = (select auth.uid())
    and exists (
      select 1 from public.roulage r
       where r.id = chute.roulage_id and r.pilote_id = chute.pilote_id
    )
  );

-- Recalcule sous verrou de la journée. Toutes les insertions/suppressions de
-- chute d'une même journée se sérialisent sur cette ligne ; le SELECT des
-- chutes a ainsi lieu après le verrou, avec l'état engagé le plus récent.
create or replace function public.recalculer_statut_crash(p_roulage uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_documente boolean;
  v_pilote uuid;
  v_bypass text := current_setting('mypaddock.recalcul_crash', true);
begin
  select pilote_id into v_pilote
    from public.roulage where id = p_roulage for update;
  if not found then return; end if; -- suppression en cascade de la journée

  select exists (
    select 1 from public.chute
     where roulage_id = p_roulage and pilote_id = v_pilote
  ) into v_documente;

  perform set_config('mypaddock.recalcul_crash', '1', true);
  update public.roulage
     set crash_statut = case when v_documente then 'documente' else 'a_renseigner' end
   where id = p_roulage;
  perform set_config('mypaddock.recalcul_crash', coalesce(v_bypass, ''), true);
exception when others then
  perform set_config('mypaddock.recalcul_crash', coalesce(v_bypass, ''), true);
  raise;
end
$$;

create or replace function public.recalculer_statut_crash_apres_chute()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Refuse l'enfant avant que le corps privilégié ne tente de toucher sa cible.
  -- La FK fait aussi rouler en arrière la transaction, cette garde réduit le
  -- pouvoir exercé avant le refus à zéro.
  if tg_op <> 'DELETE' and not exists (
    select 1 from public.roulage r
     where r.id = new.roulage_id and r.pilote_id = new.pilote_id
  ) then
    raise foreign_key_violation
      using message = 'La chute et le roulage doivent appartenir au même pilote.';
  end if;
  if tg_op = 'UPDATE'
     and (old.roulage_id is distinct from new.roulage_id
       or old.pilote_id is distinct from new.pilote_id) then
    perform public.recalculer_statut_crash(old.roulage_id);
  end if;
  perform public.recalculer_statut_crash(
    case when tg_op = 'DELETE' then old.roulage_id else new.roulage_id end
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;

drop trigger if exists chute_qualifie_le_roulage on public.chute;
create trigger chute_qualifie_le_roulage
after insert or delete or update of roulage_id, pilote_id on public.chute
for each row execute function public.recalculer_statut_crash_apres_chute();

-- Reprise idempotente avant de fermer la dernière porte d'incohérence.
update public.roulage r
   set crash_statut = case
     when exists (select 1 from public.chute c
                   where c.roulage_id = r.id and c.pilote_id = r.pilote_id)
       then 'documente'
     else 'a_renseigner'
   end
 where crash_statut = 'documente'
    or exists (select 1 from public.chute c
                where c.roulage_id = r.id and c.pilote_id = r.pilote_id);

-- Un PATCH tardif « aucun » ne gagne jamais contre une chute déjà engagée.
-- `old=documente` couvre aussi le cas où le PATCH attendait derrière l'INSERT :
-- même si son instantané précédait l'INSERT, la version verrouillée de la ligne
-- prouve que celui-ci a eu lieu. Le bypass est réservé au recalcul ci-dessus.
create or replace function public.garder_statut_crash_coherent()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if current_setting('mypaddock.recalcul_crash', true) = '1' then return new; end if;
  -- Symétrique aux deux courses PowerSync : après une suppression, OLD porte
  -- déjà `a_renseigner` même si le snapshot du PATCH tardif voit encore la
  -- chute. Il gagne donc sur un ancien `documente` envoyé par l'autre appareil.
  if new.crash_statut = 'documente' and old.crash_statut <> 'documente' then
    new.crash_statut := 'a_renseigner';
  elsif new.crash_statut <> 'documente'
     and (old.crash_statut = 'documente'
       or exists (select 1 from public.chute
                   where roulage_id = new.id and pilote_id = new.pilote_id)) then
    new.crash_statut := 'documente';
  end if;
  return new;
end
$$;

drop trigger if exists roulage_refuse_un_faux_aucun on public.roulage;
create trigger roulage_refuse_un_faux_aucun
before update of crash_statut on public.roulage
for each row execute function public.garder_statut_crash_coherent();

-- Fonctions de trigger seulement : aucune RPC publique ne peut forcer un
-- recalcul en contournant les politiques de la journée.
revoke all on function public.recalculer_statut_crash(uuid) from public, anon, authenticated;
revoke all on function public.recalculer_statut_crash_apres_chute() from public, anon, authenticated;
revoke all on function public.garder_statut_crash_coherent() from public, anon, authenticated;
