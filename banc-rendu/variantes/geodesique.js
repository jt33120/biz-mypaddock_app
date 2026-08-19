// Détourage par distance géodésique depuis des germes automatiques.
//
// Deux jeux de germes, aucun clic : le FOND sur l'anneau de bordure, la MACHINE dans une
// ellipse centrale (la boîte englobante serre la machine, donc le centre en est presque
// toujours). On calcule pour chaque cellule le coût du chemin le moins cher jusqu'à chaque
// jeu — un pas coûte le contraste local, un contour franc coûte cher à traverser — et chaque
// cellule prend l'étiquette du jeu le plus proche. Double balayage chanfrein, aller puis
// retour : pas de file de priorité, et ça tient le budget de temps.
//
// Trois choses règlent tout, et les trois ont été trouvées en regardant les planches, pas en
// raisonnant :
//
// 1. LE COÛT D'UN PAS EST LE CONTRASTE EN EXCÈS SUR LA TEXTURE AMBIANTE, jamais le gradient
//    brut. Dans l'herbe, le gravier ou le feuillage, le gradient brut est fort partout : un
//    contour franc n'y coûte alors pas plus qu'un pas ordinaire, les deux distances
//    s'égalisent à mi-chemin et on obtient une patate — c'est exactement ce que rendaient les
//    premières planches. Mesuré en excès sur la moyenne locale du gradient, le feuillage
//    redevient une autoroute et la silhouette redevient un mur. L'échelle du mur est en outre
//    MESURÉE sur l'image (un quantile haut de cet excès) et non devinée, sans quoi la même
//    constante voudrait dire deux choses différentes sur une photo terne et une contrastée.
//
// 2. CHAQUE CAMP PAIE PLUS CHER LOIN DE CHEZ LUI. Une distance géodésique prend le chemin le
//    moins cher : elle trouve donc le point le plus faible de TOUTE la silhouette — l'ombre
//    sous le pneu — et une fois passée, elle inonde presque gratuitement ce qu'il y a
//    derrière. Chaque camp avance donc au prix normal sur toute l'étendue où il est plausible
//    (jusqu'à FRANCHISE), puis de plus en plus cher au-delà. Une fuite lointaine ne se
//    rentabilise plus, et le pire cas de la variante n'est pas une coulée sauvage à travers
//    la photo mais l'ellipse de la boîte.
//
// 3. LES GERMES DE MACHINE SONT L'ELLIPSE MOINS CE QUE LE FOND ATTEINT DÉJÀ GRATUITEMENT.
//    L'ellipse fixe suppose que la boîte centre la machine ; elle ne le fait pas toujours.
//    Sur une photo de piste, un tiers de l'ellipse tombait dans l'herbe : l'herbe devenait
//    machine pour zéro franc et entraînait tout le bas-côté avec elle. On calcule donc le
//    fond D'ABORD, et une cellule que le fond atteint pour presque rien EST du fond : elle
//    n'est pas ensemencée. C'est le même barème géodésique qui tranche, aucune couleur n'est
//    jugée nulle part dans ce fichier.

export const nom = 'géodésique'
export const description =
  'distance géodésique depuis des germes automatiques — coût d’un pas = contraste en excès sur la texture ambiante, majoré chez l’adversaire'

