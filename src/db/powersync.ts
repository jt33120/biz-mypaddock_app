import { PowerSyncDatabase, WASQLiteVFS } from '@powersync/web'
import { AppSchema } from './schema'

/**
 * Sonde du récit 0.1 — SQLite en WebAssembly dans une PWA installée sous iOS.
 *
 * ⚠ LE VFS EST CHOISI EXPLICITEMENT, ET C'EST LE POINT LE PLUS IMPORTANT DE CE
 * FICHIER. Le défaut de @powersync/web 2.2.0 est `IDBBatchAtomicVFS`
 * (resolveAndValidateOptions.js:32, vérifié dans le paquet installé), qui charge
 * `wa-sqlite-async.wasm` — 2,18 Mo, build **asyncify**. C'est précisément le
 * binaire que le seul rapport de terrain sur iPhone réel accuse de déborder la
 * pile et de faire tuer le process WebContent en une trentaine de secondes
 * d'écriture soutenue.
 *
 * `OPFSCoopSyncVFS` charge `wa-sqlite.wasm` — 1,07 Mo, build **synchrone**, sans
 * asyncify. Ne rien choisir ici, ce serait choisir le mauvais.
 *
 * `cacheSizeKb` est plafonné à 4 Mo : le défaut du SDK est de 50 Mo, ce qui est
 * beaucoup trop pour un WebContent iOS déjà contraint.
 */
export const NOM_BASE = 'mypaddock.db'
export const VFS_DEMANDE = 'OPFSCoopSyncVFS'

export const ouvrirBase = () =>
  new PowerSyncDatabase({
    schema: AppSchema,
    // En 2.2.0 toutes les options web vivent DANS `database`, pas au niveau
    // supérieur — vérifié dans adapters/options.d.ts.
    database: {
      dbFilename: NOM_BASE,
      vfs: WASQLiteVFS.OPFSCoopSyncVFS,
      // OPFS exige un worker dédié : le SDK lève une erreur explicite sinon.
      useWebWorker: true,
      // 4 Mo, contre 50 Mo par défaut — un WebContent iOS est déjà contraint.
      cacheSizeKb: 4 * 1024,
    },
  })

/**
 * OPFS peut se replier silencieusement sur IndexedDB. Un « ça marche » obtenu
 * sur le VFS qu'on voulait éviter serait un faux positif, et c'est exactement
 * le genre de résultat qui coûte trois semaines. On mesure donc ce qui tourne
 * réellement plutôt que ce qu'on a demandé.
 */
export const opfsDisponible = async (): Promise<string> => {
  if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) return 'absent'
  try {
    const racine = await navigator.storage.getDirectory()
    const f = await racine.getFileHandle('sonde-opfs', { create: true })
    // createSyncAccessHandle est ce dont OPFSCoopSyncVFS a besoin, et il
    // n'existe QUE dans un worker sur certaines versions de WebKit.
    const dansWorker = typeof (f as unknown as { createSyncAccessHandle?: unknown }).createSyncAccessHandle === 'function'
    await racine.removeEntry('sonde-opfs').catch(() => {})
    return dansWorker ? 'disponible' : 'present, sans accès synchrone'
  } catch (e) {
    return 'erreur: ' + (e as Error).message.slice(0, 40)
  }
}
