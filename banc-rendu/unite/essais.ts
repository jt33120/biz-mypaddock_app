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
import { formaterPoids } from '../../src/db/emporter'
import { dimensions } from '../../src/db/photos'
import { enFichier } from '../../src/recap/composer'
import { DEPENDANCES, LIEN_DIFFERE, ORDRE, PORTE_PROPRIETAIRE } from '../../src/db/sauvegarde'
import { AppSchema, REFERENTIEL } from '../../src/db/schema'
import { effacerLesReglages } from '../../src/db/effacer'
import { POINTS_MINIMUM } from '../../src/db/courbe'
import { niveauDuGroupe } from '../../src/db/usure'
import { CHARGEMENT_EMBARQUE, MOIS_AVANT_DOUTE, moisDepuis } from '../../src/db/checklist'
import { nouveauCode } from '../../src/db/cercle'
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

  /* ─── LE CODE DE CERCLE — il se donne DE VIVE VOIX ────────────────────── */
  doit("un code de cercle n'a aucun caractère qu'on confonde à l'oral", () => {
    // Il se dicte au paddock, casque à la main, dans le bruit. 0 et O, 1 et I
    // et L se confondent : ils sont exclus de l'alphabet, pas corrigés après.
    for (let i = 0; i < 200; i++) {
      const c = nouveauCode()
      egal(c.length, 8)
      vrai(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]+$/.test(c), `« ${c} » contient un caractère ambigu`)
    }
    // Et deux codes tirés coup sur coup ne se ressemblent pas.
    vrai(new Set([...Array(50)].map(() => nouveauCode())).size === 50, 'des codes se répètent')
  }),
]

for (const e of essais) await e()

const rates = resultats.filter((r) => !r.ok)
Object.assign(window, { __unite: { total: resultats.length, rates: rates.length, resultats } })
