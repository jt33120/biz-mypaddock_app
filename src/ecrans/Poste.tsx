import { useCallback, useEffect, useRef, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import {
  cestFait, consigner, coutAtelier, interventions, NOM_CATEGORIE, SOUS_TITRE, VIDE, viser,
  type Categorie, type Intervention,
} from '../db/atelier'
import { enCentimes, formaterEuros, type Machine } from '../db/depot'
import {
  lireLocale, nomLocal, piecesDeLIntervention, verserPhoto, type Genre, type Photo,
} from '../db/photos'
import {
  documentsDeLaMachine, formaterOctets, NOM_GENRE, oublierDocument, ouvrirDocument,
  rapatrierLeManuel, verserDocument, type Document, type Genre as GenreDoc,
} from '../db/documents'
import { Usure } from './Usure'
import { useGeste } from './geste'

/**
 * UN POSTE D'ATELIER, EN PAGE ENTIÈRE — retour de Julian du 19 août 2026.
 *
 *   « Entretien : ajouter des photos et des factures, pour constituer une
 *     preuve. Je verrais plutôt un bouton vers une page à part entière car il y
 *     a beaucoup de choses : un websearch vers le manuel d'utilisation, la
 *     prochaine maintenance, son calendrier de maintenance éditable, des
 *     recommandations, liens vers des produits affiliés. Amélioration : idem. »
 *
 * L'accordéon tenait trois lignes ; il ne tient pas un carnet. Le poste devient
 * donc une page, et FR-46 y gagne plutôt qu'il n'y perd : une page ne rend QU'UNE
 * catégorie, là où un accordéon pouvait s'ouvrir deux fois. La clause de sécurité
 * — l'élément de sécurité ne doit jamais hériter du caractère repoussable du
 * cosmétique — est plus forte en page qu'en liste.
 *
 * CE QUI EST ICI : la preuve (photos et factures), la recherche du manuel, les
 * horloges d'usure — c'est-à-dire « la prochaine maintenance et son calendrier
 * éditable », qui existaient déjà sous un autre nom.
 *
 * CE QUI N'Y EST PAS, ET POURQUOI JE NE L'AI PAS SIMULÉ : les recommandations et
 * les liens affiliés. Un lien affilié engage un contrat avec un marchand et une
 * mention légale d'affiliation ; le poser sans les deux serait une infraction, et
 * poser un bloc « bientôt » serait une promesse que l'écran ne tient pas. C'est
 * porté dans A-FAIRE.md comme une décision qui t'appartient.
 */

const aujourdhui = () => new Date().toISOString().slice(0, 10)

export function Poste({ db, machine, categorie, onFermer, onEcrit }: {
  db: PowerSyncDatabase
  machine: Machine
  categorie: Categorie
  onFermer: () => void
  onEcrit: () => void
}) {
  const [liste, setListe] = useState<Intervention[]>([])
  const [cout, setCout] = useState(0)
  const [saisie, setSaisie] = useState(false)

  const charger = useCallback(async () => {
    setListe(await interventions(db, machine.id, categorie))
    setCout(await coutAtelier(db, machine.id, categorie))
  }, [db, machine.id, categorie])
  useEffect(() => { void charger() }, [charger])

  const attendent = liste.filter((i) => i.etat === 'visee')
  const faites = liste.filter((i) => i.etat === 'faite')

  return (
    <section className={`garage poste-page ${categorie}`}>
      <header className="garage-tete">
        <button className="lien" onClick={onFermer}>← garage</button>
        <p className="libelle">{machine.modele}</p>
      </header>

      <div className="garage-titre">
        <p className="marque">atelier</p>
        <h1 className="modele">{NOM_CATEGORIE[categorie]}</h1>
        <p className="sous-titre">{SOUS_TITRE[categorie]}</p>
      </div>

      <div className="chiffres">
        <div>
          <p className="et">consignés</p>
          <p className="va">{faites.length}</p>
        </div>
        <div>
          <p className="et">en attente</p>
          <p className="va">{attendent.length}</p>
        </div>
        <div>
          <p className="et">dépensé</p>
          <p className="va" style={{ fontSize: 17 }}>{cout ? formaterEuros(cout) : '—'}</p>
        </div>
      </div>

      {categorie === 'entretien' && <Manuel db={db} machine={machine} onEcrit={onEcrit} />}

      {/* LES HORLOGES D'USURE vivent ici désormais, et pas à la racine du
          garage. « La prochaine maintenance, son calendrier de maintenance
          éditable » : c'est exactement ce qu'elles sont, sous un autre nom. Les
          poser dans le poste d'entretien les met à côté des gestes qui les font
          repartir, au lieu d'un écran plus bas. */}
      {categorie === 'entretien' && (
        <Usure db={db} machineId={machine.id} onEcrit={() => { void charger(); onEcrit() }} />
      )}

      <p className="libelle">Le carnet</p>
      {!liste.length && <p className="note">{VIDE[categorie]}</p>}

      {/* CE QUI ATTEND, en tête et sans aucune marque d'urgence (FR-48). */}
      {attendent.map((i) => (
        <Geste key={i.id} db={db} i={i}
               onEcrit={() => void charger().then(onEcrit)} />
      ))}
      {faites.map((i) => (
        <Geste key={i.id} db={db} i={i}
               onEcrit={() => void charger().then(onEcrit)} />
      ))}

      {saisie
        ? <Saisir db={db} machineId={machine.id} categorie={categorie}
                  onFini={() => { setSaisie(false); void charger().then(onEcrit) }} />
        : (
          <>
            <button className="bouton" onClick={() => setSaisie(true)}>Consigner un geste</button>
            {/* FR-47 — une bricole se crée DEPUIS UNE PHOTO, au paddock, sans
                rien remplir d'autre. Le levier tordu se photographie là où le
                téléphone est déjà en main, et devient une ligne. Ce chemin a
                suivi le poste dans sa page : le perdre au passage aurait
                supprimé la seule saisie du produit qui tienne en un geste. */}
            {categorie === 'reparation_non_vitale' && (
              <ParLaPhoto db={db} machineId={machine.id}
                          onFini={() => void charger().then(onEcrit)} />
            )}
          </>
        )}
    </section>
  )
}

/**
 * LE MANUEL — une recherche web, et rien de plus.
 *
 * Julian demande « un websearch vers le manuel d'utilisation ». C'est bien une
 * recherche et pas un lien direct, et la nuance est tout le sujet : le produit
 * ne connaît pas l'URL du manuel de chaque moto, et prétendre le contraire
 * enverrait vers une page morte ou fausse. Il compose une requête à partir de ce
 * que le pilote a déclaré, et laisse le moteur répondre.
 *
 * ⚠ IL DIT QU'IL SORT DE L'APPLICATION. Un lien qui ouvre un navigateur depuis
 * une PWA installée est une rupture — et hors ligne, au paddock, il échouera. Le
 * texte le dit plutôt que de le laisser découvrir : « demande du réseau ».
 *
 * DuckDuckGo plutôt que Google : pas de consentement à recueillir, pas de
 * traceur posé au clic. Le produit n'a aucun traceur, et ce n'est pas au moment
 * de chercher une vidange qu'il va en offrir un.
 */
function Manuel({ db, machine, onEcrit }: {
  db: PowerSyncDatabase; machine: Machine; onEcrit: () => void
}) {
  const [docs, setDocs] = useState<Document[]>([])
  const [souci, setSouci] = useState<string | null>(null)
  const [trouve, setTrouve] = useState<string | null>(null)
  const fichier = useRef<HTMLInputElement>(null)

  const charger = useCallback(
    async () => setDocs(await documentsDeLaMachine(db, machine.id)), [db, machine.id])
  useEffect(() => { void charger() }, [charger])

  const requete = [machine.marque, machine.modele, machine.annee, 'manuel atelier pdf']
    .filter(Boolean).join(' ')
  const url = `https://duckduckgo.com/?q=${encodeURIComponent(requete)}`

  /* ⚠ LA RECHERCHE EST FAITE PAR LE SERVEUR — « c'est fait en backend et
     automatisé, l'utilisateur ne recherche pas lui-même ». Elle DOIT l'être :
     le navigateur ne peut pas télécharger un PDF d'un domaine tiers, la
     politique d'origine croisée le refuse et aucun site de manuel ne pose
     d'en-tête CORS pour nous. La clé du moteur ne pourrait de toute façon pas
     vivre dans un paquet servi au navigateur (AD-15).

     La ligne redescend par la synchronisation : le serveur l'écrit, on la
     relit. L'insérer ici la ferait exister sur ce téléphone alors que les
     octets seraient peut-être restés en route. */
  const [postes, setPostes] = useState<number | null>(null)
  const [chercher, cherche] = useGeste(async () => {
    setSouci(null); setTrouve(null); setPostes(null)
    const r = await rapatrierLeManuel(machine.id)
    if (!r.ok) { setSouci(r.message); return }
    setTrouve(r.source)
    /* ⚠ CE QUE LA LECTURE A DONNÉ SE DIT, ET ZÉRO SE DIT AUSSI. Le manuel est
       rapatrié dans les deux cas ; ce qui change est ce que le produit a pu en
       TIRER. Taire le zéro laisserait croire que les horloges se sont remplies,
       et le pilote irait chercher au garage ce qui n'y est pas. */
    setPostes(r.postes)
    await charger(); onEcrit()
  })

  const verser = async (f: File, genre: GenreDoc) => {
    setSouci(null)
    const r = await verserDocument(db, { machineId: machine.id, genre }, f)
    if ('refus' in r) { setSouci(r.refus); return }
    await charger(); onEcrit()
  }

  return (
    <div className="bloc pile">
      <p className="libelle">Le manuel et les papiers</p>

      {docs.length > 0
        ? docs.map((d) => (
          <LigneDocument key={d.id} db={db} d={d}
                         onEcrit={() => void charger().then(onEcrit)} />
        ))
        : (
          <p className="sous-titre">
            Rien de gardé. Un manuel gardé ici s'ouvre au paddock, sans réseau, à côté de
            la moto qu'il concerne.
          </p>
        )}

      {/* ⚠ LE GESTE PRINCIPAL EST AUTOMATIQUE — décision de Julian, réaffirmée
          après mon objection : « l'utilisateur ne recherche pas lui-même ».

          J'avais opté pour un versement manuel au motif du droit d'auteur : un
          manuel d'atelier est une œuvre protégée. Il a tranché l'inverse, et
          c'est son projet. CE QUI RESTE DE LA PRÉCAUTION est le seul point qui
          change quelque chose en droit : la copie va dans SON espace privé —
          chemin préfixé par son identifiant, politique qui n'ouvre qu'à lui.
          Rien n'est mutualisé, rien n'est servi à un second pilote. Ce n'est pas
          une bibliothèque, c'est une copie privée pour son détenteur.

          La source s'affiche après coup, et ce n'est pas décoratif : un document
          rapatrié qui ne dirait pas d'où il vient serait indistinguable d'un
          document qu'on a soi-même choisi. */}
      <button className="bouton" disabled={cherche} onClick={() => void chercher()}>
        {cherche ? 'recherche en cours…' : 'Trouver le manuel de cette moto'}
      </button>
      {cherche && (
        <p className="note">
          Le serveur cherche et télécharge. Ça prend une poignée de secondes.
        </p>
      )}
      {trouve && <p className="note">Trouvé sur <b>{new URL(trouve).hostname}</b>.</p>}
      {trouve && postes != null && (
        /* ⚠ CE QUE LE MANUEL A DONNÉ, ET CE QU'IL NE PEUT PAS DONNER. La phrase
           du succès dit ce qui est ARRIVÉ AU GARAGE — c'est vérifiable en un tap
           — et elle dit dans le même souffle que les périodicités restent en
           KILOMÈTRES : le compteur d'usure, lui, compte des roulages, et le
           produit ne convertit pas les deux (FR-44). Promettre une échéance que
           le produit ne sait pas calculer serait la faute exacte que toute
           l'horloge existe pour éviter. */
        <p className="note">
          {postes > 0
            ? `${postes} poste${postes > 1 ? 's' : ''} d'entretien relevé${postes > 1 ? 's' : ''} `
              + `dans le manuel, avec leur périodicité telle qu'elle y est écrite. `
              + `Elle est en kilomètres ou en mois — le compteur d'usure, lui, compte des `
              + `roulages, et rien ne convertit les deux.`
            : "Aucun tableau d'entretien n'a pu être relevé dans ce PDF. Le manuel est "
              + 'gardé quand même, et il s\'ouvre hors ligne.'}
        </p>
      )}
      {souci && <p className="mot-erreur">{souci}</p>}

      <input ref={fichier} type="file" hidden
             accept="application/pdf,image/*"
             onChange={(e) => {
               const f = e.target.files?.[0]
               if (f) void verser(f, 'manuel')
             }} />
      {/* LES DEUX SECOURS, en petit : chercher soi-même quand l'automatique ne
          trouve rien, et verser un fichier qu'on a déjà. */}
      <div className="rang actions-materiel">
        <a className="lien" href={url} target="_blank" rel="noreferrer noopener">
          Chercher moi-même
        </a>
        <button className="lien" onClick={() => fichier.current?.click()}>
          Verser un document
        </button>
      </div>
    </div>
  )
}

/** L'hôte seul, jamais l'URL entière : une adresse de PDF fait deux cents
 *  caractères et sortirait de l'écran. Le nom de domaine suffit à dire d'où. */
const hote = (u: string) => { try { return new URL(u).hostname } catch { return 'source inconnue' } }

/**
 * Un document gardé. Il S'OUVRE DEPUIS LA COPIE LOCALE quand elle existe —
 * c'est tout l'intérêt de l'avoir gardé : au paddock, il n'y a pas de réseau.
 *
 * L'URL d'objet est révoquée après ouverture : un manuel de 20 Mo laissé en
 * mémoire à chaque consultation finit par tuer l'onglet sur un téléphone.
 */
function LigneDocument({ db, d, onEcrit }: {
  db: PowerSyncDatabase; d: Document; onEcrit: () => void
}) {
  const [absent, setAbsent] = useState(false)
  const [ouvrir, occupe] = useGeste(async () => {
    const f = await ouvrirDocument(d)
    if (!f) { setAbsent(true); return }
    const url = URL.createObjectURL(f)
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  })
  const [retirer, efface] = useGeste(async () => {
    await oublierDocument(db, d)
    onEcrit()
  })

  return (
    <div className="pile materiel">
      <span className="texte">{d.nom}</span>
      <div className="rang">
        <span className="libelle faible">
          {NOM_GENRE[d.genre]}{d.octets ? ` · ${formaterOctets(d.octets)}` : ''}
          {/* La provenance est DITE. Un fichier rapatrié par le serveur et un
              fichier versé à la main ne s'équivalent pas : le premier vient
              d'une adresse que personne n'a vérifiée. */}
          {d.source_url ? ` · ${hote(d.source_url)}` : ''}
        </span>
        <span className="rang" style={{ gap: 12, flex: '0 0 auto' }}>
          <button className="lien" disabled={occupe} onClick={() => void ouvrir()}>
            {occupe ? 'ouverture…' : 'ouvrir'}
          </button>
          <button className="lien destructif" disabled={efface}
                  onClick={() => void retirer()}>retirer</button>
        </span>
      </div>
      {absent && (
        <p className="note alerte">
          Ce document n'est pas sur ce téléphone et le réseau ne répond pas. Il reviendra
          au retour du signal.
        </p>
      )}
    </div>
  )
}

/**
 * UN GESTE ET SES PIÈCES.
 *
 * « Pour constituer une preuve » — et le mot change la nature de l'objet. Une
 * photo de roulage est un souvenir : elle peut manquer sans que rien ne soit
 * faux. Une facture de plaquettes est une pièce : à la revente, c'est elle qui
 * distingue « entretenue » de « on me dit qu'elle est entretenue ». C'est la
 * seule donnée du produit qui ait une valeur devant un tiers.
 *
 * D'où deux boutons et non un : la photo montre un état, la facture prouve une
 * dépense. Les confondre ferait annoncer « 3 preuves » là où il y a trois
 * clichés du même disque et aucun justificatif.
 */
function Geste({ db, i, onEcrit }: {
  db: PowerSyncDatabase; i: Intervention; onEcrit: () => void
}) {
  const [pieces, setPieces] = useState<Photo[]>([])
  const photo = useRef<HTMLInputElement>(null)
  const facture = useRef<HTMLInputElement>(null)

  const charger = useCallback(async () => setPieces(await piecesDeLIntervention(db, i.id)), [db, i.id])
  useEffect(() => { void charger() }, [charger])

  const verser = async (f: File, g: Genre) => {
    await verserPhoto(db, { interventionId: i.id }, f, g)
    await charger(); onEcrit()
  }
  const [quand, setQuand] = useState<string | null>(null)
  const [fait, occupe] = useGeste(async (jour: string) => {
    await cestFait(db, i.id, jour)
    onEcrit()
  })

  const nPhotos = pieces.filter((p) => p.genre === 'photo').length
  const nFactures = pieces.filter((p) => p.genre === 'facture').length

  return (
    <div className="bloc pile geste-atelier">
      {/* Le libellé sur sa ligne, ses faits en dessous — même règle qu'une pièce
          d'équipement, et pour la même raison : « Plaquettes avant + disques »
          face à « 2026-08-19 · 189,90 € » sur un `rang` de 390 px renvoyait le
          symbole € tout seul à la ligne. Un libellé de geste est libre, la mise
          en page doit le supposer long plutôt que l'espérer court. */}
      <div className="pile" style={{ gap: 2 }}>
        <span className="texte">{i.libelle}</span>
        <span className="libelle faible">
          {i.date_jour ?? 'en attente'}
          {i.cout_centimes ? ` · ${formaterEuros(i.cout_centimes)}` : ''}
        </span>
      </div>

      {pieces.length > 0 && (
        <>
          <div className="pieces">
            {pieces.map((p) => <Vignette key={p.id} p={p} />)}
          </div>
          {/* Le décompte SÉPARE les deux, parce qu'ils ne prouvent pas la même
              chose. « 3 pièces » sur trois photos du même disque annoncerait un
              dossier là où il n'y a qu'un album. */}
          <p className="sous-titre">
            {nPhotos ? `${nPhotos} photo${nPhotos > 1 ? 's' : ''}` : ''}
            {nPhotos && nFactures ? ' · ' : ''}
            {nFactures ? `${nFactures} facture${nFactures > 1 ? 's' : ''}` : ''}
          </p>
        </>
      )}

      <input ref={photo} type="file" accept="image/*" hidden
             onChange={(e) => { const f = e.target.files?.[0]; if (f) void verser(f, 'photo') }} />
      <input ref={facture} type="file" accept="image/*" hidden
             onChange={(e) => { const f = e.target.files?.[0]; if (f) void verser(f, 'facture') }} />

      <div className="rang">
        <button className="lien" onClick={() => photo.current?.click()}>
          Ajouter une photo
        </button>
        <button className="lien" onClick={() => facture.current?.click()}>
          Ajouter une facture
        </button>
      </div>

      {/* ⚠ LA DATE SE CHOISIT — retour de Julian : « quand on met un geste :
          possibilité de mettre la date ». Le produit n'offrait que « c'est fait
          aujourd'hui », donc consigner une vidange faite trois semaines plus tôt
          était impossible : la date était fausse ou le geste n'était pas saisi.
          Et une date fausse sur un carnet d'entretien est pire qu'une absence —
          c'est elle qui fait repartir l'horloge d'usure au mauvais moment.

          MAIS LE GESTE D'UN TAP RESTE LE DÉFAUT. Au paddock, gants aux mains,
          « c'est fait aujourd'hui » doit rester un seul appui. La date est un
          recours pour qui rattrape, pas une étape pour qui consigne sur le
          moment — d'où le lien discret plutôt qu'un champ toujours ouvert. */}
      {i.etat === 'visee' && (quand === null ? (
        <>
          <button className="bouton secondaire" disabled={occupe}
                  onClick={() => void fait(aujourdhui())}>
            {occupe ? 'enregistrement…' : "C'est fait aujourd'hui"}
          </button>
          <button className="lien" onClick={() => setQuand(aujourdhui())}>
            C'était un autre jour
          </button>
        </>
      ) : (
        <div className="pile">
          <input className="champ" type="date" value={quand} max={aujourdhui()}
                 onChange={(e) => setQuand(e.target.value)} />
          <button className="bouton secondaire" disabled={occupe || !quand}
                  onClick={() => void fait(quand)}>
            {occupe ? 'enregistrement…' : `C'était le ${quand}`}
          </button>
          <button className="lien" onClick={() => setQuand(null)}>Annuler</button>
        </div>
      ))}
    </div>
  )
}

/** La pièce se sert TOUJOURS depuis la copie locale (FR-10, NFR-7) : une
 *  pièce « en attente d'envoi » ne peut pas être une pièce absente à l'écran. */
function Vignette({ p }: { p: Photo }) {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let vivant = true
    let cree: string | null = null
    void lireLocale(nomLocal(p)).then((f) => {
      if (!vivant || !f) return
      cree = URL.createObjectURL(f)
      setUrl(cree)
    })
    return () => { vivant = false; if (cree) URL.revokeObjectURL(cree) }
  }, [p])
  if (!url) return <div className="piece vide" aria-hidden />
  return (
    <figure className="piece">
      <img src={url} alt={p.genre === 'facture' ? 'facture' : 'photo du geste'} />
      {p.genre === 'facture' && <figcaption>facture</figcaption>}
    </figure>
  )
}

