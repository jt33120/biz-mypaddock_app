import { useCallback, useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  cestFaitDepuisLHorloge, horloges, oublierHorloge, poserHorloge, type Horloge,
} from '../db/usure'

/**
 * LES HORLOGES D'USURE À L'ÉCRAN — FR-40, FR-44.
 *
 * DEUX RÈGLES, ET ELLES SE VOIENT LIGNE PAR LIGNE :
 *
 *   · LA COMPLÉTUDE EST TOUJOURS LÀ, à côté du chiffre, jamais derrière une
 *     interaction. « sur 7 roulages saisis » n'est pas une précision de bas de
 *     page : c'est ce qui empêche le chiffre de prétendre à une exactitude que
 *     sa source n'a pas.
 *
 *   · AUCUN VERDICT. Pas de « à changer », pas de rouge, pas de « il te
 *     reste ». Le produit dit OÙ EN EST la machine ; il ne dit pas ce qu'il
 *     faut faire. Une horloge qui a dépassé son intervalle l'énonce — « au-delà
 *     de l'intervalle » — et s'arrête là.
 */
const aujourdhui = () => new Date().toISOString().slice(0, 10)

export function Usure({ db, machineId, onEcrit }: {
  db: PowerSyncDatabase; machineId: string; onEcrit?: () => void
}) {
  const [liste, setListe] = useState<Horloge[]>([])
  const [saisie, setSaisie] = useState(false)
  const [operation, setOperation] = useState('')
  const [intervalle, setIntervalle] = useState('')

  const charger = useCallback(async () => setListe(await horloges(db, machineId)), [db, machineId])
  useEffect(() => { void charger() }, [charger])

  const poser = async () => {
    await poserHorloge(db, {
      machineId, operation,
      intervalle: /^\d{1,3}$/.test(intervalle.trim()) ? Number(intervalle.trim()) : null,
    })
    setOperation(''); setIntervalle(''); setSaisie(false)
    await charger()
  }

  return (
    <>
      <p className="libelle">usure</p>
      {liste.map((h) => {
        const a = h.avancement
        const dépassé = a.intervalle != null && a.ponderes >= a.intervalle
        return (
          <div className="bloc pile usure" key={h.id}>
            <div className="rang">
              <span className="texte">{h.operation}</span>
              <span className={'chiffre hud-24 ' + (dépassé ? 'plus-lent' : 'miami')}>
                {a.intervalle != null ? `${a.ponderes} / ${a.intervalle}` : a.ponderes}
              </span>
            </div>

            {/* FR-40 — LA COMPLÉTUDE, TOUJOURS, ET SANS INTERACTION. */}
            <p className="note">
              sur {a.completude.saisis} roulage{a.completude.saisis > 1 ? 's' : ''} saisi
              {a.completude.saisis > 1 ? 's' : ''}
              {a.completude.sansGroupe > 0
                ? ` · ${a.completude.sansGroupe} sans groupe, donc comptés sans pondération`
                : ''}
              {a.intervalle == null ? ' · aucun barème connu, cette horloge compte sans échoir' : ''}
            </p>

            {dépassé && (
              /* Un ÉNONCÉ, pas un verdict. Ni « à changer », ni « danger », ni
                 pastille rouge : le produit dit où en est la machine. */
              <p className="note">Au-delà de l'intervalle transcrit.</p>
            )}

            {a.source.url && (
              <p className="note">
                Barème relevé le {a.source.recolteLe?.slice(0, 10)}
                {a.source.extraitParIa ? ', extrait automatiquement d\'une page publiée' : ''} —
                {' '}transcrit, jamais interprété. À vérifier auprès du constructeur.
              </p>
            )}

            {/* FR-43 — un tap, trois effets : l'intervention se consigne, la
                date se remplit, ET L'HORLOGE REPART. Le troisième manquait, et
                l'horloge affichait son dépassement à vie : le seul recours
                offert était de retirer le suivi. */}
            <button className="bouton secondaire"
                    onClick={() => void cestFaitDepuisLHorloge(db, h.id, aujourdhui())
                      .then(charger).then(() => onEcrit?.())}>
              C'est fait aujourd'hui
            </button>
            {/* ⚠ LE ROUGE EST ICI ET NULLE PART AILLEURS DANS CE BLOC. Une
                horloge au-delà de son intervalle garde le jaune de `.plus-lent`
                et sa phrase — « Au-delà de l'intervalle transcrit » : le produit
                dit OÙ EN EST la moto, il ne la déclare pas en faute. Le seul
                geste rouge de l'usure est celui qui fait disparaître le suivi. */}
            <button className="lien destructif"
                    onClick={() => void oublierHorloge(db, h.id).then(charger)}>
              Retirer cette horloge
            </button>
          </div>
        )
      })}

      {saisie ? (
        <div className="bloc pile">
          <div className="libelle">quel poste</div>
          <input className="champ" value={operation} onChange={(e) => setOperation(e.target.value)}
                 placeholder="Plaquettes avant" autoComplete="off" />
          <div className="libelle">tous les combien de roulages · si tu le sais</div>
          <input className="champ" value={intervalle} onChange={(e) => setIntervalle(e.target.value)}
                 placeholder="6" inputMode="numeric" />
          <p className="note">
            Sans intervalle, l'horloge compte sans jamais échoir. C'est volontaire : inventer
            une échéance sur un poste de sécurité serait interpréter un barème qu'on n'a pas.
          </p>
          <button className="bouton" disabled={!operation.trim()} onClick={() => void poser()}>
            Suivre ce poste
          </button>
          <button className="lien" onClick={() => setSaisie(false)}>Annuler</button>
        </div>
      ) : (
        <button className="lien" onClick={() => setSaisie(true)}>Suivre un poste d'usure</button>
      )}
    </>
  )
}
