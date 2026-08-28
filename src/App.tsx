import { useCallback, useEffect, useState } from 'react'
import { ENVIRONNEMENT, EST_PRODUCTION, MOT_ENVIRONNEMENT, PRODUCT_NAME } from './product'
import { demanderPersistance, ouvrirBase } from './db/powersync'
import { direLAbri, lireAbri, proposerInstallation, surAbri, type Abri } from './db/abri'
import {
  ajouterSession, anneeSaison, bilanRoulage, coutDuRoulage, creerRoulage, depenseSaison, formaterChrono,
  classerRoulages, listerMachines, type Machine,
  circuitsProposes, enCentimes, formaterEcart, formaterEuros, listerRoulages, normaliserCircuits,
  modifierRoulage, normaliserEtats, poserBudget, supprimerRoulage,
  type ContenuDuRoulage, type Propose,
  type CoutRoulage,
} from './db/depot'
import { Depense } from './ecrans/Depense'
import { jaugeBudget, repereMensuel } from './db/budget'
import { NoterUneDepense } from './ecrans/Budget'
import { surCompte, type Identite } from './db/compte'
import { creerConnecteur, powersyncConfigure } from './db/connecteur'
import { adopter, estAdopte, marquerPremiereSauvegardeDite, premiereSauvegardeDite } from './db/sauvegarde'
import { supabaseConfigure } from './db/supabase'
import { ouverture } from './db/mesures'
import { surRetourDeReseau, televerserEnAttente } from './db/photos'
import { televerserVideosEnAttente } from './db/video'
import { Photos } from './ecrans/Photos'
import { Icone } from './ecrans/Icones'
import { useGlissement } from './ecrans/glissement'
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
import { televerserDocuments } from './db/documents'
import { Chutes } from './ecrans/Chute'
import { Preparation } from './ecrans/Preparation'
import { retirerLEcranDeChargement } from './chargement'
import { Circuit } from './ecrans/Circuit'
import { Molettes } from './ecrans/Molettes'
import { Sonde } from './ecrans/Sonde'
import { useGeste } from './ecrans/geste'
import { Trophee } from './ecrans/Trophee'
import { Journee } from './ecrans/Journee'
import { aujourdhui, estAVenir, sePrepare } from './db/vecu'

type Db = ReturnType<typeof ouvrirBase>

/** Où en est le dépôt de l'état local sur le serveur. `inconnue` tant qu'aucun
 *  compte n'existe — ce n'est ni un échec ni une attente, il n'y a simplement
 *  rien à adopter. */
export type Adoption =
  | { etat: 'inconnue' }
  | { etat: 'attend_le_reseau' }
  | { etat: 'hors_production' }
  | { etat: 'en_cours' }
  | { etat: 'faite' }
  | { etat: 'partielle'; refus: number; motif: string }
  | { etat: 'echec'; motif: string }
type Ecran = 'accueil' | 'garage' | 'roulages' | 'nouveau' | 'modifier' | 'session' | 'bilan' | 'journee' | 'depense' | 'recap' | 'compte' | 'sonde' | 'legal' | 'circuit'
type Bilan = Awaited<ReturnType<typeof bilanRoulage>>
type Liste = Awaited<ReturnType<typeof listerRoulages>>

/** Le groupe se saisit sur l'échelle de SON organisateur. Pau-Arnos annonce
 *  2 à 4 groupes nommés Initiation/Intermédiaire/Confirmé/Expert, pas
 *  Blanc/Jaune/Rouge. Seul le RANG est comparable d'une sortie à l'autre. */
const GROUPES = ['Initiation', 'Intermédiaire', 'Confirmé', 'Expert']

