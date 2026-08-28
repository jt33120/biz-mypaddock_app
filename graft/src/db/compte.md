# src/db/compte.ts

- Identite · type · L26-L26 — type Identite = { id: string; email: string | null }
- identite · function · L33-L40 — identite = (): Identite | null
- retenir · function · L42-L46 — retenir = (s: Session | null)
- oublier · function · L48-L48 — oublier = ()
- surCompte · function · L52-L63 — surCompte = (cb: (i: Identite | null) => void): (() => void)
- jeton · function · L72-L77 — jeton = async (): Promise<string | null>
- Issue · type · L79-L82 — type Issue = | { etat: 'connecte' } | { etat: 'confirmation'; email: string } | { etat: 'refus'; message: string }
- refus · function · L84-L84 — refus = (m: string): Issue
- sInscrire · function · L88-L95 — sInscrire = async (email: string, motDePasse: string): Promise<Issue>
- seConnecter · function · L97-L103 — seConnecter = async (email: string, motDePasse: string): Promise<Issue>
- confirmerParCode · function · L117-L123 — confirmerParCode = async (email: string, code: string): Promise<Issue>
- seDeconnecter · function · L125-L131 — seDeconnecter = async ()
- traduire · function · L136-L146 — traduire = (m: string): string
