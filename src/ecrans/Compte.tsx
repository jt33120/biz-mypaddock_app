import { useCallback, useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import { supabaseConfigure } from '../db/supabase'
import {
  confirmerParCode, seConnecter, seDeconnecter, sInscrire, type Identite, type Issue,
} from '../db/compte'
import { adopter, estAdopte, etatLocal, type BilanEnvoi, type Refus } from '../db/sauvegarde'
import { powersyncConfigure } from '../db/connecteur'
import { accepterMesures, mesuresAcceptees } from '../db/mesures'
import { composer as composerEmport, formaterPoids, peser, type Poids } from '../db/emporter'

/**
 * L'ÉCRAN DU COMPTE — récit 1.2.
 *
 * Ce qu'il promet, et rien d'autre : ta saison ne disparaît pas avec le
 * téléphone. Il ne promet pas un profil, pas une communauté, pas un classement —
 * le cercle viendra au mouvement 3, quand un pote roulera.
 *
 * Trois règles s'y voient :
 *   — le compte n'est JAMAIS un préalable. On arrive ici avec une saison déjà
 *     saisie, et c'est le cas normal, pas le cas dégradé.
 *   — l'envoi est un GESTE, pas un effet de bord. Le pilote appuie et voit ce
 *     qui est parti, ligne par ligne.
 *   — perdre le réseau ne déconnecte personne. L'identité tient hors ligne ;
 *     seule la sauvegarde attend.
 */

type Etape = 'formulaire' | 'confirmation'

export function Compte({ db, identite }: { db: PowerSyncDatabase; identite: Identite | null }) {
  return (
    <>
      {!supabaseConfigure ? (
        <section className="compte">
          <p className="libelle">compte</p>
          <h1 className="titre">Sauvegarde non configurée</h1>
          <p className="texte">
            Cette version ne connaît aucun serveur. Tout ce qui est saisi vit dans le téléphone,
            et l'emport ci-dessous est alors la seule copie possible.
          </p>
        </section>
      ) : identite ? <Connecte db={db} identite={identite} /> : <Anonyme db={db} />}

      {/* HORS DES TROIS BRANCHES, et c'est tout l'intérêt : l'emport ne dépend
          ni d'un compte, ni d'un serveur, ni même d'une configuration. Il est
          le dernier filet précisément quand les autres ont cédé. */}
      <section className="compte"><Emporter db={db} /></section>

      {/* Hors des branches aussi, et pour la même famille de raisons : la mesure
          démarre à la première ouverture, donc le refus doit être atteignable
          sans compte. Un consentement qu'il faut mériter n'en est pas un. */}
      <section className="compte"><Mesures /></section>
    </>
  )
}

/* ─── EMPORTER SA SAISON — NFR-6, FR-27 ────────────────────────────────────
   Ce que cet écran refuse de faire compte autant que ce qu'il fait : il
   n'appelle aucun serveur, ne demande aucun compte, et n'annonce jamais un
   poids qu'il n'a pas mesuré. */
function Emporter({ db }: { db: PowerSyncDatabase }) {
  const [poids, setPoids] = useState<Poids | null>(null)
  const [fichier, setFichier] = useState<File | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [souci, setSouci] = useState<string | null>(null)
  const [occupe, setOccupe] = useState(false)

  useEffect(() => { void peser(db).then(setPoids).catch(() => setPoids(null)) }, [db])

  const emporter = async (avecPhotos: boolean) => {
    setOccupe(true); setSouci(null)
    let f: File
    // DEUX ÉCHECS DISTINCTS, et les confondre produit un mensonge. Trouvé sur la
    // capture de l'essai : `share()` échouait, et l'écran annonçait « le fichier
    // n'a pas pu être composé » JUSTE AU-DESSUS du fichier composé, prêt à
    // enregistrer. Composer et partager sont deux gestes ; seul le premier peut
    // faire perdre quelque chose.
    try {
      f = await composerEmport(db, avecPhotos)
    } catch (e) {
      setSouci("Le fichier n'a pas pu être composé sur ce téléphone. Rien n'est perdu, "
        + 'la saison est intacte. (' + (e as Error).message + ')')
      setOccupe(false)
      return
    }
    setFichier(f)
    setUrl((ancienne) => { if (ancienne) URL.revokeObjectURL(ancienne); return URL.createObjectURL(f) })
    // NFR-11 : `canShare` est testé avec L'OBJET EXACT qui sera partagé.
    const charge: ShareData = { files: [f] }
    if (navigator.canShare?.(charge)) {
      // Un partage refusé, annulé ou indisponible ne se signale PAS : le fichier
      // est déjà là, en dessous, et le pilote le voit. Annuler est un choix.
      try { await navigator.share(charge) } catch { /* le repli est déjà à l'écran */ }
    }
    setOccupe(false)
  }

  if (!poids) return null
  const vide = poids.lignes === 0

  return (
    <>
      <p className="libelle">emporter ta saison</p>
      <p className="texte">
        Un fichier, composé dans ce téléphone et sans aucun réseau. Il porte ses propres
        unités, donc il reste lisible sans MyPaddock — le jour où plus rien d'autre ne l'est.
      </p>
      <p className="libelle">
        {vide ? 'rien de saisi pour le moment'
          : `${poids.lignes} ligne${poids.lignes > 1 ? 's' : ''}`
            + (poids.photos ? ` · ${poids.photos} photo${poids.photos > 1 ? 's' : ''}` : '')}
      </p>

      <button className="bouton" disabled={occupe || vide} onClick={() => void emporter(false)}>
        {occupe ? 'composition…' : 'Emporter'}
      </button>
      {poids.photos > 0 && (
        <button className="lien" disabled={occupe} onClick={() => void emporter(true)}>
          {/* Le poids annoncé est celui DU FICHIER, pas celui des images : le
              base64 gonfle d'un tiers, et annoncer 98 Ko pour en livrer 133
              serait une estimation fausse là où le pilote décide sur elle. */}
          avec les photos · ≈ {formaterPoids(Math.round(poids.octetsPhotos * 4 / 3))}
        </button>
      )}
      {poids.photosAbsentes > 0 && (
        <p className="note">
          {poids.photosAbsentes} photo{poids.photosAbsentes > 1 ? 's' : ''} sans copie dans ce
          téléphone : elle{poids.photosAbsentes > 1 ? 's vivent' : ' vit'} au serveur. Le fichier
          le dit et donne le chemin, plutôt que de faire comme si de rien n'était.
        </p>
      )}

      {souci && <p className="mot-erreur">{souci}</p>}
      {fichier && url && (
        <div className="bloc pile">
          <div className="libelle">le fichier est prêt · {formaterPoids(fichier.size)}</div>
          <a className="bouton secondaire" href={url} download={fichier.name}>
            Enregistrer {fichier.name}
          </a>
        </div>
      )}
    </>
  )
}

/* ─── SANS COMPTE ────────────────────────────────────────────────────────── */

function Anonyme({ db }: { db: PowerSyncDatabase }) {
  const [etape, setEtape] = useState<Etape>('formulaire')
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [code, setCode] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)
  const [occupe, setOccupe] = useState(false)
  const [dejaLa, setDejaLa] = useState<BilanEnvoi>({})

  useEffect(() => { void etatLocal(db).then(setDejaLa).catch(() => {}) }, [db])

  const lancer = async (action: () => Promise<Issue>) => {
    setOccupe(true); setErreur(null)
    const issue = await action()
    setOccupe(false)
    if (issue.etat === 'refus') setErreur(issue.message)
    else if (issue.etat === 'confirmation') setEtape('confirmation')
    // 'connecte' : l'abonnement d'App bascule l'écran, rien à faire ici.
  }

  const pret = /.+@.+\..+/.test(email) && mdp.length >= 6

  if (etape === 'confirmation') {
    return (
      <section className="compte">
        <p className="libelle">compte</p>
        <h1 className="titre neon">Le compte est créé</h1>
        <p className="texte">
          Un message part vers <b>{email}</b>. Ouvre-le et clique le lien.
        </p>
        <p className="texte">
          Il t'emmènera dans <b>Safari</b>, sur une page qui peut sembler vide ou cassée —
          aucune importance : la confirmation a eu lieu au moment du clic. Reviens ici,
          et connecte-toi.
        </p>

        {erreur && <p className="mot-erreur">{erreur}</p>}

        <button className="bouton" disabled={occupe}
                onClick={() => void lancer(() => seConnecter(email, mdp))}>
          {occupe ? 'un instant…' : "J'ai confirmé — me connecter"}
        </button>

        {/* Chemin secondaire, et il ne marche que si le gabarit d'e-mail porte
            `{{ .Token }}`. Il est meilleur quand il est disponible — un code
            saisi ici ouvre la session SANS quitter l'application — mais le
            gabarit par défaut de Supabase n'envoie qu'un lien. */}
        <div className="plat repris">
          <p className="libelle">Si l'e-mail contient un code à six chiffres</p>
          <input className="champ" value={code} onChange={(e) => setCode(e.target.value)}
                 inputMode="numeric" autoComplete="one-time-code" placeholder="123456" />
          <button className="bouton secondaire" disabled={occupe || code.trim().length < 6}
                  onClick={() => void lancer(() => confirmerParCode(email, code))}>
            Valider le code
          </button>
        </div>

        <button className="lien" onClick={() => { setEtape('formulaire'); setErreur(null) }}>
          Changer d'adresse
        </button>
      </section>
    )
  }

  return (
    <section className="compte">
      <p className="libelle">compte</p>
      <h1 className="titre neon">Que la saison survive au téléphone</h1>
      <p className="texte">
        Tout marche déjà sans compte. Le compte ne sert qu'à une chose : ce que tu as saisi
        ne disparaît pas si tu changes de téléphone ou désinstalles l'application.
      </p>

      <Repris etat={dejaLa} />

      <div className="pile">
        <label className="libelle" htmlFor="email">Adresse</label>
        <input id="email" className="champ" value={email} onChange={(e) => setEmail(e.target.value)}
               type="email" inputMode="email" autoComplete="email" autoCapitalize="none"
               spellCheck={false} placeholder="toi@exemple.fr" />
      </div>

      <div className="pile">
        <label className="libelle" htmlFor="mdp">Mot de passe · 6 caractères minimum</label>
        <input id="mdp" className="champ" value={mdp} onChange={(e) => setMdp(e.target.value)}
               type="password" autoComplete="current-password" />
      </div>

      {erreur && <p className="mot-erreur">{erreur}</p>}

      <button className="bouton" disabled={!pret || occupe}
              onClick={() => void lancer(() => sInscrire(email, mdp))}>
        {occupe ? 'un instant…' : 'Créer mon compte'}
      </button>
      <button className="bouton secondaire" disabled={!pret || occupe}
              onClick={() => void lancer(() => seConnecter(email, mdp))}>
        J'ai déjà un compte
      </button>
    </section>
  )
}

