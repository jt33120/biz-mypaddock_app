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
import { anneeSaison, enCentimes, formaterChrono, formaterEcart, formaterEuros } from '../../src/db/depot'
import { instantDeLId, SEUIL_H } from '../../src/db/mesures'
import { direAVenir, direPasse, ecartJours } from '../../src/db/accueil'
import { formaterPoids, TABLES_EMPORTEES } from '../../src/db/emporter'
import { dimensions } from '../../src/db/photos'
import {
  capaciteLocale, ecrireLocale, effacerLocale, eprouverLeCoffre, fermerLaConnexionDuCoffre,
  lireLocale, nomsBrutsDuCoffre, nomsDuCoffre, oublierLeMagasin, viderLeCoffre,
} from '../../src/db/coffre'
import { enFichier } from '../../src/recap/composer'
import {
  avecLesDefauts, chargeDe, DEFAUTS_SERVEUR, DEPENDANCES, direCombien, LIEN_DIFFERE, NOM_TABLE,
  ORDRE, PORTE_PROPRIETAIRE,
} from '../../src/db/sauvegarde'
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
import { niveauDuGroupe } from '../../src/db/usure'
import {
  CHARGEMENT, CHARGEMENT_EMBARQUE, direLAge, direPublication, MOIS_AVANT_DOUTE, moisDepuis,
  NOM_CATEGORIE,
} from '../../src/db/checklist'
// La migration telle qu'elle est appliquée. Comme le YAML de synchronisation :
// rien ne la relie au code, et c'est précisément le problème.
import MIGRATION_CATEGORIES from
  '../../supabase/migrations/20260823000001_preparation_et_skin_equipement.sql?raw'
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
    // Une cinquième catégorie ajoutée demain doit OBLIGER à trancher : dans le
    // camion, ou avant d'y aller ? Sans cet essai, elle serait silencieusement
    // écrite, jamais rendue, et comptée quand même — exactement le défaut du
    // 23 août, à l'identique.
    const rangees = new Set<string>([...CHARGEMENT, 'preparation'])
    for (const c of Object.keys(NOM_CATEGORIE))
      vrai(rangees.has(c), `« ${c} » n'est ni du chargement ni de la préparation`)
    egal(rangees.size, Object.keys(NOM_CATEGORIE).length,
      'une catégorie est rangée mais n\'existe pas')
  }),
  doit('le serveur accepte exactement les catégories que le produit connaît', () => {
    // Le même motif que le YAML de synchronisation : deux copies d'une même
    // vérité, dont une prend du retard. Une catégorie ajoutée au code sans
    // l'être à la contrainte serait refusée à l'envoi — donc une file bloquée,
    // donc toute la saison qui cesse de monter. C'est l'incident du 19 août.
    const m = MIGRATION_CATEGORIES.match(/check \(categorie in \(([^)]*)\)\)/)
    vrai(!!m, 'la contrainte de catégories est introuvable dans la migration')
    const serveur = new Set([...m![1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]))
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
    const sortants = Object.values(ECRANS).flatMap(boutonsDe)
      .filter((b) => b.libelles.some((l) => /^Garder( mon compte)?$/.test(l))
        && /set(Confirme|Ouvert)\(false\)/.test(b.gestionnaire))
    vrai(sortants.length === 3, `${sortants.length} sortants de confirmation trouvés`)
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
    const jauge = FEUILLE.match(/\.jauge\s*\{[^}]*\}[\s\S]{0,200}?\.jauge span\s*\{[^}]*\}/)?.[0]
    vrai(!!jauge && !jauge.includes('alerte'), 'la jauge de budget a pris du rouge')
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
]

for (const e of essais) await e()

const rates = resultats.filter((r) => !r.ok)
Object.assign(window, { __unite: { total: resultats.length, rates: rates.length, resultats } })
