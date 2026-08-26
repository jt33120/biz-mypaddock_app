import { useCallback, useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  cequiResteAFaire, memeTache, NOM_GENRE, POSTES_DE_BASE, poserLesPostesDeBase, type Tache,
} from '../db/preparation'
import { ajouter, cocher, lignes, retirer, type Ligne } from '../db/checklist'
import { useGeste } from './geste'

/**
 * AVANT D'Y ALLER — retour de Julian du 23 août :
 *
 *   « Je mets le prochain roulage où je vais aller et j'ai une liste de tâches
 *     à faire : checker huile, si accident réparer, payer etc. »
 *
 * ⚠ DEUX LISTES QUI NE SE MÉLANGENT PAS, et la distinction est visible à l'œil :
 *
 *   · CE QUI EST DÉRIVÉ ne se coche pas. Une pièce qui attend au garage
 *     disparaît quand on la monte, pas quand on coche une case — cocher
 *     donnerait le sentiment d'avoir fait le travail sans l'avoir fait, sur des
 *     lignes qui touchent une plaquette de frein. Chacune mène donc à l'endroit
 *     où elle se règle réellement.
 *   · CE QUE LE PILOTE AJOUTE se coche, parce que lui seul sait quand c'est
 *     fait — « prévenir Ludo », « passer chercher le bidon ».
 *
 * ⚠ AUCUN COMPTEUR DE PROGRESSION. Ni « 3 sur 7 », ni barre, ni pastille. FR-50
 * le dit pour la checklist de chargement et vaut ici mot pour mot : une liste
 * qui affiche sa progression devient une chose à finir, et une chose à finir se
 * bâcle. On énonce ce qui attend, on ne compte pas ce qui manque.
 *
 * ⚠ ET RIEN NE RELANCE. Pas d'échéance, pas de compteur à rebours, pas de rouge
 * quand la date approche. La liste est là quand le pilote ouvre ; elle ne va pas
 * le chercher (contre-mesure C1).
 */
