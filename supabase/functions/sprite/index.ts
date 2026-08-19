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

/** Prix unitaire DÉRIVÉ du relevé de Julian (≈ 16,98 € pour ~107 images), pas
 *  d'un tarif publié. Il est écrit dans la ligne, jamais recalculé à la lecture :
 *  un tarif change, une facture passée ne doit pas changer avec lui. */
const COUT_CENTIMES = 16

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

  // ── Le quota, AVANT tout le reste ────────────────────────────────────────
  const { data: p } = await admin.from('pilote')
    .select('quota_sprites').eq('id', pilote).single()
  const quota = p?.quota_sprites ?? 0
  const { count } = await admin.from('generation')
    .select('id', { count: 'exact', head: true }).eq('pilote_id', pilote)
  const faites = count ?? 0
  if (faites >= quota)
    return repondre({ refus: 'quota', quota, faites, reste: 0 }, 429)

  // ── L'interrupteur : pas de clé, pas de réservation, pas d'appel ─────────
  const cle = Deno.env.get('GEMINI_IMAGE')
  if (!cle) return repondre({ refus: 'cle_absente', quota, faites, reste: quota - faites }, 503)

  let charge: { photo?: string; machineId?: string; piloteEnSelle?: boolean }
  try { charge = await req.json() } catch { return repondre({ refus: 'corps_illisible' }, 400) }
  const b64 = (charge.photo ?? '').replace(/^data:[^,]+,/, '')
  if (!b64) return repondre({ refus: 'sans_photo' }, 400)
  if (b64.length > CHARGE_MAX) return repondre({ refus: 'photo_trop_lourde' }, 413)

  // ── Réserver AVANT d'appeler ────────────────────────────────────────────
  // Deux appuis rapprochés ne peuvent pas payer deux fois pour un seul quota.
  // Et si tout s'arrête entre la réservation et l'appel, la réservation reste :
  // l'erreur penche du côté qui NE dépense pas.
  const { data: reserve, error: eRes } = await admin.from('generation')
    .insert({ pilote_id: pilote, machine_id: charge.machineId ?? null,
      version, modele, cout_centimes: COUT_CENTIMES })
    .select('id').single()
  if (eRes || !reserve) return repondre({ refus: 'reservation', detail: eRes?.message }, 500)

  const annuler = async () => { await admin.from('generation').delete().eq('id', reserve.id) }

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

    await admin.from('generation').update({ etat: 'produite' }).eq('id', reserve.id)
    return repondre({
      image: `data:image/png;base64,${img.inlineData.data}`,
      // La grille voyage AVEC l'image : c'est ce qui interdit à la
      // spritification de travailler sur une autre grille que le prompt.
      grille: GRILLE, entreePx, version, modele,
      reste: quota - faites - 1, quota,
    })
  } catch (e) {
    await annuler()
    return repondre({ refus: 'reseau', detail: (e as Error).message }, 502)
  }
})
