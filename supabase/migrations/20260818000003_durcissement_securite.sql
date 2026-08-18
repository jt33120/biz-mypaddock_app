-- Correctifs des advisors de sécurité Supabase, relevés après le récit 1.1.

-- 1. La fonction d'aide aux tests d'invariants n'a rien à faire en base.
drop function if exists public.essai(text);

-- 2. `gerer_nouveau_pilote` est SECURITY DEFINER et était exposée en RPC à `anon`
--    comme à `authenticated` via /rest/v1/rpc/. Elle n'est destinée qu'au trigger
--    sur auth.users : personne ne doit pouvoir l'appeler depuis l'API.
revoke execute on function public.gerer_nouveau_pilote() from public, anon, authenticated;

-- 3. Le rôle de récolte ne doit hériter d'aucun droit futur sur les tables de
--    pilote, y compris celles qui n'existent pas encore. AD-12 doit survivre aux
--    migrations à venir, sinon la frontière ne tient que tant qu'on y pense.
alter default privileges in schema public revoke all on tables from recolte;
