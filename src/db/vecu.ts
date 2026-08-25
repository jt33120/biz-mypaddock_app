/**
 * « CETTE JOURNÉE A-T-ELLE EU LIEU ? » — récit 17.1, et il n'y a qu'UN endroit
 * qui répond.
 *
 * Le défaut que ce fichier ferme n'est pas un calcul faux : c'est une règle
 * ÉCRITE QUATRE FOIS ET DEMIE. `usure.ts` la tenait entière — état ET date —,
 * `bilan.ts` à moitié (l'état sans la date), `chiffres.ts` et `circuits.ts` pas
 * du tout. Une journée saisie pour le 12 septembre entrait donc dans « 5
 * roulages », dans « 2 circuits », dans « ta dernière journée ici », et le bilan
 * de saison l'annonçait « sans chrono » — un trou qui n'en est pas un, sur un
 * écran dont la seule raison d'être est d'énoncer sa complétude.
 *
 * Corriger les quatre requêtes une par une est EXACTEMENT la manière dont le
 * défaut est né. Elles appellent donc toutes la même expression, et un essai
 * unitaire refuse la cinquième lecture qui ne la citerait pas.
 *
 * ⚠ `etat` N'EST PAS LE TEMPS, et les confondre casserait FR-61. `usage` /
 * `brouillon` dit la PROVENANCE — saisi à la main par le pilote, ou importé
 * d'un calendrier. Une journée à venir naît et reste en `usage` : il l'a
 * saisie, elle est à lui. Ce qui la sépare d'un vécu est sa DATE, rien d'autre.
 * Le prédicat porte donc les deux moitiés, et aucune ne remplace l'autre.
 *
 * ⚠ ET UNE JOURNÉE À VENIR RESTE UNE DONNÉE PLEINE. Elle est dans la liste des
 * roulages, dans l'emport, dans la sauvegarde, elle porte ses dépenses et se
 * retire comme une autre. Rien ici ne la cache : ceci l'empêche seulement
 * d'être COMPTÉE comme vécue.
 */

/** Le jour courant, au format que porte `date_jour`. Deux dates ISO se
 *  comparent comme deux chaînes — aucun fuseau n'intervient, et c'est
 *  volontaire : on compare deux JOURS, pas deux instants (AD-8). */
export const aujourdhui = () => new Date().toISOString().slice(0, 10)

/**
 * LE PRÉDICAT, EN SQL — `etat = 'usage' AND date_jour <= :jour`.
 *
 * Il porte UN paramètre, le jour courant, à placer dans l'ordre où l'expression
 * apparaît dans la requête. L'alias par défaut est `r` parce que c'est celui de
 * presque toutes les requêtes du dépôt ; `A_EU_LIEU('')` sert aux sous-requêtes
 * qui n'en posent pas.
 *
 * ⚠ IL NE SE RECOPIE PAS. Un essai unitaire refuse tout `etat = 'usage'` écrit
 * à la main dans une lecture, et toute lecture de `roulage` qui ne se prononce
 * pas sur le temps — soit en citant cette expression, soit en portant la marque
 * `TOUTES_JOURNEES` ci-dessous, qui dit dans la requête même pourquoi elle
 * prend tout.
 */
export const A_EU_LIEU = (alias: string = 'r'): string => {
  const p = alias ? `${alias}.` : ''
  return `${p}etat = 'usage' AND ${p}date_jour <= ?`
}

/**
 * LA MARQUE DE CELLES QUI PRENNENT TOUT — et c'est une DÉCLARATION, pas une
 * dispense.
 *
 * Certaines lectures doivent voir une journée à venir : la liste des roulages
 * (elle est saisie, elle compte), l'accueil temporel (c'est son sujet), les
 * lectures par identifiant, les reprises de base, et tout ce qui passe par un
 * chrono — un tour prouve la journée mieux qu'une date. Elles portent donc
 * cette marque DANS la requête, à côté du `FROM roulage`, avec une phrase qui
 * dit pourquoi. Sans elle, l'essai unitaire du récit 17.1 fait rougir le banc :
 * une lecture qui ne se prononce pas sur le temps est exactement celle qui
 * comptera une journée qui n'a pas eu lieu.
 *
 * C'est un commentaire SQL : il ne change rien à ce que SQLite exécute.
 */
export const TOUTES_JOURNEES = '/* toutes journées */'

/** Le même prédicat, côté application, pour les lignes déjà lues. */
export const aEuLieu = (
  r: { etat: string | null; date_jour: string }, jour: string = aujourdhui(),
): boolean => r.etat === 'usage' && r.date_jour <= jour

/**
 * UNE JOURNÉE ANNONCÉE — strictement après aujourd'hui.
 *
 * C'est la question du CHEMIN DE SAISIE, pas celle des compteurs : après avoir
 * validé une date de septembre, l'application ne peut pas demander « meilleur
 * tour de la session » d'une journée qui n'a pas eu lieu. Une journée saisie le
 * jour même, elle, garde son chemin d'origine — c'est le geste du soir, et il
 * ne change pas.
 */
export const estAVenir = (date: string, jour: string = aujourdhui()): boolean =>
  date > jour

/**
 * CETTE JOURNÉE SE PRÉPARE-T-ELLE ENCORE ? — récit 17.2, la question du TAP.
 *
 * Elle n'est pas l'inverse de `aEuLieu`, et l'écart tient en un matin : le
 * 12 septembre à 6 h, en chargeant le camion, la journée est datée d'aujourd'hui
 * — elle « a eu lieu » au sens des compteurs — et pourtant ce qu'on vient
 * chercher est ce qui la PRÉPARE, pas son bilan chronométrique.
 *
 * ⚠ LE BASCULEMENT TIENT À UN FAIT OBSERVABLE : une session existe. Jamais à
 * une heure, jamais à un réglage, jamais à une case à cocher. Le pilote saisit
 * son premier chrono, et la journée montre son chrono — sans que rien ne le lui
 * ait demandé (FR-61 : « confirmé par le pilote OU par une mesure »).
 *
 * ⚠ ET LA SYMÉTRIE TIENT DANS LES DEUX SENS : une journée déjà passée ne porte
 * aucune liste de préparation, parce que « ce qui reste à faire sur une journée
 * déjà passée serait un reproche ».
 */
export const sePrepare = (
  r: { date: string; sessions: number }, jour: string = aujourdhui(),
): boolean => r.date >= jour && r.sessions === 0
