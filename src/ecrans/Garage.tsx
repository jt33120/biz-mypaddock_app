import { useCallback, useEffect, useRef, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  ajouterSession, anneeSaison, bilanMachine, creerMachine, creerRoulage, enCentimes,
  formaterChrono, formaterEuros, listerMachines, modifierMachine, poserSprite,
  type BilanMachine, type Machine,
} from '../db/depot'
import { Budget, Equipement } from './Budget'
import { useGeste } from './geste'
import { Trophee } from './Trophee'
import { photoMachine, verserPhotoMachine } from '../db/photos'
import { genererPortrait } from '../pixel/portrait'
import type { Sprite } from '../pixel/spritifier'
import { Atelier } from './Atelier'
import { Poste } from './Poste'
import { Refaire } from './Refaire'
import type { Categorie } from '../db/atelier'
import { SPRITE_CBR83 } from '../assets/sprite-cbr83'
import { aujourdhui } from '../db/vecu'

/**
 * Le garage — l'axe machine d'AD-2 gagne enfin une surface.
 *
 * Deux règles de conception y sont tenues, et elles se voient :
 *   — une machine SANS sprite reste pleinement une machine : la scène existe quand même et
 *     montre une silhouette. Le garage n'exige jamais une photo pour fonctionner.
 *   — c'est la MACHINE qui monte en niveau, jamais le pilote : tous les chiffres affichés
 *     portent sur l'objet — ses roulages, son meilleur tour, le circuit où elle va le plus.
 *
 * ⚠ CETTE LIGNE NOMMAIT « ses kilomètres, ses roulages, ce qu'elle a coûté », et
 * deux de ses trois exemples étaient faux. Aucun kilométrage n'a jamais existé :
 * ni colonne, ni saisie, ni affichage. Et « ce qu'elle a coûté » a été retiré des
 * trois cases sur la proposition de Julian, remplacé par « circuit favori » — le
 * raisonnement est plus bas, à sa place. Le commentaire, lui, avait gardé
 * l'ancienne liste : il décrivait un garage qui n'existe plus, et il le décrivait
 * avec l'aplomb d'une règle.
 */
