import { useCallback, useEffect, useRef, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  lirePhoto, oublierPhoto, photosDuRoulage, verserPlusieurs,
  type Echec, type Photo,
} from '../db/photos'
import { declarerGeste, gestesDuRoulage, listerCaps, type Cap, type Geste } from '../db/gestes'
import { Icone } from './Icones'
import { TeteRepli } from './Repli'
import { useGeste } from './geste'

/**
 * L'ALBUM ET LE GESTE — récits 3.1, 3.2, 18.2 et 18.3.
 *
 * ⚠ LA PHOTO S'AFFICHE D'ABORD DEPUIS SA COPIE LOCALE. Sur un second appareil,
 * une photo déjà montée redescend de Storage puis rejoint le même cache local.
 * Une photo fraîchement prise reste donc visible hors ligne, sans empêcher son
 * album de suivre le pilote sur un autre téléphone.
 *
 * Et le geste est PUREMENT DÉCLARATIF (FR-28). Aucune reconnaissance d'image,
 * jamais : la photo n'est pas lue par une machine pour en déduire un fait.
 * C'est une exclusion permanente, pas un report.
 *
 * ═══ LA BANDE DEVIENT UNE GRILLE — DÉCISION RETOURNÉE, 26 AOÛT 2026 ════════
 *
 * `systeme.css` portait ceci, et c'était juste au moment où ça a été écrit :
 *
 *   « Une bande qui défile plutôt qu'une grille : au paddock on en verse une ou
 *     deux, pas vingt, et une grille à trous fait vide. »
 *
 * ⚠ CE N'ÉTAIT PAS UNE OBSERVATION, C'ÉTAIT UNE CONSÉQUENCE. On en versait une
 * ou deux parce que l'`input` n'avait pas `multiple` et que le code ne lisait
 * que `files[0]` : vingt photos, c'étaient vingt allers-retours dans le
 * sélecteur iOS. La bande était la bonne forme pour un défaut, pas pour un
 * usage — et elle le PERPÉTUAIT, puisqu'elle rendait le versement en masse
 * illisible.
 *
 * La décision se retourne donc dans le bon ordre, et seulement dans cet ordre :
 * le versement multiple (18.3) arrive D'ABORD, et l'album (18.2) ensuite. Une
 * grille sur trois photos ferait exactement le trou que le commentaire d'origine
 * redoutait.
 *
 * ⚠ ET AUCUNE BIBLIOTHÈQUE. PhotoSwipe (~45 Ko) et yet-another-react-lightbox
 * (~30 Ko) apportent des coins arrondis, des flèches SF-Symbols et des fondus
 * qu'il faudrait désécrire à coups de `!important` contre le pixel 16 bits. Une
 * grille `repeat(auto-fill, minmax(96px, 1fr))` et un plein écran font quarante
 * lignes, et elles sont à nous.
 *
 * ⚠ RIEN N'EST CLASSÉ, NOTÉ, MIS EN AVANT NI ÉLU « LA MEILLEURE ». L'album
 * énonce ce qui a été pris, dans l'ordre où ça a été pris. C'est la même clause
 * que partout ailleurs, et c'est ici qu'elle serait la plus tentante à trahir.
 */
