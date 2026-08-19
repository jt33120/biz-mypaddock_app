// Seuil adaptatif — le FOND est appris, la machine est ce qui n'y ressemble pas.
//
// Pourquoi apprendre le fond plutôt que la moto : une moto peut être noire, rouge, blanche,
// chromée ou couverte d'autocollants — il n'existe aucune couleur « de moto ». Le décor,
// lui, est renseigné gratuitement par le recadrage : la boîte englobante serre la machine,
// donc l'anneau périphérique du recadré est du décor, et les QUATRE COINS en particulier
// (un objet inscrit dans sa boîte touche chaque bord en un point mais laisse les coins
// libres — vérifié sur les six photos du jeu).
//
// Tout se passe en Lab : en RGB brut, l'ombre d'une herbe verte est « une autre couleur »
// alors que c'est la même matière moins éclairée. Lab sépare la clarté de la chromie, ce qui
// permet de peser les deux séparément — et c'est ce réglage-là qui décide du sort d'une moto
// noire sur du bitume sombre.
//
// Trois choses ont été apprises en regardant les planches, et chacune est un morceau de code
// plutôt qu'une constante :
//
//   1. UN MODÈLE DE COULEUR NU CLASSE LA TEXTURE, PAS LA MATIÈRE. Sans lissage, chaque
//      feuille et chaque caillou sortait du modèle : la carte produite était une carte de
//      contours, et le feuillage entier comptait pour de la machine. On lisse le Lab avant de
//      juger, et le plancher d'écart-type dit « à moins de ça, c'est la même matière ».
//   2. UNE MATIÈRE A UN TERRITOIRE. Un ciel se dégrade du bleu franc au blanc de brume, un
//      bitume du gris clair au loin au gris sombre au premier plan. Chaque grappe porte donc
//      une carte de distance à l'endroit où elle a été vue : son rayon d'acceptation
//      s'élargit sur son territoire et se resserre ailleurs. Le ciel est toléré en haut,
//      jamais sous les roues.
//   3. L'ANNEAU EST CONTAMINÉ, ET LE CENTRE LE DIT. Sur IMG_8974 la valise noire touche le
//      bord gauche : l'anneau apprend le noir de la machine comme couleur de décor et tout le
//      carénage disparaît. Or une couleur de décor prise au bord est rare au centre du cadre,
//      tandis qu'une couleur de machine prise au bord RÈGNE au centre. On compare les deux
//      populations et on disqualifie la seconde.
//
// Enfin le modèle est appris DEUX FOIS. La première passe ne connaît du décor que ce que
// l'anneau en montre ; elle en trouve pourtant l'essentiel. La seconde le réapprend sur tout
// le fond trouvé — à condition qu'il touche le bord du cadre, ce qui exclut d'un coup les
// morceaux de machine avalés par erreur, qui sont enclavés. Une matière vue en un seul point
// du bord retrouve alors sa vraie étendue, sa vraie dispersion et son vrai territoire.

export const nom = 'seuil-adaptatif'
export const description =
  'modèle de couleur du décor appris sur l’anneau du recadré puis réappris sur le fond ' +
  'trouvé ; chaque matière a un territoire, et le centre du cadre disqualifie les couleurs ' +
  'de machine prises au bord.'

