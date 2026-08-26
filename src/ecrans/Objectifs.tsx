import { useCallback, useEffect, useRef, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  objectifsDuRoulage, poserObjectif, propositions, retirerObjectif, type Objectif,
} from '../db/objectifs'

const cleObjectif = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().trim()

/**
 * CE QUE TU VIENS CHERCHER — récit 17.5.
 *
 * ⚠ IL Y A UN PRÉCÉDENT, ET IL EST ÉCRIT DANS LE CODE. Julian a DÉJÀ rejeté un
 * champ de texte libre à remplir avant de rouler, verbatim : « ça fait un peu
 * gamin, personne va prendre le temps de le remplir… c'est quoi cette merde ».
 * C'était le plan si-alors, l'intervention la mieux établie du dossier. Un champ
 * vide sous un titre « tes objectifs » est le même objet sous un autre nom, et
 * il finirait pareil.
 *
 * D'où la forme : LE PRODUIT PROPOSE D'ABORD CE QU'IL SAIT. Les virages de la
 * fiche du circuit, les caps du catalogue, le fait « jamais roulé ici ». On tape
 * dessus, c'est posé. Le champ libre existe, mais il vient EN DERNIER, pour ce
 * que le produit ne peut pas deviner.
 *
 * ⚠ RIEN NE SE COCHE, ET C'EST LA CLAUSE ENTIÈRE. Pas de case, pas d'« atteint »,
 * pas de « 2 sur 3 », pas de retour en vert le soir. Un objectif non coché le
 * soir est un échec affiché sans qu'aucun libellé ait à le dire — et
 * « travailler les virages à gauche » n'a pas de fin qu'on puisse cocher.
 *
 * ⚠ ET RIEN NE REMONTE SUR LA COURBE. Un chrono visé — « faire 1 min 30 » —
 * s'écrit ici comme du texte et RESTE du texte : aucune cible n'apparaît sur le
 * tracé, aucun écart ne s'y calcule (courbe.ts). Julian a levé le mot, pas le
 * verdict.
 */
