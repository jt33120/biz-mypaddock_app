import { useCallback, useEffect, useState } from 'react'
import {
  creerCercle, membres, mesCercles, rejoindre, roulagesDuCercle,
  type Cercle as Donnees, type LigneCercle, type Membre,
} from '../db/cercle'
import { formaterChrono } from '../db/depot'
import { TeteRepli } from './Repli'
import type { Identite } from '../db/compte'

/**
 * LE CERCLE À L'ÉCRAN — FR-39.
 *
 * ⚠ AUCUN CLASSEMENT, ET C'EST STRUCTUREL. Le tri est CHRONOLOGIQUE et jamais
 * par temps : trier par temps produirait un classement même sans numéro de
 * rang, et le pilote invisible se retrouverait mécaniquement en dernier —
 * exactement ce que FR-19 interdit. Il apparaît ici comme les autres, à sa
 * date, sans son chrono.
 *
 * Et le cercle demande une connexion. C'est le seul endroit du produit qui le
 * demande, et l'écran le dit plutôt que de tourner à vide : il n'y a rien à
 * montrer d'un cercle hors ligne, et faire descendre les données d'autrui dans
 * ce téléphone serait les ranger là où on ne les contrôle plus.
 */
export function Cercle({ identite, circuit }: {
  identite: Identite | null; circuit: string | null
}) {
  const [liste, setListe] = useState<Donnees[]>([])
  /** Le pli de la note « sans compte » — voir son commentaire au rendu. */
  const [ouvert, setOuvert] = useState(false)
  const [actif, setActif] = useState<Donnees | null>(null)
  const [gens, setGens] = useState<Membre[]>([])
  const [lignes, setLignes] = useState<LigneCercle[]>([])
  const [souci, setSouci] = useState<string | null>(null)
  /** Ce que la lecture n'a pas pu faire — distinct de `souci`, qui est le refus
   *  d'un geste du pilote. Une panne de lecture n'est la faute de personne. */
  const [panne, setPanne] = useState<string | null>(null)
  const [mode, setMode] = useState<'aucun' | 'creer' | 'rejoindre'>('aucun')
  const [nom, setNom] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [code, setCode] = useState('')

  // ⚠ UNE PANNE NE SE RANGE PAS DANS LES DONNÉES, elle se dit. Les quatre
  // lectures rendent maintenant leur souci ; sans ça, un réseau coupé renvoyait
  // un pilote qui a un cercle vers « Créer un cercle », et affirmait à un autre
  // que personne n'avait roulé là où il n'avait pas pu demander.
  const charger = useCallback(async () => {
    const { valeur: l, souci: s } = await mesCercles()
    setPanne(s)
    setListe(l); setActif((a) => l.find((x) => x.id === a?.id) ?? l[0] ?? null)
  }, [])
  useEffect(() => { if (identite) void charger() }, [identite, charger])

  useEffect(() => {
    if (!actif) { setGens([]); setLignes([]); return }
    void membres(actif.id).then((r) => { setGens(r.valeur); if (r.souci) setPanne(r.souci) })
    if (circuit) void roulagesDuCercle(actif.id, circuit)
      .then((r) => { setLignes(r.valeur); setPanne(r.souci) })
  }, [actif, circuit])

  if (!identite) {
    return (
      /* ⚠ REPLIÉ — lot 3, 2 septembre 2026. 158 px sur le bilan d'une journée pour
         un paragraphe qui n'offre AUCUN geste : il explique qu'une fonction
         demande un compte, à quelqu'un qui n'en a pas et qui est venu lire sa
         journée. Ce n'est pas un fait de la journée, c'est une note de bas de
         page — elle garde sa place et cesse de prendre un cinquième d'écran.
         Elle n'est pas retirée : « le seul endroit du produit qui demande un
         compte » est une promesse du produit sur lui-même, et une promesse qu'on
         efface est une promesse qu'on ne tient plus. */
      <div className="bloc pile">
        <TeteRepli titre="cercle" etat="demande un compte"
                   ouvert={ouvert} onBasculer={() => setOuvert(!ouvert)} />
        {ouvert && (
          <p className="texte">
            Le cercle demande un compte et une connexion — c'est le seul endroit du produit qui
            les demande. Tout le reste fonctionne au paddock, sans réseau.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="bloc pile cercle">
      <div className="rang">
        <span className="libelle">cercle</span>
        {liste.length > 1 && (
          <div className="puces">
            {liste.map((c) => (
              <button key={c.id} className="puce" data-actif={c.id === actif?.id ? '1' : '0'}
                      onClick={() => setActif(c)}>{c.nom.toUpperCase()}</button>
            ))}
          </div>
        )}
      </div>

      {actif ? (
        <>
          <p className="texte">{actif.nom} · {gens.length} pilote{gens.length > 1 ? 's' : ''}</p>
          <p className="note">
            Code à donner de vive voix : <b>{actif.code}</b>. Il n'y a aucun classement, ici ni
            ailleurs — et aucun cercle public.
          </p>

          {circuit && (
            <>
              <div className="libelle faible">à {circuit}</div>
              {panne ? <p className="mot-erreur">{panne}</p> : lignes.length ? lignes.map((l) => (
                <div className="rang ligne-atelier" key={l.id}>
                  <span className="texte">{l.pseudo}</span>
                  <span className="libelle faible">{l.date_jour}</span>
                  {/* FR-19 — un pilote invisible apparaît SANS son chrono, à sa
                      date, comme les autres. Jamais en creux, jamais en dernier. */}
                  <span className="chiffre hud-16 miami">
                    {l.meilleur_ms != null ? formaterChrono(l.meilleur_ms) : '—'}
                  </span>
                </div>
              )) : <p className="note">Personne du cercle n'a encore roulé ici.</p>}
            </>
          )}
        </>
      ) : mode === 'aucun' ? (
        <>
          {/* ⚠ LA PANNE PASSE AVANT L'INVITATION. Sans elle, un pilote qui a
              déjà un cercle et dont la lecture a échoué lirait « Créer un
              cercle » — et en créerait un second. */}
          {panne && <p className="mot-erreur">{panne}</p>}
          <p className="texte">
            Un cercle est fermé et de l'ordre de quelques personnes. On y compare à circuit égal,
            et il n'existe aucun classement.
          </p>
          <button className="bouton secondaire" onClick={() => setMode('creer')}>Créer un cercle</button>
          <button className="lien" onClick={() => setMode('rejoindre')}>J'ai un code</button>
        </>
      ) : mode === 'creer' ? (
        <>
          <div className="libelle">nom du cercle</div>
          <input className="champ" value={nom} onChange={(e) => setNom(e.target.value)}
                 placeholder="Les copains du samedi" autoComplete="off" />
          <div className="libelle">ton pseudo dedans</div>
          <input className="champ" value={pseudo} onChange={(e) => setPseudo(e.target.value)}
                 placeholder="Julian" autoComplete="off" />
          {souci && <p className="mot-erreur">{souci}</p>}
          <button className="bouton" disabled={!nom.trim() || !pseudo.trim()}
                  onClick={() => void creerCercle(nom, pseudo).then((e) => {
                    setSouci(e); if (!e) { setMode('aucun'); return charger() }
                  })}>
            Créer
          </button>
          <button className="lien" onClick={() => setMode('aucun')}>Annuler</button>
        </>
      ) : (
        <>
          <div className="libelle">le code qu'on t'a donné</div>
          <input className="champ" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                 placeholder="K7M2QX" autoComplete="off" />
          <div className="libelle">ton pseudo dedans</div>
          <input className="champ" value={pseudo} onChange={(e) => setPseudo(e.target.value)}
                 placeholder="Julian" autoComplete="off" />
          {souci && <p className="mot-erreur">{souci}</p>}
          <button className="bouton" disabled={!code.trim() || !pseudo.trim()}
                  onClick={() => void rejoindre(code, pseudo).then((e) => {
                    setSouci(e); if (!e) { setMode('aucun'); return charger() }
                  })}>
            Rejoindre
          </button>
          <button className="lien" onClick={() => setMode('aucun')}>Annuler</button>
        </>
      )}
    </div>
  )
}
