-- ═══════════════════════════════════════════════════════════════════════════
-- CORRECTION DU MOTIF — pas de la structure.
--
-- La migration précédente ajoutait `pilote_id` sur session, tour et intervention
-- en invoquant une contrainte du moteur : « une règle PowerSync ne fait pas de
-- jointure ». C'ÉTAIT FAUX. Vrai des anciens `bucket_definitions`, faux des Sync
-- Streams en édition 3, qui acceptent les sous-requêtes, les INNER JOIN et les
-- CTE. Le motif écrit dans les commentaires était donc une erreur, et un
-- commentaire qui ment sur la raison d'être d'une colonne est pire qu'une
-- colonne de trop : il fait prendre la mauvaise décision six mois plus tard.
--
-- LES COLONNES RESTENT, sur un motif plus faible mais réel :
--   · le flux descendant s'écrit à plat, sans sous-requête imbriquée à trois
--     niveaux pour atteindre un tour à travers sa session et son roulage ;
--   · le connecteur appose le propriétaire de la même façon sur toutes les
--     tables, sans cas particulier à retenir ;
--   · les politiques RLS exigent toujours la cohérence avec le parent, donc la
--     dénormalisation ne peut pas diverger de l'ascendance.
--
-- Ce n'est plus une nécessité, c'est une simplification assumée. Revenir au
-- modèle strictement normalisé reste possible et coûterait une migration.
-- ═══════════════════════════════════════════════════════════════════════════

comment on column session.pilote_id is
  'Dénormalisé pour que le flux descendant s''écrive à plat, et pour que le connecteur n''ait aucun cas particulier. Ce n''est PAS une contrainte du moteur : les Sync Streams acceptent les sous-requêtes. Doit toujours valoir celui du roulage parent — la politique RLS l''exige.';
comment on column tour.pilote_id is
  'Dénormalisé, même motif que session.pilote_id. Doit toujours valoir celui de la session parente.';
comment on column intervention.pilote_id is
  'Dénormalisé, même motif que session.pilote_id. Doit toujours valoir celui de la machine parente.';
