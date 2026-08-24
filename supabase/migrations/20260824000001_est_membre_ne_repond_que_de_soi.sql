-- ═══════════════════════════════════════════════════════════════════════════
-- ON NE DEMANDE PLUS SI QUELQU'UN D'AUTRE EST DANS UN CERCLE
--
-- `est_membre(p_cercle, p_pilote)` existe pour une seule raison : casser la
-- récursion de la politique de `membre_cercle`, qui sinon se lirait elle-même.
-- Elle est donc `security definer` — elle voit tout — et elle a toujours été
-- appelée avec `auth.uid()` en second argument.
--
-- Mais elle vit dans le schéma `public`, donc PostgREST l'expose : n'importe
-- quel appelant, y compris `anon`, peut la joindre sur `/rest/v1/rpc/est_membre`
-- et lui passer le pilote de son choix. Le contenu du cercle ne fuit pas — il
-- faut déjà connaître deux UUID — mais la QUESTION ne devrait pas être posable.
-- Une fonction qui voit tout et qu'on peut interroger sur autrui est une
-- fonction dont la seule protection est que personne n'essaie.
--
-- Le correctif ne verrouille rien : il retire le paramètre. La fonction lit
-- l'identité dans le jeton, comme `assurer_pilote`. Un appelant ne peut plus
-- demander que « suis-JE membre » — la seule question qu'elle ait jamais eu à
-- répondre.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function est_membre(p_cercle uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from membre_cercle
     where cercle_id = p_cercle and pilote_id = (select auth.uid()))
$$;

comment on function est_membre(uuid) is
  'Suis-je membre de ce cercle ? L''identité vient du jeton, jamais d''un '
  'paramètre : la question ne peut pas porter sur autrui.';

-- ─── Les politiques repassent par la nouvelle signature ────────────────────
-- Elles sont recréées AVANT que l'ancienne fonction ne tombe : une politique
-- qui dépend d''une fonction supprimée fait échouer le `drop`, et c'est tant
-- mieux — mais on ne veut pas non plus d'un instant où le cercle s'ouvre.
drop policy if exists "cercle de ses membres" on cercle;
create policy "cercle de ses membres" on cercle
  for select using (est_membre(id));

drop policy if exists "membres visibles entre membres" on membre_cercle;
create policy "membres visibles entre membres" on membre_cercle
  for select using (est_membre(cercle_id));

create or replace view roulage_du_cercle
with (security_invoker = true) as
select r.id, r.pilote_id, m.cercle_id, m.pseudo,
       r.circuit_nom, r.date_jour,
       case when r.chrono_visible then
         (select min(t.temps_ms) from tour t
            join session s on s.id = t.session_id where s.roulage_id = r.id)
       end as meilleur_ms
  from roulage r
  join membre_cercle m on m.pilote_id = r.pilote_id
 where r.etat = 'usage'
   and est_membre(m.cercle_id);

grant select on roulage_du_cercle to authenticated;

drop function if exists est_membre(uuid, uuid);

-- `anon` n'a rien à faire ici : sans compte, la réponse est « non » de toute
-- façon, et une fonction `security definer` joignable sans jeton est une
-- surface qui ne rapporte rien.
revoke all on function est_membre(uuid) from public, anon;
grant execute on function est_membre(uuid) to authenticated;
