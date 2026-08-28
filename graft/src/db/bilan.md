# src/db/bilan.ts

- Bilan · type · L25-L43 — type Bilan = { annee: number /** Bornes réelles de la saison : du premier au dernier roulage saisi. * `null` quand l'année n'a aucun roulage — un état valide, pas un trou. */ du: string | null au: string | null roulages: number /** FR-55 — la complétude, dans le même objet que les chiffres qu'elle * qualifie. On ne peut pas afficher l'un sans l'autre. */ sansChrono: number sansGroupe: number sessions: number meilleurMs: number | null circuits: number depenseCentimes: number budgetCentimes: number | null photos: number gestes: number }
- bilanSaison · function · L45-L98 — bilanSaison = async ( db: PowerSyncDatabase, annee: number, jour = aujourdhui(), ): Promise<Bilan>
- anneesSaisies · function · L108-L115 — anneesSaisies = async ( db: PowerSyncDatabase, jour = aujourdhui(), ): Promise<number[]>
- Report · type · L129-L129 — type Report = { depuis: number; centimes: number } | null
- reportPossible · function · L131-L139 — reportPossible = async ( db: PowerSyncDatabase, pour: number, ): Promise<Report>
- reporter · function · L141-L142 — reporter = (db: PowerSyncDatabase, pour: number, centimes: number)
