import { formaterChrono, formaterEcart, formaterEuros, type CoutRoulage } from '../db/depot'

/**
 * LA COMPOSITION D'IMAGE — récit 4.1.
 *
 * La vitrine du produit, et l'un de ses deux moteurs d'acquisition.
 *
 * ⚠ ELLE TOURNE SUR LE FIL PRINCIPAL, et c'est un choix. AD-13 traite le cas du
 * Worker — « les polices sont ajoutées explicitement à `self.fonts`, rien n'est
 * hérité du document » — mais cette clause est CONDITIONNELLE : elle ne s'applique
 * que si l'on compose dans un Worker. En composant ici, le piège n'existe pas.
 * Le canevas fait 1080 × 1350, la composition prend quelques millisecondes, et
 * l'épine UX dit qu'il n'y a pas d'état de chargement au noyau.
 *
 * Mais le piège symétrique existe : sur le fil principal, `fillText` dessine
 * avec une police de repli si la fonte n'est pas encore chargée, SANS RIEN
 * DIRE. D'où l'attente explicite ci-dessous. C'est la même famille d'erreur —
 * silencieuse, invisible en développement, visible sur l'image partagée.
 */

export const LARGEUR = 1080
export const HAUTEUR = 1350   // 4:5 — le format portrait des fils

export type Gabarit = 'perf' | 'budget' | 'geste'

export type Matiere = {
  circuit: string
  date: string
  sessions: number
  meilleurMs: number | null
  ecartMs: number | null
  /** FR-34 : une PREMIÈRE est un événement en soi, et le gabarit perf le dit. */
  premiere: boolean
  cout: CoutRoulage | null
  gestes: string[]
  /** Le portrait de la machine, à défaut de photo. Ce n'est pas du décor de
   *  remplissage : c'est l'objet du produit, déjà local, déjà payé, et c'est ce
   *  qui rend l'image reconnaissable au premier coup d'œil dans un fil. */
  sprite: string | null
  /** La photo de fond vient de la COPIE LOCALE, jamais d'une URL distante :
   *  une autre origine teinte le canevas et l'export lève `SecurityError` — au
   *  moment de l'export seulement, donc loin de la cause. Et FR-36 exige que le
   *  récapitulatif se compose sans réseau, ce que la copie locale garantit. */
  fond: Blob | null
}

/** Une date se lit, elle ne se décode pas. « 2026-08-15 » est un identifiant ;
 *  « 15 août 2026 » est une date. */