export function Garage({ db, onEcrit, onArgentParMoto }: {
  db: PowerSyncDatabase
  /** Le garage écrit des roulages et des machines : sans ce rappel, le reste de
   *  l'application ne le savait pas et la liste des roulages restait vide.
   *  Trouvé par l'essai, pas par la relecture — un écran qui ne se rafraîchit
   *  pas ne se signale jamais. */
  onEcrit: () => void
  /** LA PORTE VERS L'ANALYSE, PRÉ-RÉGLÉE SUR FINANCE · MOTO — 1er septembre
   *  2026. C'est un LIEN et jamais un nombre : voir le commentaire des trois
   *  cases plus bas, qui dit pourquoi « ce qu'elle a coûté » en est sorti.
   *
   *  `null` quand aucune dépense n'est saisie — App.tsx le retire alors, plutôt
   *  que d'offrir un lien vers une répartition qui n'a rien à répartir. */
  onArgentParMoto: (() => void) | null
}) {
  const [machines, setMachines] = useState<Machine[]>([])
  const [actif, setActif] = useState(0)
  const [bilan, setBilan] = useState<BilanMachine | null>(null)
  const [corriger, setCorriger] = useState(false)
  /** Le poste d'atelier ouvert EN PAGE. Non nul = le garage cède l'écran. */
  const [poste, setPoste] = useState<Categorie | null>(null)
  /** Un compteur, pas un booléen : « X machine et si je clique je peux aller
   *  sur mon équipement ». Un booléen déjà vrai ne rappellerait rien au second
   *  tap, et un pilote qui tape deux fois s'attend deux fois à arriver. */
  const [versEquipement, setVersEquipement] = useState(0)
  // Le portrait de jeu — récit 3bis.3. Le CANDIDAT n'est rien tant qu'il n'est
  // pas gardé : c'est ce qui rend « le pixel est une présentation, jamais un
  // remplacement destructif » vrai dans le code et pas seulement dans le texte.
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [candidat, setCandidat] = useState<Sprite | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [souci, setSouci] = useState<string | null>(null)
  const fichier = useRef<HTMLInputElement>(null)

  const charger = useCallback(async () => {
    const m = await listerMachines(db)
    setMachines(m)
    setActif((a) => Math.min(a, Math.max(0, m.length - 1)))
  }, [db])
  useEffect(() => { void charger() }, [charger])

  const machine = machines[actif]
  useEffect(() => {
    if (!machine) { setBilan(null); return }
    void bilanMachine(db, machine.id).then(setBilan)
  }, [db, machine])

  // La photo se sert TOUJOURS depuis la copie locale : une photo « en attente
  // d'envoi » ne peut pas être une photo absente à l'écran (FR-10, NFR-7).
  useEffect(() => {
    setCandidat(null); setSouci(null)
    let vivant = true
    void photoMachine(machine?.photo_chemin ?? null).then((f) => {
      if (!vivant) return
      setPhotoUrl((a) => { if (a) URL.revokeObjectURL(a); return f ? URL.createObjectURL(f) : null })
    })
    return () => { vivant = false }
  }, [machine])

  const verser = async (f: File) => {
    if (!machine) return
    setSouci(null)
    await verserPhotoMachine(db, machine.id, f)
    await charger(); onEcrit()
  }

  const fabriquer = async () => {
    if (!machine) return
    const f = await photoMachine(machine.photo_chemin)
    // ⚠ CE `return` ÉTAIT MUET, et c'était le pire endroit du produit pour se
    // taire. `machine.photo_chemin` est une COLONNE : elle se synchronise, donc
    // elle est vraie sur le second téléphone et après une réinstallation. Les
    // OCTETS, eux, ne partent jamais au stockage objet — `verserPhotoMachine`
    // n'écrit qu'en local. Le pilote validait donc une dépense annoncée à
    // 0,16 €, et l'écran ne bougeait pas d'un pixel. Il retapait.
    // Le bouton ne s'offre plus dans ce cas (voir plus bas), et si l'on y
    // arrive quand même, l'écran dit ce qui manque et où le reprendre.
    if (!f) {
      setSouci("La photo de cette moto n'est pas sur ce téléphone — elle a été prise ailleurs. "
        + 'Elle se repose ici avec « Remplacer la photo de la moto », et le portrait se '
        + 'fabrique à partir d\'elle.')
      return
    }
    setEnCours(true); setSouci(null); setCandidat(null)
    // Le sujet est NOMMÉ, il n'est plus un `string` nu : le serveur choisit
    // désormais son prompt d'après lui, et un identifiant tout seul ne dit pas
    // s'il désigne une moto ou un casque.
    const issue = await genererPortrait(db, { machineId: machine.id }, f)
    setEnCours(false)
    if (issue.ok) setCandidat(issue.sprite)
    else setSouci(issue.message)
  }

  const garder = async () => {
    if (!machine || !candidat) return
    // « Calculé une fois et CONSERVÉ » : il passe par le chemin d'écriture
    // normal, local d'abord, et le garage ne le recalculera jamais.
    await poserSprite(db, machine.id, candidat.dataUri)
    setCandidat(null)
    await charger(); onEcrit()
  }

  // Reprise explicite, jamais silencieuse : le pilote voit ce qu'il importe et pourquoi.
  const importerCbr = async () => {
    // 2010, corrigé par Julian. Elle était entrée à 2012 — et personne ne
    // pouvait s'en rendre compte, l'année n'apparaissait nulle part à l'écran.
    await creerMachine(db, { marque: 'Honda', modele: 'CBR 1000 RR · 83', annee: 2010, sprite: SPRITE_CBR83 })
    await charger(); onEcrit()
  }

  /**
   * La saison 2026 de Julian, telle qu'il l'a dictée : quatre roulages à
   * Pau-Arnos, 2'10 puis 1'52 puis 1'42 puis 1'38, et le prochain en septembre.
   *
   * ⚠ ELLE PASSE PAR LE CHEMIN D'ÉCRITURE NORMAL, pas par une injection dans le
   * serveur. Les identifiants sont des UUID v7 posés ici, les instruments
   * marquent l'ouverture, la synchronisation la reprend comme le reste. Une
   * donnée entrée par une porte dérobée est une donnée qu'aucune règle n'a
   * traversée.
   *
   * Les JOURS sont choisis (des samedis) — les mois viennent de lui, pas les
   * dates exactes. À corriger d'un mot si l'un est faux.
   */
  const importerSaison = async () => {
    const saison: [string, number][] = [
      ['2026-04-18', 130_000],   // 2'10
      ['2026-06-20', 112_000],   // 1'52
      ['2026-07-18', 102_000],   // 1'42
      ['2026-08-15', 98_000],    // 1'38
    ]
    const m = machines[0]
    for (const [date, ms] of saison) {
      const id = await creerRoulage(db, {
        circuit: 'Pau-Arnos', date, groupeNom: null, rang: null, total: null,
        machineId: m?.id ?? null,
      })
      await ajouterSession(db, id, ms)
    }
    // Le prochain roulage n'a pas de chrono : il n'a pas encore eu lieu. C'est
    // lui qui prend la tête de l'accueil temporel.
    await creerRoulage(db, {
      circuit: 'Pau-Arnos', date: '2026-09-19', groupeNom: null, rang: null, total: null,
      machineId: m?.id ?? null,
    })
    await charger(); onEcrit()
  }

  if (!machines.length) {
    return (
      <section className="garage vide">
        <p className="libelle">garage</p>
        <h1 className="titre">Aucune moto</h1>
        <p className="texte">
          Le garage est le centre du produit : le roulage s'y rattache, l'entretien s'y rattache,
          l'usure s'y lit. Une moto se crée sans photo — le portrait vient après, s'il vient.
        </p>
        {/* ⚠ LE SEUL BOUTON D'ICI CRÉAIT LA HONDA DE JULIAN, EN DUR. Un inconnu
            n'avait aucun moyen d'entrer sa propre moto : le garage restait vide
            ou portait une machine qui n'était pas la sienne. Trouvé par une
            passe adverse sur le parcours d'un premier utilisateur. */}
        <Declarer onValider={async (m) => { await creerMachine(db, { ...m, sprite: null })
          await charger(); onEcrit() }} />
        <button className="lien" onClick={() => void importerCbr()}>
          Reprendre la CBR 83 de l'essai
        </button>

        {/* ⚠ LE BUDGET ET L'ÉQUIPEMENT EXISTENT SANS MACHINE, et les enfermer
            dans la branche « au moins une moto » était une erreur de rangement
            qui les rendait carrément inatteignables — trouvée sur une capture,
            pas à la relecture.

            L'équipement est DÉFINI par le fait de ne pas dépendre d'une machine :
            « tout ce qui est nécessaire à une journée circuit mais sans être
            spécifique à une machine ». Exiger une moto pour déclarer une
            combinaison contredit sa définition même. Et un budget existe dès la
            première inscription payée, avant qu'aucune moto ne soit déclarée. */}
        <Budget db={db} annee={anneeSaison(aujourdhui())}
                machineId={null} onEcrit={onEcrit} />
        <Equipement db={db} onEcrit={onEcrit} />
      </section>
    )
  }

  // LA PAGE D'UN POSTE PREND TOUT L'ÉCRAN. Elle ne se superpose pas au garage :
  // un poste d'atelier est un lieu, pas un tiroir, et c'est ce que demandait
  // « une page à part entière ».
  if (poste) {
    return (
      <Poste db={db} machine={machine} categorie={poste}
             onFermer={() => setPoste(null)}
             onEcrit={() => { void charger(); onEcrit() }} />
    )
  }

  return (
    <section className="garage">
      {/* ⚠ LE COMPTEUR DE MACHINES MÈNE À L'ÉQUIPEMENT — « en haut à droite : X
          machine, et si je clique je peux aller sur mon équipement ».

          Il y a une logique de rangement derrière : le garage contient DEUX
          inventaires, les motos et ce qui n'appartient à aucune moto. Le second
          vivait tout en bas, après l'atelier, l'usure et le budget — donc
          introuvable. La tête du garage est l'endroit où l'on compte ce qu'on
          possède ; c'est de là qu'on doit atteindre l'autre inventaire. */}
      <header className="garage-tete">
        <p className="libelle">garage</p>
        <button className="lien tete-inventaire"
                onClick={() => setVersEquipement((n) => n + 1)}>
          <b>{machines.length}</b> moto{machines.length > 1 ? 's' : ''} · équipement ›
        </button>
      </header>

      {machines.length > 1 && (
        <nav className="onglets">
          {machines.map((m, i) => (
            <button key={m.id} className={`onglet ${i === actif ? 'actif' : ''}`}
                    onClick={() => setActif(i)}>{m.modele}</button>
          ))}
        </nav>
      )}

      {/* L'ANNÉE EST UNE DONNÉE D'IDENTITÉ, pas une décoration : c'est elle qui
          désigne le barème d'entretien de cette moto-là. Elle était saisie à la
          déclaration et n'apparaissait NULLE PART ensuite — donc invérifiable,
          donc fausse en silence : la CBR de Julian est entrée en 2012 alors
          qu'elle est de 2010. Elle s'affiche, et elle se corrige. */}
      <div className="garage-titre">
        <p className="marque">{machine.marque}{machine.annee ? ` · ${machine.annee}` : ''}</p>
        <h1 className="modele">{machine.modele}</h1>
        {/* ⚠ CE QUI SE SAISIT DOIT SE LIRE. L'année a passé une semaine dans la
            base sans jamais apparaître à l'écran, donc fausse sans que personne
            ne puisse s'en apercevoir. Le prix d'achat ne refera pas le même
            chemin : il s'affiche là où il a été saisi. */}
        {machine.prix_achat_centimes != null && (
          <p className="sous-titre">
            achetée {formaterEuros(machine.prix_achat_centimes)}
            {machine.achetee_le ? ` · ${machine.achetee_le.replace('-', '/')}` : ''}
          </p>
        )}
        {/* ⚠ DEUX GESTES CÔTE À CÔTE, ET ILS N'ONT PAS LE MÊME PRIX. Modifier
            est gratuit et réversible ; refaire un portrait appelle le serveur et
            se paie. Ils voisinent parce que c'est le même endroit qu'on ouvre
            quand on veut corriger sa moto — « le bouton refaire à côté de
            modifier la moto » — mais le second passe par une annonce de coût, et
            c'est cette annonce, pas la place, qui empêche le tap accidentel.

            ⚠ ET LE BOUTON DU PORTRAIT NE S'AFFICHE QUE S'IL Y A UNE PHOTO : la
            fabrique part d'elle. Sans photo, c'est « Photographier la moto »,
            sous la scène, qui est le geste suivant — et lui ne coûte rien.

            ⚠ UNE PHOTO RELUE, PAS UNE COLONNE. Il s'affichait sur
            `machine.photo_chemin`, qui SE SYNCHRONISE — alors que les octets,
            eux, restent sur le téléphone qui a pris la photo. Sur un second
            appareil ou après une réinstallation, la colonne dit « il y a une
            photo » et le fichier n'existe pas : le bouton proposait de payer
            0,16 € pour fabriquer à partir de rien. `photoUrl` est la photo
            réellement lue ici, et un chemin qui ne peut pas aboutir ne doit pas
            s'offrir. */}
        <div className="actions-titre">
          <button className="lien" onClick={() => setCorriger(!corriger)}>
            {corriger ? 'Annuler la modification' : machine.annee ? 'Modifier la moto' : "Ajouter l'année"}
          </button>
          {photoUrl && (
            <Refaire aUnPortrait={!!machine.sprite} enCours={enCours}
                     onFabriquer={() => void fabriquer()} />
          )}
        </div>
      </div>

      {corriger && (
        <Declarer machine={machine} onValider={async (m) => {
          await modifierMachine(db, machine.id, m)
          setCorriger(false)
          await charger(); onEcrit()
        }} />
      )}

      {/* TROIS ÉTATS, dans cet ordre de préséance : le portrait de jeu s'il a
          été gardé, la photo réelle sinon, la silhouette en dernier. Une machine
          sans média reste pleinement une machine (AD-2) — le garage n'exige
          jamais une image pour fonctionner. */}
      <div className="scene">
        {machine.sprite
          ? <img className="sprite" src={machine.sprite} alt={`${machine.marque} ${machine.modele}`} />
          : photoUrl
            ? <img className="photo-machine" src={photoUrl} alt={`${machine.marque} ${machine.modele}`} />
            : (
              /* ⚠ UNE ABSENCE SE DIT. Le cadre hachuré tenait la place — AD-2, une
                 machine sans portrait reste une machine — mais il ne disait rien,
                 et c'est l'écran que voit TOUT pilote qui vient de déclarer sa
                 moto. Un grand rectangle vide ne se distingue pas d'une image qui
                 n'a pas chargé.

                 Et les deux objets restent nommés séparément, comme Julian l'a
                 demandé une fois déjà : la PHOTO est la sienne et ne dépend de
                 rien, le PORTRAIT PIXEL se fabrique à partir d'elle. */
              <div className="silhouette" aria-label="moto sans portrait">
                <p className="absente">
                  <b>pas encore d'image</b>
                  Sa photo prendra cette place — elle reste sur ce téléphone.
                  Le portrait pixel, lui, se fabrique à partir d'elle.
                </p>
              </div>
            )}
      </div>

      {/* ⚠ LE MEILLEUR TOUR NOMME SON CIRCUIT. « Ça n'a pas de sens sinon au
          global comme ça » — et c'est plus qu'une imprécision : 1'38 à Pau-Arnos
          et 1'38 à Nogaro ne se comparent pas, donc un chrono sans circuit est
          FAUX, pas incomplet. Le type l'impose désormais, les deux champs sont
          un seul objet.

          ⚠ ET « CIRCUIT FAVORI » A PRIS LA PLACE DE « CE QU'ELLE A COÛTÉ », sur
          la proposition de Julian. Ce n'est pas un troc décoratif : les trois
          cases du garage disent ce que la machine EST — où elle roule, ce
          qu'elle y fait, combien de fois. L'argent, lui, se lit poste par poste
          à l'atelier, où chaque somme porte le geste qui l'a produite. Un total
          en tête d'écran ne se rattache à rien et ne se corrige nulle part. */}
      {/* ⚠ « PAS ENCORE SU » N'EST PAS « ZÉRO », et la version précédente écrivait
          `bilan?.roulages ?? 0`. Tant que la requête n'était pas revenue, le
          garage affichait « roulages 0 · meilleur tour — » : un chiffre FAUX,
          impossible à distinguer d'un vrai zéro. Sur un téléphone, où SQLite
          passe par un worker OPFS, cette fraction de seconde est une seconde
          pleine — c'est-à-dire le temps qu'on regarde l'écran en l'ouvrant.

          Trouvé parce que mon propre essai s'y est laissé prendre une fois sur
          deux : il lisait les chiffres avant qu'ils arrivent et concluait « axe
          machine vide ». Un défaut d'affichage qui trompe un automate trompe un
          humain de la même manière, et l'humain, lui, n'a pas de seconde chance.

          Les trois cases attendent donc ensemble : `…` dit qu'on ne sait pas
          encore, là où `—` dit qu'il n'y a rien à savoir. */}
      <div className="chiffres" data-charge={bilan ? '1' : '0'}>
        <div>
          <p className="et">roulages</p>
          <p className="va">{bilan ? bilan.roulages : '…'}</p>
        </div>
        <div>
          <p className="et">meilleur tour</p>
          {!bilan ? <p className="va">…</p> : bilan.meilleur ? (
            <>
              <p className="va avec-trophee"><Trophee taille={15} />{formaterChrono(bilan.meilleur.ms)}</p>
              <p className="ou">à {bilan.meilleur.circuit}</p>
            </>
          ) : <p className="va">—</p>}
        </div>
        <div>
          <p className="et">circuit favori</p>
          {!bilan ? <p className="va">…</p> : bilan.favori ? (
            <>
              <p className="va" style={{ fontSize: 16 }}>{bilan.favori.nom}</p>
              <p className="ou">{bilan.favori.roulages} journée{bilan.favori.roulages > 1 ? 's' : ''}</p>
            </>
          ) : <p className="va">—</p>}
        </div>
      </div>

      {/* ⚠ L'ARGENT REVIENT ICI, MAIS EN LIEN — ET C'EST TOUTE LA DIFFÉRENCE
          AVEC CE QUI EN A ÉTÉ RETIRÉ. La quatrième case « ce qu'elle a coûté »
          est partie parce qu'« un total en tête d'écran ne se rattache à rien et
          ne se corrige nulle part » : on lisait 2 180 €, on ne savait ni de quoi
          c'était fait ni où le reprendre. Ce lien ne repose donc AUCUN chiffre
          au-dessus des trois cases ; il MÈNE à l'endroit où le montant se
          décompose et où chaque ligne se corrige.

          ⚠ ET IL DIT « CHAQUE MOTO », PAS « CETTE MOTO ». FINANCE · MOTO est une
          COMPOSITION : elle répartit l'argent entre toutes les machines
          déclarées, elle n'isole pas celle qu'on regarde. Écrire « ce que cette
          moto t'a coûté » sur un lien qui en montre trois serait un lien qui ment
          sur sa destination.

          ⚠ ET IL N'EST PAS DANS LA BRANCHE SANS MACHINE. Là-bas il n'y a pas de
          page de moto, donc pas de question à laquelle il répondrait ; le budget
          et l'équipement, eux, y sont déjà — voir plus haut pourquoi. */}
      {onArgentParMoto && (
        <button className="lien" onClick={onArgentParMoto}>
          Ce que chaque moto t'a coûté
        </button>
      )}

      {/* ─── LE PORTRAIT DE JEU — récit 3bis.3 ─────────────────────────── */}
      <input ref={fichier} type="file" accept="image/*" hidden
             onChange={(e) => { const f = e.target.files?.[0]; if (f) void verser(f) }} />

      {candidat ? (
        <div className="bloc pile">
          <div className="libelle">son portrait pixel</div>
          <div className="scene">
            <img className="sprite" src={candidat.dataUri}
                 alt={`${machine.modele} en pixel`} />
          </div>
          <p className="note">
            {candidat.largeur} × {candidat.hauteur} cellules · {candidat.couleurs} couleurs.
            Tant qu'il n'est pas gardé, rien n'a changé dans le garage.
          </p>
          <button className="bouton" onClick={() => void garder()}>Garder ce portrait</button>
          {/* Le quatrième critère du récit, et il n'a rien de cosmétique : le
              refus ne détruit rien — ce qui tenait la scène la reprend.

              ⚠ ET LE LIBELLÉ DIT LEQUEL DES DEUX. Il disait « Revenir à la
              photo » dans tous les cas, alors que la scène retombe sur
              `machine.sprite ? sprite : photoUrl` : quand un portrait était déjà
              gardé, c'est LUI qui revenait — celui-là même qu'on voulait
              remplacer. Le pilote concluait que le bouton n'avait rien fait et
              retapait « Refaire » : 0,16 € et un crédit partis pour un
              malentendu de libellé. Avant que « Refaire » existe, ce cas était
              impossible ; il est devenu le cas courant. */}
          <button className="bouton secondaire" onClick={() => setCandidat(null)}>
            {machine.sprite ? 'Revenir au portrait actuel' : 'Revenir à la photo'}
          </button>
        </div>
      ) : (
        <>
          {/* ⚠ TROIS LIBELLÉS RÉÉCRITS SUR RETOUR DE JULIAN, et les trois disaient
              faux plutôt que flou.

              · « Ajouter sa photo » → « laquelle, la pixélise ? mais si elle
                existe déjà, ce bouton devrait disparaître ? ». Le bouton disait
                « ajouter » alors qu'une image occupait déjà l'écran : c'était le
                PORTRAIT PIXEL qui s'affichait, et la photo, elle, manquait
                vraiment. Deux objets distincts portaient un seul mot. Chacun
                nomme maintenant le sien, et le bouton dit ce qu'il fait de la
                photo qu'on lui donne.

              · « Lui donner sa forme de jeu » ne disait ni ce qui se passe, ni
                que ça coûte de l'argent réel et un crédit sur trois.

              · « Retirer sa forme de jeu » → « je n'ai pas compris, pas clair ce
                que fait ce bouton ». Il disait à quoi l'on revient — et il n'y
                revient plus, voir ci-dessous.

              ⚠ « RETIRER LE PORTRAIT PIXEL » N'EXISTE PLUS — « aucun intérêt de
              le retirer ». Ce qu'il faisait exactement, pour que la perte soit
              écrite et non subie : il posait `sprite = NULL` sur la moto et RIEN
              d'autre. La photo réelle n'a jamais été touchée par lui, et c'est
              elle qui reprenait alors la scène.

              Ce qui n'est donc plus atteignable : revenir à la photo réelle
              quand un portrait a été gardé. La photo, elle, n'est pas perdue —
              elle reste dans le téléphone, elle repart à l'emport (emporter.ts),
              et « Remplacer la photo de la moto » la remplace toujours. Seule sa
              PLACE SUR LA SCÈNE est prise tant qu'un portrait existe, et refaire
              le portrait est désormais le geste qui la reprend.

              ⚠ ET LES DEUX BOUTONS S'EXCLUAIENT : le retrait n'apparaissait
              qu'avec un sprite, la fabrication qu'avec une photo ET sans sprite.
              Refaire un portrait raté demandait donc de l'effacer d'abord. Un
              seul bouton les remplace, en tête d'écran, et il annonce son coût
              avant d'appeler. */}
          <button className="lien" onClick={() => fichier.current?.click()}>
            {machine.photo_chemin ? 'Remplacer la photo de la moto' : 'Photographier la moto'}
          </button>
        </>
      )}
      {souci && <p className="mot-erreur">{souci}</p>}

      {/* L'ATELIER — épique 8. Il vit DANS le garage parce que c'est la machine
          qui a un carnet, pas la journée. Trois sommaires séparés, jamais un.
          Chacun ouvre sa page : un accordéon ne tient pas un carnet avec ses
          factures, ses horloges et son manuel.

          L'USURE a suivi l'entretien dans sa page — « la prochaine maintenance,
          son calendrier de maintenance éditable », c'est exactement ce que sont
          les horloges, sous un autre nom, et elles sont désormais à côté des
          gestes qui les font repartir plutôt qu'un écran plus bas. */}
      <Atelier db={db} machineId={machine.id} onOuvrir={setPoste} />

      {/* ─── LE BUDGET — demandé par Julian comme quatrième module ───────────
          Il vient APRÈS l'atelier et pas avant, parce que la plupart de ses
          lignes naissent d'un geste consigné juste au-dessus. Et il porte la
          saison, pas la machine : une assurance et une remorque ne désignent
          aucune moto, et les ranger sous l'une des deux serait faux. */}
      <Budget db={db} annee={anneeSaison(aujourdhui())}
              machineId={machine.id} onEcrit={onEcrit} />

      {/* ─── L'ÉQUIPEMENT — la troisième racine ──────────────────────────────
          « Il y a toujours une machine mais aussi un espace équipement. » Il est
          hors de la machine ET hors de l'onglet des machines : changer de moto
          ne change pas de combinaison. */}
      <Equipement db={db} onEcrit={onEcrit} appele={versEquipement} />

      <button className="lien" onClick={() => void importerSaison()}>
        Reprendre la saison 2026 · Pau-Arnos
      </button>
    </section>
  )
}

