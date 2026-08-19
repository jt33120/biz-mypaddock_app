// Saillance de contours — une machine est un objet à forte densité de détail STRUCTURÉ.
//
// Le pari : ce qui distingue une moto d'un bas-côté, ce n'est pas sa couleur (une moto peut
// être noire sur du gravier gris) mais la quantité de contours qu'elle porte au centimètre
// carré — jante, disque, chaîne, té de fourche, stickers. Le fond est comparativement lisse :
// bitume, ciel, herbe floutée par la profondeur de champ.
//
// Le piège est connu d'avance, et la densité seule y tombe : gravier et feuillage sont
// texturés eux aussi, un vibreur et une ligne blanche sont des contours francs. On lit donc
// l'orientation des gradients À DEUX ÉCHELLES, et c'est le nerf de la variante :
//
//   • à l'échelle fine (tenseur de structure lissé sur ~16 px), on demande de la COHÉRENCE.
//     Un carénage, une jante, un échappement gardent la même direction sur des dizaines de
//     pixels ; une feuille, un caillou donnent du bruit isotrope où les orientations
//     s'annulent. Un gradient incohérent ne vote presque pas → le feuillage retombe.
//   • à l'échelle large (~56 px), on demande de la DIVERSITÉ de ces orientations. Une moto
//     mélange verticales de fourche, cercles de jante, diagonales de carénage. Une ligne
//     peinte, un vibreur, une crête de colline, un brin d'herbe filé par le mouvement n'ont
//     qu'une seule orientation sur toute leur longueur → ils tombent aussi, alors qu'ils
//     passaient la cohérence haut la main. Mesuré par |Σu|/Σ|u| en angle doublé, où deux
//     directions perpendiculaires s'annulent.
//
// Cette carte donne une bonne DÉCISION DE PRÉSENCE et un mauvais BORD : une densité est une
// somme sur une fenêtre, elle déborde donc de la moitié de sa fenêtre vers l'extérieur et
// rentre partout où la machine est lisse. Le bord est refait à part, par emballage : on inonde
// le fond depuis l'extérieur, l'eau est arrêtée par les contours francs, et tout ce qu'elle
// n'atteint pas est machine. C'est ce qui récupère un pneu noir — il ne porte aucun détail,
// mais il est derrière son contour — et ce qui rend le bitume sous la moto.
//
// Ce que la variante ne sait pas faire, mesuré sur le banc et pas supposé : une machine noire
// mate posée devant de la végétation en plein soleil porte MOINS de contours que son décor.
// La densité vote alors pour le décor, et aucun garde-fou géométrique en aval ne rattrape ça.

export const nom = 'saillance-contours'
export const description =
  'densité de contours pondérée par la cohérence d’orientation (échelle fine) et par sa ' +
  'diversité (échelle large), seuil d’Otsu à hystérésis, composante connexe centrale, puis ' +
  'bord refait par inondation du fond arrêtée aux contours francs.'

// Constantes globales et figées. Aucune ne dépend d'une photo : elles sont exprimées en
// fractions d'image ou en pixels de l'image normalisée à 1024 px d'arête par le pipeline.
const CELL = 4          // côté d'une cellule de décision, en px de demi-résolution (8 px réels)
const TENSOR_R = 4      // lissage du tenseur — échelle fine (16 px réels)
const DENS_R = 1        // lissage de densité, en cellules (fenêtre de 24 px réels)
const DIV_R = 3         // lissage des orientations, en cellules — échelle large (56 px réels)
const COH_POW = 3       // exposant sur la cohérence : punit le bruit isotrope au cube
const COH_PLANCHER = 0.08 // ce qu'un gradient parfaitement isotrope garde comme poids
const DIV_PLANCHER = 0.25 // ce qu'une zone à orientation unique garde comme poids
const PERC = 0.995      // percentile de normalisation de la densité
const OTSU_MIN = 0.14   // plancher : la machine est, par construction du recadrage, la
                        // chose la plus dense du cadre. Otsu qui descend plus bas s'est laissé
                        // convaincre par un fond texturé — on ne le suit pas.
