import { useCallback, useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  anneesSaisies, bilanSaison, reportPossible, reporter, type Bilan, type Report,
} from '../db/bilan'
import { ecartJours } from '../db/accueil'
import { repereMensuel } from '../db/budget'
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
export function Saison({ db, onArgentParPoste }: {
  db: PowerSyncDatabase
  /** LA PORTE VERS L'ANALYSE, PRÉ-RÉGLÉE SUR FINANCE · POSTE — 1er septembre
   *  2026. Ce bilan dit « dépensé : 2 180 € » et s'arrête là ; la composition de
   *  ces 2 180 € vivait au fond du garage, verrouillée sur l'année courante.
   *  C'est le lien qui manquait entre le chiffre et sa forme.
   *
   *  `null` quand rien n'est saisi : App.tsx le retire plutôt que de laisser un
   *  lien qui ouvre un écran sans matière. */
  /** Reçoit l'année REGARDÉE : la porte ouvre sur la saison qu'on quitte,
   *  pas sur celle que l'analyse choisirait par défaut. */
  onArgentParPoste: ((annee: number) => void) | null
}) {
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
  /* ⚠ LE REPÈRE SE REGARDE AVANT DE S'AFFIRMER. Il était écrit
     `repereMensuel(b.budgetCentimes)` suivi d'un `!`, sous le seul garde
     `budgetCentimes != null` — or `repereMensuel` rend aussi `null` sur un
     plafond à zéro, et le `!` passait alors ce `null` à `formaterEuros`, qui rend
     « 0 € ». Un repère mensuel de 0 € est un chiffre faux affiché avec aplomb :
     l'absence se rend, elle ne se calcule pas. */
  const repereDuMois = repereMensuel(b.budgetCentimes)

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

      {/* ⚠ LA PÉRIODE EST COLLÉE AU CHIFFRE ICI AUSSI — récit 19.1. « Budget
          déclaré : 500 € » relu six mois plus tard ne dit pas si ces 500 €
          valaient un mois ou douze, et c'est exactement le malentendu qui a
          coûté la remarque de Julian (« le coût est de 2180 mais le budget est
          de 500/mois »). Le repère mensuel se dit à côté, dérivé du plafond —
          jamais saisi séparément, sinon les deux montants finiraient par se
          contredire. */}
      {b.budgetCentimes != null && (
        <p className="note">
          Plafond posé pour l'année {b.annee} : {formaterEuros(b.budgetCentimes)}
          {repereDuMois != null && <>{' '}· soit un repère de {formaterEuros(repereDuMois)} par mois</>}
          {' '}· dépensé sur l'année {formaterEuros(b.depenseCentimes)}
        </p>
      )}

      {/* ⚠ UN LIEN, ET IL SUIT LE CHIFFRE QU'IL EXPLIQUE. Il est posé après tout
          ce que ce bilan dit de l'argent — le « dépensé » des chiffres, puis le
          plafond quand il y en a un — parce que c'est là qu'on se demande « en
          quoi ? ». En tête d'écran il serait passé avant le chiffre qu'il
          commente, donc avant la question.

          ⚠ ET IL NE PROMET AUCUNE ANNÉE. Les puces de ce bilan choisissent une
          saison ; le raccourci, lui, ne tourne que les DEUX PREMIÈRES molettes de
          l'analyse — domaine et axe — et la période là-bas vaut la saison la plus
          récente, comme partout ailleurs. Écrire « ta saison 2025 » sur ce lien
          alors qu'il ouvre 2026 serait exactement le défaut que ce produit paie
          le plus cher : une phrase qui contredit ce qu'elle montre. La période se
          retape en une puce une fois là-bas.

          ⚠ ET AUCUN CHIFFRE DESSUS. Un total posé sur un lien serait un cinquième
          montant dans un écran qui en compte déjà quatre, et il ne se rattacherait
          à rien — c'est l'argument qui a sorti « ce qu'elle a coûté » des trois
          cases du garage, mot pour mot (Garage.tsx). */}
      {onArgentParPoste && b.depenseCentimes > 0 && (
        <button className="lien" onClick={() => onArgentParPoste(b.annee)}>
          Cet argent, poste par poste
        </button>
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
