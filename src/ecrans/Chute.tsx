import { useCallback, useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  chutesDuRoulage, completerChute, consignerChute, coutDeLaChute, oublierChute, type Chute as Tombee,
} from '../db/chute'
import { formaterEuros } from '../db/depot'
import { useGeste } from './geste'

/**
 * LA CHUTE — « renseigner sur un roulage s'il y a eu une chute et des infos sur
 * la chute » (Julian, 20 août 2026).
 *
 * ⚠ C'EST L'ÉCRAN LE PLUS DÉLICAT DU PRODUIT, et pas parce qu'il est compliqué.
 * MyPaddock est né d'une chute causée par la recherche d'un geste. Tout ce qui
 * touche à ce sujet doit être tenu par des règles écrites, pas par du goût.
 *
 * CE QU'IL NE FAIT PAS, ET AUCUNE DE CES LIGNES N'EST NÉGOCIABLE :
 *
 *   ① AUCUN COMPTEUR. Ni « 2 chutes cette saison », ni « 14 roulages sans
 *     chute ». La seconde est la plus tentante et de très loin la pire : une
 *     série crée une pression à ne pas la rompre, donc à NE PAS DÉCLARER. Le
 *     schéma n'a d'ailleurs aucune colonne qui puisse se sommer, et `chute.ts`
 *     n'exporte aucune fonction qui compte.
 *
 *   ② AUCUN JUGEMENT. Pas de gravité, pas de responsabilité, pas d'« évitable ».
 *     Le produit rapporte, il ne qualifie pas.
 *
 *   ③ RIEN NE RÉCLAME. Le lien est discret et se lit une fois, en bas du bilan.
 *     Un bandeau « as-tu chuté ? » sur chaque journée transformerait la
 *     consignation en interrogatoire, et il serait fermé sans être lu dès la
 *     deuxième fois.
 *
 *   ④ RIEN N'EST OBLIGATOIRE. L'endroit et le récit sont facultatifs tous les
 *     deux : une chute qu'on ne veut pas raconter reste une chute consignée.
 *     Demander de mettre des mots dessus une heure après, c'est n'obtenir rien.
 *
 * CE QU'IL FAIT, ET POURQUOI ÇA VAUT LA PEINE : c'est la seule ligne du carnet
 * qui serve devant un tiers — une assurance, un acheteur — et la seule qui
 * réponde, deux ans plus tard, à « c'était quand, déjà, la fois où ».
 */
export function Chutes({ db, roulageId, onEcrit }: {
  db: PowerSyncDatabase; roulageId: string; onEcrit: () => void
}) {
  const [liste, setListe] = useState<Tombee[]>([])
  const [saisie, setSaisie] = useState(false)

  const charger = useCallback(
    async () => setListe(await chutesDuRoulage(db, roulageId)), [db, roulageId])
  useEffect(() => { void charger() }, [charger])

  const [consigner, occupe] = useGeste(async () => {
    await consignerChute(db, { roulageId })
    setSaisie(true)
    await charger(); onEcrit()
  })

  if (!liste.length) {
    return (
      // Un lien, en bas, qui énonce un fait possible. Ni bouton primaire, ni
      // question, ni pastille : le produit ne demande pas à quelqu'un s'il est
      // tombé.
      <button className="lien" disabled={occupe} onClick={() => void consigner()}>
        {occupe ? 'enregistrement…' : "J'ai chuté ce jour-là"}
      </button>
    )
  }

  return (
    <div className="pile">
      <p className="libelle">Ce jour-là</p>
      {liste.map((c) => (
        <UneChute key={c.id} db={db} c={c} ouverte={saisie}
                  onEcrit={() => void charger().then(onEcrit)} />
      ))}
      {/* On peut tomber deux fois dans la journée, et il n'y a rien à en
          conclure — c'est précisément pour ça que ce n'est pas un booléen sur
          le roulage. */}
      <button className="lien" disabled={occupe} onClick={() => void consigner()}>
        Une autre chute ce jour-là
      </button>
    </div>
  )
}

