import { useEffect, useState } from 'react'
import { CREDITS_PORTRAIT, lireSolde, soldeConnu, type Solde } from '../db/credits'
import { fabriqueOuverte } from '../pixel/portrait'
import { Attente } from './Attente'

/**
 * REFAIRE UN PORTRAIT PIXEL — le seul bouton du produit qui dépense.
 *
 * ⚠ IL DEMANDE PARCE QU'IL COÛTE, pas parce qu'il détruit. La distinction porte
 * la mise en forme : rien ici n'est rouge, le rouge du produit ne dit qu'une
 * chose et c'est « ceci part et ne revient pas ». Un portrait refait ne détruit
 * rien — l'ancien tient la scène tant que le nouveau n'est pas gardé.
 *
 * ⚠ ET C'EST L'ENDROIT QUI EXIGEAIT LA CONFIRMATION. Tant que la fabrication
 * vivait sous la scène et sous les trois chiffres, il fallait aller la chercher.
 * Posée en tête d'écran à côté de « Modifier la moto », elle se tape par erreur
 * — et un tap par erreur devient ici un crédit consommé. Les crédits Gemini ont
 * déjà été vidés une fois par des appels que personne n'avait voulus.
 *
 * ═══ CE PANNEAU DISAIT « ENVIRON 0,16 € », ET IL NE LE DIT PLUS ═══════════
 *
 * « Ne pas marquer 16 cts, faire un système de crédit » — Julian, 3 septembre
 * 2026, capture à l'appui.
 *
 * Le centime n'a pas disparu du produit : `generation.cout_centimes` enregistre
 * toujours le coût réel, acte par acte, et c'est la seule base honnête pour
 * fixer un prix de vente le jour venu (A-FAIRE §6 ③). Ce qui a disparu, c'est
 * l'idée que ce nombre AIDE À DÉCIDER. « Environ 0,16 € » demandait au pilote de
 * convertir un prix d'achat en jugement, sans lui dire ni ce qui lui reste, ni
 * ce que ça lui coûte à LUI. « Il te reste 3 crédits » est une information dont
 * on peut faire quelque chose.
 *
 * ⚠ ET LE SOLDE VIENT DU SERVEUR, PLUS D'UN CALCUL LOCAL. Ce panneau comptait
 * les lignes descendues et les soustrayait d'une constante compilée — d'où trois
 * phrases pour rattraper les cas où le compte ne tombait pas juste (quota relevé
 * en base, lecture pas encore revenue, dépassement). `mon_solde()` répond le
 * chiffre, une bonne fois : il n'y a plus de cas à rattraper, donc plus de
 * phrases qui se contredisent.
 *
 * ⚠ ET ELLE REGARDE S'IL Y A UN COMPTE AVANT DE PARLER D'UN COMPTE. Elle disait
 * « ce compte en a 3 inclus » alors qu'il n'y avait AUCUN compte — et le geste
 * suivant répondait « le portrait demande un compte ». Deux phrases
 * contradictoires dans le même geste, sur le seul bouton qui dépense. Le produit
 * est local-first : ne pas avoir de compte est l'ÉTAT PAR DÉFAUT, donc c'était
 * la phrase que lisait la majorité des pilotes.
 *
 * La condition est celle de la fabrique elle-même (`fabriqueOuverte`), pas une
 * relecture parallèle : deux lectures du même fait finissent toujours par se
 * contredire, et c'est exactement ce qui était arrivé ici.
 *
 * Le même dispositif sert la moto et l'équipement : « la combinaison c'est comme
 * un skin, et le casque aussi » — même fabrique, même compteur, même plafond,
 * donc même annonce. Deux textes séparés auraient divergé, et c'est celui qu'on
 * relit le moins qui se serait mis à mentir.
 */
