-- ═══════════════════════════════════════════════════════════════════════════
-- UN SEUL SOLDE, EN CRÉDITS — et plus un centime affiché au pilote.
--
-- Julian, 3 septembre 2026 : « Ne pas marquer 16 cts, faire un système de
-- crédit et ce compte test en illimité, avec un compteur en haut à gauche qui
-- peut se faire rajouter. Un crédit couvre un appel IA en gros sur la clé
-- Gemini, la clé Mistral gratuite pour le moment. »
--
-- C'est la décision qu'A-FAIRE §6 attendait, et elle ferme les deux premiers
-- manques que cette entrée nommait déjà :
--
--   ① « Un solde générique au lieu d'un quota par fonctionnalité. » Il y en
--      avait DÉJÀ deux — `quota_sprites` (3) et `quota_manuels` (5) — et §6
--      disait exactement pourquoi c'était un défaut : « on aurait deux
--      portefeuilles là où le pilote en voit un ». L'analyse de vidéo arrivait
--      avec le troisième.
--   ② « Un prix en crédits par acte » : une génération d'image n'a aucune
--      raison de coûter autant qu'une minute de vidéo analysée.
--
-- ⚠ CE QUE CETTE MIGRATION NE FAIT TOUJOURS PAS : vendre. Le compte marchand
-- reste la décision de Julian (§6 ③), et le prix de vente se fixera sur le
-- registre RÉEL — `generation.cout_centimes` continue donc d'enregistrer les
-- centimes vrais, acte par acte. Ce qui change, c'est que le pilote ne les lit
-- plus : il lit des crédits. Les deux unités coexistent parce qu'elles ne
-- servent pas au même : le centime mesure, le crédit se dépense.
--
-- ⚠ ET LE SOLDE NE SE STOCKE PAS, IL SE DÉRIVE. Un entier décrémenté est un
-- entier qui dérive : deux chemins d'écriture, et un jour la somme ne
-- correspond plus aux actes. Le solde est donc CALCULÉ, exactement comme le
-- quota l'était déjà — accueil + accordés − consommés. La même raison qui a
-- fait de `generation` un registre sans politique d'insertion : « un compteur
-- que le compté peut écrire ne compte rien ».
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── ① LE PRIX D'UN ACTE, EN CRÉDITS, ET EN BASE ───────────────────────────
-- Même motif que `cout_unitaire_centimes` juste à côté : un tarif qui change ne
-- doit pas demander un déploiement (AD-10).
alter table plafond add column if not exists credits_sprite  integer not null default 1;
alter table plafond add column if not exists credits_manuel  integer not null default 0;
alter table plafond add column if not exists credits_accueil integer not null default 3;

comment on column plafond.credits_sprite is
  'Crédits consommés par un portrait pixel. Un crédit couvre un appel IA sur la '
  'clé Gemini — c''est la définition posée par Julian, et c''est elle qui fait '
  'que 1 est la valeur juste ici et non un tarif à deviner.';

comment on column plafond.credits_manuel is
  'Crédits consommés par une recherche de manuel. ZÉRO : la clé Mistral est '
  'gratuite pour le moment. ⚠ Ce n''est pas « cet acte est gratuit », c''est '
  '« cet acte ne coûte rien AUJOURD''HUI » — le jour où Mistral facture, ce '
  'nombre passe à 1 sans redéploiement, et c''est tout l''objet de le mettre ici '
  'plutôt que dans le code. Le plafond global des 24 h, lui, borne déjà cet acte '
  'en centimes réels : gratuit en crédits ne veut pas dire sans filet.';

comment on column plafond.credits_accueil is
  'Crédits offerts à tout compte, sans qu''aucune ligne ne soit écrite pour eux. '
  'Reprend le 3 de l''ancien `quota_sprites` : un pilote qui avait trois '
  'portraits en a trois après cette migration, et la promesse déjà affichée '
  'reste vraie.';

