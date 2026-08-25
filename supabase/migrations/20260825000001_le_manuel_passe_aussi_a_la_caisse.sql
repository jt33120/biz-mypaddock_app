-- ═══════════════════════════════════════════════════════════════════════════
-- LA FONCTION `manuel` APPELAIT SANS RIEN RÉSERVER
--
-- ⚠ TROUVÉ EN CHERCHANT AUTRE CHOSE : une exploration sur la monétisation est
-- allée lire le code, et a relevé que `supabase/functions/manuel/index.ts` ne
-- contient AUCUNE occurrence de `reserver` ni de `generation`.
--
-- La fonction a bien son interrupteur — sans `MISTRAL_API_KEY` elle refuse en
-- `cle_absente` avant tout appel — mais l'interrupteur n'est pas un plafond. Le
-- jour où la clé est posée, et A-FAIRE §5bis dit que ce jour approche, chaque
-- tap sur « chercher le manuel » lance une recherche web facturée PUIS un
-- téléchargement pouvant aller à 25 Mo. Sans compteur, sans plafond, sans une
-- ligne écrite nulle part. Un tap répété est une facture répétée, et personne
-- ne la verrait avant le relevé.
--
-- Le produit a pourtant déjà la règle et le mécanisme : `reserver_generation`
-- réserve AVANT d'appeler, sous verrou consultatif, et refuse quand le solde ou
-- le plafond global est atteint. `sprite` l'utilise. `manuel` ne l'utilisait pas.
--
-- ⚠ CE QUE CETTE MIGRATION NE FAIT PAS, ET C'EST DÉLIBÉRÉ. Elle ne décide
-- AUCUN prix de vente et ne crée aucun solde achetable : le système de crédit
-- est la décision de Julian (A-FAIRE §6), pas une conséquence d'un correctif de
-- sécurité. Ici on ferme un trou, on ne monte pas une caisse.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── ① LE REGISTRE DIT DE QUEL ACTE IL PARLE ───────────────────────────────
-- Sans cette colonne, deux actes de coûts différents se sommaient dans le même
-- total sans qu'on puisse jamais les séparer — et c'est précisément la mesure
-- dont dépend le prix, le jour où il faudra en fixer un.
alter table generation add column if not exists acte text not null default 'sprite';

comment on column generation.acte is
  'Quel acte payant a produit cette ligne. Le registre doit rester lisible acte '
  'par acte : c''est la seule base honnête pour fixer un prix, et un total qui '
  'mélange une image et une recherche web ne mesure rien.';

create index if not exists generation_par_acte on generation (acte, cree_le desc);

-- ─── ② LE PRIX DE L'ACTE EST UNE DONNÉE, PAS UNE CONSTANTE COMPILÉE ────────
-- Même motif que `plafond.cout_unitaire_centimes` : un tarif qui change ne doit
-- pas demander un déploiement.
alter table plafond add column if not exists cout_manuel_centimes integer not null default 3;

comment on column plafond.cout_manuel_centimes is
  'Coût estimé d''une recherche de manuel : un appel avec connecteur web, plus '
  'le téléchargement. ⚠ ESTIMATION, jamais relevée — le premier vrai relevé la '
  'remplace, et c''est ce que le registre sert à produire.';

-- ─── ③ COMBIEN DE MANUELS UN PILOTE PEUT CHERCHER ──────────────────────────
-- Un plafond par compte, distinct du solde de portraits : ce ne sont pas les
-- mêmes actes et ils n'ont pas le même prix. Le solde UNIQUE que Julian décrit
-- dans A-FAIRE §6 les remplacera tous les deux — quand il aura tranché.
alter table pilote add column if not exists quota_manuels integer not null default 5;

comment on column pilote.quota_manuels is
  'Recherches de manuel accordées à ce compte. Écrit par le serveur seul : la '
  'table `pilote` n''a qu''une politique de LECTURE, précisément parce qu''un '
  'PATCH avait pu porter un quota à 32767.';

-- ─── ④ LA RÉSERVATION, SUR LE MODÈLE DE CELLE QUI EXISTE ───────────────────
-- Le verrou consultatif n'est pas un ornement : sans lui, N appels simultanés
-- lisent le même solde et passent tous. C'est le défaut qui avait été trouvé
-- sur `reserver_generation` par une passe adverse, et il ne se rejoue pas ici.
create or replace function reserver_manuel(p_pilote uuid, p_machine uuid)
returns table (reservation uuid, reste integer, quota integer)
language plpgsql security definer set search_path = public as $$
declare
  v_quota   integer;
  v_faits   integer;
  v_cout    integer;
  v_plafond integer;
  v_jour    integer;
  v_id      uuid := gen_random_uuid();
begin
  if p_pilote is null then raise exception 'sans_compte'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_pilote::text || ':manuel', 0));

  select quota_manuels into v_quota from pilote where id = p_pilote;
  if v_quota is null then raise exception 'sans_compte'; end if;

  select count(*) into v_faits
    from generation where pilote_id = p_pilote and acte = 'manuel';
  if v_faits >= v_quota then raise exception 'quota'; end if;

  select cout_manuel_centimes, par_jour_centimes into v_cout, v_plafond
    from plafond where id;

  -- Le plafond des 24 h est GLOBAL et compte TOUS les actes : c'est le filet
  -- qui protège la facture, pas le solde d'un pilote.
  select coalesce(sum(cout_centimes), 0) into v_jour
    from generation where cree_le > now() - interval '24 hours';
  if v_jour + v_cout > v_plafond then raise exception 'plafond_global'; end if;

  insert into generation (id, pilote_id, machine_id, cout_centimes, acte)
  values (v_id, p_pilote, p_machine, v_cout, 'manuel');

  return query select v_id, v_quota - v_faits - 1, v_quota;
end $$;

-- Personne ne l'appelle depuis un navigateur : seule la fonction de bord, avec
-- la clé de service, y a accès.
revoke all on function reserver_manuel(uuid, uuid) from public, anon, authenticated;

-- ─── ⑤ ET LA LIGNE NE SE RÉÉCRIT PAS APRÈS COUP ────────────────────────────
-- `intervention` porte une politique `for all` : un pilote peut donc PATCH ses
-- propres lignes, colonne `cree_le` comprise. Or `cree_le` est posé par le
-- serveur et c'est la seule chose qui date un carnet auto-déclaré — la seule
-- donnée du produit qui ait une valeur devant un tiers.
--
-- Un `revoke update (cree_le)` ferait ÉCHOUER l'envoi ; un déclencheur le
-- NEUTRALISE. La différence n'est pas cosmétique : un PATCH légitime qui
-- inclurait la colonne casserait la file de synchronisation au lieu d'être
-- ignoré, et une file cassée est le pire incident de ce produit.
create or replace function garder_la_date_de_creation()
returns trigger language plpgsql as $$
begin
  new.cree_le := old.cree_le;
  return new;
end $$;

drop trigger if exists intervention_cree_le_immuable on intervention;
create trigger intervention_cree_le_immuable
  before update on intervention
  for each row execute function garder_la_date_de_creation();

comment on function garder_la_date_de_creation() is
  'La date d''écriture au serveur ne se réécrit pas depuis un client. Elle ne '
  'certifie pas que le geste a eu lieu — elle date l''arrivée de la ligne, et '
  'c''est tout ce qu''un carnet auto-déclaré peut honnêtement offrir.';
