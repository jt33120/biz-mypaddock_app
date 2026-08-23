-- ═══════════════════════════════════════════════════════════════════════════
-- LA PRÉPARATION, LE SKIN D'ÉQUIPEMENT, ET LE MANUEL RAPATRIÉ.
-- Retours de Julian du 23 août 2026.
-- ═══════════════════════════════════════════════════════════════════════════

-- ① LA PRÉPARATION D'UN ROULAGE — « je mets le prochain roulage où je vais
-- aller et j'ai une liste de tâches à faire : checker huile, si accident
-- réparer, payer ».
--
-- Une quatrième catégorie de checklist. Les trois existantes disent ce qu'on
-- EMPORTE ; celle-ci dit ce qu'on FAIT AVANT. Elle ne remplace rien : on peut
-- avoir tout chargé et n'avoir pas payé.
--
-- ⚠ ELLE NE PORTE QUE CE QUE LE PILOTE AJOUTE À LA MAIN. Le gros de la liste est
-- DÉRIVÉ de ce qui est déjà saisi — une pièce achetée non montée, une horloge
-- au-delà de son intervalle, un engagement sans dépense — et un fait dérivé ne
-- se stocke pas : il se recalcule, sinon il ment le jour où la donnée change.
alter table checklist_ligne drop constraint if exists checklist_ligne_categorie_check;
alter table checklist_ligne add constraint checklist_ligne_categorie_check
  check (categorie in ('machine', 'equipement', 'conformite', 'preparation'));

-- ② L'ÉQUIPEMENT A DROIT À SON PORTRAIT — « la combinaison c'est comme un skin,
-- et le casque aussi, c'est à pixeliser ! »
--
-- Exactement les mêmes deux colonnes que `machine`, et pour les mêmes raisons :
-- la photo RÉELLE existe indépendamment du sprite, sinon retirer un portrait
-- laisserait un vide et « le pixel est une présentation, jamais un remplacement
-- destructif » ne serait vrai que dans le texte.
alter table equipement add column if not exists sprite text;
alter table equipement add column if not exists photo_chemin text;

comment on column equipement.sprite is
  'Portrait pixel détouré, PNG en data URI. Nullable : un équipement sans '
  'portrait est un état valide. Produit une fois puis CONSERVÉ — c''est un des '
  'seuls champs du produit dont le calcul coûte de l''argent.';

-- ③ LE MANUEL RAPATRIÉ — décision de Julian, réaffirmée le 23 août : « c'est
-- fait en backend et automatisé, l'utilisateur ne recherche pas lui-même ».
--
-- J'avais opté pour un versement manuel au motif du droit d'auteur. Il tranche
-- l'inverse, et c'est sa décision. CE QUI RESTE DE LA PRÉCAUTION, et qui est le
-- vrai point juridique : la copie va dans l'espace PRIVÉ du pilote qui la
-- demande — bucket `documents`, préfixé par son identifiant, politique qui
-- n'ouvre qu'à lui. Rien n'est mutualisé, rien n'est redistribué : ce n'est pas
-- une bibliothèque, c'est une copie privée faite pour son détenteur.
alter table document add column if not exists source_url text;
alter table document add column if not exists rapatrie_le timestamptz;

alter table document drop constraint if exists document_rapatriement_porte_sa_source;
alter table document add constraint document_rapatriement_porte_sa_source
  check (rapatrie_le is null or source_url is not null);

comment on column document.source_url is
  'D''où vient le fichier quand il n''a pas été versé à la main. Nul pour un '
  'document versé par le pilote — et c''est cette distinction qui doit rester '
  'lisible à l''écran.';
