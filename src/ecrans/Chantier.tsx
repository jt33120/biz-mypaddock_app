import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  Check, ChevronDown, ChevronRight, ChevronUp, ExternalLink, Flag, Plus, Receipt, ShoppingCart,
  Snowflake, Wrench, X, type LucideIcon,
} from 'lucide-react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  achatsDuChantier, ajouterAchat, ajouterEtape, annulerAchat, chantierDuStatut, chantierOuvert, declarerStatut,
  deplacerEtape, etapesDuChantier, ETAPES_COURANTES, GENRE_DU_STATUT, hoteDe, horlogesDeLaMachine,
  jourCourt, libelleDuChantier, lienAcceptable, marquerAchete, NOM_MARCHAND, NOM_STATUT,
  partirDesEtapesCourantes, rechercheChez, resumer, retirerAchat, retirerEtape, rouvrirEtape,
  STATUTS_MACHINE, terminerEtape,
  type Achat, type Chantier, type Etape, type GenreChantier, type Marchand, type Resume,
  type StatutMachine,
} from '../db/chantier'
import { CATEGORIES_INTERVENTION, NOM_CATEGORIE, type Categorie } from '../db/atelier'
import { enCentimes, formaterEuros, type Machine } from '../db/depot'
import { aujourdhui } from '../db/vecu'
import { Icone, type Nom } from './Icones'
import { useGeste } from './geste'
import '../styles/chantier.css'

/**
 * LE STATUT ET LE CHANTIER — retour de Julian du 16 septembre 2026.
 *
 * Trois surfaces, et chacune a une seule question :
 *   · `StatutMoto`, dans la carte du garage — « dans quel état je la déclare ? »
 *   · `RaccourciChantier`, sous la carte — « où en est l'hiver ? »
 *   · `PageChantier`, en page entière comme un poste d'atelier — « qu'est-ce que
 *     je fais, dans quel ordre, et qu'est-ce que ça va coûter ? »
 *
 * ⚠ AUCUNE BARRE, AUCUN « 3 SUR 7 » (FR-50). Le chantier se dit en COMPTES —
 * « 2 faites · 5 à venir » — et par LA PROCHAINE ÉTAPE, en grand : c'est elle
 * qu'on vient chercher en ouvrant le garage, pas un pourcentage.
 *
 * ⚠ LA COULEUR NE PORTE JAMAIS LE STATUT SEULE (UX-DR8). Le givre sur la scène
 * répète le badge, il ne le remplace pas : icône + mot + forme, toujours.
 */

const ICONE_STATUT: Record<StatutMachine, LucideIcon> = {
  prete: Flag,
  en_reparation: Wrench,
  hivernage: Snowflake,
}

/** Le tracé d'atelier de chaque catégorie — le même qu'à l'atelier, parce
 *  qu'une étape cochée ATTERRIT dans ce carnet-là. */
const TRACE: Record<Categorie, Nom> = {
  entretien: 'cle',
  amelioration: 'courbe',
  reparation_non_vitale: 'caisse',
}

const NOM_GENRE: Record<GenreChantier, string> = {
  hivernage: 'hivernage',
  reparation: 'réparation',
}

const plur = (n: number, un: string, plusieurs: string) => `${n} ${n > 1 ? plusieurs : un}`

/** Le modèle sans son numéro de course — « CBR 1000 RR · 83 » cherche mal. */
const modeleCourt = (m: Machine) => m.modele.split('·')[0].trim()

/* ═══ ① LE STATUT, DANS LA CARTE ════════════════════════════════════════ */

/**
 * LE BADGE ET SON PANNEAU. Le badge dit le statut ; le taper ouvre les trois
 * choix, et le panneau DIT CE QUE LE CHOIX VA FAIRE avant qu'on le confirme :
 * ouvrir un chantier, ou clore celui en cours — en nommant les étapes qui n'ont
 * pas été cochées. Une clôture annoncée n'est pas une clôture subie.
 */