export function Objectifs({ db, roulage }: {
  db: PowerSyncDatabase
  roulage: { id: string; circuit: string }
}) {
  const [poses, setPoses] = useState<Objectif[]>([])
  const [offres, setOffres] = useState<string[]>([])
  const [libre, setLibre] = useState('')
  const [ouvert, setOuvert] = useState(false)
  const [enAttente, setEnAttente] = useState<{ id: string; libelle: string }[]>([])
  const [erreur, setErreur] = useState<string | null>(null)
  const file = useRef<Promise<void>>(Promise.resolve())
  const numero = useRef(0)
  const reservees = useRef(new Set<string>())

  const charger = useCallback(async () => {
    const existants = await objectifsDuRoulage(db, roulage.id)
    setPoses(existants)
    reservees.current = new Set(existants.map((o) => cleObjectif(o.libelle)))
    setOffres(await propositions(db, roulage))
  }, [db, roulage])
  useEffect(() => { void charger() }, [charger])

  /** Les ajouts entrent dans une file, dans l'ordre des taps. `useGeste` est un
   *  verrou adapté à un double-tap sur la MÊME action ; ici il jetait le second
   *  objectif, qui est une autre donnée. */
  const poser = (quoi: string) => {
    const t = quoi.trim()
    if (!t) return
    const k = cleObjectif(t)
    if (reservees.current.has(k)) return
    const rangOffre = offres.findIndex((o) => cleObjectif(o) === k)
    const offreRetiree = rangOffre >= 0 ? offres[rangOffre] : null
    reservees.current.add(k)
    const temporaire = `objectif-en-attente-${++numero.current}`
    setEnAttente((l) => [...l, { id: temporaire, libelle: t }])
    setOffres((l) => l.filter((o) => cleObjectif(o) !== k))
    setLibre('')
    setErreur(null)

    file.current = file.current.catch(() => {}).then(async () => {
      try {
        const id = await poserObjectif(db, roulage.id, t)
        const objectif: Objectif = {
          id, libelle: t, categorie: 'objectif', cochee: 0,
          source_url: null, publie_le: null, publie_par: null, extrait_par_ia: null,
        }
        setPoses((l) => [...l, objectif].sort((a, b) => a.id.localeCompare(b.id)))
      } catch {
        reservees.current.delete(k)
        /* L'optimisme ne doit jamais faire disparaître une proposition à cause
           d'une écriture refusée. On la remet à sa place initiale ; un texte
           libre, lui, reste dans le message d'erreur et peut être retapé. */
        if (offreRetiree) setOffres((l) => {
          if (l.some((o) => cleObjectif(o) === k)) return l
          const suivantes = [...l]
          suivantes.splice(Math.min(rangOffre, suivantes.length), 0, offreRetiree)
          return suivantes
        })
        setErreur(`L'objectif « ${t} » n'a pas été enregistré. Réessaie.`)
      } finally {
        setEnAttente((l) => l.filter((o) => o.id !== temporaire))
      }
    })
  }

  const retirer = async (o: Objectif) => {
    try {
      await retirerObjectif(db, o.id)
      reservees.current.delete(cleObjectif(o.libelle))
      setPoses((l) => l.filter((x) => x.id !== o.id))
      setOffres(await propositions(db, roulage))
    } catch (e) {
      setErreur((e as Error).message || "L'objectif n'a pas été retiré.")
    }
  }

  return (
    <div className="bloc pile objectifs">
      <p className="libelle">Objectif</p>

      {poses.length || enAttente.length ? (
        <div className="pile" style={{ gap: 6 }}>
          {poses.map((o) => (
            <div className="rang ligne-atelier" key={o.id}>
              {/* ⚠ CE N'EST PAS UN BOUTON DE COCHE, ET LA BALISE LE DIT. La
                  ligne d'« Avant d'y aller » qu'on ajoute soi-même est un
                  `<button class="coche">` ; celle-ci est un `<span>`. Un
                  élément qui réagit au doigt invite à taper dessus, et taper
                  dessus voudrait dire « atteint ». */}
              <span className="texte">{o.libelle}</span>
              <button type="button" className="lien destructif"
                      aria-label={`retirer « ${o.libelle} »`}
                      onClick={() => void retirer(o)}>Retirer l'objectif</button>
            </div>
          ))}
          {enAttente.map((o) => (
            <div className="rang ligne-atelier" key={o.id} aria-live="polite">
              <span className="texte">{o.libelle}</span>
              <span className="libelle faible">enregistrement…</span>
            </div>
          ))}
        </div>
      ) : (
        /* Un état vide qui ne réclame rien : il dit ce que la chose est, pas
           qu'il manque quelque chose. */
        /* ⚠ LA PHRASE NE CITE PAS LES MOTS QU'ELLE INTERDIT, et c'est délibéré.
           Elle disait « rien ne dit "atteint" » — vrai, utile, et impossible à
           garder : l'essai qui refuse ces mots à l'écran ne sait pas lire une
           négation, et un garde qui doit comprendre « ne… pas » est un garde qui
           se trompera. On dit donc la même chose sans le mot. */
        <p className="sous-titre">
          Rien de posé. Ce que tu poses ici se relit le soir : rien ne se coche, et rien
          ne juge.
        </p>
      )}
      {erreur && <p className="mot-erreur" role="alert">{erreur}</p>}

      {!ouvert ? (
        <button type="button" className="lien" onClick={() => setOuvert(true)}>
          Ajouter un objectif
        </button>
      ) : (
        <div className="pile">
          {offres.length > 0 && (
            <>
              <span className="sous-titre">ce que le produit sait de ce jour-là</span>
              {/* ⚠ LES PROPOSITIONS D'ABORD, LE CHAMP APRÈS. C'est tout ce qui
                  sépare cet écran du champ vide que Julian a rejeté. */}
              <div className="puces">
                {offres.map((o) => (
                  <button key={o} type="button" className="puce"
                          onClick={() => poser(o)}>{o.toUpperCase()}</button>
                ))}
              </div>
            </>
          )}
          <div className="rang">
            <input className="champ" value={libre} onChange={(e) => setLibre(e.target.value)}
                   placeholder="autre chose" autoComplete="off"
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') { e.preventDefault(); poser(libre) }
                   }} />
            <button type="button" className="bouton secondaire" disabled={!libre.trim()}
                    onClick={() => poser(libre)}>Enregistrer l'objectif</button>
          </div>
          <button type="button" className="lien" onClick={() => setOuvert(false)}>
            Fermer la saisie
          </button>
        </div>
      )}
    </div>
  )
}
