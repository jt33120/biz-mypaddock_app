# src/db/chute.ts

- StatutCrash · type · L34-L34 — type StatutCrash = 'a_renseigner' | 'aucun' | 'documente'
- Chute · type · L36-L43 — type Chute = { id: string roulage_id: string /** « virage 3 », « l'épingle », « la ligne droite ». Ce que le pilote dit, * jamais une coordonnée : le téléphone n'est pas en piste (AD-3). */ endroit: string | null recit: string | null }
- chutesDuRoulage · function · L47-L50 — chutesDuRoulage = (db: PowerSyncDatabase, roulageId: string)
- statutCrashDuRoulage · function · L53-L61 — statutCrashDuRoulage = async ( db: PowerSyncDatabase, roulageId: string, ): Promise<StatutCrash>
- declarerAucunCrash · function · L65-L79 — declarerAucunCrash = async ( db: PowerSyncDatabase, roulageId: string, ): Promise<void>
- reinitialiserStatutCrash · function · L83-L97 — reinitialiserStatutCrash = async ( db: PowerSyncDatabase, roulageId: string, ): Promise<void>
- consignerChute · function · L105-L122 — consignerChute = async ( db: PowerSyncDatabase, c: { roulageId: string; endroit?: string | null; recit?: string | null }, )
- completerChute · function · L126-L135 — completerChute = async ( db: PowerSyncDatabase, id: string, c: { endroit?: string | null; recit?: string | null }, )
- oublierChute · function · L145-L161 — oublierChute = async (db: PowerSyncDatabase, id: string)
- ReparationDeChute · type · L163-L168 — type ReparationDeChute = { id: string libelle: string date_jour: string cout_centimes: number | null }
- reparationsDeLaChute · function · L173-L179 — reparationsDeLaChute = ( db: PowerSyncDatabase, chuteId: string, )
- consignerReparationDeChute · function · L191-L234 — consignerReparationDeChute = async ( db: PowerSyncDatabase, r: { chuteId: string; machineId: string; categorie: Categorie libelle: string; date: string; centimes: number }, ): Promise<{ interventionId: string; depenseId: string }>
- coutDeLaChute · function · L245-L250 — coutDeLaChute = async (db: PowerSyncDatabase, chuteId: string)
