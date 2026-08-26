import { useCallback, useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import { supabaseConfigure } from '../db/supabase'
import {
  confirmerParCode, seConnecter, seDeconnecter, sInscrire, type Identite, type Issue,
} from '../db/compte'
import {
  adopter, direCombien, estAdopte, etatLocal, nomTable, type BilanEnvoi, type Refus,
} from '../db/sauvegarde'
import { powersyncConfigure } from '../db/connecteur'
import { accepterMesures, mesuresAcceptees } from '../db/mesures'
import { composer as composerEmport, formaterPoids, peser, type Poids } from '../db/emporter'
import { effacerAuServeur, effacerLeTelephone } from '../db/effacer'
import { envoiCloudActif, poserEnvoiCloud } from '../db/photos'
import type { Adoption } from '../App'

/** Ce que dit l'écran pendant que l'application s'en occupe. Aucune de ces
 *  phrases ne demande quoi que ce soit au pilote : elles énoncent où en est un
 *  travail qui n'est pas le sien. */
const MOT_ADOPTION: Record<Adoption['etat'], string> = {
  inconnue: "Rien à déposer pour l'instant.",
  // Hors production, le dépôt automatique est coupé — et la raison est dite, pas
  // sous-entendue : ici, « éprouver » et « écrire pour de vrai » sont le même
  // geste, parce qu'il n'y a qu'une base.
  hors_production: "Cet exemplaire n'est pas la production, et il parle pourtant à la vraie base. "
    + "Rien ne part tout seul : le bouton ci-dessous montre ce qu'il enverrait avant de l'envoyer.",
  attend_le_reseau: "Pas de réseau : la sauvegarde partira d'elle-même au retour du signal. "
    + "Rien n'est perdu en attendant — tout est déjà sur ce téléphone.",
  en_cours: 'La première sauvegarde est en train de partir. Elle dépose sur le serveur ce qui '
    + 'a été saisi avant le compte.',
  faite: "Les changements partent tout seuls dès qu'il y a du réseau.",
  partielle: 'Une partie est partie, le reste attend. Le journal local est conservé : rien '
    + "n'est perdu, et une relance reprend là où ça s'est arrêté.",
  echec: "La sauvegarde n'a pas pu partir. Tout est encore sur ce téléphone, et elle "
    + 'retentera au prochain retour de réseau.',
}

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

export function Compte({ db, identite, adoption, onLegal, onSonde }: {
  db: PowerSyncDatabase; identite: Identite | null
  /** L'état de la première sauvegarde, ENTREPRISE PAR L'APPLICATION. Cet écran
   *  la raconte, il ne la déclenche plus. */
  adoption: Adoption
  onLegal: () => void
  /** La sonde vit ICI depuis que le compte a pris sa place dans la barre basse.
   *  C'est un instrument, pas un lieu : elle n'a jamais eu à occuper un onglet,
   *  mais elle doit rester atteignable — le récit 7.1 exige que les trois
   *  instruments de bord soient LISIBLES, pas seulement calculés. */
  onSonde: () => void
}) {
  /**
   * ⚠ L'ÉCRAN « IL NE RESTE RIEN » ÉTAIT DÉTRUIT PAR L'EFFACEMENT LUI-MÊME, et
   * personne ne l'avait vu parce qu'aucun essai n'allait jusqu'au bout du geste.
   *
   * La section n'apparaissait qu'`identite &&`. Or `effacerLeTelephone` finit par
   * `seDeconnecter()`, l'abonnement d'App rend l'identité nulle, et la section se
   * démonte AVANT que son `setFini` n'affiche quoi que ce soit. Le pilote qui
   * venait de tout effacer ne lisait donc jamais ce qui était parti : il
   * retombait sur « Que la saison survive au téléphone », c'est-à-dire une
   * invitation à créer un compte, trois cent millisecondes après avoir supprimé
   * le sien. Et le décompte des fichiers — celui-là même que ce lot vient de
   * rendre honnête — ne s'affichait jamais.
   *
   * `engage` bascule au POINT DE NON-RETOUR, quand le serveur a confirmé et
   * qu'on s'apprête à toucher au téléphone. À partir de là, cet écran ne parle
   * plus que de l'effacement : l'emport n'a plus rien à emporter et le
   * formulaire n'a plus rien à proposer.
   */
  const [engage, setEngage] = useState(false)

  return (
    <div className="compte-page"
         data-supabase-configure={supabaseConfigure ? '1' : '0'}
         data-session={identite ? '1' : '0'}>
      <header className="compte-entete">
        <p className="libelle">Réglages</p>
        <h1 className="titre">Compte</h1>
      </header>

      {!engage && (
        <>
          <section className="compte compte-groupe" aria-labelledby="compte-connexion">
            <h2 id="compte-connexion" className="titre-section">Connexion</h2>
            {!supabaseConfigure ? (
              <>
                <p className="libelle">Sauvegarde non configurée</p>
                <p className="texte">
                  Cette version ne connaît aucun serveur. Tout reste sur ce téléphone ;
                  l'export ci-dessous est la seule copie possible.
                </p>
              </>
            ) : identite ? (
              <div className="bloc pile identite-compte">
                <span className="libelle">Adresse</span>
                <span className="texte email-compte">{identite.email ?? 'Pilote'}</span>
                <span className="hud-12 miami">CONNECTÉ</span>
              </div>
            ) : <Anonyme db={db} onLegal={onLegal} />}
          </section>

          <section className="compte compte-groupe" aria-labelledby="compte-sauvegarde">
            <h2 id="compte-sauvegarde" className="titre-section">Sauvegarde</h2>
            {identite && supabaseConfigure && (
              <SauvegardeConnectee db={db} identite={identite} adoption={adoption} />
            )}
            <Emporter db={db} />
          </section>

          <section className="compte compte-groupe" aria-labelledby="compte-donnees">
            <h2 id="compte-donnees" className="titre-section">Données et confidentialité</h2>
            <EnvoiDesPhotos />
            <Mesures />
            <button type="button" className="lien" onClick={onLegal}>
              Lire les informations légales
            </button>
          </section>

          <details className="compte compte-groupe compte-diagnostic">
            <summary className="titre-section">Diagnostic et aide</summary>
            <button type="button" className="lien" onClick={onSonde}>
              Ouvrir — Instruments et sonde
            </button>
            {/* Le numéro reste atteignable pour distinguer une PWA restée sur
                un ancien paquet de la production courante. */}
            <p className="note">Version {__BUILD__}</p>
          </details>
        </>
      )}

      {/* Toujours en dernier. Après le point de non-retour, cette seule zone
          reste montée afin que le résultat de l'effacement soit lisible. */}
      {(identite || engage) && (
        <section className="compte compte-groupe zone-sensible" aria-labelledby="compte-sensible">
          <h2 id="compte-sensible" className="titre-section">Zone sensible</h2>
          {!engage && (
            <>
              <button type="button" className="lien" onClick={() => void seDeconnecter()}>
                Se déconnecter de cet appareil
              </button>
              <p className="note">
                La déconnexion ne touche que cet appareil et n'efface aucune saisie.
              </p>
            </>
          )}
          <Effacer db={db} onEngager={() => setEngage(true)} />
        </section>
      )}
    </div>
  )
}

/* ─── EFFACER SON COMPTE — NFR-6, FR-27 ────────────────────────────────────
   Deux règles, et elles se voient à l'écran :

     · L'ORDRE. Le serveur d'abord, ce téléphone ensuite. Un échec serveur ne
       touche donc à rien, et le pilote ne peut pas se retrouver sans sa saison
       ET avec son compte.
     · CE QUI PART EST NOMMÉ AVANT, pas résumé après. « Es-tu sûr ? » ne dit
       rien ; une liste de ce qui disparaît dit tout. */
function Effacer({ db, onEngager }: {
  db: PowerSyncDatabase
  /** Prévenir l'écran que le point de non-retour est franchi. Sans ce signal,
   *  l'identité qui tombe pendant l'effacement démonte cette section avant
   *  qu'elle n'ait rendu son résultat — voir le commentaire de `Compte`. */
  onEngager: () => void
}) {
  const [ouvert, setOuvert] = useState(false)
  const [occupe, setOccupe] = useState(false)
  const [souci, setSouci] = useState<string | null>(null)
  const [fini, setFini] = useState<{ objets: number; photos: number; cles: number } | null>(null)
  const [etat, setEtat] = useState<BilanEnvoi>({})

  useEffect(() => { void etatLocal(db).then(setEtat).catch(() => {}) }, [db])

  const effacer = async () => {
    setOccupe(true); setSouci(null)
    const serveur = await effacerAuServeur()
    if (!serveur.ok) { setSouci(serveur.message); setOccupe(false); return }
    // ⚠ LE POINT DE NON-RETOUR EST ICI, ET IL SE DIT AVANT D'AGIR. Le compte
    // n'existe plus côté serveur : le pilote est engagé, et cet écran ne parle
    // plus que de ça. Le signal part MAINTENANT parce que l'étape suivante
    // déconnecte — donc rend l'identité nulle — et démonterait cette section au
    // milieu de son propre travail.
    onEngager()
    // Et SEULEMENT MAINTENANT le local. Le serveur a confirmé.
    const local = await effacerLeTelephone(db)
    setFini({ objets: serveur.objets, ...local })
    setOccupe(false)
  }

  if (fini) {
    return (
      <>
        <p className="libelle">compte effacé</p>
        <h1 className="titre">Il ne reste rien</h1>
        {/* ⚠ CE NOMBRE A MENTI, ET SUR UN DROIT. Il ne comptait que l'OPFS —
            donc zéro sur tout iPhone d'avant Safari 26, pendant que les photos
            restaient dans IndexedDB. Il vient maintenant de `viderLeCoffre()`,
            qui retire des DEUX magasins et rend ce qu'il a retiré. Et le mot
            suit le compte : le coffre range aussi les portraits, les manuels et
            les factures, pas seulement des photos de roulage. */}
        <p className="texte">
          Le compte et sa saison sont supprimés du serveur, avec {fini.objets} photo
          {fini.objets > 1 ? 's' : ''}. Sur ce téléphone : la base locale, {fini.photos} fichier
          {fini.photos > 1 ? 's' : ''} de photos et de documents et {fini.cles} réglage
          {fini.cles > 1 ? 's' : ''}.
        </p>
        <button className="bouton" onClick={() => location.reload()}>Repartir de zéro</button>
      </>
    )
  }

  const lignes = Object.entries(etat).filter(([, n]) => n > 0)

  return (
    <>
      {/* ⚠ LE MOT NE S'ÉCRIT QU'UNE FOIS, ET C'EST LE BOUTON QUI LE PORTE.
          « Effacer mon compte » était le libellé de la section ET le bouton deux
          lignes plus bas : à la lecture, deux gestes possibles là où il n'y en a
          qu'un. Le libellé cède le mot parce que c'est le bouton qui agit — et
          parce que Legal.tsx cite ce bouton par son nom exact pour dire au
          pilote où exercer son droit d'effacement. Un nom de bouton cité dans un
          texte légal ne peut pas désigner un bouton qui n'existe pas. */}
      <p className="libelle">ton droit d'effacement</p>
      {!ouvert ? (
        <button className="lien destructif" onClick={() => setOuvert(true)}>
          Effacer mon compte
        </button>
      ) : (
        <div className="bloc pile">
          <div className="libelle">ce qui part, et ne revient pas</div>
          <p className="texte">
            {lignes.length
              ? lignes.map(([t, n]) => direCombien(t, n)).join(' · ')
              : 'rien de saisi'}
            {' — au serveur comme sur ce téléphone, avec les photos et les réglages.'}
          </p>
          <p className="note">
            Il n'y a pas de corbeille et pas de délai : un effacement qu'on peut annuler n'en est
            pas un. L'emport est plus haut sur cet écran, et c'est le moment de s'en servir.
          </p>
          {souci && <p className="mot-erreur">{souci}</p>}
          {/* ⚠ LE ROUGE PASSE AU DESTRUCTIF, ET LE SORTANT REPREND LE DESSIN
              PRIMAIRE. C'était l'inverse : « Effacer définitivement » portait le
              dégradé néon du bouton principal — le dessin qui, partout ailleurs
              dans le produit, dit « enregistrer », « continuer », « garder ce
              portrait ». Le geste qui détruit tout avait la forme du geste qu'on
              tape sans lire. */}
          <button className="bouton destructif" disabled={occupe} onClick={() => void effacer()}>
            {occupe ? 'effacement…' : 'Effacer définitivement'}
          </button>
          {/* ⚠ LE SORTANT EST UN `.lien`, COMME AUX DEUX AUTRES CONFIRMATIONS.
              Il portait `.bouton` — le dégradé néon, plein, plus gros et plus
              voyant que le geste rouge posé juste au-dessus. Sur les deux autres
              confirmations du produit (une journée, une chute), « Garder » est
              un lien discret : ici, la sortie criait plus fort que l'entrée, et
              trois formes différentes pour un même geste sont trois choses à
              réapprendre. Le geste qu'on tape sans lire ne doit pas être celui
              qui décide. */}
          <button className="lien" disabled={occupe} onClick={() => setOuvert(false)}>
            Garder mon compte
          </button>
        </div>
      )}
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

function Anonyme({ db, onLegal }: { db: PowerSyncDatabase; onLegal: () => void }) {
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
      <>
        <h3 className="titre neon">Le compte est créé</h3>
        <p className="texte">
          Un message part vers <b>{email}</b>. Ouvre-le et clique le lien.
        </p>
        <p className="texte">
          Il t'emmènera dans <b>Safari</b>, sur une page qui peut sembler vide ou cassée —
          aucune importance : la confirmation a eu lieu au moment du clic. Reviens ici,
          et connecte-toi.
        </p>

        {erreur && <p className="mot-erreur">{erreur}</p>}

        <button type="button" className="bouton" disabled={occupe}
                onClick={() => void lancer(() => seConnecter(email, mdp))}>
          {occupe ? 'un instant…' : 'Me connecter'}
        </button>

        {/* Chemin secondaire, et il ne marche que si le gabarit d'e-mail porte
            `{{ .Token }}`. Il est meilleur quand il est disponible — un code
            saisi ici ouvre la session SANS quitter l'application — mais le
            gabarit par défaut de Supabase n'envoie qu'un lien. */}
        <div className="plat repris">
          <p className="libelle">Si l'e-mail contient un code à six chiffres</p>
          <input className="champ" value={code} onChange={(e) => setCode(e.target.value)}
                 inputMode="numeric" autoComplete="one-time-code" placeholder="123456" />
          <button type="button" className="bouton secondaire" disabled={occupe || code.trim().length < 6}
                  onClick={() => void lancer(() => confirmerParCode(email, code))}>
            Valider le code
          </button>
        </div>

        <button type="button" className="lien" onClick={() => { setEtape('formulaire'); setErreur(null) }}>
          Changer d'adresse
        </button>
      </>
    )
  }

  return (
    <>
      <h3 className="titre neon">Créer un compte</h3>
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

      <button type="button" className="bouton" disabled={!pret || occupe}
              onClick={() => void lancer(() => sInscrire(email, mdp))}>
        {occupe ? 'un instant…' : 'Créer mon compte'}
      </button>
      <button type="button" className="bouton secondaire" disabled={!pret || occupe}
              onClick={() => void lancer(() => seConnecter(email, mdp))}>
        J'ai déjà un compte
      </button>

      {/* C'EST LE SEUL ÉCRAN OÙ LE PRODUIT CONTRACTE AVEC QUELQU'UN, et il ne
          contractait sur rien : ni mention, ni lien, ni texte à lire. Une
          formulation ÉNONCIATIVE, jamais une case à cocher — cocher ne fait pas
          lire, et le produit énonce (FR-13). */}
      <p className="note">
        Créer un compte fait partir ta saison vers un serveur en Europe.
        {' '}<button type="button" className="lien" onClick={onLegal}>Lire tes droits</button>.
      </p>
    </>
  )
}

/** Ce que le compte reprendra, compté sur la vraie base. Un chiffre est une
 *  preuve ; une promesse n'en est pas une.
 *
 *  UNE LIGNE, pas un tableau : la preuve doit tenir au-dessus du pli. Détaillée
 *  en six rangs elle repousserait le formulaire hors de l'écran, et coûterait
 *  plus qu'elle ne rend. Rien de saisi, rien d'affiché — on ne montre pas une
 *  colonne de zéros à quelqu'un qui vient d'arriver. */
/* ⚠ CET ÉCRAN AVAIT SA PROPRE TABLE DE NOMS, et elle n'en couvrait que six sur
   dix-sept : tout le reste s'affichait en nom de schéma, souligné compris —
   « 3 plan_si_alors ». Deux tables de noms dans un même produit dérivent l'une
   de l'autre à la première table ajoutée. Il n'y en a plus qu'une, à côté de la
   liste d'envoi qu'elle nomme, et un essai unitaire vérifie qu'elle les couvre
   toutes. */
function Repris({ etat }: { etat: BilanEnvoi }) {
  const lignes = Object.entries(etat).filter(([, n]) => n > 0)
  if (!lignes.length) return null
  return (
    <div className="plat repris">
      <p className="libelle">Déjà saisi ici</p>
      <p className="detail">
        {lignes.map(([table, n], i) => (
          <span key={table}>
            {i > 0 && <span className="sep"> · </span>}
            <b>{n}</b> {nomTable(table, n)}
          </span>
        ))}
      </p>
      <p className="note">Le compte leur donne un propriétaire — c'est tout ce qu'il change.</p>
    </div>
  )
}

/* ─── AVEC COMPTE ────────────────────────────────────────────────────────── */

function SauvegardeConnectee({ db, identite, adoption }: {
  db: PowerSyncDatabase; identite: Identite; adoption: Adoption
}) {
  const [bilan, setBilan] = useState<BilanEnvoi | null>(null)
  const [refus, setRefus] = useState<Refus[]>([])
  const [erreur, setErreur] = useState<string | null>(null)
  const [occupe, setOccupe] = useState(false)
  const [enAttente, setEnAttente] = useState<number | null>(null)
  // ⚠ L'ÉTAT VIENT DE L'APPLICATION, pas d'une lecture locale faite au montage.
  // `estAdopte()` lu une seule fois restait faux pendant que l'adoption
  // automatique tournait juste à côté : l'écran annonçait « en attente » sur un
  // travail déjà en cours, puis sur un travail terminé.
  const [adopteManuel, setAdopteManuel] = useState(false)
  const adopte = adopteManuel || adoption.etat === 'faite' || estAdopte(identite.id)

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
      setAdopteManuel(r.length === 0)
      await compterAttente()
    } catch (e) {
      setErreur((e as Error).message)
    }
    setOccupe(false)
  }

  const total = bilan ? Object.values(bilan).reduce((a, b) => a + b, 0) : 0

  return (
    <>
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
              : MOT_ADOPTION[adoption.etat]}
        </p>
        {/* Un motif technique se DIT, sous le texte et en petit. Le cacher
            oblige à deviner ; le mettre en gros fait d'un incident un drame. */}
        {(adoption.etat === 'echec' || adoption.etat === 'partielle') && (
          <p className="note alerte">{adoption.motif}</p>
        )}
        {enAttente != null && enAttente > 0 && (
          <div className="rang">
            <span className="libelle">Changements en attente</span>
            <span className="chiffre hud-24 miami">{enAttente}</span>
          </div>
        )}
      </div>

      {/* LE BOUTON RESTE, comme recours et comme preuve : on peut toujours
          forcer, et voir ligne par ligne ce qui est parti. Ce qui a changé est
          qu'on n'ATTEND plus rien de lui — une sauvegarde qu'il faut penser à
          faire est une sauvegarde qu'on n'a pas. */}
      <button type="button" className="bouton" disabled={occupe || adoption.etat === 'en_cours'}
              onClick={() => void envoyer()}>
        {occupe || adoption.etat === 'en_cours' ? 'envoi…' : 'Sauvegarder maintenant'}
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

    </>
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
        <button type="button" className="puce" data-actif={oui ? '1' : '0'}
                aria-label="Mesures sur le produit" aria-pressed={oui}
                onClick={basculer}>
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


