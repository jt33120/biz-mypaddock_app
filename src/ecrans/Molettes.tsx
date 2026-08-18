import { useEffect, useRef, useState } from 'react'

const H = 72 // hauteur d'un cran, multiple de 4

/**
 * Le sélecteur de chrono — UJ-1 étape 2. `1'47"3`, aucun clavier.
 *
 * Le pilote a des gants aux mains, il est en plein soleil, une session part
 * dans vingt minutes. On choisit, on ne tape pas. Le défilement par cran est
 * le seul geste qui survive à un gant : il tolère l'imprécision, là où une
 * cible de 44 px la punit.
 */
function Molette({ n, valeur, sur, libelle }: { n: number; valeur: number; sur: (v: number) => void; libelle: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vu, setVu] = useState(valeur)

  useEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = valeur * H
  }, []) // position initiale seulement — ne pas lutter contre le doigt

  const auDefilement = () => {
    const el = ref.current
    if (!el) return
    const i = Math.max(0, Math.min(n - 1, Math.round(el.scrollTop / H)))
    if (i !== vu) { setVu(i); sur(i) }
  }

  return (
    <div className="molette">
      <div className="libelle hud-10" style={{ textAlign: 'center', marginBottom: 4 }}>{libelle}</div>
      <div className="molette-cadre" ref={ref} onScroll={auDefilement}
           style={{ height: H * 3 }} aria-label={libelle} role="listbox">
        <div style={{ height: H }} aria-hidden />
        {Array.from({ length: n }, (_, i) => (
          <div key={i} className="molette-item" data-actif={i === vu ? '1' : '0'}
               style={{ height: H }} role="option" aria-selected={i === vu}>
            {String(i).padStart(n > 10 ? 2 : 1, '0')}
          </div>
        ))}
        <div style={{ height: H }} aria-hidden />
      </div>
    </div>
  )
}

export function Molettes({ sur }: { sur: (ms: number) => void }) {
  const [m, setM] = useState(1)
  const [s, setS] = useState(47)
  const [d, setD] = useState(3)

  useEffect(() => { sur((m * 60 + s) * 1000 + d * 100) }, [m, s, d, sur])

  return (
    <div className="molettes">
      <Molette n={10} valeur={m} sur={setM} libelle="MIN" />
      <div className="molette-sep" aria-hidden>'</div>
      <Molette n={60} valeur={s} sur={setS} libelle="SEC" />
      <div className="molette-sep" aria-hidden>"</div>
      <Molette n={10} valeur={d} sur={setD} libelle="DIX" />
    </div>
  )
}
