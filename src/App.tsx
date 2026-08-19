import { useCallback, useEffect, useState } from 'react'
import { PRODUCT_NAME } from './product'
import { demanderPersistance, ouvrirBase } from './db/powersync'
import {
  ajouterSession, anneeSaison, bilanRoulage, coutDuRoulage, creerRoulage, formaterChrono,
  listerMachines, type Machine,
  circuitsProposes, enCentimes, formaterEcart, formaterEuros, listerRoulages, normaliserCircuits,
  normaliserEtats, poserBudget, supprimerRoulage, type Propose,
  type CoutRoulage,
} from './db/depot'
import { Depense } from './ecrans/Depense'
import { surCompte, type Identite } from './db/compte'
import { creerConnecteur, powersyncConfigure } from './db/connecteur'
import { estAdopte } from './db/sauvegarde'
import { ouverture } from './db/mesures'
import { surRetourDeReseau, televerserEnAttente } from './db/photos'
import { Photos } from './ecrans/Photos'
import { Recap } from './ecrans/Recap'
import { lireLocale, nomLocal, photosDuRoulage } from './db/photos'
import { gestesDuRoulage, listerCaps } from './db/gestes'
import type { Matiere } from './recap/composer'
import { conseilDuJour, direAVenir, direPasse, sourceAccueil, type Source } from './db/accueil'
import { Compte } from './ecrans/Compte'
import { Garage } from './ecrans/Garage'
import { Legal } from './ecrans/Legal'
import { Courbe } from './ecrans/Courbe'
import { Checklist } from './ecrans/Checklist'
import { Saison } from './ecrans/Saison'
import { Cercle } from './ecrans/Cercle'
import { chronoVisible, rendreVisible } from './db/cercle'
import { courbeDuCircuit, type Courbe as DonneesCourbe } from './db/courbe'
import { evenements, viserEvenement, type Evenement } from './db/atelier'
import {
  chiffresChoisis, ETIQUETTES as ETIQUETTES_CHIFFRES, MAX as MAX_CHIFFRES,
  poserChiffres, valeurs as valeursChiffres, type Cle, type Valeur as ValeurChiffre,
} from './db/chiffres'
import { Molettes } from './ecrans/Molettes'
import { Sonde } from './ecrans/Sonde'
import { useGeste } from './ecrans/geste'
import { Trophee } from './ecrans/Trophee'

type Db = ReturnType<typeof ouvrirBase>
type Ecran = 'accueil' | 'garage' | 'roulages' | 'nouveau' | 'session' | 'bilan' | 'depense' | 'recap' | 'compte' | 'sonde' | 'legal'
type Bilan = Awaited<ReturnType<typeof bilanRoulage>>
type Liste = Awaited<ReturnType<typeof listerRoulages>>

const aujourdhui = () => new Date().toISOString().slice(0, 10)

/** Le groupe se saisit sur l'échelle de SON organisateur. Pau-Arnos annonce
 *  2 à 4 groupes nommés Initiation/Intermédiaire/Confirmé/Expert, pas
 *  Blanc/Jaune/Rouge. Seul le RANG est comparable d'une sortie à l'autre. */
const GROUPES = ['Initiation', 'Intermédiaire', 'Confirmé', 'Expert']

