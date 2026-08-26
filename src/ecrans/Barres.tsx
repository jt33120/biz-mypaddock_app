import { formaterEuros } from '../db/depot'

/**
 * LE TRACÉ DE L'ARGENT — récit 19.4.
 *
 * « Des graphiques par poste et par mois. » — Julian, 25 août. Les huit postes
 * étaient déjà calculés (`parPoste`) et les mois aussi (`parMois`) : ils
 * n'existaient qu'en liste de texte, repliée derrière un tap.
 *
 * ═══ CE QU'IL A LE DROIT DE MONTRER, ET CE QU'IL N'A PAS LE DROIT DE FAIRE ══
 *
 * ⚠ ① CE N'EST PAS UNE JAUGE, ET LA DIFFÉRENCE TIENT DANS UNE SEULE LIGNE DE
 *   CODE : l'échelle est le PLUS GROS POSTE, jamais le plafond de la saison.
 *   Une barre mesurée contre un plafond est un compteur à rebours — elle dirait
 *   « il te reste » — et « dépasser son budget n'est pas une faute ». Mesurée
 *   contre le plus gros poste, elle dit une COMPOSITION : voilà en quoi ta
 *   saison est partie. Le portefeuille énonce, la jauge jugerait.
 *
 * ⚠ ② AUCUNE COULEUR NE DISTINGUE LES POSTES, et ce n'est pas un manque
 *   d'ambition. La palette du produit a quatre teintes utiles, et l'une d'elles
 *   — `--alerte` — ne sert QU'À CE QUI DÉTRUIT : « un rouge qui sert à deux
 *   choses ne sert plus à rien » (systeme.css). Colorier huit postes obligerait
 *   à l'emprunter, et un poste « Pneus » en rouge se lirait comme un
 *   avertissement sur un montant qui n'en est pas un. Toutes les barres portent
 *   donc la même teinte : c'est la LONGUEUR qui informe, et le mot et le montant
 *   sont à côté (UX-DR8 — la couleur n'est jamais seule à porter le sens, et ici
 *   elle ne porte rien du tout).
 *
 * ⚠ ③ RIEN NE SE COMPARE AU PRÉCÉDENT. Aucun mois n'est cher ni bon marché,
 *   aucun n'est coloré, aucun écart ne s'affiche, aucune droite ne se tire.
 *   « Les douze mois d'une saison de piste ne se ressemblent pas, et une droite
 *   tracée sur avril dit n'importe quoi de janvier » : c'est la règle du chrono
 *   (« aucune tendance, aucune projection, aucun à ce rythme »), et elle
 *   s'applique à l'argent telle quelle.
 *
 * ⚠ ④ AUCUNE BIBLIOTHÈQUE, ET AUCUN `<svg>` NON PLUS. Le jeu d'icônes tient
 *   maintenant tout le SVG du produit, et un essai unitaire refuse qu'un écran
 *   en pose un à lui — c'est ce qui empêche l'assemblage de se reconstituer
 *   icône par icône. Des barres sont des rectangles : deux `div` et une largeur
 *   en pourcentage les font, sans anti-aliasing, sans rayon, sans dégradé. Ce
 *   qui aurait justifié un SVG, c'est un tracé continu — et il n'y en a pas ici,
 *   parce qu'une ligne reliant deux mois inventerait des valeurs entre eux.
 *
 * ⚠ ET LES CLASSES S'APPELLENT `barre-argent`, PAS `barre`. `.barre` EXISTE
 *   DÉJÀ dans la feuille — c'est la barre de navigation du bas, en
 *   `position: fixed; left: 0; right: 0; bottom: 0` — et une seconde
 *   déclaration au premier niveau aurait plaqué chaque barre de ce tracé en bas
 *   de l'écran, par-dessus la navigation. C'est le DEUXIÈME défaut de ce genre
 *   en deux jours : `.vignette` était déclarée deux fois, et la seconde gagnait
 *   en silence (récit 18.2). Un essai unitaire refuse maintenant tout doublon
 *   de sélecteur de classe au premier niveau de la feuille.
 */
export type Barre = {
  /** Ce qui est nommé. Toujours présent : la barre ne se lit jamais seule. */
  nom: string
  centimes: number
  /** Ce dont c'était fait, en clair. Vide quand il n'y a rien à en dire. */
  detail?: string
  /** `true` pour ce que le produit ne sait pas ranger — « Sans poste », « Sans
   *  mois ». Il s'affiche en retrait, jamais absent : les ranger d'office
   *  ferait croire qu'un choix a été fait. */
  incertain?: boolean
}

export function Barres({ titre, barres, description }: {
  titre: string
  barres: readonly Barre[]
  /** Ce que le tracé montre, en une phrase. Elle n'est pas décorative : sans
   *  elle, un lecteur d'écran n'entend qu'une suite de montants. */
  description: string
}) {
  if (!barres.length) return null
  // ⚠ L'ÉCHELLE EST LE PLUS GROS DE CE QU'ON MONTRE. Jamais le plafond, jamais
  //   un total, jamais une cible : voir le ① du commentaire de tête.
  const sommet = Math.max(...barres.map((b) => b.centimes), 1)

  return (
    <div className="pile trace-argent">
      <span className="sous-titre">{titre}</span>
      <p className="note">{description}</p>
      {barres.map((b) => (
        <div className="pile barre-argent-ligne" key={b.nom}>
          <div className="rang">
            <span className={b.incertain ? 'texte faible' : 'texte'}>{b.nom}</span>
            <span className={b.incertain ? 'chiffre hud-16 faible' : 'chiffre hud-16'}>
              {formaterEuros(b.centimes)}
            </span>
          </div>
          {/* La barre est DÉCORATIVE pour un lecteur d'écran : le nom et le
              montant juste au-dessus disent déjà tout ce qu'elle dit, et
              l'annoncer une seconde fois ferait entendre un pourcentage que
              personne n'a calculé. */}
          <div className="barre-argent-fond" aria-hidden>
            <div className="barre-argent" data-incertain={b.incertain ? '1' : '0'}
                 style={{ width: `${Math.max(2, Math.round((b.centimes / sommet) * 100))}%` }} />
          </div>
          {b.detail && <span className="sous-titre">{b.detail}</span>}
        </div>
      ))}
    </div>
  )
}
