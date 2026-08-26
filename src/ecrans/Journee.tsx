import type { PowerSyncDatabase } from '@powersync/web'
import { Preparation } from './Preparation'
import { Checklist } from './Checklist'
import { direAVenir, direLeJour, ecartJours } from '../db/accueil'
import { aujourdhui } from '../db/vecu'
import type { Tache } from '../db/preparation'

/**
 * LA JOURNÉE QUI N'A PAS ENCORE EU LIEU — récit 17.2.
 *
 * ⚠ CE N'EST PAS UNE FONCTIONNALITÉ NEUVE, C'EST UN CHEMIN QUI CESSE DE MENTIR.
 *
 * Tout ce que cet écran rend existait déjà. Ce qui n'existait pas, c'était le
 * moyen d'y arriver : le tap sur « Prochain roulage » ouvrait le BILAN, et le
 * bilan d'une journée qui n'a pas eu lieu affiche « Meilleur tour du jour — »,
 * « Sessions 0 », le bloc des chutes, et propose « Saisir une session » en
 * bouton primaire pleine largeur. L'application demandait le chrono et la chute
 * d'une journée où le pilote n'était pas encore allé.
 *
 * ⚠ DEUX LISTES, ET ELLES NE SE MÉLANGENT PAS. C'est la seule règle de mise en
 * page qui compte ici, et elle est déjà dans le code (`CHARGEMENT`,
 * src/db/checklist.ts) :
 *
 *   · « AVANT D'Y ALLER » — ce qu'on FAIT avant. Dérivé de ce que le pilote a
 *     saisi, non cochable, chaque ligne mène là où elle se règle vraiment.
 *   · « CHARGEMENT » — ce qu'on EMPORTE. Composé une fois, cochable, il reste
 *     attaché à la journée comme trace.
 *
 * Elles vivaient sur deux écrans — la préparation sur l'accueil, le chargement
 * derrière un tap dans le bilan. Elles sont réunies ICI, sur la journée, parce
 * que c'est là qu'on les cherche le jeudi soir. Réunies, pas fusionnées : on
 * peut avoir tout chargé et n'avoir pas payé.
 *
 * ⚠ ET RIEN N'EST FERMÉ. « Saisir une session » est là, en lien discret : si le
 * pilote roule le jour même et veut entrer son chrono, le chemin existe. On
 * change ce qui est PROPOSÉ EN PREMIER, on ne condamne aucune porte — et à la
 * première session saisie, cet écran s'efface de lui-même au profit du bilan
 * (`sePrepare`, src/db/vecu.ts).
 *
 * ⚠ CETTE PROMESSE ÉTAIT TENUE POUR LE CHRONO SEUL, ET FAUSSE POUR SIX AUTRES
 * PORTES — la revue de l'épique 17 l'a relevé, et c'est le défaut le plus cher
 * de l'écran. Sur une journée datée du JOUR MÊME, `sePrepare` est vrai : c'est
 * cet écran-ci que le pilote ouvre au paddock, et il venait de perdre en
 * silence les photos, « Déclarer un geste », « J'ai chuté ce jour-là », ce que
 * la journée a coûté, « Ajouter une dépense », le récapitulatif et
 * l'interrupteur de visibilité. Ce sont EXACTEMENT les gestes du jour même : on
 * photographie, on chute, on paie le jour où l'on y est.
 *
 * Elles sont donc toutes ici, EN SECOND RANG — après ce qui prépare, jamais
 * avant : ce qui est proposé en premier reste « Avant d'y aller » et le
 * chargement. Et elles arrivent par INJECTION plutôt que par montage : ce sont
 * les nœuds mêmes du bilan, composés une seule fois dans src/App.tsx. Un second
 * `<Photos>` écrit ici aurait divergé du premier à la première correction —
 * c'est la même règle que la checklist, qui se DÉPLACE et ne se duplique pas.
 *
 * ⚠ AUCUN COMPTEUR, AUCUNE CERTIFICATION. Ni « 4 sur 7 », ni pourcentage, ni
 * barre qui se remplit, ni « prêt ». Et rien ne dit combien de jours il
 * « reste » pour préparer : « dans 23 jours » est un fait, « il te reste
 * 23 jours » est une échéance déguisée.
 */