// Constantes GLOBALES et figées. Aucune n'est indexée sur une photo.
const CFG = Object.freeze({
  arete: 256,        // arête de travail : 1024/4, soit exactement la grille de blocs en aval
  // Lissage du Lab avant tout jugement. Une médiane 3×3 a été essayée à sa place, pour ne pas
  // inventer de couleur aux frontières : elle préserve trop bien le contraste d'un feuillage,
  // qui redevient un empilement de contrastes et ressort entier en « machine ». Le flou, lui,
  // intègre la texture d'un arbre ou d'un gravier en une matière moyenne — c'est ce qu'on veut
  // juger. Le prix est une bande de couleurs intermédiaires aux frontières, que l'ouverture
  // morphologique de l'étape 4 se charge de couper.
  flou: 2,

  bande: 0.13,       // largeur de l'anneau de bord, en fraction du petit côté
  coin: 0.24,        // côté des carrés de coin, en fraction du petit côté
  poidsBord: 0.30,   // un pixel de bord pèse moins qu'un pixel de coin

  grappes: 10,       // matières de décor modélisées (ciel, herbe, bitume, gravier, arbre…)
  iterations: 8,
  binL: 5, binC: 6,  // pavage du Lab pour condenser les échantillons avant le k-moyennes
  seuilBin: 0.002,   // un bac sous ce poids ne peut pas AMORCER une grappe (bruit, aberrant)

  poidsL: 1.0,       // clarté à parité avec la chromie : c'est ce qui sauve une moto noire
  // Plancher perceptuel de dispersion, et c'est la constante qui a le plus compté : avec dix
  // grappes, la dispersion INTERNE d'une grappe est minuscule par construction, et des
  // boules de ce rayon laissent des trous partout dans le nuage du décor — tout le feuillage
  // sortait alors du modèle. Le plancher dit « deux couleurs plus proches que ça sont la même
  // matière » ; le plafond laisse une matière franchement texturée s'élargir.
  sigmaLmin: 6.0, sigmaLmax: 16.0,
  sigmaCmin: 3.5, sigmaCmax: 9.0,
  seuil: 2.0,        // au-delà de tant d'écarts-types du fond, c'est de la machine

  refWeight: 0.07,   // part des échantillons au-delà de laquelle une grappe est crédible
  refFort: 0.15,     // part au-delà de laquelle une grappe est insoupçonnable
  noyau: 0.26,       // demi-étendue du noyau central, en fraction de l'image
  penCentre: 0.85,   // pénalité maximale d'une grappe qui règne au centre du cadre
  confMin: 0.25,     // rayon d'acceptation d'une grappe non crédible, en fraction du seuil

  supCell: 8,        // côté d'une cellule du champ de territoire, en pixels de travail
  supPoids: 3.0,     // poids minimal pour qu'une cellule compte comme territoire
  supPortee: 0.45,   // portée du territoire, en fraction du petit côté de l'image
  supMin: 0.75,      // hors de son territoire, une grappe ne garde que ce rayon-là

  reapprisMin: 0.10, // sous tant de fond sûr trouvé, une passe de plus n'a rien à apprendre
  reappris: 2,       // nombre de réapprentissages après la passe de l'anneau
  reapprisGain: 0.01,// on s'arrête quand une passe ne gagne plus tant de fond

  vote: 2,           // demi-côté du vote majoritaire anti-mouchetis (5×5)
  ouverture: 2,      // rayon d'ouverture : coupe les ponts fins entre machine et décor
  fermeture: 2,      // rayon de fermeture : recolle roue et carénage par-dessus les ajours
  finition: 1,       // fermeture de finition, après le choix de la silhouette
  centrage: 0.55,    // pénalité de bord dans le choix de la composante retenue
})

// ---------------------------------------------------------------- sRGB → linéaire → Lab
const LIN = new Float32Array(256)
for (let i = 0; i < 256; i++) {
  const c = i / 255
  LIN[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}
const F = (t) => (t > 0.008856451679 ? Math.cbrt(t) : 7.787037037 * t + 0.137931034)
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v)

// Flou box 3×3, appliqué au Lab et au champ de territoire.
function flou(a, w, h, passes) {
  if (passes <= 0) return
  const t = new Float32Array(w * h)
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) {
      const y0 = y > 0 ? y - 1 : 0, y2 = y < h - 1 ? y + 1 : h - 1
      for (let x = 0; x < w; x++) {
        const x0 = x > 0 ? x - 1 : 0, x2 = x < w - 1 ? x + 1 : w - 1
        t[y * w + x] = (a[y0 * w + x0] + a[y0 * w + x] + a[y0 * w + x2]
          + a[y * w + x0] + a[y * w + x] + a[y * w + x2]
          + a[y2 * w + x0] + a[y2 * w + x] + a[y2 * w + x2]) / 9
      }
    }
    a.set(t)
  }
}
// -------------------------------------------------------------- morphologie séparable
// Bord répliqué : la machine touche souvent le cadre (photo de piste serrée), un bord traité
// comme du fond la raboterait.
function dilater(m, w, h, r) {
  if (r <= 0) return m
  const t = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    const o = y * w
    for (let x = 0; x < w; x++) {
      let v = 0
      for (let k = -r; k <= r && !v; k++) if (m[o + clamp(x + k, 0, w - 1)]) v = 1
      t[o + x] = v
    }
  }
  const u = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let v = 0
      for (let k = -r; k <= r && !v; k++) if (t[clamp(y + k, 0, h - 1) * w + x]) v = 1
      u[y * w + x] = v
    }
  }
  return u
}
function eroder(m, w, h, r) {
  if (r <= 0) return m
  const inv = new Uint8Array(w * h)
  for (let i = 0; i < m.length; i++) inv[i] = m[i] ? 0 : 1
  const d = dilater(inv, w, h, r)
  const o = new Uint8Array(w * h)
  for (let i = 0; i < d.length; i++) o[i] = d[i] ? 0 : 1
  return o
}
function majorite(m, w, h, r) {
  const o = new Uint8Array(w * h)
  const lim = ((2 * r + 1) * (2 * r + 1)) / 2
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let n = 0
      for (let dy = -r; dy <= r; dy++) {
        const yy = clamp(y + dy, 0, h - 1)
        for (let dx = -r; dx <= r; dx++) n += m[yy * w + clamp(x + dx, 0, w - 1)]
      }
      o[y * w + x] = n > lim ? 1 : 0
    }
  }
  return o
}