export default function App() {
  const [db, setDb] = useState<Db | null>(null)
  /* NFR-1, seconde moitié : l'état de la persistance se LIT quelque part. Il
     était demandé à chaque démarrage et le booléen était jeté. */
  const [abri, setAbri] = useState<Abri | null>(null)
  const [panne, setPanne] = useState<string | null>(null)

  // ⚠ LE DÉCOR PART QUAND IL Y A QUELQUE CHOSE DERRIÈRE, et « quelque chose »
  // inclut la PANNE : un écran de chargement qui tourne indéfiniment sur un
  // navigateur qui a refusé le stockage est le pire des deux mondes — le pilote
  // attend une application qui ne viendra jamais, et le message qui le lui dirait
  // est caché dessous.
  useEffect(() => { if (db || panne) retirerLEcranDeChargement() }, [db, panne])
  const [ecran, setEcran] = useState<Ecran>('accueil')
  /** L'accueil ouvre une dépense libre ; une journée conserve son rattachement.
   *  Sans ce témoin, le dernier roulage resté en mémoire gagnerait en silence. */
  const [depenseLibre, setDepenseLibre] = useState(false)
  const [depenseNote, setDepenseNote] = useState<string | null>(null)
  /** La journée que le récit 22.1 va corriger. Un identifiant et non la ligne :
   *  la liste se rafraîchit après l'enregistrement, et une copie figée
   *  afficherait l'ancien circuit sur l'écran qu'on vient de quitter. */
  const [aModifier, setAModifier] = useState<string | null>(null)
  /** Récit 22.3 — la toute première sauvegarde se dit UNE fois. */
  const [premiereSauvegarde, setPremiereSauvegarde] = useState(false)
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
  /** Le circuit dont on regarde la fiche. Il voyage par son NOM et non par un
   *  identifiant : le référentiel peut ne pas le connaître, et la fiche doit
   *  quand même s'ouvrir — c'est ce que le pilote y a fait qui la remplit. */
  const [circuitVu, setCircuitVu] = useState<string | null>(null)
  /** L'ADOPTION SE FAIT TOUTE SEULE — « ça devrait se faire automatiquement
   *  aussi hein ». Son état est ici et non dans l'écran du compte : c'est
   *  l'application qui l'entreprend, l'écran ne fait que la raconter. */
  const [adoption, setAdoption] = useState<Adoption>({ etat: 'inconnue' })
  const [essai, setEssai] = useState(0)

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
    // `adoption` est dans les dépendances pour que la synchronisation continue
    // s'allume DÈS que l'adoption automatique aboutit, sans attendre un
    // rechargement. Sans elle, la première sauvegarde réussissait et le suivi
    // continu restait éteint jusqu'à la prochaine ouverture.
  }, [db, identite, adoption])


  const rafraichir = useCallback(async (base: Db) => {
    setListe(await listerRoulages(base))
    // AD-6 : l'accueil se recalcule À L'OUVERTURE et à chaque écriture. Rien ne
    // tourne pendant que l'application est fermée, donc rien ne peut avoir
    // manqué son rendez-vous — l'accueil est immunisé par construction.
    setSrc(await sourceAccueil(base, aujourdhui()))
    setConseil(await conseilDuJour(base, aujourdhui()))
  }, [])
  useEffect(() => { if (db) void rafraichir(db) }, [db, rafraichir])

  /* L'abri se relit au retour au premier plan et quand l'invitation arrive :
     l'événement `beforeinstallprompt` est tiré une fois, tôt, et il ne repasse
     pas — l'écran doit pouvoir se mettre à jour après coup. */
  useEffect(() => {
    const relire = () => { void lireAbri().then(setAbri) }
    relire()
    return surAbri(relire)
  }, [])

  /**
   * ⚠ ET ELLE SE RECOMPOSE CHAQUE FOIS QU'ON OUVRE LA LISTE.
   *
   * `rafraichir` ne partait qu'à l'ouverture de l'application et sur les
   * écritures que l'écran des roulages déclenche lui-même. Or tout ce qui se
   * saisit DANS une journée — une dépense, un geste, une photo, une chute —
   * s'écrit depuis un autre écran et revient au bilan, jamais à la liste. La
   * liste gardait donc l'état d'avant jusqu'au prochain démarrage.
   *
   * Ce n'était déjà pas rien : une journée à 180 € s'y affichait sans son
   * argent. C'est devenu grave quand la phrase de confirmation de suppression
   * s'est mise à lire ces comptes — elle aurait annoncé « elle part seule » sur
   * une journée qui emportait une dépense. Sur le seul geste irréversible du
   * produit, une donnée périmée est un mensonge.
   */
  useEffect(() => {
    if (db && ecran === 'roulages') void rafraichir(db)
  }, [db, ecran, rafraichir])

  /**
   * ⚠ LA PREMIÈRE SAUVEGARDE NE SE DEMANDE PLUS — retour de Julian : « bug de
   * sauvegarde, ça devrait se faire automatiquement aussi hein ». Il a raison
   * sur les deux plans, et le second est le vrai sujet.
   *
   * Le produit exigeait un tap sur « Première sauvegarde » pour déposer au
   * serveur ce qui avait été saisi avant le compte — et TANT QUE CE TAP
   * N'AVAIT PAS EU LIEU, la synchronisation continue restait éteinte. Une
   * saison entière pouvait donc vivre sur un seul téléphone, avec un compte
   * connecté qui affichait « en attente » sans que personne ne comprenne ce
   * qu'on attendait de lui. Une sauvegarde qu'il faut penser à faire est une
   * sauvegarde qu'on n'a pas.
   *
   * Le bouton reste, comme recours et comme preuve : on peut toujours forcer,
   * et voir ce qui est parti.
   *
   * TROIS GARDE-FOUS, et le troisième est le plus important :
   *   ① Rien ne part hors ligne — ce serait un échec garanti, et un message
   *     d'erreur pour une situation normale au paddock.
   *   ② `estAdopte` interdit de rejouer : l'adoption dépose l'état local
   *     ENTIER sous le nom du pilote, et n'a de sens qu'une fois.
   *   ③ Aucune boucle. Une tentative par apparition de compte, et une par
   *     retour de réseau ou de premier plan — c'est-à-dire par geste humain.
   *     Un échec qui se relance tout seul devient une facture.
   */
  useEffect(() => {
    if (!db || !identite || !supabaseConfigure) return
    if (estAdopte(identite.id)) { setAdoption({ etat: 'faite' }); return }
    // ⚠ ④ ET HORS PRODUCTION, ELLE NE PART PAS TOUTE SEULE — voir `ENVIRONNEMENT`
    //   dans product.ts pour l'enchaînement complet. Le drapeau d'adoption vit
    //   dans le localStorage, donc par ORIGINE : sur une recette il est absent,
    //   le produit se croit vierge, et le premier « se connecter » déverse la
    //   base d'essai dans la vraie saison. Le bouton manuel reste, et il montre
    //   ce qu'il enverrait avant de l'envoyer. C'est la différence entre un
    //   dépôt décidé et un dépôt subi.
    if (!EST_PRODUCTION) { setAdoption({ etat: 'hors_production' }); return }
    if (!navigator.onLine) { setAdoption({ etat: 'attend_le_reseau' }); return }

    let vivant = true
    setAdoption({ etat: 'en_cours' })
    void adopter(db, identite.id)
      .then(({ refus }) => {
        if (!vivant) return
        /* ⚠ ELLE SE DIT UNE FOIS, EN CLAIR, ET NE SE REDIT PLUS — récit 22.3.
           C'est le seul moment du produit où le pilote a besoin d'entendre ce
           qui vient de se passer : jusque-là tout vivait sur son téléphone, et
           depuis cet instant tout est aussi ailleurs. Le redire à chaque
           ouverture en ferait un décor qu'on cesse de lire, et l'effet
           rassurant se paierait en attention perdue — le drapeau est posé au
           moment où on le montre, jamais rejoué.
           Il n'est PAS posé quand `estAdopte` a court-circuité plus haut : ce
           chemin-là est celui des ouvertures suivantes, où il n'y a rien à
           annoncer. */
        if (!refus.length && !premiereSauvegardeDite()) {
          setPremiereSauvegarde(true); marquerPremiereSauvegardeDite()
        }
        setAdoption(refus.length
          ? { etat: 'partielle', refus: refus.length, motif: refus[0].motif }
          : { etat: 'faite' })
        void rafraichir(db)
      })
      .catch((e: unknown) => {
        if (vivant) setAdoption({ etat: 'echec', motif: (e as Error).message })
      })
    return () => { vivant = false }
  }, [db, identite, essai, rafraichir])

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
      // La reprise d'une suppression locale ne dépend pas d'un compte ; seul
      // l'envoi d'une nouvelle photo est court-circuité sans identité.
      void televerserEnAttente(db, identite?.id ?? null)
      // ⚠ LA VIDÉO PASSE PAR LES MÊMES DEUX DÉCLENCHEURS, mais elle est la seule
      // à REPRENDRE au lieu de recommencer : un clip coupé à 80 % sur la 4G du
      // paddock repart de 80 % à la prochaine ouverture. C'est ce qui la rend
      // durable — sans reprise, un fichier de cette taille ne finit jamais de
      // monter et le carnet montrerait une pièce que le serveur n'a pas.
      void televerserVideosEnAttente(db, identite?.id ?? null)
      if (identite) {
        // Les documents suivent le même chemin et les mêmes deux déclencheurs :
        // un manuel versé au paddock part au retour du réseau, pas avant.
        void televerserDocuments(db, identite.id)
      }
      // Et l'adoption retente, si elle n'a pas encore abouti. C'est le seul
      // rythme qu'elle a : un geste humain, jamais une horloge.
      setEssai((n) => n + 1)
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

  // ⚠ TANT QUE LA BASE N'EST PAS LÀ, ON NE REND RIEN DU TOUT — et surtout pas
  // le mot « chargement ». Le décor d'index.html occupe l'écran depuis le
  // premier coup d'œil ; lui superposer deux mots gris serait le cacher au
  // moment précis où il sert.
  if (!db) return null

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

  /**
   * OUVRIR UNE JOURNÉE — ET C'EST LA JOURNÉE QUI DÉCIDE DE L'ÉCRAN, récit 17.2.
   *
   * ⚠ CE SEUL AIGUILLAGE EST TOUT LE RÉCIT. Il n'y avait pas d'aiguillage : le
   * tap ouvrait `bilan`, toujours, y compris sur une journée saisie pour
   * septembre — et le bilan demandait alors « Meilleur tour du jour », affichait
   * « Sessions 0 », proposait de déclarer une chute et poussait « Saisir une
   * session » en bouton primaire. L'application réclamait le récit d'une journée
   * qui n'a pas eu lieu.
   *
   * Le prédicat vit dans `src/db/vecu.ts` et il tient à un FAIT OBSERVABLE — la
   * date, et la première MESURE saisie sur la journée — jamais à une heure ni à
   * un réglage. Il est le même depuis l'accueil et depuis la liste des
   * roulages : deux chemins vers la même journée ne peuvent pas ouvrir deux
   * écrans différents.
   */
  const ouvrirRoulage = async (id: string) => {
    const b = await chargerRoulage(id)
    setEcran(b && sePrepare(b) ? 'journee' : 'bilan')
    return b
  }

  /**
   * LES GESTES DE LA JOURNÉE — COMPOSÉS UNE FOIS, RENDUS SUR LES DEUX ÉCRANS.
   *
   * ⚠ CE BLOC EST LA CORRECTION D'UNE PORTE FERMÉE EN SILENCE. Le bilan portait
   * les photos, les gestes, la chute, le coût, le récapitulatif et
   * l'interrupteur de visibilité ; l'écran de préparation, non. Or sur une
   * journée datée du JOUR MÊME c'est LUI qui s'ouvre — le pilote est au
   * paddock, et il venait de perdre les six chemins sans qu'une ligne le lui
   * dise. « On change ce qui est PROPOSÉ EN PREMIER, on ne ferme aucune porte » :
   * la première moitié était tenue, la seconde ne l'était pas.
   *
   * ⚠ ET ILS SONT COMPOSÉS ICI, PAS DANS CHAQUE ÉCRAN. Deux compositions du
   * même bloc divergent à la première correction — c'est exactement ce que la
   * checklist s'interdit en se DÉPLAÇANT plutôt qu'en se dupliquant. Un seul
   * `<Photos>`, un seul `<Chutes>`, un seul `<BlocCout>`, un seul
   * `<Visibilite>` : les deux écrans reçoivent le même nœud.
   */
  const gestesDeLaJournee = bilan && courant ? {
    photos: <Photos db={db} roulageId={courant} />,
    chutes: (
      <Chutes db={db} roulageId={courant} machineId={bilan.machine_id} date={bilan.date}
              onEcrit={() => {
                void rafraichir(db)
                // Une réparation de crash écrit bien une dépense de machine,
                // mais ce bloc est un instantané de la journée. Le recalculer
                // ici évite d'exiger une navigation pour voir le coût gardé.
                void coutDuRoulage(db, courant, anneeSaison(bilan.date)).then(setCout)
              }} />
    ),
    cout: cout && (
      <BlocCout c={cout} annee={anneeSaison(bilan.date)}
                onDepense={() => { setDepenseLibre(false); setEcran('depense') }}
                onBudget={async (centimes: number) => {
                  await poserBudget(db, anneeSaison(bilan.date), centimes)
                  setCout(await coutDuRoulage(db, courant, anneeSaison(bilan.date)))
                }} />
    ),
    visibilite: <Visibilite db={db} roulageId={courant} />,
    onRecap: () => void rassembler(courant).then((m) => { setMatiere(m); setEcran('recap') }),
  } : null

  return (
    <>
      <div className="sol" aria-hidden />
      {/* ⚠ LE BANDEAU N'EST PAS DÉCORATIF. Recette et production sont identiques
          au pixel près et parlent à la MÊME base : sans ces mots, on retire une
          vraie journée en croyant éprouver un bouton. Il est en haut, il ne se
          referme pas, et il dit la conséquence — pas seulement le nom. */}
      {!EST_PRODUCTION && (
        <p className="bandeau-environnement" role="status">
          {MOT_ENVIRONNEMENT[ENVIRONNEMENT as Exclude<typeof ENVIRONNEMENT, 'production'>]}
        </p>
      )}
      <div className="ecran" data-environnement={ENVIRONNEMENT}
           data-abri={abri ? (abri.menace ? 'menace' : 'persistant') : 'inconnu'}>
        {/* ⚠ ELLE SE DIT UNE FOIS ET NE SE REDIT PLUS — récit 22.3. Elle porte
            la seule chose que le pilote ne peut pas déduire de l'écran : ce qui
            vivait sur son téléphone est maintenant aussi ailleurs. Elle ne
            réclame rien, elle ne se referme par aucun tap obligatoire, et elle
            disparaît au changement d'écran comme un fait qu'on a lu. */}
        {premiereSauvegarde && (
          <p className="note premiere-sauvegarde">
            C'est gardé. Ta saison est maintenant sur ton compte en plus de ce téléphone —
            elle redescendra sur tes autres appareils, et tu n'auras plus rien à faire pour ça.
          </p>
        )}
        {ecran === 'accueil' && (
          <Accueil db={db} src={src} conseil={conseil} abri={abri}
                   onNouveau={() => { setDepenseNote(null); setEcran('nouveau') }}
                   onOuvrir={(id) => { setDepenseNote(null); return ouvrirRoulage(id) }}
                   onLegal={() => { setDepenseNote(null); setEcran('legal') }}
                   depenseNote={depenseNote}
                   onDepense={() => {
                     setDepenseNote(null); setDepenseLibre(true); setEcran('depense')
                   }}
                   onAller={(vers, roulageId) => {
                     setDepenseNote(null)
                     // L'argent d'une journée se saisit SUR la journée : la
                     // dépense d'engagement porte `cible = 'roulage'`, et la
                     // saisir ailleurs la rattacherait à la saison seule.
                     // ⚠ On CHARGE sans ouvrir : passer par l'aiguillage
                     // afficherait la journée une fraction de seconde avant de
                     // basculer sur la dépense, et un écran qui apparaît pour
                     // disparaître se lit comme un bug.
                     if (vers === 'budget') {
                       setDepenseLibre(false)
                       void chargerRoulage(roulageId).then(() => setEcran('depense'))
                     }
                     else setEcran('garage')
                   }} />
        )}
        {ecran === 'roulages' && <Roulages db={db} liste={liste} onOuvrir={ouvrirRoulage}
                                            onModifier={(id) => { setAModifier(id); setEcran('modifier') }}
                                            onNouveau={() => setEcran('nouveau')}
                                            onEcrit={() => void rafraichir(db)} />}
        {/* ⚠ LA LIGNE VIENT DE `liste`, ET C'EST VOULU : elle porte déjà le
            circuit, la date, le groupe et la machine, lus dans la même requête
            que la liste. Une seconde lecture par identifiant ferait un second
            chemin vers les mêmes colonnes, et c'est toujours celui-là qui prend
            du retard. Si la journée n'y est plus — elle vient d'être retirée
            depuis un autre onglet — l'écran ne se monte simplement pas. */}
        {ecran === 'modifier' && aModifier && liste.some((r) => r.id === aModifier) && (
          <Modifier db={db} r={liste.find((r) => r.id === aModifier)!}
                    onFini={() => { setAModifier(null); setEcran('roulages'); void rafraichir(db) }}
                    onAnnuler={() => { setAModifier(null); setEcran('roulages') }} />
        )}
        {ecran === 'nouveau' && (
          <Nouveau db={db} onValider={async (r) => {
            const id = await creerRoulage(db, r)
            setCourant(id); await rafraichir(db)
            /* ⚠ ON NE DEMANDE PAS LE CHRONO D'UNE JOURNÉE QUI N'A PAS EU LIEU
               — récit 17.1. La saisie d'une date future marchait déjà ; c'est
               la ligne suivante qui mentait, en enchaînant sur « Meilleur tour
               de la session » pour le 12 septembre saisi le 25 août.
               Une journée saisie AUJOURD'HUI garde son chemin : c'est le geste
               du soir en rentrant du circuit, et il ne change pas. */
            if (estAVenir(r.date)) await ouvrirRoulage(id)
            else setEcran('session')
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
          }} onAnnuler={() => void ouvrirRoulage(courant)} />
        )}
        {ecran === 'bilan' && bilan && courant && gestesDeLaJournee && (
          <BilanEcran
            db={db} b={bilan} courbe={courbe} identite={identite}
            onSession={() => setEcran('session')}
            onAccueil={() => setEcran('accueil')}
            onRecap={gestesDeLaJournee.onRecap}
            photos={gestesDeLaJournee.photos}
            chutes={gestesDeLaJournee.chutes}
            cout={gestesDeLaJournee.cout}
            visibilite={gestesDeLaJournee.visibilite}
            onCircuit={() => { setCircuitVu(bilan.circuit); setEcran('circuit') }}
          />
        )}
        {/* ⚠ LE MÊME ROULAGE, L'AUTRE MOITIÉ DU CHEMIN — récit 17.2. Ce n'est
            pas un second bilan : c'est ce qui PRÉPARE la journée, là où le
            bilan raconte ce qu'elle a été. Aucun des deux n'est atteignable
            depuis l'autre par erreur — `sePrepare` tranche, et il tranche sur
            un fait observable. */}
        {ecran === 'journee' && bilan && courant && gestesDeLaJournee && (
          <Journee
            db={db}
            r={{ id: bilan.id, circuit: bilan.circuit, date: bilan.date,
                 machine_id: bilan.machine_id }}
            /* ⚠ LES MÊMES NŒUDS QUE LE BILAN, ET C'EST TOUTE LA CORRECTION. Ces
               six chemins se fermaient en silence sur une journée du jour même. */
            photos={gestesDeLaJournee.photos}
            chutes={gestesDeLaJournee.chutes}
            cout={gestesDeLaJournee.cout}
            visibilite={gestesDeLaJournee.visibilite}
            onRecap={gestesDeLaJournee.onRecap}
            onAller={(vers) => {
              if (vers === 'budget') { setDepenseLibre(false); setEcran('depense') }
              else setEcran('garage')
            }}
            onSession={() => setEcran('session')}
            onCircuit={() => { setCircuitVu(bilan.circuit); setEcran('circuit') }}
            onAccueil={() => setEcran('accueil')}
          />
        )}
        {ecran === 'recap' && matiere && courant && (
          <Recap db={db} matiere={matiere} onFermer={() => void ouvrirRoulage(courant)} />
        )}
        {ecran === 'depense' && (depenseLibre || (courant && bilan)) && (
          <Depense db={db}
                   roulageId={depenseLibre ? null : courant}
                   dateRoulage={depenseLibre ? null : bilan?.date ?? null}
                   onFini={async (centimes) => {
                     await rafraichir(db)
                     if (depenseLibre) {
                       const total = await depenseSaison(db, Number(aujourdhui().slice(0, 4)))
                       setDepenseNote(
                         `Dépense notée · ${formaterEuros(centimes)} · Saison ${formaterEuros(total)}`)
                       setDepenseLibre(false); setEcran('accueil')
                     }
                     else if (courant) void ouvrirRoulage(courant)
                   }}
                   onAnnuler={() => {
                     if (depenseLibre) { setDepenseLibre(false); setEcran('accueil') }
                     else if (courant) void ouvrirRoulage(courant)
                   }} />
        )}
        {ecran === 'garage' && <Garage db={db} onEcrit={() => void rafraichir(db)} />}
        {ecran === 'compte' && <Compte db={db} identite={identite} adoption={adoption}
                                       onLegal={() => setEcran('legal')}
                                       onSonde={() => setEcran('sonde')} />}
        {ecran === 'sonde' && <Sonde db={db} onFermer={() => setEcran('compte')} />}
        {/* QO-11 : les textes existent, et ils sont ATTEIGNABLES. Un document
            juridique que rien ne lie n'a jamais été publié. */}
        {ecran === 'legal' && <Legal onFermer={() => setEcran('compte')} />}
        {/* ⚠ LE RETOUR DE LA FICHE PASSE PAR L'AIGUILLAGE, lui aussi. Écrit en
            dur, il ramenait sur `bilan` — donc, depuis la fiche ouverte d'une
            journée à venir, sur le post-mortem qu'on vient précisément de
            retirer du chemin. Une sortie qui ne ramène pas d'où l'on vient est
            un cul-de-sac déguisé. */}
        {ecran === 'circuit' && circuitVu && (
          <Circuit db={db} nom={circuitVu}
                   onFermer={() => { if (courant) void ouvrirRoulage(courant); else setEcran('roulages') }} />
        )}
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
      {/* ⚠ L'AVERTISSEMENT PERMANENT — LA CONTREPARTIE POSÉE PAR JULIAN LUI-MÊME
          le 25 août, et sans elle le récit 17.5 n'aurait pas dû s'écrire :

            « C'est la pratique d'un sport, un petit disclaimer en bas de l'app
              devrait suffire. »

          Ce que ça paie : le produit accepte maintenant qu'on POSE ce qu'on vient
          chercher — « poser le genou à gauche », « faire 1 min 30 » —, c'est-à-dire
          trois règles écrites levées d'un coup (le mot « objectif » interdit, la
          cible chiffrée de chrono, les caps de bravoure). Une chose qu'on s'est
          promise avant de partir pèse sur la décision qu'on prend en piste, et
          c'est exactement pour ça que ces règles existaient.

          ⚠ IL NE SE FERME PAS, IL NE SE COCHE PAS, IL NE S'OUBLIE PAS. Un
          avertissement qu'on peut renvoyer d'un tap est un avertissement qu'on
          renvoie une fois pour toutes le premier jour. Il est en bas, discret,
          sur tous les écrans — c'est le prix de la levée, et il se paie en
          continu ou il ne se paie pas. */}
      <p className="note avertissement">
        Le roulage sur circuit est une pratique sportive à risque. Ce que tu poses ici
        n'engage que toi : aucune ligne de cette application ne vaut un conseil, une
        validation, ni une raison de forcer.
      </p>

      <nav className="barre">
        <button className="onglet" data-actif={ecran === 'accueil' ? '1' : '0'} onClick={() => setEcran('accueil')}>ACCUEIL</button>
        <button className="onglet" data-actif={ecran === 'garage' ? '1' : '0'} onClick={() => { setDepenseNote(null); setEcran('garage') }}>GARAGE</button>
        <button className="onglet" data-actif={ecran === 'roulages' ? '1' : '0'} onClick={() => { setDepenseNote(null); setEcran('roulages') }}>ROULAGES</button>
        <button className="onglet" data-actif={ecran === 'compte' || ecran === 'sonde' ? '1' : '0'} onClick={() => { setDepenseNote(null); setEcran('compte') }}>COMPTE</button>
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
function Accueil({ db, src, conseil, abri, depenseNote, onNouveau, onOuvrir, onLegal, onDepense, onAller }: {
  db: Db; src: Source | null; conseil: string | null; abri: Abri | null
  depenseNote: string | null
  onNouveau: () => void; onOuvrir: (id: string) => void
  onLegal: () => void
  onDepense: () => void
  /** Chaque tâche de préparation MÈNE QUELQUE PART. Une liste de rappels dont
   *  les lignes ne mènent nulle part se lit une fois et ne se relit jamais. */
  onAller: (vers: 'atelier' | 'usure' | 'budget', roulageId: string) => void
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
      {/* ⚠ IL EST ICI, ET PAS DANS L'ÉCRAN DU COMPTE. Celui que ça menace est
          justement celui qui n'a pas de compte : un inconnu venu d'une publicité
          qui saisit sa première journée dans un onglet. Le mettre derrière le
          compte, c'est le montrer à ceux qui sont déjà protégés. */}
      <Abrite abri={abri} />
      {/* ⚠ LA PRÉPARATION N'APPARAÎT QUE SUR UN ROULAGE À VENIR, et jamais sur
          le dernier vécu. « Ce qui reste à faire » sur une journée déjà passée
          serait un reproche, et le produit ne reproche rien.

          Elle vit sous la zone temporelle et au-dessus des chiffres : c'est ce
          qu'on vient chercher quand une date approche, et ce n'est rien du tout
          le reste de l'année — où elle est simplement absente. */}
      {src?.genre === 'a_venir' && (
        <Preparation db={db}
                     roulage={{ id: src.roulage.id, machineId: src.roulage.machine_id,
                                date: src.roulage.date_jour }}
                     onAller={(vers) => onAller(vers, src.roulage.id)} />
      )}
      {/* La saisie vit avant l'analyse et sur tout accueil, même sans roulage :
          un achat existe toute l'année. Le formulaire s'ouvre sur sa page. */}
      <NoterUneDepense onOuvrir={onDepense} />
      {depenseNote && <p className="note" role="status">{depenseNote}</p>}
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

/**
 * CE QUI MENACE LA SAISON, DIT UNE FOIS, SANS INSISTER.
 *
 * Trois règles tiennent ce bloc, et elles sont plus importantes que son contenu :
 *   ① Il DISPARAÎT dès que le stockage est persistant. Ce n'est pas une campagne
 *     d'installation, c'est l'énoncé d'un état.
 *   ② Il dit la CONSÉQUENCE avant le geste — « sept jours sans visite », pas
 *     « installez notre application ».
 *   ③ Il ne promet rien qu'il ne tienne : sur iOS il n'y a aucun bouton à
 *     offrir, parce que Safari n'a jamais implémenté l'invitation. Un bouton qui
 *     ouvrirait un menu système inexistant serait pire que la phrase.
 */
function Abrite({ abri }: { abri: Abri | null }) {
  const [issue, setIssue] = useState<string | null>(null)
  if (!abri) return null
  const mot = direLAbri(abri)
  if (!mot) return null

  return (
    <div className="bloc pile abri">
      <div className="libelle">{mot.titre}</div>
      <p className="texte">{mot.texte}</p>
      {abri.proposable ? (
        <button className="bouton secondaire" onClick={() => void proposerInstallation().then((i) => {
          // Un refus ne se commente pas : c'est un choix, pas une erreur.
          if (i === 'impossible') setIssue("Ce navigateur n'a pas ouvert l'installation.")
        })}>
          Poser {PRODUCT_NAME} sur l'écran d'accueil
        </button>
      ) : mot.geste ? <p className="note">{mot.geste}</p> : null}
      {issue && <p className="note">{issue}</p>}
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
            Un premier roulage ouvrira les analyses. Une dépense peut déjà être notée ci-dessous.
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

function Roulages({ db, liste, onOuvrir, onModifier, onNouveau, onEcrit }: {
  db: Db; liste: Liste; onOuvrir: (id: string) => void; onModifier: (id: string) => void
  onNouveau: () => void; onEcrit: () => void
}) {
  const groupes = classerRoulages(liste)
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
      <SectionRoulages id="aujourdhui" titre="Aujourd'hui" vide="Aucun roulage aujourd'hui."
                       db={db} liste={groupes.aujourdhui} onOuvrir={onOuvrir}
                       onModifier={onModifier} onEcrit={onEcrit} />
      <SectionRoulages id="a-venir" titre="À venir" vide="Aucun roulage à venir."
                       db={db} liste={groupes.aVenir} onOuvrir={onOuvrir}
                       onModifier={onModifier} onEcrit={onEcrit} />
      <SectionRoulages id="passes" titre="Passés" vide="Aucun roulage passé."
                       db={db} liste={groupes.passes} onOuvrir={onOuvrir}
                       onModifier={onModifier} onEcrit={onEcrit} />
      <button className="bouton" onClick={onNouveau}>Saisir un roulage</button>
      {/* FR-54 — L'ÉVÉNEMENT VISÉ vit ici et non au garage : il ne touche pas la
          machine, il vise une SORTIE. « Désiré avant d'être réservé » : c'est
          exactement ce qui manquait à l'accueil temporel pour avoir quelque
          chose à montrer quand rien n'est encore réservé. */}
      <Evenements db={db} onEcrit={onEcrit} />
    </>
  )
}

function SectionRoulages({ id, titre, vide, db, liste, onOuvrir, onModifier, onEcrit }: {
  id: 'aujourdhui' | 'a-venir' | 'passes'; titre: string; vide: string; db: Db; liste: Liste
  onOuvrir: (id: string) => void; onModifier: (id: string) => void; onEcrit: () => void
}) {
  return (
    <section className="pile groupe-roulages" aria-labelledby={`roulages-${id}`}>
      <h2 id={`roulages-${id}`} className="titre-section">{titre}</h2>
      {liste.length ? liste.map((r) => (
        <LigneRoulage key={r.id} db={db} r={r} onOuvrir={onOuvrir}
                      onModifier={onModifier} onEcrit={onEcrit} />
      )) : <p className="note">{vide}</p>}
    </section>
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
function LigneRoulage({ db, r, onOuvrir, onModifier, onEcrit }: {
  db: Db; r: Liste[number]; onOuvrir: (id: string) => void
  onModifier: (id: string) => void; onEcrit: () => void
}) {
  const [confirme, setConfirme] = useState(false)
  const glisse = useGlissement()
  const [retirer, occupe] = useGeste(async () => {
    await supprimerRoulage(db, r.id)
    onEcrit()
  })
  const chronoAccessible = r.meilleur != null
    ? `chrono ${formaterChrono(r.meilleur)}` : 'aucun chrono'
  const crashAccessible = r.chutes > 0
    ? r.chutes === 1 ? 'Crash documenté' : `${r.chutes} crashs documentés`
    : r.crash_statut === 'aucun' ? 'Aucun crash déclaré' : 'Crash à renseigner'

  /* ⚠ LA PHRASE NOMME CE QUI EST LÀ. La suppression emporte aussi les gestes,
     la checklist et LES DÉPENSES DE LA JOURNÉE : promettre moins que ce qu'on
     détruit est le seul mensonge qu'un produit ne peut pas se permettre sur son
     unique geste irréversible. Les comptes descendent avec la liste, donc la
     phrase est là au tap — une confirmation qui attend une requête est une
     confirmation qu'on tape deux fois. */
  const enumere = (c: ContenuDuRoulage): string => {
    const p: string[] = []
    if (c.sessions) p.push(`${c.sessions} session${c.sessions > 1 ? 's' : ''} chronométrée${c.sessions > 1 ? 's' : ''}`)
    if (c.photos) p.push(`${c.photos} photo${c.photos > 1 ? 's' : ''}`)
    if (c.gestes) p.push(`${c.gestes} geste${c.gestes > 1 ? 's' : ''} déclaré${c.gestes > 1 ? 's' : ''}`)
    if (c.chutes) p.push(`${c.chutes} crash${c.chutes > 1 ? 's' : ''} documenté${c.chutes > 1 ? 's' : ''}`)
    if (c.depenses) p.push(`${c.depenses} dépense${c.depenses > 1 ? 's' : ''} — ${formaterEuros(c.depenses_centimes)}`)
    if (c.checklist) p.push('sa checklist')
    if (!p.length) return ''
    return p.length === 1 ? p[0] : `${p.slice(0, -1).join(', ')} et ${p[p.length - 1]}`
  }

  return (
    <div className="bloc pile ligne-glissante" data-ouvert={glisse.ouvert ? '1' : '0'}
         data-roulage-id={r.id}>
      {/* ⚠ `touch-action: pan-y` VIT DANS LA FEUILLE, SUR CETTE CLASSE. Sans lui
          le navigateur ne sait pas qu'il garde le défilement vertical pour lui,
          et une liste qu'on fait défiler s'entrouvre sous le pouce. */}
      <div className="pile glissable" {...glisse.liaisons}
           role="button" tabIndex={0}
           aria-label={`Ouvrir ${r.circuit_nom}, ${r.date_jour}, ${chronoAccessible}, ${crashAccessible}`}
           onClick={() => { if (!glisse.ouvert) onOuvrir(r.id) }}
           onKeyDown={(e) => {
             if (!glisse.ouvert && (e.key === 'Enter' || e.key === ' ')) {
               e.preventDefault(); onOuvrir(r.id)
             }
           }}>
        <div className="rang">
          <span className="titre" style={{ fontSize: 20 }}>{r.circuit_nom}</span>
          <span className="libelle">{r.date_jour}</span>
        </div>
        <div className="rang">
          <span className="hud-12 faible">
            {r.groupe_nom ?? '—'}{r.groupe_rang ? ` · ${r.groupe_rang}/${r.groupe_total}` : ''}
          </span>
          <span className="rang ligne-roulage-resultats">
            {r.chutes > 0 && (
              <span className="marqueur-crash">
                <Icone nom="impact" taille={14} />
                {r.chutes === 1 ? 'Crash' : `${r.chutes} crashs`}
              </span>
            )}
            <span className="chiffre hud-24 miami">
              {r.meilleur != null ? formaterChrono(r.meilleur) : '—'}
            </span>
          </span>
        </div>
      </div>

      {confirme ? (
        <div className="pile">
          <p className="note">
            {enumere(r)
              ? <>Cette journée part définitivement, avec {enumere(r)}.</>
              : <>Cette journée ne contient rien d'autre : elle part seule.</>}
          </p>
          <div className="rang">
            {/* ⚠ CE BOUTON ET « AJOUTER À ENTRETIEN » PORTAIENT LE MÊME DESSIN.
                `.bouton.secondaire` servait indifféremment à ajouter et à
                détruire : gants aux mains, on tape la forme reconnue avant
                d'avoir fini de lire. Le destructif a maintenant sa forme à lui,
                et elle ne se confond avec rien. */}
            <button className="bouton destructif" disabled={occupe} onClick={() => void retirer()}>
              {occupe ? 'suppression…' : 'Retirer définitivement'}
            </button>
            <button className="lien" onClick={() => setConfirme(false)}>Garder</button>
          </div>
        </div>
      ) : (
        /* ─── LES DEUX LANGUETTES — récit 22.2 ──────────────────────────────
           ⚠ ELLES SONT DANS LE DOM EN PERMANENCE, et c'est délibéré. Rendues
           seulement quand le glissement a eu lieu, elles seraient introuvables
           au clavier et muettes pour un lecteur d'écran : EXPERIENCE.md:46
           interdit tout geste caché comme SEUL chemin. Le glissement les rend
           VISIBLES ; il ne les fait pas exister.

           ⚠ ET RIEN N'EST DÉTRUIT PAR LE GESTE. « Supprimer » ouvre la même
           confirmation qu'avant : le glissement remplace le premier tap, jamais
           le second. La phrase qui nomme ce qui part reste le dernier mot. */
        <div className="languettes">
          {/* ⚠ ELLES PORTENT `lien` ET `lien destructif`, PAS UNE FORME À ELLES.
              Le rouge du produit est compté — un essai unitaire recompte les
              `.bouton.destructif` et les `.lien.destructif` contre le nombre
              écrit dans systeme.css — et une troisième forme de bouton rouge
              sortirait de ce compte sans que rien ne le dise. C'est le conteneur
              `.languettes` qui leur donne leur taille de cible (NFR-8, 56 px) et
              leur partage de largeur, pas leur classe. */}
          <button className="lien" onClick={() => { glisse.fermer(); onModifier(r.id) }}>
            <Icone nom="crayon" taille={14} /> Modifier cette journée
          </button>
          <button className="lien destructif"
                  onClick={() => { glisse.fermer(); setConfirme(true) }}
                  aria-label={`retirer la journée du ${r.date_jour} à ${r.circuit_nom}`}>
            <Icone nom="poubelle" taille={14} /> Retirer cette journée
          </button>
        </div>
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
          <div className="libelle">Moto</div>
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

/**
 * MODIFIER UN ROULAGE — récit 22.1, et c'est un écran qui n'existait PAS.
 *
 * ⚠ IL FALLAIT SUPPRIMER LA JOURNÉE POUR CORRIGER SA DATE. La seule écriture
 * sur `roulage` hors création était `chrono_visible` et deux normalisations
 * d'ouverture : une journée saisie au mauvais circuit se corrigeait en la
 * retirant — avec ses sessions, ses tours, ses photos, ses gestes et ses
 * dépenses — puis en tout ressaisissant. C'est la même classe de défaut que les
 * vingt-cinq roulages qu'on ne pouvait pas effacer : une donnée qu'on ne peut
 * pas corriger cesse d'être saisie.
 *
 * ⚠ ET IL DOIT EXISTER AVANT LA LANGUETTE. Le récit 22.2 pose un « modifier »
 * au bout d'un glissement ; sans cet écran, cette languette ouvrirait le vide.
 * C'est pour ça que 22.1 précède 22.2 et pas l'inverse.
 *
 * ⚠ ENTRER PAR ERREUR ET RESSORTIR NE CHANGE RIEN. Le formulaire part de ce qui
 * est en base, et rien ne s'écrit avant le tap sur « Enregistrer ». C'est une
 * clause du récit, pas une évidence : un écran qui enregistre au fil de la
 * frappe transformerait une ouverture accidentelle en modification.
 */
function Modifier({ db, r, onFini, onAnnuler }: {
  db: Db; r: Liste[number]; onFini: () => void; onAnnuler: () => void
}) {
  const [circuit, setCircuit] = useState(r.circuit_nom ?? '')
  const [date, setDate] = useState(r.date_jour)
  const [rang, setRang] = useState<number | null>(r.groupe_rang ?? null)
  const [machines, setMachines] = useState<Machine[]>([])
  const [machineId, setMachineId] = useState<string | null>(r.machine_id ?? null)
  useEffect(() => { void listerMachines(db).then(setMachines) }, [db])

  /* ⚠ LE MÊME VERROU QUE PARTOUT. « Une seule écriture part » est une clause du
     récit, et c'est exactement le défaut qui a produit 25 roulages pour 5
     saisies : le bouton reste vivant pendant l'écriture — worker OPFS, marquage
     de saisie, puis le recalcul de la liste — et rien ne bouge à l'écran.
     Ici le second tap n'écrirait pas une journée de plus mais rejouerait le même
     UPDATE ; il remettrait surtout `circuit_id` à nul une seconde fois, donc
     relancerait la résolution serveur pour rien. */
  const [enregistrer, occupe] = useGeste(async () => {
    await modifierRoulage(db, r.id, {
      circuit: circuit.trim(), date,
      groupeNom: rang ? GROUPES[rang - 1] : null,
      rang, total: rang ? GROUPES.length : null, machineId,
    })
    onFini()
  })

  return (
    <>
      <div className="libelle">Modifier ce roulage</div>

      <div className="pile">
        <div className="libelle">Circuit</div>
        <ChoixCircuit db={db} valeur={circuit} sur={setCircuit} />
      </div>

      {machines.length > 1 && (
        <div className="pile">
          <div className="libelle">Moto</div>
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
        <input className="champ" type="date" value={date}
               onChange={(e) => setDate(e.target.value)} />
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

      {/* ⚠ CE QUI NE BOUGE PAS SE DIT. Une journée porte ses sessions, ses
          photos, ses gestes et ses dépenses : sans cette phrase, corriger une
          date ressemble à une opération risquée, et on préfère supprimer et
          ressaisir — c'est-à-dire exactement ce que cet écran existe pour
          éviter. */}
      <p className="note">
        Ce que cette journée porte ne bouge pas : ses sessions, ses tours, ses photos, ses
        gestes, ses dépenses et son chargement restent tels quels.
      </p>

      <button className="bouton" disabled={!circuit.trim() || occupe}
              onClick={() => void enregistrer()}>
        {occupe ? 'enregistrement…' : 'Enregistrer'}
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
function BilanEcran({ db, b, cout, courbe, identite, photos, chutes, visibilite, onCircuit, onSession, onAccueil, onRecap }: {
  db: Db; b: NonNullable<Bilan>; courbe: DonneesCourbe | null
  identite: Identite | null
  /** ⚠ LE COÛT ET LA VISIBILITÉ ARRIVENT MONTÉS, ILS NE SE COMPOSENT PLUS ICI —
   *  et ce n'est pas un goût d'architecture. L'écran de la journée à venir doit
   *  porter EXACTEMENT les mêmes : deux compositions séparées auraient divergé,
   *  et c'est déjà par une divergence de ce genre que les six chemins du bilan
   *  se sont fermés sur l'écran de préparation sans que rien ne le dise. */
  cout: React.ReactNode
  visibilite: React.ReactNode
  photos: React.ReactNode
  /** La chute de cette journée. Elle vit EN BAS du bilan, après les photos et
   *  les gestes, et sa place est une décision : en tête elle ferait de chaque
   *  journée une question, et ailleurs qu'ici elle serait introuvable le soir
   *  où l'on en a besoin. */
  chutes: React.ReactNode
  /** Le nom du circuit ouvre sa fiche. C'est le seul endroit d'où l'on y entre :
   *  une fiche de circuit se consulte quand on pense à ce circuit-là, et c'est
   *  en regardant sa journée qu'on y pense. */
  onCircuit: () => void
  onSession: () => void; onAccueil: () => void; onRecap: () => void
}) {
  const record = b.ecart != null && b.ecart < 0
  return (
    <>
      <h1 className={'titre ' + (record ? 'record lueur-record' : 'neon')}>
        {b.circuit}
      </h1>
      {/* La fiche du circuit s'ouvre d'ici, et de nulle part ailleurs : on
          pense à un circuit en regardant la journée qu'on y a passée. Un lien
          discret sous le titre plutôt qu'un titre cliquable — un titre qui
          réagit au doigt sans le montrer se tape par accident, et un titre qui
          le montre cesse d'être un titre. */}
      <button className="lien" onClick={onCircuit}>Ce que tu sais de ce circuit</button>

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
      {visibilite}
      <Cercle identite={identite} circuit={b.circuit} />

      {photos}

      {chutes}

      {cout}

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
          {/* ⚠ « SUR L'ANNÉE », PAS « SAISON » TOUT COURT — récit 19.1. Julian a
              lu « Budget de la saison 2026 » et saisi 500 en pensant 500 par
              mois : le mot « saison » ne dit pas assez fort qu'il s'agit de
              douze mois. La période est donc collée aux deux chiffres, celui
              qu'on a dépensé comme celui qu'on s'était fixé. */}
          {/* ⚠ DEUX LIGNES, PAS UN RANG — et c'est la capture qui l'a dit, pas
              la relecture. En `rang`, le libellé et le chiffre se partagent la
              largeur ; ici les deux ont grandi le même jour — « Dépensé sur
              l'année 2026 » d'un côté, « 2 180,50 € sur 2 000 € posés pour
              l'année » de l'autre — et `.chiffre` porte `white-space: nowrap`
              pour ne jamais couper un montant de son unité. Le montant ne
              pouvait donc pas plier : il passait PAR-DESSUS le libellé, sur un
              écran de 390 px. Le même défaut avait déjà été trouvé sur la ligne
              d'équipement, et il se répare pareil. */}
          <div className="pile" style={{ gap: 2 }}>
            <span className="libelle">Dépensé sur l'année {annee}</span>
            <span className="rang" style={{ flexWrap: 'wrap', gap: 8 }}>
              <span className="chiffre hud-24">{formaterEuros(c.auTour.consommeCentimes)}</span>
              <span className="libelle faible">
                sur {formaterEuros(c.auTour.budgetCentimes)} posés pour l'année
              </span>
            </span>
          </div>
          {/* LA JAUGE — une TRACE, pas une alarme. Elle ne change pas de couleur,
              ni près du plafond ni au-delà : « dépasser son budget n'est pas une
              faute » est une règle écrite (systeme.css), et depuis le 24 août le
              rouge est réservé au geste qui détruit.
              Ce qu'elle sait dire depuis 19.1 : la DIFFÉRENCE entre 501 € et
              2180 € sur un plafond de 500 €. Bornée à 100 %, elle rendait une
              barre pleine dans les deux cas — donc rien. */}
          {(() => {
            const j = jaugeBudget(c.auTour.consommeCentimes, c.auTour.budgetCentimes)
            return (
              <div className="jauge" role="img"
                   aria-label={`${formaterEuros(c.auTour.consommeCentimes)} dépensés sur l'année ${annee}, pour un plafond posé de ${formaterEuros(c.auTour.budgetCentimes)}`}>
                <span style={{ width: `${j.part}%` }} />
                {/* Le plafond posé, marqué sur la barre quand elle le dépasse.
                    Sans lui, le dépassement n'aurait aucune échelle. */}
                {j.repere != null && <i style={{ left: `${j.repere}%` }} aria-hidden />}
              </div>
            )
          })()}
          {/* LE REPÈRE MENSUEL — l'autre moitié de la décision du 25 août :
              « un plafond annuel ET un repère mensuel ». Dit, jamais dessiné :
              une seconde jauge vers un plafond du mois ferait du repère un
              compteur à rebours, ce que les deux clauses d'argent refusent. */}
          {(() => {
            /* ⚠ ON REGARDE, PUIS ON AFFIRME. Deux appels et un `!` faisaient dire
               au second ce que le premier venait de vérifier — un garde qui tient
               par ressemblance, pas par construction. Une seule lecture, nommée,
               et le `!` n'a plus lieu d'être : `repereMensuel` rend `null` aussi
               sur un plafond à zéro, et `formaterEuros(null!)` afficherait « 0 € ». */
            const repere = repereMensuel(c.auTour.budgetCentimes)
            return repere == null ? null : (
              <p className="note">
                Soit un repère de {formaterEuros(repere)} par mois.
                Le détail mois par mois vit au garage, dans le budget.
              </p>
            )
          })()}
        </>
      ) : (
        /* ⚠ LE CHAMP DIT SA PÉRIODE À CÔTÉ DE LA VALEUR — récit 19.1, et c'est
           le défaut que Julian a payé : « le coût est de 2180 mais le budget est
           de 500/mois ». Il a saisi un montant MENSUEL dans un champ ANNUEL, et
           rien ne l'a contredit — le mot « saison » vivait dans un `<label>`
           au-dessus, le placeholder disait « 0 », et une fois posé le chiffre ne
           réaffichait plus sa période nulle part.
           Trois choses le tiennent maintenant, et il en faut trois : le mot
           « année » dans l'étiquette, l'unité qui porte « par an » COLLÉE au
           champ, et la conversion en repère mensuel écrite sous ce qu'on tape —
           celle-là est la seule qui parle la langue du malentendu. */
        <div className="pile">
          <label className="libelle" htmlFor="budget">
            Ce que tu te fixes pour l'année {annee} entière
          </label>
          <p className="note">
            Sans lui, le coût au tour reste caché : un chiffre qui baisse quand on roule plus
            n'est pas une mesure.
          </p>
          <div className="somme">
            <input id="budget" className="champ chiffre" value={saisie}
                   onChange={(e) => setSaisie(e.target.value)}
                   inputMode="decimal" placeholder={`pour toute l'année ${annee}`}
                   autoComplete="off" />
            <span className="unite periode"><span>€</span><span>par an</span></span>
          </div>
          {/* LA CONVERSION, ÉNONCÉE PENDANT QU'ON TAPE. 500 € posés là rendent
              « soit 41,67 € par mois » : celui qui pensait 500 par mois le voit
              immédiatement, avant de valider. Ce n'est ni un avertissement ni un
              refus — le produit ne dit pas que c'est faux, il dit ce que c'est. */}
          {(() => {
            // Même règle : le repère se lit une fois et se rend s'il existe.
            const repere = centimes == null ? null : repereMensuel(centimes)
            return repere == null || centimes == null ? null : (
              <p className="note">
                {formaterEuros(centimes)} pour l'année {annee} entière, soit un repère
                de {formaterEuros(repere)} par mois.
              </p>
            )
          })()}
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
