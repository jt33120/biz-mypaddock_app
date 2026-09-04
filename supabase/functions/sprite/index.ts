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
import * as moto from './v6.ts'
import * as tenue from './tenue.ts'

/* ⚠ LE SUJET DÉCIDE DU PROMPT, ET C'EST LE SERVEUR QUI TRANCHE.
 *
 * Avant, un seul prompt partait : celui de la MOTO. Un casque envoyé depuis
 * l'écran d'équipement recevait donc littéralement « c'est CETTE moto, pas une
 * moto » et « l'angle est un PROFIL STRICT » — et l'appel était payé quand même.
 *
 * `'machine'` est le DÉFAUT en l'absence de champ, et ce n'est pas de la
 * complaisance : une version de l'application déjà installée continue d'envoyer
 * un corps sans `sujet`, et elle n'envoie que des motos. Sans ce défaut, la
 * fonction refuserait les clients déjà déployés le jour de son redéploiement.
 *
 * Un sujet INCONNU est refusé, jamais replié sur un défaut : se replier ferait
 * dessiner une moto à la place d'une combinaison, et l'appel serait facturé. Le
 * refus part AVANT la réservation — donc sans consommer de créneau de quota — et
 * a fortiori avant le moindre octet envoyé au modèle. */
const SUJETS = ['machine', 'casque', 'combinaison'] as const
type SujetDemande = typeof SUJETS[number]

/* Le prix unitaire et le plafond global vivent EN BASE (table `plafond`), pas
   ici : `reserver_generation` les lit, les applique et écrit le coût dans la
   ligne. Une constante compilée exigerait un redéploiement pour bouger, et
   surtout elle serait lue au mauvais endroit — le seul qui doive connaître le
   prix est celui qui décide s'il y a de la place pour lui. */

/** Une photo réduite à 1024 px tient largement là-dedans. Au-delà, ce n'est pas
 *  une photo de moto — et les jetons d'image se paient. */
const CHARGE_MAX = 3_000_000

/** Ce qu'on laisse au modèle avant de renoncer. Il tient SOUS la limite de temps
 *  de mur du runtime — 150 s, relevée trois fois dans les journaux au moment du
 *  `shutdown` — parce qu'une fonction tuée ne rend pas son créneau de quota. */
