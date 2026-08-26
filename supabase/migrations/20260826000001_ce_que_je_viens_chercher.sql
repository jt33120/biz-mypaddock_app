-- ═══════════════════════════════════════════════════════════════════════════
-- CE QUE JE VIENS CHERCHER — récit 17.5, décision de Julian du 25 août 2026.
-- ═══════════════════════════════════════════════════════════════════════════
--
--   « C'est la pratique d'un sport, un petit disclaimer en bas de l'app devrait
--     suffire. Dans les objectifs, on peut imaginer poser le genou à gauche,
--     faire 1 min 30, travailler les virages à gauche, etc., soit pas trop
--     strict. »
--
-- Une CINQUIÈME catégorie de checklist, et pas une table neuve. Les trois
-- premières disent ce qu'on EMPORTE, la quatrième ce qu'on FAIT AVANT, celle-ci
-- ce qu'on VIENT CHERCHER. Une table neuve aurait coûté schema.ts, une
-- migration, ORDRE, DEPENDANCES, DEFAUTS_SERVEUR, les règles de synchronisation
-- et un essai unitaire — facteur dix pour ranger le même objet : une ligne de
-- texte attachée à un roulage.
--
-- ⚠ ET C'EST LE SEUL ENDROIT QUI PEUT REFUSER LA LIGNE. Une catégorie ajoutée au
-- code sans l'être ici serait acceptée en local, écrite, puis REFUSÉE à l'envoi
-- — et une ligne refusée arrête toute la file derrière elle. C'est l'incident du
-- 19 août, à l'identique. Un essai unitaire confronte cette contrainte à
-- `NOM_CATEGORIE` dans les deux sens : une catégorie que le produit connaît et
-- que le serveur refuse fait rougir le banc, et l'inverse aussi.
alter table checklist_ligne drop constraint if exists checklist_ligne_categorie_check;
alter table checklist_ligne add constraint checklist_ligne_categorie_check
  check (categorie in ('machine', 'equipement', 'conformite', 'preparation', 'objectif'));

comment on column checklist_ligne.categorie is
  'machine / equipement / conformite : ce qu''on EMPORTE. preparation : ce '
  'qu''on FAIT AVANT — seules les lignes ajoutées à la main, le reste est '
  'dérivé et ne se stocke pas. objectif : ce qu''on VIENT CHERCHER (récit '
  '17.5). Aucune de ces lignes ne certifie quoi que ce soit, et une ligne '
  'd''objectif ne se coche jamais : un objectif non coché le soir est un échec '
  'affiché sans qu''aucun libellé ait à le dire.';
