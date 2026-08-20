-- ═══════════════════════════════════════════════════════════════════════════
-- LE PILOTE S'ASSURE SANS QUE LE QUOTA SE ROUVRE — bug remonté par Julian.
--
--   « pilote : new row violates row-level security policy for table "pilote" »
--
-- LA CAUSE EST À MOI. La migration `filet_monetaire` (20260819000012) a
-- remplacé la politique `for all` de `pilote` par un `for select` seul :
--
--     create policy "un pilote se lit lui-meme" on pilote
--       for select using (id = (select auth.uid()));
--
-- C'était DÉLIBÉRÉ et ça reste juste : avec `for all`, un simple PATCH sur
-- /rest/v1/pilote posait `quota_sprites` à 32767, soit 5 242 € de générations
-- d'image. Un quota que le compté peut écrire ne compte rien.
--
-- Mais il ne reste alors AUCUNE politique d'écriture, et la sauvegarde faisait
-- un `upsert({id})` de garantie sur cette table. Elle échouait donc au premier
-- geste, avant même d'avoir envoyé une seule ligne de saison — et le message
-- affiché parlait de « row-level security », ce qui ne veut rien dire pour un
-- pilote au paddock.
--
-- LA RÉPARATION NE ROUVRE PAS LA PORTE. On n'ajoute pas de politique `insert` :
-- elle laisserait choisir son propre quota À L'INSERTION, ce qui est le même
-- trou par une autre porte. On passe par une fonction `security definer` qui
-- N'ACCEPTE AUCUN PARAMÈTRE : elle ne peut poser que l'identité de l'appelant,
-- et les valeurs par défaut de la table font le reste.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function public.assurer_pilote()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- ⚠ AUCUN PARAMÈTRE, ET C'EST TOUT LE DISPOSITIF. `auth.uid()` est lu du
  -- jeton, pas d'un argument : un appelant ne peut créer que SA ligne. Et comme
  -- aucune colonne n'est renseignée hors de `id`, `quota_sprites` prend la
  -- valeur par défaut de la table — le compté ne l'écrit toujours pas.
  if auth.uid() is null then
    raise exception 'sans_compte';
  end if;

  insert into public.pilote (id)
  values (auth.uid())
  on conflict (id) do nothing;
end $$;

-- Le trigger sur auth.users reste le chemin normal : cette fonction est un
-- FILET, pour les comptes créés avant lui et pour le jour où il tombe. Un filet
-- qu'on n'éprouve jamais finit par ne plus exister — celui-ci est appelé à
-- chaque sauvegarde, donc il est éprouvé en permanence.
revoke execute on function public.assurer_pilote() from public, anon;
grant  execute on function public.assurer_pilote() to authenticated;

comment on function public.assurer_pilote() is
  'Garantit la ligne du pilote appelant. SANS PARAMÈTRE à dessein : l''identité '
  'vient du jeton et les défauts de la table posent le quota, donc rien de ce '
  'qui se compte n''est écrit par celui qu''on compte.';