// -------------------------------------------------------------------- composantes 4-connexes
function composantes(m, w, h, valeur) {
  const lab = new Int32Array(w * h).fill(-1)
  const pile = new Int32Array(w * h)
  const bord = []
  let n = 0
  for (let s = 0; s < w * h; s++) {
    if (m[s] !== valeur || lab[s] !== -1) continue
    let haut = 0
    pile[haut++] = s
    lab[s] = n
    let touche = false
    while (haut > 0) {
      const i = pile[--haut]
      const x = i % w, y = (i / w) | 0
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) touche = true
      if (x > 0 && m[i - 1] === valeur && lab[i - 1] === -1) { lab[i - 1] = n; pile[haut++] = i - 1 }
      if (x < w - 1 && m[i + 1] === valeur && lab[i + 1] === -1) { lab[i + 1] = n; pile[haut++] = i + 1 }
      if (y > 0 && m[i - w] === valeur && lab[i - w] === -1) { lab[i - w] = n; pile[haut++] = i - w }
      if (y < h - 1 && m[i + w] === valeur && lab[i + w] === -1) { lab[i + w] = n; pile[haut++] = i + w }
    }
    bord.push(touche)
    n++
  }
  return { lab, bord, n }
}

// ============================================================================= le masque
export function masque(px, w, h) {
  const plein = () => new Uint8Array(w * h).fill(1)
  if (w < 32 || h < 32) return plein()

  // ---- 1. grille de travail : moyenne en lumière linéaire, puis Lab, puis lissage
  const pas = Math.max(1, Math.round(Math.max(w, h) / CFG.arete))
  const ww = Math.max(1, Math.floor(w / pas)), hh = Math.max(1, Math.floor(h / pas))
  const n = ww * hh
  if (ww < 12 || hh < 12) return plein()
  const cL = new Float32Array(n), cA = new Float32Array(n), cB = new Float32Array(n)
  for (let gy = 0; gy < hh; gy++) {
    const y1 = Math.min(h, (gy + 1) * pas)
    for (let gx = 0; gx < ww; gx++) {
      const x1 = Math.min(w, (gx + 1) * pas)
      let r = 0, v = 0, b = 0, c = 0
      for (let y = gy * pas; y < y1; y++) {
        let i = (y * w + gx * pas) * 4
        for (let x = gx * pas; x < x1; x++, i += 4) {
          r += LIN[px[i]]; v += LIN[px[i + 1]]; b += LIN[px[i + 2]]; c++
        }
      }
      r /= c; v /= c; b /= c
      const fx = F((0.4124564 * r + 0.3575761 * v + 0.1804375 * b) / 0.950470)
      const fy = F(0.2126729 * r + 0.7151522 * v + 0.0721750 * b)
      const fz = F((0.0193339 * r + 0.1191920 * v + 0.9503041 * b) / 1.088830)
      const o = gy * ww + gx
      cL[o] = 116 * fy - 16
      cA[o] = 500 * (fx - fy)
      cB[o] = 200 * (fy - fz)
    }
  }
  flou(cL, ww, hh, CFG.flou)
  flou(cA, ww, hh, CFG.flou)
  flou(cB, ww, hh, CFG.flou)

  const cxg = (ww - 1) / 2, cyg = (hh - 1) / 2
  const K0 = CFG.grappes
  const wk = CFG.poidsL
  const d2 = (l, a, b, l2, a2, b2) => {
    const dl = l - l2, da = a - a2, db = b - b2
    return wk * dl * dl + da * da + db * db
  }

  // ------------------------------------------------------------------------------------
  // Apprendre un modèle de fond sur une liste d'échantillons pondérés, puis classer toute
  // l'image avec. C'est le cœur, et il est appelé deux fois.
  // ------------------------------------------------------------------------------------
  function classer(ech, pds, m) {
    if (m < K0 * 12) return null

    // -- condenser en bacs Lab : la vitesse, et un bac de poids ridicule n'amorcera pas une
    //    grappe (sinon chacune part sur un aberrant et le modèle de fond devient un modèle
    //    de bruit).
    const NC = Math.ceil(256 / CFG.binC)
    const carte = new Map()
    const bW = [], bL = [], bA = [], bB = [], bQL = [], bQA = [], bQB = []
    const bacDe = new Int32Array(m)
    for (let j = 0; j < m; j++) {
      const i = ech[j], p = pds[j]
      const kl = clamp(Math.floor(cL[i] / CFG.binL), 0, 40)
      const ka = clamp(Math.floor((cA[i] + 128) / CFG.binC), 0, NC - 1)
      const kb = clamp(Math.floor((cB[i] + 128) / CFG.binC), 0, NC - 1)
      const cle = (kl * NC + ka) * NC + kb
      let id = carte.get(cle)
      if (id === undefined) {
        id = bW.length
        carte.set(cle, id)
        bW.push(0); bL.push(0); bA.push(0); bB.push(0); bQL.push(0); bQA.push(0); bQB.push(0)
      }
      bacDe[j] = id
      bW[id] += p
      bL[id] += p * cL[i]; bA[id] += p * cA[i]; bB[id] += p * cB[i]
      bQL[id] += p * cL[i] * cL[i]; bQA[id] += p * cA[i] * cA[i]; bQB[id] += p * cB[i] * cB[i]
    }
    const nb = bW.length
    let wTot = 0
    for (let i = 0; i < nb; i++) wTot += bW[i]
    const mL = new Float64Array(nb), mA = new Float64Array(nb), mB = new Float64Array(nb)
    for (let i = 0; i < nb; i++) { mL[i] = bL[i] / bW[i]; mA[i] = bA[i] / bW[i]; mB[i] = bB[i] / bW[i] }

    // -- k-moyennes pondéré, amorçage par points les plus éloignés (déterministe)
    const K = Math.min(K0, nb)
    const gL = new Float64Array(K), gA = new Float64Array(K), gB = new Float64Array(K)
    const amorcable = []
    for (let i = 0; i < nb; i++) if (bW[i] >= CFG.seuilBin * wTot) amorcable.push(i)
    if (amorcable.length === 0) return null
    {
      let sl = 0, sa = 0, sb = 0, sw = 0
      for (const i of amorcable) { sl += mL[i] * bW[i]; sa += mA[i] * bW[i]; sb += mB[i] * bW[i]; sw += bW[i] }
      sl /= sw; sa /= sw; sb /= sw
      const proche = new Float64Array(amorcable.length).fill(Infinity)
      let choix = 0, dMax = -1
      for (let q = 0; q < amorcable.length; q++) {
        const i = amorcable[q]
        const d = d2(mL[i], mA[i], mB[i], sl, sa, sb)
        if (d > dMax) { dMax = d; choix = q }
      }
      for (let k = 0; k < K; k++) {
        const i = amorcable[choix]
        gL[k] = mL[i]; gA[k] = mA[i]; gB[k] = mB[i]
        dMax = -1
        let suivant = choix
        for (let q = 0; q < amorcable.length; q++) {
          const j = amorcable[q]
          const d = d2(mL[j], mA[j], mB[j], gL[k], gA[k], gB[k])
          if (d < proche[q]) proche[q] = d
          if (proche[q] > dMax) { dMax = proche[q]; suivant = q }
        }
        choix = suivant
      }
    }
    const affBac = new Int32Array(nb)
    for (let it = 0; it < CFG.iterations; it++) {
      let bouge = 0
      for (let i = 0; i < nb; i++) {
        let best = 0, bd = Infinity
        for (let k = 0; k < K; k++) {
          const d = d2(mL[i], mA[i], mB[i], gL[k], gA[k], gB[k])
          if (d < bd) { bd = d; best = k }
        }
        if (affBac[i] !== best) { affBac[i] = best; bouge++ }
      }
      const sl = new Float64Array(K), sa = new Float64Array(K), sb = new Float64Array(K), sw = new Float64Array(K)
      for (let i = 0; i < nb; i++) {
        const k = affBac[i]
        sl[k] += bL[i]; sa[k] += bA[i]; sb[k] += bB[i]; sw[k] += bW[i]
      }
      for (let k = 0; k < K; k++) if (sw[k] > 0) { gL[k] = sl[k] / sw[k]; gA[k] = sa[k] / sw[k]; gB[k] = sb[k] / sw[k] }
      if (bouge === 0) break
    }

    // -- dispersion et poids de chaque grappe
    const qL = new Float64Array(K), qA = new Float64Array(K), qB = new Float64Array(K)
    const sl = new Float64Array(K), sa = new Float64Array(K), sb = new Float64Array(K), sw = new Float64Array(K)
    for (let i = 0; i < nb; i++) {
      const k = affBac[i]
      sl[k] += bL[i]; sa[k] += bA[i]; sb[k] += bB[i]; sw[k] += bW[i]
      qL[k] += bQL[i]; qA[k] += bQA[i]; qB[k] += bQB[i]
    }
    const sigL = new Float64Array(K), sigA = new Float64Array(K), sigB = new Float64Array(K)
    for (let k = 0; k < K; k++) {
      const p = sw[k] > 0 ? sw[k] : 1
      const mo = sl[k] / p, ma = sa[k] / p, mb = sb[k] / p
      sigL[k] = clamp(Math.sqrt(Math.max(0, qL[k] / p - mo * mo)), CFG.sigmaLmin, CFG.sigmaLmax)
      sigA[k] = clamp(Math.sqrt(Math.max(0, qA[k] / p - ma * ma)), CFG.sigmaCmin, CFG.sigmaCmax)
      sigB[k] = clamp(Math.sqrt(Math.max(0, qB[k] / p - mb * mb)), CFG.sigmaCmin, CFG.sigmaCmax)
    }

    // -- contre-modèle du noyau central : qui règne au milieu du cadre est de la machine
    const centre = new Float64Array(K)
    {
      const ax = CFG.noyau * ww, ay = CFG.noyau * hh
      const y0 = Math.max(0, Math.ceil(cyg - ay)), y1 = Math.min(hh - 1, Math.floor(cyg + ay))
      const x0 = Math.max(0, Math.ceil(cxg - ax)), x1 = Math.min(ww - 1, Math.floor(cxg + ax))
      let tot = 0
      for (let y = y0; y <= y1; y++) {
        const uy = (y - cyg) / ay
        for (let x = x0; x <= x1; x++) {
          const ux = (x - cxg) / ax
          const rr = Math.sqrt(ux * ux + uy * uy)
          if (rr > 1) continue
          const p = 1 - rr
          const i = y * ww + x
          let best = 0, bd = Infinity
          for (let k = 0; k < K; k++) {
            const d = d2(cL[i], cA[i], cB[i], gL[k], gA[k], gB[k])
            if (d < bd) { bd = d; best = k }
          }
          centre[best] += p
          tot += p
        }
      }
      if (tot > 0) for (let k = 0; k < K; k++) centre[k] /= tot
    }

    // -- crédibilité : ce que la grappe pèse, moins le soupçon d'être de la machine. Le
    //    soupçon ne joue que sur les grappes légères : une matière qui occupe un gros morceau
    //    des échantillons reste du décor même si la machine en porte la teinte — un pneu noir
    //    sur bitume sombre ne doit pas disqualifier le bitume.
    const conf = new Float64Array(K), rayon = new Float64Array(K)
    for (let k = 0; k < K; k++) {
      const part = wTot > 0 ? sw[k] / wTot : 0
      const soupcon = (centre[k] / (centre[k] + part + 1e-6)) * Math.max(0, 1 - part / CFG.refFort)
      conf[k] = Math.min(1, part / CFG.refWeight) * (1 - CFG.penCentre * soupcon)
      rayon[k] = CFG.seuil * (CFG.confMin + (1 - CFG.confMin) * conf[k])
    }

    // -- territoire de chaque grappe : distance aux cellules où elle a été vue, puis
    //    décroissance en cloche. Une distance et non une diffusion : la portée devient un
    //    réglage lisible au lieu d'un effet de bord du nombre de passes.
    const CC = CFG.supCell
    const SX = Math.max(3, Math.ceil(ww / CC)), SY = Math.max(3, Math.ceil(hh / CC))
    const nsc = SX * SY
    const occ = new Float32Array(K * nsc)
    for (let j = 0; j < m; j++) {
      const i = ech[j]
      const k = affBac[bacDe[j]]
      const sx = clamp(((i % ww) / CC) | 0, 0, SX - 1)
      const sy = clamp((((i / ww) | 0) / CC) | 0, 0, SY - 1)
      occ[k * nsc + sy * SX + sx] += pds[j]
    }
    const GRAND = 1e9
    const sup = new Float32Array(K * nsc)
    const dt = new Float32Array(nsc)
    const portee = CFG.supPortee * Math.min(ww, hh)
    for (let k = 0; k < K; k++) {
      for (let i = 0; i < nsc; i++) dt[i] = occ[k * nsc + i] >= CFG.supPoids ? 0 : GRAND
      for (let y = 0; y < SY; y++) for (let x = 0; x < SX; x++) {
        const i = y * SX + x
        let v = dt[i]
        if (x > 0 && dt[i - 1] + 1 < v) v = dt[i - 1] + 1
        if (y > 0 && dt[i - SX] + 1 < v) v = dt[i - SX] + 1
        if (x > 0 && y > 0 && dt[i - SX - 1] + 1.4142 < v) v = dt[i - SX - 1] + 1.4142
        if (x < SX - 1 && y > 0 && dt[i - SX + 1] + 1.4142 < v) v = dt[i - SX + 1] + 1.4142
        dt[i] = v
      }
      for (let y = SY - 1; y >= 0; y--) for (let x = SX - 1; x >= 0; x--) {
        const i = y * SX + x
        let v = dt[i]
        if (x < SX - 1 && dt[i + 1] + 1 < v) v = dt[i + 1] + 1
        if (y < SY - 1 && dt[i + SX] + 1 < v) v = dt[i + SX] + 1
        if (x < SX - 1 && y < SY - 1 && dt[i + SX + 1] + 1.4142 < v) v = dt[i + SX + 1] + 1.4142
        if (x > 0 && y < SY - 1 && dt[i + SX - 1] + 1.4142 < v) v = dt[i + SX - 1] + 1.4142
        dt[i] = v
      }
      for (let i = 0; i < nsc; i++) {
        if (dt[i] >= GRAND) { sup[k * nsc + i] = 0; continue }
        const u = (dt[i] * CC) / portee
        sup[k * nsc + i] = Math.exp(-0.5 * u * u)
      }
    }

    // -- classement
    const out = new Uint8Array(n)
    for (let gy = 0; gy < hh; gy++) {
      const fy = clamp(gy / CC - 0.5, 0, SY - 1)
      const y0 = fy | 0, y1 = Math.min(SY - 1, y0 + 1), ty = fy - y0
      for (let gx = 0; gx < ww; gx++) {
        const fx = clamp(gx / CC - 0.5, 0, SX - 1)
        const x0 = fx | 0, x1 = Math.min(SX - 1, x0 + 1), tx = fx - x0
        const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty), w01 = (1 - tx) * ty, w11 = tx * ty
        const o00 = y0 * SX + x0, o10 = y0 * SX + x1, o01 = y1 * SX + x0, o11 = y1 * SX + x1
        const i = gy * ww + gx
        const l = cL[i], a = cA[i], b = cB[i]
        let fg = 1
        for (let k = 0; k < K; k++) {
          const base = k * nsc
          const s = sup[base + o00] * w00 + sup[base + o10] * w10 + sup[base + o01] * w01 + sup[base + o11] * w11
          const r = rayon[k] * (CFG.supMin + (1 - CFG.supMin) * s)
          const dl = (l - gL[k]) / sigL[k], da = (a - gA[k]) / sigA[k], db = (b - gB[k]) / sigB[k]
          if (wk * dl * dl + da * da + db * db < r * r) { fg = 0; break }
        }
        out[i] = fg
      }
    }
    return out
  }

  // ---- 2. passe 1 : échantillons de l'anneau de bord, coins surpondérés
  const petit = Math.min(ww, hh)
  const bande = Math.max(2, Math.round(CFG.bande * petit))
  const coin = Math.max(bande, Math.round(CFG.coin * petit))
  const ech = new Int32Array(n), pds = new Float32Array(n)
  let m1 = 0
  for (let gy = 0; gy < hh; gy++) {
    for (let gx = 0; gx < ww; gx++) {
      const dx = Math.min(gx, ww - 1 - gx), dy = Math.min(gy, hh - 1 - gy)
      const dansCoin = dx < coin && dy < coin
      if (!dansCoin && Math.min(dx, dy) >= bande) continue
      ech[m1] = gy * ww + gx
      pds[m1] = dansCoin ? 1 : CFG.poidsBord
      m1++
    }
  }
  let mk = classer(ech, pds, m1)
  if (!mk) return plein()
  mk = majorite(mk, ww, hh, CFG.vote)

  // ---- 3. passe 2 : réapprendre sur le fond trouvé, à condition qu'il TOUCHE LE BORD.
  // C'est cette condition qui rend la seconde passe sûre : un morceau de machine avalé par
  // erreur en passe 1 est enclavé dans la silhouette, il n'entre donc pas dans le nouvel
  // échantillon et ne se renforce pas. On érode d'un cran pour ne pas apprendre les pixels de
  // frontière, qui sont des mélanges.
  for (let t = 0; t < CFG.reappris; t++) {
    const cf = composantes(mk, ww, hh, 0)
    const fond = new Uint8Array(n)
    for (let i = 0; i < n; i++) {
      const k = cf.lab[i]
      if (k >= 0 && cf.bord[k]) fond[i] = 1
    }
    const sur = eroder(fond, ww, hh, 1)
    let m2 = 0
    for (let i = 0; i < n; i++) if (sur[i]) { ech[m2] = i; pds[m2] = 1; m2++ }
    if (m2 < CFG.reapprisMin * n) break
    const mk2 = classer(ech, pds, m2)
    if (!mk2) break
    const suiv = majorite(mk2, ww, hh, CFG.vote)
    let avant = 0, apres = 0
    for (let i = 0; i < n; i++) { avant += mk[i]; apres += suiv[i] }
    mk = suiv
    // Le fond ne fait que grandir d'une passe à l'autre ; quand il ne grandit plus, le modèle
    // a convergé et une passe de plus ne coûterait que du temps.
    if (avant - apres < CFG.reapprisGain * n) break
  }

  // ---- 4. nettoyage morphologique
  mk = dilater(eroder(mk, ww, hh, CFG.ouverture), ww, hh, CFG.ouverture)
  mk = eroder(dilater(mk, ww, hh, CFG.fermeture), ww, hh, CFG.fermeture)

  // ---- 5. une seule silhouette : la composante la plus grosse, pondérée vers le centre
  const cc = composantes(mk, ww, hh, 1)
  if (cc.n === 0) return plein()
  const score = new Float64Array(cc.n)
  for (let i = 0; i < n; i++) {
    const k = cc.lab[i]
    if (k < 0) continue
    const dx = ((i % ww) - cxg) / (cxg || 1), dy = (((i / ww) | 0) - cyg) / (cyg || 1)
    const r = Math.min(1, Math.sqrt(dx * dx + dy * dy))
    score[k] += 1 - CFG.centrage * r
  }
  let garde = 0
  for (let k = 1; k < cc.n; k++) if (score[k] > score[garde]) garde = k
  let out = new Uint8Array(n)
  for (let i = 0; i < n; i++) out[i] = cc.lab[i] === garde ? 1 : 0
  // Fermeture de finition APRÈS le choix de la silhouette : ici elle ne peut plus souder du
  // décor à la machine, elle ne fait que lisser le bord.
  out = eroder(dilater(out, ww, hh, CFG.finition), ww, hh, CFG.finition)

  // ---- 6. boucher les trous : un fond enclavé (ajour de jante, fente de carénage) est de la
  // machine pour le rendu — un vrai trou laisserait passer le damier au milieu du réservoir,
  // ce qui se lit toujours comme un bug.
  const tr = composantes(out, ww, hh, 0)
  for (let i = 0; i < n; i++) {
    const k = tr.lab[i]
    if (k >= 0 && !tr.bord[k]) out[i] = 1
  }

  // ---- 7. remonter à la grille pixel
  const fin = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    const gy = Math.min(hh - 1, (y / pas) | 0)
    const o = gy * ww, oy = y * w
    for (let x = 0; x < w; x++) fin[oy + x] = out[o + Math.min(ww - 1, (x / pas) | 0)]
  }
  return fin
}
