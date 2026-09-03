import { useCallback, useEffect, useRef, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  CATEGORIES_EQUIPEMENT, coutEquipement, declarerEquipement, depenserSur,
  EXEMPLE_EQUIPEMENT, EXEMPLE_POSTE, listerEquipement, NOM_EQUIPEMENT, NOM_POSTE,
  jourDansLAnnee, nomMois, oublierEquipement, parPoste, poserGenreEquipement,
  poserSpriteEquipement,
  POSTES, repereMensuel,
  type CategorieEquipement, type Equipement as Materiel, type LignePoste,
  type Poste,
} from '../db/budget'
import { GENRES_DE_TENUE, piecesDeGenre, type GenreDeTenue } from '../db/equipement'
import { photoEquipement, verserPhotoEquipement } from '../db/photos'
import { Icone, type Nom } from './Icones'
import { genererPortrait } from '../pixel/portrait'
import type { Sprite } from '../pixel/spritifier'
import {
  anneeSaison, budgetDeclare, enCentimes, formaterEuros, type Cible,
} from '../db/depot'
import { useGeste } from './geste'
import { Refaire } from './Refaire'
import { aujourdhui } from '../db/vecu'

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
 *
 * ⚠ LES DEUX TRACÉS ONT QUITTÉ CE MODULE — 1er septembre 2026. « Par poste » et
 * « par mois » y étaient rendus en barres, et les deux étaient VERROUILLÉS SUR
 * L'ANNÉE COURANTE aux deux points de montage : `<Budget annee={anneeSaison(
 * aujourdhui())}>` au garage, dans la branche avec machine comme dans celle sans.
 * L'argent était donc le seul chiffre du produit qu'on ne pouvait regarder sur
 * aucune autre année — le bilan de saison, lui, a ses puces d'années depuis
 * FR-55. Les deux tracés vivent maintenant dans l'écran d'analyse, où ils
 * gagnent une PÉRIODE et se croisent aussi avec la journée, la moto et l'année.
 *
 * Ce qui reste ici : les huit postes avec leur champ de saisie, les montants
 * déjà notés poste par poste, et le repère mensuel dérivé du plafond. Le module
 * a perdu sa moitié « regarder » et gardé sa moitié « noter » — c'est un gain net
 * sur le défilement du garage, pas seulement un déplacement.
 *
 * ⚠ ET LE PLAFOND N'EST PAS POSÉ ICI, il n'y est que LU (`budgetDeclare`). Le
 * seul champ qui l'écrit vit dans `BlocCout` (App.tsx), sur le bilan d'une
 * journée — « au premier coût affiché, jamais à la création du compte » (FR-24).
 * C'est écrit noir sur blanc parce que le repère mensuel s'affiche ici sans que
 * rien n'y mène : un pilote qui n'a pas encore de journée vécue ne peut pas
 * poser de plafond, donc ne voit jamais ce repère. Ce n'est pas ce lot qui l'a
 * fait, et ce n'est pas ce lot qui le corrige.
 */
const ceMois = () => aujourdhui().slice(0, 7)

export function Budget({ db, annee, machineId, onEcrit }: {
  db: PowerSyncDatabase
  annee: number
  /** La machine affichée — proposée comme cible quand le poste la concerne.
   *  Jamais imposée : une assurance ou une tente ne désigne aucune moto. */
  machineId: string | null
  onEcrit: () => void
}) {
  const [lignes, setLignes] = useState<LignePoste[]>([])
  /** Le PLAFOND de la saison, tel que le pilote l'a posé — jamais dérivé, jamais
   *  reconduit tout seul. `null` est un état parfaitement normal (FR-24). */
  const [plafond, setPlafond] = useState<number | null>(null)
  const [ouvert, setOuvert] = useState(false)
  const [saisie, setSaisie] = useState<Poste | null>(null)

  /* ⚠ CE MODULE NE LIT PLUS QUE LES POSTES. Le tracé des mois est parti à
     l'analyse (voir la tête du fichier), et `parMois` — la lecture SQL qui
     l'alimentait — a été retirée de `db/budget.ts` au même commit : elle n'avait
     plus aucun appelant, et une requête gardée « au cas où » est une requête que
     personne ne regarde et que personne ne corrige. Le GROUPEMENT, lui, survit
     et sert : `argentParMois` (src/db/analyse.ts) appelle `grouperParMois` tel
     quel — la fonction pure que le banc fait déjà rougir. */
  const charger = useCallback(async () => {
    setLignes(await parPoste(db, annee))
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
      {/* ⚠ L'EN-TÊTE A ÉTÉ RÉÉCRIT LE JOUR OÙ LE TRACÉ EST PARTI, et il disait
          faux de DEUX façons, pas d'une.

          ① Il promettait une LECTURE : « ce que l'année entière a coûté, poste
            par poste » est ce qu'on lit d'un tracé, pas ce qu'on fait dans un
            formulaire. Replié, ce sous-titre est tout ce que le pilote voit du
            module ; il l'ouvrait pour regarder la forme de sa saison et tombait
            désormais sur huit champs de saisie. Un en-tête qui annonce ce qui
            n'est plus derrière est un panneau qui indique une route coupée.

          ② Il annonçait une TOTALITÉ que ce total n'a jamais eue. `parPoste`
            n'additionne que la table `depense` — la seule des trois sources
            d'argent qui porte un poste. `intervention.cout_centimes` (l'atelier,
            FR-43) et `equipement.cout_centimes` n'en portent aucun, donc ils ne
            sont pas dans ce chiffre, et ils ne l'ont jamais été. « Ce que l'année
            entière a coûté » était donc sous-compté depuis que cet écran existe.
            Le sous-titre nomme maintenant exactement ce qu'il additionne : les
            dépenses NOTÉES. C'est la même clause que l'emport, « un emport qui
            ment sur ses trous est pire qu'un emport incomplet » — et l'écran
            d'analyse, lui, chiffre les trous (`argentNonCompte`).

          ⚠ ET LE MOT « ANNÉE » RESTE COLLÉ AU MONTANT — récit 19.1 ci-dessus, ce
          n'est pas ce paragraphe qui le lève. */}
      <button className="rang atelier-tete" onClick={() => setOuvert(!ouvert)}>
        <span className="pile" style={{ gap: 1 }}>
          <span className="libelle">Budget · année {annee}</span>
          {/* Le sous-titre NOMME LE NOMBRE qui est à côté de lui, et il ne nomme
              que lui. Le repère mensuel se lit en clair une fois le module
              ouvert : le faire voyager dans l'en-tête y mettrait un second
              montant, et c'est précisément la confusion que 19.1 a fermée. */}
          <span className="sous-titre">
            les dépenses que tu as notées, poste par poste
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

          {/* ⚠ LE TRACÉ PAR POSTE ÉTAIT ICI, ET IL EST PARTI — 1er septembre
              2026. Ce qu'il faisait exactement, pour que le déplacement soit
              écrit et non subi : il rendait les huit postes en barres, triés du
              plus gros au plus petit, échelle sur le plus gros poste, « Sans
              poste » en teinte atténuée au bout.

              Il était verrouillé sur `annee` — et `annee` vaut
              `anneeSaison(aujourdhui())` aux deux points de montage du garage.
              La forme d'une saison passée était donc INATTEIGNABLE, sur le seul
              chiffre du produit qui se reporte d'une année à l'autre (FR-56). Il
              vit maintenant dans l'écran d'analyse, sous FINANCE · POSTE, avec
              une rangée de périodes.

              ⚠ ET LA LISTE QUI SUIT N'A PAS CHANGÉ DE PLACE. Elle sert à SAISIR
              — chaque ligne ouvre son champ — et c'est désormais la première
              chose du module, ce qui est exactement ce qu'il est devenu. */}
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

          {/* ⚠ LE TRACÉ PAR MOIS ÉTAIT ICI, ET IL EST PARTI AVEC L'AUTRE —
              1er septembre 2026. Ce qu'il faisait : un panier par mois, dans
              L'ORDRE DU CALENDRIER et jamais trié par montant (un classement de
              dépenses est un verdict), « Sans mois » en teinte atténuée au bout,
              et le détail des postes sous chaque mois.

              Il portait la même serrure que celui des postes : `annee` figée sur
              l'année courante. Il vit maintenant sous FINANCE · MOIS, où il est
              devenu une SUITE — des paniers mensuels reliés par des segments
              droits, ce que ce module ne pouvait pas faire sans poser un `<svg>`
              (voir le ④ de Barres.tsx, et la levée du 1er septembre).

              ⚠ CE QUI RESTE ICI EST LE REPÈRE MENSUEL, ET IL RESTE POUR UNE
              RAISON : il ne se lit pas d'un tracé, il se DÉRIVE DU PLAFOND, et
              le plafond se pose ici. Il a d'ailleurs cessé de dépendre des mois
              — il était rendu à l'intérieur du `{!!mois.length}` du tracé, donc
              un pilote qui avait posé son plafond sans avoir encore noté une
              seule dépense ne voyait pas le repère qu'il venait de se donner. */}

          {/* LE REPÈRE MENSUEL — « un plafond annuel ET un repère mensuel »,
              décision de Julian du 25 août 2026. Il se DÉRIVE du plafond (÷ 12)
              au lieu de se saisir : deux montants saisis séparément finissent par
              se contredire, et un second champ rouvrirait la confusion même que
              19.1 vient de fermer. Il est dit une fois, en toutes lettres, et
              rien ne s'y mesure. */}
          {repere != null && plafond != null && (
            <p className="note">
              Repère du mois · {formaterEuros(repere)} — c'est le plafond que tu as posé
              pour l'année {annee}, {formaterEuros(plafond)}, divisé par douze. Un repère,
              rien de plus : aucun mois ne s'y compare, et un mois au-dessus n'est pas
              une faute.
            </p>
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
   *  budget (`parPoste`) filtre `WHERE saison_annee = ?` sur cette
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
export function NoterUneDepense({ onOuvrir }: { onOuvrir: () => void }) {
  return (
    <div className="raccourci-depense">
      <button type="button" className="bouton secondaire action-depense" onClick={onOuvrir}>
        <Icone nom="portefeuille" taille={18} />
        Noter une dépense
      </button>
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
  /** Ce que chaque pièce EST, quand le produit a besoin de le savoir. Absente
   *  de la map = pièce sans genre, ce qui est l'état de la MAJORITÉ (une
   *  glacière n'est ni un casque ni une combinaison) et un état parfaitement
   *  valide — la migration 20260901000001 garde la colonne nullable exprès. */
  const [genres, setGenres] = useState<Map<string, GenreDeTenue>>(new Map())
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
    /* ⚠ LE GENRE SE LIT PAR LA MÊME REQUÊTE QUE LE SÉLECTEUR DE TENUE, et c'est
       la raison de cette map plutôt qu'une colonne de plus sur l'inventaire.
       `piecesDeGenre` est le SEUL endroit où le produit décide ce qui compte
       comme un casque (db/equipement.ts). Si cet écran-ci lisait le genre
       autrement, une pièce pourrait être proposée comme casque dans la tenue du
       jour et se voir refuser le prompt de casque ici — deux écrans en
       désaccord sur le même fait, et c'est le genre de divergence qu'on ne voit
       qu'une fois payée. */
    const m = new Map<string, GenreDeTenue>()
    for (const g of ['casque', 'combinaison'] as const) {
      for (const p of await piecesDeGenre(db, g)) m.set(p.id, g)
    }
    setGenres(m)
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
                {/* Dite UNE FOIS pour le groupe, jamais sous chaque pièce : c'est
                    une règle du groupe, pas un fait de la pièce. Répétée, elle
                    faisait défiler trois fois la même chose — et une phrase qu'on
                    a déjà lue trois fois cesse d'être lue. */}
                {c === 'protection' && (
                  <p className="note">
                    Nommer une pièce « casque » ou « combinaison » permet de la porter sur
                    une journée, et son portrait est alors dessiné pour ce qu'elle est.
                    Facultatif : la plupart des pièces n'ont pas à l'être.
                  </p>
                )}
                {dedans.map((e) => (
                  <LigneMateriel key={e.id} db={db} e={e} genre={genres.get(e.id) ?? null}
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

function LigneMateriel({ db, e, genre, onEcrit }: {
  db: PowerSyncDatabase; e: Materiel
  /** `null` pour tout ce qui n'est ni casque ni combinaison — la majorité de
   *  l'inventaire. Il commande la fabrique de portrait, et rien d'autre. */
  genre: GenreDeTenue | null
  onEcrit: () => void
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

  /* ─── DIRE CE QUE LA PIÈCE EST — et c'était le chaînon manquant ──────────
     Le refus de fabrication ci-dessous disait « cette pièce n'a pas dit si elle
     est un casque ou une combinaison » alors qu'AUCUN écran du produit ne
     permettait de le dire. Un refus qui nomme une information qu'on ne peut pas
     fournir n'est pas un garde-fou, c'est une impasse — et elle tombait au
     moment précis où le pilote essayait de dépenser.

     ⚠ IL NE S'OFFRE QUE SUR LA PROTECTION. La catégorie couvre « casque,
     combinaison, dorsale, gants, bottes » : c'est le seul endroit où la question
     se pose. Proposer « casque ? » sous une glacière ferait du genre une case à
     remplir partout, alors qu'il est nul pour la majorité des pièces et que
     c'est son état normal.

     ⚠ ET IL SE REPREND. Taper la puce active retire le genre au lieu de le
     reposer : une pièce mal qualifiée doit pouvoir cesser de l'être sans qu'on
     la supprime — la supprimer coûterait la dépense qu'elle porte. */
  const [poserGenre, genreOccupe] = useGeste(async (suivant: GenreDeTenue | null) => {
    await poserGenreEquipement(db, e.id, suivant)
    onEcrit()
  })

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
    // ⚠ SANS GENRE, ON NE FABRIQUE PAS — ET SURTOUT ON NE DEVINE PAS.
    // La fabrique a un dessin PAR SUJET : la moto est rendue de profil strict,
    // le casque et la combinaison en trois-quarts. `equipement.genre` est
    // nullable et le restera — une glacière n'est ni l'un ni l'autre, et la
    // migration 20260901000001 le dit — donc une pièce sans genre existe pour
    // de bon. Deviner « casque » parce que la catégorie vaut 'protection'
    // appliquerait à une combinaison une consigne d'écran et de mentonnière, et
    // l'appel serait facturé quand même : 0,16 € pour un rendu inutilisable.
    //
    // ⚠ ET LE MESSAGE DÉSIGNE LE GESTE, PARCE QU'IL EXISTE MAINTENANT.
    // Il n'en désignait aucun dans sa première version, et c'était juste à ce
    // moment-là : aucun écran ne permettait de dire ce qu'était une pièce, et
    // désigner un geste absent est la promesse contradictoire que le panneau de
    // fabrication a déjà payée une fois (Refaire.tsx). Le sélecteur « Ce que
    // c'est » est juste au-dessus, sur cette même ligne — le refus cesse donc
    // d'être une impasse polie et redevient ce qu'il doit être : un détour de
    // deux secondes avant de dépenser.
    if (!genre) {
      setSouci("Dis d'abord si c'est un casque ou une combinaison, juste au-dessus. "
        + "La fabrique dessine l'un ou l'autre et ne devine pas : un portrait payé sur le "
        + "mauvais dessin ne se rattrape pas. Rien n'est parti, et rien n'a été décompté.")
      return
    }
    setEnCours(true); setSouci(null); setCandidat(null)
    const issue = await genererPortrait(db, { equipementId: e.id, genre }, f)
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

      {/* ⚠ `puces` SEUL, ET SURTOUT PAS `rang puces` — 2 septembre 2026, rapporté
          depuis le téléphone : « les boutons casque combinaison ne fonctionnent
          pas, et même pas très pratique ». Ils fonctionnaient ; c'est la mise en
          page qui mentait. `.rang` porte `justify-content: space-between` et il
          est déclaré APRÈS `.puces` dans la feuille, donc il gagne : les deux
          puces partaient aux deux bords opposés de l'écran, à 250 px l'une de
          l'autre. Deux choix qui s'excluent doivent se toucher — écartés, ils se
          lisent comme deux boutons sans rapport, et le doigt traverse l'écran
          pour corriger. C'est le seul endroit du produit qui cumulait les deux
          classes, et c'est le seul qui était rapporté comme cassé.

          ⚠ ET LA PHRASE N'EST PLUS ICI. Elle était rendue SOUS CHAQUE pièce de
          protection : trois pièces, trois fois la même explication, plus trois
          fois son titre. Elle est dite une fois pour le groupe, plus haut — une
          règle qui vaut pour toutes les pièces se dit à l'endroit qui les tient
          toutes. Le groupe `role`/`aria-label` garde ce que le titre disait à
          qui n'a pas l'écran sous les yeux. */}
      {e.categorie === 'protection' && (
        <div className="puces" role="group" aria-label="Ce que c'est">
          {GENRES_DE_TENUE.map(([g, mot]) => (
            <button key={g} type="button" className="puce" disabled={genreOccupe}
                    data-actif={genre === g ? '1' : '0'} aria-pressed={genre === g}
                    onClick={() => void poserGenre(genre === g ? null : g)}>
              {mot}
            </button>
          ))}
        </div>
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
  /** Ce que la pièce EST, choisi ici plutôt qu'après coup. `null` reste l'état
   *  normal : la plupart des protections ne sont ni un casque ni une
   *  combinaison — une dorsale, des gants, des bottes n'ont pas de genre. */
  const [genre, setGenre] = useState<GenreDeTenue | null>(null)
  const [poser, occupe] = useGeste(async () => {
    if (!nom.trim()) return
    await declarerEquipement(db, {
      nom, categorie, genre,
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

      {/* ⚠ LE GENRE SE POSE ICI, AU MOMENT OÙ ON LE SAIT — 3 septembre 2026.
          Il ne se posait qu'APRÈS, sous la pièce déjà déclarée : il fallait
          valider, retrouver la ligne dans l'inventaire, puis taper une puce.
          Deux gestes séparés par une lecture, pour un fait qu'on a en tête au
          moment où l'on tape le nom.

          ⚠ ET IL RESTE FACULTATIF, DONC SANS DÉFAUT. Aucune des deux puces n'est
          allumée à l'ouverture, et c'est l'état juste : une dorsale, des gants,
          des bottes sont des protections sans genre, et pré-cocher « casque »
          en ferait des casques par distraction. Taper la puce active la retire,
          comme sous la pièce — un seul geste à connaître, aux deux endroits. */}
      {categorie === 'protection' && (
        <>
          <div className="libelle">Ce que c'est · facultatif</div>
          <div className="puces" role="group" aria-label="Ce que c'est">
            {GENRES_DE_TENUE.map(([g, mot]) => (
              <button key={g} type="button" className="puce"
                      data-actif={genre === g ? '1' : '0'} aria-pressed={genre === g}
                      onClick={() => setGenre(genre === g ? null : g)}>
                {mot}
              </button>
            ))}
          </div>
        </>
      )}
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
