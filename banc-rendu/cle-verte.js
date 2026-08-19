// Détachement du fond vert commandé à v3. Déterministe, local, une centaine de lignes —
// à comparer aux cinq approches qui ont échoué à détourer une photo de paddock. La différence
// n'est pas l'algorithme, c'est qu'on a choisi le fond au lieu de le subir.
//
// Trois passes, et la troisième est celle qui manquait au premier essai : le modèle éclaire la
// machine avec le fond, donc il pose un liseré vert SUR le carénage. Un simple seuil laisse
// cette frange, très visible sur un carénage rouge et pire encore sur une machine noire.
const VERT = [0x00, 0xE0, 0x00]

export function detacher(source, { tolerance = 104, adoucir = 30, eroder = 1 } = {}) {
  const w = source.width ?? source.naturalWidth
  const h = source.height ?? source.naturalHeight
  const c = new OffscreenCanvas(w, h)
  const cx = c.getContext('2d', { willReadFrequently: true })
  cx.drawImage(source, 0, 0)
  const d = cx.getImageData(0, 0, w, h)
  const p = d.data
  const n = w * h
  const alpha = new Uint8ClampedArray(n)

  // Passe 1 — l'alpha. La distance au vert-clé ne suffit pas : un pixel très sombre en est
  // proche sans être du fond. On exige donc que le vert DOMINE les deux autres canaux.
  for (let i = 0; i < n; i++) {
    const r = p[i * 4], v = p[i * 4 + 1], b = p[i * 4 + 2]
    const dist = Math.hypot(r - VERT[0], v - VERT[1], b - VERT[2])
    const domine = v > r + 20 && v > b + 20
    let a = 255
    if (domine) {
      if (dist < tolerance) a = 0
      else if (dist < tolerance + adoucir) a = Math.round(255 * (dist - tolerance) / adoucir)
    }
    alpha[i] = a
  }

  // Passe 2 — érosion. Le pixel de bord est un mélange du fond et de la machine : le garder
  // opaque revient à garder du vert. On sacrifie une couronne d'un pixel, ce qui est invisible
  // à l'écran et supprime la frange.
  for (let k = 0; k < eroder; k++) {
    const copie = alpha.slice()
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x
        if (!copie[i]) continue
        const bord = x === 0 || y === 0 || x === w - 1 || y === h - 1
          || !copie[i - 1] || !copie[i + 1] || !copie[i - w] || !copie[i + w]
        if (bord) alpha[i] = 0
      }
    }
  }

  // Passe 3 — dévert, PARTOUT et non seulement sur les bords adoucis. Le modèle utilise le fond
  // comme source de lumière : le liseré vert est sur la machine, dans des pixels parfaitement
  // opaques. On rabat la composante verte sur le maximum des deux autres là où elle les dépasse
  // franchement. Le seuil de 14 protège les verts LÉGITIMES d'une décoration, et la condition
  // sur le bleu protège le turquoise du sabot, qui a du vert mais autant de bleu.
  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let i = 0; i < n; i++) {
    const a = alpha[i]
    p[i * 4 + 3] = a
    if (a <= 8) continue
    const r = p[i * 4], v = p[i * 4 + 1], b = p[i * 4 + 2]
    if (v > r + 14 && v > b + 14) p[i * 4 + 1] = Math.max(r, b)
    const x = i % w, y = (i / w) | 0
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  }
  cx.putImageData(d, 0, 0)

  // Recadrage sur l'étendue non transparente : la machine remplit la scène de l'application,
  // elle ne flotte pas dans la marge que le modèle a laissée.
  if (x1 < x0 || y1 < y0) return { canvas: c, w, h, vide: true }
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1
  const out = new OffscreenCanvas(cw, ch)
  out.getContext('2d').drawImage(c, x0, y0, cw, ch, 0, 0, cw, ch)
  return { canvas: out, w: cw, h: ch, couverture: +((cw * ch) / (w * h)).toFixed(3) }
}
