# src/db/atelier.ts

- Categorie · type · L21-L21 — type Categorie = 'entretien' | 'amelioration' | 'reparation_non_vitale'
- Etat · type · L22-L22 — type Etat = 'visee' | 'faite'
- estCategorieIntervention · function · L32-L34 — estCategorieIntervention = (valeur: unknown): valeur is Categorie
- Intervention · type · L36-L49 — type Intervention = { id: string machine_id: string chute_id: string | null categorie: Categorie etat: Etat libelle: string /** Nulle tant que l'acte est VISÉ — une intervention visée n'a pas de date, * c'est exactement ce qui la définit (FR-45, FR-48). */ date_jour: string | null cout_centimes: number | null depense_id: string | null photo_id: string | null }
- interventions · function · L96-L103 — interventions = ( db: PowerSyncDatabase, machineId: string, categorie: Categorie, )
- cequiAttend · function · L108-L114 — cequiAttend = async ( db: PowerSyncDatabase, ): Promise<{ categorie: Categorie; n: number; dernier: string }[]>
- consigner · function · L123-L141 — consigner = async ( db: PowerSyncDatabase, i: { machineId: string; categorie: Categorie; libelle: string; date: string centimes?: number | null; depenseId?: string | null; photoId?: string | null chuteId?: string | null }, )
- viser · function · L149-L167 — viser = async ( db: PowerSyncDatabase, i: { machineId: string; categorie: Categorie; libelle: string centimes?: number | null; depenseId?: string | null; photoId?: string | null chuteId?: string | null }, )
- cestFait · function · L172-L178 — cestFait = async (db: PowerSyncDatabase, id: string, jour: string)
- faireRepartirLHorloge · function · L196-L208 — faireRepartirLHorloge = async (db: PowerSyncDatabase, interventionId: string)
- coutAtelier · function · L212-L219 — coutAtelier = async ( db: PowerSyncDatabase, machineId: string, categorie: Categorie, )
- Evenement · type · L223-L230 — type Evenement = { id: string libelle: string /** APPROXIMATIVE, et nullable. « Le Bol d'Or, juin » est une réponse * complète — exiger un jour précis transformerait un désir en engagement. */ date_approx: string | null cout_estime_centimes: number | null }
- evenements · function · L232-L235 — evenements = (db: PowerSyncDatabase)
- viserEvenement · function · L237-L247 — viserEvenement = async ( db: PowerSyncDatabase, e: { libelle: string; date?: string | null; centimes?: number | null }, )
- oublierEvenement · function · L249-L251 — oublierEvenement = async (db: PowerSyncDatabase, id: string)