export function Preparation({ db, roulage, onAller, ajoutPrimaire = false }: {
  db: PowerSyncDatabase
  roulage: { id: string; machineId: string | null; date: string }
  /** Chaque ligne dérivée MÈNE QUELQUE PART. Une liste de rappels dont les
   *  lignes ne mènent nulle part se lit une fois et ne se relit jamais. */
  onAller: (vers: Tache['vers']) => void
  /** ⚠ SUR L'ÉCRAN DE LA JOURNÉE, AJOUTER EST L'ACTION PREMIÈRE — récit 17.2.
   *  Sur l'accueil, non : la préparation y est un aperçu sous la zone
   *  temporelle, et un bouton primaire au milieu de l'accueil se disputerait la
   *  place avec « Saisir un roulage ». Un seul composant, deux poids — jamais
   *  deux composants, qui divergeraient à la première correction. */
  ajoutPrimaire?: boolean
}) {
  const [taches, setTaches] = useState<Tache[]>([])
  const [siennes, setSiennes] = useState<Ligne[]>([])
  const [saisie, setSaisie] = useState('')
  /** ⚠ « JE NE SAIS PAS ENCORE » N'EST PAS « IL N'Y A RIEN ». Les deux listes
   *  partent vides et se remplissent d'une requête : sans ce témoin, le premier
   *  rendu affirmait « Rien n'attend au garage, et l'engagement est saisi » —
   *  une phrase FAUSSE une fraction de seconde à chaque ouverture, sur un écran
   *  dont tout le propos est de n'énoncer que ce qu'il sait. Le second état se
   *  dit ; le premier ne se dit pas. */
  const [su, setSu] = useState(false)
  /** Récit 17.3 — cette moto suit-elle DÉJÀ quelque chose ? Zéro horloge n'est
   *  pas « rien à signaler », c'est « on ne compte rien », et les deux ne se
   *  disent pas pareil. */
  const [sansHorloge, setSansHorloge] = useState(false)
  /** Ce que le pilote vient de taper et qui existait déjà. On ne l'avale pas en
   *  silence : voir son texte disparaître sans un mot est le pire des deux. */
  const [doublon, setDoublon] = useState<string | null>(null)

  const charger = useCallback(async () => {
    setTaches(await cequiResteAFaire(db, roulage))
    const l = await lignes(db, roulage.id)
    setSiennes(l.filter((x) => x.categorie === 'preparation'))
    setSansHorloge(roulage.machineId
      ? !(await db.get<{ n: number }>(
          `SELECT count(*) AS n FROM horloge WHERE machine_id = ?`, [roulage.machineId])).n
      : false)
    setSu(true)
  }, [db, roulage])
  useEffect(() => { void charger() }, [charger])

  const [poser, occupe] = useGeste(async () => {
    const t = saisie.trim()
    if (!t) return
    /* ⚠ ON NE MONTRE PAS DEUX FOIS LA MÊME CHOSE, ET ON NE L'AVALE PAS NON PLUS
       — récit 17.4. Le filtre de rendu, seul, faisait disparaître la ligne que
       le pilote venait d'écrire : il tape « assurance », il valide, rien ne
       bouge, et il ne peut pas savoir pourquoi. Le refus se dit, il nomme la
       ligne qui est déjà là, et le texte reste dans le champ. */
    const deja = taches.find((x) => memeTache(x.libelle, t))
      ?? siennes.find((x) => memeTache(x.libelle, t))
    if (deja) { setDoublon(deja.libelle); return }
    setDoublon(null)
    await ajouter(db, roulage.id, t, 'preparation')
    setSaisie('')
    await charger()
  })

  const [semer, occupeSemer] = useGeste(async () => {
    if (!roulage.machineId) return
    await poserLesPostesDeBase(db, roulage.machineId)
    await charger()
  })

  // Une tâche ajoutée à la main qui répète une tâche dérivée n'apparaît qu'une
  // fois : voir deux fois « plaquettes » ferait douter des deux. Le refus à la
  // saisie couvre le cas ordinaire ; ceci couvre celui où la tâche dérivée
  // APPARAÎT APRÈS — l'assurance de la saison suivante, par exemple.
  const propres = siennes.filter((s) => !taches.some((t) => memeTache(t.libelle, s.libelle)))

  const socle = su && sansHorloge && roulage.machineId ? (
    /* ⚠ UNE OFFRE, JAMAIS UNE RELANCE — récit 17.3, décision de Julian du
       25 août. La phrase énonce un FAIT (« aucun poste n'est suivi ») et propose
       un geste. Elle ne dit pas qu'il manque quelque chose, elle ne compte pas,
       elle ne rougit pas, et elle disparaît d'elle-même dès qu'une horloge
       existe — y compris une seule, posée à la main au garage.

       Et elle dit ce que ça produit : des compteurs SANS ÉCHÉANCE. Poser ces
       postes n'inventera aucun intervalle ; seul le manuel de cette moto-là
       peut en donner un (FR-44). Promettre autre chose serait promettre un
       verdict sur une plaquette de frein. */
    <div className="pile socle-usure">
      <p className="sous-titre">
        Aucun poste d'entretien n'est suivi sur cette moto. Les {POSTES_DE_BASE.length} postes
        habituels peuvent être posés d'un geste : ils compteront tes roulages, sans aucune
        échéance tant que le barème de cette moto n'est pas connu.
      </p>
      <button className="bouton secondaire" disabled={occupeSemer} onClick={() => void semer()}>
        {occupeSemer ? 'en cours…' : 'Suivre les postes de cette moto'}
      </button>
    </div>
  ) : null

  /* ⚠ TANT QU'ON NE SAIT PAS, ON SE TAIT — et on ne se tait qu'ICI. Le bloc
     porte déjà son nom et son champ d'ajout : ajouter une chose à faire est vrai
     avant comme après la réponse. Ce qui est retiré est la seule ligne qui
     AFFIRME quelque chose sur le garage.
     `data-etat` n'est pas décoratif : c'est ce que `fumee-a-venir` attend pour
     savoir que la liste a répondu, au lieu d'attendre l'élément — un écran qui
     réaffirmerait trop tôt rendrait cette attente immédiate, donc muette, et
     ferait rougir le banc. */
  if (!su) {
    return (
      <div className="bloc pile preparation" data-etat="attente">
        <p className="libelle">Avant d'y aller</p>
        <Ajout valeur={saisie} sur={setSaisie} occupe={occupe} poser={poser}
               primaire={ajoutPrimaire} doublon={doublon} />
      </div>
    )
  }

  if (!taches.length && !propres.length) {
    return (
      <div className="bloc pile preparation" data-etat="su">
        <p className="libelle">Avant d'y aller</p>
        {/* Une liste vide est un ÉTAT JUSTE, pas un écran raté. Elle dit ce
            qu'elle sait — rien n'attend — et propose d'en ajouter, sans jamais
            suggérer qu'il manque quelque chose. */}
        <p className="sous-titre">Rien n'attend au garage, et tout est saisi.</p>
        {socle}
        <Ajout valeur={saisie} sur={setSaisie} occupe={occupe} poser={poser}
               primaire={ajoutPrimaire} doublon={doublon} />
      </div>
    )
  }

  return (
    <div className="bloc pile preparation" data-etat="su">
      <p className="libelle">Avant d'y aller</p>

      {taches.map((t, i) => (
        <button className="rang ligne-atelier tache" key={`d${i}`} onClick={() => onAller(t.vers)}>
          <span className="pile" style={{ gap: 0 }}>
            <span className="texte">{t.libelle}</span>
            {/* LE MOTIF EST DIT. Une tâche sans son motif est un ordre ; avec
                son motif, c'est un constat qu'on peut contester — et qu'on peut
                donc croire. */}
            <span className="sous-titre">{NOM_GENRE[t.genre]} · {t.motif}</span>
            {/* FR-40 — LA COMPLÉTUDE À CÔTÉ DU CHIFFRE, ET SANS EXCEPTION
                D'ÉCRAN. Elle vient du type, pas d'un ternaire : `Tache.complet`
                existe sur toutes les tâches et vaut `null` sur celles qui
                n'affichent aucun chiffre. */}
            {t.complet && <span className="note">{t.complet}</span>}
          </span>
          <span className="signe" aria-hidden>›</span>
        </button>
      ))}

      {propres.map((s) => (
        <label className="rang ligne-atelier" key={s.id}>
          <button className="coche" data-actif={s.cochee ? '1' : '0'}
                  onClick={() => void cocher(db, s.id, !s.cochee).then(charger)}>
            {s.libelle}
          </button>
          {/* R12 — le rouge, et la ligne qui part est NOMMÉE. Elle l'est pour
              l'œil par l'adjacence — le libellé est à deux centimètres — et pour
              le lecteur d'écran par le nom accessible, qui sans cela annonçait
              « retirer » huit fois de suite sans dire quoi. Pas de second temps
              ici : une ligne tapée à la main se retape en cinq secondes, et la
              confirmation garde ce qui ne se retape pas (systeme.css). */}
          <button className="lien destructif" style={{ minHeight: 40 }}
                  aria-label={`retirer « ${s.libelle} »`}
                  onClick={() => void retirer(db, s.id).then(charger)}>retirer</button>
        </label>
      ))}

      {socle}

      <Ajout valeur={saisie} sur={setSaisie} occupe={occupe} poser={poser}
             primaire={ajoutPrimaire} doublon={doublon} />
    </div>
  )
}

