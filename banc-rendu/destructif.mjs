// CE QUI DÉTRUIT — la lecture, faite UNE FOIS pour les deux bancs.
//
// ⚠ LA GARDE DU DESTRUCTIF ÉTAIT LEXICALE, ET ELLE NE L'EST PLUS SEULE. Les
// deux bancs décidaient qu'un bouton détruit si son LIBELLÉ contient
// retirer|supprimer|effacer|oublier — jamais ce que son `onClick` APPELLE. La
// revue l'a prouvé sur un cas d'école : un bouton « Vider la liste » qui appelle
// un vrai DELETE passe la garde en gris, et l'épique 22 arrive derrière avec des
// languettes de suppression. Un mot est une intention ; un appel est un fait.
//
// Un bouton est donc destructif si SON LIBELLÉ LE DIT **OU** SI SON GESTIONNAIRE
// APPELLE une des fonctions destructives du dépôt. Les deux témoins, jamais un
// seul : le libellé attrape ce qui détruit hors de ce dépôt (un `location.reload`
// de plus, un jour), l'appel attrape ce qui détruit sans le dire.
//
// ⚠ ET CE FICHIER EST PARTAGÉ EXPRÈS. `unite/essais.ts` lit les sources dans le
// navigateur (Vite, `import.meta.glob`), `fumee-destructif.mjs` les lit dans
// Node (`fs`) — mais la RÈGLE est la même, et deux copies d'une même règle
// divergent toujours. Elles ne reçoivent que du texte déjà lu : aucune I/O ici,
// c'est ce qui rend le partage possible.

/** Les mots qui annoncent une perte. `suppression` et `effacement` sont là pour
 *  les états d'attente — « suppression… » est le libellé d'un bouton pendant
 *  qu'il détruit, et un bouton qui détruit ne change pas de nature parce qu'il
 *  est occupé. */
export const DIT_LA_DESTRUCTION =
  /\b(retirer|supprimer|suppression|effacer|effacement|oublier|vider)\b/i

/* ─── ① LES FONCTIONS QUI DÉTRUISENT, RECENSÉES ET NON RÉCITÉES ─────────────
   Une liste écrite à la main serait fausse au premier ajout. On la DÉDUIT du
   texte : une fonction détruit si son corps porte une marque de destruction
   primitive, ou si elle appelle une fonction qui en porte une. */

/**
 * Les marques primitives — ce qui fait disparaître une donnée DU PILOTE, et
 * qu'aucun autre appel ne peut annuler : un DELETE en base locale, le vidage de
 * la base entière, l'effacement au serveur.
 *
 * ⚠ TROIS MARQUES, PAS SIX, ET CHACUNE A ÉTÉ PESÉE. `removeEntry` et
 * `localStorage.removeItem` ont été retirées : le coffre efface son fichier
 * d'épreuve à chaque démarrage (`eprouverLeCoffre`), et les réglages se
 * réécrivent tout le temps. Les garder faisait hériter la moitié de la couche de
 * stockage — `lireLocale`, `photoMachine`, `capaciteLocale` — puis, de proche en
 * proche, SOIXANTE fonctions « destructives » dont aucune ne détruit une donnée
 * du pilote. Un témoin qui accuse tout le monde ne témoigne plus.
 *
 * Ce qu'elles laissent passer est couvert par l'autre témoin : les boutons qui
 * emportent le téléphone ou le compte disent tous « effacer ».
 */
