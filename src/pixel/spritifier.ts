import { BITS_CLASSE, COULEURS_MAX, ECART_TEINTE_MIN, GRILLE, TOLERANCE_FOND } from './reglages'

/**
 * DE L'APPARENCE DU PIXEL À UN VRAI SPRITE — la moitié gratuite du pipeline.
 *
 * Sondé au banc : une image qui a l'air d'un sprite 128×128 à 26 couleurs en
 * contient 60 138. LE MODÈLE REND UN LOOK, PAS UNE STRUCTURE. C'est la même
 * leçon que le damier qu'il peignait quand on lui demandait un canal alpha.
 * Ce qui doit être structurel se produit donc en aval, par du code — et par du
 * code, c'est déterministe, hors ligne, et gratuit.
 *
 * Quatre passes, dans cet ordre et pour ces raisons :
 *   1. RAMENER À LA GRILLE par la couleur MODALE de chaque cellule, jamais la
 *      moyenne : une moyenne invente des teintes intermédiaires et rend le
 *      sprite flou, la modale garde des aplats francs.
 *   2. DÉTACHER le fond par inondation depuis les bords. Le contour fermé du
 *      sprite arrête l'inondation, donc rien ne fuit à l'intérieur.
 *   3. QUANTIFIER en fusionnant les couleurs proches, par ordre de masse.
 *   4. RECADRER sur l'alpha.
 *
 * Sortie : un PNG de la taille de la grille, quelques kilo-octets,
 * agrandissable au plus proche voisin sans jamais se dégrader.
 */

export type Sprite = {
  dataUri: string
  largeur: number
  hauteur: number
  couleurs: number
  /** Cellules opaques après détachement — zéro veut dire que tout a été mangé. */
  opaques: number
}

const enDataUri = (b: Blob) => new Promise<string>((res, rej) => {
  const l = new FileReader()
  l.onload = () => res(l.result as string)
  l.onerror = () => rej(l.error ?? new Error('lecture impossible'))
  l.readAsDataURL(b)
})

const enBlob = (c: HTMLCanvasElement) => new Promise<Blob>((res, rej) => {
  c.toBlob((b) => (b ? res(b) : rej(new Error('canevas vide'))), 'image/png')
})