const OTSU_MAX = 0.55   // au-dessus, Otsu s'est fait piéger
const HYST = 0.42       // seuil bas de l'hystérésis, en fraction du seuil d'Otsu
const HYST_N = 1        // portée de la croissance en hystérésis, en cellules
const OUV = 1           // rayon d'ouverture, en cellules
const FERM = 1          // rayon de fermeture, en cellules : juste de quoi recoller la
                        // dentelle, pas de quoi la transformer en pavé
const CENTRE_K = 3.0    // décroissance du poids de centralité pour élire la composante
const BANDE = 6         // largeur de la bande de recalage du bord, en cellules
const NOYAU_R = 2       // recul du noyau que l'eau ne peut pas franchir, en cellules. C'est
                        // exactement le débord que la fenêtre de densité ajoute autour du
                        // détail : on le rend à l'eau, et pas plus — un recul plus grand laisse
                        // une fuite dans un flanc lisse vider la moto par l'intérieur.
const PORTE = 2         // largeur de porte : les trous de la dentelle plus étroits que
                        // 2×PORTE cellules sont refermés — c'est de la machine lisse, pas du décor
const CONTOUR_FRAC = 0.06 // fraction des px de la bande retenus comme contour franc
const LISSE_PX = 2      // lissage final du bord, en px de demi-résolution

// --------------------------------------------------------------- filtre moyenneur séparable
function moyenner(src, w, h, r, dst) {
  const out = dst || new Float32Array(w * h)
  const tmp = new Float32Array(w * h)
  const inv = 1 / (2 * r + 1)
  for (let y = 0; y < h; y++) {
    const o = y * w
    let s = 0
    for (let k = -r; k <= r; k++) s += src[o + Math.min(w - 1, Math.max(0, k))]
    tmp[o] = s * inv
    for (let x = 1; x < w; x++) {
      s += src[o + Math.min(w - 1, x + r)] - src[o + Math.max(0, x - r - 1)]
      tmp[o + x] = s * inv
    }
  }
  for (let x = 0; x < w; x++) {
    let s = 0
    for (let k = -r; k <= r; k++) s += tmp[Math.min(h - 1, Math.max(0, k)) * w + x]
    out[x] = s * inv
    for (let y = 1; y < h; y++) {
      s += tmp[Math.min(h - 1, y + r) * w + x] - tmp[Math.max(0, y - r - 1) * w + x]
      out[y * w + x] = s * inv
    }
  }
  return out
}

// Dilatation / érosion à élément structurant carré, obtenues par moyenne de boîte : le bord
// de l'image est répliqué, donc un objet qui touche le cadre n'est pas rogné par le cadre.
function morpho(m, w, h, r, dilate) {
  const f = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) f[i] = m[i]
  const b = moyenner(f, w, h, r)
  const o = new Uint8Array(w * h)
  if (dilate) for (let i = 0; i < w * h; i++) o[i] = b[i] > 1e-4 ? 1 : 0
  else for (let i = 0; i < w * h; i++) o[i] = b[i] > 1 - 1e-4 ? 1 : 0
  return o
}
const dilater = (m, w, h, r) => morpho(m, w, h, r, true)
const eroder = (m, w, h, r) => morpho(m, w, h, r, false)

// -------------------------------------------------- bouchage des trous (inondation du fond)
// L'intérieur d'un carénage ou d'un réservoir n'a aucun contour, mais il est ceint par la
// silhouette : tout fond que le bord de l'image ne peut pas atteindre est un trou.
function boucher(m, w, h) {
  const vu = new Uint8Array(w * h)
  const pile = new Int32Array(w * h)
  let n = 0
  const pousser = (i) => { if (!m[i] && !vu[i]) { vu[i] = 1; pile[n++] = i } }
  for (let x = 0; x < w; x++) { pousser(x); pousser((h - 1) * w + x) }
  for (let y = 0; y < h; y++) { pousser(y * w); pousser(y * w + w - 1) }
  while (n > 0) {
    const i = pile[--n], x = i % w, y = (i / w) | 0
    if (x > 0) pousser(i - 1)
    if (x < w - 1) pousser(i + 1)
    if (y > 0) pousser(i - w)
    if (y < h - 1) pousser(i + w)
  }
  const o = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) o[i] = (m[i] || !vu[i]) ? 1 : 0
  return o
}

