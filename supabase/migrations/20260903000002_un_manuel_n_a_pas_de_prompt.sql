-- ═══════════════════════════════════════════════════════════════════════════
-- `reserver_manuel` NE POUVAIT PAS RÉSERVER — et personne ne pouvait le savoir.
--
-- ⚠ TROUVÉ EN VÉRIFIANT AUTRE CHOSE. En éprouvant que le contrat des deux
-- réservations survivait au passage aux crédits, l'appel a levé :
--
--     null value in column "version" of relation "generation"
--     violates not-null constraint
--
-- `generation.version` et `generation.modele` sont `not null` sans défaut. La
-- fonction `reserver_manuel`, écrite le 25 août, n'en renseigne aucun des deux :
--
--     insert into generation (id, pilote_id, machine_id, cout_centimes, acte)
--
-- Donc CHAQUE recherche de manuel aurait échoué, en 500, avant d'appeler
-- Mistral. Le défaut est là depuis le premier jour de cette fonction et n'a
-- jamais pu se montrer : `MISTRAL_API_KEY` n'a jamais été posée (A-FAIRE §5bis),
-- donc la fonction refuse en `cle_absente` AVANT d'atteindre la réservation.
-- C'est exactement la même forme de piège que le `mimeType: 'image/jpeg'` écrit
-- en dur côté sprite — un défaut qu'un interrupteur cache, et que le PREMIER
-- usage réel découvre.
--
-- ⚠ LE CORRECTIF NE VA PAS DANS LA FONCTION, IL VA DANS LE SCHÉMA. On pourrait
-- faire écrire à `reserver_manuel` un `version` et un `modele` quelconques. Ce
-- serait remplir deux colonnes pour qu'elles cessent de refuser, avec des
-- valeurs qui ne veulent rien dire : une recherche de manuel n'a PAS de version
-- de prompt et n'a pas de grille — ces deux colonnes existent pour dire QUEL
-- PROMPT a dessiné une image, et c'est une question qui n'a pas de sens ici.
--
-- Une colonne obligatoire pour des lignes auxquelles elle ne s'applique pas est
-- le vrai défaut. Elle devient donc obligatoire LÀ OÙ ELLE A UN SENS, et
-- seulement là — ce qui RENFORCE la garde côté sprite au lieu de la relâcher :
-- avant, `not null` acceptait `version = ''` ; maintenant un sprite doit dire
-- son prompt ET son modèle, et une ligne de sprite muette est refusée par la
-- base.
-- ═══════════════════════════════════════════════════════════════════════════

alter table generation alter column version drop not null;
alter table generation alter column modele  drop not null;

alter table generation drop constraint if exists generation_sprite_dit_son_prompt;
alter table generation add constraint generation_sprite_dit_son_prompt
  check (acte <> 'sprite' or (version is not null and modele is not null));

comment on column generation.version is
  'La version du prompt qui a dessiné cette image. Obligatoire POUR UN SPRITE '
  '(contrainte `generation_sprite_dit_son_prompt`), nulle pour les actes qui ne '
  'dessinent rien — une recherche de manuel n''a pas de prompt de dessin.';

comment on column generation.modele is
  'Le modèle appelé. Obligatoire pour un sprite, nul pour les actes qui n''en '
  'nomment pas un dans le registre. ⚠ Pour le manuel, le modèle vit dans la '
  'variable `MISTRAL_MODELE` et peut changer sans redéploiement : le figer ici '
  'écrirait un nom que rien ne garantit exact. Ce que le registre doit tenir, '
  'c''est `acte` et `cout_centimes`, et il les tient.';

comment on constraint generation_sprite_dit_son_prompt on generation is
  'Un sprite dit toujours de quel prompt et de quel modèle il sort. C''est ce '
  'qui interdit de spritifier sur une grille que le modèle n''a jamais reçue, et '
  'la seule trace qui permette de rejouer une génération.';
