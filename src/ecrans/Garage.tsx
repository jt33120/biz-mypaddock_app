import { useCallback, useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  bilanMachine, coutMachine, creerMachine, formaterChrono, formaterEuros, listerMachines,
  poserSprite, type Machine,
} from '../db/depot'
import { SPRITE_CBR83 } from '../assets/sprite-cbr83'

/**
 * Le garage — l'axe machine d'AD-2 gagne enfin une surface.
 *
 * Deux règles de conception y sont tenues, et elles se voient :
 *   — une machine SANS sprite reste pleinement une machine : la scène existe quand même et
 *     montre une silhouette. Le garage n'exige jamais une photo pour fonctionner.
 *   — c'est la MACHINE qui monte en niveau, jamais le pilote : tous les chiffres affichés
 *     portent sur l'objet — ses kilomètres, ses roulages, ce qu'elle a coûté.
 */
export function Garage({ db }: { db: PowerSyncDatabase }) {
  const [machines, setMachines] = useState<Machine[]>([])
  const [actif, setActif] = useState(0)
  const [bilan, setBilan] = useState<{ roulages: number; meilleurMs: number | null } | null>(null)
  const [cout, setCout] = useState(0)

  const charger = useCallback(async () => {
    const m = await listerMachines(db)
    setMachines(m)
    setActif((a) => Math.min(a, Math.max(0, m.length - 1)))
  }, [db])
  useEffect(() => { void charger() }, [charger])

  const machine = machines[actif]
  useEffect(() => {
    if (!machine) { setBilan(null); setCout(0); return }
    void bilanMachine(db, machine.id).then(setBilan)
    void coutMachine(db, machine.id).then(setCout)
  }, [db, machine])

  // Reprise explicite, jamais silencieuse : le pilote voit ce qu'il importe et pourquoi.
  const importerCbr = async () => {
    await creerMachine(db, { marque: 'Honda', modele: 'CBR 1000 RR · 83', annee: 2012, sprite: SPRITE_CBR83 })
    await charger()
  }

  if (!machines.length) {
    return (
      <section className="garage vide">
        <p className="libelle">garage</p>
        <h1 className="titre">Aucune machine</h1>
        <p className="texte">
          Le garage est le centre du produit : le roulage s'y rattache, l'entretien s'y rattache,
          l'usure s'y lit. Une machine se crée sans photo — le portrait vient après, s'il vient.
        </p>
        <button className="bouton" onClick={() => void importerCbr()}>
          Reprendre la CBR 83
        </button>
        <p className="note">
          Reprise d'essai : la machine et son portrait sont déjà dans l'application, donc
          l'import ne déclenche aucune génération et ne coûte rien.
        </p>
      </section>
    )
  }

  return (
    <section className="garage">
      <header className="garage-tete">
        <p className="libelle">garage</p>
        <p className="libelle">
          <b>{machines.length}</b> machine{machines.length > 1 ? 's' : ''}
        </p>
      </header>

      {machines.length > 1 && (
        <nav className="onglets">
          {machines.map((m, i) => (
            <button key={m.id} className={`onglet ${i === actif ? 'actif' : ''}`}
                    onClick={() => setActif(i)}>{m.modele}</button>
          ))}
        </nav>
      )}

      <div className="garage-titre">
        <p className="marque">{machine.marque}</p>
        <h1 className="modele">{machine.modele}</h1>
      </div>

      <div className="scene">
        {machine.sprite
          ? <img className="sprite" src={machine.sprite} alt={`${machine.marque} ${machine.modele}`} />
          : <div className="silhouette" aria-label="machine sans portrait" />}
      </div>

      <div className="chiffres">
        <div>
          <p className="et">roulages</p>
          <p className="va">{bilan?.roulages ?? 0}</p>
        </div>
        <div>
          <p className="et">meilleur tour</p>
          <p className="va">{bilan?.meilleurMs ? formaterChrono(bilan.meilleurMs) : '—'}</p>
        </div>
        <div>
          <p className="et">ce qu'elle a coûté</p>
          <p className="va">{cout ? formaterEuros(cout) : '—'}</p>
        </div>
      </div>

      {machine.sprite && (
        <button className="lien" onClick={() => void poserSprite(db, machine.id, null).then(charger)}>
          Retirer le portrait
        </button>
      )}
    </section>
  )
}
