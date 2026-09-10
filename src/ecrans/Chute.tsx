import { useCallback, useEffect, useRef, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  chutesDuRoulage, completerChute, consignerChute, consignerReparationDeChute,
  coutDeLaChute, declarerAucunCrash, oublierChute, reparationsDeLaChute,
  reinitialiserStatutCrash, statutCrashDuRoulage, type Chute as Tombee,
  type StatutCrash,
} from '../db/chute'
import {
  lirePhoto, oublierPhoto, photosDeLaChute, verserPlusieurs, type Echec, type Photo,
} from '../db/photos'
import {
  DUREE_MAX_MS, lienVideoDistante, lireVideoLocale, oublierVideo, placeVideo,
  verserVideo, videosDeLaChute, type PlaceVideo, type Video,
} from '../db/video'
import { comprimer } from '../video/comprimer'
import { formaterPoids } from '../db/emporter'
import { enCentimes, formaterEuros } from '../db/depot'
import type { Categorie } from '../db/atelier'
import { Icone } from './Icones'
import { ecrirePuisRelire, useGeste } from './geste'
import { aujourdhui } from '../db/vecu'

type Props = {
  db: PowerSyncDatabase
  roulageId: string
  machineId: string | null
  date: string
  onEcrit: () => void
}

/**
 * Le statut est volontairement tri-état. `À renseigner` ne promet rien à un
 * futur acheteur ; `Aucun crash` est une déclaration explicite ; une chute
 * consignée fait passer la journée à `Crash documenté`. Aucune série, aucun
 * score et aucun jugement ne sont calculés à partir de ces faits.
 */
export function Chutes({ db, roulageId, machineId, date, onEcrit }: Props) {
  const [liste, setListe] = useState<Tombee[]>([])
  const [statut, setStatut] = useState<StatutCrash>('a_renseigner')
  const [saisie, setSaisie] = useState<string | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  const charger = useCallback(async () => {
    const [chutes, etat] = await Promise.all([
      chutesDuRoulage(db, roulageId),
      statutCrashDuRoulage(db, roulageId),
    ])
    setListe(chutes)
    setStatut(etat)
  }, [db, roulageId])
  useEffect(() => { void charger() }, [charger])

  const [consigner, occupe] = useGeste(async () => {
    const { valeur: id, relue } = await ecrirePuisRelire(
      () => consignerChute(db, { roulageId }), charger)
    setSaisie(id)
    if (!relue) setListe((l) => [...l, {
      id, roulage_id: roulageId, endroit: null, recit: null,
    }].sort((a, b) => a.id.localeCompare(b.id)))
    setStatut('documente')
    if (!relue) setErreur(
      'Le crash est enregistré, mais la liste n’a pas pu être relue. Ne le documente pas à nouveau : recharge la page.')
    onEcrit()
  }, 'Le crash n’a pas été documenté. Réessaie.', setErreur)
  const [declarerAucun, declare] = useGeste(async () => {
    const { relue } = await ecrirePuisRelire(
      () => declarerAucunCrash(db, roulageId), charger)
    setStatut('aucun')
    if (!relue) setErreur(
      '« Aucun crash » est enregistré, mais le statut n’a pas pu être relu. Recharge la page.')
    onEcrit()
  }, '« Aucun crash » n’a pas été enregistré. Réessaie.', setErreur)
  const [reinitialiser, reinitialise] = useGeste(async () => {
    const { relue } = await ecrirePuisRelire(
      () => reinitialiserStatutCrash(db, roulageId), charger)
    setStatut('a_renseigner')
    if (!relue) setErreur(
      'Le statut est remis à renseigner, mais il n’a pas pu être relu. Recharge la page.')
    onEcrit()
  }, 'Le statut n’a pas été remis à renseigner. Réessaie.', setErreur)

  const texteStatut = liste.length || statut === 'documente'
    ? 'Crash documenté'
    : statut === 'aucun' ? 'Aucun crash' : 'À renseigner'

  return (
    <section className="pile dossier-crash" aria-labelledby={`crash-${roulageId}`}>
      <div className="rang">
        <span className="rang" style={{ gap: 7 }}>
          <Icone nom="impact" taille={16} />
          <span id={`crash-${roulageId}`} className="libelle">Crash</span>
        </span>
        <span className="hud-12 faible statut-crash">{texteStatut}</span>
      </div>

      {liste.map((c) => (
        <UneChute key={c.id} db={db} c={c} ouverte={saisie === c.id}
                  machineId={machineId} date={date}
                  onEcrit={async () => { await charger(); onEcrit() }} />
      ))}

      <div className="rang actions-crash">
        {liste.length === 0 && statut === 'a_renseigner' && (
          <button type="button" className="lien" disabled={declare}
                  onClick={() => void declarerAucun()}>
            {declare ? 'enregistrement…' : 'Déclarer aucun crash'}
          </button>
        )}
        {liste.length === 0 && statut === 'aucun' && (
          <button type="button" className="lien" disabled={reinitialise}
                  onClick={() => void reinitialiser()}>
            {reinitialise ? 'enregistrement…' : 'Remettre à renseigner'}
          </button>
        )}
        <button type="button" className="lien" disabled={occupe}
                onClick={() => void consigner()}>
          {occupe
            ? 'enregistrement…'
            : liste.length ? 'Documenter un autre crash' : 'Documenter un crash'}
        </button>
      </div>
      {erreur && <p className="mot-erreur" role="alert">{erreur}</p>}
    </section>
  )
}

