import { useCallback, useEffect, useState } from 'react'
import { PRODUCT_NAME } from './product'
import { ouvrirBase } from './db/powersync'
import {
  ajouterSession, anneeSaison, bilanRoulage, coutDuRoulage, creerRoulage, formaterChrono,
  enCentimes, formaterEcart, formaterEuros, listerRoulages, normaliserCircuits, poserBudget,
  type CoutRoulage,
} from './db/depot'
import { Depense } from './ecrans/Depense'
import { surCompte, type Identite } from './db/compte'
import { creerConnecteur, powersyncConfigure } from './db/connecteur'
import { estAdopte } from './db/sauvegarde'
import { ouverture } from './db/mesures'
import {
  conseilDuJour, direAVenir, direPasse, ecarterInvite, etatPlan, poserPlan, sourceAccueil,
  type EtatPlan, type Source,
} from './db/accueil'
import { Compte } from './ecrans/Compte'
import { Garage } from './ecrans/Garage'
import { Molettes } from './ecrans/Molettes'
import { Sonde } from './ecrans/Sonde'

type Db = ReturnType<typeof ouvrirBase>
type Ecran = 'accueil' | 'garage' | 'roulages' | 'nouveau' | 'session' | 'bilan' | 'depense' | 'compte' | 'sonde'
type Bilan = Awaited<ReturnType<typeof bilanRoulage>>
type Liste = Awaited<ReturnType<typeof listerRoulages>>

const aujourdhui = () => new Date().toISOString().slice(0, 10)

/** Le groupe se saisit sur l'échelle de SON organisateur. Pau-Arnos annonce
 *  2 à 4 groupes nommés Initiation/Intermédiaire/Confirmé/Expert, pas
 *  Blanc/Jaune/Rouge. Seul le RANG est comparable d'une sortie à l'autre. */
const GROUPES = ['Initiation', 'Intermédiaire', 'Confirmé', 'Expert']

