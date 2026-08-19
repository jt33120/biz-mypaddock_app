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
  marge: 0.03,      // respiration autour du cadre rendu par l'IA
})

const NUIT = [0x07, 0x0b, 0x1a]
const ENCRE = [0xed, 0xf3, 0xff]
const TRAIT = [0x04, 0x07, 0x12]

// ------------------------------------------- étape 0 : les dimensions sans décoder
// Une photo d'iPhone fait 18,3 Mpx (3213 × 5712, mesuré sur les photos de Julian) et une
// 48 Mpx est possible. Le plafond canvas de Safari est de 16 777 216 px : au-delà,
// L'ONGLET MEURT. Il faut donc décoder DIRECTEMENT à la taille réduite — ce qui suppose
// de connaître les dimensions AVANT de décoder.
//
// Le réflexe (`createImageBitmap(f)` pour lire .width, puis re-décoder avec resize)
// décode DEUX FOIS en pleine résolution. Sur six photos le banc n'en a rendu qu'une avant
// d'épuiser son budget de temps. On lit donc les dimensions dans les octets de l'en-tête :
// zéro décodage, quelques kilo-octets lus, et ça marche partout — y compris sur iOS, où
// c'est le pic mémoire du décodage qui tue l'onglet.
export async function dimensions(blob) {
  const tete = new Uint8Array(await blob.slice(0, 128 * 1024).arrayBuffer())
  const u16 = (i) => (tete[i] << 8) | tete[i + 1]
  const u32 = (i) => (tete[i] << 24) | (tete[i + 1] << 16) | (tete[i + 2] << 8) | tete[i + 3]

  // PNG : signature, puis IHDR à l'offset 16.
  if (u32(0) === 0x89504e47 >> 0 || (tete[0] === 0x89 && tete[1] === 0x50))
    return { w: u32(16), h: u32(20) }

  // JPEG : parcourir les marqueurs jusqu'au SOF (0xC0–0xCF, hors C4/C8/CC).
  if (tete[0] === 0xff && tete[1] === 0xd8) {
    let i = 2
    while (i < tete.length - 9) {
      if (tete[i] !== 0xff) { i++; continue }
      const m = tete[i + 1]
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
        return { w: u16(i + 7), h: u16(i + 5) }   // SOF : hauteur puis largeur
      if (m === 0xd8 || (m >= 0xd0 && m <= 0xd9)) { i += 2; continue }
      i += 2 + u16(i + 2)
    }
  }
  // WebP VP8X / autres : on laisse le navigateur trancher, quitte à payer une sonde.
  return null
}

