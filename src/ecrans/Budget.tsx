import { useCallback, useEffect, useRef, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  CATEGORIES_EQUIPEMENT, coutEquipement, declarerEquipement, depenserSur,
  EXEMPLE_EQUIPEMENT, EXEMPLE_POSTE, listerEquipement, NOM_EQUIPEMENT, NOM_POSTE,
  jourDansLAnnee, nomMois, oublierEquipement, parMois, parPoste, poserSpriteEquipement,
  POSTES, repereMensuel,
  type CategorieEquipement, type Equipement as Materiel, type LigneMois, type LignePoste,
  type Poste,
} from '../db/budget'
import { photoEquipement, verserPhotoEquipement } from '../db/photos'
import { Icone, type Nom } from './Icones'
import { genererPortrait } from '../pixel/portrait'
import type { Sprite } from '../pixel/spritifier'
import {
  anneeSaison, budgetDeclare, enCentimes, formaterEuros, listerMachines, type Cible,
} from '../db/depot'
import { useGeste } from './geste'
import { Refaire } from './Refaire'

/**
 * LE BUDGET ET L'ÉQUIPEMENT — deux modules demandés par Julian, dans le garage.
 *
 * « Ajouter parmi ces trois modules un aspect budget où on ajoute le budget
 *   course entretien maintenance essence assurance etc, louage remorque »
 *
 * « Dans le garage, il y a toujours une machine mais aussi un espace équipement :
 *   combi, tente, gants, accessoire, chaise, tout ce qui est nécessaire à une
 *   journée circuit mais sans être spécifique à une machine »
 *
 * ⚠ LES DEUX CLAUSES D'ARGENT DU PRODUIT TIENNENT ICI, et elles ne sont pas
 * décoratives :
 *
 *   ① AUCUNE PRÉVISION. Ce module additionne ce qui a été saisi et s'arrête là.
 *     Le seul chiffre du produit qui ait le droit de parler d'avenir est le
 *     budget que le pilote a LUI-MÊME posé — parce qu'il l'a posé.
 *   ② AUCUN RESTE À DÉPENSER, aucune barre qui se remplit, aucun « il te reste
 *     X € ». Un budget qui se vide sous les yeux est un compteur à rebours, et
 *     un compteur à rebours sur de l'argent produit exactement ce qu'il prétend
 *     éviter : on cesse de saisir pour ne plus le voir descendre.
 */
/* ⚠ LE JOUR EST CELUI D'UTC, ET C'EST LA CONVENTION DE TOUT LE PRODUIT
   (`vecu.ts:32`, `Depense.tsx`, `Usure.tsx`, `Poste.tsx` — six endroits, tous
   pareils). Conséquence, maintenant que le mois compte : une dépense notée à
   00 h 30 à Paris le 1er septembre porte le 31 août, donc tombe dans le mois
   précédent. C'est SU et laissé tel quel, pas ignoré — le corriger ici seulement
   ferait vivre deux horloges dans le produit, et le jour d'une dépense ne se
   comparerait plus au jour d'un roulage. Le jour où on le corrige, on le corrige
   partout, en un seul geste, avec sa propre garde. */
const aujourdhui = () => new Date().toISOString().slice(0, 10)
const ceMois = () => new Date().toISOString().slice(0, 7)

