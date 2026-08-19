// Pipeline de rendu pixel — récit 0.5, la porte de rendu.
//
// Trois propriétés, et ce sont elles qui répondent à l'exigence de Julian
// (« solide ET reproductible pour les autres utilisateurs ») :
//
//   1. DÉTERMINISTE — même entrée, même sortie, toujours. Aucun modèle génératif,
//      aucun appel réseau, aucune clé. Un pipeline déterministe se débogue sur un cas
//      et se PROUVE sur un jeu ; un modèle génératif ne garantit rien d'un utilisateur
//      au suivant.
//   2. AUCUN RÉGLAGE PAR PHOTO — REGLAGES est global et figé. Si une photo demande un
//      ajustement à la main, c'est un échec du pipeline, pas un cas particulier.
//   3. GÉOMÉTRIE DE PALETTE FIXE, TEINTE DÉRIVÉE — les 16 emplacements, leurs paliers de
//      luminance et leur courbe de saturation ne changent jamais. Seule la teinte
//      dominante est mesurée sur l'image. C'est ce qui permet à une moto rouge et une
//      moto bleue de bien passer sans que personne ne touche un curseur.
//      Une palette adaptative par image (median-cut) ferait l'inverse : jolie sur une
//      photo, imprévisible sur la suivante.

export const REGLAGES = Object.freeze({
  arete: 1024,      // arête longue max AVANT tout drawImage — le plafond canvas d'iOS
  bloc: 4,          // côté du bloc pixel, en pixels de l'image réduite
  paliers: 6,       // marches neutres
  paliersTeinte: 5, // marches de la teinte dominante, idem pour la secondaire
  contour: 0.20,    // seuil de gradient au-delà duquel on pose le trait
  saturation: 1.16,
  gamma: 1.05,
  chromaMin: 0.10,  // en dessous, un pixel ne vote pas pour la teinte
})

const NUIT = [0x07, 0x0b, 0x1a]
const ENCRE = [0xed, 0xf3, 0xff]
const TRAIT = [0x04, 0x07, 0x12]

// ---------------------------------------------------------------- étape 1 : réduire
// Une photo d'iPhone récent fait 48 Mpx. Safari refuse un canevas au-delà de
// 16 777 216 px et L'ONGLET MEURT. Ce n'est pas le cas limite, c'est le cas normal.
export async function reduire(source) {
  const sonde = await createImageBitmap(source)
  const { width: w0, height: h0 } = sonde
  sonde.close?.()
  const k = Math.min(1, REGLAGES.arete / Math.max(w0, h0))
  return createImageBitmap(source, {
    resizeWidth: Math.max(1, Math.round(w0 * k)),
    resizeHeight: Math.max(1, Math.round(h0 * k)),
    resizeQuality: 'high',
    imageOrientation: 'from-image', // sinon une photo portrait sort couchée
  })
}

// ------------------------------------------------- étape 2 : moyenner par bloc pixel
function moyennerParBloc(px, w, h, bloc) {
  const gw = Math.max(1, Math.floor(w / bloc))
  const gh = Math.max(1, Math.floor(h / bloc))
  const g = new Float32Array(gw * gh * 3)
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      let r = 0, v = 0, b = 0, n = 0
      const y1 = Math.min(h, (gy + 1) * bloc), x1 = Math.min(w, (gx + 1) * bloc)
      for (let y = gy * bloc; y < y1; y++) {
        for (let x = gx * bloc; x < x1; x++) {
          const i = (y * w + x) * 4
          r += px[i]; v += px[i + 1]; b += px[i + 2]; n++
        }
      }
      const o = (gy * gw + gx) * 3
      g[o] = r / n; g[o + 1] = v / n; g[o + 2] = b / n
    }
  }
  return { g, gw, gh }
}

// --------------------------------------- étape 3 : mesurer les deux teintes dominantes
function teintes(g, gw, gh) {
  // Histogramme circulaire pondéré par la chroma. 36 secteurs de 10°.
  const secteurs = new Float64Array(36)
  for (let i = 0; i < gw * gh; i++) {
    const r = g[i * 3] / 255, v = g[i * 3 + 1] / 255, b = g[i * 3 + 2] / 255
    const max = Math.max(r, v, b), min = Math.min(r, v, b)
    const c = max - min
    if (c < REGLAGES.chromaMin) continue
    let t
    if (max === r) t = ((v - b) / c + 6) % 6
    else if (max === v) t = (b - r) / c + 2
    else t = (r - v) / c + 4
    secteurs[Math.floor(((t * 60) % 360) / 10)] += c
  }
  // Lissage sur ±1 secteur : une teinte étalée sur deux bacs ne doit pas se scinder.
  const lisse = secteurs.map((_, i) =>
    secteurs[(i + 35) % 36] * 0.5 + secteurs[i] + secteurs[(i + 1) % 36] * 0.5)
  const pics = [...lisse.keys()].sort((a, b) => lisse[b] - lisse[a])
  const p1 = pics[0]
  // La secondaire doit être à ≥ 60° de la dominante, sinon c'est la même teinte.
  const p2 = pics.find(i => Math.min(Math.abs(i - p1), 36 - Math.abs(i - p1)) >= 6) ?? (p1 + 18) % 36
  const total = lisse.reduce((a, b) => a + b, 0)
  return {
    dominante: p1 * 10 + 5,
    secondaire: p2 * 10 + 5,
    // Une moto grise donne une force quasi nulle : la palette glisse vers le neutre
    // toute seule, sans qu'aucun réglage ne bouge.
    force: total > 0 ? Math.min(1, (lisse[p1] / total) * 4) : 0,
  }
}

