import { useEffect, useState } from 'react'

type Portrait = { kind: 'machine' | 'equipement'; src: string }
type Portraits = Record<string, Portrait>

let portraits: Portraits | null = null
let pending: Promise<Portraits> | null = null

/** Private development artwork is served by localhost, never bundled or synced. */
async function loadPortraits(): Promise<Portraits> {
  if (!import.meta.env.DEV) return {}
  if (portraits) return portraits
  pending ??= fetch('/__local-night-portraits', { credentials: 'same-origin' })
    .then(async (response): Promise<Portraits> => {
      if (!response.ok) return {}
      const body: unknown = await response.json()
      if (!body || typeof body !== 'object' || !('portraits' in body)) return {}
      const candidates = body.portraits
      if (!candidates || typeof candidates !== 'object' || Array.isArray(candidates)) return {}
      const valid: Portraits = {}
      for (const [id, value] of Object.entries(candidates)) {
        if (!value || typeof value !== 'object') continue
        const { kind, src } = value as Partial<Portrait>
        if ((kind === 'machine' || kind === 'equipement') && typeof src === 'string'
          && /^\/__local-night-portraits\/[a-z0-9-]+\.(?:png|webp)$/.test(src)) {
          valid[id] = { kind, src }
        }
      }
      return valid
    })
    .catch(() => ({}))
    .then((loaded) => { portraits = loaded; return loaded })
  return pending
}

/** Exact entity IDs select portraits; an unrelated account keeps its own media. */
export function useLocalPortrait(entityId: string | null | undefined): string | null {
  const [loaded, setLoaded] = useState<Portraits | null>(portraits)
  useEffect(() => {
    if (!import.meta.env.DEV || !entityId) return
    let alive = true
    void loadPortraits().then((result) => { if (alive) setLoaded(result) })
    return () => { alive = false }
  }, [entityId])
  if (!import.meta.env.DEV || !entityId) return null
  return loaded?.[entityId]?.src ?? null
}

/** Canvas exports need self-contained bytes, including in the private preview. */
export async function localPortraitData(entityId: string | null | undefined): Promise<string | null> {
  if (!import.meta.env.DEV || !entityId) return null
  const portrait = (await loadPortraits())[entityId]
  if (!portrait) return null
  try {
    const response = await fetch(portrait.src, { credentials: 'same-origin' })
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise<string | null>(resolve => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}