-- ─── ② CE QU'UNE LIGNE DU REGISTRE A CONSOMMÉ ──────────────────────────────
-- `cout_centimes` mesure ce que ça a coûté à Julian ; `credits` mesure ce que ça
-- a coûté au pilote. Confondre les deux, c'est soit facturer un prix d'achat,
-- soit mesurer un prix de vente — et aucune des deux ne renseigne l'autre.
alter table generation add column if not exists credits integer not null default 1;

comment on column generation.credits is
  'Crédits débités au pilote pour cette ligne, figés au moment de l''acte. '
  '⚠ FIGÉS, ET C''EST LE POINT : relire le tarif courant pour recalculer un '
  'solde ferait bouger le passé à chaque changement de prix — un pilote verrait '
  'son solde chuter sans avoir rien fait.';

-- ─── ③ LES CRÉDITS AJOUTÉS — un registre, pas un entier ────────────────────
-- « Un compteur en haut à gauche qui peut se faire rajouter » : voici par où on
-- rajoute. Une table plutôt qu'un `update`, pour la raison qui a fait exister
-- `generation` — sans trace, `credits = 40` est un nombre que personne ne peut
-- expliquer, et l'argent sans trace est précisément ce que ce dépôt refuse.
create table if not exists credit_accorde (
  id         uuid primary key default gen_random_uuid(),
  pilote_id  uuid not null references pilote(id) on delete cascade,
  credits    integer not null,
  -- Pourquoi. « achat », « geste commercial », « compte de test », « remboursement
  -- d'un appel raté » : le jour où un solde surprend, c'est la seule colonne qui
  -- répond.
  motif      text not null,
  cree_le    timestamptz not null default now()
);
create index if not exists credit_accorde_par_pilote on credit_accorde (pilote_id, cree_le desc);

alter table credit_accorde enable row level security;
-- LECTURE SEULE, ET DE SOI SEUL. Aucune politique d'insertion, d'update ni de
-- delete : c'est la même garde que sur `generation`, et elle vient du défaut
-- réel trouvé le 19 août — un `PATCH /rest/v1/pilote` avait pu porter un quota
-- à 32767, soit 5 242 € en un appel. Un solde que le compté peut créditer n'est
-- pas un solde, c'est un bouton.
drop policy if exists "un pilote lit ses credits" on credit_accorde;
create policy "un pilote lit ses credits" on credit_accorde
  for select using (pilote_id = (select auth.uid()));

comment on table credit_accorde is
  'Les crédits ajoutés à un compte, ligne par ligne, avec leur motif. Lecture '
  'de soi seul, écriture par le rôle de service uniquement : voir `crediter()`.';

-- ─── ④ LE COMPTE DE TEST — illimité, et nommé comme tel ────────────────────
alter table pilote add column if not exists credits_illimites boolean not null default false;

comment on column pilote.credits_illimites is
  'Ce compte ne consomme aucun crédit. Destiné au compte de test de Julian : '
  'éprouver le produit ne doit pas se payer, et surtout ne doit pas s''arrêter '
  'au bout de trois essais. ⚠ IL NE LÈVE QUE LE SOLDE, JAMAIS LE PLAFOND '
  'GLOBAL DES 24 H : ce plafond-là protège la FACTURE, pas le quota, et une '
  'boucle qui part en vrille sur un compte illimité coûterait de l''argent réel. '
  'Il se relève en base (`plafond.par_jour_centimes`) si le test l''exige. '
  'Écrit par le rôle de service seul — `pilote` n''a qu''une politique de lecture.';

-- ─── ⑤ LE SOLDE, DÉRIVÉ ────────────────────────────────────────────────────
create or replace function solde_credits(p_pilote uuid)
returns integer
language sql stable security definer set search_path = public as $$
  select
    (select credits_accueil from plafond where id)
    + coalesce((select sum(credits) from credit_accorde where pilote_id = p_pilote), 0)
    - coalesce((select sum(credits)  from generation     where pilote_id = p_pilote), 0)
$$;

comment on function solde_credits is
  'Accueil + accordés − consommés. Aucune colonne ne le stocke : un solde stocké '
  'et un registre finissent par se contredire, et c''est le registre qui a raison.';

