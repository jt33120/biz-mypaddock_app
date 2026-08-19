import { useCallback, useEffect, useRef, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  cestFait, consigner, coutAtelier, interventions, NOM_CATEGORIE, VIDE, viser,
  type Categorie, type Intervention,
} from '../db/atelier'
import { enCentimes, formaterEuros } from '../db/depot'
import { verserPhoto } from '../db/photos'

/**
 * L'ATELIER — épique 8.
 *
 * ⚠ TROIS LISTES, JAMAIS UNE. FR-46 est une clause de SÉCURITÉ, pas de
 * rangement : si « plaquettes en fin de vie » s'affiche à côté de « sticker
 * décollé », l'élément de sécurité hérite du caractère repoussable du
 * cosmétique. Le composant ne rend donc QU'UNE catégorie à la fois, et rien
 * dans ce fichier ne sait en assembler deux.
 *
 * Et rien ici ne relance. Pas d'échéance, pas de compteur à rebours, pas de
 * pastille rouge : ce qui attend attend, c'est précisément son intérêt (FR-48).
 */

const aujourdhui = () => new Date().toISOString().slice(0, 10)

export function Atelier({ db, machineId, onEcrit }: {
  db: PowerSyncDatabase; machineId: string; onEcrit: () => void
}) {
  const [ouverte, setOuverte] = useState<Categorie | null>(null)
  return (
    <>
      <p className="libelle">atelier</p>
      {(Object.keys(NOM_CATEGORIE) as Categorie[]).map((c) => (
        <Bloc key={c} db={db} machineId={machineId} categorie={c}
              ouverte={ouverte === c} onOuvrir={() => setOuverte(ouverte === c ? null : c)}
              onEcrit={onEcrit} />
      ))}
    </>
  )
}

function Bloc({ db, machineId, categorie, ouverte, onOuvrir, onEcrit }: {
  db: PowerSyncDatabase; machineId: string; categorie: Categorie
  ouverte: boolean; onOuvrir: () => void; onEcrit: () => void
}) {
  const [liste, setListe] = useState<Intervention[]>([])
  const [cout, setCout] = useState(0)
  const [saisie, setSaisie] = useState(false)
  const fichier = useRef<HTMLInputElement>(null)

  const charger = useCallback(async () => {
    setListe(await interventions(db, machineId, categorie))
    setCout(await coutAtelier(db, machineId, categorie))
  }, [db, machineId, categorie])
  useEffect(() => { void charger() }, [charger])

  const attendent = liste.filter((i) => i.etat === 'visee')
  const faites = liste.filter((i) => i.etat === 'faite')

  /** FR-47 — une réparation non vitale se crée DEPUIS UNE PHOTO, au paddock,
   *  sans rien remplir d'autre. Le levier tordu se photographie là où le
   *  téléphone est déjà en main, et devient une ligne. */
  const parLaPhoto = async (f: File) => {
    const p = await verserPhoto(db, machineId, f)
    await viser(db, { machineId, categorie, libelle: 'À regarder', photoId: p.id })
    await charger(); onEcrit()
  }

  return (
    <div className={`bloc pile atelier ${categorie}`}>
      <button className="rang atelier-tete" onClick={onOuvrir}>
        <span className="libelle">{NOM_CATEGORIE[categorie]}</span>
        <span className="libelle faible">
          {/* Le tiret ne dit « rien ici » que lorsqu'il n'y a VRAIMENT rien.
              « 1 en attente · — » se lisait comme un manque là où il y avait
              déjà quelque chose. */}
          {attendent.length ? `${attendent.length} en attente` : ''}
          {attendent.length && faites.length ? ' · ' : ''}
          {faites.length ? `${faites.length} consigné${faites.length > 1 ? 's' : ''}` : ''}
          {!attendent.length && !faites.length ? '—' : ''}
          {cout ? ` · ${formaterEuros(cout)}` : ''}
        </span>
      </button>

      {ouverte && (
        <>
          {!liste.length && <p className="note">{VIDE[categorie]}</p>}

          {/* CE QUI ATTEND, en tête et sans aucune marque d'urgence. */}
          {attendent.map((i) => (
            <div className="rang ligne-atelier" key={i.id}>
              <span className="texte">{i.libelle}</span>
              <button className="lien" onClick={() => void cestFait(db, i.id, aujourdhui())
                .then(charger).then(onEcrit)}>c'est fait aujourd'hui</button>
            </div>
          ))}

          {faites.map((i) => (
            <div className="rang ligne-atelier" key={i.id}>
              <span className="texte">{i.libelle}</span>
              <span className="libelle faible">
                {i.date_jour}{i.cout_centimes ? ` · ${formaterEuros(i.cout_centimes)}` : ''}
              </span>
            </div>
          ))}

          {saisie
            ? <Saisir db={db} machineId={machineId} categorie={categorie}
                      onFini={() => { setSaisie(false); void charger().then(onEcrit) }} />
            : (
              <>
                <button className="lien" onClick={() => setSaisie(true)}>Consigner un geste</button>
                {categorie === 'reparation_non_vitale' && (
                  <>
                    <input ref={fichier} type="file" accept="image/*" hidden
                           onChange={(e) => { const f = e.target.files?.[0]; if (f) void parLaPhoto(f) }} />
                    <button className="lien" onClick={() => fichier.current?.click()}>
                      Le photographier, c'est tout
                    </button>
                  </>
                )}
              </>
            )}
        </>
      )}
    </div>
  )
}

/**
 * La saisie. DEUX CHAMPS, dont un seul obligatoire.
 *
 * FR-43 : « consigner le geste ne dépend jamais d'avoir consigné l'argent ».
 * Le montant est donc facultatif, et son absence ne produit ni zéro ni tiret —
 * elle produit une ligne sans montant, ce qui est la vérité.
 */
function Saisir({ db, machineId, categorie, onFini }: {
  db: PowerSyncDatabase; machineId: string; categorie: Categorie; onFini: () => void
}) {
  const [libelle, setLibelle] = useState('')
  const [montant, setMontant] = useState('')
  const centimes = montant.trim() ? enCentimes(montant) : null

  const poser = async (maintenant: boolean) => {
    const commun = { machineId, categorie, libelle, centimes }
    if (maintenant) await consigner(db, { ...commun, date: aujourdhui() })
    else await viser(db, commun)
    onFini()
  }

  return (
    <div className="pile">
      <input className="champ" value={libelle} onChange={(e) => setLibelle(e.target.value)}
             placeholder="Plaquettes avant" autoComplete="off" />
      <input className="champ" value={montant} onChange={(e) => setMontant(e.target.value)}
             placeholder="montant, si tu l'as" inputMode="decimal" />
      <button className="bouton" disabled={!libelle.trim()} onClick={() => void poser(true)}>
        C'est fait aujourd'hui
      </button>
      {/* FR-45 — la pièce achetée et non montée est un état de première classe,
          pas une ligne de dépense qu'on interprète. Elle a donc son propre
          bouton, au même niveau que le geste posé. */}
      <button className="bouton secondaire" disabled={!libelle.trim()} onClick={() => void poser(false)}>
        {categorie === 'reparation_non_vitale' ? 'Ça peut attendre' : "Acheté, pas encore monté"}
      </button>
      <button className="lien" onClick={onFini}>Annuler</button>
    </div>
  )
}
