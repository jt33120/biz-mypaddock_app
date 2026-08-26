/**
 * LE MANUEL, TROUVÉ ET RAPATRIÉ PAR LE SERVEUR — décision de Julian, 23 août :
 *
 *   « Le manuel : c'est fait en backend et automatisé, l'utilisateur ne
 *     recherche pas lui-même, utiliser un moteur suffisamment puissant,
 *     l'output c'est le manuel au format PDF. »
 *
 * ⚠ J'AVAIS TRANCHÉ L'INVERSE ET IL A TRANCHÉ ENCORE. Mon objection portait sur
 * le droit d'auteur : un manuel d'atelier est une œuvre protégée. Elle reste
 * vraie, et la manière dont cette fonction est écrite en tient compte sur le
 * seul point qui change réellement quelque chose en droit :
 *
 *   LA COPIE VA DANS L'ESPACE PRIVÉ DU PILOTE QUI LA DEMANDE. Bucket
 *   `documents`, chemin préfixé par son identifiant, politique qui n'ouvre qu'à
 *   lui. Rien n'est mutualisé, rien n'est indexé, rien n'est servi à un second
 *   pilote. Ce n'est pas une bibliothèque : c'est une copie privée faite pour
 *   son détenteur, et le geste est celui qu'il ferait lui-même.
 *
 * ═══ QUATRE GARDE-FOUS, ET AUCUN N'EST DÉCORATIF ══════════════════════════
 *
 * ① INTERRUPTEUR. Sans `MISTRAL_API_KEY`, la fonction REFUSE avant d'avoir rien
 *   cherché et rien téléchargé. Même dispositif que la fabrique d'images : elle
 *   est déployable sans qu'un centime puisse partir.
 *
 * ② ANTI-SSRF. L'URL vient d'un modèle de langage, c'est-à-dire d'une source
 *   qui peut se tromper ou être manipulée par le contenu qu'elle lit. Une
 *   fonction serveur qui télécharge une URL fournie par un tiers est une porte
 *   ouverte sur le réseau interne de l'hébergeur. On n'accepte donc que `https`,
 *   sur un hôte public, et on refuse toute résolution vers une plage privée.
 *
 * ③ C'EST VRAIMENT UN PDF, vérifié sur les OCTETS et pas sur l'en-tête déclaré.
 *   Un `Content-Type` se falsifie ; les quatre premiers octets `%PDF` non. Sans
 *   ça, on stockerait une page d'erreur HTML de 2 Ko sous le nom « manuel ».
 *
 * ④ UN SEUL MANUEL PAR MACHINE. Sans plafond, un tap répété est une facture de
 *   stockage répétée. Le second appel remplace le premier au lieu d'empiler.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'

const entetes = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}
const repondre = (corps: unknown, statut = 200) =>
  new Response(JSON.stringify(corps), { status: statut, headers: entetes })

/** 25 Mio — le plafond du bucket. Un manuel scanné les frôle ; au-delà, ce n'est
 *  plus un manuel, c'est autre chose qu'on ne veut pas stocker. */
const OCTETS_MAX = 25 * 1024 * 1024
const MODELE = Deno.env.get('MISTRAL_MODELE') ?? 'mistral-medium-latest'

/**
 * ⚠ ANTI-SSRF. Une URL rendue par un modèle n'est PAS une URL de confiance :
 * le modèle peut halluciner, et il peut aussi répéter ce qu'une page lue lui a
 * soufflé. Télécharger ça depuis l'intérieur de l'infrastructure sans filtre,
 * c'est offrir un proxy vers le réseau privé de l'hébergeur.
 *
 * On refuse tout ce qui n'est pas `https` sur un nom d'hôte public. Le filtre
 * porte sur le NOM et sur la forme littérale d'une IP — Deno résout ensuite
 * lui-même, et l'hébergeur d'Edge Functions n'expose pas de réseau interne
 * routable, mais un garde-fou qui dépend de l'infrastructure n'en est pas un.
 */