-- ─── ⑥ CE QUE LE PILOTE PEUT LIRE DE SON PROPRE SOLDE ──────────────────────
-- ⚠ UNE FONCTION ET NON UNE VUE, PARCE QU'ELLE NE PREND AUCUN PARAMÈTRE.
-- L'identité vient du jeton, comme dans `assurer_pilote()` : un appelant ne peut
-- lire que SON solde, et il n'y a aucun argument par lequel demander celui d'un
-- autre. C'est ce qui permet de l'ouvrir au rôle `authenticated` sans ouvrir
-- quoi que ce soit d'autre.
create or replace function mon_solde()
returns table (reste integer, illimite boolean, accueil integer, consommes integer)
language plpgsql stable security definer set search_path = public as $$
declare v_moi uuid := auth.uid();
begin
  if v_moi is null then raise exception 'sans_compte'; end if;
  return query select
    solde_credits(v_moi),
    coalesce((select credits_illimites from pilote where id = v_moi), false),
    (select credits_accueil from plafond where id),
    coalesce((select sum(credits)::integer from generation where pilote_id = v_moi), 0);
end $$;

revoke all on function mon_solde() from public, anon;
grant execute on function mon_solde() to authenticated;

comment on function mon_solde() is
  'Le solde du pilote appelant, lu du jeton. SANS PARAMÈTRE à dessein : il n''y '
  'a aucun moyen de demander le solde d''un autre. Lecture pure — elle ne crédite '
  'ni ne débite rien.';

-- ─── ⑦ AJOUTER DES CRÉDITS ─────────────────────────────────────────────────
create or replace function crediter(p_pilote uuid, p_credits integer, p_motif text)
returns integer
language plpgsql security definer set search_path = public as $$
begin
  if p_pilote is null then raise exception 'sans_compte'; end if;
  -- Un motif vide rendrait le registre muet, donc inutile. Il est exigé.
  if coalesce(trim(p_motif), '') = '' then raise exception 'sans_motif'; end if;
  if p_credits = 0 then raise exception 'sans_effet'; end if;

  insert into credit_accorde (pilote_id, credits, motif)
  values (p_pilote, p_credits, trim(p_motif));

  return solde_credits(p_pilote);
end $$;

-- Personne ne s'en approche depuis un navigateur.
revoke all on function crediter(uuid, integer, text) from public, anon, authenticated;

comment on function crediter is
  'Ajoute des crédits à un compte et retourne le nouveau solde. Un montant '
  'NÉGATIF est accepté — c''est ainsi qu''on reprend un geste commercial ou qu''on '
  'corrige une erreur, et le registre garde alors la trace des deux sens. '
  'Réservée au rôle de service.';

-- ─── ⑧ LES DEUX RÉSERVATIONS PASSENT AU CRÉDIT ─────────────────────────────
-- Elles gardent leur forme éprouvée — verrou consultatif d'abord, réservation
-- AVANT l'appel, plafond global des 24 h en centimes réels — et ne changent que
-- d'unité pour la part du pilote.
create or replace function reserver_generation(p_pilote uuid, p_machine uuid)
returns table (reservation uuid, reste integer, quota integer)
language plpgsql security definer set search_path = public as $$
declare
  v_illimite boolean;
  v_prix     integer;
  v_solde    integer;
  v_cout     integer;
  v_jour     integer;
  v_plafond  integer;
  v_id       uuid;
