-- ═══════════════════════════════════════════════════════════════════════════
-- LA NORMALISATION QUI ÉTAIT PROMISE — et qui n'existait nulle part.
-- Relecture de l'épique 13, 25 août 2026.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- src/db/depot.ts:605-610 écrit, à propos de `circuit_id` :
--
--   « ③ `circuit_id` RESTE NUL. La tentation est forte de poser la référence
--     quand le pilote a choisi dans la liste — mais la liste embarquée n'a pas
--     les identifiants du serveur, et fabriquer un uuid côté client produirait
--     une clé étrangère invalide, donc une ligne refusée à l'envoi, donc une
--     file bloquée. La normalisation SE FAIT CÔTÉ SERVEUR, où les deux tables
--     sont dans la même base. »
--
-- Le raisonnement est juste et la conclusion est la bonne. Mais la seconde
-- moitié n'a jamais été écrite : `roulage` ne porte AUCUN déclencheur, et
-- `circuit_id` était nul sur 4 roulages sur 4 — depuis le premier jour.
--
-- ⚠ CE N'EST PAS UN CONFORT : C'EST LA PORTE FERMÉE DE TOUTE L'ÉPIQUE 13. La
-- checklist ne va chercher les règles publiées que `WHERE circuit_id = ?`
-- (src/db/checklist.ts). Sans rattachement, la requête rend toujours vide,
-- quoi qu'on mette dans le référentiel — et FR-49 comme FR-50 comme FR-51
-- décrivent alors un écran que personne ne verra jamais. Même chose pour tout
-- ce qu'un circuit sait de lui-même : ses virages, son sens, son plan.
--
-- Trente-deux circuits sont pourtant en base, et le pilote en a déjà tapé un.

-- ── LE PIVOT DE COMPARAISON ────────────────────────────────────────────────
--
-- Le pilote TAPE ce qu'il veut : « pau arnos », « Pau-Arnos », « PAU ARNOS ».
-- Le champ est libre à dessein — « ce qui est tapé est ce qui est écrit », et
-- un sélecteur fermé transformerait un roulage réel en roulage impossible à
-- saisir (depot.ts:596-599). C'est donc à la comparaison de s'adapter.
--
-- `unaccent` n'est pas installé, et son `unaccent()` n'est pas IMMUTABLE sans
-- emballage — `translate()` l'est, ne dépend d'aucune extension, et couvre
-- exactement ce qui apparaît dans les noms de circuits européens : Alès,
-- Lédenon, Portimão, Motorland Aragón, La Ferté-Gaucher.
--
-- ⚠ VÉRIFIÉ AVANT D'ÊTRE POSÉ : sur les 32 circuits en base, ce pivot ne
-- produit AUCUNE collision. Deux circuits différents ne peuvent donc pas se
-- confondre aujourd'hui — et si un jour ils le pouvaient, le déclencheur
-- ci-dessous refuse d'attacher plutôt que de choisir au hasard.
create or replace function nom_pivot(p text)
returns text language sql immutable strict parallel safe as $$
  select regexp_replace(
    translate(lower(p),
      'àáâãäåçèéêëìíîïñòóôõöøùúûüýÿœæ',
      'aaaaaaceeeeiiiinoooooouuuuyyoa'),
    '[^a-z0-9]', '', 'g')
$$;

comment on function nom_pivot(text) is
  'Le nom réduit à ce qui l''identifie : minuscules, sans accents, sans '
  'ponctuation ni espaces. Sert à apparier un nom TAPÉ à un nom du référentiel, '
  'sans jamais contraindre ce que le pilote a le droit d''écrire.';

-- ── LE RATTACHEMENT ────────────────────────────────────────────────────────
--
-- ⚠ IL NE REMPLACE JAMAIS UN RATTACHEMENT EXISTANT. Il ne fait que remplir un
-- vide. Deux conséquences, et les deux comptent :
--
--   · l'adoption — le dépôt d'un seul coup de ce qui a été saisi avant le
--     compte — renvoie `circuit_id` à NULL puisque le téléphone ne l'a jamais
--     su. Le déclencheur le repose. Le rattachement se RÉPARE tout seul au lieu
--     de se perdre à chaque montée ;
--   · le jour où un rattachement se fera autrement — un choix explicite, une
--     correction — il primera, sans qu'il faille toucher à ceci.
--
-- ⚠ ET IL N'INVENTE RIEN. Un nom qui ne correspond à aucun circuit connu, ou
-- qui en désignerait deux, laisse `circuit_id` nul. Un roulage sans circuit
-- rattaché est un état parfaitement valide : c'est celui de tous les roulages
-- depuis le premier jour, et le produit fonctionne. Attacher le mauvais circuit
-- ferait, lui, afficher les règles d'un organisateur qui n'est pas le sien —
-- au contrôle technique, ça ne se rattrape pas.
create or replace function roulage_trouve_son_circuit()
returns trigger language plpgsql security invoker set search_path = public as $$
declare trouve uuid;
begin
  if new.circuit_id is not null or new.circuit_nom is null then
    return new;
  end if;
  select c.id into trouve from circuit c
   where nom_pivot(c.nom) = nom_pivot(new.circuit_nom)
   limit 2;
  -- `limit 2` puis un `select` unique : s'il y avait deux candidats, on préfère
  -- ne rien attacher. Le silence est réparable ; le faux rattachement, non.
  if (select count(*) from circuit c
       where nom_pivot(c.nom) = nom_pivot(new.circuit_nom)) = 1 then
    new.circuit_id := trouve;
  end if;
  return new;
end $$;

drop trigger if exists roulage_trouve_son_circuit on roulage;
create trigger roulage_trouve_son_circuit
  before insert or update of circuit_nom, circuit_id on roulage
  for each row execute function roulage_trouve_son_circuit();

-- ── ET CE QUI EXISTE DÉJÀ ──────────────────────────────────────────────────
-- Un déclencheur ne regarde que l'avenir. Les roulages déjà saisis n'ont
-- jamais été rattachés, et ce sont précisément ceux dont le pilote se sert.
update roulage r set circuit_id = c.id
  from circuit c
 where r.circuit_id is null
   and r.circuit_nom is not null
   and nom_pivot(c.nom) = nom_pivot(r.circuit_nom)
   and (select count(*) from circuit c2
         where nom_pivot(c2.nom) = nom_pivot(r.circuit_nom)) = 1;
