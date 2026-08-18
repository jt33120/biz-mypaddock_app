import { useCallback, useEffect, useRef, useState } from 'react'
import { PRODUCT_NAME } from './product'
import { nouvelId } from './db/ids'
import { NOM_BASE, VFS_DEMANDE, opfsDisponible, ouvrirBase } from './db/powersync'

type Etat = { cle: string; val: string; ton?: 'oui' | 'non' | 'attente' }

/**
 * PHASE A du récit 0.1 — le moteur, HORS NUAGE.
 *
 * Le vrai verrou du projet n'est pas la synchronisation, c'est de savoir si
 * SQLite en WebAssembly survit dans une PWA installée sous iOS. Ça se teste
 * sans compte PowerSync, sans instance déployée et sans une ligne de SQL
 * serveur : `new PowerSyncDatabase(...)` ouvre une base locale et accepte des
 * écritures sans jamais appeler `connect()`.
 *
 * Si ça meurt ici, PowerSync est mort et rien n'a été gaspillé en configuration
 * nuage. C'est la seule structure où un échec ne coûte pas la soirée entière.
 */
export default function App() {
  const [etats, setEtats] = useState<Etat[]>([])
  const [journal, setJournal] = useState<string[]>([])
  const [occupe, setOccupe] = useState(false)
  const base = useRef<ReturnType<typeof ouvrirBase> | null>(null)

  const dire = (m: string) =>
    setJournal((j) => [`${new Date().toLocaleTimeString('fr-FR')}  ${m}`, ...j].slice(0, 14))

  const mesurer = useCallback(async () => {
    const l: Etat[] = []
    const autonome =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    l.push({ cle: 'Installée (standalone)', val: autonome ? 'oui' : 'non', ton: autonome ? 'oui' : 'non' })

    if (navigator.storage?.persisted) {
      const p = await navigator.storage.persisted()
      l.push({ cle: 'Stockage persistant', val: p ? 'accordé' : 'non accordé', ton: p ? 'oui' : 'non' })
    }
    if (navigator.storage?.estimate) {
      const e = await navigator.storage.estimate()
      const mo = (n?: number) => (n ? (n / 1048576).toFixed(1) + ' Mo' : '—')
      // Les chiffres d'estimate() ne sont jamais présentés comme des mesures.
      l.push({ cle: 'Quota (estimation)', val: mo(e.quota), ton: 'attente' })
      l.push({ cle: 'Utilisé (estimation)', val: mo(e.usage), ton: 'attente' })
    }
    l.push({ cle: 'OPFS', val: await opfsDisponible(), ton: 'attente' })
    l.push({ cle: 'WASM', val: typeof WebAssembly !== 'undefined' ? 'oui' : 'non',
             ton: typeof WebAssembly !== 'undefined' ? 'oui' : 'non' })
    l.push({ cle: 'VFS demandé', val: VFS_DEMANDE, ton: 'attente' })
    l.push({ cle: 'Hors ligne', val: navigator.onLine ? 'en ligne' : 'HORS LIGNE',
             ton: navigator.onLine ? 'attente' : 'oui' })
    l.push({ cle: 'Build', val: __BUILD__, ton: 'attente' })
    setEtats(l)
  }, [])

  useEffect(() => { void mesurer() }, [mesurer])

  const ouvrir = async () => {
    if (base.current) return base.current
    dire(`ouverture de ${NOM_BASE} en ${VFS_DEMANDE}…`)
    const t = performance.now()
    const db = ouvrirBase()
    await db.init()
    base.current = db
    dire(`base ouverte en ${Math.round(performance.now() - t)} ms`)
    return db
  }

  /** Étape 2 du protocole : 40 tours d'affilée. C'est l'écriture soutenue qui
   *  fait tuer le process WebContent quand le VFS asyncify est en cause. */
  const ecrire40Tours = async () => {
    setOccupe(true)
    try {
      const db = await ouvrir()
      const t = performance.now()
      const roulageId = nouvelId()
      const sessionId = nouvelId()
      await db.execute(
        `INSERT INTO roulage (id, pilote_id, machine_id, date_jour, groupe_nom, groupe_rang, groupe_total, niveau)
         VALUES (?, ?, NULL, ?, ?, ?, ?, ?)`,
        [roulageId, 'sonde', new Date().toISOString().slice(0, 10), 'Confirmé', 3, 4, 'confirme'],
      )
      await db.execute(`INSERT INTO session (id, roulage_id, ordre, duree_ms) VALUES (?, ?, ?, ?)`,
        [sessionId, roulageId, 1, 1200000])
      for (let i = 0; i < 40; i++) {
        await db.execute(
          `INSERT INTO tour (id, session_id, temps_ms, provenance) VALUES (?, ?, ?, ?)`,
          [nouvelId(), sessionId, 96000 + Math.round(Math.sin(i) * 3000), 'saisie_manuelle'],
        )
      }
      const ms = Math.round(performance.now() - t)
      dire(`40 tours écrits en ${ms} ms (${(ms / 40).toFixed(1)} ms/tour)`)
      await compter()
    } catch (e) {
      dire('ÉCHEC : ' + (e as Error).message.slice(0, 90))
    } finally {
      setOccupe(false)
    }
  }

  /** Étape 4 : ce compteur doit survivre à une fermeture, à un verrouillage et
   *  au mode avion. C'est lui qui dit si la journée du pilote tient. */
  const compter = async () => {
    try {
      const db = await ouvrir()
      const r = await db.getAll<{ n: number; t: string }>(
        `SELECT (SELECT count(*) FROM tour) AS n, (SELECT count(*) FROM roulage) AS t`)
      const l = r[0] as unknown as { n: number; t: number }
      dire(`persisté : ${l.n} tours sur ${l.t} roulages`)
    } catch (e) {
      dire('lecture impossible : ' + (e as Error).message.slice(0, 80))
    }
  }

  const demanderPersistance = async () => {
    if (!navigator.storage?.persist) return dire('persist() absent')
    dire('persist() → ' + ((await navigator.storage.persist()) ? 'accordé' : 'refusé'))
    void mesurer()
  }

  return (
    <>
      <h1>{PRODUCT_NAME} — sonde 0.1</h1>

      <div className="bloc">
        {etats.map((e) => (
          <div className="ligne" key={e.cle}>
            <span className="cle">{e.cle}</span>
            <span className={'val ' + (e.ton ?? '')}>{e.val}</span>
          </div>
        ))}
      </div>

      <button onClick={ecrire40Tours} disabled={occupe}>
        {occupe ? 'écriture…' : 'Écrire 40 tours'}
      </button>
      <button onClick={compter} disabled={occupe}>Compter ce qui a survécu</button>
      <button onClick={demanderPersistance}>Demander la persistance</button>

      {journal.length > 0 && (
        <div className="bloc">
          {journal.map((m, i) => (
            <div className="ligne" key={i}>
              <span className="cle" style={{ fontSize: 12 }}>{m}</span>
            </div>
          ))}
        </div>
      )}

      <footer>Nom de code — QO-1 ouverte.<br />Rien de public sous ce nom.</footer>
    </>
  )
}
