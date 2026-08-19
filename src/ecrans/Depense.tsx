import { useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  anneeSaison, creerDepense, enCentimes, listerMachines, type Cible, type Machine,
} from '../db/depot'

/**
 * SAISIR UNE DÉPENSE — récit 5.1.
 *
 * AD-7 : trois cibles de premier rang, EXCLUSIVES ET OBLIGATOIRES. Indexer tout
 * le coût sur le seul roulage ferait échapper la moitié du budget réel — les
 * pneus, la révision, le circuit payé d'avance — et rendrait le coût au tour
 * faux tout en le laissant calculable, ce qui est le pire des deux mondes.
 *
 * Le montant est en CENTIMES ENTIERS de bout en bout. Aucun flottant ne touche
 * de la monnaie : 0,1 + 0,2 ne fait pas 0,3, et une saison entière d'additions
 * finit par le montrer.
 */

type Props = {
  db: PowerSyncDatabase
  /** Le roulage d'où l'on vient, s'il y en a un. Sans lui la cible « journée »
   *  n'a rien à désigner et ne s'affiche pas — plutôt que de s'afficher morte. */
  roulageId: string | null
  dateRoulage: string | null
  onFini: () => void
  onAnnuler: () => void
}

export function Depense({ db, roulageId, dateRoulage, onFini, onAnnuler }: Props) {
  const [cible, setCible] = useState<Cible>(roulageId ? 'roulage' : 'saison')
  const [montant, setMontant] = useState('')
  const [libelle, setLibelle] = useState('')
  const [machines, setMachines] = useState<Machine[]>([])
  const [machineId, setMachineId] = useState<string | null>(null)
  const [occupe, setOccupe] = useState(false)

  useEffect(() => {
    void listerMachines(db).then((m) => {
      setMachines(m)
      setMachineId((a) => a ?? m[0]?.id ?? null)
    })
  }, [db])

  const centimes = enCentimes(montant)
  // La cible machine EXIGE une machine : une dépense de moto sans moto n'est
  // pas une dépense de saison déguisée, c'est une saisie incomplète.
  const pret = centimes != null && centimes > 0 && (cible !== 'machine' || !!machineId)

  const valider = async () => {
    if (!pret || centimes == null) return
    setOccupe(true)
    await creerDepense(db, {
      cible,
      roulageId: cible === 'roulage' ? roulageId : null,
      machineId: cible === 'machine' ? machineId : null,
      centimes,
      libelle: libelle.trim(),
      // La date de la dépense est celle du roulage quand elle en porte un —
      // sinon celle du jour. C'est elle, et elle seule, qui fixe la saison.
      date: (cible === 'roulage' && dateRoulage) || new Date().toISOString().slice(0, 10),
    })
    setOccupe(false)
    onFini()
  }

  return (
    <section className="depense">
      <p className="libelle">Ce que ça a coûté</p>

      <div className="pile">
        <label className="libelle" htmlFor="montant">Montant</label>
        <div className="somme">
          <input id="montant" className="champ chiffre" value={montant}
                 onChange={(e) => setMontant(e.target.value)}
                 inputMode="decimal" placeholder="0" autoComplete="off" />
          <span className="unite">€</span>
        </div>
      </div>

      <div className="pile">
        <div className="libelle">À quoi ça se rattache</div>
        <div className="puces">
          {roulageId && (
            <button className="puce" data-actif={cible === 'roulage' ? '1' : '0'}
                    onClick={() => setCible('roulage')}>CETTE JOURNÉE</button>
          )}
          {/* FR-26 : ce qui est une pièce se rattache à la MOTO, jamais au
              roulage pendant lequel on l'a achetée. */}
          <button className="puce" data-actif={cible === 'machine' ? '1' : '0'}
                  onClick={() => setCible('machine')}>PIÈCE OU ENTRETIEN</button>
          <button className="puce" data-actif={cible === 'saison' ? '1' : '0'}
                  onClick={() => setCible('saison')}>LA SAISON</button>
        </div>
      </div>

      {cible === 'machine' && (
        <div className="pile">
          <div className="libelle">Quelle moto</div>
          {machines.length ? (
            <div className="puces">
              {machines.map((m) => (
                <button key={m.id} className="puce" data-actif={machineId === m.id ? '1' : '0'}
                        onClick={() => setMachineId(m.id)}>{m.modele.toUpperCase()}</button>
              ))}
            </div>
          ) : (
            <p className="texte">
              Aucune moto au garage. Déclare-la d'abord — une dépense de moto sans moto
              ne se rattacherait à rien.
            </p>
          )}
        </div>
      )}

      <div className="pile">
        <label className="libelle" htmlFor="libelle">Quoi · facultatif</label>
        <input id="libelle" className="champ" value={libelle} onChange={(e) => setLibelle(e.target.value)}
               placeholder="Pneus, essence, engagement…" autoComplete="off" />
      </div>

      <button className="bouton" disabled={!pret || occupe} onClick={() => void valider()}>
        {occupe ? 'un instant…' : 'Enregistrer'}
      </button>
      <button className="bouton secondaire" onClick={onAnnuler}>Annuler</button>

      <p className="note">
        La saison, c'est {anneeSaison((cible === 'roulage' && dateRoulage) || new Date().toISOString())} —
        l'année de la dépense, fixée maintenant et jamais recalculée.
      </p>
    </section>
  )
}