// Percentile par histogramme — déterministe, sans tri.
function percentile(v, n, p, masque) {
  let hi = 0
  for (let i = 0; i < n; i++) if ((!masque || masque[i]) && v[i] > hi) hi = v[i]
  if (hi <= 0) return 0
  const B = 512, hist = new Int32Array(B)
  let tot = 0
  for (let i = 0; i < n; i++) {
    if (masque && !masque[i]) continue
    hist[Math.min(B - 1, ((v[i] / hi) * (B - 1)) | 0)]++; tot++
  }
  let cum = 0
  for (let b = 0; b < B; b++) { cum += hist[b]; if (cum >= p * tot) return (b / (B - 1)) * hi }
  return hi
}

export function masque(px, w, h) {
  const plein = () => new Uint8Array(w * h).fill(1)
  const w2 = Math.max(1, w >> 1), h2 = Math.max(1, h >> 1)
  if (w2 < 8 * CELL || h2 < 8 * CELL) return plein()
  const n2 = w2 * h2

  // ---- 1. luminance en demi-résolution (moyenne 2×2 : ça débruite et ça divise par 4 le
  // coût de tout ce qui suit ; le grain du capteur ne doit pas passer pour du détail).
  const L = new Float32Array(n2)
  for (let y = 0; y < h2; y++) {
    const y0 = y * 2, y1 = Math.min(h - 1, y * 2 + 1)
    for (let x = 0; x < w2; x++) {
      const x0 = x * 2, x1 = Math.min(w - 1, x * 2 + 1)
      const a = (y0 * w + x0) * 4, b = (y0 * w + x1) * 4
      const c = (y1 * w + x0) * 4, d = (y1 * w + x1) * 4
      L[y * w2 + x] = 0.25 * (
        0.299 * (px[a] + px[b] + px[c] + px[d]) +
        0.587 * (px[a + 1] + px[b + 1] + px[c + 1] + px[d + 1]) +
        0.114 * (px[a + 2] + px[b + 2] + px[c + 2] + px[d + 2]))
    }
  }

  // ---- 2. Sobel + composantes du tenseur de structure
  const mag = new Float32Array(n2), GX = new Float32Array(n2), GY = new Float32Array(n2)
  const Jxx = new Float32Array(n2), Jyy = new Float32Array(n2), Jxy = new Float32Array(n2)
  for (let y = 1; y < h2 - 1; y++) {
    for (let x = 1; x < w2 - 1; x++) {
      const i = y * w2 + x
      const a = L[i - w2 - 1], b = L[i - w2], c = L[i - w2 + 1]
      const d = L[i - 1], f = L[i + 1]
      const g = L[i + w2 - 1], k = L[i + w2], l = L[i + w2 + 1]
      const gx = (c + 2 * f + l) - (a + 2 * d + g)
      const gy = (g + 2 * k + l) - (a + 2 * b + c)
      mag[i] = Math.sqrt(gx * gx + gy * gy)
      GX[i] = gx; GY[i] = gy
      Jxx[i] = gx * gx; Jyy[i] = gy * gy; Jxy[i] = gx * gy
    }
  }

  // ---- 3. échelle fine : cohérence d'orientation. Lisser le TENSEUR avant d'en tirer
  // l'angle est tout le truc — deux gradients opposés s'y annulent, deux gradients alignés
  // s'y renforcent. Feuillage bas, carénage haut.
  moyenner(Jxx, w2, h2, TENSOR_R, Jxx)
  moyenner(Jyy, w2, h2, TENSOR_R, Jyy)
  moyenner(Jxy, w2, h2, TENSOR_R, Jxy)
  const sail = new Float32Array(n2)
  const ux = new Float32Array(n2), uy = new Float32Array(n2)
  for (let i = 0; i < n2; i++) {
    const tr = Jxx[i] + Jyy[i]
    if (tr <= 1e-6) continue
    const dif = Jxx[i] - Jyy[i], cro = 2 * Jxy[i]
    const amp = Math.sqrt(dif * dif + cro * cro)
    let coh = amp / tr                         // 0 isotrope → 1 parfaitement aligné
    for (let p = 1; p < COH_POW; p++) coh *= amp / tr
    const s = mag[i] * (COH_PLANCHER + (1 - COH_PLANCHER) * coh)
    sail[i] = s
    // Orientation en angle DOUBLÉ : deux directions perpendiculaires s'y opposent, donc
    // leur somme s'annule. C'est ce qui permet de mesurer la diversité par une simple somme.
    if (amp > 1e-6) { ux[i] = s * dif / amp; uy[i] = s * cro / amp }
  }

  // ---- 3 bis. affinage des contours (suppression des non-maxima). Un contour mesuré par
  // Sobel est large de trois ou quatre pixels ; utilisé tel quel comme barrage à l'étape 9, il
  // bouche la bande entière et l'eau ne coule plus. On ne garde donc que la CRÊTE : le pixel
  // maximal dans la direction du gradient. Le barrage devient un liseré, étanche mais fin.
  const crete = new Uint8Array(n2)
  const TAN67 = 2.4142
  for (let y = 1; y < h2 - 1; y++) {
    for (let x = 1; x < w2 - 1; x++) {
      const i = y * w2 + x
      const gx = GX[i], gy = GY[i]
      const ax = gx < 0 ? -gx : gx, ay = gy < 0 ? -gy : gy
      let a, b
      if (ax > TAN67 * ay) { a = i - 1; b = i + 1 }
      else if (ay > TAN67 * ax) { a = i - w2; b = i + w2 }
      else if (gx * gy > 0) { a = i - w2 - 1; b = i + w2 + 1 }
      else { a = i - w2 + 1; b = i + w2 - 1 }
      if (mag[i] >= mag[a] && mag[i] >= mag[b]) crete[i] = 1
    }
  }

  // ---- 4. densité et diversité par cellule
  const gw = Math.max(1, Math.floor(w2 / CELL)), gh = Math.max(1, Math.floor(h2 / CELL))
  const ng = gw * gh
  const cs = new Float32Array(ng), cx = new Float32Array(ng), cy = new Float32Array(ng)
  for (let y = 0; y < h2; y++) {
    const gy = Math.min(gh - 1, (y / CELL) | 0) * gw
    for (let x = 0; x < w2; x++) {
      const g = gy + Math.min(gw - 1, (x / CELL) | 0), i = y * w2 + x
      cs[g] += sail[i]; cx[g] += ux[i]; cy[g] += uy[i]
    }
  }
  const dens = moyenner(cs, gw, gh, DENS_R)
  const ds = moyenner(cs, gw, gh, DIV_R)
  const dx = moyenner(cx, gw, gh, DIV_R)
  const dy = moyenner(cy, gw, gh, DIV_R)
  const pdiv = new Float32Array(ng)
  for (let i = 0; i < ng; i++) {
    // |Σ u| / Σ |u| vaut 1 pour une orientation unique (ligne peinte, vibreur, herbe filée)
    // et tend vers 0 dès que les directions se mélangent (une machine).
    const div = ds[i] > 1e-6 ? 1 - Math.min(1, Math.hypot(dx[i], dy[i]) / ds[i]) : 0
    pdiv[i] = DIV_PLANCHER + (1 - DIV_PLANCHER) * div
    dens[i] *= pdiv[i]
  }

  // ---- 5. normalisation par percentile (le max seul se fait voler par un reflet spéculaire)
  const ref = Math.max(1e-9, percentile(dens, ng, PERC, null))
  const norm = new Float32Array(ng)
  for (let i = 0; i < ng; i++) norm[i] = Math.min(1, dens[i] / ref)

  // ---- 6. seuil d'Otsu sur la densité normalisée
  const NB = 128, hn = new Int32Array(NB)
  for (let i = 0; i < ng; i++) hn[Math.min(NB - 1, (norm[i] * (NB - 1)) | 0)]++
  let somme = 0
  for (let b = 0; b < NB; b++) somme += b * hn[b]
  let sB = 0, wB = 0, meilleur = -1, bOtsu = 0
  for (let b = 0; b < NB; b++) {
    wB += hn[b]; if (wB === 0) continue
    const wF = ng - wB; if (wF === 0) break
    sB += b * hn[b]
    const mB = sB / wB, mF = (somme - sB) / wF
    const v = wB * wF * (mB - mF) * (mB - mF)
    if (v > meilleur) { meilleur = v; bOtsu = b }
  }
  const seuil = Math.min(OTSU_MAX, Math.max(OTSU_MIN, (bOtsu + 0.5) / (NB - 1)))

  // ---- 7. hystérésis. Un pneu noir, une bulle fumée, un flanc dans l'ombre portent peu de
  // contours : ils ne passent pas le seuil d'Otsu. Mais ils touchent ce qui le passe. On
  // part donc des cellules franches (ouvertes, pour ne pas propager depuis un caillou) et on
  // s'étend d'au plus HYST_N cellules dans les cellules faibles.
  let fort = new Uint8Array(ng), faible = new Uint8Array(ng)
  for (let i = 0; i < ng; i++) {
    fort[i] = norm[i] >= seuil ? 1 : 0
    faible[i] = norm[i] >= seuil * HYST ? 1 : 0
  }
  fort = dilater(eroder(fort, gw, gh, OUV), gw, gh, OUV)
  let m = fort
  for (let k = 0; k < HYST_N; k++) {
    const d = dilater(m, gw, gh, 1)
    const s = new Uint8Array(ng)
    for (let i = 0; i < ng; i++) s[i] = (m[i] || (d[i] && faible[i])) ? 1 : 0
    m = s
  }
  m = eroder(dilater(m, gw, gh, FERM), gw, gh, FERM)

  // ---- 8. composante connexe la plus dense au centre. Le recadrage amont garantit que la
  // machine est au centre du cadre : c'est ce qui rend ce choix légitime et non arbitraire.
  const etiq = new Int32Array(ng).fill(-1)
  const pile = new Int32Array(ng)
  let meilleurScore = -1, elu = -1, e = 0
  for (let d0 = 0; d0 < ng; d0++) {
    if (!m[d0] || etiq[d0] !== -1) continue
    let n = 0, score = 0
    pile[n++] = d0; etiq[d0] = e
    while (n > 0) {
      const i = pile[--n], x = i % gw, y = (i / gw) | 0
      const nx = (x / (gw - 1 || 1)) * 2 - 1, ny = (y / (gh - 1 || 1)) * 2 - 1
      score += norm[i] / (1 + CENTRE_K * (nx * nx + ny * ny))
      if (x > 0 && m[i - 1] && etiq[i - 1] === -1) { etiq[i - 1] = e; pile[n++] = i - 1 }
      if (x < gw - 1 && m[i + 1] && etiq[i + 1] === -1) { etiq[i + 1] = e; pile[n++] = i + 1 }
      if (y > 0 && m[i - gw] && etiq[i - gw] === -1) { etiq[i - gw] = e; pile[n++] = i - gw }
      if (y < gh - 1 && m[i + gw] && etiq[i + gw] === -1) { etiq[i + gw] = e; pile[n++] = i + gw }
    }
    if (score > meilleurScore) { meilleurScore = score; elu = e }
    e++
  }
  if (elu < 0) return plein()
  const dentelle = new Uint8Array(ng)
  for (let i = 0; i < ng; i++) dentelle[i] = etiq[i] === elu ? 1 : 0
  const reg = boucher(dentelle, gw, gh)

  // ---- 9. recalage du bord par emballage. Une densité est une somme sur une fenêtre : sa
  // frontière déborde vers l'extérieur de la moitié de la fenêtre, et rentre là où la machine
  // est lisse — d'où le bitume collé sous les pneus et les pneus mangés. On garde donc la
  // région comme DÉCISION DE PRÉSENCE, et on refait le bord autrement : le fond est inondé
  // depuis l'extérieur d'une bande élargie, et cette inondation est ARRÊTÉE par les contours
  // francs. Tout ce qu'elle n'atteint pas est machine.
  //
  // Deux bénéfices, et ce sont exactement les deux défauts d'une carte de densité :
  //   • le bord se cale au pixel sur le contour réel, pas sur la fenêtre de mesure ;
  //   • un pneu noir, un flanc lisse, l'intérieur d'une jante sont RÉCUPÉRÉS sans porter
  //     aucun détail, du seul fait d'être derrière le contour.
  // Là où la silhouette fuit (pneu noir sur bitume dans l'ombre), l'inondation entre — et
  // c'est le noyau dense qui l'arrête. La variante dégrade vers la région, elle ne casse pas.
  const bande = dilater(reg, gw, gh, BANDE)
  // Ce qui arrête l'eau, ce n'est PAS la région bouchée : c'est la DENTELLE qui l'a engendrée.
  // La différence est décisive. Le bouchage a rempli l'intérieur lisse d'un réservoir — c'est
  // de la machine — mais aussi le vide entre les deux roues et sous le moteur — c'est du
  // décor. Les deux sont des trous de la dentelle. Ce qui les sépare, c'est que le vide sous
  // la machine COMMUNIQUE avec l'extérieur, alors que l'intérieur d'un réservoir est clos par
  // son propre contour. En protégeant la dentelle plutôt que la région, on laisse l'eau entrer
  // par ces ouvertures et rendre le décor, sans jamais l'autoriser à franchir un contour.
  //
  // Reste à trancher lesquels de ces trous sont des ouvertures, et la taille est la mesure qui
  // les sépare : le vide entre les deux roues d'une moto est large de deux cents pixels, un
  // aplat de flanc entre deux détails en fait quarante. Une fermeture de PORTE cellules
  // referme les seconds et laisse les premiers béants.
  const noyau = eroder(eroder(dilater(dentelle, gw, gh, PORTE), gw, gh, PORTE), gw, gh, NOYAU_R)
  const bande2 = new Uint8Array(n2), noyau2 = new Uint8Array(n2)
  // Le mur qui arrête l'eau est fait de la MÊME matière que la densité : un gradient
  // cohérent DANS un voisinage à orientations variées. Sans quoi la ligne de crête d'une
  // colline, un grillage ou le bord d'un vibreur — contours francs mais à orientation
  // unique — feraient barrage et enfermeraient tout un pan de décor dans le masque.
  const sailD = new Float32Array(n2)
  for (let y = 0; y < h2; y++) {
    const gy = Math.min(gh - 1, (y / CELL) | 0) * gw
    for (let x = 0; x < w2; x++) {
      const g = gy + Math.min(gw - 1, (x / CELL) | 0), i = y * w2 + x
      bande2[i] = bande[g]; noyau2[i] = noyau[g]
      sailD[i] = sail[i] * pdiv[g]
    }
  }
  const tc = percentile(sailD, n2, 1 - CONTOUR_FRAC, bande2)
  const brut2 = new Uint8Array(n2)
  for (let i = 0; i < n2; i++) brut2[i] = (bande2[i] && crete[i] && sailD[i] >= tc) ? 1 : 0
  // Le barrage doit être étanche : un contour épais d'un pixel laisse passer l'eau en
  // diagonale. On l'épaissit d'un pixel et on inonde en 4-connexité.
  const mur = dilater(brut2, w2, h2, 1)
  const eau = new Uint8Array(n2)
  const pile2 = new Int32Array(n2)
  let n = 0
  for (let i = 0; i < n2; i++) if (!bande2[i]) { eau[i] = 1; pile2[n++] = i }
  const noyer = (i) => { if (!eau[i] && !mur[i] && !noyau2[i]) { eau[i] = 1; pile2[n++] = i } }
  while (n > 0) {
    const i = pile2[--n], x = i % w2, y = (i / w2) | 0
    if (x > 0) noyer(i - 1)
    if (x < w2 - 1) noyer(i + 1)
    if (y > 0) noyer(i - w2)
    if (y < h2 - 1) noyer(i + w2)
  }
  let fin = new Uint8Array(n2)
  for (let i = 0; i < n2; i++) fin[i] = eau[i] ? 0 : 1
  // Lissage morphologique du bord : fermeture puis ouverture. La première recolle les
  // dentelures que laisse un emballage arrêté par un liseré d'un pixel ; la seconde jette les
  // échardes — ces langues de deux pixels de large que l'eau abandonne entre deux contours
  // parallèles, et qui donnent des poils de décor accrochés à la silhouette.
  fin = eroder(dilater(fin, w2, h2, LISSE_PX), w2, h2, LISSE_PX)
  fin = dilater(eroder(fin, w2, h2, LISSE_PX), w2, h2, LISSE_PX)
  for (let i = 0; i < n2; i++) fin[i] = (fin[i] && bande2[i]) ? 1 : 0
  fin = boucher(fin, w2, h2)

  // ---- 10. remontée en pleine résolution (2 px de grain, plus fin que le bloc de rendu)
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    const o = Math.min(h2 - 1, y >> 1) * w2, d = y * w
    for (let x = 0; x < w; x++) out[d + x] = fin[o + Math.min(w2 - 1, x >> 1)]
  }
  return out
}
