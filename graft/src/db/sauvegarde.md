# src/db/sauvegarde.ts

- BilanEnvoi · type · L25-L25 — type BilanEnvoi = Record<string, number>
- Refus · type · L26-L26 — type Refus = { table: string; ligne: string; motif: string }
- Resultat · type · L27-L27 — type Resultat = { bilan: BilanEnvoi; refus: Refus[] }
- nomTable · function · L135-L138 — nomTable = (table: string, n: number): string
- direCombien · function · L141-L142 — direCombien = (table: string, n: number): string
- etatLocal · function · L153-L160 — etatLocal = async (db: PowerSyncDatabase): Promise<BilanEnvoi>
- avecLesDefauts · function · L219-L228 — avecLesDefauts = ( table: string, ligne: Record<string, unknown>, ): Record<string, unknown>
- chargeDe · function · L236-L252 — chargeDe = ( table: string, lignes: Record<string, unknown>[], piloteId: string, ): { charge: Record<string, unknown>[]; differes: { id: string; valeur: unknown }[] }
- envoyer · function · L267-L280 — envoyer = async ( table: string, charge: Record<string, unknown>[], refus: Refus[], ): Promise<number>
- sauvegarder · function · L282-L339 — sauvegarder = async ( db: PowerSyncDatabase, piloteId: string, ): Promise<Resultat>
- ecarterJournal · function · L349-L358 — ecarterJournal = async (db: PowerSyncDatabase): Promise<number>
- estAdopte · function · L369-L371 — estAdopte = (piloteId: string): boolean
- marquerAdopte · function · L373-L375 — marquerAdopte = (piloteId: string)
- premiereSauvegardeDite · function · L392-L394 — premiereSauvegardeDite = (): boolean
- marquerPremiereSauvegardeDite · function · L396-L398 — marquerPremiereSauvegardeDite = (): void
- adopter · function · L410-L419 — adopter = async ( db: PowerSyncDatabase, piloteId: string, ): Promise<{ bilan: BilanEnvoi; refus: Refus[]; ecartes: number }>
