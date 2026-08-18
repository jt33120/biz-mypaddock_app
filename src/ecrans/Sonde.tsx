import { useCallback, useEffect, useRef, useState } from 'react'
import { nouvelId } from '../db/ids'
import { NOM_BASE, VFS_DEMANDE, opfsDisponible, ouvrirBase, vfsReel } from '../db/powersync'

type Etat = { cle: string; val: string; ton?: 'oui' | 'non' | 'attente' }

/** La sonde du récit 0.1, conservée comme instrument. Elle a déjà rendu son
 *  verdict — OPFS confirmé, persist() accordé sur PWA installée — mais elle
 *  reste le seul endroit où l'on voit ce que l'appareil fait réellement. */
export function Sonde() {
  const [etats, setEtats] = useState<Etat[]>([])
  const [journal, setJournal] = useState<string[]>([])
  const [occupe, setOccupe] = useState(false)
  const base = useRef<ReturnType<typeof ouvrirBase> | null>(null)

  const dire = (m: string) =>
    setJournal((j) => [`${new Date().toLocaleTimeString('fr-FR')}  ${m}`, ...j].slice(0, 12))

  const mesurer = useCallback(async () => {
    const l: Etat[] = []
    const autonome = window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    l.push({ cle: '① INSTALLÉE', val: autonome ? 'OUI' : 'NON — onglet Safari', ton: autonome ? 'oui' : 'non' })
    if (navigator.storage?.persisted) {
      const p = await navigator.storage.persisted()
      l.push({ cle: 'Persistance', val: p ? 'accordée' : 'non accordée', ton: p ? 'oui' : 'non' })
    }
    if (navigator.storage?.estimate) {
      const e = await navigator.storage.estimate()
      const mo = (n?: number) => (n ? (n / 1048576).toFixed(1) + ' Mo' : '—')
      l.push({ cle: 'Quota (estim.)', val: mo(e.quota), ton: 'attente' })
      l.push({ cle: 'Utilisé (estim.)', val: mo(e.usage), ton: 'attente' })
    }
    const reel = await vfsReel()
    l.push({ cle: '② VFS RÉEL', val: reel, ton: reel.startsWith('OPFS confirmé') ? 'oui' : reel.startsWith('REPLI') ? 'non' : 'attente' })
    l.push({ cle: '   (demandé)', val: VFS_DEMANDE, ton: 'attente' })
    l.push({ cle: 'OPFS', val: await opfsDisponible(), ton: 'attente' })
    l.push({ cle: '③ RÉSEAU', val: navigator.onLine ? 'en ligne' : 'MODE AVION', ton: navigator.onLine ? 'attente' : 'oui' })
    l.push({ cle: 'Build', val: __BUILD__, ton: 'attente' })
    setEtats(l)
  }, [])

  useEffect(() => { void mesurer() }, [mesurer])

  const ouvrir = async () => {
    if (base.current) return base.current
    const t = performance.now()
    const db = ouvrirBase()
    await db.init()
    base.current = db
    dire(`${NOM_BASE} ouverte en ${Math.round(performance.now() - t)} ms`)
    return db
  }

  const ecrire = async () => {
    setOccupe(true)
    try {
      const db = await ouvrir()
      const t = performance.now()
      const r = nouvelId(), s = nouvelId()
      await db.execute(`INSERT INTO roulage (id, pilote_id, date_jour, circuit_id) VALUES (?, 'sonde', ?, 'SONDE')`,
        [r, new Date().toISOString().slice(0, 10)])
      await db.execute(`INSERT INTO session (id, roulage_id, ordre) VALUES (?, ?, 1)`, [s, r])
      for (let i = 0; i < 40; i++) {
        await db.execute(`INSERT INTO tour (id, session_id, temps_ms, provenance) VALUES (?, ?, ?, 'saisie_manuelle')`,
          [nouvelId(), s, 96000 + Math.round(Math.sin(i) * 3000)])
      }
      const ms = Math.round(performance.now() - t)
      dire(`40 tours en ${ms} ms (${(ms / 40).toFixed(1)} ms/tour)`)
      await compter()
    } catch (e) { dire('ÉCHEC : ' + (e as Error).message.slice(0, 80)) }
    finally { setOccupe(false); void mesurer() }
  }

  const compter = async () => {
    const db = await ouvrir()
    const r = await db.getAll<{ n: number; t: number }>(
      `SELECT (SELECT count(*) FROM tour) AS n, (SELECT count(*) FROM roulage) AS t`)
    dire(`persisté : ${r[0].n} tours sur ${r[0].t} roulages`)
  }

  return (
    <>
      <div className="libelle">Sonde 0.1 — instrument</div>
      <div className="bloc">
        {etats.map((e) => (
          <div className="rang" key={e.cle} style={{ padding: '4px 0' }}>
            <span className="libelle" style={{ fontSize: 12 }}>{e.cle}</span>
            <span className={'hud-12 ' + (e.ton === 'oui' ? 'mieux' : e.ton === 'non' ? 'plus-lent' : 'faible')}
                  style={{ textAlign: 'right' }}>{e.val}</span>
          </div>
        ))}
      </div>
      <button className="bouton" onClick={ecrire} disabled={occupe}>
        {occupe ? 'écriture…' : 'Écrire 40 tours'}
      </button>
      <button className="bouton secondaire" onClick={() => void compter()}>Compter ce qui a survécu</button>
      <button className="bouton secondaire" onClick={() => void navigator.storage?.persist?.().then((o) => { dire('persist() → ' + (o ? 'accordé' : 'refusé')); void mesurer() })}>
        Demander la persistance
      </button>
      {journal.length > 0 && (
        <div className="plat pile">
          {journal.map((m, i) => <div key={i} className="libelle" style={{ fontSize: 12, textTransform: 'none' }}>{m}</div>)}
        </div>
      )}
    </>
  )
}