// ---------------------------------------------------------------- étape 1 : réduire
export async function reduire(source) {
  const d = await dimensions(source).catch(() => null)
  let w0, h0
  if (d && d.w > 0 && d.h > 0) { w0 = d.w; h0 = d.h }
  else {
    // Repli : format inconnu. On paie une sonde, mais on la ferme aussitôt.
    const sonde = await createImageBitmap(source)
    w0 = sonde.width; h0 = sonde.height
    sonde.close?.()
  }
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
function teintes(g, gw, gh, masque = null) {
  // Histogramme circulaire pondéré par la chroma. 36 secteurs de 10°.
  //
  // ET pondéré par la POSITION, ce qui n'est pas une coquetterie : sur IMG_9245, une moto
  // rouge, la teinte mesurée sortait à 45° — le bas-côté et le vibreur jaunes votaient depuis
  // les bords du cadre. Une boîte englobante serre la machine au centre et laisse du décor
  // dans les coins ; le vote doit donc décroître vers les bords. Reste déterministe et
  // identique pour toutes les photos : aucun réglage par photo.
  const secteurs = new Float64Array(36)
  for (let i = 0; i < gw * gh; i++) {
    const gx = i % gw, gy = (i / gw) | 0
    const dx = (gx / (gw - 1 || 1)) * 2 - 1, dy = (gy / (gh - 1 || 1)) * 2 - 1
    // Hors machine, aucun vote : un fond détouré ne doit pas colorer la moto.
    if (masque && !masque[i]) continue
    // Sans masque, la pondération centrale reste le garde-fou approximatif.
    const poidsPos = masque ? 1 : Math.max(0, 1 - (dx * dx + dy * dy) * 0.75)
    if (poidsPos <= 0) continue
    const r = g[i * 3] / 255, v = g[i * 3 + 1] / 255, b = g[i * 3 + 2] / 255
    const max = Math.max(r, v, b), min = Math.min(r, v, b)
    const c = max - min
    if (c < REGLAGES.chromaMin) continue
    let t
    if (max === r) t = ((v - b) / c + 6) % 6
    else if (max === v) t = (b - r) / c + 2
    else t = (r - v) / c + 4
    secteurs[Math.floor(((t * 60) % 360) / 10)] += c * poidsPos
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

// `cadre` vient de l'étape IA : {x, y, l, h} normalisés autour de la machine.
// Il corrige trois choses d'un coup, et c'est pour ça qu'il vaut un appel réseau :
//   1. la teinte dominante est mesurée sur la MOTO et non sur le gazon qui gagne par la masse ;
//   2. la résolution du pixel devient relative à la machine — un bloc de 4 px sur un cadre
//      plein ne donne qu'une quinzaine de cellules de roue, où aucun rayon n'est possible ;
//   3. le paddock, le camion et la remorque sortent de l'image.
// Absent ou peu sûr, on retombe sur le cadre plein : le rendu dégrade, il ne casse pas.
export function rendre(bitmap, cadre = null, masqueFn = null) {
  const t0 = performance.now()
  const marge = REGLAGES.marge
  let sx = 0, sy = 0, sl = bitmap.width, sh = bitmap.height
  if (cadre) {
    const cx0 = (cadre.x - marge) * bitmap.width, cy0 = (cadre.y - marge) * bitmap.height
    const cl = (cadre.l + 2 * marge) * bitmap.width, ch = (cadre.h + 2 * marge) * bitmap.height
    sx = Math.max(0, Math.round(cx0)); sy = Math.max(0, Math.round(cy0))
    sl = Math.min(bitmap.width - sx, Math.round(cl)); sh = Math.min(bitmap.height - sy, Math.round(ch))
    if (sl < 32 || sh < 32) { sx = 0; sy = 0; sl = bitmap.width; sh = bitmap.height }
  }
  // Le recadrage est aussi un ré-échantillonnage : on redonne au cadre l'arête complète,
  // sinon découper une petite moto reviendrait à baisser la résolution du rendu.
  const k = REGLAGES.arete / Math.max(sl, sh)
  const dl = Math.max(1, Math.round(sl * k)), dh = Math.max(1, Math.round(sh * k))
  const c = new OffscreenCanvas(dl, dh)
  const cx = c.getContext('2d', { willReadFrequently: true })
  cx.imageSmoothingQuality = 'high'
  cx.drawImage(bitmap, sx, sy, sl, sh, 0, 0, dl, dh)
  const px = cx.getImageData(0, 0, dl, dh).data
  bitmap = { width: dl, height: dh }

  // Le détourage, s'il est fourni. Il travaille sur le recadré en pleine résolution, puis
  // sa décision est ramenée à la grille par vote majoritaire — décider à la résolution du
  // bloc donnerait un bord en escalier de 4 px.
  let masqueFin = null
  if (masqueFn) {
    try { masqueFin = masqueFn(px, dl, dh) } catch { masqueFin = null }
    if (masqueFin && masqueFin.length !== dl * dh) masqueFin = null
  }

  const { g, gw, gh } = moyennerParBloc(px, bitmap.width, bitmap.height, REGLAGES.bloc)

  // Vote majoritaire du masque sur chaque bloc, et — point qui compte — la teinte se mesure
  // ENSUITE sur les seuls blocs de machine. C'est là que le détourage paie deux fois : il
  // enlève le fond de l'image ET il le retire du vote de couleur.
  let masque = null
  if (masqueFin) {
    masque = new Uint8Array(gw * gh)
    for (let gy = 0; gy < gh; gy++) {
      for (let gx = 0; gx < gw; gx++) {
        let n = 0, tot = 0
        const y1 = Math.min(dh, (gy + 1) * REGLAGES.bloc), x1 = Math.min(dl, (gx + 1) * REGLAGES.bloc)
        for (let y = gy * REGLAGES.bloc; y < y1; y++)
          for (let x = gx * REGLAGES.bloc; x < x1; x++) { tot++; n += masqueFin[y * dl + x] }
        masque[gy * gw + gx] = n * 2 >= tot ? 1 : 0
      }
    }
  }
  const t = teintes(g, gw, gh, masque)
  const pal = palette(t)

  // Sobel sur la luminance de la grille. C'est ce passage qui pose le trait intérieur.
  // Détouré, il ne doit PAS courir le long de la silhouette : le bord du masque est déjà
  // une frontière, un trait par-dessus ferait une bavure noire de deux blocs.
  const lum = new Float32Array(gw * gh)
  for (let i = 0; i < gw * gh; i++) lum[i] = luminance(g[i * 3], g[i * 3 + 1], g[i * 3 + 2])
  const bord = new Uint8Array(gw * gh)
  for (let y = 1; y < gh - 1; y++) {
    for (let x = 1; x < gw - 1; x++) {
      const L = (dx, dy) => lum[(y + dy) * gw + (x + dx)]
      const sx = -L(-1, -1) - 2 * L(-1, 0) - L(-1, 1) + L(1, -1) + 2 * L(1, 0) + L(1, 1)
      const sy = -L(-1, -1) - 2 * L(0, -1) - L(1, -1) + L(-1, 1) + 2 * L(0, 1) + L(1, 1)
      if (masque) {
        const i0 = y * gw + x
        if (!masque[i0]) continue
        // Un bloc de machine touchant le fond est déjà une frontière : pas de trait dessus.
        if (!masque[i0 - 1] || !masque[i0 + 1] || !masque[i0 - gw] || !masque[i0 + gw]) continue
      }
      if (Math.hypot(sx, sy) > REGLAGES.contour * 4) bord[y * gw + x] = 1
    }
  }

  const out = new OffscreenCanvas(gw, gh)
  const ox = out.getContext('2d')
  const img = ox.createImageData(gw, gh)
  for (let i = 0; i < gw * gh; i++) {
    let couleur
    // Le fond détouré devient transparent : c'est la scène du garage qui fournit le décor,
    // pas la photo. Un fond peint en aplat sombre paraîtrait propre ici et se verrait dès
    // qu'on le poserait sur autre chose.
    if (masque && !masque[i]) {
      img.data[i * 4 + 3] = 0
      continue
    }
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

export async function pipeline(source, cadre = null, masqueFn = null) {
  // Le chrono couvre la réduction ET le rendu : sur une photo de 48 Mpx c'est le
  // décodage qui coûte, pas la quantification. Mesurer le seul rendu mentirait.
  const t0 = performance.now()
  const bitmap = await reduire(source)
  const r = rendre(bitmap, cadre, masqueFn)
  return { ...r, source: bitmap, ms: performance.now() - t0, msRendu: r.ms }
}
