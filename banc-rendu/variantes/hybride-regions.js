// hybride-régions — sur-segmentation, puis classement de régions entières.
//
// Pourquoi ne pas décider pixel par pixel : tout seuil pixel produit du poivre-et-sel — un
// rayon de roue clair passe pour du fond, une pierre du gravier pour de la machine. On décide
// donc par RÉGION. L'image est d'abord sur-segmentée en quelques centaines de taches compactes
// et homogènes (SLIC), et une tache est machine ou fond EN ENTIER. Les frontières du masque
// sont alors, par construction, des frontières de couleur de l'image.
//
// QUATRE INDICES, dont aucun ne suffit :
//
//   1. BARRIÈRE DE COULEUR AU BORD. Pour aller du bord du cadre à une tache il faut franchir
//      des écarts de couleur ; on retient le chemin dont le PLUS GRAND écart est le plus
//      petit — un goulot, pas une somme. Le détail compte : une somme s'accumule dans le
//      feuillage, chaque pas d'une feuille à l'autre coûte, et un arbre finit aussi « loin du
//      bord » qu'une moto. Un goulot, non. Un léger terme d'accumulation reste ajouté, sinon
//      une longue chaîne sans contraste laisserait fuir le bitume jusqu'au moteur.
//   2. DEUX MODÈLES DE COULEUR AJUSTÉS PAR ITÉRATION. La bande extérieure du cadre est du
//      décor presque à coup sûr : on en tire des modes. Puis les taches déjà tranchées
//      fournissent un modèle de machine ET un modèle de fond, et tout est reclassé sur
//      l'écart des deux distances. Trois tours.
//   3. CENTRALITÉ. La boîte englobante amont a serré la machine au centre. Indice faible.
//   4. DIFFUSION SUR LE GRAPHE DES RÉGIONS, et c'est elle qui a fait basculer la variante.
//      Les trois premiers indices ne savent pas distinguer une touffe de feuillage ensoleillée
//      cernée d'ombre — barrière maximale, couleur de décor — d'un pneu noir au milieu de la
//      machine — barrière maximale, couleur de bitume. Les deux ont le même profil. Ce qui
//      les sépare est ailleurs : le pneu est entouré de machine, la touffe est entourée de
//      décor. On lisse donc le score le long du graphe, avec un poids par arête qui décroît
//      avec l'écart de couleur : l'avis circule à l'intérieur d'une zone homogène et s'arrête
//      sur un contour franc. Une tache isolée est ramenée à l'avis de son voisinage.
//
// Deux idées ont été essayées et ABANDONNÉES, et le dire vaut mieux que de le taire :
//   — le CONTRASTE INTERNE d'une tache, censé séparer une surface peinte d'un feuillage. Mesuré,
//     il classe la moto du mauvais côté : à 424 px d'arête, une machine (décalcomanies, rayons,
//     ailettes de moteur, combinaison du pilote) est BEAUCOUP plus textuée qu'un bitume ou qu'un
//     gazon flou d'arrière-plan. L'indice existe, il est juste orienté à l'envers ici.
//   — la métrique du graphe prise comme le MINIMUM de sa mesure nette et de sa mesure floue.
//     Plus conservatrice sur le papier ; en pratique elle affaiblit la silhouette sur les photos
//     de piste, où la moto floutée se confond par endroits avec le bas-côté.
//
// Rien n'est réglé par photo. Les constantes sont globales et figées ; les modes de couleur
// sont MESURÉS dans l'image, ce qui n'est pas un réglage mais le contraire d'un réglage.

export const nom = 'hybride-régions'
export const description =
  'SLIC en ~500 taches, puis chaque tache entière est jugée : barrière de couleur au bord, modèles machine/fond ajustés par itération, centralité, et diffusion du verdict sur le graphe des régions.'