/**
 * « LE PHOTOGRAPHIER, C'EST TOUT » — FR-47.
 *
 * ⚠ La photo d'une bricole porte la MACHINE, pas un roulage : cette réparation
 * n'a pas de journée, elle a une moto. Une version précédente passait
 * l'identifiant de machine dans le champ du roulage ; côté serveur la clé
 * étrangère levait un 23503, la ligne était écartée DÉFINITIVEMENT, et
 * l'intervention qui la référence avec elle. La réparation existait sur ce
 * téléphone et nulle part ailleurs, sans qu'aucune erreur ne s'affiche.
 */
function ParLaPhoto({ db, machineId, onFini }: {
  db: PowerSyncDatabase; machineId: string; onFini: () => void
}) {
  const fichier = useRef<HTMLInputElement>(null)
  const verser = async (f: File) => {
    const p = await verserPhoto(db, { machineId }, f)
    await viser(db, {
      machineId, categorie: 'reparation_non_vitale', libelle: 'À regarder', photoId: p.id,
    })
    onFini()
  }
  return (
    <>
      <input ref={fichier} type="file" accept="image/*" hidden
             onChange={(e) => { const f = e.target.files?.[0]; if (f) void verser(f) }} />
      <button className="lien" onClick={() => fichier.current?.click()}>
        Le photographier, c'est tout
      </button>
    </>
  )
}

