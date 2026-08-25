import { useCallback, useEffect, useRef, useState } from 'react'
import type { PowerSyncDatabase } from '@powersync/web'
import { nouvelId } from '../db/ids'
import { NOM_BASE, VFS_DEMANDE, opfsDisponible, ouvrirBase, vfsReel } from '../db/powersync'
import { SEUIL_H, tableauDeBord, type Tableau } from '../db/mesures'
import { capaciteLocale, inventaireDuCoffre } from '../db/coffre'

type Etat = { cle: string; val: string; ton?: 'oui' | 'non' | 'attente' }

/**
 * La sonde du récit 0.1, conservée comme instrument. Elle reste le seul endroit
 * où l'on voit ce que l'appareil fait réellement.
 *
 * ⚠ SON « OPFS CONFIRMÉ » NE COUVRAIT PAS L'ÉCRITURE DES FICHIERS, et ce
 * malentendu a coûté cher. Elle mesure `navigator.storage.getDirectory()` et le
 * VFS de PowerSync, qui écrit par `createSyncAccessHandle` — disponible depuis
 * Safari 15.2. Les photos et les documents, eux, passaient par
 * `createWritable()`, absent de tout Safari antérieur à la 26 : la sonde
 * affichait un feu vert franc pendant que pas un seul octet ne pouvait
 * s'écrire. Une sonde qui valide une API pendant que le code en utilise une
 * autre est pire qu'aucune sonde — elle fait chercher la panne ailleurs.
 */
