# src/db/mesures.ts

- instantDeLId · function · L42-L46 — instantDeLId = (id: string): number
- Delai · type · L48-L48 — type Delai = { roulages: number; medianeH: number | null; maxH: number | null; seuilFranchi: boolean }
- delaiSaisie · function · L55-L83 — delaiSaisie = async ( db: PowerSyncDatabase, jour = aujourdhui(), ): Promise<Delai>
- Genre · type · L87-L87 — type Genre = 'ouverture' | 'recap_genere' | 'recap_poste'
- mesuresAcceptees · function · L94-L96 — mesuresAcceptees = (): boolean
- accepterMesures · function · L98-L100 — accepterMesures = (oui: boolean)
- ecrire · function · L107-L116 — ecrire = async (db: PowerSyncDatabase, genre: Genre, valeur = 0)
- ouverture · function · L128-L131 — ouverture = async (db: PowerSyncDatabase)
- marquerSaisie · function · L137-L147 — marquerSaisie = async (db: PowerSyncDatabase)
- recapGenere · function · L151-L151 — recapGenere = (db: PowerSyncDatabase)
- recapPoste · function · L152-L152 — recapPoste = (db: PowerSyncDatabase)
- Tableau · type · L156-L162 — type Tableau = { delai: Delai ouvertures: number ouverturesSansSaisie: number recapsGeneres: number recapsPostes: number }
- tableauDeBord · function · L164-L176 — tableauDeBord = async (db: PowerSyncDatabase): Promise<Tableau>
- de · function · L167-L167 — de = (g: Genre)
