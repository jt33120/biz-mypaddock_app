import { useCallback, useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  coutAtelier, interventions, NOM_CATEGORIE, SOUS_TITRE,
  type Categorie, type Intervention,
} from '../db/atelier'
import { formaterEuros } from '../db/depot'

/**
 * L'ATELIER — épique 8, devenu un SOMMAIRE.
 *
 * ⚠ TROIS LISTES, JAMAIS UNE. FR-46 est une clause de SÉCURITÉ, pas de
 * rangement : si « plaquettes en fin de vie » s'affiche à côté de « sticker
 * décollé », l'élément de sécurité hérite du caractère repoussable du
 * cosmétique. Rien dans ce fichier ne sait assembler deux catégories.
 *
 * ⚠ CHAQUE POSTE OUVRE UNE PAGE, il ne se déplie plus — retour de Julian :
 * « je verrais plutôt un bouton vers une page à part entière car il y a beaucoup
 * de choses ». Un accordéon tient trois lignes ; il ne tient pas un carnet avec
 * ses factures, ses horloges et son manuel.
 *
 * Et FR-46 y GAGNE plutôt qu'il n'y perd : une page ne rend qu'une catégorie, là
 * où un accordéon pouvait s'ouvrir deux fois sur la même hauteur d'écran.
 *
 * Rien ici ne relance. Pas d'échéance, pas de compteur à rebours, pas de
 * pastille rouge : ce qui attend attend, c'est précisément son intérêt (FR-48).
 */
export function Atelier({ db, machineId, onOuvrir }: {
  db: PowerSyncDatabase; machineId: string; onOuvrir: (c: Categorie) => void
}) {
  return (
    <>
      <p className="libelle">atelier</p>
      {(Object.keys(NOM_CATEGORIE) as Categorie[]).map((c) => (
        <Apercu key={c} db={db} machineId={machineId} categorie={c}
                onOuvrir={() => onOuvrir(c)} />
      ))}
    </>
  )
}

function Apercu({ db, machineId, categorie, onOuvrir }: {
  db: PowerSyncDatabase; machineId: string; categorie: Categorie; onOuvrir: () => void
}) {
  const [liste, setListe] = useState<Intervention[]>([])
  const [cout, setCout] = useState(0)

  const charger = useCallback(async () => {
    setListe(await interventions(db, machineId, categorie))
    setCout(await coutAtelier(db, machineId, categorie))
  }, [db, machineId, categorie])
  useEffect(() => { void charger() }, [charger])

  const attendent = liste.filter((i) => i.etat === 'visee').length
  const faites = liste.filter((i) => i.etat === 'faite').length

  return (
    <button className={`bloc rang atelier atelier-tete ${categorie}`} onClick={onOuvrir}>
      {/* ⚠ CHAQUE CATÉGORIE PORTE SA DÉFINITION. « Je n'ai pas compris, pas
          clair ce que fait ce bouton » — et le défaut n'était pas le mot mais
          l'absence de définition : trois titres nus obligent à deviner, et ce
          qu'on devine mal on le range mal. FR-46 n'est une clause de sécurité
          que si le rangement est évident au premier coup d'œil. */}
      <span className="pile" style={{ gap: 1 }}>
        <span className="libelle">{NOM_CATEGORIE[categorie]}</span>
        <span className="sous-titre">{SOUS_TITRE[categorie]}</span>
      </span>
      <span className="libelle faible">
        {/* Le tiret ne dit « rien ici » que lorsqu'il n'y a VRAIMENT rien.
            « 1 en attente · — » se lisait comme un manque là où il y avait
            déjà quelque chose. */}
        {attendent ? `${attendent} en attente` : ''}
        {attendent && faites ? ' · ' : ''}
        {faites ? `${faites} consigné${faites > 1 ? 's' : ''}` : ''}
        {!attendent && !faites ? '—' : ''}
        {cout ? ` · ${formaterEuros(cout)}` : ''}
      </span>
    </button>
  )
}
