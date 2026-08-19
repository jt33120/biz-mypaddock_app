/**
 * LE SERVICE DE RÉCOLTE — épique 16.
 *
 * Il tourne HORS DU TEMPS DE L'UTILISATEUR, sur Railway, et il écrit le
 * référentiel : barèmes constructeur, calendriers d'organisateurs, règles
 * publiées. Aucune API n'existe côté sources — calendrier-piste.fr agrège en
 * HTML sans iCal ni RSS — donc l'extraction est assistée par IA.
 *
 * ⚠ ET C'EST LE SEUL ENDROIT DU PRODUIT OÙ UNE ERREUR TOUCHE LA SÉCURITÉ D'UNE
 * MACHINE. Une extraction par IA n'est pas une transcription, c'est une
 * RECONSTRUCTION. Quatre garde-fous en découlent, et aucun n'est négociable :
 *
 *   ① TOUTE ligne écrite porte sa source, sa date de récolte et la mention
 *     explicite qu'elle a été extraite automatiquement. Sans les trois, elle
 *     n'est pas écrite du tout.
 *   ② LA CORRECTION DU PILOTE PRIME. Une ligne marquée `corrige_par_pilote`
 *     n'est JAMAIS réécrite. Une récolte qui écrase une correction ferait de
 *     la reconstruction une autorité, ce qu'elle n'est pas.
 *   ③ LES SOURCES SONT DE LA DONNÉE. On en ajoute une sans redéployer, on en
 *     désactive une qui casse sans toucher au reste.
 *   ④ INTERRUPTEUR. Sans `MISTRAL_API_KEY`, le service REFUSE avant d'avoir
 *     rien récupéré et rien appelé. Il peut donc être déployé sans qu'un seul
 *     euro puisse partir, et le premier exige un geste humain.
 *
 * Et un cinquième, de discipline : il n'écrit JAMAIS dans les tables de pilote.
 * Le rôle `recolte` n'en a pas le droit (AD-12), mais le service ne le tente
 * même pas — un garde-fou qu'on n'éprouve jamais finit par ne plus exister.
 */
import { createClient } from '@supabase/supabase-js'

const CONF = {
  supabaseUrl: process.env.SUPABASE_URL,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  mistral: process.env.MISTRAL_API_KEY,
  modele: process.env.MISTRAL_MODELE ?? 'mistral-small-latest',
  /** Plafond d'appels par tour. Une boucle qui dérive ne peut pas le franchir,
   *  et c'est la leçon du 19 août : le vrai danger n'était pas le prix
   *  unitaire, c'était qu'une dépense ait lieu sans être visible. */
  plafondAppels: Number(process.env.RECOLTE_PLAFOND ?? 20),
  /** ⚠ LE JETON DE DÉCLENCHEMENT. Sans lui, `/recolter` était un POST PUBLIC
   *  sur une URL Railway : n'importe qui la trouvant pouvait lancer un tour de
   *  récolte, donc dépenser des jetons Mistral, autant de fois qu'il voulait.
   *
   *  Le défaut était invisible tant que `MISTRAL_API_KEY` manquait — la
   *  fonction refusait avant tout appel. C'est précisément ce qui le rendait
   *  dangereux : il ne se serait révélé qu'au moment où Julian pose la clé,
   *  c'est-à-dire au moment exact où il commence à coûter.
   *
   *  Il ÉCHOUE FERMÉ : jeton absent = tout déclenchement refusé. Un secret dont
   *  l'absence ouvre la porte n'est pas un secret. */
  jeton: process.env.RECOLTE_JETON,
}

const journal = (...m) => console.log(new Date().toISOString(), ...m)

/** L'interrupteur, et il passe AVANT tout le reste. */
export const pretARecolter = () => {
  if (!CONF.supabaseUrl || !CONF.serviceKey) return 'base non configurée'
  if (!CONF.mistral) return 'MISTRAL_API_KEY absente — aucune extraction possible'
  if (!CONF.jeton) return 'RECOLTE_JETON absent — aucun déclenchement autorisé'
  return null
}