export default function App() {
  const [db, setDb] = useState<Db | null>(null)
  const [panne, setPanne] = useState<string | null>(null)
  const [ecran, setEcran] = useState<Ecran>('accueil')
  const [liste, setListe] = useState<Liste>([])
  const [courant, setCourant] = useState<string | null>(null)
  const [bilan, setBilan] = useState<Bilan>(null)
  const [cout, setCout] = useState<CoutRoulage | null>(null)
  const [matiere, setMatiere] = useState<Matiere | null>(null)
  // Épique 11 : elle s'allume sur une CONDITION OBSERVABLE — trois roulages
  // chronométrés sur ce circuit — et jamais sur une date.
  const [courbe, setCourbe] = useState<DonneesCourbe | null>(null)
  const [identite, setIdentite] = useState<Identite | null>(null)
  const [src, setSrc] = useState<Source | null>(null)
  const [conseil, setConseil] = useState<string | null>(null)

  useEffect(() => {
    const d = ouvrirBase()
    // La reprise des circuits tourne AVANT que quoi que ce soit puisse partir :
    // une base écrite par la v0 range le nom du circuit dans la référence, et
    // aucune de ses lignes ne franchirait la clé étrangère (récit 1.2).
    d.init()
      // AD-5 / NFR-1 : la persistance SE DEMANDE À CHAQUE DÉMARRAGE. Ce n'est
      // pas une formalité — tant qu'elle est refusée, tout ce qui n'est pas
      // encore parti au serveur, photos de la journée comprises, vit dans un
      // stockage que le navigateur peut évincer.
      .then(() => demanderPersistance())
      .then(() => normaliserCircuits(d))
      .then(() => normaliserEtats(d))
      // Instrument ③ : l'ouverture se compte AVANT toute saisie, et elle naît
      // « n'a rien produit » — l'état attendu, jamais un échec (FR-59).
      .then(() => ouverture(d))
      // Le marquage « cette ouverture a produit une saisie » n'est PAS ici :
      // il vit dans le dépôt, sur le chemin d'écriture. Posé écran par écran,
      // il finissait par manquer au suivant — et un marquage manquant ne se
      // signale pas, il fait juste dire à l'instrument que rien n'a été saisi.
      .then(() => setDb(d))
      // ⚠ LE FILET. Sans lui, un seul échec — OPFS refusé, worker interdit,
      // stockage plein — laissait l'écran sur « chargement… » POUR TOUJOURS,
      // sans un mot. C'est le seul défaut du produit qui transforme un clic
      // publicitaire en écran blanc, et le WebView d'Instagram sur iOS est
      // exactement le terrain où il se déclenche.
      .catch((e: unknown) => setPanne((e as Error)?.message ?? 'cause inconnue'))
  }, [])

  // L'identité est lue en local et survit hors ligne : traverser un tunnel ne
  // déconnecte personne, ça suspend seulement la synchronisation.
  useEffect(() => surCompte(setIdentite), [])

  // La synchronisation continue ne s'allume qu'à TROIS conditions : un compte,
  // une instance à qui parler, et une base déjà adoptée une fois. La troisième
  // n'est pas une précaution de confort — sans elle, le journal d'avant le
  // compte serait rejoué, et c'est précisément ce que l'adoption évite.
  useEffect(() => {
    if (!db) return
    if (!identite || !powersyncConfigure || !estAdopte(identite.id)) { void db.disconnect(); return }
    void db.connect(creerConnecteur(identite.id, (i) =>
      console.warn('[synchro] ligne écartée', i)))
    return () => { void db.disconnect() }
  }, [db, identite])

  const rafraichir = useCallback(async (base: Db) => {
    setListe(await listerRoulages(base))
    // AD-6 : l'accueil se recalcule À L'OUVERTURE et à chaque écriture. Rien ne
    // tourne pendant que l'application est fermée, donc rien ne peut avoir
    // manqué son rendez-vous — l'accueil est immunisé par construction.
    setSrc(await sourceAccueil(base, aujourdhui()))
    setConseil(await conseilDuJour(base, aujourdhui()))
  }, [])
  useEffect(() => { if (db) void rafraichir(db) }, [db, rafraichir])

  /* AD-6 — LES DEUX SEULS DÉCLENCHEURS, et il n'y en aura jamais d'autres :
     le retour au premier plan et le retour de connectivité. Sur iOS rien ne
     s'exécute pendant que l'application est fermée — WebKit a refusé Background
     Sync et n'a jamais implémenté Background Fetch. Toute file de requêtes de
     Service Worker est par ailleurs interdite par AD-4.

     Ils portent DEUX choses : le téléversement différé des photos, et le
     recalcul de l'accueil — une application laissée ouverte au premier plan ne
     changeait pas de jour. */
  useEffect(() => {
    if (!db) return
    return surRetourDeReseau(() => {
      void rafraichir(db)
      if (identite) void televerserEnAttente(db, identite.id)
    })
  }, [db, identite, rafraichir])


  // La panne se DIT, et elle laisse une sortie. Un écran figé sur « chargement… »
  // ne se distingue pas d'un téléphone lent, donc personne ne signale rien —
  // et le pilote conclut que l'application ne marche pas.
  if (panne) return (
    <div className="ecran">
      <p className="libelle">l'application n'a pas pu s'ouvrir</p>
      <h1 className="titre">Le stockage a refusé</h1>
      <p className="texte">
        Ce navigateur n'a pas accordé à MyPaddock l'espace dont il a besoin. C'est fréquent
        quand l'application s'ouvre à l'intérieur d'une autre — depuis Instagram ou Facebook,
        par exemple. Ouvrir le lien dans Safari ou Chrome suffit le plus souvent.
      </p>
      <p className="note">Détail technique : {panne}</p>
      <button className="bouton" onClick={() => location.reload()}>Réessayer</button>
      <a className="bouton secondaire" href={location.href} target="_blank" rel="noreferrer">
        Ouvrir dans le navigateur
      </a>
    </div>
  )

  if (!db) return <div className="ecran"><div className="libelle">chargement…</div></div>

  /** La matière du récapitulatif — rassemblée à partir des mêmes données que
   *  l'écran, jamais recalculée autrement. La photo de fond vient de la COPIE
   *  LOCALE : une URL distante teinterait le canevas, et FR-36 exige de toute
   *  façon que le récapitulatif se compose sans réseau. */
  const rassembler = async (id: string): Promise<Matiere | null> => {
    const b = await bilanRoulage(db, id)
    if (!b) return null
    const ph = await photosDuRoulage(db, id)
    const caps = await listerCaps(db)
    const g = await gestesDuRoulage(db, id)
    return {
      circuit: b.circuit, date: b.date, sessions: b.sessions,
      meilleurMs: b.meilleur, ecartMs: b.ecart,
      premiere: b.reference == null,
      cout: await coutDuRoulage(db, id, anneeSaison(b.date)),
      gestes: g.map((x) => caps.find((c) => c.code === x.cap_code)?.libelle ?? x.cap_code),
      // À défaut de photo, le portrait de la machine qui a roulé. Déjà local,
      // déjà payé : la bande visuelle du récapitulatif ne reste jamais vide.
      sprite: (await listerMachines(db))[0]?.sprite ?? null,
      fond: ph[0] ? await lireLocale(nomLocal(ph[0])) : null,
    }
  }

  /** Charge un roulage SANS décider de l'écran. Séparer les deux a supprimé un
   *  clignotement réel : la fin d'une saisie affichait le bilan une fraction de
   *  seconde avant de basculer sur le récapitulatif. Un écran qui apparaît pour
   *  disparaître aussitôt se lit comme un bug, même quand il ne l'est pas. */
  const chargerRoulage = async (id: string) => {
    setCourant(id)
    const b = await bilanRoulage(db, id)
    setBilan(b)
    setCout(b ? await coutDuRoulage(db, id, anneeSaison(b.date)) : null)
    setCourbe(b ? await courbeDuCircuit(db, b.circuit) : null)
    return b
  }

  const ouvrirBilan = async (id: string) => {
    await chargerRoulage(id)
    setEcran('bilan')
  }

  return (
    <>
      <div className="sol" aria-hidden />
      <div className="ecran">
        {ecran === 'accueil' && (
          <Accueil db={db} src={src} conseil={conseil}
                   onNouveau={() => setEcran('nouveau')} onOuvrir={ouvrirBilan}
                   onLegal={() => setEcran('legal')} />
        )}
        {ecran === 'roulages' && <Roulages db={db} liste={liste} onOuvrir={ouvrirBilan}
                                            onNouveau={() => setEcran('nouveau')}
                                            onEcrit={() => void rafraichir(db)} />}
        {ecran === 'nouveau' && (
          <Nouveau db={db} onValider={async (r) => {
            const id = await creerRoulage(db, r)
            setCourant(id); await rafraichir(db); setEcran('session')
          }} onAnnuler={() => setEcran('accueil')} />
        )}
        {ecran === 'session' && courant && (
          <Session onValider={async (ms) => {
            await ajouterSession(db, courant, ms)
            await rafraichir(db)
            // FR-36 : LE RÉCAPITULATIF SE COMPOSE TOUT SEUL ET S'AFFICHE SANS
            // AVOIR ÉTÉ DEMANDÉ à la fin de la saisie. Ce n'est pas une
            // fonctionnalité qu'on va chercher : c'est ce que le produit rend
            // au pilote pour le travail qu'il vient de faire.
            await chargerRoulage(courant)
            setMatiere(await rassembler(courant))
            setEcran('recap')
          }} onAnnuler={() => void ouvrirBilan(courant)} />
        )}
        {ecran === 'bilan' && bilan && courant && (
          <BilanEcran
            db={db} b={bilan} cout={cout} courbe={courbe} identite={identite}
            onSession={() => setEcran('session')}
            onAccueil={() => setEcran('accueil')}
            onDepense={() => setEcran('depense')}
            onRecap={() => void rassembler(courant).then((m) => { setMatiere(m); setEcran('recap') })}
            photos={<Photos db={db} roulageId={courant} />}
            onBudget={async (centimes) => {
              await poserBudget(db, anneeSaison(bilan.date), centimes)
              if (courant) setCout(await coutDuRoulage(db, courant, anneeSaison(bilan.date)))
            }}
          />
        )}
        {ecran === 'recap' && matiere && courant && (
          <Recap db={db} matiere={matiere} onFermer={() => void ouvrirBilan(courant)} />
        )}
        {ecran === 'depense' && courant && bilan && (
          <Depense db={db} roulageId={courant} dateRoulage={bilan.date}
                   onFini={() => void ouvrirBilan(courant)}
                   onAnnuler={() => void ouvrirBilan(courant)} />
        )}
        {ecran === 'garage' && <Garage db={db} onEcrit={() => void rafraichir(db)} />}
        {ecran === 'compte' && <Compte db={db} identite={identite} onLegal={() => setEcran('legal')}
                                       onSonde={() => setEcran('sonde')} />}
        {ecran === 'sonde' && <Sonde db={db} onFermer={() => setEcran('compte')} />}
        {/* QO-11 : les textes existent, et ils sont ATTEIGNABLES. Un document
            juridique que rien ne lie n'a jamais été publié. */}
        {ecran === 'legal' && <Legal onFermer={() => setEcran('compte')} />}
      </div>

      {/* UX-DR9 — LA BARRE SE CALCULE, elle n'est pas une liste figée. Un onglet
          apparaît QUAND IL A QUELQUE CHOSE À MONTRER : « Machine, Saison et
          Cercle n'apparaissent pas tant qu'ils n'ont rien à montrer. »

          La règle nommait deux onglets au noyau. Elle est antérieure à la
          réorientation du 18 août, qui fait du garage le centre du produit — le
          garage a donc maintenant quelque chose à montrer, et c'est le TEST de
          la règle qui tranche, pas son exemple chiffré.

          ⚠ ET GARAGE EST TOUJOURS VISIBLE, y compris sans machine. Le masquer
          jusqu'à la première machine rendait la première machine INATTEIGNABLE
          — trouvé par l'essai, pas par la relecture. Un garage vide n'est pas
          une pièce vide : c'est l'écran qui explique l'axe machine et par lequel
          on déclare sa moto. AD-2 le dit déjà — une machine sans roulage est un
          état valide, donc un garage sans machine en est un aussi.

          ⚠ LE COMPTE EST DESCENDU DANS LA BARRE — retour de Julian : « le bouton
          compte un peu décevant, ça fait pas app mobile, ce serait quoi le
          mieux, en bas non ? ». Il avait raison sur les deux plans. Un lien
          souligné de treize pixels en tête d'écran, c'est la convention du web
          de 2005 ; sur un téléphone, ce qu'on atteint au pouce est en bas. Et
          surtout, ce lien portait la SAUVEGARDE — la seule chose qui empêche une
          saison entière de mourir avec le téléphone. Le ranger comme un réglage
          discret disait au pilote qu'elle en était un.

          La sonde, elle, reste un instrument et n'est pas un lieu : elle
          s'atteint depuis le compte. « À propos » reste en tête de l'accueil,
          parce qu'il doit se lire SANS compte — un inconnu venu d'une publicité
          ne doit pas avoir à ouvrir l'onglet du compte pour savoir ce qu'on fait
          de ses données. */}
      <nav className="barre">
        <button className="onglet" data-actif={ecran === 'accueil' ? '1' : '0'} onClick={() => setEcran('accueil')}>ACCUEIL</button>
        <button className="onglet" data-actif={ecran === 'garage' ? '1' : '0'} onClick={() => setEcran('garage')}>GARAGE</button>
        <button className="onglet" data-actif={ecran === 'roulages' ? '1' : '0'} onClick={() => setEcran('roulages')}>ROULAGES</button>
        <button className="onglet" data-actif={ecran === 'compte' || ecran === 'sonde' ? '1' : '0'} onClick={() => setEcran('compte')}>COMPTE</button>
      </nav>
    </>
  )
}