export function StatutMoto({ db, machine, onEcrit }: {
  db: PowerSyncDatabase; machine: Machine; onEcrit: () => void
}) {
  const [ouvert, setOuvert] = useState(false)
  const [choix, setChoix] = useState<StatutMachine>(machine.statut)
  const [ouverts, setOuverts] = useState<{ chantier: Chantier; nonFaites: string[] }[]>([])
  const idPanneau = useId()

  useEffect(() => { setChoix(machine.statut); setOuvert(false) }, [machine.id, machine.statut])
  useEffect(() => {
    if (!ouvert) return
    let vivant = true
    void (async () => {
      const liste: { chantier: Chantier; nonFaites: string[] }[] = []
      for (const g of ['hivernage', 'reparation'] as const) {
        const c = await chantierOuvert(db, machine.id, g)
        if (!c) continue
        const etapes = await etapesDuChantier(db, c.id)
        liste.push({ chantier: c, nonFaites: etapes.filter((e) => !e.faite_le).map((e) => e.libelle) })
      }
      if (vivant) setOuverts(liste)
    })()
    return () => { vivant = false }
  }, [db, machine.id, ouvert])

  const [declarer, occupe] = useGeste(async () => {
    await declarerStatut(db, machine.id, choix, aujourdhui())
    setOuvert(false)
    onEcrit()
  })

  const Icone_ = ICONE_STATUT[machine.statut]
  const genre = GENRE_DU_STATUT[choix]
  const dejaOuvert = genre ? ouverts.find((o) => o.chantier.genre === genre) : null
  const inchange = choix === machine.statut

  return (
    <>
      <div className="garage-statut">
        <button type="button" className="statut-moto" data-statut={machine.statut}
                aria-expanded={ouvert} aria-controls={idPanneau}
                onClick={() => setOuvert(!ouvert)}>
          <Icone_ size={16} aria-hidden="true" />
          <span className="statut-mot">{NOM_STATUT[machine.statut]}</span>
          {machine.statut_depuis && (
            <span className="statut-depuis">depuis le {jourCourt(machine.statut_depuis)}</span>
          )}
          {ouvert ? <X size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
        </button>
      </div>

      {ouvert && (
        <div id={idPanneau} className="pile statut-panneau">
          <p className="libelle">Je la déclare</p>
          <div className="puces" role="group" aria-label="État de la moto">
            {STATUTS_MACHINE.map((s) => {
              const I = ICONE_STATUT[s]
              return (
                <button key={s} type="button" className="puce statut-puce"
                        data-actif={choix === s ? '1' : '0'} aria-pressed={choix === s}
                        onClick={() => setChoix(s)}>
                  <I size={18} aria-hidden="true" />
                  <span>{NOM_STATUT[s]}</span>
                </button>
              )
            })}
          </div>

          <p className="note" role="status">
            {inchange
              ? 'C’est déjà son état.'
              : genre
                ? dejaOuvert
                  ? `Le chantier « ${dejaOuvert.chantier.libelle} » est déjà ouvert : il reprend là où il en est.`
                  : `Un chantier « ${libelleDuChantier(genre, aujourdhui())} » s’ouvre : l’ordre de travail et les achats, avec les étapes du précédent s’il y en a eu un.`
                : ouverts.length
                  ? ouverts.map((o) => o.nonFaites.length
                    ? `« ${o.chantier.libelle} » se clôt. ${plur(o.nonFaites.length, 'étape n’a', 'étapes n’ont')} pas été cochée${o.nonFaites.length > 1 ? 's' : ''} : ${o.nonFaites.join(', ')}. Elles restent lisibles.`
                    : `« ${o.chantier.libelle} » se clôt, toutes ses étapes faites.`).join(' ')
                  : 'Aucun chantier en cours.'}
          </p>

          <button type="button" className="bouton" disabled={inchange || occupe}
                  onClick={() => void declarer()}>
            {occupe ? 'enregistrement…'
              : choix === 'prete' ? 'La déclarer prête'
                : choix === 'hivernage' ? 'Passer en hivernage' : 'Passer en réparation'}
          </button>
        </div>
      )}
    </>
  )
}

/* ═══ ② LE RACCOURCI, SOUS LA CARTE ═════════════════════════════════════ */

/** Lire un chantier et le tenir à jour : une étape cochée sur un autre
 *  téléphone arrive par la synchronisation, pas par un `onEcrit`. */
function useChantier(db: PowerSyncDatabase, chantierId: string | null) {
  const [etat, setEtat] = useState<{ etapes: Etape[]; achats: Achat[] } | null>(null)
  const lecture = useRef(0)
  const charger = useCallback(async () => {
    const n = ++lecture.current
    if (!chantierId) { setEtat(null); return }
    const [etapes, achats] = await Promise.all([
      etapesDuChantier(db, chantierId), achatsDuChantier(db, chantierId)])
    if (n === lecture.current) setEtat({ etapes, achats })
  }, [db, chantierId])
  useEffect(() => {
    const stop = db.onChange({ onChange: () => { void charger() } },
      { tables: ['chantier_etape', 'achat', 'depense', 'horloge'], throttleMs: 80 })
    void charger()
    return () => { stop(); lecture.current++ }
  }, [db, charger])
  return [etat, charger] as const
}

/**
 * LE CHANTIER SOUS LA CARTE — la prochaine étape en titre, l'estimation à droite.
 *
 * Il n'apparaît que si la moto est en hivernage ou en réparation. S'il manque
 * (le statut est arrivé d'un téléphone d'avant les chantiers), il s'ouvre d'un
 * tap plutôt que de laisser un statut sans son ordre de travail.
 */
export function RaccourciChantier({ db, machine, onOuvrir, onEcrit }: {
  db: PowerSyncDatabase; machine: Machine
  onOuvrir: (chantierId: string) => void; onEcrit: () => void
}) {
  const genre = GENRE_DU_STATUT[machine.statut]
  const [chantier, setChantier] = useState<Chantier | null | undefined>(undefined)
  const lecture = useRef(0)
  const charger = useCallback(async () => {
    const n = ++lecture.current
    const c = await chantierDuStatut(db, machine.id)
    if (n === lecture.current) setChantier(c)
  }, [db, machine.id])
  useEffect(() => {
    const stop = db.onChange({ onChange: () => { void charger() } },
      { tables: ['chantier', 'machine'], throttleMs: 80 })
    void charger()
    return () => { stop() }
  }, [db, charger, machine.statut])
  const [etat] = useChantier(db, chantier?.id ?? null)
  const [ouvrir, occupe] = useGeste(async () => {
    const id = await declarerStatut(db, machine.id, machine.statut, machine.statut_depuis ?? aujourdhui())
    await charger(); onEcrit()
    if (id) onOuvrir(id)
  })

  if (!genre || chantier === undefined) return null
  const IconeGenre = genre === 'hivernage' ? Snowflake : Wrench

  if (!chantier) {
    return (
      <button type="button" className="lien chantier-ouvrir" disabled={occupe}
              onClick={() => void ouvrir()}>
        <IconeGenre size={16} aria-hidden="true" />
        {occupe ? 'ouverture…' : genre === 'hivernage' ? "Ouvrir le chantier d'hivernage" : 'Ouvrir le chantier de réparation'}
      </button>
    )
  }

  const r: Resume | null = etat ? resumer(etat.etapes, etat.achats) : null
  return (
    <button type="button" className="bloc atelier chantier-raccourci" data-genre={genre}
            onClick={() => onOuvrir(chantier.id)}>
      <span className="pile chantier-raccourci-corps">
        <span className="libelle chantier-kicker">
          <IconeGenre size={14} aria-hidden="true" /> Chantier · {NOM_GENRE[genre]}
        </span>
        <span className="chantier-raccourci-titre">
          {!r ? '…'
            : r.prochaine
              ? <><Icone nom={TRACE[r.prochaine.categorie]} taille={20} className="icone-atelier" />
                  <span>Prochaine étape : {r.prochaine.libelle}</span></>
              : etat!.etapes.length ? 'Toutes les étapes sont faites' : 'Aucune étape encore'}
        </span>
        {r && (
          <span className="sous-titre">
            {plur(r.faites, 'faite', 'faites')} · {r.aVenir} à venir · {plur(r.aAcheter, 'achat noté', 'achats notés')}
          </span>
        )}
      </span>
      <span className="pile chantier-raccourci-chiffre">
        <span className="chiffre hud-24">{r ? (r.estimeCentimes ? `≈ ${formaterEuros(r.estimeCentimes)}` : '—') : '…'}</span>
        <span className="sous-titre">estimés</span>
      </span>
      <ChevronRight size={20} className="signe" aria-hidden="true" />
    </button>
  )
}

/* ═══ ③ LA PAGE DU CHANTIER ═════════════════════════════════════════════ */

export function PageChantier({ db, machine, chantierId, onFermer, onEcrit }: {
  db: PowerSyncDatabase; machine: Machine; chantierId: string
  onFermer: () => void; onEcrit: () => void
}) {
  const [chantier, setChantier] = useState<Chantier | null>(null)
  const [etat, charger] = useChantier(db, chantierId)
  const [souci, setSouci] = useState<string | null>(null)
  useEffect(() => {
    void db.getOptional<Chantier>(
      `SELECT id, machine_id, genre, libelle, ouvert_le, clos_le FROM chantier WHERE id = ?`,
      [chantierId]).then(setChantier)
  }, [db, chantierId])
  // La page s'ouvre en haut : le garage peut avoir été défilé jusqu'au budget.
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }, [])

  /** UN SEUL GESTE POUR TOUTE LA PAGE : il verrouille, relit, prévient le garage.
   *  Chaque bouton nomme la fonction qu'il appelle, ce qui laisse la garde du
   *  destructif lire ce que fait chaque bouton, et non ce que fait ce relais. */
  const [agir, occupe] = useGeste(async (f: () => Promise<unknown>) => {
    setSouci(null)
    const issue = await f()
    if (issue && typeof issue === 'object' && 'ok' in issue && !issue.ok)
      setSouci('Ce geste porte une photo ou une facture au carnet : il se reprend depuis '
        + "l'atelier, pas d'ici.")
    await charger(); onEcrit()
  })

  if (!chantier || !etat) {
    return (
      <section className="garage garage-selection chantier-page">
        <header className="garage-tete">
          <button type="button" className="lien" onClick={onFermer}>← garage</button>
        </header>
        <p className="note">…</p>
      </section>
    )
  }

  const r = resumer(etat.etapes, etat.achats)
  const IconeGenre = chantier.genre === 'hivernage' ? Snowflake : Wrench
  const prochaineId = etat.etapes.find((e) => !e.faite_le)?.id ?? null

  return (
    <section className="garage garage-selection chantier-page" data-genre={chantier.genre}>
      <header className="garage-tete">
        <button type="button" className="lien" onClick={onFermer}>← garage</button>
        <p className="libelle">{machine.modele}</p>
      </header>

      <div className="garage-titre chantier-titre">
        <p className="marque"><IconeGenre size={14} aria-hidden="true" /> chantier · {NOM_GENRE[chantier.genre]}</p>
        <h1 className="modele">{chantier.libelle}</h1>
        <p className="sous-titre">
          ouvert le {jourCourt(chantier.ouvert_le)}
          {chantier.clos_le ? ` · clos le ${jourCourt(chantier.clos_le)}` : ''}
        </p>
      </div>

      <div className="chiffres">
        <div>
          <p className="et">faites</p>
          <p className="va">{r.faites}</p>
        </div>
        <div>
          <p className="et">à venir</p>
          <p className="va">{r.aVenir}</p>
        </div>
        <div>
          <p className="et">achats estimés</p>
          <p className="va chantier-va-euros">{r.estimeCentimes ? `≈ ${formaterEuros(r.estimeCentimes)}` : '—'}</p>
        </div>
      </div>

      {souci && <p className="mot-erreur" role="alert">{souci}</p>}

      {/* ─── L'ORDRE DE TRAVAIL ─────────────────────────────────────────── */}
      <p className="libelle chantier-section">L'ordre de travail</p>
      {!etat.etapes.length && (
        <div className="bloc pile">
          <p className="note">
            Aucune étape. Ajoute-les dans l'ordre où tu les feras — ou pars des étapes que
            tout garage connaît, à adapter : ce n'est pas le barème de ta moto.
          </p>
          <button type="button" className="bouton secondaire" disabled={occupe}
                  onClick={() => void agir(() => partirDesEtapesCourantes(db, chantier.id))}>
            Partir des {ETAPES_COURANTES.length} étapes courantes
          </button>
        </div>
      )}

      <ol className="chantier-etapes">
        {etat.etapes.map((e, i) => (
          <LigneEtape key={e.id} db={db} e={e} rang={i + 1} premiere={i === 0}
                      derniere={i === etat.etapes.length - 1}
                      prochaine={e.id === prochaineId} occupe={occupe}
                      achats={etat.achats.filter((a) => a.etape_id === e.id)}
                      agir={agir} />
        ))}
      </ol>

      <AjoutEtape db={db} machine={machine} chantierId={chantier.id} occupe={occupe} agir={agir} />

      {/* ─── LES ACHATS ─────────────────────────────────────────────────── */}
      <ListeAchats db={db} machine={machine} chantier={chantier} etapes={etat.etapes}
                   achats={etat.achats} resume={r} occupe={occupe} agir={agir} />
    </section>
  )
}

