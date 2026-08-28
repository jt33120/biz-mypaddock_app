# src/db/documents.ts

- Genre · type · L28-L28 — type Genre = 'manuel' | 'carte_grise' | 'assurance' | 'facture' | 'autre'
- Document · type · L38-L51 — type Document = { id: string /** D'OÙ VIENT LE FICHIER quand il n'a pas été versé à la main. Nul pour un * document versé par le pilote — et c'est cette distinction qui doit rester * lisible à l'écran : un document rapatrié qui ne dirait pas sa provenance * serait indistinguable d'un document qu'on a soi-même choisi. */ source_url?: string | null machine_id: string nom: string genre: Genre chemin_objet: string octets: number | null type_mime: string | null }
- nomLocalDocument · function · L56-L56 — nomLocalDocument = (id: string, ext: string)
- extensionDe · function · L58-L61 — extensionDe = (f: File)
- verserDocument · function · L67-L93 — verserDocument = async ( db: PowerSyncDatabase, d: { machineId: string; genre: Genre; nom?: string }, fichier: File, ): Promise<Document | { refus: string }>
- documentsDeLaMachine · function · L95-L98 — documentsDeLaMachine = (db: PowerSyncDatabase, machineId: string)
- IssueManuel · type · L115-L123 — type IssueManuel = /** ⚠ `postes` EST LE CHAÎNON QUE JULIAN A NOMMÉ — « recherche et import * automatique ET TRAITEMENT et tout ». Le manuel était rapatrié et personne * ne le LISAIT : aucun intervalle n'en sortait, aucune horloge ne s'en * remplissait. C'est le nombre de postes d'entretien que le serveur a * RÉELLEMENT tirés du document, et zéro est un FAIT — le PDF ne porte pas de * tableau lisible — jamais une erreur. */ | { ok: true; nom: string; octets: number; source: string; postes: number } | { ok: false; message: string }
- rapatrierLeManuel · function · L137-L164 — rapatrierLeManuel = async (machineId: string): Promise<IssueManuel>
- ouvrirDocument · function · L168-L179 — ouvrirDocument = async (d: Document): Promise<File | null>
- oublierDocument · function · L181-L185 — oublierDocument = async (db: PowerSyncDatabase, d: Document)
- televerserDocuments · function · L196-L216 — televerserDocuments = async ( db: PowerSyncDatabase, piloteId: string, ): Promise<number>
- formaterOctets · function · L219-L224 — formaterOctets = (n: number | null): string
