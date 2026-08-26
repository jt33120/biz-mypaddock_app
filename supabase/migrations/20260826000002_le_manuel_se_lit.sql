-- ═══════════════════════════════════════════════════════════════════════════
-- LE MANUEL SE LIT — le chaînon que Julian a nommé, 25 août 2026.
-- ═══════════════════════════════════════════════════════════════════════════
--
--   « Recherche et import automatique ET TRAITEMENT et tout. J'ai une moto, je
--     cherche le manuel sur internet, je remplis et prépare tout ce qu'il peut
--     m'apporter sur la moto, mais c'est transparent pour l'utilisateur. »
--
-- La recherche existait déjà — la fonction `manuel` utilise le connecteur
-- `web_search` de Mistral, elle est déployée et active. Le PDF est trouvé,
-- vérifié sur ses octets, rapatrié dans l'espace PRIVÉ du pilote. Et là, plus
-- rien : personne ne le LISAIT. Aucun intervalle n'en sortait, aucune horloge ne
-- s'en remplissait, et « vérifier l'huile » restait indérivable.
--
-- ⚠ CE QUE LE MANUEL PEUT DONNER, ET CE QU'IL NE PEUT PAS.
--
-- Il donne les POSTES réels de CETTE moto — vidange, filtre à huile, plaquettes,
-- chaîne, liquide de frein, bougies — et leur PÉRIODICITÉ TELLE QU'IL L'ÉCRIT :
-- « tous les 6 000 km ou 12 mois ».
--
-- Il ne donne PAS un intervalle en ROULAGES, et c'est tout le sujet. Une journée
-- de piste, ce sont 200 à 300 km selon le circuit, le groupe et la météo — et
-- l'usure d'un moteur en piste n'a pas le même rapport au kilomètre que sur
-- route. Convertir « 6 000 km » en « 24 roulages » serait une INTERPRÉTATION, et
-- FR-44 l'interdit précisément là où elle porterait sur la sécurité d'une
-- machine : « le barème est TRANSCRIT, JAMAIS INTERPRÉTÉ ».
--
-- D'où cette colonne, et d'où le fait qu'elle soit du TEXTE et pas un nombre :
-- `intervalle_roulages` reste NUL, l'horloge compte sans jamais échoir (FR-44),
-- et ce que le manuel dit est rapporté À LA LETTRE, à côté du compteur, avec sa
-- source. Le pilote lit « 6 000 km ou 12 mois » et sait ce qu'il en fait ; le
-- produit ne le sait pas et ne fait pas semblant.
alter table horloge add column if not exists barometre text;

comment on column horloge.barometre is
  'La périodicité TELLE QUE LE MANUEL L''ÉCRIT — « tous les 6 000 km ou '
  '12 mois ». Du texte, transcrit, jamais converti : une journée de piste vaut '
  '200 à 300 km selon le circuit et le groupe, et traduire des kilomètres en '
  'roulages serait une interprétation sur la sécurité d''une machine (FR-44). '
  '`intervalle_roulages` reste donc nul quand ce champ vient du manuel, et '
  'l''horloge compte sans jamais échoir. Porte sa source dans `source_url` et '
  'son `extrait_par_ia`.';
