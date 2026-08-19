/**
 * L'EFFACEMENT DU COMPTE — NFR-6, FR-27. Le jumeau de l'emport, et son ordre
 * inverse : l'emport rend la saison au pilote, celui-ci la retire au produit.
 *
 * Elle vit sur le serveur parce qu'elle ne peut pas vivre ailleurs :
 * `auth.admin.deleteUser` exige la clé de service, qui ne peut pas exister dans
 * un paquet servi au navigateur (AD-15).
 *
 * TROIS CHOSES DISPARAISSENT, et l'ordre compte :
 *   ① LES OBJETS DE STOCKAGE d'abord. Ils ne sont rattachés à `auth.users` par
 *     AUCUNE clé étrangère — la cascade ne les touche pas. Les effacer après la
 *     suppression du compte serait impossible : plus personne pour les désigner.
 *   ② LE COMPTE ensuite. Sa suppression cascade jusqu'au bout : `pilote` pointe
 *     `auth.users(id) on delete cascade`, et tout le reste pointe `pilote`.
 *   ③ LE LOCAL enfin, et côté application seulement — après confirmation. Un
 *     effacement local avant la confirmation serveur perdrait la saison du
 *     pilote tout en lui laissant son compte : le pire des deux mondes.
 *
 * Elle est DÉLIBÉRÉMENT SANS FILET côté serveur : pas de corbeille, pas de délai
 * de grâce, pas de récupération. Un effacement qu'on peut annuler n'est pas un
 * effacement, et le pilote a l'emport pour garder ce qu'il veut garder.
 *
 * `verify_jwt` est à faux au niveau de la plateforme et l'authentification est
 * faite ici : la porte de plateforme rejette avec un corps opaque, là où le
 * produit doit dire au pilote ce qui s'est passé. Aucun chemin n'efface quoi que
 * ce soit sans un jeton vérifié.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2'

const SEAU = 'photos'

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

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } })

  const { data: u, error: eAuth } = await admin.auth.getUser(jwt)
  if (eAuth || !u.user) return repondre({ refus: 'sans_compte' }, 401)
  const pilote = u.user.id

  // ── ① Les objets. Deux niveaux : <pilote>/<roulage|machine>/<fichier>.
  //    `list` ne descend pas tout seul, et un objet oublié est une photo qui
  //    survit à son propriétaire — exactement ce que l'effacement doit exclure.
  let objets = 0
  try {
    const { data: dossiers } = await admin.storage.from(SEAU).list(pilote, { limit: 1000 })
    const chemins: string[] = []
    for (const d of dossiers ?? []) {
      if (d.id) { chemins.push(`${pilote}/${d.name}`); continue }   // un fichier à la racine
      const { data: fichiers } = await admin.storage.from(SEAU)
        .list(`${pilote}/${d.name}`, { limit: 1000 })
      for (const f of fichiers ?? []) chemins.push(`${pilote}/${d.name}/${f.name}`)
    }
    if (chemins.length) {
      const { data: partis } = await admin.storage.from(SEAU).remove(chemins)
      objets = partis?.length ?? 0
    }
  } catch (e) {
    // On NE poursuit PAS : supprimer le compte en laissant ses photos derrière
    // ferait mentir la promesse, et plus rien ne permettrait de les retrouver.
    return repondre({ refus: 'stockage', detail: (e as Error).message }, 502)
  }

  // ── ② Le compte, et la cascade avec lui.
  const { error: eSup } = await admin.auth.admin.deleteUser(pilote)
  if (eSup) return repondre({ refus: 'compte', detail: eSup.message, objets }, 502)

  return repondre({ efface: true, objets })
})
