# src/pixel/spritifier.ts

- Sprite · type · L25-L32 — type Sprite = { dataUri: string largeur: number hauteur: number couleurs: number /** Cellules opaques après détachement — zéro veut dire que tout a été mangé. */ opaques: number }
- enDataUri · function · L34-L39 — enDataUri = (b: Blob)
- enBlob · function · L41-L43 — enBlob = (c: HTMLCanvasElement)
- spritifier · function · L45-L164 — spritifier = async (source: Blob, grille = GRILLE): Promise<Sprite>
- classe · function · L63-L64 — classe = (r: number, g: number, b: number)
- proche · function · L89-L90 — proche = (i: number, r: number, g: number, b: number)
- semer · function · L93-L93 — semer = (i: number)