export function Photos({ db, roulageId }: { db: PowerSyncDatabase; roulageId: string }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [gestes, setGestes] = useState<Geste[]>([])
  const [caps, setCaps] = useState<Cap[]>([])
  const [ouvert, setOuvert] = useState(false)
  const [echecs, setEchecs] = useState<Echec[]>([])
  const [suppression, setSuppression] = useState<{
    genre: 'info' | 'erreur'; texte: string
  } | null>(null)
  /** L'index de la photo ouverte en grand, ou `null`. Un index et non un
   *  identifiant : la navigation d'une photo à l'autre est un déplacement dans
   *  la liste, et un identifiant obligerait à la re-parcourir à chaque flèche. */
  const [enGrand, setEnGrand] = useState<number | null>(null)
  /** Le pli de l'album — voir son commentaire au rendu. Il porte un nom distinct
   *  de `ouvert` parce que ce module en a déjà d'autres, et deux booléens du même
   *  nom dans un même fichier finissent par se prendre l'un pour l'autre. */
  const [ouvertAlbum, setOuvertAlbum] = useState(false)

  /**
   * ⚠ LES URL D'OBJET SE RÉVOQUENT, ET ELLES NE SE RÉVOQUAIENT QU'À MOITIÉ.
   * `charger()` en créait une par photo et ne libérait le lot précédent qu'au
   * `setState` suivant : soixante photos de saison, c'était soixante blobs
   * décodés retenus en mémoire, et l'onglet WebContent d'iOS meurt sans erreur
   * rattrapable bien avant.
   *
   * Deux remèdes, et il faut les deux :
   *   · la révocation À LA SORTIE, portée par une `ref` — sans elle, quitter
   *     l'écran laisse tout le lot en vol ;
   *   · le chargement PARESSEUX du navigateur (`loading="lazy"`), qui empêche le
   *     décodage de ce qui n'est pas à l'écran.
   */
  const vivantes = useRef<string[]>([])
  useEffect(() => () => {
    vivantes.current.forEach(URL.revokeObjectURL)
    vivantes.current = []
  }, [])

  const charger = useCallback(async () => {
    const l = await photosDuRoulage(db, roulageId)
    setPhotos(l)
    setGestes(await gestesDuRoulage(db, roulageId))
    setCaps(await listerCaps(db))
    const u: Record<string, string> = {}
    for (const p of l) {
      const f = await lirePhoto(p)
      if (f) u[p.id] = URL.createObjectURL(f)
    }
    setUrls((anciennes) => {
      Object.values(anciennes).forEach(URL.revokeObjectURL)
      vivantes.current = Object.values(u)
      return u
    })
  }, [db, roulageId])

  useEffect(() => { void charger() }, [charger])

  /**
   * LE VERSEMENT — récit 18.3, et il est EN SÉRIE.
   *
   * `reduire` alloue un canevas de 1600 px et décode une image de 48 Mpx : dix
   * en vol tuent l'onglet, sans erreur rattrapable. La série vit dans
   * `verserPlusieurs` (src/db/photos.ts) ; ici on ne fait que rafraîchir au fur
   * et à mesure, pour que la grille se remplisse au lieu de rester figée.
   *
   * ⚠ AUCUN COMPTEUR. Pas de « 4 sur 10 ». Ce qui est versé apparaît ; ce qui
   * reste ne se compte pas.
   */
  const [verser, occupe, garde] = useGeste(async (fichiers: FileList | null) => {
    const liste = fichiers ? Array.from(fichiers) : []
    if (!liste.length) return
    setEchecs([])
    setSuppression(null)
    let affichageEnRetard = false
    const rates = await verserPlusieurs(
      db, { roulageId }, liste, () => charger(), () => { affichageEnRetard = true })
    setEchecs(rates)
    try { await charger(); affichageEnRetard = false } catch { affichageEnRetard = true }
    if (affichageEnRetard) setSuppression({
      genre: 'info', texte: 'Photo enregistrée. Recharge l’écran pour l’afficher.',
    })
  })

  const retirer = async (p: Photo): Promise<{ retiree: boolean; message: string }> => {
    setSuppression(null)
    try {
      const resultat = await oublierPhoto(db, p.id)
      if (resultat.statut === 'en_attente' && resultat.motif === 'base_locale') {
        return {
          retiree: false,
          message: 'La photo n’a pas été retirée. Elle reste dans le carnet et sur ce téléphone : réessaie.',
        }
      }
      setPhotos((l) => l.filter((x) => x.id !== p.id))
      setEnGrand(null)
      try { await charger() } catch { /* tombstone déjà persisté */ }
      const message = resultat.statut === 'en_attente'
        ? resultat.motif === 'finalisation_locale'
          ? 'Retrait enregistré. La photo n’est plus dans le carnet ; le nettoyage local reprendra à la prochaine ouverture.'
          : 'Retrait enregistré. La photo n’est plus dans le carnet ; ses copies finiront d’être supprimées au retour du réseau.'
        : 'Photo retirée du carnet, du téléphone et du stockage quand elle y était sauvegardée.'
      setSuppression({ genre: 'info', texte: message })
      return { retiree: true, message }
    } catch {
      return {
        retiree: false,
        message: 'La photo n’a pas été retirée. Elle reste dans le carnet : réessaie.',
      }
    }
  }

  return (
    <div className="bloc pile album" data-garde={garde ? '1' : '0'}>
      {/* ⚠ REPLIÉ PAR DÉFAUT — lot 3, 2 septembre 2026 : 179 px sur le bilan
          d'une journée, dont l'essentiel pour deux boutons d'ajout. On ouvre une
          journée pour lire son chrono ; on ouvre son album quand on veut voir
          des photos, et c'est un geste séparé.

          ⚠ LE DÉCOMPTE RESTE DEHORS, et c'est ce qui autorise le pli. « 4 » se
          lit sans ouvrir : le pilote sait qu'il y a quelque chose derrière, ou
          qu'il n'y a rien. Un pli qui obligerait à taper pour apprendre qu'il
          est vide coûterait plus qu'il ne rend. Et ce décompte reste un
          DÉCOMPTE, jamais une progression — rien ne dit combien il en manque. */}
      <TeteRepli titre="Photos et gestes"
                 chiffre={photos.length > 0 ? String(photos.length) : undefined}
                 etat={photos.length > 0 ? undefined : 'rien de versé'}
                 ouvert={ouvertAlbum} onBasculer={() => setOuvertAlbum(!ouvertAlbum)} />
      {ouvertAlbum && (<>

      {photos.length > 0 && (
        <div className="grille-album">
          {photos.map((p, i) => (
            <button key={p.id} className="case-album" onClick={() => setEnGrand(i)}
                    aria-label={`ouvrir la photo ${i + 1}`}>
              <img src={urls[p.id]} alt="" loading="lazy" decoding="async" />
            </button>
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

      {echecs.length > 0 && (
        /* ⚠ CE QUI EST VERSÉ RESTE VERSÉ, ET ON DIT LAQUELLE A MANQUÉ. Sur un
           lot de dix, « une photo n'a pas pu être préparée » laisse chercher
           laquelle parmi dix. Une erreur dit ce qui s'est passé, CE QUI EST
           CONSERVÉ, et ce qui va se passer — jamais une excuse, jamais un code
           nu. */
        <p className="mot-erreur">
          {echecs.length === 1
            ? `« ${echecs[0].nom} » n'a pas pu être préparée sur ce téléphone.`
            : `${echecs.length} photos n'ont pas pu être préparées : `
              + echecs.map((e) => `« ${e.nom} »`).join(', ') + '.'}
          {' '}Les autres sont versées, et rien n'est perdu.
        </p>
      )}

      {suppression && (
        <p className={suppression.genre === 'erreur' ? 'mot-erreur' : 'note'}
           role={suppression.genre === 'erreur' ? 'alert' : 'status'}>
          {suppression.texte}
        </p>
      )}

      <label className="bouton secondaire">
        {occupe ? 'préparation…' : 'Ajouter des photos'}
        {/* ⚠ `multiple`, ET C'EST TOUT LE RÉCIT 18.3. Sans lui, vingt photos
            sont vingt allers-retours dans le sélecteur iOS, et l'album ne se
            remplira jamais. */}
        <input type="file" accept="image/*" multiple hidden disabled={occupe}
               onChange={(e) => { void verser(e.target.files); e.target.value = '' }} />
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

      {enGrand != null && photos[enGrand] && (
        <EnGrand photo={photos[enGrand]} url={urls[photos[enGrand].id]}
                 rang={enGrand} total={photos.length}
                 onFermer={() => setEnGrand(null)}
                 onDeplacer={(d) => setEnGrand((i) =>
                   i == null ? null : Math.min(photos.length - 1, Math.max(0, i + d)))}
                 onRetirer={() => retirer(photos[enGrand])} />
      )}
      </>)}
    </div>
  )
}

/**
 * LA PHOTO EN GRAND.
 *
 * ⚠ ELLE NE FERME AUCUNE PORTE ET N'EN INVENTE AUCUNE. Ni zoom, ni pincement,
 * ni rotation, ni partage : le partage a son écran (le récapitulatif), et le
 * reste est du logiciel de retouche. On regarde une photo, on passe à la
 * suivante, on en retire une si elle est ratée.
 *
 * ⚠ LE CLAVIER MARCHE. Échap ferme, les flèches déplacent. Ce n'est pas de la
 * complaisance : c'est ce qui rend l'ensemble atteignable sans geste caché
 * (EXPERIENCE.md:46), et c'est aussi ce qui le rend testable au banc.
 */
function EnGrand({ photo, url, rang, total, onFermer, onDeplacer, onRetirer }: {
  photo: Photo; url: string | undefined; rang: number; total: number
  onFermer: () => void; onDeplacer: (d: -1 | 1) => void
  onRetirer: () => Promise<{ retiree: boolean; message: string }>
}) {
  const [confirme, setConfirme] = useState(false)
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const retirer = async () => {
    setOccupe(true)
    setErreur(null)
    const resultat = await onRetirer()
    if (!resultat.retiree) setErreur(resultat.message)
    setOccupe(false)
  }

  useEffect(() => {
    const au = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFermer()
      if (e.key === 'ArrowLeft') onDeplacer(-1)
      if (e.key === 'ArrowRight') onDeplacer(1)
    }
    window.addEventListener('keydown', au)
    return () => window.removeEventListener('keydown', au)
  }, [onFermer, onDeplacer])

  return (
    <div className="plein-ecran" role="dialog" aria-modal="true" aria-label="Photo en grand">
      <div className="plein-tete">
        <button className="lien" onClick={onFermer}>← revenir à l'album</button>
        {/* Un RANG, pas un score. « 3 / 12 » dit où l'on est dans une liste ;
            rien ici ne classe et rien n'est « la meilleure ». */}
        <span className="hud-12 faible">{rang + 1} / {total}</span>
      </div>

      <div className="plein-image">
        {url && <img src={url} alt="" decoding="async" />}
      </div>

      <div className="plein-pied">
        <button className="lien" disabled={rang === 0}
                onClick={() => onDeplacer(-1)} aria-label="photo précédente">‹ précédente</button>
        <button className="lien" disabled={rang >= total - 1}
                onClick={() => onDeplacer(1)} aria-label="photo suivante">suivante ›</button>
      </div>

      {confirme ? (
        <div className="pile">
          {/* ⚠ ELLE PART SEULE, et la phrase le dit. La seule suppression de
              photo du produit était `supprimerRoulage`, qui les emporte toutes
              avec la journée, ses sessions, ses tours et ses dépenses. */}
          <p className="note">
            Elle disparaît du carnet maintenant. Ses copies locale et distante sont
            supprimées maintenant ou dès le retour du réseau. La journée et les autres
            photos restent.
          </p>
          {erreur && <p className="mot-erreur" role="alert">{erreur}</p>}
          <div className="rang">
            <button className="bouton destructif" disabled={occupe}
                    onClick={() => void retirer()}>
              {occupe ? 'suppression…' : 'Retirer cette photo'}
            </button>
            <button className="lien" disabled={occupe}
                    onClick={() => setConfirme(false)}>Garder</button>
          </div>
        </div>
      ) : (
        <button className="lien destructif" onClick={() => setConfirme(true)}
                aria-label={`retirer la photo ${rang + 1}`}>
          <Icone nom="poubelle" taille={13} /> Retirer cette photo
        </button>
      )}

      {photo.genre === 'facture' && (
        /* Il ne devrait jamais y en avoir ici — `photosDuRoulage` les écarte
           dans la requête. Si une facture atteint cet écran, c'est que le filtre
           est tombé, et la ligne le dit plutôt que de le taire. */
        <p className="note">Cette pièce est une facture, pas un cliché.</p>
      )}
    </div>
  )
}