function UneChute({ db, c, ouverte, onEcrit }: {
  db: PowerSyncDatabase; c: Tombee; ouverte: boolean; onEcrit: () => void
}) {
  const [endroit, setEndroit] = useState(c.endroit ?? '')
  const [recit, setRecit] = useState(c.recit ?? '')
  const [edite, setEdite] = useState(ouverte && !c.endroit && !c.recit)
  const [cout, setCout] = useState<{ centimes: number; reparations: number } | null>(null)
  const [confirme, setConfirme] = useState(false)

  useEffect(() => { void coutDeLaChute(db, c.id).then(setCout) }, [db, c.id])

  const [garder, occupe] = useGeste(async () => {
    await completerChute(db, c.id, { endroit, recit })
    setEdite(false)
    onEcrit()
  })
  const [retirer, efface] = useGeste(async () => {
    await oublierChute(db, c.id)
    onEcrit()
  })

  if (edite) {
    return (
      <div className="bloc pile chute">
        <div className="libelle">Où</div>
        <input className="champ" value={endroit} onChange={(e) => setEndroit(e.target.value)}
               placeholder="virage 3, l'épingle…" autoComplete="off" />
        {/* CE QUE LE PILOTE ÉCRIT EST GARDÉ MOT POUR MOT. Aucune reformulation,
            aucune correction, aucune case à cocher — la même règle que le plan
            si-alors, et pour une raison plus forte encore ici. */}
        <div className="libelle">Ce qui s'est passé · si tu veux l'écrire</div>
        <textarea className="champ" rows={4} value={recit}
                  onChange={(e) => setRecit(e.target.value)}
                  placeholder="dans tes mots, ou rien du tout" />
        <button className="bouton secondaire" disabled={occupe} onClick={() => void garder()}>
          {occupe ? 'enregistrement…' : 'Garder'}
        </button>
        <button className="lien" onClick={() => setEdite(false)}>Plus tard</button>
      </div>
    )
  }

  return (
    <div className="bloc pile chute">
      <div className="rang">
        <span className="texte">{c.endroit || 'Une chute'}</span>
        {/* Ce que la chute a coûté EN RÉPARATIONS. Une facture, pas une
            statistique : elle répond à « combien m'a coûté cette journée-là »,
            question qu'on se pose une fois. */}
        {cout && cout.reparations > 0 && (
          <span className="libelle faible">
            {cout.reparations} réparation{cout.reparations > 1 ? 's' : ''}
            {cout.centimes ? ` · ${formaterEuros(cout.centimes)}` : ''}
          </span>
        )}
      </div>
      {c.recit && <p className="texte faible">{c.recit}</p>}

      {confirme ? (
        <div className="pile">
          <p className="note">
            La chute part. Les réparations et les photos qu'elle portait restent —
            elles ont eu lieu.
          </p>
          <div className="rang">
            <button className="bouton destructif" disabled={efface} onClick={() => void retirer()}>
              {efface ? 'suppression…' : 'Retirer'}
            </button>
            <button className="lien" onClick={() => setConfirme(false)}>Garder</button>
          </div>
        </div>
      ) : (
        <div className="rang">
          <button className="lien" onClick={() => setEdite(true)}>
            {c.endroit || c.recit ? 'Corriger' : 'Écrire ce qui s\'est passé'}
          </button>
          {/* LES DEUX TEMPS PORTENT LE ROUGE, celui qui ouvre comme celui qui
              fait. Le premier tap n'efface rien, mais il annonce l'effacement :
              lui laisser la couleur d'un lien ordinaire, c'est cacher la moitié
              du geste. La confirmation, elle, ne bouge pas — la couleur ne
              remplace jamais le deuxième tap (UX-DR8). */}
          <button className="lien destructif" onClick={() => setConfirme(true)}>Retirer</button>
        </div>
      )}
    </div>
  )
}
