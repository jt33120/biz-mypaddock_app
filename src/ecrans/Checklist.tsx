import { useCallback, useEffect, useRef, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  ajouter, CHARGEMENT, cocher, composer, direLAge, direPublication, lignesDuChargement,
  moisDepuis, MOIS_AVANT_DOUTE, NOM_CATEGORIE, rattachement, retirer,
  verserLesReglesManquantes, type Ligne, type Rattachement,
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
  const [enregistrement, setEnregistrement] = useState(0)
  const [erreur, setErreur] = useState('')
  const listeCourante = useRef<Ligne[]>([])
  const ecritures = useRef(new Map<string, Promise<void>>())
  /** Récit 17.4 — « je ne sais rien » et « je n'ai pas pu lire » sont deux
   *  phrases, et jusqu'ici l'écran ne disait que la première. */
  const [lien, setLien] = useState<Rattachement>('rattache')

  const charger = useCallback(async () => {
    /* ⚠ LES RÈGLES QUI REDESCENDENT APRÈS LA COMPOSITION ENTRENT ICI, ET NULLE
       PART AILLEURS — récit 17.4. Le chargement se compose le jeudi soir au
       garage, hors ligne ; les règles de Pau-Arnos arrivent le vendredi par la
       synchronisation ; et plus rien n'appelait `composer`, qui rend 0 dès
       qu'une ligne existe. Elles étaient perdues pour ce roulage,
       définitivement et sans un mot.
       Cet appel N'ÉCRIT QUE CE QUI MANQUE : aucune coche ne bouge, aucune ligne
       du pilote ne disparaît, et il ne coûte rien tant qu'il n'y a rien de neuf
       — ce qui est le cas ordinaire. */
    await verserLesReglesManquantes(db, roulageId)
    setLien(await rattachement(db, roulageId))
    const l = await lignesDuChargement(db, roulageId)
    listeCourante.current = l
    setListe(l)
  }, [db, roulageId])
  useEffect(() => { void charger() }, [charger])

  const creer = async () => { await composer(db, roulageId); await charger(); setOuverte(true) }

  /** L'écran répond avant SQLite et sérialise les changements d'une même ligne.
   *  Deux taps sur deux lignes restent deux écritures ; aucun rechargement ne
   *  referme le panneau ni ne ramène vers la journée précédente. */
  const basculer = (id: string) => {
    const ligne = listeCourante.current.find((l) => l.id === id)
    if (!ligne) return
    const oui = !ligne.cochee
    const suivante = listeCourante.current.map((l) =>
      l.id === id ? { ...l, cochee: oui ? 1 : 0 } : l)
    listeCourante.current = suivante
    setListe(suivante)
    setErreur('')
    setEnregistrement((total) => total + 1)

    const precedente = ecritures.current.get(id)
    /* La première écriture part DANS le gestionnaire du clic. La faire passer
       par `Promise.resolve().then(...)` la repoussait d'une micro-tâche : un
       rechargement déclenché juste après deux taps pouvait interrompre les deux
       appels avant même leur entrée dans SQLite. Seuls les taps suivants sur
       LA MÊME ligne attendent leur prédécesseur. */
    const action = (precedente
      ? precedente.catch(() => {}).then(() => cocher(db, id, oui))
      : cocher(db, id, oui))
      .catch(() => {
        /* Une écriture refusée ne doit ni annuler une coche plus récente sur
           la même ligne, ni recharger la liste et écraser les autres réponses
           optimistes encore en vol. On ne restaure donc que CETTE intention,
           si elle est toujours la dernière visible. */
        const courant = listeCourante.current.find((l) => l.id === id)
        if (courant?.cochee === (oui ? 1 : 0)) {
          const restauree = listeCourante.current.map((l) =>
            l.id === id ? { ...l, cochee: ligne.cochee } : l)
          listeCourante.current = restauree
          setListe(restauree)
        }
        setErreur('La coche n’a pas été enregistrée. Réessaie.')
      })
      .finally(() => setEnregistrement((total) => Math.max(0, total - 1)))
    ecritures.current.set(id, action)
    void action.finally(() => {
      if (ecritures.current.get(id) === action) ecritures.current.delete(id)
    })
  }

  if (!liste.length) {
    /* ⚠ ELLE PORTE SON NOM AVANT D'EXISTER — et la classe n'est PAS `checklist`.
       Sur l'écran d'une journée à venir, les deux listes se suivent : « Avant
       d'y aller » dans son bloc, et le chargement en lien nu juste dessous. La
       seconde ne se lisait plus comme une liste mais comme un lien égaré, alors
       que ce sont deux listes distinctes qui doivent le rester (`CHARGEMENT`,
       src/db/checklist.ts). Elle dit ce qu'elle contiendra — un fait — jamais ce
       qui manquerait.
       Le nom de classe reste distinct de `.checklist` À DESSEIN : le banc attend
       `.checklist` pour savoir que la composition a eu lieu, et le faire
       correspondre à l'état vide rendrait cette attente immédiate, donc muette. */
    return (
      <div className="bloc pile chargement-vide">
        <p className="libelle">Chargement</p>
        <p className="sous-titre">
          Ce que tu emportes : la moto, ce que tu portes, ce que l'organisateur publie.
        </p>
        <button type="button" className="lien" onClick={() => void creer()}>
          Préparer le chargement
        </button>
      </div>
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
      <button type="button" className="rang atelier-tete"
              aria-expanded={ouverte} onClick={() => setOuverte(!ouverte)}>
        <span className="libelle">Chargement</span>
        {/* Un DÉCOMPTE, pas une progression : « 8 chargés » énonce ce qui est
            dans le camion. « 8 sur 11 » énoncerait ce qui manque. */}
        <span className="libelle faible" aria-live="polite">
          {cochees ? `${cochees} chargé${cochees > 1 ? 's' : ''}` : `${liste.length} lignes`}
          {enregistrement ? ' · enregistrement…' : ''}
        </span>
      </button>

      {erreur && <p className="note erreur" role="alert">{erreur}</p>}

      {ouverte && parCategorie.map(([c, l]) => (
        <div className={`pile ${c}`} key={c}>
          <div className="libelle faible">{NOM_CATEGORIE[c]}</div>
          {c === 'conformite' && !l.length && (
            /* FR-50 — le produit DIT ce qu'il ne sait pas, au lieu de laisser
               un silence qu'on lirait comme « rien n'est exigé ». Et il ne
               promet pas de le savoir un jour : il renvoie à la seule source qui
               fait foi.

               ⚠ DEUX ABSENCES, DEUX PHRASES — récit 17.4. Le mode PAR DÉFAUT du
               produit est le pilote sans compte : son `circuit_id` reste nul
               pour toujours, parce que le rattachement au référentiel se fait
               côté serveur (migration 20260825000003) et que rien de lui ne
               monte au serveur. Lui dire « aucune règle n'est connue » serait
               présenter une absence de savoir comme un savoir de l'absence :
               la question n'a même pas été posée pour sa journée. */
            lien === 'rattache' ? (
              <p className="note">
                Aucune règle publiée n’est connue pour ce roulage. Ça ne veut pas dire qu’il n’y
                en a pas — l’organisateur reste la seule source.
              </p>
            ) : (
              <p className="note">
                Cette journée n’est rattachée à aucun circuit du référentiel : le produit n’a pas
                pu aller voir. Ça ne dit rien de ce que l’organisateur exige — il reste la seule
                source.
              </p>
            )
          )}
          {l.map((ligne) => {
            const mois = ligne.publie_le ? moisDepuis(ligne.publie_le, jour) : 0
            return (
              <div className="rang ligne-atelier" key={ligne.id}>
                <button type="button" className="coche" data-actif={ligne.cochee ? '1' : '0'}
                        aria-pressed={!!ligne.cochee} onClick={() => basculer(ligne.id)}>
                  <span className="texte">{ligne.libelle}</span>
                </button>
                {!ligne.source_url && (
                  <button type="button" className="lien destructif"
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
          <button type="button" className="lien" disabled={!ajout.trim()}
                  onClick={() => void ajouter(db, roulageId, ajout, 'machine')
                    .then(() => { setAjout(''); return charger() })}>
            ajouter
          </button>
        </div>
      )}
    </div>
  )
}
