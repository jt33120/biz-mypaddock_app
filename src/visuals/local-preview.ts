import type { PowerSyncDatabase } from '@powersync/web'

import { LOCAL_NIGHT_PREVIEW } from '../local-mode'
export { LOCAL_NIGHT_PREVIEW } from '../local-mode'

/** An isolated local copy makes the owner's artwork reviewable without signing in. */
export async function prepareLocalPreview(db: PowerSyncDatabase) {
  if (!LOCAL_NIGHT_PREVIEW) return
  const response = await fetch('/__local-night-preview', { credentials: 'same-origin' })
  if (!response.ok) throw new Error('Les références locales du garage ne sont pas disponibles.')
  const snapshot = await response.json() as { machines: Record<string, string | number | null>[]; equipement: Record<string, string | number | null>[] }
  await db.writeTransaction(async tx => {
    const present = await tx.getOptional<{ id: string }>('SELECT id FROM machine LIMIT 1')
    if (present) return
    for (const m of snapshot.machines) {
      await tx.execute('INSERT INTO machine (id, marque, modele, annee, sprite) VALUES (?, ?, ?, ?, ?)', [m.id, m.marque, m.modele, m.annee, m.sprite])
    }
    for (const e of snapshot.equipement) {
      await tx.execute('INSERT INTO equipement (id, nom, categorie) VALUES (?, ?, ?)', [e.id, e.nom, e.categorie])
    }
  })
}