export function Sonde({ db, onFermer }: { db: PowerSyncDatabase; onFermer: () => void }) {
  const [etats, setEtats] = useState<Etat[]>([])
  const [journal, setJournal] = useState<string[]>([])
  const [occupe, setOccupe] = useState(false)
  const base = useRef<ReturnType<typeof ouvrirBase> | null>(null)

  const dire = (m: string) =>
    setJournal((j) => [`${new Date().toLocaleTimeString('fr-FR')}  ${m}`, ...j].slice(0, 12))

  const mesurer = useCallback(async () => {
    const l: Etat[] = []
    const autonome = window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    l.push({ cle: '① INSTALLÉE', val: autonome ? 'OUI' : 'NON — onglet Safari', ton: autonome ? 'oui' : 'non' })
    if (navigator.storage?.persisted) {
      const p = await navigator.storage.persisted()
      l.push({ cle: 'Persistance', val: p ? 'accordée' : 'non accordée', ton: p ? 'oui' : 'non' })
    }
    if (navigator.storage?.estimate) {
      const e = await navigator.storage.estimate()
      const mo = (n?: number) => (n ? (n / 1048576).toFixed(1) + ' Mo' : '—')
      l.push({ cle: 'Quota (estim.)', val: mo(e.quota), ton: 'attente' })
      l.push({ cle: 'Utilisé (estim.)', val: mo(e.usage), ton: 'attente' })
    }
    const reel = await vfsReel()
    l.push({ cle: '② VFS RÉEL', val: reel, ton: reel.startsWith('OPFS confirmé') ? 'oui' : reel.startsWith('REPLI') ? 'non' : 'attente' })
    l.push({ cle: '   (demandé)', val: VFS_DEMANDE, ton: 'attente' })
    l.push({ cle: 'OPFS', val: await opfsDisponible(), ton: 'attente' })

    // ⚠ ELLE INTERROGE LE CHOIX RÉELLEMENT EN USAGE, pas une nouvelle épreuve.
    // Le coffre peut avoir rétrogradé en cours de session après un refus
    // d'écriture ; une sonde qui referait sa propre mesure dans son coin
    // pourrait annoncer l'OPFS pendant que les photos partent en IndexedDB.
    const coffre = await capaciteLocale()
    // ⚠ CE N'EST PLUS UNE PANNE, DONC CE N'EST PLUS UNE COULEUR D'ALERTE.
    // « createWritable ABSENT » portait le jaune de « ce qui attend » : c'était
    // juste tant que le produit n'avait qu'un chemin d'écriture. Depuis le
    // repli, un Safari d'avant la 26 n'a rien qui attend — il écrit ailleurs, et
    // il écrit. La ligne redevient ce qu'elle est : un renseignement.
    l.push({
      cle: '③ ÉCRIRE UN FICHIER',
      val: coffre.createWritable
        ? 'createWritable présent'
        : 'createWritable absent (Safari < 26) — sans conséquence',
      ton: coffre.createWritable ? 'oui' : 'attente',
    })
    // ⚠ ET C'EST CETTE LIGNE-LÀ QUI PORTE L'ALERTE, parce qu'elle est la seule
    // qui puisse dire quelque chose de grave : `ecritureEprouvee` est désormais
    // renseignée par une écriture RÉELLE dans le magasin en usage, IndexedDB
    // compris. Fausse, elle ne veut plus dire « on n'a pas vérifié » — elle veut
    // dire AUCUN MAGASIN N'ÉCRIT, et le mot le dit en toutes lettres (UX-DR8).
    l.push({ cle: '   magasin en usage', val: coffre.raison, ton: coffre.ecritureEprouvee ? 'oui' : 'non' })
    // Les deux comptes côte à côte rendent visible le seul vrai piège du repli :
    // des fichiers rangés d'un côté pendant qu'on écrit de l'autre. Tant qu'ils
    // se lisent tous les deux, un nombre non nul dans le magasin inactif est
    // normal — c'est l'avant-mise à jour d'iOS, pas une perte.
    const inv = await inventaireDuCoffre()
    l.push({ cle: '   fichiers rangés', val: `OPFS ${inv.opfs} · IndexedDB ${inv.indexeddb}`, ton: 'attente' })

    l.push({ cle: '④ RÉSEAU', val: navigator.onLine ? 'en ligne' : 'MODE AVION', ton: navigator.onLine ? 'attente' : 'oui' })
    l.push({ cle: 'Build', val: __BUILD__, ton: 'attente' })
    setEtats(l)
  }, [])

  useEffect(() => { void mesurer() }, [mesurer])

  const ouvrir = async () => {
    if (base.current) return base.current
    const t = performance.now()
    const db = ouvrirBase()
    await db.init()
    base.current = db
    dire(`${NOM_BASE} ouverte en ${Math.round(performance.now() - t)} ms`)
    return db
  }

  const ecrire = async () => {
    setOccupe(true)
    try {
      const db = await ouvrir()
      // ⚠ ELLE NETTOIE SA MESURE PRÉCÉDENTE AVANT D'EN FAIRE UNE NOUVELLE.
      // Sans ça, chaque appui laissait un roulage de plus dans la liste du
      // pilote — c'est une part des vingt-cinq roulages de Julian, et c'était
      // pire qu'un affichage sale : ces journées comptaient dans l'horloge
      // d'usure et dans le bilan de saison, où un instrument n'a rien à peser.
      await effacerLesMesures(db)
      const t = performance.now()
      const r = nouvelId(), s = nouvelId()
      // ⚠ CETTE LIGNE A BLOQUÉ UNE SAUVEGARDE RÉELLE. Elle écrivait
      // `pilote_id` — colonne retirée du schéma local au récit 1.2 — et rangeait
      // « SONDE » dans `circuit_id`, une référence au référentiel. Résultat : des
      // roulages sans circuit, que la contrainte serveur refuse, et une file
      // d'envoi bloquée derrière eux. La sonde écrit maintenant comme le produit.
      await db.execute(`INSERT INTO roulage (id, date_jour, circuit_nom) VALUES (?, ?, 'Sonde')`,
        [r, new Date().toISOString().slice(0, 10)])
      await db.execute(`INSERT INTO session (id, roulage_id, ordre) VALUES (?, ?, 1)`, [s, r])
      for (let i = 0; i < 40; i++) {
        await db.execute(`INSERT INTO tour (id, session_id, temps_ms, provenance) VALUES (?, ?, ?, 'saisie_manuelle')`,
          [nouvelId(), s, 96000 + Math.round(Math.sin(i) * 3000)])
      }
      const ms = Math.round(performance.now() - t)
      dire(`40 tours en ${ms} ms (${(ms / 40).toFixed(1)} ms/tour)`)
      await compter()
    } catch (e) { dire('ÉCHEC : ' + (e as Error).message.slice(0, 80)) }
    finally { setOccupe(false); void mesurer() }
  }

  const compter = async () => {
    const db = await ouvrir()
    // Le comptage des CIRCUITS est ici pour une raison précise : le référentiel
    // ne descend que par synchronisation, et AD-12 interdit à la PWA d'y écrire.
    // Un nombre non nul sans compte, c'est l'application qui a écrit là où elle
    // n'a que le droit de lire — et rien d'autre ne le rendrait visible.
    const r = await db.getAll<{ n: number; t: number; c: number }>(
      `SELECT (SELECT count(*) FROM tour) AS n, (SELECT count(*) FROM roulage) AS t,
              (SELECT count(*) FROM circuit) AS c`)
    dire(`persisté : ${r[0].n} tours sur ${r[0].t} roulages, ${r[0].c} circuits en référentiel`)
  }

  return (
    <>
      <Instruments db={db} />

      <div className="libelle">Sonde 0.1 — instrument</div>
      <div className="bloc">
        {etats.map((e) => (
          <div className="rang" key={e.cle} style={{ padding: '4px 0' }}>
            <span className="libelle" style={{ fontSize: 12 }}>{e.cle}</span>
            <span className={'hud-12 ' + (e.ton === 'oui' ? 'mieux' : e.ton === 'non' ? 'plus-lent' : 'faible')}
                  style={{ textAlign: 'right' }}>{e.val}</span>
          </div>
        ))}
      </div>
      <button className="bouton" onClick={ecrire} disabled={occupe}>
        {occupe ? 'écriture…' : 'Écrire 40 tours'}
      </button>
      <button className="bouton secondaire" onClick={() => void compter()}>Compter ce qui a survécu</button>
      {/* ⚠ L'ÉPIQUE N'AVAIT PAS RECENSÉ CELUI-CI, et c'est le plus large de
          tous : il exécute quatre DELETE sur des roulages, sessions et tours
          réels. Qu'il ne détruise « que » ce que la sonde a écrit ne change rien
          au dessin qu'il doit porter — un instrument qui efface efface. */}
      <button className="bouton destructif" onClick={() => void ouvrir()
        .then(effacerLesMesures).then(() => dire('les écritures de sonde sont retirées'))
        .then(compter)}>
        Retirer ce que la sonde a écrit
      </button>
      <button className="bouton secondaire" onClick={() => void navigator.storage?.persist?.().then((o) => { dire('persist() → ' + (o ? 'accordé' : 'refusé')); void mesurer() })}>
        Demander la persistance
      </button>
      {journal.length > 0 && (
        <div className="plat pile">
          {journal.map((m, i) => <div key={i} className="libelle" style={{ fontSize: 12, textTransform: 'none' }}>{m}</div>)}
        </div>
      )}
      <button className="bouton secondaire" onClick={onFermer}>Retour au compte</button>
    </>
  )
}