const MARQUE_PRIMITIVE =
  /\bDELETE\s+FROM\b|\.disconnectAndClear\(|functions\/v1\/effacer/i

/**
 * ⚠ UN ENVELOPPEUR QUI ÉCRIT AUSSI N'EST PAS UN GESTE DE DESTRUCTION, et cette
 * clause a un cas réel derrière elle : la sonde efface sa mesure précédente
 * AVANT d'en écrire une nouvelle (`ecrire`, Sonde.tsx), parce que sans ça chaque
 * appui laissait un roulage de plus dans la liste du pilote. Son bouton dit
 * « Écrire 40 tours », et le peindre en rouge dirait de lui « ceci part et ne
 * revient pas » — c'est-à-dire l'inverse de ce qu'il fait.
 *
 * La clause ne desserre QUE l'héritage : une fonction qui porte elle-même une
 * marque primitive reste destructive quoi qu'elle écrive par ailleurs
 * (`supprimerRoulage` efface une journée et n'en devient pas anodine).
 */
const ECRIT_AUSSI = /\bINSERT\s+INTO\b|\bUPDATE\s+[a-z_]+\s+SET\b|\b(creer|ajouter|poser|verser|consigner|completer)[A-Z]/

/** Les commentaires ne sont pas du code : un commentaire qui CITE un DELETE
 *  pour expliquer un défaut ferait un faux destructif. */
const sansCommentaires = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')

/**
 * ⚠ LE PREMIER NOM SEULEMENT, dans `const [retirer, occupe] = useGeste(…)` — et
 * c'est le piège qui a fait dérailler cette lecture deux fois. `useGeste` rend
 * un couple : LE GESTE, puis l'état « occupé » qui ne fait que le dire. Retenir
 * les deux nommait le même corps destructeur « occupe », « efface », « fait » —
 * or ces mots-là sont dans TOUS les écrans, sur des gestes qui ne détruisent
 * rien. De proche en proche, la moitié du dépôt devenait destructive : soixante
 * fonctions, dont `lireLocale` et `photoMachine`.
 */
const DECLARATIONS = [
  // const [retirer, occupe] = useGeste(…) — la forme de tous les gestes du dépôt
  /^(\s*)(?:export\s+)?(?:const|let|var)\s+\[\s*([A-Za-z_$][\w$]*)/,
  /^(\s*)(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/,
  /^(\s*)(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/,
]

/** Une ligne qui COMMENCE par une fermante, à l'indentation de la déclaration
 *  ou en deçà : `}`, `})`, `}, [db])`, `]`. */
const FERME = /^\s*[})\]]/
/**
 * ⚠ SAUF QUAND ELLE REPART. `): Promise<…> => {` commence par une fermante et
 * n'annonce aucune fin — s'arrêter là couperait `effacerLeTelephone` de son
 * corps. `} catch {` non plus. Le départage tient à la FIN de la ligne : elle
 * rouvre (`{`, `=>`) ou elle conclut.
 *
 * L'inverse a coûté cher dans la première version : `}, [db])` — la fin de tout
 * `useEffect` du dépôt — était traitée comme une poursuite, si bien qu'aucune
 * déclaration ne se refermait jamais avant la fin du fichier. Les corps se
 * recouvraient, et la lecture rendait cinquante fonctions destructives.
 */
const REPART = /[{]\s*$|=>\s*$/
/** Ce qui poursuit sans rien fermer : un chaînage, une suite de paramètres. */
const POURSUIT = /^\s*[.,:?]|^\s*(else|catch|finally)\b/

/**
 * Découper un module en blocs nommés, IMBRICATION COMPRISE.
 *
 * ⚠ L'IMBRICATION EST TOUT L'ENJEU. Les gestes du produit sont des enveloppeurs
 * DÉCLARÉS DANS UN COMPOSANT — `const [retirer] = useGeste(async () => { await
 * oublierEquipement(…) })` — et le bouton n'appelle qu'eux. Une lecture qui ne
 * verrait que le premier niveau ne relierait jamais « retirer » à un DELETE.
 *
 * ⚠ ET LE BLOC S'ARRÊTE. Une première version faisait courir chaque déclaration
 * jusqu'à la suivante de même indentation, blocs imbriqués empilés : les corps
 * se recouvraient, les noms courts (`d`, `f`, `m`) ramassaient le dépôt entier,
 * et la lecture rendait SIX CENTS fonctions destructives sur un dépôt qui en
 * compte une douzaine. Une garde qui accuse tout n'accuse plus rien.
 *
 * Le découpage suit l'INDENTATION et non les accolades, parce que la moitié des
 * fonctions du dépôt sont des flèches sans corps accoladé — `export const
 * oublierHorloge = (db, id) =>\n  db.execute(\`DELETE FROM horloge …\`)`. Une
 * lecture par accolades les refermerait avant leur seule ligne utile.
 */
const blocsDe = (source) => {
  const lignes = sansCommentaires(source).split('\n')
  const blocs = []
  for (let i = 0; i < lignes.length; i++) {
    let noms = null
    for (const r of DECLARATIONS) {
      const m = lignes[i].match(r)
      if (!m) continue
      noms = m[2].split(',').map((n) => n.trim()).filter((n) => /^[A-Za-z_$][\w$]*$/.test(n))
      break
    }
    if (!noms?.length) continue
    const indentation = lignes[i].length - lignes[i].trimStart().length

    let fin = i + 1
    for (; fin < lignes.length; fin++) {
      const l = lignes[fin]
      if (!l.trim()) continue
      const ind = l.length - l.trimStart().length
      if (ind > indentation) continue
      if (FERME.test(l)) { if (REPART.test(l)) continue; fin++; break }
      if (POURSUIT.test(l)) continue
      break
    }
    const texte = lignes.slice(i, fin).join('\n')
    // Seule une FONCTION peut détruire. Une table de mots ou un nombre qui
    // contiendrait « DELETE FROM » n'exécute rien.
    if (/=>|\bfunction\b/.test(texte)) for (const nom of noms) blocs.push([nom, texte])
  }
  return blocs
}

/** Les identifiants cités par un morceau de code. Un `.then(effacerLesMesures)`
 *  compte autant qu'un `effacerLesMesures(db)` : la fonction est passée, elle
 *  sera appelée. */
const citesDans = (texte) => new Set(texte.match(/[A-Za-z_$][\w$]*/g) ?? [])

/**
 * LES FONCTIONS DESTRUCTIVES DU DÉPÔT, déduites des sources fournies.
 *
 * `modules` est un `{ chemin: texte }` — d'où qu'il vienne. Rend un `Set` de
 * NOMS : les noms se croisent d'un fichier à l'autre (`retirer` est à la fois
 * l'export de la checklist et l'enveloppeur de quatre écrans), et c'est sans
 * conséquence ici, où tous les `retirer` du dépôt détruisent vraiment.
 */
export const gestesDestructifs = (modules) => {
  const blocs = []
  for (const source of Object.values(modules)) blocs.push(...blocsDe(source))

  // ⚠ LES MAJUSCULES SONT ÉCARTÉES, et ce n'est pas de la cosmétique : un bloc
  // imbriqué est CONTENU dans celui de son composant, donc `Effacer` hérite de
  // `effacer` et `Sonde` de tout ce qu'elle appelle. Ce sont des composants et
  // des constantes — aucun `onClick` n'en appelle un, et les garder ferait une
  // liste de noms qui ne désignent aucun geste.
  const estUnGeste = (nom) => /^[a-z_$]/.test(nom)

  const noms = new Set()
  for (const [nom, texte] of blocs)
    if (estUnGeste(nom) && MARQUE_PRIMITIVE.test(texte)) noms.add(nom)

  // Point fixe : un enveloppeur d'enveloppeur détruit aussi. Le dépôt en compte
  // deux niveaux aujourd'hui (bouton → `retirer` → `oublierDocument`) ; la
  // boucle n'en suppose aucun nombre.
  for (let tour = 0; tour < 8; tour++) {
    let bouge = false
    for (const [nom, texte] of blocs) {
      if (noms.has(nom) || !estUnGeste(nom) || ECRIT_AUSSI.test(texte)) continue
      const cites = citesDans(texte)
      for (const d of noms) {
        if (d !== nom && cites.has(d)) { noms.add(nom); bouge = true; break }
      }
    }
    if (!bouge) break
  }
  return noms
}

/* ─── ② LES BOUTONS, LUS À LA LETTRE ────────────────────────────────────────
 *
 * ⚠ LA FIN DE LA BALISE N'EST PAS LE PREMIER `>`. Les gestionnaires de ce dépôt
 * sont des flèches — `onClick={() => void retirer()}` — et une lecture naïve
 * coupait la balise au milieu, puis prenait la queue du gestionnaire pour le
 * libellé. Le rendu était un essai qui trouvait « void effacer() » là où il
 * fallait lire « Effacer définitivement ». On avance donc en comptant les
 * accolades, hors chaînes.
 *
 * ⚠ ET UN LIBELLÉ N'EST PAS QUE DU TEXTE ENTRE BALISES. La moitié des boutons
 * du produit disent `{occupe ? 'suppression…' : 'Retirer définitivement'}` : les
 * deux états sont des libellés, et c'est le second qui porte le mot. Toutes les
 * chaînes littérales des enfants comptent donc, en plus du texte nu.
 *
 * ⚠ CE QUI EST DÉLIBÉRÉMENT IGNORÉ : les expressions non littérales. Un bouton
 * qui affiche `{ligne.libelle}` porte du texte SAISI PAR LE PILOTE — une ligne
 * de checklist nommée « retirer les autocollants » ferait échouer une règle qui
 * ne parle pas d'elle. La règle porte sur les libellés du produit.
 */

const finDeBalise = (source, depart) => {
  let accolades = 0
  for (let i = depart; i < source.length; i++) {
    const c = source[i]
    if (c === '\'' || c === '"' || c === '`') {
      // Une chaîne peut contenir `>` et `{` : on la saute d'un bloc.
      for (i++; i < source.length && source[i] !== c; i++) if (source[i] === '\\') i++
      continue
    }
    if (c === '{') accolades++
    else if (c === '}') accolades--
    else if (c === '>' && accolades === 0) return i
  }
  return -1
}

/** Le contenu de `onClick={…}`, accolades équilibrées. Vide si le bouton n'en a
 *  pas — un bouton sans gestionnaire ne détruit rien. */
const gestionnaireDe = (balise) => {
  const d = balise.indexOf('onClick=')
  if (d < 0) return ''
  let i = balise.indexOf('{', d)
  if (i < 0) return ''
  let accolades = 0
  for (let j = i; j < balise.length; j++) {
    const c = balise[j]
    if (c === '\'' || c === '"' || c === '`') {
      for (j++; j < balise.length && balise[j] !== c; j++) if (balise[j] === '\\') j++
      continue
    }
    if (c === '{') accolades++
    else if (c === '}' && --accolades === 0) return balise.slice(i + 1, j)
  }
  return balise.slice(i + 1)
}

/** Un libellé se compare NORMALISÉ : le texte de la source porte les retours à
 *  la ligne du JSX, celui du navigateur porte ceux du rendu. */
export const normaliser = (l) => l.replace(/\s+/g, ' ').trim().toLowerCase()

export const boutonsDe = (brut) => {
  const source = brut.replace(/\/\*[\s\S]*?\*\//g, ' ')
  const trouves = []
  for (let i = source.indexOf('<button'); i >= 0; i = source.indexOf('<button', i + 1)) {
    const fin = finDeBalise(source, i + 7)
    if (fin < 0) continue
    const balise = source.slice(i, fin)
    const ferme = source.indexOf('</button>', fin)
    const enfants = ferme < 0 ? '' : source.slice(fin + 1, ferme)
    // Le texte nu — ce qui n'est ni une accolade ni une balise imbriquée.
    const nu = enfants.replace(/\{[\s\S]*?\}/g, ' ').replace(/<[^>]*>/g, ' ')
    // Les chaînes littérales des expressions : les deux faces d'un ternaire.
    const litterales = [...enfants.matchAll(/(['"])((?:[^\\\n]|\\.)*?)\1/g)].map((m) => m[2])
    trouves.push({
      libelles: [nu, ...litterales].map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean),
      gestionnaire: gestionnaireDe(balise),
      // Le dessin exact, et pas seulement « destructif oui/non » : la FORME
      // distingue le lien qui ouvre une confirmation du bouton qui l'exécute,
      // et c'est cette distinction que le banc de fumée doit rencontrer.
      className: balise.match(/className=(["'])([^"']*)\1/)?.[2] ?? '',
      classe: /className=(["'])[^"']*\bdestructif\b/.test(balise),
    })
  }
  return trouves
}

/* ─── ③ LE VERDICT — deux témoins, et il suffit d'un ─────────────────────── */

export const ditLaDestruction = (bouton) =>
  bouton.libelles.some((l) => DIT_LA_DESTRUCTION.test(l))

export const appelleUneDestruction = (bouton, noms) => {
  const cites = citesDans(bouton.gestionnaire)
  for (const n of noms) if (cites.has(n)) return true
  return false
}

export const detruit = (bouton, noms) =>
  ditLaDestruction(bouton) || appelleUneDestruction(bouton, noms)

/**
 * LES LIBELLÉS QUE LE SECOND TÉMOIN CONDAMNE, pour le banc de fumée.
 *
 * Dans un navigateur, `onClick` est un gestionnaire React : il n'est ni lisible
 * ni comparable. Le banc de fumée reçoit donc d'ici la LISTE DES LIBELLÉS dont
 * la source dit que le geste détruit — et il la confronte à ce que la page
 * affiche vraiment. C'est la même règle, lue au même endroit, appliquée là où
 * la couleur se mesure.
 */
export const libellesQuiDetruisentSansLeDire = (modules) => {
  const noms = gestesDestructifs(modules)
  const libelles = new Set()
  for (const source of Object.values(modules))
    for (const b of boutonsDe(source))
      if (appelleUneDestruction(b, noms))
        for (const l of b.libelles) libelles.add(normaliser(l))
  return libelles
}