/**
 * DÉCLARER SA MACHINE — ET LA CORRIGER. Trois champs, dont un seul obligatoire.
 *
 * L'année reste facultative parce qu'elle se cherche : un pilote au paddock ne
 * va pas ouvrir sa carte grise pour créer son garage. AD-2 tient — une machine
 * sans photo, sans année et sans roulage est une machine valide.
 *
 * ⚠ LE MÊME FORMULAIRE SERT À CORRIGER, et ce n'est pas une économie de code :
 * un formulaire de correction séparé finit toujours par diverger de celui de
 * saisie, et c'est alors la correction qui perd un champ. L'année de la CBR est
 * entrée fausse et l'est restée parce qu'aucun écran ne la montrait NI ne la
 * reprenait.
 */
function Declarer({ machine, onValider }: {
  machine?: Machine
  onValider: (m: {
    marque: string; modele: string; annee: number | null
    prixAchatCentimes: number | null; acheteeLe: string | null
  }) => Promise<void>
}) {
  const [marque, setMarque] = useState(machine?.marque ?? '')
  const [modele, setModele] = useState(machine?.modele ?? '')
  const [annee, setAnnee] = useState(machine?.annee ? String(machine.annee) : '')
  const [prix, setPrix] = useState(
    machine?.prix_achat_centimes != null ? String(machine.prix_achat_centimes / 100) : '')
  const [achat, setAchat] = useState(machine?.achetee_le ?? '')
  const pret = marque.trim().length > 0 && modele.trim().length > 0
  const [valider, occupe] = useGeste(onValider)

  return (
    <div className="pile">
      <div className="libelle">Marque</div>
      <input className="champ" value={marque} onChange={(e) => setMarque(e.target.value)}
             placeholder="Honda" autoComplete="off" />
      <div className="libelle">Modèle</div>
      <input className="champ" value={modele} onChange={(e) => setModele(e.target.value)}
             placeholder="CBR 1000 RR" autoComplete="off" />
      {/* L'ANNÉE N'EST PAS UN DÉTAIL D'ÉTAT CIVIL : c'est elle qui désigne le
          barème d'entretien de cette moto-là, donc l'intervalle des horloges
          d'usure. Une CBR 2010 et une CBR 2016 n'ont pas la même page de manuel. */}
      <div className="libelle">Année · elle désigne le bon barème d'entretien</div>
      <input className="champ" value={annee} onChange={(e) => setAnnee(e.target.value)}
             placeholder="2010" inputMode="numeric" />

      {/* LE PRIX D'ACHAT — demandé par Julian. Il ne rejoint PAS les dépenses,
          et ce n'est pas un détail de rangement : une dépense appartient à une
          saison (AD-18), donc l'achat d'une moto gardée cinq ans écraserait le
          budget de la première année pour disparaître des quatre suivantes. Il
          est ici, avec la marque et l'année, parce que c'est une donnée
          d'IDENTITÉ — ce que la machine a coûté à entrer au garage.

          Facultatif, et le libellé le dit. Un pilote qui a acheté d'occasion il
          y a six ans ne se souvient pas du mois, et l'exiger transformerait une
          déclaration de trente secondes en fouille de papiers. */}
      <div className="libelle">Prix d'achat · facultatif</div>
      <input className="champ" value={prix} onChange={(e) => setPrix(e.target.value)}
             placeholder="7500" inputMode="decimal" />
      <div className="libelle">Achetée en · le mois suffit</div>
      <input className="champ" type="month" value={achat}
             onChange={(e) => setAchat(e.target.value)} />

      <button className="bouton" disabled={!pret || occupe} onClick={() => void valider({
        marque: marque.trim(), modele: modele.trim(),
        annee: /^\d{4}$/.test(annee.trim()) ? Number(annee.trim()) : null,
        prixAchatCentimes: prix.trim() ? enCentimes(prix) : null,
        acheteeLe: /^\d{4}-\d{2}$/.test(achat) ? achat : null,
      })}>
        {occupe ? 'enregistrement…' : machine ? 'Modifier' : 'Déclarer ma moto'}
      </button>
    </div>
  )
}