/* ─── ACCUEIL — ce qui est le plus proche dans le temps ────────────────────
   UJ-2 : on n'ouvre jamais sur du vide, et jamais sur des cadres en attente.
   Une seule action quand il n'y a rien. */
/* ─── L'ACCUEIL TEMPOREL — récits 6.1 et 6.2 ───────────────────────────────
   DEUX ZONES, et leur propriété n'est pas la même.

   · La ZONE TEMPORELLE est en tête et APPARTIENT AU SYSTÈME (FR-15). Le pilote
     n'y touche pas : c'est le produit qui décide de ce qui est le plus proche
     dans le temps, et c'est ce qui lui permet de changer tout seul entre deux
     roulages sans que rien n'ait tourné pendant la fermeture (AD-6).
   · La ZONE DES CHIFFRES est en dessous et appartient au pilote.

   FR-13, testé ligne par ligne : chaque libellé ÉNONCE UN FAIT et jamais une
   échéance ni une injonction. Pas d'impératif, pas d'exclamation, pas de mot de
   rareté. Un libellé qui y échoue est un défaut au même titre qu'un calcul faux. */
function Accueil({ db, src, conseil, onNouveau, onOuvrir, onLegal }: {
  db: Db; src: Source | null; conseil: string | null
  onNouveau: () => void; onOuvrir: (id: string) => void
  onLegal: () => void
}) {
  return (
    <>
      <header className="tete">
        <h1 className="titre neon">{PRODUCT_NAME}</h1>
        <nav className="reglages">
          {/* ATTEIGNABLE SANS COMPTE, et c'est le point : un inconnu venu d'une
              publicité doit pouvoir lire ce qu'on fait de ses données AVANT de
              donner son adresse, pas après. Le compte, lui, est descendu dans la
              barre basse — voir le commentaire de la barre. */}
          <button className="lien" onClick={onLegal}>à propos</button>
        </nav>
      </header>
      <ZoneTemporelle src={src} onNouveau={onNouveau} onOuvrir={onOuvrir} />
      {src && src.genre !== 'vide' && <ZoneChiffres db={db} />}
      {conseil && <Conseil texte={conseil} />}
    </>
  )
}

