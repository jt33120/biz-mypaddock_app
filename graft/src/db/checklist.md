# src/db/checklist.ts

- Categorie · type · L32-L32 — type Categorie = 'machine' | 'equipement' | 'conformite' | 'preparation' | 'objectif'
- Ligne · type · L34-L48 — type Ligne = { id: string libelle: string categorie: Categorie cochee: number source_url: string | null publie_le: string | null /** Le nom de l'organisateur — ou du circuit à défaut. Nul pour une ligne de * chargement, qui ne vient de personne. */ publie_par: string | null /** ⚠ 1 quand la règle a été RECONSTRUITE par une extraction automatique. Une * extraction n'est pas une transcription, et ce texte-là engage le passage au * contrôle technique — la mention doit atteindre le pilote (QO-6). */ extrait_par_ia: number | null }
- lignes · function · L123-L128 — lignes = (db: PowerSyncDatabase, roulageId: string)
- lignesDuChargement · function · L133-L139 — lignesDuChargement = (db: PowerSyncDatabase, roulageId: string)
- composer · function · L149-L208 — composer = async ( db: PowerSyncDatabase, roulageId: string, ): Promise<number>
- cocher · function · L210-L213 — cocher = async (db: PowerSyncDatabase, id: string, oui: boolean)
- ajouter · function · L215-L228 — ajouter = async ( db: PowerSyncDatabase, roulageId: string, libelle: string, categorie: Categorie, )
- retirer · function · L230-L231 — retirer = (db: PowerSyncDatabase, id: string)
- moisDepuis · function · L237-L242 — moisDepuis = (publieLe: string, jour: string): number
- direLAge · function · L256-L263 — direLAge = (mois: number): string
- direPublication · function · L267-L271 — direPublication = (publieLe: string, par: string | null): string
- verserLesReglesManquantes · function · L293-L338 — verserLesReglesManquantes = async ( db: PowerSyncDatabase, roulageId: string, ): Promise<number>
- Rattachement · type · L353-L353 — type Rattachement = 'rattache' | 'non_rattache'
- rattachement · function · L355-L363 — rattachement = async ( db: PowerSyncDatabase, roulageId: string, ): Promise<Rattachement>
