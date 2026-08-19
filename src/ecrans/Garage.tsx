import { useCallback, useEffect, useRef, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  ajouterSession, anneeSaison, bilanMachine, creerMachine, creerRoulage, formaterChrono,
  listerMachines, modifierMachine, poserSprite,
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
import type { Categorie } from '../db/atelier'
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
  const [bilan, setBilan] = useState<BilanMachine | null>(null)
  const [corriger, setCorriger] = useState(false)
  /** Le poste d'atelier ouvert EN PAGE. Non nul = le garage cède l'écran. */
  const [poste, setPoste] = useState<Categorie | null>(null)
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
        <h1 className="titre">Aucune machine</h1>
        <p className="texte">
          Le garage est le centre du produit : le roulage s'y rattache, l'entretien s'y rattache,
          l'usure s'y lit. Une machine se crée sans photo — le portrait vient après, s'il vient.
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
        <Budget db={db} annee={anneeSaison(new Date().toISOString())}
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

      {/* L'ANNÉE EST UNE DONNÉE D'IDENTITÉ, pas une décoration : c'est elle qui
          désigne le barème d'entretien de cette moto-là. Elle était saisie à la
          déclaration et n'apparaissait NULLE PART ensuite — donc invérifiable,
          donc fausse en silence : la CBR de Julian est entrée en 2012 alors
          qu'elle est de 2010. Elle s'affiche, et elle se corrige. */}
      <div className="garage-titre">
        <p className="marque">{machine.marque}{machine.annee ? ` · ${machine.annee}` : ''}</p>
        <h1 className="modele">{machine.modele}</h1>
        <button className="lien" onClick={() => setCorriger(!corriger)}>
          {corriger ? 'Annuler la correction' : machine.annee ? 'Corriger la machine' : "Ajouter l'année"}
        </button>
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
            : <div className="silhouette" aria-label="machine sans portrait" />}
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
              refus ne détruit rien, la photo réelle était toujours là. */}
          <button className="bouton secondaire" onClick={() => setCandidat(null)}>
            Revenir à la photo
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
                que fait ce bouton ». Il dit maintenant à quoi l'on revient, ce
                qui est le seul point du bouton. */}
          <button className="lien" onClick={() => fichier.current?.click()}>
            {machine.photo_chemin ? 'Remplacer la photo de la moto' : 'Photographier la moto'}
          </button>
          {machine.photo_chemin && !machine.sprite && (
            <button className="bouton secondaire" disabled={enCours} onClick={() => void fabriquer()}>
              {enCours ? 'fabrication…' : 'En faire un portrait pixel'}
            </button>
          )}
          {machine.sprite && (
            <button className="lien" onClick={() => void poserSprite(db, machine.id, null).then(charger)}>
              {machine.photo_chemin
                ? 'Retirer le portrait pixel et remontrer la photo'
                : 'Retirer le portrait pixel'}
            </button>
          )}
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
      <Budget db={db} annee={anneeSaison(new Date().toISOString())}
              machineId={machine.id} onEcrit={onEcrit} />

      {/* ─── L'ÉQUIPEMENT — la troisième racine ──────────────────────────────
          « Il y a toujours une machine mais aussi un espace équipement. » Il est
          hors de la machine ET hors de l'onglet des machines : changer de moto
          ne change pas de combinaison. */}
      <Equipement db={db} onEcrit={onEcrit} />

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
  onValider: (m: { marque: string; modele: string; annee: number | null }) => Promise<void>
}) {
  const [marque, setMarque] = useState(machine?.marque ?? '')
  const [modele, setModele] = useState(machine?.modele ?? '')
  const [annee, setAnnee] = useState(machine?.annee ? String(machine.annee) : '')
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
      <button className="bouton" disabled={!pret || occupe} onClick={() => void valider({
        marque: marque.trim(), modele: modele.trim(),
        annee: /^\d{4}$/.test(annee.trim()) ? Number(annee.trim()) : null,
      })}>
        {occupe ? 'enregistrement…' : machine ? 'Corriger' : 'Déclarer ma machine'}
      </button>
    </div>
  )
}