/**
 * CE QUE LA SONDE A ÉCRIT, ET RIEN D'AUTRE.
 *
 * Le critère est le circuit nommé « Sonde » — la seule marque que l'instrument
 * laisse, et une marque qu'aucune saisie de pilote ne produit : le formulaire
 * refuse un circuit vide, et personne ne tape « Sonde » comme nom de piste.
 *
 * L'ordre descend des feuilles vers la racine, pour la même raison qu'au dépôt :
 * une ligne orpheline est refusée côté serveur et bloque la file derrière elle.
 */
const effacerLesMesures = async (db: PowerSyncDatabase) => {
  await db.writeTransaction(async (tx) => {
    await tx.execute(
      `DELETE FROM tour WHERE session_id IN (
         SELECT s.id FROM session s JOIN roulage r ON r.id = s.roulage_id
          WHERE r.circuit_nom = 'Sonde')`)
    await tx.execute(
      `DELETE FROM session WHERE roulage_id IN (SELECT id FROM roulage WHERE circuit_nom = 'Sonde')`)
    await tx.execute(`DELETE FROM roulage WHERE circuit_nom = 'Sonde'`)
  })
}

/* ─── LES TROIS INSTRUMENTS DE BORD — récit 7.1 ────────────────────────────
   Ils mesurent LE PROJET, pas le pilote. Ils sont ici parce qu'ils doivent être
   LISIBLES : une mesure qu'on ne regarde jamais ne corrige aucune saison.

   Le seuil de 48 h se franchit dès qu'UN SEUL roulage le dépasse. Pas une
   moyenne : un souvenir perdu ne revient pas, et une moyenne le noierait. */
function Instruments({ db }: { db: PowerSyncDatabase }) {
  const [t, setT] = useState<Tableau | null>(null)
  useEffect(() => { void tableauDeBord(db).then(setT).catch(() => setT(null)) }, [db])
  if (!t) return null

  const h = (v: number | null) => (v == null ? '—' : v < 1 ? "< 1 h" : Math.round(v) + ' h')

  return (
    <>
      <div className="libelle">Instruments de bord — le projet, pas le pilote</div>
      <div className="bloc pile">
        <div className="rang">
          <span className="libelle">① Délai roulage → saisie</span>
          <span className={'chiffre hud-24 ' + (t.delai.seuilFranchi ? 'plus-lent' : 'mieux')}>
            {h(t.delai.medianeH)}
          </span>
        </div>
        <div className="rang">
          <span className="libelle" style={{ fontSize: 11 }}>
            pire cas {h(t.delai.maxH)} · seuil {SEUIL_H} h · {t.delai.roulages} roulage{t.delai.roulages > 1 ? 's' : ''}
          </span>
          <span className={'hud-12 ' + (t.delai.seuilFranchi ? 'plus-lent' : 'faible')}>
            {t.delai.seuilFranchi ? 'SEUIL FRANCHI' : 'sous le seuil'}
          </span>
        </div>

        <div className="rang">
          <span className="libelle">② Récaps produits → postés</span>
          <span className="chiffre hud-24">{t.recapsGeneres} → {t.recapsPostes}</span>
        </div>

        <div className="rang">
          <span className="libelle">③ Ouvertures sans saisie</span>
          <span className="chiffre hud-24 miami">{t.ouverturesSansSaisie} / {t.ouvertures}</span>
        </div>
        {/* Dit ici plutôt que laissé à l'interprétation : ce chiffre doit MONTER. */}
        <p className="libelle" style={{ fontSize: 11, textTransform: 'none' }}>
          ③ n'est pas un échec à réduire : c'est exactement ce que l'accueil temporel cherche à
          provoquer. Une ouverture qui ne saisit rien est une ouverture quand même.
        </p>
      </div>
    </>
  )
}