/**
 * Le porteur du jeton, comparé EN TEMPS CONSTANT.
 *
 * Une comparaison `===` sur des chaînes s'arrête au premier caractère qui
 * diffère : le temps de réponse fuit alors la longueur du préfixe correct, et
 * un jeton se devine caractère par caractère. Le surcoût d'un XOR complet est
 * nul à cette échelle ; l'économiser serait une économie contre soi.
 */
const jetonValide = (entete) => {
  if (!CONF.jeton) return false
  const donne = (entete ?? '').replace(/^Bearer /, '')
  if (donne.length !== CONF.jeton.length) return false
  let diff = 0
  for (let i = 0; i < donne.length; i++) diff |= donne.charCodeAt(i) ^ CONF.jeton.charCodeAt(i)
  return diff === 0
}

const SCHEMA_BAREME = `Rends UNIQUEMENT un tableau JSON, sans texte autour, de la forme :
[{"marque":"Honda","modele":"CBR 1000 RR","annee_debut":2008,"annee_fin":2016,
  "operation":"Vidange moteur","intervalle_km":6000,"intervalle_mois":12}]
Règles STRICTES :
- Tu TRANSCRIS ce que la page dit. Tu n'interprètes pas, tu ne complètes pas, tu ne déduis pas.
- Un champ que la page ne donne pas est null. N'invente JAMAIS un intervalle.
- Si la page ne contient aucun barème d'entretien, rends [].`

const SCHEMA_CALENDRIER = `Rends UNIQUEMENT un tableau JSON, sans texte autour, de la forme :
[{"circuit":"Pau-Arnos","date_jour":"2027-04-18","organisateur":"Nom","prix_centimes":24000,"nb_groupes":4}]
Règles STRICTES :
- Tu TRANSCRIS. Un champ absent de la page est null. N'invente aucune date, aucun prix.
- Les dates sont au format AAAA-MM-JJ. Si l'année n'est pas écrite, rends null.
- Si la page ne contient aucune sortie, rends [].`

/**
 * L'extraction. Température 0, et le prompt exige la transcription — mais la
 * seule garantie réelle est en aval : ce qui sort est écrit AVEC sa provenance,
 * et corrigeable par le pilote dont la correction prime.
 */
