# src/db/chiffres.ts

- Cle · type · L26-L28 — type Cle = | 'roulages' | 'circuits' | 'meilleur' | 'sessions' | 'tours' | 'depense_saison' | 'machines' | 'interventions'
- Chiffre · type · L30-L30 — type Chiffre = { cle: Cle; etiquette: string; valeur: string }
- Valeur · type · L44-L44 — type Valeur = { valeur: string; ou?: string }
- chiffresChoisis · function · L72-L81 — chiffresChoisis = (): Cle[]
- poserChiffres · function · L83-L86 — poserChiffres = (l: Cle[])
- valeurs · function · L95-L147 — valeurs = async ( db: PowerSyncDatabase, jour = aujourdhui(), ): Promise<Record<Cle, Valeur>>
- n · function · L129-L129 — n = (v: number | null): Valeur