// ------------------------------------------------------------------ constantes globales
const S_TRAVAIL = 424   // arête de travail — la grille aval n'en fait que 256
const K_CIBLE = 520     // nombre de taches visé
const COMPACITE = 10    // poids de la position face à la couleur dans SLIC (unités Lab)
const ITER = 6          // itérations de k-moyennes
const BANDE = 0.07      // épaisseur de la bande de bordure, en part du petit côté
const PART_MODE = 0.012 // un mode doit peser au moins 1,2 % de sa classe
const BRUIT_LAB = 2.5   // en dessous, un écart de couleur est du bruit : il ne coûte rien
const ACC = 0.22        // part d'accumulation ajoutée au goulot (anti-fuite)
const G_REF = 17        // barrière qui vaut « franchement détaché » (unités Lab)
const B_REF = 26        // écart de couleur qui vaut « rien à voir » (amorçage seulement)
const SIG_MOD = 11      // largeur d'un mode de couleur, en unités Lab
const LR_REF = 2.5      // rapport de vraisemblance (en log) qui vaut un avis tranché
const P_GEO = 0.45, P_APP = 0.40, P_CENTRE = 0.15
const PORTE = 0.55      // la couleur ne vaut son plein poids que derrière une barrière
const FLOU = 0.55       // rayon du flou de la MÉTRIQUE du graphe, en part du pas SLIC
// Aucun seuil absolu : il est LU dans la distribution des scores (Otsu, pondéré par l'aire
// des régions). Un seuil en dur était le point faible de la variante — chaque retouche de
// poids décalait le niveau général du score et le seuil ne tombait plus au bon endroit, si
// bien qu'on réglait deux choses à la fois sans le savoir. Otsu cherche la coupure qui sépare
// le mieux deux populations : il suit le niveau tout seul.
const MARGE = 0.14      // en part de l'étendue des scores : seuls les avis tranchés votent
const TOURS = 3         // raffinements du couple de modèles
const SIGMA = 10        // écart de couleur au-delà duquel une arête ne conduit plus (Lab)
const BETA = 1.2        // force du lissage face au terme de données
const LISSAGES = 8      // tours de diffusion
const TROU_MAX = 0.10   // un trou de fond enclavé plus petit que ça est rebouché
const BRIN_MIN = 0.28   // un morceau de machine détaché survit s'il pèse ça du principal
const NB = 8            // bacs par axe des histogrammes Lab

