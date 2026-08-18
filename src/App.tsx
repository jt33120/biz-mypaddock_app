import { useCallback, useEffect, useState } from 'react'
import { PRODUCT_NAME } from './product'

type Etat = { cle: string; val: string; ton?: 'oui' | 'non' | 'attente' }

/** Banc d'essai des sondes 0.1 et 0.2 : tout ce qui ne se vérifie que sur
 *  appareil réel, lisible d'un coup d'œil sur un iPhone au paddock. */
export default function App() {
  const [etats, setEtats] = useState<Etat[]>([])
  const [persistDemande, setPersistDemande] = useState<string | null>(null)

  const mesurer = useCallback(async () => {
    const l: Etat[] = []
    const autonome =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS expose l'installation par un champ non standard
      (navigator as unknown as { standalone?: boolean }).standalone === true
    l.push({ cle: 'Installée (standalone)', val: autonome ? 'oui' : 'non', ton: autonome ? 'oui' : 'non' })

    if (navigator.storage?.persisted) {
      const p = await navigator.storage.persisted()
      l.push({ cle: 'Stockage persistant', val: p ? 'accordé' : 'non accordé', ton: p ? 'oui' : 'non' })
    } else {
      l.push({ cle: 'Stockage persistant', val: 'API absente', ton: 'non' })
    }

    if (navigator.storage?.estimate) {
      const e = await navigator.storage.estimate()
      const mo = (n?: number) => (n ? (n / 1048576).toFixed(1) + ' Mo' : '—')
      // NFR : les chiffres d'estimate() ne sont JAMAIS présentés comme des mesures.
      l.push({ cle: 'Quota (estimation)', val: mo(e.quota), ton: 'attente' })
      l.push({ cle: 'Utilisé (estimation)', val: mo(e.usage), ton: 'attente' })
    }

    l.push({ cle: 'Service worker', val: 'serviceWorker' in navigator ? 'oui' : 'non',
             ton: 'serviceWorker' in navigator ? 'oui' : 'non' })
    l.push({ cle: 'WASM (PowerSync)', val: typeof WebAssembly !== 'undefined' ? 'oui' : 'non',
             ton: typeof WebAssembly !== 'undefined' ? 'oui' : 'non' })
    l.push({ cle: 'OPFS', val: 'storage' in navigator && 'getDirectory' in navigator.storage ? 'oui' : 'non',
             ton: 'storage' in navigator && 'getDirectory' in navigator.storage ? 'oui' : 'non' })
    const partage = 'share' in navigator
    l.push({ cle: 'Web Share', val: partage ? 'oui' : 'non', ton: partage ? 'oui' : 'non' })
    l.push({ cle: 'Hors ligne', val: navigator.onLine ? 'en ligne' : 'hors ligne', ton: 'attente' })
    setEtats(l)
  }, [])

  useEffect(() => { void mesurer() }, [mesurer])

  /** Sonde 0.2 — persist() se demande à CHAQUE ouverture, et son état est
   *  exposé au pilote : l'exemption liée à l'installation n'est documentée
   *  nulle part, et c'est le mode persistant qui protège la saison. */
  const demanderPersistance = async () => {
    if (!navigator.storage?.persist) { setPersistDemande('API absente'); return }
    const ok = await navigator.storage.persist()
    setPersistDemande(ok ? 'accordé' : 'refusé')
    void mesurer()
  }

  return (
    <>
      <h1>{PRODUCT_NAME} — squelette</h1>

      <div className="bloc">
        {etats.map((e) => (
          <div className="ligne" key={e.cle}>
            <span className="cle">{e.cle}</span>
            <span className={'val ' + (e.ton ?? '')}>{e.val}</span>
          </div>
        ))}
      </div>

      <button onClick={demanderPersistance}>Demander la persistance</button>
      {persistDemande && (
        <div className="bloc">
          <div className="ligne">
            <span className="cle">Dernière demande</span>
            <span className="val">{persistDemande}</span>
          </div>
        </div>
      )}

      <footer>
        Nom de code — QO-1 ouverte.<br />Rien de public sous ce nom.
      </footer>
    </>
  )
}
