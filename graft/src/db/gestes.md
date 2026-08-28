# src/db/gestes.ts

- Cap · type · L20-L20 — type Cap = { code: string; libelle: string; categorie: 'bravoure' | 'discipline' }
- Geste · type · L21-L21 — type Geste = { id: string; roulage_id: string; cap_code: string }
- listerCaps · function · L23-L31 — listerCaps = async (db: PowerSyncDatabase): Promise<Cap[]>
- gestesDuRoulage · function · L33-L35 — gestesDuRoulage = (db: PowerSyncDatabase, roulageId: string)
- declarerGeste · function · L37-L52 — declarerGeste = async ( db: PowerSyncDatabase, roulageId: string, capCode: string, )
- partageableAutomatiquement · function · L61-L62 — partageableAutomatiquement = (cap: Cap): boolean
