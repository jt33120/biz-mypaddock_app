-- ═══════════════════════════════════════════════════════════════════════════
-- LES QUATRE TABLES ARRIVÉES APRÈS LES AUTRES N'AVAIENT PAS LEUR INDEX
--
-- Chaque table de pilote est lue sous RLS, donc TOUJOURS avec un filtre sur
-- `pilote_id`. Les tables du premier schéma portent leur index ; les quatre
-- arrivées ensuite — chute, document, horloge, checklist_ligne — ne l'ont
-- jamais eu. À dix lignes ça ne se voit pas ; à une saison de photos et de
-- gestes, la lecture devient un parcours complet à chaque descente.
--
-- Les trois derniers index couvrent des clés étrangères NULLABLES en
-- `on delete set null` : sans eux, retirer une dépense, une photo ou un geste
-- oblige Postgres à parcourir toute la table qui les référence pour trouver
-- qui pointait dessus. Partiels, parce que la colonne est presque toujours
-- nulle et qu'un index qui indexe surtout du vide coûte sans servir.
-- ═══════════════════════════════════════════════════════════════════════════

create index if not exists chute_pilote_id_idx on chute (pilote_id);
create index if not exists document_pilote_id_idx on document (pilote_id);
create index if not exists horloge_pilote_id_idx on horloge (pilote_id);
create index if not exists checklist_ligne_pilote_id_idx on checklist_ligne (pilote_id);

create index if not exists intervention_par_depense on intervention (depense_id)
  where depense_id is not null;
create index if not exists intervention_par_photo on intervention (photo_id)
  where photo_id is not null;
create index if not exists photo_par_geste on photo (geste_id)
  where geste_id is not null;
create index if not exists horloge_par_intervention on horloge (depuis_intervention)
  where depuis_intervention is not null;