/** UN SEUL conseil, et il énonce une TECHNIQUE — jamais une performance à
 *  atteindre, jamais un chiffre à battre, et surtout aucun bandeau de
 *  prévention : l'attention à un avertissement chute dès la deuxième exposition,
 *  et une menace sans action facile associée produit de la défense, pas du
 *  changement (Witte & Allen, 93 études). */
function Conseil({ texte }: { texte: string }) {
  return (
    <div className="conseil">
      <p className="libelle">Une chose à la fois</p>
      <p className="texte">{texte}</p>
    </div>
  )
}

/* ─── LE PLAN SI-ALORS EST RETIRÉ DE L'ACCUEIL — retour de Julian ──────────
   « Ça fait un peu gamin, personne va prendre le temps de le remplir. L'utilité
   est pas clair : c'est un quizz qui rapporte des points ? un message de
   prévention ? Là l'effet c'est : c'est quoi cette merde. »

   C'était l'intervention comportementale la mieux établie du dossier — d ≈ 0,65
   sur 94 essais — et je la retire quand même, sans la remplacer. Le motif n'est
   pas que la littérature ait tort ; c'est que sa condition d'efficacité est que
   la personne formule la phrase ELLE-MÊME. Une invite qui produit du rejet ne
   produit pas une phrase, donc elle ne produit aucun effet — elle ne coûte que
   la confiance dans l'écran où elle apparaît.

   ⚠ CE QUI RESTE : la table `plan_si_alors` reste au schéma et dans l'ordre
   d'envoi. Retirer une table d'une file de synchronisation déjà déployée est un
   geste à part entière, et il n'a rien à voir avec ce retour-là. Elle ne porte
   plus aucun écran ; elle ne coûte rien à personne.

   ⚠ CE QUI N'EST PAS CONCERNÉ : le conseil du jour reste. Il n'a jamais rien
   demandé au pilote — c'est une phrase à lire, pas un champ à remplir. */

function ZoneTemporelle({ src, onNouveau, onOuvrir }: {
  src: Source | null; onNouveau: () => void; onOuvrir: (id: string) => void
}) {
  // Il n'existe AUCUN écran vide (FR-14) : sans donnée, une seule action, et une
  // phrase qui dit ce que l'application fait — pas ce qu'il faudrait faire.
  if (!src || src.genre === 'vide') {
    return (
      <>
        <div className="bloc pile">
          <div className="libelle">Rien de saisi</div>
          <div style={{ fontSize: 18 }}>
            Le premier roulage suffit à faire fonctionner l'application.
            Le coût se saisit plus tard, pas maintenant.
          </div>
        </div>
        <button className="bouton" onClick={onNouveau}>Saisir mon premier roulage</button>
      </>
    )
  }

  /* ─── LES QUATRE SOURCES DE L'ATELIER — épique 9 ────────────────────────
     Chacune énonce UN FAIT et ne demande rien (FR-13). Aucune ne porte de
     compteur à rebours, aucune ne dit ce qui reste à faire, et aucune ne
     désigne une saisie manquante — c'est la clause qui a fait réécrire la
     deuxième ligne du tableau de FR-12. */

  if (src.genre === 'anniversaire') {
    return (
      <div className="bloc pile">
        <div className="libelle">Il y a {src.ans === 1 ? 'un an' : `${src.ans} ans`}, jour pour jour</div>
        <div className="titre">{src.libelle}</div>
        <div className="libelle faible">à {src.circuit}</div>
      </div>
    )
  }

  if (src.genre === 'evenement') {
    return (
      <div className="bloc pile">
        <div className="rang">
          <span className="libelle">Tu vises</span>
          {/* Une date APPROXIMATIVE se dit approximative. Afficher « dans
              97 jours » sur un « juin » inventerait une précision. */}
          {src.jours != null && <span className="hud-16 miami">{direAVenir(src.jours)}</span>}
        </div>
        <div className="titre">{src.libelle}</div>
        {src.centimes != null && (
          <div className="libelle faible">environ {formaterEuros(src.centimes)} estimés</div>
        )}
      </div>
    )
  }

  if (src.genre === 'piece') {
    return (
      <div className="bloc pile">
        <div className="libelle">Au garage</div>
        <div className="titre">{src.libelle}</div>
        <div className="libelle faible">
          {src.n > 1 ? `et ${src.n - 1} autre${src.n > 2 ? 's' : ''} · ` : ''}
          sur la {src.machine}
        </div>
      </div>
    )
  }

  if (src.genre === 'reparations') {
    return (
      <div className="bloc pile">
        <div className="libelle">Ça peut attendre</div>
        <div className="titre">
          {src.n} chose{src.n > 1 ? 's' : ''} à regarder
        </div>
        <div className="libelle faible">sur la {src.machine}</div>
      </div>
    )
  }

  const r = src.roulage
  const aVenir = src.genre === 'a_venir'

  return (
    <>
      <div className="bloc pile" onClick={() => onOuvrir(r.id)}>
        <div className="rang">
          <span className="libelle">{aVenir ? 'Prochain roulage' : 'Dernier roulage'}</span>
          {/* « dans 12 jours » et « il y a 3 jours » énoncent. Ni « plus que »,
              ni « encore », ni « reste » — ces mots-là fabriquent une pression. */}
          <span className="hud-16 miami">
            {aVenir ? direAVenir(src.jours) : direPasse(src.jours)}
          </span>
        </div>

        <div className="titre">{r.circuit_nom}</div>

        {aVenir ? (
          // FR-12 : sur un roulage à venir, le seul chiffre qui a du sens est le
          // meilleur tour DÉJÀ FAIT ICI. Pas un objectif, pas un écart à combler.
          <div className="rang">
            <span className="libelle">
              {src.meilleurIci != null ? 'Ton meilleur tour ici' : 'Jamais roulé ici'}
            </span>
            {src.meilleurIci != null && (
              <span className="chiffre hud-40 miami avec-trophee">
                <Trophee taille={20} />{formaterChrono(src.meilleurIci)}
              </span>
            )}
          </div>
        ) : (
          <>
            {r.meilleur != null && (
              <div className="rang">
                <span className="libelle">Meilleur tour du jour</span>
                {/* Le trophée marque un FAIT MESURÉ — le meilleur tour — et rien
                    d'autre. Il n'est jamais posé sur un objectif ni sur un reste
                    à faire : le produit constate, il ne décerne pas. */}
                <span className="chiffre hud-40 miami avec-trophee">
                  <Trophee taille={20} />{formaterChrono(r.meilleur)}
                </span>
              </div>
            )}
            <div className="rang">
              <span className="libelle">
                {r.sessions} session{r.sessions > 1 ? 's' : ''}
              </span>
              {/* Le coût s'affiche s'il existe, et RIEN ne le réclame s'il
                  manque : une source de l'accueil est ce qu'on a envie de voir,
                  jamais ce qu'on a oublié de faire. */}
              {r.cout_centimes > 0 && (
                <span className="chiffre hud-16">{formaterEuros(r.cout_centimes)}</span>
              )}
            </div>
          </>
        )}
      </div>

      <button className="bouton" onClick={onNouveau}>Saisir un roulage</button>

    </>
  )
}