begin
  if p_pilote is null then raise exception 'sans_compte'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_pilote::text, 0));

  select credits_illimites into v_illimite from pilote where id = p_pilote;
  if v_illimite is null then raise exception 'sans_compte'; end if;

  select par_jour_centimes, cout_unitaire_centimes, credits_sprite
    into v_plafond, v_cout, v_prix from plafond where id;

  -- Le compte de test ne paie pas de crédit. Il reste sous le plafond global :
  -- « illimité » porte sur le solde, pas sur la facture.
  if v_illimite then v_prix := 0; end if;

  v_solde := solde_credits(p_pilote);
  if not v_illimite and v_solde < v_prix then raise exception 'quota'; end if;

  select coalesce(sum(cout_centimes), 0) into v_jour
    from generation where cree_le > now() - interval '24 hours';
  if v_jour + v_cout > v_plafond then raise exception 'plafond_global'; end if;

  insert into generation (pilote_id, machine_id, version, modele, cout_centimes, credits, acte)
    values (p_pilote, p_machine, 'v6', 'gemini-3-pro-image', v_cout, v_prix, 'sprite')
    returning id into v_id;

  -- `quota` ne dit plus un plafond : il dit CE QUE L'ACTE A COÛTÉ en crédits.
  -- Un plafond n'existe plus — il n'y a qu'un solde, et c'est `reste` qui le
  -- porte, déjà diminué de cet acte.
  return query select v_id, solde_credits(p_pilote), v_prix;
end $$;

revoke all on function reserver_generation(uuid, uuid) from public, anon, authenticated;

comment on function reserver_generation is
  'Réserve un portrait : verrou, solde en crédits, plafond global en centimes, '
  'insertion — dans UNE transaction. Rend le solde APRÈS l''acte et le prix payé. '
  'Réservée au rôle de service.';

create or replace function reserver_manuel(p_pilote uuid, p_machine uuid)
returns table (reservation uuid, reste integer, quota integer)
language plpgsql security definer set search_path = public as $$
declare
  v_illimite boolean;
  v_prix     integer;
  v_solde    integer;
  v_cout     integer;
  v_plafond  integer;
  v_jour     integer;
  v_id       uuid := gen_random_uuid();
begin
  if p_pilote is null then raise exception 'sans_compte'; end if;

  perform pg_advisory_xact_lock(hashtextextended(p_pilote::text || ':manuel', 0));

  select credits_illimites into v_illimite from pilote where id = p_pilote;
  if v_illimite is null then raise exception 'sans_compte'; end if;

  select cout_manuel_centimes, par_jour_centimes, credits_manuel
    into v_cout, v_plafond, v_prix from plafond where id;
  if v_illimite then v_prix := 0; end if;

  v_solde := solde_credits(p_pilote);
  if not v_illimite and v_solde < v_prix then raise exception 'quota'; end if;

  -- Le plafond des 24 h est GLOBAL et compte TOUS les actes, y compris ceux qui
  -- ne coûtent aucun crédit : c'est le filet qui protège la facture. Un acte
  -- gratuit pour le pilote peut très bien être payant pour Julian.
  select coalesce(sum(cout_centimes), 0) into v_jour
    from generation where cree_le > now() - interval '24 hours';
  if v_jour + v_cout > v_plafond then raise exception 'plafond_global'; end if;

  insert into generation (id, pilote_id, machine_id, cout_centimes, credits, acte)
  values (v_id, p_pilote, p_machine, v_cout, v_prix, 'manuel');

  return query select v_id, solde_credits(p_pilote), v_prix;
end $$;

revoke all on function reserver_manuel(uuid, uuid) from public, anon, authenticated;

-- ─── ⑨ LES DEUX ANCIENS PORTEFEUILLES DISPARAISSENT ────────────────────────
-- Les laisser en place serait pire que de les retirer : deux colonnes qu'aucune
-- fonction ne lit plus, portant des nombres qui ressemblent à des soldes. Le
-- premier à les relire croirait tenir la règle.
alter table pilote drop column if exists quota_sprites;
alter table pilote drop column if exists quota_manuels;

-- ─── ⑩ LE COMPTE DE TEST ───────────────────────────────────────────────────
-- Le seul compte du produit à ce jour, et c'est celui de Julian : il éprouve le
-- produit, et l'éprouver ne doit pas s'arrêter au troisième portrait. Écrit par
-- identifiant et non par adresse — une adresse se change, un identifiant non.
update pilote set credits_illimites = true
 where id = '4ab5b551-e695-41f9-9f90-8009887574e2';
