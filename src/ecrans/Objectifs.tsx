import { useCallback, useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  objectifsDuRoulage, poserObjectif, propositions, retirerObjectif, type Objectif,
} from '../db/objectifs'
import { useGeste } from './geste'

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

  const charger = useCallback(async () => {
    setPoses(await objectifsDuRoulage(db, roulage.id))
    setOffres(await propositions(db, roulage))
  }, [db, roulage])
  useEffect(() => { void charger() }, [charger])

  const [poser, occupe, garde] = useGeste(async (quoi: string) => {
    const t = quoi.trim()
    if (!t) return
    await poserObjectif(db, roulage.id, t)
    setLibre('')
    await charger()
  })

  return (
    <div className="bloc pile objectifs" data-garde={garde ? '1' : '0'}>
      <p className="libelle">Ce que tu viens chercher</p>

      {poses.length > 0 ? (
        <div className="pile" style={{ gap: 6 }}>
          {poses.map((o) => (
            <div className="rang ligne-atelier" key={o.id}>
              {/* ⚠ CE N'EST PAS UN BOUTON DE COCHE, ET LA BALISE LE DIT. La
                  ligne d'« Avant d'y aller » qu'on ajoute soi-même est un
                  `<button class="coche">` ; celle-ci est un `<span>`. Un
                  élément qui réagit au doigt invite à taper dessus, et taper
                  dessus voudrait dire « atteint ». */}
              <span className="texte">{o.libelle}</span>
              <button className="lien destructif" style={{ minHeight: 40 }}
                      aria-label={`retirer « ${o.libelle} »`}
                      onClick={() => void retirerObjectif(db, o.id).then(charger)}>retirer</button>
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

      {!ouvert ? (
        <button className="lien" onClick={() => setOuvert(true)}>+ Poser ce que tu viens chercher</button>
      ) : (
        <div className="pile">
          {offres.length > 0 && (
            <>
              <span className="sous-titre">ce que le produit sait de ce jour-là</span>
              {/* ⚠ LES PROPOSITIONS D'ABORD, LE CHAMP APRÈS. C'est tout ce qui
                  sépare cet écran du champ vide que Julian a rejeté. */}
              <div className="puces">
                {offres.map((o) => (
                  <button key={o} className="puce" disabled={occupe}
                          onClick={() => void poser(o)}>{o.toUpperCase()}</button>
                ))}
              </div>
            </>
          )}
          <div className="rang">
            <input className="champ" value={libre} onChange={(e) => setLibre(e.target.value)}
                   placeholder="autre chose" autoComplete="off"
                   onKeyDown={(e) => { if (e.key === 'Enter') void poser(libre) }} />
            <button className="bouton secondaire" disabled={!libre.trim() || occupe}
                    onClick={() => void poser(libre)}>Poser</button>
          </div>
          <button className="lien" onClick={() => setOuvert(false)}>Fermer</button>
        </div>
      )}
    </div>
  )
}