export default function App() {
  const [db, setDb] = useState<Db | null>(null)
  const [ecran, setEcran] = useState<Ecran>('accueil')
  const [liste, setListe] = useState<Liste>([])
  const [courant, setCourant] = useState<string | null>(null)
  const [bilan, setBilan] = useState<Bilan>(null)
  const [cout, setCout] = useState<CoutRoulage | null>(null)
  const [identite, setIdentite] = useState<Identite | null>(null)
  const [src, setSrc] = useState<Source | null>(null)
  const [conseil, setConseil] = useState<string | null>(null)
  const [plan, setPlan] = useState<EtatPlan | null>(null)

  useEffect(() => {
    const d = ouvrirBase()
    // La reprise des circuits tourne AVANT que quoi que ce soit puisse partir :
    // une base écrite par la v0 range le nom du circuit dans la référence, et
    // aucune de ses lignes ne franchirait la clé étrangère (récit 1.2).
    d.init()
      .then(() => normaliserCircuits(d))
      // Instrument ③ : l'ouverture se compte AVANT toute saisie, et elle naît
      // « n'a rien produit » — l'état attendu, jamais un échec (FR-59).
      .then(() => ouverture(d))
      // Le marquage « cette ouverture a produit une saisie » n'est PAS ici :
      // il vit dans le dépôt, sur le chemin d'écriture. Posé écran par écran,
      // il finissait par manquer au suivant — et un marquage manquant ne se
      // signale pas, il fait juste dire à l'instrument que rien n'a été saisi.
      .then(() => setDb(d))
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
    setPlan(await etatPlan(base, aujourdhui()))
  }, [])
  useEffect(() => { if (db) void rafraichir(db) }, [db, rafraichir])

  if (!db) return <div className="ecran"><div className="libelle">chargement…</div></div>

  const ouvrirBilan = async (id: string) => {
    setCourant(id)
    const b = await bilanRoulage(db, id)
    setBilan(b)
    setCout(b ? await coutDuRoulage(db, id, anneeSaison(b.date)) : null)
    setEcran('bilan')
  }

  return (
    <>
      <div className="sol" aria-hidden />
      <div className="ecran">
        {ecran === 'accueil' && (
          <Accueil src={src} liste={liste} conseil={conseil} plan={plan}
                   onNouveau={() => setEcran('nouveau')} onOuvrir={ouvrirBilan}
                   onPlan={async (t) => { await poserPlan(db, t); await rafraichir(db) }}
                   onEcarter={() => { ecarterInvite(); void rafraichir(db) }}
                   onCompte={() => setEcran('compte')} onSonde={() => setEcran('sonde')} />
        )}
        {ecran === 'roulages' && <Roulages liste={liste} onOuvrir={ouvrirBilan} onNouveau={() => setEcran('nouveau')} />}
        {ecran === 'nouveau' && (
          <Nouveau onValider={async (r) => {
            const id = await creerRoulage(db, r)
            setCourant(id); await rafraichir(db); setEcran('session')
          }} onAnnuler={() => setEcran('accueil')} />
        )}
        {ecran === 'session' && courant && (
          <Session onValider={async (ms) => {
            await ajouterSession(db, courant, ms)
            await rafraichir(db)
            // UN SEUL chemin vers le bilan. En avoir deux, c'était en avoir un
            // qui oubliait le coût — et un bloc absent ne se signale pas.
            await ouvrirBilan(courant)
          }} onAnnuler={() => void ouvrirBilan(courant)} />
        )}
        {ecran === 'bilan' && bilan && (
          <BilanEcran
            b={bilan} cout={cout}
            onSession={() => setEcran('session')}
            onAccueil={() => setEcran('accueil')}
            onDepense={() => setEcran('depense')}
            onBudget={async (centimes) => {
              await poserBudget(db, anneeSaison(bilan.date), centimes)
              if (courant) setCout(await coutDuRoulage(db, courant, anneeSaison(bilan.date)))
            }}
          />
        )}
        {ecran === 'depense' && courant && bilan && (
          <Depense db={db} roulageId={courant} dateRoulage={bilan.date}
                   onFini={() => void ouvrirBilan(courant)}
                   onAnnuler={() => void ouvrirBilan(courant)} />
        )}
        {ecran === 'garage' && <Garage db={db} />}
        {ecran === 'compte' && <Compte db={db} identite={identite} />}
        {ecran === 'sonde' && <Sonde db={db} />}
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

          Compte et Sonde ne sont pas des destinations du produit : ce sont un
          réglage et un instrument. Ils vivent en tête de l'accueil, discrets,
          et ne prennent pas la place d'un lieu. */}
      <nav className="barre">
        <button className="onglet" data-actif={ecran === 'accueil' ? '1' : '0'} onClick={() => setEcran('accueil')}>ACCUEIL</button>
        <button className="onglet" data-actif={ecran === 'garage' ? '1' : '0'} onClick={() => setEcran('garage')}>GARAGE</button>
        <button className="onglet" data-actif={ecran === 'roulages' ? '1' : '0'} onClick={() => setEcran('roulages')}>ROULAGES</button>
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
function Accueil({ src, liste, conseil, plan, onNouveau, onOuvrir, onPlan, onEcarter, onCompte, onSonde }: {
  src: Source | null; liste: Liste; conseil: string | null; plan: EtatPlan | null
  onNouveau: () => void; onOuvrir: (id: string) => void
  onPlan: (texte: string) => Promise<void>; onEcarter: () => void
  onCompte: () => void; onSonde: () => void
}) {
  return (
    <>
      <header className="tete">
        <h1 className="titre neon">{PRODUCT_NAME}</h1>
        <nav className="reglages">
          <button className="lien" onClick={onCompte}>compte</button>
          <button className="lien" onClick={onSonde}>sonde</button>
        </nav>
      </header>
      <ZoneTemporelle src={src} onNouveau={onNouveau} onOuvrir={onOuvrir} />
      {src && src.genre !== 'vide' && <ZoneChiffres liste={liste} />}
      {conseil && <Conseil texte={conseil} />}
      {plan && <Plan etat={plan} onPlan={onPlan} onEcarter={onEcarter} />}
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

/** LE PLAN SI-ALORS — l'intervention comportementale la mieux établie du
 *  dossier (d ≈ 0,65 sur 94 essais), et elle ne fonctionne que formulée par la
 *  personne elle-même. Le produit ne reformule rien, ne corrige rien, ne note
 *  rien. L'invite est UNIQUE : refusée, elle ne revient pas. */
function Plan({ etat, onPlan, onEcarter }: {
  etat: EtatPlan; onPlan: (t: string) => Promise<void>; onEcarter: () => void
}) {
  const [texte, setTexte] = useState('')

  if (etat.texte) {
    return (
      <div className="conseil plan-pose">
        <p className="libelle">Ton plan</p>
        {/* Mot pour mot. Aucune retouche, aucune note, aucun commentaire. */}
        <p className="texte">{etat.texte}</p>
      </div>
    )
  }
  if (!etat.inviter) return null

  return (
    <div className="conseil">
      <p className="libelle">Une phrase, une seule fois</p>
      <p className="texte">
        Écris ce que tu feras dans une situation précise, dans tes mots.
        Par exemple : « si je me fais rattraper, alors je lève et je le laisse passer. »
      </p>
      <input className="champ" value={texte} onChange={(e) => setTexte(e.target.value)}
             placeholder="si… alors…" autoComplete="off" />
      <div className="rang">
        <button className="bouton secondaire" disabled={!texte.trim()}
                onClick={() => void onPlan(texte)}>Garder cette phrase</button>
        <button className="lien" onClick={onEcarter}>Pas maintenant</button>
      </div>
    </div>
  )
}

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
              <span className="chiffre hud-40 miami">{formaterChrono(src.meilleurIci)}</span>
            )}
          </div>
        ) : (
          <>
            {r.meilleur != null && (
              <div className="rang">
                <span className="libelle">Meilleur tour du jour</span>
                <span className="chiffre hud-40 miami">{formaterChrono(r.meilleur)}</span>
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

/** La zone des chiffres — elle appartient au pilote. Elle porte sa saison, pas
 *  la journée : la zone du dessus s'en charge déjà. */
function ZoneChiffres({ liste }: { liste: Liste }) {
  const chronos = liste.map((r) => r.meilleur).filter((m): m is number => m != null)
  const meilleur = chronos.length ? Math.min(...chronos) : null
  const circuits = new Set(liste.map((r) => r.circuit_nom)).size
  return (
    <div className="chiffres-saison">
      <div>
        <p className="et">roulages</p>
        <p className="va">{liste.length}</p>
      </div>
      <div>
        <p className="et">circuits</p>
        <p className="va">{circuits}</p>
      </div>
      <div>
        <p className="et">meilleur tour</p>
        <p className="va">{meilleur != null ? formaterChrono(meilleur) : '—'}</p>
      </div>
    </div>
  )
}

function Roulages({ liste, onOuvrir, onNouveau }: { liste: Liste; onOuvrir: (id: string) => void; onNouveau: () => void }) {
  return (
    <>
      <div className="libelle">Roulages · {liste.length}</div>
      <div className="pile">
        {liste.map((r) => (
          <div key={r.id} className="bloc pile" onClick={() => onOuvrir(r.id)}>
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
        ))}
      </div>
      <button className="bouton" onClick={onNouveau}>Saisir un roulage</button>
    </>
  )
}

/* ─── NOUVEAU ROULAGE — sélecteurs plutôt que clavier partout où c'est possible */
function Nouveau({ onValider, onAnnuler }: {
  onValider: (r: { circuit: string; date: string; groupeNom: string | null; rang: number | null; total: number | null; machineId: string | null }) => void
  onAnnuler: () => void
}) {
  const [circuit, setCircuit] = useState('')
  const [date, setDate] = useState(aujourdhui())
  const [rang, setRang] = useState<number | null>(null)

  return (
    <>
      <div className="libelle">Nouveau roulage</div>

      <div className="pile">
        <div className="libelle">Circuit</div>
        <input className="champ" value={circuit} onChange={(e) => setCircuit(e.target.value)}
               placeholder="Pau-Arnos" autoComplete="off" />
      </div>

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

      <button className="bouton" disabled={!circuit.trim()}
              onClick={() => onValider({
                circuit: circuit.trim(), date,
                groupeNom: rang ? GROUPES[rang - 1] : null,
                rang, total: rang ? GROUPES.length : null, machineId: null,
              })}>
        Continuer
      </button>
      <button className="bouton secondaire" onClick={onAnnuler}>Annuler</button>
    </>
  )
}

function Session({ onValider, onAnnuler }: { onValider: (ms: number) => void; onAnnuler: () => void }) {
  const [ms, setMs] = useState(107300)
  return (
    <>
      <div className="libelle">Meilleur tour de la session</div>
      <div className="plat"><Molettes sur={setMs} /></div>
      <div style={{ textAlign: 'center' }}>
        <span className="chiffre hud-64 miami">{formaterChrono(ms)}</span>
      </div>
      <button className="bouton" onClick={() => onValider(ms)}>Enregistrer la session</button>
      <button className="bouton secondaire" onClick={onAnnuler}>Retour</button>
    </>
  )
}

/* ─── LE RETOUR IMMÉDIAT — UJ-1 étape 3, sans réseau ───────────────────────
   Le produit ÉNONCE ce qui s'est passé. Il ne décerne jamais. */
function BilanEcran({ b, cout, onSession, onAccueil, onDepense, onBudget }: {
  b: NonNullable<Bilan>; cout: CoutRoulage | null
  onSession: () => void; onAccueil: () => void; onDepense: () => void
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

      {cout && <BlocCout c={cout} annee={anneeSaison(b.date)} onDepense={onDepense} onBudget={onBudget} />}

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

      {c.auTourCentimes != null && c.budgetCentimes != null ? (
        <>
          <div className="rang">
            <span className="libelle">Au tour · {c.tours} tour{c.tours > 1 ? 's' : ''}</span>
            <span className="chiffre hud-24 miami">{formaterEuros(c.auTourCentimes)}</span>
          </div>
          {/* Jamais séparable du chiffre ci-dessus. */}
          <div className="rang">
            <span className="libelle">Saison {annee} · consommé</span>
            <span className="chiffre hud-16">
              {formaterEuros(c.consommeCentimes)} <span className="faible">sur {formaterEuros(c.budgetCentimes)}</span>
            </span>
          </div>
          <div className="jauge" role="img"
               aria-label={`${formaterEuros(c.consommeCentimes)} consommés sur ${formaterEuros(c.budgetCentimes)}`}>
            <span style={{ width: `${Math.min(100, (c.consommeCentimes / c.budgetCentimes) * 100)}%` }} />
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
