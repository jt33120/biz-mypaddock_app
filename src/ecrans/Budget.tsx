import { useCallback, useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  CATEGORIES_EQUIPEMENT, coutEquipement, declarerEquipement, depenserSur,
  EXEMPLE_EQUIPEMENT, EXEMPLE_POSTE, listerEquipement, NOM_EQUIPEMENT, NOM_POSTE,
  oublierEquipement, parPoste, POSTES,
  type CategorieEquipement, type Equipement as Materiel, type LignePoste, type Poste,
} from '../db/budget'
import { enCentimes, formaterEuros, type Cible } from '../db/depot'
import { useGeste } from './geste'

/**
 * LE BUDGET ET L'ÉQUIPEMENT — deux modules demandés par Julian, dans le garage.
 *
 * « Ajouter parmi ces trois modules un aspect budget où on ajoute le budget
 *   course entretien maintenance essence assurance etc, louage remorque »
 *
 * « Dans le garage, il y a toujours une machine mais aussi un espace équipement :
 *   combi, tente, gants, accessoire, chaise, tout ce qui est nécessaire à une
 *   journée circuit mais sans être spécifique à une machine »
 *
 * ⚠ LES DEUX CLAUSES D'ARGENT DU PRODUIT TIENNENT ICI, et elles ne sont pas
 * décoratives :
 *
 *   ① AUCUNE PRÉVISION. Ce module additionne ce qui a été saisi et s'arrête là.
 *     Le seul chiffre du produit qui ait le droit de parler d'avenir est le
 *     budget que le pilote a LUI-MÊME posé — parce qu'il l'a posé.
 *   ② AUCUN RESTE À DÉPENSER, aucune barre qui se remplit, aucun « il te reste
 *     X € ». Un budget qui se vide sous les yeux est un compteur à rebours, et
 *     un compteur à rebours sur de l'argent produit exactement ce qu'il prétend
 *     éviter : on cesse de saisir pour ne plus le voir descendre.
 */
const aujourdhui = () => new Date().toISOString().slice(0, 10)
const ceMois = () => new Date().toISOString().slice(0, 7)

