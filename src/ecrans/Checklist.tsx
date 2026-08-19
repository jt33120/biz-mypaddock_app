import { useCallback, useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  ajouter, cocher, composer, lignes, moisDepuis, MOIS_AVANT_DOUTE, NOM_CATEGORIE, retirer,
  type Categorie, type Ligne,
} from '../db/checklist'

/**
 * LA CHECKLIST À L'ÉCRAN — FR-49 à FR-51.
 *
 * ⚠ AUCUN COMPTEUR DE CONFORMITÉ, aucun « 8/11 », aucune barre qui se remplit.
 * Une checklist qui affiche sa progression devient une chose à FINIR, et une
 * chose à finir produit exactement la pression que le produit s'interdit. Elle
 * se coche au fur et à mesure du chargement et reste attachée au roulage comme
 * trace — c'est tout ce qu'elle fait.
 */
export function Checklist({ db, roulageId, jour }: {
  db: PowerSyncDatabase; roulageId: string; jour: string
}) {
  const [liste, setListe] = useState<Ligne[]>([])
  const [ouverte, setOuverte] = useState(false)
  const [ajout, setAjout] = useState('')

  const charger = useCallback(async () => setListe(await lignes(db, roulageId)), [db, roulageId])
  useEffect(() => { void charger() }, [charger])

  const creer = async () => { await composer(db, roulageId); await charger(); setOuverte(true) }

  if (!liste.length) {
    return (
      <button className="lien" onClick={() => void creer()}>Préparer le chargement</button>
    )
  }

  const cochees = liste.filter((l) => l.cochee).length
  const parCategorie = (['machine', 'equipement', 'conformite'] as Categorie[])
    .map((c) => [c, liste.filter((l) => l.categorie === c)] as const)
    .filter(([, l]) => l.length)

  return (
    <div className="bloc pile checklist">
      <button className="rang atelier-tete" onClick={() => setOuverte(!ouverte)}>
        <span className="libelle">Chargement</span>
        {/* Un DÉCOMPTE, pas une progression : « 8 chargés » énonce ce qui est
            dans le camion. « 8 sur 11 » énoncerait ce qui manque. */}
        <span className="libelle faible">
          {cochees ? `${cochees} chargé${cochees > 1 ? 's' : ''}` : `${liste.length} lignes`}
        </span>
      </button>

      {ouverte && parCategorie.map(([c, l]) => (
        <div className="pile" key={c}>
          <div className="libelle faible">{NOM_CATEGORIE[c]}</div>
          {l.map((ligne) => {
            const mois = ligne.publie_le ? moisDepuis(ligne.publie_le, jour) : 0
            return (
              <div className="rang ligne-atelier" key={ligne.id}>
                <button className="coche" data-actif={ligne.cochee ? '1' : '0'}
                        onClick={() => void cocher(db, ligne.id, !ligne.cochee).then(charger)}>
                  <span className="texte">{ligne.libelle}</span>
                </button>
                {!ligne.source_url && (
                  <button className="lien" onClick={() => void retirer(db, ligne.id).then(charger)}>
                    retirer
                  </button>
                )}
                {ligne.source_url && (
                  /* FR-50 — la source ET la date, toujours. Le produit rapporte
                     ce qu'un organisateur a publié ; il ne certifie rien. */
                  <span className="libelle faible">
                    publié le {ligne.publie_le}
                    {mois > MOIS_AVANT_DOUTE ? ` · il y a ${Math.floor(mois / 12)} an(s)` : ''}
                  </span>
                )}
              </div>
            )
          })}
          {c === 'conformite' && l.some((x) => x.publie_le
            && moisDepuis(x.publie_le, jour) > MOIS_AVANT_DOUTE) && (
            /* FR-51 — une fiche de plus de douze mois AFFICHE SON ÂGE et invite
               à vérifier. Elle ne se présente jamais comme à jour. */
            <p className="note">
              Une partie de ces règles a plus d'un an. Elles sont rapportées telles qu'elles ont
              été publiées, jamais vérifiées — l'organisateur reste la seule source à jour.
            </p>
          )}
        </div>
      ))}

      {ouverte && (
        <div className="rang">
          <input className="champ" value={ajout} onChange={(e) => setAjout(e.target.value)}
                 placeholder="autre chose à charger" autoComplete="off" />
          <button className="lien" disabled={!ajout.trim()}
                  onClick={() => void ajouter(db, roulageId, ajout, 'machine')
                    .then(() => { setAjout(''); return charger() })}>
            ajouter
          </button>
        </div>
      )}
    </div>
  )
}