// --- constantes globales, figées, identiques pour les six photos ---------------------
const CELLULE = 4          // côté d'une cellule de travail, en px du recadré
const EPS = 0.0008         // coût d'un pas dans un aplat parfait : borne les détours
const QUANTILE = 0.90      // quantile de l'excès de contraste qui définit « un mur »
const PLANCHER_MUR = 0.008 // garde-fou : sur un aplat, pas de mur sur du bruit de capteur
const EXPO = 2.0           // durcit l'écart entre contour franc et texture molle
const PLAFOND = 4          // un mur reste un mur : au-delà, inutile de le rendre infini
const RAYON_TEXTURE = 10   // rayon, en cellules, où l'on mesure la texture ambiante
const LAMBDA = 10          // surcoût d'un pas au fin fond du territoire adverse
const FRANCHISE = 0.45     // rayon jusqu'où chaque camp avance au prix normal
const EPAISSIR = 1         // dilatation du mur, en cellules : un mur d'une cellule s'enjambe
const ANNEAU = 0.020       // épaisseur de l'anneau de germes de fond (fraction du petit côté)
const PENAL_BORD = 0.05    // prix d'entrée d'un germe de fond au milieu d'une arête
const RAYON_GERME = 0.35   // rayon (repère normalisé) de l'ellipse de germes de machine
const SEUIL_PROFOND = 1.00 // profondeur minimale d'un germe : un mur plein, pas moins
const NOYAU_GERME = 0.12   // repli : si rien n'est assez profond, le noyau sert de germe
const BIAIS = 1.40         // < 1 favorise la machine, > 1 favorise le fond
const PASSES = 3           // aller-retour de balayage
const TROU_MAX = 0.02      // un creux de fond enfermé sous cette aire (fraction) est rebouché

export function masque(px, w, h) {
  const { W, H, lab } = _champs(px, w, h)
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    const cy = Math.min(H - 1, (y / CELLULE) | 0)
    const l = cy * W
    for (let x = 0; x < w; x++) out[y * w + x] = lab[l + Math.min(W - 1, (x / CELLULE) | 0)]
  }
  return out
}

