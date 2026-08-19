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

/**
 * LES CIRCUITS EMBARQUÉS — même motif que les conseils, et une raison de plus.
 *
 * Le référentiel descend par synchronisation : il est vide tant que rien n'a
 * synchronisé, c'est-à-dire au premier lancement, et c'est-à-dire AU PADDOCK
 * SANS RÉSEAU — précisément l'endroit et le moment où on saisit un roulage. Un
 * sélecteur de circuits qui n'existe qu'en ligne ne sert jamais.
 *
 * Cette liste est aussi LA TÊTE ÉDITORIALE du référentiel : son ordre est celui
 * dans lequel un pilote français cherche, pas l'ordre alphabétique. Les circuits
 * qui arriveront en base sans figurer ici s'ajoutent à la suite — la liste
 * embarquée est curée, la base est la part qui grossit.
 *
 * `alias` NE S'ÉCRIT JAMAIS. C'est de la matière de recherche : on tape « val de
 * vienne » et on trouve « Le Vigeant », mais c'est « Le Vigeant » qui part dans
 * le roulage. Le nom stocké reste unique, donc l'écart à circuit constant
 * continue de comparer ce qui est comparable.
 */
export type CircuitEmbarque = { nom: string; alias?: string }

export const CIRCUITS_EMBARQUES: readonly CircuitEmbarque[] = [
  { nom: 'Pau-Arnos', alias: 'arnos béarn 64 pyrénées atlantiques' },
  { nom: 'Nogaro', alias: 'paul armagnac gers 32' },
  { nom: 'Le Vigeant', alias: 'val de vienne 86' },
  { nom: 'Lédenon', alias: 'gard 30 nîmes' },
  { nom: 'Magny-Cours', alias: 'nevers nièvre 58' },
  { nom: 'Le Castellet', alias: 'paul ricard var 83' },
  { nom: 'Albi', alias: 'tarn 81' },
  { nom: 'Dijon-Prenois', alias: 'prenois côte-d’or 21' },
  { nom: 'Charade', alias: 'clermont-ferrand puy-de-dôme 63' },
  { nom: 'Croix-en-Ternois', alias: 'saint-pol pas-de-calais 62' },
  { nom: 'Carole', alias: 'tremblay seine-saint-denis 93 paris' },
  { nom: 'Bresse', alias: 'frontenaud saône-et-loire 71' },
  { nom: 'Le Mans', alias: 'bugatti sarthe 72' },
  { nom: 'Folembray', alias: 'aisne 02' },
  { nom: 'Le Luc', alias: 'circuit du var 83' },
  { nom: 'Haute Saintonge', alias: 'la genétouze charente-maritime 17' },
  { nom: 'Fontenay-le-Comte', alias: 'vendée 85' },
  { nom: 'Lohéac', alias: 'ille-et-vilaine 35' },
  { nom: 'Alès', alias: 'pôle mécanique cévennes gard 30' },
  { nom: 'Issoire', alias: 'puy-de-dôme 63' },
  { nom: 'Clastres', alias: 'aisne 02' },
  { nom: 'Mornay', alias: 'cher 18' },
  { nom: 'Le Grand Sambuc', alias: 'bouches-du-rhône 13 aix' },
  { nom: 'La Ferté-Gaucher', alias: 'seine-et-marne 77' },
  { nom: 'Motorland Aragón', alias: 'alcañiz espagne aragon' },
  { nom: 'Jerez', alias: 'espagne andalousie' },
  { nom: 'Valence', alias: 'ricardo tormo cheste espagne' },
  { nom: 'Barcelona-Catalunya', alias: 'montmelo espagne catalogne' },
  { nom: 'Navarra', alias: 'los arcos espagne' },
  { nom: 'Portimão', alias: 'algarve portugal' },
  { nom: 'Mettet', alias: 'belgique' },
  { nom: 'Spa-Francorchamps', alias: 'belgique spa' },
]
