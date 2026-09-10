import type { PowerSyncDatabase } from '@powersync/web'
import { listerMachines, type Machine } from '../db/depot'
import { photoMachine } from '../db/photos'
import { supabase } from '../db/supabase'
import { cacheDeChargement, type SplashTicket } from './splash-cache'
import { estIllustrationImportee } from './import-illustration'

const MAX_SOURCE = 8 * 1024 * 1024
const MAX_THUMBNAIL = 180000
let request = 0

/** This is a display cache, not another photo store: at most a 640 px raster.
 * Images are decoded directly, avoiding data-URL fetches forbidden by CSP. */
const miniature = async (source: Blob | string): Promise<string | null> => {
  if (typeof source === 'string'
    ? source.length > MAX_SOURCE || !/^data:image\/(?:png|jpeg|webp);base64,/.test(source)
    : source.size > MAX_SOURCE) return null
  const objectUrl = typeof source === 'string' ? null : URL.createObjectURL(source)
  const image = new Image()
  try {
    image.src = objectUrl ?? source as string
    await image.decode()
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 25_000_000) return null
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    for (const edge of [640, 480, 320]) {
      const scale = Math.min(1, edge / Math.max(image.naturalWidth, image.naturalHeight))
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      const result = canvas.toDataURL('image/webp', .78)
      if (result.length <= MAX_THUMBNAIL) return result
    }
    return null
  } catch { return null }
  finally { if (objectUrl) URL.revokeObjectURL(objectUrl) }
}

const sourceDe = async (machine: Machine): Promise<Blob | string | null> => {
  if (estIllustrationImportee(machine.sprite)) return machine.sprite
  // A real local photo takes precedence over an old pixel portrait.
  return await photoMachine(machine.photo_chemin) ?? machine.sprite
}

/** SQLite intentionally has no owner column. Existing rows can outlive a
 * logout, so a new account cannot silently claim their images. A locally
 * created bike is marked at creation; an existing signed-in bike is checked
 * through RLS once. Its cached proof survives offline starts and photo edits. */
const verifierProprietaire = async (id: string, ticket: SplashTicket): Promise<boolean> => {
  const cache = cacheDeChargement()
  if (!cache) return false
  if (cache.trusted(id, ticket)) return true
  if (ticket.owner === '@local') return cache.remember(id, ticket)
  if (!supabase || !navigator.onLine) return false
  try {
    const { data, error } = await supabase.from('machine').select('id')
      .eq('id', id).eq('pilote_id', ticket.owner).limit(1)
      .abortSignal(AbortSignal.timeout(4000))
    return !error && data?.[0]?.id === id && cache.remember(id, ticket)
  } catch { return false }
}

/** Never awaited by startup. The next opening consumes this bounded cache
 * synchronously; this opening proceeds as soon as the actual screen is ready. */
export const surveillerMotoDeChargement = (db: PowerSyncDatabase): (() => void) => {
  const cache = cacheDeChargement()
  if (!cache?.ticket()) return () => {}
  let stopped = false
  const refresh = async () => {
    const run = ++request
    const ticket = cache.ticket()
    if (!ticket) return
    const current = () => {
      const now = cache.ticket()
      return !stopped && run === request && now?.owner === ticket.owner && now.revision === ticket.revision
    }
    try {
      const machines = await listerMachines(db)
      if (!current()) return
      const selected = cache.selected() ?? cache.read()?.id
      const machine = machines.find(m => m.id === selected)
        ?? machines.find(m => m.sprite || m.photo_chemin)
      if (!machine || (!machine.sprite && !machine.photo_chemin)) { cache.clear(); return }
      if (!await verifierProprietaire(machine.id, ticket)) {
        if (current()) cache.clear()
        return
      }
      const source = await sourceDe(machine)
      const image = source ? await miniature(source) : null
      if (!current()) return
      if (!image) { cache.clear(); return }
      // Recheck deletions and source replacement after asynchronous decoding.
      const fresh = (await listerMachines(db)).find(m => m.id === machine.id)
      if (!current()) return
      if (!fresh || fresh.sprite !== machine.sprite || fresh.photo_chemin !== machine.photo_chemin) {
        cache.clear()
        return
      }
      cache.write(machine.id, image, ticket)
    } catch { /* Optional cache: SQLite and the visible app remain authoritative. */ }
  }
  const changed = () => { void refresh() }
  const stop = db.onChange({ onChange: changed }, { tables: ['machine'], throttleMs: 50 })
  window.addEventListener('mypaddock:splash-selection', changed)
  window.addEventListener('online', changed)
  changed()
  return () => {
    stopped = true
    stop()
    window.removeEventListener('mypaddock:splash-selection', changed)
    window.removeEventListener('online', changed)
  }
}