// LUT sRGB → linéaire : 256 entrées valent mieux que 3·n appels à Math.pow.
const LIN = new Float32Array(256)
for (let i = 0; i < 256; i++) {
  const c = i / 255
  LIN[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}
const fLab = (t) => t > 0.008856452 ? Math.cbrt(t) : 7.787037 * t + 0.13793103
const bacDe = (l, a, b) =>
  Math.min(NB - 1, Math.max(0, (l * NB / 100) | 0)) * NB * NB +
  Math.min(NB - 1, Math.max(0, ((a + 64) * NB / 128) | 0)) * NB +
  Math.min(NB - 1, Math.max(0, ((b + 64) * NB / 128) | 0))

export function masque(px, w, h) {
  // ------------------------------------------------------- 1. réduire, et passer en Lab
  // Lab parce que toute la suite est une affaire de DISTANCES de couleur : en RVB le même
  // écart numérique vaut un abîme dans les sombres et rien dans les clairs, et aucun seuil
  // ne serait transposable d'une photo à l'autre.
  const kk = Math.min(1, S_TRAVAIL / Math.max(w, h))
  const sw = Math.max(16, Math.round(w * kk)), sh = Math.max(16, Math.round(h * kk))
  const n = sw * sh
  const L = new Float32Array(n), A = new Float32Array(n), Bc = new Float32Array(n)
  for (let y = 0; y < sh; y++) {
    const y0 = (y * h / sh) | 0, y1 = Math.max(y0 + 1, ((y + 1) * h / sh) | 0)
    for (let x = 0; x < sw; x++) {
      const x0 = (x * w / sw) | 0, x1 = Math.max(x0 + 1, ((x + 1) * w / sw) | 0)
      let r = 0, g = 0, b = 0, c = 0
      for (let yy = y0; yy < y1; yy++) {
        let i = (yy * w + x0) * 4
        for (let xx = x0; xx < x1; xx++) { r += LIN[px[i]]; g += LIN[px[i + 1]]; b += LIN[px[i + 2]]; c++; i += 4 }
      }
      r /= c; g /= c; b /= c
      const fx = fLab((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047)
      const fy = fLab(0.2126 * r + 0.7152 * g + 0.0722 * b)
      const fz = fLab((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883)
      const i0 = y * sw + x
      L[i0] = 116 * fy - 16; A[i0] = 500 * (fx - fy); Bc[i0] = 200 * (fy - fz)
    }
  }

  // ------------------------------------------------------- 2. SLIC : la sur-segmentation
  const pas = Math.max(4, Math.round(Math.sqrt(n / K_CIBLE)))
  const gx = Math.max(1, Math.floor(sw / pas)), gy = Math.max(1, Math.floor(sh / pas))
  const nk = gx * gy
  const cL = new Float32Array(nk), cA = new Float32Array(nk), cB = new Float32Array(nk)
  const cX = new Float32Array(nk), cY = new Float32Array(nk)
  for (let j = 0; j < gy; j++) for (let i = 0; i < gx; i++) {
    const k = j * gx + i
    cX[k] = (i + 0.5) * sw / gx; cY[k] = (j + 0.5) * sh / gy
    const p = Math.min(sh - 1, cY[k] | 0) * sw + Math.min(sw - 1, cX[k] | 0)
    cL[k] = L[p]; cA[k] = A[p]; cB[k] = Bc[p]
  }
  const poidsPos = (COMPACITE * COMPACITE) / (pas * pas)
  const etiq = new Int32Array(n), dmin = new Float32Array(n)
  const sL = new Float64Array(nk), sA = new Float64Array(nk), sB = new Float64Array(nk)
  const sX = new Float64Array(nk), sY = new Float64Array(nk), sN = new Float64Array(nk)
  for (let it = 0; it < ITER; it++) {
    dmin.fill(1e30); etiq.fill(-1)
    for (let k = 0; k < nk; k++) {
      const kx = cX[k], ky = cY[k], kl = cL[k], ka = cA[k], kb = cB[k]
      const x0 = Math.max(0, Math.round(kx) - pas), x1 = Math.min(sw - 1, Math.round(kx) + pas)
      const y0 = Math.max(0, Math.round(ky) - pas), y1 = Math.min(sh - 1, Math.round(ky) + pas)
      for (let y = y0; y <= y1; y++) {
        const dy = y - ky, dy2 = dy * dy
        let i = y * sw + x0
        for (let x = x0; x <= x1; x++, i++) {
          const dl = L[i] - kl, da = A[i] - ka, db = Bc[i] - kb, dx = x - kx
          const d = dl * dl + da * da + db * db + (dx * dx + dy2) * poidsPos
          if (d < dmin[i]) { dmin[i] = d; etiq[i] = k }
        }
      }
    }
    for (let i = 0; i < n; i++) if (etiq[i] < 0) etiq[i] = i > 0 ? etiq[i - 1] : 0
    if (it === ITER - 1) break
    sL.fill(0); sA.fill(0); sB.fill(0); sX.fill(0); sY.fill(0); sN.fill(0)
    for (let y = 0, i = 0; y < sh; y++) for (let x = 0; x < sw; x++, i++) {
      const k = etiq[i]
      sL[k] += L[i]; sA[k] += A[i]; sB[k] += Bc[i]; sX[k] += x; sY[k] += y; sN[k]++
    }
    for (let k = 0; k < nk; k++) if (sN[k] > 0) {
      cL[k] = sL[k] / sN[k]; cA[k] = sA[k] / sN[k]; cB[k] = sB[k] / sN[k]
      cX[k] = sX[k] / sN[k]; cY[k] = sY[k] / sN[k]
    }
  }

  // -------------------------- 3. rendre les taches CONNEXES, et absorber les miettes
  // SLIC laisse des fragments orphelins portant l'étiquette d'une tache lointaine, et le
  // graphe qui suit suppose qu'une région est connexe. Un seul balayage suffit : on inonde
  // chaque tache en retenant au passage l'étiquette FINALE d'une voisine déjà close ; si la
  // tache est trop petite pour avoir une couleur moyenne fiable, elle est versée dedans.
  const reg = new Int32Array(n).fill(-1)
  const pile = new Int32Array(n), bloc = new Int32Array(n)
  const aireMin = Math.max(4, (pas * pas / 6) | 0)
  let nr = 0
  for (let d = 0; d < n; d++) {
    if (reg[d] >= 0) continue
    const e = etiq[d]
    let t = 0, m = 0, colle = -1
    pile[t++] = d; reg[d] = nr; bloc[m++] = d
    while (t > 0) {
      const i = pile[--t], x = i % sw, y = (i / sw) | 0
      let j
      if (x > 0) { j = i - 1; if (reg[j] < 0) { if (etiq[j] === e) { reg[j] = nr; pile[t++] = j; bloc[m++] = j } } else if (reg[j] !== nr) colle = reg[j] }
      if (x < sw - 1) { j = i + 1; if (reg[j] < 0) { if (etiq[j] === e) { reg[j] = nr; pile[t++] = j; bloc[m++] = j } } else if (reg[j] !== nr) colle = reg[j] }
      if (y > 0) { j = i - sw; if (reg[j] < 0) { if (etiq[j] === e) { reg[j] = nr; pile[t++] = j; bloc[m++] = j } } else if (reg[j] !== nr) colle = reg[j] }
      if (y < sh - 1) { j = i + sw; if (reg[j] < 0) { if (etiq[j] === e) { reg[j] = nr; pile[t++] = j; bloc[m++] = j } } else if (reg[j] !== nr) colle = reg[j] }
    }
    if (m < aireMin && colle >= 0) { for (let q = 0; q < m; q++) reg[bloc[q]] = colle }
    else nr++
  }

  // -------------------------------------------------- 4. caractéristiques par région
  const rN = new Float64Array(nr), rL = new Float64Array(nr), rA = new Float64Array(nr)
  const rB = new Float64Array(nr), rX = new Float64Array(nr), rY = new Float64Array(nr)
  const rBord = new Uint8Array(nr)
  for (let y = 0, i = 0; y < sh; y++) for (let x = 0; x < sw; x++, i++) {
    const r = reg[i]
    rN[r]++; rL[r] += L[i]; rA[r] += A[i]; rB[r] += Bc[i]; rX[r] += x; rY[r] += y
    if (x === 0 || y === 0 || x === sw - 1 || y === sh - 1) rBord[r] = 1
  }
  for (let r = 0; r < nr; r++) { rL[r] /= rN[r]; rA[r] /= rN[r]; rB[r] /= rN[r]; rX[r] /= rN[r]; rY[r] /= rN[r] }

  // ------------------- 4 bis. la MÉTRIQUE du graphe se mesure sur une image FLOUTÉE
  // Et c'est le correctif qui a débloqué les photos d'arbres. Le feuillage est une texture à
  // fort contraste : d'une feuille au soleil à son ombre, l'écart de couleur vaut celui d'un
  // carénage sur le ciel. Toute distance au bord — somme ou goulot — voit donc un arbre aussi
  // « détaché » qu'une moto. Floutée au rayon d'une demi-tache, la frondaison redevient une
  // masse verte continue, reliée au bord du cadre à coût presque nul, tandis que la
  // silhouette de la machine, elle, est une arête de grande échelle : le flou ne l'efface pas.
  const rFlou = Math.max(2, Math.round(pas * FLOU))
  const Lb = flouter(L, sw, sh, rFlou), Ab = flouter(A, sw, sh, rFlou), Bb = flouter(Bc, sw, sh, rFlou)
  const qL = new Float64Array(nr), qA = new Float64Array(nr), qB = new Float64Array(nr)
  for (let i = 0; i < n; i++) { const r = reg[i]; qL[r] += Lb[i]; qA[r] += Ab[i]; qB[r] += Bb[i] }
  for (let r = 0; r < nr; r++) { qL[r] /= rN[r]; qA[r] /= rN[r]; qB[r] /= rN[r] }

  // --------------------- 5. graphe des régions : longueur de bord partagée par arête
  const part = new Map()
  for (let y = 0, i = 0; y < sh; y++) for (let x = 0; x < sw; x++, i++) {
    const a = reg[i]
    if (x < sw - 1) { const b = reg[i + 1]; if (b !== a) { const c = a < b ? a * nr + b : b * nr + a; part.set(c, (part.get(c) || 0) + 1) } }
    if (y < sh - 1) { const b = reg[i + sw]; if (b !== a) { const c = a < b ? a * nr + b : b * nr + a; part.set(c, (part.get(c) || 0) + 1) } }
  }
  const deg = new Int32Array(nr)
  for (const c of part.keys()) { deg[(c / nr) | 0]++; deg[c % nr]++ }
  const dep = new Int32Array(nr + 1)
  for (let r = 0; r < nr; r++) dep[r + 1] = dep[r] + deg[r]
  const ne = dep[nr]
  const vois = new Int32Array(ne), vLen = new Float32Array(ne), vDist = new Float32Array(ne)
  const curseur = dep.slice(0, nr)
  for (const [c, p] of part) {
    const a = (c / nr) | 0, b = c % nr
    // Écart mesuré sur les moyennes FLOUTÉES : c'est la métrique du graphe (cf. 4 bis).
    const dl = qL[a] - qL[b], da = qA[a] - qA[b], db = qB[a] - qB[b]
    const d = Math.sqrt(dl * dl + da * da + db * db)
    let q = curseur[a]++; vois[q] = b; vLen[q] = p; vDist[q] = d
    q = curseur[b]++; vois[q] = a; vLen[q] = p; vDist[q] = d
  }

  // ------------------------------------ 6. barrière de couleur au bord (indice de chemin)
  // Dijkstra où le coût d'un chemin vaut max(arêtes) + ACC·somme(arêtes) — goulot d'abord.
  const geo = new Float64Array(nr).fill(Infinity)
  const tas = [], tasD = []
  let nt = 0
  const pousser = (r, d) => {
    let i = nt++
    tas[i] = r; tasD[i] = d
    while (i > 0) {
      const p = (i - 1) >> 1
      if (tasD[p] <= tasD[i]) break
      const tr = tas[p], td = tasD[p]; tas[p] = tas[i]; tasD[p] = tasD[i]; tas[i] = tr; tasD[i] = td
      i = p
    }
  }
  for (let r = 0; r < nr; r++) if (rBord[r]) { geo[r] = 0; pousser(r, 0) }
  while (nt > 0) {
    const r = tas[0], d = tasD[0]
    nt--
    if (nt > 0) {
      tas[0] = tas[nt]; tasD[0] = tasD[nt]
      let i = 0
      for (;;) {
        let m = i; const g = 2 * i + 1, dr = g + 1
        if (g < nt && tasD[g] < tasD[m]) m = g
        if (dr < nt && tasD[dr] < tasD[m]) m = dr
        if (m === i) break
        const tr = tas[m], td = tasD[m]; tas[m] = tas[i]; tasD[m] = tasD[i]; tas[i] = tr; tasD[i] = td
        i = m
      }
    }
    if (d > geo[r] + 1e-9) continue
    for (let q = dep[r]; q < dep[r + 1]; q++) {
      const v = vois[q], c = Math.max(0, vDist[q] - BRUIT_LAB)
      const nd = Math.max(d, c) + ACC * c
      if (nd < geo[v] - 1e-9) { geo[v] = nd; pousser(v, nd) }
    }
  }

  // ------------------- 7. modèle de couleur de la bordure, puis les deux modèles ajustés
  // Tout bac d'histogramme qui pèse ≥ 1,2 % de la bande extérieure devient un mode de fond.
  // Un bout de machine qui affleure le cadre pèse moins que ça et disparaît de lui-même.
  const t = Math.max(2, Math.round(BANDE * Math.min(sw, sh)))
  const hc = new Float64Array(NB ** 3), hL = new Float64Array(NB ** 3)
  const hA = new Float64Array(NB ** 3), hB = new Float64Array(NB ** 3)
  let nBande = 0
  for (let y = 0, i = 0; y < sh; y++) for (let x = 0; x < sw; x++, i++) {
    if (x >= t && y >= t && x < sw - t && y < sh - t) continue
    const u = bacDe(L[i], A[i], Bc[i])
    hc[u]++; hL[u] += L[i]; hA[u] += A[i]; hB[u] += Bc[i]; nBande++
  }
  const modesBande = []
  for (let u = 0; u < hc.length; u++) if (hc[u] >= PART_MODE * nBande)
    modesBande.push(hL[u] / hc[u], hA[u] / hc[u], hB[u] / hc[u], hc[u] / nBande)
  if (!modesBande.length) modesBande.push(50, 0, 0, 1)

  // Indices invariants : chemin + centralité.
  const prior = new Float64Array(nr)
  for (let r = 0; r < nr; r++) {
    const gN = Math.min(1, (geo[r] === Infinity ? G_REF : geo[r]) / G_REF)
    const dx = (rX[r] / (sw - 1)) * 2 - 1, dy = (rY[r] / (sh - 1)) * 2 - 1
    const cN = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy))
    prior[r] = P_GEO * gN + P_CENTRE * cN
  }
  const dMin = (modes, l, a, b) => {
    let m = Infinity
    for (let q = 0; q < modes.length; q += 4) {
      const dl = l - modes[q], da = a - modes[q + 1], db = b - modes[q + 2]
      const d = dl * dl + da * da + db * db
      if (d < m) m = d
    }
    return Math.sqrt(m)
  }
  // Vraisemblance sous un mélange de modes, chacun pesé par sa MASSE. La distance au mode le
  // plus proche, elle, mentait : avec vingt modes, tout est proche de l'un d'eux, et un modèle
  // de machine bâti sur vingt modes acceptait le décor. Le mélange rend au poids son rôle.
  const V2 = 2 * SIG_MOD * SIG_MOD
  const vrais = (modes, l, a, b) => {
    let p = 0
    for (let q = 0; q < modes.length; q += 4) {
      const dl = l - modes[q], da = a - modes[q + 1], db = b - modes[q + 2]
      p += modes[q + 3] * Math.exp(-(dl * dl + da * da + db * db) / V2)
    }
    return p
  }

  // Poids de diffusion : longueur du bord partagé, éteinte par l'écart de couleur.
  const vW = new Float32Array(ne)
  for (let q = 0; q < ne; q++) vW[q] = vLen[q] * Math.exp(-vDist[q] / SIGMA)

  const donnee = new Float64Array(nr), score = new Float64Array(nr), tmp = new Float64Array(nr)
  const diffuser = () => {
    score.set(donnee)
    for (let it = 0; it < LISSAGES; it++) {
      for (let r = 0; r < nr; r++) {
        let sw2 = 0, ss = 0
        for (let q = dep[r]; q < dep[r + 1]; q++) { const p = vW[q]; sw2 += p; ss += p * score[vois[q]] }
        tmp[r] = sw2 > 0 ? (donnee[r] + BETA * ss / sw2) / (1 + BETA) : donnee[r]
      }
      score.set(tmp)
    }
  }
  const porte = new Float64Array(nr)
  for (let r = 0; r < nr; r++) {
    const gN = Math.min(1, (geo[r] === Infinity ? G_REF : geo[r]) / G_REF)
    porte[r] = P_APP * (PORTE + (1 - PORTE) * gN)
  }
  for (let r = 0; r < nr; r++)
    donnee[r] = prior[r] + porte[r] * Math.min(1, dMin(modesBande, rL[r], rA[r], rB[r]) / B_REF)
  diffuser()

  // Trois tours : les avis tranchés nourrissent un modèle de machine et un modèle de fond,
  // tout est reclassé sur l'écart des deux distances, et on relisse.
  for (let tour = 0; tour < TOURS; tour++) {
    const s0 = otsu(score, rN, nr)
    let lo = Infinity, hi = -Infinity
    for (let r = 0; r < nr; r++) { if (score[r] < lo) lo = score[r]; if (score[r] > hi) hi = score[r] }
    const m = MARGE * (hi - lo)
    const mFg = modesDe(nr, rL, rA, rB, rN, score, s0 + m, +1)
    const mBg = modesDe(nr, rL, rA, rB, rN, score, s0 - m, -1)
    if (!mFg.length || !mBg.length) break
    for (let q = 0; q < modesBande.length; q++) mBg.push(modesBande[q])
    for (let r = 0; r < nr; r++) {
      const pF = vrais(mFg, rL[r], rA[r], rB[r]), pB = vrais(mBg, rL[r], rA[r], rB[r])
      const lr = Math.log((pF + 1e-7) / (pB + 1e-7)) / LR_REF
      donnee[r] = prior[r] + porte[r] * (0.5 + 0.5 * Math.max(-1, Math.min(1, lr)))
    }
    diffuser()
  }
  const seuil = otsu(score, rN, nr)
  const machine = new Uint8Array(nr)
  for (let r = 0; r < nr; r++) machine[r] = score[r] > seuil ? 1 : 0
  // ------------------------ 8. connexité au centre, puis rebouchage des trous enclavés
  const grp = grouper(nr, dep, vois, machine, 1, rN)
  const rCentre = reg[(sh >> 1) * sw + (sw >> 1)]
  let racine = machine[rCentre] ? grp.id[rCentre] : -1
  if (racine < 0) { let best = -1; for (let g = 0; g < grp.n; g++) if (best < 0 || grp.aire[g] > grp.aire[best]) best = g; racine = best }
  const aireP = racine >= 0 ? grp.aire[racine] : 0
  for (let r = 0; r < nr; r++)
    if (machine[r] && grp.id[r] !== racine && grp.aire[grp.id[r]] < BRIN_MIN * aireP) machine[r] = 0
  // Un paquet de fond qui ne touche pas le cadre et reste petit est de la machine : c'est le
  // trou dans le réservoir, ou le reflet clair au milieu d'un carénage sombre.
  const grpF = grouper(nr, dep, vois, machine, 0, rN)
  const touche = new Uint8Array(grpF.n)
  for (let r = 0; r < nr; r++) if (!machine[r] && rBord[r]) touche[grpF.id[r]] = 1
  for (let r = 0; r < nr; r++)
    if (!machine[r] && !touche[grpF.id[r]] && grpF.aire[grpF.id[r]] < TROU_MAX * n) machine[r] = 1

  // ------------------------------------------------------- 9. remonter en pleine grille
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    const sy = Math.min(sh - 1, (y * sh / h) | 0) * sw
    for (let x = 0; x < w; x++) out[y * w + x] = machine[reg[sy + Math.min(sw - 1, (x * sw / w) | 0)]]
  }
  return out
}