function UneChute({ db, c, ouverte, machineId, date, onEcrit }: {
  db: PowerSyncDatabase
  c: Tombee
  ouverte: boolean
  machineId: string | null
  date: string
  onEcrit: () => Promise<void>
}) {
  const [endroit, setEndroit] = useState(c.endroit ?? '')
  const [recit, setRecit] = useState(c.recit ?? '')
  const [edite, setEdite] = useState(ouverte && !c.endroit && !c.recit)
  const [cout, setCout] = useState<{ centimes: number; reparations: number } | null>(null)
  const [confirme, setConfirme] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [retiree, setRetiree] = useState(false)

  const chargerCout = useCallback(
    async () => setCout(await coutDeLaChute(db, c.id)), [db, c.id])
  useEffect(() => { void chargerCout() }, [chargerCout])

  const [garder, occupe] = useGeste(async () => {
    const { relue } = await ecrirePuisRelire(
      () => completerChute(db, c.id, { endroit, recit }), onEcrit)
    setEdite(false)
    if (!relue) setErreur(
      'Le crash est modifié, mais le dossier n’a pas pu être relu. Ne recommence pas la saisie : recharge la page.')
  }, 'Le crash n’a pas été modifié. La saisie reste ouverte : réessaie.', setErreur)
  const [retirer, efface] = useGeste(async () => {
    const { relue } = await ecrirePuisRelire(
      () => oublierChute(db, c.id), onEcrit)
    setRetiree(true)
    if (!relue)
      setErreur('Le crash est retiré, mais le dossier n’a pas pu être relu. Recharge la page.')
  }, 'Le crash n’a pas été retiré. Il reste dans le carnet : réessaie.', setErreur)

  if (retiree) return erreur
    ? <p className="mot-erreur" role="alert">{erreur}</p>
    : null

  return (
    <article className="bloc pile chute">
      {erreur && <p className="mot-erreur" role="alert">{erreur}</p>}
      {edite ? (
        <>
          <label className="pile mini-espace">
            <span className="libelle">Lieu</span>
            <input className="champ" value={endroit}
                   onChange={(e) => setEndroit(e.target.value)}
                   placeholder="Virage 3, épingle…" autoComplete="off" />
          </label>
          <label className="pile mini-espace">
            <span className="libelle">Récit · facultatif</span>
            <textarea className="champ" rows={4} value={recit}
                      onChange={(e) => setRecit(e.target.value)}
                      placeholder="Ce qui s'est passé, dans tes mots" />
          </label>
          <button type="button" className="bouton secondaire" disabled={occupe}
                  onClick={() => void garder()}>
            {occupe ? 'enregistrement…' : 'Enregistrer le crash'}
          </button>
          <button type="button" className="lien" onClick={() => setEdite(false)}>
            Fermer la saisie
          </button>
        </>
      ) : (
        <>
          <div className="rang">
            <span className="texte">{endroit || 'Crash documenté'}</span>
            {cout && cout.reparations > 0 && (
              <span className="libelle faible">
                {cout.reparations} réparation{cout.reparations > 1 ? 's' : ''}
                {cout.centimes ? ` · ${formaterEuros(cout.centimes)}` : ''}
              </span>
            )}
          </div>
          {recit && <p className="texte faible">{recit}</p>}
          <PhotosDeChute db={db} chuteId={c.id} onEcrit={onEcrit} />
          <VideosDeChute db={db} chuteId={c.id} onEcrit={onEcrit} />
          <ReparationsDeChute db={db} chuteId={c.id} machineId={machineId}
                              dateRoulage={date}
                              onEcrit={async () => { await chargerCout(); await onEcrit() }} />

          {confirme ? (
            <div className="pile">
              <p className="note">
                Le crash part. Ses réparations et photos restent dans le carnet,
                sans ce rattachement.
              </p>
              <div className="rang">
                <button type="button" className="bouton destructif" disabled={efface}
                        onClick={() => void retirer()}>
                  {efface ? 'suppression…' : 'Retirer le crash'}
                </button>
                <button type="button" className="lien" onClick={() => setConfirme(false)}>
                  Garder le crash
                </button>
              </div>
            </div>
          ) : (
            <div className="rang">
              <button type="button" className="lien" onClick={() => setEdite(true)}>
                Modifier le crash
              </button>
              <button type="button" className="lien destructif"
                      onClick={() => setConfirme(true)}>
                Retirer le crash
              </button>
            </div>
          )}
        </>
      )}
    </article>
  )
}