/**
 * LES ÉVÉNEMENTS VISÉS — FR-54, « un objet léger ».
 *
 * Sa pauvreté est le sujet, pas un manque : une date APPROXIMATIVE et un coût
 * ESTIMÉ. Exiger un jour précis transformerait un désir en engagement, et le
 * pilote cesserait d'en poser. Rien ici ne relance, rien ne décompte.
 */
function Evenements({ db, onEcrit }: { db: Db; onEcrit: () => void }) {
  const [liste, setListe] = useState<Evenement[]>([])
  const [saisie, setSaisie] = useState(false)
  const [libelle, setLibelle] = useState('')
  const [date, setDate] = useState('')
  const [cout, setCout] = useState('')

  const charger = useCallback(async () => setListe(await evenements(db)), [db])
  useEffect(() => { void charger() }, [charger])

  const poser = async () => {
    await viserEvenement(db, {
      libelle, date: date || null, centimes: cout.trim() ? enCentimes(cout) : null,
    })
    setLibelle(''); setDate(''); setCout(''); setSaisie(false)
    await charger(); onEcrit()
  }

  return (
    <>
      {liste.length > 0 && <div className="libelle">Ce que tu vises</div>}
      {liste.map((e) => (
        <div key={e.id} className="bloc rang">
          <span className="texte">{e.libelle}</span>
          <span className="libelle faible">
            {e.date_approx ?? 'sans date'}
            {e.cout_estime_centimes != null ? ` · ~${formaterEuros(e.cout_estime_centimes)}` : ''}
          </span>
        </div>
      ))}
      {saisie ? (
        <div className="bloc pile">
          <div className="libelle">Ce que tu vises</div>
          <input className="champ" value={libelle} onChange={(e) => setLibelle(e.target.value)}
                 placeholder="Bol d'Or" autoComplete="off" />
          <div className="libelle">Quand, à peu près</div>
          <input className="champ" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div className="libelle">Ce que ça coûterait, à vue de nez</div>
          <input className="champ" value={cout} onChange={(e) => setCout(e.target.value)}
                 placeholder="600" inputMode="decimal" />
          <button className="bouton" disabled={!libelle.trim()} onClick={() => void poser()}>
            Le viser
          </button>
          <button className="lien" onClick={() => setSaisie(false)}>Annuler</button>
        </div>
      ) : (
        <button className="lien" onClick={() => setSaisie(true)}>Viser un événement</button>
      )}
    </>
  )
}

/** La zone des chiffres — elle appartient au pilote. Elle porte sa saison, pas
 *  la journée : la zone du dessus s'en charge déjà. */
/**
 * LA ZONE DES CHIFFRES — FR-15, la seule moitié de l'accueil qui appartient au
 * pilote. Deux clauses la tiennent, et elles se voient :
 *   · la disposition par défaut est complète et utilisable telle quelle ;
 *   · le réarrangement n'est JAMAIS une étape d'installation — pas d'assistant,
 *     pas d'invite, pas de pastille. Un lien discret, sous la zone, pour qui
 *     le cherche.
 */
function ZoneChiffres({ db }: { db: Db }) {
  const [choisis, setChoisis] = useState<Cle[]>(chiffresChoisis)
  const [vals, setVals] = useState<Record<Cle, ValeurChiffre> | null>(null)
  const [regler, setRegler] = useState(false)
  useEffect(() => { void valeursChiffres(db).then(setVals) }, [db])
  if (!vals) return null

  const basculer = (c: Cle) => {
    const l = choisis.includes(c)
      // On ne descend jamais sous UN chiffre : une zone vide sous-délivre, et
      // un écran qui sous-délivre signale l'abandon (FR-14).
      ? (choisis.length > 1 ? choisis.filter((x) => x !== c) : choisis)
      : (choisis.length < MAX_CHIFFRES ? [...choisis, c] : choisis)
    setChoisis(l); poserChiffres(l)
  }

  return (
    <>
      {/* ⚠ LE MEILLEUR TOUR PORTE SON CIRCUIT ICI AUSSI. Julian l'a relevé sur le
          garage — « ça n'a pas de sens sinon au global comme ça » — et le même
          chiffre était faux sur l'accueil, à l'identique : 1'38 à Pau-Arnos et
          1'38 à Nogaro ne se comparent pas. Le contexte descend donc dans la
          valeur, pour les seuls chiffres qui en ont un. */}
      <div className="chiffres-saison">
        {choisis.map((c) => (
          <div key={c}>
            <p className="et">{ETIQUETTES_CHIFFRES[c]}</p>
            <p className="va">{vals[c].valeur}</p>
            {vals[c].ou && <p className="ou">{vals[c].ou}</p>}
          </div>
        ))}
      </div>
      {regler ? (
        <div className="bloc pile">
          <div className="libelle">ce que tu veux voir · {choisis.length} sur {MAX_CHIFFRES}</div>
          <div className="puces">
            {(Object.keys(ETIQUETTES_CHIFFRES) as Cle[]).map((c) => (
              <button key={c} className="puce" data-actif={choisis.includes(c) ? '1' : '0'}
                      onClick={() => basculer(c)}>
                {ETIQUETTES_CHIFFRES[c].toUpperCase()}
              </button>
            ))}
          </div>
          <button className="lien" onClick={() => setRegler(false)}>Terminé</button>
        </div>
      ) : (
        <button className="lien discret" onClick={() => setRegler(true)}>changer ces chiffres</button>
      )}
    </>
  )
}