/** Ce que le compte reprendra, compté sur la vraie base. Un chiffre est une
 *  preuve ; une promesse n'en est pas une.
 *
 *  UNE LIGNE, pas un tableau : la preuve doit tenir au-dessus du pli. Détaillée
 *  en six rangs elle repousserait le formulaire hors de l'écran, et coûterait
 *  plus qu'elle ne rend. Rien de saisi, rien d'affiché — on ne montre pas une
 *  colonne de zéros à quelqu'un qui vient d'arriver. */
function Repris({ etat }: { etat: BilanEnvoi }) {
  const NOMS: Record<string, [string, string]> = {
    machine: ['machine', 'machines'],
    roulage: ['roulage', 'roulages'],
    session: ['session', 'sessions'],
    tour: ['tour', 'tours'],
    depense: ['dépense', 'dépenses'],
    intervention: ['intervention', 'interventions'],
  }
  const lignes = Object.entries(etat).filter(([, n]) => n > 0)
  if (!lignes.length) return null
  return (
    <div className="plat repris">
      <p className="libelle">Déjà saisi ici</p>
      <p className="detail">
        {lignes.map(([table, n], i) => (
          <span key={table}>
            {i > 0 && <span className="sep"> · </span>}
            <b>{n}</b> {NOMS[table]?.[n > 1 ? 1 : 0] ?? table}
          </span>
        ))}
      </p>
      <p className="note">Le compte leur donne un propriétaire — c'est tout ce qu'il change.</p>
    </div>
  )
}