function ReparationsDeChute({ db, chuteId, machineId, dateRoulage, onEcrit }: {
  db: PowerSyncDatabase
  chuteId: string
  machineId: string | null
  dateRoulage: string
  onEcrit: () => Promise<void>
}) {
  const [liste, setListe] = useState<Awaited<ReturnType<typeof reparationsDeLaChute>>>([])
  const [ouvert, setOuvert] = useState(false)
  const [montant, setMontant] = useState('')
  const [libelle, setLibelle] = useState('')
  const [date, setDate] = useState(aujourdhui)
  const [categorie, setCategorie] = useState<Categorie | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  const charger = useCallback(
    async () => setListe(await reparationsDeLaChute(db, chuteId)), [db, chuteId])
  useEffect(() => { void charger() }, [charger])

  const centimes = enCentimes(montant)
  const dateValide = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : dateRoulage
  const [ajouter, occupe] = useGeste(async () => {
    if (!machineId || centimes == null || !libelle.trim() || !categorie) return
    const { relue } = await ecrirePuisRelire(
      () => consignerReparationDeChute(db, {
        chuteId, machineId, categorie, libelle, date: dateValide, centimes,
      }),
      async () => { await charger(); await onEcrit() },
    )
    setMontant('')
    setLibelle('')
    setCategorie(null)
    setOuvert(false)
    if (!relue) setErreur(
      'La réparation est enregistrée, mais le dossier n’a pas pu être relu. Ne la saisis pas à nouveau : recharge la page.')
  }, 'La réparation n’a pas été enregistrée. La saisie reste ouverte : réessaie.', setErreur)

  return (
    <div className="pile sous-dossier-crash">
      {liste.length > 0 && (
        <div className="pile mini-espace">
          <span className="libelle">Réparations liées</span>
          {liste.map((r) => (
            <div key={r.id} className="rang ligne-reparation-crash">
              <span className="texte">{r.libelle}</span>
              <span className="hud-12 faible">{formaterEuros(r.cout_centimes ?? 0)}</span>
            </div>
          ))}
        </div>
      )}

      {!machineId ? (
        <p className="note">Associe d'abord une moto au roulage pour lier une réparation.</p>
      ) : ouvert ? (
        <div className="pile formulaire-reparation-crash">
          <label className="pile mini-espace">
            <span className="libelle">Montant</span>
            <input className="champ" inputMode="decimal" value={montant}
                   onChange={(e) => setMontant(e.target.value)} placeholder="0,00" />
          </label>
          <label className="pile mini-espace">
            <span className="libelle">Réparation</span>
            <input className="champ" value={libelle} onChange={(e) => setLibelle(e.target.value)}
                   placeholder="Levier, carénage…" autoComplete="off" />
          </label>
          <div className="pile mini-espace">
            <span className="libelle">Carnet Atelier</span>
            <div className="puces categories-reparation-crash">
              {([
                ['reparation_non_vitale', 'BRICOLE'],
                ['entretien', 'ENTRETIEN'],
                ['amelioration', 'AMÉLIORATION'],
              ] as const).map(([valeur, nom]) => (
                <button key={valeur} type="button" className="puce"
                        data-actif={categorie === valeur ? '1' : '0'}
                        aria-pressed={categorie === valeur}
                        onClick={() => setCategorie(valeur)}>{nom}</button>
              ))}
            </div>
          </div>
          <label className="pile mini-espace">
            <span className="libelle">Date de paiement</span>
            <input className="champ" type="date" value={date}
                   onChange={(e) => setDate(e.target.value)} />
          </label>
          {erreur && <p className="mot-erreur" role="alert">{erreur}</p>}
          <button type="button" className="bouton secondaire"
                  disabled={occupe || centimes == null || !libelle.trim() || !categorie}
                  onClick={() => void ajouter()}>
            {occupe ? 'enregistrement…' : 'Enregistrer la réparation'}
          </button>
          <button type="button" className="lien" onClick={() => setOuvert(false)}>
            Fermer la saisie
          </button>
        </div>
      ) : (
        <>
          {erreur && <p className="mot-erreur" role="alert">{erreur}</p>}
          <button type="button" className="lien" onClick={() => setOuvert(true)}>
            Ajouter une réparation
          </button>
        </>
      )}
    </div>
  )
}