const MODELE_MAX_MS = 100_000

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
  //
  // ⚠ CETTE BRANCHE A PENDU 150 SECONDES PENDANT DEUX SEMAINES, ET C'EST ELLE
  // QUI A RENDU LA PANNE INDIAGNOSTICABLE. Elle décorait son refus de deux
  // nombres — le quota du pilote et ce qui lui reste — lus en deux allers-retours
  // PostgREST. Le second était un `count: 'exact', head: true`, donc une requête
  // HEAD. Relevé trois fois dans les journaux (2 sept. 06:36, 3 sept. 05:06 et
  // 05:34), toujours la même forme :
  //
  //     booted (30 ms)
  //     GET  /auth/v1/user                        200
  //     GET  /rest/v1/pilote?select=quota_sprites 200   ← résolu : la suivante part
  //     HEAD /rest/v1/generation?select=id        200   ← la passerelle répond…
  //     … 150 s de silence …                            ← … mais la promesse, jamais
  //     shutdown                                        ← le runtime tue la fonction
  //
  // La passerelle journalise un 200 pour ce HEAD : la réponse EST partie. C'est
  // la promesse de `fetch` qui ne se règle jamais côté Deno — une réponse HEAD
  // n'a pas de corps, et le client en attend un. Le pilote, lui, voyait Safari
  // abandonner à 60 s avec « Load failed », donc « le serveur est resté
  // injoignable » : le message le plus faux possible, puisque le serveur avait
  // répondu deux fois en 500 ms.
  //
  // ⚠ LE CORRECTIF N'EST PAS DE REMPLACER LE HEAD PAR UN GET. C'est de ne rien
  // lire du tout. Cette branche est celle qui répond quand RIEN n'est configuré :
  // c'est le chemin le plus dégradé de la fonction, et il doit être le moins
  // cher et le plus sûr, pas celui qui fait deux appels authentifiés pour orner
  // un refus. Les deux nombres n'avaient d'ailleurs aucun lecteur : le client
  // rend `issue.message` et rien d'autre sur un échec (`Garage.tsx`,
  // `Budget.tsx`), et ce qu'un compte a en réserve, il le lit désormais tout
  // seul auprès de `mon_solde()` — le compteur en haut à gauche vient de là.
  // Zéro `await` entre le jeton et la réponse : plus rien ne PEUT y pendre.
  const cle = Deno.env.get('GEMINI_IMAGE')
  if (!cle) return repondre({ refus: 'cle_absente' }, 503)

  let charge: {
    photo?: string; machineId?: string; piloteEnSelle?: boolean
    sujet?: string; mime?: string
  }
  try { charge = await req.json() } catch { return repondre({ refus: 'corps_illisible' }, 400) }
  const b64 = (charge.photo ?? '').replace(/^data:[^,]+,/, '')
  if (!b64) return repondre({ refus: 'sans_photo' }, 400)
  if (b64.length > CHARGE_MAX) return repondre({ refus: 'photo_trop_lourde' }, 413)

  /* ⚠ LE TYPE DE L'IMAGE ÉTAIT ÉCRIT EN DUR À `image/jpeg`, ET LA PHOTO N'EN A
     JAMAIS ÉTÉ UNE. `reduire()` réencode en WebP (`c.toBlob(r, 'image/webp',
     0.82)`, src/db/photos.ts) et vérifie même le type obtenu après coup, parce
     que le format demandé peut être ignoré en silence. Il partait donc du WebP
     étiqueté JPEG, et le modèle décidait quoi en faire.

     ⚠ ET CE DÉFAUT N'A JAMAIS PU SE MONTRER, CE QUI EST PRÉCISÉMENT LE DANGER.
     La clé n'a jamais été posée : aucun appel n'est allé jusqu'au modèle depuis
     que la spritification existe. Le jour où la fabrique s'ouvre, c'est le
     PREMIER appel qui l'aurait découvert — et il aurait été payé.

     L'étiquette voyage donc avec l'image, et elle est confrontée à une liste
     close : un client peut mentir, et `inlineData.mimeType` part chez un tiers.
     Le repli reste `image/jpeg` — les clients déjà installés n'envoient pas ce
     champ, et eux envoient bien du JPEG. */
  const MIMES = ['image/webp', 'image/png', 'image/jpeg'] as const
  const mime = (MIMES as readonly string[]).includes(charge.mime ?? '')
    ? charge.mime! : 'image/jpeg'

  // ── LE SUJET, LU AVANT TOUTE DÉPENSE ────────────────────────────────────
  const demande = charge.sujet ?? 'machine'
  if (!(SUJETS as readonly string[]).includes(demande)) {
    return repondre({ refus: 'sujet_inconnu', sujet: String(demande).slice(0, 40) }, 400)
  }
  const sujet = demande as SujetDemande
  // La fabrique tout entière — prompt, grille, version, modèle — vient d'un
  // seul module. Prendre la grille d'un module et le prompt de l'autre ferait
  // spritifier sur une grille que le modèle n'a jamais reçue.
  const fabrique = sujet === 'machine' ? moto : tenue
  const consigne = sujet === 'machine'
    ? moto.prompt({ pilote_present: charge.piloteEnSelle === true })
    : tenue.prompt(sujet)

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
      `https://generativelanguage.googleapis.com/v1beta/models/${fabrique.modele}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cle },
        // ⚠ BORNÉ DANS LE TEMPS, ET LA BORNE EST SOUS CELLE DU RUNTIME. Sans
        // elle, un modèle qui traîne fait tuer la fonction par sa limite de
        // temps de mur (150 s, mesurée) : la réservation reste alors en base,
        // `annuler()` n'est jamais atteint, et le pilote a payé un créneau pour
        // un silence. Avec elle, l'abandon passe par le `catch` — donc par
        // `annuler()` — et le créneau revient. C'est la même leçon que la
        // branche `cle_absente` ci-dessus : ce qui n'a pas de borne finit par
        // pendre, et ce qui pend ici se paie.
        signal: AbortSignal.timeout(MODELE_MAX_MS),
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [
            { text: consigne },
            { inlineData: { mimeType: mime, data: b64 } },
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
      // spritification de travailler sur une autre grille que le prompt. Elle
      // vient du module CHOISI — les deux prompts n'ont aucune obligation de
      // partager leur grille, même s'ils le font aujourd'hui.
      grille: fabrique.GRILLE, entreePx: fabrique.entreePx,
      version: fabrique.version, modele: fabrique.modele, sujet,
      reste: reserve.reste, quota: reserve.quota,
    })
  } catch (e) {
    await annuler()
    // Un abandon sur la borne ci-dessus se NOMME. « reseau » ferait dire au
    // pilote « le serveur est resté injoignable » alors qu'il vient de répondre.
    const lent = (e as Error).name === 'TimeoutError'
    return repondre({
      refus: lent ? 'modele_lent' : 'reseau', detail: (e as Error).message,
    }, 504)
  }
})