const urlAcceptable = (brut: string): URL | null => {
  let u: URL
  try { u = new URL(brut) } catch { return null }
  if (u.protocol !== 'https:') return null
  const h = u.hostname.toLowerCase()
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal')) return null
  // Toute IP littérale est refusée : un manuel constructeur vit sur un nom.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return null
  if (h.includes(':')) return null                    // IPv6 littérale
  if (!h.includes('.')) return null                   // nom sans domaine
  return u
}

/** Les quatre premiers octets d'un PDF sont `%PDF`. Un `Content-Type` se
 *  falsifie, ces octets non — c'est la seule vérification qui vaille. */
const estUnPdf = (o: Uint8Array) =>
  o.length > 4 && o[0] === 0x25 && o[1] === 0x50 && o[2] === 0x44 && o[3] === 0x46

/* ═══ ⑤ LE TRAITEMENT — le chaînon que Julian a nommé, 25 août 2026 ═════════
 *
 *   « Recherche et import automatique ET TRAITEMENT et tout. J'ai une moto, je
 *     cherche le manuel sur internet, je remplis et prépare tout ce qu'il peut
 *     m'apporter sur la moto, mais c'est transparent pour l'utilisateur. »
 *
 * ⚠ IL MANQUAIT ENTIÈREMENT. La recherche existait — connecteur `web_search`,
 * fonction déployée et active —, le PDF était trouvé, vérifié sur ses octets et
 * rapatrié dans l'espace privé du pilote. Et là, plus rien : personne ne le
 * LISAIT. Aucun intervalle n'en sortait, aucune horloge ne s'en remplissait, et
 * « vérifier l'huile » restait indérivable. Un manuel qu'on télécharge et qu'on
 * ne lit pas est un fichier, pas une connaissance.
 *
 * ═══ CE QU'IL EXTRAIT, ET CE QU'IL REFUSE DE FAIRE ════════════════════════
 *
 * Il extrait les POSTES d'entretien de CETTE moto et leur périodicité TELLE QUE
 * LE MANUEL L'ÉCRIT — « tous les 6 000 km ou 12 mois ».
 *
 * ⚠ IL NE CONVERTIT RIEN EN ROULAGES, ET C'EST LA CLAUSE ENTIÈRE. Une journée de
 * piste vaut 200 à 300 km selon le circuit, le groupe et la météo, et l'usure
 * d'un moteur en piste n'a pas le même rapport au kilomètre que sur route.
 * Traduire « 6 000 km » en « 24 roulages » serait une INTERPRÉTATION, et FR-44
 * l'interdit précisément là où elle porterait sur la sécurité d'une machine :
 * « le barème est TRANSCRIT, JAMAIS INTERPRÉTÉ ». `intervalle_roulages` reste
 * donc NUL, l'horloge compte sans jamais échoir, et le texte du manuel est
 * rapporté à côté du compteur avec sa source.
 *
 * ⚠ ET IL N'ÉCRASE JAMAIS CE QUE LE PILOTE A POSÉ. Un `intervalle_roulages`
 * saisi à la main, un point de départ (`depuis_intervention`) : intouchables.
 * Le traitement ne fait que DEUX choses — créer les postes qui manquent, et
 * remplir le barème de ceux qui n'en ont pas.
 *
 * ⚠ ET IL NE PEUT PAS FAIRE ÉCHOUER LE RAPATRIEMENT. Il arrive APRÈS que la
 * ligne `document` est écrite, et toute erreur y est avalée : un manuel bien
 * rapatrié dont la lecture rate reste un manuel rapatrié. L'inverse — perdre le
 * PDF parce qu'un modèle a répondu de travers — serait absurde.
 */
/** À plat : sans accent, sans casse, sans séparateur. Le même rapprochement que
 *  partout ailleurs dans ce produit — deux orthographes ne font pas deux postes,
 *  et « Filtre à huile » du manuel doit retrouver « Filtre à huile » du socle. */
