-- ═══════════════════════════════════════════════════════════════════════════
-- LA TENUE DU JOUR — moto, casque, combinaison, sur la journée de roulage.
--
-- « on peut lier à la journée de roule 1) la moto quand il y en a plusieurs,
--   2) le casque 3) la combi » — Julian, 1er septembre 2026.
--
-- La moto était DÉJÀ liée (`roulage.machine_id`, migration d'origine). Ce qui
-- manquait est le reste de la tenue, et une façon de savoir QUOI est un casque.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── ① CE QU'EST UNE PIÈCE D'ÉQUIPEMENT, EN PLUS DE SA CATÉGORIE ───────────
-- ⚠ LA COLONNE S'APPELLE `genre` ET SURTOUT PAS `categorie`, ET CE N'EST PAS UN
-- GOÛT DE VOCABULAIRE. `equipement.categorie` porte déjà 'protection', qui
-- couvre d'un seul mot « casque, combinaison, dorsale, gants, bottes »
-- (20260819000017:74-81) : il ne peut donc pas alimenter deux sélecteurs
-- séparés. Élargir cette contrainte-là dans une migration plus récente serait
-- pourtant le geste naturel, et il ferait rougir un essai QUI NE PARLE PAS
-- D'ÉQUIPEMENT : `banc-rendu/unite/essais.ts` balaie TOUTES les migrations à la
-- recherche d'une contrainte de catégories, trie par nom de fichier et retient
-- LA DERNIÈRE, puis la compare aux catégories de CHECKLIST. Une contrainte
-- d'équipement plus récente que 20260826000001 se ferait donc comparer à
-- `NOM_CATEGORIE` de src/db/checklist.ts, et le banc accuserait la checklist
-- d'un défaut posé ici. Le message serait faux, le fichier serait faux, et on
-- chercherait longtemps.
--
-- `genre` sort de cette regex, et suit le précédent déjà en place dans le
-- schéma : `photo.genre` ('photo' | 'facture'), `document.genre` ('manuel'…).
--
-- Il est NULLABLE et le reste : une glacière, une caisse à outils et une paire
-- de gants n'ont pas de genre, et leur en inventer un pour faire joli remplirait
-- la base de valeurs que personne n'a saisies.
alter table equipement add column if not exists genre text;

alter table equipement drop constraint if exists equipement_genre_connu;
alter table equipement add constraint equipement_genre_connu
  check (genre is null or genre in ('casque', 'combinaison'));

comment on column equipement.genre is
  'Ce que la pièce EST, quand le produit a besoin de la distinguer : casque ou '
  'combinaison. Distinct de `categorie`, qui range la dépense et dont '
  '''protection'' couvre les deux. Nul pour tout le reste, et c''est la '
  'majorité — une glacière n''a pas de genre.';

create index if not exists equipement_par_genre on equipement (pilote_id, genre)
  where genre is not null;

-- ─── ② LA TENUE PORTÉE CE JOUR-LÀ ──────────────────────────────────────────
-- ⚠ `on delete set null`, JAMAIS `cascade`. Vendre son casque ne doit pas
-- effacer les journées où on l'a porté : la journée a eu lieu, elle reste. La
-- même règle que la photo de chute, pour la même raison — une correction ou une
-- vente ne coûte jamais un fait déjà consigné.
--
-- Les deux liens sont FACULTATIFS, comme `machine_id` l'est déjà : une journée
-- sans tenue déclarée est un état valide et le restera. Le produit ne relance
-- personne pour compléter un carnet (AD-2), et une tenue non déclarée n'est pas
-- une tenue absente — c'est une tenue dont on n'a rien dit.
alter table roulage add column if not exists casque_id uuid
  references equipement(id) on delete set null;
alter table roulage add column if not exists combinaison_id uuid
  references equipement(id) on delete set null;

comment on column roulage.casque_id is
  'Le casque porté ce jour-là. Facultatif : une journée sans tenue déclarée est '
  'un état valide. `set null` à la suppression — vendre son casque n''efface '
  'pas les journées où on l''a porté.';
comment on column roulage.combinaison_id is
  'La combinaison portée ce jour-là. Mêmes règles que le casque.';

create index if not exists roulage_par_casque on roulage (casque_id)
  where casque_id is not null;
create index if not exists roulage_par_combinaison on roulage (combinaison_id)
  where combinaison_id is not null;