/**
 * CE QUI QUITTE LE TÉLÉPHONE — récit 18.4.
 *
 * Question de Julian, 25 août : « on ne sauvegarde pas les photos dans notre
 * cloud ». Le produit répond par ce qu'il FAIT, chiffres compris — et il offre
 * de le couper, ce qui n'existait pas : dès qu'il y avait un compte et du
 * réseau, ça partait, sans que rien ne le dise ni ne le règle.
 *
 * ⚠ ET COUPER NE CASSE RIEN, ce qui est la seule chose qui rend ce réglage
 * honnête. La copie locale est écrite AVANT toute chose (`verserPhoto`), l'album
 * s'affiche depuis elle, et le produit marche entièrement hors ligne de toute
 * façon. Ce que ça change est précis, et la phrase le dit sans le maquiller :
 * les photos ne redescendront pas sur un autre appareil, et elles partiront avec
 * le téléphone s'il se perd.
 *
 * ⚠ AUCUNE DES DEUX POSITIONS N'EST « LA BONNE ». Pas de « recommandé », pas de
 * pastille, pas d'avertissement quand on coupe : c'est un arbitrage entre la
 * confidentialité et la perte, et il n'appartient qu'au pilote.
 */
function EnvoiDesPhotos() {
  const [actif, setActif] = useState(envoiCloudActif())
  return (
    <div className="bloc pile">
      <div className="rang">
        <span className="libelle">Envoyer les photos</span>
        <button type="button" className="puce" data-actif={actif ? '1' : '0'}
                aria-label="Envoyer les photos" aria-pressed={actif}
                onClick={() => { poserEnvoiCloud(!actif); setActif(!actif) }}>
          {actif ? 'OUI' : 'NON'}
        </button>
      </div>
      {/* ⚠ CE QUI PART EST DIT AU GRAMME PRÈS, pas « vos photos ». Une vignette
          de 1600 px en WebP, 200 à 400 Ko. L'original — 48 Mpx en HEIC, 3 à 8 Mo
          — n'est jamais lu en entier : ses dimensions se lisent dans l'en-tête,
          le décodage se fait déjà réduit, et il n'est ni copié, ni envoyé, ni
          touché. */}
      <p className="texte">
        Ce qui part n'est jamais ta photo d'origine : c'est une copie réduite à 1600 pixels,
        entre 200 et 400 Ko. Le fichier de ta pellicule n'est ni lu en entier, ni copié,
        ni envoyé.
      </p>
      <p className="note">
        {actif
          ? "Coupé, tout continue de marcher : les photos restent sur ce téléphone et l'album "
            + "s'affiche hors ligne. Ce que tu perds est précis — elles ne redescendront pas "
            + "sur tes autres appareils, et elles partiront avec ce téléphone s'il se perd."
          : "L'envoi est coupé. Les photos restent sur ce téléphone et l'album s'affiche hors "
            + "ligne, comme avant. Elles ne redescendront pas sur tes autres appareils, et "
            + "elles partiront avec ce téléphone s'il se perd."}
      </p>
    </div>
  )
}
