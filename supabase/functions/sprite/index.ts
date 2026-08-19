/**
 * LA GÉNÉRATION DU PORTRAIT PIXEL — récit 3bis.3, la moitié payante.
 *
 * Elle vit sur le serveur pour trois raisons, et chacune suffirait :
 *
 *   ① LA CLÉ. `GEMINI_IMAGE` ne peut pas exister dans un paquet servi au
 *     navigateur (AD-15). Quiconque ouvre les outils de développement la lirait.
 *   ② LE PROMPT. Un client qui enverrait le sien ferait payer à Julian
 *     n'importe quelle génération d'image. Le prompt part d'ici, jamais d'ailleurs.
 *   ③ LE QUOTA. Un compteur que le compté peut écrire ne compte rien. La table
 *     `generation` n'a aucune politique d'insertion : seule cette fonction y écrit.
 *
 * ⚠ INTERRUPTEUR. Sans le secret `GEMINI_IMAGE`, la fonction REFUSE avant
 * d'avoir rien réservé et rien appelé. C'est délibéré : la fonction peut être
 * déployée sans qu'un seul euro puisse partir, et le premier euro exige un geste
 * que Julian seul peut faire.
 *
 * `verify_jwt` est à FAUX au niveau de la plateforme, et l'authentification est
 * faite ICI, à la main : la porte de plateforme rejette avec un corps opaque,
 * là où le produit doit distinguer « sans compte » de « quota atteint » et le
 * dire au pilote. Aucun chemin ne dépense sans un jeton vérifié.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GRILLE, entreePx, modele, prompt, version } from './v6.ts'

/* Le prix unitaire et le plafond global vivent EN BASE (table `plafond`), pas
   ici : `reserver_generation` les lit, les applique et écrit le coût dans la
   ligne. Une constante compilée exigerait un redéploiement pour bouger, et
   surtout elle serait lue au mauvais endroit — le seul qui doive connaître le
   prix est celui qui décide s'il y a de la place pour lui. */

/** Une photo réduite à 1024 px tient largement là-dedans. Au-delà, ce n'est pas
 *  une photo de moto — et les jetons d'image se paient. */
const CHARGE_MAX = 3_000_000

const entetes = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}
const repondre = (corps: unknown, statut = 200) =>
  new Response(JSON.stringify(corps), { status: statut, headers: entetes })

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

  // ── L'interrupteur : pas de clé, pas de réservation, pas d'appel ─────────
  //    Il passe AVANT la réservation pour ne pas brûler un créneau de quota
  //    quand la fabrique est fermée.
  const cle = Deno.env.get('GEMINI_IMAGE')
  if (!cle) {
    const { data: p } = await admin.from('pilote')
      .select('quota_sprites').eq('id', pilote).single()
    const { count } = await admin.from('generation')
      .select('id', { count: 'exact', head: true }).eq('pilote_id', pilote)
    const quota = p?.quota_sprites ?? 0
    return repondre({ refus: 'cle_absente', quota, reste: Math.max(0, quota - (count ?? 0)) }, 503)
  }

  let charge: { photo?: string; machineId?: string; piloteEnSelle?: boolean }
  try { charge = await req.json() } catch { return repondre({ refus: 'corps_illisible' }, 400) }
  const b64 = (charge.photo ?? '').replace(/^data:[^,]+,/, '')
  if (!b64) return repondre({ refus: 'sans_photo' }, 400)
  if (b64.length > CHARGE_MAX) return repondre({ refus: 'photo_trop_lourde' }, 413)

  // ── RÉSERVER AVANT D'APPELER, ET EN UNE SEULE TRANSACTION ───────────────
  //
  // ⚠ CE FUT LE TROU LE PLUS COÛTEUX DE CETTE FONCTION. Le comptage et
  // l'insertion étaient deux requêtes distinctes : N appels simultanés lisaient
  // tous « 0 fait » et passaient tous. Le quota vérifiait un état déjà périmé
  // au moment où il l'utilisait.
  //
  // Tout est descendu dans `reserver_generation`, sous verrou consultatif :
  // elle compte, teste le quota du pilote, teste le PLAFOND GLOBAL sur 24 h —
  // qui n'existait pas du tout — et insère, atomiquement. Elle est réservée au
  // rôle de service, et le pilote lui est passé après vérification du jeton.
  const { data: res, error: eRes } = await admin
    .rpc('reserver_generation', { p_pilote: pilote, p_machine: charge.machineId ?? null })
  const reserve = Array.isArray(res) ? res[0] : res
  if (eRes || !reserve) {
    // La fonction lève le motif en clair : quota, plafond_global, sans_compte.
    const motif = (eRes?.message ?? '').match(/quota|plafond_global|sans_compte/)?.[0]
    return repondre({ refus: motif ?? 'reservation', detail: eRes?.message },
      motif === 'quota' || motif === 'plafond_global' ? 429 : 500)
  }

  const annuler = async () => {
    await admin.from('generation').delete().eq('id', reserve.reservation)
  }

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modele}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [
            { text: prompt({ pilote_present: charge.piloteEnSelle === true }) },
            { inlineData: { mimeType: 'image/jpeg', data: b64 } },
          ] }],
          // Température 0 : le prompt est le code, il doit se rejouer.
          generationConfig: { temperature: 0, responseModalities: ['IMAGE'] },
        }),
      })
    if (!r.ok) {
      await annuler()
      const t = await r.text()
      return repondre({ refus: 'modele', statut: r.status, detail: t.slice(0, 300) }, 502)
    }
    const rep = await r.json()
    const img = (rep.candidates?.[0]?.content?.parts ?? [])
      .find((x: { inlineData?: unknown }) => x.inlineData)
    if (!img) { await annuler(); return repondre({ refus: 'aucune_image' }, 502) }

    await admin.from('generation').update({ etat: 'produite' }).eq('id', reserve.reservation)
    return repondre({
      image: `data:image/png;base64,${img.inlineData.data}`,
      // La grille voyage AVEC l'image : c'est ce qui interdit à la
      // spritification de travailler sur une autre grille que le prompt.
      grille: GRILLE, entreePx, version, modele,
      reste: reserve.reste, quota: reserve.quota,
    })
  } catch (e) {
    await annuler()
    return repondre({ refus: 'reseau', detail: (e as Error).message }, 502)
  }
})
