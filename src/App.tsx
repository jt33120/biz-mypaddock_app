import { useCallback, useEffect, useState } from 'react'
import { PRODUCT_NAME } from './product'
import { ouvrirBase } from './db/powersync'
import {
  ajouterSession, bilanRoulage, creerRoulage, formaterChrono, formaterEcart, listerRoulages,
} from './db/depot'
import { Molettes } from './ecrans/Molettes'
import { Sonde } from './ecrans/Sonde'

type Db = ReturnType<typeof ouvrirBase>
type Ecran = 'accueil' | 'roulages' | 'nouveau' | 'session' | 'bilan' | 'sonde'
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

  useEffect(() => {
    const d = ouvrirBase()
    d.init().then(() => setDb(d))
  }, [])

  const rafraichir = useCallback(async (base: Db) => setListe(await listerRoulages(base)), [])
  useEffect(() => { if (db) void rafraichir(db) }, [db, rafraichir])

  if (!db) return <div className="ecran"><div className="libelle">chargement…</div></div>

  const ouvrirBilan = async (id: string) => {
    setCourant(id); setBilan(await bilanRoulage(db, id)); setEcran('bilan')
  }

  return (
    <>
      <div className="sol" aria-hidden />
      <div className="ecran">
        {ecran === 'accueil' && <Accueil liste={liste} onNouveau={() => setEcran('nouveau')} onOuvrir={ouvrirBilan} />}
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
            setBilan(await bilanRoulage(db, courant)); await rafraichir(db); setEcran('bilan')
          }} onAnnuler={() => void ouvrirBilan(courant)} />
        )}
        {ecran === 'bilan' && bilan && (
          <BilanEcran b={bilan} onSession={() => setEcran('session')} onAccueil={() => setEcran('accueil')} />
        )}
        {ecran === 'sonde' && <Sonde />}
      </div>

      <nav className="barre">
        {/* Deux onglets au noyau. Machine, Saison et Cercle sont vides :
            un onglet vide ne sous-délivre pas, il signale l'abandon. */}
        <button className="onglet" data-actif={ecran === 'accueil' ? '1' : '0'} onClick={() => setEcran('accueil')}>ACCUEIL</button>
        <button className="onglet" data-actif={ecran === 'roulages' ? '1' : '0'} onClick={() => setEcran('roulages')}>ROULAGES</button>
        <button className="onglet" data-actif={ecran === 'sonde' ? '1' : '0'} onClick={() => setEcran('sonde')}>SONDE</button>
      </nav>
    </>
  )
}

/* ─── ACCUEIL — ce qui est le plus proche dans le temps ────────────────────
   UJ-2 : on n'ouvre jamais sur du vide, et jamais sur des cadres en attente.
   Une seule action quand il n'y a rien. */
function Accueil({ liste, onNouveau, onOuvrir }: { liste: Liste; onNouveau: () => void; onOuvrir: (id: string) => void }) {
  const dernier = liste[0]
  return (
    <>
      <h1 className="titre neon">{PRODUCT_NAME}</h1>

      {!dernier ? (
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
      ) : (
        <>
          <div className="bloc pile" onClick={() => onOuvrir(dernier.id)}>
            <div className="libelle">Dernier roulage</div>
            <div className="titre">{dernier.circuit_nom}</div>
            <div className="rang">
              <span className="libelle">{dernier.date_jour}</span>
              <span className="hud-16 faible">{dernier.sessions} SESSION{dernier.sessions > 1 ? 'S' : ''}</span>
            </div>
            {dernier.meilleur != null && (
              <div className="rang">
                <span className="libelle">Meilleur tour</span>
                <span className="chiffre hud-40 miami">{formaterChrono(dernier.meilleur)}</span>
              </div>
            )}
          </div>
          <button className="bouton" onClick={onNouveau}>Saisir un roulage</button>
        </>
      )}
    </>
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
function BilanEcran({ b, onSession, onAccueil }: { b: NonNullable<Bilan>; onSession: () => void; onAccueil: () => void }) {
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

      <button className="bouton" onClick={onSession}>Saisir une session</button>
      <button className="bouton secondaire" onClick={onAccueil}>Accueil</button>
    </>
  )
}