// Seuil d'Otsu sur l'histogramme des scores pondéré par l'aire : la coupure qui maximise la
// variance inter-classes. Rien à régler, et le résultat suit le niveau du score.
function otsu(score, poids, nr) {
  let lo = Infinity, hi = -Infinity
  for (let r = 0; r < nr; r++) { if (score[r] < lo) lo = score[r]; if (score[r] > hi) hi = score[r] }
  if (!(hi - lo > 1e-9)) return lo
  const NBIN = 64, h = new Float64Array(NBIN)
  let tot = 0
  for (let r = 0; r < nr; r++) {
    const u = Math.min(NBIN - 1, ((score[r] - lo) / (hi - lo) * NBIN) | 0)
    h[u] += poids[r]; tot += poids[r]
  }
  let mu = 0
  for (let u = 0; u < NBIN; u++) mu += u * h[u]
  mu /= tot
  let w0 = 0, s0 = 0, best = -1, uBest = NBIN >> 1
  for (let u = 0; u < NBIN - 1; u++) {
    w0 += h[u]; s0 += u * h[u]
    const w1 = tot - w0
    if (w0 <= 0 || w1 <= 0) continue
    const m0 = s0 / w0, m1 = (mu * tot - s0) / w1
    const v = w0 * w1 * (m0 - m1) * (m0 - m1)
    if (v > best) { best = v; uBest = u }
  }
  return lo + (uBest + 1) * (hi - lo) / NBIN
}