function Ajout({ valeur, sur, occupe, poser, primaire, doublon }: {
  valeur: string; sur: (v: string) => void; occupe: boolean; poser: () => void
  primaire: boolean
  /** Le libellé de la ligne qui existait déjà, ou `null`. Récit 17.4. */
  doublon: string | null
}) {
  /* ⚠ `min-width: 0` SUR LE CHAMP, sans quoi il déborde. Un `input` a une
     `min-width: auto` qui vaut sa largeur intrinsèque — environ 180 px — et il
     REFUSE de se réduire en dessous : il pousse alors le bouton hors du bloc, à
     droite, à moitié coupé. Vu sur la capture, invisible à la relecture. C'est
     le piège flexbox le plus courant et il ne se voit qu'à l'écran. */
  return (
    <>
      <div className={primaire ? 'rang ajout-tache primaire' : 'rang ajout-tache'}>
        <input className="champ" value={valeur} onChange={(e) => sur(e.target.value)}
               placeholder="autre chose à faire" autoComplete="off"
               onKeyDown={(e) => { if (e.key === 'Enter') poser() }} />
        <button className={primaire ? 'bouton' : 'bouton secondaire'}
                disabled={!valeur.trim() || occupe} onClick={poser}>
          {primaire ? 'Ajouter une chose à faire' : 'Ajouter'}
        </button>
      </div>
      {doublon && (
        /* Un CONSTAT, pas un reproche, et il nomme la ligne déjà là : sans le
           nom, « c'est déjà dans la liste » envoie chercher une ligne qu'on ne
           reconnaît pas, parce qu'elle ne porte pas les mots qu'on vient de
           taper. */
        <p className="note">« {doublon} » est déjà dans la liste.</p>
      )}
    </>
  )
}
