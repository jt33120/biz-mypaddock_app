import type { PowerSyncDatabase } from '@powersync/web'
import { NOM_CATEGORIE, type Categorie } from '../db/atelier'
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
  // Le sommaire n'a rien à charger : chiffres et descriptions vivent dans la
  // page du carnet ouverte. Garder les props rend son contrat stable dans le
  // Garage, sans payer trois requêtes pour trois raccourcis.
  void db
  void machineId
  return (
    <>
      <p className="libelle">atelier</p>
      <div className="atelier-raccourcis">
        {(Object.keys(NOM_CATEGORIE) as Categorie[]).map((c) => (
          <button key={c} type="button"
                  className={`bloc atelier atelier-raccourci ${c}`}
                  onClick={() => onOuvrir(c)}>
            <Icone nom={TRACE[c]} taille={24} className="icone-atelier" />
            <span className="libelle">{NOM_CATEGORIE[c]}</span>
          </button>
        ))}
      </div>
    </>
  )
}