/* ─── AVEC COMPTE ────────────────────────────────────────────────────────── */

function Connecte({ db, identite }: { db: PowerSyncDatabase; identite: Identite }) {
  const [bilan, setBilan] = useState<BilanEnvoi | null>(null)
  const [refus, setRefus] = useState<Refus[]>([])
  const [erreur, setErreur] = useState<string | null>(null)
  const [occupe, setOccupe] = useState(false)
  const [enAttente, setEnAttente] = useState<number | null>(null)
  const [adopte, setAdopte] = useState(estAdopte(identite.id))

  // `ps_crud` est la file d'envoi interne du SDK. La compter, c'est répondre à la
  // seule question que le pilote se pose vraiment : est-ce que c'est parti ?
  const compterAttente = useCallback(async () => {
    try {
      const r = await db.get<{ n: number }>('SELECT count(*) AS n FROM ps_crud')
      setEnAttente(r.n)
    } catch { setEnAttente(null) }
  }, [db])
  useEffect(() => { void compterAttente() }, [compterAttente])

  const envoyer = async () => {
    setOccupe(true); setErreur(null); setRefus([])
    try {
      const { bilan: b, refus: r } = await adopter(db, identite.id)
      setBilan(b)
      setRefus(r)
      // Une adoption incomplète n'allume pas la synchronisation continue : le
      // serveur ne porte pas encore tout, et le journal local est conservé.
      setAdopte(r.length === 0)
      await compterAttente()
    } catch (e) {
      setErreur((e as Error).message)
    }
    setOccupe(false)
  }

  const total = bilan ? Object.values(bilan).reduce((a, b) => a + b, 0) : 0

  return (
    <section className="compte">
      <header className="garage-tete">
        <p className="libelle">compte</p>
        <p className="libelle">connecté</p>
      </header>

      <h1 className="titre">{identite.email ?? 'Pilote'}</h1>

      <div className="bloc pile">
        <div className="rang">
          <span className="libelle">Synchronisation continue</span>
          <span className={'hud-12 ' + (powersyncConfigure && adopte ? 'miami' : 'faible')}>
            {!powersyncConfigure ? 'PAS ENCORE BRANCHÉE' : adopte ? 'ACTIVE' : 'EN ATTENTE'}
          </span>
        </div>
        <p className="texte">
          {!powersyncConfigure
            ? "L'instance de synchronisation n'est pas encore ouverte. En attendant, la sauvegarde est un geste : tu appuies, l'état part."
            : adopte
              ? "Les changements partent tout seuls dès qu'il y a du réseau, et redescendent sur tes autres appareils."
              : "Une première sauvegarde reste à faire : elle dépose sur le serveur ce qui a été saisi avant le compte. Le suivi continu s'allume juste après."}
        </p>
        {enAttente != null && enAttente > 0 && (
          <div className="rang">
            <span className="libelle">Changements en attente</span>
            <span className="chiffre hud-24 miami">{enAttente}</span>
          </div>
        )}
      </div>

      <button className="bouton" disabled={occupe} onClick={() => void envoyer()}>
        {occupe ? 'envoi…' : adopte ? 'Sauvegarder maintenant' : 'Première sauvegarde'}
      </button>

      {erreur && <p className="mot-erreur">{erreur}</p>}

      {refus.length > 0 && (
        <div className="bloc pile">
          {/* Une erreur dit CE QUI S'EST PASSÉ, CE QUI EST CONSERVÉ, et CE QUI
              VA SE PASSER. Le reste est parti ; rien n'est perdu ; on peut
              relancer. Aucune excuse, aucun code nu tout seul. */}
          <div className="libelle alerte">
            {refus.length} ligne{refus.length > 1 ? 's' : ''} refusée{refus.length > 1 ? 's' : ''}
          </div>
          <p className="texte">
            Tout le reste est bien parti, et ces lignes-là sont toujours dans le téléphone —
            rien n'est perdu. La sauvegarde peut être relancée.
          </p>
          {refus.slice(0, 4).map((r) => (
            <p className="note" key={r.ligne}><b>{r.table}</b> · {r.motif}</p>
          ))}
          {refus.length > 4 && <p className="note">et {refus.length - 4} de plus, même motif.</p>}
        </div>
      )}

      {bilan && !erreur && (
        <div className="bloc pile">
          <div className="libelle">Envoyé · {total} ligne{total > 1 ? 's' : ''}</div>
          {Object.entries(bilan).filter(([, n]) => n > 0).map(([table, n]) => (
            <div className="rang" key={table}>
              <span className="libelle">{table}</span>
              <span className="chiffre hud-16">{n}</span>
            </div>
          ))}
          {total === 0 && <p className="texte">Rien à envoyer : le serveur est déjà à jour.</p>}
        </div>
      )}

      <button className="lien" onClick={() => void seDeconnecter()}>
        Se déconnecter de cet appareil
      </button>
      <p className="note">
        La déconnexion ne touche que cet appareil, et n'efface rien de ce qui est saisi ici.
      </p>
    </section>
  )
}