function Roulages({ db, liste, onOuvrir, onNouveau, onEcrit }: {
  db: Db; liste: Liste; onOuvrir: (id: string) => void; onNouveau: () => void; onEcrit: () => void
}) {
  return (
    <>
      {/* Le bilan de saison ouvre l'écran des roulages : c'est la vue d'ensemble
          de ce que la liste détaille en dessous. Consultable à tout moment
          (FR-55), jamais réservé à une fin de saison. */}
      <Saison db={db} />

      {/* UN ROULAGE EST UNE JOURNÉE, jamais une session — Julian a eu à le
          rappeler, ce qui veut dire que l'écran ne le disait pas. Il le dit
          maintenant, une fois, à l'endroit où l'on compte. */}
      <div className="libelle">Roulages · {liste.length} journée{liste.length > 1 ? 's' : ''}</div>
      <div className="pile">
        {liste.map((r) => (
          <LigneRoulage key={r.id} db={db} r={r} onOuvrir={onOuvrir} onEcrit={onEcrit} />
        ))}
      </div>
      <button className="bouton" onClick={onNouveau}>Saisir un roulage</button>
      {/* FR-54 — L'ÉVÉNEMENT VISÉ vit ici et non au garage : il ne touche pas la
          machine, il vise une SORTIE. « Désiré avant d'être réservé » : c'est
          exactement ce qui manquait à l'accueil temporel pour avoir quelque
          chose à montrer quand rien n'est encore réservé. */}
      <Evenements db={db} onEcrit={onEcrit} />
    </>
  )
}

/**
 * UNE JOURNÉE, ET LE MOYEN DE LA RETIRER.
 *
 * Ce bouton manquait, et son absence a coûté cher : Julian s'est retrouvé avec
 * vingt-cinq roulages là où il en avait saisi cinq, sans aucun moyen d'en
 * effacer un. Une liste fausse qu'on ne peut pas corriger n'est pas une gêne
 * d'affichage — c'est la fin de la saisie.
 *
 * DEUX TAPS, et le second est explicite. Un roulage porte ses sessions, ses
 * tours, ses photos et ses gestes : il n'y a pas d'annulation après coup, donc
 * il y a une question avant. Le mot « définitivement » y est parce qu'il est
 * vrai.
 */
function LigneRoulage({ db, r, onOuvrir, onEcrit }: {
  db: Db; r: Liste[number]; onOuvrir: (id: string) => void; onEcrit: () => void
}) {
  const [confirme, setConfirme] = useState(false)
  const [retirer, occupe] = useGeste(async () => {
    await supprimerRoulage(db, r.id)
    onEcrit()
  })

  return (
    <div className="bloc pile">
      <div className="pile" onClick={() => onOuvrir(r.id)}>
        <div className="rang">
          <span className="titre" style={{ fontSize: 20 }}>{r.circuit_nom}</span>
          <span className="libelle">{r.date_jour}</span>
        </div>
        <div className="rang">
          <span className="hud-12 faible">
            {r.groupe_nom ?? '—'}{r.groupe_rang ? ` · ${r.groupe_rang}/${r.groupe_total}` : ''}
          </span>
          <span className="chiffre hud-24 miami">
            {r.meilleur != null ? formaterChrono(r.meilleur) : '—'}
          </span>
        </div>
      </div>

      {confirme ? (
        <div className="pile">
          <p className="note">
            Cette journée part définitivement, avec ses {r.sessions} session{r.sessions > 1 ? 's' : ''},
            ses chronos et ses photos.
          </p>
          <div className="rang">
            <button className="bouton secondaire" disabled={occupe} onClick={() => void retirer()}>
              {occupe ? 'suppression…' : 'Retirer définitivement'}
            </button>
            <button className="lien" onClick={() => setConfirme(false)}>Garder</button>
          </div>
        </div>
      ) : (
        <button className="lien" onClick={() => setConfirme(true)}>Retirer cette journée</button>
      )}
    </div>
  )
}

/**
 * LE CHOIX DU CIRCUIT — une liste qui propose, un champ qui décide.
 *
 * L'ordre des propositions est celui d'un pilote, pas celui d'un annuaire : ses
 * circuits d'abord, le plus récent en tête, puis le référentiel. Sur onze
 * ouvertures par an, la bonne réponse est presque toujours l'un des deux
 * derniers roulages — et elle s'atteint alors en un seul geste, ganté.
 *
 * ⚠ LE CHAMP RESTE LIBRE. Aucune proposition n'est imposée, aucune saisie n'est
 * refusée parce qu'elle est absente de la liste, et rien n'annonce qu'un circuit
 * est « inconnu » : le produit énonce, il ne corrige pas (FR-13). Un circuit
 * privé se saisit exactement comme Pau-Arnos.
 */
