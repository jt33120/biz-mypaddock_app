import { useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import type { Courbe as Chrono } from '../db/courbe'
import {
  anneesAvecMatiere,
  courbesDesCircuits, domainesDe, formeRendue, tracesDisponibles, tracesDuDomaine,
  NOM_DOMAINE, TOUTES_ANNEES, type Axe, type Domaine, type Trace,
} from '../db/analyse'
import { Barres } from './Barres'
import { Courbe, Suite } from './Courbe'

/**
 * L'ANALYSE — UN LIEU, TROIS RANGÉES DE PUCES, UNE PHRASE DE TROIS MOTS.
 *
 * Le pilote apprend une seule phrase — DOMAINE · AXE · PÉRIODE — et elle vaut
 * pour tous les tracés du produit. C'est tout l'intérêt d'un lieu unique : onze
 * croisements derrière une grammaire, plutôt que onze écrans à retrouver.
 *
 * ═══ ① LES TROIS DOMAINES SONT DES PRÉOCCUPATIONS, PAS DES MESURES ═════════
 *
 * MAINTENANCE · FINANCE · PERFORMANCE. Le découpage vient du propriétaire du
 * produit, et il est meilleur que « argent · chrono · roulages » qu'un panel
 * avait proposé : celui-là nommait des MESURES, donc le pilote devait déjà
 * savoir dans quelle unité vivait sa question. Ceux-ci nomment ce qui l'occupe —
 * est-ce que ma moto suit, est-ce que ça me coûte, est-ce que j'avance — et ils
 * sont ORTHOGONAUX à Garage et Roulages, qui sont des OBJETS. On ouvre le garage
 * pour agir sur une machine, on ouvre l'analyse pour regarder une question.
 *
 * ═══ ② LA FORME EST DÉDUITE DE L'AXE, JAMAIS CHOISIE ═══════════════════════
 *
 * Il n'y a PAS de troisième molette « barres ou courbe ». C'est la table des
 * croisements qui tranche — composition, suite, chrono — une fois pour toutes,
 * y compris la règle « sous trois points, une suite se rend en barres ». Offrir
 * le choix de la forme, ce serait offrir de relier huit postes qui n'ont aucun
 * ordre entre eux.
 *
 * ═══ ③ CET ÉCRAN NE DESSINE RIEN, ET IL NE CALCULE RIEN ═══════════════════
 *
 * Aucun `<svg>` ici : le jeu d'icônes tient tout le SVG du produit, et un essai
 * unitaire refuse qu'un écran en pose un à lui — c'est la garde qui empêche
 * l'assemblage de se reconstituer icône par icône. Aucun mot non plus : le mot
 * de la puce, la phrase de lecture, la note, la complétude et la phrase de
 * l'argent non compté viennent TOUS de `src/db/analyse.ts`. Un mot recopié est
 * un mot qui diverge. L'écran CHOISIT et ALIMENTE `<Barres>`, `<Suite>` ou
 * `<Courbe>`, et c'est tout ce qu'il fait.
 *
 * ═══ ④ LES RANGÉES SE RECOMPOSENT — C'EST LE CRITÈRE DU PREMIER JOUR ═══════
 *
 * Un domaine sans matière n'apparaît pas ; un axe sans matière non plus. Aucun
 * gris, aucun « bientôt », aucun croisement mort. Un pilote qui a UN roulage et
 * UNE dépense doit voir un écran plein de ce qu'il a, jamais le squelette de ce
 * qu'il n'a pas — c'est ce qui décide si ce lieu vaut quelque chose avant la
 * dixième journée, et un écran vide signale l'abandon dans ce produit (FR-14).
 *
 * ⚠ ET UNE RANGÉE QUI N'OFFRE PAS DE CHOIX N'EST PAS UNE RANGÉE. Elle
 * disparaît, exactement comme les années de `Saison.tsx` ne s'affichent qu'à
 * partir de deux : une puce unique, toujours active, est un bouton qui appelle
 * le doigt et ne fait rien. La phrase de lecture au-dessus du tracé dit de toute
 * façon ce qu'on regarde, en toutes lettres.
 */

/**
 * L'ÉTAT DE DÉPART, quand une porte pré-réglée ouvre l'analyse.
 *
 * Des raccourcis mènent ici depuis ailleurs dans le produit, et chacun sait déjà
 * quelle question il pose : ils pré-tournent les DEUX PREMIÈRES molettes. La
 * PÉRIODE n'en fait pas partie — elle vaut la saison la plus récente, comme
 * partout ailleurs.
 *
 * ⚠ C'EST UN POINT DE DÉPART, PAS UNE LAISSE. Une fois l'écran ouvert, le pilote
 * tape où il veut et ses taps gagnent. C'est pour ça que l'effet dépend des deux
 * CHAMPS et pas de l'objet : un parent qui se rend à nouveau fabrique un objet
 * neuf à chaque rendu, et l'écran ramènerait le pilote à la case départ à chaque
 * respiration de son parent — invisible en lecture, infernal au doigt.
 *
 * ⚠ ET UN DÉPART QUI DÉSIGNE UN CROISEMENT SANS MATIÈRE NE CASSE RIEN : la
 * dérivation retombe sur le premier domaine et le premier axe VIVANTS. Une porte
 * ne peut donc jamais ouvrir sur du vide.
 */
export type DepartAnalyse = {
  domaine: Domaine
  axe: Axe
  /** ⚠ LA PÉRIODE VOYAGE AVEC LA PORTE, et sans elle la porte ouvrait ailleurs
   *  qu'où elle promettait. Les faits qui décident d'OFFRIR une porte sont
   *  mesurés sur toutes les saisons (`aDeQuoiAnalyser`, src/App.tsx) ; ouvrir sur
   *  la saison la plus récente faisait porter le garde et le contenu sur deux
   *  périodes différentes. Un pilote qui a acheté des pneus en 2025 et rien en
   *  2026 voyait la porte au garage, tapait, et atterrissait sur une saison sans
   *  matière — indistinguable d'un lien cassé.
   *
   *  Chaque porte dit donc la sienne, et elle n'est pas la même partout : le
   *  garage annonce « saison par saison » et ouvre sur TOUTES ; le bilan d'une
   *  saison ouvre sur CETTE saison, parce que c'est celle qu'on regardait. */
  periode?: readonly number[]
}

/**
 * ⚠ LE CHOIX ET SA LECTURE SONT UN SEUL OBJET, et c'est ce qui interdit au titre
 * de mentir. La période est un état du DOIGT (la puce vient d'être tapée), les
 * tracés sont un état de la BASE (la lecture vient de rendre) : gardés en deux
 * états, le temps d'une lecture, la phrase annonçait « ta saison 2026 » au-dessus
 * des chiffres de 2025. Ici la phrase se compose toujours avec la période qui a
 * SERVI à lire — un dessin qui contredit sa légende est pire qu'un dessin sans
 * légende, et une légende qui contredit son dessin ne vaut pas mieux.
 */
type Lu = { periode: readonly number[]; traces: readonly Trace[] }

export function Analyse({ db, depart }: {
  db: PowerSyncDatabase
  depart?: DepartAnalyse
}) {
  const [annees, setAnnees] = useState<number[] | null>(null)
  /** Le tableau VIDE veut dire « toutes les saisons » — voir `TOUTES_ANNEES`. */
  const [periode, setPeriode] = useState<readonly number[]>(TOUTES_ANNEES)
  const [lu, setLu] = useState<Lu | null>(null)
  const [domaine, setDomaine] = useState<Domaine | null>(depart?.domaine ?? null)
  const [axe, setAxe] = useState<Axe | null>(depart?.axe ?? null)
  const [chronos, setChronos] = useState<readonly Chrono[]>([])

  useEffect(() => {
    // ⚠ LES ANNÉES VIENNENT DE `anneesAvecMatiere`, PAS DE `anneesSaisies`. La
    // seconde ne lit que la table `roulage` — juste pour le bilan de saison, qui
    // parle de journées, faux ici : une année qui porte de l'argent ou des gestes
    // sans aucune journée vécue n'aurait eu aucune puce, donc aucun moyen d'être
    // atteinte, alors que la porte de l'onglet, elle, l'avait vue.
    //
    // ⚠ ET UNE PORTE PRÉ-RÉGLÉE IMPOSE SA PÉRIODE — voir `DepartAnalyse`. Sans
    // elle, la porte ouvrait sur la saison la plus récente alors que les faits
    // qui l'ont offerte étaient mesurés sur toutes : le garde et le contenu
    // portaient sur deux périodes différentes.
    void anneesAvecMatiere(db).then((l) => {
      setAnnees(l)
      setPeriode(depart?.periode ?? (l.length ? [l[0]] : TOUTES_ANNEES))
    })
  }, [db])

  const departDomaine = depart?.domaine ?? null
  const departAxe = depart?.axe ?? null
  useEffect(() => {
    if (departDomaine) setDomaine(departDomaine)
    if (departAxe) setAxe(departAxe)
  }, [departDomaine, departAxe])

  // ⚠ ON ATTEND QUE LES ANNÉES SOIENT LUES. Sans ce garde, la première lecture
  // partirait sur « toutes » puis une seconde sur la saison — deux fois onze
  // requêtes, et un écran qui change sous le doigt sans qu'on ait touché à rien.
  useEffect(() => {
    if (annees === null) return
    let vif = true
    void tracesDisponibles(db, periode)
      .then((traces) => { if (vif) setLu({ periode, traces }) })
    return () => { vif = false }
  }, [db, annees, periode])

  const traces = lu?.traces ?? []
  const domaines = domainesDe(traces)

  // ⚠ LE CHOIX SE DÉRIVE, IL NE SE RÉPARE PAS. Recaler `domaine` et `axe` dans un
  // effet à chaque changement de période ferait exister, le temps d'un rendu, un
  // couple impossible — un domaine disparu, un axe d'un autre domaine — et c'est
  // ce rendu-là qui pose un titre sous un tracé qui dit autre chose. L'état
  // retenu n'est qu'une PRÉFÉRENCE ; ce qui s'affiche se recalcule toujours
  // depuis ce qui vit.
  const domaineChoisi = domaine && domaines.includes(domaine) ? domaine : (domaines[0] ?? null)
  const duDomaine = domaineChoisi ? tracesDuDomaine(traces, domaineChoisi) : []
  const trace = duDomaine.find((t) => t.croisement.axe === axe) ?? (duDomaine[0] ?? null)

  // ⚠ LA FORME EST CELLE DE LA TABLE, REPOSÉE SUR LE NOMBRE DE LIGNES RENDUES.
  // `lire` a DÉJÀ tranché sur les pas réellement placés — elle comble les mois et
  // sort les orphelines AVANT d'appeler `formeRendue`, et son propre commentaire
  // le dit. On la repose ici parce que c'est idempotent et qu'un écran qui
  // vérifie ne doit pas pouvoir se tromper, pas parce que `lire` aurait tort.
  // (Une version de ce commentaire accusait `lire` de trancher sur les lignes
  //  brutes. C'était faux, et un commentaire qui envoie « réparer » du code juste
  //  coûte plus qu'un commentaire absent.)
  const forme = trace ? formeRendue(trace.forme, trace.lignes.length) : null

  useEffect(() => {
    if (forme !== 'chrono') return
    let vif = true
    void courbesDesCircuits(db).then((l) => { if (vif) setChronos(l) })
    return () => { vif = false }
  }, [db, forme])

  // Rien n'est encore lu, ou rien n'a de matière : l'écran ne se monte pas. Pas
  // de cadre en attente, pas de gris, pas de « bientôt ».
  if (!lu || !annees || !trace || !forme) return null

  const { croisement } = trace
  const lecture = croisement.phrase(lu.periode)
  const description = croisement.note

  // ⚠ LE CADRE DU CHOIX DISPARAÎT AVEC SES RANGÉES. Il porte le filet qui sépare
  // ce qu'on choisit de ce qu'on lit : le garder quand les trois rangées se sont
  // tues dessinerait un trait de séparation au-dessus de rien — et c'est
  // exactement l'écran du pilote qui a un roulage et une dépense.
  const choix = domaines.length > 1 || duDomaine.length > 1 || annees.length > 1

  return (
    <div className="pile analyse-ecran">
      {choix && (
        <div className="pile analyse-choix">
          {domaines.length > 1 && (
            <div className="puces" role="group" aria-label="Domaine">
              {domaines.map((d) => (
                // Changer de domaine NE REMET PAS l'axe à zéro : si le nouveau
                // domaine connaît le même axe — « Mois » existe dans les trois —
                // le pilote y reste et compare deux préoccupations sur le même
                // découpage sans re-taper. Sinon la dérivation prend le premier
                // axe vivant du domaine.
                <button key={d} className="puce" data-actif={d === domaineChoisi ? '1' : '0'}
                        onClick={() => setDomaine(d)}>{NOM_DOMAINE[d]}</button>
              ))}
            </div>
          )}

          {duDomaine.length > 1 && (
            <div className="puces" role="group" aria-label="Selon quoi">
              {/* UN MOT PAR PUCE, et la préposition vit dans la phrase de
                  lecture — « Poste », pas « par poste ». C'est ce qui garde la
                  rangée sur une ligne à 375 px, et c'est la table qui l'écrit. */}
              {duDomaine.map((t) => (
                <button key={t.croisement.axe} className="puce"
                        data-actif={t.croisement.axe === croisement.axe ? '1' : '0'}
                        onClick={() => setAxe(t.croisement.axe)}>{t.croisement.mot}</button>
              ))}
            </div>
          )}

          {/* LA PÉRIODE N'APPARAÎT QU'À PARTIR DE DEUX SAISONS, exactement la
              règle de `Saison.tsx`. En 2026 elle coûte zéro pixel au pilote qui
              vient de commencer : il n'a pas à choisir entre une seule chose.

              ⚠ ET ELLE DISPARAÎT SOUS LE CHRONO. La progression se lit sur toute
              son histoire — `courbesDesCircuits` n'a aucun paramètre d'année et
              `lire` court-circuite la période pour cette forme. La rangée y
              restait pourtant affichée : le pilote tapait une saison, la puce
              s'allumait, et le dessin ne bougeait pas d'un pixel. Un bouton qui
              appelle le doigt et ne fait rien est exactement ce que les deux
              autres rangées s'interdisent en disparaissant sous un seul choix. */}
          {annees.length > 1 && forme !== 'chrono' && (
            <div className="puces" role="group" aria-label="Période">
              {annees.map((a) => (
                <button key={a} className="puce"
                        data-actif={periode.length === 1 && periode[0] === a ? '1' : '0'}
                        onClick={() => setPeriode([a])}>{a}</button>
              ))}
              {/* « TOUTES » n'est pas la liste des années : c'est le tableau
                  vide, la seule valeur qui ne se confonde avec aucune saison —
                  et l'axe ANNÉE n'existe que sous elle (`TOUTES_ANNEES`). */}
              <button className="puce" data-actif={periode.length === 0 ? '1' : '0'}
                      onClick={() => setPeriode(TOUTES_ANNEES)}>TOUTES</button>
            </div>
          )}
        </div>
      )}

      {/* FR-55 — LA COMPLÉTUDE D'ABORD, comme au bilan de saison, et pour la
          même raison : elle empêche les longueurs qui suivent de prétendre à une
          exactitude que leur source n'a pas. Puis l'argent que ce tracé-ci ne
          voit pas — la table sait lequel des croisements doit le dire, et lequel
          mentirait en le disant (l'axe MOTO additionne déjà l'atelier). */}
      {trace.manque && <p className="note">{trace.manque}</p>}
      {trace.nonCompte && <p className="note">{trace.nonCompte}</p>}

      {forme === 'composition' && (
        <Barres titre={lecture} barres={enBarres(trace)} description={description} />
      )}

      {forme === 'suite' && (
        <Suite titre={lecture} lignes={trace.lignes} description={description} />
      )}

      {/* LE CHRONO GARDE SA COURBE, ET SA COURBE GARDE SON CIRCUIT. Un tracé par
          circuit, jamais un tracé de tous : « 1'38 à Pau-Arnos » et « 1'38 à
          Nogaro » ne se comparent pas. `Courbe` ne prend pas de titre — elle pose
          déjà le sien, circuit compris — donc c'est l'écran qui pose la phrase de
          lecture au-dessus du lot, comme `Barres` et `Suite` posent la leur. */}
      {forme === 'chrono' && (
        <>
          <span className="sous-titre">{lecture}</span>
          {description && <p className="note">{description}</p>}
          {chronos.map((c) => <Courbe key={c.circuit} d={c} />)}
        </>
      )}
    </div>
  )
}

/**
 * ⚠ LA SEULE CONVERSION DE CET ÉCRAN, ET CE QU'ELLE FAIT EXACTEMENT.
 *
 * `Suite` reçoit les `LigneAnalyse` telles quelles. `Barres` vient du tracé de
 * l'argent : sa `Barre` mesure la longueur sur `centimes`, un nom qui dit son
 * origine. La ligne passe donc ENTIÈRE — `cle` comprise, qui la clef —, avec
 * `centimes` recopié depuis `valeur` pour cette longueur-là.
 *
 * Ce qui NE se convertit pas, c'est le TEXTE de la valeur : `Barres` lit
 * `libelle` et ne formate rien quand il est fourni. Trois croisements comptent
 * des GESTES et des JOURNÉES, pas des euros ; sans ce champ ils sortiraient
 * « 0,03 € » pour trois interventions, avec l'aplomb d'un montant. La seule
 * couche qui connaisse l'unité l'écrit (src/db/analyse.ts), et le tracé n'a rien
 * à deviner.
 */
const enBarres = (trace: Trace) => trace.lignes.map((l) => ({ ...l, centimes: l.valeur }))
