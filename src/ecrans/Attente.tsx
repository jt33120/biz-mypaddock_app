/**
 * LE TÉMOIN D'ATTENTE — un seul, pour tout le produit.
 *
 * « Rajouter un loading circle réutilisable dans toute l'app » — Julian,
 * 3 septembre 2026, après avoir tapé « En faire un portrait pixel » et attendu
 * devant un mot.
 *
 * ⚠ CE QU'IL REMPLACE N'ÉTAIT PAS RIEN, ET C'EST CE QUI LE REND NÉCESSAIRE. Les
 * gestes longs disaient déjà « fabrication… » — un mot, en petit, à la place du
 * libellé du bouton. Un mot ne bouge pas : sur un appel qui dure dix secondes,
 * rien à l'écran ne distingue « ça travaille » de « ça a planté », et le pilote
 * retape. Sur un geste qui COÛTE 0,16 €, retaper n'est pas un détail.
 *
 * ⚠ IL N'EST PAS UNE BARRE DE PROGRESSION, ET IL NE PEUT PAS EN DEVENIR UNE. Le
 * produit ne sait pas combien de temps prend un appel au modèle ; une jauge qui
 * avance sans le savoir ment sur ce qui reste, et ce produit s'interdit déjà les
 * jauges partout où l'échelle serait inventée (Barres.tsx). Ce témoin dit une
 * seule chose, la seule qu'on sache : ça tourne.
 *
 * ⚠ ANGLES VIFS ET ROTATION PAR CRANS. Un cercle lissé qui tourne en continu
 * vient d'une autre famille visuelle que le reste — pixels carrés, `crispEdges`
 * sur les tracés, aucune ombre douce. Le témoin tourne donc en huit crans, comme
 * les transitions de la feuille (`steps(4)`), et reste carré.
 */
export function Attente({ mot }: {
  /** Ce qu'on attend, en deux mots. Il n'est PAS décoratif : le témoin seul dit
   *  « ça tourne » et jamais « quoi ». Absent quand le contexte le dit déjà —
   *  dans un bouton dont le libellé vient d'être remplacé, par exemple. */
  mot?: string
}) {
  return (
    /* `role="status"` et `aria-live="polite"` : un lecteur d'écran annonce le
       mot quand il apparaît, et se tait quand il disparaît. Sans eux, une
       attente est purement visuelle — donc absente pour qui ne voit pas. */
    <span className="rang attente-rang" role="status" aria-live="polite">
      <span className="attente" aria-hidden="true" />
      {mot && <span className="libelle faible">{mot}</span>}
    </span>
  )
}