/* ─── LA REMONTÉE, ANNONCÉE ET REFUSABLE ───────────────────────────────────
   AD-16 : trois mesures, exactement, et le pilote peut s'y opposer SANS PERDRE
   AUCUNE FONCTION. Elles sont donc nommées une par une — un « données d'usage »
   vague serait un consentement qui n'en est pas un.

   Et le refus n'écrit RIEN, pas même en local (AD-20). C'est la différence entre
   « on ne le regardera pas » et « ça n'existe pas ». */
function Mesures() {
  const [oui, setOui] = useState(mesuresAcceptees())
  const basculer = () => { const v = !oui; accepterMesures(v); setOui(v) }

  return (
    <div className="plat repris">
      <div className="rang">
        <span className="libelle">Mesures sur le produit</span>
        <button className="puce" data-actif={oui ? '1' : '0'} onClick={basculer}>
          {oui ? 'ACTIVES' : 'REFUSÉES'}
        </button>
      </div>
      <p className="note">
        Trois choses, et rien d'autre : le délai entre un roulage et sa saisie, le nombre de
        récapitulatifs produits puis réellement partagés, et le nombre d'ouvertures qui ne
        saisissent rien. Aucune ne porte sur ton pilotage.
      </p>
      <p className="note">
        {oui
          ? "Elles voyagent avec tes données, par le même chemin. Aucun traceur, aucun service tiers."
          : "Rien n'est écrit — pas même dans le téléphone. L'application fonctionne à l'identique."}
      </p>
    </div>
  )
}