export function Journee({
  db, r, photos, chutes, cout, visibilite, onAller, onSession, onCircuit, onAccueil, onRecap,
}: {
  db: PowerSyncDatabase
  r: { id: string; circuit: string; date: string; machine_id: string | null }
  /** LES QUATRE BLOCS DU BILAN QUI VALENT AUSSI LE JOUR MÊME. Ce sont les mêmes
   *  nœuds que ceux du bilan, composés dans src/App.tsx et passés aux deux
   *  écrans : deux compositions séparées auraient divergé. */
  photos: React.ReactNode
  chutes: React.ReactNode
  cout: React.ReactNode
  visibilite: React.ReactNode
  /** Chaque ligne dérivée MÈNE QUELQUE PART — c'est la même promesse que sur
   *  l'accueil, et elle est portée par le même composant. */
  onAller: (vers: Tache['vers']) => void
  onSession: () => void
  onCircuit: () => void
  onAccueil: () => void
  onRecap: () => void
}) {
  const jours = ecartJours(aujourdhui(), r.date)

  return (
    <section className="garage journee-page">
      <header className="garage-tete">
        <button className="lien" onClick={onAccueil}>← accueil</button>
        {/* « dans 12 jours », « demain », « aujourd'hui » — un fait, jamais un
            décompte. `direAVenir` porte déjà la clause FR-13 et ses interdits :
            pas d'impératif, pas d'exclamation, aucun mot de rareté. */}
        <p className="libelle">{direAVenir(jours)}</p>
      </header>

      <div className="garage-titre">
        <p className="marque">tu y vas</p>
        <h1 className="modele">{r.circuit}</h1>
        <p className="sous-titre">{direLeJour(r.date)}</p>
      </div>

      <button className="lien" onClick={onCircuit}>Ce que tu sais de ce circuit</button>

      {/* ① CE QU'ON FAIT AVANT. Dérivée, non cochable, et son champ d'ajout est
          l'action première de l'écran : ce que le pilote sait, lui, et que le
          produit ne peut pas dériver — « prévenir Ludo », « passer chercher le
          bidon ». */}
      <Preparation db={db} ajoutPrimaire
                   roulage={{ id: r.id, machineId: r.machine_id, date: r.date }}
                   onAller={onAller} />

      {/* ② CE QU'ON EMPORTE. Le composant se DÉPLACE, il ne se duplique pas :
          c'est celui du bilan, monté ici. Une seconde checklist écrite à part
          aurait pris du retard sur la première dès la semaine suivante. */}
      <Checklist db={db} roulageId={r.id} jour={r.date} />

      {/* ─── ③ LE SECOND RANG — LES GESTES DU JOUR MÊME ───────────────────
          Le pilote est au paddock : il photographie, il déclare un geste, il
          chute, il paie. Aucun de ces gestes n'appartient au bilan plutôt qu'à
          la préparation — ils appartiennent à la JOURNÉE, et l'écran qui la
          porte doit les porter tous. Ils sont en second rang, pas en premier :
          ce qu'on propose d'abord reste ce qui prépare. */}
      {photos}

      {chutes}

      {cout}

      {/* Le récapitulatif se compose de ce qui existe : sur une journée sans
          chrono il montre ses photos et ses gestes, et c'est un état juste. Il
          n'a pas à disparaître parce que la journée n'a pas de meilleur tour. */}
      <button className="bouton secondaire" onClick={onRecap}>Voir le récapitulatif</button>

      {/* FR-19 — l'interrupteur du cercle, roulage par roulage. Il se règle le
          jour même aussi bien que le soir : le retirer d'ici obligeait à
          attendre la première session pour pouvoir décider. */}
      {visibilite}

      {/* ⚠ IL EST DISCRET, ET C'EST TOUTE LA DÉCISION. En bouton primaire
          pleine largeur, il redemanderait le chrono d'une journée qui n'a pas
          eu lieu — c'est exactement le défaut qu'on retire. En lien, il reste
          atteignable pour le pilote qui rentre du circuit le soir même. */}
      <button className="lien" onClick={onSession}>Saisir une session</button>
    </section>
  )
}
