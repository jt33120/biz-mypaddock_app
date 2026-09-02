/**
 * LA TÊTE D'UN BLOC QUI SE REPLIE — une seule, pour cinq plis.
 *
 * Le lot 3 a commencé par replier le bilan de saison (637 px), puis trois blocs
 * du bilan d'une journée. À la quatrième copie du même en-tête, la question
 * n'était plus « comment le rendre » mais « combien de fois vais-je le rendre
 * différemment » : c'est le raisonnement qui a déjà sorti la grille du prompt de
 * son module, et le groupement des mois de son écran. Deux en-têtes égaux dans
 * deux fichiers finissent toujours par diverger — sur le signe, sur l'ordre du
 * titre et de l'état, sur `aria-expanded`, et c'est le dernier qu'on oublie.
 *
 * ⚠ CE N'EST PAS UN EMBALLAGE, C'EST UNE TÊTE. Elle ne rend pas le `.bloc` qui
 * la contient et ne reçoit pas d'enfants : chaque appelant garde SON bloc et
 * décide lui-même de ce qu'il montre replié. Un composant qui aurait enveloppé
 * ses enfants aurait posé un `.bloc` dans un `.bloc` — deux cadres, deux fonds,
 * deux paddings — et il aurait fallu une règle de feuille pour défaire ce que le
 * composant venait de faire.
 *
 * ⚠ ET L'ÉTAT SE LIT SANS OUVRIR. C'est la seule chose qui sépare un pli d'une
 * disparition : « Chargement · rien de préparé » se lit replié, et le pilote sait
 * qu'il n'y a rien derrière avant de taper. Un en-tête qui ne dirait que son
 * titre transformerait chaque pli en question, donc en tap.
 */
export function TeteRepli({ titre, etat, chiffre, ouvert, onBasculer }: {
  /** Le nom de la section, tel qu'il s'écrivait avant le pli. */
  titre: string
  /** Ce qu'elle contient, en quelques mots. Absent quand il n'y a rien à
   *  résumer — et non pas rendu vide, ce qui creuserait une ligne blanche. */
  etat?: string
  /** Le chiffre de la section, DÉJÀ ÉCRIT, quand elle en a un qui vaut d'être
   *  lu replié — « 1 126,80 € ». Il reste gros : c'est un fait, pas un résumé,
   *  et le replier derrière un tap coûterait précisément ce que le pli est censé
   *  faire gagner. La tête a donc deux façons de dire ce qu'elle contient, et
   *  aucune ne remplace l'autre. */
  chiffre?: string
  ouvert: boolean
  onBasculer: () => void
}) {
  return (
    <button className="rang atelier-tete" onClick={onBasculer} aria-expanded={ouvert}>
      <span className="pile" style={{ gap: 1 }}>
        <span className="libelle">{titre}</span>
        {etat && <span className="sous-titre">{etat}</span>}
      </span>
      {chiffre && <span className="chiffre hud-24">{chiffre}</span>}
      {/* Le signe est le même que celui des postes d'atelier : un pli du produit
          s'ouvre partout de la même façon, sinon chaque écran s'apprend. */}
      <span className="signe">{ouvert ? '–' : '+'}</span>
    </button>
  )
}