// Le calcul complet, exposé pour pouvoir inspecter les champs eux-mêmes sur un banc : c'est
// en regardant `poids`, `dFond` et `dMach` que les trois points de l'en-tête sont sortis.
// `masque` seul suffit au pipeline.
export function _champs(px, w, h) {
  const W = Math.max(8, Math.floor(w / CELLULE))
  const H = Math.max(8, Math.floor(h / CELLULE))
  const N = W * H

  // ---- 1. couleur moyenne par cellule, puis léger lissage : le bruit n'est pas un contour
  let R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N)
  for (let cy = 0; cy < H; cy++) {
    const y1 = Math.min(h, (cy + 1) * CELLULE)
    for (let cx = 0; cx < W; cx++) {
      const x1 = Math.min(w, (cx + 1) * CELLULE)
      let r = 0, g = 0, b = 0, n = 0
      for (let y = cy * CELLULE; y < y1; y++) {
        let i = (y * w + cx * CELLULE) * 4
        for (let x = cx * CELLULE; x < x1; x++, i += 4) {
          r += px[i]; g += px[i + 1]; b += px[i + 2]; n++
        }
      }
      const o = cy * W + cx
      R[o] = r / n; G[o] = g / n; B[o] = b / n
    }
  }
  R = flou(R, W, H, 1); G = flou(G, W, H, 1); B = flou(B, W, H, 1)

  // ---- 2. gradient, texture ambiante, contraste en excès, échelle du mur
  const grad = new Float32Array(N)
  const dc = (a, b) =>
    (Math.abs(R[a] - R[b]) + Math.abs(G[a] - G[b]) + Math.abs(B[a] - B[b])) / 765
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const xg = x > 0 ? i - 1 : i, xd = x < W - 1 ? i + 1 : i
      const yh = y > 0 ? i - W : i, yb = y < H - 1 ? i + W : i
      grad[i] = Math.hypot(dc(xd, xg), dc(yb, yh))
    }
  }
  const ambiant = flou(grad, W, H, RAYON_TEXTURE)
  const exces = new Float32Array(N)
  let pire = 0
  for (let i = 0; i < N; i++) {
    const e = Math.max(0, grad[i] - ambiant[i])
    exces[i] = e
    if (e > pire) pire = e
  }
  // L'échelle du mur est MESURÉE sur l'image (quantile haut de l'excès), pas devinée : une
  // photo terne et une photo contrastée doivent donner le même barème. La règle est la même
  // pour les six — c'est la mesure qui change, pas le réglage.
  const BINS = 256
  const hist = new Int32Array(BINS)
  const ech = pire > 0 ? pire : 1
  for (let i = 0; i < N; i++) hist[Math.min(BINS - 1, (exces[i] / ech * BINS) | 0)]++
  let cumul = 0, bac = 0
  for (; bac < BINS - 1; bac++) { cumul += hist[bac]; if (cumul >= QUANTILE * N) break }
  const MUR = Math.max(PLANCHER_MUR, (bac + 0.5) / BINS * ech)

  // ---- 3. deux barèmes : chaque camp paie LAMBDA fois plus cher en territoire adverse
  // Un mur d'une seule cellule s'enjambe pour la moitié de son prix, et un contour a
  // toujours des cellules faibles : on le dilate, ce qui bouche les passages et ferme les
  // trous d'un pixel. La frontière devient une bande — c'est exactement ce qu'est un contour.
  const mur = new Float32Array(N)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let m = 0
      const y0 = Math.max(0, y - EPAISSIR), y1 = Math.min(H - 1, y + EPAISSIR)
      const x0 = Math.max(0, x - EPAISSIR), x1 = Math.min(W - 1, x + EPAISSIR)
      for (let v = y0; v <= y1; v++) for (let u = x0; u <= x1; u++) {
        const e = exces[v * W + u]
        if (e > m) m = e
      }
      mur[y * W + x] = m
    }
  }

  const poids = new Float32Array(N)      // le mur nu, sans territoire : pour l'inspection
  const poidsF = new Float32Array(N)     // barème du fond
  const poidsM = new Float32Array(N)     // barème de la machine
  const rho = new Float32Array(N)
  for (let y = 0; y < H; y++) {
    const ny = (y - (H - 1) / 2) / (H / 2)
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const nx = (x - (W - 1) / 2) / (W / 2)
      const r = Math.min(1, Math.hypot(nx, ny))
      rho[i] = r
      const p = EPS + Math.min(PLAFOND, Math.pow(mur[i] / MUR, EXPO))
      poids[i] = p
      // Chaque camp avance au prix normal sur toute l'étendue où il est plausible, puis paie
      // de plus en plus cher au-delà. Sans franchise, la machine payait déjà le triple à mi-
      // rayon et n'atteignait plus ses propres roues ; avec, elle garde ses extrémités et une
      // fuite lointaine reste, elle, hors de prix. Le pire cas n'est donc pas une coulée
      // sauvage mais l'ellipse de la boîte.
      const av = Math.max(0, (r - FRANCHISE) / (1 - FRANCHISE))       // machine trop loin
      const ar = Math.max(0, (FRANCHISE - r) / FRANCHISE)             // fond trop au centre
      poidsF[i] = p * (1 + LAMBDA * ar * ar)
      poidsM[i] = p * (1 + LAMBDA * av * av)
    }
  }

  // ---- 4. germes
  const INF = 1e30
  const dFond = new Float64Array(N).fill(INF)
  const dMach = new Float64Array(N).fill(INF)
  const ep = Math.max(1, Math.round(ANNEAU * Math.min(W, H)))
  for (let y = 0; y < H; y++) {
    const dyb = Math.min(y, H - 1 - y)
    for (let x = 0; x < W; x++) {
      const dxb = Math.min(x, W - 1 - x)
      const i = y * W + x
      // Anneau de fond : gratuit dans les coins, payant au milieu d'une arête — la boîte
      // serre la machine, qui touche donc souvent le milieu d'une arête mais jamais un coin.
      if (dxb < ep || dyb < ep) {
        const u = Math.min(1, Math.max(dxb / (W / 2), dyb / (H / 2)))
        dFond[i] = PENAL_BORD * u
      }
    }
  }
  propager(dFond, poidsF, W, H)

  // ---- 5. germes de machine : l'ellipse centrale, moins ce que le fond atteint pour presque
  // rien (voir le point 3 de l'en-tête). Le seuil est en unités de mur : un germe de machine
  // doit être derrière au moins un mur plein, vu depuis la bordure.
  let germes = 0
  for (let i = 0; i < N; i++) {
    if (rho[i] <= RAYON_GERME && dFond[i] >= SEUIL_PROFOND && dFond[i] < 1e29) {
      dMach[i] = 0; germes++
    }
  }
  if (germes === 0) for (let i = 0; i < N; i++) if (rho[i] <= NOYAU_GERME) dMach[i] = 0
  propager(dMach, poidsM, W, H)

  // ---- 6. étiquetage puis nettoyage
  const lab = new Uint8Array(N)
  for (let i = 0; i < N; i++) lab[i] = dMach[i] * BIAIS < dFond[i] ? 1 : 0
  fermer(lab, W, H)
  garderComposanteCentrale(lab, W, H)
  rebouchercreux(lab, W, H)

  return { W, H, lab, poids, dFond, dMach }
}

