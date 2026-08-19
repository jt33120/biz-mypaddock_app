import { useCallback, useEffect, useRef, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  ajouterSession, bilanMachine, coutMachine, creerMachine, creerRoulage, formaterChrono,
  formaterEuros, listerMachines, poserSprite, type Machine,
} from '../db/depot'
import { photoMachine, verserPhotoMachine } from '../db/photos'
import { genererPortrait } from '../pixel/portrait'
import type { Sprite } from '../pixel/spritifier'
import { Atelier } from './Atelier'
import { SPRITE_CBR83 } from '../assets/sprite-cbr83'

/**
 * Le garage — l'axe machine d'AD-2 gagne enfin une surface.
 *
 * Deux règles de conception y sont tenues, et elles se voient :
 *   — une machine SANS sprite reste pleinement une machine : la scène existe quand même et
 *     montre une silhouette. Le garage n'exige jamais une photo pour fonctionner.
 *   — c'est la MACHINE qui monte en niveau, jamais le pilote : tous les chiffres affichés
 *     portent sur l'objet — ses kilomètres, ses roulages, ce qu'elle a coûté.
 */
export function Garage({ db, onEcrit }: {
  db: PowerSyncDatabase
  /** Le garage écrit des roulages et des machines : sans ce rappel, le reste de
   *  l'application ne le savait pas et la liste des roulages restait vide.
   *  Trouvé par l'essai, pas par la relecture — un écran qui ne se rafraîchit
   *  pas ne se signale jamais. */
  onEcrit: () => void
}) {
  const [machines, setMachines] = useState<Machine[]>([])
  const [actif, setActif] = useState(0)
  const [bilan, setBilan] = useState<{ roulages: number; meilleurMs: number | null } | null>(null)
  const [cout, setCout] = useState(0)
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
    if (!machine) { setBilan(null); setCout(0); return }
    void bilanMachine(db, machine.id).then(setBilan)
    void coutMachine(db, machine.id).then(setCout)
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
    if (!f) return
    setEnCours(true); setSouci(null); setCandidat(null)
    const issue = await genererPortrait(db, machine.id, f)
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
    await creerMachine(db, { marque: 'Honda', modele: 'CBR 1000 RR · 83', annee: 2012, sprite: SPRITE_CBR83 })
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
        <h1 className="titre">Aucune machine</h1>
        <p className="texte">
          Le garage est le centre du produit : le roulage s'y rattache, l'entretien s'y rattache,
          l'usure s'y lit. Une machine se crée sans photo — le portrait vient après, s'il vient.
        </p>
        <button className="bouton" onClick={() => void importerCbr()}>
          Reprendre la CBR 83
        </button>
        <p className="note">
          Reprise d'essai : la machine et son portrait sont déjà dans l'application, donc
          l'import ne déclenche aucune génération et ne coûte rien.
        </p>
      </section>
    )
  }

  return (
    <section className="garage">
      <header className="garage-tete">
        <p className="libelle">garage</p>
        <p className="libelle">
          <b>{machines.length}</b> machine{machines.length > 1 ? 's' : ''}
        </p>
      </header>

      {machines.length > 1 && (
        <nav className="onglets">
          {machines.map((m, i) => (
            <button key={m.id} className={`onglet ${i === actif ? 'actif' : ''}`}
                    onClick={() => setActif(i)}>{m.modele}</button>
          ))}
        </nav>
      )}

      <div className="garage-titre">
        <p className="marque">{machine.marque}</p>
        <h1 className="modele">{machine.modele}</h1>
      </div>

      {/* TROIS ÉTATS, dans cet ordre de préséance : le portrait de jeu s'il a
          été gardé, la photo réelle sinon, la silhouette en dernier. Une machine
          sans média reste pleinement une machine (AD-2) — le garage n'exige
          jamais une image pour fonctionner. */}
      <div className="scene">
        {machine.sprite
          ? <img className="sprite" src={machine.sprite} alt={`${machine.marque} ${machine.modele}`} />
          : photoUrl
            ? <img className="photo-machine" src={photoUrl} alt={`${machine.marque} ${machine.modele}`} />
            : <div className="silhouette" aria-label="machine sans portrait" />}
      </div>

      <div className="chiffres">
        <div>
          <p className="et">roulages</p>
          <p className="va">{bilan?.roulages ?? 0}</p>
        </div>
        <div>
          <p className="et">meilleur tour</p>
          <p className="va">{bilan?.meilleurMs ? formaterChrono(bilan.meilleurMs) : '—'}</p>
        </div>
        <div>
          <p className="et">ce qu'elle a coûté</p>
          <p className="va">{cout ? formaterEuros(cout) : '—'}</p>
        </div>
      </div>

      {/* ─── LE PORTRAIT DE JEU — récit 3bis.3 ─────────────────────────── */}
      <input ref={fichier} type="file" accept="image/*" hidden
             onChange={(e) => { const f = e.target.files?.[0]; if (f) void verser(f) }} />

      {candidat ? (
        <div className="bloc pile">
          <div className="libelle">sa forme de jeu</div>
          <div className="scene">
            <img className="sprite" src={candidat.dataUri}
                 alt={`${machine.modele} en pixel`} />
          </div>
          <p className="note">
            {candidat.largeur} × {candidat.hauteur} cellules · {candidat.couleurs} couleurs.
            Tant qu'il n'est pas gardé, rien n'a changé dans le garage.
          </p>
          <button className="bouton" onClick={() => void garder()}>Garder cette forme</button>
          {/* Le quatrième critère du récit, et il n'a rien de cosmétique : le
              refus ne détruit rien, la photo réelle était toujours là. */}
          <button className="bouton secondaire" onClick={() => setCandidat(null)}>
            Revenir à la photo
          </button>
        </div>
      ) : (
        <>
          <button className="lien" onClick={() => fichier.current?.click()}>
            {machine.photo_chemin ? 'Changer sa photo' : 'Ajouter sa photo'}
          </button>
          {machine.photo_chemin && !machine.sprite && (
            <button className="bouton secondaire" disabled={enCours} onClick={() => void fabriquer()}>
              {enCours ? 'fabrication…' : 'Lui donner sa forme de jeu'}
            </button>
          )}
          {machine.sprite && (
            <button className="lien" onClick={() => void poserSprite(db, machine.id, null).then(charger)}>
              Retirer sa forme de jeu
            </button>
          )}
        </>
      )}
      {souci && <p className="mot-erreur">{souci}</p>}

      {/* L'ATELIER — épique 8. Il vit DANS le garage parce que c'est la machine
          qui a un carnet, pas la journée. Trois listes séparées, jamais une. */}
      {/* ⚠ `onEcrit` doit rafraîchir LE GARAGE AUSSI, pas seulement l'application.
          Sans `charger()`, l'atelier écrivait un montant que la ligne « ce
          qu'elle a coûté » ignorait jusqu'au prochain changement de machine.
          Même défaut qu'au récit précédent, un cran plus bas : un écran qui ne
          se rafraîchit pas ne se signale jamais. */}
      <Atelier db={db} machineId={machine.id}
               onEcrit={() => { void charger(); onEcrit() }} />

      <button className="lien" onClick={() => void importerSaison()}>
        Reprendre la saison 2026 · Pau-Arnos
      </button>
    </section>
  )
}
