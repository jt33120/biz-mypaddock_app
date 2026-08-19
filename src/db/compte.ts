import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

/**
 * LE COMPTE — récit 1.2.
 *
 * Ce que le compte apporte : la saison survit au téléphone. C'est la seule
 * promesse que la base locale ne peut pas tenir seule — une désinstallation est
 * destructrice, et l'OPFS n'est pas un coffre.
 *
 * ⚠ LA RÈGLE QUI GOUVERNE TOUT CE FICHIER : L'APPLICATION NE RÉCLAME JAMAIS UNE
 * CONNEXION QU'ELLE NE PEUT PAS FAIRE. Au paddock il n'y a pas de réseau, et un
 * jeton d'accès Supabase vit une heure. Passé ce délai, hors ligne, `getSession()`
 * échoue à le renouveler — ce qui ressemble, vu de l'écran, à une déconnexion.
 * Ce serait un mensonge : le pilote n'a rien fait, il est juste au fond d'un
 * paddock. On tient donc DEUX choses distinctes :
 *
 *   · L'IDENTITÉ — qui est le pilote. Écrite ici, survit hors ligne, ne dépend
 *     d'aucun réseau. C'est elle que l'interface affiche.
 *   · LE JETON — le droit de parler au serveur maintenant. Volatile par nature.
 *     C'est lui, et lui seul, dont dépend la synchronisation.
 *
 * Perdre le jeton suspend la sauvegarde. Ça ne déconnecte personne.
 */

export type Identite = { id: string; email: string | null }

/** Ce n'est PAS un jeton — juste de quoi dire au pilote de qui est cette saison.
 *  Aucune donnée métier en localStorage (contrainte permanente) ; une identité
 *  n'en est pas, et elle doit précisément survivre à l'absence de réseau. */
const CLE = 'mypaddock.identite'

export const identite = (): Identite | null => {
  try {
    const brut = localStorage.getItem(CLE)
    return brut ? (JSON.parse(brut) as Identite) : null
  } catch {
    return null
  }
}

const retenir = (s: Session | null) => {
  if (!s?.user) return
  const i: Identite = { id: s.user.id, email: s.user.email ?? null }
  try { localStorage.setItem(CLE, JSON.stringify(i)) } catch { /* quota : tant pis */ }
}

const oublier = () => { try { localStorage.removeItem(CLE) } catch { /* rien à faire */ } }

/** L'identité courante, et ses changements. Émet immédiatement l'état connu —
 *  y compris hors ligne, où il n'y a rien à demander à personne. */
export const surCompte = (cb: (i: Identite | null) => void): (() => void) => {
  cb(identite())
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((evenement, session) => {
    if (session) retenir(session)
    // Seule une déconnexion EXPLICITE efface l'identité. Un échec de
    // renouvellement n'en est pas une : il n'efface rien.
    if (evenement === 'SIGNED_OUT') oublier()
    cb(identite())
  })
  return () => data.subscription.unsubscribe()
}

/**
 * Le jeton d'accès, ou `null` s'il n'y a pas de compte.
 *
 * LÈVE une erreur si le réseau empêche de conclure — la distinction est exigée
 * par PowerSync, qui doit réessayer sur une panne et se taire sur une absence.
 * Confondre les deux ferait déconnecter un pilote qui traverse un tunnel.
 */
export const jeton = async (): Promise<string | null> => {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session?.access_token ?? null
}

export type Issue =
  | { etat: 'connecte' }
  | { etat: 'confirmation'; email: string }
  | { etat: 'refus'; message: string }

const refus = (m: string): Issue => ({ etat: 'refus', message: m })

const SANS_SUPABASE = refus("Le compte n'est pas configuré dans cette version.")

export const sInscrire = async (email: string, motDePasse: string): Promise<Issue> => {
  if (!supabase) return SANS_SUPABASE
  const { data, error } = await supabase.auth.signUp({ email, password: motDePasse })
  if (error) return refus(traduire(error.message))
  if (data.session) { retenir(data.session); return { etat: 'connecte' } }
  // Pas de session : le projet exige une confirmation d'adresse.
  return { etat: 'confirmation', email }
}

export const seConnecter = async (email: string, motDePasse: string): Promise<Issue> => {
  if (!supabase) return SANS_SUPABASE
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: motDePasse })
  if (error) return refus(traduire(error.message))
  retenir(data.session)
  return { etat: 'connecte' }
}

/**
 * Confirmation PAR CODE, et c'est un choix de fond pour une application installée.
 *
 * Un lien de confirmation s'ouvre dans Safari, pas dans l'application posée sur
 * l'écran d'accueil : les deux ne partagent pas leur stockage. Le lien
 * authentifierait donc le navigateur et laisserait l'application dehors. Un code
 * saisi ICI ouvre la session LÀ OÙ ELLE SERT.
 *
 * Le gabarit d'e-mail doit porter `{{ .Token }}` pour qu'un code parte. S'il n'y
 * a qu'un lien, le repli reste vrai : confirmer dans Safari, puis se connecter
 * ici par mot de passe.
 */
export const confirmerParCode = async (email: string, code: string): Promise<Issue> => {
  if (!supabase) return SANS_SUPABASE
  const { data, error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'signup' })
  if (error) return refus(traduire(error.message))
  retenir(data.session)
  return { etat: 'connecte' }
}

export const seDeconnecter = async () => {
  oublier()
  // `local` et non `global` : déconnecter cet appareil ne doit pas déconnecter
  // le téléphone resté au camion. Et hors ligne, l'échec réseau ne doit pas
  // empêcher l'oubli local, qui a déjà eu lieu.
  try { await supabase?.auth.signOut({ scope: 'local' }) } catch { /* déjà oublié */ }
}

/** Les messages de Supabase sont en anglais et parfois techniques. Ceux qu'un
 *  pilote peut réellement rencontrer sont dits en clair ; les autres passent
 *  tels quels plutôt que d'être noyés dans un « une erreur est survenue ». */
const traduire = (m: string): string => {
  const t = m.toLowerCase()
  if (t.includes('invalid login credentials')) return 'Adresse ou mot de passe incorrect.'
  if (t.includes('email not confirmed')) return "Adresse pas encore confirmée — regarde ta boîte mail."
  if (t.includes('user already registered')) return 'Cette adresse a déjà un compte. Connecte-toi.'
  if (t.includes('password should be at least')) return 'Mot de passe trop court : 6 caractères au minimum.'
  if (t.includes('token has expired') || t.includes('invalid otp')) return 'Code expiré ou incorrect.'
  if (t.includes('rate limit') || t.includes('too many')) return "Trop d'essais d'affilée. Attends une minute."
  if (t.includes('failed to fetch') || t.includes('network')) return 'Pas de réseau — le compte se créera au retour.'
  return m
}