// Flou boîte séparable, en somme glissante : O(n) quel que soit le rayon.
function flouter(src, sw, sh, r) {
  const a = new Float32Array(src.length), b = new Float32Array(src.length)
  for (let y = 0; y < sh; y++) {
    const o = y * sw
    let s = 0
    for (let x = 0; x <= Math.min(sw - 1, r); x++) s += src[o + x]
    let cnt = Math.min(sw - 1, r) + 1
    for (let x = 0; x < sw; x++) {
      a[o + x] = s / cnt
      const sortant = x - r, entrant = x + r + 1
      if (entrant < sw) { s += src[o + entrant]; cnt++ }
      if (sortant >= 0) { s -= src[o + sortant]; cnt-- }
    }
  }
  for (let x = 0; x < sw; x++) {
    let s = 0
    for (let y = 0; y <= Math.min(sh - 1, r); y++) s += a[y * sw + x]
    let cnt = Math.min(sh - 1, r) + 1
    for (let y = 0; y < sh; y++) {
      b[y * sw + x] = s / cnt
      const sortant = y - r, entrant = y + r + 1
      if (entrant < sh) { s += a[entrant * sw + x]; cnt++ }
      if (sortant >= 0) { s -= a[sortant * sw + x]; cnt-- }
    }
  }
  return b
}