function PhotosDeChute({ db, chuteId, onEcrit }: {
  db: PowerSyncDatabase
  chuteId: string
  onEcrit: () => void
}) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [echecs, setEchecs] = useState<Echec[]>([])
  const [aRetirer, setARetirer] = useState<string | null>(null)
  const [suppression, setSuppression] = useState<{
    genre: 'info' | 'erreur'; texte: string
  } | null>(null)
  const [suppressionEnCours, setSuppressionEnCours] = useState<string | null>(null)
  const vivantes = useRef<string[]>([])
  const fichier = useRef<HTMLInputElement>(null)

  useEffect(() => () => {
    vivantes.current.forEach(URL.revokeObjectURL)
    vivantes.current = []
  }, [])

  const charger = useCallback(async () => {
    const l = await photosDeLaChute(db, chuteId)
    const suivantes: Record<string, string> = {}
    for (const p of l) {
      const fichier = await lirePhoto(p)
      if (fichier) suivantes[p.id] = URL.createObjectURL(fichier)
    }
    setPhotos(l)
    setUrls((anciennes) => {
      Object.values(anciennes).forEach(URL.revokeObjectURL)
      vivantes.current = Object.values(suivantes)
      return suivantes
    })
  }, [db, chuteId])
  useEffect(() => { void charger() }, [charger])

  const [verser, occupe] = useGeste(async (fichiers: FileList | null) => {
    const liste = fichiers ? Array.from(fichiers) : []
    if (!liste.length) return
    setEchecs([])
    setSuppression(null)
    let affichageEnRetard = false
    setEchecs(await verserPlusieurs(
      db, { chuteId }, liste, () => charger(), () => { affichageEnRetard = true }))
    try { await charger(); affichageEnRetard = false } catch { affichageEnRetard = true }
    if (affichageEnRetard) setSuppression({
      genre: 'info', texte: 'Photo enregistrée. Recharge l’écran pour l’afficher.',
    })
    onEcrit()
  })

  const retirer = async (p: Photo) => {
    setSuppression(null)
    setSuppressionEnCours(p.id)
    try {
      const resultat = await oublierPhoto(db, p.id)
      if (resultat.statut === 'en_attente' && resultat.motif === 'base_locale') {
        setSuppression({
          genre: 'erreur',
          texte: 'La photo n’a pas été retirée. Elle reste dans le carnet et sur ce téléphone : réessaie.',
        })
        return
      }

      // Le tombstone est durable : la photo ne doit pas réapparaître si sa
      // relecture échoue juste après. La requête canonique remplacera ensuite
      // cette réponse locale quand elle le pourra.
      setPhotos((l) => l.filter((x) => x.id !== p.id))
      setARetirer(null)
      try { await charger() } catch { /* retrait déjà persisté */ }
      onEcrit()
      setSuppression({
        genre: 'info',
        texte: resultat.statut === 'en_attente'
          ? resultat.motif === 'finalisation_locale'
            ? 'Retrait enregistré. La photo n’est plus dans le carnet ; le nettoyage local reprendra à la prochaine ouverture.'
            : 'Retrait enregistré. La photo n’est plus dans le carnet ; ses copies finiront d’être supprimées au retour du réseau.'
          : 'Photo retirée du carnet, du téléphone et du stockage quand elle y était sauvegardée.',
      })
    } catch {
      setSuppression({
        genre: 'erreur',
        texte: 'La photo n’a pas été retirée. Elle reste dans le carnet : réessaie.',
      })
    } finally {
      setSuppressionEnCours(null)
    }
  }

  return (
    <div className="pile sous-dossier-crash">
      {photos.length > 0 && (
        <div className="grille-album photos-crash">
          {photos.map((p, i) => (
            <div key={p.id} className="case-photo-crash">
              {urls[p.id]
                ? <img src={urls[p.id]} alt={`Photo du crash ${i + 1}`} loading="lazy" decoding="async" />
                : <span className="note">Photo sauvegardée</span>}
              {aRetirer === p.id ? (
                <div className="pile confirmation-photo-crash">
                  <p className="note">
                    Elle disparaît du carnet maintenant. Ses copies locale et distante sont
                    supprimées maintenant ou dès le retour du réseau.
                  </p>
                  <button type="button" className="bouton destructif"
                          disabled={suppressionEnCours === p.id}
                          onClick={() => void retirer(p)}>
                    {suppressionEnCours === p.id ? 'suppression…' : 'Retirer la photo'}
                  </button>
                  <button type="button" className="lien"
                          disabled={suppressionEnCours === p.id}
                          onClick={() => setARetirer(null)}>
                    Garder la photo
                  </button>
                </div>
              ) : (
                <button type="button" className="lien destructif"
                        onClick={() => setARetirer(p.id)} aria-label={`retirer la photo ${i + 1}`}>
                  Retirer la photo
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {echecs.length > 0 && (
        <p className="mot-erreur" role="alert">
          {echecs.length === 1
            ? `« ${echecs[0].nom} » n'a pas pu être préparée.`
            : `${echecs.length} photos n'ont pas pu être préparées.`}
          {' '}Les autres sont conservées.
        </p>
      )}
      {suppression && (
        <p className={suppression.genre === 'erreur' ? 'mot-erreur' : 'note'}
           role={suppression.genre === 'erreur' ? 'alert' : 'status'}>
          {suppression.texte}
        </p>
      )}
      <button type="button" className="lien ajout-photo-crash" disabled={occupe}
              onClick={() => fichier.current?.click()}>
        {occupe ? 'préparation…' : 'Ajouter des photos'}
      </button>
      <input ref={fichier} type="file" accept="image/*" multiple hidden disabled={occupe}
             onChange={(e) => { void verser(e.target.files); e.target.value = '' }} />
    </div>
  )
}

/**
 * LA VIDÉO DU CRASH — récit 23.10.
 *
 * ⚠ TROIS CHOSES SE DISENT ICI QUI NE SE DISENT NULLE PART AILLEURS DANS LE PRODUIT,
 * et aucune n'est décorative :
 *
 * ① L'ATTENTE, AVANT DE LA SUBIR. Comprimer se fait en rejouant la vidéo une
 *    fois : trente secondes de crash prennent trente secondes. Une application
 *    qui se fige sans rien dire pendant trente secondes se fait retaper, puis
 *    fermer. Le bouton annonce donc la durée au lieu de la laisser découvrir.
 *
 * ② LA PLACE, AVANT LE GESTE. Le quota est une clause du récit, et « explicite »
 *    ne veut pas dire « appliqué » mais « connu avant d'agir ». Un pilote qui
 *    découvre la limite en la heurtant a déjà attendu sa compression pour rien.
 *
 * ③ CE QUI EST RÉELLEMENT ARRIVÉ AU FICHIER. Une vidéo gardée telle quelle parce
 *    que l'appareil ne sait pas ré-encoder n'est pas la même pièce qu'une vidéo
 *    comprimée : elle mange le quota bien plus vite. Le taire laisserait croire
 *    à une compression qui n'a pas eu lieu (UX-DR8).
 */
function VideosDeChute({ db, chuteId, onEcrit }: {
  db: PowerSyncDatabase
  chuteId: string
  onEcrit: () => void
}) {
  const [videos, setVideos] = useState<Video[]>([])
  const [sources, setSources] = useState<Record<string, string>>({})
  const [place, setPlace] = useState<PlaceVideo | null>(null)
  const [mot, setMot] = useState<{ genre: 'info' | 'erreur'; texte: string } | null>(null)
  const [aRetirer, setARetirer] = useState<string | null>(null)
  // Seules les URL fabriquées localement se révoquent : un lien signé n'est pas
  // un objet du navigateur, et le révoquer ne ferait rien de bon.
  const vivantes = useRef<string[]>([])
  const fichier = useRef<HTMLInputElement>(null)

  useEffect(() => () => {
    vivantes.current.forEach(URL.revokeObjectURL)
    vivantes.current = []
  }, [])

  const charger = useCallback(async () => {
    const l = await videosDeLaChute(db, chuteId)
    const suivantes: Record<string, string> = {}
    const fabriquees: string[] = []
    for (const v of l) {
      // Le coffre de CE téléphone d'abord. Sur un second appareil il est vide :
      // la ligne est descendue par synchronisation, les octets sont restés au
      // stockage, et c'est le lien signé qui rend la vidéo regardable.
      const f = await lireVideoLocale(v)
      if (f) {
        const u = URL.createObjectURL(f)
        suivantes[v.id] = u
        fabriquees.push(u)
        continue
      }
      const distante = await lienVideoDistante(v)
      if (distante) suivantes[v.id] = distante
    }
    setVideos(l)
    setSources((anciennes) => {
      Object.values(anciennes).forEach((u) => {
        if (u.startsWith('blob:')) URL.revokeObjectURL(u)
      })
      vivantes.current = fabriquees
      return suivantes
    })
    setPlace(await placeVideo(db))
  }, [db, chuteId])
  // ⚠ UNE LECTURE QUI ÉCHOUE DOIT LE DIRE. Sans ce `catch`, un refus de SQLite
  // laissait le bloc entier vide — ni vidéo, ni quota, ni message — c'est-à-dire
  // exactement l'écran d'un dossier sans vidéo. Un échec qui ressemble à un
  // succès est le pire des deux.
  useEffect(() => {
    void charger().catch(() => setMot({
      genre: 'erreur',
      texte: 'La liste des vidéos n’a pas pu être lue. Recharge l’écran pour réessayer.',
    }))
  }, [charger])

  const [verser, occupe] = useGeste(async (fichiers: FileList | null) => {
    const choisi = fichiers?.[0]
    if (!choisi) return
    setMot({ genre: 'info', texte: 'Préparation de la vidéo… cela prend le temps du clip.' })
    const prete = await comprimer(choisi, DUREE_MAX_MS)
    if ('refus' in prete) { setMot({ genre: 'erreur', texte: prete.refus }); return }

    const versee = await verserVideo(db, { chuteId }, prete.blob, {
      duree_ms: prete.duree_ms, largeur: prete.largeur, hauteur: prete.hauteur,
    })
    if ('refus' in versee) { setMot({ genre: 'erreur', texte: versee.refus }); return }

    try { await charger() } catch {
      setMot({ genre: 'info', texte: 'Vidéo enregistrée. Recharge l’écran pour la voir.' })
      onEcrit()
      return
    }
    setMot({
      genre: 'info',
      texte: prete.reencodee
        ? `Vidéo enregistrée (${formaterPoids(prete.blob.size)}). Elle partira au stockage `
          + `au retour du réseau, et reprendra où elle s’arrête si la connexion coupe.`
        : `Vidéo enregistrée telle quelle (${formaterPoids(prete.blob.size)}) : cet appareil `
          + `ne sait pas la ré-encoder. Elle occupe donc plus de place qu’une vidéo comprimée.`,
    })
    onEcrit()
  })

  const retirer = async (v: Video) => {
    setMot(null)
    try {
      const resultat = await oublierVideo(db, v.id)
      if (resultat.statut === 'en_attente' && resultat.motif === 'base_locale') {
        setMot({
          genre: 'erreur',
          texte: 'La vidéo n’a pas été retirée. Elle reste dans le carnet et sur ce téléphone : réessaie.',
        })
        return
      }
      // Le tombstone est durable : la vidéo ne doit pas réapparaître si sa
      // relecture échoue juste après.
      setVideos((l) => l.filter((x) => x.id !== v.id))
      setARetirer(null)
      try { await charger() } catch { /* retrait déjà persisté */ }
      onEcrit()
      setMot({
        genre: 'info',
        texte: resultat.statut === 'en_attente'
          ? resultat.motif === 'finalisation_locale'
            ? 'Retrait enregistré. La vidéo n’est plus dans le carnet ; le nettoyage local reprendra à la prochaine ouverture.'
            : 'Retrait enregistré. La vidéo n’est plus dans le carnet ; ses copies finiront d’être supprimées au retour du réseau.'
          : 'Vidéo retirée du carnet, du téléphone et du stockage quand elle y était sauvegardée.',
      })
    } catch {
      setMot({
        genre: 'erreur',
        texte: 'La vidéo n’a pas été retirée. Elle reste dans le carnet : réessaie.',
      })
    }
  }

  return (
    <div className="pile sous-dossier-crash">
      {videos.length > 0 && (
        <div className="pile videos-crash">
          {videos.map((v, i) => (
            <div key={v.id} className="case-video-crash">
              {sources[v.id]
                ? <video src={sources[v.id]} controls playsInline preload="metadata"
                         aria-label={`Vidéo du crash ${i + 1}`} />
                : <span className="note">
                    Vidéo sauvegardée. Elle se regardera au retour du réseau.
                  </span>}
              {aRetirer === v.id ? (
                <div className="pile confirmation-photo-crash">
                  <p className="note">
                    Elle disparaît du carnet maintenant. Ses copies locale et distante sont
                    supprimées maintenant ou dès le retour du réseau.
                  </p>
                  <button type="button" className="lien destructif"
                          onClick={() => { void retirer(v) }}>
                    Retirer la vidéo
                  </button>
                  <button type="button" className="lien"
                          onClick={() => setARetirer(null)}>
                    Garder la vidéo
                  </button>
                </div>
              ) : (
                <button type="button" className="lien destructif"
                        onClick={() => setARetirer(v.id)}
                        aria-label={`retirer la vidéo ${i + 1}`}>
                  Retirer la vidéo
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {mot && (
        <p className={mot.genre === 'erreur' ? 'mot-erreur' : 'note'}
           role={mot.genre === 'erreur' ? 'alert' : 'status'}>
          {mot.texte}
        </p>
      )}
      {place && (
        <p className="note">
          {/* ⚠ `formaterPoids` ne descend jamais sous « 1 Ko » — c'est voulu là où
              il pèse un fichier, et faux ici : annoncer « 1 Ko » quand rien n'est
              stocké, c'est facturer au pilote une place qu'il n'occupe pas. */}
          {place.utilises
            ? `Vidéo : ${formaterPoids(place.utilises)} sur ${formaterPoids(place.quota)}.`
            : `Vidéo : aucune pour l’instant. La limite est de ${formaterPoids(place.quota)}.`}
          {' '}Une vidéo dure {Math.round(DUREE_MAX_MS / 1000)} secondes au plus.
        </p>
      )}
      {/* ⚠ SA PROPRE CLASSE, ET C'EST UN BANC QUI L'A EXIGÉ. Réutiliser
          `ajout-photo-crash` rendait `button.ajout-photo-crash` ambigu : la
          fumée du crash visait deux éléments au lieu d'un et s'arrêtait net.
          Deux gestes différents dans un même dossier ont besoin de deux noms,
          pour le banc comme pour qui lit l'écran. */}
      <button type="button" className="lien ajout-video-crash" disabled={occupe}
              onClick={() => fichier.current?.click()}>
        {occupe ? 'préparation…' : 'Ajouter une vidéo'}
      </button>
      <input ref={fichier} type="file" accept="video/*" hidden disabled={occupe}
             onChange={(e) => { void verser(e.target.files); e.target.value = '' }} />
    </div>
  )
}
