/** Synchronous bridge to the tiny pre-React bootstrap (public/splash-cache.js).
 * Its absence or a storage denial only removes optional personalization. */
export type SplashTicket = { owner: string; revision: string }
type SplashRecord = { v: 1; owner: string; id: string; data: string }
interface SplashCache {
  ticket(): SplashTicket | null
  read(): SplashRecord | null
  trusted(id: string, ticket: SplashTicket): boolean
  remember(id: string, ticket: SplashTicket): boolean
  write(id: string, data: string, ticket: SplashTicket): boolean
  clear(): void
  block(): void
  accountChanged(): void
  selected(): string | null
  select(id: string): void
}
declare global { interface Window { mypaddockSplash?: SplashCache } }
export const cacheDeChargement = (): SplashCache | undefined =>
  typeof window === 'undefined' ? undefined : window.mypaddockSplash

export const changerCompteDeChargement = (): void => { cacheDeChargement()?.accountChanged() }
export const bloquerChargementPersonnel = (): void => {
  cacheDeChargement()?.block()
  // This privacy marker must also survive a failed optional bootstrap download.
  // Preview mode does not write to the real account's preferences.
  if (typeof location === 'undefined' || new URLSearchParams(location.search).get('apercu') === 'night') return
  try { localStorage.setItem('mypaddock.splash.blocked', '1') } catch { /* no persistent cache either */ }
}
export const choisirMotoDeChargement = (id: string): void => { cacheDeChargement()?.select(id) }

/** Only call at an actual local creation, with a ticket taken before the write.
 * A generic database read cannot establish ownership after an account switch. */
export const retenirNouvelleMotoDeChargement = (id: string, ticket: SplashTicket | null): void => {
  if (ticket) cacheDeChargement()?.remember(id, ticket)
}
