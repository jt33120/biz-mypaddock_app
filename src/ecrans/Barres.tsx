import { formaterEuros } from '../db/depot'

/**
 * LE TRACÉ DE L'ARGENT — récit 19.4.
 *
 * « Des graphiques par poste et par mois. » — Julian, 25 août. Les huit postes
 * étaient déjà calculés (`parPoste`) et les mois aussi (`parMois`) : ils
 * n'existaient qu'en liste de texte, repliée derrière un tap.
 *
 * ⚠ ET IL NE TRACE PLUS SEULEMENT DE L'ARGENT — 1er septembre 2026. L'écran
 * d'analyse lui envoie aussi des DÉCOMPTES (des gestes d'atelier, des journées
 * vécues). Le nom du fichier et le mot « argent » de ses classes disent d'où il
 * vient, pas ce qu'il sait faire : voir `libelle` plus bas, qui est ce qui rend
 * les deux unités possibles sans qu'aucune ne se devine.
 *
 * ═══ CE QU'IL A LE DROIT DE MONTRER, ET CE QU'IL N'A PAS LE DROIT DE FAIRE ══
 *
 * ⚠ ① CE N'EST PAS UNE JAUGE, ET LA DIFFÉRENCE TIENT DANS UNE SEULE LIGNE DE
 *   CODE : l'échelle est LE PLUS GROS DE CE QU'ON MONTRE, jamais un maximum posé
 *   du dehors. Une barre mesurée contre un maximum est un compteur à rebours —
 *   elle dirait « il te reste » — et « dépasser son budget n'est pas une faute ».
 *   Mesurée contre la plus grosse part, elle dit une COMPOSITION : voilà en quoi
 *   ta saison est partie. Le portefeuille énonce, la jauge jugerait.
 *
 *   C'est pour ça que le type de ce fichier n'a que trois champs de données et
 *   qu'aucun appelant ne peut passer un sommet : rien dans le type ne
 *   distinguerait « le plus gros de l'autre moto » d'un maximum à ne pas
 *   dépasser, et le second EST la jauge. Le sommet se calcule DEDANS, ou il
 *   n'existe pas.
 *
 * ⚠ ② AUCUNE COULEUR NE DISTINGUE LES PARTS, et ce n'est pas un manque
 *   d'ambition. La palette du produit a quatre teintes utiles, et l'une d'elles
 *   — `--alerte` — ne sert QU'À CE QUI DÉTRUIT : « un rouge qui sert à deux
 *   choses ne sert plus à rien » (systeme.css). Colorier huit postes obligerait
 *   à l'emprunter, et un poste « Pneus » en rouge se lirait comme un
 *   avertissement sur un montant qui n'en est pas un. Toutes les barres portent
 *   donc la même teinte : c'est la LONGUEUR qui informe, et le mot et la valeur
 *   sont à côté (UX-DR8 — la couleur n'est jamais seule à porter le sens, et ici
 *   elle ne porte rien du tout). La SEULE variation est `incertain`, en teinte
 *   atténuée, pour ce que le produit ne sait pas ranger.
 *
 * ⚠ ③ RELIER N'EST PAS COMPARER, ET SEULE LA SECONDE RESTE INTERDITE.
 *   Ce paragraphe disait « rien ne se compare au précédent, aucune droite ne se
 *   tire », et il mettait les deux gestes dans le même sac. Ils n'y sont plus :
 *   depuis le 1er septembre 2026 (voir le ④), RELIER des paniers mensuels par des
 *   segments droits est permis — le tracé continu vit dans `Courbe.tsx`, pas ici.
 *
 *   Ce qui reste défendu, entier, c'est le JUGEMENT et l'EXTRAPOLATION :
 *     · aucun mois n'est cher ni bon marché, aucun n'est coloré, aucun écart ne
 *       s'affiche, aucun « + 40 % », aucun classement, aucun « le plus gros » ;
 *     · aucune DROITE DE TENDANCE, aucune projection, aucun « à ce rythme ».
 *       « Les douze mois d'une saison de piste ne se ressemblent pas, et une
 *       droite tracée sur avril dit n'importe quoi de janvier. »
 *
 *   La règle du chrono n'a d'ailleurs jamais interdit de relier : `Courbe.tsx`
 *   joint ses points par des segments droits depuis FR-20, et ce qu'elle refuse
 *   est le lissage et la tendance. C'est ce paragraphe-ci qui l'avait recopiée
 *   trop large.
 *
 * ⚠ ④ AUCUNE BIBLIOTHÈQUE, ET AUCUN `<svg>` NON PLUS — MAIS PLUS POUR LA RAISON
 *   QUI ÉTAIT ÉCRITE ICI. Le jeu d'icônes tient tout le SVG du produit, et un
 *   essai unitaire refuse qu'un écran en pose un à lui — c'est ce qui empêche
 *   l'assemblage de se reconstituer icône par icône.
 *
 *   Ce paragraphe ajoutait : « ce qui aurait justifié un SVG, c'est un tracé
 *   continu — et il n'y en a pas ici, parce qu'une ligne reliant deux mois
 *   inventerait des valeurs entre eux ». JULIAN A LEVÉ CE POINT LE 1er SEPTEMBRE
 *   2026, en décidant l'écran d'analyse : les lignes continues sont autorisées
 *   sur les mailles ROULAGE, MOIS et ANNÉE. Un segment droit entre deux paniers
 *   ne dit rien de plus que les deux paniers — il les ORDONNE. Relier invente
 *   moins que lisser.
 *
 *   CE QUI RESTE DEBOUT, ET QUI N'A PAS BOUGÉ D'UN MOT : aucun LISSAGE — une
 *   courbe passe par des valeurs que personne n'a mesurées, entre deux points
 *   réels — et aucune DROITE DE TENDANCE, qui n'invente pas entre les points mais
 *   AU-DELÀ. La levée porte sur RELIER, jamais sur PROLONGER.
 *
 *   Et ce fichier-ci n'a toujours aucun `<svg>`, pour une raison que la levée ne
 *   touche pas : une barre est un RECTANGLE, deux `div` et une largeur en
 *   pourcentage la font, sans anti-aliasing, sans rayon, sans dégradé. La ligne,
 *   elle, vit dans `src/ecrans/Courbe.tsx` — c'est là qu'est `Suite`, et c'est là
 *   qu'elle doit rester : le produit a DEUX fichiers qui ont le droit de poser un
 *   `<svg>`, pas trois.
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
  /** LA GRANDEUR QUI FAIT LA LONGUEUR, et rien d'autre. Elle porte le nom de
   *  l'unité d'origine de ce tracé, mais la longueur ne lit qu'un RAPPORT — elle
   *  n'a pas d'unité, et c'est `libelle` qui en a une. */
  centimes: number
  /** LA VALEUR DÉJÀ ÉCRITE PAR CELUI QUI CONNAÎT SON UNITÉ — « 3 gestes »,
   *  « 128,40 € ».
   *
   *  ⚠ SANS ELLE, CE TRACÉ ÉCRIT DES EUROS, ET C'EST UN DÉFAUT QUI A ÉTÉ VU
   *  AVANT D'ÊTRE LIVRÉ. Ce fichier est né du budget, où tout est en euros ; il
   *  formatait donc chaque valeur avec `formaterEuros`. L'écran d'analyse lui
   *  envoie aussi des décomptes — trois gestes d'atelier, deux journées — et
   *  trois interventions s'y affichaient « 0,03 € », avec l'aplomb d'un montant.
   *  Un tracé ne peut pas savoir si `3` est un décompte ou trois centimes : il
   *  devinerait, et il devinerait faux une fois sur deux. Il ne devine plus, il
   *  reçoit — exactement comme `Suite` (src/ecrans/Courbe.tsx), qui ne formate
   *  rien du tout.
   *
   *  Elle reste facultative pour l'appelant qui n'a que des euros, et le repli
   *  est alors explicite plus bas. */
  libelle?: string
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
   *  elle, un lecteur d'écran n'entend qu'une suite de valeurs. */
  description: string
}) {
  if (!barres.length) return null
  // ⚠ L'ÉCHELLE EST LE PLUS GROS DE CE QU'ON MONTRE. Jamais un maximum posé du
  //   dehors, jamais un total, jamais une part à atteindre : voir le ① du
  //   commentaire de tête.
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
              {/* Le repli n'est PAS un défaut par confort : un appelant qui ne
                  compte que des euros n'a rien à écrire, et un appelant qui
                  compte autre chose DOIT écrire — sinon sa valeur sort en euros
                  et il le verra tout de suite, à l'écran, sur le premier
                  décompte. Un repli silencieux et juste vaut mieux qu'un repli
                  muet et faux. */}
              {b.libelle ?? formaterEuros(b.centimes)}
            </span>
          </div>
          {/* La barre est DÉCORATIVE pour un lecteur d'écran : le nom et la
              valeur juste au-dessus disent déjà tout ce qu'elle dit, et
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
