-- ═══════════════════════════════════════════════════════════════════════════
-- UNE DÉPENSE PORTE SON JOUR — récit 19.2.
--
-- « Budget c'est pas correct : le coût est de 2180 mais le budget est de
--   500/mois. » — Julian, 25 août 2026. Et sa décision, à la question fermée :
--   LES DEUX — « un plafond annuel ET un repère mensuel ».
--
-- Le plafond et le repère ne coûtent aucune colonne : l'un existe déjà
-- (`budget_saison`), l'autre s'en dérive (plafond ÷ 12, src/db/budget.ts). Ce
-- qui manquait vraiment, c'est le MOIS D'UNE DÉPENSE — et il ne manquait pas un
-- peu : la table ne gardait du temps que `saison_annee`. « Ce que j'ai dépensé
-- en juillet » n'était donc pas imprécis, il était INCALCULABLE. Les deux
-- chemins d'écriture recevaient la date, en tiraient l'année, et jetaient le
-- reste : le mois était détruit à l'écriture, pas simplement non affiché.
--
-- ⚠ ON RANGE LE JOUR, PAS LE MOIS. Le mois est un fait DÉRIVÉ et le produit ne
-- stocke pas ce qu'il dérive : une colonne `mois` posée à côté de `date_jour`
-- serait une seconde vérité, et c'est toujours la copie qu'on oublie de corriger
-- le jour où l'on corrige une date.
--
-- ⚠ NULLABLE, ET POUR TOUJOURS. Les dépenses déjà saisies n'ont aucun jour et
-- n'en auront jamais. Leur en inventer un — celui du roulage quand il y en a un,
-- l'instant de l'uuid, le 1er janvier — fabriquerait une donnée que personne n'a
-- donnée, et la rendrait indiscernable d'une vraie. L'écran dit « Sans mois »,
-- exactement comme il dit déjà « Sans poste » (Budget.tsx) : le précédent existe,
-- il a été posé pour la colonne `poste` le 19 août, et il vaut ici mot pour mot.
--
-- ⚠ ET SURTOUT : PAS DE `not null default`. Une colonne que le serveur déclare
-- `not null default …` et que le local n'écrit pas est une MINE — la ligne part
-- avec un nul explicite, Postgres répond 23502, et toute la file d'envoi reste
-- derrière. Deux d'entre elles ont vécu six jours dans ce produit
-- (`chrono_visible`, `partage`). Une colonne nullable n'en est pas une, et
-- `DEFAUTS_SERVEUR` n'a donc rien à apprendre ici — un essai unitaire
-- reconstruit cette liste depuis les migrations et le vérifierait de lui-même.
-- ═══════════════════════════════════════════════════════════════════════════

alter table depense add column if not exists date_jour date;

comment on column depense.date_jour is
  'Le jour où la dépense a été payée. Le MOIS s''en dérive et ne se range nulle '
  'part. Nullable pour toujours : les dépenses saisies avant cette colonne n''ont '
  'pas de jour, et leur en inventer un fabriquerait une donnée que le pilote n''a '
  'pas donnée — l''écran dit « sans mois » plutôt que de les ranger au hasard.';

-- ─── LA DATE ET LA SAISON NE PEUVENT PLUS DIVERGER ─────────────────────────
-- `saison_annee` est fixée À LA SAISIE et jamais recalculée (AD-18) : c'est elle
-- qui classe la dépense, et elle a le droit de ne plus bouger. Mais elle est
-- écrite par le client, à partir de la même date que `date_jour` — donc rien,
-- côté serveur, n'empêchait un client fautif d'envoyer un jour de juillet 2026
-- dans la saison 2025. La dépense serait alors visible dans une saison et
-- comptée dans le mois d'une autre : deux totaux justes séparément, faux
-- ensemble, et rien pour le signaler.
--
-- La contrainte ne touche AUCUNE ligne existante : `date_jour is null` la
-- satisfait, et c'est le cas de toutes.
alter table depense drop constraint if exists depense_jour_dans_sa_saison;
alter table depense add constraint depense_jour_dans_sa_saison
  check (date_jour is null or extract(year from date_jour) = saison_annee);

-- La lecture par mois passe par le pilote et la date. Sans cet index, elle
-- balaie toutes les dépenses du pilote pour n'en garder qu'une saison — sans
-- conséquence sur un carnet de onze journées, et ce n'est pas une raison pour
-- écrire une lecture qui ne tient pas.
create index if not exists depense_par_jour on depense (pilote_id, date_jour);
