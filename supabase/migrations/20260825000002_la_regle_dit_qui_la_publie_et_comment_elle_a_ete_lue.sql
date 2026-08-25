-- ═══════════════════════════════════════════════════════════════════════════
-- CE QUE LA RÈGLE PERD EN CHEMIN — relecture de l'épique 13, 25 août 2026.
-- ═══════════════════════════════════════════════════════════════════════════
--
-- FR-50 demande deux mentions, et le produit en perdait deux.
--
-- ① QUI L'A PUBLIÉE. La ligne affichée disait « publié le 2026-03-12 » — une
--    date au format machine, et personne. Or `regle_organisateur` SAIT qui :
--    elle porte `organisateur_id` et `circuit_id`. La mention se perdait à la
--    composition, qui ne recopiait que `libelle`, `source_url` et `publie_le`.
--
-- ② QU'ELLE A ÉTÉ LUE PAR UNE MACHINE. `regle_organisateur.extrait_par_ia`
--    existe depuis le 19 août et vaut `true` sur tout ce que la récolte écrit
--    (recolte/index.mjs). Mais `checklist_ligne` n'avait aucune colonne pour
--    l'accueillir : la mention se perdait EXACTEMENT au moment où elle atteint
--    un humain — et ce texte-là engage le passage au contrôle technique.
--    C'est le garde-fou QO-6 du PRD, et il ne tenait que dans le référentiel.
--
-- Les deux colonnes sont DÉNORMALISÉES à dessein : la ligne de checklist est
-- une TRACE, et une trace dit ce qui était vrai le jour où elle a été prise. Un
-- organisateur renommé en 2028 ne doit pas réécrire ce qui a été chargé en 2026.
--
-- Nullables toutes les deux : une ligne de chargement — mon casque — ne vient
-- d'aucun organisateur et n'a été lue par aucune machine. `null` y est l'état
-- juste, et le distingue de `false`, qui voudrait dire « transcrite à la main ».
alter table checklist_ligne add column if not exists publie_par text;
alter table checklist_ligne add column if not exists extrait_par_ia boolean;

comment on column checklist_ligne.publie_par is
  'Le nom de l''organisateur — ou du circuit à défaut — tel qu''il était au '
  'moment de la composition. Dénormalisé : une trace dit ce qui était vrai ce '
  'jour-là. Nul pour une ligne de chargement, qui ne vient de personne.';

comment on column checklist_ligne.extrait_par_ia is
  'La règle a-t-elle été RECONSTRUITE par une extraction automatique plutôt que '
  'transcrite ? Doit s''afficher au pilote : une extraction n''est pas une '
  'transcription (QO-6). Nul pour une ligne qui ne vient d''aucune règle.';

-- ⚠ LA CONTRAINTE S'ÉTEND. Une ligne de conformité portait déjà sa source et sa
-- date ; elle doit désormais dire aussi COMMENT elle a été lue. Sans ça, une
-- règle extraite par une machine pourrait entrer en se présentant, par le
-- silence, comme une transcription — et le silence, ici, penche du mauvais côté.
alter table checklist_ligne drop constraint if exists conformite_porte_sa_source;
alter table checklist_ligne add constraint conformite_porte_sa_source check (
  categorie <> 'conformite'
  or (source_url is not null and publie_le is not null and extrait_par_ia is not null)
);
