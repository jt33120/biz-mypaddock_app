import { useCallback, useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import { supabaseConfigure } from '../db/supabase'
import {
  confirmerParCode, seConnecter, seDeconnecter, sInscrire, type Identite, type Issue,
} from '../db/compte'
import { adopter, estAdopte, etatLocal, type BilanEnvoi } from '../db/sauvegarde'
import { powersyncConfigure } from '../db/connecteur'

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
  if (!supabaseConfigure) {
    return (
      <section className="compte">
        <p className="libelle">compte</p>
        <h1 className="titre">Sauvegarde non configurée</h1>
        <p className="texte">
          Cette version ne connaît aucun serveur. Tout ce qui est saisi vit dans le téléphone,
          et disparaîtrait avec lui.
        </p>
      </section>
    )
  }
  return identite ? <Connecte db={db} identite={identite} /> : <Anonyme db={db} />
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
        <h1 className="titre neon">Confirme ton adresse</h1>
        <p className="texte">
          Un message part vers <b>{email}</b>. S'il porte un code à six chiffres, saisis-le ici —
          la session s'ouvre alors <b>dans l'application</b>. S'il ne porte qu'un lien, ouvre-le,
          puis reviens te connecter avec ton mot de passe.
        </p>

        <input className="champ" value={code} onChange={(e) => setCode(e.target.value)}
               inputMode="numeric" autoComplete="one-time-code" placeholder="123456" />
        {erreur && <p className="mot-erreur">{erreur}</p>}

        <button className="bouton" disabled={occupe || code.trim().length < 6}
                onClick={() => void lancer(() => confirmerParCode(email, code))}>
          Valider le code
        </button>
        <button className="bouton secondaire" disabled={occupe}
                onClick={() => void lancer(() => seConnecter(email, mdp))}>
          J'ai confirmé — me connecter
        </button>
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
    setOccupe(true); setErreur(null)
    try {
      const { bilan: b } = await adopter(db, identite.id)
      setBilan(b)
      setAdopte(true)
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