// Modes de couleur d'une classe : histogramme Lab pondéré par l'aire des régions dont le
// score est du bon côté du seuil. Un mode doit peser PART_MODE de sa classe.
function modesDe(nr, rL, rA, rB, rN, score, seuil, sens) {
  const hc = new Float64Array(NB ** 3), hL = new Float64Array(NB ** 3)
  const hA = new Float64Array(NB ** 3), hB = new Float64Array(NB ** 3)
  let tot = 0
  for (let r = 0; r < nr; r++) {
    if (sens > 0 ? score[r] <= seuil : score[r] >= seuil) continue
    const u = bacDe(rL[r], rA[r], rB[r]), p = rN[r]
    hc[u] += p; hL[u] += rL[r] * p; hA[u] += rA[r] * p; hB[u] += rB[r] * p; tot += p
  }
  const modes = []
  if (!tot) return modes
  for (let u = 0; u < hc.length; u++) if (hc[u] >= PART_MODE * tot)
    modes.push(hL[u] / hc[u], hA[u] / hc[u], hB[u] / hc[u], hc[u] / tot)
  return modes
}

// Composantes connexes du graphe de régions, restreintes à l'étiquette `val`. L'aire est
// comptée en PIXELS, pas en régions : deux miettes ne valent pas un carénage.
function grouper(nr, dep, vois, etat, val, rN) {
  const id = new Int32Array(nr).fill(-1)
  const aire = []
  const p = new Int32Array(nr)
  let ng = 0
  for (let s = 0; s < nr; s++) {
    if (etat[s] !== val || id[s] >= 0) continue
    let t = 0; p[t++] = s; id[s] = ng; let a = 0
    while (t > 0) {
      const r = p[--t]; a += rN[r]
      for (let q = dep[r]; q < dep[r + 1]; q++) { const v = vois[q]; if (etat[v] === val && id[v] < 0) { id[v] = ng; p[t++] = v } }
    }
    aire.push(a); ng++
  }
  return { id, aire, n: ng }
}
