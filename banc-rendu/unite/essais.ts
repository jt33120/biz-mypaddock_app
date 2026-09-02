/**
 * LES ESSAIS UNITAIRES — ce que les dix essais de bout en bout ne voient pas.
 *
 * Un essai de bout en bout prouve qu'un chemin marche. Il ne prouve pas qu'une
 * règle tient à ses BORDS, et c'est aux bords que ces règles-là cassent : un
 * arrondi qui dérive sur une saison, un signe qui disparaît, un uuid v4 qui
 * rend une date plausible et fausse. Aucun de ces défauts ne fait rougir un
 * écran — ils rendent un chiffre, simplement le mauvais.
 *
 * Ils tournent DANS UN VRAI NAVIGATEUR, sur les modules réels servis par Vite :
 * pas de doublure, pas de transpilation parallèle, pas de module réécrit pour
 * les besoins de l'essai. Ce qui est éprouvé ici est exactement ce qui part.
 */
import { UpdateType } from '@powersync/web'
import {
  anneeSaison, aplati, classerRoulages, coutDuRoulage, creerDepense, enCentimes, formaterChrono,
  formaterEcart, formaterEuros, supprimerRoulage,
} from '../../src/db/depot'
import {
  grouperParMois, jaugeBudget, jourDansLAnnee, moisDuJour, nomMois, repereMensuel,
} from '../../src/db/budget'
import { accepterMesures, instantDeLId, ouverture, SEUIL_H } from '../../src/db/mesures'
import { direAVenir, direPasse, ecartJours } from '../../src/db/accueil'
import { formaterPoids, TABLES_EMPORTEES } from '../../src/db/emporter'
import {
  dimensions, nomLocal, oublierPhoto, supprimerPhotosEnAttente, surRetourDeReseau,
  televerserEnAttente, verserEnSerie,
} from '../../src/db/photos'
import {
  consignerChute, consignerReparationDeChute, declarerAucunCrash, oublierChute,
} from '../../src/db/chute'
import {
  extensionDe, nomLocalVideo, QUOTA_VIDEO_OCTETS, televerserVideosEnAttente, verserVideo,
} from '../../src/db/video'
import { cadre, capaciteVideo } from '../../src/video/comprimer'
import {
  capaciteLocale, ecrireLocale, effacerLocale, eprouverLeCoffre, fermerLaConnexionDuCoffre,
  lireLocale, nomsBrutsDuCoffre, nomsDuCoffre, oublierLeMagasin, viderLeCoffre,
} from '../../src/db/coffre'
import { enFichier } from '../../src/recap/composer'
import {
  avecLesDefauts, chargeDe, DEFAUTS_SERVEUR, DEPENDANCES, direCombien, LIEN_DIFFERE, NOM_TABLE,
  ORDRE, PORTE_PROPRIETAIRE,
} from '../../src/db/sauvegarde'
import { envoyerTransaction } from '../../src/db/connecteur'
import { ecrirePuisRelire } from '../../src/ecrans/geste'
import { ecrireDepenseUneFois } from '../../src/ecrans/ecriture-depense'
// Toutes les migrations telles qu'elles sont appliquées. Comme le YAML de
// synchronisation : rien ne les relie au schéma local, et c'est le problème.
const MIGRATIONS = import.meta.glob('../../supabase/migrations/*.sql',
  { query: '?raw', import: 'default', eager: true }) as Record<string, string>
import { AppSchema, REFERENTIEL } from '../../src/db/schema'
// Le fichier de règles tel qu'il est déployé, lu à la lettre. C'est un YAML et
// non du code : rien ne le relie au schéma, et c'est précisément le problème.
import REGLES_DE_SYNCHRO from '../../powersync/sync-config.yaml?raw'
import { effacerLesReglages } from '../../src/db/effacer'
import { POINTS_MINIMUM } from '../../src/db/courbe'
/**
 * ─── L'ANALYSE, IMPORTÉE POUR DE VRAI ──────────────────────────────────────
 *
 * La table des croisements et les trois décisions pures s'IMPORTENT plutôt que
 * de se lire en texte, et ce n'est pas une commodité : une table lue au texte
 * prouve qu'un mot est écrit quelque part, jamais qu'il sort de la fonction
 * qu'on croit. Les phrases de lecture sont des FONCTIONS — elles se rendent
 * pour zéro, une et plusieurs saisons — et c'est ce qu'elles RENDENT qui
 * s'affiche sous le doigt du pilote.
 *
 * Ce qui se lit encore au texte, plus bas, est ce qui n'a aucune valeur de
 * retour : une requête SQL, une convention d'axe, un commentaire abrogé.
 */
import {
  cequiManque, comblerLesMois, croisementDe, CROISEMENTS, domainesDe, formeRendue,
  NOM_DOMAINE, TOUTES_ANNEES, tracesDuDomaine,
  type Domaine, type LigneAnalyse, type Trace,
} from '../../src/db/analyse'
import { niveauDuGroupe } from '../../src/db/usure'
import { dateCivileLocale, sePrepare } from '../../src/db/vecu'
import { direLaCompletude, memeTache } from '../../src/db/preparation'
import { chemins, dessins, GRILLE } from '../../src/ecrans/dessins'
// Ce que le dépôt SERT tel quel.  — bluesky, discord, github,
// x — était le reliquat du gabarit Vite, référencé nulle part et servi à tout le
// monde depuis un dépôt public.
const PUBLIC = import.meta.glob('../../public/**/*',
  { query: '?url', import: 'default', eager: true }) as Record<string, string>

/** Le nombre de pixels pleins d'un dessin. Un dessin presque vide passerait
 *  toutes les gardes de forme et ne montrerait rien à l'écran. */
const l_pleine = (art: string) => (art.match(/#/g) ?? []).length
import {
  CHARGEMENT, CHARGEMENT_EMBARQUE, direLAge, direPublication, MOIS_AVANT_DOUTE, moisDepuis,
  NOM_CATEGORIE,
} from '../../src/db/checklist'
// ⚠ LA CONTRAINTE DES CATÉGORIES NE SE LIT PLUS DANS UNE MIGRATION NOMMÉE.
// Elle l'était — `20260823000001` — et le jour où le récit 17.5 a ajouté
// `objectif` dans une migration PLUS RÉCENTE, la garde a accusé le produit
// d'envoyer une catégorie refusée alors que le serveur venait de l'accepter.
// Une garde ancrée sur un nom de fichier éprouve le nom du fichier. Elle lit
// maintenant `MIGRATIONS` en entier et prend la DERNIÈRE contrainte posée.
// LA FONCTION SERVEUR LUE À LA LETTRE. Rien dans le dépôt ne relie ce fichier
// au schéma local ni aux clauses du produit : c'est du TypeScript qui tourne
// ailleurs, déployé à part, et personne ne le recompile avec le reste. C'est
// exactement le cas du YAML de synchronisation, et pour la même raison la seule
// façon de l'éprouver ici est de le lire comme du texte.
import MANUEL from '../../supabase/functions/manuel/index.ts?raw'
import { lireEnvironnement } from '../../src/product'
import { direLAbri, type Abri } from '../../src/db/abri'
import { spritifier } from '../../src/pixel/spritifier'
import { COULEURS_MAX } from '../../src/pixel/reglages'
import { CAPS_EMBARQUES, CIRCUITS_EMBARQUES, CONSEILS_EMBARQUES } from '../../src/db/corpus'
import { COUT_PORTRAIT_CENTIMES, PORTRAITS_INCLUS } from '../../src/pixel/portrait'
// Les écrans et la feuille de style LUS À LA LETTRE — récit 21.3. Rien dans le
// code ne relie un libellé de bouton à la classe qui l'habille : c'est du texte
// dans du JSX, et un oubli n'y fait ni erreur de type ni écran cassé. Il rend
// seulement un bouton qui détruit sans le dire, et ça ne se voit qu'en relisant.
const ECRANS = import.meta.glob('../../src/**/*.tsx',
  { query: '?raw', import: 'default', eager: true }) as Record<string, string>
// ⚠ ET LA COUCHE `db` AVEC EUX, MAINTENANT QUE LE GESTE COMPTE AUTANT QUE LE
// MOT. Les fonctions qui détruisent vraiment vivent dans `src/db/*.ts` : lire
// les seuls `.tsx` ferait un second témoin qui ne reconnaît aucun geste, donc
// un témoin muet — et un témoin muet ressemble beaucoup à un témoin satisfait.
const SOURCES = import.meta.glob('../../src/**/*.{ts,tsx}',
  { query: '?raw', import: 'default', eager: true }) as Record<string, string>
import FEUILLE from '../../src/styles/systeme.css?raw'
import {
  appelleUneDestruction, boutonsDe, detruit, ditLaDestruction, gestesDestructifs,
} from '../destructif.mjs'
/**
 * ─── LA FABRIQUE DE PORTRAITS, LUE DES DEUX FAÇONS POSSIBLES ───────────────
 *
 * `tenue.ts` s'IMPORTE POUR DE VRAI, et c'est un choix : c'est du TypeScript
 * effaçable, sans un seul appel Deno, donc il se charge ici tel quel. Le faire
 * RENDRE vaut infiniment mieux que de le lire — un `FICHES` où les deux clés
 * pointeraient la même fiche passerait n'importe quelle lecture de texte, et se
 * verrait à la première comparaison de sorties. Au passage il entre dans le
 * programme de `tsc -b`, qui ne le voyait pas : `tsconfig.app.json` n'inclut que
 * `src` et `banc-rendu/unite`, et RIEN ne type-vérifiait ce fichier.
 *
 * `v6.ts` et `index.ts` se lisent comme du TEXTE, pour la raison déjà écrite
 * plus haut à propos de `manuel/index.ts` : `index.ts` importe
 * `jsr:@supabase/supabase-js`, qu'aucun navigateur ne résout. Et lire v6 en
 * texte a une seconde vertu — l'essai qui l'oppose à la tenue ne dépend pas de
 * la signature de son `prompt`, qui prend un cadre là où la tenue prend un mot.
 */
import * as TENUE from '../../supabase/functions/sprite/tenue.ts'
import SPRITE_MOTO from '../../supabase/functions/sprite/v6.ts?raw'
import SPRITE_SERVEUR from '../../supabase/functions/sprite/index.ts?raw'
/**
 * ─── LE BANC LUI-MÊME, LU COMME DU TEXTE ───────────────────────────────────
 *
 * Trente-deux scripts Node que RIEN ne relie au produit : ni type, ni import,
 * ni bundler. Ils ne cassent pas quand ils divergent — ils refusent simplement
 * de démarrer, et seulement sur la machine qui n'a pas d'`/Applications`,
 * c'est-à-dire jamais sur le poste où on les écrit.
 */
const BANC = import.meta.glob('../*.mjs',
  { query: '?raw', import: 'default', eager: true }) as Record<string, string>
/**
 * ─── CE QUI MONTE CHEZ L'HÉBERGEUR, ET CE QUE GIT CACHE ────────────────────
 *
 * Ces deux fichiers disent la même chose à deux outils qui ne se parlent pas,
 * et `.vercelignore` REMPLACE `.gitignore` au lieu de s'y ajouter (son propre
 * en-tête l'explique). Un chemin ignoré d'un seul côté est donc invisible dans
 * `git status` ET téléversé : c'est la forme exacte du défaut de `graft/`, dont
 * 4,5 Mo de cache contenaient les prompts en texte brut.
 */
import VERCELIGNORE from '../../.vercelignore?raw'
import GITIGNORE from '../../.gitignore?raw'

type Resultat = { titre: string; ok: boolean; detail: string }
const resultats: Resultat[] = []

const doit = (titre: string, fn: () => void | Promise<void>) => async () => {
  try { await fn(); resultats.push({ titre, ok: true, detail: '' }) }
  catch (e) { resultats.push({ titre, ok: false, detail: (e as Error).message }) }
}
const egal = (obtenu: unknown, attendu: unknown, quoi = '') => {
  const a = JSON.stringify(obtenu), b = JSON.stringify(attendu)
  if (a !== b) throw new Error(`${quoi}${quoi ? ' : ' : ''}obtenu ${a}, attendu ${b}`)
}
const vrai = (c: boolean, quoi: string) => { if (!c) throw new Error(quoi) }

/**
 * ─── LIRE LES BOUTONS D'UN ÉCRAN, ET RIEN QUE LES BOUTONS ──────────────────
 *
 * Le récit 21.3 tient sur une équivalence : un bouton DÉTRUIT ⟺ il porte
 * `destructif`. Les deux moitiés comptent. « Tout destructif est rouge » se
 * satisfait d'un produit tout rouge ; « rien d'autre n'est rouge » se satisfait
 * d'un produit sans rouge. Le seul endroit d'où l'on voit les deux ensemble, sur
 * TOUS les écrans y compris ceux qui demandent un compte, c'est le texte source.
 *
 * ⚠ LA LECTURE VIT DANS `../destructif.mjs`, ET C'EST DÉLIBÉRÉ. Elle était ici,
 * et `fumee-destructif.mjs` en avait une deuxième — la même règle écrite deux
 * fois, donc deux règles à corriger et une seule qu'on pense à corriger. Elles
 * décidaient toutes les deux qu'un bouton détruit si son LIBELLÉ le dit, jamais
 * ce que son `onClick` appelle : la revue l'a prouvé sur un bouton « Vider la
 * liste » qui exécute un vrai DELETE et passait la garde en gris. Le second
 * témoin est là-bas, et il sert aux deux bancs.
 */
const DESTRUCTIVES = gestesDestructifs(SOURCES)

/**
 * LE DESSIN PRIMAIRE, LU SANS SUPPOSER SA FORME.
 *
 * Un bouton est PRIMAIRE quand sa classe porte `bouton` sans `secondaire` :
 * c'est le dégradé plein, pleine largeur, celui qui dit « fais ça maintenant ».
 *
 * ⚠ ET UNE CLASSE QU'ON NE SAIT PAS LIRE COMPTE POUR PRIMAIRE. `boutonsDe` rend
 * `''` dès que le `className` est calculé — un ternaire, une concaténation — et
 * un garde qui traiterait ce vide comme « pas primaire » se tairait exactement
 * là où le dessin devient invisible à la relecture. On refuse ce qu'on ne peut
 * pas prouver, plutôt que de l'absoudre.
 */
const estPrimaire = (className: string): boolean =>
  !className || (/\bbouton\b/.test(className) && !/\bsecondaire\b/.test(className))

/** CE QUE L'ÉCRAN REND VRAIMENT, sans ce qu'il raconte à côté. Un commentaire
 *  de ce dépôt CITE le défaut qu'il empêche — « un second `<Photos>` monté
 *  ici », « Rien n'attend au garage » — et un témoin qui lit le fichier brut
 *  accuse alors la mémoire du défaut au lieu du défaut. Le `[^:]` protège les
 *  `https://` : sans lui, la moitié d'une URL passe pour un commentaire. */
const sansCommentaires = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')

/** UN FICHIER DU PRODUIT, PAR LA FIN DE SON CHEMIN. Le motif était réécrit à la
 *  main dans une trentaine d'essais ; il rend `''` quand le fichier n'existe
 *  pas, et chaque appelant DOIT le dire — un texte vide traverse toutes les
 *  gardes par la négative, ce qui est la façon la plus discrète d'avoir un
 *  témoin muet. */
const fichierDe = (biblio: Record<string, string>, fin: string): string =>
  Object.entries(biblio).find(([c]) => c.endsWith(fin))?.[1] ?? ''

/**
 * ─── LES REQUÊTES DU DÉPÔT, LUES COMME DU TEXTE — récit 17.1 ────────────────
 *
 * Une requête SQL est une chaîne : elle ne porte aucun type, aucun appel,
 * aucune référence que le compilateur puisse suivre. Deux requêtes qui doivent
 * appliquer la même règle n'ont, dans le code, RIEN qui les relie — et c'est
 * précisément comme ça que « cette journée a-t-elle eu lieu ? » a fini écrite
 * quatre fois et demie, avec une moitié différente dans chaque fichier.
 *
 * Le seul témoin possible est donc le texte source.
 *
 * ⚠ ET IL NE LISAIT QUE LES ACCENTS INVERSES, CE QUI ÉTAIT UN TROU PROUVÉ. La
 * première version extrayait les seuls gabarits — `` `…` `` — au motif
 * qu'aucun d'eux ne contient d'accent imbriqué. Vrai, et hors sujet : une
 * requête tient très bien entre APOSTROPHES ou entre GUILLEMETS, et
 * `'SELECT … FROM roulage'` traversait les deux gardes sans être lue une seule
 * fois. Une garde qu'on croit tenue et qui ne tient pas est pire qu'une garde
 * absente, parce qu'on cesse de regarder.
 *
 * On découpe donc le source en trois : les COMMENTAIRES, qu'on jette ; les
 * LITTÉRAUX des trois formes, qu'on lit ; et le RESTE, le code nu. Le reste
 * n'est pas jeté non plus — il sert de preuve que la lecture a tout vu (voir
 * l'essai « la lecture des requêtes ne laisse rien dehors »), parce qu'un
 * découpage qui déraperait sur une apostrophe de JSX perdrait des requêtes en
 * silence.
 *
 * ⚠ `src/db/vecu.ts` EST EXCLU, ET IL DOIT L'ÊTRE : c'est le seul fichier qui a
 * le droit d'écrire le prédicat, puisque c'est lui qui le définit.
 */
const decouper = (source: string): { litteraux: string[]; reste: string } => {
  const litteraux: string[] = []
  let reste = ''
  for (let i = 0; i < source.length; i++) {
    const c = source[i]
    if (c === '/' && source[i + 1] === '/') {
      while (i < source.length && source[i] !== '\n') i++
      reste += '\n'; continue
    }
    if (c === '/' && source[i + 1] === '*') {
      i += 2
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i++
      i++; reste += ' '; continue
    }
    if (c === '`' || c === '"' || c === '\'') {
      let j = i + 1
      for (; j < source.length && source[j] !== c; j++) {
        if (source[j] === '\\') j++
        // Une chaîne simple ou double ne franchit pas la ligne : ce qui en
        // franchit une n'était pas une chaîne — c'est une apostrophe de prose.
        else if (c !== '`' && source[j] === '\n') break
      }
      if (source[j] === c) { litteraux.push(source.slice(i + 1, j)); i = j; continue }
    }
    reste += c
  }
  return { litteraux, reste }
}

const gabaritsSql = (): { fichier: string; sql: string }[] => {
  const sortie: { fichier: string; sql: string }[] = []
  for (const [chemin, texte] of Object.entries(SOURCES)) {
    if (chemin.endsWith('/db/vecu.ts')) continue
    for (const l of decouper(texte).litteraux) {
      if (!/\bSELECT\b/i.test(l)) continue
      sortie.push({ fichier: chemin.replace(/^.*\/src\//, 'src/'), sql: l })
    }
  }
  return sortie
}

/** Toute LECTURE : les écritures — `INSERT`, `UPDATE`, un `DELETE` sans
 *  sous-requête — n'ont pas à se prononcer sur le temps, elles visent une ligne
 *  qu'on leur désigne. */
const lecturesSql = () => gabaritsSql()

/**
 * Chaque ENDROIT où l'on va chercher dans la table `roulage` — pas chaque
 * requête. C'est là, et nulle part ailleurs, qu'une journée qui n'a pas eu lieu
 * peut être comptée comme vécue.
 *
 * ⚠ LA DISTINCTION A ÉTÉ TROUVÉE EN FAISANT ROUGIR L'ESSAI, ET ELLE EST TOUT
 * L'ESSAI. La première version regardait la requête ENTIÈRE : une cinquième
 * lecture glissée dans le même gabarit que les quatre corrigées passait sans
 * rien dire, parce qu'un `A_EU_LIEU` écrit trois lignes plus haut, pour un autre
 * chiffre, suffisait à la couvrir. C'est exactement la forme de `chiffres.ts`,
 * qui compte sept choses en une seule requête — donc exactement l'endroit où la
 * cinquième s'écrira.
 *
 * On découpe donc au `FROM roulage` : chaque morceau va d'une lecture à la
 * suivante, et doit porter SA propre décision sur le temps.
 */
const lecturesDeRoulage = (): { fichier: string; sql: string }[] => {
  const sortie: { fichier: string; sql: string }[] = []
  for (const q of gabaritsSql()) {
    const coupes = [...q.sql.matchAll(/\b(?:FROM|JOIN)\s+roulage\b/gi)].map((m) => m.index!)
    for (let i = 0; i < coupes.length; i++)
      sortie.push({ fichier: q.fichier, sql: q.sql.slice(coupes[i], coupes[i + 1] ?? q.sql.length) })
  }
  return sortie
}

/**
 * SIMULER UN SAFARI D'AVANT LA 26 — on ne l'espère pas, on le fabrique.
 *
 * Ces essais tournent dans Chromium, où `createWritable` existe : attendre de
 * tomber sur un iPhone pour éprouver le repli reviendrait à ne jamais
 * l'éprouver. On retire donc la méthode du prototype, exactement comme un
 * Safari 18 la laisse absente, et on la remet quoi qu'il arrive.
 *
 * `oublierLeMagasin()` encadre la manipulation des deux côtés : le coffre ne
 * choisit qu'une fois par session, et un choix resté en mémoire ferait passer
 * l'essai suivant pour ce qu'il n'est pas.
 */
const sansCreateWritable = async <T>(agir: () => Promise<T>): Promise<T> => {
  const proto = FileSystemFileHandle.prototype
  const descripteur = Object.getOwnPropertyDescriptor(proto, 'createWritable')!
  Reflect.deleteProperty(proto, 'createWritable')
  oublierLeMagasin()
  try { return await agir() }
  finally {
    Object.defineProperty(proto, 'createWritable', descripteur)
    oublierLeMagasin()
  }
}
const octetsDe = async (f: File | null) => {
  vrai(!!f, 'le fichier est absent du coffre')
  return Array.from(new Uint8Array(await f!.arrayBuffer()))
}
const OCTETS_ESSAI = [0x4d, 0x79, 0x50, 0x00, 0xff, 0x2a]
const blobDEssai = () => new Blob([new Uint8Array(OCTETS_ESSAI)], { type: 'image/webp' })

const essais = [

  /* ─── L'ARGENT — jamais un flottant sur de la monnaie ─────────────────── */
  doit("l'argent se lit en centimes entiers, virgule ou point", () => {
    egal(enCentimes('245,50'), 24550); egal(enCentimes('245.5'), 24550)
    egal(enCentimes('245'), 24500); egal(enCentimes('0,05'), 5); egal(enCentimes('0'), 0)
  }),
  doit("l'argent refuse ce qui n'est pas une somme", () => {
    for (const s of ['abc', '', '   ', '-5', '1 000', '12,345', '1234567', '€12'])
      egal(enCentimes(s), null, `« ${s} » aurait dû être refusé`)
  }),
  doit("aucune dérive de flottant sur une saison d'additions", () => {
    // 0,1 + 0,2 ne fait pas 0,3 en flottant. En centimes, mille additions de
    // 0,10 € font exactement 100,00 € — c'est tout l'objet de la convention.
    let t = 0
    for (let i = 0; i < 1000; i++) t += enCentimes('0,10')!
    egal(t, 10_000); egal(formaterEuros(t), '100 €')
  }),
  doit('un montant rond n\'a pas de décimales, un montant à centimes en a deux', () => {
    egal(formaterEuros(20000), '200 €')
    vrai(formaterEuros(24550).startsWith('245,50'), `obtenu ${formaterEuros(24550)}`)
    egal(formaterEuros(0), '0 €'); egal(formaterEuros(5), '0,05 €')
  }),
  doit('une dépense écrite mais non relue ne peut jamais être saisie deux fois', async () => {
    const verrou = { enregistree: false, enVol: false }
    let ecritures = 0
    const premier = await ecrireDepenseUneFois(
      verrou,
      async () => { ecritures++ },
      async () => { throw new Error('la relecture a refusé') },
    )
    egal(premier, 'a_relire', "une écriture durable est présentée comme un échec d'écriture")
    egal(ecritures, 1, "la première validation n'a pas écrit exactement une fois")
    const second = await ecrireDepenseUneFois(
      verrou,
      async () => { ecritures++ },
      async () => undefined,
    )
    egal(second, 'ignoree', 'le verrou durable a été réarmé après la relecture refusée')
    egal(ecritures, 1, 'le second tap a dupliqué la dépense')

    const source = sansCommentaires(
      Object.entries(ECRANS).find(([fichier]) => fichier.endsWith('/Depense.tsx'))?.[1] ?? '')
    vrai(/data-enregistree="1"/.test(source),
      "l'écran ne matérialise pas l'état enregistré après une relecture refusée")
    vrai(/Relire le total/.test(source),
      "l'écran ne propose aucun geste sûr pour reprendre la relecture")

    // Même preuve sur le véritable écrivain : la ligne métier réussit, puis la
    // sonde auxiliaire refuse. Ce rejet ne doit ni réarmer ni doubler l'INSERT.
    const consentement = localStorage.getItem('mypaddock.mesures')
    let insertsDepense = 0
    const db = {
      execute: async (sql: string) => {
        if (/INSERT INTO depense/.test(sql)) insertsDepense++
        if (/UPDATE mesure/.test(sql)) throw new Error('sonde refusée')
        return {}
      },
    } as any
    const verrouReel = { enregistree: false, enVol: false }
    try {
      accepterMesures(true)
      await ouverture(db)
      const ecrire = () => creerDepense(db, {
        cible: 'saison', roulageId: null, machineId: null, centimes: 1234,
        libelle: 'Essence', date: '2026-08-26', poste: 'essence',
      })
      egal(await ecrireDepenseUneFois(
        verrouReel, ecrire, async () => { throw new Error('relecture refusée') }), 'a_relire')
      egal(await ecrireDepenseUneFois(verrouReel, ecrire, async () => undefined), 'ignoree')
      egal(insertsDepense, 1,
        'le rejet de la mesure auxiliaire a fait saisir deux fois la dépense')
    } finally {
      // Remet aussi l'état module à « aucune ouverture », sans écrire de ligne.
      accepterMesures(false)
      await ouverture(db)
      if (consentement == null) localStorage.removeItem('mypaddock.mesures')
      else localStorage.setItem('mypaddock.mesures', consentement)
    }
  }),

  /* ─── L'ARGENT AU MOIS — épique 19 ─────────────────────────────────────
     « Budget c'est pas correct : le coût est de 2180 mais le budget est de
     500/mois » — Julian, 25 août 2026. Sa décision : LES DEUX, un plafond
     annuel ET un repère mensuel.

     Ces essais tiennent les DEUX moitiés de chaque règle. Le mois doit exister
     (moitié positive), et il doit rester un CONSTAT : aucun mois comparé au
     précédent, aucune projection, aucun reste à dépenser (moitié négative). La
     seconde moitié ne se prouve pas par un commentaire — elle se prouve en
     montrant qu'il n'existe nulle part où l'écrire. */
  doit('un mois se lit dans le jour, et un jour bancal n\'invente aucun mois', () => {
    egal(moisDuJour('2026-07-01'), '2026-07', 'le 1er du mois')
    egal(moisDuJour('2026-07-31'), '2026-07', 'le 31 du mois')
    // Ce qui n'est pas une date rend `null` — donc « sans mois », donc une ligne
    // que l'écran DIT. Un `slice(0, 7)` nu aurait rendu « 2026-0 » ou « juillet »
    // et fabriqué un mois qui n'existe pas.
    for (const d of [null, undefined, '', '2026-07', '2026-7-1', 'demain'])
      egal(moisDuJour(d), null, `« ${d} » a produit un mois`)
  }),
  doit('le 1er et le 31 tombent dans le même mois, décembre et janvier jamais', () => {
    const m = grouperParMois([
      { date_jour: '2026-07-01', poste: 'essence', montant_centimes: 9640 },
      { date_jour: '2026-07-31', poste: 'pneus', montant_centimes: 38990 },
      // LA SAISON À CHEVAL : deux jours qui se suivent, deux mois, deux années.
      // Les confondre ferait rentrer janvier dans le bilan de l'année d'avant.
      { date_jour: '2026-12-31', poste: 'entretien', montant_centimes: 12000 },
      { date_jour: '2027-01-01', poste: 'entretien', montant_centimes: 5000 },
    ])
    egal(m.map((x) => x.mois), ['2026-07', '2026-12', '2027-01'])
    egal(m[0].total, 48630, 'le 1er et le 31 doivent s\'additionner')
    egal(m[0].n, 2)
    // Et la saison, elle, sépare bien les deux jours voisins (AD-8, AD-18).
    vrai(anneeSaison('2026-12-31') !== anneeSaison('2027-01-01'),
      'le 31 décembre et le 1er janvier sont dans la même saison')
  }),
  doit("une dépense sans jour est dite « sans mois », jamais rangée au hasard", () => {
    // ⚠ LE PRÉCÉDENT EST « SANS POSTE », ET IL EST DÉLIBÉRÉ. Les dépenses
    // saisies avant la colonne `date_jour` n'auront JAMAIS de mois. Leur donner
    // celui de leur roulage, celui de leur uuid ou le 1er janvier fabriquerait
    // une donnée que personne n'a donnée — et indiscernable d'une vraie.
    const m = grouperParMois([
      { date_jour: null, poste: null, montant_centimes: 23000 },
      { date_jour: '2026-04-12', poste: 'engagement', montant_centimes: 23000 },
      { date_jour: null, poste: 'essence', montant_centimes: 4000 },
    ])
    egal(m.map((x) => x.mois), ['2026-04', null], 'les sans-mois passent en dernier')
    egal(m[1].total, 27000); egal(m[1].n, 2)
    // Le poste manquant reste manquant DANS le mois : deux absences distinctes
    // ne se réparent pas l'une l'autre.
    // Le plus gros d'abord — 230 € sans poste, puis 40 € d'essence. Une
    // composition, pas un palmarès : le rang ne dit que la taille.
    egal(m[1].postes.map((p) => p.poste), [null, 'essence'])
    egal(m[1].postes.map((p) => p.total), [23000, 4000])
  }),
  doit('les mois se rangent dans l\'ordre du calendrier, jamais par montant', () => {
    // Trier par montant ferait du mois le plus cher une tête de liste, donc un
    // palmarès, donc un verdict — sur un mois où l'on a simplement roulé.
    //
    // ⚠ CET ESSAI NE GARDAIT RIEN, et la revue l'a prouvé en posant un tri par
    // montant dans `grouperParMois` : 84/84 restaient verts. Son jeu d'essai
    // était 09 à 1 €, 03 à 900 €, 06 à 50 € — et le montant DÉCROISSANT rend
    // mars, juin, septembre, c'est-à-dire exactement l'ordre du calendrier. Un
    // essai dont les deux règles rivales donnent la même réponse ne départage
    // rien ; il rassure, ce qui est pire que se taire.
    //
    // Les trois montants CONTREDISENT donc le calendrier, dans les deux sens :
    //   · par montant décroissant → juin, mars, septembre ;
    //   · par montant croissant   → septembre, mars, juin ;
    //   · dans l'ordre d'arrivée  → juin, septembre, mars.
    // Aucun des trois n'est mars, juin, septembre. Seul le calendrier l'est.
    const m = grouperParMois([
      { date_jour: '2026-06-02', poste: 'pneus', montant_centimes: 90000 },
      { date_jour: '2026-09-02', poste: 'pneus', montant_centimes: 100 },
      { date_jour: '2026-03-02', poste: 'pneus', montant_centimes: 5000 },
    ])
    egal(m.map((x) => x.mois), ['2026-03', '2026-06', '2026-09'])
    // Et chaque mois garde SON total : un tri qui déplacerait les lignes sans
    // toucher aux montants se verrait ici, et pas seulement dans l'ordre des clés.
    egal(m.map((x) => x.total), [5000, 90000, 100], 'un mois a changé de total')
  }),

  doit('un mois se lit dans le CALENDRIER, pas dans la forme de la date', () => {
    // ⚠ LA GARDE D'À CÔTÉ NE TESTAIT QUE L'ALLURE. `2026-13-45` a la bonne
    // forme : il passait, `slice(0, 7)` en tirait le mois « 2026-13 », et
    // `nomMois` — qui ne connaît que douze noms — rendait « 2026 » tout court à
    // l'écran. Une ligne intitulée « 2026 » au milieu des mois se lit comme un
    // total d'année : le mauvais chiffre au bon endroit, ce qui est pire qu'une
    // absence. C'est le calendrier qui tranche, pas le gabarit.
    egal(moisDuJour('2026-13-45'), null, 'un treizième mois de quarante-cinq jours')
    egal(moisDuJour('2026-00-10'), null, 'un mois zéro')
    egal(moisDuJour('2026-01-00'), null, 'un jour zéro')
    egal(moisDuJour('2026-02-30'), null, 'le 30 février')
    egal(moisDuJour('2026-02-29'), null, 'le 29 février d\'une année qui ne l\'est pas')
    egal(moisDuJour('2026-04-31'), null, 'le 31 avril')
    // Et ce qui existe passe, y compris les bords qui n'ont l'air de rien.
    egal(moisDuJour('2028-02-29'), '2028-02', 'le 29 février d\'une bissextile')
    egal(moisDuJour('2026-01-01'), '2026-01')
    egal(moisDuJour('2026-12-31'), '2026-12')
  }),

  doit('le jour d\'une dépense ne sort pas de l\'année que le budget montre', () => {
    // ⚠ LE DÉFAUT ÉTAIT COMPLET, ET IL FAISAIT DISPARAÎTRE DE L'ARGENT. Le champ
    // jour n'avait ni `min` ni `max` ; `saison_annee` se dérive du jour (AD-18) ;
    // et les DEUX lectures du budget filtrent `WHERE saison_annee = ?` sur
    // l'année en cours, la seule que le garage affiche. Une facture de décembre
    // retrouvée en janvier — le cas MÊME pour lequel le champ existe — s'écrivait
    // parfaitement, partait parfaitement, et n'apparaissait plus nulle part,
    // pendant que le raccourci de l'accueil annonçait « le détail vit au garage,
    // dans le budget ». Le produit annonçait donc quelque chose de faux.
    vrai(jourDansLAnnee('2026-01-01', 2026), 'le premier jour de l\'année')
    vrai(jourDansLAnnee('2026-12-31', 2026), 'le dernier')
    vrai(!jourDansLAnnee('2025-12-30', 2026), 'la facture de décembre dernier')
    vrai(!jourDansLAnnee('2027-01-01', 2026), 'le lendemain de la saison')
    // Un jour qui n'existe pas n'est dans aucune année : la borne s'appuie sur le
    // même calendrier que le mois, pas sur un `slice` de quatre caractères — sans
    // quoi `2026-13-45` serait « dans l'année 2026 » et ressortirait « sans mois »
    // au garage, deux verdicts contraires sur la même ligne.
    vrai(!jourDansLAnnee('2026-13-45', 2026), 'un mois treize dans la bonne année')
    vrai(!jourDansLAnnee('', 2026), 'un champ vidé à la main')
  }),

  doit('le jour d\'une dépense est celui du PAIEMENT, pas de la journée visée', () => {
    // ⚠ CONSTATÉ À L'ÉCRAN AVANT D'ÊTRE ÉCRIT ICI : journée annoncée au
    // 2026-10-04, engagement de 230 € noté en août, et le garage affichait
    // « Par mois · octobre 2026 · 230 € ». L'argent était sorti en août.
    // Trois choses cassaient ensemble :
    //   ① la migration déclare `date_jour` = « le jour où la dépense a été
    //     payée » — le produit écrivait autre chose sous ce nom ;
    //   ② une liste « Par mois » qui contient un mois À VENIR se lit comme une
    //     prévision, ce que les deux clauses d'argent refusent ligne à ligne ;
    //   ③ depuis l'épique 17 les journées à venir sont de premier rang : c'était
    //     LE chemin de l'engagement, pas un bord.
    // La journée n'est pas perdue — elle reste la CIBLE, `cible` et `roulage_id`
    // sont là pour ça. Ce qu'elle ne donne plus, c'est le jour.
    const saisies = Object.entries(SOURCES)
      .filter(([c]) => /\/ecrans\/(Depense|Budget)\.tsx$/.test(c))
    egal(saisies.length, 2, 'les deux écrans qui saisissent une dépense')
    for (const [chemin, texte] of saisies) {
      const f = chemin.replace(/^.*\/src\//, 'src/')
      for (const m of texte.matchAll(/\bdate:\s*([^\n]*)/g))
        vrai(!/roulage/i.test(m[1]),
          `${f} date une dépense sur la journée visée : « ${m[1].trim()} »`)
      // Et le jour se SAISIT. Sans champ, « aujourd'hui » est la seule valeur
      // possible : la facture retrouvée trois semaines plus tard repart au
      // mauvais mois, c'est-à-dire exactement le défaut que 19.2 prétend régler.
      vrai(/type="date"/.test(texte), `${f} n'offre aucun champ jour`)
    }
  }),

  doit('aucun écran n\'affirme un repère mensuel sans l\'avoir regardé', () => {
    // ⚠ `repereMensuel` REND `null` SUR UN PLAFOND À ZÉRO autant que sur un
    // plafond absent, et `formaterEuros(null!)` ne se plaint de rien : il divise
    // `null` par cent et rend « 0 € ». Un repère mensuel de 0 € est un chiffre
    // faux affiché avec aplomb, et le pilote n'a aucun moyen de le savoir.
    // Trois écrans posaient ce `!` ; un seul le gardait vraiment, et rien dans le
    // code ne disait lequel. La règle est donc devenue : personne ne le pose.
    const fautifs: string[] = []
    for (const [chemin, texte] of Object.entries(ECRANS))
      if (/repereMensuel\([^()]*\)\s*!(?!=)/.test(texte))
        fautifs.push(chemin.replace(/^.*\/src\//, 'src/'))
    egal(fautifs, [], 'un repère mensuel affirmé sans l\'avoir lu')
  }),
  doit('un mois ne porte AUCUN champ où loger une comparaison', () => {
    // ⚠ L'ESSAI NÉGATIF DE L'ÉPIQUE 19, et il ne se remplace pas par un
    // commentaire. « Aucun mois ne se compare au précédent, aucun + 40 %, aucun
    // reste à dépenser » : la seule garantie durable est qu'il n'existe NULLE
    // PART où écrire ces chiffres. Ajouter `variation` ou `restant` à
    // `LigneMois` fait rougir cette ligne avant d'atteindre un écran.
    const [m] = grouperParMois([{ date_jour: '2026-05-04', poste: 'autre', montant_centimes: 1 }])
    egal(Object.keys(m).sort(), ['mois', 'n', 'postes', 'total'])
    egal(Object.keys(m.postes[0]).sort(), ['poste', 'total'])
  }),
  doit('le repère du mois est le plafond divisé par douze, et rien d\'autre', () => {
    // La décision de Julian, moitié « mois ». Il se DÉRIVE : deux montants
    // saisis séparément — 6000 à l'année, 400 au mois — finissent par se
    // contredire, et personne ne sait plus lequel des deux ment.
    egal(repereMensuel(50_000), 4167, '500 € par an')
    egal(repereMensuel(600_000), 50_000, '6000 € par an font 500 € par mois')
    // Sans plafond, pas de repère. Ni zéro, ni tiret : l'absence est une absence.
    egal(repereMensuel(null), null); egal(repereMensuel(0), null); egal(repereMensuel(-1), null)
    // ⚠ DOUZE REPÈRES NE REFONT PAS LE PLAFOND — 41,67 × 12 = 500,04. C'est
    // pourquoi ce chiffre ne s'additionne JAMAIS dans le produit : il se lit un
    // mois à la fois. L'essai fige l'écart pour que personne ne le somme.
    vrai(repereMensuel(50_000)! * 12 !== 50_000, 'le repère se somme en plafond')
  }),
  doit('la jauge distingue 501 € de 2180 € sur un plafond de 500 €', () => {
    // ⚠ LE DÉFAUT EXACT DE JULIAN. `Math.min(100, consommé / plafond)` rendait
    // les deux IDENTIQUES : une barre pleine, et pas un pixel entre un
    // dépassement d'un euro et un dépassement de quatre fois le budget.
    const juste = jaugeBudget(50_100, 50_000)
    const loin = jaugeBudget(218_000, 50_000)
    egal(juste.part, 100); egal(loin.part, 100, 'la barre ne dépasse jamais 100 %')
    vrai(juste.repere !== loin.repere, 'les deux dépassements se confondent encore')
    vrai(juste.repere! > 99, `à un euro près, le plafond est au bout : ${juste.repere}`)
    vrai(loin.repere! < 25, `à 2180 € sur 500 €, le plafond est au quart : ${loin.repere}`)
  }),
  doit('en deçà du plafond la jauge ne porte aucun repère, et ne divise jamais par zéro', () => {
    const dessous = jaugeBudget(20_000, 50_000)
    egal(dessous.part, 40); egal(dessous.repere, null, 'un repère avant le dépassement')
    // Le plafond absent (FR-24 : la jauge ne devrait alors pas s'afficher du
    // tout) rendait `Infinity` et une barre large de « Infinity% ».
    egal(jaugeBudget(20_000, 0), { part: 0, repere: null })
    egal(jaugeBudget(0, 50_000), { part: 0, repere: null })
    // Et rien d'autre que deux longueurs ne sort d'ici : ni verdict, ni couleur,
    // ni « dépassé ». Dépasser son budget n'est pas une faute.
    egal(Object.keys(jaugeBudget(1, 2)).sort(), ['part', 'repere'])
  }),

  /* ─── LE CHRONO ────────────────────────────────────────────────────────── */
  doit('le chrono se lit en minutes, secondes et dixième', () => {
    egal(formaterChrono(97_300), '1\'37"3')
    egal(formaterChrono(130_000), '2\'10"0')
    egal(formaterChrono(59_999), '0\'59"9')
    egal(formaterChrono(0), '0\'00"0')
  }),
  doit("l'écart porte TOUJOURS son signe, jamais la couleur seule", () => {
    // La couleur ne se distingue pas en deutéranopie et ne survit pas à une
    // capture en noir et blanc. Le signe, si.
    vrai(formaterEcart(-8300).startsWith('−'), `mieux : ${formaterEcart(-8300)}`)
    vrai(formaterEcart(8300).startsWith('+'), `plus lent : ${formaterEcart(8300)}`)
    vrai(formaterEcart(0).startsWith('+'), `nul : ${formaterEcart(0)}`)
    vrai(formaterEcart(-8300) !== formaterEcart(8300), 'les deux sens se confondent')
  }),

  /* ─── LA SAISON — AD-8, aucun mois n'est testé ─────────────────────────── */
  doit('janvier et décembre tombent dans la même saison', () => {
    egal(anneeSaison('2027-01-03'), 2027)
    egal(anneeSaison('2027-12-28'), 2027)
    // C'est la clause qui rend la règle vraie pour qui roule en janvier : si un
    // mois était testé quelque part, ces deux appels divergeraient.
    egal(anneeSaison('2027-01-03'), anneeSaison('2027-12-28'))
  }),

  /* ─── L'UUID v7 — AD-14, et le piège le plus coûteux ───────────────────── */
  doit("l'instant se lit dans l'identifiant, au tour de milliseconde", () => {
    const t = 1_755_600_000_000
    const hex = t.toString(16).padStart(12, '0')
    const v7 = `${hex.slice(0, 8)}-${hex.slice(8)}-7abc-8def-0123456789ab`
    egal(instantDeLId(v7), t)
  }),
  doit('un uuid v4 rend NaN et non une date plausible', () => {
    // LE PIÈGE. Sans le contrôle de version, un v4 rend un nombre parfaitement
    // valide et parfaitement faux — une date en 1973 ou en 4000, qui traverse
    // tous les calculs sans lever d'erreur. Un délai absurde qu'on croit est
    // pire qu'un délai absent.
    vrai(Number.isNaN(instantDeLId('9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d')), 'un v4 est passé')
    vrai(Number.isNaN(instantDeLId('pas-un-uuid')), 'une chaîne quelconque est passée')
    vrai(Number.isNaN(instantDeLId('')), 'la chaîne vide est passée')
  }),
  doit('le seuil de saisie reste à 48 h', () => egal(SEUIL_H, 48)),

  /* ─── LES JOURS — et le changement d'heure ─────────────────────────────── */
  doit('un écart de jours ne compte que des jours', () => {
    egal(ecartJours('2026-08-19', '2026-08-22'), 3)
    egal(ecartJours('2026-08-22', '2026-08-19'), -3)
    egal(ecartJours('2026-08-19', '2026-08-19'), 0)
  }),
  doit("le passage à l'heure d'été ne mange pas un jour", () => {
    // Nuit du 28 au 29 mars 2026 en Europe : 23 heures seulement. Un calcul
    // ancré à minuit rendrait 1 jour au lieu de 2. L'ancrage à midi UTC le tient.
    egal(ecartJours('2026-03-28', '2026-03-30'), 2)
    egal(ecartJours('2026-10-24', '2026-10-26'), 2)   // et le retour, nuit de 25 h
  }),
  doit('FR-13 — aucun impératif, aucune échéance, aucun mot de rareté', () => {
    const dits = [...Array(40).keys()].flatMap((j) => [direAVenir(j), direPasse(j), direAVenir(-j)])
    for (const d of dits) {
      vrai(!d.includes('!'), `« ${d} » porte un point d'exclamation`)
      for (const mot of ['plus que', 'reste', 'encore', 'vite', 'dernier', 'urgent', 'oublie'])
        vrai(!d.toLowerCase().includes(mot), `« ${d} » contient « ${mot} »`)
    }
    egal(direAVenir(0), "aujourd'hui"); egal(direAVenir(1), 'demain')
    egal(direPasse(1), 'hier'); egal(direPasse(3), 'il y a 3 jours')
  }),

  /* ─── LES EN-TÊTES D'IMAGE — la sûreté iOS ─────────────────────────────── */
  doit('les dimensions se lisent dans un PNG sans le décoder', async () => {
    const t = new Uint8Array(32)
    t.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 73, 72, 68, 82])
    new DataView(t.buffer).setUint32(16, 8064); new DataView(t.buffer).setUint32(20, 6048)
    egal(await dimensions(new Blob([t])), { w: 8064, h: 6048 })
  }),
  doit('les dimensions se lisent dans le marqueur SOF d\'un JPEG', async () => {
    // Un SOF0 COMPLET : longueur, précision, hauteur, largeur, puis les trois
    // composantes. Un segment tronqué n'existe dans aucun appareil, et le scan
    // exige à juste titre de quoi lire avant de lire.
    const t = new Uint8Array([
      0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0, 0, 0, 0,
      0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01])
    new DataView(t.buffer).setUint16(7, 6048); new DataView(t.buffer).setUint16(9, 8064)
    egal(await dimensions(new Blob([t])), { w: 8064, h: 6048 })
  }),
  doit('le scan enjambe l\'EXIF avant d\'atteindre le SOF', async () => {
    // LE CAS RÉEL. Une photo d'iPhone commence par un APP1/EXIF de plusieurs
    // kilo-octets ; le marqueur de dimensions est loin derrière. Un scan qui
    // s'arrêterait au premier segment ne lirait jamais rien.
    const exif = 200
    const t = new Uint8Array(4 + exif + 19)
    t.set([0xff, 0xd8, 0xff, 0xe1]); new DataView(t.buffer).setUint16(4, exif)
    const sof = 4 + exif
    t.set([0xff, 0xc0, 0x00, 0x11, 0x08, 0, 0, 0, 0,
      0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01], sof)
    new DataView(t.buffer).setUint16(sof + 5, 3024)
    new DataView(t.buffer).setUint16(sof + 7, 4032)
    egal(await dimensions(new Blob([t])), { w: 4032, h: 3024 })
  }),
  doit('un fichier illisible rend null et ne jette pas', async () => {
    egal(await dimensions(new Blob([new Uint8Array([1, 2, 3, 4])])), null)
    egal(await dimensions(new Blob([])), null)
  }),

  /* ─── LE NOM DE FICHIER — AD-13, l'extension suit le TYPE RÉEL ─────────── */
  doit("l'extension se dérive du type réel du blob, jamais du format demandé", () => {
    // Un `toBlob('image/webp')` peut rendre du PNG sans le dire. Nommer d'après
    // ce qu'on a demandé produit un fichier que la plateforme refuse d'ouvrir.
    egal(enFichier(new Blob([], { type: 'image/png' }), 'Pau-Arnos', '2026-08-19').name,
      'pau-arnos-2026-08-19.png')
    egal(enFichier(new Blob([], { type: 'image/jpeg' }), 'Le Vigeant', '2026-08-19').name,
      'le-vigeant-2026-08-19.jpg')
  }),

  /* ─── LES POIDS ────────────────────────────────────────────────────────── */
  doit('un poids s\'annonce en Ko sous le Mo, en Mo au-delà', () => {
    egal(formaterPoids(1024), '1 Ko'); egal(formaterPoids(133_000), '130 Ko')
    egal(formaterPoids(3_355_443), '3,2 Mo'); egal(formaterPoids(1), '1 Ko')
  }),

  /* ─── LA FILE D'ENVOI — AD-12, le référentiel ne remonte pas ───────────── */
  doit("seules les tables de pilote portent un propriétaire", () => {
    for (const t of ['machine', 'roulage', 'session', 'tour', 'depense', 'photo', 'geste'])
      vrai(PORTE_PROPRIETAIRE.has(t), `${t} devrait porter un propriétaire`)
    // Le référentiel est LU, jamais écrit. Lui apposer un pilote_id à l'envoi
    // produirait une ligne que Postgres refuse — et une file bloquée derrière.
    for (const t of ['circuit', 'conseil', 'cap', 'organisateur', 'bareme', 'roulage_publie'])
      vrai(!PORTE_PROPRIETAIRE.has(t), `${t} est du référentiel et ne doit rien porter`)
  }),

  // ⚠ CES DEUX ESSAIS EXISTENT PARCE QUE L'ORDRE D'ENVOI A ÉTÉ FAUX QUATRE FOIS,
  // dont deux fois en sens inverse l'un de l'autre. Une ligne qui part avant
  // celle qu'elle référence est refusée en 23503 : elle est écartée
  // DÉFINITIVEMENT, et le pilote ne l'apprend pas. Une relecture attentive n'a
  // pas suffi quatre fois de suite ; une assertion, si.
  doit("l'envoi n'oublie aucune table du pilote", () => {
    const duSchema = AppSchema.tables.map((t) => t.name).filter((n) => !REFERENTIEL.has(n))
    const envoyees = new Set<string>(ORDRE)
    for (const t of duSchema)
      vrai(envoyees.has(t), `${t} est écrite par le pilote et ne part jamais`)
    for (const t of ORDRE)
      vrai(duSchema.includes(t), `${t} part à l'envoi mais n'existe pas au schéma`)
  }),
  doit("chaque table part après ce qu'elle référence", () => {
    const rang = new Map<string, number>(ORDRE.map((t, i) => [t, i]))
    for (const [table, requises] of Object.entries(DEPENDANCES)) {
      vrai(rang.has(table), `${table} est décrite mais ne part pas`)
      for (const r of requises) {
        // L'unique exception, et elle est assumée : le cycle photo ↔ intervention.
        // Le lien coupé est reposé par un dernier passage, pas par l'ordre.
        if (table === LIEN_DIFFERE.table && r === 'photo') continue
        vrai(rang.get(r)! < rang.get(table)!,
          `${table} part avant ${r}, qu'elle référence — 23503 à l'envoi`)
      }
    }
    for (const t of ORDRE)
      vrai(t in DEPENDANCES, `${t} part sans qu'on ait dit ce qu'elle référence`)
    // Le cycle doit RESTER un cycle : si l'un des deux liens disparaissait du
    // schéma, le détour n'aurait plus lieu d'être et devrait être retiré.
    vrai(DEPENDANCES.intervention.includes('photo') && DEPENDANCES.photo.includes('intervention'),
      'le cycle photo ↔ intervention a disparu : le lien différé est devenu inutile')
  }),

  // ⚠ LE DÉFAUT SYMÉTRIQUE DE L'ORDRE D'ENVOI, et il est plus silencieux encore.
  // Une table absente des règles de synchronisation MONTE et NE REDESCEND JAMAIS.
  // Rien n'échoue : le pilote saisit, la ligne part, le serveur la garde — et le
  // jour où il change de téléphone, elle n'est pas là. Aucune erreur, aucun
  // message, une saison amputée. Le fichier est un YAML, donc rien ne le reliait
  // au schéma : c'est cet essai qui le relie.
  doit('tout ce que le pilote écrit redescend sur son téléphone', () => {
    const lues = new Set(
      [...REGLES_DE_SYNCHRO.matchAll(/FROM\s+(\w+)/g)].map((m) => m[1]))
    const absentesAssumees = new Set([
      // Un flux global ferait descendre TOUS les barèmes constructeur chez un
      // pilote qui possède une moto. Il lui faut un flux paramétré par le
      // garage — mouvement 3, et pas avant.
      'bareme',
    ])
    for (const t of AppSchema.tables.map((x) => x.name)) {
      if (absentesAssumees.has(t)) continue
      vrai(lues.has(t), `${t} est au schéma local mais ne descend jamais`)
    }
  }),

  doit('la publication PowerSync porte toutes les tables ajoutées après son origine', () => {
    const entree = Object.entries(MIGRATIONS)
      .find(([nom]) => nom.includes('powersync_publie_toutes_les_tables'))
    vrai(!!entree, 'la reprise de publication PowerSync est introuvable')
    const sql = entree![1]
    const bloc = sql.match(/foreach\s+nom_table\s+in\s+array\s+array\[([\s\S]*?)\]/i)
    vrai(!!bloc, 'la liste idempotente des tables publiées est introuvable')
    const publiees = [...bloc![1].matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort()
    const attendues = [
      'evenement_vise', 'horloge', 'checklist_ligne', 'equipement', 'chute',
      'document', 'generation', 'virage', 'coefficient_usure', 'regle_organisateur',
    ].sort()
    egal(publiees, attendues, 'la reprise ne publie pas la liste convenue')
    vrai(/from\s+pg_publication_tables/i.test(sql),
      'la migration ne regarde pas la publication réelle')
    vrai(/pubname\s*=\s*'powersync'/i.test(sql),
      'la migration pourrait modifier une autre publication')
    vrai(/and\s+not\s+exists/i.test(sql),
      'la migration réajoute des tables déjà publiées et ne peut pas être rejouée')
    vrai(/execute\s+format\('alter publication powersync add table public\.%I'/i.test(sql),
      'la migration ne réalise aucun ajout à la publication')
  }),

  // L'inventaire de l'effacement se lit sur le seul écran du produit qui n'a pas
  // de corbeille. Une table sans nom s'y affichait en nom de schéma — et un
  // inventaire qu'on ne comprend pas ne pèse rien dans la décision.
  doit("tout ce qui s'efface porte un nom de pilote, pas un nom de table", () => {
    for (const t of ORDRE) {
      vrai(t in NOM_TABLE, `${t} n'a pas de nom lisible`)
      const [un, plusieurs] = NOM_TABLE[t]
      vrai(un.length > 1 && plusieurs.length > 1, `${t} : nom vide`)
      vrai(!un.includes('_') && !plusieurs.includes('_'), `${t} : nom de schéma`)
    }
    egal(direCombien('roulage', 1), '1 journée')
    egal(direCombien('roulage', 5), '5 journées')
    // Le pluriel est ÉCRIT, jamais fabriqué : « pièces d'équipement » ne
    // s'obtient pas en ajoutant un « s » à la fin.
    egal(direCombien('equipement', 2), "2 pièces d'équipement")
  }),

  /* ─── QUEL EXEMPLAIRE DU PRODUIT EST-CE ───────────────────────────────── */
  // Se tromper vers « recette » fait un bandeau de trop. Se tromper vers
  // « production » déverse une base d'essai dans une vraie saison, et la
  // synchronisation continue reste allumée depuis l'origine de test.
  doit("un hôte inconnu n'est JAMAIS pris pour la production", () => {
    egal(lireEnvironnement(undefined, 'mypaddock-git-dev-julian-talous-projects.vercel.app'), 'recette')
    egal(lireEnvironnement(undefined, 'mypaddock-recette.vercel.app'), 'recette')
    egal(lireEnvironnement(undefined, 'mypaddock.fr'), 'recette')
    egal(lireEnvironnement(undefined, ''), 'recette')
  }),
  doit("la production se reconnaît, et le poste de développement aussi", () => {
    egal(lireEnvironnement(undefined, 'mypaddock.vercel.app'), 'production')
    egal(lireEnvironnement(undefined, 'localhost'), 'local')
    egal(lireEnvironnement(undefined, '127.0.0.1'), 'local')
  }),
  doit('une déclaration explicite prime sur l\'hôte, une déclaration absurde non', () => {
    egal(lireEnvironnement('recette', 'mypaddock.vercel.app'), 'recette')
    egal(lireEnvironnement('  PRODUCTION ', 'localhost'), 'production')
    // Une valeur qu'on ne comprend pas ne doit pas ouvrir la porte : on retombe
    // sur l'hôte, donc sur le défaut prudent.
    egal(lireEnvironnement('prod', 'mypaddock-recette.vercel.app'), 'recette')
    egal(lireEnvironnement('', 'mypaddock.vercel.app'), 'production')
  }),

  /* ─── OÙ VIT LA SAISON ─────────────────────────────────────────────────── */
  // Le silence est un CRITÈRE, pas un défaut d'affichage : un bloc qui reste
  // après que le stockage est devenu persistant devient une publicité pour
  // l'installation, et on cesse de le lire — donc on ne le lira pas non plus le
  // jour où il dit quelque chose.
  doit('rien ne s\'affiche quand le stockage est persistant', () => {
    const abri: Abri = { persistant: true, installee: false, proposable: true, systeme: 'ios', menace: false }
    egal(direLAbri(abri), null)
    egal(direLAbri({ ...abri, installee: true, systeme: 'autre' }), null)
  }),
  doit('la menace nommée est celle du système, pas une menace générique', () => {
    const base: Abri = { persistant: false, installee: false, proposable: false, systeme: 'ios', menace: true }
    // iOS PLAFONNE DANS LE TEMPS — sept jours sans visite — et c'est le seul cas
    // qui tombe tout seul sur un carnet ouvert onze fois par an.
    const ios = direLAbri(base)
    vrai(!!ios && /sept jours/.test(ios.texte), 'iOS doit nommer les sept jours')
    vrai(!!ios && /écran d’accueil/.test(ios.geste ?? ''), 'iOS doit décrire le geste Safari')
    // Ailleurs, l'éviction se fait sous pression de place : dire « sept jours »
    // serait faux, et une menace fausse est une menace qu'on cesse de croire.
    const autre = direLAbri({ ...base, systeme: 'autre' })
    vrai(!!autre && /manque de place/.test(autre.texte), 'ailleurs, c’est la place')
    vrai(!!autre && !/sept jours/.test(autre.texte), 'ailleurs, PAS les sept jours')
  }),
  doit('installée mais non persistante : le produit le dit quand même', () => {
    // Le raccourci « installée donc protégée » n'est garanti nulle part. On
    // énonce l'état réel, même quand aucun geste ne le règle.
    const m = direLAbri({ persistant: false, installee: true, proposable: false, systeme: 'ios', menace: true })
    vrai(!!m && /refusé/.test(m.titre), 'le refus doit être nommé')
    egal(m?.geste, null)
  }),

  // ⚠ L'EMPORT EST LE DERNIER FILET — celui qui sert le jour où le compte est
  // perdu, le serveur suspendu, le produit arrêté. Sa liste de tables était
  // tenue à la main et avait SIX TABLES DE RETARD sur la sauvegarde : ni
  // l'équipement, ni les chutes, ni les horloges d'usure, ni les preuves
  // d'atelier n'en sortaient. Et le fichier écrivait quand même « rien — tout
  // ce que porte ce téléphone est ici ». Un filet qui ment sur ses trous est
  // pire qu'un filet troué : on ne va pas chercher ailleurs ce qu'on croit tenir.
  doit("l'emport sort exactement ce que la sauvegarde envoie", () => {
    egal([...TABLES_EMPORTEES], [...ORDRE])
  }),

  /* ─── LE CRASH — UN ÉTAT EXPLICITE, JAMAIS DÉDUIT DU SILENCE ─────────── */
  doit('une écriture réussie suivie d’une relecture refusée ne se rejoue pas', async () => {
    let insertions = 0, relectures = 0
    const resultat = await ecrirePuisRelire(
      async () => { insertions++; return 'crash-1' },
      async () => { relectures++; throw new Error('lecture SQLite refusée') },
    )
    egal(resultat, { valeur: 'crash-1', relue: false })
    egal(insertions, 1, 'le crash a été inséré une seconde fois après l’échec de lecture')
    egal(relectures, 1, 'la relecture refusée a été masquée')
  }),

  doit('une nouvelle action crash efface toute erreur contextuelle précédente', () => {
    const geste = Object.entries(SOURCES)
      .find(([nom]) => nom.endsWith('/ecrans/geste.ts'))?.[1] ?? ''
    const chute = Object.entries(ECRANS)
      .find(([nom]) => nom.endsWith('/ecrans/Chute.tsx'))?.[1] ?? ''
    const racine = chute.slice(chute.indexOf('export function Chutes'), chute.indexOf('function UneChute'))
    vrai(/surErreur\?\.\(null\)/.test(geste),
      'lancer une autre action ne vide pas le canal d’erreur partagé')
    vrai(/const \[erreur, setErreur\] = useState/.test(racine),
      'les actions de statut gardent des erreurs indépendantes et périmées')
    vrai((racine.match(/Réessaie\.', setErreur\)/g) ?? []).length === 3,
      'documenter, déclarer aucun et remettre à renseigner ne partagent pas le même canal')
  }),

  doit('consigner un crash qualifie le roulage dans la même transaction', async () => {
    const ecrites: { sql: string; params: unknown[] }[] = []
    const tx = {
      getOptional: async () => ({ id: 'r1' }),
      execute: async (sql: string, params: unknown[] = []) => {
        ecrites.push({ sql, params }); return {}
      },
    }
    const db = {
      writeTransaction: async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
      execute: async () => ({}),
    } as any
    await consignerChute(db, { roulageId: 'r1', endroit: 'virage 3' })
    egal(ecrites.length, 2, 'le crash et sa qualification ne sont pas un seul geste')
    vrai(/INSERT INTO chute/.test(ecrites[0].sql), 'la chute ne naît pas en premier')
    vrai(/crash_statut = 'documente'/.test(ecrites[1].sql),
      'le roulage reste dans un état inconnu après la chute')
  }),

  doit('« aucun crash » est refusé dès qu\'une chute existe', async () => {
    let ecrit = false
    const tx = {
      getOptional: async () => ({ id: 'r1' }),
      get: async () => ({ n: 1 }),
      execute: async () => { ecrit = true; return {} },
    }
    const db = {
      writeTransaction: async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
      execute: async () => ({}),
    } as any
    let refuse = false
    try { await declarerAucunCrash(db, 'r1') } catch { refuse = true }
    vrai(refuse, 'une journée avec chute a accepté « aucun crash »')
    vrai(!ecrit, 'le statut a été modifié malgré le refus')
  }),

  doit('retirer la dernière chute remet le roulage à renseigner, jamais à aucun', async () => {
    const ecrites: { sql: string; params: unknown[] }[] = []
    const tx = {
      getOptional: async () => ({ roulage_id: 'r1' }),
      get: async () => ({ n: 0 }),
      execute: async (sql: string, params: unknown[] = []) => {
        ecrites.push({ sql, params }); return {}
      },
    }
    const db = {
      writeTransaction: async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
      execute: async () => ({}),
    } as any
    await oublierChute(db, 'c1')
    vrai(ecrites.some((e) => /UPDATE photo SET chute_id = NULL/.test(e.sql)),
      "retirer le récit a détruit le lien nécessaire à l'album de la journée")
    vrai(!ecrites.some((e) => /DELETE FROM photo/.test(e.sql)),
      'retirer le récit a détruit sa photo')
    const statut = ecrites.find((e) => /UPDATE roulage SET crash_statut/.test(e.sql))
    vrai(!!statut, 'le roulage ne change pas de qualification')
    egal(statut!.params, ['a_renseigner', 'r1'])
  }),

  doit('une réparation de crash crée une dépense et une intervention liées exactement une fois', async () => {
    const ecrites: { sql: string; params: unknown[] }[] = []
    const tx = {
      getOptional: async () => ({ machine_id: 'm1' }),
      execute: async (sql: string, params: unknown[] = []) => {
        ecrites.push({ sql, params }); return {}
      },
    }
    const db = {
      writeTransaction: async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
      execute: async () => ({}),
    } as any
    await consignerReparationDeChute(db, {
      chuteId: 'c1', machineId: 'm1', libelle: 'Levier remplacé',
      categorie: 'entretien', date: '2026-08-26', centimes: 12750,
    })
    egal(ecrites.length, 2, 'une ligne inattendue double le coût')
    vrai(/INSERT INTO depense/.test(ecrites[0].sql), 'la dépense manque')
    vrai(/INSERT INTO intervention/.test(ecrites[1].sql), 'la réparation manque')
    egal(ecrites[0].params[0], ecrites[1].params[7],
      "l'intervention ne référence pas l'unique dépense créée")
    egal(ecrites[0].params[3], 12750, 'la dépense a perdu le coût')
    egal(ecrites[1].params[3], 'entretien', 'la catégorie choisie a été remplacée')
    egal(ecrites[1].params[6], 12750, 'la réparation a perdu le coût documenté')
    const depot = Object.entries(SOURCES)
      .find(([nom]) => nom.endsWith('/db/depot.ts'))?.[1] ?? ''
    const debut = depot.indexOf('export const coutMachine')
    const coutMachine = depot.slice(debut, depot.indexOf('\nexport ', debut + 20))
    vrai(/depense_id IS NULL/i.test(coutMachine),
      'le coût machine additionne la dépense et son intervention une seconde fois')
  }),

  doit('une réparation de crash refuse une catégorie inventée avant toute écriture', async () => {
    let transaction = false
    const db = {
      writeTransaction: async () => { transaction = true },
      execute: async () => ({}),
    } as any
    let refusee = false
    try {
      await consignerReparationDeChute(db, {
        chuteId: 'c1', machineId: 'm1', libelle: 'Levier remplacé',
        categorie: 'cosmetique' as any, date: '2026-08-26', centimes: 12750,
      })
    } catch { refusee = true }
    vrai(refusee, 'une catégorie hors métier a été écrite')
    vrai(!transaction, 'la validation de catégorie arrive après les écritures')
  }),

  doit('une réparation de 123,45 € compte une fois dans la journée et la saison', async () => {
    const db = {
      getAll: async (sql: string) => {
        if (/JOIN chute/.test(sql)) return [{ total: 20_000 + 12_345 }]
        if (/FROM depense WHERE saison_annee/.test(sql)) return [{ total: 50_000 + 12_345 }]
        throw new Error(`requête inattendue: ${sql}`)
      },
      get: async (sql: string) => /FROM tour/.test(sql)
        ? { n: 2 }
        : { montant_centimes: 100_000 },
    } as any
    const cout = await coutDuRoulage(db, 'r1', 2026)
    egal(cout.journeeCentimes, 32_345,
      "la réparation machine n'entre pas exactement une fois dans la journée")
    egal(cout.consommeCentimes, 62_345,
      "la réparation n'entre pas exactement une fois dans la saison")

    const depot = sansCommentaires(
      Object.entries(SOURCES).find(([nom]) => nom.endsWith('/db/depot.ts'))?.[1] ?? '')
    const debut = depot.indexOf('export const coutRoulage')
    const requete = depot.slice(debut, depot.indexOf('\nexport ', debut + 20))
    vrai(/JOIN chute/.test(requete) && /i\.depense_id = d\.id/.test(requete),
      'le coût journée ne rattache pas la dépense machine à son crash')
    vrai(/NOT \(d\.cible = 'roulage' AND d\.roulage_id = \?\)/.test(requete),
      'une dépense déjà ciblée journée est recomptée par la réparation')
    vrai(/i\.depense_id IS NULL/.test(requete),
      'un coût de réparation sans dépense a disparu de la journée')
    const saison = depot.slice(depot.indexOf('export const depenseSaison'), debut)
    vrai(!/JOIN intervention|JOIN chute/.test(saison),
      'la saison recompte la réparation en plus de son unique dépense')
  }),

  doit('une relecture refusée après photo écrite ne fabrique ni échec ni réupload', async () => {
    let versements = 0, retards = 0
    const echecs = await verserEnSerie(
      [{ name: 'crash.webp' }],
      async () => { versements++; return { id: 'p1' } },
      async () => { throw new Error('écran indisponible') },
      async () => { retards++ },
    )
    egal(versements, 1, 'le callback de rendu a relancé le versement')
    egal(echecs, [], 'une photo déjà écrite est annoncée comme ratée')
    egal(retards, 1, "l'UI ne peut pas dire que seule sa relecture a échoué")
  }),

  doit('une photo de crash garde sa journée et redescend sur un second appareil', () => {
    const source = sansCommentaires(
      Object.entries(SOURCES).find(([nom]) => nom.endsWith('/db/photos.ts'))?.[1] ?? '')
    const debut = source.indexOf('export const verserPhoto')
    const fin = source.indexOf('\nexport const', debut + 20)
    const versement = source.slice(debut, fin)
    vrai(/chuteId:\s*string/.test(source), 'une chute ne peut pas porter de photo')
    vrai(/SELECT roulage_id FROM chute/.test(versement),
      'la photo de crash ne retrouve pas sa journée')
    vrai(/INSERT INTO photo[\s\S]*roulage_id[\s\S]*chute_id/.test(versement),
      'la photo ne garde pas les deux liens nécessaires à sa survie')
    vrai(/export const photosDeLaChute/.test(source), 'aucune lecture ne rend les photos du crash')

    const lecture = source.slice(source.indexOf('export const lirePhoto'))
    const locale = lecture.indexOf('lireLocale(')
    const distante = lecture.indexOf("storage.from('photos').download")
    const cache = lecture.indexOf('ecrireLocale(', distante)
    vrai(locale >= 0 && distante > locale && cache > distante,
      'la lecture ne fait pas coffre local → Storage → cache local')
    const album = sansCommentaires(
      Object.entries(ECRANS).find(([nom]) => nom.endsWith('/Photos.tsx'))?.[1] ?? '')
    vrai(/await lirePhoto\(p\)/.test(album),
      "l'album journée ne redescend pas la photo montée sur l'appareil B")
    vrai(!/await lireLocale\(nomLocal\(p\)\)/.test(album),
      "l'album journée lit encore exclusivement le cache de l'appareil A")
  }),

  /* ─── LA VIDÉO DURABLE — récit 23.10 ───────────────────────────────────────
     Le lot 23 l'avait REPORTÉE, et son hypothèse disait exactement pourquoi :
     sans versement reprenable, sans quota dit à voix haute, sans suppression ni
     export ni lecture sur un second appareil, la pièce n'est pas durable — elle
     est seulement affichée. Ces essais tiennent ces clauses-là, une par une.

     ⚠ CELUI QUI COMPTE LE PLUS EST LE VERSEMENT COUPÉ. C'est la seule chose que
     la photo n'a jamais eu à traiter — un aller-retour rate ou réussit — et
     c'est la seule qui puisse, ici, produire une vidéo à moitié écrite que le
     carnet déclare montée. */

  doit('le quota vidéo se refuse en disant ses deux chiffres, sans rien écrire', async () => {
    let ecrit = false
    const db = {
      get: async () => ({ total: QUOTA_VIDEO_OCTETS - 1024 }),
      getOptional: async () => ({ roulage_id: 'r1' }),
      execute: async () => { ecrit = true; return {} },
    } as any
    const r = await verserVideo(
      db, { chuteId: 'c1' }, new Blob([new Uint8Array(4096)], { type: 'video/mp4' }))
    vrai('refus' in r, 'une vidéo au-delà du quota est entrée dans le carnet')
    const refus = (r as { refus: string }).refus
    // Un quota qui dit seulement « plein » n'est pas explicite : le pilote doit
    // pouvoir décider quoi retirer, donc savoir ce qu'il pèse et ce qu'il reste.
    vrai(/pèse/.test(refus) && /reste/.test(refus),
      'le refus ne dit ni le poids de la vidéo ni la place restante')
    vrai(/Mo|Ko/.test(refus), 'le refus ne donne aucun chiffre lisible')
    vrai(!ecrit, 'une vidéo refusée a quand même écrit sa ligne')
  }),

  doit('une vidéo de crash retrouve sa journée et garde les deux liens', async () => {
    const ecrites: { sql: string; params: unknown[] }[] = []
    const db = {
      get: async () => ({ total: 0 }),
      getOptional: async () => ({ roulage_id: 'r-du-crash' }),
      execute: async (sql: string, params: unknown[] = []) => {
        ecrites.push({ sql, params }); return {}
      },
    } as any
    const r = await verserVideo(
      db, { chuteId: 'c1' }, new Blob([new Uint8Array(64)], { type: 'video/mp4' }))
    vrai(!('refus' in r), 'une vidéo dans le quota a été refusée')
    const v = r as {
      id: string; roulage_id: string | null; chute_id: string | null; chemin_objet: string
    }
    // La même clause que la photo de crash : retirer le récit ne doit pas
    // détruire la preuve, donc la journée porte la vidéo elle aussi.
    egal(v.roulage_id, 'r-du-crash', 'la vidéo de crash ne retrouve pas sa journée')
    egal(v.chute_id, 'c1', 'la vidéo a perdu son crash')
    const insertion = ecrites.find((e) => /INSERT INTO video/.test(e.sql))
    vrai(!!insertion, 'aucune ligne de vidéo n’est écrite')
    vrai(/'locale'/.test(insertion!.sql), 'la vidéo naît dans un état inconnu')
    await effacerLocale(nomLocalVideo(v))
  }),

  doit('un versement vidéo coupé garde son avancement et ne se dit jamais monté', async () => {
    const v = {
      id: 'video-coupee', roulage_id: 'r1', chute_id: 'c1',
      chemin_objet: 'local/c1/video-coupee.mp4', octets: 8000,
      duree_ms: 1000, largeur: 2, hauteur: 2, type_mime: 'video/mp4',
      etat: 'locale' as const,
    }
    await ecrireLocale(nomLocalVideo(v), new Blob([new Uint8Array(8000)], { type: 'video/mp4' }))
    const ecrites: string[] = []
    const db = {
      getAll: async (sql: string) => (/a_supprimer/.test(sql) ? [] : [v]),
      getOptional: async () => v,
      execute: async (sql: string) => { ecrites.push(sql); return {} },
    } as any
    // 3 000 octets sur 8 000 : le serveur en détient une partie, et c'est le
    // cas NOMINAL d'une 4G de paddock, pas une erreur à signaler.
    const montees = await televerserVideosEnAttente(db, 'pilote-1', {
      peutTeleverser: () => true,
      televerser: async () => 3000,
      supprimer: async () => 'supprimee',
    })
    egal(montees, 0, 'un envoi coupé a été compté comme monté')
    vrai(!ecrites.some((s) => /etat = 'montee'/.test(s)),
      'une vidéo à moitié versée a été déclarée montée — le carnet montre une pièce que le serveur n’a pas')
    await effacerLocale(nomLocalVideo(v))
  }),

  doit('un versement vidéo complet inscrit le chemin du pilote, jamais le chemin local', async () => {
    const ligne = {
      id: 'video-entiere', roulage_id: 'r1', chute_id: 'c1',
      chemin_objet: 'local/c1/video-entiere.mp4', octets: 500,
      duree_ms: 1000, largeur: 2, hauteur: 2, type_mime: 'video/mp4',
      etat: 'locale' as string,
    }
    await ecrireLocale(nomLocalVideo(ligne), new Blob([new Uint8Array(500)], { type: 'video/mp4' }))
    const ecrites: { sql: string; params: unknown[] }[] = []
    const db = {
      getAll: async (sql: string) => (/a_supprimer/.test(sql) ? [] : [{ ...ligne }]),
      getOptional: async (sql: string) =>
        (/AND etat = 'locale'/.test(sql) && ligne.etat !== 'locale' ? null : { ...ligne }),
      execute: async (sql: string, params: unknown[] = []) => {
        ecrites.push({ sql, params })
        if (/SET etat = 'montee'/.test(sql) && ligne.etat === 'locale') {
          ligne.etat = 'montee'; ligne.chemin_objet = String(params[0])
        }
        return {}
      },
    } as any
    const montees = await televerserVideosEnAttente(db, 'pilote-1', {
      peutTeleverser: () => true,
      televerser: async () => 500,
      supprimer: async () => 'supprimee',
    })
    egal(montees, 1, 'un envoi complet n’est pas compté')
    const majeur = ecrites.find((e) => /SET etat = 'montee'/.test(e.sql))
    vrai(!!majeur, 'la vidéo montée ne change pas d’état')
    // ⚠ LE PREMIER SEGMENT EST CE QUE LA POLITIQUE DU BUCKET COMPARE À auth.uid().
    // Un chemin resté en `local/` serait refusé en 403 au premier accès.
    egal(majeur!.params[0], 'pilote-1/c1/video-entiere.mp4',
      'le chemin distant ne commence pas par le pilote')
    vrai(/WHERE id = \? AND etat = 'locale'/.test(majeur!.sql),
      'un retrait gagné pendant l’envoi pourrait être ressuscité en montée')
    await effacerLocale('video-entiere.mp4')
  }),

  doit('une vidéo retirée pendant son envoi est effacée du stockage, jamais ressuscitée', async () => {
    const ligne = {
      id: 'video-retiree', roulage_id: 'r1', chute_id: 'c1',
      chemin_objet: 'local/c1/video-retiree.mp4', octets: 300,
      duree_ms: 1000, largeur: 2, hauteur: 2, type_mime: 'video/mp4',
      etat: 'locale' as string,
    }
    await ecrireLocale(nomLocalVideo(ligne), new Blob([new Uint8Array(300)], { type: 'video/mp4' }))
    const supprimes: string[] = []
    const db = {
      getAll: async (sql: string) => (/a_supprimer/.test(sql) ? [] : [{ ...ligne }]),
      // Le retrait gagne la course PENDANT l'HTTP : la relecture d'après ne voit
      // plus qu'un tombstone.
      getOptional: async (sql: string) =>
        (/AND etat = 'locale'/.test(sql) ? { ...ligne } : { ...ligne, etat: 'a_supprimer' }),
      execute: async () => ({}),
    } as any
    const montees = await televerserVideosEnAttente(db, 'pilote-1', {
      peutTeleverser: () => true,
      televerser: async () => 300,
      supprimer: async (chemin: string) => { supprimes.push(chemin); return 'supprimee' },
    })
    egal(montees, 0, 'une vidéo retirée a été comptée comme montée')
    vrai(supprimes.includes('pilote-1/c1/video-retiree.mp4'),
      'l’objet tout juste écrit reste au stockage alors que le carnet l’a retiré')
    await effacerLocale('video-retiree.mp4')
  }),

  doit('l’extension suit le type réel, pas le nom rendu par l’iPhone', () => {
    // Un iPhone rend souvent un fichier SANS nom exploitable ; quand il en rend
    // un, c'est `.MOV`. Le type MIME fait donc autorité, et le repli n'invente
    // pas une extension à partir de n'importe quelle chaîne.
    egal(extensionDe(new Blob([], { type: 'video/quicktime' })), 'mov')
    egal(extensionDe(new Blob([], { type: 'video/mp4' })), 'mp4')
    egal(extensionDe(new Blob([], { type: 'video/webm;codecs=vp9' })), 'webm')
    egal(extensionDe(new Blob([], { type: '' })), 'mp4')
  }),

  doit('le cadre borne le côté long, garde des dimensions paires et n’agrandit jamais', () => {
    const paysage = cadre(1920, 1080)
    egal(paysage.largeur, 720, 'une vidéo paysage ne descend pas à 720 sur son côté long')
    vrai(paysage.hauteur % 2 === 0, 'une hauteur impaire est refusée par les encodeurs')
    vrai(Math.abs(paysage.hauteur - 405) <= 2, 'les proportions ne sont pas gardées')
    // Le côté long d'une vidéo PORTRAIT est sa hauteur : c'est le cadrage que
    // rend un téléphone tenu à la main, donc le cas courant au paddock.
    egal(cadre(1080, 1920).hauteur, 720, 'une vidéo portrait n’est pas bornée sur son côté long')
    // Agrandir coûterait des octets sans ajouter une seule information.
    egal(cadre(320, 240), { largeur: 320, hauteur: 240 }, 'une petite vidéo a été agrandie')
  }),

  doit('la capacité vidéo se prononce toujours, et dit pourquoi', () => {
    const c = capaciteVideo()
    vrai(typeof c.comprime === 'boolean', 'la capacité ne tranche pas')
    vrai(c.raison.length > 10, 'la capacité ne dit pas ce qu’elle a décidé (UX-DR8)')
    // Quand elle ne comprime pas, elle ne doit pas prétendre avoir un format :
    // c'est ce couple-là qui décide si l'original part tel quel.
    vrai(c.comprime === (c.format !== null),
      'la capacité annonce une compression sans format, ou un format sans compression')
  }),

  doit('l’emport garde les liens de la vidéo sans jamais encoder ses octets', () => {
    const source = sansCommentaires(
      Object.entries(SOURCES).find(([nom]) => nom.endsWith('/db/emporter.ts'))?.[1] ?? '')
    // ⚠ 500 Mo de quota vidéo en base64 feraient un JSON de 700 Mo qui échoue au
    // moment précis où le pilote croit sauver son carnet.
    vrai(/photos_jointes/.test(source), 'les photos ne sont plus jointes')
    const jointes = source.slice(source.indexOf('const jointes'), source.indexOf('contenu.photos_jointes'))
    vrai(!/video/.test(jointes), 'les octets d’une vidéo sont encodés dans le fichier d’emport')
    // Mais un manque tu : le récit 23.7 dit qu'un emport qui ment sur ses trous
    // est pire qu'un emport incomplet.
    vrai(/donnees\.video/.test(source) && /manques\.push/.test(source),
      'l’emport ne dit pas que les vidéos n’y sont pas')
    // Et le tombstone reste dehors, sinon la restauration ressusciterait une
    // vidéo dont le retrait est déjà demandé.
    vrai(/table === 'photo' \|\| table === 'video'/.test(source),
      'un tombstone de vidéo part dans l’emport avec son chemin')
  }),

  doit('une suppression non persistée garde les octets locaux pour réessayer', async () => {
    const photo = {
      id: 'photo-rejet', roulage_id: 'r1', machine_id: null,
      intervention_id: null, chute_id: 'c1', geste_id: null,
      chemin_objet: 'local/c1/photo-rejet.webp', largeur: 1, hauteur: 1,
      etat: 'locale' as const, genre: 'photo' as const,
    }
    const nom = nomLocal(photo)
    await ecrireLocale(nom, new Blob([new Uint8Array([7, 8, 9])], { type: 'image/webp' }))
    try {
      const db = {
        getOptional: async () => photo,
        execute: async () => { throw new Error('sqlite refuse le tombstone') },
      } as any
      const resultat = await oublierPhoto(db, photo.id)
      egal(resultat, {
        statut: 'en_attente', distante: 'sans_objet', motif: 'base_locale',
      }, 'le résultat ne permet pas une microcopy de reprise exacte')
      vrai(!!await lireLocale(nom),
        'les octets ont été effacés alors que SQLite refusait la suppression')
    } finally {
      await effacerLocale(nom)
    }
  }),

  doit('un DELETE SQLite refusé garde le tombstone après avoir vidé son blob', async () => {
    const photo = {
      id: 'photo-delete-rejet', roulage_id: 'r1', machine_id: null,
      intervention_id: null, chute_id: 'c1', geste_id: null,
      chemin_objet: 'local/c1/photo-delete-rejet.webp', largeur: 1, hauteur: 1,
      etat: 'locale' as const, genre: 'photo' as const,
    }
    const nom = nomLocal(photo)
    await ecrireLocale(nom, new Blob([new Uint8Array([4, 5, 6])], { type: 'image/webp' }))
    try {
      const db = {
        getOptional: async () => photo,
        execute: async (sql: string) => {
          if (/DELETE FROM photo/.test(sql)) throw new Error('sqlite refuse le delete')
          return {}
        },
      } as any
      const resultat = await oublierPhoto(db, photo.id)
      egal(resultat, {
        statut: 'en_attente', distante: 'sans_objet', motif: 'finalisation_locale',
      }, 'le tombstone durable est confondu avec une demande non enregistrée')
      egal(await lireLocale(nom), null,
        'le blob local survit alors que son tombstone suffit désormais à reprendre')
    } finally {
      await effacerLocale(nom)
    }
  }),

  doit('un DELETE réussi ne dépend jamais d’une relecture SQLite tardive', async () => {
    const photo = {
      id: 'photo-delete-ok', roulage_id: 'r1', machine_id: null,
      intervention_id: null, chute_id: 'c1', geste_id: null,
      chemin_objet: 'local/c1/photo-delete-ok.webp', largeur: 1, hauteur: 1,
      etat: 'locale' as const, genre: 'photo' as const,
    }
    const nom = nomLocal(photo)
    let lectures = 0
    await ecrireLocale(nom, new Blob([new Uint8Array([1, 2, 3])], { type: 'image/webp' }))
    try {
      const db = {
        getOptional: async () => {
          lectures++
          if (lectures > 1) throw new Error('la relecture SQLite refuse')
          return photo
        },
        execute: async () => ({}),
      } as any
      const resultat = await oublierPhoto(db, photo.id)
      egal(resultat, { statut: 'terminee', distante: 'sans_objet' },
        'une relecture inutile transforme un DELETE réussi en reprise fantôme')
      egal(lectures, 1, 'la finalisation relit la ligne après son DELETE')
      egal(await lireLocale(nom), null,
        'le blob local reste orphelin après le DELETE réussi')
    } finally {
      await effacerLocale(nom)
    }
  }),

  doit('supprimer un roulage hors ligne garde le chemin Storage jusqu’à la reprise', async () => {
    let photo: any = {
      id: 'photo-roulage-offline', roulage_id: 'r-offline', machine_id: null,
      intervention_id: null, chute_id: 'c-offline', geste_id: null,
      chemin_objet: 'pilote/r-offline/photo-roulage-offline.webp', largeur: 2, hauteur: 1,
      etat: 'montee' as const, genre: 'photo' as const,
    }
    let roulagePresent = true
    const requetes: string[] = []
    const executer = async (sql: string) => {
      requetes.push(sql.replace(/\s+/g, ' ').trim())
      if (/UPDATE photo[\s\S]*a_supprimer/.test(sql) && photo) {
        photo = { ...photo, etat: 'a_supprimer', roulage_id: null, chute_id: null, geste_id: null }
      }
      if (/DELETE FROM roulage/.test(sql)) roulagePresent = false
      if (/DELETE FROM photo/.test(sql)) photo = null
      return {}
    }
    const db = {
      writeTransaction: async (agir: (tx: any) => Promise<unknown>) => agir({ execute: executer }),
      execute: executer,
      getAll: async (sql: string) =>
        /FROM photo WHERE etat = 'a_supprimer'/.test(sql) && photo?.etat === 'a_supprimer'
          ? [photo] : [],
      getOptional: async () => photo ?? undefined,
    } as any
    const nom = nomLocal(photo)
    const ancienOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine')
    await ecrireLocale(nom, new Blob([new Uint8Array([8, 6])], { type: 'image/webp' }))
    try {
      Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })
      await supprimerRoulage(db, 'r-offline')
      egal(roulagePresent, false, "la journée n'a pas été retirée hors ligne")
      vrai(photo?.etat === 'a_supprimer' && photo.chemin_objet.includes('pilote/r-offline/'),
        'la ligne ou le chemin Storage a disparu avec la journée')
      egal([photo.roulage_id, photo.chute_id, photo.geste_id], [null, null, null],
        'le tombstone reste accroché à un porteur voué à la cascade')
      vrai(!!await lireLocale(nom), 'le cache a été effacé avant la confirmation Storage')
      const patchPhoto = requetes.findIndex((sql) => sql.startsWith('UPDATE photo'))
      const deleteRoulage = requetes.findIndex((sql) => sql.startsWith('DELETE FROM roulage'))
      vrai(patchPhoto >= 0 && deleteRoulage > patchPhoto,
        'PowerSync verra le DELETE roulage avant le PATCH tombstone')

      const chemins: string[] = []
      await supprimerPhotosEnAttente(db, async (chemin) => {
        chemins.push(chemin); return 'supprimee'
      })
      egal(chemins, ['pilote/r-offline/photo-roulage-offline.webp'],
        "la reprise n'a pas retiré l'objet distant exact")
      egal(photo, null, "la ligne n'a pas été finalisée après Storage")
      egal(await lireLocale(nom), null, "le cache n'a pas été finalisé après Storage")
    } finally {
      if (ancienOnLine) Object.defineProperty(navigator, 'onLine', ancienOnLine)
      else delete (navigator as any).onLine
      await effacerLocale(nom)
    }
  }),

  doit('un retrait gagné pendant l’upload ne laisse aucun objet sans tombstone', async () => {
    let photo: any = {
      id: 'photo-course-upload', roulage_id: 'r-course', machine_id: null,
      intervention_id: null, chute_id: null, geste_id: null,
      chemin_objet: 'local/r-course/photo-course-upload.webp', largeur: 2, hauteur: 1,
      etat: 'locale' as const, genre: 'photo' as const,
    }
    const nom = nomLocal(photo)
    let uploads = 0, retraits = 0
    const db = {
      getAll: async (sql: string) => {
        if (/etat = 'a_supprimer'/.test(sql)) return photo?.etat === 'a_supprimer' ? [photo] : []
        if (/etat = 'locale'/.test(sql)) return photo?.etat === 'locale' ? [photo] : []
        return []
      },
      getOptional: async (sql: string) => {
        if (/etat = 'locale'/.test(sql)) return photo?.etat === 'locale' ? photo : undefined
        return photo ?? undefined
      },
      execute: async (sql: string, params: unknown[] = []) => {
        if (/UPDATE photo SET etat = 'montee'/.test(sql) && photo?.etat === 'locale')
          photo = { ...photo, etat: 'montee', chemin_objet: params[0] }
        if (/INSERT INTO photo/.test(sql)) {
          const [id, roulageId, machineId, interventionId, chuteId, gesteId,
            chemin, largeur, hauteur, genre] = params
          if (!photo) photo = {
            id, roulage_id: roulageId, machine_id: machineId, intervention_id: interventionId,
            chute_id: chuteId, geste_id: gesteId, chemin_objet: chemin,
            largeur, hauteur, etat: 'a_supprimer', genre,
          }
          else if (photo.etat === 'a_supprimer')
            photo = { ...photo, chemin_objet: chemin, etat: 'a_supprimer' }
        }
        if (/DELETE FROM photo/.test(sql)) photo = null
        return {}
      },
    } as any
    const ancienReglage = localStorage.getItem('mypaddock.envoi-cloud')
    await ecrireLocale(nom, new Blob([new Uint8Array([3, 1, 4])], { type: 'image/webp' }))
    try {
      localStorage.setItem('mypaddock.envoi-cloud', '1')
      const stockage = {
        peutTeleverser: () => true,
        televerser: async () => {
          uploads++
          // Le DELETE utilisateur gagne pendant l'attente HTTP.
          photo = null
          return true
        },
        supprimer: async () => {
          retraits++
          return 'stockage' as const
        },
      }
      egal(await televerserEnAttente(db, 'pilote', stockage), 0,
        "l'upload perdu par le DELETE a été compté comme monté")
      egal(uploads, 1, "la course n'a pas réellement traversé un upload")
      egal(retraits, 1, "l'objet orphelin n'a pas été retiré immédiatement")
      vrai(photo?.etat === 'a_supprimer'
        && photo.chemin_objet === 'pilote/r-course/photo-course-upload.webp',
      'l’échec Storage a perdu le chemin de reprise')
      egal([
        photo.roulage_id, photo.machine_id, photo.intervention_id, photo.chute_id, photo.geste_id,
      ], [null, null, null, null, null],
      'la ligne recréée conserve une FK vers un parent qui a pu disparaître')
      await supprimerPhotosEnAttente(db, async () => 'supprimee')
      egal(photo, null, 'la reprise de la course ne finalise pas la ligne')
      egal(await lireLocale(nom), null, 'la reprise de la course ne finalise pas le cache')
    } finally {
      if (ancienReglage == null) localStorage.removeItem('mypaddock.envoi-cloud')
      else localStorage.setItem('mypaddock.envoi-cloud', ancienReglage)
      await effacerLocale(nom)
    }
  }),

  doit('une suppression locale reprend au montage visible même sans compte', async () => {
    const photo = {
      id: 'photo-anonyme-a-finir', roulage_id: 'r1', machine_id: null,
      intervention_id: null, chute_id: 'c1', geste_id: null,
      chemin_objet: 'local/c1/photo-anonyme-a-finir.webp', largeur: 1, hauteur: 1,
      etat: 'a_supprimer' as const, genre: 'photo' as const,
    }
    const nom = nomLocal(photo)
    let lignePresente = true
    await ecrireLocale(nom, new Blob([new Uint8Array([1, 2, 3])], { type: 'image/webp' }))
    try {
      const db = {
        getAll: async () => lignePresente ? [photo] : [],
        execute: async (sql: string) => {
          if (/DELETE FROM photo/.test(sql)) lignePresente = false
          return {}
        },
        getOptional: async () => lignePresente ? { id: photo.id } : undefined,
      } as any
      let appels = 0
      let reprise: Promise<number> | undefined
      const detacher = surRetourDeReseau(() => {
        appels++
        reprise = televerserEnAttente(db, null)
      })
      try {
        egal(document.visibilityState, 'visible', "le banc ne peut pas éprouver le montage visible")
        egal(appels, 1, "le montage visible attend encore un futur événement réseau")
        await reprise
        egal(lignePresente, false, "le tombstone anonyme n'a pas été finalisé au montage")
        egal(await lireLocale(nom), null, "le cache local anonyme n'a pas été nettoyé")
      } finally {
        detacher()
      }
    } finally {
      await effacerLocale(nom)
    }

    const app = sansCommentaires(
      Object.entries(ECRANS).find(([fichier]) => fichier.endsWith('/App.tsx'))?.[1] ?? '')
    const debut = app.indexOf('return surRetourDeReseau')
    const effet = app.slice(debut, app.indexOf('\n  }, [db, identite, rafraichir])', debut))
    vrai(/televerserEnAttente\(db, identite\?\.id \?\? null\)/.test(effet),
      "l'application conditionne encore toute la reprise photo à l'identité")
  }),

  doit('les deux albums gardent la photo et expliquent chaque reprise de suppression', () => {
    for (const suffixe of ['/Photos.tsx', '/Chute.tsx']) {
      const source = sansCommentaires(
        Object.entries(ECRANS).find(([nom]) => nom.endsWith(suffixe))?.[1] ?? '')
      const marqueur = source.indexOf("motif === 'base_locale'")
      const debut = source.lastIndexOf('const retirer = async', marqueur)
      const fin = source.indexOf('\n  return (', marqueur)
      const retirer = source.slice(debut, fin)
      const base = retirer.indexOf("motif === 'base_locale'")
      const masque = suffixe === '/Photos.tsx'
        ? retirer.indexOf('setEnGrand(null)')
        : retirer.indexOf('setARetirer(null)')
      vrai(base >= 0 && masque > base && /return/.test(retirer.slice(base, masque)),
        `${suffixe} ferme la confirmation ou masque la photo malgré le rejet du tombstone`)
      vrai(/reste dans le carnet/.test(retirer),
        `${suffixe} ne dit pas que la photo est restée après le rejet local`)
      vrai(/finalisation_locale/.test(retirer) && /nettoyage local reprendra/.test(retirer),
        `${suffixe} confond reprise Storage et nettoyage SQLite local`)
      vrai(/role=["{].*alert|role="alert"/.test(source),
        `${suffixe} n'annonce pas l'échec contextuel aux technologies d'assistance`)
      vrai(/Photo enregistrée\. Recharge l’écran pour l’afficher\./.test(source)
        && /role=\{[^}]*'status'/.test(source),
      `${suffixe} classe une relecture refusée comme un échec de versement`)
    }
  }),

  doit('la suppression Storage est masquée, durable et rejouée avant les envois', () => {
    const brut = Object.entries(SOURCES)
      .find(([nom]) => nom.endsWith('/db/photos.ts'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    const migration = Object.entries(MIGRATIONS)
      .find(([nom]) => nom.includes('la_suppression_photo_se_reprend'))?.[1] ?? ''
    vrai(/alter type etat_photo add value if not exists 'a_supprimer'/i.test(migration),
      "le serveur refuse le tombstone de suppression")
    vrai(/foreign key \(roulage_id\)[\s\S]*on delete set null/i.test(migration),
      'le serveur cascade encore la ligne qui porte le chemin Storage')
    vrai(/etat::text = 'a_supprimer'[\s\S]*or roulage_id is not null/i.test(migration),
      'un tombstone détaché de son parent est refusé par le serveur')
    vrai((source.match(/etat != 'a_supprimer'/g) ?? []).length >= 3,
      'une lecture rend encore une photo dont la suppression est demandée')
    const finaliser = source.slice(source.indexOf('const finaliserSuppressionPhoto'),
      source.indexOf('export const oublierPhoto'))
    const stockage = finaliser.indexOf('supprimerObjet(p.chemin_objet)')
    const ligne = finaliser.indexOf('DELETE FROM photo')
    const coffre = finaliser.indexOf('effacerLocale(')
    vrai(stockage >= 0 && coffre > stockage && ligne > coffre,
      'Storage/coffre/SQLite ne sont pas supprimés dans un ordre reprenable')
    const oublier = source.slice(source.indexOf('export const oublierPhoto'),
      source.indexOf('export const supprimerPhotosEnAttente'))
    vrai(/UPDATE photo SET etat = 'a_supprimer'/.test(oublier),
      'la demande ne laisse aucune reprise durable avant de toucher aux octets')
    const televerser = source.slice(source.indexOf('export const televerserEnAttente'))
    vrai(televerser.indexOf('supprimerPhotosEnAttente(db)')
      < televerser.indexOf('envoiCloudActif()'),
    "couper l'envoi cloud coupe aussi le droit à l'effacement")
    const emport = sansCommentaires(
      Object.entries(SOURCES).find(([nom]) => nom.endsWith('/db/emporter.ts'))?.[1] ?? '')
    vrai(/FROM photo WHERE etat != 'a_supprimer'/.test(emport),
      "l'emport immédiat remet dans le zip une photo retirée hors ligne")
    // La règle vaut pour les DEUX tables qui portent un tombstone depuis le
    // récit 23.10 : `photo` et `video` ont le même `etat` et le même danger —
    // un chemin cloud révélé, et une pièce ressuscitée à la restauration.
    vrai((emport.match(/filtreEmport\(t\)/g) ?? []).length >= 2
      && /table === 'photo' \|\| table === 'video' \? ` WHERE etat != 'a_supprimer'`/.test(emport),
    "le JSON ou la pesée compte encore le tombstone et révèle son chemin cloud")
  }),

  doit('le serveur fait converger crash et déclaration sur deux appareils', () => {
    const sql = Object.entries(MIGRATIONS)
      .find(([nom]) => nom.includes('le_crash_converge_au_serveur'))?.[1] ?? ''
    vrai(!!sql, 'la convergence serveur du crash est absente')
    vrai(/after insert or delete or update of roulage_id, pilote_id on public\.chute/i.test(sql),
      'un INSERT ou DELETE venu de l’appareil B ne requalifie pas la journée')
    vrai(/where id = p_roulage for update/i.test(sql),
      'deux appareils recalculent la même journée sans se sérialiser')
    vrai(/when v_documente then 'documente' else 'a_renseigner'/i.test(sql),
      'la dernière suppression ne revient pas à renseigner')
    vrai(/before update of crash_statut on public\.roulage/i.test(sql),
      'un PATCH tardif « aucun » peut encore gagner contre une chute')
    vrai(/old\.crash_statut = 'documente'[\s\S]*exists \(select 1 from public\.chute/i.test(sql),
      "la garde ne couvre pas l'instantané ancien de l'appareil A")
    vrai(/new\.crash_statut = 'documente' and old\.crash_statut <> 'documente'[\s\S]*new\.crash_statut := 'a_renseigner'/i.test(sql),
      'après DELETE A, le vieux documente de B peut encore ressusciter le crash')
    vrai(!/new\.crash_statut = 'documente'[\s\S]*not exists \(select 1 from public\.chute/i.test(
      sql.slice(sql.indexOf('create or replace function public.garder_statut_crash_coherent'))),
    "un snapshot antérieur à l'INSERT peut encore annuler son statut documenté")
    vrai(/revoke all on function public\.garder_statut_crash_coherent/i.test(sql),
      'la fonction de garde est exposée comme RPC publique')
  }),

  doit("une chute A ne peut ni viser ni requalifier le roulage du pilote B", () => {
    const sql = Object.entries(MIGRATIONS)
      .find(([nom]) => nom.includes('le_crash_converge_au_serveur'))?.[1] ?? ''
    vrai(!!sql, "la frontière de propriété chute/roulage n'est pas migrée")
    vrai(/unique \(id, pilote_id\)/i.test(sql)
      && /foreign key \(roulage_id, pilote_id\)[\s\S]*references public\.roulage \(id, pilote_id\)[\s\S]*not valid/i.test(sql),
    'A peut encore écrire sa chute avec le roulage de B')
    const politique = sql.slice(sql.indexOf('create policy'))
    vrai(/with check \([\s\S]*auth\.uid\(\)[\s\S]*r\.id = chute\.roulage_id[\s\S]*r\.pilote_id = chute\.pilote_id/i.test(politique),
      "la policy INSERT ne vérifie pas l'ascendance du roulage")
    const garde = sql.indexOf("if tg_op <> 'DELETE' and not exists")
    const recalcul = sql.indexOf('perform public.recalculer_statut_crash(', garde)
    vrai(garde >= 0 && recalcul > garde && /raise foreign_key_violation/i.test(sql.slice(garde, recalcul)),
      'le trigger SECURITY DEFINER touche le statut de B avant de refuser A')
    vrai(/old\.roulage_id is distinct from new\.roulage_id[\s\S]*old\.pilote_id is distinct from new\.pilote_id/i.test(sql),
      "un changement de propriétaire ne recalcule pas l'ancienne journée")
    vrai((sql.match(/c\.pilote_id = r\.pilote_id/g) ?? []).length >= 2
      && /pilote_id = v_pilote/.test(sql),
      "un ancien reliquat croisé peut encore documenter le roulage de B")
    vrai(/revoke all on function public\.recalculer_statut_crash_apres_chute\(\)/i.test(sql),
      'la garde de propriété reste appelable comme RPC')
  }),

  doit('le bucket photos est privé et chaque geste reste sous le préfixe du pilote', () => {
    const sql = Object.entries(MIGRATIONS)
      .find(([nom]) => nom.includes('le_bucket_photos_est_prive'))?.[1] ?? ''
    vrai(/insert into storage\.buckets \(id, name, public\)[\s\S]*'photos', 'photos', false/i.test(sql),
      'le bucket photos privé ne naît pas avec les migrations')
    vrai(/on conflict \(id\) do update set public = false/i.test(sql),
      'une configuration manuelle existante rend la migration non rejouable ou publique')
    for (const geste of ['select', 'insert', 'update', 'delete'])
      vrai(new RegExp(`on storage\\.objects for ${geste} to authenticated`, 'i').test(sql),
        `Storage n'accorde pas ${geste} au pilote authentifié`)
    vrai((sql.match(/bucket_id\s*=\s*'photos'/gi) ?? []).length === 5,
      'une politique peut agir sur un autre bucket')
    vrai((sql.match(/\(storage\.foldername\(name\)\)\[1\]\s*=\s*\(select auth\.uid\(\)\)::text/gi)
      ?? []).length === 5,
    "une politique Storage peut sortir du préfixe auth.uid()")
    vrai(!/file_size_limit|allowed_mime_types/i.test(sql),
      'la migration écrase une limite ou des MIME réglés manuellement')
  }),

  doit('un 23503 rejoue toute la réparation sans acquitter une dépense orpheline', async () => {
    const crud = [
      { table: 'depense', op: UpdateType.PUT, id: 'd1', opData: { montant_centimes: 1200 } },
      { table: 'intervention', op: UpdateType.PUT, id: 'i1', opData: { depense_id: 'd1' } },
    ]
    let completes = 0, tentative = 0
    const tx = { crud, complete: async () => { completes++ } }
    const appels: string[] = []
    const lignes = new Set<string>()
    const executer = async (op: { table: string; id: string }) => {
      appels.push(op.table)
      if (tentative === 0 && op.table === 'intervention') {
        return { error: { code: '23503', message: 'depense pas encore visible' } }
      }
      lignes.add(`${op.table}:${op.id}`)
      return { error: null }
    }
    let levee = false
    try { await envoyerTransaction('p1', tx, executer) } catch { levee = true }
    vrai(levee, 'le 23503 a été traité comme une ligne définitivement perdue')
    egal(completes, 0, 'la transaction incomplète a été acquittée')
    egal(appels, ['depense', 'intervention'], 'le premier passage ne suit pas la transaction')

    tentative++
    await envoyerTransaction('p1', tx, executer)
    egal(appels.slice(2), ['depense', 'intervention'], 'le retry reprend à mi-transaction')
    egal(completes, 1, "le retry complet n'a pas été acquitté exactement une fois")
    egal(lignes.size, 2, 'les upserts rejoués ont fabriqué un doublon')
  }),

  doit("l'emport qualifie l'historique de crash comme auto-déclaré", () => {
    const source = Object.entries(SOURCES)
      .find(([nom]) => nom.endsWith('/db/emporter.ts'))?.[1] ?? ''
    vrai(/historique_crash/.test(source), "l'emport ne porte aucune convention de lecture")
    vrai(/auto-déclarés par le pilote/.test(source),
      "l'emport laisse croire que l'historique a été constaté ou vérifié")
  }),

  /* ─── LES CORPUS EMBARQUÉS ─────────────────────────────────────────────── */
  doit('FR-39bis — chaque cap porte sa catégorie', () => {
    // Sans `categorie`, « un cap de bravoure ne part jamais tout seul au
    // cercle » n'est qu'une intention sans prise dans le code.
    for (const c of CAPS_EMBARQUES)
      vrai(c.categorie === 'bravoure' || c.categorie === 'discipline',
        `${c.code} porte « ${c.categorie} »`)
    vrai(CAPS_EMBARQUES.some((c) => c.categorie === 'bravoure'), 'aucun cap de bravoure')
    vrai(CAPS_EMBARQUES.some((c) => c.categorie === 'discipline'), 'aucun cap de discipline')
    egal(new Set(CAPS_EMBARQUES.map((c) => c.code)).size, CAPS_EMBARQUES.length, 'codes en double')
  }),
  doit('aucun circuit embarqué en double, aucun nom vide', () => {
    const aplati = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    const cles = CIRCUITS_EMBARQUES.map((c) => aplati(c.nom))
    egal(new Set(cles).size, cles.length, 'deux circuits se confondent après aplatissement')
    for (const c of CIRCUITS_EMBARQUES) vrai(c.nom.trim().length > 1, `nom vide : « ${c.nom} »`)
  }),
  doit('un conseil énonce une technique, il ne fixe jamais une performance', () => {
    vrai(CONSEILS_EMBARQUES.length > 0, 'corpus vide — le produit serait muet au premier lancement')
    for (const c of CONSEILS_EMBARQUES) {
      vrai(!/\d/.test(c), `« ${c.slice(0, 40)}… » contient un chiffre à battre`)
      vrai(!c.includes('!'), 'un conseil porte un point d\'exclamation')
    }
  }),

  /* ─── LA SPRITIFICATION — la moitié GRATUITE du pipeline ───────────────── */
  doit('le fond vert est détaché, et le sprite recadré dessus', async () => {
    // Une scène synthétique aux mesures exactes du prompt : fond #00E000 plat,
    // machine cernée d'un contour sombre fermé. Aucune génération, aucun euro.
    const c = document.createElement('canvas')
    c.width = 512; c.height = 512
    const x = c.getContext('2d')!
    x.fillStyle = '#00E000'; x.fillRect(0, 0, 512, 512)
    x.fillStyle = '#1A0A2E'; x.fillRect(148, 198, 204, 104)   // le contour
    x.fillStyle = '#D81E2C'; x.fillRect(152, 202, 196, 96)    // la carrosserie
    const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/png'))

    const s = await spritifier(blob, 128)
    // bloc = 512 / 128 = 4 px. Le rectangle cerné couvre 51 × 26 cellules.
    vrai(Math.abs(s.largeur - 51) <= 2, `largeur ${s.largeur}, attendue ≈ 51`)
    vrai(Math.abs(s.hauteur - 26) <= 2, `hauteur ${s.hauteur}, attendue ≈ 26`)
    vrai(s.couleurs <= COULEURS_MAX, `${s.couleurs} couleurs, plafond ${COULEURS_MAX}`)
    vrai(s.opaques > 0 && s.opaques < 128 * 128, `${s.opaques} cellules opaques`)
    vrai(s.dataUri.startsWith('data:image/png;base64,'), 'la sortie n\'est pas un PNG')
  }),
  doit('une image entièrement fond ne rend pas un sprite vide, elle refuse', async () => {
    // Le silence serait pire : le garage garderait un sprite de zéro pixel et
    // le pilote croirait avoir dépensé pour rien sans savoir pourquoi.
    const c = document.createElement('canvas')
    c.width = 256; c.height = 256
    const x = c.getContext('2d')!
    x.fillStyle = '#00E000'; x.fillRect(0, 0, 256, 256)
    const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/png'))
    let leve = false
    try { await spritifier(blob, 64) } catch { leve = true }
    vrai(leve, 'aucune erreur levée sur une image sans machine')
  }),

  /* ─── L'EFFACEMENT — ce qu'il emporte, et ce qu'il laisse ──────────────── */
  doit("l'effacement emporte les réglages du produit, et rien d'autre", () => {
    // `localStorage` appartient à TOUTE L'ORIGINE. Un `clear()` emporterait ce
    // qui n'est pas à nous — et la même origine sert déjà d'autres choses.
    localStorage.setItem('mypaddock.mesures', 'non')
    localStorage.setItem('mypaddock.plan.ecartee', 'oui')
    localStorage.setItem('mypaddock.adopte.abc', '1')
    localStorage.setItem('autre-produit.reglage', 'à garder')
    localStorage.setItem('sb-xyz-auth-token', 'à garder')

    const n = effacerLesReglages()
    vrai(n >= 3, `${n} clés effacées, au moins 3 attendues`)
    for (const k of ['mypaddock.mesures', 'mypaddock.plan.ecartee', 'mypaddock.adopte.abc'])
      egal(localStorage.getItem(k), null, `« ${k} » a survécu`)
    egal(localStorage.getItem('autre-produit.reglage'), 'à garder', 'une clé étrangère est partie')
    egal(localStorage.getItem('sb-xyz-auth-token'), 'à garder', 'une clé étrangère est partie')
    localStorage.removeItem('autre-produit.reglage'); localStorage.removeItem('sb-xyz-auth-token')
  }),

  /* ─── LA COURBE — la condition d'allumage ─────────────────────────────── */
  doit("la courbe demande trois points, jamais deux", () => {
    // Deux points font TOUJOURS une droite, donc toujours une progression ou
    // toujours une chute. Le pilote y lirait un mouvement qui n'existe pas.
    egal(POINTS_MINIMUM, 3)
  }),

  /* ─── LE NIVEAU MYPADDOCK — FR-6bis, seule entrée du coefficient d'usure ── */
  doit('le niveau se projette sur la POSITION, pas sur le rang', () => {
    // 3ᵉ sur 3 et 3ᵉ sur 5 ne sont pas le même niveau. Le rang seul ne dit
    // rien, et c'est l'erreur qui rendrait faux le seul calcul du produit qui
    // touche à la sécurité d'une machine.
    egal(niveauDuGroupe(1, 4), 'debutant')
    egal(niveauDuGroupe(4, 4), 'racer')
    egal(niveauDuGroupe(3, 3), 'racer')
    egal(niveauDuGroupe(3, 5), 'confirme')
    egal(niveauDuGroupe(1, 1), 'intermediaire', 'un organisateur à groupe unique')
  }),
  doit('un groupe non saisi ne rend PAS un niveau inventé', () => {
    // `null` propage l'ignorance jusqu'à la complétude, où elle s'affiche.
    // Inventer « intermédiaire » ferait entrer une valeur fausse dans le
    // calcul, et le chiffre paraîtrait aussi solide qu'un vrai.
    for (const [r, t] of [[null, null], [null, 4], [2, null], [0, 4], [5, 4], [-1, 3]] as const)
      egal(niveauDuGroupe(r, t), null, `rang ${r} sur ${t}`)
  }),

  /* ─── LA CONFORMITÉ — FR-50, FR-51 ────────────────────────────────────── */
  doit("l'âge d'une fiche se compte en mois, sans dépendre du jour", () => {
    // Un organisateur publie « en mars 2025 » : le jour exact n'existe souvent
    // pas, et le calculer en millisecondes ferait basculer l'alerte d'un jour à
    // l'autre selon la longueur des mois traversés.
    egal(moisDepuis('2025-08-01', '2026-08-19'), 12)
    egal(moisDepuis('2025-07-31', '2026-08-19'), 13)
    egal(moisDepuis('2026-08-19', '2026-08-19'), 0)
    egal(moisDepuis('2027-01-01', '2026-08-19'), 0, 'une date future ne rend pas un âge négatif')
    egal(MOIS_AVANT_DOUTE, 12)
  }),
  doit('le chargement embarqué ne contient AUCUNE règle', () => {
    // Ce qui vient d'un organisateur porte sa source, ou n'existe pas. Une
    // ligne de conformité inventée par le produit engagerait sa responsabilité
    // au contrôle technique, et c'est exactement ce que FR-50 interdit.
    for (const c of CHARGEMENT_EMBARQUE)
      vrai(c.categorie !== 'conformite', `« ${c.libelle} » se présente comme une règle`)
    vrai(CHARGEMENT_EMBARQUE.length > 6, 'chargement trop pauvre pour servir')
  }),

  /* ─── LE CHARGEMENT ET LA PRÉPARATION — MÊME TABLE, PAS MÊME LISTE ────── */
  doit("le chargement ne regarde jamais « Avant d'y aller »", () => {
    // ⚠ CET ESSAI EXISTE À CAUSE D'UN DÉFAUT BLOQUANT. `checklist_ligne` porte
    // les deux listes sur le même roulage. L'écran du chargement lisait TOUTES
    // les catégories et s'en servait pour décider s'il était déjà composé : une
    // seule tâche de préparation rendait le chargement de ce roulage
    // DÉFINITIVEMENT incomposable, sans une erreur nulle part.
    vrai(!CHARGEMENT.includes('preparation' as never),
      'la préparation est comptée dans le camion')
    vrai(CHARGEMENT.length > 0, 'le chargement ne regarde plus rien')
  }),
  doit('aucune catégorie ne peut apparaître sans être rangée d\'un côté', () => {
    /* Une catégorie ajoutée demain doit OBLIGER à trancher : dans le camion,
       avant d'y aller, ou parmi ce qu'on vient chercher ? Sans cet essai, elle
       serait silencieusement écrite, jamais rendue, et comptée quand même —
       exactement le défaut du 23 août, à l'identique.

       ⚠ ET IL A FAIT SON TRAVAIL. La cinquième — `objectif`, récit 17.5 — l'a
       fait rougir à la seconde où elle est entrée dans `NOM_CATEGORIE`, avant
       qu'un seul écran ne la rende. C'est exactement ce qu'on lui demande : ce
       qui n'est rangé nulle part se compte quelque part, toujours, et toujours
       au mauvais endroit. */
    const rangees = new Set<string>([...CHARGEMENT, 'preparation', 'objectif'])
    for (const c of Object.keys(NOM_CATEGORIE))
      vrai(rangees.has(c), `« ${c} » n'est rangée ni dans le camion, ni avant, ni dans ce qu'on vient chercher`)
    egal(rangees.size, Object.keys(NOM_CATEGORIE).length,
      'une catégorie est rangée mais n\'existe pas')
    // Et les trois familles ne se chevauchent pas : une catégorie dans deux
    // familles serait comptée deux fois, ce qui est le défaut d'origine.
    vrai(!CHARGEMENT.includes('preparation' as never) && !CHARGEMENT.includes('objectif' as never),
      'une catégorie est à la fois dans le camion et ailleurs')
  }),
  doit('le serveur accepte exactement les catégories que le produit connaît', () => {
    // Le même motif que le YAML de synchronisation : deux copies d'une même
    // vérité, dont une prend du retard. Une catégorie ajoutée au code sans
    // l'être à la contrainte serait refusée à l'envoi — donc une file bloquée,
    // donc toute la saison qui cesse de monter. C'est l'incident du 19 août.
    /* ⚠ LA CONTRAINTE SE LIT DANS LA DERNIÈRE MIGRATION QUI LA POSE, pas dans
       une migration nommée. La garde lisait `20260823000001` en dur : le jour où
       le récit 17.5 a ajouté `objectif` dans une migration PLUS RÉCENTE, elle
       aurait accusé le produit d'envoyer une catégorie refusée alors que le
       serveur venait de l'accepter. Une garde ancrée sur un nom de fichier
       éprouve le nom du fichier. */
    /* ⚠ ET ELLE S'ANCRE SUR LA CONTRAINTE NOMMÉE, PAS SUR LE MOTIF NU — deux
       défauts, dont un s'est produit ici même.
         · Le motif `check (categorie in (…))` n'est borné par AUCUNE table, et
           CINQ migrations le portent : trois pour `checklist_ligne`, une pour
           `equipement`, une pour `cap`. Toute contrainte de catégories posée
           demain sur une autre table serait comparée à `NOM_CATEGORIE` de la
           checklist, et le banc accuserait un fichier qui n'y est pour rien.
         · Le SQL était lu BRUT, commentaires compris. Une migration qui se
           contentait d'EXPLIQUER ce piège dans un commentaire le déclenchait :
           le motif cité en prose gagnait le tri et rendait une liste vide. Un
           témoin qu'un commentaire trompe ne témoigne pas — même leçon que
           l'ancrage sur un nom de fichier, une ligne plus haut. */
    const contraintes = Object.entries(MIGRATIONS)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([, sql]) => [...sql.replace(/--[^\n]*/g, '').matchAll(
        /constraint checklist_ligne_categorie_check\s+check \(categorie in \(([^)]*)\)\)/g)])
    vrai(contraintes.length > 0, 'la contrainte de catégories est introuvable dans les migrations')
    const m = contraintes[contraintes.length - 1]
    const serveur = new Set([...m[1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]))
    for (const c of Object.keys(NOM_CATEGORIE))
      vrai(serveur.has(c), `« ${c} » existe dans le produit et serait REFUSÉE à l'envoi`)
    for (const c of serveur)
      vrai(c in NOM_CATEGORIE, `le serveur accepte « ${c} », que le produit ne sait pas nommer`)
  }),

  /* ─── L'ÂGE D'UNE FICHE — FR-51, et il ne s'arrondit pas ──────────────── */
  doit("l'âge d'une fiche n'écrase jamais l'écart", () => {
    // `Math.floor(mois / 12)` faisait lire IDENTIQUEMENT une fiche de treize
    // mois et une de vingt-trois : « il y a 1 an(s) ». Or c'est justement
    // l'écart que FR-51 demande de rendre exploitable.
    vrai(direLAge(13) !== direLAge(23), 'treize et vingt-trois mois se lisent pareil')
    egal(direLAge(18), 'il y a 18 mois')
    egal(direLAge(13), 'il y a 13 mois')
    egal(direLAge(24), 'il y a 2 ans')
    egal(direLAge(30), 'il y a 2 ans et 6 mois')
    // Et aucune forme de machine : « an(s) » n'est pas une phrase.
    for (const m of [0, 1, 12, 13, 24, 37, 120])
      vrai(!/\(s\)/.test(direLAge(m)), `« ${direLAge(m)} » n'est pas écrit pour un humain`)
  }),
  doit('une règle publiée dit QUI, et le dit en clair', () => {
    // FR-50 : « publié par l'organisateur le 12 mars 2026 ». La ligne disait
    // « publié le 2026-03-12 » — une date au format machine, et personne.
    const dit = direPublication('2026-03-12', 'Moto Club de Pau')
    vrai(dit.includes('Moto Club de Pau'), `« ${dit} » ne nomme pas le publieur`)
    vrai(dit.includes('mars'), `« ${dit} » est un identifiant, pas une date`)
    vrai(!dit.includes('2026-03'), `« ${dit} » laisse fuir le format machine`)
    // Sans publieur connu, elle n'en invente pas un.
    const sans = direPublication('2026-03-12', null)
    vrai(!/publié par/.test(sans), `« ${sans} » invente un publieur`)
    vrai(sans.includes('mars'), `« ${sans} » a perdu la date`)
  }),

  /* ─── L'ADOPTION N'ENVOIE JAMAIS UN NUL LÀ OÙ LE SERVEUR EN REFUSE UN ─── */
  doit("aucune colonne à défaut serveur ne part à nul", () => {
    // ⚠ LE DÉFAUT LE PLUS COÛTEUX DU PRODUIT, et il tenait à une nuance de SQL.
    // « la colonne vaut NULL » ≠ « la colonne est absente » : le défaut serveur
    // ne s'applique qu'à l'absente. `roulage.chrono_visible` est `not null
    // default false` et n'était jamais écrite en local — donc envoyée à NULL,
    // donc 23502, donc CHAQUE roulage refusé à la connexion, et avec eux les
    // sessions, les tours, les chutes et les dépenses qui y pendent.
    // Vérifié sur la base réelle le 25 août 2026 avant d'être corrigé.
    const { charge } = chargeDe('roulage', [{
      id: 'r1', machine_id: 'm1', date_jour: '2026-04-18', circuit_nom: 'Nogaro',
      chrono_visible: null, groupe_nom: null, etat: null,
    }], 'p1')
    egal(charge[0].chrono_visible, 0, 'le roulage part sans visibilité, et sera refusé')
    egal(charge[0].etat, 'usage')
    // Une colonne NULLABLE garde son nul — et surtout sa clé.
    egal(charge[0].groupe_nom, null, 'un nul légitime a été effacé')
  }),
  doit("les lignes d'un même envoi portent toutes les mêmes clés", () => {
    // ⚠ CE N'EST PAS UN DÉTAIL DE STYLE. PostgREST exige que toutes les lignes
    // d'une insertion groupée portent les mêmes clés, et répond
    // « PGRST102 All object keys must match » sinon. Le premier correctif
    // RETIRAIT les nuls : deux roulages dont l'un a touché l'interrupteur et
    // l'autre non n'avaient plus le même jeu de clés, le bloc échouait, et
    // l'adoption repartait ligne par ligne — une requête HTTP par ligne sur
    // toute une saison, sans que rien ne le dise.
    const { charge } = chargeDe('roulage', [
      { id: 'a', circuit_nom: 'Nogaro', chrono_visible: null, groupe_nom: null, etat: 'usage' },
      { id: 'b', circuit_nom: 'Albi', chrono_visible: 1, groupe_nom: 'Expert', etat: 'usage' },
    ], 'p1')
    egal(Object.keys(charge[0]).sort(), Object.keys(charge[1]).sort(),
      'deux lignes du même envoi ont des clés différentes')
    egal(charge[1].chrono_visible, 1, 'une visibilité choisie a été écrasée')
  }),
  doit('un zéro, un faux et une chaîne vide ne sont pas des nuls', () => {
    // La faute symétrique, et elle serait pire : traiter la fausseté comme la
    // nullité remplacerait `cochee: 0` par le défaut — sans conséquence ici,
    // mais `partage: 0` deviendrait indistinguable d'un partage jamais décidé.
    egal(avecLesDefauts('checklist_ligne', { cochee: 0 }).cochee, 0)
    egal(avecLesDefauts('geste', { partage: 0 }).partage, 0)
    egal(avecLesDefauts('roulage', { etat: '' }).etat, '', 'une chaîne vide a été remplacée')
    // Et une table sans mine ressort intacte.
    const t = { id: 'x', temps_ms: 0 }
    egal(avecLesDefauts('tour', t), t)
  }),
  doit("l'adoption pose le propriétaire et diffère le lien coupé", () => {
    for (const t of PORTE_PROPRIETAIRE) {
      const { charge } = chargeDe(t, [{ id: 'x' }], 'p1')
      egal(charge[0].pilote_id, 'p1', `${t} part sans propriétaire`)
    }
    const { charge, differes } = chargeDe(LIEN_DIFFERE.table,
      [{ id: 'i1', [LIEN_DIFFERE.colonne]: 'ph1', libelle: 'Vidange' }], 'p1')
    egal(charge[0][LIEN_DIFFERE.colonne], null,
      `${LIEN_DIFFERE.colonne} part au premier passage, donc en clé étrangère morte`)
    egal(differes, [{ id: 'i1', valeur: 'ph1' }])
    egal(charge[0].libelle, 'Vidange', 'le reste de la ligne a été perdu')
  }),

  // ⚠ LE TROISIÈME DÉFAUT DE LA MÊME FAMILLE, après l'ordre d'envoi et le YAML
  // de synchronisation : une colonne AU SCHÉMA LOCAL QUI N'EXISTE PAS AU
  // SERVEUR. Rien ne le relie — le schéma est du TypeScript, le serveur est un
  // tas de fichiers SQL — et la sanction n'est pas une ligne perdue : PostgREST
  // refuse le BLOC entier en PGRST204, donc toutes les dépenses d'un coup, avec
  // un message qui ne nomme que la colonne. `date_jour` (récit 19.2) est arrivée
  // par là ; cet essai fait que la prochaine ne passera pas.
  doit('aucune colonne locale ne manque au serveur', () => {
    const colonnes = new Map<string, Set<string>>()
    const noter = (t: string, c: string) => {
      if (!colonnes.has(t)) colonnes.set(t, new Set())
      colonnes.get(t)!.add(c.toLowerCase())
    }
    for (const sql of Object.values(MIGRATIONS)) {
      const net = sql.replace(/--[^\n]*/g, '')
      for (const m of net.matchAll(/create table (?:if not exists )?(\w+)\s*\(([\s\S]*?)\n\)\s*;/gi))
        for (const l of m[2].split('\n')) {
          // Une ligne de colonne commence par un nom suivi d'un type ; les
          // lignes de contrainte commencent par `constraint`, `check`, `unique`,
          // `primary` ou `foreign` et n'en sont pas.
          const c = l.match(/^\s*(\w+)\s+[\w[\]().]+/)
          if (c && !/^(constraint|check|unique|primary|foreign|exclude)$/i.test(c[1]))
            noter(m[1], c[1])
        }
      for (const m of net.matchAll(/alter table (\w+)\s+add column (?:if not exists )?(\w+)/gi))
        noter(m[1], m[2])
      // Une colonne renommée au serveur n'est plus celle que le local écrit.
      for (const m of net.matchAll(/alter table (\w+)\s+rename column (\w+) to (\w+)/gi)) {
        colonnes.get(m[1])?.delete(m[2].toLowerCase()); noter(m[1], m[3])
      }
      for (const m of net.matchAll(/alter table (\w+)\s+drop column (?:if exists )?(\w+)/gi))
        colonnes.get(m[1])?.delete(m[2].toLowerCase())
    }
    vrai((colonnes.get('depense')?.size ?? 0) > 5, 'le lecteur de migrations n\'a rien lu')

    const montees = new Set<string>(ORDRE)
    for (const t of AppSchema.tables) {
      if (!montees.has(t.name)) continue
      const auServeur = colonnes.get(t.name)
      vrai(!!auServeur, `${t.name} part à l'envoi et n'existe dans aucune migration`)
      for (const c of t.columns)
        vrai(auServeur!.has(c.name.toLowerCase()),
          `${t.name}.${c.name} est au schéma local et pas au serveur — PGRST204 sur tout le bloc`)
    }
  }),

  // ⚠ LE JOUR D'UNE DÉPENSE SE PERDAIT À L'ÉCRITURE, pas à l'affichage. Les deux
  // chemins recevaient la date, en tiraient l'année et jetaient le reste : le
  // mois n'était pas « pas encore montré », il était détruit — et aucune requête,
  // aucune migration ne le rattrape après coup. La colonne `poste` avait déjà
  // vécu ça : `creerDepense` ne l'écrit toujours pas (récit 19.3). Un troisième
  // chemin d'écriture ajouté demain fera rougir cette ligne.
  doit('tout chemin qui écrit une dépense écrit son jour', () => {
    const inserts: { fichier: string; colonnes: string }[] = []
    for (const [chemin, texte] of Object.entries(SOURCES))
      for (const m of texte.matchAll(/INSERT INTO\s+depense\s*\(([^)]*)\)/gi))
        inserts.push({ fichier: chemin.replace(/^.*\/src\//, 'src/'), colonnes: m[1] })
    // Deux écrivains aujourd'hui : `creerDepense` (depot.ts) et `depenserSur`
    // (budget.ts). Si ce compte tombe à un, c'est que 19.3 a fusionné les deux —
    // et il faudra le dire ici plutôt que de laisser l'essai croire au hasard.
    vrai(inserts.length >= 2, `${inserts.length} écriture(s) de dépense trouvée(s)`)
    for (const i of inserts)
      vrai(/\bdate_jour\b/.test(i.colonnes),
        `${i.fichier} écrit une dépense sans son jour : ce mois-là est perdu pour toujours`)
    // ⚠ ET SON POSTE. `creerDepense` ne l'écrivait pas du tout, et le défaut ne
    // se voyait pas au budget (« Sans poste » est un état prévu) mais dans
    // « Avant d'y aller » : sa ligne « L'engagement » se dérive d'un
    // `WHERE poste = 'engagement'`, et restait donc affichée APRÈS le paiement.
    // Une liste dérivée dont les lignes ne partent jamais est une liste morte.
    for (const i of inserts)
      vrai(/\bposte\b/.test(i.colonnes),
        `${i.fichier} écrit une dépense sans poste : la tâche qui l'attend ne partira jamais`)
  }),
  doit('la ligne « L\'engagement » peut réellement disparaître', () => {
    // Le bout de chaîne que personne ne regardait : ce que la tâche CHERCHE doit
    // être ce que l'écran vers lequel elle mène ÉCRIT. Les deux vivaient dans
    // deux fichiers et ne se sont jamais rencontrés.
    const prep = SOURCES[Object.keys(SOURCES).find((k) => k.endsWith('/db/preparation.ts'))!]
    const ecran = SOURCES[Object.keys(SOURCES).find((k) => k.endsWith('/ecrans/Depense.tsx'))!]
    const cherche = prep.match(/poste\s*=\s*'(\w+)'/)
    vrai(!!cherche, "la tâche « L'engagement » ne cherche plus aucun poste")
    vrai(new RegExp(`'${cherche![1]}'`).test(ecran),
      `la tâche cherche le poste « ${cherche![1]} » et l'écran de dépense ne sait pas l'écrire`)
    vrai(/setPoste|poste,/.test(ecran), "l'écran de dépense n'envoie aucun poste")
  }),

  doit('aucune colonne à défaut serveur ne peut apparaître sans écrivain', () => {
    // ⚠ LE MÊME MOTIF QUE LE YAML DE SYNCHRONISATION : deux vérités séparées,
    // dont une prend du retard. `chrono_visible` et `partage` sont arrivées au
    // serveur le 19 août en `not null default false` ; personne ne les a écrites
    // en local, et le défaut a vécu six jours sans qu'aucun essai puisse le voir.
    // Cet essai reconstruit la liste — colonnes ET valeurs — au lieu de la croire.
    const auServeur = new Map<string, { type: string; defaut: string }>()
    const retenir = (t: string, c: string, type: string, defaut: string) =>
      auServeur.set(`${t}.${c}`, { type: type.toLowerCase(), defaut: defaut.trim().toLowerCase() })
    for (const sql of Object.values(MIGRATIONS)) {
      const net = sql.replace(/--[^\n]*/g, '')
      for (const m of net.matchAll(/create table (?:if not exists )?(\w+)\s*\(([\s\S]*?)\n\)\s*;/gi))
        for (const l of m[2].split('\n')) {
          const c = l.match(/^\s*(\w+)\s+([\w[\]()]+)[\w ]*?\s+not null default\s+([^,]+?)\s*(?:,|$)/i)
          if (c) retenir(m[1], c[1], c[2], c[3])
        }
      for (const m of net.matchAll(/alter table (\w+)\s+add column (?:if not exists )?(\w+)\s+([\w[\]()]+)[^;]*?not null default\s+([^;\n]+)/gi))
        retenir(m[1], m[2], m[3], m[4])
    }
    vrai(auServeur.size > 25, `le lecteur de migrations n'a trouvé que ${auServeur.size} colonnes`)

    // Seules comptent celles que le schéma local porte ET que l'adoption monte.
    // Le référentiel est au schéma local mais ne remonte jamais (AD-12, `ORDRE`
    // ne le contient pas) : une colonne à défaut y est sans conséquence.
    const montees = new Set<string>(ORDRE)
    const mines: string[] = []
    for (const t of AppSchema.tables)
      if (montees.has(t.name))
        for (const c of t.columns)
          if (auServeur.has(`${t.name}.${c.name}`)) mines.push(`${t.name}.${c.name}`)

    const declarees = Object.entries(DEFAUTS_SERVEUR)
      .flatMap(([t, cs]) => Object.keys(cs).map((c) => `${t}.${c}`))
    egal(mines.sort(), declarees.sort(),
      'une colonne à défaut serveur est au schéma local sans être déclarée : décide où elle s\'écrit')

    // ⚠ ET LA VALEUR, PAS SEULEMENT LE NOM. Un défaut déclaré de travers poserait
    // silencieusement la mauvaise chose sur toute une saison reprise.
    for (const [t, cs] of Object.entries(DEFAUTS_SERVEUR))
      for (const [c, v] of Object.entries(cs)) {
        const vu = auServeur.get(`${t}.${c}`)!
        // « false » côté SQL, 0 côté SQLite : c'est ce que les écrivains posent,
        // et Postgres accepte « 0 » en entrée booléenne.
        const attendu = vu.type === 'boolean'
          ? (vu.defaut === 'false' ? 0 : 1)
          : vu.defaut.replace(/::\w+$/, '').replace(/^'|'$/g, '')
        egal(String(v), String(attendu), `le défaut déclaré de ${t}.${c} ne dit pas celui du serveur`)
      }
  }),

  /* ─── LE CODE DE CERCLE — il se donne DE VIVE VOIX ────────────────────── */
  doit("un code de cercle n'a aucun caractère qu'on confonde à l'oral", () => {
    // ⚠ LE CODE SE TIRE AU SERVEUR DEPUIS LE 25 AOÛT — un client qui choisit son
    // propre code peut en choisir un devinable. L'essai lit donc l'alphabet DANS
    // LA MIGRATION, là où il vit réellement, plutôt qu'une copie en TypeScript
    // qui prendrait du retard sans que rien ne le dise.
    const sql = Object.entries(MIGRATIONS)
      .find(([f]) => f.includes('le_cercle_ne_s_ouvre_que_par_son_code'))?.[1]
    vrai(!!sql, 'la migration du cercle est introuvable')
    const m = sql!.match(/substr\('([A-Z0-9]+)',/)
    vrai(!!m, "l'alphabet du code est introuvable dans la migration")
    const alphabet = m![1]

    // Il se dicte au paddock, casque à la main, dans le bruit. 0 et O, 1 et I
    // et L se confondent : ils sont exclus de l'alphabet, pas corrigés après.
    for (const c of '01OIL')
      vrai(!alphabet.includes(c), `« ${c} » est dans l'alphabet et se confond à l'oral`)
    vrai(new Set(alphabet).size === alphabet.length, "l'alphabet répète un caractère")
    // 31 caractères sur 8 tirages : ~2^39,6. En dessous de 2^32, un balayage
    // devient une soirée de travail — et rien ne compte les tentatives.
    vrai(Math.log2(alphabet.length) * 8 > 32,
      `${alphabet.length} caractères ne suffisent pas à rendre un code non devinable`)
    // Et le tirage lit bien la longueur de l'alphabet, pas un nombre écrit à côté.
    vrai(sql!.includes(`floor(random() * ${alphabet.length})`),
      "le tirage et l'alphabet ne parlent pas de la même longueur")
  }),

  /* ─── LE COFFRE — les octets d'un fichier survivent aux deux magasins ────
     La base de production a compté ZÉRO photo et ZÉRO document depuis le premier
     jour : `createWritable()` n'existe pas dans Safari avant la 26, et c'était le
     seul chemin d'écriture. Ces essais tiennent l'invariant qui manquait —
     écrire puis relire rend les mêmes octets, quel que soit le magasin, y compris
     quand l'un a écrit et que l'autre est disponible à la relecture. */

  doit('le coffre écrit et relit les mêmes octets quand createWritable existe', async () => {
    oublierLeMagasin()
    const c = await capaciteLocale()
    // Chromium a l'API ET l'écriture aboutit : si ce n'est pas le cas, l'essai
    // suivant éprouverait le repli en croyant éprouver l'OPFS.
    egal(c.magasin, 'opfs', 'le navigateur des essais devrait écrire dans l\'OPFS')
    vrai(c.ecritureEprouvee, "l'écriture OPFS n'a pas été éprouvée")
    await ecrireLocale('essai-opfs.webp', blobDEssai())
    egal(await octetsDe(await lireLocale('essai-opfs.webp')), OCTETS_ESSAI)
    await effacerLocale('essai-opfs.webp')
    egal(await lireLocale('essai-opfs.webp'), null, 'le fichier effacé se relit encore')
  }),

  doit('le coffre écrit et relit les mêmes octets SANS createWritable', async () => {
    await sansCreateWritable(async () => {
      const c = await capaciteLocale()
      egal(c.magasin, 'indexeddb', 'sans createWritable, le coffre doit se replier')
      egal(c.createWritable, false)
      // C'est ici que le produit levait un TypeError et n'écrivait rien.
      await ecrireLocale('essai-repli.webp', blobDEssai())
      egal(await octetsDe(await lireLocale('essai-repli.webp')), OCTETS_ESSAI)
      await effacerLocale('essai-repli.webp')
      egal(await lireLocale('essai-repli.webp'), null, 'le fichier effacé se relit encore')
    })
  }),

  doit('une photo versée sans createWritable reste lisible quand il revient', async () => {
    // ⚠ LE VRAI PIÈGE DU CORRECTIF, et le seul qui perde des souvenirs déjà
    // enregistrés : un pilote verse tout sur iOS 18 (donc en IndexedDB), met son
    // téléphone à jour, l'OPFS devient le magasin en usage — et une lecture qui
    // ne regarderait que le magasin courant rendrait ses photos INVISIBLES.
    await sansCreateWritable(() => ecrireLocale('essai-avant-maj.webp', blobDEssai()))
    const c = await capaciteLocale()
    egal(c.magasin, 'opfs', "createWritable n'a pas été rendu au prototype")
    egal(await octetsDe(await lireLocale('essai-avant-maj.webp')), OCTETS_ESSAI)
    // Et l'effacement doit vider les DEUX magasins, sinon la photo retirée
    // reviendrait toute seule au prochain affichage.
    await effacerLocale('essai-avant-maj.webp')
    egal(await lireLocale('essai-avant-maj.webp'), null, 'le fichier effacé se relit encore')
    await sansCreateWritable(async () =>
      egal(await lireLocale('essai-avant-maj.webp'), null,
        "l'effacement a laissé la copie de l'autre magasin"))
  }),

  doit('une photo versée avec createWritable reste lisible sans lui', async () => {
    // Le chemin inverse, qui est celui d'un même appareil relu par un moteur
    // plus ancien — un WebView embarqué, par exemple. La lecture OPFS ne demande
    // que `getFile()`, présent depuis Safari 15.2 : elle doit continuer de rendre
    // les octets même quand l'écriture, elle, s'est repliée.
    oublierLeMagasin()
    await ecrireLocale('essai-apres-maj.webp', blobDEssai())
    await sansCreateWritable(async () => {
      egal(await octetsDe(await lireLocale('essai-apres-maj.webp')), OCTETS_ESSAI)
      await effacerLocale('essai-apres-maj.webp')
    })
    egal(await lireLocale('essai-apres-maj.webp'), null, 'le fichier effacé se relit encore')
  }),

  /* ─── LE DROIT À L'EFFACEMENT — les deux magasins, ou rien ───────────────
     ⚠ CES ESSAIS EXISTENT À CAUSE D'UN ÉCRAN QUI MENTAIT SUR UN DROIT.
     `effacerLeTelephone` ne balayait que l'OPFS ; la base `mypaddock-coffre`
     n'était touchée par personne. Sur tout iOS ≤ 18 — où pas un octet ne passe
     par l'OPFS — le pilote qui exerçait son droit lisait « Il ne reste rien …
     0 fichier » pendant que toutes ses photos restaient sur l'appareil. */

  doit('vider le coffre emporte les DEUX magasins, et annonce ce qui est parti', async () => {
    oublierLeMagasin()
    // On part d'un coffre vide, sinon le nombre rendu n'est pas lisible.
    await viderLeCoffre()

    // Une pièce versée comme sur un iPhone d'avant Safari 26 : elle n'est QUE
    // dans IndexedDB — c'est-à-dire exactement là où le balayage ne regardait pas.
    await sansCreateWritable(() => ecrireLocale('essai-vidage-idb.webp', blobDEssai()))
    // Et une autre par l'OPFS, pour que les deux magasins portent quelque chose.
    oublierLeMagasin()
    await ecrireLocale('essai-vidage-opfs.webp', blobDEssai())

    const avant = await nomsDuCoffre()
    egal(avant.indexeddb, ['essai-vidage-idb.webp'], 'la copie IndexedDB est introuvable')
    egal(avant.opfs, ['essai-vidage-opfs.webp'], 'la copie OPFS est introuvable')

    // LE NOMBRE ANNONCÉ EST LE NOMBRE PARTI. C'est lui qui s'écrit sur l'écran
    // « Il ne reste rien », et c'est lui qui disait zéro.
    egal(await viderLeCoffre(), 2, 'le compte annoncé au pilote')
    egal(await nomsDuCoffre(), { opfs: [], indexeddb: [] },
      'un magasin garde des fichiers après un effacement annoncé')
    egal(await lireLocale('essai-vidage-idb.webp'), null, 'la copie IndexedDB se relit encore')
    egal(await lireLocale('essai-vidage-opfs.webp'), null, 'la copie OPFS se relit encore')
  }),

  doit('un fichier présent dans les deux magasins ne compte qu\'une fois', async () => {
    // Deux copies du même souvenir, ce n'est pas deux souvenirs — et un pilote
    // qui a versé trois photos ne doit pas lire « 6 fichiers » parce qu'une
    // mise à jour d'iOS a déplacé le magasin sous ses pieds.
    oublierLeMagasin()
    await viderLeCoffre()
    await sansCreateWritable(() => ecrireLocale('essai-jumeau.webp', blobDEssai()))
    // ⚠ ON ÉCRIT LE JUMEAU À LA MAIN, DANS L'AUTRE MAGASIN, sans passer par
    // `ecrireLocale` : celui-ci efface justement le jumeau. Ce que l'essai
    // fabrique ici, c'est l'appareil d'AVANT ce nettoyage.
    oublierLeMagasin()
    const dossier = await (await navigator.storage.getDirectory())
      .getDirectoryHandle('photos', { create: true })
    const h = await dossier.getFileHandle('essai-jumeau.webp', { create: true })
    const w = await h.createWritable()
    await w.write(blobDEssai())
    await w.close()

    const avant = await nomsDuCoffre()
    egal(avant.opfs, ['essai-jumeau.webp'], 'le jumeau OPFS est introuvable')
    egal(avant.indexeddb, ['essai-jumeau.webp'], 'le jumeau IndexedDB est introuvable')
    egal(await viderLeCoffre(), 1, 'le même fichier compté deux fois')
    egal(await nomsDuCoffre(), { opfs: [], indexeddb: [] }, 'un jumeau a survécu')
  }),

  /* ─── LA CONNEXION QUI MEURT EN COURS DE SESSION ─────────────────────────
     WebKit ferme les connexions d'une page mise en cache arrière/avant —
     c'est-à-dire après un simple aller-retour vers l'appareil photo. */

  doit('le coffre écrit encore après une connexion fermée sous ses pieds', async () => {
    await sansCreateWritable(async () => {
      await ecrireLocale('essai-connexion.webp', blobDEssai())

      // SENS 1 — LA CONNEXION EST VRAIMENT MORTE. Sans cette moitié, l'essai
      // vert ne prouverait que d'avoir écrit deux fois sur une base en pleine
      // forme, et il resterait vert le jour où la seconde chance disparaîtrait.
      const morte = await fermerLaConnexionDuCoffre()
      let leve = 'aucune'
      // Le nom du rayon est écrit ici parce que c'est le handle du coffre qu'on
      // interroge, pas le coffre : l'essai doit voir la panne telle qu'elle est.
      try { morte.transaction('fichiers', 'readonly') } catch (e) { leve = (e as Error).name }
      egal(leve, 'InvalidStateError', 'la connexion refermée accepte encore des transactions')

      // SENS 2 — ET LE COFFRE ÉCRIT QUAND MÊME, sans rechargement de page. C'est
      // ici que l'écran réaffichait « L'image n'a pas pu être préparée sur ce
      // téléphone » pour tout le reste de la session.
      await ecrireLocale('essai-connexion.webp', blobDEssai())
      egal(await octetsDe(await lireLocale('essai-connexion.webp')), OCTETS_ESSAI)
      await effacerLocale('essai-connexion.webp')
    })
  }),

  /* ─── L'ÉPREUVE ÉPROUVE LE MAGASIN QU'ELLE ANNONCE ───────────────────────
     Elle rendait `ecritureEprouvee: false` sur TOUS les chemins IndexedDB sans
     avoir jamais tenté la moindre écriture IndexedDB : elle validait le magasin
     qu'on n'utilise pas, et pas celui par lequel tout passe. */

  doit('sans createWritable, l\'écriture IndexedDB est éprouvée pour de vrai', async () => {
    oublierLeMagasin()
    await viderLeCoffre()
    await sansCreateWritable(async () => {
      const c = await eprouverLeCoffre()
      egal(c.magasin, 'indexeddb')
      vrai(c.ecritureEprouvee, 'le repli est annoncé sans avoir été éprouvé')
      vrai(/IndexedDB/.test(c.raison), `la raison ne nomme pas le magasin éprouvé : ${c.raison}`)
      vrai(!/AUCUN MAGASIN/.test(c.raison), `une alerte pour un magasin qui écrit : ${c.raison}`)
    })
    // ET L'ÉPREUVE NE LAISSE RIEN DERRIÈRE ELLE, des deux côtés : un témoin
    // compté ferait lire « 4 photos rangées » pour trois photos.
    // ⚠ L'INVENTAIRE BRUT, PAS LE FILTRÉ. `nomsDuCoffre` écarte les noms qui
    // commencent par un point — donc le témoin lui-même. Vérifier son absence à
    // travers ce filtre, c'est le regarder par la lentille qui le cache : cette
    // assertion ne pouvait pas rougir, et ne rougissait pas quand on retirait
    // les deux effacements de témoin.
    egal(await nomsBrutsDuCoffre(), { opfs: [], indexeddb: [] }, 'un témoin d\'épreuve est resté')
  }),

  doit('la sonde sait dire qu\'AUCUN MAGASIN N\'ÉCRIT', async () => {
    // ⚠ C'EST LE SEUL CAS QUI MÉRITE UNE ALERTE, ET IL N'EXISTAIT PAS. Le repli
    // était annoncé sans être éprouvé : un appareil où RIEN n'écrit rendait
    // exactement le même écran gris qu'un appareil qui écrit très bien.
    // ⚠ ON FAIT D'ABORD OUBLIER LA CONNEXION AU COFFRE, et par le chemin exact
    // qu'emprunte WebKit : un événement `close` sur la connexion. Sans ça, le
    // coffre ressortirait sa connexion mémorisée et n'appellerait jamais
    // `indexedDB.open()` — l'essai serait vert sans avoir rien éprouvé. C'est
    // aussi ce qui met sous garde l'autre moitié du correctif : `onclose`.
    (await fermerLaConnexionDuCoffre()).dispatchEvent(new Event('close'))

    const propre = Object.getOwnPropertyDescriptor(window, 'indexedDB')
    const refus = { open: () => {
      const d: { onerror?: () => void } = {}
      // La panne réelle qu'on imite : le mode privé, ou un WebView bridé, qui
      // refuse d'ouvrir la base. Elle arrive de façon asynchrone, comme la vraie.
      setTimeout(() => d.onerror?.(), 0)
      return d
    } }
    Object.defineProperty(window, 'indexedDB', { configurable: true, value: refus })
    try {
      const c = await sansCreateWritable(() => eprouverLeCoffre())
      egal(c.ecritureEprouvee, false, 'un magasin qui refuse de s\'ouvrir est dit éprouvé')
      vrai(c.raison.includes('AUCUN MAGASIN N\'ÉCRIT'),
        `la sonde reste muette là où tout est perdu : ${c.raison}`)
    } finally {
      if (propre) Object.defineProperty(window, 'indexedDB', propre)
      else Reflect.deleteProperty(window, 'indexedDB')
      oublierLeMagasin()
    }
    // Et la vraie base revient : les essais qui suivent ne doivent rien hériter.
    vrai((await eprouverLeCoffre()).ecritureEprouvee, 'IndexedDB n\'a pas été rendu au navigateur')
  }),

  /* ─── ÉPIQUE 21 — les mots, le rouge, et ce qui se dit deux fois ─────────
     Ces essais lisent les SOURCES et la feuille de style telles qu'elles
     partent. C'est le seul niveau où la règle est vérifiable en entier : un
     essai de navigateur ne voit que les écrans qu'il sait atteindre, et
     l'effacement du compte n'apparaît qu'avec une identité. Le banc de fumée
     `fumee-destructif.mjs` fait l'autre moitié, celle qu'aucune lecture de
     source ne peut faire — la couleur réellement calculée par le navigateur. */

  doit('tout bouton qui détruit porte `destructif`, et lui seul', () => {
    const fautifs: string[] = []
    for (const [chemin, source] of Object.entries(ECRANS)) {
      for (const b of boutonsDe(source)) {
        const perd = detruit(b, DESTRUCTIVES)
        if (perd === b.classe) continue
        const par = ditLaDestruction(b) ? 'son libellé' : 'son gestionnaire'
        fautifs.push(`${chemin.replace(/^.*\/src\//, 'src/')} · « ${b.libelles.join(' / ')} » `
          + (perd ? `détruit (${par}) et ne porte pas la classe` : 'porte la classe sans détruire'))
      }
    }
    egal(fautifs, [], 'boutons mal habillés')
  }),

  doit('la lecture des écrans voit bien des boutons, et des destructifs', () => {
    // ⚠ L'ESSAI D'AU-DESSUS PASSE TOUT SEUL SI LA LECTURE REND ZÉRO BOUTON — un
    // `import.meta.glob` qui ne résout plus, une balise réécrite autrement, et
    // la garde devient un essai qui ne peut plus échouer. Celui-ci mesure la
    // lecture elle-même : onze gestes destructifs ont été recensés au récit
    // 21.3, plus celui de la sonde que le recensement avait manqué, moins les
    // deux retraits de portrait supprimés au récit 21.2.
    const tous = Object.values(ECRANS).flatMap(boutonsDe)
    vrai(tous.length > 80, `seulement ${tous.length} boutons lus dans les écrans`)
    vrai(tous.filter((b) => b.classe).length >= 10,
      `seulement ${tous.filter((b) => b.classe).length} boutons destructifs trouvés`)
  }),

  doit('le second témoin reconnaît les gestes, et pas seulement les mots', () => {
    // ⚠ LA MOITIÉ DE CET ESSAI EST DE VÉRIFIER QU'IL PEUT ENCORE ACCUSER. Le
    // recensement des fonctions destructives se DÉDUIT des sources ; le jour où
    // la lecture se casse — un `import.meta.glob` qui ne résout plus, une forme
    // de déclaration nouvelle — elle rendrait une liste vide, et le témoin
    // deviendrait muet sans que rien n'échoue. C'est déjà arrivé à l'envers :
    // une première version accusait SOIXANTE fonctions, ce qui ne vaut pas
    // mieux. On borne donc des deux côtés.
    vrai(DESTRUCTIVES.size >= 8 && DESTRUCTIVES.size <= 25,
      `${DESTRUCTIVES.size} fonctions destructives recensées : ${[...DESTRUCTIVES].join(', ')}`)
    for (const attendu of ['supprimerRoulage', 'oublierEquipement', 'oublierDocument'])
      vrai(DESTRUCTIVES.has(attendu), `${attendu} n'est plus reconnue comme destructive`)
    // Et elle n'accuse pas ce qui ne détruit rien : `poserSprite` écrit une
    // colonne, `verserPhotoMachine` range un fichier.
    for (const innocent of ['poserSprite', 'verserPhotoMachine', 'ajouterSession'])
      vrai(!DESTRUCTIVES.has(innocent), `${innocent} est accusée de détruire`)

    // ⚠ ET LE CAS DE LA REVUE, ÉPROUVÉ ET NON SUPPOSÉ : un bouton dont le
    // libellé ne dit RIEN et dont le geste détruit tout. C'est celui qui passait
    // la garde en gris, et l'épique 22 arrive avec des languettes de
    // suppression — la garde doit l'attraper avant elles.
    const muet = boutonsDe(
      '<button className="bouton" onClick={() => void supprimerRoulage(db, r.id)}>'
      + 'Tout remettre à zéro</button>')[0]
    vrai(!ditLaDestruction(muet), "le cas d'épreuve n'est plus muet : il dit la destruction")
    vrai(appelleUneDestruction(muet, DESTRUCTIVES),
      'un bouton qui appelle un DELETE passe encore la garde en gris')
  }),

  doit('le commentaire du destructif recompte juste', () => {
    // ⚠ UN COMMENTAIRE EST LA MÉMOIRE DU DÉFAUT DANS CE DÉPÔT, donc il ne peut
    // pas mentir. Celui de `.bouton.destructif` affirmait une « CONFIRMATION en
    // deux temps » tenue pour TOUS les gestes rouges — elle ne l'est que pour la
    // moitié. Il énonce maintenant des nombres, et ces nombres se recomptent :
    // sans ça, la correction d'aujourd'hui redevient le mensonge de demain au
    // premier bouton ajouté.
    const compter = (forme: string) => Object.values(ECRANS)
      .reduce((n, s) => n + (s.match(new RegExp(`className="${forme} destructif"`, 'g')) ?? []).length, 0)
    const boutons = compter('bouton'), liens = compter('lien')
    const cite = (quoi: RegExp) => Number(FEUILLE.match(quoi)?.[1])
    egal(boutons + liens, cite(/(\d+) gestes rouges du produit/),
      'gestes rouges annoncés par le commentaire vs comptés dans les écrans')
    egal(boutons, cite(/(\d+) `\.bouton\.destructif`/), '.bouton.destructif annoncés vs comptés')
    egal(liens, cite(/(\d+) `\.lien\.destructif`/), '.lien.destructif annoncés vs comptés')

    // ⚠ ET LE SORTANT D'UNE CONFIRMATION EST UN LIEN, AUX TROIS ENDROITS.
    // « Garder mon compte » portait `.bouton` — le dégradé plein, plus gros et
    // plus voyant que le geste rouge d'à côté — pendant que les deux autres
    // confirmations du produit mettent « Garder » en `.lien`. Trois formes pour
    // un même geste sont trois choses à réapprendre, gants aux mains.
    // Un sortant se reconnaît à ce qu'il FAIT — refermer la confirmation — et
    // pas seulement à son mot : « Garder » sert aussi à enregistrer une chute,
    // et ce bouton-là n'a rien d'un sortant.
    // Ils sont SIX : la journée, la chute, le compte, la photo de l'album, la
    // photo liée au crash — un cliché du 12 septembre ne se retape pas — et
    // depuis le récit 23.10 la vidéo du crash, qui ne se refilme pas du tout.
    const sortants = Object.values(ECRANS).flatMap(boutonsDe)
      .filter((b) => b.libelles.some(
        (l) => /^Garder(?: mon compte| le crash| la photo| la vidéo)?$/.test(l))
        && /set(?:Confirme|Ouvert)\(false\)|setARetirer\(null\)/.test(b.gestionnaire))
    vrai(sortants.length === 6, `${sortants.length} sortants de confirmation trouvés`)
    for (const s of sortants)
      egal(s.className, 'lien', `« ${s.libelles.join(' / ')} » ne sort pas en lien`)
  }),

  doit('« revenir » nomme ce qui reprend vraiment la scène', () => {
    // ⚠ LE BOUTON DISAIT « Revenir à la photo » ET NE REVENAIT PAS À LA PHOTO.
    // La scène retombe sur `sprite ?? photo` : quand un portrait était déjà
    // gardé, refuser le candidat rendait la place à L'ANCIEN PORTRAIT — celui
    // qu'on voulait remplacer. Le pilote en concluait que le bouton n'avait rien
    // fait, et retapait « Refaire » : 0,16 € et un crédit pour un libellé.
    // Avant que « Refaire » existe, le cas était impossible ; il est devenu le
    // cas courant, et c'est pour ça que la garde arrive maintenant.
    for (const nom of ['/Garage.tsx', '/Budget.tsx']) {
      const source = Object.entries(ECRANS).find(([c]) => c.endsWith(nom))?.[1] ?? ''
      vrai(source.length > 0, `${nom} introuvable`)
      const revenirs = boutonsDe(source)
        .flatMap((b) => b.libelles).filter((l) => /^Revenir/.test(l)).sort()
      egal(revenirs, ['Revenir au portrait actuel', 'Revenir à la photo'],
        `${nom} : les deux issues du refus`)
      // Et les deux mots pendent bien à la CONDITION DE LA SCÈNE, pas à autre
      // chose : c'est `sprite` qui décide de ce qu'on voit, donc de ce qu'on dit.
      vrai(/sprite \? 'Revenir au portrait actuel' : 'Revenir à la photo'/.test(source),
        `${nom} : le libellé ne dépend pas du portrait gardé`)
    }
  }),

  doit('la dépense ne s\'offre que si la photo est vraiment là', () => {
    // ⚠ LE BOUTON S'AFFICHAIT SUR UNE COLONNE. `photo_chemin` se synchronise ;
    // les octets, eux, ne quittent jamais le téléphone qui a pris la photo —
    // `verserPhotoMachine` et `verserPhotoEquipement` n'écrivent qu'en local.
    // Sur un second appareil ou après une réinstallation, le pilote validait une
    // dépense annoncée à 0,16 € devant un écran qui ne bougeait pas d'un pixel.
    // Un chemin qui ne peut pas aboutir ne doit pas s'offrir.
    for (const nom of ['/Garage.tsx', '/Budget.tsx']) {
      const source = Object.entries(ECRANS).find(([c]) => c.endsWith(nom))?.[1] ?? ''
      const sansCommentaires = source.replace(/\/\*[\s\S]*?\*\//g, ' ')
      const avant = sansCommentaires.slice(0, sansCommentaires.indexOf('<Refaire'))
      const condition = avant.slice(avant.lastIndexOf('{'))
      vrai(/photoUrl/.test(condition), `${nom} : la fabrication ne dépend pas de la photo relue`)
      vrai(!/photo_chemin/.test(condition), `${nom} : la fabrication dépend encore de la colonne`)
      // Et l'autre sens : si l'on y arrive quand même, ça se DIT. Le `return`
      // était muet, et un geste payant qui ne répond rien se retape.
      vrai(/if \(!f\) \{\s*\n?\s*setSouci/.test(sansCommentaires),
        `${nom} : la fabrication sort en silence quand le fichier manque`)
    }
  }),

  doit('le rouge vient du jeton, et ne sert qu\'aux endroits déclarés', () => {
    // Les sélecteurs qui ont le DROIT de teindre en `--alerte`. Toute règle
    // nouvelle qui l'emploie fait échouer cet essai jusqu'à ce qu'elle soit
    // inscrite ici — c'est le seul moyen d'empêcher le rouge de redevenir
    // décoratif. Les deux premiers sont des MESSAGES et non des gestes : un
    // refus qui s'énonce n'est pas un bouton qui détruit, et il porte déjà son
    // mot (`.mot-erreur` a son propre dessin, filet à gauche).
    const AUTORISES = ['.alerte', '.mot-erreur', '.bouton.destructif', '.lien.destructif']
    const teintes = [...FEUILLE.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter((r) => r[2].includes('var(--alerte)'))
      .map((r) => r[1].replace(/\/\*[\s\S]*?\*\//g, ' ').trim())
    egal(teintes.sort(), [...AUTORISES].sort(), 'sélecteurs qui emploient var(--alerte)')

    // Et le rouge n'existe qu'en un seul endroit du fichier : le jeton. Une
    // valeur écrite à la main réintroduirait un deuxième rouge que rien ne suit.
    const rouge = FEUILLE.match(/--alerte:\s*(#[0-9a-fA-F]{6})/)?.[1]
    vrai(!!rouge, 'le jeton --alerte a disparu de la feuille')
    egal(FEUILLE.split(rouge!).length - 1, 1, `${rouge} écrit ailleurs qu'au jeton`)

    // La jauge de budget est nommée parce que c'est elle qu'on a envie de faire
    // rougir : « dépasser son budget n'est pas une faute » (systeme.css).
    //
    // ⚠ TOUTES SES RÈGLES, PAS DEUX. L'essai lisait `.jauge` et `.jauge span`
    // par une expression figée ; le repère du dépassement (`.jauge i`, récit
    // 19.1) est arrivé APRÈS et serait passé sous le nez de la garde — or c'est
    // précisément la pièce qui dit le dépassement, donc la première qu'on aurait
    // envie de teindre. La garde suit maintenant le sélecteur, pas la position.
    const regles = [...FEUILLE.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter((r) => /(^|[\s,])\.jauge\b/.test(r[1].replace(/\/\*[\s\S]*?\*\//g, ' ')))
    vrai(regles.length >= 3, `${regles.length} règle(s) de jauge lues`)
    for (const r of regles) {
      const nom = r[1].replace(/\/\*[\s\S]*?\*\//g, ' ').trim()
      vrai(!r[2].includes('alerte'), `${nom} a pris le rouge de l'alerte`)
      // Et aucun rouge écrit à la main, qui échapperait au jeton.
      vrai(!/\b(red|crimson|#[fF][0-9a-fA-F]{0,2}[0-4][0-9a-fA-F]{3})\b/.test(r[2]),
        `${nom} porte une couleur d'alarme écrite à la main`)
    }
  }),

  doit('« effacer mon compte » ne s\'écrit qu\'une fois, et sur le bouton', () => {
    const source = Object.entries(ECRANS).find(([c]) => c.endsWith('/Compte.tsx'))?.[1] ?? ''
    vrai(source.length > 0, 'Compte.tsx introuvable')
    // Les commentaires citent le libellé pour expliquer le défaut : ils ne
    // s'affichent pas, on les retire avant de compter.
    const affiche = source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
    egal((affiche.match(/effacer mon compte/gi) ?? []).length, 1,
      'occurrences de « effacer mon compte » dans l\'écran du compte')
    const porteurs = boutonsDe(source)
      .filter((b) => b.libelles.some((l) => /effacer mon compte/i.test(l)))
    egal(porteurs.length, 1, 'boutons qui portent le mot')
    vrai(porteurs[0].classe, 'le bouton qui efface le compte ne porte pas le rouge')

    // ⚠ ET LE TEXTE LÉGAL CITE CE BOUTON PAR SON NOM, EN GRAS. Il dit au pilote
    // où exercer son droit d'effacement : si le libellé bouge sans la citation,
    // le texte légal désigne un bouton qui n'existe pas.
    const legal = Object.entries(ECRANS).find(([c]) => c.endsWith('/Legal.tsx'))?.[1] ?? ''
    vrai(legal.includes('<b>Effacer mon compte</b>'),
      'Legal.tsx ne cite plus le bouton par son nom exact')
  }),

  doit('l\'annonce du coût d\'un portrait dit le vrai quota du serveur', () => {
    // Deux dépôts que rien ne relie : le nombre ANNONCÉ avant de dépenser vit
    // dans portrait.ts, le nombre qui AUTORISE vraiment vit dans une migration
    // Postgres. Le jour où l'un bouge, l'écran se met à mentir sans que rien ne
    // casse — et c'est un mensonge sur de l'argent.
    const migration = Object.entries(MIGRATIONS)
      .find(([c]) => c.includes('portrait_et_quota'))?.[1] ?? ''
    const defaut = migration.match(/quota_sprites\s+smallint\s+not null\s+default\s+(\d+)/i)?.[1]
    vrai(!!defaut, 'le défaut de quota_sprites est introuvable dans la migration')
    egal(PORTRAITS_INCLUS, Number(defaut), 'portraits inclus annoncés vs défaut serveur')

    // ⚠ ET LE PRIX N'AVAIT AUCUNE GARDE, alors qu'il est celui des deux nombres
    // qui s'affiche EN EUROS. `vrai(COUT_PORTRAIT_CENTIMES > 0)` ne disait qu'une
    // chose — que le portrait n'est pas annoncé gratuit — et laissait passer
    // n'importe quel montant faux. Ce qui décompte vraiment est
    // `plafond.cout_unitaire_centimes`, dans le filet monétaire : c'est lui que
    // l'écran promet au pilote avant qu'il tape.
    const filet = Object.entries(MIGRATIONS)
      .find(([c]) => c.includes('filet_monetaire'))?.[1] ?? ''
    const cout = filet.match(/cout_unitaire_centimes\s+integer\s+not null\s+default\s+(\d+)/i)?.[1]
    vrai(!!cout, 'le défaut de cout_unitaire_centimes est introuvable dans la migration')
    egal(COUT_PORTRAIT_CENTIMES, Number(cout), 'prix annoncé en euros vs coût unitaire du serveur')
    vrai(COUT_PORTRAIT_CENTIMES > 0, 'un portrait annoncé gratuit est un portrait qui surprend')
  }),

  /* ─── RÉCIT 17.1 — UNE JOURNÉE ANNONCÉE NE SE COMPTE PAS COMME VÉCUE ──────
     Ces deux essais sont la RAISON D'ÊTRE de `src/db/vecu.ts`, et ils sont
     écrits contre l'histoire du défaut plutôt que contre son symptôme.

     Le symptôme, c'était quatre chiffres faux. La cause, c'est une règle écrite
     quatre fois et demie : `usure.ts` la tenait entière — état ET date —,
     `bilan.ts` à moitié, `chiffres.ts` et `circuits.ts` pas du tout. Corriger
     les quatre requêtes une par une est exactement la manière dont le défaut
     est né, et la cinquième lecture serait écrite de la même façon : par
     quelqu'un qui ne sait pas que la règle existe.

     Le seul témoin qui voie ça est donc le TEXTE SOURCE. Rien dans le code ne
     relie deux requêtes SQL écrites dans deux fichiers ; elles ne partagent ni
     type, ni appel, ni schéma — le compilateur ne peut rien en dire. */
  doit('17.1 — le jour civil local ne recule pas à minuit à Paris', () => {
    const justeApresMinuitParis = new Date('2026-08-26T22:30:00.000Z')
    egal(dateCivileLocale(justeApresMinuitParis, -120), '2026-08-27',
      'UTC a gagné sur le jour vécu en UTC+2')
  }),

  doit('23.5 — aujourd’hui, à venir et passés sont exclusifs et ordonnés', () => {
    const lignes = [
      { id: 'p1', date_jour: '2026-08-24' },
      { id: 'f2', date_jour: '2026-08-29' },
      { id: 'j2', date_jour: '2026-08-26' },
      { id: 'p2', date_jour: '2026-08-25' },
      { id: 'f1', date_jour: '2026-08-27' },
      { id: 'j1', date_jour: '2026-08-26' },
    ]
    const groupes = classerRoulages(lignes, '2026-08-26')
    egal(groupes.aVenir.map((r) => r.id), ['f1', 'f2'], 'futur non ascendant')
    egal(groupes.passes.map((r) => r.id), ['p2', 'p1'], 'passé non descendant')
    egal(groupes.aujourdhui.map((r) => r.id), ['j2', 'j1'], 'ordre du jour instable')
    const tous = [...groupes.aujourdhui, ...groupes.aVenir, ...groupes.passes].map((r) => r.id)
    egal([...new Set(tous)].sort(), lignes.map((r) => r.id).sort(),
      'un roulage manque ou apparaît dans deux sections')
  }),

  doit('17.1 — toute lecture des roulages se prononce sur le temps', () => {
    const fautives = lecturesDeRoulage()
      .filter((q) => !q.sql.includes('A_EU_LIEU') && !q.sql.includes('TOUTES_JOURNEES'))
      .map((q) => `${q.fichier} — ${q.sql.replace(/\s+/g, ' ').trim().slice(0, 90)}`)
    egal(fautives, [],
      'lectures qui comptent des roulages sans dire ce qu\'elles font du futur')
  }),

  doit('17.1 — le prédicat ne se recopie nulle part', () => {
    /* ⚠ LA MOITIÉ QUI MANQUERAIT SANS ÇA. L'essai ci-dessus se satisfait d'une
       requête qui REDÉCLARE la règle à la main — `etat = 'usage' AND date_jour
       <= ?` recopié une cinquième fois passerait sans citer `A_EU_LIEU`, en
       portant simplement la marque. Or une règle recopiée est une règle qui
       diverge : c'est littéralement ce qui vient d'arriver entre `usure.ts` et
       `bilan.ts`, qui n'en portaient déjà plus la même moitié. */
    const copies = lecturesSql()
      .filter((q) => /etat\s*=\s*'usage'/i.test(q.sql))
      .map((q) => q.fichier)
    egal(copies, [], 'fichiers qui réécrivent le prédicat au lieu de l\'appeler')
  }),

  doit('17.1 — la lecture des requêtes ne laisse rien dehors', () => {
    /* ⚠ LA GARDE QUI GARDE LES DEUX AUTRES, et elle arrive parce que la revue a
       PROUVÉ le trou : les deux essais ci-dessus ne lisaient que les gabarits
       entre accents inverses, si bien qu'une requête écrite entre apostrophes
       traversait tout sans être lue. Le découpage lit maintenant les trois
       formes — mais un découpage peut DÉRAPER : une apostrophe de prose JSX
       (« Rien n'attend au garage, et l'engagement… ») ressemble à une chaîne,
       et le scanner qui l'avale peut manquer la requête d'après. Il perdrait
       alors des lectures EN SILENCE, ce qui est exactement le défaut qu'on
       corrige, déplacé d'un cran.

       On mesure donc la lecture elle-même : tout `FROM roulage` du code nu
       doit se trouver DANS un littéral lu. Le reste — le code hors
       commentaires et hors chaînes — ne doit plus en contenir un seul. */
    const dehors: string[] = []
    for (const [chemin, texte] of Object.entries(SOURCES)) {
      const { reste } = decouper(texte)
      const n = (reste.match(/\b(?:FROM|JOIN)\s+roulage\b/gi) ?? []).length
      if (n) dehors.push(`${chemin.replace(/^.*\/src\//, 'src/')} — ${n} lecture(s)`)
    }
    egal(dehors, [], 'lectures de `roulage` que le découpage n\'a pas vues')

    // Et l'autre borne : une lecture qui rendrait ZÉRO requête passerait les
    // trois essais sans rien dire. Un témoin muet ressemble à un témoin
    // satisfait — le même piège que le recensement des gestes destructifs.
    vrai(lecturesDeRoulage().length >= 20,
      `seulement ${lecturesDeRoulage().length} lectures de roulage trouvées`)
    vrai(gabaritsSql().length >= 60,
      `seulement ${gabaritsSql().length} requêtes lues dans les sources`)
  }),

  /* ─── RÉCIT 17.2 — LE TAP N'OUVRE PAS UN POST-MORTEM ──────────────────────
     L'écran d'une journée à venir se définit par ce qu'il NE porte pas, et une
     absence ne se vérifie que par la négative. Les mots visés sont ceux que le
     bilan affiche sur une journée vide : « Meilleur tour du jour », « Sessions »
     et le bouton « Saisir une session » en primaire pleine largeur. */
  doit('17.2 — l\'écran d\'une journée à venir ne réclame aucun chrono', () => {
    const source = Object.entries(ECRANS).find(([c]) => c.endsWith('/Journee.tsx'))?.[1] ?? ''
    vrai(source.length > 0, 'Journee.tsx introuvable')
    const affiche = source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')

    for (const mot of ['Meilleur tour du jour', 'Sessions', 'Déclarer une chute'])
      vrai(!affiche.includes(mot), `« ${mot} » sur une journée qui n'a pas eu lieu`)

    // ⚠ MAIS LA PORTE RESTE OUVERTE — et c'est la moitié qu'on oublie. « On
    // change ce qui est PROPOSÉ EN PREMIER, on ne ferme aucune porte » : si le
    // pilote roule le jour même, le chemin du chrono existe. Il n'est
    // simplement pas le bouton primaire pleine largeur.
    const saisir = boutonsDe(source).filter((b) =>
      b.libelles.some((l) => /saisir une session/i.test(l)))
    egal(saisir.length, 1, 'le chemin vers la saisie d\'une session a disparu')
    /* ⚠ LE GARDE NE RECONNAISSAIT LE PRIMAIRE QUE SOUS SA FORME LITTÉRALE.
       `className="bouton"` collé au libellé : une classe CALCULÉE —
       `className={x ? 'bouton' : 'lien'}` — ou seulement un attribut glissé
       entre les deux, et l'expression régulière ne voyait plus rien. On lit
       maintenant la classe telle que `boutonsDe` l'extrait, et une classe
       qu'on ne sait PAS lire compte comme primaire : un garde qui se tait sur
       ce qu'il ignore ne garde rien. */
    vrai(!estPrimaire(saisir[0].className),
      `« Saisir une session » est redevenu le bouton primaire (className « ${saisir[0].className} »)`)

    // Aucun compteur de progression, aucune certification : ni « 4 sur 7 », ni
    // pourcentage, ni « prêt ». C'est la même clause que FR-50, et elle vaut
    // ici mot pour mot.
    vrai(!/\d+\s*(sur|\/)\s*\d+/.test(affiche), 'un compteur de progression est apparu')
    for (const mot of ['il te reste', 'plus que', 'prêt à partir'])
      vrai(!affiche.toLowerCase().includes(mot), `« ${mot} » fabrique une échéance`)
  }),

  doit('17.2 — l\'écran de préparation ne ferme AUCUNE porte du bilan', () => {
    /* ⚠ LA MOITIÉ QUE L'ESSAI D'AU-DESSUS NE VOYAIT PAS, et la plus chère.
       « On change ce qui est PROPOSÉ EN PREMIER, on ne ferme aucune porte » :
       la première moitié se vérifiait par la négative, la seconde ne se
       vérifiait pas du tout. Sur une journée datée du JOUR MÊME, `sePrepare`
       est vrai — c'est cet écran-ci qui s'ouvre au paddock — et il retirait en
       silence les photos, « Déclarer un geste », « J'ai chuté ce jour-là », ce
       que la journée a coûté, « Ajouter une dépense », le récapitulatif et
       l'interrupteur de visibilité. Ce sont les gestes du jour même.

       Le témoin porte sur les DEUX bouts : l'écran rend bien chaque bloc, et
       App.tsx les lui donne bien.

       ⚠ ET IL NE DOUBLE PAS LE COMPILATEUR, ÉPROUVÉ DANS LES DEUX SENS. Retirer
       la propriété de `<Journee>` fait bien une TS2741, et retirer `{cout}` du
       rendu une TS6133 : de ce côté-là, `tsc -b` suffisait. Ce qu'aucun type ne
       voit, c'est `photos={null}` — `React.ReactNode` l'accepte, la
       construction passe, et les six portes se referment en silence. C'est
       exactement la forme du défaut d'origine, et c'est le banc de fumée qui
       l'attrape : les sept vérifications « la porte est ouverte » de
       `fumee-a-venir` rougissent toutes les six sur ce cas-là (la septième, le
       récapitulatif, est un bouton de l'écran et tient toute seule). Cet
       essai-ci garde l'autre moitié : que le CÂBLAGE existe encore. */
    const brut = Object.entries(ECRANS).find(([c]) => c.endsWith('/Journee.tsx'))?.[1] ?? ''
    vrai(brut.length > 0, 'Journee.tsx introuvable')
    // Ce que l'écran REND, pas ce qu'il raconte : le commentaire de ce fichier
    // cite `<Photos>` pour dire qu'il ne le monte pas.
    const source = sansCommentaires(brut)
    const app = sansCommentaires(
      Object.entries(ECRANS).find(([c]) => c.endsWith('/App.tsx'))?.[1] ?? '')
    const balise = app.slice(app.indexOf('<Journee'), app.indexOf('/>', app.indexOf('<Journee')))
    vrai(balise.length > 0, '<Journee> introuvable dans App.tsx')

    for (const porte of ['photos', 'chutes', 'cout', 'visibilite']) {
      vrai(new RegExp(`\\{\\s*${porte}\\s*\\}`).test(source),
        `la porte « ${porte} » n'est plus rendue sur l'écran de préparation`)
      vrai(new RegExp(`\\b${porte}=`).test(balise),
        `la porte « ${porte} » n'est plus donnée à <Journee> par App.tsx`)
    }

    const recap = boutonsDe(source)
      .filter((b) => b.libelles.some((l) => /voir le récapitulatif/i.test(l)))
    egal(recap.length, 1, 'le chemin vers le récapitulatif a disparu de la préparation')
    vrai(/\bonRecap=/.test(balise), '<Journee> ne reçoit plus onRecap')

    // ⚠ ET LES MÊMES NŒUDS QUE LE BILAN, PAS DES JUMEAUX. Un second `<Photos>`
    // monté ici aurait divergé du premier à la première correction — c'est la
    // règle que la checklist tient déjà en se DÉPLAÇANT plutôt qu'en se
    // dupliquant. L'écran reçoit donc des nœuds, il n'en compose aucun.
    for (const monte of ['<Photos', '<Chutes', '<BlocCout', '<Visibilite'])
      vrai(!source.includes(monte),
        `${monte} est monté une seconde fois dans Journee.tsx au lieu d'être reçu`)
  }),

  doit('17.2 — la première trace fait basculer la journée, l\'argent jamais', () => {
    /* ⚠ `sePrepare` NE REGARDAIT QUE LES SESSIONS, et son propre commentaire
       citait pourtant FR-61 : « confirmé par le pilote OU PAR UNE MESURE ».
       Une photo prise au paddock, un geste déclaré, une chute consignée le jour
       même laissaient l'écran ouvrir la PRÉPARATION d'une journée où le pilote
       était déjà.

       Les trois cas du bas sont les BORDS, et ce sont eux qui tiennent le
       récit :
         · une mesure sur une journée À VENIR ne bascule rien — une photo
           attachée à la journée de septembre est le flyer de l'organisateur,
           pas une preuve d'y être allé ;
         · une session bascule quelle que soit la date — un chrono ne se saisit
           pas par avance, et c'est le comportement d'origine ;
         · l'argent ne bascule JAMAIS, et c'est la clause la plus facile à
           casser : « L'engagement » est une ligne d'« Avant d'y aller », donc
           la liste envoie elle-même payer. La compter détruirait la liste à
           l'instant où l'on suit sa consigne. `mesures` ne compte donc aucune
           dépense (`bilanRoulage`, src/db/depot.ts), et les bancs
           `fumee-journee` et `fumee-budget` suivent ce chemin en entier. */
    const jour = '2026-08-26'
    const av = (d: string, s = 0, m = 0) => sePrepare({ date: d, sessions: s, mesures: m }, jour)

    vrai(av('2026-09-12'), 'une journée de septembre ne se prépare plus')
    vrai(av(jour), 'la journée du jour, vierge, ne se prépare plus')
    vrai(!av('2026-08-25'), 'une journée passée porte une liste de préparation')

    vrai(!av(jour, 1, 0), 'une session ne fait plus basculer la journée du jour')
    vrai(!av(jour, 0, 1), 'une photo, un geste ou une chute ne fait pas basculer le jour même')
    vrai(!av('2026-09-12', 1, 0), 'un chrono saisi ne fait pas basculer une journée à venir')
    vrai(av('2026-09-12', 0, 3), 'une pièce jointe ferme la préparation d\'une journée à venir')

    // Et la lecture qui l'alimente ne compte QUE ces trois tables — pas la
    // dépense. Le compte se lit dans la requête, seul endroit qui fasse foi.
    const bilanSql = gabaritsSql()
      .find((q) => q.fichier.endsWith('db/depot.ts') && /AS mesures/.test(q.sql))?.sql ?? ''
    vrai(bilanSql.length > 0, '`mesures` a disparu de bilanRoulage')
    for (const table of ['photo', 'geste', 'chute'])
      vrai(new RegExp(`FROM ${table}\\b`).test(bilanSql), `\`mesures\` ne compte plus les ${table}s`)
    vrai(!/FROM depense\b/.test(bilanSql),
      '`mesures` compte une dépense : « L\'engagement » refermerait sa propre liste')
  }),

  doit('17.2 — la préparation ne dit pas « rien » avant de savoir', () => {
    /* ⚠ L'ÉCRAN AFFIRMAIT UN FAIT FAUX À CHAQUE OUVERTURE. Les deux listes
       partent vides et se remplissent d'une requête : le premier rendu
       annonçait « Rien n'attend au garage, et l'engagement est saisi » — une
       phrase fausse une fraction de seconde, à chaque fois, sur l'écran dont
       tout le propos est de n'énoncer que ce qu'il sait. « Je ne sais pas
       encore » et « il n'y a rien » sont deux états : le second se dit, le
       premier ne se dit pas.

       Le témoin est un ORDRE dans le fichier : la sortie qui se tait doit
       précéder la phrase. `data-etat` porte la même distinction jusque dans le
       DOM, et `fumee-a-venir` s'en sert comme condition d'attente — un écran
       qui réaffirmerait trop tôt y ferait rougir le banc. */
    const brut = Object.entries(ECRANS).find(([c]) => c.endsWith('/Preparation.tsx'))?.[1] ?? ''
    vrai(brut.length > 0, 'Preparation.tsx introuvable')
    // Le commentaire du fichier CITE la phrase fautive pour dire pourquoi elle
    // attend : lire le fichier brut ferait accuser la mémoire du défaut.
    const source = sansCommentaires(brut)
    const tait = source.indexOf('data-etat="attente"')
    const phrase = source.indexOf('Rien n\'attend au garage')
    vrai(tait > 0, 'l\'état « je ne sais pas encore » a disparu de la préparation')
    vrai(phrase > tait, 'la phrase du vide se rend avant que la liste ait répondu')
    vrai(/setSu\(true\)/.test(source), 'plus rien ne marque le moment où la liste a répondu')
    // Et le vide reste DISABLE : quand la liste a répondu et qu'elle est vide,
    // le produit le dit. Une absence se dit ; c'est l'ignorance qui se tait.
    vrai(source.includes('data-etat="su"'), 'l\'état « je sais » a disparu du DOM')
  }),

  doit('17.3 — le garage et l\'avant-roulage comptent la MÊME chose', () => {
    /* ⚠ DEUX ERREURS VIVAIENT LÀ ET SE COMPENSAIENT EXACTEMENT, ce qui est la
       pire forme : rien ne se voyait, et corriger UNE SEULE décalait toute la
       liste d'un roulage.

         · l'avant-roulage faisait un `count(*)` BRUT là où le garage additionne
           des coefficients de pondération ;
         · il testait `n > intervalle` là où le garage lit `pondérés >= intervalle`.

       Comme `n` valait `pondérés + 1` — le roulage préparé se comptant
       lui-même —, les deux fautes s'annulaient.

       Le remède n'est pas d'aligner deux calculs : c'est de n'en avoir plus
       qu'un. Ce témoin refuse donc à `preparation.ts` toute lecture de `roulage`
       — la seule manière d'empêcher le troisième calcul de renaître. */
    const brut = Object.entries(SOURCES).find(([c]) => c.endsWith('db/preparation.ts'))?.[1] ?? ''
    vrai(brut.length > 0, 'preparation.ts introuvable')
    const source = sansCommentaires(brut)
    vrai(/\bhorloges\(/.test(source),
      'l\'avant-roulage ne passe plus par `horloges` : il a repris un calcul à lui')
    vrai(!/FROM\s+roulage\b/i.test(source),
      'preparation.ts relit `roulage` : c\'est exactement le second calcul qui divergeait')
    vrai(!/count\(\*\)[\s\S]{0,80}FROM\s+roulage/i.test(source),
      'un `count(*)` brut de roulages est revenu dans l\'avant-roulage')
  }),

  doit('17.3 — un chiffre d\'usure ne s\'affiche jamais sans sa complétude', () => {
    /* FR-40 n'a PAS d'exception d'écran, et c'est la seule clause du produit qui
       touche la sécurité d'une machine. Le garage affiche « sur 7 roulages
       saisis » à côté de chaque horloge ; l'avant-roulage affichait le même
       chiffre tout nu.

       La garde porte sur le TYPE d'abord — `Tache.complet` n'est pas optionnel,
       donc aucune tâche ne peut être construite sans se prononcer — et sur le
       rendu ensuite. Un `complet?:` suffirait à rouvrir le trou en silence. */
    const db = Object.entries(SOURCES).find(([c]) => c.endsWith('db/preparation.ts'))?.[1] ?? ''
    const ecran = Object.entries(ECRANS).find(([c]) => c.endsWith('/Preparation.tsx'))?.[1] ?? ''
    vrai(db.length > 0 && ecran.length > 0, 'les sources de la préparation sont introuvables')
    vrai(/complet:\s*string\s*\|\s*null/.test(sansCommentaires(db)),
      '`Tache.complet` a disparu ou est devenu optionnel : le chiffre peut repartir tout nu')
    vrai(/t\.complet/.test(sansCommentaires(ecran)),
      'l\'écran ne rend plus la complétude à côté du chiffre d\'usure')
    /* Et la formulation est celle du garage AUX MÊMES MOTS — éprouvée sur la
       sortie, pas sur le texte source : la phrase du garage est assemblée de
       trois ternaires, donc « roulages saisis » n'y apparaît nulle part en
       toutes lettres. Un témoin qui lirait la source se satisferait de
       n'importe quoi. Deux phrases pour le même fait sur deux écrans font
       douter du chiffre, et c'est le chiffre qui touche la sécurité. */
    egal(direLaCompletude({ saisis: 7, sansGroupe: 0 }), 'sur 7 roulages saisis',
      'la complétude ne se dit plus dans les mots du garage')
    egal(direLaCompletude({ saisis: 1, sansGroupe: 0 }), 'sur 1 roulage saisi',
      'la complétude ne s\'accorde plus au singulier')
    egal(direLaCompletude({ saisis: 7, sansGroupe: 2 }),
      'sur 7 roulages saisis · 2 sans groupe, donc comptés sans pondération',
      'la complétude tait les roulages sans groupe : le chiffre prétend à une précision qu\'il n\'a pas')
  }),

  doit('17.3 — le socle pose des compteurs, jamais des échéances', () => {
    /* DÉCISION DE JULIAN DU 25 AOÛT : le socle n'est pas une liste embarquée,
       ce sont des HORLOGES posées sur SA moto. La différence tient entièrement
       dans l'intervalle : sans barème, une horloge compte sans jamais échoir
       (FR-44) et ne produit AUCUNE ligne d'avant-roulage.

       Un intervalle inventé ici — une moyenne, un « en général 6000 km » —
       fabriquerait un verdict sur une plaquette de frein à partir de rien. */
    const brut = Object.entries(SOURCES).find(([c]) => c.endsWith('db/preparation.ts'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    vrai(/POSTES_DE_BASE/.test(source), 'le socle a disparu')
    vrai(/intervalle:\s*null/.test(source),
      'le socle pose un intervalle : le produit invente une échéance qu\'aucune source ne porte')
    vrai(!/intervalle:\s*\d/.test(source), 'un intervalle chiffré est écrit en dur dans le socle')
    // Et la boucle des horloges continue de SORTIR sans barème.
    vrai(/a\.intervalle == null\) continue/.test(source),
      'une horloge sans barème peut de nouveau produire une ligne d\'avant-roulage')
  }),

  doit('17.4 — « assurance » et « L\'assurance » sont la même tâche', () => {
    /* Le rapprochement ne portait que sur les libellés STRICTEMENT identiques,
       et c'est le cas qui n'arrive jamais : la ligne dérivée s'appelle
       « L'assurance », le pilote tape « assurance ». Deux lignes pour la même
       chose, et le produit ne disait rien — ce qui est pire que de la montrer
       deux fois, parce qu'on ne sait plus laquelle fait foi. */
    vrai(memeTache("L'assurance", 'assurance'), 'l\'article de tête sépare encore deux fois la même tâche')
    vrai(memeTache("L'engagement", 'Engagement'), 'la casse sépare encore deux fois la même tâche')
    vrai(memeTache('Les pneus', 'pneus'), 'l\'article pluriel sépare encore deux fois la même tâche')
    vrai(memeTache('Vidange moteur', 'vidange  MOTEUR'), 'l\'espace double sépare deux fois la même tâche')
    /* ⚠ ET IL NE RAPPROCHE PAS TROP. Rapprocher à tort MASQUE une tâche que le
       pilote a écrite lui-même, et il ne saura jamais pourquoi elle a disparu.
       Dans le doute, on montre. */
    vrai(!memeTache('Pneus', 'Pneumatiques'), 'le rapprochement racinise : il masquera des tâches vraies')
    vrai(!memeTache("L'assurance", "L'engagement"), 'deux tâches distinctes sont confondues')
    vrai(!memeTache('assurance', ''), 'une saisie vide se confond avec une tâche')
  }),

  doit('17.4 — les règles qui redescendent n\'effacent aucune coche', () => {
    /* LE GESTE ORDINAIRE : on compose le chargement le jeudi soir au garage,
       hors ligne ; les règles de Pau-Arnos arrivent le vendredi par la
       synchronisation ; et plus rien n'appelle `composer`, qui rend 0 dès qu'une
       ligne existe. Elles étaient perdues pour ce roulage, définitivement et
       sans un mot.

       Le remède ne peut PAS être de recomposer : ça décocherait tout. La
       fonction n'a donc le droit d'écrire QUE des INSERT — un seul UPDATE ou
       DELETE dans son corps et la liste se retourne contre le pilote. */
    const brut = Object.entries(SOURCES).find(([c]) => c.endsWith('db/checklist.ts'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    const debut = source.indexOf('export const verserLesReglesManquantes')
    vrai(debut > 0, '`verserLesReglesManquantes` a disparu : les règles tardives sont reperdues')
    const fin = source.indexOf('export const', debut + 20)
    const corps = source.slice(debut, fin > 0 ? fin : undefined)
    vrai(!/\bUPDATE\b/i.test(corps), 'la reprise des règles fait un UPDATE : elle touche des coches')
    vrai(!/\bDELETE\b/i.test(corps), 'la reprise des règles fait un DELETE : elle emporte des lignes')
    vrai(/INSERT INTO checklist_ligne/.test(corps), 'la reprise des règles n\'écrit plus rien')
    // Et elle est réellement APPELÉE : une fonction juste que personne n'appelle
    // est exactement l'état d'avant.
    const ecran = Object.entries(ECRANS).find(([c]) => c.endsWith('/Checklist.tsx'))?.[1] ?? ''
    vrai(/verserLesReglesManquantes\(/.test(sansCommentaires(ecran)),
      'plus personne n\'appelle la reprise des règles : elles sont reperdues')
  }),

  doit('17.4 — « je ne sais rien » et « je n\'ai pas pu lire » sont deux phrases', () => {
    /* Le mode PAR DÉFAUT du produit est le pilote sans compte : son `circuit_id`
       reste nul pour toujours, parce que le rattachement au référentiel se fait
       CÔTÉ SERVEUR (migration 20260825000003) et que rien de lui ne monte au
       serveur. Lui dire « aucune règle publiée n'est connue » présente une
       absence de savoir comme un savoir de l'absence : la question n'a même pas
       été posée pour sa journée.

       Et aucune des deux phrases n'a le droit de conclure : l'organisateur
       reste la seule source, dans les deux cas. */
    const brut = Object.entries(ECRANS).find(([c]) => c.endsWith('/Checklist.tsx'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    vrai(/lien === 'rattache'/.test(source),
      'l\'écran ne distingue plus les deux absences : il affirme ne rien savoir sans avoir cherché')
    vrai(/rattachée à aucun circuit/.test(source), 'la phrase du non-rattachement a disparu')
    vrai(/Aucune règle publiée/.test(source), 'la phrase du silence de l\'organisateur a disparu')
    // Aucune des deux ne certifie quoi que ce soit — FR-50.
    for (const mot of ['conforme', 'validé', 'admis', 'tu es en règle'])
      vrai(!new RegExp(mot, 'i').test(source), `le chargement dit « ${mot} »`)
  }),

  doit('20.2 — chaque icône tombe sur la grille, et rien qu\'elle', () => {
    /* ⚠ UN DESSIN DE ONZE LIGNES SE RENDRAIT DÉCALÉ, SANS ERREUR ET SANS UN MOT.
       C'est le seul défaut que cette forme de tracé peut produire : on ne peut
       pas écrire une coordonnée hors grille puisqu'il n'y a pas de coordonnée à
       écrire, mais on peut oublier un point en fin de ligne. Le premier essai
       écrit ici a trouvé exactement ça sur le trophée — onze caractères au lieu
       de douze — avant que quoi que ce soit ne soit rendu à l'écran. */
    const d = dessins()
    const noms = Object.keys(d)
    vrai(noms.length >= 10, `seulement ${noms.length} icônes : le jeu s'est vidé`)
    for (const n of noms) {
      const lignes = d[n as keyof typeof d].trim().split('\n')
      egal(lignes.length, GRILLE, `« ${n} » n'a pas ${GRILLE} lignes`)
      for (const [i, l] of lignes.entries()) {
        egal(l.length, GRILLE, `« ${n} », ligne ${i} : largeur`)
        vrai(/^[#.]+$/.test(l), `« ${n} », ligne ${i} porte autre chose que # et .`)
      }
      vrai(l_pleine(d[n as keyof typeof d]) > 8, `« ${n} » est presque vide : ce n'est pas un dessin`)
    }
  }),

  doit('20.2 — le tracé rendu ne sort jamais du cadre', () => {
    /* Le tracé est CALCULÉ, pas écrit : c'est ce qui garantit la grille. Reste à
       éprouver le calcul lui-même — un rectangle qui déborderait d'un pixel
       serait rogné par le `viewBox` en silence, et l'icône perdrait un bout sans
       que rien ne rougisse. On relit donc les coordonnées produites. */
    for (const [nom, d] of Object.entries(chemins())) {
      vrai(d.length > 0, `« ${nom} » ne dessine plus rien`)
      for (const m of d.matchAll(/M(\d+) (\d+)h(\d+)/g)) {
        const [x, y, w] = [Number(m[1]), Number(m[2]), Number(m[3])]
        vrai(y >= 0 && y < GRILLE, `« ${nom} » dessine hors du cadre en y=${y}`)
        vrai(x >= 0 && x + w <= GRILLE, `« ${nom} » déborde en x : ${x}+${w}`)
        vrai(w > 0, `« ${nom} » pose un rectangle de largeur nulle`)
      }
      // Et le tracé est COMPACT : une commande par suite horizontale, pas une
      // par pixel. Une icône pleine ferait 144 commandes au lieu d'une douzaine.
      const commandes = (d.match(/M/g) ?? []).length
      vrai(commandes <= 40, `« ${nom} » pose ${commandes} rectangles : le regroupement est cassé`)
    }
  }),

  doit('20.2 — une seule grille : le trophée a rejoint les autres', () => {
    /* Il était en `stroke` de 1,8 sur 24 × 24 — un trait fin et lisse, seul de
       son espèce, à côté d'aplats pixel. Deux registres côte à côte se voient, et
       c'est exactement ce que Julian appelle « un assemblage ». */
    const t = Object.entries(ECRANS).find(([c]) => c.endsWith('/Trophee.tsx'))?.[1] ?? ''
    vrai(t.length > 0, 'Trophee.tsx introuvable')
    const source = sansCommentaires(t)
    vrai(/<Icone\b/.test(source), 'le trophée a repris un dessin à lui : deux registres cohabitent')
    vrai(!/strokeWidth/.test(source), 'le trophée est revenu au trait fin')
    vrai(!/viewBox="0 0 24 24"/.test(source), 'le trophée est revenu sur la grille de 24')
    /* ⚠ ET AUCUN ÉCRAN N'A LE DROIT DE POSER UN <svg> À LUI. C'est la seule
       garde qui empêche le jeu de se rouvrir icône par icône — la manière exacte
       dont un assemblage se reconstitue. Deux exceptions déclarées : `Icones.tsx`
       qui EST le jeu, et `Courbe.tsx`, qui n'est pas une icône mais un tracé de
       données à l'échelle de l'écran.

       ⚠ ET L'EXCEPTION EST ANCRÉE SUR LE CHEMIN COMPLET, PAS SUR LE NOM. Elle
       s'écrivait `/\/(Icones|Courbe)\.tsx$/`, donc elle absolvait un fichier
       PARCE QU'IL S'APPELLE Courbe. Un `src/analyses/Courbe.tsx` créé demain —
       et les vues d'analyse arrivent — aurait hérité du droit de poser un <svg>
       sans qu'une seule ligne d'essai change, ni que personne ait décidé quoi
       que ce soit. L'exception d'UN tracé ne doit pas devenir l'exception de
       tous par accident : ce sont ces deux fichiers-là, à cette place-là. */
    const TRACES = ['src/ecrans/Icones.tsx', 'src/ecrans/Courbe.tsx']
    const dansSrc = (chemin: string) => chemin.replace(/^.*\/src\//, 'src/')
    for (const [chemin, brut] of Object.entries(ECRANS)) {
      if (TRACES.includes(dansSrc(chemin))) continue
      vrai(!/<svg\b/.test(sansCommentaires(brut)),
        `${dansSrc(chemin)} dessine un <svg> à lui : le jeu d'icônes se rouvre`)
    }
    /* Et les deux exceptions désignent encore quelque chose. Une exception qui
       pointe un fichier absent ne protège plus rien : elle ne s'applique
       simplement jamais, et le déplacement qui l'a vidée ne fait rougir personne
       — sauf ici. C'est l'autre moitié de l'ancrage : nommer un chemin oblige à
       le tenir à jour, nommer un fichier n'obligeait à rien. */
    for (const t of TRACES)
      vrai(Object.keys(ECRANS).some((c) => dansSrc(c) === t),
        `${t} a bougé : l'exception au <svg> ne désigne plus aucun fichier`)
  }),

  doit('20.2 — un tracé, jamais un emoji', () => {
    /* 🔧 est rendu par la POLICE DU SYSTÈME : bombé et coloré sur iOS, plat sur
       Android, absent d'un WebView pauvre. C'est la convention argumentée dans
       `Trophee.tsx` depuis l'origine, et rien ne l'appliquait à l'échelle du
       produit. On refuse donc les emojis pictographiques dans tout ce qui se
       rend — pas les flèches ni les symboles typographiques, qui viennent de la
       fonte du texte et se comportent comme du texte. */
    const PICTO = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
    for (const [chemin, brut] of Object.entries(ECRANS)) {
      const source = sansCommentaires(brut)
      const trouve = source.match(PICTO)
      vrai(!trouve, `${chemin.split('/').pop()} rend l'emoji ${trouve?.[0]} : il change de dessin selon le téléphone`)
    }
  }),

  doit('20.3 — l\'atelier porte trois tracés, et le mur de FR-46 tient', () => {
    /* FR-46 est une clause de SÉCURITÉ, pas de rangement : si « plaquettes en
       fin de vie » s'affiche à côté de « sticker décollé », l'élément de sécurité
       hérite du caractère repoussable du cosmétique. L'icône est un REPÈRE, pas
       un regroupement — et une icône COMMUNE à deux catégories serait la
       première marche vers la liste mélangée. */
    const brut = Object.entries(ECRANS).find(([c]) => c.endsWith('/Atelier.tsx'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    vrai(/<Icone\b/.test(source), 'l\'atelier est redevenu trois boutons de texte')
    const table = source.slice(source.indexOf('const TRACE'), source.indexOf('export function Atelier'))
    for (const c of ['entretien', 'amelioration', 'reparation_non_vitale'])
      vrai(new RegExp(`${c}:`).test(table), `la catégorie ${c} n'a plus de tracé`)
    const formes = [...table.matchAll(/:\s*'(\w+)'/g)].map((m) => m[1])
    egal(formes.length, 3, 'l\'atelier n\'a plus exactement trois tracés')
    egal(new Set(formes).size, 3,
      'deux catégories de l\'atelier partagent une icône : le mur de FR-46 commence à tomber')
    // Et rien ne relance : FR-48, aucune pastille, aucune échéance, aucun rouge.
    vrai(!/destructif|alerte|pastille|échéance/i.test(source),
      'l\'atelier s\'est mis à réclamer quelque chose')
  }),

  doit('20.3 — l\'argent ne porte ni courbe ni jauge', () => {
    /* « Le portefeuille énonce, une jauge jugerait. » Un graphe de coût qui
       monte est très près d'un verdict, et « dépasser son budget n'est pas une
       faute ». L'icône de l'argent est donc un PORTEFEUILLE, et la courbe est
       réservée à ce qui AMÉLIORE — la cartographie moteur. */
    const d = dessins()
    vrai('portefeuille' in d, 'l\'icône de l\'argent a disparu')
    vrai('courbe' in d, 'l\'icône des améliorations a disparu')
    // Les deux dessins sont bien DIFFÉRENTS : une même forme sous deux noms
    // ferait exactement ce qu'on s'interdit, sans qu'aucun nom ne le dise.
    vrai(d.portefeuille.trim() !== d.courbe.trim(),
      'l\'argent et les améliorations partagent un dessin')
    // Et aucun écran d'argent ne rend la courbe.
    for (const c of ['/Budget.tsx', '/Depense.tsx']) {
      const brut = Object.entries(ECRANS).find(([k]) => k.endsWith(c))?.[1] ?? ''
      vrai(!/nom="courbe"/.test(sansCommentaires(brut)), `${c} pose une courbe sur l'argent`)
    }
  }),

  doit('20.4 — le tracé de l\'équipement perd toujours contre le sprite', () => {
    /* « La combinaison c'est comme un skin, et le casque aussi, c'est à
       pixeliser » (portrait.ts). L'icône n'est qu'un QUATRIÈME état, le dernier :
       portrait pixel, sinon photo réelle, sinon tracé, sinon rien. Une icône qui
       s'afficherait à côté du sprite lui volerait la place, et le sprite est le
       sujet du produit. */
    const brut = Object.entries(ECRANS).find(([c]) => c.endsWith('/Budget.tsx'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    vrai(/TRACE_EQUIPEMENT/.test(source), 'l\'équipement sans média n\'a plus de figure')
    vrai(/\(e\.sprite \|\| photoUrl\) \?/.test(source),
      'le tracé n\'est plus le DERNIER recours : il peut s\'afficher à côté du sprite')
    vrai(/protection: 'casque'/.test(source), 'la protection ne porte plus le casque')
    /* ⚠ ET AUCUNE ÉCHÉANCE, AUCUN ÂGE, AUCUN COMPTEUR sur cette figure. Un
       compteur qui monte sur un équipement de protection est un compte à rebours
       déguisé, et le schéma n'a délibérément aucune colonne d'échéance. */
    const bloc = source.slice(source.indexOf('scene-equipement vide'),
      source.indexOf('scene-equipement vide') + 400)
    for (const mot of ['ans', 'mois', 'échéance', 'reste', 'usé'])
      vrai(!new RegExp(`\\b${mot}\\b`, 'i').test(bloc),
        `la figure de l'équipement porte « ${mot} » : c'est un compte à rebours déguisé`)
  }),

  doit('20.2 — le reliquat du gabarit Vite n\'est plus dans le dépôt', () => {
    /* `public/icons.svg` — bluesky, discord, github, x — référencé nulle part et
       servi à tout le monde. Il n'était pas grave, il était FAUX : quatre icônes
       d'un autre produit dans un dépôt public qui n'en utilise aucune. */
    const publics = Object.keys(PUBLIC)
    vrai(!publics.some((c) => c.endsWith('/icons.svg')),
      'public/icons.svg est revenu : le jeu du gabarit Vite traîne encore')
  }),

  doit('18.3 — dix photos se versent EN SÉRIE, jamais en vol', () => {
    /* ⚠ CE N'EST PAS UNE PRÉFÉRENCE DE STYLE, C'EST UN MUR. `reduire` alloue un
       canevas de 1600 px et décode une image de 48 Mpx : dix décodages
       simultanés tuent l'onglet WebContent d'iOS, sans erreur rattrapable et
       sans qu'on puisse le reprendre. `Promise.all` sur ce tableau serait la
       faute exacte, et elle ne se verrait qu'au paddock, sur le téléphone du
       pilote, une fois les photos choisies. */
    const brut = Object.entries(SOURCES).find(([c]) => c.endsWith('db/photos.ts'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    vrai(source.indexOf('export const verserPlusieurs') > 0,
      '`verserPlusieurs` a disparu : l\'album ne se remplira plus')
    const debut = source.indexOf('export const verserEnSerie')
    const corps = source.slice(debut, source.indexOf('export const', debut + 20))
    vrai(/for \(const \w+ of /.test(corps), 'le versement multiple n\'est plus une boucle en série')
    vrai(!/Promise\.all|Promise\.allSettled/.test(corps),
      'le versement multiple met dix décodages en vol : l\'onglet meurt sans erreur rattrapable')
    /* ⚠ ET LA NEUVIÈME QUI ÉCHOUE N'EMPORTE PAS LES HUIT PREMIÈRES. Le `try`
       est DANS la boucle : dehors, la première erreur sortirait de la fonction
       et le reste du lot ne serait jamais tenté. */
    vrai(corps.indexOf('try') > corps.indexOf('for (const'),
      'le try enveloppe la boucle : une photo ratée arrête tout le lot')
    vrai(/echecs\.push/.test(corps), 'le produit ne dit plus laquelle a manqué')
  }),

  doit('18.3 — l\'écran choisit plusieurs photos et ne les compte pas', () => {
    const brut = Object.entries(ECRANS).find(([c]) => c.endsWith('/Photos.tsx'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    // ⚠ CETTE LIGNE SE LIT SUR LE BRUT, ET C'EST NÉCESSAIRE. L'attribut
    //   accept="image/" suivi d'une étoile contient littéralement une ouverture
    //   de commentaire de bloc : `sansCommentaires` la prend pour telle et avale
    //   tout ce qui suit jusqu'à la prochaine fermeture. Le premier essai écrit
    //   ici a échoué exactement là-dessus, en affirmant que `multiple` avait
    //   disparu alors qu'il était sous ses yeux.
    vrai(/<input[^>]*multiple/.test(brut.replace(/\n/g, ' ')),
      'l\'input a reperdu `multiple` : vingt photos sont vingt allers-retours')
    vrai(!/e\.target\.files\?\.\[0\]/.test(source),
      'l\'écran ne lit de nouveau que la première photo du lot')
    /* ⚠ AUCUN COMPTEUR PENDANT LE VERSEMENT. Pas de « 4 sur 10 », pas de barre.
       Un compteur transforme un versement en attente à surveiller — c'est la
       même clause que la checklist, et c'est ici qu'elle serait la plus facile
       à trahir « pour rassurer ». */
    vrai(!/sur \{|\{[^}]*\} sur \d|\bprogress\b/i.test(source),
      'un compteur de progression est apparu dans le versement')
    // Et ce qui est versé s'affiche AU FUR ET À MESURE : le rappel existe.
    vrai(/verserPlusieurs\([\s\S]*?\{ roulageId \}[\s\S]*?\(\) => charger\(\)/.test(source),
      'la grille ne se remplit plus au fur et à mesure : la file paraît bloquée')
  }),

  doit('18.2 — l\'album est une grille, et la décision est retournée par écrit', () => {
    /* La feuille de style portait la décision inverse, et elle était juste au
       moment où elle a été écrite : « au paddock on en verse une ou deux, pas
       vingt, et une grille à trous fait vide ». C'était une CONSÉQUENCE du
       défaut de 18.3, pas une observation d'usage. Une décision de ce dépôt ne
       se contourne pas en silence : elle se retourne, datée, à l'endroit où elle
       était écrite. */
    const brut = Object.entries(ECRANS).find(([c]) => c.endsWith('/Photos.tsx'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    vrai(/grille-album/.test(source), 'l\'album est redevenu une bande')
    vrai(/\.grille-album\s*\{/.test(FEUILLE), 'la grille de l\'album a disparu de la feuille')
    vrai(/repeat\(auto-fill/.test(FEUILLE),
      'la grille est passée en auto-fit : trois photos s\'étireraient sur toute la largeur')
    // Le retournement est DIT, à l'endroit où la décision d'origine vivait.
    vrai(/DÉCISION EST\s*\n?\s*RETOURNÉE|décision est retournée/i.test(FEUILLE),
      'la décision de la bande a été contournée en silence')
    /* ⚠ ET LA COLLISION DE `.vignette` EST FERMÉE. Elle était déclarée DEUX FOIS
       au premier niveau — 96 px de haut pour les photos, 84 x 84 pour les pièces
       d'atelier — et la seconde gagnait par cascade : les photos du roulage
       n'avaient donc pas la taille que leur commentaire annonçait, et personne ne
       pouvait le voir en lisant l'une ou l'autre déclaration. */
    const declarations = (FEUILLE.match(/^\.vignette\s*[,{]/gm) ?? []).length
    egal(declarations, 0, 'la règle `.vignette` est revenue : la collision peut se rejouer')
  }),

  doit('18.2 — une photo part seule, en rouge, et la facture n\'entre pas', () => {
    /* La seule suppression de photo du produit était `supprimerRoulage`, qui les
       emporte TOUTES avec la journée, ses sessions, ses tours et ses dépenses :
       pour retirer un cliché raté il fallait détruire la journée. C'est la même
       classe de défaut que les vingt-cinq roulages qu'on ne pouvait pas
       effacer. */
    const db = Object.entries(SOURCES).find(([c]) => c.endsWith('db/photos.ts'))?.[1] ?? ''
    const ecran = Object.entries(ECRANS).find(([c]) => c.endsWith('/Photos.tsx'))?.[1] ?? ''
    const dbs = sansCommentaires(db), es = sansCommentaires(ecran)
    vrai(/export const oublierPhoto/.test(dbs), 'aucun chemin ne retire une photo seule')
    const finalisation = dbs.slice(dbs.indexOf('const finaliserSuppressionPhoto'),
      dbs.indexOf('export const oublierPhoto'))
    vrai(/effacerLocale/.test(finalisation),
      'la copie locale reste sur le téléphone : des octets que plus rien ne référence')
    vrai(/DELETE FROM photo WHERE id = \?/.test(finalisation),
      'la suppression ne porte plus sur une seule photo')
    // En rouge, avec un second temps : une photo ne se retape pas.
    vrai(/lien destructif/.test(es), 'le retrait d\'une photo a perdu son rouge')
    vrai(/disparaît du carnet maintenant/.test(es) && /retour du réseau/.test(es),
      'le retrait ne distingue plus disparition immédiate et suppression distante différée')
    vrai(/autres\s+photos restent/.test(es),
      'la phrase ne dit plus que les autres photos restent : c\'est ce qui la distingue de la journée')
    /* « La photo MONTRE un état, la facture PROUVE une dépense. » Le filtre est
       dans la REQUÊTE et pas à l'écran — filtrer côté rendu laisserait la porte
       ouverte au prochain lecteur. */
    const requete = dbs.slice(dbs.indexOf('export const photosDuRoulage'))
    vrai(/genre = 'photo'/.test(requete), 'l\'album a réavalé les factures d\'atelier')
  }),

  doit('18.2 — soixante photos ne tuent pas l\'onglet', () => {
    /* `charger()` crée une URL d'objet par photo et ne libérait le lot précédent
       qu'au `setState` suivant : soixante photos de saison, c'étaient soixante
       blobs décodés retenus en mémoire, et l'onglet WebContent d'iOS meurt sans
       erreur rattrapable bien avant.

       Deux remèdes, et il faut les DEUX : la révocation à la sortie de vue, qui
       ne peut pas passer par l'état React (il est déjà démonté), et le
       chargement paresseux du navigateur, qui empêche le décodage de ce qui
       n'est pas à l'écran. */
    const brut = Object.entries(ECRANS).find(([c]) => c.endsWith('/Photos.tsx'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    vrai(/revokeObjectURL/.test(source), 'plus rien ne révoque les URL d\'objet')
    vrai(/vivantes\.current/.test(source),
      'la révocation à la sortie de vue a disparu : quitter l\'écran laisse tout le lot en vol')
    vrai(/loading="lazy"/.test(source),
      'la grille décode toutes les photos d\'un coup')
    /* ⚠ ET RIEN N'EST CLASSÉ, NOTÉ NI ÉLU. L'album énonce ce qui a été pris,
       dans l'ordre où ça a été pris — c'est ici que la tentation est la plus
       forte de tout le produit. */
    for (const mot of ['meilleure', 'préférée', 'favori', 'étoile', 'classement', 'à la une'])
      vrai(!new RegExp(`\\b${mot}`, 'i').test(source), `l'album porte « ${mot} » : il classe`)
  }),

  doit('22.1 — modifier une journée ne touche RIEN de ce qu\'elle porte', () => {
    /* ⚠ IL FALLAIT SUPPRIMER LA JOURNÉE POUR CORRIGER SA DATE. La seule écriture
       sur `roulage` hors création était `chrono_visible` : une journée saisie au
       mauvais circuit se corrigeait en la retirant — avec ses sessions, ses
       tours, ses photos, ses gestes et ses dépenses — puis en tout ressaisissant.
       Même classe de défaut que les vingt-cinq roulages qu'on ne pouvait pas
       effacer : une donnée qu'on ne peut pas corriger cesse d'être saisie. */
    const brut = Object.entries(SOURCES).find(([c]) => c.endsWith('db/depot.ts'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    const debut = source.indexOf('export const modifierRoulage')
    vrai(debut > 0, '`modifierRoulage` a disparu : la languette « modifier » ouvre le vide')
    const corps = source.slice(debut, source.indexOf('\nexport ', debut + 20))
    // Elle n'écrit QUE sur `roulage`. Un DELETE ou un UPDATE sur une table fille
    // ferait exactement ce que le récit interdit.
    vrai(!/\bDELETE\b/i.test(corps), 'la modification détruit quelque chose')
    for (const table of ['session', 'tour', 'photo', 'geste', 'depense', 'checklist_ligne'])
      vrai(!new RegExp(`\\b${table}\\b`).test(corps),
        `la modification touche \`${table}\` : ce que la journée porte doit rester intact`)
    /* ⚠ ET `circuit_id` REPART À NULL QUAND LE NOM CHANGE. Le rattachement au
       référentiel se fait CÔTÉ SERVEUR, et le déclencheur ne remplit qu'un
       `circuit_id` NUL (migration 20260825000003) : sans cette remise à zéro,
       une journée corrigée de « Nogaro » vers « Pau-Arnos » resterait attachée à
       Nogaro pour toujours. Le nom à l'écran et le rattachement en base diraient
       deux choses différentes, et c'est le rattachement qui décide des règles
       publiées au chargement. */
    vrai(/circuit_id = NULL/.test(corps),
      'le rattachement au référentiel ne se refait plus : le nom et la base divergent')
    vrai(/changeDeCircuit \?/.test(corps),
      'le rattachement repart à zéro à chaque enregistrement, même sans changement')
  }),

  doit('22.1 — entrer par erreur et ressortir ne change rien', () => {
    /* Une clause du récit, pas une évidence : un écran qui enregistrerait au fil
       de la frappe transformerait une ouverture accidentelle en modification.
       Et le même verrou que partout — « une seule écriture part » — parce que
       c'est ce défaut-là qui a produit 25 roulages pour 5 saisies. */
    const brut = Object.entries(ECRANS).find(([c]) => c.endsWith('/App.tsx'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    const debut = source.indexOf('function Modifier(')
    vrai(debut > 0, 'l\'écran de modification a disparu')
    const corps = source.slice(debut, source.indexOf('\nfunction ', debut + 20))
    vrai(/useGeste\(/.test(corps), 'la modification n\'est plus sous verrou : deux taps, deux écritures')
    // Aucun appel d'écriture hors du geste : la seule occurrence de
    // `modifierRoulage` doit être DANS le corps du `useGeste`.
    const appels = (corps.match(/modifierRoulage\(/g) ?? []).length
    egal(appels, 1, 'la modification s\'écrit à plusieurs endroits de l\'écran')
    vrai(corps.indexOf('modifierRoulage(') > corps.indexOf('useGeste('),
      'la modification s\'écrit hors du verrou')
    // Et l'écran DIT ce qui ne bouge pas — sans ça, on préfère supprimer et
    // ressaisir, c'est-à-dire exactement ce qu'il existe pour éviter.
    vrai(/ne bouge pas/.test(corps), 'l\'écran ne dit plus ce que la journée garde')
  }),

  doit('22.2 — le glissement révèle, il ne détruit pas', () => {
    /* ⚠ UNE RÈGLE ÉCRITE SE LÈVE ICI, ET ELLE VISAIT NOMMÉMENT CET ÉLÉMENT.
       EXPERIENCE.md, 18 août : « Aucun balayage n'y supprime quoi que ce soit —
       avec des gants, un balayage destructeur se déclenche seul. » L'objection
       reste VRAIE, et c'est pour ça que le geste ne fait qu'ouvrir : la
       confirmation qui nomme ce qui part est toujours le dernier mot. Le
       glissement remplace le PREMIER tap, jamais le second. */
    const brut = Object.entries(ECRANS).find(([c]) => c.endsWith('/App.tsx'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    const debut = source.indexOf('function LigneRoulage(')
    const corps = source.slice(debut, source.indexOf('\nfunction ', debut + 20))
    vrai(debut > 0 && /useGlissement\(/.test(corps), 'la ligne de roulage ne glisse plus')
    vrai(/setConfirme\(true\)/.test(corps),
      'la languette rouge n\'ouvre plus la confirmation : elle détruirait au premier tap')
    vrai(!/supprimerRoulage\(/.test(corps.slice(corps.indexOf('languettes'))),
      'la languette appelle la suppression directement')
    vrai(/part définitivement/.test(corps), 'la phrase qui nomme ce qui part a disparu')
    /* ⚠ ET LES DEUX ACTIONS SONT ATTEIGNABLES SANS GLISSER. EXPERIENCE.md:46
       interdit tout geste caché comme SEUL chemin : les languettes sont dans le
       DOM en permanence et seulement REPLIÉES, et `:focus-within` les ouvre dès
       que la tabulation y arrive. `display: none` les retirerait de l'ordre de
       tabulation, et ce serait le geste caché. */
    vrai(/\.languettes:focus-within/.test(FEUILLE),
      'les languettes ne s\'ouvrent plus au clavier : le glissement devient le seul chemin')
    vrai(!/\.languettes\s*\{[^}]*display:\s*none/.test(FEUILLE),
      'les languettes sortent de l\'ordre de tabulation')
    // NFR-8 — 56 px de cible, gants aux mains.
    const regle = FEUILLE.slice(FEUILLE.indexOf('.languettes .lien'))
    vrai(/min-height:\s*56px/.test(regle.slice(0, 300)), 'les languettes sont sous la cible de 56 px')
  }),

  doit('22.2 — faire défiler la liste n\'ouvre aucune languette', () => {
    /* C'est le défaut qui rend ces listes détestables : on fait défiler, une
       ligne s'entrouvre, on tape au hasard. Trois remèdes, et il faut les trois. */
    const brut = Object.entries(SOURCES).find(([c]) => c.endsWith('ecrans/glissement.ts'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    vrai(source.length > 0, 'le glissement a disparu')
    // ① `touch-action: pan-y` : le navigateur garde le défilement vertical.
    vrai(/touch-action:\s*pan-y/.test(FEUILLE),
      'le navigateur ne garde plus le défilement vertical : la liste s\'entrouvre sous le pouce')
    // ② La direction se DÉCIDE une fois et ne rechange plus.
    vrai(/direction\.current = 'vertical'/.test(source),
      'la direction n\'est plus verrouillée : un pouce qui dérive fait basculer la ligne')
    vrai(/useRef/.test(source),
      'la direction est passée par un état : elle serait redécidée à chaque image de rendu')
    // ③ Un SEUIL de distance, jamais une vitesse — un seuil de vitesse punit le
    //    geste appliqué, c'est-à-dire le geste ganté.
    vrai(/SEUIL_PX/.test(source), 'le seuil de distance a disparu')
    vrai(!/velocit|vitesse|\bdt\b|timeStamp/i.test(source),
      'le seuil est devenu une vitesse : il punit le geste ganté')
    // Et rien ne se fait au RELÂCHEMENT : `onPointerUp` ne fait que ranger.
    const finir = source.slice(source.indexOf('const finir'), source.indexOf('return {'))
    vrai(!/setOuvert|supprim|retir/i.test(finir),
      'quelque chose se déclenche au relâchement du doigt : c\'est le balayage destructeur')
  }),

  doit('22.3 — le témoin est un liseré, sur la carte, et jamais une alarme', () => {
    /* ⚠ L'ÉPINE UX PORTE DEUX LIGNES, ET ELLES NE DISENT PAS LA MÊME CHOSE.
       EXPERIENCE.md:212 — « Chargement : il n'y en a pas au noyau ; un
       indicateur de chargement au paddock est un aveu » — et 216 —
       « Synchronisation en attente : un liseré discret sur la carte concernée,
       jamais une modale, jamais un blocage ». La forme était DÉJÀ décidée, et
       elle répond exactement à la demande de Julian. Un rond qui tourne
       demanderait de lever la 212, et c'est à lui de le dire. */
    vrai(/\.bloc\[data-garde="1"\]/.test(FEUILLE), 'le témoin de sauvegarde a disparu')
    vrai(/inset 3px 0 0/.test(FEUILLE), 'le témoin n\'est plus un liseré sur le bord de la carte')
    // Pas de rond qui tourne : aucune rotation nulle part dans la feuille.
    vrai(!/animation:[^;]*(rotation|spin|tourne)/i.test(FEUILLE),
      'un rond qui tourne est apparu : ça demande de lever EXPERIENCE.md:212')
    // UX-DR11 — rien ne tourne sous `prefers-reduced-motion`.
    const reduit = FEUILLE.slice(FEUILLE.lastIndexOf('prefers-reduced-motion'))
    vrai(/data-garde/.test(reduit), 'le témoin ignore `prefers-reduced-motion`')
    /* ⚠ ET IL S'ALLUME APRÈS L'ÉCRITURE, PAS AVANT. Le seul service que ce
       témoin rend est d'être VRAI : allumé avant le `await`, il dirait « c'est
       gardé » d'une chose qui ne l'est pas encore, et une exception le laisserait
       allumé sur un échec. */
    const g = Object.entries(SOURCES).find(([c]) => c.endsWith('ecrans/geste.ts'))?.[1] ?? ''
    const gs = sansCommentaires(g)
    vrai(/setGarde\(true\)/.test(gs), 'le témoin ne s\'allume plus')
    vrai(gs.indexOf('setGarde(true)') > gs.indexOf('await faire('),
      'le témoin s\'allume avant l\'écriture : il annonce gardé ce qui ne l\'est pas')
    vrai(!/finally[\s\S]{0,120}setGarde\(true\)/.test(gs),
      'le témoin s\'allume même quand l\'écriture a échoué')
    /* ⚠ ET IL NE DIT RIEN DU RÉSEAU. Le paddock sans réseau ne doit voir aucune
       dégradation (NFR-7, EXPERIENCE.md:214) : pas de bandeau, pas d'icône
       barrée, pas de « hors ligne ». */
    for (const mot of ['hors ligne', 'pas de réseau', 'déconnecté', 'échec de synchronisation'])
      vrai(!new RegExp(mot, 'i').test(gs), `le témoin annonce « ${mot} »`)
  }),

  doit('22.3 — la première sauvegarde se dit UNE fois', () => {
    /* C'est le seul moment du produit où le pilote a besoin d'entendre ce qui
       vient de se passer : jusque-là tout vivait sur son téléphone, et depuis cet
       instant tout est aussi ailleurs. Le redire à chaque ouverture en ferait un
       décor qu'on cesse de lire — et un décor qu'on cesse de lire rend invisible
       le message suivant, celui qui compte. */
    const sv = Object.entries(SOURCES).find(([c]) => c.endsWith('db/sauvegarde.ts'))?.[1] ?? ''
    vrai(/premiereSauvegardeDite/.test(sansCommentaires(sv)), 'le drapeau de la première fois a disparu')
    // Il porte le PRÉFIXE du produit, donc il part avec « effacer mon téléphone ».
    vrai(/'mypaddock\.premiere-sauvegarde-dite'/.test(sv),
      'le drapeau sort du préfixe : il survivrait à un effacement annoncé complet')
    const app = Object.entries(ECRANS).find(([c]) => c.endsWith('/App.tsx'))?.[1] ?? ''
    const source = sansCommentaires(app)
    vrai(/!premiereSauvegardeDite\(\)/.test(source), 'la phrase se redirait à chaque adoption')
    vrai(/marquerPremiereSauvegardeDite\(\)/.test(source), 'le drapeau n\'est plus posé : la phrase revient')
    // Et elle ne se dit QUE sur un succès complet.
    vrai(/!refus\.length && !premiereSauvegardeDite\(\)/.test(source),
      'la phrase « c\'est gardé » se dit sur une adoption partielle')
  }),

  doit('19.3 — les deux chemins d\'écriture écrivent la MÊME chose', () => {
    /* ⚠ IL Y EN A DEUX, ET C'EST ASSUMÉ : `Depense.tsx` est le seul à proposer la
       cible `roulage` (on paie SA journée), `Budget.tsx` est le seul à proposer
       les huit postes. Ce qui n'est pas assumé, c'est qu'ils écrivent des lignes
       de formes différentes — et c'est ce qui s'est produit : `creerDepense`
       n'écrivait AUCUN poste, donc la tâche dérivée « L'engagement », qui cherche
       `poste = 'engagement'`, ne disparaissait jamais.

       La garde ne compare pas les écrans : elle compare les COLONNES des deux
       INSERT, seule chose qui fasse foi. */
    const colonnes = (fichier: string, fonction: string) => {
      const brut = Object.entries(SOURCES).find(([c]) => c.endsWith(fichier))?.[1] ?? ''
      const s = sansCommentaires(brut)
      const d = s.indexOf(fonction)
      vrai(d > 0, `${fonction} introuvable dans ${fichier}`)
      const insert = s.slice(d).match(/INSERT INTO depense\s*\(([^)]*)\)/)
      vrai(!!insert, `${fonction} n'écrit plus dans depense`)
      return new Set(insert![1].split(',').map((c) => c.trim()).filter(Boolean))
    }
    const a = colonnes('db/depot.ts', 'export const creerDepense')
    const b = colonnes('db/budget.ts', 'export const depenserSur')
    egal([...a].sort(), [...b].sort(),
      'les deux chemins d\'écriture d\'une dépense n\'écrivent plus les mêmes colonnes')
    // Et les trois qui font vivre les écrans en aval sont là dans les deux.
    for (const c of ['poste', 'date_jour', 'cible']) {
      vrai(a.has(c), `creerDepense n'écrit plus \`${c}\``)
      vrai(b.has(c), `depenserSur n'écrit plus \`${c}\``)
    }
  }),

  doit('19.3 — le raccourci de l\'accueil n\'exige ni journée ni machine', () => {
    /* L'écran `depense` n'était monté que si `courant && bilan` : le seul chemin
       depuis l'accueil passait par un roulage à venir SANS engagement saisi.
       Payer ses pneus en février demandait donc d'avoir une journée ouverte. */
    const brut = Object.entries(ECRANS).find(([c]) => c.endsWith('/App.tsx'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    const d = source.indexOf('<NoterUneDepense')
    vrai(d > 0, 'le raccourci de dépense a disparu de l\'accueil')
    // Il est monté SANS condition : pas de `&&` collé devant lui sur sa ligne.
    const ligne = source.slice(source.lastIndexOf('\n', d), d)
    vrai(!/&&\s*$/.test(ligne),
      'le raccourci est redevenu conditionnel : il exige de nouveau une journée ouverte')
    /* ⚠ ET IL NE RÉCLAME RIEN. Aucun « tu n'as rien saisi ce mois-ci », aucune
       pastille, aucun rappel — c'est la contre-mesure C1, et un raccourci
       d'argent est exactement l'endroit où on serait tenté de la trahir. */
    const bud = Object.entries(ECRANS).find(([c]) => c.endsWith('/Budget.tsx'))?.[1] ?? ''
    const bs = sansCommentaires(bud)
    // ⚠ BORNÉ À LA FONCTION, PAS « JUSQU'À LA FIN DU FICHIER ». La première
    //   version prenait tout ce qui suit, donc l'équipement et son
    //   `oublierEquipement` — et accusait le raccourci de « réclamer : oubli ».
    //   Un témoin qui lit trop large accuse au hasard, ce qui revient à ne pas
    //   témoigner du tout.
    const dNote = bs.indexOf('export function NoterUneDepense')
    vrai(dNote > 0, '`NoterUneDepense` a disparu')
    const finNote = bs.indexOf('\nfunction ', dNote)
    const r = bs.slice(dNote, finNote > 0 ? finNote : undefined)
    for (const mot of ['pense à', 'n\'as rien saisi', 'oubli', 'rappel', 'pastille'])
      vrai(!new RegExp(mot, 'i').test(r), `le raccourci réclame : « ${mot} »`)
  }),

  doit('19.4 — le tracé de l\'argent n\'est pas une jauge', () => {
    /* ⚠ LA DIFFÉRENCE TIENT DANS UNE SEULE LIGNE : l'échelle est le PLUS GROS
       de ce qu'on montre, jamais le plafond de la saison. Mesurée contre un
       plafond, une barre devient un compteur à rebours — elle dirait « il te
       reste » — et « dépasser son budget n'est pas une faute ». Mesurée contre
       le plus gros poste, elle dit une COMPOSITION. */
    const brut = Object.entries(ECRANS).find(([c]) => c.endsWith('/Barres.tsx'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    vrai(source.length > 0, 'le tracé de l\'argent a disparu')
    vrai(/Math\.max\(\.\.\.barres\.map\(\(b\) => b\.centimes\)/.test(source),
      'l\'échelle du tracé n\'est plus le plus gros de ce qu\'il montre')
    for (const mot of ['plafond', 'budget', 'reste', 'objectif', 'cible'])
      vrai(!new RegExp(`\\b${mot}\\b`, 'i').test(source),
        `le tracé connaît « ${mot} » : il est en train de devenir une jauge`)
    // Il ne porte pas la classe de la jauge non plus — la cascade suffirait.
    vrai(!/\bjauge\b/.test(source), 'le tracé emprunte le dessin de la jauge')
  }),

  doit('19.4 — aucun mois n\'est jugé, comparé ni coloré', () => {
    /* « Un graphe de coût qui monte est très près d'un verdict. » La règle du
       chrono — aucune tendance, aucune droite, aucun « à ce rythme » — s'applique
       à l'argent telle quelle. Et l'ordre du calendrier est ce qui empêche le
       classement : trier par montant ferait « le mois le plus cher ». */
    const b = Object.entries(ECRANS).find(([c]) => c.endsWith('/Barres.tsx'))?.[1] ?? ''
    const bud = Object.entries(ECRANS).find(([c]) => c.endsWith('/Budget.tsx'))?.[1] ?? ''
    const source = sansCommentaires(b) + sansCommentaires(bud)
    for (const mot of ['tendance', 'projection', 'à ce rythme', 'prévision', 'moyenne mobile',
      'plus cher', 'record de dépense'])
      vrai(!new RegExp(mot, 'i').test(source), `l'argent porte « ${mot} »`)
    /* ⚠ ET AUCUNE COULEUR NE DISTINGUE LES POSTES. La palette a quatre teintes
       utiles, et `--alerte` ne sert QU'À CE QUI DÉTRUIT : colorier huit postes
       obligerait à l'emprunter, et un poste « Pneus » en rouge se lirait comme
       un avertissement sur un montant qui n'en est pas un. */
    const regle = FEUILLE.slice(FEUILLE.indexOf('.barre-argent {'),
      FEUILLE.indexOf('.barre-argent {') + 400)
    vrai(regle.length > 0, 'la barre de l\'argent a disparu de la feuille')
    vrai(!/--alerte|--plus-lent/.test(regle),
      'une barre d\'argent porte le rouge de l\'alerte ou le jaune du dépassement')
    /* ⚠ ET LES MOIS GARDENT L'ORDRE DU CALENDRIER. Les trier par montant ferait
       « le mois le plus cher », et un classement de dépenses est un verdict.
       La garde cherche le TRI, pas un gabarit d'appel : sa première version
       s'ancrait sur le texte `barres={mois.map`, que la mutation qui ajoutait le
       tri effaçait — elle passait donc au vert sur le défaut même qu'elle
       gardait. Un témoin ancré sur ce que le défaut détruit ne témoigne pas. */
    const bs = sansCommentaires(bud)
    vrai(!/\bmois\b[^;\n]{0,40}\.sort\(|\[\s*\.\.\.\s*mois\s*\]/.test(bs),
      'les mois sont re-triés : l\'ordre du calendrier devient un classement')
  }),

  doit('19.4 — le tracé n\'emprunte aucune bibliothèque, et pas même un <svg>', () => {
    /* Le jeu d'icônes tient tout le SVG du produit, et un essai refuse qu'un
       écran en pose un à lui — c'est ce qui empêche l'assemblage de se
       reconstituer. Ce qui aurait justifié un SVG ici, c'est un tracé CONTINU, et
       il n'y en a pas : une ligne reliant deux mois inventerait des valeurs entre
       eux, exactement comme une courbe lissée entre deux roulages. */
    const brut = Object.entries(ECRANS).find(([c]) => c.endsWith('/Barres.tsx'))?.[1] ?? ''
    vrai(!/<svg\b/.test(sansCommentaires(brut)), 'le tracé de l\'argent pose un <svg> à lui')
    // Et le dépôt n'a toujours aucune dépendance d'interface.
    vrai(!/chart|recharts|d3|victory|nivo|apexcharts/i.test(JSON.stringify(Object.keys(PUBLIC))),
      'une bibliothèque de graphes est entrée par les fichiers servis')
  }),

  doit('aucune classe de la feuille n\'est déclarée deux fois', () => {
    /* ⚠ DEUX FOIS EN DEUX JOURS, ET AUCUN DES DEUX NE SE VOYAIT EN LISANT LE
       CODE.
         · `.vignette` était déclarée au premier niveau pour les photos du
           roulage (96 px de haut) ET pour les pièces d'atelier (84 x 84,
           rognées). La seconde gagnait par cascade : les photos n'avaient pas la
           taille que leur commentaire annonçait (récit 18.2) ;
         · `.barre` allait l'être une troisième fois — c'est la barre de
           NAVIGATION du bas, en `position: fixed; bottom: 0`, et le tracé de
           l'argent allait plaquer chacune de ses barres par-dessus (récit 19.4).

       Une collision de ce genre ne produit ni erreur de type, ni écran cassé, ni
       ligne rouge : elle produit un écran presque juste, et on cherche ailleurs.
       La règle est donc mécanique — un sélecteur de classe SEUL, au premier
       niveau, ne s'écrit qu'une fois. Les sélecteurs composés (`.a .b`,
       `.a.b`, `.a[data-x]`) sont hors du champ : ce sont des affinages
       délibérés, et c'est le nom NU qui pose le fondement. */
    const sansBlocs = FEUILLE.replace(/@media[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, ' ')
    const declares = new Map<string, number>()
    // Chaque groupe de sélecteurs devant une accolade, à plat.
    for (const m of sansBlocs.replace(/\/\*[\s\S]*?\*\//g, ' ').matchAll(/([^{}();]+)\{/g)) {
      for (const sel of m[1].split(',')) {
        const s = sel.trim()
        // Un nom de classe NU et rien d'autre : `.machin`, jamais `.a .b`.
        // ⚠ LES LETTRES ACCENTUÉES COMPTENT. `\w` est ASCII en JavaScript : une
        //   classe `.tracé-argent` passait donc à travers cette garde sans être
        //   lue, et un doublon accentué serait resté invisible — c'est-à-dire
        //   exactement le défaut que la garde existe pour attraper.
        if (!/^\.[\p{L}_][\p{L}\p{N}_-]*$/u.test(s)) continue
        declares.set(s, (declares.get(s) ?? 0) + 1)
      }
    }
    const doublons = [...declares].filter(([, n]) => n > 1).map(([s, n]) => `${s} (${n})`)
    vrai(declares.size > 40, `seulement ${declares.size} classes lues : la lecture est cassée`)
    egal(doublons, [], 'des classes sont déclarées deux fois au premier niveau de la feuille')
  }),

  doit('17.5 — ce qu\'on vient chercher ne se coche jamais', () => {
    /* ⚠ C'EST LA CLAUSE ENTIÈRE DU RÉCIT. Un objectif non coché le soir est un
       échec affiché sans qu'aucun libellé ait à le dire — et « travailler les
       virages à gauche » n'a pas de fin qu'on puisse cocher. Pas de case, pas
       d'« atteint », pas de « 2 sur 3 », pas de retour en vert.

       La garde porte sur la BALISE : la ligne d'« Avant d'y aller » qu'on ajoute
       soi-même est un `<button class="coche">`, celle-ci est un `<span>`. Un
       élément qui réagit au doigt invite à taper dessus, et taper dessus voudrait
       dire « atteint ». */
    const brut = Object.entries(ECRANS).find(([c]) => c.endsWith('/Objectifs.tsx'))?.[1] ?? ''
    vrai(brut.length > 0, 'l\'écran de ce qu\'on vient chercher a disparu')
    const source = sansCommentaires(brut)
    vrai(!/className="coche"/.test(source), 'une case à cocher est apparue sur un objectif')
    vrai(!/data-actif/.test(source), 'un objectif porte un état actif/inactif')
    for (const mot of ['atteint', 'réussi', 'validé', 'sur 3', 'progression', 'accompli'])
      vrai(!new RegExp(mot, 'i').test(source), `l'écran des objectifs dit « ${mot} »`)
    // Et rien dans la couche de données ne sait cocher un objectif.
    const db = Object.entries(SOURCES).find(([c]) => c.endsWith('db/objectifs.ts'))?.[1] ?? ''
    vrai(!/\bcocher\b/.test(sansCommentaires(db)),
      'la couche des objectifs sait cocher : la clause du récit est ouverte')
  }),

  doit('17.5 — le produit propose AVANT de demander', () => {
    /* ⚠ IL Y A UN PRÉCÉDENT, ET IL EST ÉCRIT DANS LE CODE. Julian a DÉJÀ rejeté
       un champ de texte libre à remplir avant de rouler, verbatim : « ça fait un
       peu gamin, personne va prendre le temps de le remplir… c'est quoi cette
       merde ». C'était le plan si-alors, l'intervention la mieux établie du
       dossier. Un champ vide sous un titre est le même objet sous un autre nom.

       La garde porte sur l'ORDRE dans le fichier : les propositions doivent
       précéder le champ libre. */
    const brut = Object.entries(ECRANS).find(([c]) => c.endsWith('/Objectifs.tsx'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    const offres = source.indexOf('offres.map')
    const champ = source.indexOf('<input')
    vrai(offres > 0, 'les propositions ont disparu : il ne reste qu\'un champ vide')
    vrai(champ > offres, 'le champ libre passe avant les propositions')
    // Et les propositions viennent de ce que le produit SAIT, pas d'une liste
    // embarquée : la fiche du circuit, le catalogue de caps, et le vécu.
    const db = sansCommentaires(
      Object.entries(SOURCES).find(([c]) => c.endsWith('db/objectifs.ts'))?.[1] ?? '')
    vrai(/ficheCircuit\(/.test(db), 'les virages du circuit ne sont plus proposés')
    vrai(/listerCaps\(/.test(db), 'les caps ne sont plus proposés')
    vrai(/fiche\.sien\.journees/.test(db), 'le fait « jamais roulé ici » n\'est plus lu')
  }),

  doit('17.5 — un chrono visé reste du texte, la courbe ne bouge pas', () => {
    /* Julian a levé le MOT, pas le verdict. « Faire 1 min 30 » s'écrit comme du
       texte et RESTE du texte : aucune cible n'apparaît sur le tracé, aucun écart
       ne s'y calcule. Un chrono visé qui deviendrait une ligne sur la courbe
       fabriquerait un verdict le soir même, et c'est exactement ce que le refus
       de la tendance protège (courbe.ts, epics.md:1815-1834). */
    const courbe = sansCommentaires(
      Object.entries(ECRANS).find(([c]) => c.endsWith('/Courbe.tsx'))?.[1] ?? '')
    vrai(courbe.length > 0, 'Courbe.tsx introuvable')
    for (const mot of ['objectif', 'cible', 'vise', 'visé', 'tendance', 'projection'])
      vrai(!new RegExp(`\\b${mot}`, 'i').test(courbe), `la courbe porte « ${mot} »`)
    // Et la couche des objectifs ne parle jamais à la courbe.
    const db = sansCommentaires(
      Object.entries(SOURCES).find(([c]) => c.endsWith('db/objectifs.ts'))?.[1] ?? '')
    vrai(!/courbe/i.test(db), 'les objectifs remontent sur la courbe')
  }),

  doit('17.5 — l\'avertissement est permanent, et il ne se ferme pas', () => {
    /* ⚠ C'EST LA CONTREPARTIE, POSÉE PAR JULIAN LUI-MÊME, et sans elle le récit
       17.5 n'aurait pas dû s'écrire : « c'est la pratique d'un sport, un petit
       disclaimer en bas de l'app devrait suffire ». Ce qu'elle paie : trois
       règles écrites levées d'un coup — le mot « objectif » interdit, la cible
       chiffrée de chrono, les caps de bravoure.

       Un avertissement qu'on peut renvoyer d'un tap est un avertissement qu'on
       renvoie une fois pour toutes le premier jour. Il n'a donc ni bouton, ni
       état, ni condition : il est rendu à plat, sur tous les écrans. */
    const brut = Object.entries(ECRANS).find(([c]) => c.endsWith('/App.tsx'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    const i = source.indexOf('note avertissement')
    vrai(i > 0, 'l\'avertissement a disparu : trois règles sont levées sans contrepartie')
    /* ⚠ AUCUNE CONDITION DEVANT LUI, ET LA FENÊTRE NE PEUT PAS ÊTRE « SA LIGNE ».
       La première version lisait de l'accolade au début de la ligne courante :
       un `{false && <p className="note avertissement">` la traversait sans
       rougir, parce que le `&&` était sur la MÊME ligne que la balise. Un
       avertissement rendu sous condition est un avertissement qui ne paie plus
       la levée de trois règles, et c'est exactement ce qu'on garde ici. */
    const avant = source.slice(Math.max(0, i - 120), i)
    vrai(!/&&|\?[^>]*$|\bif\b/.test(avant), 'l\'avertissement est devenu conditionnel')
    // Et aucun bouton dans son bloc.
    const bloc = source.slice(i, source.indexOf('</p>', i))
    vrai(!/<button/.test(bloc), 'l\'avertissement porte un bouton : il se refermera')
    vrai(/risque/i.test(bloc), 'l\'avertissement ne nomme plus le risque')
    // Il est SOUS l'écran et au-dessus de la barre : « en bas de l'app ».
    vrai(i > source.indexOf('className="ecran"') && i < source.indexOf('<nav className="barre">'),
      'l\'avertissement a quitté le pied de l\'application')
    // Et la feuille lui laisse la place de la barre fixe, sinon il vit derrière.
    vrai(/\.avertissement\s*\{[^}]*safe-area-inset-bottom/.test(FEUILLE),
      'l\'avertissement passe derrière la barre de navigation')
  }),

  doit('18.4 — l\'envoi des photos se coupe, et couper ne casse rien', () => {
    /* « On ne sauvegarde pas les photos dans notre cloud ? » — il n'existait
       AUCUN réglage : dès qu'il y avait un compte et du réseau, ça partait.
       Le réglage est lu DANS `televerserEnAttente` et pas à l'appel : un
       appelant qui oublierait de le tester enverrait quand même, et ce
       réglage-là ne peut pas se rater. */
    const brut = Object.entries(SOURCES).find(([c]) => c.endsWith('db/photos.ts'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    vrai(/export const envoiCloudActif/.test(source), 'le réglage d\'envoi a disparu')
    const d = source.indexOf('export const televerserEnAttente')
    vrai(d > 0, '`televerserEnAttente` a disparu')
    const corps = source.slice(d, source.indexOf('\nexport ', d + 20))
    vrai(/envoiCloudActif\(\)/.test(corps),
      'le téléversement ne lit plus le réglage : couper ne coupe rien')
    // ⚠ ABSENT = ACTIF. Un réglage absent ne doit jamais changer silencieusement
    //   ce que le produit faisait hier.
    vrai(/!== '0'/.test(source), 'un réglage absent coupe l\'envoi : le comportement change tout seul')
    // Et il vit sous le préfixe du produit, donc il part avec « effacer mon téléphone ».
    vrai(/'mypaddock\.envoi-cloud'/.test(brut), 'le réglage d\'envoi sort du préfixe du produit')
  }),

  doit('18.4 — la page légale dit la vignette, pas « vos photos »', () => {
    /* Ce qui part est une COPIE RÉDUITE à 1600 px en WebP, 200 à 400 Ko.
       L'original — 48 Mpx en HEIC, 3 à 8 Mo — n'est jamais lu en entier : ses
       dimensions se lisent dans son en-tête et le décodage se fait déjà réduit.
       Écrire « tes photos » sur une page de confidentialité laissait imaginer un
       cloud qui avale la pellicule, ce que le produit ne fait pas et ne peut
       techniquement pas faire. */
    const brut = Object.entries(ECRANS).find(([c]) => c.endsWith('/Legal.tsx'))?.[1] ?? ''
    const source = sansCommentaires(brut)
    vrai(/copie réduite/i.test(source), 'la page légale ne dit plus ce qui part vraiment')
    vrai(/1600/.test(source), 'la page légale ne dit plus la taille de ce qui part')
    vrai(!/·\s*tes photos\s*·/.test(source),
      'la page légale annonce « tes photos » : elle promet plus qu\'elle ne prend')
    // Et le VOLUME est chiffré quelque part — c'est ce chiffre qui devrait
    // décider si le cloud reste ouvert, et il n'était écrit nulle part.
    const photos = Object.entries(SOURCES).find(([c]) => c.endsWith('db/photos.ts'))?.[1] ?? ''
    vrai(/300 Ko/.test(photos) && /300 Mo/.test(photos),
      'le volume du stockage n\'est chiffré nulle part : rien ne peut décider')
    // Le levier est la taille et la qualité, jamais la pellicule.
    vrai(/COTE_LONG/.test(photos) && /1200/.test(photos),
      'le levier de poids n\'est plus nommé')
  }),

  doit('le manuel se LIT, et il ne convertit jamais rien en roulages', () => {
    /* ⚠ LE CHAÎNON QUE JULIAN A NOMMÉ : « recherche et import automatique ET
       TRAITEMENT et tout ». La recherche existait — connecteur `web_search`,
       fonction déployée — le PDF était trouvé, vérifié sur ses octets et
       rapatrié dans l'espace privé du pilote. Et personne ne le LISAIT.

       ⚠ ET CE QU'IL EN TIRE NE SE CONVERTIT PAS. Une journée de piste vaut 200 à
       300 km selon le circuit, le groupe et la météo : traduire « 6 000 km » en
       « 24 roulages » serait une INTERPRÉTATION, et FR-44 l'interdit précisément
       là où elle porterait sur la sécurité d'une machine. `intervalle_roulages`
       reste donc NUL, l'horloge compte sans jamais échoir, et le texte du manuel
       est rapporté à la lettre. */
    const brut = MANUEL
    vrai(/lireLeManuel/.test(brut), 'la lecture du manuel a disparu : le PDF redevient un fichier')
    vrai(/document_url/.test(brut), 'le PDF n\'est plus donné au modèle')
    vrai(/createSignedUrl/.test(brut),
      'le PDF est exposé autrement qu\'en URL signée : le bucket privé est ce qui rend la copie défendable')
    vrai(/intervalle_roulages: null/.test(brut),
      'le traitement écrit un intervalle en roulages : il convertit des kilomètres')
    vrai(/barometre: p\.periodicite/.test(brut), 'la périodicité du manuel n\'est plus transcrite')
    // Le modèle reçoit l'interdiction, en toutes lettres, dans sa consigne.
    vrai(/NE CONVERTIS RIEN/.test(brut), 'la consigne ne défend plus la conversion')
    vrai(/N'INVENTE AUCUNE PÉRIODICITÉ/.test(brut), 'la consigne ne défend plus l\'invention')
  }),

  doit('le traitement du manuel n\'écrase jamais le pilote, et ne perd jamais le PDF', () => {
    /* DEUX CLAUSES, ET AUCUNE N'EST DÉCORATIVE.

       ① Un `intervalle_roulages` saisi à la main et un point de départ
         (`depuis_intervention`) sont INTOUCHABLES : le traitement ne fait que
         créer les postes manquants et remplir le barème de ceux qui n'en ont
         pas. Un traitement qui remettrait à zéro l'horloge d'un pilote qui vient
         de changer ses plaquettes serait pire que pas de traitement du tout.

       ② Il arrive APRÈS l'écriture de la ligne `document`, et toute erreur y est
         avalée. Perdre le PDF parce qu'un modèle a répondu de travers serait
         absurde : un manuel bien rapatrié dont la lecture rate reste un manuel
         rapatrié. */
    /* ⚠ `lastIndexOf` ET PAS `indexOf` : le titre « ⑤ LE TRAITEMENT » apparaît
       DEUX fois — une au-dessus de la fonction de lecture, au niveau du module,
       une dans le gestionnaire. La première version prenait la première, donc un
       point du fichier situé AVANT l'écriture de la ligne `document`, et
       accusait le traitement de passer trop tôt alors qu'il passe après. Un
       témoin ancré sur un titre doit dire lequel. */
    const i = MANUEL.lastIndexOf('⑤ LE TRAITEMENT')
    vrai(i > 0, 'le traitement a disparu de la fonction')
    const corps = MANUEL.slice(i)
    // ① il ne met à jour QUE le barème et sa provenance.
    const maj = corps.slice(corps.indexOf('.update({'), corps.indexOf('}).eq('))
    vrai(maj.length > 0, 'la mise à jour d\'une horloge a disparu')
    for (const champ of ['intervalle_roulages', 'depuis_intervention', 'operation'])
      vrai(!new RegExp(champ).test(maj),
        `le traitement réécrit \`${champ}\` : il efface ce que le pilote a posé`)
    vrai(/!existante\.barometre/.test(corps),
      'le traitement réécrit un barème déjà là, sans regarder d\'où il vient')
    // ② il est APRÈS l'insertion du document, et il est enveloppé.
    vrai(corps.indexOf('try {') > 0 && /catch \(e\)/.test(corps),
      'le traitement n\'est plus enveloppé : une lecture ratée ferait perdre le PDF')
    vrai(MANUEL.indexOf("from('document').insert") < i,
      'le traitement passe AVANT l\'écriture de la ligne : un échec perdrait le manuel')
    /* Et il ne réserve pas un second jeton : c'est le même geste. La lecture se
       fait SANS COMMENTAIRES — le commentaire du bloc CITE `reserver_manuel`
       pour dire pourquoi il ne le rappelle pas, et un témoin qui lit le texte
       brut accuse alors la mémoire du défaut au lieu du défaut. C'est le même
       piège que partout ailleurs dans ce banc. */
    vrai((sansCommentaires(corps).match(/reserver_manuel/g) ?? []).length === 0,
      'le traitement réserve une seconde fois : le pilote paie deux fois un seul tap')
  }),

  doit('la colonne du barème existe des deux côtés, et reste du TEXTE', () => {
    /* Le même motif que le YAML de synchronisation et que les catégories : deux
       copies d'une même vérité, dont une prend du retard. Une colonne posée au
       serveur et absente du schéma local ne descendrait jamais ; posée en local
       et absente au serveur, elle ferait refuser la ligne à l'envoi — donc une
       file bloquée, donc toute la saison qui cesse de monter.

       ⚠ ET C'EST DU TEXTE, PAS UN NOMBRE. Un `integer` ici serait la conversion
       elle-même : il n'y a pas de nombre qui dise « tous les 6 000 km ou
       12 mois » sans choisir une unité, et choisir l'unité c'est interpréter. */
    const schema = Object.entries(SOURCES).find(([c]) => c.endsWith('db/schema.ts'))?.[1] ?? ''
    vrai(/barometre: column\.text/.test(sansCommentaires(schema)),
      'le barème a disparu du schéma local, ou n\'est plus du texte')
    const migre = Object.values(MIGRATIONS)
      .some((sql) => /alter table horloge add column if not exists barometre text/i.test(sql))
    vrai(migre, 'aucune migration ne pose le barème au serveur : la ligne serait refusée à l\'envoi')
    // Et la lecture le rend, sinon l'écran ne peut rien afficher.
    const usure = sansCommentaires(
      Object.entries(SOURCES).find(([c]) => c.endsWith('db/usure.ts'))?.[1] ?? '')
    vrai(/barometre: l\.barometre/.test(usure), 'l\'avancement ne porte plus le barème')
    const ecran = sansCommentaires(
      Object.entries(ECRANS).find(([c]) => c.endsWith('/Usure.tsx'))?.[1] ?? '')
    vrai(/a\.barometre/.test(ecran), 'le garage n\'affiche plus ce que le manuel dit')
    // Et l'écran DIT que les deux compteurs ne se parlent pas.
    vrai(/convertit pas/.test(ecran),
      'l\'écran laisse croire que les kilomètres du manuel et les roulages se convertissent')
  }),

  /* ═══ LA FABRIQUE PAR SUJET — « un casque n'est pas une moto » ════════════
     Julian, 1er septembre 2026 : « L'image de chaque casque générée par Gemini
     doit être dans le même angle (trois quart profil) ».

     LE DÉFAUT D'ORIGINE, dans sa forme exacte : la fonction serveur n'avait
     qu'un seul prompt, celui de la MOTO. Une photo de casque partie depuis
     l'écran d'équipement recevait donc « c'est CETTE moto, pas une moto » et
     « L'ANGLE est un PROFIL STRICT » — et l'appel était facturé au prix plein.
     Le rendu n'était pas raté, il était HORS SUJET, et rien dans le produit ne
     pouvait le dire : ni le type, ni le quota, ni le banc.

     Ces essais tiennent les deux moitiés : que les deux prompts DIVERGENT là où
     ils doivent diverger (l'angle, le vocabulaire, le budget), et qu'ils
     restent IDENTIQUES là où la collection l'exige (la grille, le fond, le
     contour, le zéro-lettre). Une seule des deux moitiés se satisferait d'un
     produit cassé : deux prompts identiques passent la seconde, deux prompts
     sans rien de commun passent la première. */

  doit('un casque et une moto ne reçoivent JAMAIS le même dessin', () => {
    const casque = TENUE.prompt('casque'), combinaison = TENUE.prompt('combinaison')
    vrai(casque.length > 500 && combinaison.length > 500, 'un prompt de tenue est vide')
    /* ⚠ LA COMPARAISON DE SORTIES, ET PAS UNE LECTURE DE SOURCE. Une table de
       fiches dont les deux clés pointeraient le même objet — un copier-coller
       d'une ligne, exactement le genre de faute qu'on ne relit pas — traverse
       n'importe quelle garde de texte et se voit ici, immédiatement. */
    vrai(casque !== combinaison,
      'le casque et la combinaison partent avec le MÊME texte : une pièce sur deux sera hors sujet')

    // Le témoin sait reconnaître la consigne de la moto : sans cette ligne, les
    // deux gardes du dessous ne prouveraient rien d'autre qu'une faute de frappe.
    vrai(/PROFIL STRICT/.test(SPRITE_MOTO) && /ramènes?[^.]*au profil/i.test(SPRITE_MOTO),
      'v6 ne dit plus « profil strict » : le témoin ne reconnaît plus ce dont la tenue doit différer')

    for (const sujet of ['casque', 'combinaison'] as const) {
      const p = TENUE.prompt(sujet)
      vrai(/TROIS-QUARTS/.test(p), `le prompt du ${sujet} n'impose plus d'angle`)
      /* Un casque de profil est un ovale sans écran ni mentonnière, une
         combinaison de profil est une manche devant une jambe. La consigne de la
         moto, recopiée ici, rendrait deux pièces méconnaissables. */
      vrai(!/ramènes?[^.]*au profil/i.test(p),
        `le prompt du ${sujet} ramène le sujet au profil : c'est la consigne de la MOTO`)
      // Et il ne décrit pas une machine. C'est ce vocabulaire-là qui partait sur
      // un casque au temps du prompt unique, et il se lit à l'œil nu.
      for (const mot of ['jante', 'carénage', 'échappement', 'guidon', 'roues'])
        vrai(!new RegExp(mot, 'i').test(p),
          `le prompt du ${sujet} parle de « ${mot} » : c'est une moto qu'on décrit`)
    }
    // Chacun nomme SA pièce en toutes lettres, et jamais celle de l'autre.
    vrai(casque.includes('CASQUE intégral') && !casque.includes('COMBINAISON de moto'),
      'le prompt du casque ne nomme pas exactement la pièce à dessiner')
    vrai(combinaison.includes('COMBINAISON de moto') && !combinaison.includes('CASQUE intégral'),
      'le prompt de la combinaison ne nomme pas exactement la pièce à dessiner')
  }),

  doit('l\'angle de la tenue est une MESURE, pas un adjectif', () => {
    /* ⚠ « TROIS-QUARTS » TOUT SEUL EST UN ADJECTIF, et un adjectif se
       réinterprète à chaque photo. Ce que la demande exige n'est pas un bel
       angle, c'est LE MÊME angle d'une pièce à l'autre : deux casques rendus
       sous deux angles ne se comparent plus, on croit voir deux formes
       différentes là où seule la déco change. Un seuil chiffré se vérifie sur le
       rendu ; un adjectif ne se vérifie pas du tout. */
    for (const sujet of ['casque', 'combinaison'] as const) {
      const p = TENUE.prompt(sujet)
      vrai(/DEUX TESTS/.test(p), `le prompt du ${sujet} n'offre plus rien à vérifier sur le rendu`)
      vrai((p.match(/\d+\s*%/g) ?? []).length >= 2, `le prompt du ${sujet} ne chiffre plus son cadrage`)
      /* Les deux bords, nommés : un seuil qui ne dit que « trop » ne dit pas de
         quel côté corriger, et se corrige donc une fois sur deux à l'envers.
         ⚠ `\s+` ET PAS UNE ESPACE : le prompt est un gabarit REPLIÉ à la main,
         et « tu es trop \n DE PROFIL » traverse une coupe de ligne. Une garde
         qui exige l'espace unique éprouve la mise en page du fichier, pas la
         consigne — et rougirait au premier reformatage. */
      vrai(/trop\s+DE\s+FACE/.test(p) && /trop\s+DE\s+PROFIL/.test(p),
        `le prompt du ${sujet} ne dit plus de quel côté il a dérapé`)
    }
  }),

  doit('un casque et une moto ont EXACTEMENT le même carré de pixel', () => {
    /* ⚠ CE N'EST PAS DE LA PARESSE, C'EST UNE CONTRAINTE DE COLLECTION. Les
       trois portraits se posent sur la MÊME scène, côte à côte. 1024 / 128 = 8 :
       le carré logique fait 8 px des deux côtés. Une grille plus fine pour la
       tenue rendrait le casque « mieux dessiné » que la machine — et c'est
       précisément ce qui casse une collection, sans qu'aucun des deux sprites
       soit raté. */
    const grilleMoto = Number(SPRITE_MOTO.match(/export const GRILLE = (\d+)/)?.[1])
    vrai(grilleMoto > 0, 'la grille de la moto est introuvable dans v6.ts')
    egal(TENUE.GRILLE, grilleMoto, 'la tenue et la moto ne se dessinent plus sur la même grille')
    egal(TENUE.entreePx % TENUE.GRILLE, 0,
      'la grille ne divise plus l\'image : le carré logique cesse d\'être un carré')
    // Et le prompt ANNONCE la grille qu'il renvoie. C'est tout l'objet du
    // voyage de `grille` avec l'image : spritifier sur une autre grille que
    // celle demandée au modèle rend une bouillie que rien ne signale.
    for (const sujet of ['casque', 'combinaison'] as const)
      vrai(TENUE.prompt(sujet).includes(`${TENUE.GRILLE} × ${TENUE.GRILLE}`),
        `le prompt du ${sujet} annonce une grille différente de celle qu'il renvoie`)
  }),

  doit('la tenue ne porte AUCUNE lettre, et se détache comme la moto', () => {
    /* Le zéro-lettre est plus dur ici que sur la machine : un casque porte la
       marque au front, celle de l'écran sur la platine, l'homologation sur la
       jugulaire, et le modèle SAIT lire ces marques. Le fond et le contour, eux,
       doivent rester ceux de v6 — c'est le programme qui détache le vert, et
       c'est la scène de l'application qui reçoit les trois sprites. */
    for (const sujet of ['casque', 'combinaison'] as const) {
      const p = TENUE.prompt(sujet)
      vrai(/AUCUNE lettre de l'alphabet/.test(p), `le prompt du ${sujet} a perdu le zéro-lettre`)
      vrai(/homologation/.test(p), `le prompt du ${sujet} n'écarte plus l'étiquette d'homologation`)
      for (const teinte of ['#00E000', '#1A0A2E']) {
        vrai(p.includes(teinte), `le prompt du ${sujet} a perdu ${teinte}`)
        vrai(SPRITE_MOTO.includes(teinte),
          `v6 n'emploie plus ${teinte} : les trois sprites cessent de se détacher pareil`)
      }
    }
  }),

  doit('un sujet inconnu est refusé AVANT la moindre dépense', () => {
    /* ⚠ SE REPLIER SUR UN DÉFAUT SERAIT PIRE QUE REFUSER : le serveur
       dessinerait une moto à la place d'une combinaison, et l'appel serait
       facturé. Le refus part donc avant `reserver_generation` — donc sans
       consommer de créneau de quota — et a fortiori avant le premier octet
       envoyé au modèle. L'ordre dans le fichier EST l'invariant. */
    const refus = SPRITE_SERVEUR.indexOf("refus: 'sujet_inconnu'")
    const reserve = SPRITE_SERVEUR.indexOf("rpc('reserver_generation'")
    const modele = SPRITE_SERVEUR.indexOf('generativelanguage.googleapis.com')
    vrai(refus > 0, 'le serveur ne refuse plus un sujet inconnu : il dessinerait une moto à la place')
    vrai(reserve > 0 && modele > 0, 'la réservation ou l\'appel au modèle est introuvable')
    vrai(refus < reserve,
      'le refus passe APRÈS la réservation : un créneau de quota est brûlé pour rien')
    vrai(refus < modele, 'le refus passe après l\'appel au modèle : la génération est facturée')
    // Et c'est une demande refusée, pas une panne : le client doit pouvoir le dire.
    vrai(/,\s*400\)/.test(SPRITE_SERVEUR.slice(refus, SPRITE_SERVEUR.indexOf('\n', refus))),
      'le refus d\'un sujet inconnu ne rend pas 400 : le pilote lirait une panne de serveur')

    const liste = SPRITE_SERVEUR.match(/const SUJETS = \[([^\]]*)\]/)?.[1] ?? ''
    egal([...liste.matchAll(/'(\w+)'/g)].map((m) => m[1]).sort(),
      ['casque', 'combinaison', 'machine'], 'les sujets connus du serveur')
    /* ⚠ ET UN CORPS SANS `sujet` RESTE UNE MOTO. Ce n'est pas de la complaisance :
       une version déjà installée sur le téléphone d'un pilote envoie un corps
       sans ce champ, et n'envoie que des motos. Sans ce défaut, le redéploiement
       refuserait tous les clients déjà déployés. */
    vrai(/charge\.sujet \?\? 'machine'/.test(SPRITE_SERVEUR),
      'le défaut « machine » a disparu : le redéploiement casse les clients déjà installés')
  }),

  doit('la grille qui redescend est celle du module qui a vraiment dessiné', () => {
    /* La grille voyage AVEC l'image parce que c'est elle qui interdit à la
       spritification de travailler sur une autre grille que le prompt. Prendre
       la grille d'un module et la consigne de l'autre remettrait ce trou-là en
       place, cette fois sans qu'aucune constante ne soit fausse. */
    for (const module of ['moto', 'tenue'])
      vrai(new RegExp(`import \\* as ${module} from`).test(SPRITE_SERVEUR),
        `la fonction n'importe plus le module « ${module} »`)
    for (const champ of ['GRILLE', 'entreePx', 'version', 'modele'])
      vrai(new RegExp(`fabrique\\.${champ}\\b`).test(SPRITE_SERVEUR),
        `la réponse renvoie \`${champ}\` d'un module fixe : on peut spritifier sur une grille que le modèle n'a jamais reçue`)
    vrai(/\bsujet,/.test(SPRITE_SERVEUR),
      'la réponse ne dit plus quel sujet a été dessiné : le pilote ne sait pas ce qu\'il a payé')
  }),

  doit('le client NOMME ce qu\'il fait dessiner, il n\'envoie plus un identifiant nu', () => {
    /* ⚠ LE `string` NU VALAIT « machine », ET C'ÉTAIT LA SEULE PORTE QUI DÉPENSE.
       `genererPortrait(db, uneCleDEquipement, photo)` compilait sans un mot et
       facturait un prompt de moto sur un casque. Un raccourci d'appel qui laisse
       ouverte la porte de la dépense ne vaut pas les deux appelants qu'il
       épargne. Le TYPE porte désormais l'obligation : `{ equipementId }` seul ne
       type plus, et c'est `tsc -b` qui le dit, pas cet essai. */
    const brut = fichierDe(SOURCES, 'pixel/portrait.ts')
    vrai(brut.length > 0, 'portrait.ts introuvable')
    const source = sansCommentaires(brut)
    vrai(/equipementId: string; genre: GenreDeTenue/.test(source),
      'un équipement peut repartir sans genre : le serveur lui dessinerait une moto')
    vrai(!/sujet: Sujet \| string/.test(source),
      '`genererPortrait` accepte de nouveau une chaîne nue : elle vaut « machine » et facture un prompt de moto sur un casque')
    vrai(/JSON\.stringify\(\{[^}]*\bsujet:/.test(source), 'le corps POST ne porte plus le sujet')
    // Et le refus du serveur a une phrase : un motif brut à l'écran n'est pas
    // une phrase, et celui-ci parle d'argent.
    vrai(/sujet_inconnu:/.test(brut), 'le refus « sujet_inconnu » n\'a aucune phrase pour le pilote')

    // Les deux seuls appelants nomment leur sujet, chacun le sien.
    const garage = sansCommentaires(fichierDe(ECRANS, '/Garage.tsx'))
    vrai(garage.length > 0, 'Garage.tsx introuvable')
    vrai(/genererPortrait\(db, \{ machineId:/.test(garage),
      'le garage envoie de nouveau un identifiant nu : le serveur ne sait plus si c\'est une moto')
    const budget = sansCommentaires(fichierDe(ECRANS, '/Budget.tsx'))
    vrai(budget.length > 0, 'Budget.tsx introuvable')
    vrai(/genererPortrait\(db, \{ equipementId: [^,]+, genre \}/.test(budget),
      'l\'inventaire fabrique un portrait d\'équipement sans dire ce qu\'est la pièce')
  }),

  doit('une pièce sans genre ne fait partir AUCUNE génération payante', () => {
    /* `equipement.genre` est NULLABLE et le restera : une glacière n'est ni un
       casque ni une combinaison (migration 20260901000001). Une pièce sans genre
       existe donc pour de bon, et deviner « casque » parce que la catégorie vaut
       'protection' appliquerait à une combinaison une consigne d'écran et de
       mentonnière — 0,16 € pour un rendu inutilisable, et rien pour le dire. */
    const source = sansCommentaires(fichierDe(ECRANS, '/Budget.tsx'))
    vrai(source.length > 0, 'Budget.tsx introuvable')
    const refus = source.indexOf('if (!genre)')
    const appel = source.indexOf('await genererPortrait(')
    vrai(refus > 0, 'la fabrique dessine de nouveau une pièce dont personne n\'a dit ce qu\'elle est')
    vrai(appel > refus, 'le refus arrive APRÈS l\'appel : le portrait est payé avant qu\'on y renonce')
    const message = source.slice(refus, appel)
    vrai(/casque/.test(message) && /combinaison/.test(message),
      'le refus ne dit pas ce qui manque à la pièce')
    vrai(/décompté|prélevé/.test(message),
      'le refus ne dit pas que rien n\'a été prélevé : le pilote croira avoir payé')
    /* ⚠ ET IL NE DÉSIGNE AUCUN GESTE. Il serait naturel d'écrire « déclare-le
       ici » — sauf que RIEN n'écrit `equipement.genre` aujourd'hui, dans aucun
       écran. Désigner un geste qui n'existe pas est la promesse contradictoire
       que ce produit a déjà payée une fois (Refaire.tsx) : le message dit ce qui
       manque et ce qui n'a pas été prélevé, rien de plus. */
    vrai(!/bouton|ci-dessous|ci-dessus|touche/i.test(message),
      'le refus désigne un geste : si ce geste n\'existe pas, la phrase promet ce qu\'elle ne tient pas')
  }),

  /* ═══ LA TENUE DU JOUR — moto, casque, combinaison ════════════════════════
     « on peut lier à la journée de roule 1) la moto quand il y en a plusieurs,
       2) le casque 3) la combi », puis « faire des genre de skin comme un jeux
     vidéo ». — Julian, 1er septembre 2026. */

  doit('la tenue se déclare la veille ET se corrige le soir', () => {
    /* ⚠ LA PORTE QUI SE SERAIT REFERMÉE EN SILENCE, une septième fois. On
       déclare sa tenue sur l'écran de préparation ; à la PREMIÈRE trace saisie,
       `sePrepare` bascule et cet écran-là cède la place au bilan. Montée dans le
       seul `<Journee>`, la tenue devenait INDÉCLARABLE et INCORRIGIBLE le soir
       même — or c'est en relisant sa journée qu'on se souvient de noter sa
       combinaison. C'est mot pour mot la classe de défaut des six chemins de
       17.2, et elle ne se rouvre qu'en composant le nœud UNE FOIS dans App.tsx.
       Un second `<Tenue>` monté dans l'écran de préparation aurait divergé du
       premier à la première correction. */
    const app = sansCommentaires(fichierDe(ECRANS, '/App.tsx'))
    const journee = sansCommentaires(fichierDe(ECRANS, '/Journee.tsx'))
    vrai(app.length > 0 && journee.length > 0, 'App.tsx ou Journee.tsx introuvable')
    egal((app.match(/<Tenue\b/g) ?? []).length, 1,
      'montages de <Tenue> dans App.tsx — deux nœuds divergeront à la première correction')
    egal((app.match(/tenue=\{gestesDeLaJournee\.tenue\}/g) ?? []).length, 2,
      'écrans qui reçoivent la tenue — il en faut DEUX : la préparation et le bilan')
    vrai(/\{\s*tenue\s*\}/.test(journee), 'l\'écran de préparation ne rend plus la tenue')
    vrai(!journee.includes('<Tenue'),
      '<Tenue> est monté une seconde fois dans Journee.tsx au lieu d\'être reçu')

    /* ⚠ ET LA LECTURE PREND TOUT LE TEMPS, y compris ce qui n'a pas eu lieu. La
       tenue se déclare AVANT de partir, sur une journée future : filtrée par
       `A_EU_LIEU`, elle serait invisible exactement au moment où elle sert
       (récit 17.1). C'est le seul endroit du produit où `TOUTES_JOURNEES` est
       une exigence et non une tolérance. */
    const sql = gabaritsSql()
      .find((q) => q.fichier.endsWith('db/equipement.ts') && /r\.casque_id/.test(q.sql))?.sql ?? ''
    vrai(sql.length > 0, 'la lecture de la tenue a disparu de db/equipement.ts')
    vrai(/FROM roulage r \$\{TOUTES_JOURNEES\}/.test(sql),
      'la tenue ne se prononce plus sur le futur, ou le fait trop loin de son `FROM roulage`')
    vrai(!/A_EU_LIEU/.test(sql),
      'la tenue ne se lit que sur les journées passées : on ne peut plus la déclarer la veille')
  }),

  doit('aucun compteur, aucune complétude, aucun palier sur la tenue', () => {
    /* ⚠ LA TENTATION EST PLUS FORTE ICI QU'AILLEURS, et c'est pour ça que la
       garde existe : trois places alignées appellent un compteur, « 2 sur 3 »
       s'écrit tout seul. Une pièce non déclarée n'est pas une case vide à
       remplir — c'est une pièce dont le pilote n'a rien dit, et le produit ne
       relance JAMAIS personne pour compléter un carnet (AD-2, FR-31).

       ⚠ ON LIT SANS LES COMMENTAIRES. Le composant ET la feuille de style CITENT
       « 2 sur 3 » et « tenue complète » pour dire qu'ils les refusent : un témoin
       qui lit le texte brut accuse la mémoire du défaut au lieu du défaut. C'est
       le même piège que partout ailleurs dans ce banc. */
    const app = sansCommentaires(fichierDe(ECRANS, '/App.tsx'))
    const debut = app.indexOf('function PieceDeLaTenue')
    vrai(debut > 0, 'le bloc de la tenue a disparu d\'App.tsx')
    const bloc = app.slice(debut)
    vrai(!/\b\d+\s*(?:sur|\/)\s*\d+\b/.test(bloc),
      'la tenue affiche un compte sur un total : une journée devient un objectif à moitié rempli')
    const INTERDITS = ['complèt', 'complet', 'palier', 'badge', 'score', 'jauge', 'pastille',
      'progress', 'manque', 'barre']
    for (const mot of INTERDITS)
      vrai(!new RegExp(mot, 'i').test(bloc), `la tenue porte « ${mot} » : elle s'est mise à juger`)

    /* La feuille tient l'autre moitié : un compteur peut très bien n'exister
       QUE dans le dessin — une place teintée selon qu'elle est remplie dit « il
       en manque une » sans écrire un seul mot, et la couleur seule ne porte
       jamais le sens dans ce produit (UX-DR8). Le motif chiffré n'est pas
       appliqué ici : `aspect-ratio: 1 / 1` est un rapport de cadre, pas un
       score. */
    const style = FEUILLE.replace(/\/\*[\s\S]*?\*\//g, ' ')
    const i = style.indexOf('.tenue {')
    vrai(i > 0, 'le bloc `.tenue` a disparu de la feuille')
    const dessin = style.slice(i, style.indexOf('.garage .chiffres', i))
    vrai(dessin.length > 0, 'le bloc `.tenue` ne se referme plus avant le garage')
    for (const mot of INTERDITS)
      vrai(!new RegExp(mot, 'i').test(dessin), `la feuille dessine « ${mot} » sur la tenue`)
    // Et aucune couleur de verdict : ce sont les jetons du mieux, du plus lent,
    // du record et de l'alerte — ils disent tous « c'est bien » ou « c'est mal ».
    for (const jeton of ['--mieux', '--plus-lent', '--record', '--alerte'])
      vrai(!dessin.includes(jeton),
        `la tenue emprunte ${jeton} : une place se met à valoir mieux qu'une autre`)
  }),

  doit('retirer une pièce n\'efface pas les journées où elle a été portée', () => {
    /* ⚠ VENDRE SON CASQUE NE DOIT PAS EFFACER SES JOURNÉES. `on delete set null`
       et jamais `cascade` : la journée a eu lieu, elle reste — la même règle que
       la photo de chute, pour la même raison. Une correction ou une vente ne
       coûte jamais un fait déjà consigné. */
    const migration = Object.entries(MIGRATIONS)
      .find(([c]) => c.includes('la_tenue_du_jour_se_declare'))?.[1] ?? ''
    vrai(migration.length > 0, 'la migration de la tenue est introuvable')
    for (const colonne of ['casque_id', 'combinaison_id'])
      vrai(new RegExp(`${colonne} uuid[\\s\\S]{0,120}?on delete set null`, 'i').test(migration),
        `roulage.${colonne} ne se détache plus en douceur : vendre la pièce effacerait les journées`)
    vrai(!/on delete cascade/i.test(migration),
      'la tenue emporte la journée avec elle : une vente détruirait un fait consigné')

    /* ⚠ ET LE LIEN SURVIT AU GENRE. La jointure résout la pièce par son
       IDENTIFIANT et rien d'autre : si elle vérifiait `genre = 'casque'`,
       corriger ou retirer le genre d'une pièce effacerait de l'écran toutes les
       journées où elle a été portée. Le genre décide de ce qu'on PROPOSE, jamais
       de ce qui a eu lieu. */
    const sql = gabaritsSql()
      .find((q) => q.fichier.endsWith('db/equipement.ts') && /r\.casque_id/.test(q.sql))?.sql ?? ''
    vrai(sql.length > 0, 'la lecture de la tenue a disparu de db/equipement.ts')
    for (const colonne of ['casque_id', 'combinaison_id'])
      vrai(new RegExp(`LEFT JOIN equipement \\w+ ON \\w+\\.id = r\\.${colonne}`).test(sql),
        `la tenue ne résout plus ${colonne} par son seul identifiant`)
    vrai(!/genre/i.test(sql),
      'la tenue portée se filtre sur le genre : corriger le genre d\'une pièce effacerait ses journées')
  }),

  doit('le lien de tenue est FACULTATIF, et rien ne le pose d\'office', () => {
    /* ⚠ LA DIFFÉRENCE AVEC LA MACHINE, ET ELLE EST ENTIÈRE. `creerRoulage` lie
       d'office la moto unique du garage : la question n'a alors qu'une réponse
       possible, et le formulaire perdrait l'information sans le dire. Un casque
       lié d'office, lui, affirmerait un FAIT que personne n'a déclaré — « j'ai
       porté celui-ci ce jour-là ». Une journée sans tenue n'est pas une tenue
       absente : c'est une tenue dont on n'a rien dit (AD-2). */
    const migration = Object.entries(MIGRATIONS)
      .find(([c]) => c.includes('la_tenue_du_jour_se_declare'))?.[1] ?? ''
    vrai(migration.length > 0, 'la migration de la tenue est introuvable')
    for (const colonne of ['casque_id', 'combinaison_id']) {
      /* ⚠ ON LIT LA SEULE INSTRUCTION QUI POSE LA COLONNE. Chercher « not null »
         dans toute la migration accuse à tort : l'index partiel s'écrit
         `where casque_id is not null`, et c'est exactement le contraire d'une
         contrainte — il ne range que les journées qui ONT déclaré une pièce. */
      const ajout = migration.match(new RegExp(`add column if not exists ${colonne}[^;]*`, 'i'))?.[0] ?? ''
      vrai(ajout.length > 0, `roulage.${colonne} n'est plus posée par la migration`)
      vrai(!/not null/i.test(ajout),
        `roulage.${colonne} est devenue obligatoire : une journée sans tenue déclarée serait refusée`)
    }

    const depot = sansCommentaires(fichierDe(SOURCES, 'db/depot.ts'))
    vrai(depot.length > 0, 'depot.ts introuvable')
    const creation = depot.slice(depot.indexOf('INSERT INTO roulage'),
      depot.indexOf('INSERT INTO roulage') + 400)
    for (const colonne of ['casque_id', 'combinaison_id'])
      vrai(!creation.includes(colonne),
        `la création d'une journée écrit ${colonne} : elle affirme une tenue que personne n'a déclarée`)

    /* ⚠ ET LE MÊME TAP DÉLIE. `equipementId` à nul est un appel PLEIN, pas un cas
       d'erreur : sans lui, le sélecteur est une porte à sens unique et il ne
       reste que la suppression de la journée pour corriger un casque déclaré par
       erreur. C'est exactement le défaut qu'a payé `modifierRoulage`. */
    vrai(/equipementId: string \| null/.test(depot),
      'poser une pièce de tenue n\'accepte plus le nul : le sélecteur devient une porte à sens unique')
    const app = sansCommentaires(fichierDe(ECRANS, '/App.tsx'))
    vrai(/portee\?\.id === p\.id \? null : p\.id/.test(app),
      'taper la pièce active ne la retire plus : la déclaration devient irréversible')
  }),

  doit('poser une pièce n\'écrit QUE sa colonne, et son nom ne vient pas de l\'appelant', () => {
    /* Une interpolation dans une requête est la faute par défaut de ce fichier —
       sauf quand elle ne peut porter que deux valeurs écrites ici même.
       `COLONNE_DE_TENUE` a exactement deux clés, `genre` est une union de deux
       littéraux : le compilateur refuse la troisième, et rien de ce que
       l'appelant fournit n'atteint le SQL. */
    const brut = fichierDe(SOURCES, 'db/depot.ts')
    vrai(brut.length > 0, 'depot.ts introuvable')
    const source = sansCommentaires(brut)
    const table = source.match(/COLONNE_DE_TENUE = \{([^}]*)\}/)?.[1] ?? ''
    vrai(table.length > 0, 'la table fermée des colonnes de tenue a disparu')
    egal([...table.matchAll(/(\w+):\s*'(\w+)'/g)].map((m) => `${m[1]}=${m[2]}`),
      ['casque=casque_id', 'combinaison=combinaison_id'],
      'la table des colonnes de tenue ne dit plus exactement ce qu\'elle doit dire')
    vrai(/as const/.test(source.slice(source.indexOf('COLONNE_DE_TENUE'),
      source.indexOf('COLONNE_DE_TENUE') + 160)),
      'la table des colonnes n\'est plus figée : un troisième nom de colonne devient interpolable')

    /* ⚠ ET L'ÉCRITURE NE TOUCHE QU'UNE COLONNE. Poser une combinaison qui
       effacerait le casque, ou la moto de la journée, serait une perte que rien
       ne rattrape et que rien n'annonce. */
    const requete = source.match(/UPDATE roulage SET [^`]*/)?.[0] ?? ''
    vrai(requete.length > 0, 'l\'écriture de la tenue a disparu')
    // On ne compte QUE ce qui est posé — entre `SET` et `WHERE`. Compter les
    // `=` de la requête entière en trouverait deux dès le premier jour, celui
    // du `WHERE id = ?`, et la garde se satisferait alors de n'importe quoi.
    const pose = requete.slice(requete.indexOf('SET') + 3, requete.indexOf('WHERE'))
    egal((pose.match(/=/g) ?? []).length, 1,
      'l\'écriture de la tenue pose plus d\'une valeur : elle emporte une autre colonne de la journée')
    egal((pose.match(/,/g) ?? []).length, 0,
      'l\'écriture de la tenue enchaîne plusieurs colonnes dans un seul geste')
    for (const colonne of ['machine_id', 'date_jour', 'etat', 'crash_statut'])
      vrai(!requete.includes(colonne),
        `poser une pièce de tenue réécrit ${colonne} : un geste en touche un autre`)
    // Et c'est une saisie, pas un réglage : le témoin de sauvegarde le sait.
    const corps = source.slice(source.indexOf('poserPieceDeTenue'))
    vrai(/marquerSaisie\(db\)/.test(corps.slice(0, 600)),
      'déclarer sa tenue ne marque plus la journée comme saisie')
  }),

  doit('deux absences, deux phrases — et jamais la photo à la place du sprite', () => {
    /* ⚠ ELLES NE DISENT PAS LA MÊME CHOSE, et les confondre dans un même cadre
       gris ferait croire à un lien manquant là où il y en a un : « rien de
       déclaré » (aucune pièce liée) et « pas de portrait pixel » (la pièce est
       là, son portrait n'existe pas). Le mot porte le sens, la couleur ne le
       porte jamais seule (UX-DR8) — même règle que la silhouette du garage. */
    const app = sansCommentaires(fichierDe(ECRANS, '/App.tsx'))
    const debut = app.indexOf('function PieceDeLaTenue')
    vrai(debut > 0, 'le bloc de la tenue a disparu d\'App.tsx')
    const bloc = app.slice(debut)
    vrai(bloc.includes('rien de déclaré'), 'l\'absence de lien ne se dit plus')
    vrai(bloc.includes('pas de portrait pixel'), 'l\'absence de portrait ne se dit plus')
    vrai(!/rien de déclaré[\s\S]{0,40}rien de déclaré/.test(bloc),
      'les deux absences se sont confondues en une seule phrase')
    // Le mot de la place est rendu même sur une place vide : sans lui, un cadre
    // hachuré ne se distingue pas d'une image qui n'a pas chargé.
    vrai(/<b>\{place\}<\/b>/.test(bloc), 'une place vide ne dit plus de quoi elle parle')

    /* ⚠ ET PAS DE REPLI SUR LA PHOTO RÉELLE, contrairement au garage
       (sprite → photo → silhouette). Les trois pièces doivent se lire comme UNE
       image : une photo de casque à côté de deux sprites ne compose plus rien,
       elle se lit comme un montage raté. La photo garde sa place sur la fiche de
       la pièce, là où le portrait se fabrique à partir d'elle. */
    for (const repli of ['photoEquipement', 'photoUrl', 'TRACE_EQUIPEMENT'])
      vrai(!bloc.includes(repli),
        `la tenue retombe sur ${repli} : les trois places cessent de composer une image`)
  }),

  doit('la tenue se tait tant qu\'elle ne sait pas, et n\'existe pas quand il n\'y a rien à dire', () => {
    /* ⚠ TROIS SILENCES DISTINCTS, et chacun a coûté quelque part dans ce produit.

       ① « Je ne sais pas encore » ≠ « il n'y a rien ». Annoncer « rien de
         déclaré » le temps d'une requête écrirait un fait faux à chaque
         ouverture — récit 17.2, sur l'écran dont tout le propos est de n'énoncer
         que ce qu'il sait.
       ② Le bloc parle de la TENUE, et la moto seule n'en est pas une. Sans cette
         sortie, le pilote qui ne tient pas son équipement verrait à chaque
         journée un portrait de moto qu'il a déjà au garage, sous un titre qui
         lui rappelle ce qu'il n'a pas saisi : une relance déguisée (AD-2).
       ③ Le sélecteur d'un genre disparaît à zéro pièce — il proposerait sinon
         une liste vide, c'est-à-dire une question sans réponse possible. */
    const app = sansCommentaires(fichierDe(ECRANS, '/App.tsx'))
    const bloc = app.slice(app.indexOf('function PieceDeLaTenue'))
    vrai(bloc.length > 0, 'le bloc de la tenue a disparu d\'App.tsx')

    const tait = bloc.indexOf('if (!tenue) return null')
    const vide = bloc.indexOf('if (sansTenue) return null')
    const rendu = bloc.indexOf('<section className="bloc tenue">')
    vrai(tait > 0, 'la tenue affirme quelque chose avant que la base ait répondu')
    vrai(vide > tait, 'la sortie du bloc vide passe avant celle de l\'ignorance, ou a disparu')
    vrai(rendu > vide, 'le bloc se rend avant d\'avoir décidé qu\'il a quelque chose à dire')
    // ② se lit sur sa condition : ni pièce portée, ni pièce à choisir — la moto
    //   n'y entre pas, sinon le bloc existerait sur toutes les journées.
    vrai(/sansTenue = !tenue\.casque && !tenue\.combinaison/.test(bloc),
      'la moto suffit à faire exister le bloc : il devient une relance sur toutes les journées')
    vrai(!/sansTenue[^\n]*tenue\.machine/.test(bloc),
      'la moto est entrée dans la condition d\'existence du bloc')
    // ③ un seul casque suffit à ouvrir le choix — la plupart des pilotes n'en
    //   ont qu'un, et un seuil à deux le rendrait indéclarable pour eux.
    vrai(/if \(pieces\.length === 0\) return null/.test(bloc),
      'le sélecteur exige plus d\'une pièce, ou s\'affiche sur une liste vide')
  }),

  /* ═══ LE BANC ET LE TÉLÉVERSEMENT — deux défauts qu'aucun écran ne montre ══ */

  doit('le banc entier démarre ailleurs que sur le poste de Julian', () => {
    /* ⚠ CE DÉFAUT NE FAIT ROUGIR PERSONNE, IL EMPÊCHE DE DÉMARRER. Trente
       fumées clouaient `/Applications/Google Chrome.app/…` : sur le poste de
       travail tout marche, et c'est là qu'on les écrit. Ailleurs — un conteneur
       d'intégration, une revue à distance — la seule façon de lancer le banc est
       de modifier les fichiers, et une modification locale finit par partir dans
       un commit.

       La garde part de `BOUT_EN_BOUT`, la liste que le lanceur exécute vraiment :
       une fumée ajoutée demain sans échappatoire y est nommée le jour même. */
    const lanceur = BANC['../essais.mjs'] ?? ''
    vrai(lanceur.length > 0, 'banc-rendu/essais.mjs introuvable')
    const i = lanceur.indexOf('const BOUT_EN_BOUT')
    vrai(i > 0, 'la liste des essais de bout en bout a disparu du lanceur')
    const noms = [...lanceur.slice(i, lanceur.indexOf(']', i)).matchAll(/'([\w-]+)'/g)]
      .map((m) => m[1])
    vrai(noms.length >= 25, `seulement ${noms.length} fumées lues : la lecture du lanceur est cassée`)

    const DEFAUT = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    /* `photo-essai.mjs` EXPORTE l'échappatoire, et `planches.mjs` l'importe déjà
       plutôt que de la réécrire. Les deux formes sont donc légitimes, et la
       garde doit accepter les deux : sinon elle interdirait la seule
       factorisation raisonnable de ces trente lignes identiques. */
    const empruntee = (src: string) =>
      /import \{[^}]*\bCHROME\b[^}]*\} from '\.\/photo-essai\.mjs'/.test(src)
    // `unite` et `photo-essai` ne sont pas dans la liste — ils sont lancés à
    // part par le même script — et ils ouvrent Chrome comme les autres.
    for (const nom of [...noms, 'unite', 'photo-essai']) {
      const src = BANC[`../${nom}.mjs`] ?? ''
      vrai(src.length > 0, `banc-rendu/${nom}.mjs est lancé par le banc et n'existe pas`)
      // ① Aucun chemin de Chrome écrit en dur. C'est le défaut lui-même.
      egal([...src.matchAll(/executablePath:\s*'[^']*'/g)].map((m) => m[0]), [],
        `${nom}.mjs cloue le chemin de Chrome : le banc redevient macOS-only sans que rien ne le dise`)
      /* ② Tout lancement DÉCLARE son chemin. La garde du dessus se satisferait
         d'un second `chromium.launch()` nu, ajouté plus tard — il prendrait
         alors le Chromium de Playwright, que ce dépôt n'installe pas, et
         l'échec ressemblerait à une panne de banc. */
      egal((src.match(/chromium\.launch\(/g) ?? []).length,
        (src.match(/executablePath/g) ?? []).length,
        `${nom}.mjs : lancements de Chrome vs chemins déclarés`)
      // ③ L'échappatoire existe, en propre ou empruntée.
      vrai(/process\.env\.CHROME/.test(src) || empruntee(src),
        `${nom}.mjs n'a plus d'échappatoire : poser CHROME= ne l'atteint plus`)
      /* ④ ET LE DÉFAUT MACOS NE BOUGE PAS. `CHROME` est une échappatoire, pas un
         déménagement : le poste de travail reste le cas nominal, et personne n'a
         à poser une variable pour lancer le banc chez soi. */
      vrai(src.includes(DEFAUT) || empruntee(src),
        `${nom}.mjs a perdu le défaut macOS : le poste de travail cesse d'être le cas nominal`)
    }
  }),

  doit('rien de ce que git cache ne monte chez l\'hébergeur', () => {
    /* ⚠ `graft/` PARTAIT EN PRODUCTION : 5,4 Mo, dont 4,5 Mo de `graft/.cache/`
       où dorment les prompts en texte brut. Il n'apparaissait NULLE PART — pas
       dans `git status`, puisque `.gitignore` le cache ; pas dans une revue de
       diff, puisqu'il n'est pas versionné — et rien ne l'aurait signalé avant le
       jour du téléversement depuis un poste.

       La règle est mécanique et elle vaut pour la classe entière : ce fichier-ci
       REMPLACE `.gitignore` chez Vercel au lieu de s'y ajouter, donc tout ce que
       git cache doit y être redit. C'est l'essai qui aurait attrapé `graft/`
       avant ce lot, et qui attrapera le suivant. */
    vrai(VERCELIGNORE.length > 0 && GITIGNORE.length > 0,
      'un des deux fichiers d\'exclusion ne se lit plus : le témoin est muet')
    const lignes = (f: string) => f.split('\n')
      .map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean)
    // On compare des CHEMINS, pas des lignes : `/graft/`, `graft/` et
    // `graft/.cache/` désignent le même endroit sous trois écritures.
    const net = (l: string) => l.replace(/^\//, '').replace(/\/\*$/, '').replace(/\/$/, '')
    const chezVercel = lignes(VERCELIGNORE).filter((l) => !l.startsWith('!')).map(net)
    const oublies = lignes(GITIGNORE).filter((l) => !l.startsWith('!')).map(net)
      .filter((g) => !chezVercel.some((v) => g === v || g.startsWith(`${v}/`)))
    egal(oublies, [],
      'chemins que git cache et que Vercel téléverserait quand même')

    /* ⚠ ET LA CLAUSE DES SECRETS NE PEUT PAS DISPARAÎTRE D'UN REVERT DISTRAIT.
       C'est la raison d'être du fichier : `.env` et `.env.local` n'étaient
       protégés QUE par `.gitignore`, et le jour où l'on déploie depuis un poste
       ils monteraient avec le reste — MISTRAL_API_KEY, POWERSYNC_TOKEN, le mot
       de passe Postgres. Le témoin ci-dessus ne les verrait pas partir : il
       compare les DEUX fichiers, et un secret retiré des deux passe. */
    for (const clause of ['.env', '.env.*', '!.env.example'])
      vrai(lignes(VERCELIGNORE).includes(clause),
        `.vercelignore a perdu « ${clause} » : les secrets remonteraient au premier déploiement depuis un poste`)
  }),

  /* ═══════════════════════════════════════════════════════════════════════════
     L'ANALYSE — le cinquième onglet, onze croisements derrière trois rangées.

     ⚠ CES ESSAIS NE VÉRIFIENT PAS QUE L'ÉCRAN S'AFFICHE. La fumée le fait, et
     elle l'a fait. Ils tiennent les REFUS — c'est-à-dire les seules choses qu'un
     écran qui marche ne signale jamais. Un chrono moyenné par mois rend un
     nombre parfaitement plausible ; une jauge ressemble trait pour trait à une
     composition ; un verbe figé au singulier se relit trois fois sans se voir.
     Aucun de ces trois défauts ne fait rougir quoi que ce soit : ils rendent un
     écran, simplement le mauvais.

     ⚠ ET LA TABLE DES CROISEMENTS S'IMPORTE, ELLE NE SE LIT PAS. Ses phrases
     sont des FONCTIONS de la période : lire leur gabarit dans le fichier
     prouverait qu'un mot est écrit quelque part, jamais qu'il sort. On les fait
     donc RENDRE, pour les trois périodes qu'un pilote peut avoir.
     ═══════════════════════════════════════════════════════════════════════ */

  doit('l\'analyse — un chrono ne s\'agrège jamais sans son circuit', () => {
    /* « 1'38 à Pau-Arnos » et « 1'38 à Nogaro » ne se comparent pas. Un chrono
       agrégé par mois, par année ou par moto n'est pas une information
       imprécise : c'est une information FAUSSE, et fausse en flattant — le
       pilote y lit une progression qu'aucun tour ne porte, sur le seul chiffre
       du produit auquel il tient vraiment.

       La table est le seul endroit d'où un tel croisement peut naître, puisque
       c'est elle qui porte la forme. C'est donc elle qu'on interroge, et pas
       l'écran : un écran se corrige, une table mal remplie se recopie. */
    vrai(CROISEMENTS.length > 0, 'la table des croisements est vide : le témoin est muet')
    for (const c of CROISEMENTS) {
      if (c.forme === 'chrono')
        egal(c.axe, 'circuit',
          `un chrono se lit « par ${c.mot} » : deux circuits différents tombent dans le même temps`)
      if (c.axe !== 'circuit')
        vrai(c.forme !== 'chrono',
          `« ${NOM_DOMAINE[c.domaine]} · ${c.mot} » agrège des temps au tour hors de leur circuit`)
      /* ⚠ ET LA TROISIÈME UNITÉ N'EXISTE PAS. Deux valeurs seulement — de
         l'argent, un décompte — et le chrono n'est ni l'une ni l'autre : le
         croisement du circuit compte des JOURNÉES chronométrées, jamais un
         temps. Une unité « chrono » dans cette table serait la porte par
         laquelle un temps entrerait dans une barre mesurée depuis zéro. */
      vrai(c.unite === 'euros' || c.unite === 'decompte',
        `« ${c.mot} » porte une troisième unité : un temps au tour peut y entrer`)
      // L'argent ne vit que dans FINANCE. Un décompte de gestes passé au
      // formateur d'euros afficherait « 0,03 € » pour trois interventions.
      egal(c.unite === 'euros', c.domaine === 'finance',
        `« ${NOM_DOMAINE[c.domaine]} · ${c.mot} » : l'unité ne suit plus son domaine`)
    }
    egal(CROISEMENTS.filter((c) => c.forme === 'chrono').length, 1,
      'le chrono a gagné ou perdu un croisement : le seul qui tienne est le circuit')
    // Et la couche de lecture ne sait pas écrire un temps. Rien n'y appelle le
    // formateur du chrono : ce qui en porte un le rend à `Courbe`, tel quel.
    const an = sansCommentaires(fichierDe(SOURCES, 'db/analyse.ts'))
    vrai(an.length > 0, 'src/db/analyse.ts ne se lit plus : le témoin est muet')
    vrai(!/formaterChrono/.test(an),
      'la lecture de l\'analyse écrit un temps au tour : elle en a donc agrégé un')
  }),

  doit('l\'analyse — la suite ne reçoit jamais un chrono, et les deux planchers restent opposés', () => {
    /* LES DEUX TRACÉS VIVENT DANS LE MÊME FICHIER POUR QU'ON LISE LES DEUX
       RAISONS AVANT D'Y TOUCHER, et leurs conventions sont EXACTEMENT inverses :
         · `Courbe` porte des CHRONOS — axe INVERSÉ, plancher au meilleur temps
           MESURÉ. Zéro seconde au tour n'existe pas, et caler sur zéro écraserait
           quinze roulages dans trois pixels de haut.
         · `Suite` porte de l'ARGENT et des DÉCOMPTES — axe NORMAL, plancher à
           ZÉRO. Faire partir la suite de son minimum ferait d'un mois à 180 € et
           d'un mois à 200 € deux mois que tout sépare.

       Deux conventions opposées à trente lignes l'une de l'autre appellent
       l'harmonisation, et c'est exactement le geste qu'il ne faut PAS faire : la
       première courbe MONTAIT à mesure que le pilote progressait, juste au-dessus
       d'une phrase disant l'inverse. Ce défaut-là a déjà été payé une fois. */
    const brut = fichierDe(ECRANS, '/Courbe.tsx')
    vrai(brut.length > 0, 'src/ecrans/Courbe.tsx a disparu : le témoin est muet')
    const coupe = brut.indexOf('export function Suite')
    vrai(coupe > 0,
      'la suite a quitté Courbe.tsx : elle a donc un fichier à elle, donc un <svg> de plus')
    const courbe = sansCommentaires(brut.slice(0, coupe))
    const suite = sansCommentaires(brut.slice(coupe))

    const yCourbe = courbe.match(/const y = [^\n]*/)
    const ySuite = suite.match(/const y = [^\n]*/)
    vrai(!!yCourbe && !!ySuite, 'un des deux tracés n\'a plus d\'axe vertical : le témoin est muet')
    vrai(yCourbe![0] !== ySuite![0],
      'les deux tracés ont pris le même axe : l\'un des deux ment sur sa propre légende')
    // Le plancher de la courbe est le MINIMUM MESURÉ : elle part de ce que le
    // pilote a réellement tourné.
    vrai(/\(v - min\)/.test(yCourbe![0]),
      'la courbe du chrono ne part plus du meilleur temps mesuré : quinze roulages tiennent dans trois pixels')
    // Le plancher de la suite est ZÉRO : aucune soustraction, aucun minimum.
    vrai(/\(v \/ sommet\)/.test(ySuite![0]),
      'la suite ne part plus de zéro : deux mois presque égaux deviennent deux mois que tout sépare')
    vrai(!/Math\.min|\bmin\b/.test(suite),
      'la suite s\'est calée sur son minimum : elle exagère chaque écart sous une légende qui dit encore zéro')
    // Et son sommet est le PLUS GROS DE CE QU'ELLE MONTRE, comme aux barres :
    // une suite mesurée contre un plafond est un compteur à rebours.
    vrai(/Math\.max\(\.\.\.lignes\.map/.test(suite),
      'l\'échelle de la suite ne vient plus de ce qu\'elle montre : le tracé est devenu une jauge')

    /* ⚠ ET LA SUITE NE FORMATE RIEN, DONC NE PEUT RIEN FORMATER DE TRAVERS. Elle
       reçoit le texte déjà écrit par la couche qui connaît l'unité. Un appel au
       formateur du chrono ici serait la preuve qu'un temps y est entré — et un
       temps dans la suite MONTERAIT à mesure que le pilote progresse, sous une
       légende disant l'inverse. */
    vrai(!/formaterChrono/.test(suite),
      'la suite écrit un temps au tour : le tracé monte quand le pilote progresse')
    vrai(!/record/.test(suite),
      'la suite allume le violet du record : il n\'existe aucun record d\'argent ni de décompte')
    vrai(!/--alerte|--plus-lent/.test(suite),
      'la suite porte le rouge de l\'alerte ou le jaune du dépassement : un mois y devient une faute')

    /* ⚠ DES SEGMENTS DROITS, ET RIEN D'AUTRE. Relier n'invente qu'un intervalle
       qu'on n'a pas mesuré ; LISSER invente des valeurs entre les pas ; une
       DROITE DE TENDANCE invente au-delà du dernier. La levée du 1er septembre
       porte sur RELIER, jamais sur PROLONGER — et une `<polyline>` ne sait faire
       que des segments droits, là où un `<path>` ouvre les courbes de Bézier. */
    vrai(/<polyline/.test(suite),
      'la suite ne relie plus ses pas par des segments droits')
    vrai(!/<path\b|curve|smooth|bezier|catmull/i.test(suite),
      'la suite lisse son tracé : elle passe par des valeurs que personne n\'a mesurées')
    for (const mot of ['tendance', 'projection', 'à ce rythme', 'prévision', 'moyenne'])
      vrai(!new RegExp(mot, 'i').test(suite),
        `la suite porte « ${mot} » : elle prolonge au-delà de ce que le pilote a vécu`)

    /* ⚠ ET AUCUN ÉCRAN NE LUI PASSE UN CHRONO. C'est l'essai NÉGATIF, sur tous
       les `.tsx` du produit : la garde ne vaut que si personne, nulle part, ne
       monte la suite sur des temps au tour. */
    let montages = 0
    for (const [chemin, source] of Object.entries(ECRANS)) {
      const nom = chemin.replace(/^.*\/src\//, 'src/')
      /* La balise OUVRANTE, et elle seule — jusqu'au premier `>` qui ne ferme pas
         une flèche. Une lecture qui attendrait le `/>` ne trouverait rien du tout
         le jour où la suite prend des enfants : elle passerait au vert en ne
         regardant plus rien, ce qui est la façon la plus discrète de perdre un
         essai. */
      for (const m of sansCommentaires(source).matchAll(/<Suite\b(?:=>|[^>])*>/g)) {
        montages++
        vrai(!/hrono|ourbe|\bms\b/.test(m[0]),
          `${nom} monte la suite sur un chrono : « 1'38 à Pau-Arnos » et « 1'38 à Nogaro » s'y comparent`)
      }
    }
    vrai(montages >= 1,
      'plus personne ne monte la suite : la garde du chrono ne regarde plus rien')
    // Et le chrono garde SA courbe, une par circuit — jamais un tracé de tous.
    const ecran = sansCommentaires(fichierDe(ECRANS, '/Analyse.tsx'))
    vrai(ecran.length > 0, 'l\'écran d\'analyse a disparu : le témoin est muet')
    vrai(/chronos\.map\([^\n]*<Courbe/.test(ecran),
      'les chronos ne passent plus par la courbe : ils sont partis dans un autre tracé')
  }),

  doit('l\'analyse — les barres n\'acceptent aucune échelle venue du dehors', () => {
    /* CE N'EST PAS UNE JAUGE, ET LA DIFFÉRENCE TIENT DANS UNE SEULE LIGNE :
       l'échelle est LE PLUS GROS DE CE QU'ON MONTRE, calculé DEDANS. Une barre
       mesurée contre un maximum reçu du dehors est un compteur à rebours — elle
       dit « il te reste » — et « dépasser son budget n'est pas une faute ».

       ⚠ LA GARDE PORTE SUR LE TYPE, ET C'EST LÀ QU'ELLE MORD. Rien dans un champ
       nommé `sommet` ne distinguerait « le plus gros de l'autre moto » d'un
       plafond à ne pas dépasser, et le second EST la jauge. Le sommet se calcule
       dedans, ou il n'existe pas. */
    const brut = fichierDe(ECRANS, '/Barres.tsx')
    vrai(brut.length > 0, 'src/ecrans/Barres.tsx a disparu : le témoin est muet')
    const source = sansCommentaires(brut)

    const props = source.match(/export function Barres\(\{([^}]*)\}/)
    vrai(!!props, 'la signature des barres ne se lit plus : le témoin est muet')
    egal(props![1].split(',').map((s) => s.trim()).filter(Boolean),
      ['titre', 'barres', 'description'],
      'les barres ont pris un quatrième réglage : c\'est par là qu\'un plafond entre')

    const type = brut.slice(brut.indexOf('export type Barre'), brut.indexOf('export function Barres'))
    vrai(type.length > 0, 'le type d\'une barre ne se lit plus : le témoin est muet')
    /* ⚠ `cle` A ÉTÉ AJOUTÉ APRÈS COUP, ET CE TÉMOIN A FAIT SON TRAVAIL en
       refusant l'ajout jusqu'à ce qu'il soit décidé. Il est ici parce que `nom`
       N'EST PAS UNIQUE — `LigneAnalyse` le dit noir sur blanc — et que deux
       motos du même modèle produisaient deux barres réconciliées sur la même
       clé React. Il ne peut loger ni sommet ni cible : c'est une chaîne
       d'identité, jamais un nombre. Tout champ NUMÉRIQUE ajouté ici doit être
       regardé de très près, car c'est par là qu'un plafond entrerait. */
    egal([...type.matchAll(/^ {2}(\w+)\??:/gm)].map((m) => m[1]),
      ['nom', 'centimes', 'libelle', 'detail', 'incertain', 'cle'],
      'les champs d\'une barre ont bougé : vérifier qu\'aucun ne peut loger une cible')

    const sommet = source.match(/const sommet = [^\n]*/)
    vrai(!!sommet, 'les barres n\'ont plus d\'échelle : le témoin est muet')
    vrai(/Math\.max\(\.\.\.barres\.map/.test(sommet![0]),
      'l\'échelle des barres ne vient plus de ce qu\'elles montrent : le tracé est devenu une jauge')

    /* ⚠ ET LA VALEUR NE SE DEVINE PAS. Ce fichier est né du budget, où tout est
       en euros ; l'analyse lui envoie aussi des décomptes, et trois gestes
       d'atelier s'y affichaient « 0,03 € », avec l'aplomb d'un montant. Un tracé
       ne peut pas savoir si `3` est un décompte ou trois centimes : il devine, et
       il devine faux une fois sur deux. */
    vrai(/b\.libelle \?\? formaterEuros\(b\.centimes\)/.test(source),
      'les barres reformatent la valeur : trois gestes d\'atelier s\'affichent « 0,03 € »')
    const ecran = sansCommentaires(fichierDe(ECRANS, '/Analyse.tsx'))
    vrai(/\{ \.\.\.l, centimes: l\.valeur \}/.test(ecran),
      'l\'écran d\'analyse recompose la barre champ par champ : le libellé déjà écrit se perd en route')

    /* AUCUN MOT DE PLAFOND DANS CE QUI SE REND, ET AUCUN CHAMP OÙ EN LOGER UN
       DANS CE QUI ARRIVE. Le type est la seule garantie durable : un mot se
       retire, un champ se remplit. */
    for (const mot of ['plafond', 'cible', 'objectif', 'maximum', 'quota', 'reste'])
      vrai(!new RegExp(`\\b${mot}`, 'i').test(source),
        `les barres portent « ${mot} » : la composition est devenue un compte à rebours`)
    const an = sansCommentaires(fichierDe(SOURCES, 'db/analyse.ts'))
    const ligne = an.slice(an.indexOf('export type LigneAnalyse'), an.indexOf('export type Croisement'))
    vrai(ligne.length > 0, 'le type d\'une ligne d\'analyse ne se lit plus : le témoin est muet')
    /* ⚠ `detail` A ÉTÉ AJOUTÉ LE 1er SEPTEMBRE 2026, ET CETTE LISTE A ROUGI —
       c'est son travail. Il porte la composition d'un mois (« engagement ·
       pneus »), la seconde moitié du récit 19.2 que le budget rendait avant que
       le tracé parte à l'analyse. Il est admis parce qu'il ne peut loger aucun
       des trois interdits : la boucle de mots juste au-dessus relit TOUTE la
       source de l'écran, plafond compris, et `argentParMois` est le seul à le
       remplir — avec des noms de postes, jamais un nombre. */
    egal([...ligne.matchAll(/^ {2}(\w+)\??:/gm)].map((m) => m[1]),
      ['cle', 'nom', 'valeur', 'libelle', 'n', 'detail', 'incertain'],
      'une ligne d\'analyse a gagné un champ : vérifier qu\'aucun ne loge un plafond, un rang ni un écart')
  }),

  doit('l\'analyse — sous trois points une suite se rend en barres, et c\'est la table qui le décide', () => {
    /* DEUX POINTS NE FONT PAS UNE LIGNE : ils font TOUJOURS une droite, donc
       toujours une progression ou toujours une chute, et le pilote y lit un
       mouvement qui n'existe pas. La différence avec la courbe est ce qui se
       passe ensuite — la courbe n'affiche RIEN sous le seuil, parce qu'un chrono
       isolé ne dit rien ; deux mois de dépenses, eux, disent quelque chose de
       parfaitement vrai, simplement pas un mouvement. Ils se rendent donc en
       BARRES, qui n'affirment aucun sens de lecture entre elles. */
    egal(formeRendue('suite', POINTS_MINIMUM), 'suite',
      'une suite refuse de se tracer au seuil : le pilote perd un tracé qu\'il a rempli')
    egal(formeRendue('suite', POINTS_MINIMUM - 1), 'composition',
      'deux pas se relient en ligne : le pilote y lit une progression que rien ne porte')
    egal(formeRendue('suite', 0), 'composition', 'une suite vide se trace encore')
    egal(formeRendue('composition', 1), 'composition', 'une composition a changé de forme toute seule')
    // Le chrono ne bascule JAMAIS : `courbeDuCircuit` tient déjà son propre
    // seuil, et un temps au tour n'a rien à faire dans une barre mesurée depuis
    // zéro.
    for (const n of [0, 1, 2, 3, 40])
      egal(formeRendue('chrono', n), 'chrono',
        `un chrono à ${n} points se rend en barres : un temps s'y mesurerait depuis zéro`)
    // La décision est IDEMPOTENTE, pour qu'un écran qui se méfie ne puisse pas se
    // tromper en la reposant sur ce qu'il rend vraiment.
    egal(formeRendue(formeRendue('suite', 2), 2), 'composition',
      'reposer la décision sur ce qui est rendu change la forme : l\'écran et la table divergent')

    /* ⚠ ET AUCUN ÉCRAN NE REDÉCLARE LE SEUIL. L'écran rend à `formeRendue` le
       compte final, il n'écrit pas sa propre règle : deux seuils à deux endroits
       sont deux seuils qui divergent, et l'écran est celui des deux qu'on relit
       le moins. */
    const ecran = sansCommentaires(fichierDe(ECRANS, '/Analyse.tsx'))
    vrai(ecran.length > 0, 'l\'écran d\'analyse a disparu : le témoin est muet')
    vrai(/formeRendue\(/.test(ecran), 'l\'écran d\'analyse a cessé de demander sa forme à la table')
    vrai(!/POINTS_MINIMUM/.test(ecran),
      'l\'écran d\'analyse tient un seuil à lui : il divergera de celui de la table')
    /* ET IL N'OFFRE PAS LA FORME AU DOIGT. Une troisième molette « barres ou
       courbe » laisserait relier huit postes qui n'ont aucun ordre entre eux. */
    for (const mot of ['barres ou', 'type de tracé', 'changer de forme'])
      vrai(!new RegExp(mot, 'i').test(ecran),
        `l'écran d'analyse offre « ${mot} » au doigt : huit postes sans ordre peuvent être reliés`)
  }),

  doit('l\'analyse — les mois se comblent entre deux mois vécus, jamais au-delà', () => {
    /* ⚠ L'AXE DES ABSCISSES EST LE TEMPS, ET C'EST CE QUI RETOURNE LA RÈGLE DES
       LISTES. `grouperParMois` refuse les mois vides, et il a raison : douze
       lignes dont neuf à zéro font une grille de cases à remplir. Sur une SUITE,
       avril, juin et septembre tracés côte à côte à intervalle égal font un
       dessin où mai, juillet et août n'ont jamais existé — et la pente entre deux
       pas ment sur la durée qui les sépare.

       Un zéro inséré ENTRE deux mois vécus est une MESURE. Un zéro ajouté APRÈS
       le dernier serait une PRÉDICTION, et le produit n'en fait aucune. */
    const l = (cle: string, valeur: number, n = 1): LigneAnalyse =>
      ({ cle, nom: cle, valeur, libelle: `${valeur}`, n })
    const ZERO = '0,00 €'

    const comble = comblerLesMois([l('2026-07', 300), l('2026-04', 100)], ZERO)
    egal(comble.map((x) => x.cle), ['2026-04', '2026-05', '2026-06', '2026-07'],
      'les mois sans dépense ont disparu de la suite : la pente ment sur le temps qui sépare deux pas')
    for (const x of comble.slice(1, 3)) {
      egal(x.valeur, 0, 'un mois comblé porte une valeur que personne n\'a saisie')
      egal(x.n, 0, 'un mois comblé prétend porter des faits')
      egal(x.libelle, ZERO, 'un mois comblé n\'écrit pas sa valeur dans l\'unité du tracé')
      egal(x.nom, nomMois(x.cle), 'un mois comblé porte sa clé au lieu de son nom')
      vrai(!x.incertain, 'un mois comblé se marque incertain : c\'est une mesure, pas un trou')
    }
    // Le passage d'année se fait par le CALENDRIER, jamais par une addition sur
    // le douzième mois.
    egal(comblerLesMois([l('2026-11', 10), l('2027-02', 20)], ZERO).map((x) => x.cle),
      ['2026-11', '2026-12', '2027-01', '2027-02'],
      'le comblage saute le passage d\'année : décembre et janvier disparaissent du tracé')
    // JAMAIS AVANT, JAMAIS APRÈS : rien ne se comble jusqu'à décembre, parce que
    // ce serait annoncer qu'il ne se passera rien en novembre.
    egal(comblerLesMois([l('2026-05', 10), l('2026-06', 20)], ZERO).map((x) => x.cle),
      ['2026-05', '2026-06'],
      'le comblage déborde de ce qui a été vécu : le tracé prédit les mois à venir')
    egal(comblerLesMois([l('2026-05', 10)], ZERO).map((x) => x.cle), ['2026-05'],
      'un mois seul se comble tout seul : un tracé naît d\'un seul point')

    /* ⚠ LA LIGNE « SANS MOIS » SORT ICI, ET ELLE N'EST PAS PERDUE. Une dépense
       sans date n'a aucune place sur un axe du temps — la poser au bout
       inventerait un treizième mois — et c'est la phrase de complétude qui
       l'énonce, lue sur les lignes BRUTES. */
    const orpheline: LigneAnalyse =
      { cle: '', nom: 'Sans mois', valeur: 5000, libelle: '50,00 €', n: 2, incertain: true }
    egal(comblerLesMois([l('2026-04', 100), l('2026-06', 100), orpheline], ZERO).map((x) => x.cle),
      ['2026-04', '2026-05', '2026-06'],
      'une dépense sans date a été posée sur l\'axe du temps : le tracé invente un treizième mois')

    /* ⚠ ET C'EST POUR ÇA QUE LA FORME SE DÉCIDE SUR LES PAS QUI IRONT VRAIMENT
       SUR L'AXE. Trois lignes brutes — deux mois et une dépense sans date — n'en
       laissent que deux : compter les brutes ferait tracer exactement la droite
       que le seuil existe pour refuser. */
    const places = comblerLesMois([l('2026-04', 1), orpheline], ZERO)
    egal(formeRendue('suite', places.length), 'composition',
      'la forme se décide sur les lignes brutes : un mois plus une orpheline se relient en ligne')

    /* L'ORDRE DES DÉCISIONS VIT DANS LA LECTURE, ET IL EST PIÉGEUX : la
       complétude se lit sur les lignes BRUTES, et le comblage retire justement
       cette ligne-là. Composé dans l'autre sens, il ne resterait rien à énoncer,
       et le trou disparaîtrait en silence. */
    const an = sansCommentaires(fichierDe(SOURCES, 'db/analyse.ts'))
    const lecture = an.slice(an.indexOf('export const lire ='))
    vrai(lecture.indexOf('cequiManque') > 0
      && lecture.indexOf('cequiManque') < lecture.indexOf('comblerLesMois'),
    'ce qui manque se compte après le comblage : le trou disparaît en silence, et c\'est la seule façon de le rater')
  }),

  doit('l\'analyse — ce qui manque se dit, et jamais « 0 »', () => {
    /* FR-55 appliqué tel quel : « le bilan ÉNONCE SA COMPLÉTUDE ». Huit barres
       qui totalisent 1 840 € sur une saison qui en a coûté 2 180 se lisent comme
       un total — et un tracé qui ne dit pas ce qu'il laisse dehors ment sans
       qu'un seul de ses chiffres soit faux.

       ⚠ ET JAMAIS « 0 SANS POSTE ». Un zéro énoncé est un compteur de
       complétude, c'est-à-dire une case à remplir : exactement ce que ce produit
       refuse d'installer dans un carnet qu'on tient par plaisir. */
    const c = croisementDe('finance', 'poste')
    vrai(!!c, 'le croisement de l\'argent par poste a disparu : le témoin est muet')
    const sans = (n: number): LigneAnalyse =>
      ({ cle: '', nom: 'Sans poste', valeur: 0, libelle: '', n, incertain: true })
    const pleine: LigneAnalyse =
      { cle: 'pneus', nom: 'Pneus', valeur: 12000, libelle: '120,00 €', n: 3 }

    egal(cequiManque(c!, [pleine]), null,
      'un tracé complet annonce un trou : le pilote cherche une dépense qu\'il a bien saisie')
    egal(cequiManque(c!, [pleine, sans(0)]), null,
      'le tracé énonce « 0 sans poste » : un zéro annoncé est une case à remplir')
    egal(cequiManque(c!, [pleine, sans(1)]), '1 dépense sans poste.',
      'la phrase de complétude ne s\'accorde pas au singulier')
    egal(cequiManque(c!, [pleine, sans(2)]), '2 dépenses sans poste.',
      'la phrase de complétude ne s\'accorde pas au pluriel')
    // Le grain vient de la table, jamais de l'écran : un décompte de gestes
    // d'atelier ne s'annonce pas dans le mot de l'argent.
    const g = croisementDe('maintenance', 'moto')
    vrai(!!g, 'le croisement des gestes par moto a disparu : le témoin est muet')
    vrai(/geste/.test(cequiManque(g!, [{ ...sans(2), nom: 'Sans moto' }]) ?? ''),
      'ce qui manque à l\'atelier s\'annonce en dépenses : le pilote cherche un montant qui n\'existe pas')
  }),

  doit('l\'analyse — une saison ne se classe pas, et l\'argent d\'une moto ne se compte qu\'une fois', () => {
    const an = sansCommentaires(fichierDe(SOURCES, 'db/analyse.ts'))
    vrai(an.length > 0, 'src/db/analyse.ts ne se lit plus : le témoin est muet')
    const corps = (nom: string) => {
      const i = an.indexOf(`export const ${nom} =`)
      vrai(i > 0, `${nom} a disparu de l'analyse : le témoin est muet`)
      const j = an.indexOf('\nexport ', i + 10)
      return an.slice(i, j < 0 ? an.length : j)
    }

    /* ⚠ LES SAISONS SE RANGENT DANS L'ORDRE DU CALENDRIER, JAMAIS PAR MONTANT.
       Trier par montant ferait « 2025 en tête », c'est-à-dire un verdict sur une
       année de la vie du pilote — une saison n'est ni chère ni bon marché. C'est
       le refus de `grouperParMois` appliqué à l'échelle au-dessus. */
    const annee = corps('argentParAnnee')
    vrai(/ORDER BY saison_annee ASC/.test(annee),
      'les saisons sortent de la base dans un ordre libre : le calendrier n\'est plus garanti')
    vrai(!/parTaille/.test(annee),
      'les saisons sont triées par montant : la plus chère prend la tête, donc devient un verdict')
    const tri = annee.match(/\.sort\(\([\s\S]{0,160}/)
    vrai(!!tri && !/valeur|total|centimes/.test(tri![0]),
      'le rang des saisons se calcule sur un montant : c\'est un classement des années du pilote')

    /* ⚠ LA CLAUSE `depense_id IS NULL` EST OBLIGATOIRE PARTOUT OÙ L'ARGENT DE
       L'ATELIER EST ADDITIONNÉ. Il entre par deux portes — une dépense de cible
       `machine`, ou le montant porté par l'intervention quand aucune dépense n'a
       été saisie (FR-43). Les additionner sans condition compterait DEUX FOIS une
       pièce dont on a fait les deux, et la moto la mieux tenue serait la plus
       chère, deux fois. */
    for (const { fichier, sql } of gabaritsSql()) {
      if (!fichier.endsWith('db/analyse.ts')) continue
      if (!/FROM intervention/.test(sql) || !/cout_centimes/.test(sql)) continue
      vrai(/depense_id IS NULL/.test(sql),
        'une lecture de l\'analyse additionne l\'argent de l\'atelier sans écarter ce qui est déjà compté : la moto la mieux tenue devient la plus chère, deux fois')
      vrai(/etat = 'faite'/.test(sql),
        'une lecture de l\'analyse compte l\'argent d\'un geste que personne n\'a fait')
    }
    vrai(/depense_id IS NULL/.test(corps('argentParMoto')),
      'l\'argent par moto a perdu sa clause : une pièce saisie des deux côtés se compte deux fois')
    vrai(/depense_id IS NULL/.test(corps('argentNonCompte')),
      'la phrase de l\'argent non compté annonce comme manquant un argent déjà tracé : elle exagère son trou, et on cesse de la lire')

    /* ⚠ ET RIEN N'ARRIVE PAR LES ROULAGES (AD-17). Une machine coûte ce qui la
       DÉSIGNE : l'engagement d'une journée est une dépense du pilote, et le
       ranger sous la moto qui a roulé ce jour-là serait une jointure implicite. */
    vrai(!/roulage_id/.test(corps('argentParMoto')),
      'l\'argent par moto ramasse l\'engagement des journées : une machine coûte ce qui la désigne, pas ce qui a roulé')
    // Et l'axe MOTO ne répète pas la phrase de l'argent non compté : il
    // additionne déjà l'atelier, et l'annoncer manquant serait faux.
    const sousCompte = an.match(/const SOUS_COMPTE[^\n]*/)
    vrai(!!sousCompte && !/'moto'/.test(sousCompte![0]),
      'l\'axe moto annonce comme absent un argent qui est déjà dans ses barres')
  }),

  doit('l\'analyse — un seul compte de journées, et c\'est celui du bilan de saison', () => {
    /* ⚠ LE BILAN DE SAISON ANNONCE « 11 ROULAGES » À UN ÉCRAN DE DISTANCE. Une
       analyse qui en annoncerait 12, parce qu'elle a laissé passer une journée
       annoncée pour septembre, ferait douter des deux — et c'est le chiffre, pas
       l'écran, que le pilote cesserait de croire.

       La seule manière de ne pas rejouer « deux comptes qui divergent de 1 à
       trois centimètres d'écart » est qu'il n'existe qu'UN SEUL compte. */
    const an = sansCommentaires(fichierDe(SOURCES, 'db/analyse.ts'))
    vrai(an.length > 0, 'src/db/analyse.ts ne se lit plus : le témoin est muet')
    const journees = gabaritsSql()
      .filter((g) => g.fichier.endsWith('db/analyse.ts') && /\bFROM roulage\b/.test(g.sql))
    egal(journees.length, 1,
      'l\'analyse va chercher les journées à deux endroits : les deux comptes divergeront, et le bilan de saison avec')
    vrai(/A_EU_LIEU\(/.test(journees[0].sql),
      'l\'analyse compte des journées annoncées pour plus tard : elle en annonce une de plus que le bilan de saison')
    // Les trois croisements qui comptent des journées partent tous de cette
    // liste-là, jamais d'une requête chacun.
    for (const nom of ['argentParJournee', 'journeesParMois', 'journeesParMoto']) {
      const i = an.indexOf(`export const ${nom} =`)
      vrai(i > 0, `${nom} a disparu de l'analyse : le témoin est muet`)
      const j = an.indexOf('\nexport ', i + 10)
      vrai(/journeesVecues\(/.test(an.slice(i, j < 0 ? an.length : j)),
        `${nom} s'est écrit son propre compte de journées : il divergera du bilan de saison`)
    }
    /* ⚠ ET LE CINQUIÈME ONGLET SE GARDE AVEC LES LECTURES DE L'ANALYSE, pas avec
       des requêtes écrites pour l'occasion. Un onglet gardé par un compte et
       rempli par un autre finit par s'ouvrir sur un écran vide — le défaut exact
       « lu par un écran, écrit par personne ». */
    const app = sansCommentaires(fichierDe(ECRANS, '/App.tsx'))
    const debut = app.indexOf('const aDeQuoiAnalyser')
    vrai(debut > 0, 'le test du cinquième onglet a disparu : le témoin est muet')
    const porte = app.slice(debut, debut + 500)
    vrai(/journeesVecues\(/.test(porte),
      'l\'onglet d\'analyse compte les journées à sa façon : il finira par s\'ouvrir sur un écran vide')
    vrai(!/db\.getAll|db\.get\(/.test(porte),
      'l\'onglet d\'analyse s\'est écrit ses propres requêtes : le garde et le contenu peuvent diverger')
  }),

  doit('l\'analyse — rien n\'y touche les chutes, et aucun mot de la table ne juge', () => {
    /* ⚠ C'EST UNE CLAUSE DE SÉCURITÉ, PAS DE PUDEUR. « 7 roulages sans chute »
       fabrique une série à ne pas casser, donc une pression à ne pas déclarer la
       huitième — et une chute non déclarée est une chute non réparée. Aucune
       lecture de l'analyse ne touche `chute` ni `crash_statut`, et l'écran non
       plus. */
    for (const fin of ['db/analyse.ts', 'ecrans/Analyse.tsx']) {
      const source = sansCommentaires(fichierDe(SOURCES, fin))
      vrai(source.length > 0, `src/${fin} ne se lit plus : le témoin est muet`)
      vrai(!/chute|crash_statut/i.test(source),
        `src/${fin} lit les chutes : une série « sans chute » fait taire la déclaration suivante`)
    }

    /* ⚠ ET AUCUN MOT DE LA TABLE NE JUGE — mots de puce, phrases de lecture,
       notes. On les fait RENDRE pour zéro, une et plusieurs saisons : lire leur
       gabarit dans le fichier prouverait qu'un mot est écrit, jamais qu'il sort.

       ⚠ LES MOTIFS N'ONT AUCUNE FRONTIÈRE `\b` DEVANT UNE LETTRE ACCENTUÉE :
       `\w` est ASCII en JavaScript, donc `\bécart` ne peut JAMAIS correspondre —
       c'est une garde qu'on croit tenue et qui ne tient pas, et ce dépôt l'a déjà
       payée une fois sur `.tracé-argent`. */
    const dits: string[] = []
    for (const c of CROISEMENTS) {
      dits.push(c.mot, c.note)
      for (const p of [TOUTES_ANNEES, [2026], [2025, 2026]]) dits.push(c.phrase(p))
    }
    const tout = dits.join(' § ')
    for (const mot of ['tendance', 'moyenne', 'projection', 'prévision', 'à ce rythme',
      '\\bobjectif', '\\brecord', 'classement', 'palier', 'pourcentage', '%',
      'écart', '\\bsérie\\b', '\\breste\\b', 'il te reste', 'devrait'])
      vrai(!new RegExp(mot, 'i').test(tout),
        `l'analyse dit « ${mot.replace(/\\b/g, '')} » : le tracé se met à juger une saison du pilote`)

    /* UN MOT PAR PUCE, ET LA PRÉPOSITION VIT DANS LA PHRASE. « par poste » et
       « selon le mois » sur cinq puces débordent la ligne à 375 px, et une rangée
       qui passe à la ligne cesse d'être une rangée. */
    for (const c of CROISEMENTS) {
      vrai(!/\s/.test(c.mot),
        `la puce « ${c.mot} » porte plus d'un mot : la rangée passe à la ligne à 375 px`)
      vrai(c.mot.length <= 10, `la puce « ${c.mot} » est trop longue pour tenir sa rangée`)
      vrai(c.note.trim().length > 0,
        `« ${c.mot} » ne dit pas ce qu'il montre : un lecteur d'écran n'entend qu'une suite de nombres`)
      for (const p of [TOUTES_ANNEES, [2026]])
        vrai(c.phrase(p).trim().endsWith('.'),
          `la lecture de « ${c.mot} » ne se termine pas : ce n'est plus une phrase`)
    }
    // Chaque croisement est UNIQUE, et la table est la seule source de son mot.
    const couples = CROISEMENTS.map((c) => `${c.domaine}·${c.axe}`)
    egal(couples.length, new Set(couples).size,
      'deux croisements portent le même couple : une puce en cache une autre, définitivement')
    for (const c of CROISEMENTS)
      vrai(croisementDe(c.domaine, c.axe) === c,
        `« ${c.mot} » ne se retrouve plus par son couple : la puce ouvre sur un autre tracé`)
  }),

  doit('l\'analyse — le verbe s\'accorde avec le sujet, pour zéro, une et plusieurs saisons', () => {
    /* ⚠ « CE QUE TOUTES TES SAISONS A COÛTÉ » — VU À L'ÉCRAN, INVISIBLE À LA
       RELECTURE. La phrase est correcte au singulier, et c'est le singulier qu'on
       lit en écrivant le code. Le sujet, lui, VARIE : singulier pour une année
       (« ta saison 2026 »), pluriel pour zéro (« toutes tes saisons ») comme pour
       plusieurs. Le verbe était figé à côté d'un sujet qui bouge, et il l'était
       dans les quatre phrases d'argent à la fois.

       ⚠ ET CET ESSAI ÉPROUVE LES PHRASES RENDUES, PAS LA PRÉSENCE D'UNE
       FONCTION. Chercher `saisonAccorde` dans le fichier prouverait qu'on l'a
       écrite ; seul le texte rendu prouve qu'elle est APPELÉE, et c'est le texte
       rendu que le pilote lit au-dessus de son tracé. La garde se règle donc sur
       les périodes qu'un pilote peut avoir : aucune saison choisie, une seule,
       plusieurs. */
    const SUJET = /\b(toutes tes saisons|tes saisons(?:\s\d{4},?)+|ta saison\s\d{4})\s+(\S+)/g
    const SINGULIERS = ['a', 'coûte', 'porte', 'fait', 'dit', 'vaut']
    const PLURIELS = ['ont', 'coûtent', 'portent', 'font', 'disent', 'valent']
    let accords = 0
    for (const c of CROISEMENTS)
      for (const p of [TOUTES_ANNEES, [2026], [2025, 2026], [2024, 2025, 2026]]) {
        const phrase = c.phrase(p)
        for (const m of phrase.matchAll(SUJET)) {
          accords++
          const pluriel = !m[1].startsWith('ta saison')
          vrai(!(pluriel ? SINGULIERS : PLURIELS).includes(m[2]),
            `« ${phrase} » : le titre est faux en français, au-dessus du tracé du pilote`)
        }
      }
    /* ⚠ ET LE TÉMOIN N'EST PAS MUET. Une table qui cesserait de nommer la saison
       ne déclencherait plus aucune vérification, et la garde passerait au vert
       sur des phrases vidées de leur sujet — c'est la façon la plus discrète de
       perdre un essai. Les quatre lectures d'argent la nomment, sur quatre
       périodes. */
    vrai(accords >= 12,
      `seules ${accords} phrases nomment une saison : la garde de l'accord ne regarde plus rien`)
    // Et le sujet lui-même se dit juste : une seule saison n'est pas « toutes ».
    const argent = croisementDe('finance', 'poste')
    vrai(!!argent, 'le croisement de l\'argent par poste a disparu : le témoin est muet')
    vrai(/toutes tes saisons ont/.test(argent!.phrase(TOUTES_ANNEES)),
      'sans choix de saison, le titre du tracé n\'est pas au pluriel')
    vrai(/ta saison 2026 a/.test(argent!.phrase([2026])),
      'sur une seule saison, le titre du tracé n\'est pas au singulier')
    vrai(/tes saisons 2025, 2026 ont/.test(argent!.phrase([2025, 2026])),
      'sur plusieurs saisons, le titre du tracé n\'est pas au pluriel')
  }),

  doit('l\'analyse — cinq onglets, huit caractères, et rien ne se montre à vide', () => {
    /* ⚠ LA LARGEUR N'EST PAS UNE PRÉFÉRENCE, C'EST UNE MESURE. `.onglet` est
       `flex: 1` sans marge ni écart, dans une `.barre` en `left: 0; right: 0` :
       à cinq, chacun fait 75 px sur un écran de 375. Le mot le plus large est
       ROULAGES — 61,6 px à 12 px de corps, plus 11,5 px d'interlettre à .12em,
       soit 73,2 px, et il reste 1,8 px. Un sixième onglet, ou un mot de plus de
       huit caractères, déborde sa case : le pilote lit « ROULAGE », ou tape à
       côté, et rien ne rougit nulle part. */
    const app = fichierDe(ECRANS, '/App.tsx')
    vrai(app.length > 0, 'src/App.tsx ne se lit plus : le témoin est muet')
    const source = sansCommentaires(app)
    const debut = source.indexOf('<nav className="barre">')
    vrai(debut > 0, 'la barre du bas a disparu : le témoin est muet')
    const barre = source.slice(debut, source.indexOf('</nav>', debut))
    /* ⚠ DEUX ONGLETS SONT DEVENUS DES GLYPHES — 2 septembre 2026, « ça fait très
       chargé ». Ce témoin lisait le MOT de chaque onglet et exigeait quatre
       captures : il est passé à trois d'un coup, et il avait raison de rougir —
       une barre qui perd ses mots en silence est exactement ce qu'il garde.
       Ce qu'il vérifie change donc de forme, pas de nature. Le compte total tient
       toujours la largeur ; chaque MOT tient toujours sa case ; et un onglet qui
       n'a plus de mot doit avoir un NOM — un glyphe muet est un bouton qu'on ne
       peut ni annoncer, ni chercher, ni décrire au téléphone. */
    const onglets = (barre.match(/className="onglet"/g) ?? []).length
    vrai(onglets >= 4, `seulement ${onglets} onglets lus : la lecture de la barre est cassée`)
    vrai(onglets <= 5,
      `la barre porte ${onglets} onglets : à six, chaque case tombe sous la largeur de ROULAGES`)
    const mots = [...barre.matchAll(/className="onglet"[\s\S]*?>([^<>{}]+)</g)]
      .map((m) => m[1].trim()).filter((m) => m.length > 0)
    const nommes = [...barre.matchAll(/<Icone[^>]*titre="([^"]+)"/g)].map((m) => m[1])
    vrai(mots.length + nommes.length === onglets,
      `${onglets} onglets, mais ${mots.length} mots et ${nommes.length} glyphes nommés :`
      + ' un onglet ne dit son nom NI en toutes lettres NI dans le titre de son icône')
    /* ⚠ TROIS MOTS AU MINIMUM. Une barre entièrement en pictogrammes se devine
       au lieu de se lire : garage, roulages et analyse sont la MATIÈRE du
       carnet, et un pilote les cherche par leur nom. Seuls le cadre — d'où l'on
       part, où l'on se gère — se rendent sans mot, parce qu'une maison et un
       buste se lisent sans apprentissage. */
    vrai(mots.length >= 3,
      `la barre ne porte plus que ${mots.length} mots : au-delà du cadre, un onglet se devine`)
    for (const m of mots) {
      vrai(m.length <= 8,
        `l'onglet « ${m} » fait ${m.length} caractères : il déborde de sa case à 375 px`)
      vrai(/^[A-ZÀ-Ý]+$/.test(m),
        `l'onglet « ${m} » n'est pas en capitales : deux casses à trois centimètres se lisent comme deux natures de bouton`)
    }
    egal(mots.length, new Set(mots).size, 'deux onglets portent le même mot')
    // Et la mesure tient dans la feuille : des cases égales, sans écart.
    const regle = FEUILLE.slice(FEUILLE.indexOf('.onglet {'), FEUILLE.indexOf('.onglet {') + 260)
    vrai(regle.length > 0, 'la règle des onglets a disparu de la feuille')
    vrai(/flex: 1/.test(regle),
      'les onglets ne se partagent plus la largeur à égalité : le calcul des 75 px ne vaut plus')
    const nav = FEUILLE.slice(FEUILLE.indexOf('.barre {'), FEUILLE.indexOf('.barre {') + 260)
    vrai(!/gap:/.test(nav),
      'la barre du bas a pris un écart entre ses onglets : ROULAGES perd les 1,8 px qui lui restaient')

    /* ⚠ UN ONGLET APPARAÎT QUAND IL A QUELQUE CHOSE À MONTRER — UX-DR9. Et le
       MÊME test décide de l'onglet ET de l'écran : ce qui n'a pas d'onglet n'a
       pas d'écran, sinon le pilote atterrit sur un blanc entre les deux barres,
       et un écran blanc se lit comme un plantage. */
    vrai((source.match(/analysable\(porte\)/g) ?? []).length >= 2,
      'l\'onglet d\'analyse et son écran ne se gardent plus au même test : l\'un des deux s\'ouvre sur du blanc')
    const analysable = source.match(/const analysable = [\s\S]*?\n\n/)
    vrai(!!analysable && !/p\.moto/.test(analysable![0]),
      'le test de l\'onglet lit une condition qui ne peut jamais décider seule : on croit la lire')

    /* ⚠ ET UN ÉCRAN NE MONTRE JAMAIS CE QU'IL N'A PAS. Les rangées se
       recomposent : un domaine sans matière n'apparaît pas, un axe non plus.
       Aucun gris, aucun « bientôt », aucun croisement mort — un écran vide
       signale l'abandon dans ce produit (FR-14). */
    const ecran = sansCommentaires(fichierDe(ECRANS, '/Analyse.tsx'))
    vrai(ecran.length > 0, 'l\'écran d\'analyse a disparu : le témoin est muet')
    for (const mot of ['disabled', 'bientôt', 'à venir', 'aucune donnée', 'pas encore de'])
      vrai(!new RegExp(mot, 'i').test(ecran),
        `l'écran d'analyse porte « ${mot} » : il dessine le squelette de ce que le pilote n'a pas`)
    vrai(/if \(!lu \|\| !annees \|\| !trace \|\| !forme\) return null/.test(ecran),
      'l\'écran d\'analyse se monte sans matière : un cadre en attente, puis rien')
    // Une rangée qui n'offre pas de choix n'est pas une rangée : elle disparaît,
    // exactement comme les années du bilan de saison.
    for (const rangee of ['domaines', 'duDomaine', 'annees'])
      vrai(new RegExp(`${rangee}\\.length > 1 &&`).test(ecran),
        `la rangée « ${rangee} » s'affiche à une seule puce : un bouton toujours actif qui ne fait rien`)

    /* Et les domaines gardent l'ordre de la table. Les trier par ce qu'ils
       contiennent ferait bouger la première puce d'une ouverture à l'autre, et le
       pilote réapprendrait la rangée à chaque fois. */
    const faux: Trace[] = CROISEMENTS.map((c) => ({
      croisement: c, forme: c.forme, lignes: [], manque: null, nonCompte: null,
    }))
    const domaines: Domaine[] = domainesDe(faux)
    egal(domaines, [...new Set(CROISEMENTS.map((c) => c.domaine))],
      'les domaines ne sortent plus dans l\'ordre de la table : la première puce bouge d\'une ouverture à l\'autre')
    /* ⚠ ET LES DEUX FILTRES RETIRENT SANS RÉORDONNER. C'est la moitié que la
       comparaison ci-dessus ne peut pas voir : un tri ajouté APRÈS le dédoublage
       rendrait exactement la même chose sur une table complète, et ne se verrait
       que le jour où un domaine se vide — c'est-à-dire chez le pilote qui vient
       de commencer, et chez lui seulement. */
    const an = sansCommentaires(fichierDe(SOURCES, 'db/analyse.ts'))
    for (const nom of ['domainesDe', 'tracesDuDomaine']) {
      const i = an.indexOf(`export const ${nom} =`)
      vrai(i > 0, `${nom} a disparu de l'analyse : le témoin est muet`)
      vrai(!/\.sort\(/.test(an.slice(i, i + 300)),
        `${nom} trie ce qu'il filtre : les puces changent de place d'une ouverture à l'autre`)
    }
    for (const d of domaines) {
      egal(tracesDuDomaine(faux, d).map((t) => t.croisement.axe),
        CROISEMENTS.filter((c) => c.domaine === d).map((c) => c.axe),
        `les axes de ${NOM_DOMAINE[d]} ne sortent plus dans l'ordre de la table`)
      vrai(/^[A-ZÀ-Ý]+$/.test(NOM_DOMAINE[d]),
        `le domaine ${NOM_DOMAINE[d]} n'est plus en capitales comme les onglets`)
    }
    /* ⚠ ET AUCUNE COULEUR NE RANGE. `--alerte` ne sert QU'À CE QUI DÉTRUIT :
       « un rouge qui sert à deux choses ne sert plus à rien ». Un domaine, une
       puce ou une note en rouge se lirait comme un avertissement sur un mois qui
       n'en est pas un — et la seule variation de teinte autorisée est
       l'atténuation de ce que le produit ne sait pas ranger. */
    vrai(!/--alerte|--plus-lent|--record/.test(ecran),
      'l\'écran d\'analyse emprunte le rouge de l\'alerte ou le violet du record : une couleur s\'est mise à ranger')
    /* On lit CHAQUE règle dont le sélecteur nomme l'analyse, et pas une tranche
       de fichier : une tranche s'arrête où la feuille s'arrête aujourd'hui, et la
       prochaine règle ajoutée en dessous tomberait hors du témoin sans que
       personne ne le voie. */
    let regles = 0
    for (const m of FEUILLE.replace(/\/\*[\s\S]*?\*\//g, ' ')
      .matchAll(/([^{}]*analyse[^{}]*)\{([^{}]*)\}/gi)) {
      regles++
      vrai(!/--alerte|--plus-lent/.test(m[2]),
        `« ${m[1].trim()} » peint l'analyse en rouge : le rouge cesse de ne signifier qu'une destruction`)
    }
    vrai(regles > 0, 'l\'habillage de l\'analyse a disparu de la feuille : le témoin est muet')

    /* « TOUTES LES SAISONS » EST LE TABLEAU VIDE, la seule valeur qui ne se
       confonde avec aucune année — et l'axe ANNÉE n'existe que sous elle. */
    egal(TOUTES_ANNEES.length, 0,
      '« toutes les saisons » est devenu une liste d\'années : on ne distingue plus « toutes » de « les deux cochées »')
  }),

  doit('l\'analyse — les circuits se regroupent à plat, et l\'analyse ne les regroupe pas elle-même', () => {
    /* `circuit_nom` est du TEXTE LIBRE — il n'existe aucun identifiant de circuit
       côté client. « Pau-Arnos » tapé un soir puis « pau arnos » le suivant
       faisaient DEUX circuits, chacun sous le seuil de trois points, donc AUCUNE
       courbe : le pilote qui roulait le plus voyait le moins. */
    egal(aplati('Pau-Arnos'), aplati('pau arnos'),
      'deux façons d\'écrire le même circuit font deux tracés : chacun sous le seuil, donc aucun')
    egal(aplati('Pau-Arnos'), aplati('PAU  ARNOS'),
      'la casse et les espaces séparent encore un circuit de lui-même')

    /* ⚠ ET LE REGROUPEMENT NE SE REFAIT PAS ICI. `circuitsAvecCourbe` et
       `courbeDuCircuit` le portent déjà : un second rapprochement écrit dans
       l'analyse serait un second endroit où « Pau-Arnos » et « pau arnos »
       peuvent se séparer à nouveau, et il divergerait au premier accent. */
    const an = sansCommentaires(fichierDe(SOURCES, 'db/analyse.ts'))
    vrai(an.length > 0, 'src/db/analyse.ts ne se lit plus : le témoin est muet')
    vrai(/circuitsAvecCourbe\(/.test(an) && /courbeDuCircuit\(/.test(an),
      'l\'analyse est allée chercher les chronos ailleurs que dans les courbes qui existent')
    /* ⚠ ET ELLE NE TOUCHE `circuit_nom` QUE POUR NOMMER UNE JOURNÉE. La colonne
       est bien lue une fois — « Pau-Arnos · 12/04 » est le nom d'un pas de la
       suite — et c'est légitime : nommer n'est pas rapprocher. Ce qui est refusé,
       c'est de GROUPER ou de COMPARER sur ce texte libre, en SQL : l'égalité
       stricte a déjà séparé un circuit de lui-même une fois, et le pilote qui
       roulait le plus voyait le moins. */
    for (const { fichier, sql } of gabaritsSql()) {
      if (!fichier.endsWith('db/analyse.ts')) continue
      vrai(!/GROUP BY[^\n]*circuit/i.test(sql),
        'l\'analyse regroupe les circuits en SQL : l\'égalité stricte sépare « Pau-Arnos » de « pau arnos »')
      vrai(!/circuit_nom\s*(=|LIKE|IN\b)/i.test(sql),
        'l\'analyse compare des noms de circuit bruts : deux façons de l\'écrire redeviennent deux circuits, chacun sous le seuil')
    }
  }),

  doit('l\'analyse — les commentaires abrogés de Barres.tsx sont morts, et le nouveau nomme la levée', () => {
    /* ⚠ UN COMMENTAIRE FAUX EST PIRE QU'UN COMMENTAIRE ABSENT : ON LE CROIT. Le
       propriétaire a LEVÉ l'interdit de RELIER des paniers mensuels le 1er
       septembre 2026 — un segment droit entre deux paniers ne dit rien de plus
       que les deux paniers, il les ORDONNE. Ce fichier interdisait encore de
       relier, en deux endroits, avec l'aplomb d'une règle : le prochain lecteur
       aurait défait la suite au nom d'un interdit qui n'existe plus.

       Ce qui reste debout et n'a pas bougé d'un mot : le LISSAGE — une courbe
       passe par des valeurs que personne n'a mesurées — et la DROITE DE TENDANCE,
       qui n'invente pas entre les points mais AU-DELÀ. La levée porte sur RELIER,
       jamais sur PROLONGER. */
    const brut = fichierDe(ECRANS, '/Barres.tsx')
    vrai(brut.length > 0, 'src/ecrans/Barres.tsx a disparu : le témoin est muet')

    vrai(!/aucune droite ne se tire/i.test(brut),
      'Barres.tsx interdit de nouveau de relier : la suite se fera défaire au nom d\'une règle levée')
    vrai(!/RIEN NE SE COMPARE AU PRÉCÉDENT/.test(brut),
      'le paragraphe qui mettait relier et comparer dans le même sac est revenu')
    /* La phrase abrogée peut rester CITÉE — c'est même ce qui rend la levée
       lisible — mais alors la levée la suit immédiatement. Une citation sans sa
       levée redevient une règle. */
    const cite = brut.indexOf('inventerait des valeurs entre eux')
    if (cite > 0)
      vrai(brut.indexOf('A LEVÉ CE POINT') > cite
        && brut.indexOf('A LEVÉ CE POINT') - cite < 200,
      'la phrase abrogée traîne sans sa levée : elle se relit comme une règle en vigueur')
    vrai(/1er septembre[\s*\n]*2026/i.test(brut),
      'la levée ne porte plus sa date : on ne sait plus ce qui a été décidé, ni quand')

    // ET CE QUI RESTE INTERDIT EST TOUJOURS ÉCRIT, en toutes lettres.
    for (const clause of ['LISSAGE', 'DROITE DE TENDANCE'])
      vrai(new RegExp(clause).test(brut),
        `Barres.tsx ne refuse plus le ${clause.toLowerCase()} : la levée a débordé de « relier » vers « prolonger »`)
    /* Et le fichier ne trace toujours aucune ligne : une barre est un RECTANGLE,
       deux `div` et une largeur en pourcentage la font. La ligne vit dans
       Courbe.tsx, et le produit a DEUX fichiers qui ont le droit de poser un
       `<svg>`, pas trois. */
    vrai(!/<svg\b/.test(sansCommentaires(brut)),
      'le tracé de l\'argent pose un <svg> à lui : le jeu d\'icônes se rouvre')
    vrai(/<polyline/.test(sansCommentaires(fichierDe(ECRANS, '/Courbe.tsx'))),
      'la ligne a quitté Courbe.tsx : elle est allée poser un <svg> dans un troisième fichier')
  }),
]

for (const e of essais) await e()

const rates = resultats.filter((r) => !r.ok)
Object.assign(window, { __unite: { total: resultats.length, rates: rates.length, resultats } })