// Flou de boîte séparable, somme glissante : coût indépendant du rayon.
function flou(src, W, H, r) {
  if (r < 1) return src
  const t = new Float32Array(W * H), o = new Float32Array(W * H)
  for (let y = 0; y < H; y++) {
    const l = y * W
    let s = 0, n = Math.min(r + 1, W)
    for (let x = 0; x < n; x++) s += src[l + x]
    for (let x = 0; x < W; x++) {
      t[l + x] = s / n
      const ent = x + r + 1, sor = x - r
      if (ent < W) { s += src[l + ent]; n++ }
      if (sor >= 0) { s -= src[l + sor]; n-- }
    }
  }
  for (let x = 0; x < W; x++) {
    let s = 0, n = Math.min(r + 1, H)
    for (let y = 0; y < n; y++) s += t[y * W + x]
    for (let y = 0; y < H; y++) {
      o[y * W + x] = s / n
      const ent = y + r + 1, sor = y - r
      if (ent < H) { s += t[ent * W + x]; n++ }
      if (sor >= 0) { s -= t[sor * W + x]; n-- }
    }
  }
  return o
}

const RAC2 = Math.SQRT2
function propager(D, poids, W, H) {
  for (let p = 0; p < PASSES; p++) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x
        let d = D[i]
        const wi = poids[i]
        if (y > 0) {
          const j = i - W, c = D[j] + (wi + poids[j]) * 0.5
          if (c < d) d = c
          if (x > 0) { const k = j - 1, c2 = D[k] + (wi + poids[k]) * 0.5 * RAC2; if (c2 < d) d = c2 }
          if (x < W - 1) { const k = j + 1, c2 = D[k] + (wi + poids[k]) * 0.5 * RAC2; if (c2 < d) d = c2 }
        }
        if (x > 0) { const j = i - 1, c = D[j] + (wi + poids[j]) * 0.5; if (c < d) d = c }
        D[i] = d
      }
    }
    for (let y = H - 1; y >= 0; y--) {
      for (let x = W - 1; x >= 0; x--) {
        const i = y * W + x
        let d = D[i]
        const wi = poids[i]
        if (y < H - 1) {
          const j = i + W, c = D[j] + (wi + poids[j]) * 0.5
          if (c < d) d = c
          if (x > 0) { const k = j - 1, c2 = D[k] + (wi + poids[k]) * 0.5 * RAC2; if (c2 < d) d = c2 }
          if (x < W - 1) { const k = j + 1, c2 = D[k] + (wi + poids[k]) * 0.5 * RAC2; if (c2 < d) d = c2 }
        }
        if (x < W - 1) { const j = i + 1, c = D[j] + (wi + poids[j]) * 0.5; if (c < d) d = c }
        D[i] = d
      }
    }
  }
}