export const spritifier = async (source: Blob, grille = GRILLE): Promise<Sprite> => {
  const im = await createImageBitmap(source)
  // ⚠ LES DIMENSIONS SE RELÈVENT AVANT `close()`. Un ImageBitmap fermé rapporte
  // 0 × 0, sans lever la moindre erreur — tout le reste travaillait alors sur
  // une image de taille nulle. Trouvé par l'essai unitaire, invisible autrement.
  const W = im.width, H = im.height
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const cx = c.getContext('2d', { willReadFrequently: true })
  if (!cx) throw new Error('aucun contexte 2d')
  cx.drawImage(im, 0, 0)
  const src = cx.getImageData(0, 0, W, H).data
  im.close()

  const bloc = Math.floor(Math.min(W, H) / grille)
  if (bloc < 1) throw new Error(`image trop petite pour une grille de ${grille}`)
  const gw = Math.floor(W / bloc), gh = Math.floor(H / bloc)
  const dec = 8 - BITS_CLASSE
  const classe = (r: number, g: number, b: number) =>
    ((r >> dec) << (BITS_CLASSE * 2)) | ((g >> dec) << BITS_CLASSE) | (b >> dec)

  // ─── 1. couleur MODALE par cellule ──────────────────────────────────────
  const gr = new Uint8ClampedArray(gw * gh * 3)
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const votes = new Map<number, { n: number; r: number; g: number; b: number }>()
      for (let y = gy * bloc; y < (gy + 1) * bloc; y++) {
        for (let x = gx * bloc; x < (gx + 1) * bloc; x++) {
          const i = (y * W + x) * 4
          const k = classe(src[i], src[i + 1], src[i + 2])
          const v = votes.get(k)
          if (v) { v.n++; v.r += src[i]; v.g += src[i + 1]; v.b += src[i + 2] }
          else votes.set(k, { n: 1, r: src[i], g: src[i + 1], b: src[i + 2] })
        }
      }
      let mieux: { n: number; r: number; g: number; b: number } | null = null
      for (const v of votes.values()) if (!mieux || v.n > mieux.n) mieux = v
      const o = (gy * gw + gx) * 3
      gr[o] = mieux!.r / mieux!.n; gr[o + 1] = mieux!.g / mieux!.n; gr[o + 2] = mieux!.b / mieux!.n
    }
  }

  // ─── 2. détachement par inondation depuis les bords ─────────────────────
  const alpha = new Uint8Array(gw * gh).fill(255)
  const proche = (i: number, r: number, g: number, b: number) =>
    Math.abs(gr[i * 3] - r) + Math.abs(gr[i * 3 + 1] - g) + Math.abs(gr[i * 3 + 2] - b) < TOLERANCE_FOND
  const pile: number[] = []
  const vu = new Uint8Array(gw * gh)
  const semer = (i: number) => { if (!vu[i]) { vu[i] = 1; pile.push(i) } }
  for (let x = 0; x < gw; x++) { semer(x); semer((gh - 1) * gw + x) }
  for (let y = 0; y < gh; y++) { semer(y * gw); semer(y * gw + gw - 1) }
  // Chaque cellule de départ porte SA PROPRE référence : un fond peut avoir
  // plusieurs aplats, et une référence unique laisserait les autres en place.
  const refs = pile.map((i) => [gr[i * 3], gr[i * 3 + 1], gr[i * 3 + 2]] as const)
  while (pile.length) {
    const i = pile.pop()!
    let dedans = false
    for (const [r, g, b] of refs) if (proche(i, r, g, b)) { dedans = true; break }
    if (!dedans) continue
    alpha[i] = 0
    const x = i % gw, y = (i / gw) | 0
    if (x > 0) semer(i - 1)
    if (x < gw - 1) semer(i + 1)
    if (y > 0) semer(i - gw)
    if (y < gh - 1) semer(i + gw)
  }

  // ─── 3. palette courte, par masse décroissante ──────────────────────────
  const masse = new Map<number, { n: number; r: number; g: number; b: number }>()
  for (let i = 0; i < gw * gh; i++) {
    if (!alpha[i]) continue
    const k = classe(gr[i * 3], gr[i * 3 + 1], gr[i * 3 + 2])
    const v = masse.get(k)
    if (v) v.n++
    else masse.set(k, { n: 1, r: gr[i * 3], g: gr[i * 3 + 1], b: gr[i * 3 + 2] })
  }
  const palette: { r: number; g: number; b: number }[] = []
  for (const cnd of [...masse.values()].sort((a, b) => b.n - a.n)) {
    if (palette.length >= COULEURS_MAX) break
    if (!palette.some((p) =>
      Math.abs(p.r - cnd.r) + Math.abs(p.g - cnd.g) + Math.abs(p.b - cnd.b) < ECART_TEINTE_MIN))
      palette.push({ r: cnd.r, g: cnd.g, b: cnd.b })
  }
  if (!palette.length) throw new Error('rien ne reste après détachement du fond')

  // ─── 4. composition et recadrage sur l'alpha ────────────────────────────
  let x0 = gw, y0 = gh, x1 = -1, y1 = -1
  for (let i = 0; i < gw * gh; i++) {
    if (!alpha[i]) continue
    const x = i % gw, y = (i / gw) | 0
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  }
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1
  const out = document.createElement('canvas')
  out.width = cw; out.height = ch
  const ox = out.getContext('2d')!
  const img = ox.createImageData(cw, ch)
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const i = (y + y0) * gw + (x + x0), j = (y * cw + x) * 4
      if (!alpha[i]) { img.data[j + 3] = 0; continue }
      let mieux = palette[0], d = Infinity
      for (const p of palette) {
        const dd = Math.abs(p.r - gr[i * 3]) + Math.abs(p.g - gr[i * 3 + 1]) + Math.abs(p.b - gr[i * 3 + 2])
        if (dd < d) { d = dd; mieux = p }
      }
      img.data[j] = mieux.r; img.data[j + 1] = mieux.g; img.data[j + 2] = mieux.b; img.data[j + 3] = 255
    }
  }
  ox.putImageData(img, 0, 0)

  return {
    dataUri: await enDataUri(await enBlob(out)),
    largeur: cw, hauteur: ch, couleurs: palette.length,
    opaques: alpha.reduce((a: number, v) => a + (v ? 1 : 0), 0),
  }
}
