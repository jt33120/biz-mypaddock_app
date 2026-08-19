import { useCallback, useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import { lireLocale, nomLocal, photosDuRoulage, verserPhoto, type Photo } from '../db/photos'
import { declarerGeste, gestesDuRoulage, listerCaps, type Cap, type Geste } from '../db/gestes'

/**
 * LA PHOTO ET LE GESTE — récits 3.1 et 3.2, sur l'écran du roulage.
 *
 * ⚠ LA PHOTO S'AFFICHE TOUJOURS DEPUIS SA COPIE LOCALE, montée ou non. Une
 * photo « en attente d'envoi » ne peut pas être une photo absente à l'écran :
 * FR-10 exige que la pose réussisse hors ligne, NFR-7 interdit toute
 * dégradation visible. Il n'y a donc ici ni pastille d'attente, ni indicateur
 * d'échec, ni message d'excuse — l'état d'envoi n'est pas l'affaire du pilote.
 *
 * Et le geste est PUREMENT DÉCLARATIF (FR-28). Aucune reconnaissance d'image,
 * jamais : la photo n'est pas lue par une machine pour en déduire un fait.
 * C'est une exclusion permanente, pas un report.
 */
export function Photos({ db, roulageId }: { db: PowerSyncDatabase; roulageId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [gestes, setGestes] = useState<Geste[]>([])
  const [caps, setCaps] = useState<Cap[]>([])
  const [ouvert, setOuvert] = useState(false)
  const [occupe, setOccupe] = useState(false)
  const [souci, setSouci] = useState<string | null>(null)

  const charger = useCallback(async () => {
    const l = await photosDuRoulage(db, roulageId)
    setPhotos(l)
    setGestes(await gestesDuRoulage(db, roulageId))
    setCaps(await listerCaps(db))
    const u: Record<string, string> = {}
    for (const p of l) {
      const f = await lireLocale(nomLocal(p))
      if (f) u[p.id] = URL.createObjectURL(f)
    }
    setUrls((anciennes) => {
      Object.values(anciennes).forEach(URL.revokeObjectURL)
      return u
    })
  }, [db, roulageId])

  useEffect(() => { void charger() }, [charger])

  const verser = async (f: File | undefined) => {
    if (!f) return
    setOccupe(true); setSouci(null)
    try {
      await verserPhoto(db, { roulageId }, f)
      await charger()
    } catch (e) {
      // Une erreur dit CE QUI S'EST PASSÉ, CE QUI EST CONSERVÉ, et CE QUI VA SE
      // PASSER. Jamais une excuse, jamais un code nu.
      setSouci("L'image n'a pas pu être préparée sur ce téléphone. Rien n'est perdu : "
        + "le roulage est enregistré, et tu peux réessayer avec une autre photo. ("
        + (e as Error).message + ')')
    }
    setOccupe(false)
  }

  return (
    <div className="bloc pile">
      <div className="rang">
        <span className="libelle">Photos et gestes</span>
        {photos.length > 0 && <span className="hud-12 faible">{photos.length}</span>}
      </div>

      {photos.length > 0 && (
        <div className="bande">
          {photos.map((p) => (
            <img key={p.id} className="vignette" src={urls[p.id]} alt="" loading="lazy" />
          ))}
        </div>
      )}

      {gestes.length > 0 && (
        <div className="puces">
          {/* Le produit ÉNONCE le fait. Il ne décerne rien : ni badge, ni
              médaille, ni étoile, ni points, ni barre de progression. */}
          {gestes.map((g) => (
            <span key={g.id} className="fait">{caps.find((c) => c.code === g.cap_code)?.libelle ?? g.cap_code}</span>
          ))}
        </div>
      )}

      {souci && <p className="mot-erreur">{souci}</p>}

      <label className="bouton secondaire">
        {occupe ? 'préparation…' : 'Ajouter une photo'}
        <input type="file" accept="image/*" hidden disabled={occupe}
               onChange={(e) => { void verser(e.target.files?.[0]); e.target.value = '' }} />
      </label>

      {!ouvert ? (
        <button className="lien" onClick={() => setOuvert(true)}>Déclarer un geste</button>
      ) : (
        <div className="pile">
          <div className="libelle">Ce que tu as fait</div>
          <div className="puces">
            {caps.filter((c) => !gestes.some((g) => g.cap_code === c.code)).map((c) => (
              <button key={c.code} className="puce"
                      onClick={() => void declarerGeste(db, roulageId, c.code).then(charger)}>
                {c.libelle.toUpperCase()}
              </button>
            ))}
          </div>
          <button className="lien" onClick={() => setOuvert(false)}>Fermer</button>
        </div>
      )}
    </div>
  )
}