// Fermeture morphologique d'une cellule : elle recolle les encoches d'une cellule laissées
// par une bande de mur un peu large, sans grossir la silhouette — dilater puis éroder.
function fermer(lab, W, H) {
  const d = new Uint8Array(W * H)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x
    let v = lab[i]
    if (!v) {
      if (x > 0 && lab[i - 1]) v = 1
      else if (x < W - 1 && lab[i + 1]) v = 1
      else if (y > 0 && lab[i - W]) v = 1
      else if (y < H - 1 && lab[i + W]) v = 1
    }
    d[i] = v
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x
    let v = d[i]
    if (v) {
      if (x > 0 && !d[i - 1]) v = 0
      else if (x < W - 1 && !d[i + 1]) v = 0
      else if (y > 0 && !d[i - W]) v = 0
      else if (y < H - 1 && !d[i + W]) v = 0
    }
    lab[i] = v
  }
}

// La machine est un seul objet : un îlot de « machine » détaché du centre est du décor qui a
// gagné son duel par accident.
function garderComposanteCentrale(lab, W, H) {
  const vu = new Uint8Array(W * H)
  const pile = new Int32Array(W * H)
  let n = 0
  const c = ((H >> 1) * W) + (W >> 1)
  let depart = -1
  if (lab[c]) depart = c
  else {
    let best = Infinity
    for (let i = 0; i < W * H; i++) {
      if (!lab[i]) continue
      const dx = (i % W) - (W >> 1), dy = ((i / W) | 0) - (H >> 1)
      const d = dx * dx + dy * dy
      if (d < best) { best = d; depart = i }
    }
  }
  if (depart < 0) return
  pile[n++] = depart; vu[depart] = 1
  while (n > 0) {
    const i = pile[--n]
    const x = i % W, y = (i / W) | 0
    if (x > 0 && lab[i - 1] && !vu[i - 1]) { vu[i - 1] = 1; pile[n++] = i - 1 }
    if (x < W - 1 && lab[i + 1] && !vu[i + 1]) { vu[i + 1] = 1; pile[n++] = i + 1 }
    if (y > 0 && lab[i - W] && !vu[i - W]) { vu[i - W] = 1; pile[n++] = i - W }
    if (y < H - 1 && lab[i + W] && !vu[i + W]) { vu[i + W] = 1; pile[n++] = i + W }
  }
  for (let i = 0; i < W * H; i++) if (lab[i] && !vu[i]) lab[i] = 0
}

// Un creux de fond enfermé dans la machine est un trou dans le réservoir : on le rebouche.
// Au-delà d'une certaine aire c'est du décor vu au travers (entre les roues) : on le garde.
function rebouchercreux(lab, W, H) {
  const vu = new Uint8Array(W * H)
  const pile = new Int32Array(W * H)
  const amas = new Int32Array(W * H)
  for (let s = 0; s < W * H; s++) {
    if (lab[s] || vu[s]) continue
    let n = 0, m = 0, touche = false
    pile[n++] = s; vu[s] = 1
    while (n > 0) {
      const i = pile[--n]
      amas[m++] = i
      const x = i % W, y = (i / W) | 0
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) touche = true
      if (x > 0 && !lab[i - 1] && !vu[i - 1]) { vu[i - 1] = 1; pile[n++] = i - 1 }
      if (x < W - 1 && !lab[i + 1] && !vu[i + 1]) { vu[i + 1] = 1; pile[n++] = i + 1 }
      if (y > 0 && !lab[i - W] && !vu[i - W]) { vu[i - W] = 1; pile[n++] = i - W }
      if (y < H - 1 && !lab[i + W] && !vu[i + W]) { vu[i + W] = 1; pile[n++] = i + W }
    }
    if (!touche && m < TROU_MAX * W * H) for (let k = 0; k < m; k++) lab[amas[k]] = 1
  }
}