function ChoixCircuit({ db, valeur, sur }: {
  db: Db; valeur: string; sur: (nom: string) => void
}) {
  const [propositions, setPropositions] = useState<Propose[]>([])
  useEffect(() => {
    let vivant = true
    // AU REPOS, LA LISTE EST COURTE — trois rangs, pas six. La capture de
    // l'essai l'a montré sans appel : six propositions poussaient la date, le
    // groupe et « Continuer » hors de l'écran, et le pilote devait faire défiler
    // une liste qu'il n'avait pas demandée pour atteindre le bouton. Dès qu'il
    // tape, il cherche : la liste peut alors s'allonger, le clavier occupe de
    // toute façon le bas de l'écran.
    void circuitsProposes(db, valeur, valeur.trim() ? 6 : 3)
      .then((c) => { if (vivant) setPropositions(c) })
    return () => { vivant = false }
  }, [db, valeur])

  return (
    <>
      <input className="champ" value={valeur} onChange={(e) => sur(e.target.value)}
             placeholder="Pau-Arnos" autoComplete="off" />
      {propositions.length > 0 && (
        <div className="circuits">
          {propositions.map((c) => (
            <button key={c.nom} className="circuit" type="button" onClick={() => sur(c.nom)}>
              <span className="nom">{c.nom}</span>
              {c.source === 'deja' && <span className="libelle">déjà roulé</span>}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

/* ─── NOUVEAU ROULAGE — sélecteurs plutôt que clavier partout où c'est possible */
function Nouveau({ db, onValider, onAnnuler }: {
  db: Db
  onValider: (r: { circuit: string; date: string; groupeNom: string | null; rang: number | null; total: number | null; machineId: string | null }) => Promise<void> | void
  onAnnuler: () => void
}) {
  const [circuit, setCircuit] = useState('')
  const [date, setDate] = useState(aujourdhui())
  const [rang, setRang] = useState<number | null>(null)
  // ⚠ `machineId` PARTAIT À NULL, EN DUR. Conséquence invisible à la saisie et
  // définitive au garage : les trois chiffres de la machine — roulages,
  // meilleur tour, ce qu'elle a coûté — restaient à zéro pour toujours, quel
  // que soit le nombre de roulages saisis. L'axe machine d'AD-2 existait dans
  // le schéma et nulle part dans les données.
  const [machines, setMachines] = useState<Machine[]>([])
  const [machineId, setMachineId] = useState<string | null>(null)
  const [valider, occupe] = useGeste(onValider)
  useEffect(() => {
    void listerMachines(db).then((m) => {
      setMachines(m)
      // Une seule machine au garage : c'est forcément elle. Demander laquelle
      // quand il n'y a pas de choix est une question sans réponse possible.
      if (m.length === 1) setMachineId(m[0].id)
    })
  }, [db])

  return (
    <>
      <div className="libelle">Nouveau roulage</div>

      <div className="pile">
        <div className="libelle">Circuit</div>
        <ChoixCircuit db={db} valeur={circuit} sur={setCircuit} />
      </div>

      {/* Le choix ne s'affiche qu'à partir de DEUX machines. AD-2 : un roulage
          sans machine reste valide, donc la sélection se dé-sélectionne. */}
      {machines.length > 1 && (
        <div className="pile">
          <div className="libelle">Machine</div>
          <div className="puces">
            {machines.map((m) => (
              <button key={m.id} className="puce" data-actif={machineId === m.id ? '1' : '0'}
                      onClick={() => setMachineId(machineId === m.id ? null : m.id)}>
                {m.modele.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="pile">
        <div className="libelle">Date</div>
        <input className="champ" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="pile">
        <div className="libelle">Groupe · échelle de l'organisateur</div>
        <div className="puces">
          {GROUPES.map((g, i) => (
            <button key={g} className="puce" data-actif={rang === i + 1 ? '1' : '0'}
                    onClick={() => setRang(rang === i + 1 ? null : i + 1)}>
              {g.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ⚠ CE BOUTON A ÉCRIT 25 ROULAGES POUR 5 SAISIES. Il restait vivant
          pendant toute l'écriture — worker OPFS, marquage de saisie, puis quatre
          requêtes de recalcul de l'accueil — et rien ne bougeait à l'écran. On
          retape, et chaque tap est une journée de plus, indélébile jusqu'ici.
          Le verrou est dans `useGeste` et il est mutable, pas d'état : deux taps
          dans la même image de rendu voient tous les deux l'ancien état. */}
      <button className="bouton" disabled={!circuit.trim() || occupe}
              onClick={() => void valider({
                circuit: circuit.trim(), date,
                groupeNom: rang ? GROUPES[rang - 1] : null,
                rang, total: rang ? GROUPES.length : null, machineId,
              })}>
        {occupe ? 'enregistrement…' : 'Continuer'}
      </button>
      <button className="bouton secondaire" onClick={onAnnuler}>Annuler</button>
    </>
  )
}

function Session({ onValider, onAnnuler }: {
  onValider: (ms: number) => Promise<void> | void; onAnnuler: () => void
}) {
  const [ms, setMs] = useState(107300)
  // Même verrou, même motif : la saisie d'une session écrit une session, un
  // tour, un marquage, puis recompose le récapitulatif. C'est le geste le plus
  // long du produit, donc celui qu'on retape le plus.
  const [valider, occupe] = useGeste(onValider)
  return (
    <>
      <div className="libelle">Meilleur tour de la session</div>
      <div className="plat"><Molettes sur={setMs} /></div>
      <div style={{ textAlign: 'center' }}>
        <span className="chiffre hud-64 miami">{formaterChrono(ms)}</span>
      </div>
      <button className="bouton" disabled={occupe} onClick={() => void valider(ms)}>
        {occupe ? 'enregistrement…' : 'Enregistrer la session'}
      </button>
      <button className="bouton secondaire" onClick={onAnnuler}>Retour</button>
    </>
  )
}

/* ─── LE RETOUR IMMÉDIAT — UJ-1 étape 3, sans réseau ───────────────────────
   Le produit ÉNONCE ce qui s'est passé. Il ne décerne jamais. */
function BilanEcran({ db, b, cout, courbe, identite, photos, onSession, onAccueil, onDepense, onRecap, onBudget }: {
  db: Db; b: NonNullable<Bilan>; cout: CoutRoulage | null; courbe: DonneesCourbe | null
  identite: Identite | null
  photos: React.ReactNode
  onSession: () => void; onAccueil: () => void; onDepense: () => void; onRecap: () => void
  onBudget: (centimes: number) => Promise<void>
}) {
  const record = b.ecart != null && b.ecart < 0
  return (
    <>
      <h1 className={'titre ' + (record ? 'record lueur-record' : 'neon')}>
        {b.circuit}
      </h1>

      <div className="bloc pile">
        <div className="libelle">Meilleur tour du jour</div>
        <div style={{ textAlign: 'center' }}>
          <span className={'chiffre hud-64 ' + (record ? 'record' : 'miami')}>
            {b.meilleur != null ? formaterChrono(b.meilleur) : '—'}
          </span>
        </div>

        {/* L'écart porte TOUJOURS son signe, jamais seulement sa couleur. */}
        {b.ecart != null && (
          <div className="rang">
            <span className="libelle">À circuit constant</span>
            <span className={'chiffre hud-24 ' + (b.ecart < 0 ? 'mieux' : 'plus-lent')}>
              {formaterEcart(b.ecart)}
            </span>
          </div>
        )}
        {b.ecart == null && b.meilleur != null && (
          <div className="libelle">Premier chrono sur ce circuit</div>
        )}

        <div className="rang">
          <span className="libelle">Sessions</span>
          <span className="chiffre hud-24">{b.sessions}</span>
        </div>
      </div>

      {/* FR-20 — elle n'apparaît QUE quand elle a de quoi dire quelque chose.
          Une courbe de deux points fait toujours une droite, donc toujours une
          progression ou toujours une chute : le pilote y lirait un mouvement
          qui n'existe pas. Rien ne signale son absence, et rien n'annonce ce
          qu'il faudrait faire pour la voir apparaître. */}
      {courbe && <Courbe d={courbe} />}

      {/* FR-49 — la checklist se coche au fur et à mesure du chargement et
          reste attachée au roulage comme TRACE. Elle ne se vide jamais : c'est
          ce qui la rend utile l'année suivante, quand on ne se rappelle plus
          ce qu'on avait pris. */}
      <Checklist db={db} roulageId={b.id} jour={b.date} />

      {/* FR-19 — LA VISIBILITÉ DU CHRONO EST UN INTERRUPTEUR, ROULAGE PAR
          ROULAGE, masqué par défaut. Il vit à côté du cercle parce que c'est le
          seul endroit où il a une conséquence : ailleurs, le chrono est à toi
          et personne ne le regarde. */}
      <Visibilite db={db} roulageId={b.id} />
      <Cercle identite={identite} circuit={b.circuit} />

      {photos}

      {cout && <BlocCout c={cout} annee={anneeSaison(b.date)} onDepense={onDepense} onBudget={onBudget} />}

      <button className="bouton secondaire" onClick={onRecap}>Voir le récapitulatif</button>
      <button className="bouton" onClick={onSession}>Saisir une session</button>
      <button className="bouton secondaire" onClick={onAccueil}>Accueil</button>
    </>
  )
}

/* ─── LE COÛT — et la clause de sécurité la plus facile à violer ────────────
   Le coût de la journée est une CONSTATATION. Le coût au tour est un RAPPORT,
   et un rapport se manipule : il descend quand on roule plus. Seul, il souffle
   « roule encore ». Adossé au budget consommé, il redevient une mesure.

   FR-21 : le budget consommé est DANS LE MÊME BLOC, sans interaction pour le
   révéler — pas un dépliant, pas une seconde page.
   FR-24 : sans budget déclaré, le coût au tour NE S'AFFICHE PAS. Ni zéro, ni
   tiret : l'absence est une absence. Un champ unique le demande à ce
   moment-là — au premier coût affiché, jamais à la création du compte. */
function BlocCout({ c, annee, onDepense, onBudget }: {
  c: CoutRoulage; annee: number; onDepense: () => void; onBudget: (centimes: number) => Promise<void>
}) {
  const [saisie, setSaisie] = useState('')
  const centimes = enCentimes(saisie)

  if (!c.journeeCentimes) {
    return (
      <div className="bloc pile">
        <div className="libelle">Ce que la journée a coûté</div>
        <p className="texte">Rien de saisi. Ça se note plus tard, pas maintenant.</p>
        <button className="bouton secondaire" onClick={onDepense}>Ajouter une dépense</button>
      </div>
    )
  }

  return (
    <div className="bloc pile">
      <div className="rang">
        <span className="libelle">Ce que la journée a coûté</span>
        <span className="chiffre hud-40">{formaterEuros(c.journeeCentimes)}</span>
      </div>

      {c.auTour ? (
        <>
          <div className="rang">
            <span className="libelle">Au tour · {c.tours} tour{c.tours > 1 ? 's' : ''}</span>
            <span className="chiffre hud-24 miami">{formaterEuros(c.auTour.centimes)}</span>
          </div>
          {/* Jamais séparable du chiffre ci-dessus — et ce n'est plus ce rendu
              qui tient la clause, c'est le type : `auTour` porte son budget. */}
          <div className="rang">
            <span className="libelle">Saison {annee} · consommé</span>
            <span className="chiffre hud-16">
              {formaterEuros(c.auTour.consommeCentimes)} <span className="faible">sur {formaterEuros(c.auTour.budgetCentimes)}</span>
            </span>
          </div>
          <div className="jauge" role="img"
               aria-label={`${formaterEuros(c.auTour.consommeCentimes)} consommés sur ${formaterEuros(c.auTour.budgetCentimes)}`}>
            <span style={{ width: `${Math.min(100, (c.auTour.consommeCentimes / c.auTour.budgetCentimes) * 100)}%` }} />
          </div>
        </>
      ) : (
        <div className="pile">
          <label className="libelle" htmlFor="budget">Budget de la saison {annee}</label>
          <p className="note">
            Sans lui, le coût au tour reste caché : un chiffre qui baisse quand on roule plus
            n'est pas une mesure.
          </p>
          <div className="somme">
            <input id="budget" className="champ chiffre" value={saisie}
                   onChange={(e) => setSaisie(e.target.value)}
                   inputMode="decimal" placeholder="0" autoComplete="off" />
            <span className="unite">€</span>
          </div>
          <button className="bouton secondaire" disabled={!centimes}
                  onClick={() => centimes && void onBudget(centimes)}>
            Poser le budget
          </button>
        </div>
      )}

      <button className="lien" onClick={onDepense}>Ajouter une dépense</button>
    </div>
  )
}

/**
 * FR-19 — L'INTERRUPTEUR DE VISIBILITÉ, roulage par roulage.
 *
 * Masqué par défaut sur tout roulage neuf, et le défaut est celui qui protège :
 * « une comparaison imposée fait cesser la saisie de celui qui en a le plus
 * besoin ». Il ne se règle jamais globalement — un réglage d'un coup pour toute
 * la saison ferait exactement ce que la clause évite.
 */
function Visibilite({ db, roulageId }: { db: Db; roulageId: string }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { void chronoVisible(db, roulageId).then(setVisible) }, [db, roulageId])
  return (
    <button className="lien discret"
            onClick={() => void rendreVisible(db, roulageId, !visible).then(() => setVisible(!visible))}>
      {visible
        ? 'ton chrono de ce jour est visible par ton cercle · le masquer'
        : 'ton chrono de ce jour est masqué · le montrer à ton cercle'}
    </button>
  )
}