type Agir = (f: () => Promise<unknown>) => Promise<void>

/**
 * UNE ÉTAPE, À SON RANG. La prochaine est OUVERTE — c'est celle qu'on vient
 * faire ; les autres se déplient d'un tap. Une étape faite se replie sur sa
 * coche, sa date et le mot « au carnet » : la preuve de ce qu'elle a produit.
 */
function LigneEtape({ db, e, rang, premiere, derniere, prochaine, achats, occupe, agir }: {
  db: PowerSyncDatabase; e: Etape; rang: number; premiere: boolean; derniere: boolean
  prochaine: boolean; achats: Achat[]; occupe: boolean; agir: Agir
}) {
  const [deplie, setDeplie] = useState(prochaine)
  const [autreJour, setAutreJour] = useState(false)
  const [jour, setJour] = useState(aujourdhui())
  useEffect(() => { if (prochaine) setDeplie(true) }, [prochaine])
  const faite = !!e.faite_le

  return (
    <li className="chantier-etape" data-faite={faite ? '1' : '0'} data-prochaine={prochaine ? '1' : '0'}>
      <button type="button" className="chantier-etape-tete" aria-expanded={deplie}
              onClick={() => setDeplie(!deplie)}>
        <span className="chantier-rang" aria-hidden="true">
          {faite ? <Check size={16} strokeWidth={2.4} /> : String(rang).padStart(2, '0')}
        </span>
        <span className="pile chantier-etape-nom">
          <span className="texte">{e.libelle}</span>
          <span className="chantier-categorie">
            <Icone nom={TRACE[e.categorie]} taille={14} />
            {NOM_CATEGORIE[e.categorie]}
            {faite && <> · faite le {jourCourt(e.faite_le!)}</>}
            {!faite && prochaine && <> · prochaine</>}
          </span>
        </span>
        {deplie ? <ChevronUp size={18} className="signe" aria-hidden="true" />
          : <ChevronDown size={18} className="signe" aria-hidden="true" />}
      </button>

      {deplie && (
        <div className="pile chantier-etape-corps">
          {e.note && <p className="note">{e.note}</p>}
          {e.horloge_operation && (
            <p className="sous-titre">
              {faite ? 'a fait repartir' : 'fera repartir'} l'horloge « {e.horloge_operation} »
            </p>
          )}
          {achats.length > 0 && (
            <p className="sous-titre">
              <ShoppingCart size={12} aria-hidden="true" />{' '}
              {achats.map((a) => `${a.libelle}${a.achete_le ? ' (acheté)' : ''}`).join(' · ')}
            </p>
          )}

          {faite ? (
            <>
              <p className="libelle faible">consignée au carnet · {NOM_CATEGORIE[e.categorie]}</p>
              <button type="button" className="lien destructif" disabled={occupe}
                      onClick={() => void agir(() => rouvrirEtape(db, e.id))}>
                Pas encore faite
              </button>
            </>
          ) : autreJour ? (
            <div className="rang chantier-jour">
              <input className="champ" type="date" value={jour} max={aujourdhui()}
                     aria-label={`Jour où « ${e.libelle} » a été faite`}
                     onChange={(ev) => setJour(ev.target.value)} />
              <button type="button" className="bouton secondaire" disabled={!jour || occupe}
                      onClick={() => void agir(() => terminerEtape(db, e.id, jour)).then(() => setAutreJour(false))}>
                C'était le {jour ? jourCourt(jour) : '…'}
              </button>
              <button type="button" className="lien" onClick={() => setAutreJour(false)}>Annuler</button>
            </div>
          ) : (
            <>
              <button type="button" className="bouton secondaire chantier-fait" disabled={occupe}
                      onClick={() => void agir(() => terminerEtape(db, e.id, aujourdhui()))}>
                <Check size={18} aria-hidden="true" /> C'est fait aujourd'hui
              </button>
              <button type="button" className="lien" onClick={() => setAutreJour(true)}>
                C'était un autre jour
              </button>
            </>
          )}

          <div className="rang chantier-etape-outils">
            <button type="button" className="lien chantier-fleche" disabled={premiere || occupe}
                    aria-label={`Monter « ${e.libelle} »`}
                    onClick={() => void agir(() => deplacerEtape(db, e.id, -1))}>
              <ChevronUp size={18} aria-hidden="true" />
            </button>
            <button type="button" className="lien chantier-fleche" disabled={derniere || occupe}
                    aria-label={`Descendre « ${e.libelle} »`}
                    onClick={() => void agir(() => deplacerEtape(db, e.id, 1))}>
              <ChevronDown size={18} aria-hidden="true" />
            </button>
            <button type="button" className="lien destructif" disabled={occupe}
                    aria-label={`retirer « ${e.libelle} »`}
                    onClick={() => void agir(() => retirerEtape(db, e.id))}>
              retirer
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

/** Ajouter une étape : son nom, SA CATÉGORIE (obligatoire, FR-46), et l'horloge
 *  qu'elle fera repartir si la moto en a une qui lui correspond. */
function AjoutEtape({ db, machine, chantierId, occupe, agir }: {
  db: PowerSyncDatabase; machine: Machine; chantierId: string; occupe: boolean; agir: Agir
}) {
  const id = useId()
  const [ouvert, setOuvert] = useState(false)
  const [libelle, setLibelle] = useState('')
  const [categorie, setCategorie] = useState<Categorie>('entretien')
  const [horloge, setHorloge] = useState('')
  const [horloges, setHorloges] = useState<{ id: string; operation: string }[]>([])
  useEffect(() => {
    if (ouvert) void horlogesDeLaMachine(db, machine.id).then(setHorloges)
  }, [db, machine.id, ouvert])

  if (!ouvert) {
    return (
      <button type="button" className="lien chantier-ajout" onClick={() => setOuvert(true)}>
        <Plus size={16} aria-hidden="true" /> Ajouter une étape
      </button>
    )
  }
  const poser = () => {
    if (!libelle.trim()) return
    void agir(() => ajouterEtape(db, chantierId, {
      libelle, categorie, horlogeId: categorie === 'entretien' && horloge ? horloge : null,
    })).then(() => { setLibelle(''); setHorloge('') })
  }
  return (
    <div className="bloc pile chantier-formulaire">
      <label className="libelle" htmlFor={`${id}-nom`}>L'étape</label>
      <input id={`${id}-nom`} className="champ" value={libelle} autoComplete="off"
             placeholder="Purge du liquide de frein"
             onChange={(ev) => setLibelle(ev.target.value)}
             onKeyDown={(ev) => { if (ev.key === 'Enter') poser() }} />
      <p className="libelle">Elle entrera au carnet</p>
      <div className="puces" role="group" aria-label="Catégorie d'atelier">
        {CATEGORIES_INTERVENTION.map((c) => (
          <button key={c} type="button" className="puce" data-actif={categorie === c ? '1' : '0'}
                  aria-pressed={categorie === c} onClick={() => setCategorie(c)}>
            {NOM_CATEGORIE[c]}
          </button>
        ))}
      </div>
      {categorie === 'entretien' && horloges.length > 0 && (
        <>
          <label className="libelle" htmlFor={`${id}-horloge`}>Horloge d'usure à faire repartir · facultatif</label>
          <select id={`${id}-horloge`} className="champ" value={horloge}
                  onChange={(ev) => setHorloge(ev.target.value)}>
            <option value="">aucune</option>
            {horloges.map((h) => <option key={h.id} value={h.id}>{h.operation}</option>)}
          </select>
        </>
      )}
      <button type="button" className="bouton secondaire" disabled={!libelle.trim() || occupe} onClick={poser}>
        Ajouter l'étape
      </button>
      <button type="button" className="lien" onClick={() => setOuvert(false)}>Fermer</button>
    </div>
  )
}

/* ─── LES ACHATS ───────────────────────────────────────────────────────── */

/**
 * LA LISTE DE COURSES. Deux sommes, JAMAIS additionnées : l'estimé (ce que le
 * pilote a noté) et l'acheté (ce que les dépenses disent). Les ajouter ferait un
 * total mi-fait mi-supposé, qui ne serait ni l'un ni l'autre.
 */
function ListeAchats({ db, machine, chantier, etapes, achats, resume, occupe, agir }: {
  db: PowerSyncDatabase; machine: Machine; chantier: Chantier; etapes: Etape[]; achats: Achat[]
  resume: Resume; occupe: boolean; agir: Agir
}) {
  const [voirAchetes, setVoirAchetes] = useState(false)
  const restants = achats.filter((a) => !a.achete_le)
  const achetes = achats.filter((a) => a.achete_le)

  return (
    <>
      <p className="libelle chantier-section"><ShoppingCart size={14} aria-hidden="true" /> À acheter</p>
      <div className="chiffres chantier-sommes">
        <div>
          <p className="et">estimé</p>
          <p className="va chantier-va-euros">{resume.estimeCentimes ? `≈ ${formaterEuros(resume.estimeCentimes)}` : '—'}</p>
          <p className="ou">
            {plur(resume.aAcheter, 'ligne', 'lignes')}
            {resume.sansPrix ? ` · ${resume.sansPrix} sans prix` : ''}
          </p>
        </div>
        <div>
          <p className="et">acheté</p>
          <p className="va chantier-va-euros">{resume.payeCentimes ? formaterEuros(resume.payeCentimes) : '—'}</p>
          <p className="ou">au budget</p>
        </div>
      </div>

      {!achats.length && (
        <p className="note">Rien de noté. Une ligne, un prix, une quantité : l'estimation se fait toute seule.</p>
      )}

      <ul className="chantier-achats">
        {restants.map((a) => (
          <LigneAchat key={a.id} db={db} a={a} etape={etapes.find((e) => e.id === a.etape_id) ?? null}
                      occupe={occupe} agir={agir} />
        ))}
      </ul>

      {achetes.length > 0 && (
        <>
          <button type="button" className="lien chantier-deplier" aria-expanded={voirAchetes}
                  onClick={() => setVoirAchetes(!voirAchetes)}>
            <Receipt size={16} aria-hidden="true" /> Déjà acheté · {achetes.length}
          </button>
          {voirAchetes && (
            <ul className="chantier-achats">
              {achetes.map((a) => (
                <li key={a.id} className="chantier-achat" data-achete="1">
                  <div className="rang">
                    <span className="texte">{a.libelle}</span>
                    <span className="chiffre">{a.paye_centimes != null ? formaterEuros(a.paye_centimes) : '—'}</span>
                  </div>
                  <p className="libelle faible">
                    acheté le {jourCourt(a.achete_le!)}
                    {a.paye_centimes == null ? ' · dépense retirée du budget' : ' · au budget'}
                  </p>
                  <button type="button" className="lien destructif" disabled={occupe}
                          onClick={() => void agir(() => annulerAchat(db, a.id))}>
                    Annuler l'achat
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <AjoutAchat db={db} machine={machine} chantier={chantier} etapes={etapes} occupe={occupe} agir={agir} />
    </>
  )
}

function LigneAchat({ db, a, etape, occupe, agir }: {
  db: PowerSyncDatabase; a: Achat; etape: Etape | null; occupe: boolean; agir: Agir
}) {
  const [payer, setPayer] = useState(false)
  const total = a.prix_centimes != null ? a.prix_centimes * a.quantite : null
  const [montant, setMontant] = useState(total != null ? String(total / 100).replace('.', ',') : '')
  const [jour, setJour] = useState(aujourdhui())
  const centimes = enCentimes(montant)
  const hote = hoteDe(a.url)

  return (
    <li className="chantier-achat">
      <div className="rang chantier-achat-tete">
        <span className="texte">{a.libelle}</span>
        <span className="chiffre hud-16">{total != null ? formaterEuros(total) : '—'}</span>
      </div>
      <p className="libelle faible">
        {a.prix_centimes != null ? `${a.quantite} × ${formaterEuros(a.prix_centimes)}` : `${a.quantite} × prix à trouver`}
        {' · '}{a.machine_id ? 'pour la moto' : 'pour le garage'}
        {etape ? ` · étape « ${etape.libelle} »` : ''}
      </p>
      {a.note && <p className="note">{a.note}</p>}

      {payer ? (
        <div className="pile chantier-payer">
          <div className="rang chantier-jour">
            <input className="champ chiffre" inputMode="decimal" value={montant}
                   aria-label={`Montant payé pour « ${a.libelle} », en euros`}
                   onChange={(ev) => setMontant(ev.target.value)} />
            <input className="champ" type="date" value={jour} max={aujourdhui()}
                   aria-label="Jour de l'achat" onChange={(ev) => setJour(ev.target.value)} />
          </div>
          <p className="note">
            Il entre au budget {a.machine_id ? 'sur la moto, en entretien' : 'sur la saison, en équipement'}.
          </p>
          <button type="button" className="bouton secondaire" disabled={centimes == null || !jour || occupe}
                  onClick={() => void agir(() => marquerAchete(db, a.id, { centimes: centimes!, jour }))
                    .then(() => setPayer(false))}>
            <Receipt size={18} aria-hidden="true" />
            {centimes != null ? `Payé ${formaterEuros(centimes)}` : 'Montant à saisir'}
          </button>
          <button type="button" className="lien" onClick={() => setPayer(false)}>Annuler</button>
        </div>
      ) : (
        <div className="chantier-achat-actions">
          <button type="button" className="bouton secondaire" disabled={occupe} onClick={() => setPayer(true)}>
            <Receipt size={18} aria-hidden="true" /> Acheté
          </button>
          {a.url && hote && (
            <a className="lien" href={a.url} target="_blank" rel="noreferrer noopener">
              <ExternalLink size={16} aria-hidden="true" /> {hote}
            </a>
          )}
          <button type="button" className="lien destructif" disabled={occupe}
                  aria-label={`retirer « ${a.libelle} »`}
                  onClick={() => void agir(() => retirerAchat(db, a.id))}>
            retirer
          </button>
        </div>
      )}
    </li>
  )
}

/**
 * AJOUTER UN ACHAT — et le pont vers les marchands.
 *
 * Les deux « Chercher sur… » ouvrent la recherche du marchand DANS LE NAVIGATEUR,
 * avec ce que le pilote a tapé. Il en rapporte le lien de la page, qui reste
 * attaché à la ligne. Voir `rechercheChez` pour pourquoi le prix ne se lit pas
 * tout seul, et pourquoi aucun lien n'est affilié.
 */
function AjoutAchat({ db, machine, chantier, etapes, occupe, agir }: {
  db: PowerSyncDatabase; machine: Machine; chantier: Chantier; etapes: Etape[]
  occupe: boolean; agir: Agir
}) {
  const id = useId()
  const [ouvert, setOuvert] = useState(false)
  const [libelle, setLibelle] = useState('')
  const [prix, setPrix] = useState('')
  const [quantite, setQuantite] = useState('1')
  const [pourLaMoto, setPourLaMoto] = useState(true)
  const [etapeId, setEtapeId] = useState('')
  const [lien, setLien] = useState('')

  if (!ouvert) {
    return (
      <button type="button" className="bouton secondaire chantier-ajout-achat" onClick={() => setOuvert(true)}>
        <Plus size={18} aria-hidden="true" /> Ajouter un achat
      </button>
    )
  }

  const centimes = prix.trim() ? enCentimes(prix) : null
  const prixInvalide = prix.trim() !== '' && centimes == null
  const qte = /^\d{1,3}$/.test(quantite.trim()) && Number(quantite) >= 1 ? Number(quantite) : null
  const url = lien.trim() ? lienAcceptable(lien) : null
  const lienInvalide = lien.trim() !== '' && url == null
  const requete = [libelle.trim(), pourLaMoto ? `${machine.marque} ${modeleCourt(machine)} ${machine.annee ?? ''}` : '']
    .filter(Boolean).join(' ').trim()
  const pret = libelle.trim() && qte && !prixInvalide && !lienInvalide

  const poser = () => {
    if (!pret) return
    void agir(() => ajouterAchat(db, {
      chantierId: chantier.id, machineId: pourLaMoto ? machine.id : null,
      etapeId: etapeId || null, libelle, quantite: qte!, prixCentimes: centimes, url,
    })).then(() => { setLibelle(''); setPrix(''); setQuantite('1'); setLien(''); setEtapeId('') })
  }

  return (
    <div className="bloc pile chantier-formulaire">
      <label className="libelle" htmlFor={`${id}-nom`}>Quoi</label>
      <input id={`${id}-nom`} className="champ" value={libelle} autoComplete="off"
             placeholder="Plaquettes avant" onChange={(ev) => setLibelle(ev.target.value)} />

      <div className="puces" role="group" aria-label="Pour quoi">
        <button type="button" className="puce" data-actif={pourLaMoto ? '1' : '0'} aria-pressed={pourLaMoto}
                onClick={() => setPourLaMoto(true)}>Pour la moto</button>
        <button type="button" className="puce" data-actif={!pourLaMoto ? '1' : '0'} aria-pressed={!pourLaMoto}
                onClick={() => { setPourLaMoto(false); setEtapeId('') }}>Pour le garage</button>
      </div>

      <div className="chantier-prix-qte">
        <div className="pile">
          <label className="libelle" htmlFor={`${id}-prix`}>Prix unitaire · €</label>
          <input id={`${id}-prix`} className="champ chiffre" inputMode="decimal" value={prix}
                 placeholder="41,67" onChange={(ev) => setPrix(ev.target.value)} />
        </div>
        <div className="pile">
          <label className="libelle" htmlFor={`${id}-qte`}>Quantité</label>
          <input id={`${id}-qte`} className="champ chiffre" inputMode="numeric" value={quantite}
                 onChange={(ev) => setQuantite(ev.target.value)} />
        </div>
      </div>
      {prixInvalide && <p className="mot-erreur" role="alert">Ce prix ne se lit pas : « 41,67 » ou « 42 ».</p>}

      {pourLaMoto && etapes.length > 0 && (
        <>
          <label className="libelle" htmlFor={`${id}-etape`}>Pour l'étape · facultatif</label>
          <select id={`${id}-etape`} className="champ" value={etapeId} onChange={(ev) => setEtapeId(ev.target.value)}>
            <option value="">aucune</option>
            {etapes.map((e) => <option key={e.id} value={e.id}>{e.ordre}. {e.libelle}</option>)}
          </select>
        </>
      )}

      <label className="libelle" htmlFor={`${id}-lien`}>Le lien de la page · facultatif</label>
      <input id={`${id}-lien`} className="champ" type="url" inputMode="url" value={lien} autoComplete="off"
             placeholder="https://www.dafy-moto.com/…" onChange={(ev) => setLien(ev.target.value)} />
      {lienInvalide && <p className="mot-erreur" role="alert">Ce lien ne se lit pas : il doit commencer par https://.</p>}

      <div className="chantier-marchands">
        {(['dafy', 'amazon'] as Marchand[]).map((m) => (
          <a key={m} className="lien" data-inactif={libelle.trim() ? '0' : '1'}
             href={libelle.trim() ? rechercheChez(m, requete) : undefined}
             aria-disabled={!libelle.trim()} target="_blank" rel="noreferrer noopener">
            <ExternalLink size={16} aria-hidden="true" /> Chercher sur {NOM_MARCHAND[m]}
          </a>
        ))}
      </div>
      <p className="note">
        La recherche s'ouvre dans ton navigateur et demande du réseau. Rapporte le lien de la
        page ici : il restera sur la ligne.
      </p>

      <button type="button" className="bouton secondaire" disabled={!pret || occupe} onClick={poser}>
        Ajouter à la liste
      </button>
      <button type="button" className="lien" onClick={() => setOuvert(false)}>Fermer</button>
    </div>
  )
}