export function Budget({ db, annee, machineId, onEcrit }: {
  db: PowerSyncDatabase
  annee: number
  /** La machine affichée — proposée comme cible quand le poste la concerne.
   *  Jamais imposée : une assurance ou une tente ne désigne aucune moto. */
  machineId: string | null
  onEcrit: () => void
}) {
  const [lignes, setLignes] = useState<LignePoste[]>([])
  const [ouvert, setOuvert] = useState(false)
  const [saisie, setSaisie] = useState<Poste | null>(null)

  const charger = useCallback(async () => setLignes(await parPoste(db, annee)), [db, annee])
  useEffect(() => { void charger() }, [charger])

  const total = lignes.reduce((t, l) => t + l.total, 0)
  const trouve = (p: Poste) => lignes.find((l) => l.poste === p)
  const sansPoste = lignes.find((l) => l.poste === null)

  return (
    <div className="bloc pile atelier budget">
      <button className="rang atelier-tete" onClick={() => setOuvert(!ouvert)}>
        <span className="pile" style={{ gap: 1 }}>
          <span className="libelle">Budget · saison {annee}</span>
          <span className="sous-titre">
            ce que la saison a coûté, poste par poste
          </span>
        </span>
        <span className="chiffre hud-16">{total ? formaterEuros(total) : '—'}</span>
      </button>

      {ouvert && (
        <>
          {!total && (
            <p className="note">
              Rien de saisi. Un poste se remplit au moment où l'on paie, pas en début
              de saison — c'est le seul moment où l'on connaît le montant.
            </p>
          )}

          {POSTES.map((p) => {
            const l = trouve(p)
            return (
              <div className="pile" key={p} style={{ gap: 6 }}>
                {/* ⚠ TOUTE LA LIGNE EST LA CIBLE, pas le « + ». Un « + » de vingt
                    pixels est inatteignable avec des gants, et la cible minimale
                    du produit est de 52 px — c'est une contrainte de saisie au
                    paddock, pas une préférence. Trouvé sur la capture, pas à la
                    relecture : le code était juste, le doigt ne l'était pas. */}
                <button className="rang ligne-atelier poste"
                        aria-expanded={saisie === p}
                        onClick={() => setSaisie(saisie === p ? null : p)}>
                  <span className="pile" style={{ gap: 0 }}>
                    <span className="texte">{NOM_POSTE[p]}</span>
                    <span className="sous-titre">
                      {l ? `${l.n} dépense${l.n > 1 ? 's' : ''}` : EXEMPLE_POSTE[p]}
                    </span>
                  </span>
                  <span className="rang" style={{ gap: 10, flex: '0 0 auto' }}>
                    {/* Le montant ne s'affiche QUE s'il existe. Ni zéro, ni tiret
                        par défaut : un poste jamais utilisé n'est pas un poste à
                        zéro, c'est un poste dont on n'a rien à dire. */}
                    {l && <span className="chiffre hud-16">{formaterEuros(l.total)}</span>}
                    <span className="signe" aria-hidden>{saisie === p ? '×' : '+'}</span>
                  </span>
                </button>
                {saisie === p && (
                  <Ajouter db={db} poste={p} machineId={machineId}
                           onFini={() => { setSaisie(null); void charger().then(onEcrit) }} />
                )}
              </div>
            )
          })}

          {/* Les dépenses ANTÉRIEURES au poste. Elles ne sont pas rangées
              d'office dans « Autre » : les y mettre ferait croire qu'un choix a
              été fait. Elles sont dites pour ce qu'elles sont. */}
          {sansPoste && (
            <div className="rang ligne-atelier">
              <span className="pile" style={{ gap: 0 }}>
                <span className="texte faible">Sans poste</span>
                <span className="sous-titre">
                  saisies avant que les postes existent
                </span>
              </span>
              <span className="chiffre hud-16 faible">{formaterEuros(sansPoste.total)}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * LA SAISIE D'UNE DÉPENSE. Le poste est déjà choisi — on a tapé dessus.
 *
 * ⚠ LA CIBLE RESTE OBLIGATOIRE ET EXCLUSIVE (AD-7). Le poste ne la remplace
 * pas : il dit DE QUOI il s'agit, la cible dit À QUOI c'est rattaché. Le défaut
 * proposé suit le poste — des pneus désignent la moto, une assurance désigne la
 * saison — mais il reste modifiable, parce qu'un pilote à deux motos sait mieux
 * que le produit à laquelle appartient ce train de pneus.
 */
function Ajouter({ db, poste, machineId, onFini }: {
  db: PowerSyncDatabase; poste: Poste; machineId: string | null; onFini: () => void
}) {
  const SUR_LA_MACHINE: Poste[] = ['entretien', 'pneus']
  const defaut: Cible = SUR_LA_MACHINE.includes(poste) && machineId ? 'machine' : 'saison'
  const [cible, setCible] = useState<Cible>(defaut)
  const [montant, setMontant] = useState('')
  const [libelle, setLibelle] = useState('')
  const centimes = enCentimes(montant)
  const [poser, occupe] = useGeste(async () => {
    if (centimes == null) return
    await depenserSur(db, {
      poste, cible, centimes, libelle, date: aujourdhui(),
      machineId: cible === 'machine' ? machineId : null,
    })
    onFini()
  })

  return (
    <div className="pile" style={{ paddingLeft: 10 }}>
      <input className="champ" value={montant} onChange={(e) => setMontant(e.target.value)}
             placeholder="montant en €" inputMode="decimal" autoComplete="off" />
      <input className="champ" value={libelle} onChange={(e) => setLibelle(e.target.value)}
             placeholder="ce que c'était, si tu veux" autoComplete="off" />
      {machineId && (
        <div className="puces">
          <button className="puce" data-actif={cible === 'machine' ? '1' : '0'}
                  onClick={() => setCible('machine')}>SUR LA MOTO</button>
          <button className="puce" data-actif={cible === 'saison' ? '1' : '0'}
                  onClick={() => setCible('saison')}>SUR LA SAISON</button>
        </div>
      )}
      <button className="bouton secondaire" disabled={centimes == null || occupe}
              onClick={() => void poser()}>
        {occupe ? 'enregistrement…' : `Ajouter à ${NOM_POSTE[poste].toLowerCase()}`}
      </button>
      <button className="lien" onClick={onFini}>Annuler</button>
    </div>
  )
}

/**
 * L'ÉQUIPEMENT — la troisième racine.
 *
 * ⚠ AUCUNE ÉCHÉANCE, NULLE PART, ET C'EST UNE CLAUSE DE SÉCURITÉ. La tentation
 * est maximale ici : un casque a une durée de vie, une dorsale a une norme
 * datée, et il serait « utile » d'afficher « ton casque a 6 ans ». Mais un
 * compteur qui monte sur un équipement de protection est un compteur à rebours
 * déguisé, et une pression sur un achat à 500 € produit du report, pas un
 * remplacement — puis l'arrêt de la saisie, pour ne plus voir le chiffre.
 *
 * Le produit consigne donc UN FAIT — la date d'achat, telle qu'elle est — et
 * n'en dérive rien. Le schéma n'a aucune colonne d'échéance : ce qui n'existe
 * pas ne peut pas s'afficher par accident.
 */
export function Equipement({ db, onEcrit }: { db: PowerSyncDatabase; onEcrit: () => void }) {
  const [liste, setListe] = useState<Materiel[]>([])
  const [cout, setCout] = useState(0)
  const [ouvert, setOuvert] = useState(false)
  const [saisie, setSaisie] = useState(false)

  const charger = useCallback(async () => {
    setListe(await listerEquipement(db))
    setCout(await coutEquipement(db))
  }, [db])
  useEffect(() => { void charger() }, [charger])

  return (
    <div className="bloc pile atelier equipement">
      <button className="rang atelier-tete" onClick={() => setOuvert(!ouvert)}>
        <span className="pile" style={{ gap: 1 }}>
          <span className="libelle">Équipement</span>
          <span className="sous-titre">
            ce qui sert une journée circuit sans appartenir à une moto
          </span>
        </span>
        <span className="libelle faible">
          {liste.length ? `${liste.length} pièce${liste.length > 1 ? 's' : ''}` : '—'}
          {cout ? ` · ${formaterEuros(cout)}` : ''}
        </span>
      </button>

      {ouvert && (
        <>
          {!liste.length && (
            <p className="note">
              Rien de déclaré. La combinaison, la tente, les gants, la caisse à outils :
              ce qui part au circuit sans être monté sur la moto.
            </p>
          )}

          {CATEGORIES_EQUIPEMENT.map((c) => {
            const dedans = liste.filter((e) => e.categorie === c)
            if (!dedans.length) return null
            return (
              <div className="pile" key={c} style={{ gap: 6 }}>
                <span className="sous-titre">{NOM_EQUIPEMENT[c]}</span>
                {dedans.map((e) => (
                  <LigneMateriel key={e.id} db={db} e={e}
                                 onEcrit={() => void charger().then(onEcrit)} />
                ))}
              </div>
            )
          })}

          {saisie
            ? <DeclarerMateriel db={db}
                                onFini={() => { setSaisie(false); void charger().then(onEcrit) }} />
            : <button className="lien" onClick={() => setSaisie(true)}>Déclarer une pièce</button>}
        </>
      )}
    </div>
  )
}

function LigneMateriel({ db, e, onEcrit }: {
  db: PowerSyncDatabase; e: Materiel; onEcrit: () => void
}) {
  const [retirer, occupe] = useGeste(async () => {
    await oublierEquipement(db, e.id)
    onEcrit()
  })
  /* ⚠ DEUX LIGNES, PAS UN RANG. La première version mettait le nom à gauche et
     « acheté en mars 2024 · 540 € · retirer » à droite, sur un `rang` en
     `space-between`. Sur un écran de 390 px, « Combinaison Ixon 2 pièces » se
     cassait en trois lignes et « retirer » sortait par la droite de l'écran.
     Vu sur la capture, invisible à la relecture — le code était correct, la
     largeur ne l'était pas. Un nom d'équipement est libre : il peut être long,
     et la mise en page doit le supposer plutôt que l'espérer court. */
  return (
    <div className="pile materiel">
      <span className="texte">{e.nom}</span>
      <div className="rang">
        <span className="libelle faible">
          {/* La date d'achat s'énonce, elle ne se convertit pas en âge. « acheté
              en mars 2024 » est un fait ; « 2 ans » est un jugement en attente,
              et sur un casque ce jugement est précisément ce qu'on s'interdit. */}
          {e.achete_le ? `acheté ${moisDit(e.achete_le)}` : ''}
          {e.achete_le && e.cout_centimes ? ' · ' : ''}
          {e.cout_centimes ? formaterEuros(e.cout_centimes) : ''}
          {e.note ? ` · ${e.note}` : ''}
        </span>
        <button className="lien" disabled={occupe}
                onClick={() => void retirer()}>retirer</button>
      </div>
    </div>
  )
}

/** `2026-04` → « en avril 2026 ». Aucune bibliothèque : douze chaînes suffisent,
 *  et rien ne se charge depuis un CDN au paddock (NFR-4). */
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const moisDit = (aaaaMm: string) => {
  const [a, m] = aaaaMm.split('-')
  const i = Number(m) - 1
  return MOIS[i] ? `en ${MOIS[i]} ${a}` : `en ${a}`
}

function DeclarerMateriel({ db, onFini }: { db: PowerSyncDatabase; onFini: () => void }) {
  const [nom, setNom] = useState('')
  const [categorie, setCategorie] = useState<CategorieEquipement>('protection')
  const [achat, setAchat] = useState('')
  const [montant, setMontant] = useState('')
  const [poser, occupe] = useGeste(async () => {
    if (!nom.trim()) return
    await declarerEquipement(db, {
      nom, categorie,
      acheteLe: /^\d{4}-\d{2}$/.test(achat) ? achat : null,
      centimes: montant.trim() ? enCentimes(montant) : null,
    })
    onFini()
  })

  return (
    <div className="pile">
      <input className="champ" value={nom} onChange={(e) => setNom(e.target.value)}
             placeholder="Combinaison cuir" autoComplete="off" />
      <div className="puces">
        {CATEGORIES_EQUIPEMENT.map((c) => (
          <button key={c} className="puce" data-actif={categorie === c ? '1' : '0'}
                  onClick={() => setCategorie(c)}>{NOM_EQUIPEMENT[c].toUpperCase()}</button>
        ))}
      </div>
      <p className="note">{EXEMPLE_EQUIPEMENT[categorie]}</p>
      {/* UN MOIS, pas un jour. Personne ne se souvient de la date exacte où il a
          acheté ses gants — et exiger le jour transforme dix secondes de saisie
          en recherche de facture, donc en saisie qu'on ne fait pas. */}
      <div className="libelle">Acheté · le mois suffit</div>
      <input className="champ" type="month" value={achat} max={ceMois()}
             onChange={(e) => setAchat(e.target.value)} />
      <input className="champ" value={montant} onChange={(e) => setMontant(e.target.value)}
             placeholder="ce que ça a coûté, si tu l'as" inputMode="decimal" />
      <button className="bouton secondaire" disabled={!nom.trim() || occupe}
              onClick={() => void poser()}>
        {occupe ? 'enregistrement…' : 'Déclarer'}
      </button>
      <button className="lien" onClick={onFini}>Annuler</button>
    </div>
  )
}
