import { useCallback, useEffect, useRef, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import { composer, enFichier, type Gabarit, type Matiere } from '../recap/composer'
import { recapGenere, recapPoste } from '../db/mesures'

/**
 * LE RÉCAPITULATIF PARTAGEABLE — récits 4.1, 4.2 et 4.3.
 *
 * FR-36 : il SE COMPOSE TOUT SEUL et s'affiche SANS AVOIR ÉTÉ DEMANDÉ à la fin
 * de la saisie. Ce n'est pas une fonctionnalité qu'on va chercher dans un menu :
 * c'est ce que le produit rend au pilote pour le travail qu'il vient de faire.
 *
 * FR-37 / NFR-11 : AUCUNE CIBLE N'EST NOMMÉE. Ni dans le code, ni dans
 * l'interface, ni dans une constante, ni dans une icône. Le produit ne sait pas
 * où le pilote poste, et c'est très bien ainsi — nommer une cible, c'est
 * épouser la fortune d'une plateforme et vieillir avec elle.
 */

const GABARITS: { cle: Gabarit; nom: string }[] = [
  { cle: 'perf', nom: 'CHRONO' },
  { cle: 'budget', nom: 'BUDGET' },
  { cle: 'geste', nom: 'GESTE' },
]

export function Recap({ db, matiere, onFermer }: {
  db: PowerSyncDatabase; matiere: Matiere; onFermer: () => void
}) {
  const [gabarit, setGabarit] = useState<Gabarit>('perf')
  const [masquerBudget, setMasquerBudget] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [repli, setRepli] = useState(false)
  const [souci, setSouci] = useState<string | null>(null)
  const blob = useRef<Blob | null>(null)
  // L'instrument ② ne compte qu'UNE génération par ouverture du récapitulatif :
  // changer de gabarit recompose l'image mais ne produit pas un second récap.
  const compte = useRef(false)

  const refaire = useCallback(async () => {
    try {
      const b = await composer(matiere, gabarit, masquerBudget)
      blob.current = b
      setUrl((ancienne) => { if (ancienne) URL.revokeObjectURL(ancienne); return URL.createObjectURL(b) })
      if (!compte.current) { compte.current = true; await recapGenere(db) }
    } catch (e) {
      setSouci("L'image n'a pas pu être composée sur ce téléphone. Le roulage est enregistré, "
        + "rien n'est perdu. (" + (e as Error).message + ')')
    }
  }, [db, matiere, gabarit, masquerBudget])

  useEffect(() => { void refaire() }, [refaire])

  const partager = async () => {
    if (!blob.current) return
    setSouci(null)
    const fichier = enFichier(blob.current, matiere.circuit, matiere.date)
    // NFR-11 : `canShare` est testé avec L'OBJET EXACT qui sera passé à
    // `share()`. Un objet équivalent ne prouve rien — c'est le contenu de
    // `files` que la plateforme accepte ou refuse, pas sa forme.
    const charge: ShareData = { files: [fichier] }
    if (!navigator.canShare?.(charge)) { setRepli(true); return }
    try {
      await navigator.share(charge)
      // FR-58 : posté n'est pas généré, et c'est l'ÉCART entre les deux qui
      // porte l'information. Un partage annulé ne compte jamais comme posté.
      await recapPoste(db)
    } catch (e) {
      // Annuler est UN CHOIX, pas une erreur : rien ne s'affiche.
      if ((e as Error).name === 'AbortError') return
      setRepli(true)
    }
  }

  return (
    <section className="recap">
      <p className="libelle">Ta journée</p>

      {url && <img className="recap-image" src={url} alt={`Récapitulatif du roulage à ${matiere.circuit}`} />}
      {souci && <p className="mot-erreur">{souci}</p>}

      {/* FR-33 : trois gabarits, choisissables EN UN TAP. Pas un menu, pas un
          réglage, pas une étape — trois puces et l'image change. */}
      <div className="puces">
        {GABARITS.map((g) => (
          <button key={g.cle} className="puce" data-actif={gabarit === g.cle ? '1' : '0'}
                  onClick={() => setGabarit(g.cle)}>{g.nom}</button>
        ))}
      </div>

      {gabarit === 'budget' && (
        <button className="lien" onClick={() => setMasquerBudget((m) => !m)}>
          {masquerBudget ? "Montrer ce que ça a coûté" : "Masquer ce que ça a coûté"}
        </button>
      )}

      <button className="bouton" onClick={() => void partager()}>Partager</button>

      {repli && url && (
        <div className="bloc pile">
          {/* FR-37 : le chemin de repli est VISIBLE et ne nomme aucune cible.
              Sur un téléphone, l'appui long sur l'image l'enregistre — c'est le
              geste du système, pas une fonction qu'on aurait à écrire. */}
          <div className="libelle">L'image est prête</div>
          <p className="texte">
            Le partage direct n'est pas disponible ici. Appuie longuement sur l'image
            pour l'enregistrer, ou télécharge-la — elle est déjà composée, rien à refaire.
          </p>
          <a className="bouton secondaire" href={url}
             download={enFichier(blob.current!, matiere.circuit, matiere.date).name}>
            Enregistrer l'image
          </a>
        </div>
      )}

      <button className="bouton secondaire" onClick={onFermer}>Retour au roulage</button>
    </section>
  )
}
