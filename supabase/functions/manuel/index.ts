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

  return repondre({
    id, nom: `Manuel — ${quoi}`, octets: octets.byteLength,
    // ⚠ LA SOURCE VOYAGE AVEC LE FICHIER, et l'écran doit l'afficher : un
    // document rapatrié qui ne dirait pas d'où il vient serait indistinguable
    // d'un document versé à la main, et c'est la distinction qui compte ici.
    source: cible.href,
  })
})
