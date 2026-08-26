import { useEffect, useRef, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  anneeSaison, creerDepense, enCentimes, listerMachines, type Cible, type Machine,
} from '../db/depot'
import { EXEMPLE_POSTE, jourDansLAnnee, NOM_POSTE, POSTES, type Poste } from '../db/budget'
import { aujourdhui } from '../db/vecu'
import { ecrireDepenseUneFois, type VerrouEcritureDepense } from './ecriture-depense'

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
 *
 * ⚠ LE JOUR D'UNE DÉPENSE EST CELUI DU PAIEMENT — tranché le 26 août 2026, et
 * tranché parce que le contraire s'est vu à l'écran. Cette saisie prenait la
 * date DE LA JOURNÉE quand la dépense en visait une : journée annoncée au
 * 4 octobre, engagement de 230 € payé en août, et le garage affichait « Par
 * mois · octobre 2026 · 230 € ». L'argent était sorti en août.
 *
 * Trois choses cassaient d'un coup, et c'est pourquoi c'est le jour du paiement
 * qui gagne :
 *   ① la migration déclare `date_jour` = « le jour où la dépense a été payée » ;
 *     le produit écrivait autre chose sous ce nom ;
 *   ② une liste « Par mois » qui contient un mois À VENIR se lit comme une
 *     prévision — exactement ce que les deux clauses d'argent refusent ;
 *   ③ depuis l'épique 17 les journées à venir sont de premier rang, donc ce
 *     n'était pas un bord : c'était LE chemin de l'engagement.
 *
 * La journée n'est pas perdue pour autant — elle reste la CIBLE de la dépense,
 * c'est à ça que servent `cible` et la colonne `roulage_id`, et l'écran le dit
 * en toutes lettres sous la puce. Ce qu'elle ne donne plus, c'est le JOUR.
 */

type Props = {
  db: PowerSyncDatabase
  /** Le roulage d'où l'on vient, s'il y en a un. Sans lui la cible « journée »
   *  n'a rien à désigner et ne s'affiche pas — plutôt que de s'afficher morte. */
  roulageId: string | null
  dateRoulage: string | null
  onFini: (centimes: number) => void | Promise<void>
  onAnnuler: () => void
}