const direDate = (iso: string) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('fr-FR',
    { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

const NUIT = '#070B1A'
const ENCRE = '#EDF3FF'
const FAIBLE = '#8FA3CE'
const MIAMI = '#3DE0FF'
const MAGENTA = '#FF2E9A'

/** Les fontes DOIVENT être prêtes avant le premier `fillText`. Sinon le canevas
 *  dessine en repli système, silencieusement, et l'image partie est fausse. */
const attendreLesFontes = async () => {
  try {
    await Promise.all([
      document.fonts.load('600 96px "Chakra Petch"'),
      document.fonts.load('500 32px "Chakra Petch"'),
    ])
    await document.fonts.ready
  } catch { /* repli système : l'image sort quand même, moins belle */ }
}

const fond = (c: CanvasRenderingContext2D) => {
  c.fillStyle = NUIT
  c.fillRect(0, 0, LARGEUR, HAUTEUR)
  const g = c.createLinearGradient(0, HAUTEUR, 0, 0)
  g.addColorStop(0, '#3A1550'); g.addColorStop(0.45, '#1A1140'); g.addColorStop(1, NUIT)
  c.fillStyle = g
  c.fillRect(0, 0, LARGEUR, HAUTEUR)
  // La ligne d'horizon du produit — le seul décor, et il est structurel.
  const h = c.createLinearGradient(0, 0, LARGEUR, 0)
  h.addColorStop(0, 'transparent'); h.addColorStop(0.22, MIAMI)
  h.addColorStop(0.5, '#FFFFFF'); h.addColorStop(0.78, MAGENTA); h.addColorStop(1, 'transparent')
  c.fillStyle = h
  c.fillRect(0, HAUTEUR * 0.62, LARGEUR, 2)
}

const libelle = (c: CanvasRenderingContext2D, t: string, x: number, y: number) => {
  c.font = '500 28px "Chakra Petch", sans-serif'
  c.fillStyle = FAIBLE
  c.letterSpacing = '4px'
  c.fillText(t.toUpperCase(), x, y)
  c.letterSpacing = '0px'
}

const chiffre = (c: CanvasRenderingContext2D, t: string, x: number, y: number, taille = 120, teinte = ENCRE) => {
  c.font = `600 ${taille}px "Chakra Petch", sans-serif`
  c.fillStyle = teinte
  c.fillText(t, x, y)
}

/**
 * FR-35 CROISÉE AVEC FR-21 — la clause que le compositeur doit tenir seul.
 *
 * Masquer le budget masque LE COÛT AU TOUR AVEC LUI. Le domaine porte déjà
 * l'invariant dans son type — `auTour` transporte son budget, on ne peut pas
 * déstructurer la moitié du couple — et ici on ajoute la seule chose que le type
 * ne peut pas porter : le choix du pilote de masquer. Masquer rend le couple
 * ENTIER indisponible, jamais sa moitié.
 */
const coutAffichable = (cout: CoutRoulage | null, masquer: boolean) =>
  masquer ? null : cout

export const composer = async (m: Matiere, gabarit: Gabarit, masquerBudget: boolean): Promise<Blob> => {
  await attendreLesFontes()

  const canevas = document.createElement('canvas')
  canevas.width = LARGEUR; canevas.height = HAUTEUR
  const c = canevas.getContext('2d')!

  fond(c)

  const M = 72
  const HAUT = 200, BAS = HAUTEUR * 0.60      // la bande visuelle

  /* LA BANDE NE RESTE JAMAIS VIDE, et ce n'est pas une question de décor.
     Une image partagée dont le milieu est noir se lit comme une image ratée, et
     la vitrine est l'un des deux moteurs d'acquisition du produit. Trois cas,
     par ordre de vérité : la photo du jour, puis le portrait de la machine —
     déjà local, déjà payé — puis rien, et alors le contenu remonte. */
  if (m.fond) {
    // Elle est déjà réduite sous le plafond de canevas au moment où elle a été
    // versée : on ne redécode jamais un fichier brut d'appareil photo ici.
    const bmp = await createImageBitmap(m.fond)
    const ech = Math.max(LARGEUR / bmp.width, (BAS - HAUT) / bmp.height)
    const w = bmp.width * ech, h = bmp.height * ech
    c.save()
    c.beginPath(); c.rect(0, HAUT, LARGEUR, BAS - HAUT); c.clip()
    c.drawImage(bmp, (LARGEUR - w) / 2, HAUT + (BAS - HAUT - h) / 2, w, h)
    c.restore()
    bmp.close()
    const voile = c.createLinearGradient(0, HAUT, 0, BAS)
    voile.addColorStop(0, 'rgba(7,11,26,.20)'); voile.addColorStop(1, 'rgba(7,11,26,.95)')
    c.fillStyle = voile
    c.fillRect(0, HAUT, LARGEUR, BAS - HAUT)
  } else if (m.sprite) {
    const bmp = await createImageBitmap(await (await fetch(m.sprite)).blob())
    // `imageSmoothingEnabled = false` : c'est ce qui rend le sprite légitime.
    // Lissé, il se trahirait en photo floue ; au plus proche voisin il reste net.
    c.imageSmoothingEnabled = false
    const ech = Math.min((LARGEUR - M * 2) / bmp.width, (BAS - HAUT - 60) / bmp.height)
    const w = bmp.width * ech, h = bmp.height * ech
    c.drawImage(bmp, (LARGEUR - w) / 2, HAUT + (BAS - HAUT - h) / 2, w, h)
    c.imageSmoothingEnabled = true
    bmp.close()
  }

  // L'horizon passe SOUS la bande : il pose l'image au lieu de la couper.
  const h = c.createLinearGradient(0, 0, LARGEUR, 0)
  h.addColorStop(0, 'transparent'); h.addColorStop(0.22, MIAMI)
  h.addColorStop(0.5, '#FFFFFF'); h.addColorStop(0.78, MAGENTA); h.addColorStop(1, 'transparent')
  c.fillStyle = h
  c.fillRect(0, BAS, LARGEUR, 2)

  libelle(c, direDate(m.date), M, 100)
  c.font = '600 76px "Chakra Petch", sans-serif'
  c.fillStyle = ENCRE
  c.fillText(m.circuit, M, 180)

  let y = BAS + 110

  if (gabarit === 'perf') {
    libelle(c, 'Meilleur tour du jour', M, y)
    chiffre(c, m.meilleurMs != null ? formaterChrono(m.meilleurMs) : '—', M, y + 140, 148, MIAMI)
    y += 220
    // FR-34 : une première EST un événement. On l'énonce ; on ne la décerne pas.
    if (m.premiere) {
      libelle(c, `Premier roulage à ${m.circuit}`, M, y)
    } else if (m.ecartMs != null) {
      libelle(c, 'À circuit constant', M, y)
      chiffre(c, formaterEcart(m.ecartMs), M + 430, y + 8, 48, m.ecartMs < 0 ? '#2BE88A' : '#FFD23F')
    }
    y += 66
    libelle(c, `${m.sessions} session${m.sessions > 1 ? 's' : ''}`, M, y)
  }

  if (gabarit === 'budget') {
    const co = coutAffichable(m.cout, masquerBudget)
    libelle(c, 'Ce que la journée a coûté', M, y)
    chiffre(c, co ? formaterEuros(co.journeeCentimes) : '—', M, y + 140, 148, ENCRE)
    y += 220
    // Le couple ENTIER, ou rien. Jamais le rapport seul.
    if (co?.auTour) {
      libelle(c, `Au tour · ${co.tours} tour${co.tours > 1 ? 's' : ''}`, M, y)
      chiffre(c, formaterEuros(co.auTour.centimes), M + 430, y + 8, 48, MIAMI)
      y += 66
      libelle(c, `Saison · ${formaterEuros(co.auTour.consommeCentimes)} sur ${formaterEuros(co.auTour.budgetCentimes)}`, M, y)
    }
  }

  if (gabarit === 'geste') {
    libelle(c, 'Ce qui est arrivé', M, y)
    y += 100
    const l = m.gestes.length ? m.gestes : ['Roulage saisi']
    for (const g of l.slice(0, 3)) {
      c.font = '600 62px "Chakra Petch", sans-serif'
      c.fillStyle = ENCRE
      c.fillText(g, M, y)
      y += 84
    }
  }

  /* ⚠ AUCUNE SIGNATURE DE PRODUIT SUR L'IMAGE, et c'est une contrainte, pas un
     oubli. QO-1 est ouverte : le nom exact est exploité par Oracle Red Bull
     Racing et ThePaddock est déjà le même produit sur l'App Store. Une image
     postée est publique — y apposer le nom de code, ce serait exactement
     l'usage public que le dossier interdit tant que le nom n'est pas tranché.
     La marque reviendra ici le jour où elle sera à nous. */

  /**
   * AD-13 — `blob.type` SE VÉRIFIE APRÈS COUP.
   *
   * `toBlob(cb, 'image/png')` peut ignorer le format demandé sans lever
   * d'erreur. Déduire le type du format demandé, c'est construire un `File`
   * dont le nom et le type mentent — et `canShare` refuse alors l'objet, très
   * loin de la cause.
   */
  const blob = await new Promise<Blob | null>((r) => canevas.toBlob(r, 'image/png'))
  if (!blob) throw new Error("Le canevas n'a rien rendu.")
  return blob
}

/** Le nom du fichier se dérive du TYPE RÉEL, jamais du format demandé. */
export const enFichier = (blob: Blob, circuit: string, date: string): File => {
  const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'
  const nom = `${circuit.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${date}.${ext}`
  return new File([blob], nom, { type: blob.type })
}
