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
 * QUEL VFS TOURNE RÉELLEMENT — et non lequel on a demandé.
 *
 * OPFS peut se replier silencieusement sur IndexedDB, c'est-à-dire sur
 * `wa-sqlite-async.wasm`, le binaire asyncify accusé de faire tuer le process
 * WebContent. Un « ça marche » obtenu sur ce repli serait un faux positif, et
 * c'est le genre de faux positif qui coûte trois semaines.
 *
 * La mesure est empirique et sans ambiguïté : si le VFS OPFS est réellement en
 * service, le fichier de base vit dans l'OPFS. On regarde donc s'il y est.
 */
export const vfsReel = async (): Promise<string> => {
  if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) {
    return 'IndexedDB (OPFS absent)'
  }
  try {
    const racine = await navigator.storage.getDirectory()
    const noms: string[] = []
    for await (const [nom] of racine.entries()) noms.push(nom)
    const trouve = noms.filter((n) => n.includes(NOM_BASE.replace('.db', '')))
    return trouve.length
      ? `OPFS confirmé (${trouve.length} fichier${trouve.length > 1 ? 's' : ''})`
      : noms.length
        ? `REPLI IndexedDB — OPFS contient ${noms.length} entrée(s), pas la base`
        : 'REPLI IndexedDB — OPFS vide'
  } catch (e) {
    return 'indéterminé : ' + (e as Error).message.slice(0, 34)
  }
}

/** Accès synchrone OPFS : normal qu'il soit absent du fil principal — WebKit
 *  ne l'expose que dans un worker. Ce n'est donc PAS un signal d'échec. */
export const opfsDisponible = async (): Promise<string> => {
  if (!('storage' in navigator) || !('getDirectory' in navigator.storage)) return 'absent'
  try {
    await navigator.storage.getDirectory()
    return 'présent (accès synchrone réservé au worker, normal)'
  } catch (e) {
    return 'erreur: ' + (e as Error).message.slice(0, 34)
  }
}