export function Budget({ db, annee, machineId, onEcrit }: {
  db: PowerSyncDatabase
  annee: number
  /** La machine affichée — proposée comme cible quand le poste la concerne.
   *  Jamais imposée : une assurance ou une tente ne désigne aucune moto. */
  machineId: string | null
  onEcrit: () => void
}) {
  const [lignes, setLignes] = useState<LignePoste[]>([])
  const [mois, setMois] = useState<LigneMois[]>([])
  /** Le PLAFOND de la saison, tel que le pilote l'a posé — jamais dérivé, jamais
   *  reconduit tout seul. `null` est un état parfaitement normal (FR-24). */
  const [plafond, setPlafond] = useState<number | null>(null)
  const [ouvert, setOuvert] = useState(false)
  const [saisie, setSaisie] = useState<Poste | null>(null)

  const charger = useCallback(async () => {
    setLignes(await parPoste(db, annee))
    setMois(await parMois(db, annee))
    setPlafond(await budgetDeclare(db, annee))
  }, [db, annee])
  useEffect(() => { void charger() }, [charger])

  const total = lignes.reduce((t, l) => t + l.total, 0)
  const trouve = (p: Poste) => lignes.find((l) => l.poste === p)
  const sansPoste = lignes.find((l) => l.poste === null)
  const repere = repereMensuel(plafond)

  return (
    <div className="bloc pile atelier budget">
      {/* ⚠ LA PÉRIODE VOYAGE AVEC LE CHIFFRE — récit 19.1. « Le coût est de 2180
          mais le budget est de 500/mois » : Julian a saisi un montant MENSUEL
          dans un champ ANNUEL, et le produit ne l'a contredit nulle part. Un
          titre au-dessus ne suffit pas — on lit le nombre, pas l'en-tête. Le mot
          « année » est donc collé à chaque somme de ce module, ici comme au
          bilan de la journée (App.tsx) et au bilan de saison (Saison.tsx). */}
      <button className="rang atelier-tete" onClick={() => setOuvert(!ouvert)}>
        <span className="pile" style={{ gap: 1 }}>
          <span className="libelle">Budget · année {annee}</span>
          <span className="sous-titre">
            ce que l'année entière a coûté, poste par poste
          </span>
        </span>
        <span className="chiffre hud-16">{total ? formaterEuros(total) : '—'}</span>
      </button>

      {ouvert && (
        <>
          {!total && (
            <p className="note">
              Rien de saisi. Un poste se remplit au moment où l'on paie, pas en début
              de saison — c'est le seul moment où l'on connaît le montant.
            </p>
          )}

          {POSTES.map((p) => {
            const l = trouve(p)
            return (
              <div className="pile" key={p} style={{ gap: 6 }}>
                {/* ⚠ TOUTE LA LIGNE EST LA CIBLE, pas le « + ». Un « + » de vingt
                    pixels est inatteignable avec des gants, et la cible minimale
                    du produit est de 52 px — c'est une contrainte de saisie au
                    paddock, pas une préférence. Trouvé sur la capture, pas à la
                    relecture : le code était juste, le doigt ne l'était pas. */}
                <button className="rang ligne-atelier poste"
                        aria-expanded={saisie === p}
                        onClick={() => setSaisie(saisie === p ? null : p)}>
                  <span className="pile" style={{ gap: 0 }}>
                    <span className="texte">{NOM_POSTE[p]}</span>
                    <span className="sous-titre">
                      {l ? `${l.n} dépense${l.n > 1 ? 's' : ''}` : EXEMPLE_POSTE[p]}
                    </span>
                  </span>
                  <span className="rang" style={{ gap: 10, flex: '0 0 auto' }}>
                    {/* Le montant ne s'affiche QUE s'il existe. Ni zéro, ni tiret
                        par défaut : un poste jamais utilisé n'est pas un poste à
                        zéro, c'est un poste dont on n'a rien à dire. */}
                    {l && <span className="chiffre hud-16">{formaterEuros(l.total)}</span>}
                    <span className="signe" aria-hidden>{saisie === p ? '×' : '+'}</span>
                  </span>
                </button>
                {saisie === p && (
                  <Ajouter db={db} poste={p} machineId={machineId} annee={annee}
                           onFini={() => { setSaisie(null); void charger().then(onEcrit) }}
                           onAnnuler={() => setSaisie(null)} />
                )}
              </div>
            )
          })}

          {/* Les dépenses ANTÉRIEURES au poste. Elles ne sont pas rangées
              d'office dans « Autre » : les y mettre ferait croire qu'un choix a
              été fait. Elles sont dites pour ce qu'elles sont. */}
          {sansPoste && (
            <div className="rang ligne-atelier">
              <span className="pile" style={{ gap: 0 }}>
                <span className="texte faible">Sans poste</span>
                <span className="sous-titre">
                  saisies avant que les postes existent
                </span>
              </span>
              <span className="chiffre hud-16 faible">{formaterEuros(sansPoste.total)}</span>
            </div>
          )}

          {/* ─── PAR MOIS — récit 19.2, moitié « le mois existe » ──────────────
              Ce qui est montré : ce que chaque mois a coûté, et de quoi il était
              fait. Ce qui ne l'est JAMAIS, et la tentation est ici :
                · aucun mois ne se compare au précédent, aucun « + 40 % » ;
                · aucune couleur sur un mois cher — un mois cher est un mois où
                  l'on a roulé, pas une faute ;
                · aucune barre qui se remplit vers un plafond du mois : une jauge
                  mensuelle transformerait un repère en compteur à rebours, et
                  c'est exactement ce que les deux clauses d'argent refusent ;
                · aucun « à ce rythme » — les douze mois d'une saison de piste ne
                  se ressemblent pas, et une droite tirée sur avril ne dit rien
                  de janvier. */}
          {!!mois.length && (
            <div className="pile" style={{ gap: 6 }}>
              <span className="sous-titre">Par mois</span>

              {/* LE REPÈRE MENSUEL — « un plafond annuel ET un repère mensuel »,
                  décision de Julian du 25 août 2026. Il se DÉRIVE du plafond
                  (÷ 12) au lieu de se saisir : deux montants saisis séparément
                  finissent par se contredire, et un second champ rouvrirait la
                  confusion même que 19.1 vient de fermer. Il est dit une fois,
                  en toutes lettres, et aucune ligne de mois ne s'y mesure. */}
              {repere != null && plafond != null && (
                <p className="note">
                  Repère du mois · {formaterEuros(repere)} — c'est le plafond que tu as posé
                  pour l'année {annee}, {formaterEuros(plafond)}, divisé par douze. Un repère,
                  rien de plus : aucun mois ne s'y compare, et un mois au-dessus n'est pas
                  une faute.
                </p>
              )}

              {mois.map((m) => (
                <div className="rang ligne-atelier" key={m.mois ?? 'sans-mois'}>
                  <span className="pile" style={{ gap: 0 }}>
                    <span className={m.mois ? 'texte' : 'texte faible'}>
                      {m.mois ? nomMois(m.mois) : 'Sans mois'}
                    </span>
                    {/* ⚠ LES DÉPENSES D'AVANT LA COLONNE SE DISENT, elles ne se
                        rangent pas au hasard — exactement comme « Sans poste »
                        juste au-dessus, et pour la même raison : leur attribuer
                        un mois ferait croire qu'un choix a été fait. */}
                    <span className="sous-titre">
                      {m.mois
                        ? m.postes.map((p) => p.poste ? NOM_POSTE[p.poste].toLowerCase() : 'sans poste')
                          .join(' · ')
                        : "saisies avant que la dépense porte son jour"}
                    </span>
                  </span>
                  <span className={m.mois ? 'chiffre hud-16' : 'chiffre hud-16 faible'}>
                    {formaterEuros(m.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * LA SAISIE D'UNE DÉPENSE. Le poste est déjà choisi — on a tapé dessus.
 *
 * ⚠ LA CIBLE RESTE OBLIGATOIRE ET EXCLUSIVE (AD-7). Le poste ne la remplace
 * pas : il dit DE QUOI il s'agit, la cible dit À QUOI c'est rattaché. Le défaut
 * proposé suit le poste — des pneus désignent la moto, une assurance désigne la
 * saison — mais il reste modifiable, parce qu'un pilote à deux motos sait mieux
 * que le produit à laquelle appartient ce train de pneus.
 */
function Ajouter({ db, poste, machineId, annee, onFini, onAnnuler }: {
  db: PowerSyncDatabase; poste: Poste; machineId: string | null
  /** ⚠ L'ANNÉE QUE L'APPELANT MONTRE, et la seule où le jour ait le droit de
   *  tomber. Ce n'est pas une préférence d'ergonomie : les deux lectures du
   *  budget (`parPoste`, `parMois`) filtrent `WHERE saison_annee = ?` sur cette
   *  année-là, et le garage ne montre jamais que l'année en cours. Une facture
   *  de décembre retrouvée en janvier et datée de décembre partait donc dans une
   *  saison qu'AUCUN écran du produit n'affiche — pendant que le raccourci de
   *  l'accueil annonçait « le détail vit au garage, dans le budget ». */
  annee: number
  /** Le montant écrit, pour que l'appelant puisse ÉNONCER ce qui vient d'être
   *  noté. Le raccourci de l'accueil en a besoin : sans lui, la saisie
   *  disparaîtrait sans qu'aucun écran ne dise ce qu'elle est devenue. */
  onFini: (centimes: number) => void
  /** ⚠ ANNULER N'EST PAS FINIR, et c'est le compilateur qui a posé la question :
   *  le même rappel servait aux deux, et il recevait alors l'événement du clic à
   *  la place du montant. Deux gestes opposés derrière une seule porte finissent
   *  toujours par produire l'un quand on demandait l'autre. */
  onAnnuler: () => void
}) {
  const SUR_LA_MACHINE: Poste[] = ['entretien', 'pneus']
  const defaut: Cible = SUR_LA_MACHINE.includes(poste) && machineId ? 'machine' : 'saison'
  const [cible, setCible] = useState<Cible>(defaut)
  const [montant, setMontant] = useState('')
  const [libelle, setLibelle] = useState('')
  /* LE JOUR — récit 19.2. Aujourd'hui par défaut, parce que c'est le cas de neuf
     saisies sur dix : on note en payant, ou le soir en rentrant. Corrigeable,
     parce que la dixième est la facture retrouvée trois semaines plus tard — et
     c'est précisément celle dont le mois serait faux si le champ n'existait pas.
     ⚠ CE N'EST PAS UN CHAMP OBLIGATOIRE DE PLUS : il arrive rempli, et une
     saisie qui n'y touche pas se comporte exactement comme avant. */
  const [jour, setJour] = useState(aujourdhui())
  const centimes = enCentimes(montant)
  // Un champ date vidé à la main rend `''`. On retombe sur aujourd'hui plutôt
  // que d'écrire une ligne sans jour : les seules dépenses sans mois du produit
  // sont celles d'avant la colonne, et il n'a pas à s'en fabriquer de nouvelles.
  const leJour = /^\d{4}-\d{2}-\d{2}$/.test(jour) ? jour : aujourdhui()
  /* ⚠ `min`/`max` NE GARDENT RIEN, et c'est pour ça que la borne est aussi ici.
     Ils habillent le sélecteur du navigateur ; une date tapée au clavier hors
     bornes ressort telle quelle dans `value`, et le champ n'a ni `min` ni `max`
     à opposer à `fill()` non plus. La règle vit donc dans une fonction pure
     qu'un essai peut faire rougir (`jourDansLAnnee`). */
  const dansLAnnee = jourDansLAnnee(leJour, annee)
  const [poser, occupe] = useGeste(async () => {
    if (centimes == null) return
    await depenserSur(db, {
      poste, cible, centimes, libelle, date: leJour,
      machineId: cible === 'machine' ? machineId : null,
    })
    onFini(centimes)
  })

  return (
    <div className="pile" style={{ paddingLeft: 10 }}>
      <input className="champ" value={montant} onChange={(e) => setMontant(e.target.value)}
             placeholder="montant en €" inputMode="decimal" autoComplete="off" />
      <input className="champ" value={libelle} onChange={(e) => setLibelle(e.target.value)}
             placeholder="ce que c'était, si tu veux" autoComplete="off" />
      <div className="rang" style={{ gap: 8 }}>
        <input className="champ" type="date" value={jour}
               min={`${annee}-01-01`} max={`${annee}-12-31`}
               onChange={(e) => setJour(e.target.value)} style={{ flex: 1 }} />
        {/* AD-18 : c'est l'année du jour qui fixe la saison, à la saisie et pour
            toujours. Elle est donc écrite à côté du champ — on ne la devine pas. */}
        <span className="sous-titre">saison {anneeSaison(leJour)}</span>
      </div>
      {/* ⚠ CE QUI EST REFUSÉ SE DIT, ET NE SE CORRIGE PAS EN DOUCE. Remplacer
          silencieusement un jour hors bornes par aujourd'hui écrirait une date
          que personne n'a donnée ; l'écran énonce un fait — où le budget regarde
          — et laisse le pilote décider. */}
      {!dansLAnnee && (
        <p className="note">
          Ce jour est hors de l'année {annee}, la seule que ce budget montre. Une
          dépense datée d'une autre année ne s'y rangerait pas, et aucun écran du
          produit ne la montrerait.
        </p>
      )}
      {machineId && (
        <div className="puces">
          <button className="puce" data-actif={cible === 'machine' ? '1' : '0'}
                  onClick={() => setCible('machine')}>SUR LA MOTO</button>
          <button className="puce" data-actif={cible === 'saison' ? '1' : '0'}
                  onClick={() => setCible('saison')}>SUR LA SAISON</button>
        </div>
      )}
      <button className="bouton secondaire" disabled={centimes == null || occupe || !dansLAnnee}
              onClick={() => void poser()}>
        {occupe ? 'enregistrement…' : `Ajouter à ${NOM_POSTE[poste].toLowerCase()}`}
      </button>
      <button className="lien" onClick={onAnnuler}>Annuler</button>
    </div>
  )
}

/**
 * LE RACCOURCI DE L'ACCUEIL — « d'ailleurs avec un raccourci sur la page
 * d'accueil ça ne peut pas faire de mal » (Julian, 25 août 2026).
 *
 * ⚠ IL ÉCRIT UNE LIGNE COMPLÈTE, et c'est sa seule raison d'exister ici plutôt
 * qu'ailleurs. Le produit a déjà deux chemins d'écriture de dépense qui ne
 * produisent pas la même ligne — `creerDepense` n'écrit aucun poste,
 * `depenserSur` n'a jamais proposé la cible « journée ». Un troisième chemin
 * bâclé aurait fabriqué une troisième sorte de dépense. Celui-ci passe par la
 * MÊME saisie que le garage (`Ajouter`) : même poste, même cible, même jour.
 *
 * ⚠ ET IL NE RÉCLAME RIEN (FR-13). C'est un lien discret, replié, qui ne
 * s'affiche jamais en bloc, ne porte aucune pastille, ne compte rien et ne dit
 * jamais « tu n'as rien saisi ce mois-ci ». Un raccourci qui rappelle son
 * existence est une relance, et le produit n'en fait pas.
 */
export function NoterUneDepense({ db, onEcrit }: {
  db: PowerSyncDatabase; onEcrit: () => void
}) {
  const [ouvert, setOuvert] = useState(false)
  const [poste, setPoste] = useState<Poste | null>(null)
  /** Ce qui vient d'être noté, dit une fois. Ce n'est pas une félicitation ni un
   *  compteur : c'est l'accusé de réception d'un geste, et il dit OÙ la ligne est
   *  partie — sinon le pilote la croit perdue et la ressaisit au garage. */
  const [note, setNote] = useState<string | null>(null)
  /** La seule moto, s'il n'y en a qu'une : elle rend la cible « sur la moto »
   *  atteignable depuis l'accueil pour des pneus ou un entretien. À plusieurs
   *  motos on ne choisit PAS à la place du pilote — la dépense part sur la
   *  saison, ce qui est une cible pleine et vraie, et le garage reste l'endroit
   *  où l'on désigne une machine précise. */
  const [machineSeule, setMachineSeule] = useState<string | null>(null)
  const [plusieurs, setPlusieurs] = useState(false)

  // Rien n'est lu tant que le raccourci est replié : l'accueil ne paie pas une
  // requête pour un lien que personne n'a touché.
  useEffect(() => {
    if (!ouvert) return
    void listerMachines(db).then((m) => {
      setMachineSeule(m.length === 1 ? m[0].id : null)
      setPlusieurs(m.length > 1)
    })
  }, [db, ouvert])

  if (!ouvert) {
    return (
      <div className="pile raccourci-depense">
        {/* Le « + » est le seul signe qu'il porte, et c'est délibéré : il dit
            qu'on AJOUTE quelque chose, là où un lien nu se lit comme un réglage
            — celui qui le précède, « changer ces chiffres », en est un. Aucune
            pastille, aucun compteur : la différence entre une action offerte et
            une action réclamée tient à ça. */}
        <button className="lien" onClick={() => { setOuvert(true); setNote(null) }}>
          + Noter une dépense
        </button>
        {note && <p className="note">{note}</p>}
      </div>
    )
  }

  return (
    <div className="bloc pile raccourci-depense">
      <span className="libelle">Noter une dépense</span>
      {poste == null ? (
        <>
          <span className="sous-titre">de quoi il s'agit</span>
          <div className="puces">
            {POSTES.map((p) => (
              <button key={p} className="puce" data-actif="0"
                      onClick={() => setPoste(p)}>{NOM_POSTE[p].toUpperCase()}</button>
            ))}
          </div>
          <button className="lien" onClick={() => setOuvert(false)}>Annuler</button>
        </>
      ) : (
        <>
          <span className="sous-titre">{NOM_POSTE[poste]}</span>
          {plusieurs && (
            <p className="note">
              Elle est notée sur la saison. Pour la rattacher à une moto précise, ça se
              passe au garage.
            </p>
          )}
          {/* ⚠ LA MÊME ANNÉE QUE LE GARAGE, sinon la phrase de fin ment. Le
              garage lit toujours `anneeSaison(maintenant)` (Garage.tsx) : si ce
              raccourci laissait dater une dépense ailleurs, « le détail vit au
              garage » désignerait un écran qui ne la contient pas. */}
          <Ajouter db={db} poste={poste} machineId={machineSeule}
                   annee={anneeSaison(new Date().toISOString())}
                   onFini={(centimes) => {
                     setNote(`Noté · ${formaterEuros(centimes)} sur ${NOM_POSTE[poste].toLowerCase()}.`
                       + ' Le détail vit au garage, dans le budget.')
                     setPoste(null); setOuvert(false); onEcrit()
                   }}
                   onAnnuler={() => setPoste(null)} />
        </>
      )}
    </div>
  )
}

/**
 * L'ÉQUIPEMENT — la troisième racine.
 *
 * ⚠ AUCUNE ÉCHÉANCE, NULLE PART, ET C'EST UNE CLAUSE DE SÉCURITÉ. La tentation
 * est maximale ici : un casque a une durée de vie, une dorsale a une norme
 * datée, et il serait « utile » d'afficher « ton casque a 6 ans ». Mais un
 * compteur qui monte sur un équipement de protection est un compteur à rebours
 * déguisé, et une pression sur un achat à 500 € produit du report, pas un
 * remplacement — puis l'arrêt de la saisie, pour ne plus voir le chiffre.
 *
 * Le produit consigne donc UN FAIT — la date d'achat, telle qu'elle est — et
 * n'en dérive rien. Le schéma n'a aucune colonne d'échéance : ce qui n'existe
 * pas ne peut pas s'afficher par accident.
 */
/** Le tracé d'une pièce d'équipement SANS média — récit 20.4. Dérivé des
 *  catégories elles-mêmes, donc une sixième ne compile pas sans qu'on lui
 *  choisisse une forme.
 *
 *  ⚠ LA COMBINAISON A ÉTÉ TENTÉE ET ABANDONNÉE. À 12 × 12, elle ne se distingue
 *  pas d'un bonhomme, et un bonhomme sur une pièce de protection ne dit rien du
 *  tout. Le casque porte la protection à lui seul ; ailleurs, la caisse à outils
 *  dit « du matériel » sans prétendre nommer lequel. Le libellé texte est là
 *  pour ça, et le produit privilégie déjà le mot partout. */
const TRACE_EQUIPEMENT: Record<CategorieEquipement, Nom> = {
  protection: 'casque',
  paddock: 'caisse',
  transport: 'caisse',
  outillage: 'cle',
  autre: 'caisse',
}

export function Equipement({ db, onEcrit, appele }: {
  db: PowerSyncDatabase; onEcrit: () => void
  /** Un compteur qui s'incrémente à chaque appel depuis la tête du garage :
   *  « X machine, et si je clique je peux aller sur mon équipement ». On passe
   *  un NOMBRE et non un booléen, parce qu'un booléen déjà vrai ne rappellerait
   *  rien au second tap — et un pilote qui tape deux fois s'attend deux fois à
   *  arriver quelque part. */
  appele?: number
}) {
  const [liste, setListe] = useState<Materiel[]>([])
  const [cout, setCout] = useState(0)
  const [ouvert, setOuvert] = useState(false)
  const [saisie, setSaisie] = useState(false)
  const bloc = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!appele) return
    setOuvert(true)
    // `scrollIntoView` APRÈS le rendu du dépliage, sinon on défile vers la
    // hauteur d'avant et l'on atterrit au-dessus du bloc.
    const t = setTimeout(() => bloc.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    return () => clearTimeout(t)
  }, [appele])

  const charger = useCallback(async () => {
    setListe(await listerEquipement(db))
    setCout(await coutEquipement(db))
  }, [db])
  useEffect(() => { void charger() }, [charger])

  return (
    <div className="bloc pile atelier equipement" ref={bloc}>
      <button className="rang atelier-tete" onClick={() => setOuvert(!ouvert)}>
        <span className="pile" style={{ gap: 1 }}>
          <span className="libelle">Équipement</span>
          <span className="sous-titre">
            ce qui sert une journée circuit sans appartenir à une moto
          </span>
        </span>
        <span className="libelle faible">
          {liste.length ? `${liste.length} pièce${liste.length > 1 ? 's' : ''}` : '—'}
          {cout ? ` · ${formaterEuros(cout)}` : ''}
        </span>
      </button>

      {ouvert && (
        <>
          {!liste.length && (
            <p className="note">
              Rien de déclaré. La combinaison, la tente, les gants, la caisse à outils :
              ce qui part au circuit sans être monté sur la moto.
            </p>
          )}

          {CATEGORIES_EQUIPEMENT.map((c) => {
            const dedans = liste.filter((e) => e.categorie === c)
            if (!dedans.length) return null
            return (
              <div className="pile" key={c} style={{ gap: 6 }}>
                <span className="sous-titre">{NOM_EQUIPEMENT[c]}</span>
                {dedans.map((e) => (
                  <LigneMateriel key={e.id} db={db} e={e}
                                 onEcrit={() => void charger().then(onEcrit)} />
                ))}
              </div>
            )
          })}

          {saisie
            ? <DeclarerMateriel db={db}
                                onFini={() => { setSaisie(false); void charger().then(onEcrit) }} />
            : <button className="lien" onClick={() => setSaisie(true)}>Déclarer une pièce</button>}
        </>
      )}
    </div>
  )
}

function LigneMateriel({ db, e, onEcrit }: {
  db: PowerSyncDatabase; e: Materiel; onEcrit: () => void
}) {
  const [retirer, occupe] = useGeste(async () => {
    await oublierEquipement(db, e.id)
    onEcrit()
  })

  /* ─── LE SKIN — « la combinaison c'est comme un skin, et le casque aussi » ──
     Même dispositif que la machine, jusque dans ses garde-fous : la photo réelle
     existe indépendamment du portrait, le candidat n'est rien tant qu'il n'est
     pas gardé, et refuser ne détruit rien. Et même quota : une combinaison passe
     par la même fabrique qu'une moto, donc par le même compteur et le même
     plafond — le quota porte sur le PILOTE, pas sur l'objet. */
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [candidat, setCandidat] = useState<Sprite | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [souci, setSouci] = useState<string | null>(null)
  const fichier = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let vivant = true
    void photoEquipement(e.photo_chemin).then((f) => {
      if (!vivant) return
      setPhotoUrl((a) => { if (a) URL.revokeObjectURL(a); return f ? URL.createObjectURL(f) : null })
    })
    return () => { vivant = false }
  }, [e.photo_chemin])

  const verser = async (f: File) => {
    setSouci(null)
    await verserPhotoEquipement(db, e.id, f)
    onEcrit()
  }
  const fabriquer = async () => {
    const f = await photoEquipement(e.photo_chemin)
    // ⚠ MÊME DÉFAUT QU'AU GARAGE, ET IL SE PAIE PAREIL. `e.photo_chemin` est une
    // colonne qui se synchronise ; les octets, eux, ne quittent jamais le
    // téléphone qui a pris la photo (`verserPhotoEquipement` n'écrit qu'en
    // local). Sur un second appareil, ce `return` muet laissait le pilote
    // valider une dépense annoncée à 0,16 € devant un écran qui ne bougeait pas.
    if (!f) {
      setSouci("La photo de cette pièce n'est pas sur ce téléphone — elle a été prise ailleurs. "
        + 'Elle se repose ici avec « Remplacer la photo », et le portrait se fabrique '
        + 'à partir d\'elle.')
      return
    }
    setEnCours(true); setSouci(null); setCandidat(null)
    const issue = await genererPortrait(db, { equipementId: e.id }, f)
    setEnCours(false)
    if (issue.ok) setCandidat(issue.sprite)
    else setSouci(issue.message)
  }
  /* ⚠ DEUX LIGNES, PAS UN RANG. La première version mettait le nom à gauche et
     « acheté en mars 2024 · 540 € · retirer » à droite, sur un `rang` en
     `space-between`. Sur un écran de 390 px, « Combinaison Ixon 2 pièces » se
     cassait en trois lignes et « retirer » sortait par la droite de l'écran.
     Vu sur la capture, invisible à la relecture — le code était correct, la
     largeur ne l'était pas. Un nom d'équipement est libre : il peut être long,
     et la mise en page doit le supposer plutôt que l'espérer court. */
  return (
    <div className="pile materiel">
      {/* TROIS ÉTATS, même préséance qu'au garage : le portrait pixel s'il a été
          gardé, la photo réelle sinon, et rien du tout en dernier — un
          équipement sans média reste pleinement un équipement. */}
      {(e.sprite || photoUrl) ? (
        <div className="scene-equipement">
          <img className={e.sprite ? 'sprite' : 'photo-machine'}
               src={e.sprite ?? photoUrl!} alt={e.nom} />
        </div>
      ) : (
        /* ⚠ QUATRIÈME ÉTAT, ET IL EST LE DERNIER — récit 20.4. Le tracé ne
           s'affiche QUE si ni portrait ni photo n'existent : « la combinaison
           c'est comme un skin, et le casque aussi, c'est à pixeliser », et une
           icône qui rivaliserait avec le sprite volerait la place du sujet.
           C'est une amorce sourde, à 28 px, sans échéance, sans âge, sans
           compteur — un compteur qui monte sur un équipement de protection est
           un compte à rebours déguisé, et le schéma n'a délibérément aucune
           colonne d'échéance. */
        <div className="scene-equipement vide">
          <Icone nom={TRACE_EQUIPEMENT[e.categorie] ?? 'caisse'} taille={28} />
        </div>
      )}

      <span className="texte">{e.nom}</span>
      {/* ⚠ LE RANG DES FAITS NE S'AFFICHE QUE S'IL EN A. Sans date ni montant,
          il rendait une ligne vide avec « retirer » suspendu tout seul à droite
          — vu sur la capture, invisible à la relecture. Une ligne vide se lit
          comme un défaut d'affichage, et elle en est un. */}
      {(e.achete_le || e.cout_centimes || e.note) && (
        <span className="libelle faible">
          {/* La date d'achat s'énonce, elle ne se convertit pas en âge. « acheté
              en mars 2024 » est un fait ; « 2 ans » est un jugement en attente,
              et sur un casque ce jugement est précisément ce qu'on s'interdit. */}
          {e.achete_le ? `acheté ${moisDit(e.achete_le)}` : ''}
          {e.achete_le && e.cout_centimes ? ' · ' : ''}
          {e.cout_centimes ? formaterEuros(e.cout_centimes) : ''}
          {e.note ? ` · ${e.note}` : ''}
        </span>
      )}

      <input ref={fichier} type="file" accept="image/*" hidden
             onChange={(ev) => { const f = ev.target.files?.[0]; if (f) void verser(f) }} />

      {candidat ? (
        <div className="pile">
          <div className="scene-equipement">
            <img className="sprite" src={candidat.dataUri} alt={`${e.nom} en pixel`} />
          </div>
          <p className="note">
            {candidat.largeur} × {candidat.hauteur} cellules · {candidat.couleurs} couleurs.
            Tant qu'il n'est pas gardé, rien n'a changé.
          </p>
          <button className="bouton secondaire"
                  onClick={() => void poserSpriteEquipement(db, e.id, candidat.dataUri)
                    .then(() => { setCandidat(null); onEcrit() })}>
            Garder ce portrait
          </button>
          {/* ⚠ LE LIBELLÉ DIT VERS QUOI ON REVIENT. Il annonçait la photo dans
              les deux cas, alors que la scène retombe sur `e.sprite ?? photoUrl`
              : quand un portrait était déjà gardé, c'est lui qui reprenait la
              place — celui qu'on voulait justement remplacer. Le pilote croyait
              le bouton sans effet et retapait « Refaire », à 0,16 € le
              malentendu. */}
          <button className="lien" onClick={() => setCandidat(null)}>
            {e.sprite ? 'Revenir au portrait actuel' : 'Revenir à la photo'}
          </button>
        </div>
      ) : (
        /* ⚠ LA MÊME RÈGLE QU'AU GARAGE, ET C'EST DÉLIBÉRÉ. Le couple
           « fabriquer » / « retirer le portrait » s'excluait ici exactement comme
           sur la moto : refaire un skin raté demandait de l'effacer d'abord. Un
           seul bouton les remplace, il annonce son coût avant d'appeler, et le
           retrait disparaît — il ne posait que `sprite = NULL`, la photo réelle
           n'a jamais dépendu de lui. Une différence entre les deux écrans aurait
           été une règle à retenir de plus, pour rien.

           « Retirer » tout court, lui, reste et détruit vraiment : il oublie la
           pièce d'équipement. Il porte donc le rouge, et pas ses voisins. */
        <div className="rang actions-materiel">
          <button className="lien" onClick={() => fichier.current?.click()}>
            {e.photo_chemin ? 'Remplacer la photo' : 'Photographier'}
          </button>
          {/* ⚠ LA PHOTO RELUE, PAS LA COLONNE — même règle qu'au garage. La
              colonne descend sur tous les appareils, le fichier reste sur un
              seul : conditionner la dépense sur la colonne, c'est offrir un
              chemin qui ne peut pas aboutir. */}
          {photoUrl && (
            <Refaire db={db} aUnPortrait={!!e.sprite} enCours={enCours}
                     onFabriquer={() => void fabriquer()} />
          )}
          <button className="lien destructif" disabled={occupe}
                  onClick={() => void retirer()}>retirer</button>
        </div>
      )}
      {souci && <p className="mot-erreur">{souci}</p>}
    </div>
  )
}

/** `2026-04` → « en avril 2026 ». Les douze noms vivent dans `db/budget.ts`
 *  depuis que le budget compte au mois : deux tables de mois dans deux fichiers,
 *  c'est un « févier » à corriger deux fois et une seule fois qu'on y pense. */
const moisDit = (aaaaMm: string) => `en ${nomMois(aaaaMm)}`

function DeclarerMateriel({ db, onFini }: { db: PowerSyncDatabase; onFini: () => void }) {
  const [nom, setNom] = useState('')
  const [categorie, setCategorie] = useState<CategorieEquipement>('protection')
  const [achat, setAchat] = useState('')
  const [montant, setMontant] = useState('')
  const [poser, occupe] = useGeste(async () => {
    if (!nom.trim()) return
    await declarerEquipement(db, {
      nom, categorie,
      acheteLe: /^\d{4}-\d{2}$/.test(achat) ? achat : null,
      centimes: montant.trim() ? enCentimes(montant) : null,
    })
    onFini()
  })

  return (
    <div className="pile">
      <input className="champ" value={nom} onChange={(e) => setNom(e.target.value)}
             placeholder="Combinaison cuir" autoComplete="off" />
      <div className="puces">
        {CATEGORIES_EQUIPEMENT.map((c) => (
          <button key={c} className="puce" data-actif={categorie === c ? '1' : '0'}
                  onClick={() => setCategorie(c)}>{NOM_EQUIPEMENT[c].toUpperCase()}</button>
        ))}
      </div>
      <p className="note">{EXEMPLE_EQUIPEMENT[categorie]}</p>
      {/* UN MOIS, pas un jour. Personne ne se souvient de la date exacte où il a
          acheté ses gants — et exiger le jour transforme dix secondes de saisie
          en recherche de facture, donc en saisie qu'on ne fait pas. */}
      <div className="libelle">Acheté · le mois suffit</div>
      <input className="champ" type="month" value={achat} max={ceMois()}
             onChange={(e) => setAchat(e.target.value)} />
      <input className="champ" value={montant} onChange={(e) => setMontant(e.target.value)}
             placeholder="ce que ça a coûté, si tu l'as" inputMode="decimal" />
      <button className="bouton secondaire" disabled={!nom.trim() || occupe}
              onClick={() => void poser()}>
        {occupe ? 'enregistrement…' : 'Déclarer'}
      </button>
      <button className="lien" onClick={onFini}>Annuler</button>
    </div>
  )
}
