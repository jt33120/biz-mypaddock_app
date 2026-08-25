import { useCallback, useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  ajouter, CHARGEMENT, cocher, composer, direLAge, direPublication, lignesDuChargement,
  moisDepuis, MOIS_AVANT_DOUTE, NOM_CATEGORIE, retirer, type Ligne,
} from '../db/checklist'

/**
 * LA CHECKLIST À L'ÉCRAN — FR-49 à FR-51.
 *
 * ⚠ AUCUN COMPTEUR DE CONFORMITÉ, aucun « 8/11 », aucune barre qui se remplit.
 * Une checklist qui affiche sa progression devient une chose à FINIR, et une
 * chose à finir produit exactement la pression que le produit s'interdit. Elle
 * se coche au fur et à mesure du chargement et reste attachée au roulage comme
 * trace — c'est tout ce qu'elle fait.
 *
 * ⚠ ELLE NE LIT QUE LES CATÉGORIES DE `CHARGEMENT`. « Avant d'y aller » vit dans
 * la même table, sur le même roulage, et n'a rien à faire ici : une tâche de
 * préparation comptée dans le camion rendait l'en-tête faux et le chargement
 * incomposable. Le motif complet est dans src/db/checklist.ts.
 */
export function Checklist({ db, roulageId, jour }: {
  db: PowerSyncDatabase; roulageId: string; jour: string
}) {
  const [liste, setListe] = useState<Ligne[]>([])
  const [ouverte, setOuverte] = useState(false)
  const [ajout, setAjout] = useState('')

  const charger = useCallback(
    async () => setListe(await lignesDuChargement(db, roulageId)), [db, roulageId])
  useEffect(() => { void charger() }, [charger])

  const creer = async () => { await composer(db, roulageId); await charger(); setOuverte(true) }

  if (!liste.length) {
    return (
      <button className="lien" onClick={() => void creer()}>Préparer le chargement</button>
    )
  }

  const cochees = liste.filter((l) => l.cochee).length
  // Dérivée de `CHARGEMENT`, jamais réécrite à la main : une seconde liste des
  // mêmes catégories prendrait du retard sur la première, et c'est exactement
  // comme ça que « Avant d'y aller » s'est retrouvée comptée sans être rendue.
  const parCategorie = CHARGEMENT
    .map((c) => [c, liste.filter((l) => l.categorie === c)] as const)
    // ⚠ `conformite` SURVIT À SON VIDE. Les autres catégories disparaissent
    // quand elles sont vides — il n'y a rien à dire d'une machine sans ligne.
    // Celle-ci, non : faire disparaître la section sans un mot laisserait croire
    // que l'organisateur n'exige rien, alors que la vérité est que le produit ne
    // sait rien. Une absence se dit.
    .filter(([c, l]) => l.length || c === 'conformite')

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
        <div className={`pile ${c}`} key={c}>
          <div className="libelle faible">{NOM_CATEGORIE[c]}</div>
          {c === 'conformite' && !l.length && (
            /* FR-50 — le produit DIT qu'il ne sait rien, au lieu de laisser un
               silence qu'on lirait comme « rien n'est exigé ». Et il ne promet
               pas de le savoir un jour : il renvoie à la seule source qui fait
               foi. */
            <p className="note">
              Aucune règle publiée n’est connue pour ce roulage. Ça ne veut pas dire qu’il n’y
              en a pas — l’organisateur reste la seule source.
            </p>
          )}
          {l.map((ligne) => {
            const mois = ligne.publie_le ? moisDepuis(ligne.publie_le, jour) : 0
            return (
              <div className="rang ligne-atelier" key={ligne.id}>
                <button className="coche" data-actif={ligne.cochee ? '1' : '0'}
                        onClick={() => void cocher(db, ligne.id, !ligne.cochee).then(charger)}>
                  <span className="texte">{ligne.libelle}</span>
                </button>
                {!ligne.source_url && (
                  <button className="lien destructif"
                          onClick={() => void retirer(db, ligne.id).then(charger)}>
                    retirer
                  </button>
                )}
                {ligne.source_url && (
                  /* FR-50 — QUI l'a publiée, QUAND, et COMMENT elle a été lue.
                     Le produit rapporte ce qu'un organisateur a publié ; il ne
                     certifie rien, et il ne masque pas qu'une machine a lu la
                     page à sa place (QO-6). */
                  <span className="libelle faible">
                    {direPublication(ligne.publie_le ?? '', ligne.publie_par)}
                    {mois > MOIS_AVANT_DOUTE ? ` · ${direLAge(mois)}` : ''}
                    {ligne.extrait_par_ia ? ' · relevé automatiquement sur la page' : ''}
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