export function Depense({ db, roulageId, dateRoulage, onFini, onAnnuler }: Props) {
  const [cible, setCible] = useState<Cible>(roulageId ? 'roulage' : 'saison')
  /** ⚠ CET ÉCRAN N'ÉCRIVAIT AUCUN POSTE, et ça se voyait ailleurs : la ligne
   *  « L'engagement » d'« Avant d'y aller » cherche `poste = 'engagement'` et
   *  restait donc affichée APRÈS le paiement, pour toujours. Une liste dont les
   *  lignes ne partent jamais est une liste qu'on cesse de lire.
   *  Présélectionné sur `engagement` quand on vient d'une journée — c'est le seul
   *  chemin qui y mène, et c'est ce qu'on y paie neuf fois sur dix — mais JAMAIS
   *  imposé : le pilote peut avoir payé ses pneus ce jour-là. */
  const [poste, setPoste] = useState<Poste>(roulageId ? 'engagement' : 'autre')
  const [montant, setMontant] = useState('')
  /* LE JOUR DU PAIEMENT. Aujourd'hui par défaut — on note en payant, ou le soir
     en rentrant — et corrigeable, parce que la facture retrouvée trois semaines
     plus tard est justement celle dont le mois serait faux sans ce champ.
     Le garage porte le MÊME champ, à la ligne près (Budget.tsx, `Ajouter`) :
     deux saisies de dépense qui ne datent pas pareil produiraient deux sortes
     de dépenses, et c'est déjà arrivé sur la colonne `poste`. */
  const [jour, setJour] = useState(aujourdhui())
  const [libelle, setLibelle] = useState('')
  const [machines, setMachines] = useState<Machine[]>([])
  const [machineId, setMachineId] = useState<string | null>(null)
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enregistree, setEnregistree] = useState<number | null>(null)
  const verrou = useRef<VerrouEcritureDepense>({ enregistree: false, enVol: false })

  useEffect(() => {
    void listerMachines(db).then((m) => {
      setMachines(m)
      // Une seule moto répond à la question sans choix. À plusieurs, aucune ne
      // gagne parce qu'elle est arrivée en premier dans la requête.
      setMachineId((a) => a ?? (m.length === 1 ? m[0].id : null))
    })
  }, [db])

  const centimes = enCentimes(montant)
  // Un champ date vidé à la main rend `''` : on retombe sur aujourd'hui plutôt
  // que d'écrire une ligne sans jour. Les seules dépenses sans mois du produit
  // sont celles d'avant la colonne, et il n'a pas à s'en fabriquer de nouvelles.
  const leJour = /^\d{4}-\d{2}-\d{2}$/.test(jour) ? jour : aujourdhui()
  /* ⚠ LA SAISON DE L'ÉCRAN, ET LE JOUR NE PEUT PAS EN SORTIR. Les deux lectures
     du budget filtrent sur une seule année ; un jour de décembre dernier écrit
     une ligne que plus aucun écran ne montre. `min`/`max` ne suffisent pas — une
     date tapée à la main hors bornes ressort telle quelle dans `value` — donc la
     borne est ici, et l'écran DIT ce qu'il refuse au lieu de corriger en douce. */
  const saison = anneeSaison(aujourdhui())
  const dansLAnnee = jourDansLAnnee(leJour, saison)
  // La cible machine EXIGE une machine : une dépense de moto sans moto n'est
  // pas une dépense de saison déguisée, c'est une saisie incomplète.
  const pret = centimes != null && centimes > 0 && dansLAnnee
    && (cible !== 'machine' || !!machineId)

  const valider = async () => {
    if (!pret || centimes == null || enregistree != null) return
    setOccupe(true); setErreur(null)
    try {
      const resultat = await ecrireDepenseUneFois(
        verrou.current,
        () => creerDepense(db, {
          cible,
          roulageId: cible === 'roulage' ? roulageId : null,
          machineId: cible === 'machine' ? machineId : null,
          centimes,
          libelle: libelle.trim(),
          poste,
          // Le jour du PAIEMENT, celui que le pilote a sous les yeux. Il fixe la
          // saison (AD-18) et il fixe le mois — et il ne se dérive plus de la
          // journée visée, qui pouvait être à venir.
          date: leJour,
        }),
        () => onFini(centimes),
        // Dès cet instant la ligne existe. Même si le total refuse ensuite de se
        // relire, aucun contrôle de cet écran ne doit pouvoir la recréer.
        () => setEnregistree(centimes),
      )
      if (resultat === 'a_relire') {
        setErreur(
          'La dépense est enregistrée, mais le total n’a pas pu être relu. Ne la saisis pas à nouveau.')
      }
    } catch {
      setErreur('La dépense n’a pas été enregistrée. La saisie reste ici : réessaie.')
    } finally {
      setOccupe(false)
    }
  }

  const relire = async () => {
    if (enregistree == null || verrou.current.enVol) return
    verrou.current.enVol = true
    setOccupe(true); setErreur(null)
    try {
      await onFini(enregistree)
    } catch {
      setErreur('La dépense reste enregistrée, mais le total n’a pas pu être relu.')
    } finally {
      verrou.current.enVol = false
      setOccupe(false)
    }
  }

  if (enregistree != null) return (
    <section className="depense pile" data-enregistree="1">
      <p className="libelle">Dépense enregistrée</p>
      <p className="texte" role="status">
        La dépense est gardée. Il reste seulement à relire le total.
      </p>
      {erreur && <p className="mot-erreur" role="alert">{erreur}</p>}
      <button type="button" className="bouton" disabled={occupe}
              onClick={() => void relire()}>
        {occupe ? 'relecture…' : 'Relire le total'}
      </button>
      <button type="button" className="bouton secondaire" disabled={occupe}
              onClick={onAnnuler}>Retour</button>
    </section>
  )

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

      {/* ⚠ LE POSTE SE CHOISIT ICI, ET IL N'ÉTAIT NULLE PART. Cet écran écrivait
          des dépenses SANS POSTE : elles remontaient « Sans poste » au budget, et
          surtout la ligne « L'engagement » d'« Avant d'y aller » — qui cherche
          `poste = 'engagement'` — restait affichée après le paiement, pour
          toujours. La liste promet que chaque ligne disparaît quand c'est réglé.
          La liste est FERMÉE à dessein (voir POSTES) : un champ libre produirait
          « essence », « Essence » et « carburant » dans la même saison. */}
      <div className="pile">
        <div className="libelle">De quoi il s'agit</div>
        <div className="puces">
          {POSTES.map((p) => (
            <button key={p} type="button" className="puce" data-actif={poste === p ? '1' : '0'}
                    aria-pressed={poste === p}
                    onClick={() => setPoste(p)}>{NOM_POSTE[p].toUpperCase()}</button>
          ))}
        </div>
        {/* Un repère, jamais une règle : « transport » ne dit rien tout seul,
            « remorque, péage, hôtel » se reconnaît immédiatement. */}
        <p className="note">{EXEMPLE_POSTE[poste]}</p>
      </div>

      <div className="pile">
        <div className="libelle">À quoi ça se rattache</div>
        <div className="puces">
          {roulageId && (
            <button type="button" className="puce" data-actif={cible === 'roulage' ? '1' : '0'}
                    aria-pressed={cible === 'roulage'}
                    onClick={() => setCible('roulage')}>CETTE JOURNÉE</button>
          )}
          {/* FR-26 : ce qui est une pièce se rattache à la MOTO, jamais au
              roulage pendant lequel on l'a achetée. */}
          <button type="button" className="puce" data-actif={cible === 'machine' ? '1' : '0'}
                  aria-pressed={cible === 'machine'}
                  onClick={() => setCible('machine')}>PIÈCE OU ENTRETIEN</button>
          <button type="button" className="puce" data-actif={cible === 'saison' ? '1' : '0'}
                  aria-pressed={cible === 'saison'}
                  onClick={() => setCible('saison')}>LA SAISON</button>
        </div>
        {/* ⚠ CE QUE LA JOURNÉE DONNE, ET CE QU'ELLE NE DONNE PAS. Elle est la
            CIBLE — la dépense lui est rattachée par `roulage_id` et compte dans
            son coût — et elle ne donne PAS son jour à la dépense. Sans cette
            phrase la distinction reste dans le code : un engagement payé en août
            pour une journée d'octobre s'affichait « octobre » au garage, et rien
            à l'écran ne permettait de s'en apercevoir. */}
        {cible === 'roulage' && dateRoulage && (
          <p className="note">
            Rattachée à la journée du {dateRoulage}. C'est ce qu'elle vise, pas le jour
            où tu l'as payée — celui-là se saisit plus bas.
          </p>
        )}
      </div>

      {cible === 'machine' && (
        <div className="pile">
          <div className="libelle">Quelle moto</div>
          {machines.length ? (
            <div className="puces">
              {machines.map((m) => (
                <button key={m.id} type="button" className="puce" data-actif={machineId === m.id ? '1' : '0'}
                        aria-pressed={machineId === m.id}
                        onClick={() => setMachineId(m.id)}>{m.modele.toUpperCase()}</button>
              ))}
            </div>
          ) : (
            <p className="texte">
              {/* FR-13 vaut pour TOUT le produit, pas seulement l'accueil : un libellé
                  énonce un fait, jamais une injonction. « Déclare-la d'abord » était un
                  impératif — il posait un ordre là où il suffisait de poser le chemin. */}
              Aucune moto au garage. Une dépense de moto se rattache à une moto.
            </p>
          )}
        </div>
      )}

      <div className="pile">
        <label className="libelle" htmlFor="jour">Le jour où tu l'as payée</label>
        <input id="jour" className="champ" type="date" value={jour}
               min={`${saison}-01-01`} max={`${saison}-12-31`}
               onChange={(e) => setJour(e.target.value)} />
        {/* La borne franchie à la main se DIT. Le produit ne corrige pas en
            douce vers aujourd'hui : une date remplacée sans le dire est une
            saisie perdue, et c'est le pilote qui sait ce qu'il voulait écrire. */}
        {!dansLAnnee && (
          <p className="note">
            Ce jour est hors de l'année {saison}. Le budget du garage ne montre que
            l'année en cours : une dépense datée d'une autre année n'y apparaîtrait
            nulle part.
          </p>
        )}
      </div>

      <div className="pile">
        <label className="libelle" htmlFor="libelle">Quoi · facultatif</label>
        <input id="libelle" className="champ" value={libelle} onChange={(e) => setLibelle(e.target.value)}
               placeholder="Pneus, essence, engagement…" autoComplete="off" />
      </div>

      {erreur && <p className="mot-erreur" role="alert">{erreur}</p>}

      <button type="button" className="bouton" disabled={!pret || occupe} onClick={() => void valider()}>
        {occupe ? 'enregistrement…' : 'Enregistrer la dépense'}
      </button>
      <button type="button" className="bouton secondaire" onClick={onAnnuler}>Annuler la saisie</button>

      <p className="note">
        La saison, c'est {anneeSaison(leJour)} — l'année du PAIEMENT, fixée maintenant
        et jamais recalculée. Une journée visée dans une autre année n'y change rien :
        l'argent est sorti quand il est sorti.
      </p>
    </section>
  )
}
