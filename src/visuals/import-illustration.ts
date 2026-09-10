const INPUT_LIMIT = 10 * 1024 * 1024
const OUTPUT_LIMIT = 1024 * 1024
const LONGEST_EDGE = 1536
const TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])

/** Bounded header inspection, adapted from banc-rendu/pipeline.js dimensions().
 * WebP layouts: https://developers.google.com/speed/webp/docs/riff_container */
function dimensions(head: Uint8Array): { width: number; height: number } | null {
  const view = new DataView(head.buffer, head.byteOffset, head.byteLength)
  const text = (start: number, length: number) => String.fromCharCode(...head.slice(start, start + length))
  if (head.length >= 24 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => head[i] === byte)
    && text(12, 4) === 'IHDR') {
    return { width: view.getUint32(16), height: view.getUint32(20) }
  }
  if (head[0] === 255 && head[1] === 216) {
    let offset = 2
    while (offset + 4 < head.length) {
      if (head[offset++] !== 255) continue
      while (head[offset] === 255) offset++
      const marker = head[offset++]
      if (marker === 217 || marker === 218) break
      if (marker === 216 || marker === 1 || (marker >= 208 && marker <= 215)) continue
      if (offset + 2 > head.length) break
      const length = view.getUint16(offset)
      if (length < 2 || offset + length > head.length) break
      if (marker >= 192 && marker <= 207 && ![196, 200, 204].includes(marker) && length >= 7) {
        return { width: view.getUint16(offset + 5), height: view.getUint16(offset + 3) }
      }
      offset += length
    }
  }
  if (head.length >= 30 && text(0, 4) === 'RIFF' && text(8, 4) === 'WEBP') {
    const kind = text(12, 4)
    const u24 = (i: number) => head[i] | (head[i + 1] << 8) | (head[i + 2] << 16)
    if (kind === 'VP8X') return { width: u24(24) + 1, height: u24(27) + 1 }
    if (kind === 'VP8L' && head[20] === 47) {
      const bits = view.getUint32(21, true)
      return { width: (bits & 16383) + 1, height: ((bits >>> 14) & 16383) + 1 }
    }
    if (kind === 'VP8 ' && head[23] === 157 && head[24] === 1 && head[25] === 42) {
      return { width: view.getUint16(26, true) & 16383, height: view.getUint16(28, true) & 16383 }
    }
  }
  return null
}

/** Imported illustrations have a distinct encoding from the legacy PNG sprites. */
export const estIllustrationImportee = (src: string | null | undefined): boolean =>
  Boolean(src?.startsWith('data:image/webp;'))

/** Decode and prepare an illustration on this device; no upload or generation. */
export async function importerIllustration(file: File): Promise<string> {
  if (!TYPES.has(file.type)) throw new Error('Choisis une image PNG, JPEG ou WebP.')
  if (!file.size) throw new Error('Cette image est vide. Choisis un autre fichier.')
  if (file.size > INPUT_LIMIT) throw new Error('Cette image dépasse 10 Mo. Choisis un fichier plus léger.')

  // Reject huge decoded allocations before asking the browser to decode pixels.
  const size = dimensions(new Uint8Array(await file.slice(0, 256 * 1024).arrayBuffer()))
  if (!size || !size.width || !size.height) throw new Error('Cette image est illisible. Choisis un autre PNG, JPEG ou WebP.')
  if (Math.max(size.width, size.height) > 8192 || size.width * size.height > 24_000_000) {
    throw new Error('Cette image est trop grande. Choisis une version de moins de 24 mégapixels et 8 192 pixels de côté.')
  }

  const url = URL.createObjectURL(file)
  const image = new Image()
  const canvas = document.createElement('canvas')
  try {
    image.src = url
    try { await image.decode() }
    catch { throw new Error('Cette image est illisible. Choisis un autre fichier.') }
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('Cette image est illisible.')

    const scale = Math.min(1, LONGEST_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error("L'image n'a pas pu être préparée. Réessaie.")
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.88))
    if (!blob || blob.type !== 'image/webp') throw new Error("Ce navigateur ne peut pas préparer l'illustration. Essaie un navigateur récent.")
    if (blob.size > OUTPUT_LIMIT) throw new Error("L'illustration reste trop lourde après préparation. Choisis une image plus petite.")
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error("L'illustration n'a pas pu être préparée. Réessaie."))
      reader.onerror = () => reject(new Error("L'illustration n'a pas pu être lue. Réessaie."))
      reader.readAsDataURL(blob)
    })
  } finally {
    URL.revokeObjectURL(url)
    image.removeAttribute('src')
    canvas.width = 0
    canvas.height = 0
  }
}
