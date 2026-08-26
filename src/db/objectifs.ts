import type { PowerSyncDatabase } from '@powersync/web'
import { ajouter, lignes, retirer, type Ligne } from './checklist'
import { aplati } from './depot'
import { listerCaps } from './gestes'
import { ficheCircuit } from './circuits'

/**
 * CE QUE JE VAIS CHERCHER CE JOUR-LÀ — récit 17.5.
 *
 * ═══ TROIS RÈGLES ÉCRITES DU PRODUIT TOMBENT ICI, ET C'EST JULIAN QUI LES LÈVE
 *     — 25 août 2026 ══════════════════════════════════════════════════════════
 *
 *   « C'est la pratique d'un sport, un petit disclaimer en bas de l'app devrait
 *     suffire. Dans les objectifs, on peut imaginer poser le genou à gauche,
 *     faire 1 min 30, travailler les virages à gauche, etc., soit pas trop
 *     strict. »
 *
 * ① LE MOT « OBJECTIF » ÉTAIT INTERDIT À L'ÉCRAN (EXPERIENCE.md:114 — « jamais
 *   performance, jamais objectif »), et cette ligne-là n'était pas tombée le
 *   18 août. Julian l'emploie lui-même et demande la chose. Elle tombe.
 *
 * ② UN CHRONO VISÉ ÉTAIT INTERDIT. « Faire 1 min 30 » est exactement ça. Il
 *   tombe aussi — mais SEULEMENT comme texte posé avant la journée. La COURBE,
 *   elle, ne change pas d'un pixel : aucune cible n'y apparaît, aucun écart ne
 *   s'y calcule (courbe.ts). Un chrono visé qui deviendrait une ligne sur le
 *   tracé fabriquerait un verdict le soir même, et c'est ce que le refus de la
 *   tendance protège — Julian a levé le mot, pas le verdict.
 *
 * ③ SEULS LES CAPS DE `discipline` DEVAIENT ÊTRE PROPOSÉS. « Poser le genou à
 *   gauche » est un cap de BRAVOURE, et c'est littéralement l'enchaînement de la
 *   chute fondatrice. Julian le nomme en premier. Il tombe.
 *   ⚠ MAIS FR-39bis NE BOUGE PAS : un cap de bravoure ne part toujours JAMAIS
 *   tout seul au cercle (`partageableAutomatiquement`, gestes.ts). Viser une
 *   chose pour soi et la diffuser sans l'avoir décidé sont deux gestes
 *   différents, et c'est le second que la règle protège.
 *
 * LA CONTREPARTIE EST POSÉE PAR JULIAN LUI-MÊME et elle est tenue dans le code :
 * un avertissement permanent en pied d'application (App.tsx). Il ne se ferme
 * pas, il ne se coche pas, il ne s'oublie pas.
 *
 * ═══ ET CE QUI NE TOMBE PAS ═══════════════════════════════════════════════
 *
 * ⚠ RIEN NE SE COCHE, RIEN NE DIT « ATTEINT », RIEN NE DIT « 2 SUR 3 ». Un
 * objectif non coché le soir est un échec affiché sans qu'aucun libellé ait à le
 * dire — et « travailler les virages à gauche » n'a pas de fin qu'on puisse
 * cocher. Le pilote pose ce qu'il vient chercher, il le relit, il le retire s'il
 * veut. C'est tout ce que le produit fait de cette ligne.
 *
 * ⚠ ET LE PRODUIT PROPOSE D'ABORD CE QU'IL SAIT. Le précédent est écrit dans le
 * code (App.tsx : « ça fait un peu gamin, personne va prendre le temps de le
 * remplir… c'est quoi cette merde ») : c'est un champ de texte libre à remplir
 * avant de rouler que Julian a rejeté, et c'était le plan si-alors. Un champ
 * vide sous un titre finira pareil. Les propositions viennent donc de la fiche
 * du circuit, du catalogue de caps, et du fait « jamais roulé ici » ; le texte
 * libre vient EN DERNIER, pour ce que le produit ne peut pas deviner.
 *
 * ⚠ LE STOCKAGE EST UNE CINQUIÈME CATÉGORIE DE `checklist_ligne`, pas une table
 * neuve. Un mot dans `Categorie`, un dans `NOM_CATEGORIE`, un dans le `check`
 * serveur — contre schema.ts + migration + ORDRE + DEPENDANCES + DEFAUTS_SERVEUR
 * + les règles PowerSync + l'essai unitaire : facteur dix pour la même chose.
 * `CHARGEMENT` l'exclut par construction, et l'essai du 25 août oblige à la
 * ranger explicitement d'un côté ou de l'autre.
 */

export type Objectif = Ligne

/** Ce que le pilote vise ce jour-là. Ordre d'écriture : le premier posé en
 *  premier — on ne classe pas ce qu'on vient chercher. */
export const objectifsDuRoulage = async (
  db: PowerSyncDatabase, roulageId: string,
): Promise<Objectif[]> =>
  (await lignes(db, roulageId)).filter((l) => l.categorie === 'objectif')

export const poserObjectif = (db: PowerSyncDatabase, roulageId: string, libelle: string) =>
  ajouter(db, roulageId, libelle, 'objectif')

export const retirerObjectif = retirer

/**
 * CE QUE LE PRODUIT SAIT DÉJÀ, ET QU'IL PROPOSE AVANT LE CHAMP VIDE.
 *
 * Trois sources, et aucune n'est inventée :
 *   · les VIRAGES de la fiche du circuit, quand la récolte en a rapporté — on
 *     travaille un virage nommé, pas « les virages » ;
 *   · les CAPS du catalogue, bravoure comprise depuis le 25 août ;
 *   · le fait « jamais roulé ici », que l'accueil calcule déjà.
 *
 * Ce qui est DÉJÀ POSÉ n'est pas reproposé — sinon la liste des propositions
 * devient une liste de choses à cocher deux fois.
 */
export const propositions = async (
  db: PowerSyncDatabase,
  roulage: { id: string; circuit: string },
): Promise<string[]> => {
  const deja = new Set((await objectifsDuRoulage(db, roulage.id)).map((o) => aplati(o.libelle)))
  const p: string[] = []

  const fiche = await ficheCircuit(db, roulage.circuit)
  // ⚠ « JAMAIS ROULÉ ICI » EST UN FAIT, PAS UN ENCOURAGEMENT. La fiche compte
  // les journées DÉJÀ VÉCUES ici (`vecu.ts`) : la journée qu'on prépare n'y est
  // donc pas, et ce n'est pas un hasard — c'est ce qui rend la phrase vraie.
  if (!fiche.sien.journees) p.push('Reconnaître le circuit, sans chercher le chrono')
  for (const v of fiche.virages.slice(0, 6)) {
    const nom = v.nom ?? (v.numero != null ? `le virage ${v.numero}` : null)
    if (nom) p.push(`Travailler ${nom}`)
  }

  // Les caps, TOUS — la distinction bravoure/discipline ne sert plus qu'au
  // partage automatique au cercle (FR-39bis), qui ne change pas.
  for (const c of await listerCaps(db)) p.push(c.libelle)

  return p.filter((x) => !deja.has(aplati(x)))
}