/** La saisie — inchangée dans sa règle : FR-43, « consigner le geste ne dépend
 *  jamais d'avoir consigné l'argent ». Le montant reste facultatif. */
function Saisir({ db, machineId, categorie, onFini }: {
  db: PowerSyncDatabase; machineId: string; categorie: Categorie; onFini: () => void
}) {
  const [libelle, setLibelle] = useState('')
  const [montant, setMontant] = useState('')
  const [jour, setJour] = useState(aujourdhui())
  const [dater, setDater] = useState(false)
  const centimes = montant.trim() ? enCentimes(montant) : null
  const [poser, occupe] = useGeste(async (maintenant: boolean) => {
    const commun = { machineId, categorie, libelle, centimes }
    if (maintenant) await consigner(db, { ...commun, date: jour })
    else await viser(db, commun)
    onFini()
  })

  return (
    <div className="pile">
      <input className="champ" value={libelle} onChange={(e) => setLibelle(e.target.value)}
             placeholder="Plaquettes avant" autoComplete="off" />
      <input className="champ" value={montant} onChange={(e) => setMontant(e.target.value)}
             placeholder="montant, si tu l'as" inputMode="decimal" />

      {/* Même arbitrage qu'au-dessus : un tap par défaut, la date pour qui
          rattrape. Un champ date toujours ouvert ajoute une décision à chaque
          saisie, et une décision de plus au paddock est une saisie de moins. */}
      {dater && (
        <input className="champ" type="date" value={jour} max={aujourdhui()}
               onChange={(e) => setJour(e.target.value)} />
      )}
      <button className="bouton" disabled={!libelle.trim() || occupe} onClick={() => void poser(true)}>
        {jour === aujourdhui() ? "C'est fait aujourd'hui" : `C'était le ${jour}`}
      </button>
      {!dater && (
        <button className="lien" onClick={() => setDater(true)}>C'était un autre jour</button>
      )}
      <button className="bouton secondaire" disabled={!libelle.trim() || occupe}
              onClick={() => void poser(false)}>
        {categorie === 'reparation_non_vitale' ? 'Ça peut attendre' : 'Acheté, pas encore monté'}
      </button>
      <button className="lien" onClick={onFini}>Annuler</button>
    </div>
  )
}
