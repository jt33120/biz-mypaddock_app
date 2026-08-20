import { useEffect, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import { ficheCircuit, formaterLongueur, type FicheCircuit } from '../db/circuits'
import { formaterChrono, formaterEcart } from '../db/depot'
import { Trophee } from './Trophee'

/**
 * LA FICHE D'UN CIRCUIT — « le plan du circuit, les virages principaux,
 * longueur, bon à savoir, lien vers le site de circuit » (Julian, 20 août).
 *
 * ⚠ L'ORDRE DES BLOCS EST LA DÉCISION PRINCIPALE, et il est contre-intuitif :
 * la fiche s'ouvre sur CE QUE LE PILOTE Y A FAIT, pas sur les caractéristiques
 * du circuit.
 *
 * La raison est concrète. Le référentiel descend par la synchronisation et il
 * est aujourd'hui VIDE — la récolte n'a jamais tourné, et elle ne tournera pas
 * avant que Julian pose une clé. Une fiche qui s'ouvrirait sur « longueur : —,
 * virages : — » serait un écran mort qu'on n'ouvre plus jamais, et il le
 * resterait même le jour où les données arrivent : on n'y revient pas.
 *
 * Ce que le pilote a fait là-bas, lui, existe dès le premier chrono, hors ligne,
 * sans compte. C'est ce qui rend l'écran utile AVANT la récolte — et ce qui le
 * garde utile si elle n'existe jamais.
 *
 * ⚠ ET AUCUN OBJECTIF, NULLE PART. L'écart entre le premier chrono et le
 * meilleur est un FAIT MESURÉ — « tu as pris 12 secondes ici » — jamais une
 * cible, jamais un « il te reste ». Le produit énonce, il ne décerne pas.
 */
export function Circuit({ db, nom, onFermer }: {
  db: PowerSyncDatabase; nom: string; onFermer: () => void
}) {
  const [f, setF] = useState<FicheCircuit | null>(null)
  useEffect(() => { void ficheCircuit(db, nom).then(setF) }, [db, nom])

  if (!f) return <div className="libelle">…</div>

  const { reference: r, sien } = f
  const progres = sien.premierChronoMs != null && sien.meilleurMs != null
    && sien.premierChronoMs !== sien.meilleurMs
    ? sien.meilleurMs - sien.premierChronoMs
    : null

  return (
    <section className="garage circuit-page">
      <header className="garage-tete">
        <button className="lien" onClick={onFermer}>← retour</button>
        {r?.pays && <p className="libelle">{r.pays}</p>}
      </header>

      <div className="garage-titre">
        <p className="marque">circuit</p>
        <h1 className="modele">{f.nom}</h1>
        {/* La longueur et le sens viennent du référentiel : ils peuvent manquer,
            et alors ils ne s'affichent pas. Ni tiret, ni « inconnu » — l'absence
            d'une information n'est pas une information. */}
        {(r?.longueur_m || r?.nb_virages || r?.sens) && (
          <p className="sous-titre">
            {[formaterLongueur(r?.longueur_m ?? null),
              r?.nb_virages ? `${r.nb_virages} virages` : null,
              r?.sens === 'horaire' ? 'sens horaire'
                : r?.sens === 'antihoraire' ? 'sens antihoraire' : null,
            ].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* ─── CE QUE TU Y AS FAIT — en tête, toujours ────────────────────── */}
      <div className="chiffres">
        <div>
          <p className="et">journées</p>
          <p className="va">{sien.journees}</p>
        </div>
        <div>
          <p className="et">meilleur tour</p>
          {sien.meilleurMs != null ? (
            <p className="va avec-trophee"><Trophee taille={15} />{formaterChrono(sien.meilleurMs)}</p>
          ) : <p className="va">—</p>}
        </div>
        <div>
          <p className="et">depuis la première</p>
          {/* Un écart PORTE TOUJOURS SON SIGNE : la couleur seule ne se
              distingue pas en deutéranopie. Et il est libellé « depuis la
              première fois » — un constat daté, pas un score. */}
          {progres != null ? (
            <>
              <p className={'va ' + (progres < 0 ? 'mieux' : 'plus-lent')}>
                {formaterEcart(progres)}
              </p>
              <p className="ou">depuis {sien.premiere}</p>
            </>
          ) : <p className="va">—</p>}
        </div>
      </div>

      {sien.journees === 0 && (
        <p className="note">Tu n'as pas encore roulé ici.</p>
      )}

      {/* ─── LE PLAN ────────────────────────────────────────────────────── */}
      {r?.plan_url && (
        <div className="bloc pile">
          <p className="libelle">Le tracé</p>
          {/* `loading="lazy"` et un repli silencieux : au paddock il n'y a pas
              de réseau, et une image cassée avec son icône de fichier absent
              est pire qu'une image absente. */}
          <img className="plan-circuit" src={r.plan_url} alt={`Tracé de ${f.nom}`}
               loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        </div>
      )}

      {/* ─── LES VIRAGES, un par ligne ──────────────────────────────────── */}
      {f.virages.length > 0 && (
        <div className="bloc pile">
          <p className="libelle">Les virages</p>
          {f.virages.map((v, i) => (
            <div className="rang ligne-atelier" key={i}>
              <span className="pile" style={{ gap: 0 }}>
                <span className="texte">
                  {v.numero != null ? `${v.numero}. ` : ''}{v.nom ?? '—'}
                </span>
                {v.note && <span className="sous-titre">{v.note}</span>}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ─── BON À SAVOIR ──────────────────────────────────────────────── */}
      {r?.bon_a_savoir && (
        <div className="bloc pile">
          <p className="libelle">Bon à savoir</p>
          <p className="texte">{r.bon_a_savoir}</p>
        </div>
      )}

      {/* ⚠ CE QUI VIENT D'UNE EXTRACTION LE DIT, ET DIT D'OÙ. Même clause que le
          barème constructeur, et pour la même raison : « le virage 3 se prend en
          aveugle » est une phrase qui engage la sécurité de quelqu'un, et une
          extraction par IA est une reconstruction, pas une transcription. */}
      {r?.extrait_par_ia && (
        <p className="note">
          Ces informations ont été extraites automatiquement d'une page publique
          {r.recolte_le ? ` le ${r.recolte_le.slice(0, 10)}` : ''}. Elles peuvent être fausses.
          {r.source_url && (
            <> <a href={r.source_url} target="_blank" rel="noreferrer noopener">Voir la source</a>.</>
          )}
        </p>
      )}

      {r?.site_web && (
        <a className="bouton secondaire" href={r.site_web} target="_blank" rel="noreferrer noopener">
          Le site du circuit
        </a>
      )}

      {/* ⚠ CE LIEN MARCHE MÊME QUAND ON NE SAIT RIEN, et c'est sa seule raison
          d'être. Sans référentiel, la fiche n'a que trois chiffres à montrer et
          le reste de l'écran est vide — un écran vide se lit comme un écran
          cassé, et on n'y revient pas.

          C'est une RECHERCHE, pas un lien inventé : le produit ne connaît pas
          l'adresse de chaque circuit et ne fait pas semblant. Même dispositif
          que le manuel d'atelier, DuckDuckGo pour la même raison — aucun
          traceur posé au clic. Et il annonce qu'il sort de l'application,
          parce qu'au paddock il échouera. */}
      <a className="lien" target="_blank" rel="noreferrer noopener"
         href={`https://duckduckgo.com/?q=${encodeURIComponent(`circuit ${f.nom} moto tracé virages`)}`}>
         Chercher « circuit {f.nom} » sur le web
      </a>
      <p className="note">Ouvre le navigateur, et demande du réseau.</p>

      {/* Quand le référentiel ne sait rien, on le DIT — plutôt que de laisser un
          écran à moitié vide qui se lit comme un bug. Et on dit pourquoi, parce
          que « pas encore » et « jamais » ne se ressemblent pas. */}
      {!r && (
        <p className="note">
          Le référentiel ne connaît pas encore ce circuit : sa longueur, son tracé et ses
          virages descendront quand la récolte les aura lus. Ce que tu y as fait, lui, est
          déjà là et ne dépend de rien.
        </p>
      )}
    </section>
  )
}
