import { useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import { formaterEuros } from '../db/depot'
import {
  COUT_PORTRAIT_CENTIMES, fabriqueOuverte, PORTRAITS_INCLUS, portraitsFaits,
} from '../pixel/portrait'
import { Attente } from './Attente'

/**
 * REFAIRE UN PORTRAIT PIXEL — le seul bouton du produit qui dépense de l'argent.
 *
 * ⚠ IL DEMANDE PARCE QU'IL COÛTE, pas parce qu'il détruit. La distinction porte
 * la mise en forme : rien ici n'est rouge, le rouge du produit ne dit qu'une
 * chose et c'est « ceci part et ne revient pas ». Un portrait refait ne détruit
 * rien — l'ancien tient la scène tant que le nouveau n'est pas gardé.
 *
 * ⚠ ET C'EST L'ENDROIT QUI EXIGEAIT LA CONFIRMATION. Tant que la fabrication
 * vivait sous la scène et sous les trois chiffres, il fallait aller la chercher.
 * Posée en tête d'écran à côté de « Modifier la moto », elle se tape par erreur
 * — et un tap par erreur devient ici 0,16 € et un crédit consommé. Les crédits
 * Gemini ont déjà été vidés une fois par des appels que personne n'avait voulus.
 *
 * ⚠ CE QU'ELLE ANNONCE EST VRAI OU N'EST PAS DIT. Elle ne promet pas « il te
 * reste N crédits » : `pilote.quota_sprites` peut avoir été relevé pour un
 * compte (A-BRANCHER §7) et l'application ne le voit pas descendre. Elle énonce
 * les faits qu'elle sait : ce que coûte un appel, et combien de portraits ce
 * compte a déjà fabriqués.
 *
 * ⚠ ET ELLE REGARDE S'IL Y A UN COMPTE AVANT DE PARLER D'UN COMPTE. Elle disait
 * « ce compte en a 3 inclus, dont aucun n'a encore servi » alors qu'il n'y avait
 * AUCUN compte — et le geste suivant répondait « le portrait demande un compte ».
 * Deux phrases contradictoires dans le même geste, sur le seul bouton qui
 * dépense. Le produit est local-first : ne pas avoir de compte est l'ÉTAT PAR
 * DÉFAUT, donc c'était la phrase que lisait la majorité des pilotes.
 *
 * Sans compte, l'annonce dit D'ABORD ce qui bloque et n'annonce AUCUN inclus —
 * un crédit promis à qui ne peut pas s'en servir est une promesse à laquelle on
 * ne revient pas. Le bouton de lancement reste offert, lui, parce que son refus
 * est ÉNONCÉ et qu'il dit où aller : c'est un chemin qui mène quelque part,
 * contrairement à celui d'une photo absente du téléphone (Garage.tsx).
 *
 * La condition est celle de la fabrique elle-même (`fabriqueOuverte`), pas une
 * relecture parallèle : deux lectures du même fait finissent toujours par se
 * contredire, et c'est exactement ce qui vient d'arriver ici.
 *
 * Le même dispositif sert la moto et l'équipement : « la combinaison c'est comme
 * un skin, et le casque aussi » — même fabrique, même compteur, même plafond,
 * donc même annonce. Deux textes séparés auraient divergé, et c'est celui qu'on
 * relit le moins qui se serait mis à mentir.
 */
export function Refaire({ db, aUnPortrait, enCours, onFabriquer }: {
  db: PowerSyncDatabase
  /** Seul le MOT change selon qu'un portrait existe déjà. Le coût, lui, est le
   *  même dans les deux cas — et c'est le coût qui commande la confirmation. */
  aUnPortrait: boolean
  enCours: boolean
  onFabriquer: () => void
}) {
  const [ouvert, setOuvert] = useState(false)
  const [faits, setFaits] = useState<number | null>(null)
  /** `null` = pas encore su. Aucune phrase sur le compte ne se compose avant :
   *  annoncer puis se dédire est le défaut qu'on répare ici. */
  const [ouverte, setOuverte] = useState<boolean | null>(null)

  // Le compte se relit À L'OUVERTURE et non au montage : entre deux ouvertures
  // du panneau, une génération a pu partir depuis l'équipement — le compteur est
  // celui du PILOTE, pas celui de l'objet.
  //
  // ⚠ ET LES DEUX LECTURES ONT UN `.catch`. `portraitsFaits` n'en avait pas :
  // une requête en échec sur une base pas encore ouverte partait en rejet non
  // capturé — une erreur de console dans un panneau qui, lui, s'affichait
  // normalement. Un échec ici ne doit rien casser : le compte reste inconnu, et
  // la phrase se contente alors de ce qu'elle sait.
  useEffect(() => {
    if (!ouvert) return
    let vivant = true
    void portraitsFaits(db)
      .then((n) => { if (vivant) setFaits(n) })
      .catch(() => { if (vivant) setFaits(null) })
    void fabriqueOuverte()
      .then((o) => { if (vivant) setOuverte(o) })
      .catch(() => { if (vivant) setOuverte(false) })
    return () => { vivant = false }
  }, [db, ouvert])

  const mot = aUnPortrait ? 'Refaire le portrait pixel' : 'En faire un portrait pixel'
  const prix = formaterEuros(COUT_PORTRAIT_CENTIMES)

  /**
   * CE QUE CE COMPTE A DÉJÀ FABRIQUÉ — et pas un mot de plus.
   *
   * ⚠ LA PHRASE SE CONTREDISAIT QUAND LE QUOTA AVAIT ÉTÉ RELEVÉ : « ce compte
   * en a 3 inclus, dont 5 ont déjà servi » se lit comme un décompte cassé, et
   * c'est pourtant un état parfaitement normal (A-BRANCHER §7 : le quota se
   * relève en base, sans redéploiement). Au-delà du nombre inclus, l'écran
   * cesse donc de raisonner sur un plafond qu'il ne connaît plus, et rend la
   * parole à qui la détient.
   */
  const inclus = (n: number | null): string => {
    if (n == null) return `Ce compte en a ${PORTRAITS_INCLUS} inclus.`
    if (n === 0) return `Ce compte en a ${PORTRAITS_INCLUS} inclus, dont aucun n'a encore servi.`
    if (n < PORTRAITS_INCLUS)
      return `Ce compte en a ${PORTRAITS_INCLUS} inclus, dont ${n} ${n > 1 ? 'ont' : 'a'} déjà servi.`
    return `Ce compte en a déjà fabriqué ${n}. Le nombre inclus par défaut est de `
      + `${PORTRAITS_INCLUS}, et c'est le serveur qui dit ce qu'il reste.`
  }

  /* Trois états, et le premier est le plus lu. `ouverte === null` — la réponse
     n'est pas revenue — ne dit RIEN du compte : ni qu'il en faut un, ni qu'il
     en existe un. Une phrase qui change d'avis sous les yeux vaut moins qu'une
     phrase courte. */
  const annonce = ouverte === false
    ? `Le portrait se fabrique sur le serveur, donc il demande un compte : sans lui, `
      + `rien ne part et rien n'est prélevé. L'appel coûterait environ ${prix}.`
    : ouverte === null
      ? `Le portrait se fabrique sur le serveur, et cet appel coûte environ ${prix}.`
      : `Le portrait se fabrique sur le serveur, et cet appel coûte environ ${prix}. `
        + inclus(faits)

  if (!ouvert) {
    return (
      /* ⚠ LE TÉMOIN REMPLACE LE MOT, IL NE S'Y AJOUTE PAS — 3 septembre 2026.
         « fabrication… » était juste et immobile : sur un appel de dix secondes,
         rien ne distinguait « ça travaille » de « ça a planté », et on retape.
         Retaper un geste qui coûte 0,16 € n'est pas un détail. */
      <button className="lien" disabled={enCours} onClick={() => setOuvert(true)}>
        {enCours ? <Attente mot="fabrication" /> : mot}
      </button>
    )
  }

  return (
    <div className="bloc pile">
      <div className="libelle">ce que ça consomme</div>
      {/* Aucune phrase ne commence par un chiffre, et le compte de ce qui a
          déjà servi n'apparaît qu'une fois connu : « 0 fabriqué » pendant que
          la requête revient serait un chiffre faux, le même défaut que les
          trois cases du garage avaient déjà payé. */}
      <p className="texte">{annonce}</p>
      {/* Le quatrième critère du récit, et il vaut d'être écrit à l'écran : sans
          cette phrase, « refaire » se lit comme « remplacer maintenant », et on
          n'ose pas. */}
      <p className="note">
        {aUnPortrait
          ? 'Le portrait actuel garde sa place. Il ne bouge que si tu gardes le nouveau.'
          : 'La photo garde sa place. Rien ne change tant que le portrait n\'est pas gardé.'}
      </p>
      <button className="bouton" disabled={enCours}
              onClick={() => { setOuvert(false); onFabriquer() }}>
        {enCours ? <Attente mot="fabrication" /> : 'Lancer la fabrication'}
      </button>
      <button className="lien" onClick={() => setOuvert(false)}>Ne rien lancer</button>
    </div>
  )
}