export function Refaire({ aUnPortrait, enCours, onFabriquer }: {
  /* ⚠ IL N'Y A PLUS DE `db` ICI, et c'est le signe le plus net de ce qui a
     changé. Ce panneau lisait la base LOCALE pour composer son annonce — il
     comptait les lignes de `generation` descendues et les soustrayait d'une
     constante compilée. Le solde vient maintenant du serveur, qui est le seul à
     le connaître : il n'y a plus rien à lire en local, donc plus rien à passer.
     Garder le paramètre « au cas où » aurait laissé croire que le panneau
     dépend encore de la base, et c'est la première chose qu'on relit. */
  /** Seul le MOT change selon qu'un portrait existe déjà. Le coût, lui, est le
   *  même dans les deux cas — et c'est le coût qui commande la confirmation. */
  aUnPortrait: boolean
  enCours: boolean
  onFabriquer: () => void
}) {
  const [ouvert, setOuvert] = useState(false)
  const [solde, setSolde] = useState<Solde | null>(() => soldeConnu())
  /** `null` = pas encore su. Aucune phrase sur le compte ne se compose avant :
   *  annoncer puis se dédire est le défaut qu'on répare ici. */
  const [ouverte, setOuverte] = useState<boolean | null>(null)

  // Le solde se relit À L'OUVERTURE et non au montage : entre deux ouvertures du
  // panneau, une génération a pu partir depuis l'équipement — le compteur est
  // celui du PILOTE, pas celui de l'objet.
  //
  // ⚠ ET LES DEUX LECTURES ONT UN `.catch`. Un échec ici ne doit rien casser :
  // le solde reste celui qu'on connaissait, et la phrase se contente de ce
  // qu'elle sait.
  useEffect(() => {
    if (!ouvert) return
    let vivant = true
    void lireSolde().then((s) => { if (vivant && s) setSolde(s) }).catch(() => {})
    void fabriqueOuverte()
      .then((o) => { if (vivant) setOuverte(o) })
      .catch(() => { if (vivant) setOuverte(false) })
    return () => { vivant = false }
  }, [ouvert])

  const mot = aUnPortrait ? 'Refaire le portrait pixel' : 'En faire un portrait pixel'
  const prix = CREDITS_PORTRAIT === 1 ? 'un crédit' : `${CREDITS_PORTRAIT} crédits`

  /**
   * CE QUE ÇA CONSOMME — et pas un mot de plus que ce qu'on sait.
   *
   * Quatre états, et le premier est le plus lu. `ouverte === null` — la réponse
   * n'est pas revenue — ne dit RIEN du compte : ni qu'il en faut un, ni qu'il en
   * existe un. Une phrase qui change d'avis sous les yeux vaut moins qu'une
   * phrase courte.
   */
  const annonce = ouverte === false
    ? 'Le portrait se fabrique sur le serveur, donc il demande un compte : sans lui, '
      + `rien ne part et rien n'est décompté. L'appel coûterait ${prix}.`
    : solde?.illimite
      // Le compte de test. Lui annoncer un prix serait faux : il ne paie rien.
      ? 'Le portrait se fabrique sur le serveur. Ce compte est illimité — '
        + "rien ne sera décompté, et il n'y a rien à surveiller."
      : ouverte === null || !solde
        ? `Le portrait se fabrique sur le serveur, et il coûte ${prix}.`
        : `Le portrait se fabrique sur le serveur, et il coûte ${prix}. `
          + (solde.reste >= CREDITS_PORTRAIT
            ? `Il t'en reste ${solde.reste}.`
            : `Il ne t'en reste ${solde.reste === 0 ? 'aucun' : solde.reste} : `
              + 'le serveur refusera, et rien ne sera décompté.')

  if (!ouvert) {
    return (
      /* ⚠ LE TÉMOIN REMPLACE LE MOT, IL NE S'Y AJOUTE PAS — 3 septembre 2026.
         « fabrication… » était juste et immobile : sur un appel de dix secondes,
         rien ne distinguait « ça travaille » de « ça a planté », et on retape.
         Retaper un geste qui consomme un crédit n'est pas un détail. */
      <button className="lien" disabled={enCours} onClick={() => setOuvert(true)}>
        {enCours ? <Attente mot="fabrication" /> : mot}
      </button>
    )
  }

  return (
    <div className="bloc pile">
      <div className="libelle">ce que ça consomme</div>
      {/* Aucune phrase ne commence par un chiffre, et le solde n'apparaît
          qu'une fois connu : « 0 crédit » pendant que la requête revient serait
          un chiffre faux, le même défaut que les trois cases du garage avaient
          déjà payé. */}
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
