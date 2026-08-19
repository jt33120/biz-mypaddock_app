/**
 * LE REPLI EMBARQUÉ DU RÉFÉRENTIEL.
 *
 * Défaut trouvé en essayant le récit 6.3 : le corpus de conseils vit EN BASE
 * (AD-10, pour qu'un conseil s'ajoute sans redéploiement) — mais le référentiel
 * DESCEND par la synchronisation, donc il n'existe pas tant que rien n'a
 * synchronisé. Or le conseil doit être là dès la première ouverture, hors ligne,
 * avant même qu'un compte existe.
 *
 * Les deux exigences ne s'opposent qu'en apparence. Le repli est embarqué, la
 * base fait autorité dès qu'elle a quelque chose : on peut toujours ajouter un
 * conseil sans redéployer, et le produit n'est jamais muet au premier lancement.
 *
 * La même règle vaudra pour le catalogue de caps.
 */

/** ⚠ CONTENU PROVISOIRE — le récit 6.3 porte « demande Julian » sur le contenu.
 *  Ces énoncés tiennent la clause de FORME et attendent d'être remplacés :
 *  chacun énonce une TECHNIQUE, aucun ne fixe une performance à atteindre, aucun
 *  ne donne un chiffre à battre, et aucun n'est un bandeau de prévention. */
export const CONSEILS_EMBARQUES: readonly string[] = [
  "Le regard va où tu veux aller, jamais sur ce que tu veux éviter. Porte-le à la sortie du virage avant d'y entrer.",
  "Un freinage se relâche progressivement à l'entrée. Lâcher les freins d'un coup redresse la moto au moment où elle doit tomber.",
  "Une seule action à la fois : on freine droit, on tourne, puis on remet les gaz. Les mélanger consomme de l'adhérence deux fois.",
  "Le buste se déplace avant le virage, pas pendant. Bouger sur la moto une fois inclinée déstabilise la trajectoire.",
  "Les bras restent souples. Un guidon tenu ferme empêche la moto de se corriger toute seule sur un revêtement irrégulier.",
  "Le point de corde tardif ouvre la sortie. Tourner tôt oblige à rouvrir l'angle au moment où on voudrait accélérer.",
]

/** Le catalogue de caps embarqué, même motif et même raison que les conseils :
 *  on déclare son premier genou posé au paddock, hors ligne, avant toute
 *  synchronisation. `categorie` est portante — FR-39bis en dépend. */
export const CAPS_EMBARQUES = [
  { code: 'genou_gauche', libelle: 'Genou gauche posé', categorie: 'bravoure' },
  { code: 'genou_droit', libelle: 'Genou droit posé', categorie: 'bravoure' },
  { code: 'coude_gauche', libelle: 'Coude gauche posé', categorie: 'bravoure' },
  { code: 'coude_droit', libelle: 'Coude droit posé', categorie: 'bravoure' },
  { code: 'premier_circuit', libelle: 'Premier roulage sur ce circuit', categorie: 'discipline' },
  { code: 'nuit', libelle: 'Roulage de nuit', categorie: 'discipline' },
  { code: 'pluie', libelle: 'Roulage sous la pluie', categorie: 'discipline' },
] as const satisfies readonly { code: string; libelle: string; categorie: 'bravoure' | 'discipline' }[]
