import { useCallback, useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import { cequiResteAFaire, memeTache, NOM_GENRE, type Tache } from '../db/preparation'
import { ajouter, cocher, lignes, retirer, type Ligne } from '../db/checklist'
import { useGeste } from './geste'

/**
 * AVANT D'Y ALLER — retour de Julian du 23 août :
 *
 *   « Je mets le prochain roulage où je vais aller et j'ai une liste de tâches
 *     à faire : checker huile, si accident réparer, payer etc. »
 *
 * ⚠ DEUX LISTES QUI NE SE MÉLANGENT PAS, et la distinction est visible à l'œil :
 *
 *   · CE QUI EST DÉRIVÉ ne se coche pas. Une pièce qui attend au garage
 *     disparaît quand on la monte, pas quand on coche une case — cocher
 *     donnerait le sentiment d'avoir fait le travail sans l'avoir fait, sur des
 *     lignes qui touchent une plaquette de frein. Chacune mène donc à l'endroit
 *     où elle se règle réellement.
 *   · CE QUE LE PILOTE AJOUTE se coche, parce que lui seul sait quand c'est
 *     fait — « prévenir Ludo », « passer chercher le bidon ».
 *
 * ⚠ AUCUN COMPTEUR DE PROGRESSION. Ni « 3 sur 7 », ni barre, ni pastille. FR-50
 * le dit pour la checklist de chargement et vaut ici mot pour mot : une liste
 * qui affiche sa progression devient une chose à finir, et une chose à finir se
 * bâcle. On énonce ce qui attend, on ne compte pas ce qui manque.
 *
 * ⚠ ET RIEN NE RELANCE. Pas d'échéance, pas de compteur à rebours, pas de rouge
 * quand la date approche. La liste est là quand le pilote ouvre ; elle ne va pas
 * le chercher (contre-mesure C1).
 */
export function Preparation({ db, roulage, onAller }: {
  db: PowerSyncDatabase
  roulage: { id: string; machineId: string | null; date: string }
  /** Chaque ligne dérivée MÈNE QUELQUE PART. Une liste de rappels dont les
   *  lignes ne mènent nulle part se lit une fois et ne se relit jamais. */
  onAller: (vers: Tache['vers']) => void
}) {
  const [taches, setTaches] = useState<Tache[]>([])
  const [siennes, setSiennes] = useState<Ligne[]>([])
  const [saisie, setSaisie] = useState('')

  const charger = useCallback(async () => {
    setTaches(await cequiResteAFaire(db, roulage))
    const l = await lignes(db, roulage.id)
    setSiennes(l.filter((x) => x.categorie === 'preparation'))
  }, [db, roulage])
  useEffect(() => { void charger() }, [charger])

  const [poser, occupe] = useGeste(async () => {
    const t = saisie.trim()
    if (!t) return
    await ajouter(db, roulage.id, t, 'preparation')
    setSaisie('')
    await charger()
  })

  // Une tâche ajoutée à la main qui répète une tâche dérivée n'apparaît qu'une
  // fois : voir deux fois « plaquettes » ferait douter des deux.
  const propres = siennes.filter((s) => !taches.some((t) => memeTache(t.libelle, s.libelle)))

  if (!taches.length && !propres.length) {
    return (
      <div className="bloc pile preparation">
        <p className="libelle">Avant d'y aller</p>
        {/* Une liste vide est un ÉTAT JUSTE, pas un écran raté. Elle dit ce
            qu'elle sait — rien n'attend — et propose d'en ajouter, sans jamais
            suggérer qu'il manque quelque chose. */}
        <p className="sous-titre">Rien n'attend au garage, et l'engagement est saisi.</p>
        <Ajout valeur={saisie} sur={setSaisie} occupe={occupe} poser={poser} />
      </div>
    )
  }

  return (
    <div className="bloc pile preparation">
      <p className="libelle">Avant d'y aller</p>

      {taches.map((t, i) => (
        <button className="rang ligne-atelier tache" key={`d${i}`} onClick={() => onAller(t.vers)}>
          <span className="pile" style={{ gap: 0 }}>
            <span className="texte">{t.libelle}</span>
            {/* LE MOTIF EST DIT. Une tâche sans son motif est un ordre ; avec
                son motif, c'est un constat qu'on peut contester — et qu'on peut
                donc croire. */}
            <span className="sous-titre">{NOM_GENRE[t.genre]} · {t.motif}</span>
          </span>
          <span className="signe" aria-hidden>›</span>
        </button>
      ))}

      {propres.map((s) => (
        <label className="rang ligne-atelier" key={s.id}>
          <button className="coche" data-actif={s.cochee ? '1' : '0'}
                  onClick={() => void cocher(db, s.id, !s.cochee).then(charger)}>
            {s.libelle}
          </button>
          <button className="lien" style={{ minHeight: 40 }}
                  onClick={() => void retirer(db, s.id).then(charger)}>retirer</button>
        </label>
      ))}

      <Ajout valeur={saisie} sur={setSaisie} occupe={occupe} poser={poser} />
    </div>
  )
}

function Ajout({ valeur, sur, occupe, poser }: {
  valeur: string; sur: (v: string) => void; occupe: boolean; poser: () => void
}) {
  /* ⚠ `min-width: 0` SUR LE CHAMP, sans quoi il déborde. Un `input` a une
     `min-width: auto` qui vaut sa largeur intrinsèque — environ 180 px — et il
     REFUSE de se réduire en dessous : il pousse alors le bouton hors du bloc, à
     droite, à moitié coupé. Vu sur la capture, invisible à la relecture. C'est
     le piège flexbox le plus courant et il ne se voit qu'à l'écran. */
  return (
    <div className="rang ajout-tache">
      <input className="champ" value={valeur} onChange={(e) => sur(e.target.value)}
             placeholder="autre chose à faire" autoComplete="off"
             onKeyDown={(e) => { if (e.key === 'Enter') poser() }} />
      <button className="bouton secondaire" disabled={!valeur.trim() || occupe} onClick={poser}>
        Ajouter
      </button>
    </div>
  )
}
