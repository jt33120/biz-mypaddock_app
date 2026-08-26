---
id: SPEC-retours-ux-roulages-compte-crash-2026-08-26
status: complete
baseline_commit: 8c41dd7302d7ef1906fcb6ee71fb518c6b73cfec
companions:
  - STORIES.md
  - ../../design/DIRECTION.md
  - ../../planning-artifacts/ux-designs/ux-MyPaddock-2026-08-18/DESIGN.md
  - ../../planning-artifacts/ux-designs/ux-MyPaddock-2026-08-18/EXPERIENCE.md
sources:
  - ../../../_bmad/custom/mypaddock-contraintes.md
  - ../../../_bmad/custom/mypaddock-optique-produit.md
---

> **Canonical contract.** This SPEC and the files in `companions:` are the complete, preservation-validated contract for what to build, test, and validate. Source documents listed in frontmatter are for traceability — consult them only if you need narrative rationale or prose color this contract intentionally omits.

# Saisir vite, relire net

## Why

Le pilote doit pouvoir agir au paddock sans interpréter des titres abstraits ni perdre une saisie, puis relire une saison structurée. Les retours signalent aujourd'hui des accès peu évidents, une liste de roulages non segmentée, des interactions fragiles dans la préparation et un dossier de crash incomplet. Ce lot corrige ces douleurs sans diluer la vérité du carnet ni ajouter une dépendance d'interface.

## Capabilities

- **CAP-1**
  - **intent:** Le pilote peut cocher plusieurs éléments de chargement sans quitter ni fermer la journée.
  - **success:** Deux coches rapprochées sont visibles immédiatement, persistent après rechargement et ne modifient ni la route ni l'historique de navigation.
- **CAP-2**
  - **intent:** Le pilote peut conserver plusieurs objectifs sur un même roulage.
  - **success:** Deux objectifs ajoutés restent distincts après rechargement et chacun peut être retiré indépendamment sous un titre `Objectif`.
- **CAP-3**
  - **intent:** Le pilote accède directement aux trois carnets Atelier, à son compte et à la saisie d'une dépense.
  - **success:** Les trois accès Atelier tiennent sur une ligne mobile, le Compte suit des rubriques conventionnelles et `Noter une dépense` est visible dès l'accueil.
- **CAP-4**
  - **intent:** Le pilote distingue ce qui se passe aujourd'hui, ce qui se prépare et ce qui se relit.
  - **success:** Les roulages apparaissent une seule fois dans `Aujourd'hui`, `À venir` ou `Passés`, avec les futurs en ordre ascendant et les passés en ordre descendant.
- **CAP-5**
  - **intent:** Le pilote qualifie honnêtement le statut de crash d'un roulage.
  - **success:** Au moment de relire le bilan, un roulage distingue `À renseigner`, `Aucun crash` et `Crash documenté`; le choix reste facultatif et seule une chute consignée déclenche le marqueur de crash sur sa carte.
- **CAP-6**
  - **intent:** Le pilote documente un crash avec récit, photos et réparations liées.
  - **success:** Les pièces restent reliées après rechargement et synchronisation, la réparation apparaît dans l'Atelier, et son montant compte une seule fois dans le coût du crash et les agrégats financiers.
- **CAP-7**
  - **intent:** Le propriétaire exporte un carnet de crash exploitable à la revente sans le présenter comme certifié.
  - **success:** L'export conserve les identifiants de liaison et porte explicitement la mention d'historique auto-déclaré.
- **CAP-8**
  - **intent:** Les écrans touchés séparent la consultation de la saisie et nomment directement leurs actions.
  - **success:** Aucun formulaire complet n'est ouvert par défaut, enregistrer ou annuler revient à la lecture, et les actions emploient un verbe suivi de leur objet.

## Constraints

- Le produit reste offline-first : une saisie validée ne dépend pas du réseau et aucune pièce durable ne vit uniquement dans le navigateur.
- Une écriture locale refusée ne disparaît pas en silence : l'optimisme revient à l'état canonique, les choix retirés sont restaurés et une erreur actionnable laisse le contexte ouvert pour réessayer.
- Une écriture durable suivie d'une relecture refusée reste enregistrée : l'écran le dit sans inviter à recréer la même ligne. Les suppressions de photos sont reprises depuis un tombstone jusqu'au nettoyage local et Storage.
- `Non renseigné` ne signifie jamais `Aucun crash`; l'historique demeure auto-déclaré et non certifié.
- Le statut de crash ne bloque aucun parcours et ne déclenche ni rappel, ni notification, ni pression à compléter le carnet.
- Une réparation liée au crash ne peut être comptée qu'une fois dans les budgets de journée et de saison.
- Les surfaces mobiles prises en charge sont vérifiées à 375, 390 et 430 px, avec cibles tactiles d'au moins 44 px.
- La direction Attract Mode, les angles francs, les tokens existants et les icônes pixel custom sont conservés; aucune bibliothèque UI ni emoji dépendant de l'OS n'est ajouté.
- Les mentions nécessaires de sûreté, provenance, sauvegarde et confidentialité ne sont pas raccourcies.
- Le bucket privé de photos et ses politiques limitent chaque compte au préfixe de son propre identifiant.
- Les modifications locales de configuration présentes dans le checkout principal restent hors des commits.

## Non-goals

- Attacher une vidéo au crash dans ce lot.
- Ajouter OCR, import de facture, avatar, pseudo, gravité du crash ou historique certifié.
- Refaire les écrans légaux, Sonde et Récapitulatif qui ne sont pas touchés par les stories.
- Ajouter un design system ou une bibliothèque de composants.

## Success signal

Sur un téléphone, le pilote crée deux objectifs, coche deux éléments de chargement, note une dépense et documente un crash sans quitter involontairement son contexte ni perdre une action. Après rechargement, les données et leurs liens sont intacts, la liste des roulages est immédiatement lisible et les comptes financiers ne doublonnent pas.

## Assumptions

- « Chargement » désigne la checklist de préparation du roulage.
- Le symbole demandé pour le crash est rendu par une icône pixel dédiée accompagnée du texte `Crash`, afin de rester stable entre systèmes.
- Le roulage du jour possède sa section propre et conserve la logique existante qui décide si son ouverture montre préparation ou bilan.
- La vidéo fera l'objet d'un spike séparé avec upload reprenable, quota, formats iPhone, suppression, export et lecture multi-appareil.
