-- ═══════════════════════════════════════════════════════════════════════════
-- LE CERCLE AVAIT UNE PORTE ET UNE FENÊTRE OUVERTE À CÔTÉ.
-- Relecture de l'épique 14, 25 août 2026.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- ⚠ L'ADHÉSION NE VÉRIFIAIT PAS LE CERCLE. La politique d'insertion sur
-- `membre_cercle` était :
--
--     with check (pilote_id = (select auth.uid()))
--
-- Elle contrôle QUI s'inscrit. Elle ne dit RIEN de OÙ. N'importe quel pilote
-- connecté pouvait donc s'ajouter à n'importe quel cercle d'une seule requête,
-- sans code, sans invitation :
--
--     POST /rest/v1/membre_cercle {"cercle_id":"<uuid>","pilote_id":"<soi>","pseudo":"x"}
--
-- Toute la fermeture du cercle repose sur `rejoindre_cercle`, qui exige le code
-- et le résout côté serveur. C'était une porte fermée à côté d'une fenêtre
-- ouverte. Et une fois dedans, `est_membre(cercle_id)` devient vrai : on lit le
-- NOM et le CODE du cercle, et la liste de tous ses membres avec leur
-- identifiant d'authentification.
--
-- Conséquence concrète, et elle n'a rien d'hypothétique : un membre qui part
-- garde l'identifiant du cercle — son application le lui a donné — et peut donc
-- rentrer quand il veut. « On quitte pour soi » ne fermait rien du tout.

-- ── ① LA CRÉATION DEVIENT UN SEUL GESTE ────────────────────────────────────
--
-- Elle en faisait deux, sans transaction, et l'erreur du second n'était jamais
-- lue (src/db/cercle.ts:56-60). Si l'insertion du membre échouait, le cercle
-- existait quand même — et son créateur n'en était pas membre. Or `cercle` ne se
-- lit que par `est_membre(id)` et n'a AUCUNE politique de suppression : le
-- cercle devenait illisible par tous, ineffaçable par tous, et son code
-- continuait de répondre dans `rejoindre_cercle`. Un inconnu qui aurait eu le
-- code en serait devenu l'unique membre.
--
-- ⚠ LE CODE SE TIRE ICI, ET PLUS DANS LE TÉLÉPHONE. Un client qui choisit son
-- propre code peut en choisir un devinable, ou celui d'un autre cercle pour
-- provoquer une collision. Le tirage est le même — même alphabet sans 0/O ni
-- 1/I/L, parce qu'il se dicte de vive voix au paddock, casque à la main, dans
-- le bruit — mais il n'est plus au client de le décider.
create or replace function creer_cercle(p_nom text, p_pseudo text)
returns table (id uuid, nom text, code text)
language plpgsql security definer set search_path = public as $$
declare
  v_moi uuid := auth.uid();
  v_code text;
  v_id uuid;
  v_essais int := 0;
begin
  if v_moi is null then raise exception 'compte requis'; end if;
  if length(btrim(coalesce(p_nom, ''))) = 0 then raise exception 'nom requis'; end if;
  if length(btrim(coalesce(p_pseudo, ''))) = 0 then raise exception 'pseudo requis'; end if;

  loop
    v_essais := v_essais + 1;
    -- 31 caractères, 8 tirages : ~2^39,6 possibilités. L'alphabet exclut 0, O,
    -- 1, I et L — ils se confondent à l'oral, et ce code se donne à la voix.
    select string_agg(substr('23456789ABCDEFGHJKMNPQRSTUVWXYZ',
                             1 + floor(random() * 31)::int, 1), '')
      into v_code from generate_series(1, 8);
    exit when not exists (select 1 from cercle c where c.code = v_code);
    if v_essais > 20 then raise exception 'code introuvable'; end if;
  end loop;

  v_id := gen_random_uuid();
  insert into cercle (id, nom, code, cree_par) values (v_id, btrim(p_nom), v_code, v_moi);
  insert into membre_cercle (cercle_id, pilote_id, pseudo)
    values (v_id, v_moi, btrim(p_pseudo));

  -- Une seule fonction, donc une seule transaction : les deux lignes existent,
  -- ou aucune. C'est tout ce que le correctif du cercle orphelin demandait.
  return query select v_id, btrim(p_nom), v_code;
end $$;

revoke all on function creer_cercle(text, text) from public, anon;
grant execute on function creer_cercle(text, text) to authenticated;

-- ── ② LA FENÊTRE SE FERME ──────────────────────────────────────────────────
--
-- Plus aucune écriture directe sur `membre_cercle` ni sur `cercle`. Les deux
-- seules portes sont `creer_cercle` et `rejoindre_cercle`, toutes deux
-- `security definer`, toutes deux exigeant ce qu'il faut exiger.
--
-- ⚠ LA LECTURE ET LE DÉPART NE CHANGENT PAS. « On quitte pour soi » reste, et
-- reste la seule politique de suppression : personne ne peut sortir quelqu'un
-- d'autre. Ça ne suffit pas — voir A-FAIRE — mais retirer ce droit-là serait
-- enfermer les gens, ce qui est pire.
drop policy if exists "on rejoint pour soi" on membre_cercle;
drop policy if exists "un pilote cree un cercle" on cercle;
