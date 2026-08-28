# src/db/abri.ts

- Systeme · type · L26-L26 — type Systeme = 'ios' | 'autre'
- Abri · type · L28-L41 — type Abri = { /** `navigator.storage.persisted()` — la seule chose qui protège vraiment. * Pas l'icône sur l'écran d'accueil : l'exemption liée à l'installation * n'est documentée nulle part, et se fier à elle serait deviner. */ persistant: boolean /** Lancée depuis l'écran d'accueil plutôt que dans un onglet. */ installee: boolean /** Un `beforeinstallprompt` a été retenu et peut encore être présenté. * Chrome et Edge le donnent ; Safari ne l'a jamais implémenté. */ proposable: boolean systeme: Systeme /** Ce que l'écran doit faire : se taire, ou dire. */ menace: boolean }
- surIOS · function · L43-L50 — surIOS = (): boolean
- estInstallee · function · L52-L54 — estInstallee = (): boolean
- Invitation · type · L63-L66 — type Invitation = Event & { prompt: () => Promise<void> userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
- prevenir · function · L69-L69 — prevenir = ()
- lireAbri · function · L84-L100 — lireAbri = async (): Promise<Abri>
- surAbri · function · L104-L109 — surAbri = (relire: () => void): (() => void)
- visible · function · L105-L105 — visible = ()
- Issue · type · L111-L111 — type Issue = 'acceptee' | 'refusee' | 'impossible'
- proposerInstallation · function · L116-L129 — proposerInstallation = async (): Promise<Issue>
- direLAbri · function · L140-L173 — direLAbri = (a: Abri): { titre: string; texte: string; geste: string | null } | null
