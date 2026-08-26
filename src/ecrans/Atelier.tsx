import { useCallback, useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  coutAtelier, interventions, NOM_CATEGORIE, SOUS_TITRE,
  type Categorie, type Intervention,
} from '../db/atelier'
import { formaterEuros } from '../db/depot'
import { Icone, type Nom } from './Icones'

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
 *
 * ⚠ ET CHAQUE ENTRÉE PORTE SON TRACÉ — récit 20.3, retour de Julian du 25 août :
 * « une clé à molette pour la maintenance, une courbe ou une cartographie moteur
 * pour les améliorations ». C'étaient trois boutons de texte qu'il fallait LIRE
 * pour distinguer.
 *
 * ⚠ MAIS LE MUR DE FR-46 NE BOUGE PAS D'UN MILLIMÈTRE, et c'est la seule chose
 * qui compte ici. L'icône est un REPÈRE, pas un regroupement : les trois listes
 * restent trois listes, aucun écran n'en assemble deux, et la clé ne couvre que
 * l'entretien. Si « plaquettes en fin de vie » s'affichait un jour à côté de
 * « sticker décollé », l'élément de sécurité hériterait du caractère
 * repoussable du cosmétique — et une icône commune serait la première marche.
 *
 * ⚠ ET LA COULEUR N'EST JAMAIS SEULE À PORTER LE SENS — UX-DR8. Le liseré de
 * 3 px existait déjà ; le tracé et le mot restent tous les deux à côté de lui.
 * Un pilote qui ne distingue pas le liseré lit le mot, et voit la forme.
 */
/** Le tracé de chaque catégorie. Il est DÉRIVÉ des catégories elles-mêmes —
 *  `Record<Categorie, Nom>` — donc une quatrième catégorie ne compile pas tant
 *  qu'on ne lui a pas choisi de forme. Une table écrite à la main à côté prend
 *  du retard à la première addition, et se tait en le prenant. */
const TRACE: Record<Categorie, Nom> = {
  entretien: 'cle',
  amelioration: 'courbe',
  reparation_non_vitale: 'caisse',
}

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
      {/* Le tracé D'ABORD, puis le mot. L'un se reconnaît de loin, l'autre
          fait foi : `aria-hidden` sur l'icône, parce que le libellé qui suit dit
          déjà la même chose et qu'un lecteur d'écran l'annoncerait deux fois. */}
      <Icone nom={TRACE[categorie]} taille={22} className="icone-atelier" />
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