// ------------------------------------------------------ étape 4 : construire la palette
function tsvVersRvb(t, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((t / 60) % 2) - 1)), m = v - c
  const [r, g, b] = t < 60 ? [c, x, 0] : t < 120 ? [x, c, 0] : t < 180 ? [0, c, x]
    : t < 240 ? [0, x, c] : t < 300 ? [x, 0, c] : [c, 0, x]
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

export function palette({ dominante, secondaire, force }) {
  const p = []
  const { paliers, paliersTeinte, saturation } = REGLAGES
  for (let i = 0; i < paliers; i++) {              // rampe neutre : nuit → encre
    const t = i / (paliers - 1)
    p.push([0, 1, 2].map(c => Math.round(NUIT[c] + (ENCRE[c] - NUIT[c]) * Math.pow(t, REGLAGES.gamma))))
  }
  for (const [teinte, poids] of [[dominante, 1], [secondaire, 0.72]]) {
    for (let i = 0; i < paliersTeinte; i++) {
      const t = (i + 1) / (paliersTeinte + 1)
      const s = Math.min(1, saturation * (0.42 + 0.5 * (1 - Math.abs(t - 0.5) * 2)) * (0.35 + 0.65 * force) * poids)
      p.push(tsvVersRvb(teinte, s, 0.16 + 0.82 * t))
    }
  }
  return p
}

// -------------------------------------- étape 5 : quantifier + poser le trait de contour
function luminance(r, v, b) { return (0.2126 * r + 0.7152 * v + 0.0722 * b) / 255 }

export function rendre(bitmap) {
  const t0 = performance.now()
  const c = new OffscreenCanvas(bitmap.width, bitmap.height)
  const cx = c.getContext('2d', { willReadFrequently: true })
  cx.drawImage(bitmap, 0, 0)
  const px = cx.getImageData(0, 0, bitmap.width, bitmap.height).data

  const { g, gw, gh } = moyennerParBloc(px, bitmap.width, bitmap.height, REGLAGES.bloc)
  const t = teintes(g, gw, gh)
  const pal = palette(t)

  // Sobel sur la luminance de la grille. C'est ce passage qui décide si les rayons
  // sont des rayons et si le disque est perforé : sans trait, la quantification
  // les aplatit dans le fond.
  const lum = new Float32Array(gw * gh)
  for (let i = 0; i < gw * gh; i++) lum[i] = luminance(g[i * 3], g[i * 3 + 1], g[i * 3 + 2])
  const bord = new Uint8Array(gw * gh)
  for (let y = 1; y < gh - 1; y++) {
    for (let x = 1; x < gw - 1; x++) {
      const L = (dx, dy) => lum[(y + dy) * gw + (x + dx)]
      const sx = -L(-1, -1) - 2 * L(-1, 0) - L(-1, 1) + L(1, -1) + 2 * L(1, 0) + L(1, 1)
      const sy = -L(-1, -1) - 2 * L(0, -1) - L(1, -1) + L(-1, 1) + 2 * L(0, 1) + L(1, 1)
      if (Math.hypot(sx, sy) > REGLAGES.contour * 4) bord[y * gw + x] = 1
    }
  }

  const out = new OffscreenCanvas(gw, gh)
  const ox = out.getContext('2d')
  const img = ox.createImageData(gw, gh)
  for (let i = 0; i < gw * gh; i++) {
    let couleur
    if (bord[i]) couleur = TRAIT
    else {
      let best = 0, d = Infinity
      for (let k = 0; k < pal.length; k++) {
        const dd = (pal[k][0] - g[i * 3]) ** 2 + (pal[k][1] - g[i * 3 + 1]) ** 2 + (pal[k][2] - g[i * 3 + 2]) ** 2
        if (dd < d) { d = dd; best = k }
      }
      couleur = pal[best]
    }
    img.data[i * 4] = couleur[0]; img.data[i * 4 + 1] = couleur[1]
    img.data[i * 4 + 2] = couleur[2]; img.data[i * 4 + 3] = 255
  }
  ox.putImageData(img, 0, 0)
  return { canvas: out, gw, gh, teintes: t, palette: pal, ms: performance.now() - t0 }
}

export async function pipeline(source) {
  // Le chrono couvre la réduction ET le rendu : sur une photo de 48 Mpx c'est le
  // décodage qui coûte, pas la quantification. Mesurer le seul rendu mentirait.
  const t0 = performance.now()
  const bitmap = await reduire(source)
  const r = rendre(bitmap)
  return { ...r, source: bitmap, ms: performance.now() - t0, msRendu: r.ms }
}
