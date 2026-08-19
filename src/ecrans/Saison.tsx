import { useCallback, useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  anneesSaisies, bilanSaison, reportPossible, reporter, type Bilan, type Report,
} from '../db/bilan'
import { ecartJours } from '../db/accueil'
import { formaterChrono, formaterEuros } from '../db/depot'

/**
 * LE BILAN DE SAISON — FR-52, FR-55, FR-56.
 *
 * ⚠ IL ÉNONCE SA COMPLÉTUDE AVANT SES CHIFFRES, et pas après. « 11 roulages
 * saisis, 2 sans chrono » se lit d'abord ; c'est ce qui empêche les chiffres
 * qui suivent de prétendre à une exactitude que leur source n'a pas.
 *
 * Et il n'affiche AUCUNE MOYENNE. Une moyenne sur onze roulages dont deux sans
 * chrono est fausse deux fois : elle divise par le mauvais nombre, et elle
 * présente comme une mesure ce qui est une estimation.
 */
export function Saison({ db }: { db: PowerSyncDatabase }) {
  const [annees, setAnnees] = useState<number[]>([])
  const [annee, setAnnee] = useState<number | null>(null)
  const [b, setB] = useState<Bilan | null>(null)
  const [report, setReport] = useState<Report>(null)

  useEffect(() => {
    void anneesSaisies(db).then((l) => { setAnnees(l); setAnnee((a) => a ?? l[0] ?? null) })
  }, [db])

  const charger = useCallback(async () => {
    if (annee == null) return
    setB(await bilanSaison(db, annee))
    // Le report se propose pour l'année SUIVANTE : c'est là qu'il sert.
    setReport(await reportPossible(db, annee + 1))
  }, [db, annee])
  useEffect(() => { void charger() }, [charger])

  if (!annees.length || !b) return null

  const jours = b.du && b.au ? ecartJours(b.du, b.au) : 0

  return (
    <div className="bloc pile saison">
      <div className="rang">
        <span className="libelle">Saison {b.annee}</span>
        {annees.length > 1 && (
          <div className="puces">
            {annees.map((a) => (
              <button key={a} className="puce" data-actif={a === annee ? '1' : '0'}
                      onClick={() => setAnnee(a)}>{a}</button>
            ))}
          </div>
        )}
      </div>

      {/* FR-52 — la saison est un ÉTAT DÉRIVÉ : du premier au dernier roulage
          saisi. Aucune plage de dates, aucun réglage, aucune bascule. */}
      {b.du && b.au && (
        <p className="note">
          Du {b.du} au {b.au}
          {jours > 0 ? ` · ${jours} jours` : ''} — c'est ce que tu as saisi qui la borne,
          pas un calendrier.
        </p>
      )}

      {/* FR-55 — LA COMPLÉTUDE D'ABORD. */}
      <p className="texte">
        <b>{b.roulages}</b> roulage{b.roulages > 1 ? 's' : ''} saisi{b.roulages > 1 ? 's' : ''}
        {b.sansChrono > 0 ? `, ${b.sansChrono} sans chrono` : ''}
        {b.sansGroupe > 0 ? `, ${b.sansGroupe} sans groupe` : ''}.
      </p>

      <div className="chiffres-saison">
        <div><p className="et">circuits</p><p className="va">{b.circuits}</p></div>
        <div><p className="et">sessions</p><p className="va">{b.sessions}</p></div>
        <div>
          <p className="et">meilleur tour</p>
          <p className="va">{b.meilleurMs != null ? formaterChrono(b.meilleurMs) : '—'}</p>
        </div>
      </div>

      <div className="chiffres-saison">
        <div>
          <p className="et">dépensé</p>
          <p className="va">{b.depenseCentimes ? formaterEuros(b.depenseCentimes) : '—'}</p>
        </div>
        <div><p className="et">photos</p><p className="va">{b.photos}</p></div>
        <div><p className="et">gestes</p><p className="va">{b.gestes}</p></div>
      </div>

      {b.budgetCentimes != null && (
        <p className="note">
          Budget déclaré : {formaterEuros(b.budgetCentimes)}
          {' '}· consommé {formaterEuros(b.depenseCentimes)}
        </p>
      )}

      {report && (
        /* FR-56 — UN REPORT, PAS UNE PRÉVISION. Le produit ne modélise rien,
           ne majore de rien, n'applique aucune inflation. Il recopie un chiffre
           réel et laisse le pilote le corriger : une prévision aurait l'air
           plus intelligente, serait moins vraie, et appartiendrait au produit
           plutôt qu'au pilote. */
        <div className="bloc pile">
          <div className="libelle">pour {report.depuis + 1}</div>
          <p className="texte">
            {report.depuis} t'a coûté {formaterEuros(report.centimes)}.
          </p>
          <p className="note">
            Ce n'est pas une prévision, c'est un report : le même chiffre, reconduit tel quel.
            Il se corrige à la main ensuite.
          </p>
          <button className="bouton secondaire"
                  onClick={() => void reporter(db, report.depuis + 1, report.centimes).then(charger)}>
            Le reprendre pour {report.depuis + 1}
          </button>
        </div>
      )}
    </div>
  )
}
