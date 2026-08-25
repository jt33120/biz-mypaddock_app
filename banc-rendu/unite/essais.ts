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
]

for (const e of essais) await e()

const rates = resultats.filter((r) => !r.ok)
Object.assign(window, { __unite: { total: resultats.length, rates: rates.length, resultats } })