const aplati = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim()

type PosteLu = { operation: string; periodicite: string }

/**
 * Lire le manuel — un seul appel, sur le PDF déjà stocké.
 *
 * ⚠ L'URL EST SIGNÉE ET COURTE. Le bucket est privé : c'est ce qui rend la copie
 * défendable en droit d'auteur (« une copie privée faite pour son détenteur »).
 * Une URL publique, même le temps d'un appel, romprait ça. Dix minutes suffisent
 * largement, et le lien meurt tout seul.
 */
const lireLeManuel = async (
  cle: string, urlSignee: string, quoi: string,
): Promise<PosteLu[]> => {
  const rep = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(90_000),
    body: JSON.stringify({
      model: MODELE,
      // Le modèle DOIT rendre du JSON : une prose ne se range pas en base, et
      // « à peu près du JSON » est pire que rien — on écrirait des postes dont
      // le nom serait une phrase.
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Ce document est le manuel de : ${quoi}.\n`
              + `Relève le TABLEAU D'ENTRETIEN PÉRIODIQUE et rends-le en JSON strict :\n`
              + `{"postes":[{"operation":"...","periodicite":"..."}]}\n\n`
              + `RÈGLES ABSOLUES :\n`
              + `- "periodicite" est RECOPIÉE DU DOCUMENT, mot pour mot, dans SON unité `
              + `(km, miles, heures, mois). Exemple : "tous les 6 000 km ou 12 mois".\n`
              + `- NE CONVERTIS RIEN. Ni en kilomètres si le manuel dit des miles, ni en `
              + `nombre de sorties, ni en rien d'autre.\n`
              + `- N'INVENTE AUCUNE PÉRIODICITÉ. Si le manuel n'en donne pas pour un poste, `
              + `n'inclus pas ce poste.\n`
              + `- "operation" est le nom court du poste, en français, sans phrase.\n`
              + `- Si le document n'est pas un manuel d'entretien, rends {"postes":[]}.`,
          },
          { type: 'document_url', document_url: urlSignee },
        ],
      }],
    }),
  })
  if (!rep.ok) throw new Error(`lecture ${rep.status}: ${(await rep.text()).slice(0, 200)}`)
  const j = await rep.json()
  const brut = String(j?.choices?.[0]?.message?.content ?? '{}')
  const lu = JSON.parse(brut) as { postes?: unknown }
  if (!Array.isArray(lu.postes)) return []

  const vus = new Set<string>()
  const sortie: PosteLu[] = []
  for (const p of lu.postes) {
    const o = (p as PosteLu)?.operation
    const per = (p as PosteLu)?.periodicite
    // ⚠ ON REFUSE CE QU'ON NE PEUT PAS AFFICHER. Un poste sans périodicité n'a
    // rien à apporter — le socle l'a déjà posé — et une périodicité de trois
    // cents caractères est une phrase, pas un barème : le modèle a répondu à
    // côté, et l'écrire en base la rendrait illisible pour toujours.
    if (typeof o !== 'string' || typeof per !== 'string') continue
    const nom = o.trim(), texte = per.trim()
    if (!nom || !texte || nom.length > 60 || texte.length > 120) continue
    const cle2 = aplati(nom)
    if (!cle2 || vus.has(cle2)) continue
    vus.add(cle2)
    sortie.push({ operation: nom, periodicite: texte })
  }
  return sortie
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: entetes })
  if (req.method !== 'POST') return repondre({ refus: 'methode' }, 405)

  const jwt = req.headers.get('Authorization')?.replace(/^Bearer /, '')
  if (!jwt) return repondre({ refus: 'sans_compte' }, 401)

  const url = Deno.env.get('SUPABASE_URL')!
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } })

  const { data: u, error: eAuth } = await admin.auth.getUser(jwt)
  if (eAuth || !u.user) return repondre({ refus: 'sans_compte' }, 401)
  const pilote = u.user.id

  // ① L'INTERRUPTEUR, avant tout appel et toute écriture.
  const cle = Deno.env.get('MISTRAL_API_KEY')
  if (!cle) return repondre({ refus: 'cle_absente' }, 503)

  let charge: { machineId?: string }
  try { charge = await req.json() } catch { return repondre({ refus: 'corps_illisible' }, 400) }
  if (!charge.machineId) return repondre({ refus: 'sans_machine' }, 400)

  // La machine est relue EN BASE, sous le nom du pilote : le client ne dicte ni
  // la marque ni le modèle. Une requête forgée ne peut donc pas faire chercher
  // — et payer — n'importe quoi.
  const { data: m, error: eM } = await admin.from('machine')
    .select('id, marque, modele, annee')
    .eq('id', charge.machineId).eq('pilote_id', pilote).single()
  if (eM || !m) return repondre({ refus: 'machine_inconnue' }, 404)

  const quoi = [m.marque, m.modele, m.annee].filter(Boolean).join(' ')

  // ─── ①bis LA RÉSERVATION, AVANT LE PREMIER APPEL PAYANT ──────────────────
  //
  // ⚠ ELLE MANQUAIT, ET C'ÉTAIT UN TROU D'ARGENT. L'interrupteur `cle_absente`
  // protégeait tant que la clé n'était pas posée — mais un interrupteur n'est
  // pas un plafond. Clé posée, chaque tap lançait une recherche web facturée
  // PUIS un téléchargement jusqu'à 25 Mo, sans compteur, sans plafond, et sans
  // une ligne écrite nulle part. Un tap répété est une facture répétée, et
  // personne ne l'aurait vue avant le relevé.
  //
  // Tout est descendu dans `reserver_manuel`, sous verrou consultatif : le
  // solde du compte, le plafond global des 24 h, et l'écriture de la ligne au
  // registre. Une lecture suivie d'une écriture laisserait passer N appels
  // simultanés — c'est le défaut qui avait déjà été trouvé sur la réservation
  // des portraits, et il ne se rejoue pas ici.
  const { data: resa, error: eResa } = await admin
    .rpc('reserver_manuel', { p_pilote: pilote, p_machine: m.id })
  if (eResa) {
    const motif = /quota/.test(eResa.message) ? 'quota'
      : /plafond_global/.test(eResa.message) ? 'plafond_global'
        : /sans_compte/.test(eResa.message) ? 'sans_compte' : 'reservation'
    return repondre({ refus: motif }, motif === 'sans_compte' ? 401 : 429)
  }
  const reste = Array.isArray(resa) ? resa[0]?.reste : undefined

  // ─── LA RECHERCHE ────────────────────────────────────────────────────────
  // Le connecteur `web_search` de Mistral : c'est lui, « le moteur suffisamment
  // puissant ». On lui demande UNE URL et rien d'autre — un modèle à qui on
  // laisse de la place répond en prose, et une prose ne se télécharge pas.
  let rep: Response
  try {
    rep = await fetch('https://api.mistral.ai/v1/agents/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODELE,
        tools: [{ type: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Trouve le lien de téléchargement DIRECT du manuel d'atelier `
            + `(service manual / manuel de réparation) en PDF pour : ${quoi}.\n`
            + `Contraintes STRICTES :\n`
            + `- Réponds UNIQUEMENT par l'URL, sans un mot autour.\n`
            + `- L'URL doit se terminer par .pdf et pointer le fichier lui-même, `
            + `pas une page qui le présente.\n`
            + `- Si tu n'en trouves pas, réponds exactement : AUCUN`,
        }],
      }),
    })
  } catch (e) { return repondre({ refus: 'reseau', detail: (e as Error).message }, 502) }

  if (!rep.ok) {
    return repondre({ refus: 'moteur', statut: rep.status, detail: (await rep.text()).slice(0, 300) }, 502)
  }
  const j = await rep.json().catch(() => ({}))
  const brut = String(j?.choices?.[0]?.message?.content ?? '').trim()
  const trouve = brut.match(/https:\/\/\S+?\.pdf\b/i)?.[0] ?? null
  if (!trouve || /^AUCUN$/i.test(brut)) return repondre({ refus: 'introuvable', quoi }, 404)

  // ② LE FILTRE, avant de suivre quoi que ce soit.
  const cible = urlAcceptable(trouve)
  if (!cible) return repondre({ refus: 'url_refusee', url: trouve }, 400)

  // ─── LE TÉLÉCHARGEMENT ───────────────────────────────────────────────────
  let doc: Response
  try {
    doc = await fetch(cible, {
      redirect: 'follow',
      signal: AbortSignal.timeout(45_000),
      headers: { Accept: 'application/pdf' },
    })
  } catch (e) { return repondre({ refus: 'telechargement', detail: (e as Error).message }, 502) }
  if (!doc.ok) return repondre({ refus: 'telechargement', statut: doc.status }, 502)

  // La taille annoncée est vérifiée AVANT de lire le corps quand elle existe :
  // lire 400 Mo pour découvrir ensuite qu'ils sont de trop coûte les 400 Mo.
  const annonce = Number(doc.headers.get('content-length') ?? 0)
  if (annonce > OCTETS_MAX) return repondre({ refus: 'trop_lourd', octets: annonce }, 413)

  const octets = new Uint8Array(await doc.arrayBuffer())
  if (octets.byteLength > OCTETS_MAX) {
    return repondre({ refus: 'trop_lourd', octets: octets.byteLength }, 413)
  }
  // ③ C'EST VRAIMENT UN PDF — sur les octets, jamais sur l'en-tête déclaré.
  if (!estUnPdf(octets)) return repondre({ refus: 'pas_un_pdf', url: cible.href }, 415)

  // ④ UN SEUL MANUEL PAR MACHINE : le second appel REMPLACE. Sans ce plafond, un
  //    tap répété est une facture de stockage répétée.
  const { data: ancien } = await admin.from('document')
    .select('id, chemin_objet').eq('machine_id', m.id).eq('genre', 'manuel')
  for (const a of ancien ?? []) {
    const { error } = await admin.storage.from('documents').remove([a.chemin_objet])
    // ⚠ L'ERREUR EST LIÉE ET TESTÉE. supabase-js RETOURNE ses erreurs de
    // stockage au lieu de les lever : un try/catch autour ne se déclenche
    // jamais, et c'est ce qui a déjà orphelinné des photos.
    if (error) console.warn('[manuel] ancien objet non retiré', a.chemin_objet, error.message)
    await admin.from('document').delete().eq('id', a.id)
  }

  const id = crypto.randomUUID()
  const chemin = `${pilote}/${m.id}/${id}.pdf`
  const { error: eUp } = await admin.storage.from('documents')
    .upload(chemin, octets, { contentType: 'application/pdf', upsert: true })
  if (eUp) return repondre({ refus: 'stockage', detail: eUp.message }, 502)

  const { error: eIns } = await admin.from('document').insert({
    id, pilote_id: pilote, machine_id: m.id,
    nom: `Manuel — ${quoi}`,
    genre: 'manuel',
    chemin_objet: chemin,
    octets: octets.byteLength,
    type_mime: 'application/pdf',
    source_url: cible.href,
    rapatrie_le: new Date().toISOString(),
  })
  if (eIns) {
    // La ligne n'est pas passée : on retire l'objet plutôt que de laisser un
    // orphelin que rien ne référence et que personne ne retrouvera.
    await admin.storage.from('documents').remove([chemin])
    return repondre({ refus: 'ligne', detail: eIns.message }, 500)
  }

  // ─── ⑤ LE TRAITEMENT ─────────────────────────────────────────────────────
  //
  // ⚠ IL ARRIVE APRÈS L'ÉCRITURE DE LA LIGNE, ET IL NE PEUT PAS LA DÉFAIRE. Un
  // manuel bien rapatrié dont la lecture rate reste un manuel rapatrié : perdre
  // le PDF parce qu'un modèle a répondu de travers serait absurde. Tout échoue
  // en silence ici, et le résultat le DIT — `postes` vaut 0, ce qui est un fait
  // et pas une erreur.
  //
  // ⚠ ET IL N'EST PAS RÉSERVÉ SÉPARÉMENT. `reserver_manuel` a déjà compté ce
  // tap ; la lecture est le second appel du MÊME geste, pas un geste de plus. Un
  // second jeton ferait payer deux fois ce que le pilote a demandé une fois.
  let postes = 0
  try {
    const { data: lien, error: eLien } = await admin.storage.from('documents')
      .createSignedUrl(chemin, 600)
    // ⚠ L'ERREUR EST LIÉE ET TESTÉE. supabase-js RETOURNE ses erreurs de stockage
    // au lieu de les lever : un try/catch autour ne suffirait pas, et on
    // enverrait `undefined` comme URL au modèle.
    if (eLien || !lien?.signedUrl) throw new Error(eLien?.message ?? 'url non signée')

    const lus = await lireLeManuel(cle, lien.signedUrl, quoi)

    // Les horloges déjà là, pour ne rien écraser de ce que le pilote a posé.
    const { data: deja } = await admin.from('horloge')
      .select('id, operation, barometre, intervalle_roulages')
      .eq('machine_id', m.id)
    const connues = new Map((deja ?? []).map((h) => [aplati(h.operation), h]))
    const maintenant = new Date().toISOString()

    for (const p of lus) {
      const existante = connues.get(aplati(p.operation))
      if (!existante) {
        // ⚠ `intervalle_roulages` RESTE NUL, et c'est FR-44 : sans barème en
        // roulages, l'horloge compte sans jamais échoir. Le texte du manuel
        // vit dans `barometre`, transcrit, jamais converti.
        await admin.from('horloge').insert({
          id: crypto.randomUUID(), pilote_id: pilote, machine_id: m.id,
          operation: p.operation, intervalle_roulages: null,
          barometre: p.periodicite, source_url: cible.href,
          recolte_le: maintenant, extrait_par_ia: true,
        })
        postes++
      } else if (!existante.barometre) {
        // Elle existe — le socle l'a posée, ou le pilote — et elle n'a pas de
        // barème. On ne remplit QUE ce vide : ni son intervalle, ni son point de
        // départ, ni rien de ce qu'il a décidé.
        await admin.from('horloge').update({
          barometre: p.periodicite, source_url: cible.href,
          recolte_le: maintenant, extrait_par_ia: true,
        }).eq('id', existante.id)
        postes++
      }
    }
  } catch (e) {
    // Le manuel est là, c'est l'essentiel. La lecture se rejouera au prochain
    // tap, sur le même geste et sans coût supplémentaire de stockage.
    console.warn('[manuel] traitement non abouti', (e as Error).message)
  }

  return repondre({
    id, nom: `Manuel — ${quoi}`, octets: octets.byteLength,
    // ⚠ CE QUE LA LECTURE A DONNÉ, EN CLAIR. Zéro est un FAIT — le manuel ne
    // porte pas de tableau d'entretien lisible — et pas une erreur : l'écran
    // doit pouvoir le dire sans s'excuser.
    postes,
    // ⚠ LA SOURCE VOYAGE AVEC LE FICHIER, et l'écran doit l'afficher : un
    // document rapatrié qui ne dirait pas d'où il vient serait indistinguable
    // d'un document versé à la main, et c'est la distinction qui compte ici.
    source: cible.href,
    // Ce qui reste voyage avec le résultat, comme pour les portraits : un solde
    // qu'on ne découvre qu'en le heurtant n'est pas un solde, c'est un mur.
    reste,
  })
})