const extraire = async (html, schema) => {
  const texte = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 60_000)

  const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${CONF.mistral}` },
    body: JSON.stringify({
      model: CONF.modele,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: schema + '\nEnveloppe le tableau dans {"lignes": [...]}.' },
        { role: 'user', content: texte },
      ],
    }),
  })
  if (!r.ok) throw new Error(`mistral ${r.status} ${(await r.text()).slice(0, 200)}`)
  const rep = await r.json()
  const brut = rep.choices?.[0]?.message?.content ?? '{}'
  const o = JSON.parse(brut)
  return Array.isArray(o.lignes) ? o.lignes : []
}

/**
 * Un tour de récolte. Il rend un compte-rendu, et il n'échoue jamais en
 * silence : une source qui casse enregistre son souci et les autres continuent.
 */
export const recolter = async () => {
  const souci = pretARecolter()
  if (souci) { journal('REFUSÉ —', souci); return { refus: souci } }

  const db = createClient(CONF.supabaseUrl, CONF.serviceKey, { auth: { persistSession: false } })
  const { data: sources, error } = await db.from('source_recolte')
    .select('id, genre, url, libelle').eq('actif', true).limit(CONF.plafondAppels)
  if (error) { journal('sources illisibles :', error.message); return { refus: error.message } }
  if (!sources?.length) { journal('aucune source active'); return { sources: 0 } }

  const bilan = { sources: sources.length, ecrites: 0, ignorees: 0, soucis: [] }

  for (const s of sources) {
    try {
      const page = await fetch(s.url, {
        headers: { 'User-Agent': 'MyPaddock/récolte (contact dans les mentions légales)' },
      })
      if (!page.ok) throw new Error(`http ${page.status}`)
      const lignes = await extraire(await page.text(),
        s.genre === 'bareme' ? SCHEMA_BAREME : SCHEMA_CALENDRIER)

      const provenance = {
        source_url: s.url,
        recolte_le: new Date().toISOString(),
        extrait_par_ia: true,   // ⚠ TOUJOURS vrai ici. Rien d'autre ne s'écrit.
      }

      for (const l of lignes) {
        if (s.genre === 'bareme') {
          // ② La correction du pilote prime : on ne réécrit jamais une ligne
          //    qu'il a corrigée. On vérifie AVANT d'écrire, pas après.
          const { data: deja } = await db.from('bareme').select('id, corrige_par_pilote')
            .eq('marque', l.marque).eq('modele', l.modele).eq('operation', l.operation)
            .maybeSingle()
          if (deja?.corrige_par_pilote) { bilan.ignorees++; continue }
          const ligne = { ...l, ...provenance }
          const { error: e } = deja
            ? await db.from('bareme').update(ligne).eq('id', deja.id)
            : await db.from('bareme').insert(ligne)
          if (e) { bilan.soucis.push(`${s.libelle} : ${e.message}`); continue }
          bilan.ecrites++
        } else {
          // Un roulage publié est un BROUILLON (FR-61) : une sortie annoncée
          // n'est pas un roulage vécu, et ne le devient que confirmée.
          if (!l.circuit || !l.date_jour) { bilan.ignorees++; continue }
          const { data: c } = await db.from('circuit').select('id')
            .ilike('nom', l.circuit).maybeSingle()
          if (!c) { bilan.ignorees++; continue }   // on n'invente pas un circuit
          const { error: e } = await db.from('roulage_publie').insert({
            circuit_id: c.id, date_jour: l.date_jour,
            prix_centimes: l.prix_centimes ?? null, nb_groupes: l.nb_groupes ?? null,
            ...provenance,
          })
          if (e) { bilan.soucis.push(`${s.libelle} : ${e.message}`); continue }
          bilan.ecrites++
        }
      }
      await db.from('source_recolte')
        .update({ derniere_recolte: new Date().toISOString(), dernier_souci: null })
        .eq('id', s.id)
      journal(`${s.libelle} : ${lignes.length} ligne(s)`)
    } catch (e) {
      bilan.soucis.push(`${s.libelle} : ${e.message}`)
      await db.from('source_recolte')
        .update({ dernier_souci: String(e.message).slice(0, 300) }).eq('id', s.id)
      journal(`${s.libelle} : ÉCHEC ${e.message}`)
    }
  }

  journal('bilan', JSON.stringify(bilan))
  return bilan
}

// Un serveur minuscule : Railway a besoin d'un port ouvert, et la récolte se
// déclenche par appel plutôt que par une horloge interne — un service qui
// tourne tout seul est un service dont on ne voit pas la dépense.
if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT ?? 3000)
  const { createServer } = await import('node:http')
  createServer(async (req, res) => {
    // `/sante` reste ouvert : il ne dit QUE si le service est prêt, ne récolte
    // rien, n'appelle rien et ne coûte rien. C'est ce que Railway interroge
    // pour savoir si le conteneur est vivant.
    if (req.url === '/sante') {
      const s = pretARecolter()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ pret: !s, refus: s }))
    }
    if (req.url === '/recolter' && req.method === 'POST') {
      // ⚠ LE JETON EST VÉRIFIÉ AVANT TOUT, y compris avant l'interrupteur de
      // clé. Sans lui, cette route était un POST public sur une URL Railway :
      // quiconque la trouvait pouvait dépenser des jetons Mistral en boucle.
      if (!jetonValide(req.headers.authorization)) {
        journal('déclenchement refusé — jeton absent ou faux')
        res.writeHead(401, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ refus: 'jeton' }))
      }
      const b = await recolter()
      res.writeHead(b.refus ? 503 : 200, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify(b))
    }
    res.writeHead(404); res.end()
  }).listen(port, () => journal(`récolte à l'écoute sur ${port}`))
}
